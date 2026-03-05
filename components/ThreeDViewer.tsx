import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { config } from '../services/config';

export interface ThreeDViewerHandle {
    setWireframe: (enabled: boolean) => void;
    setBackground: (color: string) => void;
    resetCamera: () => void;
    rotateModel: (x: number, y: number) => void;
    syncCamera: (position: THREE.Vector3 | {x:number, y:number, z:number}, target: THREE.Vector3 | {x:number, y:number, z:number}) => void;
    getCameraState: () => { position: THREE.Vector3, target: THREE.Vector3 } | null;
}

interface ThreeDViewerProps {
    modelUrl: string;
    className?: string;
    onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

const ThreeDViewer = forwardRef<ThreeDViewerHandle, ThreeDViewerProps>(({ modelUrl, className = '', onCameraChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);
    const isSyncingRef = useRef<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        setWireframe: (enabled: boolean) => {
            if (modelRef.current) {
                modelRef.current.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.wireframe = enabled);
                        } else {
                            child.material.wireframe = enabled;
                        }
                    }
                });
            }
        },
        setBackground: (color: string) => {
            if (sceneRef.current) {
                sceneRef.current.background = new THREE.Color(color);
            }
        },
        resetCamera: () => {
            if (cameraRef.current && controlsRef.current) {
                cameraRef.current.position.set(0, 0, 5);
                controlsRef.current.reset();
            }
        },
        rotateModel: (x: number, y: number) => {
            if (modelRef.current) {
                modelRef.current.rotation.x += x;
                modelRef.current.rotation.y += y;
            }
        },
        syncCamera: (position, target) => {
            if (cameraRef.current && controlsRef.current) {
                isSyncingRef.current = true;
                cameraRef.current.position.set(position.x, position.y, position.z);
                controlsRef.current.target.set(target.x, target.y, target.z);
                controlsRef.current.update();
                setTimeout(() => { isSyncingRef.current = false; }, 50);
            }
        },
        getCameraState: () => {
            if (cameraRef.current && controlsRef.current) {
                return {
                    position: cameraRef.current.position.clone(),
                    target: controlsRef.current.target.clone()
                };
            }
            return null;
        }
    }));

    useEffect(() => {
        if (!containerRef.current || !modelUrl) return;

        // Reset states on new model load
        setIsLoading(true);
        setLoadError(null);

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        const onCameraMove = () => {
            if (isSyncingRef.current) return;
            if (onCameraChange && cameraRef.current) {
                onCameraChange(cameraRef.current.position.clone(), controls.target.clone());
            }
        };
        controls.addEventListener('change', onCameraMove);

        // Load Model
        // 1. Determine Extension (from original URL)
        const cleanUrl = modelUrl.split('?')[0];
        const fileExtension = cleanUrl.split('.').pop()?.toLowerCase();

        // 2. Prepare Proxy URL (to bypass CORS)
        let loadUrl = modelUrl;

        console.log("ThreeDViewer: Loading model from:", modelUrl);

        const isR2 = modelUrl.includes('r2.dev') || modelUrl.includes('cloudflare');
        const needsProxy = (modelUrl.includes('tripo') || modelUrl.includes('amazonaws')) && !modelUrl.includes('tripo-proxy');
        
        if (isR2) {
            // Direct load from R2 to save Supabase Egress
            loadUrl = modelUrl;
            console.log("ThreeDViewer: Direct R2 Load (Saving Egress):", loadUrl);
        } else if (needsProxy) {
            loadUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(modelUrl)}`;
            console.log("ThreeDViewer: Using Proxy URL:", loadUrl);
        }

        const handleModelLoad = (object: THREE.Object3D) => {
            modelRef.current = object;

            // Center and scale model
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;

            object.scale.multiplyScalar(scale);
            object.position.sub(center.multiplyScalar(scale));

            scene.add(object);
            setIsLoading(false);
        };

        const handleLoadError = (error: any) => {
            console.error('Error loading 3D model:', error);
            const errMsg = String(error?.message || error || '');
            if (errMsg.includes('403') || errMsg.includes('401')) {
                setLoadError('3D 모델 URL이 만료되었습니다. 모델을 다시 생성해주세요.');
            } else {
                setLoadError('3D 모델을 불러올 수 없습니다.');
            }
            setIsLoading(false);
        };

        // Skip if URL points to an image file (not a 3D model)
        const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
        if (fileExtension && imageExtensions.includes(fileExtension)) {
            console.warn('ThreeDViewer: URL points to an image file, not a 3D model:', modelUrl);
            return;
        }

        if (fileExtension === 'stl') {
            const loader = new STLLoader();
            if (needsProxy) {
                loader.setRequestHeader({ "Authorization": `Bearer ${config.supabase.anonKey}` });
            }
            loader.load(
                loadUrl, // Use proxy URL
                (geometry) => {
                    const material = new THREE.MeshPhongMaterial({
                        color: 0x888888,
                        specular: 0x111111,
                        shininess: 200
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    handleModelLoad(mesh);
                },
                undefined,
                handleLoadError
            );
        } else {
            // Default to GLB/GLTF
            const loader = new GLTFLoader();
            if (needsProxy) {
                loader.setRequestHeader({ "Authorization": `Bearer ${config.supabase.anonKey}` });
            }
            loader.load(
                loadUrl, // Use proxy URL
                (gltf) => {
                    handleModelLoad(gltf.scene);
                },
                undefined,
                handleLoadError
            );
        }

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;

            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (controlsRef.current) {
                controlsRef.current.removeEventListener('change', onCameraMove);
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
            controlsRef.current?.dispose();
        };
    }, [modelUrl]);

    return (
        <div ref={containerRef} className={`w-full h-full relative ${className}`}>
            {/* Loading Spinner */}
            {isLoading && modelUrl && !loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
                    <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                    <p className="text-white/50 text-sm">3D 모델 로딩 중...</p>
                </div>
            )}

            {/* Error State */}
            {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10 text-center px-6">
                    <span className="material-icons-round text-4xl text-red-400/70 mb-3">error_outline</span>
                    <p className="text-white/70 text-sm mb-1">{loadError}</p>
                    <p className="text-white/30 text-xs">URL이 만료되었거나 파일이 손상되었을 수 있습니다.</p>
                </div>
            )}

            {/* No URL */}
            {!modelUrl && (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                    <p className="text-sm">3D 모델 파일이 없습니다</p>
                </div>
            )}
        </div>
    );
});

export default ThreeDViewer;

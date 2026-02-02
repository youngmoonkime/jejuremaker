import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
}

interface ThreeDViewerProps {
    modelUrl: string;
    className?: string;
}

const ThreeDViewer = forwardRef<ThreeDViewerHandle, ThreeDViewerProps>(({ modelUrl, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);

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
        }
    }));

    useEffect(() => {
        if (!containerRef.current || !modelUrl) return;

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

        // Load Model
        // 1. Determine Extension (from original URL)
        const cleanUrl = modelUrl.split('?')[0];
        const fileExtension = cleanUrl.split('.').pop()?.toLowerCase();

        // 2. Prepare Proxy URL (to bypass CORS)
        let loadUrl = modelUrl;

        console.log("ThreeDViewer: Loading model from:", modelUrl);

        const needsProxy = modelUrl.includes('tripo') || modelUrl.includes('amazonaws');
        if (needsProxy && !modelUrl.includes('tripo-proxy')) {
            loadUrl = `${config.supabase.url}/functions/v1/tripo-file-proxy?url=${encodeURIComponent(modelUrl)}`;
            // Use Client-side function proxy if in dev or production based on aiService logic logic for compatibility
            // ideally we should pass this config in or use the same utility, but hardcoding for now as quick fix to preserve existing logic
            // Actually, let's keep the existing logic found in the file but wrapped.
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
        };

        if (fileExtension === 'stl') {
            const loader = new STLLoader();
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
                (error) => {
                    console.error('Error loading STL model:', error);
                }
            );
        } else {
            // Default to GLB/GLTF
            const loader = new GLTFLoader();
            loader.load(
                loadUrl, // Use proxy URL
                (gltf) => {
                    handleModelLoad(gltf.scene);
                },
                undefined,
                (error) => {
                    console.error('Error loading GLB/GLTF model:', error);
                }
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
        <div ref={containerRef} className={`w-full h-full ${className}`}>
            {!modelUrl && (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                    <p className="text-sm">3D 모델 파일이 없습니다</p>
                </div>
            )}
        </div>
    );
});

export default ThreeDViewer;

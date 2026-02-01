import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

interface ThreeDViewerProps {
    modelUrl: string;
    className?: string;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelUrl, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationIdRef = useRef<number | null>(null);

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
        const fileExtension = modelUrl.split('.').pop()?.toLowerCase();

        if (fileExtension === 'glb' || fileExtension === 'gltf') {
            const loader = new GLTFLoader();
            loader.load(
                modelUrl,
                (gltf) => {
                    const model = gltf.scene;

                    // Center and scale model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3 / maxDim;

                    model.scale.multiplyScalar(scale);
                    model.position.sub(center.multiplyScalar(scale));

                    scene.add(model);
                },
                undefined,
                (error) => {
                    console.error('Error loading GLB model:', error);
                }
            );
        } else if (fileExtension === 'stl') {
            const loader = new STLLoader();
            loader.load(
                modelUrl,
                (geometry) => {
                    const material = new THREE.MeshPhongMaterial({
                        color: 0x888888,
                        specular: 0x111111,
                        shininess: 200
                    });
                    const mesh = new THREE.Mesh(geometry, material);

                    // Center and scale model
                    geometry.computeBoundingBox();
                    const box = geometry.boundingBox!;
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3 / maxDim;

                    mesh.scale.multiplyScalar(scale);
                    mesh.position.sub(center.multiplyScalar(scale));

                    scene.add(mesh);
                },
                undefined,
                (error) => {
                    console.error('Error loading STL model:', error);
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
};

export default ThreeDViewer;

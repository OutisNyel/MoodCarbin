// ==================== sad.js（修复光点问题） ====================
(function() {
    let savedSadLights = [];
    let savedSadFogColor = null;
    let savedSadClearColor = null;
    let savedSadSkyMat = null;
    let savedSadGroundColor = null;
    let savedSadTreeColors = [];
    let savedSadFlowerColors = [];

    let rainParticles = null;
    let sadLight = null; // 这个应该是环境光，不是点光源
    let sadFloat = false;
    let floatTime = 0;
    let sadSkyMat = null;

    const sadSkyShader = {
        uniforms: {
            time: { value: 0 },
            intensity: { value: 0.7 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            void main() {
                vUv = uv;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            uniform float time;
            uniform float intensity;
            
            void main(){
                // 灰暗的阴雨天色调
                vec3 skyColor = mix(vec3(0.2, 0.2, 0.3), vec3(0.4, 0.4, 0.5), vUv.y);
                
                // 雨云效果
                float cloud = sin(vUv.x * 15.0 + time * 0.2) * sin(vUv.y * 10.0 + time * 0.3);
                cloud = max(0.0, cloud) * 0.4;
                vec3 cloudColor = vec3(0.5, 0.5, 0.6) * cloud;
                
                // 雨幕效果
                float rainLines = sin(vUv.x * 30.0 + time * 5.0) * 0.3;
                
                vec3 finalColor = (skyColor + cloudColor) * intensity;
                finalColor = mix(finalColor, vec3(0.6, 0.6, 0.7), rainLines);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    };

    window.applySad = function () {
        console.log('🌧️ 应用悲伤情绪特效');
        currentEmotion = 'sad';
        document.getElementById("cur-emotion").innerText = "悲伤";

        saveOriginalSadState();
        createSadSky();
        createDimLighting(); // 修复光照设置
        createRainEffect();
        createSadEnvironment();
        startSadAnimations();
    };

    window.clearSad = function () {
        console.log('清除悲伤情绪特效');
        currentEmotion = 'normal';
        document.getElementById("cur-emotion").innerText = "正常";
        restoreOriginalState();
        cleanupSadEffects();
        sadFloat = false;
    };

    window.updateSadEffect = function () {
        if (currentEmotion !== 'sad') return;
        
        const time = Date.now() * 0.001;

        // 天空动画
        if (sadSkyMat) {
            sadSkyMat.uniforms.time.value = time;
            sadSkyMat.uniforms.intensity.value = 0.6 + Math.sin(time) * 0.1;
        }

        // 雨滴动画
        updateRainEffect(time);

        // 摄像机浮动效果
        if (sadFloat) {
            floatTime += 0.01;
            camera.position.y += Math.sin(floatTime) * 0.008;
            camera.position.x += Math.cos(floatTime * 0.6) * 0.005;
        }

        // 环境动画
        updateSadEnvironment(time);
    };

    function saveOriginalSadState() {
        if (savedSadLights.length === 0) {
            scene.traverse(o => {
                if (o.isLight) {
                    savedSadLights.push({
                        light: o,
                        color: o.color.clone(),
                        intensity: o.intensity,
                        position: o.position ? o.position.clone() : null
                    });
                }
            });
            
            savedSadFogColor = scene.fog ? scene.fog.color.clone() : null;
            savedSadClearColor = renderer.getClearColor(new THREE.Color()).clone();
            
            if (ground && ground.material) {
                savedSadGroundColor = ground.material.color.clone();
            }
        }
    }

    function createSadSky() {
        scene.traverse(o => {
            if (o.geometry && o.geometry.type === 'SphereGeometry') {
                if (!savedSadSkyMat) savedSadSkyMat = o.material;
                o.material = new THREE.ShaderMaterial({
                    uniforms: THREE.UniformsUtils.clone(sadSkyShader.uniforms),
                    vertexShader: sadSkyShader.vertexShader,
                    fragmentShader: sadSkyShader.fragmentShader,
                    side: THREE.BackSide
                });
                sadSkyMat = o.material;
                sadSkyMat.uniforms.intensity.value = 0.7;
            }
        });
    }

    function createDimLighting() {
        // 减弱现有光照 - 修复：只修改强度，不改变位置
        scene.traverse(o => {
            if (o.type === "DirectionalLight") {
                o.intensity = 0.3;
                o.color = new THREE.Color(0x666666);
                // 保持原有的位置不变
            }
            if (o.type === "AmbientLight") {
                o.intensity = 0.2;
                o.color = new THREE.Color(0x444444);
            }
            if (o.type === "PointLight") {
                // 减弱小屋的点光源，而不是移除或移动它
                o.intensity = 0.1;
                o.color = new THREE.Color(0x446688);
            }
        });

        // 不需要添加额外的点光源，使用现有的环境光
        // 渲染器背景色变暗
        renderer.setClearColor(0x333344);
        
        // 雾效
        if (scene.fog) {
            scene.fog = new THREE.Fog(0x333344, 15, 60);
        }
    }

    function createRainEffect() {
        const rainCount = 800;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = new Float32Array(rainCount);

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 50 + 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
            velocities[i] = 0.3 + Math.random() * 0.2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

        const material = new THREE.PointsMaterial({
            color: 0x88AAFF,
            size: 0.08,
            transparent: true,
            opacity: 0.7
        });

        rainParticles = new THREE.Points(geometry, material);
        rainParticles.userData = {
            velocities: velocities,
            resetHeight: 70
        };
        
        scene.add(rainParticles);
    }

    function createSadEnvironment() {
        // 地面变暗湿润
        if (ground && ground.material) {
            ground.material.color = new THREE.Color(0x2A4A3A);
            ground.material.roughness = 0.4;
        }
        
        // 树木变暗
        trees.forEach(tree => {
            if (tree.children[1] && tree.children[1].material) {
                tree.children[1].material.color = new THREE.Color(0x1a3d1a);
            }
        });
    }

    function startSadAnimations() {
        sadFloat = true;
        floatTime = 0;
        
        camera.position.set(18, 9, 18);
        controls.target.set(0, 3, 0);
        controls.update();
    }

    function updateRainEffect(time) {
        if (rainParticles) {
            const positions = rainParticles.geometry.attributes.position.array;
            const velocities = rainParticles.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= velocities[i / 3];
                
                if (positions[i + 1] < 0) {
                    positions[i + 1] = rainParticles.userData.resetHeight;
                    positions[i] = (Math.random() - 0.5) * 80;
                    positions[i + 2] = (Math.random() - 0.5) * 80;
                }
            }
            
            rainParticles.geometry.attributes.position.needsUpdate = true;
            rainParticles.material.opacity = 0.6 + Math.sin(time * 4) * 0.2;
        }
    }

    function updateSadEnvironment(time) {
        trees.forEach((tree, index) => {
            if (tree.children[1]) {
                tree.children[1].rotation.z = Math.sin(time * 0.1 + index) * 0.03;
            }
        });
    }

    function restoreOriginalState() {
        if (savedSadClearColor) renderer.setClearColor(savedSadClearColor);
        if (savedSadFogColor && scene.fog) scene.fog.color.copy(savedSadFogColor);
        
        // 恢复所有光照的原始设置
        savedSadLights.forEach(item => {
            item.light.color.copy(item.color);
            item.light.intensity = item.intensity;
            // 恢复原始位置
            if (item.position && item.light.position) {
                item.light.position.copy(item.position);
            }
        });
        
        scene.traverse(o => {
            if (o.geometry && o.geometry.type === 'SphereGeometry') {
                if (savedSadSkyMat) {
                    o.material = savedSadSkyMat;
                }
            }
        });
        
        if (savedSadGroundColor && ground && ground.material) {
            ground.material.color.copy(savedSadGroundColor);
            ground.material.roughness = 0.8;
        }
        
        if (scene.fog) {
            scene.fog = new THREE.Fog(0x87ceeb, 20, 100);
        }
    }

    function cleanupSadEffects() {
        if (rainParticles) {
            scene.remove(rainParticles);
            rainParticles.geometry.dispose();
            rainParticles.material.dispose();
            rainParticles = null;
        }
        
    }
})();
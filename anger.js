// ==================== anger.js（恢复烟囱喷火效果） ====================
(function() {
    let angerInitialized = false;
    let savedLights = [];
    let savedFogColor = null;
    let savedClearColor = null;
    let oldSkyMat = null;
    let angerLight = null;
    let angerShake = false;
    let shakePower = 0.18;
    let shakeDecay = 0.985;
    let skyMat = null;
    let crackMesh = null;
    let fireCone = null;
    let fireSpark = null;
    let houseGlowList = [];

    // 火焰纹理
    const fireTexture = new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/fire.png"
    );

    const skyShader = {
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x991111) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float time;
            uniform vec3 color;
            float noise(vec2 p){
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            void main(){
                float n = noise(vUv * 8.0 + time * 0.25);
                float c = smoothstep(0.3, 1.0, n);
                gl_FragColor = vec4(color * c, 1.0);
            }
        `
    };

    window.applyAnger = function () {
        console.log('🔥 应用愤怒情绪特效');
        currentEmotion = 'angry';
        document.getElementById("cur-emotion").innerText = "愤怒";

        if (!angerInitialized) {
            saveOriginalState();
            angerInitialized = true;
        }

        applyAngerEffects();
    };

    window.clearAnger = function () {
        console.log('清除愤怒情绪特效');
        currentEmotion = 'normal';
        document.getElementById("cur-emotion").innerText = "正常";
        clearAngerEffects();
    };

    window.updateAngerEffect = function () {
        if (currentEmotion !== 'angry') return;
        updateAngerEffects();
    };

    function saveOriginalState() {
        if (savedLights.length === 0) {
            scene.traverse(o => {
                if (o.isLight) {
                    savedLights.push({
                        light: o,
                        color: o.color.clone(),
                        intensity: o.intensity
                    });
                }
            });
            
            savedFogColor = scene.fog ? scene.fog.color.clone() : null;
            savedClearColor = renderer.getClearColor(new THREE.Color()).clone();
        }
    }

    function applyAngerEffects() {
        // 天空效果
        scene.traverse(o => {
            if (o.geometry && o.geometry.type === 'SphereGeometry') {
                if (!oldSkyMat) oldSkyMat = o.material;
                o.material = new THREE.ShaderMaterial({
                    uniforms: skyShader.uniforms,
                    vertexShader: skyShader.vertexShader,
                    fragmentShader: skyShader.fragmentShader,
                    side: THREE.BackSide
                });
                skyMat = o.material;
            }
        });

        // 背景色
        renderer.setClearColor(0x330000);
        if (scene.fog) scene.fog.color.set(0x330000);

        // 愤怒灯光
        if (!angerLight) {
            angerLight = new THREE.PointLight(0xff2200, 3.8, 70);
            angerLight.position.set(0, 6, 0);
            scene.add(angerLight);
        }

        // 地面裂纹
        if (!crackMesh) {
            const crackGeometry = new THREE.PlaneGeometry(20, 20);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0xaa0000,
                transparent: true,
                opacity: 0.65
            });
            crackMesh = new THREE.Mesh(crackGeometry, crackMaterial);
            crackMesh.rotation.x = -Math.PI / 2;
            crackMesh.position.y = 0.02;
            scene.add(crackMesh);
        }

        // 烟囱喷火效果 - 恢复原始表现形式
        if (!fireCone) {
            fireCone = createFireCone();
            // 定位到烟囱位置
            fireCone.position.set(3, 10, -4.2); // 烟囱顶部位置
            scene.add(fireCone);
        }

        // 火花粒子 - 恢复原始效果
        if (!fireSpark) {
            fireSpark = createSparkParticles();
            scene.add(fireSpark);
        }

        // 房屋边缘发光
        scene.traverse(o => {
            if (o.geometry && (o.parent === house || o === house)) {
                const glow = createGlowMaterial();
                const mesh = new THREE.Mesh(o.geometry.clone(), glow);
                mesh.position.copy(o.position);
                mesh.rotation.copy(o.rotation);
                mesh.scale.copy(o.scale);
                houseGlowList.push(mesh);
                scene.add(mesh);
            }
        });

        // 调整光照
        scene.traverse(o => {
            if (o.type === "AmbientLight") o.intensity = 0.15;
            if (o.type === "DirectionalLight") {
                o.intensity = 0.55;
                o.color.set(0xff6644);
            }
        });

        angerShake = true;
    }

    // 创建烟囱喷火效果 - 恢复原始实现
    function createFireCone() {
        const uniforms = {
            time: { value: 0 },
            tex: { value: fireTexture }
        };

        const mat = new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                void main(){
                    vUv = uv;
                    vec3 pos = position;
                    // 火焰扭曲效果
                    pos.x += sin(uv.y * 10.0 + time) * 0.2;
                    pos.z += cos(uv.y * 10.0 + time) * 0.2;
                    // 火焰跳动效果
                    pos.y += sin(time * 5.0 + uv.y * 8.0) * 0.1;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D tex;
                uniform float time;
                void main(){
                    vec2 uv = vUv;
                    // 火焰动态效果
                    uv.x += sin(time * 2.0 + uv.y * 5.0) * 0.1;
                    vec4 c = texture2D(tex, uv);
                    // 火焰颜色 - 从黄色到红色的渐变
                    vec3 fireColor = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.2, 0.0), vUv.y);
                    gl_FragColor = vec4(fireColor * c.r * 3.0, c.a * (0.8 + sin(time * 3.0) * 0.2));
                }
            `
        });

        const geo = new THREE.ConeGeometry(0.8, 3.0, 16, 32);
        const fire = new THREE.Mesh(geo, mat);
        
        return fire;
    }

    // 创建火花粒子 - 恢复原始效果
    function createSparkParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // 从烟囱位置发射
            positions[i * 3] = 3 + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = 10 + Math.random() * 0.5;
            positions[i * 3 + 2] = -4.2 + (Math.random() - 0.5) * 0.5;
            
            // 随机速度方向
            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = Math.random() * 0.2 + 0.1; // 向上
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            
            // 火花颜色 - 从黄色到红色
            colors[i * 3] = 1.0; // R
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // G
            colors[i * 3 + 2] = 0.0; // B
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geometry, material);
    }

    // 房屋边缘发光材质
    function createGlowMaterial() {
        return new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                time: { value: 0 },
                intensity: { value: 2.0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                uniform float time;
                uniform float intensity;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);
                    float rim = 1.0 - max(dot(normal, viewDir), 0.0);
                    rim = smoothstep(0.3, 1.0, rim);
                    
                    // 火焰边缘光效果
                    vec3 glowColor = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.2, 0.0), rim);
                    float pulse = sin(time * 4.0) * 0.5 + 0.5;
                    
                    vec3 finalColor = glowColor * rim * intensity * (0.7 + pulse * 0.3);
                    gl_FragColor = vec4(finalColor, rim * 0.4);
                }
            `
        });
    }

    function clearAngerEffects() {
        renderer.setClearColor(0x87ceeb);
        if (scene.fog) scene.fog.color.set(0x87ceeb);

        if (angerLight) {
            scene.remove(angerLight);
            angerLight = null;
        }
        if (crackMesh) {
            scene.remove(crackMesh);
            crackMesh = null;
        }
        if (fireCone) {
            scene.remove(fireCone);
            fireCone = null;
        }
        if (fireSpark) {
            scene.remove(fireSpark);
            fireSpark = null;
        }

        houseGlowList.forEach(m => scene.remove(m));
        houseGlowList = [];

        // 恢复光照
        savedLights.forEach(item => {
            item.light.color.copy(item.color);
            item.light.intensity = item.intensity;
        });

        if (savedFogColor) scene.fog.color.copy(savedFogColor);
        if (savedClearColor) renderer.setClearColor(savedClearColor);

        // 恢复天空
        scene.traverse(o => {
            if (o.geometry && o.geometry.type === 'SphereGeometry') {
                if (oldSkyMat) {
                    o.material = oldSkyMat;
                }
            }
        });

        angerShake = false;
    }

    function updateAngerEffects() {
        const t = Date.now() * 0.004;

        // 天空流动
        if (skyMat) skyMat.uniforms.time.value += 0.01;

        // 红光跳动
        if (angerLight) {
            angerLight.intensity = 2.5 + Math.sin(t * 5) * 1.6;
            // 添加颜色变化
            angerLight.color.setHSL(0.03 + Math.sin(t * 3) * 0.02, 1.0, 0.5);
        }

        // 裂缝亮度波动
        if (crackMesh) {
            crackMesh.material.opacity = 0.55 + Math.sin(t * 4) * 0.2;
        }

        // 烟囱喷火动画
        if (fireCone) {
            fireCone.material.uniforms.time.value += 0.05;
            // 火焰跳动效果
            fireCone.scale.y = 1.0 + Math.sin(t * 8) * 0.2;
        }

        // 火花粒子更新
        if (fireSpark) {
            updateSparkParticles();
        }

        // 房屋边缘发光动画
        houseGlowList.forEach(glow => {
            if (glow.material && glow.material.uniforms) {
                glow.material.uniforms.time.value = t;
                glow.material.uniforms.intensity.value = 1.8 + Math.sin(t * 3) * 0.4;
            }
        });

        // 镜头震动
        if (angerShake) {
            camera.position.x += (Math.random() - 0.5) * shakePower;
            camera.position.y += (Math.random() - 0.5) * shakePower;
            shakePower *= shakeDecay;
            if (shakePower < 0.02) shakePower = 0.02;
        }
    }

    function updateSparkParticles() {
        const positions = fireSpark.geometry.attributes.position.array;
        const velocities = fireSpark.geometry.attributes.velocity.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            // 更新位置
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // 重力效果
            velocities[i + 1] -= 0.005;
            
            // 重置超出范围的粒子
            if (positions[i + 1] > 15 || 
                Math.abs(positions[i]) > 10 || 
                Math.abs(positions[i + 2]) > 10) {
                
                positions[i] = 3 + (Math.random() - 0.5) * 0.5;
                positions[i + 1] = 10 + Math.random() * 0.5;
                positions[i + 2] = -4.2 + (Math.random() - 0.5) * 0.5;
                
                velocities[i] = (Math.random() - 0.5) * 0.1;
                velocities[i + 1] = Math.random() * 0.2 + 0.1;
                velocities[i + 2] = (Math.random() - 0.5) * 0.1;
            }
        }
        
        fireSpark.geometry.attributes.position.needsUpdate = true;
        
        // 火花闪烁效果
        fireSpark.material.opacity = 0.8 + Math.sin(time * 5) * 0.2;
    }
})();
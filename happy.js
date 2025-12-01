// ==================== happy.js ====================
let savedHappyLights = [];
let savedHappyFogColor = null;
let savedHappyClearColor = null;
let savedHappySkyMat = null;
let savedHappyGroundColor = null;
let savedHappyTreeColors = [];
let savedHappyFlowerColors = [];

let happyLight = null;
let happyFloat = false;
let floatPower = 0.05;
let floatTime = 0;

let happySkyMat = null;
let birdFlock = [];
let houseHappyGlowList = [];
let sunLight = null;

// 快乐元素
let happyEffects = [];
let happyParticles = [];
let rainbowBridge = null;
let windmills = [];
let balloons = [];
let dancingCharacters = [];

const happySkyShader = {
    uniforms: {
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(20, 30, 10) },
        intensity: { value: 1.5 }
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
        uniform vec3 sunPosition;
        uniform float intensity;
        
        void main(){
            vec3 skyColor = mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.8, 0.4), vUv.y);
            vec3 toSun = normalize(sunPosition - vWorldPosition);
            float sunIntensity = max(0.0, dot(normalize(vWorldPosition), toSun));
            vec3 sunGlow = vec3(1.0, 0.95, 0.8) * pow(sunIntensity, 6.0) * 2.0;
            
            float cloud = sin(vUv.x * 20.0 + time * 0.1) * sin(vUv.y * 15.0 + time * 0.15);
            cloud = max(0.0, cloud) * 0.3;
            vec3 cloudColor = vec3(1.0, 0.9, 0.7) * cloud;
            
            vec3 finalColor = (skyColor + sunGlow + cloudColor) * intensity;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

window.applyHappy = function () {
    console.log('🎉 应用快乐情绪特效！');
    currentEmotion = 'happy';
    document.getElementById("cur-emotion").innerText = "快乐";

    saveOriginalHappyState();
    createGoldenSky();
    enhanceLighting();
    createGoldenGround();
    createColorfulFlowers();
    createBlackBirds();
    createRichHappyElements();
    createHouseGlow();
    optimizeFog();
    startHappyAnimations();
};

function saveOriginalHappyState() {
    if (savedHappyLights.length === 0) {
        scene.traverse(o => {
            if (o.isLight) {
                savedHappyLights.push({
                    light: o,
                    color: o.color.clone(),
                    intensity: o.intensity
                });
            }
        });
        
        savedHappyFogColor = scene.fog ? scene.fog.color.clone() : null;
        savedHappyClearColor = renderer.getClearColor(new THREE.Color()).clone();
        
        if (ground && ground.material) {
            savedHappyGroundColor = ground.material.color.clone();
        }
        
        trees.forEach((tree, index) => {
            if (tree.children[1] && tree.children[1].material) {
                if (!savedHappyTreeColors[index]) savedHappyTreeColors[index] = [];
                savedHappyTreeColors[index] = tree.children[1].material.color.clone();
            }
        });
    }
}

function createGoldenSky() {
    scene.traverse(o => {
        if (o.geometry && o.geometry.type === 'SphereGeometry') {
            if (!savedHappySkyMat) savedHappySkyMat = o.material;
            o.material = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(happySkyShader.uniforms),
                vertexShader: happySkyShader.vertexShader,
                fragmentShader: happySkyShader.fragmentShader,
                side: THREE.BackSide
            });
            happySkyMat = o.material;
            happySkyMat.uniforms.intensity.value = 1.5;
        }
    });
}

function enhanceLighting() {
    scene.traverse(o => {
        if (o.type === "DirectionalLight") {
            o.intensity = 1.8;
            o.color = new THREE.Color(0xFFF8DC);
        }
        if (o.type === "AmbientLight") {
            o.intensity = 1.0;
            o.color = new THREE.Color(0xFFFACD);
        }
    });

    if (!sunLight) {
        sunLight = new THREE.DirectionalLight(0xFFD700, 1.2);
        sunLight.position.set(20, 40, 10);
        scene.add(sunLight);
    }

    if (!happyLight) {
        happyLight = new THREE.PointLight(0xFFD700, 3, 50);
        happyLight.position.copy(directionalLight.position);
        scene.add(happyLight);
    }
}

function createGoldenGround() {
    if (ground && ground.material) {
        ground.material.color = new THREE.Color(0xFFD700);
        ground.material.roughness = 0.6;
    }
}

function createColorfulFlowers() {
    flowers.forEach((flower, flowerIndex) => {
        if (flower.children) {
            const vibrantColors = [
                0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57,
                0xFF9FF3, 0x54A0FF, 0x5F27CD, 0x00D2D3, 0xFF9F43
            ];
            
            for (let i = 0; i < Math.min(flower.children.length, 7); i++) {
                if (flower.children[i] && flower.children[i].material) {
                    const colorIndex = (flowerIndex * 7 + i) % vibrantColors.length;
                    flower.children[i].material.color = new THREE.Color(vibrantColors[colorIndex]);
                    flower.children[i].material.roughness = 0.3;
                }
            }
        }
    });
}

function createBlackBirds() {
    if (birdFlock.length === 0) {
        for (let i = 0; i < 6; i++) {
            const bird = createBlackBird();
            bird.position.set(
                (Math.random() - 0.5) * 50,
                15 + Math.random() * 10,
                (Math.random() - 0.5) * 50
            );
            birdFlock.push(bird);
            scene.add(bird);
        }
    }
}

function createBlackBird() {
    const bird = new THREE.Group();
    
    const bodyGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bird.add(body);
    
    const wingGeometry = new THREE.PlaneGeometry(0.4, 0.2);
    const wingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = 0.1;
    bird.add(wing);
    
    bird.userData = {
        speed: 0.04 + Math.random() * 0.03,
        direction: new THREE.Vector3(
            Math.random() - 0.5,
            (Math.random() - 0.5) * 0.1,
            Math.random() - 0.5
        ).normalize(),
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 6 + Math.random() * 4
    };
    
    return bird;
}

function createRichHappyElements() {
    createRainbowBridge();
    createWindmills();
    createFloatingBalloons();
    createDancingCharacters();
}

function createRainbowBridge() {
    const rainbowGroup = new THREE.Group();
    const segments = 7;
    const radius = 15;
    const width = 3;
    
    const rainbowColors = [0xFF6B6B, 0xFF9FF3, 0x54A0FF, 0x5F27CD, 0x00D2D3, 0xFECA57, 0xFF9F43];
    
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI;
        const segmentGeometry = new THREE.BoxGeometry(width, 0.5, 2);
        const segmentMaterial = new THREE.MeshBasicMaterial({
            color: rainbowColors[i],
            transparent: true,
            opacity: 0.8
        });
        
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.set(Math.cos(angle) * radius, 5, Math.sin(angle) * radius - radius);
        segment.rotation.y = -angle;
        rainbowGroup.add(segment);
    }
    
    rainbowGroup.position.y = 3;
    rainbowGroup.userData = { rotationSpeed: 0.01 };
    scene.add(rainbowGroup);
    happyEffects.push(rainbowGroup);
    rainbowBridge = rainbowGroup;
}

function createWindmills() {
    const windmillCount = 3;
    
    for (let i = 0; i < windmillCount; i++) {
        const windmill = new THREE.Group();
        
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4);
        const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2;
        windmill.add(pole);
        
        const bladeColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFECA57];
        for (let j = 0; j < 4; j++) {
            const bladeGeometry = new THREE.PlaneGeometry(1.5, 0.8);
            const bladeMaterial = new THREE.MeshBasicMaterial({
                color: bladeColors[j],
                side: THREE.DoubleSide
            });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.y = 4;
            blade.rotation.y = (j / 4) * Math.PI * 2;
            blade.rotation.x = Math.PI / 4;
            windmill.add(blade);
        }
        
        const angle = (i / windmillCount) * Math.PI * 2;
        windmill.position.set(Math.cos(angle) * 12, 0, Math.sin(angle) * 12);
        windmill.userData = { rotationSpeed: 0.5 + Math.random() * 0.3 };
        scene.add(windmill);
        happyEffects.push(windmill);
        windmills.push(windmill);
    }
}

function createFloatingBalloons() {
    const balloonCount = 8;
    const balloonColors = [0xFF6B6B, 0xFF9FF3, 0x54A0FF, 0x00D2D3, 0xFECA57];
    
    for (let i = 0; i < balloonCount; i++) {
        const balloonGroup = new THREE.Group();
        
        const balloonGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const balloonMaterial = new THREE.MeshBasicMaterial({
            color: balloonColors[i % balloonColors.length],
            transparent: true,
            opacity: 0.9
        });
        const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
        balloonGroup.add(balloon);
        
        balloonGroup.position.set(
            (Math.random() - 0.5) * 25,
            5 + Math.random() * 10,
            (Math.random() - 0.5) * 25
        );
        
        balloonGroup.userData = {
            floatSpeed: 0.1 + Math.random() * 0.1,
            swingSpeed: 1 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2
        };
        
        scene.add(balloonGroup);
        happyEffects.push(balloonGroup);
        balloons.push(balloonGroup);
    }
}

function createDancingCharacters() {
    const characterCount = 4;
    
    for (let i = 0; i < characterCount; i++) {
        const character = new THREE.Group();
        
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0xFFC312 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        character.add(head);
        
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xEA2027 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        character.add(body);
        
        const angle = (i / characterCount) * Math.PI * 2;
        character.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
        character.userData = {
            danceSpeed: 2 + Math.random(),
            phase: Math.random() * Math.PI * 2,
            jumpHeight: 0.3 + Math.random() * 0.2
        };
        
        scene.add(character);
        happyEffects.push(character);
        dancingCharacters.push(character);
    }
}

function createHouseGlow() {
    scene.traverse(o => {
        if (o.geometry && (o.parent === house || o === house)) {
            const glow = createGoldenGlowMaterial();
            const mesh = new THREE.Mesh(o.geometry.clone(), glow);
            mesh.position.copy(o.position);
            mesh.rotation.copy(o.rotation);
            mesh.scale.copy(o.scale);
            houseHappyGlowList.push(mesh);
            scene.add(mesh);
        }
    });
}

function createGoldenGlowMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
            time: { value: 0 },
            intensity: { value: 1.0 }
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
                rim = smoothstep(0.4, 1.0, rim);
                vec3 glowColor = vec3(1.0, 0.9, 0.3);
                float pulse = sin(time * 3.0) * 0.5 + 0.5;
                vec3 finalColor = glowColor * rim * intensity * (0.8 + pulse * 0.2);
                gl_FragColor = vec4(finalColor, rim * 0.3);
            }
        `
    });
}

function optimizeFog() {
    if (scene.fog) {
        scene.fog = new THREE.Fog(0xFFF8DC, 60, 250);
    }
}

function startHappyAnimations() {
    happyFloat = true;
    floatTime = 0;
}

window.updateHappyEffect = function () {
    if (currentEmotion !== 'happy') return;
    
    const time = Date.now() * 0.001;

    if (happySkyMat) {
        happySkyMat.uniforms.time.value = time;
        happySkyMat.uniforms.intensity.value = 1.3 + Math.sin(time) * 0.2;
    }

    updateBlackBirdFlock(time);
    updateRichHappyElements(time);

    if (happyLight) {
        happyLight.intensity = 2.5 + Math.sin(time * 2) * 0.5;
    }

    if (happyFloat) {
        floatTime += 0.01;
        camera.position.y += Math.sin(floatTime) * 0.015;
        camera.position.x += Math.cos(floatTime * 0.8) * 0.008;
    }
};

function updateBlackBirdFlock(time) {
    birdFlock.forEach(bird => {
        bird.position.add(bird.userData.direction.clone().multiplyScalar(bird.userData.speed));
        
        const wing = bird.children[1];
        if (wing) {
            wing.rotation.x = Math.sin(time * bird.userData.wingSpeed + bird.userData.wingPhase) * 0.6;
        }
        
        bird.position.y += Math.sin(time * 2 + bird.userData.wingPhase) * 0.02;
        
        if (bird.position.x > 40 || bird.position.x < -40 || 
            bird.position.z > 40 || bird.position.z < -40) {
            bird.userData.direction.negate();
        }
        
        if (Math.random() < 0.005) {
            bird.userData.direction.set(
                Math.random() - 0.5,
                (Math.random() - 0.5) * 0.1,
                Math.random() - 0.5
            ).normalize();
        }
    });
}

function updateRichHappyElements(time) {
    if (rainbowBridge) {
        rainbowBridge.rotation.y += rainbowBridge.userData.rotationSpeed;
    }
    
    windmills.forEach(windmill => {
        windmill.rotation.y += windmill.userData.rotationSpeed * 0.1;
    });
    
    balloons.forEach(balloon => {
        balloon.position.y += Math.sin(time + balloon.userData.phase) * 0.01;
        balloon.rotation.z = Math.sin(time * balloon.userData.swingSpeed + balloon.userData.phase) * 0.1;
    });
    
    dancingCharacters.forEach(character => {
        const dance = character.userData;
        character.position.y = Math.sin(time * dance.danceSpeed + dance.phase) * dance.jumpHeight;
        character.rotation.z = Math.sin(time * dance.danceSpeed * 2 + dance.phase) * 0.3;
    });
    
    houseHappyGlowList.forEach(glow => {
        if (glow.material && glow.material.uniforms) {
            glow.material.uniforms.time.value = time;
            glow.material.uniforms.intensity.value = 0.8 + Math.sin(time * 2) * 0.2;
        }
    });
}

window.clearHappy = function () {
    console.log('清除快乐情绪特效');
    currentEmotion = 'normal';
    document.getElementById("cur-emotion").innerText = "正常";

    restoreOriginalState();
    cleanupHappyEffects();
    happyFloat = false;
};

function restoreOriginalState() {
    if (savedHappyClearColor) renderer.setClearColor(savedHappyClearColor);
    if (savedHappyFogColor && scene.fog) scene.fog.color.copy(savedHappyFogColor);
    
    savedHappyLights.forEach(item => {
        item.light.color.copy(item.color);
        item.light.intensity = item.intensity;
    });
    
    scene.traverse(o => {
        if (o.geometry && o.geometry.type === 'SphereGeometry') {
            if (savedHappySkyMat) {
                o.material = savedHappySkyMat;
            }
        }
    });
    
    if (savedHappyGroundColor && ground && ground.material) {
        ground.material.color.copy(savedHappyGroundColor);
        ground.material.roughness = 0.8;
    }
    
    if (scene.fog) {
        scene.fog = new THREE.Fog(0x87ceeb, 20, 100);
    }
}

function cleanupHappyEffects() {
    if (happyLight) {
        scene.remove(happyLight);
        happyLight = null;
    }
    if (sunLight) {
        scene.remove(sunLight);
        sunLight = null;
    }
    
    birdFlock.forEach(bird => scene.remove(bird));
    birdFlock = [];
    
    houseHappyGlowList.forEach(glow => scene.remove(glow));
    houseHappyGlowList = [];
    
    const allEffects = [...happyEffects, ...windmills, ...balloons, ...dancingCharacters];
    allEffects.forEach(effect => {
        if (effect && effect.parent) {
            scene.remove(effect);
            if (effect.geometry) effect.geometry.dispose();
            if (effect.material) effect.material.dispose();
        }
    });
    
    happyEffects = [];
    windmills = [];
    balloons = [];
    dancingCharacters = [];
    rainbowBridge = null;
}
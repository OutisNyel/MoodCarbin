// 场景初始化
let scene, camera, renderer, controls;
let house, trees = [], flowers = [];
let currentEmotion = 'normal';
let directionalLight, ambientLight, pointLight;
let sky, ground;

// 初始化场景
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 10, 15);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87ceeb);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // 添加控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    
    // 创建天空
    createSky();
    
    // 创建光照
    createLights();
    
    // 创建地面
    createGround();
    
    // 创建小屋
    createHouse();
    
    // 创建树木
    createTrees();
    
    // 创建花草
    createFlowers();
    
    // 隐藏加载提示，显示控制面板
    document.getElementById('loading').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('info').style.display = 'block';
    
    // 绑定事件
    bindEvents();
    
    // 开始动画循环
    animate();
}

// 创建天空
function createSky() {
    const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
}

// 创建光照
function createLights() {
    // 环境光
    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // 方向光
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 点光源
    pointLight = new THREE.PointLight(0xffd700, 0.5, 20);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);
}

// 创建地面
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5f3a, roughness: 0.8 });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // 添加起伏
    for (let i = 0; i < 20; i++) {
        const hillGeometry = new THREE.SphereGeometry(Math.random() * 3 + 2, 8, 8);
        const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x4a7c4a, roughness: 0.9 });
        const hill = new THREE.Mesh(hillGeometry, hillMaterial);
        hill.position.set((Math.random() - 0.5) * 80, -2, (Math.random() - 0.5) * 80);
        hill.scale.y = 0.3;
        hill.receiveShadow = true;
        scene.add(hill);
    }
}

// 创建小屋
function createHouse() {
    house = new THREE.Group();
    
    // 地基
    const foundationGeometry = new THREE.BoxGeometry(12, 0.5, 12);
    const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.y = 0.25;
    house.add(foundation);
    
    // 墙壁
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.7 });
    
    // 前墙
    const frontWallGeometry = new THREE.BoxGeometry(12, 8, 0.5);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, 4.25, 6);
    house.add(frontWall);
    
    // 后墙
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(0, 4.25, -6);
    house.add(backWall);
    
    // 侧墙
    const sideWallGeometry = new THREE.BoxGeometry(0.5, 8, 12);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-6, 4.25, 0);
    house.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(6, 4.25, 0);
    house.add(rightWall);
    
    // 屋顶
    const roofGeometry = new THREE.ConeGeometry(8.5, 4, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8.5;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    
    // 门
    const doorGeometry = new THREE.BoxGeometry(2.5, 5, 0.3);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 3, 6.4);
    house.add(door);
    
    // 窗户
    const windowGeometry = new THREE.BoxGeometry(2, 2, 0.1);
    const windowGlassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x87ceeb, transparent: true, opacity: 0.3 
    });
    
    // 前窗
    const frontWindow = new THREE.Mesh(windowGeometry, windowGlassMaterial);
    frontWindow.position.set(3, 5, 6.45);
    house.add(frontWindow);
    
    // 侧窗
    const sideWindow = new THREE.Mesh(windowGeometry, windowGlassMaterial);
    sideWindow.position.set(6.45, 5, 0);
    sideWindow.rotation.y = Math.PI / 2;
    house.add(sideWindow);
    
    // 烟囱
    const chimneyGeometry = new THREE.BoxGeometry(1, 3, 1);
    const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(3, 8, -4.2);
    house.add(chimney);
    
    scene.add(house);
}

// 创建树木
function createTrees() {
    const treePositions = [
        { x: -15, z: -10 }, { x: 18, z: -8 }, { x: -12, z: 15 },
        { x: 20, z: 12 }, { x: -20, z: 5 }, { x: 25, z: -15 }
    ];
    
    treePositions.forEach(pos => {
        const tree = createTree(pos.x, pos.z);
        trees.push(tree);
        scene.add(tree);
    });
}

// 创建单棵树
function createTree(x, z) {
    const tree = new THREE.Group();
    
    // 树干
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    tree.add(trunk);
    
    // 树冠
    const crownGeometry = new THREE.ConeGeometry(3, 5, 8);
    const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x0d4d0d, roughness: 0.8 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 6;
    tree.add(crown);
    
    tree.position.set(x, 0, z);
    return tree;
}

// 创建花草
function createFlowers() {
    for (let i = 0; i < 30; i++) {
        const flower = createFlower();
        flower.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
        flowers.push(flower);
        scene.add(flower);
    }
    
    // 创建草丛
    const grassCount = 1000;
    for (let i = 0; i < grassCount; i++) {
        const grass = createGrass();
        grass.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
        const scale = 0.8 + Math.random() * 0.6;
        grass.scale.set(scale, scale, scale);
        grass.rotation.y = Math.random() * Math.PI * 2;
        grass.userData = { swayPhase: Math.random() * Math.PI * 2 };
        scene.add(grass);
    }
}

// 创建单朵花
function createFlower() {
    const flower = new THREE.Group();
    
    // 花茎
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.5;
    flower.add(stem);
    
    // 花瓣
    const petalColors = [0xff69b4, 0xff1493, 0xffd700, 0xff4500, 0x9370db];
    const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
    
    const petalGeometry = new THREE.SphereGeometry(0.3, 6, 6);
    const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.5 });
    
    for (let i = 0; i < 6; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        const angle = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.3, 1, Math.sin(angle) * 0.3);
        petal.scale.set(0.5, 0.3, 0.5);
        flower.add(petal);
    }
    
    // 花心
    const centerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.y = 1;
    flower.add(center);
    
    return flower;
}

// 创建草
function createGrass() {
    const grassGeometry = new THREE.ConeGeometry(0.1, 1.5, 4);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.y = 0.75;
    return grass;
}

// ==================== 事件绑定 ====================
function bindEvents() {
    const emotionButtons = document.querySelectorAll('.emotion-btn');
    emotionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            emotionButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const emotion = this.getAttribute('data-emotion');
            
            // 清除之前的情绪效果
            if (currentEmotion === 'happy') clearHappy();
            if (currentEmotion === 'angry' && typeof clearAnger === 'function') clearAnger();
            if (currentEmotion === 'sad' && typeof clearSad === 'function') clearSad();
            
            // 应用新的情绪效果
            if (emotion === 'happy') applyHappy();
            else if (emotion === 'angry' && typeof applyAnger === 'function') applyAnger();
            else if (emotion === 'sad' && typeof applySad === 'function') applySad();

            currentEmotion = emotion;
            document.getElementById('cur-emotion').textContent = emotion;
        });
    });
    
    window.addEventListener('resize', onWindowResize);
}

// 窗口大小改变处理
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // 更新情绪特效
    if (typeof updateAngerEffect === 'function') updateAngerEffect();
    if (typeof updateHappyEffect === 'function') updateHappyEffect();
    if (typeof updateSadEffect === 'function') updateSadEffect();
    
    // 花草摆动
    flowers.forEach((f, i) => {
        f.rotation.y = Math.sin(Date.now() * 0.001 + i) * 0.1;
    });
    
    // 草的微风效果
    scene.traverse(obj => {
        if (obj.userData && obj.userData.swayPhase !== undefined) {
            obj.rotation.z = Math.sin(Date.now() * 0.001 + obj.userData.swayPhase) * 0.08;
        }
    });

    renderer.render(scene, camera);
}

// 页面加载完成后初始化
window.addEventListener('load', init);

function saveImage() {
    // 临时禁用控制器，避免在截图时交互
    controls.enabled = false;
    
    // 保存当前渲染状态
    const originalAutoClear = renderer.autoClear;
    const originalClearColor = renderer.getClearColor(new THREE.Color());
    
    // 确保渲染器完成当前帧
    renderer.autoClear = true;
    renderer.clear();
    
    // 渲染当前帧
    renderer.render(scene, camera);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = '情绪小屋-' + currentEmotion + '-' + new Date().getTime() + '.png';
    
    try {
        // 使用toDataURL获取图片数据
        link.href = renderer.domElement.toDataURL('image/png');
        
        // 使用setTimeout确保渲染完成后再触发下载
        setTimeout(() => {
            link.click();
            
            // 恢复控制器状态
            controls.enabled = true;
            renderer.autoClear = originalAutoClear;
            renderer.setClearColor(originalClearColor);
            
            console.log('图片保存成功，当前情绪状态保持：', currentEmotion);
        }, 100);
        
    } catch (error) {
        console.error('保存图片失败:', error);
        
        // 出错时也要恢复状态
        controls.enabled = true;
        renderer.autoClear = originalAutoClear;
        renderer.setClearColor(originalClearColor);
    }
}
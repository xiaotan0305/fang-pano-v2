/**
 * Created by Shirlman on 12/15/2016.
 */

const PanoramaControls = require('./panoCtrl.js');

var ossHost = "http://vrhouse.oss-cn-shanghai.aliyuncs.com/";
ossHost = "./house/22544f76-25cf-42db-aa44-53f309567dcf/";
var domain = "http://vrhouse.oss-cn-shanghai.aliyuncs.com/";
domain = './house/';
// domain = 'http://ocnvj4kt8.bkt.clouddn.com/'

var stats, openStats = false;
var raycaster, mouse;
var scene, camera, renderer, textureLoader, background;
var sceneOrtho, cameraOrtho;
var mapGroup, buttonGroup, sectorSprite, hotSpotNameTag, mouseHoverObj;
var hotSpotGroup, houseShapeSprite, mapBgSprite, buttonGroupBgSprite;
var mapWidth, mapHeight, mapScale, buttongGroupBgHeight;
var zoomSpeed, isZooming, targetZoomFov;
var switchTime, switchSpeed = new THREE.Vector3(), rotationSpeed = new THREE.Vector3(), isSwitching,
    previousCameraRotation;
var is3DPrepared = false;
var isDebugMode = false;
var isMouseDown = false;
var lastSectorSpriteRotation;
var debugTextValue = "";
var switch2D3DButton, switch2DButton, switch3DButton, switchAutoButton, fullScreen3DHouseButton, is3DMode, isAutoButtonPressed = true, isAutoRotate = false;
var firstCubProgress = [];
var SCREEN_WIDTH, SCREEN_HEIGHT;
var sceneSmallHouse, cameraSmallHouse, smallHouseObj, smallBackground;
var hotSpotScale, hotSpotDistance, hotSpotDirection, hotSpotNameDirection, hotSpotNameDistance;
var container = document.getElementById('vr_house_container');

// const string
var overViewHotSpotNameSuffix = "_overViewHotSpotName";
var hotSpotNameSuffix = "_hotSpotName";
var hotSpotLineName = "_hotSpotLine";

var house, houseObj;
var houseSize;
var logoPlane;

var clickableObjects = [];
var clickableObjects2D = [];
var allRooms = [];
var allHotSpots = [];

var overviewCameraController, panoramaCameraController;
var isOverview = true;
var skyBox;
var isOnlyPanoramaView = false;

var previousCameraPosition;
var isPhone;

var defaultFov = 100;
var vrModeFov = 93;

var zoomInDiv = document.getElementById("zoomInDiv");
var zoomOutDiv = document.getElementById("zoomOutDiv");
var switchToOverviewDiv = document.getElementById("switchToOverviewDiv");
var switchToHotSpotViewDiv = document.getElementById('switchToHotSpotViewDiv');
var switchVRButton = document.getElementById("switchVRButton");
var switchFullscreenButton = document.getElementById("switchFullscreenButton");
var enterHotSpotTip = document.getElementById("enterHotSpotTip");
var vrStartTip = document.getElementById("vrStartTip");
var debugText = document.getElementById("debugText");

var houseScale = 1;

var isFirstEnterHotSpotView = true;
var isHotSpotClickble = true;
var clickedHotSpot, lastClickedHotSpot;

var mouseDownTime;
var mouseDownObject;

var totalRoomFaceCount = 0;
var totalPanoramaImageCount;

// control
var isOverviewAutoRotate = true;
var isFullscreen = false;
var autoRotateTimer;
var autoPlayTimer;

// web VR
//Apply VR headset positional data to camera.
var vrControls, vrEffect;
var crosshair;
var isVREnabled = false;
var isEnableVRMode = false;
var vrGazeTimer;
var previousVRIntersectObj;
var emulateVRControl = false; // test

var isShowThumbnail = false;
var isSingleMode = false;

// user
var houseId, rootPathPanoTile, rootPathPanoBlur;

if (isWebglSupport()) {
    getHouseViewData();
} else {
    var browser = getBrowser();
    var tip = "您的浏览器不支持VR看房，当前浏览器版本是：" + browser.name + " " + browser.version + "<br/>"
        + "请使用以下浏览器：<br/>IE11、IE Edge、Firefox48+、Chrome50+、Safari9+、猎豹浏览器、360浏览器、UC浏览器<br/>"
        + checkIsPhone() ? "请升级您的浏览器版本" : "请使用win7以上的系统";

    document.getElementById("loading_tip").innerHTML = tip;
}

function isWebglSupport() {
    try {
        var canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function getBrowser() {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR|Edge\/(\d+)/)
        if (tem != null) {
            return { name: 'Opera', version: tem[1] };
        }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
        M.splice(1, 1, tem[1]);
    }
    return {
        name: M[0],
        version: M[1]
    };
}

function getHouseViewData() {
    houseId = getParameterByName("hid");
    houseId = '22544f76-25cf-42db-aa44-53f309567dcf';
    // houseId = 'pano';
    rootPathPanoTile = domain + houseId + "/PanoramaTileImages/";
    rootPathPanoBlur = domain + houseId + "/PanoramaBlurTileImages/";
    var viewMode = getParameterByName("mode");
    if (isDebugMode) {
        debugText.style.visibility = "visible";
        debugLog(debugText.style.visibility);
    }

    if (viewMode == "single") {
        isShowThumbnail = true;
        isSingleMode = true;
    }

    var url = './house/ViewData.txt';
    function ajax(method, url, data, callback) {
        var r = new XMLHttpRequest();
        r.open(method, url);
        r.send(JSON.stringify(data));
        r.onreadystatechange = function (a, b) {
            if (this.readyState === 4 && this.status === 200) {
                callback && callback(this.responseText);
            } else if (this.status !== 200) {
                callback && callback(null);
            }
        }
    }
    ajax('get', url, '', function (data) {
        if (data !== null) {
            house = JSON.parse(data);
            document.title = house.Name + "(极速版)";
            if (isSingleMode) {
                if (house.HotSpots.length == 0) {
                    document.getElementById("loading_tip").innerHTML = "没有全景图片";
                } else {
                    initPanoramaHouse();
                }
            } else {
                init3DHouse();
            }
        }else {
            document.getElementById("loading_tip").innerHTML = "您要浏览的房子不存在";
        }
    })
    // $.ajax({
    //     url: url,
    //     type: "GET",
    //     success: function (data) {
    //         house = JSON.parse(data);

    //         document.title = house.Name + "(极速版)";

    //         if (isSingleMode) {
    //             if (house.HotSpots.length == 0) {
    //                 $("#loading_tip").text("没有全景图片");
    //             } else {
    //                 initPanoramaHouse();
    //             }
    //         } else {
    //             init3DHouse();
    //         }
    //     },
    //     error: function (e) {
    //         if (e.status == "404") {
    //             $("#loading_tip").text("您要浏览的房子不存在");
    //         }
    //     }
    // });
}

function initPanoramaHouse() {
    isOverview = false;
    isOnlyPanoramaView = true;

    initThreejs();
    initPanoramaView();
    initVRCrosshair();

    if (!isSingleMode) {
        createHotSpots();
    }

    registerEventListener();
    showFirstHotSpot();

    initClickEvent();
}

function init3DHouse() {
    initThreejs();

    initLight();
    initPanoramaView();

    initVRCrosshair();
    //initAxis();
    createHouse();

    // initGround();
    createHotSpots();
    //    preLoadPanoramaImages();
    registerEventListener();

    var isLandscape = isLandscapeOrNot();
    debugLog("init3DHouse,isLandscape: " + isLandscape);
    setOverviewCameraControllerDistance(isLandscape);
    setDefaultCameraPosition(isLandscape);
    showFirstHotSpotAfterLoading();

    initClickEvent();
}

function initThreejs() {
    mapWidth = mapHeight = 425;
    buttongGroupBgHeight = 30;
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    isPhone = checkIsPhone();

    textureLoader = new THREE.TextureLoader();
    // textureLoader.setCrossOrigin(ossHost);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene = new THREE.Scene();
    // scene.fog = new THREE.Fog( 0x2b2b2b, 5000, 8000 );

    // skybox
    var bgGeometry = new THREE.SphereBufferGeometry(3000, 1, 1);
    var bgMaterial = new THREE.MeshPhongMaterial({
        color: 0x3c3f41,
        specular: 0x111111,
        side: THREE.BackSide
    });
    background = new THREE.Mesh(bgGeometry, bgMaterial);
    scene.add(background);

    // 3D camera
    camera = new THREE.PerspectiveCamera(defaultFov, SCREEN_WIDTH / SCREEN_HEIGHT, 0.5, 100000);
    camera.rotation.reorder("YXZ");
    scene.add(camera);
    isSwitching = false;
    switchTime = 2;

    if (!isSingleMode) {

        // camera SmallHouse
        sceneSmallHouse = new THREE.Scene();
        sceneSmallHouse.visible = false;
        // 通过Fov来控制smallHouseObj的大小，值越大，视野越大，房子越小
        cameraSmallHouse = new THREE.PerspectiveCamera(35, mapWidth / mapHeight, 0.5, 100000);
        cameraSmallHouse.rotation.reorder("YXZ");
        cameraSmallHouse.position.z = 1;
        // var smallBgGeometry = new THREE.SphereBufferGeometry(2, 1, 1);
        // var smallBgMaterial = new THREE.MeshPhongMaterial({
        //     color: 0x3c3f41,
        //     specular: 0x111111,
        //     side: THREE.BackSide,
        //     opacity: 0.5
        // });
        // smallBackground = new THREE.Mesh(smallBgGeometry, smallBgMaterial);
        // sceneSmallHouse.add(smallBackground);

        // init 2D
        sceneOrtho = new THREE.Scene();
        sceneOrtho.visible = false;
        cameraOrtho = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, 1, 10);
        cameraOrtho.position.z = 10;

        // init map
        mapGroup = new THREE.Group();
        sceneOrtho.add(mapGroup);

        buttonGroup = new THREE.Group();
        sceneOrtho.add(buttonGroup);
    }

    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.antialias = true;
    renderer.sortObjects = false;
    renderer.setPixelRatio(isPhone ? 4 : 2); // 解决手机上图片模糊的问题
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    //        renderer.shadowMap.enabled = true;
    //     scene.background = new THREE.Color( 0x2b2b2b );
    renderer.autoClear = false; // To allow render overlay on top of sprited sphere
    container.appendChild(renderer.domElement);

    if (openStats) {
        stats = new Stats();
        container.appendChild(stats.dom);
    }

    // web VR
    vrControls = new THREE.VRControls(camera);
    vrEffect = new THREE.StereoEffect(renderer);
    vrEffect.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    //        vrEffect.setFullScreen( true );

    initCameraControl();

    render();
}

function initMap() {
    smallHouseObj.rotation.x = 0.5;
    hotSpotScale = 0.7;
    hotSpotDistance = -30;
    hotSpotDirection = -0.5;
    hotSpotNameDirection = -38 / 13;
    hotSpotNameDistance = 13;
    var houseShapePath = domain + houseId + "/FloorPlans/" + houseId + ".png";

    textureLoader.load(houseShapePath, createHUDSprites);

    hotSpotGroup = new THREE.Group();
    hotSpotGroup.visible = false;
    mapGroup.add(hotSpotGroup);

    hotSpotNameTag = createTextSprite("",
        { fontsize: 50, backgroundColor: { r: 0, g: 0, b: 0, a: 0.498039 }, cornerAngle: 12 });
    hotSpotNameTag.scale.set(210, 30, 1);
    hotSpotNameTag.visible = false;
    hotSpotGroup.add(hotSpotNameTag);
}

function createHUDSprites(texture) {
    //和cameraSmallHouse.position.z的距离配合使不被其他东西挡住
    var factor = 500 / Math.max(houseSize.x, houseSize.z);
    var samllHouseScale = factor * 0.0011;
    smallHouseObj.scale.set(samllHouseScale, samllHouseScale, samllHouseScale);

    var hotSpotGroupScale = factor * 1.1;
    hotSpotGroup.scale.set(hotSpotGroupScale, hotSpotGroupScale, hotSpotGroupScale);

    // var fullScreenTexture = textureLoader.load("./src/textures/fullScreen.png");
    // var fullScreenMaterial = new THREE.SpriteMaterial({map: fullScreenTexture});
    // fullScreen3DHouseButton = new THREE.Sprite(fullScreenMaterial);
    // fullScreen3DHouseButton.scale.set(25, 25, 1);
    // fullScreen3DHouseButton.visible = false;
    // register2DClickEvent(fullScreen3DHouseButton, onSwitchToOverviewClicked);
    // buttonGroup.add(fullScreen3DHouseButton);
    textureLoader.load("./src/textures/button_Auto.png");
    textureLoader.load("./src/textures/button_2D_pressed.png");
    textureLoader.load("./src/textures/button_3D_pressed.png");
    var switchAutoButtonTexture = textureLoader.load("./src/textures/button_Auto_pressed.png");
    var switchAutoButtonMaterial = new THREE.SpriteMaterial({ map: switchAutoButtonTexture });
    switchAutoButton = new THREE.Sprite(switchAutoButtonMaterial);
    switchAutoButton.scale.set(50, 25, 1);
    register2DClickEvent(switchAutoButton, onSwitchAutoButtonClicked);
    buttonGroup.add(switchAutoButton);

    var switch2DButtonTexture = textureLoader.load("./src/textures/button_2D.png");
    var switch2DButtonMaterial = new THREE.SpriteMaterial({ map: switch2DButtonTexture });
    switch2DButton = new THREE.Sprite(switch2DButtonMaterial);
    switch2DButton.scale.set(40, 25, 1);
    register2DClickEvent(switch2DButton, onSwitch2DButtonClicked);
    buttonGroup.add(switch2DButton);

    var switch3DButtonTexture = textureLoader.load("./src/textures/button_3D.png");
    var switch3DButtonMaterial = new THREE.SpriteMaterial({ map: switch3DButtonTexture });
    switch3DButton = new THREE.Sprite(switch3DButtonMaterial);
    switch3DButton.scale.set(40, 25, 1);
    register2DClickEvent(switch3DButton, onSwitch3DButtonClicked);
    buttonGroup.add(switch3DButton);

    // switch2D3DButton = createTextSprite("2D", {fontsize: 50, backgroundColor: {r: 0, g: 0, b: 0, a: 0.498039}, cornerAngle: 12});
    // switch2D3DButton.scale.set(180, 25, 1);
    // register2DClickEvent(switch2D3DButton, onSwitch2D3DButtonClicked);
    // buttonGroup.add(switch2D3DButton);

    var sectorTexture = textureLoader.load("./src/textures/sector.png");
    var sectorMaterial = new THREE.SpriteMaterial({ map: sectorTexture });
    sectorSprite = new THREE.Sprite(sectorMaterial);
    sectorSprite.scale.set(100, 100, 1);
    sectorSprite.material.opacity = 0.5;
    hotSpotGroup.add(sectorSprite);
    lastSectorSpriteRotation = camera.rotation.y;

    var hotSpotTexture = textureLoader.load("./src/textures/hotSpotPoint.png");
    var hotSpotMaterial = new THREE.SpriteMaterial({ map: hotSpotTexture });
    for (var index in allHotSpots) {
        var hotSpot = allHotSpots[index].tag;
        var hotSpotSprite = new THREE.Sprite(hotSpotMaterial);
        hotSpotSprite.tag = hotSpot;
        hotSpotSprite.name = allHotSpots[index].tagName;
        hotSpotSprite.material.opacity = 0.7;
        hotSpotSprite.scale.set(30, 30, 1);
        hotSpotSprite.position.set(allHotSpots[index].position.x * hotSpotScale, -allHotSpots[index].position.z * hotSpotScale, 1);
        hotSpot.floorPlanPosition = hotSpotSprite.position.clone();
        register2DClickEvent(hotSpotSprite, function (hotSpotObj) {
            onThumbnailClicked(hotSpotObj.tag.thumbnailElement, true);
        });
        // hotSpotSprite.visible = false;
        hotSpotGroup.add(hotSpotSprite);
    }
    // hotSpotGroup.rotation.z = 0.775;

    var houseShapeMaterial = new THREE.SpriteMaterial({ map: texture });
    houseShapeSprite = new THREE.Sprite(houseShapeMaterial);
    var houseShapeScale = factor * 0.8;
    houseShapeSprite.scale.set(houseSize.x * houseShapeScale, houseSize.z * houseShapeScale, 1);
    houseShapeSprite.material.opacity = 0.9;
    houseShapeSprite.visible = false;
    mapGroup.add(houseShapeSprite);

    var bgTexture = textureLoader.load("./src/textures/bg.png", function () {
        sceneOrtho.visible = true;
        for (var roomIndex in house.Rooms) {
            var room = house.Rooms[roomIndex];
            for (var faceIndex in room.RoomFaces) {
                var roomFace = room.RoomFaces[faceIndex];
                loadFaceTexture(roomFace, houseObj.children[roomIndex], smallHouseObj.children[roomIndex]);
            }
        }
    });

    var buttonGroupBgMaterial = new THREE.SpriteMaterial({ map: bgTexture });
    buttonGroupBgSprite = new THREE.Sprite(buttonGroupBgMaterial);
    buttonGroupBgSprite.material.opacity = 0.5;
    buttonGroupBgSprite.material.color = 0xffffff;
    buttonGroupBgSprite.scale.set(mapWidth, buttongGroupBgHeight, 1);
    buttonGroup.add(buttonGroupBgSprite);
    var material = new THREE.SpriteMaterial({ map: bgTexture });
    mapBgSprite = new THREE.Sprite(material);
    mapBgSprite.material.opacity = 0.5;
    mapBgSprite.material.color = 0x000000;
    mapBgSprite.scale.set(mapWidth, mapHeight, 1);
    register2DClickEvent(mapBgSprite, onSwitchToOverviewClicked);
    mapGroup.add(mapBgSprite);

    updateHUDSprites();
    for (var index in allHotSpots) {
        if (allHotSpots[index].tag == clickedHotSpot) {
            hotSpotNameTag.position.set(allHotSpots[index].tag.floorPlanPosition.x + hotSpotNameDistance, allHotSpots[index].tag.floorPlanPosition.y + hotSpotNameDistance * hotSpotNameDirection, 1);
            updateTextSprite(hotSpotNameTag, allHotSpots[index].tag.Name.split("-")[0]);
            sectorSprite.position.set(allHotSpots[index].position.x * hotSpotScale, -allHotSpots[index].position.z * hotSpotScale, 1);
            break;
        }
    }
    switchToMap(true);
}

function updateHUDSprites() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    mapScale = SCREEN_WIDTH / mapWidth * 0.4;
    if (SCREEN_WIDTH > SCREEN_HEIGHT) {
        mapScale = SCREEN_HEIGHT / mapHeight * 0.4;
    }

    mapGroup.scale.set(mapScale, mapScale, 1);
    // buttonGroup.scale.set(mapScale, mapScale, 1);
    mapGroup.position.set((-SCREEN_WIDTH + mapWidth * mapScale) / 2, (SCREEN_HEIGHT - mapHeight * mapScale) / 2, 1);
    if (buttonGroupBgSprite != undefined) {
        buttonGroupBgSprite.scale.set(mapWidth * mapScale, buttongGroupBgHeight, 1);
        switch3DButton.position.set((mapWidth * mapScale - 25 - 20) / 2, 0, 1);
        switch2DButton.position.set(switch3DButton.position.x - 45, 0, 1);
        switchAutoButton.position.set(switch2DButton.position.x - 50, 0, 1);
    }
    buttonGroup.position.set((-SCREEN_WIDTH + mapWidth * mapScale) / 2, SCREEN_HEIGHT / 2 - mapHeight * mapScale - buttongGroupBgHeight / 2 - 0.5, 1);
}

function checkIsPhone() {
    var sUserAgent = navigator.userAgent.toLowerCase();
    var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
    var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
    var bIsMidp = sUserAgent.match(/midp/i) == "midp";
    var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
    var bIsAndroid = sUserAgent.match(/android/i) == "android";
    var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
    var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";

    var isPhone = bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM;

    return isPhone;
}

// function checkIsIOS() {
//     var sUserAgent = navigator.userAgent.toLowerCase();
//     var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
//     var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
//
//     var isIOS = bIsIpad || bIsIphoneOs;
//     debugLog("checkIsIOS:" + isIOS);
//     return isIOS;
// }

function render() {
    if (SCREEN_WIDTH != window.innerWidth || SCREEN_HEIGHT != window.innerHeight) {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        debugLog("R_SCREEN_WIDTH:" + SCREEN_WIDTH);
        debugLog("R_SCREEN_HEIGHT" + SCREEN_HEIGHT);
        resizeWindow();
    }
    if (openStats) {
        stats.update();
    }

    cameraZoomAnimation();

    //Leo matterport way
    // cameraSwitchAnimation();
    //Leo end

    // camera.position.x += 0.1;
    camera.updateProjectionMatrix();

    requestAnimationFrame(render);

    for (var index in allHotSpots) {
        allHotSpots[index].rotation.y = camera.rotation.y;
    }
    if (smallHouseObj != undefined && sceneSmallHouse.visible) {
        if (isAutoRotate) {
            smallHouseObj.rotation.y -= 0.0025;
        }
        else {
            smallHouseObj.rotation.y = -camera.rotation.y;
        }
        // smallHouseObj.rotation.x = -camera.rotation.x;
    }
    if (houseShapeSprite) {
        if (lastSectorSpriteRotation != camera.rotation.y && isAutoButtonPressed && !isOverview) {
            lastSectorSpriteRotation = camera.rotation.y;
            // console.log("lastSectorSpriteRotation != camera.rotation.y. StopAutoPlay");
            stopAutoPlay();
            starAutoPlayDelay();
            switchToMap(true);
        }
        if (houseShapeSprite.visible) {
            sectorSprite.material.rotation = camera.rotation.y - 0.6;
            raycaster.setFromCamera(mouse, cameraOrtho);
            var intersects = raycaster.intersectObjects(clickableObjects2D);
            if (intersects.length > 0 && intersects[0].object.tag != undefined) {
                mouseHoverObj = intersects[0].object;
                hotSpotNameTag.position.set(mouseHoverObj.position.x + hotSpotNameDistance, mouseHoverObj.position.y + hotSpotNameDistance * hotSpotNameDirection, 1);
                updateTextSprite(hotSpotNameTag, mouseHoverObj.name);
            }
            else {
                if (clickedHotSpot != undefined) {
                    hotSpotNameTag.position.set(clickedHotSpot.floorPlanPosition.x + hotSpotNameDistance, clickedHotSpot.floorPlanPosition.y + hotSpotNameDistance * hotSpotNameDirection, 1);
                    updateTextSprite(hotSpotNameTag, clickedHotSpot.Name.split("-")[0]);
                }
            }
        }
    }
    // logoPlane.rotation.z = camera.rotation.y - panoramaSphere.rotation.y;

    renderer.clear();
    renderer.clearDepth();

    if (isEnableVRMode) {

        if (!emulateVRControl) {
            vrControls.update();
        }

        if (isVREnabled) {
            vrEffect.render(scene, camera);
            checkVRIntersect();
        } else {
            renderCamera();
        }
    } else {
        renderCamera();
        if (overviewCameraController.enabled) {
            overviewCameraController.update();
        }
    }
}

function renderCamera() {
    if (!isSingleMode) {
        renderer.setViewport(0, SCREEN_HEIGHT - mapHeight * mapScale, mapWidth * mapScale, mapHeight * mapScale);
        renderer.render(sceneSmallHouse, cameraSmallHouse);
        renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.render(scene, camera);
        renderer.render(sceneOrtho, cameraOrtho);
    }
    else {
        renderer.render(scene, camera);
    }
}

function initVRCrosshair() {
    crosshair = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.04, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.5,
            transparent: true
        })
    );

    crosshair.visible = false;
    crosshair.position.z = -2;
    camera.add(crosshair);
}

function showAllRooms(show) {
    for (var index in allRooms) {
        allRooms[index].visible = show;
    }

    if (show && isShowThumbnail) {
        var thumbnailList = $("#thumbnail-list").children("#thumbnail");

        for (var index in thumbnailList) {
            if (thumbnailList[index].thumbnailData.isSelected) {
                thumbnailList[index].onclick();
                break;
            }
        }
    }
}

function initLight() {
    // lights
    var light;
    scene.add(new THREE.AmbientLight(0x666666));
    light = new THREE.DirectionalLight(0xdfebff, 0.3);
    light.position.set(0, 200, 0);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    var d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    scene.add(light);

    // var smallLight = light.clone();
    // sceneSmallHouse.add(new THREE.AmbientLight(0x666666));
    // sceneSmallHouse.add(smallLight);
}

function initCameraControl() {
    isZooming = false;
    zoomSpeed = 2.5;
    // controls
    overviewCameraController = new THREE.OrbitControls(camera, renderer.domElement);
    overviewCameraController.maxPolarAngle = THREE.Math.degToRad(90);
    overviewCameraController.minPolarAngle = THREE.Math.degToRad(10);
    overviewCameraController.autoRotate = isOverviewAutoRotate;
    overviewCameraController.autoRotateSpeed = 1;
    overviewCameraController.zoomSpeed = 0.5;
    overviewCameraController.enableDamping = true;
    overviewCameraController.dampingFactor = 0.8;

    panoramaCameraController = new PanoramaControls(camera, renderer.domElement);
    panoramaCameraController.enabled = false;
}

function initPanoramaView() {
    var materials = [];

    for (var i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({ side: THREE.BackSide }));
    }

    skyBox = new THREE.Mesh(new THREE.CubeGeometry(5000, 5000, 5000), new THREE.MultiMaterial(materials));
    skyBox.visible = false;
    background.visible = true;

    var logoSize = 300;
    var texture = textureLoader.load('./src/textures/logo.png');
    texture.minFilter = THREE.NearestFilter;
    var planeGeometry = new THREE.PlaneBufferGeometry(logoSize, logoSize, 1, 1);
    var planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    logoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    logoPlane.rotation.x = THREE.Math.degToRad(270);
    logoPlane.position.y = -400;

    //        registerClickEvent(logoPlane, onSwitchToOverviewClicked);

    skyBox.add(logoPlane);
    scene.add(skyBox);
}

function createHotSpots() {
    var texture = textureLoader.load('./src/textures/hotspot/feet.png');
    var spriteTexture = textureLoader.load("./src/textures/hotspot_sprite.png");

    texture.minFilter = THREE.NearestFilter;
    var planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var lightMeshHeight = 70;
    var lightRadius = 12;
    var hotSpotNameHeight = 40;
    var deltaHeight = -house.CameraHeight + 4.5;

    var lightTexture = textureLoader.load('./src/textures/hotspot/light.png');
    lightTexture.minFilter = THREE.NearestFilter;
    var lightGeometry = new THREE.CylinderGeometry(lightRadius, lightRadius, lightMeshHeight, 30, 1, true);
    var lightMaterial = new THREE.MeshBasicMaterial({
        map: lightTexture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    var hotSpotNames = [];

    for (var hotSpotIndex in house.HotSpots) {
        var hotSpot = house.HotSpots[hotSpotIndex];

        var hotSpotObj = new THREE.Group();
        var hotSpotPosition = new THREE.Vector3(hotSpot.Position.x, hotSpot.Position.y + deltaHeight, -hotSpot.Position.z);
        hotSpotObj.position.copy(hotSpotPosition);
        scene.add(hotSpotObj);
        allHotSpots.push(hotSpotObj);
        hotSpot.gameObject = hotSpotObj;
        hotSpotObj.tag = hotSpot;

        var hotSpotName = hotSpot.Name;

        if (hotSpot.Type == "Door" && hotSpot.Name.split("-").length > 2) {
            hotSpotName = hotSpot.Name.substring(0, hotSpot.Name.lastIndexOf('-'));
        }

        if (hotSpot.Type == "Room" && hotSpot.Name.split("-").length > 1) {
            hotSpotName = hotSpot.Name.split("-")[0];
        }

        hotSpotObj.tagName = hotSpotName;

        // TODO, 临时标二楼代码
        hotSpot.IsSecondFloor = hotSpot.Position.y > 100;

        // draw light
        var lightObj = new THREE.Mesh(lightGeometry, lightMaterial);
        hotSpotObj.add(lightObj);
        hotSpotObj.lightObj = lightObj;
        lightObj.position.set(0, lightMeshHeight / 2, 0);
        lightObj.name = hotSpot.Name;

        registerClickEvent(lightObj, function (lightObj) {
            onThumbnailClicked(lightObj.parent.tag.thumbnailElement, true);
        });

        // draw clickableGroup
        var clickableGroupMaterial = new THREE.SpriteMaterial({ opacity: 0 });
        var clickableGroup = new THREE.Sprite(clickableGroupMaterial);

        hotSpotObj.add(clickableGroup);
        hotSpotObj.clickableGroup = clickableGroup;
        clickableGroup.position.set(0, lightObj.position.y, 0);
        // registerClickEvent(clickableGroup, function (clickableGroup) {
        //     onThumbnailClicked(clickableGroup.parent.tag.thumbnailElement, true);
        // });

        // draw sprite
        var circleSprite = createHotSpotSprite(spriteTexture, hotSpotPosition);
        clickableGroup.add(circleSprite);
        circleSprite.position.set(0, 0, 0);
        circleSprite.visible = false;
        hotSpotObj.circleSprite = circleSprite;

        // draw feet
        var planeGeometry = new THREE.PlaneBufferGeometry(12, 12, 1, 1);
        var feetPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        feetPlane.rotation.x = THREE.Math.degToRad(270);
        feetPlane.position.y = -lightMeshHeight / 2;
        lightObj.add(feetPlane);

        if (hotSpotName.split('-').length > 1 || contains(hotSpotNames, hotSpotName)) {
            continue;
        }

        // draw hot spot name
        var hotSpotNameSprite = createTextSprite(hotSpotName,
            { fontsize: 50, backgroundColor: { r: 0, g: 0, b: 0, a: 0.498039 }, cornerAngle: 12 });
        clickableGroup.add(hotSpotNameSprite);
        hotSpotNameSprite.y = 6;
        hotSpotNameSprite.position.set(0, hotSpotNameSprite.y, 0);
        hotSpotNameSprite.name = hotSpot.Name + hotSpotNameSuffix;
        hotSpotNameSprite.visible = false;
        hotSpotObj.hotSpotNameSprite = hotSpotNameSprite;
        hotSpotNames.push(hotSpotName);

        registerClickEvent(hotSpotNameSprite, function (hotSpotNameSprite) {
            onThumbnailClicked(hotSpotNameSprite.parent.parent.tag.thumbnailElement, true);
        });

        // draw overview hot spot name
        var overviewHotSpotNameSprite = createTextSprite(hotSpotName,
            { fontsize: 250, backgroundColor: { r: 0, g: 0, b: 0, a: 0.498039 }, cornerAngle: 40 });
        hotSpotObj.add(overviewHotSpotNameSprite);
        overviewHotSpotNameSprite.position.set(0, lightObj.position.y + hotSpotNameHeight, 0);
        overviewHotSpotNameSprite.name = hotSpot.Name + overViewHotSpotNameSuffix;
        hotSpotObj.overviewHotSpotNameSprite = overviewHotSpotNameSprite;
        registerClickEvent(overviewHotSpotNameSprite, onHotSpotNameClicked);

        // draw line
        var material = new THREE.LineBasicMaterial({
            color: 0x008000, linewidth: 1
        });

        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, feetPlane.position.y, 0),
            new THREE.Vector3(0, lightObj.position.y - 7)
        );

        var line = new THREE.Line(geometry, material);
        line.name = hotSpotLineName;
        hotSpotObj.nameLine = line;
        lightObj.add(line);
    }
}

function resizeWindow() {
    debugLog("resizeWindow");
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    debugLog("SCREEN_WIDTH:" + SCREEN_WIDTH);
    debugLog("SCREEN_HEIGHT" + SCREEN_HEIGHT);

    // renderer.setSize(SCREEN_WIDTH, SCREEN_WIDTH);
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    if (!isSingleMode) {
        cameraSmallHouse.aspect = mapWidth / mapHeight;
        cameraSmallHouse.updateProjectionMatrix();

        cameraOrtho.left = -SCREEN_WIDTH / 2;
        cameraOrtho.right = SCREEN_WIDTH / 2;
        cameraOrtho.top = SCREEN_HEIGHT / 2;
        cameraOrtho.bottom = -SCREEN_HEIGHT / 2;
        cameraOrtho.updateProjectionMatrix();

        updateHUDSprites();
    }

    if (isVREnabled) {
        vrEffect.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    }
}

// function onWindowResize() {
// if (!checkIsIOS()) {
//     resizeWindow();
// }
// }

function registerEventListener() {
    renderer.domElement.addEventListener('touchstart', eventHandler, false);
    renderer.domElement.addEventListener('touchend', eventHandler, false);
    renderer.domElement.addEventListener('mousedown', eventHandler, false);
    renderer.domElement.addEventListener('mouseup', eventHandler, false);

    window.addEventListener('mousemove', onMouseMove, false);

    // window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('orientationchange', onOrientionChangeDelay, false);
}

function onOrientionChangeDelay() {
    debugLog("onOrientionChangeDelay");
    // if (checkIsIOS()) {
    //     renderer.setSize(1, 1);
    //
    //     setTimeout(resizeWindow, 5);
    // }

    onOrientionChange();
}

function onOrientionChange(event) {
    var isLandscape = isLandscapeOrNot();

    debugLog("onOrientionChange,isLandscape: " + isLandscape);
    if (isLandscape == undefined) {
        return;
    }

    // update camera controller distance
    setOverviewCameraControllerDistance(isLandscape);

    if (isEnableVRMode) {
        if (isLandscape) {
            if (!isVREnabled) {
                switchVRMode(true);
            }
        } else {
            if (isVREnabled) {
                switchVRMode(false);
            }
        }
    }

    var thumbnailList = document.getElementById("thumbnail-list");

    if (isLandscape) {
        for (var index in thumbnailList.children) {
            thumbnailList.children[index].classList.remove("col-xs-3");
            thumbnailList.children[index].classList.add("col-xs-2");
        }
    } else {
        for (var index in thumbnailList.children) {
            thumbnailList.children[index].classList.remove("col-xs-2");
            thumbnailList.children[index].classList.add("col-xs-3");
        }
    }
}

function isLandscapeOrNot() {
    var isLandscape;

    if (window.orientation == 180 || window.orientation == 0) {
        isLandscape = false;
    } else if (window.orientation == 90 || window.orientation == -90) {
        isLandscape = true;
    }

    return isLandscape;
}

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    // console.log(mouse.x + " " + mouse.y);
}

function eventHandler(event) {
    if (event.type == 'touchstart' || event.type == 'mousedown') {
        mouseDownTime = new Date().getTime();
        isMouseDown = true;
        if (!isSingleMode) {
            mouseDownObject = getIntersectObj(event);
        }
        if (isOverview) {
            overviewCameraController.autoRotate = false;
        } else {
            // stopAutoPlay();
            // switchToMap(true);
        }
    } else if (event.type == 'touchend' || event.type == 'mouseup') {
        isMouseDown = false;
        if (new Date().getTime() - mouseDownTime < 200 && !isSingleMode) {
            var mouseUpObject = getIntersectObj(event);

            if (mouseUpObject == mouseDownObject && mouseDownObject != undefined) {
                mouseDownObject.onClick(mouseDownObject);
            }
        }
        if (isOverview) {
            if (autoRotateTimer != undefined) {
                clearTimeout(autoRotateTimer);
            }

            autoRotateTimer = setTimeout(function () {
                overviewCameraController.autoRotate = isOverviewAutoRotate;
            }, 3000);
        } else {
            if (!isAutoRotate && isAutoButtonPressed) {
                // stopAutoPlay();
                starAutoPlayDelay();
            }
        }
    }
}

function registerClickEvent(object, onClick) {
    clickableObjects.push(object);
    object.onClick = onClick;
}

function register2DClickEvent(object, onClick) {
    clickableObjects2D.push(object);
    object.onClick = onClick;
}

function getIntersectObj(event) {
    var inetsectObject;

    event.preventDefault();
    var x, y;

    if (event.type == 'touchstart') {
        x = event.touches[0].pageX;
        y = event.touches[0].pageY;
    } else if (event.type == 'touchend') {
        x = event.changedTouches[0].pageX;
        y = event.changedTouches[0].pageY;
    }
    else {
        x = event.clientX;
        y = event.clientY;
    }
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(y / renderer.domElement.clientHeight) * 2 + 1;

    //check 2D intersects first
    raycaster.setFromCamera(mouse, cameraOrtho);
    var intersects = raycaster.intersectObjects(clickableObjects2D);

    if (intersects.length > 0 && sceneOrtho.visible && (houseShapeSprite.visible && intersects[0].object.tag != undefined || intersects[0].object.tag == undefined)) {
        inetsectObject = intersects[0].object;
    }
    else {
        // if 2D intersects is empty then check 3D intersects
        raycaster.setFromCamera(mouse, camera);
        intersects = raycaster.intersectObjects(clickableObjects);
        if (intersects.length > 0) {
            inetsectObject = intersects[0].object;
        }
    }

    return inetsectObject;
}

function getVRIntersectObj() {
    var inetsectObject;

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    var intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        inetsectObject = intersects[0].object;
    }

    return inetsectObject;
}

function checkVRIntersect() {
    var intesectObject = getVRIntersectObj();

    if (previousVRIntersectObj != intesectObject) {

        if (vrGazeTimer != undefined) {
            clearTimeout(vrGazeTimer);
        }

        if (intesectObject != undefined) {

            vrGazeTimer = setTimeout(function () {
                intesectObject.onClick(intesectObject);
            }, 1500);
        }

        previousVRIntersectObj = intesectObject;
    }
}

function onSwitchToHotSpotViewClicked() {
    onThumbnailClicked(lastClickedHotSpot.thumbnailElement, true);
}

function onSwitchToOverviewClicked() {
    if (houseShapeSprite.visible) {
        return;
    }
    if (isAutoButtonPressed) {
        stopAutoPlay();
    }

    if (isShowThumbnail) {
        document.getElementById("thumbnail-controller").style.visibility = "visible";
    }
    else {
        document.getElementById("thumbnail-controller").style.visibility = "hidden";
        closeMap();
    }

    // switchToOverviewDiv.style.visibility = "hidden";
    switchToHotSpotViewDiv.style.visibility = 'visible';
    zoomInDiv.style.visibility = "hidden";
    zoomOutDiv.style.visibility = "hidden";
    enterHotSpotTip.style.visibility = "visible";
    switchVRButton.style.visibility = "hidden";

    //Leo matterport way
    // isSwitching = true;
    // var frameSpeed = 60;
    // switchSpeed.x = (previousCameraPosition.x - camera.position.x) / switchTime / frameSpeed;
    // switchSpeed.y = (previousCameraPosition.y - camera.position.y) / switchTime / frameSpeed;
    // switchSpeed.z = (previousCameraPosition.z - camera.position.z) / switchTime / frameSpeed;
    // rotationSpeed.x = (previousCameraRotation.x - camera.rotation.x) / switchTime / frameSpeed;
    // rotationSpeed.y = (previousCameraRotation.y - camera.rotation.y) / switchTime / frameSpeed;
    // rotationSpeed.z = (previousCameraRotation.z - camera.rotation.z) / switchTime / frameSpeed;
    //Leo end

    clickedHotSpot = null;
    camera.position.copy(previousCameraPosition);
    camera.fov = isVREnabled ? vrModeFov : 75;
    camera.updateProjectionMatrix();

    disposeSkyBoxTexture();

    showOverviewHotSpotNames(true);
    showOverviewHotSpot();

    for (var index in allHotSpots) {
        var scale = 1;
        allHotSpots[index].scale.set(scale, 1, scale);
    }

    //Leo matterport way
    // setTimeout(function () {
    //     overviewCameraController.enabled = true;
    //     overviewCameraController.autoRotate = isOverviewAutoRotate;
    //     overviewCameraController.update();
    // }, switchTime * 1000 + 500);
    //Leo end

    overviewCameraController.enabled = true;
    overviewCameraController.autoRotate = isOverviewAutoRotate;
    overviewCameraController.update();

    panoramaCameraController.enabled = false;
    skyBox.visible = false;
    background.visible = true;
    houseObj.visible = true;

    isHotSpotClickble = true;

    for (var index in allHotSpots) {
        allHotSpots[index].visible = true;
    }

    showAllRooms(true);

    isOverview = true;
}

function switchToHotSpotView() {
    document.getElementById("thumbnail-controller").style.visibility = "visible";
    // mapGroup.visible = true;
    switchToHotSpotViewDiv.style.visibility = 'hidden';
    zoomInDiv.style.visibility = "visible";
    zoomOutDiv.style.visibility = "visible";
    enterHotSpotTip.style.visibility = "hidden";
    switchVRButton.style.visibility = "visible";

    showOverviewHotSpotNames(false);

    for (var index in allHotSpots) {
        allHotSpots[index].visible = false;
    }

    overviewCameraController.enabled = false;
    overviewCameraController.autoRotate = false;
    panoramaCameraController.enabled = true;

    previousCameraPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    // previousCameraRotation = new THREE.Vector3(camera.rotation.x, camera.rotation.y, camera.rotation.z);

    camera.rotation.x = 0;

    skyBox.visible = true;
    background.visible = false;
    if (!isSingleMode && houseShapeSprite) {
        sceneOrtho.visible = true;
        switchToMap(houseShapeSprite.visible);
    }
    if (isAutoButtonPressed) {
        starAutoPlayDelay();
    }

    if (!isOnlyPanoramaView) {
        houseObj.visible = false;
        // switchToOverviewDiv.style.visibility = "visible";
    }

    showAllRooms(false);

    isOverview = false;
}

function showOverviewHotSpot() {
    for (var index in allHotSpots) {
        allHotSpots[index].lightObj.visible = true;
        allHotSpots[index].circleSprite.visible = false;
        allHotSpots[index].nameLine.visible = true;
    }
}

function showOverviewHotSpotNames(show) {
    for (var index in allHotSpots) {
        var overviewHotSpotName = allHotSpots[index].overviewHotSpotNameSprite;

        if (overviewHotSpotName != undefined) {
            overviewHotSpotName.visible = show;
            allHotSpots[index].nameLine = show;
        }

        if (show) {
            var hotSpotName = allHotSpots[index].hotSpotNameSprite;

            if (hotSpotName) {
                hotSpotName.visible = false;
            }
        }
    }
}

function onHotSpotNameClicked(hotSpotNameObj) {
    onThumbnailClicked(hotSpotNameObj.parent.tag.thumbnailElement, true);
}

function onFirstHotSpotClicked(hotSpot, onLoad, onProgress, onError) {
    console.log("fisrt:" + hotSpot.Name);

    if (!isHotSpotClickble || clickedHotSpot == hotSpot) {
        return;
    }
    lastClickedHotSpot = hotSpot;
    clickedHotSpot = hotSpot;

    isHotSpotClickble = false;

    if (hotSpot.cached == undefined || hotSpot.cached == false) {
        document.getElementById("loading").style.visibility = "visible";
    }
    var imageName;

    if (isSingleMode) {
        imageName = hotSpot.ImagePath;
    } else {
        imageName = hotSpot.ImagePath.substring(hotSpot.ImagePath.lastIndexOf("/") + 1);
    }

    imageName = imageName.substring(0, imageName.lastIndexOf("."));

    var urls = [
        rootPathPanoBlur + imageName + "_l.jpg",
        rootPathPanoBlur + imageName + "_r.jpg",
        rootPathPanoBlur + imageName + "_u.jpg",
        rootPathPanoBlur + imageName + "_d.jpg",
        rootPathPanoBlur + imageName + "_f.jpg",
        rootPathPanoBlur + imageName + "_b.jpg"
    ];

    loadCubePanoramaTexture(urls,
        function (cubeTexture) {
            onPanoramaImageLoad(cubeTexture, hotSpot);

            if (onLoad) {
                onLoad();
            }
        }, function (index, xhr) {
            if (onProgress) {
                onProgress(index, xhr);
            }
        },
        function (xhr) {
            isHotSpotClickble = true;

            document.getElementById("loading").style.visibility = "hidden";

            if (onError) {
                onError();
            }
        });
}

function onHotSpotClicked(hotSpot, onLoad, onProgress, onError) {
    console.log(hotSpot.Name);
    var imageName;

    if (isSingleMode) {
        imageName = hotSpot.ImagePath;
    } else {
        imageName = hotSpot.ImagePath.substring(hotSpot.ImagePath.lastIndexOf("/") + 1);
    }

    imageName = imageName.substring(0, imageName.lastIndexOf("."));

    var urls = [
        rootPathPanoTile + imageName + "_l.jpg",
        rootPathPanoTile + imageName + "_r.jpg",
        rootPathPanoTile + imageName + "_u.jpg",
        rootPathPanoTile + imageName + "_d.jpg",
        rootPathPanoTile + imageName + "_f.jpg",
        rootPathPanoTile + imageName + "_b.jpg"
    ];

    loadCubePanoramaTexture(urls,
        function (cubeTexture) {
            disposeSkyBoxTexture();
            for (var i = 0; i < skyBox.material.materials.length; i++) {
                skyBox.material.materials[i].map = cubeTexture[i];
            }
            if (onLoad) {
                onLoad();
            }
        }, function (index, xhr) {
            if (onProgress) {
                onProgress(index, xhr);
            }
        },
        function (xhr) {
            isHotSpotClickble = true;

            document.getElementById("loading").style.visibility = "hidden";

            if (onError) {
                onError();
            }
        });
}

function onPanoramaImageLoad(cubeTexture, hotSpot) {
    document.getElementById("loading").style.visibility = "hidden";

    if (isOverview) {
        switchToHotSpotView();
    }

    camera.fov = isVREnabled ? vrModeFov : defaultFov;
    panoramaCameraController.updateRotation();

    disposeSkyBoxTexture();

    for (var i = 0; i < skyBox.material.materials.length; i++) {
        skyBox.material.materials[i].map = cubeTexture[i];
    }

    if (!isSingleMode) {
        if (hotSpotNameTag) {
            hotSpotNameTag.position.set(clickedHotSpot.floorPlanPosition.x + hotSpotNameDistance, clickedHotSpot.floorPlanPosition.y + hotSpotNameDistance * hotSpotNameDirection, 1);
            updateTextSprite(hotSpotNameTag, clickedHotSpot.Name.split("-")[0]);
            for (var index in allHotSpots) {
                if (allHotSpots[index].tag == clickedHotSpot) {
                    sectorSprite.position.set(allHotSpots[index].position.x * hotSpotScale, -allHotSpots[index].position.z * hotSpotScale, 1);
                    break;
                }
            }
        }
        // move camera and panorama sphere
        var cameraPosition = new THREE.Vector3(hotSpot.Position.x, hotSpot.Position.y, -hotSpot.Position.z);
        camera.position.copy(cameraPosition);
        camera.updateProjectionMatrix();

        skyBox.position.copy(cameraPosition);
        skyBox.rotation.y = THREE.Math.degToRad(180 - hotSpot.Rotation.y);

        showVisibleHotSpots(hotSpot);
    }

    if (isFirstEnterHotSpotView) {
        camera.rotation.x = 0;
        camera.rotation.y = skyBox.rotation.y;
        camera.rotation.z = 0;
        panoramaCameraController.updateRotation();
        isFirstEnterHotSpotView = false;
    }

    isHotSpotClickble = true;
    hotSpot.cached = true;

    // starAutoPlay();
}

function loadCubePanoramaTexture(urls, onLoad, onProgress, onError) {
    var cubeTexture = [];
    var loaded = 0;

    function loadTexture(i) {

        textureLoader.load(urls[i], function (texture) {

            cubeTexture[i] = texture;

            loaded++;

            if (loaded === urls.length) {

                if (onLoad) onLoad(cubeTexture);
            }

        }, function (xhr) {
            if (onProgress) {
                onProgress(i, xhr);
            }
        }, onError);
    }

    for (var i = 0; i < urls.length; i++) {
        loadTexture(i);
    }
}

function disposeSkyBoxTexture() {
    for (var i = 0; i < skyBox.material.materials.length; i++) {
        if (skyBox.material.materials[i].map != null) {
            skyBox.material.materials[i].map.dispose();
            skyBox.material.materials[i].map = null;
        }
    }
}

function showFirstHotSpot(hotSpotName, theta) {
    var hotSpot;

    if (hotSpotName) {
        hotSpot = getHotSpotFromName(hotSpotName);
    } else {
        hotSpot = house.HotSpots[0];
    }

    if (!theta) {
        theta = 0;
    }

    onHotSpotClicked(hotSpot, function () {
        // onWindowResize();
        switchToOverviewDiv.style.visibility = "hidden";
        document.getElementById("welcome").style.visibility = "hidden";

        switchToHotSpotView();

        camera.rotation.y = THREE.Math.degToRad(theta);
        panoramaCameraController.updateRotation();

        if (isShowThumbnail) {
            createThumbnails(true);
        }
    }, function (index, xhr) {
        firstCubProgress[index] = xhr.loaded / xhr.total;
        var loadedProgress = 0;

        for (var progressIndex in firstCubProgress) {
            if (firstCubProgress[progressIndex] == undefined) {
                firstCubProgress[progressIndex] = 0;
            }
            loadedProgress += firstCubProgress[progressIndex];
        }
        var value = parseInt(loadedProgress / 6 * 100);
        var progressBar = document.getElementById("loading_progress_bar");
        progressBar.style.width = value + '%';
        progressBar.innerText = value + '%';
    }, function () {
        $("#loading_tip").text("加载失败");
    });

    document.getElementById("loading").style.visibility = "hidden";
}

function showFirstHotSpotAfterLoading() {
    var hotSpot = house.HotSpots[0];

    onFirstHotSpotClicked(hotSpot, onResourcesPrepared, function (index, xhr) {
        firstCubProgress[index] = xhr.loaded / xhr.total;
        var loadedProgress = 0;

        for (var progressIndex in firstCubProgress) {
            if (firstCubProgress[progressIndex] == undefined) {
                firstCubProgress[progressIndex] = 0;
            }
            loadedProgress += firstCubProgress[progressIndex];
        }
        var value = parseInt(loadedProgress / 6 * 100);
        var progressBar = document.getElementById("loading_progress_bar");
        progressBar.style.width = value + '%';
        progressBar.innerText = value + '%';
    }, function () {
        $("#loading_tip").text("加载失败");
    });

    document.getElementById("loading").style.visibility = "hidden";
}

function showVisibleHotSpots(hotSpot) {
    var visibleHotSpots = [];

    // get visible hot spots
    for (var index in hotSpot.VisibleHotSpots) {
        visibleHotSpots.push(getHotSpotFromName(hotSpot.VisibleHotSpots[index]));
    }

    // show visible hot spots
    for (var index in allHotSpots) {

        if (hotSpot == allHotSpots[index].tag) {
            allHotSpots[index].visible = false;
        } else {
            var visible = contains(visibleHotSpots, allHotSpots[index].tag);
            allHotSpots[index].visible = visible;
            allHotSpots[index].lightObj.visible = false;
            allHotSpots[index].circleSprite.visible = visible;

            var textSprite = allHotSpots[index].hotSpotNameSprite;

            if (!textSprite) {
                continue;
            }

            textSprite.visible = visible;

            if (visible) {
                // update clickableGroup scale
                var distance = camera.position.distanceTo(allHotSpots[index].position.clone().add(textSprite.position));
                var scale = distance * 0.08;
                allHotSpots[index].circleSprite.scale.set(scale, scale, scale);

                scale = 0.015 * distance;
                var textSprite = allHotSpots[index].hotSpotNameSprite;
                textSprite.scale.set(textSprite.material.map.scaleX * scale, textSprite.material.map.scaleY * scale, 1);
                textSprite.position.y = textSprite.y * scale;
            }
        }
    }
}

function contains(a, obj) {
    var i = a.length;

    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }

    return false;
}

function onSwitch2DButtonClicked() {
    setAutoMode(false);
    switchToMap(true);
    switch2DButton.material.map = textureLoader.load("./src/textures/button_2D_pressed.png");
    switch3DButton.material.map = textureLoader.load("./src/textures/button_3D.png");
}

function onSwitch3DButtonClicked() {
    setAutoMode(false);
    switchToMap(false);
    switch2DButton.material.map = textureLoader.load("./src/textures/button_2D.png");
    switch3DButton.material.map = textureLoader.load("./src/textures/button_3D_pressed.png");
}

// function onSwitch2D3DButtonClicked() {
//     setAutoMode(false);
//     switchToMap(!houseShapeSprite.visible);
// }

function setAutoMode(needAutoMode) {
    if (needAutoMode) {
        switchAutoButton.material.map = textureLoader.load("./src/textures/button_Auto_pressed.png");
        starAutoPlayDelay();
        isAutoButtonPressed = true;
    }
    else {
        stopAutoPlay();
        isAutoButtonPressed = false;
        switchAutoButton.material.map = textureLoader.load("./src/textures/button_Auto.png");
    }
}

function onSwitchAutoButtonClicked() {
    if (isAutoButtonPressed) {
        setAutoMode(false);
        // switchToMap(true);
        if (houseShapeSprite.visible) {
            switch2DButton.material.map = textureLoader.load("./src/textures/button_2D_pressed.png");
        }
        else {
            switch3DButton.material.map = textureLoader.load("./src/textures/button_3D_pressed.png");
        }
    }
    else {
        if (houseShapeSprite.visible) {
            switch2DButton.material.map = textureLoader.load("./src/textures/button_2D.png");
        } else {
            switch3DButton.material.map = textureLoader.load("./src/textures/button_3D.png");
        }
        setAutoMode(true);
    }
}

function onVRButtonClicked() {
    onSwitchVRMode();
}

function cameraSwitchAnimation() {
    if (isSwitching) {
        console.log("camera: " + camera.position.x + "," + camera.position.y + "," + camera.position.z);
        console.log("previousCameraPosition: " + previousCameraPosition.x + "," + previousCameraPosition.y + "," + previousCameraPosition.z);
        if (camera.position.y > previousCameraPosition.y && camera.position.y - previousCameraPosition.y < 0.01 || camera.position.y < previousCameraPosition.y && camera.position.y - previousCameraPosition.y > -0.01) {
            // camera.position.copy(previousCameraPosition);
            clickedHotSpot = null;
            isSwitching = false;
        }
        else {
            camera.position.x += switchSpeed.x;
            camera.position.y += switchSpeed.y;
            camera.position.z += switchSpeed.z;
            camera.rotation.x += rotationSpeed.x;
            // camera.rotation.y += rotationSpeed.y;
            camera.rotation.z += rotationSpeed.z;
            // camera.lookAt(new THREE.Vector3(clickedHotSpot.Position.x, clickedHotSpot.Position.y, -clickedHotSpot.Position.z));
        }
    }
}

function cameraZoomAnimation() {
    if (isZooming) {
        if ((zoomSpeed > 0 && camera.fov >= targetZoomFov) || (zoomSpeed < 0 && camera.fov <= targetZoomFov)) {
            isZooming = false;
        }
        else {
            camera.fov += zoomSpeed;
        }
    }
}

function onZoomInClicked() {
    if (!isZooming) {
        isZooming = true;
        targetZoomFov = Math.max(50, Math.min(100, camera.fov - 25));
        if (zoomSpeed > 0) {
            zoomSpeed = -zoomSpeed;
        }
    }
}

function onZoomOutClicked() {
    if (!isZooming) {
        isZooming = true;
        targetZoomFov = Math.max(50, Math.min(100, camera.fov + 25));
        if (zoomSpeed < 0) {
            zoomSpeed = -zoomSpeed;
        }
    }
}

function starAutoPlayDelay() {
    // console.log("startAutoPlayDelay");
    if (autoPlayTimer != undefined) {
        clearTimeout(autoPlayTimer);
    }
    autoPlayTimer = setTimeout(function () {
        if (!isMouseDown) {
            isAutoRotate = true;
            switchToMap(!is3DPrepared);
        }
    }, 6000);
}

function stopAutoPlay() {
    console.log("stopAutoPlay");
    if (autoPlayTimer != undefined) {
        clearTimeout(autoPlayTimer);
    }
    isAutoRotate = false;
}

function switchToMap(showMap) {
    if (!isSingleMode) {
        houseShapeSprite.visible = showMap;
        hotSpotGroup.visible = showMap;
        sceneSmallHouse.visible = !showMap;
        is3DMode = !showMap;
        // var buttonText = showMap ? "3D" : "2D";
        // updateTextSprite(switch2D3DButton, buttonText);
    }
}

function starAutoPlay() {
    // switchToMap(!is3DPrepared);
    // panoramaCameraController.isAutoPlay = true;
}

function closeMap() {
    sceneSmallHouse.visible = false;
    sceneOrtho.visible = false;
    stopAutoPlay();
}

function onSwitchFullscreenButtonClicked() {
    isFullscreen = !isFullscreen;

    if (!isFullscreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    } else {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        }
    }

    switchFullscreenButton.innerText = isFullscreen ? "退出全屏" : "全屏";
    isOverviewAutoRotate = !isFullscreen;
    overviewCameraController.autoRotate = isOverviewAutoRotate;
}

function createHouse() {

    totalPanoramaImageCount = house.HotSpots.length;

    houseObj = new THREE.Object3D();
    houseObj.name = house.Name;
    scene.add(houseObj);

    smallHouseObj = houseObj.clone();
    sceneSmallHouse.add(smallHouseObj);

    for (var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        var roomObj = new THREE.Object3D();
        roomObj.name = room.Name;
        roomObj.position.set(room.Position.x, room.Position.y, -room.Position.z);
        roomObj.rotation.set(0, THREE.Math.degToRad(-room.Rotation), 0);
        houseObj.add(roomObj);
        allRooms.push(roomObj);

        room.gameObject = roomObj;

        // TODO, 临时标二楼代码
        if (!room.IsSecondFloor) {
            room.IsSecondFloor = room.Position.y > 100;
        }

        var smallRoomObj = roomObj.clone();
        smallHouseObj.add(smallRoomObj);

        for (var faceIndex in room.RoomFaces) {
            // var roomFace = room.RoomFaces[faceIndex];
            totalRoomFaceCount++;
            // roomObj.add(facePlane);

            // var smallFacePlane = facePlane.clone();
            // smallRoomObj.add(smallFacePlane);
        }
    }

    houseObj.scale.set(houseScale, houseScale, houseScale);

    houseSize = getHouseSize(house);

    return house;
}

function getHotSpotFromName(hotSpotName) {
    var hotSpot;

    for (var hotSpotIndex in house.HotSpots) {
        if (house.HotSpots[hotSpotIndex].Name == hotSpotName) {
            hotSpot = house.HotSpots[hotSpotIndex];

            break;
        }
    }

    return hotSpot;
}

function loadFaceTexture(roomFace, roomObj, smallRoomObj) {
    var faceTexturePath = roomFace.ImagePath.replace(ossHost, domain);

    var texture = textureLoader.load(faceTexturePath, function (loadedTexture) {
        loadedTexture.minFilter = THREE.LinearFilter;  // fix image is not power of two (xxx). Resized to xxx img
        // create room face
        var planeGeometry = new THREE.PlaneBufferGeometry(roomFace.Width, roomFace.Height, 1, 1);
        var planeMaterial = new THREE.MeshBasicMaterial({ map: loadedTexture, side: THREE.BackSide, alphaTest: 0.1 });
        planeMaterial.transparent = true;
        planeMaterial.depthWrite = true;
        var facePlane = new THREE.Mesh(planeGeometry, planeMaterial);
        facePlane.rotation.reorder("YXZ");
        facePlane.rotation.set(THREE.Math.degToRad(roomFace.Rotation.x), THREE.Math.degToRad(roomFace.Rotation.y), THREE.Math.degToRad(roomFace.Rotation.z));
        facePlane.position.set(roomFace.Position.x, roomFace.Position.y, -roomFace.Position.z);
        roomFace.facePlane = facePlane;
        roomObj.add(facePlane);

        var smallFacePlane = facePlane.clone();
        smallRoomObj.add(smallFacePlane);
    }, function (xhr) {
        onRoomFaceTextureLoading(roomFace, xhr);
    });

    return texture;
}

function setOverviewCameraControllerDistance(isLandscape) {

    debugLog("setOverviewCameraControllerDistance");
    if (houseSize == undefined || overviewCameraController == undefined) {
        return;
    }

    var factor = Math.min(houseSize.x, houseSize.z) * houseScale * 0.0025;

    overviewCameraController.minDistance = 370 * factor;
    overviewCameraController.maxDistance = 900 * factor;

    if (isLandscape) {
        overviewCameraController.minDistance -= 80 * factor;
        overviewCameraController.maxDistance -= 200 * factor;
    }
}

function setDefaultCameraPosition(isLandscape) {
    var theta = 60;
    var phi = 60;
    var radius = 650;

    var d = Math.cos(THREE.Math.degToRad(phi)) * radius;
    var x = Math.sin(THREE.Math.degToRad(theta)) * d;
    var y = Math.sin(THREE.Math.degToRad(phi)) * radius;
    var z = -Math.cos(THREE.Math.degToRad(theta)) * d;

    var factor = Math.max(houseSize.x, houseSize.z) * houseScale * 0.002;

    var defaultCameraPosition = new THREE.Vector3(x * factor, y * factor, z * factor);

    if (isLandscape) {
        defaultCameraPosition.x += 100 * factor;
        defaultCameraPosition.y -= 50 * factor;
        defaultCameraPosition.z += 100 * factor;
    }

    camera.position.copy(defaultCameraPosition);
}

function getHouseSize(house) {
    var minX, maxX;
    var minY, maxY;
    var minZ, maxZ;

    for (var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        for (var faceIndex in room.RoomFaces) {
            var roomFace = room.RoomFaces[faceIndex];

            if (roomIndex == 0 && faceIndex == 0) {
                minX = maxX = room.Position.x + roomFace.Position.x;
                minY = maxY = room.Position.y + roomFace.Position.y;
                minZ = maxZ = room.Position.z + roomFace.Position.z;
            } else {
                minX = Math.min(minX, room.Position.x + roomFace.Position.x);
                maxX = Math.max(maxX, room.Position.x + roomFace.Position.x);
                minY = Math.min(minY, room.Position.y + roomFace.Position.y);
                maxY = Math.max(maxY, room.Position.y + roomFace.Position.y);
                minZ = Math.min(minZ, -room.Position.z - roomFace.Position.z);
                maxZ = Math.max(maxZ, -room.Position.z - roomFace.Position.z);
            }
        }
    }

    return new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);
}

function onRoomFaceTextureLoading(roomFace, xhr) {
    roomFace.loadedProgress = xhr.loaded / xhr.total;

    var loadedProgress = 0;

    for (var roomIndex in house.Rooms) {
        var room = house.Rooms[roomIndex];

        for (var faceIndex in room.RoomFaces) {
            var face = room.RoomFaces[faceIndex];

            if (face.loadedProgress == undefined) {
                face.loadedProgress = 0;
            }

            loadedProgress += face.loadedProgress;
        }
    }

    var value = parseInt(loadedProgress / totalRoomFaceCount * 100);

    if (value == 100) {
        setTimeout(on3DHousePrepared, 500);
    }
}
function on3DHousePrepared() {
    console.log("on3DHousePrepared");
    is3DPrepared = true;
    is3DMode = true;
    // if (fullScreen3DHouseButton) {
    //     fullScreen3DHouseButton.visible = true;
    // }
    switchToMap(false);
    starAutoPlayDelay();
}

function onResourcesPrepared() {
    console.log("ResoucePrepared");
    // onWindowResize();
    createThumbnails(true);
    var hotSpot = house.HotSpots[0];
    onHotSpotClicked(hotSpot);
    onThumbnailClicked(hotSpot.thumbnailElement, false);

    initMap();
    document.getElementById("welcome").style.visibility = "hidden";
    $("#controlTip")[0].style.visibility = "visible";

    setTimeout(function () {
        $("#controlTip").fadeOut(3000);
    }, 2000);

    document.getElementById("controlDiv").style.visibility = "visible";
    starAutoPlay();

    //直接显示第一个全景图时会导致camera位置不对
    // overviewCameraController.update();
}

function onSwitchVRMode() {
    isEnableVRMode = !isEnableVRMode;

    if (!isOnlyPanoramaView) {
        // switchToOverviewDiv.style.visibility = isEnableVRMode ? "hidden" : "visible";
        // fullScreen3DHouseButton.visible = !isEnableVRMode;
    }

    if (isEnableVRMode) {
        if (isLandscapeOrNot()) {
            switchVRMode(true);
        } else {
            vrStartTip.style.visibility = "visible";
            vrStartTip.style.opacity = 1;
            $("#vrStartTip").stop();
            $("#vrStartTip").show();
            panoramaCameraController.enabled = false;

            $("#vrStartTip").fadeOut(5000);
        }
    } else {
        switchVRMode(false);
    }
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
        .exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// web vr
function switchVRMode(enable) {
    camera.fov = enable ? vrModeFov : defaultFov;
    isVREnabled = enable;

    // onWindowResize();

    crosshair.visible = enable;

    if (!enable) { // 关闭VR
        disableVRMode();
    } else { // 开启VR
        enableVRMode();
    }

    // PC 端模拟VR控制
    if (emulateVRControl) {
        if (enable) {
            panoramaCameraController.enabled = true;
        } else if (isOverview) {
            panoramaCameraController.enabled = false;
        }
    }
}

function enableVRMode() {
    if (isOverview) {
        overviewCameraController.enabled = false;

        camera.position.x = 100;
        camera.position.y = 250;
        camera.position.z = 300;
    } else {
        panoramaCameraController.enabled = false;
        $("#vrStartTip").stop();
    }

    vrStartTip.style.visibility = "hidden";
}

function disableVRMode() {
    if (isOverview) {
        overviewCameraController.enabled = true;
        overviewCameraController.update();
    } else {
        camera.rotation.z = 0;

        panoramaCameraController.enabled = true;
        stopAutoPlay();
        starAutoPlayDelay();
        panoramaCameraController.updateRotation();
    }

    if (vrGazeTimer != undefined) {
        clearTimeout(vrGazeTimer);
    }

    vrStartTip.style.visibility = "hidden";
}

function debugLog(message) {
    if (isDebugMode) {
        debugTextValue += message;
        debugTextValue += "\n";

        debugText.value = debugTextValue;
    }
}

function createTextSprite(message, parameters) {
    var texture = createTextTexture(message, parameters);

    var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    var sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(texture.scaleX, texture.scaleY, 1);

    return sprite;
}

function createTextTexture(message, parameters) {
    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 0;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

    var cornerAngle = parameters.hasOwnProperty("cornerAngle") ?
        parameters["cornerAngle"] : 10;

    var canvas = document.createElement('canvas');
    canvas.width = fontsize * 12;
    canvas.height = fontsize * 1.4;

    var context = canvas.getContext('2d');

    context.font = "normal " + fontsize + "px " + fontface;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    var x = (canvas.width + borderThickness) / 2;
    var y = (canvas.height + borderThickness) / 2;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
        + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    var border = 100;
    roundRect(context, (canvas.width - textWidth - border) / 2, 0, textWidth + border, canvas.height, cornerAngle);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(255, 255, 255, 1.0)";

    context.fillText(message, x, y);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter; // NearestFilter;
    texture.needsUpdate = true;

    texture.parameters = parameters;
    texture.scaleX = canvas.width * 0.05;
    texture.scaleY = canvas.height * 0.05;

    return texture;
}

function updateTextSprite(textSprite, message) {
    var texture = createTextTexture(message, textSprite.material.map.parameters);
    textSprite.material.map.dispose();
    textSprite.material.map = texture;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function createHotSpotSprite(texture) {
    var clickEvent = function (circleSprite) {
        onThumbnailClicked(circleSprite.parent.parent.tag.thumbnailElement, true);
    };

    var spriteGroupMaterial = new THREE.SpriteMaterial({ opacity: 0 });
    var spriteGroup = new THREE.Sprite(spriteGroupMaterial); // 两个group嵌套会导致无法点击，这里用一个空的Sprite代替
    spriteGroup.scale.set(10, 10, 1);
    registerClickEvent(spriteGroup, clickEvent);

    var material1 = new THREE.SpriteMaterial({ map: texture, opacity: 1 });
    var sprite1 = new THREE.Sprite(material1);
    spriteGroup.add(sprite1);
    var size = 0.25;
    sprite1.scale.set(size, size, 1);

    var material2 = new THREE.SpriteMaterial({ map: texture, opacity: 0.6 });
    var sprite2 = new THREE.Sprite(material2);
    spriteGroup.add(sprite2);
    size = 0.75;
    sprite2.scale.set(size, size, 1);

    var material3 = new THREE.SpriteMaterial({ map: texture, opacity: 0.2 });
    var sprite3 = new THREE.Sprite(material3);
    spriteGroup.add(sprite3);
    size = 1;
    sprite3.scale.set(size, size, 1);

    animate();

    function animate() {
        var time = Date.now() / 1000;
        var speed = 5;
        var scale = 0.8 + Math.sin(time * speed) * 0.2;

        var scale1 = scale * 0.25;
        sprite1.scale.set(scale1, scale1, scale1);

        var scale2 = scale * 0.6;
        sprite2.scale.set(scale2, scale2, scale2);

        var scale3 = scale;
        sprite3.scale.set(scale3, scale3, scale3);

        requestAnimationFrame(animate);
    }

    return spriteGroup;
}

function onThumbnailControllerClicked() {
    if ($("#thumbnail-list")[0].style.display == "none") {
        $("#thumbnail-list").slideDown("slow");
    } else {
        $("#thumbnail-list").slideUp("slow");
    }
}

function Thumbnail() {
    this.imagePath;
    this.name;
    this.onclick;
    this.isSelected = false;

    this.click = function () {
        if (this.onclick) {
            this.onclick(this);
        }
    }
}

function createThumbnails(isVisible) {
    if (isVisible) {
        $("#thumbnail-controller")[0].style.visibility = "visible";
    }
    else {
        $("#thumbnail-controller")[0].style.visibility = "hidden";
    }

    var thumbnailList = getThumbnailList();
    var template = $("#thumbnail");

    for (var index in thumbnailList) {
        var clonedThumbnail = template.clone().appendTo("#thumbnail-list");
        clonedThumbnail.find("#thumbnail-name")[0].innerText = thumbnailList[index].name;
        clonedThumbnail.find("#thumbnail-image")[0].src = thumbnailList[index].imagePath;
        clonedThumbnail[0].onclick = function () {
            onThumbnailClicked($(this), true);
        };
        clonedThumbnail[0].thumbnailData = thumbnailList[index];
        if (!isSingleMode) {
            var hotSpot = allHotSpots[index].tag;
            hotSpot.thumbnailElement = clonedThumbnail;
        }
    }

    template.remove();
}

function getThumbnailList() {
    var thumbnailList = [];

    for (var hotSpotIndex in house.HotSpots) {
        var hotSpot = house.HotSpots[hotSpotIndex];

        var thumbnail = instantiateThumbnail(hotSpot);

        if (hotSpotIndex == 0) {
            thumbnail.isSelected = true;
        }

        thumbnailList.push(thumbnail);
    }

    return thumbnailList;
}

function instantiateThumbnail(hotSpot) {
    var thumbnailPath = domain + houseId + "/ThumbnailImages/" + hotSpot.ImagePath.substring(hotSpot.ImagePath.lastIndexOf("/") + 1);


    var thumbnail = new Thumbnail();
    thumbnail.name = hotSpot.Name.split("-")[0];
    thumbnail.imagePath = thumbnailPath;
    thumbnail.onclick = function () {
        onHotSpotClicked(hotSpot, onFirstHotSpotClicked(hotSpot));
    };

    return thumbnail;
}

function onThumbnailClicked(thumbnailElement, needClick) {
    thumbnailElement[0].children[0].classList.remove("thumbnail-unselected");
    thumbnailElement[0].children[0].classList.add("thumbnail-selected");

    thumbnailElement.siblings().each(function (index, domElement) {
        domElement.children[0].classList.remove("thumbnail-selected");
        domElement.children[0].classList.add("thumbnail-unselected");

        if (domElement.thumbnailData) {
            domElement.thumbnailData.isSelected = false;
        }
    });

    var thumbnail = thumbnailElement[0].thumbnailData;
    thumbnail.isSelected = true;
    if (needClick) {
        thumbnail.click();
    }
}

function initClickEvent() {
    console.log('a');
    document.getElementById('switchToOverviewDiv').addEventListener('click', onSwitchToOverviewClicked);
    document.getElementById('switchVRButton').addEventListener('click', onSwitchVRMode);
    document.getElementById('zoomInDiv').addEventListener('click', onZoomInClicked);
    document.getElementById('zoomOutDiv').addEventListener('click', onZoomOutClicked);
    document.getElementById('switchToHotSpotViewDiv').addEventListener('click', onSwitchToHotSpotViewClicked);
    document.getElementById('thumbnail-control-button').addEventListener('click', onThumbnailControllerClicked);
}
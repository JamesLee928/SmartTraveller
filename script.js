// TDX API 設定
const TDX_API_URL = "https://tdx.transportdata.tw/api/basic/v2";
const TDX_APP_ID = "sssun-09d597db-5ec8-446e";
const TDX_APP_KEY = "8ffe4bd6-dc2e-40e1-8f9e-2c5d62e13ab1";

// 城市與 API 端點對應
const CITY_API_ENDPOINTS = {
    "台北市": "/Tourism/ScenicSpot/Taipei",
    "新北市": "/Tourism/ScenicSpot/NewTaipei",
    "桃園市": "/Tourism/ScenicSpot/Taoyuan",
    "台中市": "/Tourism/ScenicSpot/Taichung",
    "台南市": "/Tourism/ScenicSpot/Tainan",
    "高雄市": "/Tourism/ScenicSpot/Kaohsiung",
    "基隆市": "/Tourism/ScenicSpot/Keelung",
    "新竹市": "/Tourism/ScenicSpot/Hsinchu",
    "嘉義市": "/Tourism/ScenicSpot/Chiayi",
    "宜蘭縣": "/Tourism/ScenicSpot/YilanCounty",
    "花蓮縣": "/Tourism/ScenicSpot/HualienCounty",
    "台東縣": "/Tourism/ScenicSpot/TaitungCounty",
    "澎湖縣": "/Tourism/ScenicSpot/PenghuCounty",
    "金門縣": "/Tourism/ScenicSpot/KinmenCounty",
    "連江縣": "/Tourism/ScenicSpot/LienchiangCounty"
};

// 城市與美食 API 端點對應
const CITY_FOOD_ENDPOINTS = {
    "台北市": "/Tourism/Restaurant/Taipei",
    "新北市": "/Tourism/Restaurant/NewTaipei",
    "桃園市": "/Tourism/Restaurant/Taoyuan",
    "台中市": "/Tourism/Restaurant/Taichung",
    "台南市": "/Tourism/Restaurant/Tainan",
    "高雄市": "/Tourism/Restaurant/Kaohsiung",
    "基隆市": "/Tourism/Restaurant/Keelung",
    "新竹市": "/Tourism/Restaurant/Hsinchu",
    "嘉義市": "/Tourism/Restaurant/Chiayi",
    "宜蘭縣": "/Tourism/Restaurant/YilanCounty",
    "花蓮縣": "/Tourism/Restaurant/HualienCounty",
    "台東縣": "/Tourism/Restaurant/TaitungCounty",
    "澎湖縣": "/Tourism/Restaurant/PenghuCounty",
    "金門縣": "/Tourism/Restaurant/KinmenCounty",
    "連江縣": "/Tourism/Restaurant/LienchiangCounty"
};

// 城市與旅宿 API 端點對應
const CITY_HOTEL_ENDPOINTS = {
    "台北市": "/Tourism/Hotel/Taipei",
    "新北市": "/Tourism/Hotel/NewTaipei",
    "桃園市": "/Tourism/Hotel/Taoyuan",
    "台中市": "/Tourism/Hotel/Taichung",
    "台南市": "/Tourism/Hotel/Tainan",
    "高雄市": "/Tourism/Hotel/Kaohsiung",
    "基隆市": "/Tourism/Hotel/Keelung",
    "新竹市": "/Tourism/Hotel/Hsinchu",
    "嘉義市": "/Tourism/Hotel/Chiayi",
    "宜蘭縣": "/Tourism/Hotel/YilanCounty",
    "花蓮縣": "/Tourism/Hotel/HualienCounty",
    "台東縣": "/Tourism/Hotel/TaitungCounty",
    "澎湖縣": "/Tourism/Hotel/PenghuCounty",
    "金門縣": "/Tourism/Hotel/KinmenCounty",
    "連江縣": "/Tourism/Hotel/LienchiangCounty"
};

// 城市列表
const cities = [
    "台北市",
    "新北市",
    "桃園市",
    "台中市",
    "台南市",
    "高雄市",
    "基隆市",
    "新竹市",
    "嘉義市",
    "宜蘭縣",
    "花蓮縣",
    "台東縣",
    "澎湖縣",
    "金門縣",
    "連江縣"
];

// 全域變數
let allSpots = []; // 儲存所有景點資料
let allFoods = []; // 儲存所有美食資料
let allHotels = []; // 儲存所有旅宿資料

// 初始化下拉選單
function initializeDropdown() {
    const citySelect = document.getElementById('location');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            const selectedCity = this.value;
            if (selectedCity) {
                console.log('選擇的城市:', selectedCity);
            }
        });
    }

    // 添加旅宿推薦點擊事件
    const hotelsSection = document.getElementById('hotels');
    if (hotelsSection) {
        hotelsSection.addEventListener('click', function() {
            const city = document.getElementById('location').value;
            if (city) {
                searchHotels();
            } else {
                alert('請先選擇城市');
            }
        });
    }
}

// 獲取 TDX API 的存取令牌
async function getTdxToken() {
    const url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const data = new URLSearchParams({
        "grant_type": "client_credentials",
        "client_id": TDX_APP_ID,
        "client_secret": TDX_APP_KEY
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data
        });
        
        if (!response.ok) {
            throw new Error('無法獲取 API 認證');
        }
        
        const tokenData = await response.json();
        return tokenData.access_token;
    } catch (error) {
        console.error('獲取 token 時發生錯誤:', error);
        throw error;
    }
}

// 修改 searchSpots 函數
async function searchSpots() {
    const city = document.getElementById('location').value;
    const spotsContainer = document.getElementById('spotsContainer');
    spotsContainer.innerHTML = '<div class="loading">搜尋中...</div>';

    try {
        // 隱藏美食相關區域
        hideFoodSections();

        const token = await getTdxToken();
        const endpoint = CITY_API_ENDPOINTS[city];
        
        if (!endpoint) {
            throw new Error('不支援的城市');
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };

        const params = new URLSearchParams({
            "$select": "ScenicSpotID,ScenicSpotName,Address,Phone,Description,OpenTime,Class1,Class2,Class3,Picture,Position,UpdateTime",
            "$top": "100"
        });

        const response = await fetch(`${TDX_API_URL}${endpoint}?${params}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('無法獲取景點資料');
        }

        const spots = await response.json();
        allSpots = spots; // 保存所有景點資料
        displaySpots(spots);
        setupCategoryFilter(spots); // 設置類別篩選
    } catch (error) {
        spotsContainer.innerHTML = `<div class="error">錯誤: ${error.message}</div>`;
    }
}

// 修改 searchFoods 函數
async function searchFoods() {
    const city = document.getElementById('location').value;
    const foodsContainer = document.getElementById('foodsContainer');
    foodsContainer.innerHTML = '<div class="loading">搜尋中...</div>';

    try {
        // 隱藏景點相關區域
        hideSpotSections();

        const token = await getTdxToken();
        const endpoint = CITY_FOOD_ENDPOINTS[city];
        
        if (!endpoint) {
            throw new Error('不支援的城市');
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };

        const params = new URLSearchParams({
            "$select": "RestaurantID,RestaurantName,Address,Phone,Description,OpenTime,Picture,Position,UpdateTime",
            "$top": "100"
        });

        // 如果是台北市，添加地址過濾
        if (city === "台北市") {
            params.append("$filter", "contains(Address, '台北市')");
        }

        const response = await fetch(`${TDX_API_URL}${endpoint}?${params}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('無法獲取美食資料');
        }

        const foods = await response.json();
        allFoods = foods; // 保存所有美食資料
        displayFoods(foods);
        setupFoodCategoryFilter(foods); // 設置美食類別篩選
    } catch (error) {
        foodsContainer.innerHTML = `<div class="error">錯誤: ${error.message}</div>`;
    }
}

// 設置類別篩選
function setupCategoryFilter(spots) {
    const filterContainer = document.getElementById('categoryFilterContainer');
    const categorySelect = document.getElementById('categoryFilter');
    
    if (!filterContainer || !categorySelect) return;
    
    // 收集所有類別
    const categories = new Set();
    spots.forEach(spot => {
        if (spot.Class1) categories.add(spot.Class1);
        if (spot.Class2) categories.add(spot.Class2);
        if (spot.Class3) categories.add(spot.Class3);
    });
    
    // 清空並重新填充選項
    categorySelect.innerHTML = '<option value="">全部類別</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // 顯示篩選區域
    filterContainer.style.display = 'block';
}

// 設置美食類別篩選
function setupFoodCategoryFilter(foods) {
    console.log('設置美食類別篩選，美食數量:', foods.length);
    
    const filterContainer = document.getElementById('foodCategoryFilterContainer');
    const categorySelect = document.getElementById('foodCategoryFilter');
    
    console.log('篩選容器:', filterContainer);
    console.log('類別選擇器:', categorySelect);
    
    if (!filterContainer || !categorySelect) {
        console.error('找不到美食篩選容器或選擇器');
        return;
    }

    // 根據餐廳名稱和描述創建關鍵字分類
    const categories = new Set();
    const keywords = {
        '咖啡廳': ['咖啡', 'cafe', 'café', '咖啡廳', '咖啡館'],
        '火鍋': ['火鍋', '麻辣', '涮涮鍋', '鍋物'],
        '日式料理': ['日式', '日本', '壽司', '拉麵', '丼飯', '居酒屋'],
        '中式料理': ['中式', '川菜', '粵菜', '台菜', '客家'],
        '西式料理': ['西式', '義大利', '法國', '美式', '牛排'],
        '甜點': ['甜點', '蛋糕', '冰淇淋', '甜食', '下午茶'],
        '早餐': ['早餐', '早午餐', 'brunch'],
        '宵夜': ['宵夜', '深夜', '24小時'],
        '素食': ['素食', '蔬食', 'vegan', 'vegetarian'],
        '海鮮': ['海鮮', '海產', '魚', '蝦', '蟹']
    };
    
    // 檢查每個餐廳並分類
    foods.forEach(food => {
        const name = food.RestaurantName || '';
        const description = food.Description || '';
        const text = (name + ' ' + description).toLowerCase();
        
        for (const [category, keywordList] of Object.entries(keywords)) {
            if (keywordList.some(keyword => text.includes(keyword.toLowerCase()))) {
                categories.add(category);
                break;
            }
        }
    });
    
    console.log('找到的類別:', Array.from(categories));
    
    // 清空並重新填充選項
    categorySelect.innerHTML = '<option value="">全部類別</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // 顯示篩選區域
    filterContainer.style.display = 'block';
    console.log('美食篩選區域已顯示');
}

// 套用篩選
function applyFilter() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    
    if (!selectedCategory) {
        // 如果選擇全部類別，顯示所有景點
        displaySpots(allSpots);
        return;
    }

    // 篩選符合類別的景點
    const filteredSpots = allSpots.filter(spot => {
        return spot.Class1 === selectedCategory || 
               spot.Class2 === selectedCategory || 
               spot.Class3 === selectedCategory;
    });
    
    displaySpots(filteredSpots);
}

// 套用美食篩選
function applyFoodFilter() {
    const selectedCategory = document.getElementById('foodCategoryFilter').value;
    
    if (!selectedCategory) {
        // 如果選擇全部類別，顯示所有美食
        displayFoods(allFoods);
        return;
    }
    
    // 關鍵字對應
    const keywords = {
        '咖啡廳': ['咖啡', 'cafe', 'café', '咖啡廳', '咖啡館'],
        '火鍋': ['火鍋', '麻辣', '涮涮鍋', '鍋物'],
        '日式料理': ['日式', '日本', '壽司', '拉麵', '丼飯', '居酒屋'],
        '中式料理': ['中式', '川菜', '粵菜', '台菜', '客家'],
        '西式料理': ['西式', '義大利', '法國', '美式', '牛排'],
        '甜點': ['甜點', '蛋糕', '冰淇淋', '甜食', '下午茶'],
        '早餐': ['早餐', '早午餐', 'brunch'],
        '宵夜': ['宵夜', '深夜', '24小時'],
        '素食': ['素食', '蔬食', 'vegan', 'vegetarian'],
        '海鮮': ['海鮮', '海產', '魚', '蝦', '蟹']
    };
    
    const keywordList = keywords[selectedCategory] || [];
    
    // 篩選符合關鍵字的美食
    const filteredFoods = allFoods.filter(food => {
        const name = food.RestaurantName || '';
        const description = food.Description || '';
        const text = (name + ' ' + description).toLowerCase();
        
        return keywordList.some(keyword => text.includes(keyword.toLowerCase()));
    });
    
    displayFoods(filteredFoods);
}

// 清除篩選
function clearFilter() {
    document.getElementById('categoryFilter').value = '';
    displaySpots(allSpots);
}

// 清除美食篩選
function clearFoodFilter() {
    document.getElementById('foodCategoryFilter').value = '';
    displayFoods(allFoods);
}

// 全局變數存起點與終點
let startPoint = null;
let endPoint = null;

function setStartPoint(location) {
    startPoint = location;
    updateSelectedPointsUI();
}

function setEndPoint(location) {
    endPoint = location;
    updateSelectedPointsUI();
}

function updateSelectedPointsUI() {
    const startElem = document.getElementById('selectedStart');
    const endElem = document.getElementById('selectedEnd');
    const routeBtn = document.getElementById('findStopsBtn');

    startElem.textContent = startPoint ? (startPoint.ScenicSpotName || startPoint.RestaurantName|| startPoint.HotelName) : '尚未設定';
    endElem.textContent = endPoint ? (endPoint.ScenicSpotName || endPoint.RestaurantName)|| startPoint.HotelName : '尚未設定';

    routeBtn.disabled = !(startPoint && endPoint);
}

function displaySpots(spots) {
    const spotsContainer = document.getElementById('spotsContainer');
    spotsContainer.innerHTML = '';

    if (spots.length === 0) {
        spotsContainer.innerHTML = '<p>找不到景點資料</p>';
        return;
    }

    spots.forEach((spot) => {
        const spotCard = document.createElement('div');
        spotCard.className = 'spot-card';

        let address = spot.Address || spot.ScenicSpotAddress || spot.Location || spot.AddressDetail || '無地址資料';

        let imageHtml = '';
        if (spot.Picture && spot.Picture.PictureUrl1) {
            imageHtml = `
                <div class="spot-image">
                    <img src="${spot.Picture.PictureUrl1}" alt="${spot.ScenicSpotName}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                </div>
            `;
        } else {
            imageHtml = `
                <div class="spot-image">
                    <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No image available">
                </div>
            `;
        }

        let detailsHtml = `
            <h3>${spot.ScenicSpotName}</h3>
            <p><strong>地址：</strong>${address}</p>
            <p><strong>電話：</strong>${spot.Phone || '無資料'}</p>
        `;

        if (spot.Description) {
            detailsHtml += `<p class="description"><strong>描述：</strong>${spot.Description}</p>`;
        }

        spotCard.innerHTML = `
            ${imageHtml}
            <div class="spot-info">
                ${detailsHtml}
                <div class="select-buttons" style="margin-top:8px;">
                    <button class="btn-set-start">設為起點</button>
                    <button class="btn-set-end">設為終點</button>
                </div>
            </div>
        `;

        // 設定按鈕事件
        spotCard.querySelector('.btn-set-start').addEventListener('click', (e) => {
            e.stopPropagation();
            setStartPoint(spot);
        });

        spotCard.querySelector('.btn-set-end').addEventListener('click', (e) => {
            e.stopPropagation();
            setEndPoint(spot);
        });

        spotCard.addEventListener('click', () => {
            showSpotDetail(spot);
        });

        spotsContainer.appendChild(spotCard);
    });
}

function displayFoods(foods) {
    const foodsContainer = document.getElementById('foodsContainer');
    foodsContainer.innerHTML = '';

    if (foods.length === 0) {
        foodsContainer.innerHTML = '<p>找不到美食資料</p>';
        return;
    }

    foods.forEach((food) => {
        const foodCard = document.createElement('div');
        foodCard.className = 'food-card';

        let address = food.Address || food.RestaurantAddress || food.Location || food.AddressDetail || '無地址資料';

        let imageHtml = '';
        if (food.Picture && food.Picture.PictureUrl1) {
            imageHtml = `
                <div class="food-image">
                    <img src="${food.Picture.PictureUrl1}" alt="${food.RestaurantName}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                </div>
            `;
        } else {
            imageHtml = `
                <div class="food-image">
                    <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No image available">
                </div>
            `;
        }

        let detailsHtml = `
            <h3>${food.RestaurantName}</h3>
            <p><strong>地址：</strong>${address}</p>
            <p><strong>電話：</strong>${food.Phone || '無資料'}</p>
        `;

        if (food.Description) {
            detailsHtml += `<p class="description"><strong>描述：</strong>${food.Description}</p>`;
        }

        foodCard.innerHTML = `
            ${imageHtml}
            <div class="food-info">
                ${detailsHtml}
                <div class="select-buttons" style="margin-top:8px;">
                    <button class="btn-set-start">設為起點</button>
                    <button class="btn-set-end">設為終點</button>
                </div>
            </div>
        `;

        foodCard.querySelector('.btn-set-start').addEventListener('click', (e) => {
            e.stopPropagation();
            setStartPoint(food);
        });

        foodCard.querySelector('.btn-set-end').addEventListener('click', (e) => {
            e.stopPropagation();
            setEndPoint(food);
        });

        foodCard.addEventListener('click', () => {
            showFoodDetail(food);
        });

        foodsContainer.appendChild(foodCard);
    });
}
// 查詢附近公車站牌（預設範圍 300 公尺）
async function findNearbyBusStops(lat, lon, range = 500) {
    const token = await getTdxToken(); // ✅ 加入 token
    const url = `https://tdx.transportdata.tw/api/advanced/v2/Bus/Stop/NearBy?%24top=30&%24spatialFilter=nearby(${lat},${lon},${range})&%24format=JSON`;
    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('無法取得資料');
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}


// 顯示站牌資訊到網頁
async function showNearbyStopsForStartAndEnd() {
    const container = document.getElementById('busStopsInfo');
    container.innerHTML = ''; // 清空

    if (!startPoint || !endPoint || !startPoint.Position || !endPoint.Position) {
        container.innerHTML = '<p style="color:red;">請先設定起點與終點（需有經緯度）</p>';
        return;
    }

    const startLat = startPoint.Position.PositionLat;
    const startLon = startPoint.Position.PositionLon;
    const endLat = endPoint.Position.PositionLat;
    const endLon = endPoint.Position.PositionLon;

    const [startStops, endStops] = await Promise.all([
        findNearbyBusStops(startLat, startLon),
        findNearbyBusStops(endLat, endLon)
    ]);

    const startList = startStops.length
        ? startStops.map(s => `<li>${s.StopName.Zh_tw}</li>`).join('')
        : '<li>查無附近站牌</li>';

    const endList = endStops.length
        ? endStops.map(s => `<li>${s.StopName.Zh_tw}</li>`).join('')
        : '<li>查無附近站牌</li>';

    container.innerHTML = `
        <h3>📍 起點附近站牌</h3>
        <ul>${startList}</ul>
        <h3>📍 終點附近站牌</h3>
        <ul>${endList}</ul>
    `;
}

// 綁定按鈕事件
document.getElementById('findStopsBtn').addEventListener('click', showNearbyStopsForStartAndEnd);
const map = L.map('map').setView([23.5, 121], 8); // 台灣全圖
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap 貢獻者'
  }).addTo(map);

  function addMarkerToMap(point, label, color = 'blue') {
    if (!point || !point.Position || !point.Position.PositionLat || !point.Position.PositionLon) return;

    const icon = L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    L.marker([point.Position.PositionLat, point.Position.PositionLon], { icon })
      .addTo(map)
      .bindPopup(label);
  }

  async function showNearbyStopsAndMap() {
    await showNearbyStopsForStartAndEnd(); // 保留文字資訊

    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const allMarkers = [];

    if (startPoint) {
      addMarkerToMap(startPoint, '🚩 起點', 'green');
      allMarkers.push([startPoint.Position.PositionLat, startPoint.Position.PositionLon]);
    }
    if (endPoint) {
      addMarkerToMap(endPoint, '🏁 終點', 'red');
      allMarkers.push([endPoint.Position.PositionLat, endPoint.Position.PositionLon]);
    }

    const startStops = await findNearbyBusStops(startPoint.Position.PositionLat, startPoint.Position.PositionLon);
    const endStops = await findNearbyBusStops(endPoint.Position.PositionLat, endPoint.Position.PositionLon);

    startStops.forEach((stop, i) => {
      addMarkerToMap({ Position: { PositionLat: stop.StopPosition.PositionLat, PositionLon: stop.StopPosition.PositionLon } }, `🚌 起點附近站牌 ${stop.StopName.Zh_tw}`, 'blue');
      allMarkers.push([stop.StopPosition.PositionLat, stop.StopPosition.PositionLon]);
    });

    endStops.forEach((stop, i) => {
      addMarkerToMap({ Position: { PositionLat: stop.StopPosition.PositionLat, PositionLon: stop.StopPosition.PositionLon } }, `🚌 終點附近站牌 ${stop.StopName.Zh_tw}`, 'orange');
      allMarkers.push([stop.StopPosition.PositionLat, stop.StopPosition.PositionLon]);
    });

    if (allMarkers.length > 0) {
      map.fitBounds(allMarkers);
    }
  }

  document.getElementById('findStopsBtn').addEventListener('click', showNearbyStopsAndMap);




// 顯示景點詳細資訊
function showSpotDetail(spot) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // 處理不同城市的地址欄位
    let address = spot.Address || spot.ScenicSpotAddress || spot.Location || spot.AddressDetail || '無地址資料';
    
    // 構建詳細資訊
    let detailHtml = `
        <h2>${spot.ScenicSpotName}</h2>
        <p><strong>景點ID：</strong>${spot.ScenicSpotID || '無資料'}</p>
        <p><strong>地址：</strong>${address}</p>
        <p><strong>電話：</strong>${spot.Phone || '無資料'}</p>
        <p><strong>開放時間：</strong>${spot.OpenTime || '無資料'}</p>
    `;

    // 添加分類資訊
    if (spot.Class1 || spot.Class2 || spot.Class3) {
        detailHtml += `<p><strong>分類：</strong>${spot.Class1 || ''} ${spot.Class2 || ''} ${spot.Class3 || ''}</p>`;
    }

    // 添加時間資訊
    if (spot.UpdateTime) detailHtml += `<p><strong>更新時間：</strong>${spot.UpdateTime}</p>`;

    // 添加描述
    if (spot.Description) {
        detailHtml += `<p><strong>描述：</strong>${spot.Description}</p>`;
    }

    // 添加圖片
    if (spot.Picture && spot.Picture.PictureUrl1) {
        detailHtml = `
            <img src="${spot.Picture.PictureUrl1}" alt="${spot.ScenicSpotName}" class="modal-image" 
                 onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    } else {
        detailHtml = `
            <img src="https://via.placeholder.com/600x300?text=No+Image" alt="No image available" class="modal-image">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    }
    
    modalContent.innerHTML = detailHtml;
    modal.style.display = 'block';
}

// 顯示美食詳細資訊
function showFoodDetail(food) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // 處理不同城市的地址欄位
    let address = food.Address || food.RestaurantAddress || food.Location || food.AddressDetail || '無地址資料';
    
    // 構建詳細資訊
    let detailHtml = `
        <h2>${food.RestaurantName}</h2>
        <p><strong>餐廳ID：</strong>${food.RestaurantID || '無資料'}</p>
        <p><strong>地址：</strong>${address}</p>
        <p><strong>電話：</strong>${food.Phone || '無資料'}</p>
        <p><strong>營業時間：</strong>${food.OpenTime || '無資料'}</p>
    `;

    // 添加時間資訊
    if (food.UpdateTime) detailHtml += `<p><strong>更新時間：</strong>${food.UpdateTime}</p>`;

    // 添加描述
    if (food.Description) {
        detailHtml += `<p><strong>描述：</strong>${food.Description}</p>`;
    }

    // 添加圖片
    if (food.Picture && food.Picture.PictureUrl1) {
        detailHtml = `
            <img src="${food.Picture.PictureUrl1}" alt="${food.RestaurantName}" class="modal-image" 
                 onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    } else {
        detailHtml = `
            <img src="https://via.placeholder.com/600x300?text=No+Image" alt="No image available" class="modal-image">
            <div class="modal-info">
                ${detailHtml}
            </div>
        `;
    }
    
    modalContent.innerHTML = detailHtml;
    modal.style.display = 'block';
}

// 隱藏景點相關區域
function hideSpotSections() {
    document.getElementById('categoryFilterContainer').style.display = 'none';
    document.getElementById('spotsContainer').innerHTML = '';
    hideHotelSections(); // 隱藏旅宿區域
}

// 隱藏美食相關區域
function hideFoodSections() {
    document.getElementById('foodCategoryFilterContainer').style.display = 'none';
    document.getElementById('foodsContainer').innerHTML = '';
    hideHotelSections(); // 隱藏旅宿區域
}

// 初始化事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化下拉選單
    initializeDropdown();

    // 設置景點推薦點擊事件
    const spotsSection = document.getElementById("spots");
    if (spotsSection) {
        spotsSection.style.cursor = 'pointer';
        spotsSection.addEventListener('click', async () => {
            const location = document.getElementById("location").value;
            if (!location) {
                alert("請先選擇城市");
                return;
            }

            try {
                const token = await getTdxToken();
                await searchSpots(location, token);
            } catch (error) {
                console.error("Error fetching attractions:", error);
                alert("無法取得景點資訊，請稍後再試");
            }
        });
    }

    // 為美食推薦區域添加點擊事件
    const foodsSection = document.getElementById('foods');
    if (foodsSection) {
        foodsSection.style.cursor = 'pointer';
        foodsSection.addEventListener('click', async function() {
            const location = document.getElementById('location').value;
            if (!location) {
                alert('請先選擇城市');
                return;
            }
            try {
                await searchFoods();
            } catch (error) {
                console.error("Error fetching foods:", error);
                alert("無法取得美食資訊，請稍後再試");
            }
        });
    }

    // 設置彈窗關閉事件
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // 點擊彈窗外部關閉
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // ESC 鍵關閉彈窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
});

async function fetchNearbyHotels(cityCode, location, token) {
    try {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Tourism/Hotel/${cityCode}?%24format=JSON`;
        const response = await fetch(url, {
            headers: {
                authorization: "Bearer " + token
            }
        });

        if (!response.ok) throw new Error("無法取得旅宿資料");

        const data = await response.json();
        const sorted = data.sort((a, b) => parseGrade(b.Grade) - parseGrade(a.Grade)).slice(0, 5);

        let html = `🏨 ${location} 旅宿推薦：<br>`;
        if (sorted.length === 0) {
            html += "未找到相關旅宿資料";
        } else {
            sorted.forEach((hotel, index) => {
                html += `${index + 1}. ${hotel.HotelName || "無名稱"}`;
                if (hotel.Grade) {
                    html += ` (${hotel.Grade})`;
                }
                if (hotel.Address) {
                    html += `<br>📍 ${hotel.Address}`;
                }
                if (hotel.Phone) {
                    html += `<br>📞 ${hotel.Phone}`;
                }
                html += `<br>`;
            });
        }

        document.getElementById("hotels").innerHTML = html;

    } catch (err) {
        console.error(err);
        document.getElementById("hotels").innerHTML = "🚧 無法取得旅宿資料";
    }
}

// 搜尋旅宿
async function searchHotels() {
    const city = document.getElementById('location').value;
    const hotelsContainer = document.getElementById('hotelsContainer');
    hotelsContainer.innerHTML = '<div class="loading">搜尋中...</div>';

    try {
        // 隱藏其他區域
        hideSpotSections();
        hideFoodSections();

        const token = await getTdxToken();
        const endpoint = CITY_HOTEL_ENDPOINTS[city];
        
        if (!endpoint) {
            throw new Error('不支援的城市');
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };

        const params = new URLSearchParams({
            "$select": "HotelID,HotelName,Address,Phone,Grade,Description,Picture,Position,UpdateTime",
            "$top": "100"
        });

        const response = await fetch(`${TDX_API_URL}${endpoint}?${params}`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error('無法獲取旅宿資料');
        }

        const hotels = await response.json();
        allHotels = hotels; // 保存所有旅宿資料
        displayHotels(hotels);
        setupHotelCategoryFilter(hotels); // 設置旅宿類別篩選
    } catch (error) {
        hotelsContainer.innerHTML = `<div class="error">錯誤: ${error.message}</div>`;
    }
}

// 設置旅宿類別篩選
function setupHotelCategoryFilter(hotels) {
    const filterContainer = document.getElementById('hotelFilterContainer');
    const categorySelect = document.getElementById('hotelCategoryFilter');
    
    if (!filterContainer || !categorySelect) return;
    
    // 收集所有星等
    const grades = new Set();
    hotels.forEach(hotel => {
        if (hotel.Grade) grades.add(hotel.Grade);
    });
    
    // 清空並重新填充選項
    categorySelect.innerHTML = '<option value="">全部類別</option>';
    Array.from(grades).sort().forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = `${grade}星級`;
        categorySelect.appendChild(option);
    });
    
    // 顯示篩選區域
    filterContainer.style.display = 'block';
}

// 應用旅宿篩選
function applyHotelFilter() {
    const selectedGrade = document.getElementById('hotelCategoryFilter').value;
    let filteredHotels = allHotels;
    
    if (selectedGrade) {
        filteredHotels = filteredHotels.filter(hotel => hotel.Grade === selectedGrade);
    }
    
    displayHotels(filteredHotels);
}

// 清除旅宿篩選
function clearHotelFilter() {
    document.getElementById('hotelCategoryFilter').value = '';
    displayHotels(allHotels);
}

// 顯示旅宿列表
function displayHotels(hotels) {
    const hotelsContainer = document.getElementById('hotelsContainer');
    
    let html = '';
    if (hotels.length === 0) {
        html = '<div class="no-results">未找到符合條件的旅宿</div>';
    } else {
        hotels.forEach((hotel, index) => {
            const pictureUrl = hotel.Picture && hotel.Picture.PictureUrl1 
                ? hotel.Picture.PictureUrl1 
                : 'https://via.placeholder.com/300x200?text=No+Image';

            const escapedHotel = JSON.stringify(hotel).replace(/"/g, '&quot;');
            
            html += `
                <div class="spot-card">
                    <div class="spot-image">
                        <img src="${pictureUrl}" alt="${hotel.HotelName || '旅宿照片'}">
                    </div>
                    <div class="spot-info">
                        <h3>${hotel.HotelName || '無名稱'}</h3>
                        ${hotel.Grade ? `<p>⭐ ${hotel.Grade}</p>` : ''}
                        ${hotel.Address ? `<p>📍 ${hotel.Address}</p>` : ''}
                        ${hotel.Description ? `<p class="description">${hotel.Description}</p>` : ''}
                        <div class="select-buttons" style="margin-top: 8px;">
                            <button class="btn-set-start" data-hotel='${escapedHotel}'>設為起點</button>
                            <button class="btn-set-end" data-hotel='${escapedHotel}'>設為終點</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    hotelsContainer.innerHTML = html;

    // 加入按鈕事件綁定
    document.querySelectorAll('.btn-set-start').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const hotel = JSON.parse(e.currentTarget.dataset.hotel);
            setStartPoint(hotel);
        });
    });

    document.querySelectorAll('.btn-set-end').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const hotel = JSON.parse(e.currentTarget.dataset.hotel);
            setEndPoint(hotel);
        });
    });

    // 點擊卡片開詳細資訊
    document.querySelectorAll('.spot-card').forEach(card => {
        card.addEventListener('click', () => {
            const hotel = JSON.parse(card.querySelector('.btn-set-start').dataset.hotel);
            showHotelDetail(hotel);
        });
    });
}

// 顯示旅宿詳細資訊
function showHotelDetail(hotel) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    const closeBtn = document.querySelector('.close');

    let html = `
        <div class="detail-content">
            ${hotel.Picture && hotel.Picture.PictureUrl1 ? 
                `<div class="modal-image">
                    <img src="${hotel.Picture.PictureUrl1}" alt="${hotel.HotelName || '旅宿照片'}">
                </div>` : ''}
            <div class="modal-info">
                <h2>${hotel.HotelName || '無名稱'}</h2>
                ${hotel.Grade ? `<p>⭐ ${hotel.Grade}</p>` : ''}
                ${hotel.Address ? `<p>📍 ${hotel.Address}</p>` : ''}
                ${hotel.Phone ? `<p>📞 ${hotel.Phone}</p>` : ''}
                ${hotel.Description ? `<p>${hotel.Description}</p>` : ''}
            </div>
        </div>
    `;

    modalContent.innerHTML = html;
    modal.style.display = 'block';

    // 關閉按鈕事件
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    // 點擊模態框外部關閉
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// 隱藏旅宿相關區域
function hideHotelSections() {
    document.getElementById('hotelFilterContainer').style.display = 'none';
    document.getElementById('hotelsContainer').innerHTML = '';
}

// 解析星等
function parseGrade(grade) {
    if (!grade) return 0;
    const match = grade.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}
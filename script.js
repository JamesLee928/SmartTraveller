// 城市對照表
const cityMap = {
    "台北": "Taipei",
    "新北": "NewTaipei",
    "桃園": "Taoyuan",
    "台中": "Taichung",
    "台南": "Tainan",
    "高雄": "Kaohsiung",
    "基隆": "Keelung",
    "宜蘭": "YilanCounty",
    "花蓮": "HualienCounty",
    "台東": "TaitungCounty",
    "彰化": "ChanghuaCounty",
    "南投": "NantouCounty",
    "雲林": "YunlinCounty",
    "嘉義": "ChiayiCounty",
    "屏東": "PingtungCounty"
};

function detectCity(locationText) {
    for (const name in cityMap) {
        if (locationText.includes(name)) {
            return cityMap[name];
        }
    }
    return null;
}

async function search() {
    const location = document.getElementById("location").value;
    if (!location) {
        alert("請輸入地點！");
        return;
    }

    const cityCode = detectCity(location);
    if (!cityCode) {
        alert("無法判斷地點所屬城市，請輸入如 台北/高雄...");
        return;
    }

    try {
        const token = await getTDXToken();
        fetchNearbyHotels(cityCode, location, token);
        fetchNearbyFood(location, token);
        fetchNearbyAttractions(cityCode, location, token);
        fetchBusRealtime(cityCode, token);
    } catch (err) {
        alert("無法取得 TDX Token");
        console.error(err);
    }
}

async function getTDXToken() {
    const client_id = "sssun-09d597db-5ec8-446e";
    const client_secret = "8ffe4bd6-dc2e-40e1-8f9e-2c5d62e13ab1";
    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");
    body.append("client_id", client_id);
    body.append("client_secret", client_secret);

    const response = await fetch("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
    });

    if (!response.ok) throw new Error("取得 token 失敗");
    const data = await response.json();
    return data.access_token;
}

async function fetchNearbyHotels(cityCode, location, token) {
    try {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Tourism/Hotel/${cityCode}?$top=100&$format=JSON`;
        const response = await fetch(url, {
            headers: {
                authorization: "Bearer " + token
            }
        });

        if (!response.ok) throw new Error("無法取得旅宿資料");

        const data = await response.json();
        const filtered = data.filter(hotel => hotel.Address && hotel.Address.includes(location)).slice(0, 5);

        let html = `🏨 ${location} 旅宿推薦：<br>`;
        if (filtered.length === 0) {
            html += "未找到相關旅宿資料";
        } else {
            for (const hotel of filtered) {
                html += `▶ ${hotel.HotelName || "無名稱"}<br>`;
                html += `　📍 地址：${hotel.Address}<br>`;
                if (hotel.Phone) html += `　☎ 電話：${hotel.Phone}<br>`;
            }
        }
        document.getElementById("hotels").innerHTML = html;

    } catch (err) {
        console.error(err);
        document.getElementById("hotels").innerHTML = "🚧 無法取得旅宿資料";
    }
}

async function fetchBusRealtime(cityCode, token) {
    try {
        const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/${cityCode}?%24top=5&%24format=JSON`;
        const response = await fetch(url, {
            headers: {
                authorization: "Bearer " + token
            }
        });

        if (!response.ok) throw new Error("API 回傳失敗");

        const data = await response.json();
        let html = `🚌 ${cityCode} 公車即時動態：<br>`;
        for (const bus of data) {
            html += `▶ 路線：${bus.RouteName.Zh_tw}<br>`;
            html += `　預估到站：${bus.EstimateTime ? Math.floor(bus.EstimateTime / 60) + " 分鐘" : "即將進站"}<br>`;
        }

        document.getElementById("transport").innerHTML = html;
    } catch (err) {
        document.getElementById("transport").innerHTML = "🚧 公車資訊無法取得";
        console.error(err);
    }
}

function fetchNearbyFood(location, token) {
    document.getElementById("foods").innerHTML = `🍜 ${location} 美食推薦：<br>1. 牛肉麵<br>2. 蚵仔煎`;
}

function fetchNearbyAttractions(cityCode, location, token) {
    document.getElementById("spots").innerHTML = `📍 ${location} 景點推薦：<br>1. 夜市<br>2. 博物館`;
}

const container = document.getElementById('map');
const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 3
};

// 2. 지도 객체와 마커 객체도 const
const map = new kakao.maps.Map(container, options);
const marker = new kakao.maps.Marker(); 

// 3. Geolocation 처리
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        const locPosition = new kakao.maps.LatLng(lat, lon);
        
        displayMarker(locPosition);
    }, (error) => {
        console.error("GPS 권한을 허용해주세요.");
        displayMarker(options.center);
    });
} else {
    displayMarker(options.center);
}

// 4. 함수 선언
function displayMarker(locPosition) {
    marker.setPosition(locPosition);
    marker.setMap(map);
    map.setCenter(locPosition);      
}
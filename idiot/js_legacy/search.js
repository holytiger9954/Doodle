// js/search.js

window.onload = function () {
    const searchInput = document.getElementById('search');

    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const keyword = this.value;

                if (!keyword.replace(/^\s+|\s+$/g, '')) {
                    alert('키워드를 입력해주세요!');
                    return false;
                }

                // 부모 창(main.html)의 함수를 호출하거나 직접 지도 제어
                searchOnParentMap(keyword);
            }
        });
    }
};

function searchOnParentMap(keyword) {
    // 부모 창의 kakao 객체와 map 객체에 접근
    const kakao = window.parent.kakao;
    const map = window.parent.map;

    if (!kakao || !map) {
        console.error("부모 창의 지도 객체를 찾을 수 없습니다.");
        return;
    }

    // 장소 검색 서비스 객체 생성 (부모 창의 라이브러리 활용)
    const ps = new kakao.maps.services.Places();

    // 키워드로 장소를 검색합니다
    ps.keywordSearch(keyword, function (data, status) {
        if (status === kakao.maps.services.Status.OK) {
            // 검색된 장소 중 첫 번째 결과의 좌표로 지도 이동
            const coords = new kakao.maps.LatLng(data[0].y, data[0].x);
            map.panTo(coords);
            map.setLevel(3);
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            alert('검색 결과가 존재하지 않습니다.');
        } else if (status === kakao.maps.services.Status.ERROR) {
            alert('검색 결과 중 오류가 발생했습니다.');
        }
    });
}
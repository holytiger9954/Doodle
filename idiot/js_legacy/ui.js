window.onload = init;
function init() {
    bind()
}

function bind(){
    const ui = document.querySelectorAll('.ui')
    ui.forEach(function(u,index){
        u.addEventListener('click',function(){
            window.parent.postMessage({
                type:'ui',//메인에서 구별하기 위한 별명
                index: index//메인에서 받을 데이터
            },'*');
        })
    })
}
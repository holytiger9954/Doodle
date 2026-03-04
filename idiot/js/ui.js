window.onload = init;
function init() {
    bind()
}

function bind(){
    const ui = document.querySelectorAll('.ui')
    ui.forEach(function(u,index){
        u.addEventListener('click',function(){
            window.parent.postMessage({
                type:'ui',
                index: index
            },'*');
        })
    })
}
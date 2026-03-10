function toast(element) {
    const toast = document.querySelector('#toast-page');
    const tPage = document.createElement('div');
    tPage.className = 'toast-page';
    tPage.innerHTML = `${element}`;
    document.querySelector('body').prepend(tPage);

    setTimeout(function() {
        tPage.remove();
    }, 1500)
}
const detailReason = document.querySelector('#detail-reason');

detailReason.addEventListener('focus', function() {
    detailReason.placeholder = '';
});
detailReason.addEventListener('blur', function() {
    if (this.value === '') {
        this.placeholder = '상세사유를 적어주세요.(최대 300자)';
    }
});
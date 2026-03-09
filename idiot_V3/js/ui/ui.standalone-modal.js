window.closeLogin = function closeLogin() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = './main.html';
};

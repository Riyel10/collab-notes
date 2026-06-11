(function () {
  const config = window.APP_CONFIG || {};
  const apiBaseUrl = (config.API_BASE_URL || '').replace(/\/$/, '');

  window.apiUrl = function (path) {
    return `${apiBaseUrl}${path}`;
  };

  window.socketBaseUrl = function () {
    return apiBaseUrl || undefined;
  };

  window.socketScriptUrl = function () {
    return apiBaseUrl ? `${apiBaseUrl}/socket.io/socket.io.js` : '/socket.io/socket.io.js';
  };

  window.loadScript = function (src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
})();

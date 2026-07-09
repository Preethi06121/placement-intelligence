(function () {
  function api(path, opts) {
    opts = opts || {};
    var headers = opts.headers ? Object.assign({}, opts.headers) : {};
    var body = opts.body;
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      if (typeof body === "object") body = JSON.stringify(body);
    }
    return fetch(path, {
      credentials: "include",
      method: opts.method || "GET",
      headers: body instanceof FormData ? opts.headers || {} : headers,
      body: body,
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (e) {
          data = text;
        }
        if (!res.ok) {
          var err =
            (data && (data.error || data.message)) ||
            "Request failed (" + res.status + ")";
          throw new Error(err);
        }
        return data;
      });
    });
  }
  window.api = api;
})();

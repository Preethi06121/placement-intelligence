(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("btn-logout");
    if (b) {
      b.onclick = function () {
        api("/api/logout", { method: "POST", body: {} }).finally(function () {
          window.localStorage.removeItem("placement_access_token");
          window.location.href = "/app/login";
        });
      };
    }
  });
})();

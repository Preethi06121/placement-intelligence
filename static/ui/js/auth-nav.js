(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("btn-logout");
    if (b) {
      b.onclick = function () {
        api("/api/logout", { method: "POST", body: {} }).finally(function () {
          window.location.href = "/app/login";
        });
      };
    }
  });
})();

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("form-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("form-err");
    err.hidden = true;
    var fd = new FormData(e.target);
    api("/api/login", {
      method: "POST",
      body: { email: fd.get("email"), password: fd.get("password") },
    })
      .then(function () {
        window.location.href = "/app/dashboard";
      })
      .catch(function (x) {
        err.textContent = x.message;
        err.hidden = false;
      });
  });
});

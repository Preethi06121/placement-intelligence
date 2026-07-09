document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("form-signup").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("form-err");
    err.hidden = true;
    var fd = new FormData(e.target);
    api("/api/signup", {
      method: "POST",
      body: { email: fd.get("email"), password: fd.get("password") },
    })
      .then(function () {
        window.location.href = "/app/login";
      })
      .catch(function (x) {
        err.textContent = x.message;
        err.hidden = false;
      });
  });
});

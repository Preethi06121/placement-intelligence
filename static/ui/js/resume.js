document.addEventListener("DOMContentLoaded", function () {
  api("/api/me").then(function (me) {
    if (!me.authenticated) {
      window.location.href = "/app/login";
    }
  }).catch(function () {
    window.location.href = "/app/login";
  });

  document.getElementById("form-resume").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("form-err");
    err.hidden = true;
    var resumeFile = e.target.resume.files[0];
    if (!resumeFile) {
      err.textContent = "Please choose a PDF resume.";
      err.hidden = false;
      return;
    }
    var fd = new FormData();
    fd.append("job_description", (e.target.jd && e.target.jd.value) || "");
    fd.append("resume", resumeFile);
    api("/api/full_analysis", { method: "POST", body: fd })
      .then(function () {
        window.location.href = "/app/dashboard";
      })
      .catch(function (x) {
        err.textContent = x.message;
        err.hidden = false;
      });
  });
});

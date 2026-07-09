document.addEventListener("DOMContentLoaded", function () {
  api("/api/me").then(function (me) {
    if (!me.authenticated) window.location.href = "/app/login";
  }).catch(function () {
    window.location.href = "/app/login";
  });

  document.getElementById("form-code").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("form-err");
    var out = document.getElementById("code-out");
    err.hidden = true;
    out.innerHTML = "";
    var fd = new FormData(e.target);
    api("/api/coding_analysis", {
      method: "POST",
      body: { leetcode_url: fd.get("url") },
    })
      .then(function (data) {
        var stats = data.total_stats || {};
        var fb = data.feedback || {};
        var topics = data.topic_count || {};
        var recs = fb.recommendations || [];
        var sug = fb.suggestions || [];
        var topicHtml = "<ul>";
        Object.keys(topics).forEach(function (k) {
          topicHtml += "<li>" + escapeHtml(k) + ": " + topics[k] + "</li>";
        });
        topicHtml += "</ul>";
        var recHtml = "<ul>";
        recs.forEach(function (r) {
          recHtml += "<li>" + escapeHtml(r) + "</li>";
        });
        recHtml += "</ul>";
        var sugHtml = "<ul>";
        sug.forEach(function (s) {
          sugHtml += "<li>" + escapeHtml(s) + "</li>";
        });
        sugHtml += "</ul>";
        out.innerHTML =
          "<h2>Score: " +
          data.score +
          "%</h2>" +
          "<p>Solved: " +
          stats.total +
          " (E " +
          stats.easy +
          " / M " +
          stats.medium +
          " / H " +
          stats.hard +
          ")</p>" +
          "<h3>Topics</h3>" +
          topicHtml +
          "<h3>Recommendations</h3>" +
          recHtml +
          "<h3>Suggestions</h3>" +
          sugHtml;
      })
      .catch(function (x) {
        err.textContent = x.message;
        err.hidden = false;
      });
  });
});

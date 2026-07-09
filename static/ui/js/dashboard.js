(function () {
  var chartInstance = null;

  function badgeClass(label) {
    if (label === "READY") return "ready";
    if (label === "ALMOST_READY") return "almost";
    return "not";
  }

  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  function render(html) {
    destroyChart();
    document.getElementById("main").innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    api("/api/me")
      .then(function (me) {
        if (!me.authenticated) {
          window.location.href = "/app/login";
          return null;
        }
        return Promise.all([me, api("/api/progress"), api("/api/dashboard")]);
      })
      .then(function (results) {
        if (!results) return;
        var me = results[0];
        var prog = results[1];
        var dash = results[2];
        var latest = dash.latest;
        var attempts = dash.attempts || [];

        var html =
          '<div class="card">' +
          "<h1>Dashboard</h1>" +
          "<p>Signed in as <strong>" +
          escapeHtml(me.user && me.user.email ? me.user.email : "") +
          "</strong></p>" +
          "<h2>Session scores (used automatically in full analysis)</h2>" +
          "<p>CS: <strong>" +
          (prog.cs_score != null ? prog.cs_score : "—") +
          "</strong> · Coding: <strong>" +
          (prog.coding_score != null ? prog.coding_score : "—") +
          "</strong> · Aptitude: <strong>" +
          (prog.aptitude_score != null ? prog.aptitude_score : "—") +
          "</strong></p>" +
          '<p class="muted">Complete tests and LeetCode analysis, then upload your resume on the <a href="/app/resume">Resume</a> page to run full analysis.</p>' +
          '<div class="grid-links">' +
          '<a href="/app/resume" class="btn">Resume &amp; analysis</a>' +
          "</div>" +
          '<hr class="sep" />' +
          "<h2>Past attempts</h2>";

        if (!attempts.length) {
          html += '<p class="muted">No attempts yet.</p>';
        } else {
          html += '<ul class="attempts-list">';
          attempts.forEach(function (a) {
            html +=
              "<li>" +
              '<span class="badge ' +
              badgeClass(a.readiness_label) +
              '">' +
              escapeHtml(a.readiness_label) +
              "</span>" +
              "<p>Overall: <strong>" +
              (a.overall_score != null ? Number(a.overall_score).toFixed(2) : "—") +
              "</strong></p>" +
              "<p class=\"muted\">Resume: " +
              (a.resume_score != null ? Number(a.resume_score).toFixed(2) : "—") +
              " · Coding: " +
              (a.coding_score != null ? Number(a.coding_score).toFixed(2) : "—") +
              " · CS: " +
              (a.cs_score != null ? Number(a.cs_score).toFixed(2) : "—") +
              " · Aptitude: " +
              (a.aptitude_score != null ? Number(a.aptitude_score).toFixed(2) : "—") +
              "</p>" +
              "</li>";
          });
          html += "</ul>";
        }

        html += '<hr class="sep" /><h2>Latest attempt</h2>';
        if (latest) {
          html += '<div class="chart-wrap"><canvas id="radarChart"></canvas></div>';
        } else {
          html += '<p class="muted">No chart until you complete a full analysis.</p>';
        }
        html += "</div>";

        render(html);

        if (latest && typeof Chart !== "undefined") {
          var ctx = document.getElementById("radarChart");
          if (ctx) {
            chartInstance = new Chart(ctx, {
              type: "radar",
              data: {
                labels: ["Resume", "Coding", "CS", "Aptitude"],
                datasets: [
                  {
                    label: "Scores",
                    data: [
                      Number(latest.resume_score) || 0,
                      Number(latest.coding_score) || 0,
                      Number(latest.cs_score) || 0,
                      Number(latest.aptitude_score) || 0,
                    ],
                    fill: true,
                  },
                ],
              },
              options: {
                scales: {
                  r: { min: 0, max: 100 },
                },
              },
            });
          }
        }
      })
      .catch(function () {
        window.location.href = "/app/login";
      });
  });
})();

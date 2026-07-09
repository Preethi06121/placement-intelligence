(function () {
  function showResults(container, res, title) {
    var html =
      '<div class="card"><h1>' +
      escapeHtml(title) +
      '</h1><p>Score: <strong>' +
      res.score +
      '%</strong></p><hr class="sep"/><ul class="attempts-list">';
    (res.results || []).forEach(function (r) {
      html +=
        "<li><p><strong>Q:</strong> " +
        escapeHtml(r.question) +
        "</p><p>Your answer: " +
        escapeHtml(String(r.selected || "")) +
        "</p><p>Correct: " +
        escapeHtml(String(r.correct || "")) +
        "</p><p class=\"" +
        (r.is_correct ? "muted" : "error") +
        "\">" +
        (r.is_correct ? "Correct" : "Wrong") +
        "</p></li>";
    });
    html +=
      '</ul><p style="margin-top:20px"><a href="/app/dashboard" class="btn">Dashboard</a></p></div>';
    container.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.getElementById("main");
    api("/api/me")
      .then(function (me) {
        if (!me.authenticated) {
          window.location.href = "/app/login";
          return Promise.reject();
        }
        return api("/api/aptitude_test");
      })
      .then(function (data) {
        var qs = data.questions || [];
        var html =
          '<div class="card"><h1>Aptitude test</h1><form id="form-apt">';
        qs.forEach(function (q, i) {
          html +=
            '<div class="question-block"><strong>' +
            (i + 1) +
            ". " +
            escapeHtml(q.question) +
            "</strong>";
          q.options.forEach(function (opt) {
            html +=
              '<label class="option"><input type="radio" name="q' +
              i +
              '" value="' +
              attrEscape(opt) +
              '" required /> ' +
              escapeHtml(opt) +
              "</label>";
          });
          html += "</div>";
        });
        html +=
          '<p id="form-err" class="error" hidden></p>' +
          '<button type="submit" class="btn">Submit</button> ' +
          '<a href="/app/dashboard">Back</a></form></div>';
        main.innerHTML = html;

        document.getElementById("form-apt").addEventListener("submit", function (e) {
          e.preventDefault();
          var answers = qs.map(function (_, i) {
            var el = e.target.querySelector('input[name="q' + i + '"]:checked');
            return el ? el.value : "";
          });
          var err = document.getElementById("form-err");
          err.hidden = true;
          api("/api/aptitude_test", { method: "POST", body: { answers: answers } })
            .then(function (res) {
              showResults(main, res, "Aptitude result");
            })
            .catch(function (x) {
              err.textContent = x.message;
              err.hidden = false;
            });
        });
      })
      .catch(function () {});
  });
})();

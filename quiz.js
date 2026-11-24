const $ = id => document.getElementById(id);
const melanger = t => { const a = [...t]; for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };

// 10 questions au hasard, propositions mélangées
const Q = melanger(QUIZ).slice(0, 10).map(x => {
  const options = melanger([x.bonne, ...x.fausses]);
  return { question: x.question, options, correct: options.indexOf(x.bonne), explication: x.explication };
});
let i = 0, ok = 0, ko = 0, answered = false;

$("progress").innerHTML = Q.map((_, k) => `<div class="seg" id="seg${k}"><span>${k + 1}/${Q.length}</span></div>`).join("");
show();

function show() {
  answered = false;
  document.querySelectorAll(".seg").forEach((s, k) => s.classList.toggle("now", k === i));
  const q = Q[i];
  $("question").innerHTML = q.question;
  $("options").innerHTML = "";
  q.options.forEach((o, k) => {
    const b = document.createElement("button");
    b.className = "opt"; b.innerHTML = o;
    b.onclick = () => choose(k, b);
    $("options").appendChild(b);
  });
  $("explain").hidden = true; $("next").hidden = true;
  $("next").textContent = i === Q.length - 1 ? "Voir le récapitulatif" : "Question suivante";
}

function choose(k, btn) {
  if (answered) return;
  answered = true;
  const q = Q[i], good = k === q.correct, btns = document.querySelectorAll(".opt");
  btns.forEach(b => b.disabled = true);
  btns[q.correct].classList.add("good");
  if (!good) btn.classList.add("bad");
  const seg = $("seg" + i); seg.classList.remove("now"); seg.classList.add(good ? "ok" : "ko");
  good ? ok++ : ko++;
  $("explain").innerHTML = `<b>${good ? "Bravo !" : "Pas tout à fait."}</b> La bonne réponse est : <b>${q.options[q.correct]}</b><br>${q.explication}`;
  $("explain").hidden = false; $("next").hidden = false;
}

$("next").onclick = () => { if (++i < Q.length) show(); else recap(); };

function recap() {
  const p = Math.round(100 * ok / Q.length);
  $("game").hidden = true; $("recap").hidden = false;
  $("ok").textContent = ok + " / " + Q.length; $("ko").textContent = ko + " / " + Q.length;
  $("pct").textContent = ok + "/" + Q.length; $("pct2").textContent = p + " %";
  $("msg").textContent = p >= 80 ? "Excellent, tu maîtrises bien les suites !" : p >= 50 ? "Bon travail ! Revois le cours pour les points manqués." : "Courage ! Relis le cours et refais les exercices, puis réessaie.";
}

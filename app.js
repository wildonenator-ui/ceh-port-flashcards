/* CEH ポート暗記フラッシュカード
 * データは ports.js の PORTS 配列から読み込みます（fetch 不使用）。
 * 進捗は localStorage（この端末のブラウザ内）にだけ保存します。
 */
(function () {
  "use strict";

  const STORAGE_KEY = "cehPortFlashcards.v1";
  const CATEGORIES = [
    ["all", "全カテゴリ"], ["auth", "auth(認証)"], ["smb", "smb"], ["mail", "mail"],
    ["web", "web"], ["infra", "infra"], ["iot", "iot"], ["ot", "ot"],
    ["remote", "remote"], ["file", "file"], ["mobile", "mobile"],
    ["hashcat", "Hashcatモード"], ["cwe", "CWE/WASC"], ["ttl", "TTL初期値"]
  ];
  // カテゴリごとの問いかけ文（ここに無いカテゴリはポート用の文言になります）
  const ASK = {
    hashcat: { u2p: "Hashcatのモード番号は？", p2u: "何を解読するモード？" },
    cwe:     { u2p: "識別子の番号は？",        p2u: "何の弱点？" },
    ttl:     { u2p: "TTL初期値は？",           p2u: "どのOS/機器？" }
  };
  const DEFAULT_ASK = { u2p: "ポート番号は？", p2u: "サービス / 用途は？" };
  const byId = new Map(PORTS.map(p => [p.id, p]));
  const highlight = new Set(typeof HIGHLIGHT_PORTS !== "undefined" ? HIGHLIGHT_PORTS : []);

  const $ = id => document.getElementById(id);
  const el = {
    card: $("card"), frontCat: $("frontCat"), frontAsk: $("frontAsk"), frontMain: $("frontMain"),
    frontSub: $("frontSub"), backCat: $("backCat"), backMain: $("backMain"), backSub: $("backSub"),
    backNote: $("backNote"), roundLabel: $("roundLabel"), counter: $("counter"), accuracy: $("accuracy"),
    progressBar: $("progressBar"), roundEnd: $("roundEnd"), roundEndTitle: $("roundEndTitle"),
    roundEndText: $("roundEndText"), roundEndBtn: $("roundEndBtn"), okBtn: $("okBtn"), ngBtn: $("ngBtn"),
    prevBtn: $("prevBtn"), nextBtn: $("nextBtn"), shuffleBtn: $("shuffleBtn"),
    shuffleToggle: $("shuffleToggle"), resetBtn: $("resetBtn"), chips: $("chips")
  };

  // ===== 状態 =====
  // deck: 今回の周回で出すカード [{id, dir}]  dir = "u2p"(用途→番号) / "p2u"(番号→用途)
  // answers: 周回内の位置ごとの自己採点 {位置: "ok" | "ng"}
  // stats: カードごとの累計 {id: {ok, ng}}
  let state = load() || freshState();
  let flipped = false;

  function freshState() {
    return {
      settings: { mode: "u2p", category: "all", shuffle: true },
      deck: [], index: 0, round: 1, isReview: false, answers: {}, finished: false,
      stats: {}
    };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      // 保存後に ports.js からカードが消えていた場合に備えて除外
      if (s && Array.isArray(s.deck)) {
        s.deck = s.deck.filter(c => byId.has(c.id));
        return s;
      }
    } catch (e) { /* 保存データが壊れていたら初期化 */ }
    return null;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 保存不可でも動作は継続 */ }
  }

  // ===== デッキ作成 =====
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickDir() {
    const m = state.settings.mode;
    return m === "mix" ? (Math.random() < 0.5 ? "u2p" : "p2u") : m;
  }

  function buildDeck(ids) {
    const list = state.settings.shuffle ? shuffle(ids) : ids.slice().sort((a, b) => a - b);
    return list.map(id => ({ id, dir: pickDir() }));
  }

  function filteredIds() {
    const c = state.settings.category;
    return PORTS.filter(p => c === "all" || p.category === c).map(p => p.id);
  }

  // ports.js にカードが追加されていたら、進捗を保ったまま今の周回の末尾に足す
  function appendNewCards() {
    if (state.isReview || state.finished || !state.deck.length) return;
    const inDeck = new Set(state.deck.map(c => c.id));
    const added = filteredIds().filter(id => !inDeck.has(id));
    if (added.length) {
      state.deck = state.deck.concat(buildDeck(added));
      save();
    }
  }

  // 設定変更時などに1周目から始め直す
  function startFresh() {
    state.deck = buildDeck(filteredIds());
    state.index = 0;
    state.round = 1;
    state.isReview = false;
    state.answers = {};
    state.finished = false;
    setFlip(false, true);
    save();
    render();
  }

  // ===== 自己採点・移動 =====
  function grade(result) {
    if (state.finished || !state.deck.length) return;
    const card = state.deck[state.index];
    const st = state.stats[card.id] || (state.stats[card.id] = { ok: 0, ng: 0 });
    const prev = state.answers[state.index];
    if (prev) st[prev] = Math.max(0, st[prev] - 1); // 戻って採点し直した場合は前回分を取り消す
    st[result]++;
    state.answers[state.index] = result;
    next();
  }

  function next() {
    if (state.finished || !state.deck.length) return;
    if (state.index < state.deck.length - 1) {
      state.index++;
      setFlip(false, true);
      save();
      render();
    } else {
      finishRound();
    }
  }

  function prev() {
    if (state.finished) {
      // 周回終了画面から最後のカードに戻る
      state.finished = false;
      setFlip(false, true);
      save();
      render();
      return;
    }
    if (state.index > 0) {
      state.index--;
      setFlip(false, true);
      save();
      render();
    }
  }

  function finishRound() {
    state.finished = true;
    save();
    render();
  }

  // 周回終了後：要復習があればそれだけ、なければ全体をもう一周
  function continueAfterRound() {
    const review = reviewIds();
    if (review.length) {
      state.deck = buildDeck(review);
      state.isReview = true;
    } else {
      state.deck = buildDeck(filteredIds());
      state.isReview = false;
    }
    state.round++;
    state.index = 0;
    state.answers = {};
    state.finished = false;
    setFlip(false, true);
    save();
    render();
  }

  function reviewIds() {
    return state.deck.filter((c, i) => state.answers[i] === "ng").map(c => c.id);
  }

  // ===== めくる =====
  function setFlip(value, instant) {
    flipped = value;
    if (instant) {
      el.card.classList.add("no-anim");
      el.card.classList.toggle("flipped", value);
      void el.card.offsetWidth; // アニメなしで即座に反映させる
      el.card.classList.remove("no-anim");
    } else {
      el.card.classList.toggle("flipped", value);
    }
  }
  function flip() {
    if (state.finished || !state.deck.length) return;
    setFlip(!flipped, false);
  }

  // ===== 描画 =====
  function catLabel(c) {
    const f = CATEGORIES.find(x => x[0] === c);
    return f ? f[1] : c;
  }

  function accuracyText() {
    let ok = 0, ng = 0;
    const ids = new Set(filteredIds());
    for (const [id, s] of Object.entries(state.stats)) {
      if (!ids.has(Number(id))) continue;
      ok += s.ok; ng += s.ng;
    }
    const total = ok + ng;
    return total ? `正答率 ${Math.round((ok / total) * 100)}%（${ok}/${total}）` : "正答率 —";
  }

  function renderSettings() {
    document.querySelectorAll(".segmented button").forEach(b => {
      b.setAttribute("aria-checked", String(b.dataset.mode === state.settings.mode));
    });
    el.chips.querySelectorAll("button").forEach(b => {
      b.setAttribute("aria-checked", String(b.dataset.cat === state.settings.category));
    });
    el.shuffleToggle.checked = state.settings.shuffle;
  }

  function render() {
    renderSettings();
    const total = state.deck.length;
    el.accuracy.textContent = accuracyText();
    el.roundLabel.textContent = state.isReview ? `要復習 ${state.round}周目` : `${state.round}周目`;
    el.roundLabel.classList.toggle("review", state.isReview);

    if (!total) {
      el.counter.textContent = "0 / 0";
      el.progressBar.style.width = "0%";
      showRoundEnd("カードがありません", "このカテゴリにはカードがありません。ports.js に追加してください。", null);
      return;
    }

    if (state.finished) {
      el.counter.textContent = `${total} / ${total}`;
      el.progressBar.style.width = "100%";
      const answered = Object.values(state.answers);
      const ok = answered.filter(a => a === "ok").length;
      const review = reviewIds().length;
      const title = state.isReview ? "復習の周回が完了！" : "1周完了！";
      const text = `この周の結果：○ ${ok} / ✕ ${review}（採点 ${answered.length} / ${total} 枚）<br>` +
        (review ? `「わからなかった」${review}枚だけをもう一度出題します。` : "要復習はありません。お見事です！");
      showRoundEnd(title, text, review ? `要復習 ${review}枚を始める` : "全体をもう一周");
      return;
    }

    el.roundEnd.hidden = true;
    el.card.hidden = false;
    setButtons(true);
    el.prevBtn.disabled = state.index === 0;
    el.counter.textContent = `${state.index + 1} / ${total}`;
    el.progressBar.style.width = `${(state.index / total) * 100}%`;

    const c = state.deck[state.index];
    const p = byId.get(c.id);
    el.frontCat.textContent = el.backCat.textContent = catLabel(p.category);
    const ask = ASK[p.category] || DEFAULT_ASK;
    if (c.dir === "u2p") {
      el.frontAsk.textContent = ask.u2p;
      el.frontMain.textContent = p.service;
      el.frontMain.classList.remove("num");
      el.frontSub.textContent = p.usage;
      el.backMain.textContent = p.port;
      el.backMain.classList.add("num");
      el.backSub.textContent = `${p.service}（${p.usage}）`;
    } else {
      el.frontAsk.textContent = ask.p2u;
      el.frontMain.textContent = p.port;
      el.frontMain.classList.add("num");
      el.frontSub.textContent = "";
      el.backMain.textContent = p.service;
      el.backMain.classList.remove("num");
      el.backSub.textContent = `${p.usage}（${p.port}）`;
    }
    el.backNote.textContent = p.note || "";
    el.backNote.hidden = !p.note;
    el.backNote.classList.toggle("strong", highlight.has(p.port));
  }

  function showRoundEnd(title, html, btnLabel) {
    el.card.hidden = true;
    el.roundEnd.hidden = false;
    el.roundEndTitle.textContent = title;
    el.roundEndText.innerHTML = html;
    el.roundEndBtn.hidden = !btnLabel;
    if (btnLabel) el.roundEndBtn.textContent = btnLabel;
    setButtons(false);
    el.prevBtn.disabled = !state.deck.length;
  }

  function setButtons(enabled) {
    el.okBtn.disabled = el.ngBtn.disabled = el.nextBtn.disabled = !enabled;
  }

  // ===== イベント =====
  function buildChips() {
    const counts = {};
    PORTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    CATEGORIES.forEach(([key, label]) => {
      const n = key === "all" ? PORTS.length : (counts[key] || 0);
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.cat = key;
      b.innerHTML = `${label}<small>${n}</small>`;
      b.addEventListener("click", () => {
        if (state.settings.category === key) return;
        state.settings.category = key;
        startFresh();
      });
      el.chips.appendChild(b);
    });
  }

  document.querySelectorAll(".segmented button").forEach(b => {
    b.addEventListener("click", () => {
      if (state.settings.mode === b.dataset.mode) return;
      state.settings.mode = b.dataset.mode;
      startFresh();
    });
  });

  el.card.addEventListener("click", () => {
    if (swiped) { swiped = false; return; }
    flip();
  });
  el.okBtn.addEventListener("click", () => grade("ok"));
  el.ngBtn.addEventListener("click", () => grade("ng"));
  el.nextBtn.addEventListener("click", next);
  el.prevBtn.addEventListener("click", prev);
  el.roundEndBtn.addEventListener("click", continueAfterRound);
  el.shuffleBtn.addEventListener("click", () => {
    const wasShuffle = state.settings.shuffle;
    state.settings.shuffle = true; // ボタンは常にシャッフルして最初から
    startFresh();
    state.settings.shuffle = wasShuffle;
    save();
    renderSettings();
  });
  el.shuffleToggle.addEventListener("change", () => {
    state.settings.shuffle = el.shuffleToggle.checked;
    save();
  });
  el.resetBtn.addEventListener("click", () => {
    if (!confirm("進捗と正答率をすべてリセットします。よろしいですか？")) return;
    const settings = state.settings;
    state = freshState();
    state.settings = settings;
    startFresh();
  });

  // キーボード操作
  document.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case " ":
      case "Spacebar":
        e.preventDefault();
        if (state.finished) continueAfterRound(); else flip();
        break;
      case "ArrowRight": e.preventDefault(); next(); break;
      case "ArrowLeft": e.preventDefault(); prev(); break;
      case "ArrowUp": e.preventDefault(); grade("ok"); break;
      case "ArrowDown": e.preventDefault(); grade("ng"); break;
      case "Enter":
        if (state.finished) { e.preventDefault(); continueAfterRound(); }
        break;
    }
  });

  // スワイプ操作（左=次、右=前）
  let startX = 0, startY = 0, tracking = false, swiped = false;
  el.card.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });
  el.card.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true; // 直後の click（めくり）を無視する
      setTimeout(() => { swiped = false; }, 400);
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  // ===== 起動 =====
  buildChips();
  if (!state.deck.length && filteredIds().length) {
    startFresh();
  } else {
    appendNewCards();
    render();
  }

  // オフライン対応（http/https で開いたときのみ）
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();

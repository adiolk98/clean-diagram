/* Page behaviour: drag the layout, edit the graph, export the source back out.
   Source of truth is the Mermaid text held on each panel (`panel.__src`); every
   edit rewrites that text (DiagramSrc) and re-renders. Nothing is written back
   to disk — `匯出` hands the text back so you can paste it into the .mmd. */
(function () {
  "use strict";
  var S = window.DiagramSrc;

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#1c1e21",
      primaryBorderColor: "rgba(243,242,239,0.20)",
      primaryTextColor: "#f3f2ef",
      lineColor: "#97968f",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      fontSize: "13px"
    },
    flowchart: { curve: "basis", htmlLabels: true }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- per-browser storage ---------- */

  function key(panel, kind) { return "clean-diagram:" + document.title + ":" + panel.id + ":" + kind; }

  function load(panel, kind, fallback) {
    try { return JSON.parse(localStorage.getItem(key(panel, kind))) || fallback; }
    catch (e) { return fallback; }
  }

  function save(panel, kind, value) {
    try { localStorage.setItem(key(panel, kind), JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function forget(panel) {
    ["src", "layout"].forEach(function (kind) {
      try { localStorage.removeItem(key(panel, kind)); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- geometry ---------- */

  function svgPoint(svg, el, x, y) {
    var pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    return pt.matrixTransform(el.getScreenCTM().inverse());
  }

  function idOf(node) { return S.parseDomId(node.id) || node.id; }

  /* ---------- label text <-> Mermaid label ---------- */

  // Mermaid paints a label as <p>main<br><span class="sublabel">detail</span></p>.
  // Only the main text is editable: Chrome drops focus when a contenteditable
  // host loses all of its element children, which ate the first keystroke.
  function mainNodes(host) {
    var kids = Array.prototype.slice.call(host.childNodes);
    var stop = kids.length;
    kids.forEach(function (n, i) {
      var isSub = n.nodeName === "BR" || (n.classList && n.classList.contains("sublabel"));
      if (isSub && i < stop) { stop = i; }
    });
    return kids.slice(0, stop);
  }

  function labelHost(node) {
    var lab = node.querySelector(".nodeLabel") || node.querySelector("foreignObject div");
    return lab ? (lab.querySelector("p") || lab) : null;
  }

  function labelSource(host, mainText) {
    var sub = host.querySelector(".sublabel");
    var subText = sub ? sub.textContent.replace(/\s+/g, " ").trim() : "";
    var main = String(mainText).replace(/\s+/g, " ").trim();
    if (!main) { return null; }
    return main + (subText ? "<br/><span class='sublabel'>" + subText + "</span>" : "");
  }

  /* ---------- rewrite the source, re-render the panel ---------- */

  // Always re-renders, even when the text is unchanged — that is how a cancelled
  // label edit gets its original text painted back.
  function apply(panel, src, keepLayout) {
    if (src == null) { return; }
    var previous = panel.__src;
    panel.__src = src;
    save(panel, "src", src);
    if (!keepLayout) { save(panel, "layout", {}); }

    var canvas = panel.querySelector(".diagram-canvas");
    var pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.innerHTML = src;
    canvas.textContent = "";
    canvas.appendChild(pre);
    panel.dataset.ready = "";
    panel.__sel = null;

    mermaid.run({ nodes: [pre] })
      .then(function () { initPanel(panel, true); })
      .catch(function () { if (previous !== src) { apply(panel, previous, true); } });
  }

  /* ---------- one panel: drag, select, edit ---------- */

  function initPanel(panel, quiet) {
    if (panel.dataset.ready) { return; }
    var svg = panel.querySelector(".diagram-canvas svg");
    if (!svg) { return; }
    panel.dataset.ready = "1";

    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", document.title);

    var nodes = Array.prototype.slice.call(svg.querySelectorAll("g.node"));
    var edges = Array.prototype.slice.call(svg.querySelectorAll("g.edgePaths path, path.flowchart-link"));
    var labels = Array.prototype.slice.call(svg.querySelectorAll("g.edgeLabels > g"));
    if (!nodes.length) { return; }

    var refEl = edges.length ? edges[0].parentNode : nodes[0].parentNode;
    function boxOf(node) {
      var r = node.getBoundingClientRect();
      var a = svgPoint(svg, refEl, r.left, r.top);
      var b = svgPoint(svg, refEl, r.right, r.bottom);
      return { w: b.x - a.x, h: b.y - a.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }

    function nearestNode(pt) {
      var best = null, bestD = Infinity;
      nodes.forEach(function (n) {
        var b = boxOf(n);
        var d = Math.pow(b.cx - pt.x, 2) + Math.pow(b.cy - pt.y, 2);
        if (d < bestD) { bestD = d; best = n; }
      });
      return best;
    }

    var links = edges.map(function (path) {
      var len = path.getTotalLength();
      if (!len) { return null; }
      var from = nearestNode(path.getPointAtLength(0));
      var to = nearestNode(path.getPointAtLength(len));
      if (!from || !to || from === to) { return null; }
      var mid = path.getPointAtLength(len / 2);
      var label = null, bestD = 40 * 40;
      labels.forEach(function (g) {
        var r = g.getBoundingClientRect();
        if (!r.width) { return; }
        var c = svgPoint(svg, refEl, (r.left + r.right) / 2, (r.top + r.bottom) / 2);
        var d = Math.pow(c.x - mid.x, 2) + Math.pow(c.y - mid.y, 2);
        if (d < bestD) { bestD = d; label = g; }
      });
      return { path: path, from: from, to: to, label: label };
    }).filter(Boolean);

    // a fat transparent twin of each edge, so thin lines are clickable
    links.forEach(function (l) {
      var hit = l.path.cloneNode(false);
      hit.removeAttribute("marker-end");
      hit.removeAttribute("style");
      hit.setAttribute("class", "edge-hit");
      l.path.parentNode.insertBefore(hit, l.path);
      l.hit = hit;
    });

    // ponytail: dragged edges become straight segments instead of mermaid's
    // curves — add orthogonal elbow routing only if crossings become a complaint.
    function edgePoint(box, tx, ty) {
      var dx = tx - box.cx, dy = ty - box.cy;
      if (!dx && !dy) { return { x: box.cx, y: box.cy }; }
      var sx = dx ? (box.w / 2) / Math.abs(dx) : Infinity;
      var sy = dy ? (box.h / 2) / Math.abs(dy) : Infinity;
      var s = Math.min(sx, sy);
      return { x: box.cx + dx * s, y: box.cy + dy * s };
    }

    function redraw(node) {
      links.forEach(function (l) {
        if (node && l.from !== node && l.to !== node) { return; }
        var a = boxOf(l.from), b = boxOf(l.to);
        var p1 = edgePoint(a, b.cx, b.cy);
        var p2 = edgePoint(b, a.cx, a.cy);
        var d = "M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y;
        l.path.setAttribute("d", d);
        if (l.hit) { l.hit.setAttribute("d", d); }
        if (l.label) {
          l.label.setAttribute("transform", "translate(" + (p1.x + p2.x) / 2 + "," + (p1.y + p2.y) / 2 + ")");
        }
      });
    }

    var offsets = load(panel, "layout", {});

    nodes.forEach(function (node) {
      var m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/.exec(node.getAttribute("transform") || "");
      node.__base = m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
      var saved = offsets[idOf(node)];
      if (saved) {
        node.setAttribute("transform", "translate(" + (node.__base.x + saved[0]) + "," + (node.__base.y + saved[1]) + ")");
      }
    });
    if (Object.keys(offsets).length) { redraw(null); }

    /* --- selection --- */

    function clearSelection() {
      nodes.forEach(function (n) { n.classList.remove("is-selected", "is-source"); });
      links.forEach(function (l) { l.path.classList.remove("is-selected"); });
      panel.__sel = null;
    }

    function selectNode(node) {
      clearSelection();
      node.classList.add("is-selected");
      panel.__sel = { kind: "node", id: idOf(node) };
    }

    function selectLink(l) {
      clearSelection();
      l.path.classList.add("is-selected");
      panel.__sel = { kind: "edge", from: idOf(l.from), to: idOf(l.to) };
    }

    panel.__delete = function () {
      var sel = panel.__sel;
      if (!sel) { return; }
      if (sel.kind === "node") { apply(panel, S.removeNode(panel.__src, sel.id), false); }
      else { apply(panel, S.removeEdge(panel.__src, sel.from, sel.to), false); }
    };

    /* --- edit a label in place --- */

    function editLabel(node) {
      var host = labelHost(node);
      if (!host || host.querySelector(".edit-main")) { return; }

      var span = document.createElement("span");
      span.className = "edit-main";
      var main = mainNodes(host);
      host.insertBefore(span, main[0] || host.firstChild);
      main.forEach(function (n) { span.appendChild(n); });

      var before = span.textContent;
      span.setAttribute("contenteditable", "true");
      span.focus();
      var range = document.createRange();
      range.selectNodeContents(span);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      var done = false;
      function stop(commit) {
        if (done) { return; }
        done = true;
        span.removeAttribute("contenteditable");
        var text = commit ? span.textContent : before;
        var label = (text === before) ? null : labelSource(host, text);
        apply(panel, (label && S.rename(panel.__src, idOf(node), label)) || panel.__src, true);
      }

      span.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); stop(true); }
        else if (e.key === "Escape") { e.preventDefault(); stop(false); }
        e.stopPropagation();
      });
      span.addEventListener("blur", function () { stop(true); });
    }

    /* --- drag / connect --- */

    var active = null, start = null, startOffset = null, moved = false;

    svg.addEventListener("pointerdown", function (e) {
      var node = e.target.closest && e.target.closest("g.node");
      if (!node) { clearSelection(); return; }
      if (e.target.isContentEditable) { return; }

      if (panel.__connect) {
        if (!panel.__from) {
          panel.__from = node;
          node.classList.add("is-source");
        } else if (panel.__from !== node) {
          var src = S.addEdge(panel.__src, idOf(panel.__from), idOf(node));
          panel.__connect = false;
          panel.__from = null;
          panel.classList.remove("is-connecting");
          if (panel.__connectBtn) { panel.__connectBtn.classList.remove("is-on"); }
          apply(panel, src, false);
        }
        e.preventDefault();
        return;
      }

      active = node;
      moved = false;
      node.classList.add("is-dragging");
      start = svgPoint(svg, refEl, e.clientX, e.clientY);
      startOffset = offsets[idOf(node)] || [0, 0];
      node.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    svg.addEventListener("pointermove", function (e) {
      if (!active) { return; }
      var p = svgPoint(svg, refEl, e.clientX, e.clientY);
      if (Math.abs(p.x - start.x) + Math.abs(p.y - start.y) > 2) { moved = true; }
      var snap = function (v) { return Math.round(v / 4) * 4; };
      offsets[idOf(active)] = [snap(startOffset[0] + (p.x - start.x)), snap(startOffset[1] + (p.y - start.y))];
      active.setAttribute("transform", "translate(" + (active.__base.x + offsets[idOf(active)][0]) + "," + (active.__base.y + offsets[idOf(active)][1]) + ")");
      redraw(active);
    });

    function release() {
      if (!active) { return; }
      active.classList.remove("is-dragging");
      if (!moved) { selectNode(active); }
      active = null;
      save(panel, "layout", offsets);
    }
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    svg.addEventListener("dblclick", function (e) {
      var node = e.target.closest && e.target.closest("g.node");
      if (node && !panel.__connect) { editLabel(node); }
    });

    svg.addEventListener("click", function (e) {
      var hit = e.target.closest && e.target.closest(".edge-hit");
      if (!hit) { return; }
      var link = links.filter(function (l) { return l.hit === hit; })[0];
      if (link) { selectLink(link); }
    });

    if (panel.__focusId) {
      var fresh = nodes.filter(function (n) { return idOf(n) === panel.__focusId; })[0];
      panel.__focusId = null;
      if (fresh) { selectNode(fresh); editLabel(fresh); }
    }

    if (reduceMotion || quiet) { return; }
    panel.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      { duration: 400, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }
    );
    nodes.concat(Array.prototype.slice.call(svg.querySelectorAll("g.cluster"))).forEach(function (el, i) {
      el.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 350, delay: Math.min(i * 30, 400), easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }
      );
    });
  }

  /* ---------- toolbar ---------- */

  function button(text, title) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-quiet btn-sm";
    b.textContent = text;
    b.title = title;
    return b;
  }

  function toolbar(panel) {
    var actions = panel.querySelector(".panel-actions");
    if (!actions || actions.dataset.tools) { return; }
    actions.dataset.tools = "1";
    var reset = actions.querySelector("[data-reset]");

    var add = button("新增", "加一個節點,接著直接打字");
    add.addEventListener("click", function () {
      var id = S.newId(panel.__src, "N");
      panel.__focusId = id;
      apply(panel, S.addNode(panel.__src, id, "新節點"), true);
    });

    var connect = button("連線", "點起點,再點終點");
    panel.__connectBtn = connect;
    connect.addEventListener("click", function () {
      panel.__connect = !panel.__connect;
      panel.__from = null;
      panel.classList.toggle("is-connecting", panel.__connect);
      connect.classList.toggle("is-on", panel.__connect);
      var source = panel.querySelector("g.node.is-source");
      if (source) { source.classList.remove("is-source"); }
    });

    var drawer = document.createElement("div");
    drawer.className = "export-drawer";
    drawer.hidden = true;
    var area = document.createElement("textarea");
    area.readOnly = true;
    area.spellcheck = false;
    var hint = document.createElement("p");
    hint.className = "meta";
    hint.style.margin = "8px 0 0";
    hint.textContent = "PASTE BACK INTO THE .MMD AND RE-RENDER";
    drawer.appendChild(area);
    drawer.appendChild(hint);
    panel.appendChild(drawer);

    var exportBtn = button("匯出", "把目前這張圖的 Mermaid 原始碼拿回去");
    exportBtn.addEventListener("click", function () {
      drawer.hidden = !drawer.hidden;
      if (drawer.hidden) { return; }
      area.value = panel.__src.trim() + "\n";
      area.select();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(area.value).then(function () {
          exportBtn.textContent = "已複製";
          setTimeout(function () { exportBtn.textContent = "匯出"; }, 1600);
        }, function () { /* clipboard blocked — the textarea is already selected */ });
      }
    });

    [add, connect, exportBtn].forEach(function (b) { actions.insertBefore(b, reset); });

    if (reset) {
      reset.addEventListener("click", function () {
        forget(panel);
        location.reload();
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Delete" && e.key !== "Backspace") { return; }
    if (document.activeElement && document.activeElement.isContentEditable) { return; }
    var target = e.target;
    if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) { return; }
    var panel = document.querySelector(".diagram-panel:not([hidden])");
    Array.prototype.slice.call(document.querySelectorAll(".diagram-panel")).forEach(function (p) {
      if (p.__sel && p.offsetParent) { panel = p; }
    });
    if (panel && panel.__sel) { e.preventDefault(); panel.__delete(); }
  });

  /* ---------- views ---------- */

  function showView(name) {
    ["engineer", "plain"].forEach(function (v) {
      var section = document.getElementById("view-" + v);
      if (!section) { return; }
      section.hidden = (v !== name);
    });
    document.querySelectorAll("[data-view]").forEach(function (b) {
      b.classList.toggle("is-on", b.dataset.view === name);
    });
    var panel = document.querySelector("#view-" + name + " .diagram-panel");
    if (panel) { initPanel(panel); }
  }

  document.querySelectorAll("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () { showView(b.dataset.view); });
  });

  // The Mermaid text on the page is the starting point; a saved edit wins.
  document.querySelectorAll(".diagram-panel").forEach(function (panel) {
    var pre = panel.querySelector("pre.mermaid");
    if (!pre) { return; }
    var saved = load(panel, "src", null);
    if (saved) { pre.innerHTML = saved; }
    panel.__src = pre.innerHTML;
  });

  // Both diagrams must be laid out while visible — mermaid (and getBBox) can't
  // measure inside a hidden section — so render first, then hide the second view.
  mermaid.run().then(function () {
    document.querySelectorAll(".diagram-panel").forEach(function (panel) {
      initPanel(panel);
      toolbar(panel);
    });
    showView("engineer");
  });
})();

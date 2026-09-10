/* Text surgery on a Mermaid flowchart source. Pure — no DOM, no state.
   Browser: window.DiagramSrc. Node (scripts/test_edit.js): module.exports.

   ponytail: line-based, not a real parser. It assumes the grammar this skill
   writes — one node declaration per line, labels in double quotes. Anything it
   can't place, it refuses (returns null) and the page falls back to read-only.
   Reach for a real parser only when hand-written .mmd files start hitting that
   refusal. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) { module.exports = api; }
  root.DiagramSrc = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // longest opener first: "[(" must win over "["
  var SHAPES = [["[(", ")]"], ["([", "])"], ["((", "))"], ["[", "]"], ["{", "}"], ["(", ")"]];
  var ARROW = /-{2,3}>|-\.->|={2,3}>|---|-\.-/;
  var KEYWORD = /^\s*(classDef|class|subgraph|end|%%|flowchart|graph|style|linkStyle|direction)\b/;

  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function token(id) { return new RegExp("(^|[^\\w-])" + esc(id) + "(?![\\w-])"); }
  function bare(line) { return line.replace(/"[^"]*"/g, '""'); }
  function clean(text) { return String(text).replace(/[\r\n]+/g, " ").replace(/"/g, "'").trim(); }
  function trimEnd(src) { return src.replace(/\s*$/, ""); }

  // mermaid ids look like "mermaid-1699999-flowchart-Api-3"; the middle is ours
  function parseDomId(domId) {
    var m = /.*flowchart-(.+)-\d+$/.exec(domId || "");
    return m ? m[1] : null;
  }

  // Where node `id` is declared with a label, or null.
  function declOf(src, id) {
    var lines = src.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (KEYWORD.test(line) || ARROW.test(bare(line))) { continue; }
      var m = token(id).exec(line);
      if (!m) { continue; }
      var at = m.index + m[1].length + id.length;
      var rest = line.slice(at);
      for (var s = 0; s < SHAPES.length; s++) {
        var open = SHAPES[s][0], close = SHAPES[s][1];
        if (rest.indexOf(open) === 0 && line.lastIndexOf(close) > at) {
          return { line: i, open: open, close: close, start: at, end: line.lastIndexOf(close) };
        }
      }
    }
    return null;
  }

  function hasId(src, id) {
    return src.split("\n").some(function (line) {
      return !/^\s*(classDef|%%)/.test(line) && token(id).test(bare(line));
    });
  }

  function newId(src, base) {
    var stem = (base || "N").replace(/[^A-Za-z]/g, "") || "N";
    for (var i = 1; i < 500; i++) {
      if (!hasId(src, stem + i)) { return stem + i; }
    }
    return stem + Date.now();
  }

  function rename(src, id, label) {
    var d = declOf(src, id);
    if (!d) { return null; }
    var lines = src.split("\n"), line = lines[d.line];
    lines[d.line] = line.slice(0, d.start) + d.open + '"' + clean(label) + '"' + line.slice(d.end);
    return lines.join("\n");
  }

  function addNode(src, id, label) {
    return trimEnd(src) + "\n  " + id + '["' + clean(label) + '"]\n';
  }

  // Drops the declaration, every edge touching the node, and the node's name
  // out of any `class a,b role` list.
  function removeNode(src, id) {
    var out = [];
    src.split("\n").forEach(function (line) {
      if (!token(id).test(bare(line))) { out.push(line); return; }
      var cls = /^(\s*class\s+)([^\s]+)(\s+\S+\s*)$/.exec(line);
      if (cls) {
        var list = cls[2].split(",").filter(function (x) { return x !== id; });
        if (list.length) { out.push(cls[1] + list.join(",") + cls[3]); }
        return;
      }
      if (/^\s*(classDef|subgraph|flowchart|graph|%%)\b/.test(line)) { out.push(line); return; }
    });
    return out.join("\n");
  }

  function findEdge(src, from, to) {
    var lines = src.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = bare(lines[i]);
      if (KEYWORD.test(line)) { continue; }
      var m = ARROW.exec(line);
      if (!m) { continue; }
      var left = line.slice(0, m.index);
      var right = line.slice(m.index + m[0].length).replace(/^\s*\|[^|]*\|/, "");
      if (token(from).test(left) && token(to).test(right)) { return i; }
    }
    return -1;
  }

  function addEdge(src, from, to, label) {
    if (from === to || findEdge(src, from, to) !== -1) { return src; }
    var arrow = label ? " -->|" + clean(label) + "| " : " --> ";
    return trimEnd(src) + "\n  " + from + arrow + to + "\n";
  }

  function removeEdge(src, from, to) {
    var at = findEdge(src, from, to);
    if (at === -1) { return src; }
    var lines = src.split("\n");
    lines.splice(at, 1);
    return lines.join("\n");
  }

  return {
    parseDomId: parseDomId, declOf: declOf, hasId: hasId, newId: newId,
    rename: rename, addNode: addNode, removeNode: removeNode,
    findEdge: findEdge, addEdge: addEdge, removeEdge: removeEdge
  };
});

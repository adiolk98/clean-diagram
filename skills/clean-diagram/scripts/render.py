#!/usr/bin/env python3
"""Render Mermaid definitions into one self-contained HTML architecture map.

Usage:
    python3 render.py <engineer.mmd> <output.html> --title "Title" [options]

Options:
    --subtitle TEXT     one-line description under the title
    --scope TEXT        what was mapped, e.g. "whole repo" / "src/payments"
    --notes FILE        one note per line: "Title :: what to look at"
    --plain FILE        second Mermaid file — the diagram for non-engineers
    --explain FILE      ELI5 text for the plain view; blank line = new paragraph
"""
import argparse
import html
import pathlib

SKILL_DIR = pathlib.Path(__file__).resolve().parent.parent


def read(path):
    return pathlib.Path(path).read_text() if path else ""


def build_notes(notes_file):
    if not notes_file:
        return ""
    rows = []
    for i, line in enumerate(read(notes_file).splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        title, _, body = line.partition("::")
        rows.append(
            '<div class="row"><div class="row-top">'
            f'<span class="row-title">{html.escape(title.strip())}</span>'
            f'<span class="idx">{i:02d}</span></div>'
            f'<p class="body">{html.escape(body.strip())}</p></div>'
        )
    if not rows:
        return ""
    return (
        '<section class="panel" id="notes-panel" style="margin-bottom: 48px;">'
        '<div class="panel-head"><h3>Worth a look</h3>'
        '<span class="meta">GAPS · RISKS · QUESTIONS</span></div>'
        f'<div class="rows">{"".join(rows)}</div></section>'
    )


def build_plain(plain_file, explain_file):
    if not plain_file:
        return "", ""
    paragraphs = "".join(
        f'<p class="body">{html.escape(p.strip())}</p>'
        for p in read(explain_file).split("\n\n") if p.strip()
    )
    view = (
        '<section id="view-plain" hidden style="margin-top: 24px;">'
        '<section class="panel diagram-panel" id="panel-plain" style="margin-bottom: 2px;">'
        '<div class="panel-head"><h3>怎麼運作的</h3>'
        '<span class="panel-actions"><span class="meta">FOR EVERYONE</span>'
        '<button class="btn btn-quiet btn-sm" data-reset="panel-plain" type="button">重設佈局</button>'
        '</span></div>'
        '<div class="diagram-canvas"><pre class="mermaid">\n__PLAIN_DEF__\n</pre></div>'
        '<p class="meta" style="margin: 12px 0 0;">DRAG NODES TO REARRANGE</p>'
        '</section>'
        + (
            '<section class="panel explain" style="margin-bottom: 48px;">'
            '<div class="panel-head"><h3>白話說明</h3><span class="meta">ELI5</span></div>'
            f'{paragraphs}</section>' if paragraphs else ""
        )
        + '</section>'
    ).replace("__PLAIN_DEF__", read(plain_file))

    switch = (
        '<div class="seg view-switch">'
        '<button type="button" data-view="engineer" class="is-on">工程視角</button>'
        '<button type="button" data-view="plain">說明視角</button>'
        '</div>'
    )
    return view, switch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mermaid_file")
    parser.add_argument("output_html")
    parser.add_argument("--title", default="Architecture Diagram")
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--scope", default="generated · read-only")
    parser.add_argument("--notes")
    parser.add_argument("--plain")
    parser.add_argument("--explain")
    args = parser.parse_args()

    plain_view, view_switch = build_plain(args.plain, args.explain)

    html_out = (
        (SKILL_DIR / "assets" / "template.html").read_text()
        .replace("__EDITORIAL_CSS__", (SKILL_DIR / "assets" / "editorial-dark.css").read_text())
        .replace("__MERMAID_JS__", (SKILL_DIR / "assets" / "mermaid.min.js").read_text())
        .replace("__MERMAID_DEF__", read(args.mermaid_file))
        .replace("__TITLE__", html.escape(args.title))
        .replace("__SUBTITLE__", html.escape(args.subtitle))
        .replace("__SCOPE__", html.escape(args.scope))
        .replace("__NOTES_PANEL__", build_notes(args.notes))
        .replace("__PLAIN_VIEW__", plain_view)
        .replace("__VIEW_SWITCH__", view_switch)
    )

    out = pathlib.Path(args.output_html)
    out.write_text(html_out)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Smoke check: python3 test_render.py — fails loudly if rendering breaks."""
import pathlib
import subprocess
import tempfile

HERE = pathlib.Path(__file__).resolve().parent


def render(tmp, *extra):
    mmd = tmp / "eng.mmd"
    mmd.write_text("flowchart LR\n  A[App] --> B[(DB)]\n  classDef entry fill:transparent\n  class A entry\n")
    out = tmp / "out.html"
    subprocess.run(
        ["python3", str(HERE / "render.py"), str(mmd), str(out), "--title", "T", "--subtitle", "S", *extra],
        check=True, capture_output=True,
    )
    return out.read_text()


with tempfile.TemporaryDirectory() as d:
    tmp = pathlib.Path(d)

    minimal = render(tmp)
    assert "__" not in minimal.split("<script>")[0], "unreplaced placeholder in the page body"
    assert 'id="notes-panel"' not in minimal, "notes panel rendered without --notes"
    assert 'id="view-plain"' not in minimal, "plain view rendered without --plain"
    assert "mermaid" in minimal and "flowchart LR" in minimal

    (tmp / "notes.txt").write_text("No retries :: Stripe calls have no fallback.\n\n")
    (tmp / "plain.mmd").write_text("flowchart LR\n  U[User] --> S[Site]\n")
    (tmp / "explain.txt").write_text("It is like a restaurant.\n\nYou order, the kitchen cooks.\n")
    full = render(tmp, "--notes", str(tmp / "notes.txt"), "--plain", str(tmp / "plain.mmd"),
                  "--explain", str(tmp / "explain.txt"))
    assert "No retries" in full and 'id="notes-panel"' in full
    assert 'data-view="plain"' in full and 'id="view-plain"' in full
    assert full.count("<p class=\"body\">") == 3, "1 note + 2 explain paragraphs expected"
    assert "__" not in full.split("<script>")[0]

print("ok")

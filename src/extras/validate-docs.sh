#!/usr/bin/env bash
set -euo pipefail

docs_root="${1:-docs/www}"

if [[ "$#" -gt 1 ]]; then
  printf 'usage: %s [docs-root]\n' "$0" >&2
  exit 2
fi

if [[ ! -d "$docs_root" ]]; then
  printf 'Missing documentation root: %s\n' "$docs_root" >&2
  exit 2
fi

if ! command -v uv >/dev/null 2>&1; then
  printf 'uv is required to validate hsblabs documentation\n' >&2
  exit 2
fi

schema_url="https://hsb.horse/hsblabs/oss/extras/document-schema.json?ts=$(date +%s)-$$"

uv run --with pyyaml --with jsonschema python - "$docs_root" "$schema_url" <<'PY'
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

import jsonschema
import yaml


FRONTMATTER_PATTERN = re.compile(
    r"\A(?:\ufeff)?---\n(?P<frontmatter>.*?)\n---\n", re.DOTALL
)
MARKDOWN_LINK_PATTERN = re.compile(
    r"!?(?:\[[^\]]*\])\((?P<target>[^)\s]+)(?:\s+[\"'][^\"']*[\"'])?\)"
)
EXTERNAL_SCHEME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")


def is_within(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
    except ValueError:
        return False
    return True


def fetch_schema(url: str) -> dict[str, object]:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "User-Agent": "hsblabs-docs-validator/0.1 (+https://hsb.horse/)",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except Exception as error:
        print(f"Failed to fetch the published schema: {error}", file=sys.stderr)
        raise SystemExit(2)


def validate_semantics(
    document: dict[str, object], path: Path, issues: list[str]
) -> None:
    if document.get("type") == "Attested Computation" and not document.get(
        "runtime"
    ):
        issues.append(f"{path}: type 'Attested Computation' requires 'runtime'")

    sources = document.get("sources")
    if isinstance(sources, list):
        has_usage_count = any(
            isinstance(source, dict) and "usage_count" in source
            for source in sources
        )
        has_top_level_window = "usage_window" in document
        every_source_has_window = all(
            not isinstance(source, dict)
            or "usage_count" not in source
            or "usage_window" in source
            for source in sources
        )
        if (
            has_usage_count
            and not has_top_level_window
            and not every_source_has_window
        ):
            issues.append(
                f"{path}: sources with usage_count require a top-level or per-source usage_window"
            )

    hsblabs = document.get("hsblabs")
    if (
        isinstance(hsblabs, dict)
        and "sidebar" in hsblabs
        and "sidebar" in document
    ):
        issues.append(
            f"{path}: do not define both 'hsblabs.sidebar' and 'sidebar'"
        )


def validate_assets(
    source: Path,
    body: str,
    docs_root: Path,
    assets_root: Path,
    issues: list[str],
) -> None:
    for match in MARKDOWN_LINK_PATTERN.finditer(body):
        target = match.group("target")
        target_path = target.split("?", 1)[0].split("#", 1)[0]

        if (
            not target_path
            or EXTERNAL_SCHEME_PATTERN.match(target_path)
            or target_path.startswith("//")
            or target_path.endswith(".md")
            or target_path.endswith("/")
            or Path(target_path).suffix == ""
        ):
            continue

        resolved = (
            docs_root / target_path.lstrip("/")
            if target_path.startswith("/")
            else source.parent / target_path
        ).resolve()

        if not is_within(resolved, assets_root):
            issues.append(
                f"{source}: {target}: local non-Markdown files must resolve under docs/www/assets"
            )
        elif not resolved.is_file():
            issues.append(f"{source}: missing local asset: {target}")


def validate_markdown(
    source: Path,
    docs_root: Path,
    assets_root: Path,
    validator,
    issues: list[str],
) -> None:
    content = source.read_text(encoding="utf-8")
    match = FRONTMATTER_PATTERN.match(content)

    if not match:
        issues.append(f"{source}: Markdown must start with YAML frontmatter")
        return

    try:
        document = yaml.safe_load(match.group("frontmatter"))
    except yaml.YAMLError as error:
        issues.append(f"{source}: invalid YAML frontmatter: {error}")
        return

    if not isinstance(document, dict):
        issues.append(f"{source}: frontmatter must be a YAML object")
        return

    for error in sorted(
        validator.iter_errors(document),
        key=lambda item: tuple(str(part) for part in item.path),
    ):
        location = ".".join(str(part) for part in error.path) or "<root>"
        issues.append(f"{source}: {location}: {error.message}")

    validate_semantics(document, source, issues)
    validate_assets(source, content[match.end():], docs_root, assets_root, issues)


def validate(docs_root: Path, schema_url: str) -> int:
    docs_root = docs_root.resolve()
    if not docs_root.is_dir():
        print(f"Missing documentation root: {docs_root}", file=sys.stderr)
        return 2

    assets_root = docs_root / "assets"
    validator = jsonschema.Draft202012Validator(fetch_schema(schema_url))
    issues: list[str] = []
    markdown_count = 0

    for current, directories, filenames in os.walk(docs_root, followlinks=False):
        current_path = Path(current)

        for directory in list(directories):
            path = current_path / directory
            if path.is_symlink():
                issues.append(f"{path}: symlinks are not allowed in docs/www")
                directories.remove(directory)

        for filename in filenames:
            path = current_path / filename
            if path.is_symlink():
                issues.append(f"{path}: symlinks are not allowed in docs/www")
                continue

            if is_within(path, assets_root):
                continue

            if path.suffix != ".md":
                issues.append(
                    f"{path}: non-Markdown files are only allowed under docs/www/assets"
                )
                continue

            markdown_count += 1
            validate_markdown(path, docs_root, assets_root, validator, issues)

    if issues:
        print("\n".join(issues), file=sys.stderr)
        return 1

    print(f"validated {markdown_count} Markdown documents under {docs_root}")
    return 0


raise SystemExit(validate(Path(sys.argv[1]), sys.argv[2]))
PY

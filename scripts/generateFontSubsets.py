"""Regenerate the bundled common-character web-font subsets.

Requires fonttools with WOFF2 support (``pip install fonttools brotli``).
The source fonts remain in ``public/fonts`` as the on-demand fallback.
"""

from hashlib import sha256
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "public" / "fonts"
FONT_SOURCES = (
    ("kinghwa-old-song-full-v1.woff2", "kinghwa-old-song-gb2312"),
)


def common_codepoints() -> set[int]:
    # GB2312 contains 6,763 simplified-Chinese characters. Add the punctuation,
    # symbols and Latin ranges commonly used by character sheets and user input.
    characters = set()
    for lead in range(0xA1, 0xF8):
        for trail in range(0xA1, 0xFF):
            try:
                characters.update(bytes((lead, trail)).decode("gb2312"))
            except UnicodeDecodeError:
                pass

    for start, end in (
        (0x0020, 0x024F),
        (0x2000, 0x206F),
        (0x20A0, 0x20CF),
        (0x2100, 0x214F),
        (0x2190, 0x22FF),
        (0x2460, 0x27BF),
        (0x3000, 0x303F),
        (0x31C0, 0x31EF),
        (0xFF00, 0xFFEF),
    ):
        characters.update(chr(codepoint) for codepoint in range(start, end + 1))

    # Keep every character currently shipped in the UI/data, including any
    # traditional or uncommon characters outside GB2312.
    source_paths = [ROOT / "index.html"]
    source_paths.extend(
        path
        for directory in (ROOT / "src", ROOT / "public")
        for path in directory.rglob("*")
        if path.is_file()
        and path.suffix.lower() in {".css", ".html", ".js", ".json", ".jsx", ".md", ".txt"}
    )
    for path in source_paths:
        characters.update(path.read_text(encoding="utf-8"))

    return {ord(character) for character in characters}


def subset_font(source_name: str, output_stem: str, unicodes: set[int]) -> Path:
    font = TTFont(FONT_DIR / source_name)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.recommended_glyphs = True
    options.notdef_glyph = True
    options.notdef_outline = True

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.flavor = "woff2"
    temporary_path = FONT_DIR / f".{output_stem}.tmp.woff2"
    font.save(temporary_path)

    digest = sha256(temporary_path.read_bytes()).hexdigest()[:12]
    output_path = FONT_DIR / f"{output_stem}-{digest}.woff2"
    if output_path.exists():
        temporary_path.unlink()
    else:
        temporary_path.replace(output_path)
    return output_path


def main() -> None:
    unicodes = common_codepoints()
    print(f"Subsetting for {len(unicodes):,} code points")
    for source_name, output_stem in FONT_SOURCES:
        output_path = subset_font(source_name, output_stem, unicodes)
        source_size = (FONT_DIR / source_name).stat().st_size
        output_size = output_path.stat().st_size
        print(
            f"{output_path.name}: {output_size / 1024 / 1024:.2f} MiB "
            f"({output_size / source_size:.1%} of full font)"
        )


if __name__ == "__main__":
    main()

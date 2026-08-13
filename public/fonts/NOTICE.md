# Embedded font notices

These fonts are embedded for the character-card UI and print export. KingHwa
OldSong is shipped as a content-addressed GB2312/common-symbol subset for
normal use and as a complete on-demand fallback for uncommon user-entered
characters. Jiangxi Zhuokai is served directly as the complete font because
subsetting it saved less than one percent. The original copyright and
trademark metadata remain present in the WOFF2 files.

The KingHwa subset can be regenerated with
`python scripts/generateFontSubsets.py` after installing `fonttools` and
`brotli`. The generated filename includes a SHA-256 prefix; update the matching
URL in `src/style.css` when the content changes. Never replace a deployed font
at an existing URL because font responses use an immutable browser cache.

## KingHwa OldSong

- Display name: 京華老宋体 / KingHwa OldSong
- Copyright: Font © Copyright 2022 TerryWang. All rights reserved.
- Original TTF MD5: `04FCAE4B063F161E5718CDEC9C209C05`
- Complete WOFF2 SHA-256: `2CC113566149ABF4491A511D528B4C6F2BB02CF717A1BBBDC9518DF9C664723A`
- GB2312 subset WOFF2 SHA-256: `ED19104931F911CB885012C5C65814381AB41DB07E0151C98AE2E2E6958C1808`
- Font and permission information: https://fonts.zeoseven.com/items/309/
- Downloaded font record: https://font-04.zhaozi.org/0/4/04fcae4b063f161e5718cdec9c209c05.htm

The author's custom terms, summarized by the source above, permit commercial
and non-commercial use, embedding/integration, and redistribution while
retaining the font's copyright notice.

## Jiangxi Zhuokai 2.0

- Display name: 江西拙楷 2.0 / jiangxizhuokai
- Manufacturer and trademark: fontree
- Designer: Huang Yuchen
- Original TTF MD5: `307FBEF9D640CDB85C82370ADA99A0D3`
- Complete WOFF2 SHA-256: `9110A6CE75B5847A3D3D50F5DFFABEB6AD1C293DBF5430EB6F310EC4B2BE4BC3`
- Font and permission information: https://fonts.zeoseven.com/items/474/
- Source package: https://www.npmjs.com/package/@fontpkg/jiangxizhuokai

The author's custom terms, summarized by the source above, permit commercial
and non-commercial use, embedding/integration, and redistribution while
retaining the font's copyright notice.

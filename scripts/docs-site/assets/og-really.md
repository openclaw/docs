# Social-card italic artwork

`og-really.svg` is the fixed word “really” outlined from Sentient Italic 400,
matching the accent face on openclaw.ai. It is artwork, not an embedded or
redistributed font. Switzer remains live text in the card template.

- Source/owner: Indian Type Foundry, distributed through Fontshare.
- Source CSS: https://api.fontshare.com/v2/css?f[]=sentient@400i&display=swap
- Source font: https://cdn.fontshare.com/wf/4TG2NXNCK3NYD52NRNOLGWJCNXGCHXS7/AEJBCSB5ILRV44ECPQW4TDSOEVQONWSQ/VLFJG7GKGM3UAH53OH7GOU7MPNJDZTJR.ttf
- Retrieved: 2026-09-30.
- Source font SHA-256: `d03a158579669690e12cf6f3333d61bb2abad121189ec9d01b81fbd3e2e9d4ca`.
- License: Fontshare Free Font EULA, recorded in `../fonts/Switzer-LICENSE.txt`.
  Section 01 permits logos, graphic elements, vector files and static images;
  attribution is optional. The font file is not included in this repository.
- Rendering: `@resvg/resvg-js`, 96px type, -2.5px letter spacing, baseline 110,
  256 × 140 view box, coral `#ef674c`, then `Resvg.toString()` to outline text.
  Retain the view box and remove root width/height so the card sets the size.
  Fontshare's API font has internal family name `false`; use that family with
  the downloaded font and system fonts disabled when regenerating this word.

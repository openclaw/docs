---
read_when:
    - Mac-debugbuilds bouwen of ondertekenen
summary: Ondertekeningsstappen voor macOS-debugbuilds die door verpakkingsscripts zijn gegenereerd
title: macOS-ondertekening
x-i18n:
    generated_at: "2026-05-07T13:22:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac-ondertekening (debugbuilds)

Deze app wordt meestal gebouwd vanuit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), dat nu:

- stelt een stabiele debugbundel-ID in: `ai.openclaw.mac.debug`
- schrijft de Info.plist met die bundel-ID (overschrijven via `BUNDLE_ID=...`)
- roept [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aan om het hoofdbinaire bestand en de appbundel te ondertekenen, zodat macOS elke rebuild als dezelfde ondertekende bundel behandelt en TCC-machtigingen behoudt (meldingen, toegankelijkheid, schermopname, microfoon, spraak). Gebruik voor stabiele machtigingen een echte ondertekeningsidentiteit; ad-hoc is opt-in en fragiel (zie [macOS-machtigingen](/nl/platforms/mac/permissions)).
- gebruikt standaard `CODESIGN_TIMESTAMP=auto`; dit schakelt vertrouwde tijdstempels in voor Developer ID-handtekeningen. Stel `CODESIGN_TIMESTAMP=off` in om tijdstempeling over te slaan (offline debugbuilds).
- injecteert buildmetadata in Info.plist: `OpenClawBuildTimestamp` (UTC) en `OpenClawGitCommit` (korte hash), zodat het Over-paneel build, git en debug-/releasekanaal kan tonen.
- **Verpakken gebruikt standaard Node 24**: het script voert TS-builds en de Control UI-build uit. Node 22 LTS, momenteel `22.16+`, blijft ondersteund voor compatibiliteit.
- leest `SIGN_IDENTITY` uit de omgeving. Voeg `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (of je Developer ID Application-certificaat) toe aan je shell-rc om altijd met je certificaat te ondertekenen. Ad-hoc-ondertekening vereist expliciete opt-in via `ALLOW_ADHOC_SIGNING=1` of `SIGN_IDENTITY="-"` (niet aanbevolen voor het testen van machtigingen).
- voert na het ondertekenen een Team ID-audit uit en faalt als een Mach-O binnen de appbundel is ondertekend door een andere Team ID. Stel `SKIP_TEAM_ID_CHECK=1` in om dit te omzeilen.

## Gebruik

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Opmerking over ad-hoc-ondertekening

Bij ondertekenen met `SIGN_IDENTITY="-"` (ad-hoc) schakelt het script automatisch de **Hardened Runtime** (`--options runtime`) uit. Dit is nodig om crashes te voorkomen wanneer de app ingebedde frameworks probeert te laden (zoals Sparkle) die niet dezelfde Team ID delen. Ad-hoc-handtekeningen verbreken ook de persistentie van TCC-machtigingen; zie [macOS-machtigingen](/nl/platforms/mac/permissions) voor herstelstappen.

## Buildmetadata voor Over

`package-mac-app.sh` voorziet de bundel van:

- `OpenClawBuildTimestamp`: ISO8601 UTC op het moment van verpakken
- `OpenClawGitCommit`: korte git-hash (of `unknown` indien niet beschikbaar)

Het tabblad Over leest deze sleutels om versie, builddatum, git-commit en of het een debugbuild is te tonen (via `#if DEBUG`). Voer de packager uit om deze waarden na codewijzigingen te vernieuwen.

## Waarom

TCC-machtigingen zijn gekoppeld aan de bundel-ID _en_ codehandtekening. Niet-ondertekende debugbuilds met veranderende UUID's zorgden ervoor dat macOS machtigingen na elke rebuild vergat. Het ondertekenen van de binaire bestanden (standaard ad-hoc) en het behouden van een vaste bundel-ID/pad (`dist/OpenClaw.app`) behoudt de machtigingen tussen builds, overeenkomstig de VibeTunnel-aanpak.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)

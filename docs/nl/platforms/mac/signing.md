---
read_when:
    - Mac-debugbuilds bouwen of ondertekenen
summary: Ondertekeningsstappen voor macOS-debugbuilds die door verpakkingsscripts worden gegenereerd
title: macOS-ondertekening
x-i18n:
    generated_at: "2026-04-29T22:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac-ondertekening (debugbuilds)

Deze app wordt meestal gebouwd vanuit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), dat nu:

- een stabiele debug-bundle-identificatie instelt: `ai.openclaw.mac.debug`
- de Info.plist schrijft met die bundle-id (overschrijf via `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aanroept om de hoofdbinary en app-bundle te ondertekenen, zodat macOS elke rebuild als dezelfde ondertekende bundle behandelt en TCC-machtigingen behoudt (meldingen, toegankelijkheid, schermopname, microfoon, spraak). Gebruik voor stabiele machtigingen een echte ondertekeningsidentiteit; ad-hoc is opt-in en kwetsbaar (zie [macOS-machtigingen](/nl/platforms/mac/permissions)).
- standaard `CODESIGN_TIMESTAMP=auto` gebruikt; dit schakelt vertrouwde tijdstempels in voor Developer ID-handtekeningen. Stel `CODESIGN_TIMESTAMP=off` in om tijdstempels over te slaan (offline debugbuilds).
- buildmetadata in Info.plist injecteert: `OpenClawBuildTimestamp` (UTC) en `OpenClawGitCommit` (korte hash), zodat het Infovenster build, git en debug-/releasekanaal kan tonen.
- **Packaging gebruikt standaard Node 24**: het script voert TS-builds en de Control UI-build uit. Node 22 LTS, momenteel `22.14+`, blijft ondersteund voor compatibiliteit.
- `SIGN_IDENTITY` uit de omgeving leest. Voeg `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (of je Developer ID Application-certificaat) toe aan je shell-rc om altijd met je certificaat te ondertekenen. Ad-hocondertekening vereist expliciete opt-in via `ALLOW_ADHOC_SIGNING=1` of `SIGN_IDENTITY="-"` (niet aanbevolen voor machtigingstests).
- na het ondertekenen een Team ID-audit uitvoert en faalt als een Mach-O binnen de app-bundle door een andere Team ID is ondertekend. Stel `SKIP_TEAM_ID_CHECK=1` in om dit over te slaan.

## Gebruik

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Opmerking over ad-hocondertekening

Bij ondertekening met `SIGN_IDENTITY="-"` (ad-hoc) schakelt het script automatisch de **Hardened Runtime** (`--options runtime`) uit. Dit is nodig om crashes te voorkomen wanneer de app ingesloten frameworks probeert te laden (zoals Sparkle) die niet dezelfde Team ID delen. Ad-hochandtekeningen verbreken ook het behoud van TCC-machtigingen; zie [macOS-machtigingen](/nl/platforms/mac/permissions) voor herstelstappen.

## Buildmetadata voor Info

`package-mac-app.sh` stempelt de bundle met:

- `OpenClawBuildTimestamp`: ISO8601 UTC op het moment van packagen
- `OpenClawGitCommit`: korte git-hash (of `unknown` als die niet beschikbaar is)

Het tabblad Info leest deze sleutels om versie, builddatum, git-commit en of het een debugbuild is te tonen (via `#if DEBUG`). Voer de packager uit om deze waarden na codewijzigingen te vernieuwen.

## Waarom

TCC-machtigingen zijn gekoppeld aan de bundle-identificatie _en_ de codehandtekening. Niet-ondertekende debugbuilds met wisselende UUID's zorgden ervoor dat macOS toekenningen na elke rebuild vergat. Het ondertekenen van de binaries (standaard ad-hoc) en het behouden van een vaste bundle-id/pad (`dist/OpenClaw.app`) bewaart de toekenningen tussen builds, overeenkomstig de VibeTunnel-aanpak.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)

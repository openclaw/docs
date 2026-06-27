---
read_when:
    - Mac-debugbuilds bouwen of ondertekenen
summary: Ondertekeningsstappen voor macOS-debugbuilds die door verpakkingsscripts worden gegenereerd
title: macOS-ondertekening
x-i18n:
    generated_at: "2026-06-27T17:48:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac-ondertekening (debugbuilds)

Deze app wordt meestal gebouwd vanuit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), dat nu:

- een stabiele debug-bundel-ID instelt: `ai.openclaw.mac.debug`
- de Info.plist schrijft met die bundel-ID (overschrijven via `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aanroept om het hoofdbinaire bestand en de appbundel te ondertekenen, zodat macOS elke rebuild als dezelfde ondertekende bundel behandelt en TCC-machtigingen behoudt (meldingen, toegankelijkheid, schermopname, microfoon, spraak). Gebruik voor stabiele machtigingen een echte ondertekeningsidentiteit; ad-hoc is opt-in en kwetsbaar (zie [macOS-machtigingen](/nl/platforms/mac/permissions)).
- standaard `CODESIGN_TIMESTAMP=auto` gebruikt; dit schakelt vertrouwde timestamps in voor Developer ID-handtekeningen. Stel `CODESIGN_TIMESTAMP=off` in om timestamping over te slaan (offline debugbuilds).
- buildmetadata in Info.plist injecteert: `OpenClawBuildTimestamp` (UTC) en `OpenClawGitCommit` (korte hash), zodat het Info-paneel de build, git en het debug-/releasekanaal kan tonen.
- **Packaging gebruikt standaard Node 24**: het script voert TS-builds en de Control UI-build uit. Node 22 LTS, momenteel `22.19+`, blijft ondersteund voor compatibiliteit.
- `SIGN_IDENTITY` uit de omgeving leest. Voeg `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (of je Developer ID Application-certificaat) toe aan je shell-rc om altijd met je certificaat te ondertekenen. Ad-hoc-ondertekening vereist expliciete opt-in via `ALLOW_ADHOC_SIGNING=1` of `SIGN_IDENTITY="-"` (niet aanbevolen voor machtigingstests).
- na ondertekening een Team ID-audit uitvoert en faalt als een Mach-O binnen de appbundel door een andere Team ID is ondertekend. Stel `SKIP_TEAM_ID_CHECK=1` in om dit te omzeilen.

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

Bij ondertekenen met `SIGN_IDENTITY="-"` (ad-hoc) schakelt het script automatisch de **Hardened Runtime** (`--options runtime`) uit. Dit is nodig om crashes te voorkomen wanneer de app ingebedde frameworks probeert te laden (zoals Sparkle) die niet dezelfde Team ID delen. Ad-hoc-handtekeningen verbreken ook het behoud van TCC-machtigingen; zie [macOS-machtigingen](/nl/platforms/mac/permissions) voor herstelstappen.

## Buildmetadata voor Info

`package-mac-app.sh` stempelt de bundel met:

- `OpenClawBuildTimestamp`: ISO8601 UTC op het moment van packaging
- `OpenClawGitCommit`: korte git-hash (of `unknown` als die niet beschikbaar is)

Het Info-tabblad leest deze sleutels om de versie, builddatum, git-commit en of het een debugbuild is (via `#if DEBUG`) te tonen. Voer de packager uit om deze waarden na codewijzigingen te vernieuwen.

## Waarom

TCC-machtigingen zijn gekoppeld aan de bundel-ID _en_ de codehandtekening. Niet-ondertekende debugbuilds met veranderende UUID's zorgden ervoor dat macOS toekenningen na elke rebuild vergat. Door de binaire bestanden te ondertekenen (standaard ad-hoc) en een vaste bundel-ID/pad (`dist/OpenClaw.app`) te behouden, blijven de toekenningen tussen builds behouden, overeenkomstig de VibeTunnel-aanpak.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)

---
read_when:
    - Mac-foutopsporingsbuilds bouwen of ondertekenen
summary: Ondertekeningsstappen voor macOS-debugbuilds die door verpakkingsscripts worden gegenereerd
title: macOS-ondertekening
x-i18n:
    generated_at: "2026-07-12T09:00:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac-ondertekening (debugbuilds)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) bouwt en verpakt de app naar een vast pad (`dist/OpenClaw.app`) en roept vervolgens [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aan om deze te ondertekenen. TCC-machtigingen zijn gekoppeld aan de bundel-ID en codehandtekening; door beide stabiel te houden (en de app op een vast pad te laten staan) bij opeenvolgende builds, voorkomt u dat macOS TCC-toestemmingen vergeet (meldingen, toegankelijkheid, schermopname, microfoon, spraak).

- De bundel-ID voor debugbuilds is standaard `ai.openclaw.mac.debug` (overschrijf met `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` of `>=23.11.0` (`engines` in de `package.json` van de repository). Het verpakkingsprogramma bouwt ook de bedieningsinterface (`pnpm ui:build`).
- Vereist standaard een echte ondertekeningsidentiteit; het ondertekeningsscript sluit af met een fout als er geen wordt gevonden en `ALLOW_ADHOC_SIGNING` niet is ingesteld. Ad-hocondertekening (`SIGN_IDENTITY="-"`) moet expliciet worden ingeschakeld en bewaart TCC-machtigingen niet bij opeenvolgende builds. Zie [macOS-machtigingen](/nl/platforms/mac/permissions).
- Leest `SIGN_IDENTITY` uit de omgeving (bijvoorbeeld `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` of een Developer ID Application-certificaat). Als deze variabele ontbreekt, selecteert `codesign-mac-app.sh` automatisch een identiteit in deze volgorde: Developer ID Application, Apple Distribution, Apple Development en vervolgens de eerste gevonden geldige identiteit voor codeondertekening.
- `CODESIGN_TIMESTAMP=auto` (standaard) schakelt vertrouwde tijdstempels alleen in voor Developer ID Application-handtekeningen. Stel `on` of `off` in om een van beide af te dwingen.
- Voegt `OpenClawBuildTimestamp` (ISO 8601 UTC) en `OpenClawGitCommit` (korte hash, `unknown` indien niet beschikbaar) toe aan Info.plist, zodat het tabblad Over de build, Git-commit en het debug- of releasekanaal kan weergeven.
- Voert na ondertekening een Team ID-controle uit en mislukt als een Mach-O-bestand in de bundel een andere Team ID heeft. Stel `SKIP_TEAM_ID_CHECK=1` in om dit over te slaan.

## Gebruik

```bash
# vanuit de hoofdmap van de repository
scripts/package-mac-app.sh                                                      # selecteert automatisch een identiteit; geeft een fout als er geen wordt gevonden
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # echt certificaat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (machtigingen blijven niet behouden)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # expliciet ad-hoc (zelfde voorbehoud)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # uitsluitend voor ontwikkeling: tijdelijke oplossing voor niet-overeenkomende Sparkle Team ID
```

### Opmerking over ad-hocondertekening

`SIGN_IDENTITY="-"` schakelt de Hardened Runtime (`--options runtime`) uit om crashes te voorkomen wanneer de app ingesloten frameworks laadt (zoals Sparkle) die niet dezelfde Team ID hebben. Ad-hochandtekeningen verhinderen ook dat TCC-machtigingen behouden blijven; zie [macOS-machtigingen](/nl/platforms/mac/permissions) voor herstelstappen.

## Buildmetadata voor Over

Het tabblad Over leest `OpenClawBuildTimestamp` en `OpenClawGitCommit` uit Info.plist om de versie, builddatum, Git-commit en of het een DEBUG-build betreft (via `#if DEBUG`) weer te geven. Voer het verpakkingsprogramma na codewijzigingen opnieuw uit om deze waarden bij te werken.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-machtigingen](/nl/platforms/mac/permissions)

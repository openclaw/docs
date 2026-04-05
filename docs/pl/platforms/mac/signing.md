---
read_when:
    - Budujesz lub podpisujesz debugowe buildy mac
summary: Kroki podpisywania debugowych buildów macOS generowanych przez skrypty pakujące
title: Podpisywanie macOS
x-i18n:
    generated_at: "2026-04-05T14:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# podpisywanie mac (debugowe buildy)

Ta aplikacja jest zwykle budowana przez [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), który teraz:

- ustawia stabilny identyfikator pakietu debug: `ai.openclaw.mac.debug`
- zapisuje Info.plist z tym identyfikatorem pakietu (nadpisanie przez `BUNDLE_ID=...`)
- wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby podpisać główny plik binarny i pakiet aplikacji, dzięki czemu macOS traktuje każdy rebuild jako ten sam podpisany pakiet i zachowuje uprawnienia TCC (powiadomienia, dostępność, nagrywanie ekranu, mikrofon, mowa). Dla stabilnych uprawnień używaj prawdziwej tożsamości podpisywania; podpis ad-hoc jest włączany tylko jawnie i jest nietrwały (zobacz [Uprawnienia macOS](/platforms/mac/permissions)).
- domyślnie używa `CODESIGN_TIMESTAMP=auto`; włącza to zaufane znaczniki czasu dla podpisów Developer ID. Ustaw `CODESIGN_TIMESTAMP=off`, aby pominąć timestamping (debugowe buildy offline).
- wstrzykuje metadane builda do Info.plist: `OpenClawBuildTimestamp` (UTC) i `OpenClawGitCommit` (krótki hash), aby panel About mógł pokazywać build, git oraz kanał debug/release.
- **Pakowanie domyślnie używa Node 24**: skrypt uruchamia buildy TS oraz build Control UI. Node 22 LTS, obecnie `22.14+`, pozostaje obsługiwany dla zgodności.
- odczytuje `SIGN_IDENTITY` ze środowiska. Dodaj `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (lub swój certyfikat Developer ID Application) do pliku rc powłoki, aby zawsze podpisywać swoim certyfikatem. Podpis ad-hoc wymaga jawnego opt-in przez `ALLOW_ADHOC_SIGNING=1` lub `SIGN_IDENTITY="-"` (niezalecane do testów uprawnień).
- po podpisaniu uruchamia audyt Team ID i kończy się błędem, jeśli jakikolwiek Mach-O wewnątrz pakietu aplikacji jest podpisany innym Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby to pominąć.

## Użycie

```bash
# z katalogu głównego repozytorium
scripts/package-mac-app.sh               # automatycznie wybiera tożsamość; kończy się błędem, jeśli żadnej nie znajdzie
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # prawdziwy certyfikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (uprawnienia nie będą trwałe)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # jawny ad-hoc (ten sam problem)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # obejście tylko dla dev przy niedopasowaniu Team ID Sparkle
```

### Uwaga o podpisie ad-hoc

Przy podpisywaniu z `SIGN_IDENTITY="-"` (ad-hoc) skrypt automatycznie wyłącza **Hardened Runtime** (`--options runtime`). Jest to konieczne, aby zapobiec awariom, gdy aplikacja próbuje ładować osadzone frameworki (takie jak Sparkle), które nie współdzielą tego samego Team ID. Podpisy ad-hoc psują też trwałość uprawnień TCC; kroki odzyskiwania znajdziesz w [Uprawnienia macOS](/platforms/mac/permissions).

## Metadane builda dla About

`package-mac-app.sh` oznacza pakiet następującymi danymi:

- `OpenClawBuildTimestamp`: ISO8601 UTC w momencie pakowania
- `OpenClawGitCommit`: krótki hash git (albo `unknown`, jeśli niedostępny)

Karta About odczytuje te klucze, aby pokazywać wersję, datę builda, commit git i informację, czy to build debugowy (przez `#if DEBUG`). Uruchom pakowacz ponownie, aby odświeżyć te wartości po zmianach w kodzie.

## Dlaczego

Uprawnienia TCC są powiązane z identyfikatorem pakietu _i_ podpisem kodu. Niepodpisane debugowe buildy ze zmieniającymi się UUID powodowały, że macOS zapominał przyznane uprawnienia po każdym rebuildzie. Podpisywanie plików binarnych (domyślnie ad‑hoc) i utrzymywanie stałego identyfikatora/ścieżki pakietu (`dist/OpenClaw.app`) zachowuje przyznania między buildami, podobnie jak w podejściu VibeTunnel.

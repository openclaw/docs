---
read_when:
    - Budowanie lub podpisywanie kompilacji debug macOS
summary: Kroki podpisywania dla kompilacji debug macOS generowanych przez skrypty pakowania
title: Podpisywanie macOS
x-i18n:
    generated_at: "2026-04-24T09:21:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# podpisywanie mac (kompilacje debug)

Ta aplikacja jest zwykle budowana przez [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), który teraz:

- ustawia stabilny identyfikator pakietu debug: `ai.openclaw.mac.debug`
- zapisuje Info.plist z tym identyfikatorem pakietu (nadpisanie przez `BUNDLE_ID=...`)
- wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby podpisać główne binarium i pakiet aplikacji, dzięki czemu macOS traktuje każdą przebudowę jako ten sam podpisany pakiet i zachowuje uprawnienia TCC (powiadomienia, accessibility, nagrywanie ekranu, mikrofon, mowa). Aby mieć stabilne uprawnienia, używaj prawdziwej tożsamości podpisu; podpis ad-hoc jest opt-in i kruchy (zobacz [uprawnienia macOS](/pl/platforms/mac/permissions)).
- domyślnie używa `CODESIGN_TIMESTAMP=auto`; włącza to zaufane znaczniki czasu dla podpisów Developer ID. Ustaw `CODESIGN_TIMESTAMP=off`, aby pominąć znacznik czasu (debug build offline).
- wstrzykuje metadane builda do Info.plist: `OpenClawBuildTimestamp` (UTC) i `OpenClawGitCommit` (krótki hash), aby panel About mógł pokazywać build, git oraz kanał debug/release.
- **Pakowanie domyślnie używa Node 24**: skrypt uruchamia buildy TS oraz build Control UI. Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany dla zgodności.
- odczytuje `SIGN_IDENTITY` ze środowiska. Dodaj `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (lub certyfikat Developer ID Application) do pliku rc swojej powłoki, aby zawsze podpisywać swoim certyfikatem. Podpis ad-hoc wymaga jawnego opt-in przez `ALLOW_ADHOC_SIGNING=1` lub `SIGN_IDENTITY="-"` (niezalecane do testowania uprawnień).
- po podpisaniu uruchamia audyt Team ID i kończy się błędem, jeśli jakikolwiek Mach-O w pakiecie aplikacji jest podpisany innym Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby to obejść.

## Użycie

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Uwaga o podpisie ad-hoc

Przy podpisywaniu z `SIGN_IDENTITY="-"` (ad-hoc) skrypt automatycznie wyłącza **Hardened Runtime** (`--options runtime`). Jest to konieczne, aby zapobiec awariom, gdy aplikacja próbuje ładować osadzone frameworki (takie jak Sparkle), które nie współdzielą tego samego Team ID. Podpisy ad-hoc psują też trwałość uprawnień TCC; kroki odzyskiwania znajdziesz w [uprawnieniach macOS](/pl/platforms/mac/permissions).

## Metadane builda dla About

`package-mac-app.sh` stempluje pakiet następującymi wartościami:

- `OpenClawBuildTimestamp`: ISO8601 UTC w czasie pakowania
- `OpenClawGitCommit`: krótki hash git (lub `unknown`, jeśli niedostępny)

Karta About odczytuje te klucze, aby pokazać wersję, datę builda, commit git i to, czy jest to build debug (`#if DEBUG`). Uruchom pakowarkę, aby odświeżyć te wartości po zmianach w kodzie.

## Dlaczego

Uprawnienia TCC są powiązane z identyfikatorem pakietu _oraz_ podpisem kodu. Niepodpisane buildy debug ze zmieniającymi się UUID powodowały, że macOS zapominał przyznane uprawnienia po każdej przebudowie. Podpisanie binariów (domyślnie ad-hoc) i zachowanie stałego id/ścieżki pakietu (`dist/OpenClaw.app`) zachowuje uprawnienia między buildami, zgodnie z podejściem VibeTunnel.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)

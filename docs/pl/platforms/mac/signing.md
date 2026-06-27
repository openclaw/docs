---
read_when:
    - Kompilowanie lub podpisywanie debugowych kompilacji na Macu
summary: Kroki podpisywania dla debugowych kompilacji macOS generowanych przez skrypty pakowania
title: Podpisywanie macOS
x-i18n:
    generated_at: "2026-06-27T17:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# podpisywanie na macOS (kompilacje debugowania)

Ta aplikacja jest zwykle budowana za pomocą [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), który teraz:

- ustawia stabilny identyfikator pakietu debugowania: `ai.openclaw.mac.debug`
- zapisuje Info.plist z tym identyfikatorem pakietu (nadpisz przez `BUNDLE_ID=...`)
- wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby podpisać główny plik binarny i pakiet aplikacji, dzięki czemu macOS traktuje każdą przebudowę jako ten sam podpisany pakiet i zachowuje uprawnienia TCC (powiadomienia, dostępność, nagrywanie ekranu, mikrofon, mowa). Aby uzyskać stabilne uprawnienia, użyj rzeczywistej tożsamości podpisywania; ad-hoc jest opcjonalne i kruche (zobacz [uprawnienia macOS](/pl/platforms/mac/permissions)).
- domyślnie używa `CODESIGN_TIMESTAMP=auto`; włącza to zaufane znaczniki czasu dla podpisów Developer ID. Ustaw `CODESIGN_TIMESTAMP=off`, aby pominąć znaczniki czasu (kompilacje debugowania offline).
- wstrzykuje metadane kompilacji do Info.plist: `OpenClawBuildTimestamp` (UTC) i `OpenClawGitCommit` (krótki hash), aby panel Informacje mógł pokazywać kompilację, git oraz kanał debugowania/wydania.
- **Pakowanie domyślnie używa Node 24**: skrypt uruchamia kompilacje TS i kompilację Control UI. Node 22 LTS, obecnie `22.19+`, pozostaje obsługiwany ze względu na zgodność.
- odczytuje `SIGN_IDENTITY` ze środowiska. Dodaj `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (lub swój certyfikat Developer ID Application) do konfiguracji powłoki, aby zawsze podpisywać swoim certyfikatem. Podpisywanie ad-hoc wymaga jawnego włączenia przez `ALLOW_ADHOC_SIGNING=1` lub `SIGN_IDENTITY="-"` (niezalecane do testowania uprawnień).
- uruchamia audyt Team ID po podpisaniu i kończy się niepowodzeniem, jeśli jakikolwiek Mach-O wewnątrz pakietu aplikacji jest podpisany przez inny Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby pominąć.

## Użycie

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Uwaga dotycząca podpisywania ad-hoc

Podczas podpisywania z `SIGN_IDENTITY="-"` (ad-hoc) skrypt automatycznie wyłącza **Hardened Runtime** (`--options runtime`). Jest to konieczne, aby zapobiec awariom, gdy aplikacja próbuje ładować osadzone frameworki (takie jak Sparkle), które nie współdzielą tego samego Team ID. Podpisy ad-hoc przerywają również trwałość uprawnień TCC; kroki odzyskiwania znajdziesz w [uprawnieniach macOS](/pl/platforms/mac/permissions).

## Metadane kompilacji dla Informacji

`package-mac-app.sh` oznacza pakiet następującymi danymi:

- `OpenClawBuildTimestamp`: ISO8601 UTC w czasie pakowania
- `OpenClawGitCommit`: krótki hash git (lub `unknown`, jeśli jest niedostępny)

Karta Informacje odczytuje te klucze, aby pokazać wersję, datę kompilacji, commit git oraz to, czy jest to kompilacja debugowania (przez `#if DEBUG`). Uruchom skrypt pakujący, aby odświeżyć te wartości po zmianach w kodzie.

## Dlaczego

Uprawnienia TCC są powiązane z identyfikatorem pakietu _i_ podpisem kodu. Niepodpisane kompilacje debugowania ze zmieniającymi się UUID powodowały, że macOS zapominał przyznane uprawnienia po każdej przebudowie. Podpisywanie plików binarnych (domyślnie ad-hoc) i utrzymywanie stałego identyfikatora/ścieżki pakietu (`dist/OpenClaw.app`) zachowuje uprawnienia między kompilacjami, zgodnie z podejściem VibeTunnel.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)

---
read_when:
    - Budowanie lub podpisywanie kompilacji debugowych dla Maca
summary: Kroki podpisywania debugowych kompilacji macOS generowanych przez skrypty pakietujące
title: Podpisywanie macOS
x-i18n:
    generated_at: "2026-05-06T09:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# podpisywanie mac (kompilacje debug)

Ta aplikacja jest zwykle budowana przez [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), który teraz:

- ustawia stabilny identyfikator pakietu debug: `ai.openclaw.mac.debug`
- zapisuje Info.plist z tym identyfikatorem pakietu (nadpisz przez `BUNDLE_ID=...`)
- wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby podpisać główny plik binarny i pakiet aplikacji, dzięki czemu macOS traktuje każdą przebudowę jako ten sam podpisany pakiet i zachowuje uprawnienia TCC (powiadomienia, dostępność, nagrywanie ekranu, mikrofon, mowa). Aby uprawnienia były stabilne, użyj prawdziwej tożsamości podpisującej; podpis ad-hoc jest opcjonalny i kruchy (zobacz [uprawnienia macOS](/pl/platforms/mac/permissions)).
- domyślnie używa `CODESIGN_TIMESTAMP=auto`; włącza to zaufane znaczniki czasu dla podpisów Developer ID. Ustaw `CODESIGN_TIMESTAMP=off`, aby pominąć znakowanie czasem (kompilacje debug offline).
- wstrzykuje metadane kompilacji do Info.plist: `OpenClawBuildTimestamp` (UTC) i `OpenClawGitCommit` (krótki hash), aby panel Informacje mógł pokazywać kompilację, git oraz kanał debug/release.
- **Pakowanie domyślnie używa Node 24**: skrypt uruchamia kompilacje TS i kompilację Control UI. Node 22 LTS, obecnie `22.14+`, nadal jest obsługiwany dla zgodności.
- odczytuje `SIGN_IDENTITY` ze środowiska. Dodaj `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (albo certyfikat Developer ID Application) do konfiguracji swojej powłoki, aby zawsze podpisywać swoim certyfikatem. Podpisywanie ad-hoc wymaga jawnego włączenia przez `ALLOW_ADHOC_SIGNING=1` lub `SIGN_IDENTITY="-"` (niezalecane do testowania uprawnień).
- uruchamia audyt Team ID po podpisaniu i kończy się błędem, jeśli jakikolwiek Mach-O w pakiecie aplikacji jest podpisany innym Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby pominąć.

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

Podczas podpisywania z `SIGN_IDENTITY="-"` (ad-hoc) skrypt automatycznie wyłącza **Hardened Runtime** (`--options runtime`). Jest to konieczne, aby zapobiec awariom, gdy aplikacja próbuje ładować osadzone frameworki (takie jak Sparkle), które nie mają tego samego Team ID. Podpisy ad-hoc psują również utrwalanie uprawnień TCC; kroki odzyskiwania opisano w [uprawnieniach macOS](/pl/platforms/mac/permissions).

## Metadane kompilacji w Informacjach

`package-mac-app.sh` oznacza pakiet następującymi wartościami:

- `OpenClawBuildTimestamp`: ISO8601 UTC w czasie pakowania
- `OpenClawGitCommit`: krótki hash git (albo `unknown`, jeśli niedostępny)

Karta Informacje odczytuje te klucze, aby pokazać wersję, datę kompilacji, commit git oraz to, czy jest to kompilacja debug (przez `#if DEBUG`). Uruchom pakietowanie, aby odświeżyć te wartości po zmianach w kodzie.

## Dlaczego

Uprawnienia TCC są powiązane z identyfikatorem pakietu _i_ podpisem kodu. Niepodpisane kompilacje debug ze zmieniającymi się UUID sprawiały, że macOS zapominał przyznane uprawnienia po każdej przebudowie. Podpisywanie plików binarnych (domyślnie ad-hoc) i utrzymywanie stałego identyfikatora/ścieżki pakietu (`dist/OpenClaw.app`) zachowuje przyznane uprawnienia między kompilacjami, zgodnie z podejściem VibeTunnel.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)

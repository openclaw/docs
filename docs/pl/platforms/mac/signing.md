---
read_when:
    - Tworzenie lub podpisywanie kompilacji debugowych dla macOS
summary: Kroki podpisywania debugowych kompilacji dla systemu macOS generowanych przez skrypty pakujące
title: Podpisywanie w macOS
x-i18n:
    generated_at: "2026-07-16T18:37:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Podpisywanie aplikacji macOS (kompilacje debugowania)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) kompiluje aplikację i tworzy jej pakiet w stałej ścieżce (`dist/OpenClaw.app`), a następnie wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby ją podpisać. Uprawnienia TCC są powiązane z identyfikatorem pakietu i podpisem kodu; zachowanie ich obu bez zmian (oraz aplikacji w stałej ścieżce) między kolejnymi kompilacjami zapobiega zapominaniu przez macOS przyznanych uprawnień TCC (powiadomienia, dostępność, nagrywanie ekranu, mikrofon, rozpoznawanie mowy).

- Domyślny identyfikator pakietu debugowania to `ai.openclaw.mac.debug` (można go zastąpić za pomocą `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` lub `>=25.9.0` (repozytorium `package.json` `engines`). Narzędzie pakujące kompiluje również interfejs Control UI (`pnpm ui:build`).
- Domyślnie wymaga rzeczywistej tożsamości podpisującej; skrypt podpisujący kończy działanie z błędem, jeśli jej nie znaleziono i nie ustawiono `ALLOW_ADHOC_SIGNING`. Podpisywanie ad hoc (`SIGN_IDENTITY="-"`) wymaga jawnego włączenia i nie zachowuje uprawnień TCC między kolejnymi kompilacjami. Zobacz [uprawnienia macOS](/pl/platforms/mac/permissions).
- Odczytuje `SIGN_IDENTITY` ze środowiska (np. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` lub certyfikat Developer ID Application). Jeśli jej nie podano, `codesign-mac-app.sh` automatycznie wybiera tożsamość w następującej kolejności: Developer ID Application, Apple Distribution, Apple Development, a następnie pierwsza znaleziona prawidłowa tożsamość do podpisywania kodu.
- `CODESIGN_TIMESTAMP=auto` (domyślnie) włącza zaufane znaczniki czasu tylko dla podpisów Developer ID Application. Ustaw `on`/`off`, aby wymusić odpowiednie zachowanie.
- Dodaje do Info.plist wartości `OpenClawBuildTimestamp` (ISO8601 UTC) i `OpenClawGitCommit` (krótki skrót, `unknown`, jeśli jest niedostępny), aby karta Informacje mogła wyświetlać kompilację, dane git oraz kanał debugowania/wydania.
- Po podpisaniu przeprowadza audyt identyfikatora Team ID i kończy się niepowodzeniem, jeśli dowolny plik Mach-O w pakiecie ma inny Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby pominąć tę kontrolę.

## Użycie

```bash
# z katalogu głównego repozytorium
scripts/package-mac-app.sh                                                      # automatycznie wybiera tożsamość; zgłasza błąd, jeśli żadnej nie znaleziono
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # rzeczywisty certyfikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (uprawnienia nie zostaną zachowane)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # jawne ad hoc (z tym samym zastrzeżeniem)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # obejście niezgodności Team ID biblioteki Sparkle, wyłącznie do programowania
```

### Uwaga dotycząca podpisywania ad hoc

`SIGN_IDENTITY="-"` wyłącza Hardened Runtime (`--options runtime`), aby zapobiec awariom podczas ładowania przez aplikację osadzonych platform programistycznych (takich jak Sparkle), które nie mają tego samego identyfikatora Team ID. Podpisy ad hoc uniemożliwiają również zachowywanie uprawnień TCC; procedurę odzyskiwania opisano na stronie [uprawnienia macOS](/pl/platforms/mac/permissions).

## Metadane kompilacji na karcie Informacje

Karta Informacje odczytuje `OpenClawBuildTimestamp` i `OpenClawGitCommit` z Info.plist, aby wyświetlić wersję, datę kompilacji, zatwierdzenie git oraz informację, czy jest to kompilacja DEBUG (za pośrednictwem `#if DEBUG`). Po zmianach w kodzie ponownie uruchom narzędzie pakujące, aby odświeżyć te wartości.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [uprawnienia macOS](/pl/platforms/mac/permissions)

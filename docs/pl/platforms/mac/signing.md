---
read_when:
    - Kompilowanie lub podpisywanie debugowych wersji dla macOS
summary: Kroki podpisywania debugowych kompilacji dla macOS generowanych przez skrypty pakujące
title: Podpisywanie w systemie macOS
x-i18n:
    generated_at: "2026-07-12T15:18:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Podpisywanie w macOS (kompilacje debugowania)

Skrypt [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) kompiluje i pakuje aplikację do stałej ścieżki (`dist/OpenClaw.app`), a następnie wywołuje [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), aby ją podpisać. Uprawnienia TCC są powiązane z identyfikatorem pakietu i podpisem kodu; zachowanie ich obu bez zmian (oraz aplikacji w stałej ścieżce) między kolejnymi kompilacjami zapobiega zapominaniu przez macOS przyznanych uprawnień TCC (powiadomienia, dostępność, nagrywanie ekranu, mikrofon, mowa).

- Domyślny identyfikator pakietu kompilacji debugowania to `ai.openclaw.mac.debug` (można go zastąpić za pomocą `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` lub `>=23.11.0` (`engines` w pliku `package.json` repozytorium). Skrypt pakujący kompiluje również interfejs Control UI (`pnpm ui:build`).
- Domyślnie wymaga rzeczywistej tożsamości podpisującej; jeśli żadna nie zostanie znaleziona, a zmienna `ALLOW_ADHOC_SIGNING` nie jest ustawiona, skrypt podpisujący kończy działanie z błędem. Podpisywanie ad hoc (`SIGN_IDENTITY="-"`) wymaga jawnego włączenia i nie zachowuje uprawnień TCC między kolejnymi kompilacjami. Zobacz [uprawnienia macOS](/pl/platforms/mac/permissions).
- Odczytuje `SIGN_IDENTITY` ze środowiska (np. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` lub certyfikat Developer ID Application). Jeśli zmienna nie jest ustawiona, skrypt `codesign-mac-app.sh` automatycznie wybiera tożsamość w następującej kolejności: Developer ID Application, Apple Distribution, Apple Development, a następnie pierwsza znaleziona prawidłowa tożsamość do podpisywania kodu.
- `CODESIGN_TIMESTAMP=auto` (wartość domyślna) włącza zaufane znaczniki czasu tylko dla podpisów Developer ID Application. Ustaw `on` lub `off`, aby wymusić odpowiednie zachowanie.
- Dodaje do Info.plist pola `OpenClawBuildTimestamp` (ISO8601 UTC) i `OpenClawGitCommit` (skrócony skrót, `unknown`, jeśli jest niedostępny), dzięki czemu karta informacji może wyświetlać kompilację, rewizję Git oraz kanał debugowania lub wydania.
- Po podpisaniu przeprowadza kontrolę Team ID i kończy się niepowodzeniem, jeśli którykolwiek plik Mach-O w pakiecie ma inny Team ID. Ustaw `SKIP_TEAM_ID_CHECK=1`, aby pominąć tę kontrolę.

## Użycie

```bash
# z katalogu głównego repozytorium
scripts/package-mac-app.sh                                                      # automatycznie wybiera tożsamość; zgłasza błąd, jeśli żadnej nie znaleziono
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # rzeczywisty certyfikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (uprawnienia nie zostaną zachowane)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # jawne ad hoc (to samo zastrzeżenie)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # obejście niezgodności Team ID Sparkle, tylko do programowania
```

### Uwaga dotycząca podpisywania ad hoc

`SIGN_IDENTITY="-"` wyłącza Hardened Runtime (`--options runtime`), aby zapobiec awariom podczas ładowania przez aplikację osadzonych frameworków (takich jak Sparkle), które nie mają tego samego Team ID. Podpisy ad hoc uniemożliwiają również zachowywanie uprawnień TCC; procedurę przywracania opisano w sekcji [uprawnienia macOS](/pl/platforms/mac/permissions).

## Metadane kompilacji na karcie informacji

Karta informacji odczytuje pola `OpenClawBuildTimestamp` i `OpenClawGitCommit` z Info.plist, aby wyświetlić wersję, datę kompilacji, rewizję Git oraz informację, czy jest to kompilacja DEBUG (za pomocą `#if DEBUG`). Po zmianach w kodzie ponownie uruchom skrypt pakujący, aby odświeżyć te wartości.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)

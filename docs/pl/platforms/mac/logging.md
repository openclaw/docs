---
read_when:
    - Przechwytywanie dzienników systemu macOS lub badanie rejestrowania danych prywatnych
    - Debugowanie problemów z cyklem życia wybudzania głosowego i sesji
summary: 'Rejestrowanie zdarzeń OpenClaw: rotacyjny plik dziennika diagnostycznego + ujednolicone flagi prywatności dziennika'
title: Rejestrowanie zdarzeń w macOS
x-i18n:
    generated_at: "2026-07-12T15:17:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Rejestrowanie (macOS)

## Rotacyjny plik dziennika diagnostycznego (panel debugowania)

Aplikacja dla macOS rejestruje zdarzenia za pomocą swift-log (domyślnie w ujednoliconym systemie rejestrowania), a także może zapisywać rotacyjny lokalny plik dziennika w celu trwałego przechwytywania danych (`DiagnosticsFileLog`).

- Włączanie: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (domyślnie wyłączone).
- Szczegółowość: selektor **Debug pane -> Logs -> App logging -> Verbosity**.
- Lokalizacja: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotacja: następuje po osiągnięciu 5 MB; maksymalnie 5 kopii zapasowych z przyrostkami `.1`...`.5` (najstarsza jest usuwana).
- Czyszczenie: **Debug pane -> Logs -> App logging -> "Clear"** usuwa aktywny plik i wszystkie kopie zapasowe.

Traktuj ten plik jako poufny; nie udostępniaj go bez uprzedniego sprawdzenia.

## Prywatne dane w ujednoliconym systemie rejestrowania w macOS

Ujednolicony system rejestrowania ukrywa większość danych ładunku, chyba że podsystem włączy opcję `privacy -off`. Jest to kontrolowane przez plik plist w katalogu `/Library/Preferences/Logging/Subsystems/`, którego kluczem jest nazwa podsystemu. Flaga ma zastosowanie tylko do nowych wpisów dziennika, dlatego włącz ją przed odtworzeniem problemu. Więcej informacji: [zawiłości prywatności rejestrowania w macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Włączanie dla OpenClaw (`ai.openclaw`)

Najpierw zapisz plik plist w pliku tymczasowym, a następnie zainstaluj go atomowo jako użytkownik root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Ponowne uruchomienie nie jest wymagane; logd szybko wykrywa plik, ale tylko nowe wiersze dziennika zawierają prywatne dane ładunku. Bardziej szczegółowe dane wyjściowe można wyświetlić za pomocą `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` ustawia zakres czasu, domyślnie `5m`; `--category`/`-c` filtruje według kategorii).

## Wyłączanie po zakończeniu debugowania

- Usuń nadpisanie: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcjonalnie uruchom `sudo log config --reload`, aby wymusić natychmiastowe odrzucenie nadpisania przez logd.
- Ten mechanizm może ujawniać numery telefonów i treść wiadomości; pozostaw plik plist tylko na czas, gdy jest aktywnie potrzebny.

## Powiązane

- [Aplikacja dla macOS](/pl/platforms/macos)
- [Rejestrowanie Gateway](/pl/gateway/logging)

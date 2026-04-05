---
read_when:
    - Przechwytujesz logi macOS lub analizujesz logowanie danych prywatnych
    - Debugujesz problemy z wybudzaniem głosowym / cyklem życia sesji
summary: 'Logowanie OpenClaw: rotacyjny plik logów diagnostycznych + flagi prywatności unified log'
title: Logowanie macOS
x-i18n:
    generated_at: "2026-04-05T14:00:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logowanie (macOS)

## Rotacyjny plik logów diagnostycznych (panel Debug)

OpenClaw kieruje logi aplikacji macOS przez swift-log (domyślnie unified logging) i może zapisywać lokalny, rotacyjny plik logów na dysku, gdy potrzebujesz trwałego przechwytywania.

- Szczegółowość: **panel Debug → Logs → App logging → Verbosity**
- Włączenie: **panel Debug → Logs → App logging → „Write rolling diagnostics log (JSONL)”**
- Lokalizacja: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotuje automatycznie; starsze pliki otrzymują sufiksy `.1`, `.2`, …)
- Czyszczenie: **panel Debug → Logs → App logging → „Clear”**

Uwagi:

- Ta funkcja jest **domyślnie wyłączona**. Włączaj ją tylko podczas aktywnego debugowania.
- Traktuj ten plik jako wrażliwy; nie udostępniaj go bez wcześniejszego sprawdzenia.

## Prywatne dane w unified logging na macOS

Unified logging redaguje większość ładunków, chyba że dany subsystem włączy `privacy -off`. Zgodnie z artykułem Petera o macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) jest to sterowane przez plist w `/Library/Preferences/Logging/Subsystems/`, kluczowany nazwą subsystemu. Flagę przejmują tylko nowe wpisy logów, więc włącz ją przed odtworzeniem problemu.

## Włączanie dla OpenClaw (`ai.openclaw`)

- Najpierw zapisz plist do pliku tymczasowego, a następnie zainstaluj go atomowo jako root:

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

- Restart nie jest wymagany; `logd` szybko zauważa plik, ale tylko nowe linie logów będą zawierały prywatne ładunki.
- Bogatsze dane wyjściowe można wyświetlić istniejącym helperem, na przykład `./scripts/clawlog.sh --category WebChat --last 5m`.

## Wyłączanie po debugowaniu

- Usuń nadpisanie: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcjonalnie uruchom `sudo log config --reload`, aby wymusić natychmiastowe usunięcie nadpisania przez `logd`.
- Pamiętaj, że ta powierzchnia może zawierać numery telefonów i treści wiadomości; pozostaw plist na miejscu tylko wtedy, gdy aktywnie potrzebujesz dodatkowych szczegółów.

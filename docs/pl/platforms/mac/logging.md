---
read_when:
    - Przechwytywanie logów macOS lub analizowanie logowania danych prywatnych
    - Debugowanie problemów z wybudzaniem głosowym / cyklem życia sesji
summary: 'Logowanie OpenClaw: rotacyjny plik logów diagnostycznych + flagi prywatności unified log'
title: Logowanie macOS
x-i18n:
    generated_at: "2026-04-24T09:21:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logowanie (macOS)

## Rotacyjny plik logów diagnostycznych (panel Debug)

OpenClaw kieruje logi aplikacji macOS przez swift-log (domyślnie do unified logging) i może zapisywać lokalny, rotacyjny plik logów na dysku, gdy potrzebujesz trwałego przechwycenia.

- Szczegółowość: **panel Debug → Logs → App logging → Verbosity**
- Włączenie: **panel Debug → Logs → App logging → „Write rolling diagnostics log (JSONL)”**
- Lokalizacja: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotuje automatycznie; starsze pliki dostają sufiksy `.1`, `.2`, …)
- Czyszczenie: **panel Debug → Logs → App logging → „Clear”**

Uwagi:

- To jest **domyślnie wyłączone**. Włączaj tylko podczas aktywnego debugowania.
- Traktuj ten plik jako wrażliwy; nie udostępniaj go bez przeglądu.

## Prywatne dane unified logging na macOS

Unified logging redaguje większość ładunków, chyba że podsystem włączy `privacy -off`. Zgodnie z opisem Petera na temat macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) jest to kontrolowane przez plist w `/Library/Preferences/Logging/Subsystems/` kluczowany nazwą podsystemu. Flagę przejmują tylko nowe wpisy logów, więc włącz ją przed odtworzeniem problemu.

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
- Bogatsze wyjście wyświetlisz istniejącym helperem, np. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Wyłączanie po debugowaniu

- Usuń nadpisanie: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcjonalnie uruchom `sudo log config --reload`, aby wymusić natychmiastowe porzucenie nadpisania przez `logd`.
- Pamiętaj, że ta powierzchnia może zawierać numery telefonów i treści wiadomości; pozostawiaj plist na miejscu tylko wtedy, gdy aktywnie potrzebujesz dodatkowych szczegółów.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Logowanie Gateway](/pl/gateway/logging)

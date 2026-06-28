---
read_when:
    - Zbieranie logów macOS lub badanie rejestrowania danych prywatnych
    - Debugowanie problemów z cyklem życia wybudzania głosowego i sesji
summary: 'Rejestrowanie dzienników w OpenClaw: rotacyjny plik dziennika diagnostycznego + flagi prywatności ujednoliconego dziennika'
title: Rejestrowanie w macOS
x-i18n:
    generated_at: "2026-05-06T09:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Rejestrowanie (macOS)

## Rotujący plik dziennika diagnostycznego (panel debugowania)

OpenClaw kieruje logi aplikacji macOS przez swift-log (domyślnie ujednolicone rejestrowanie) i może zapisywać lokalny, rotujący plik dziennika na dysku, gdy potrzebujesz trwałego zapisu.

- Szczegółowość: **Panel debugowania → Logi → Rejestrowanie aplikacji → Szczegółowość**
- Włącz: **Panel debugowania → Logi → Rejestrowanie aplikacji → „Zapisuj rotujący dziennik diagnostyczny (JSONL)”**
- Lokalizacja: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotuje automatycznie; stare pliki otrzymują sufiksy `.1`, `.2`, …)
- Wyczyść: **Panel debugowania → Logi → Rejestrowanie aplikacji → „Wyczyść”**

Uwagi:

- Jest to **domyślnie wyłączone**. Włączaj tylko podczas aktywnego debugowania.
- Traktuj plik jako poufny; nie udostępniaj go bez wcześniejszego sprawdzenia.

## Prywatne dane w ujednoliconym rejestrowaniu na macOS

Ujednolicone rejestrowanie redaguje większość danych, chyba że podsystem włączy `privacy -off`. Zgodnie z opisem Petera dotyczącym [zawiłości prywatności logowania](https://steipete.me/posts/2025/logging-privacy-shenanigans) na macOS (2025), steruje tym plik plist w `/Library/Preferences/Logging/Subsystems/`, którego kluczem jest nazwa podsystemu. Tylko nowe wpisy dziennika uwzględnią tę flagę, więc włącz ją przed odtworzeniem problemu.

## Włącz dla OpenClaw (`ai.openclaw`)

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

- Ponowne uruchomienie nie jest wymagane; logd szybko zauważa plik, ale tylko nowe wiersze dziennika będą zawierać prywatne dane.
- Wyświetl bogatsze dane wyjściowe za pomocą istniejącego pomocnika, np. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Wyłącz po debugowaniu

- Usuń nadpisanie: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcjonalnie uruchom `sudo log config --reload`, aby wymusić natychmiastowe usunięcie nadpisania przez logd.
- Pamiętaj, że ta powierzchnia może zawierać numery telefonów i treści wiadomości; pozostawiaj plist na miejscu tylko wtedy, gdy aktywnie potrzebujesz dodatkowych szczegółów.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Rejestrowanie Gateway](/pl/gateway/logging)

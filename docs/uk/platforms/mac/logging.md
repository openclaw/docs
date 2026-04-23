---
read_when:
    - Захоплення логів macOS або перевірка логування приватних даних
    - Налагодження проблем із життєвим циклом voice wake/session
summary: 'Логування OpenClaw: rolling diagnostics file log + прапорці конфіденційності unified log'
title: Логування macOS
x-i18n:
    generated_at: "2026-04-23T21:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e82cc564f7e33eed7add08d6c7fc70a4bb5309cf2bbedbb09ce0b798fe8155
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Логування (macOS)

## Rolling diagnostics file log (панель Debug)

OpenClaw маршрутизує логи macOS-застосунку через swift-log (типово unified logging) і може записувати локальний rotating file log на диск, коли вам потрібне тривале захоплення.

- Рівень деталізації: **Debug pane → Logs → App logging → Verbosity**
- Увімкнення: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Розташування: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (автоматично ротуються; старі файли отримують суфікси `.1`, `.2`, …)
- Очищення: **Debug pane → Logs → App logging → “Clear”**

Примітки:

- Це **типово вимкнено**. Увімкнюйте лише під час активного налагодження.
- Вважайте цей файл чутливим; не діліться ним без перевірки.

## Приватні дані в unified logging на macOS

Unified logging редагує більшість payload-ів, якщо підсистема не ввімкне `privacy -off`. Згідно з описом Peter про macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), це керується plist у `/Library/Preferences/Logging/Subsystems/`, ключ якого відповідає назві підсистеми. Прапорець підхоплюють лише нові записи логів, тому вмикайте його до відтворення проблеми.

## Увімкнення для OpenClaw (`ai.openclaw`)

- Спочатку запишіть plist у тимчасовий файл, а потім атомарно встановіть його від імені root:

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

- Перезавантаження не потрібне; `logd` швидко помічає файл, але лише нові рядки логу включатимуть приватні payload-и.
- Переглядайте розширений вивід через наявний helper, наприклад `./scripts/clawlog.sh --category WebChat --last 5m`.

## Вимкнення після налагодження

- Видаліть перевизначення: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- За бажанням виконайте `sudo log config --reload`, щоб примусово змусити `logd` негайно скинути перевизначення.
- Пам’ятайте, що ця поверхня може містити номери телефонів і тіла повідомлень; тримайте plist на місці лише тоді, коли вам справді потрібна додаткова деталізація.

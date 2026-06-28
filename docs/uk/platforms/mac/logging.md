---
read_when:
    - Збирання журналів macOS або розслідування запису приватних даних у журнали
    - Налагодження проблем життєвого циклу голосового пробудження/сеансу
summary: 'Журналювання OpenClaw: ротаційний файл діагностичного журналу + прапорці приватності уніфікованого журналу'
title: Журналювання macOS
x-i18n:
    generated_at: "2026-05-06T05:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Журналювання (macOS)

## Ротаційний файл журналу діагностики (панель налагодження)

OpenClaw спрямовує журнали застосунку macOS через swift-log (типово — unified logging) і може записувати локальний ротаційний файл журналу на диск, коли вам потрібне довготривале захоплення даних.

- Докладність: **Панель налагодження → Журнали → Журналювання застосунку → Докладність**
- Увімкнути: **Панель налагодження → Журнали → Журналювання застосунку → "Записувати ротаційний журнал діагностики (JSONL)"**
- Розташування: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (ротується автоматично; старі файли отримують суфікси `.1`, `.2`, …)
- Очистити: **Панель налагодження → Журнали → Журналювання застосунку → "Очистити"**

Примітки:

- Це **типово вимкнено**. Умикайте лише під час активного налагодження.
- Вважайте файл чутливим; не поширюйте його без перевірки.

## Приватні дані unified logging на macOS

Unified logging редагує більшість корисного навантаження, якщо підсистема не вмикає `privacy -off`. Згідно з дописом Peter про macOS [махінації з приватністю журналювання](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), це контролюється plist у `/Library/Preferences/Logging/Subsystems/`, ключем якого є назва підсистеми. Прапорець застосовується лише до нових записів журналу, тому ввімкніть його перед відтворенням проблеми.

## Увімкнути для OpenClaw (`ai.openclaw`)

- Спершу запишіть plist у тимчасовий файл, а потім атомарно встановіть його від імені root:

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

- Перезавантаження не потрібне; logd швидко помічає файл, але приватне корисне навантаження міститимуть лише нові рядки журналу.
- Перегляньте багатший вивід наявним допоміжним засобом, наприклад `./scripts/clawlog.sh --category WebChat --last 5m`.

## Вимкнути після налагодження

- Видаліть перевизначення: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- За потреби виконайте `sudo log config --reload`, щоб примусово змусити logd негайно відкинути перевизначення.
- Пам’ятайте, що ця поверхня може містити номери телефонів і тіла повідомлень; залишайте plist на місці лише тоді, коли вам активно потрібні додаткові деталі.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [Журналювання Gateway](/uk/gateway/logging)

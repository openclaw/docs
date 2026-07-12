---
read_when:
    - Збирання журналів macOS або розслідування запису приватних даних
    - Налагодження проблем життєвого циклу голосової активації та сеансу
summary: 'Журналювання OpenClaw: циклічний файл журналу діагностики та уніфіковані прапорці конфіденційності журналу'
title: Журналювання macOS
x-i18n:
    generated_at: "2026-07-12T13:28:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Журналювання (macOS)

## Файл журналу циклічної діагностики (панель налагодження)

Застосунок macOS веде журнал через swift-log (типово використовується уніфіковане журналювання), а також може записувати циклічний локальний файл журналу для довготривалого збереження даних (`DiagnosticsFileLog`).

- Увімкнення: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (типово вимкнено).
- Деталізація: засіб вибору **Debug pane -> Logs -> App logging -> Verbosity**.
- Розташування: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Ротація: виконується за розміру 5 МБ; зберігається до 5 резервних копій із суфіксами `.1`...`.5` (найстарішу видаляють).
- Очищення: **Debug pane -> Logs -> App logging -> "Clear"** видаляє активний файл і всі резервні копії.

Вважайте цей файл конфіденційним; не поширюйте його без попередньої перевірки.

## Приватні дані в уніфікованому журналі macOS

Уніфіковане журналювання приховує більшість корисних даних, якщо для підсистеми не ввімкнено `privacy -off`. Це налаштування контролюється файлом plist у `/Library/Preferences/Logging/Subsystems/`, ключем якого є назва підсистеми. Прапорець застосовується лише до нових записів журналу, тому ввімкніть його перед відтворенням проблеми. Докладніше: [особливості конфіденційності журналювання macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Увімкнення для OpenClaw (`ai.openclaw`)

Спочатку запишіть plist у тимчасовий файл, а потім атомарно встановіть його з правами root:

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

Перезавантаження не потрібне; logd швидко підхоплює файл, але приватні корисні дані міститимуть лише нові рядки журналу. Переглядайте докладніший вивід за допомогою `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` задає діапазон часу, типове значення — `5m`; `--category`/`-c` фільтрує за категорією).

## Вимкнення після налагодження

- Видаліть перевизначення: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- За потреби виконайте `sudo log config --reload`, щоб змусити logd негайно скинути перевизначення.
- Ці дані можуть містити номери телефонів і тексти повідомлень; залишайте plist установленим лише тоді, коли він активно потрібен.

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [Журналювання Gateway](/uk/gateway/logging)

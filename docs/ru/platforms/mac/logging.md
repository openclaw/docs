---
read_when:
    - Сбор журналов macOS или расследование записи приватных данных
    - Отладка проблем жизненного цикла голосовой активации и сеанса
summary: 'Логирование OpenClaw: циклический файл диагностического журнала + единые флаги конфиденциальности журнала'
title: macOS-журналирование
x-i18n:
    generated_at: "2026-06-28T23:12:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Журналирование (macOS)

## Ротационный файл журнала диагностики (панель отладки)

OpenClaw направляет журналы приложения macOS через swift-log (по умолчанию используется unified logging) и может записывать локальный ротационный файловый журнал на диск, когда нужен долговременный захват.

- Подробность: **Панель отладки → Журналы → Журналирование приложения → Подробность**
- Включение: **Панель отладки → Журналы → Журналирование приложения → "Записывать ротационный журнал диагностики (JSONL)"**
- Расположение: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (ротируется автоматически; старые файлы получают суффиксы `.1`, `.2`, …)
- Очистка: **Панель отладки → Журналы → Журналирование приложения → "Очистить"**

Примечания:

- По умолчанию это **выключено**. Включайте только во время активной отладки.
- Считайте файл конфиденциальным; не передавайте его без проверки.

## Конфиденциальные данные в unified logging на macOS

Unified logging скрывает большинство полезных нагрузок, если подсистема не включает `privacy -off`. Согласно заметке Peter о [каверзах конфиденциальности журналирования](https://steipete.me/posts/2025/logging-privacy-shenanigans) в macOS (2025), это управляется plist-файлом в `/Library/Preferences/Logging/Subsystems/`, ключом служит имя подсистемы. Флаг применяется только к новым записям журнала, поэтому включите его перед воспроизведением проблемы.

## Включение для OpenClaw (`ai.openclaw`)

- Сначала запишите plist во временный файл, затем атомарно установите его от имени root:

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

- Перезагрузка не требуется; logd быстро замечает файл, но частные полезные нагрузки будут включены только в новые строки журнала.
- Просматривайте более подробный вывод с помощью существующего вспомогательного скрипта, например `./scripts/clawlog.sh --category WebChat --last 5m`.

## Отключение после отладки

- Удалите переопределение: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- При желании выполните `sudo log config --reload`, чтобы принудительно заставить logd немедленно отбросить переопределение.
- Помните, что эта поверхность может включать номера телефонов и тела сообщений; оставляйте plist на месте только пока вам активно нужны дополнительные детали.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [Журналирование Gateway](/ru/gateway/logging)

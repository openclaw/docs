---
read_when:
    - Сбор журналов macOS или расследование записи конфиденциальных данных в журналы
    - Отладка проблем с активацией голосом и жизненным циклом сеанса
summary: 'Ведение журналов OpenClaw: файл журнала диагностики с ротацией и единые флаги конфиденциальности журналов'
title: Ведение журналов в macOS
x-i18n:
    generated_at: "2026-07-13T18:18:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Ведение журналов (macOS)

## Циклический файл журнала диагностики (панель Debug)

Приложение macOS ведёт журналы через swift-log (по умолчанию используется унифицированное ведение журналов), а также может записывать циклический локальный файл журнала для долговременного сбора данных (`DiagnosticsFileLog`).

- Включение: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (по умолчанию отключено).
- Уровень детализации: средство выбора **Debug pane -> Logs -> App logging -> Verbosity**.
- Расположение: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Ротация: выполняется при достижении 5 МБ; хранится до 5 резервных копий с суффиксами `.1`...`.5` (самая старая удаляется).
- Очистка: **Debug pane -> Logs -> App logging -> "Clear"** удаляет активный файл и все резервные копии.

Считайте этот файл конфиденциальным; не передавайте его без предварительной проверки.

## Конфиденциальные данные в унифицированных журналах macOS

Унифицированное ведение журналов скрывает большинство полезных данных, если для подсистемы не включён параметр `privacy -off`. Он задаётся в файле plist по пути `/Library/Preferences/Logging/Subsystems/`, где ключом служит имя подсистемы. Этот флаг применяется только к новым записям журнала, поэтому включите его перед воспроизведением проблемы. Дополнительные сведения: [особенности конфиденциальности журналов macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Включение для OpenClaw (`ai.openclaw`)

Сначала запишите plist во временный файл, а затем атомарно установите его от имени root:

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

Перезагрузка не требуется; logd быстро подхватывает файл, но конфиденциальные полезные данные включаются только в новые строки журнала. Просматривайте более подробные выходные данные с помощью `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` задаёт временной диапазон, по умолчанию `5m`; `--category`/`-c` фильтрует по категории).

## Отключение после отладки

- Удалите переопределение: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- При необходимости выполните `sudo log config --reload`, чтобы logd немедленно сбросил переопределение.
- Эти данные могут содержать номера телефонов и тексты сообщений; оставляйте plist установленным только на время, когда он действительно необходим.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [Ведение журналов Gateway](/ru/gateway/logging)

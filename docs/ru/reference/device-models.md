---
read_when:
    - Обновление сопоставлений идентификаторов моделей устройств или файлов NOTICE/license
    - Изменение отображения имен устройств в интерфейсе Instances UI
summary: Как OpenClaw включает в поставку идентификаторы моделей устройств Apple для удобочитаемых названий в приложении для macOS.
title: База данных моделей устройств
x-i18n:
    generated_at: "2026-06-28T23:43:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 16
---

Сопутствующее приложение для macOS показывает понятные имена моделей устройств Apple в UI **Экземпляры**, сопоставляя идентификаторы моделей Apple (например, `iPad16,6`, `Mac16,6`) с человекочитаемыми именами.

Сопоставление поставляется как JSON в:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Источник данных

Сейчас мы поставляем сопоставление из репозитория под лицензией MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Чтобы сборки были детерминированными, JSON-файлы закреплены за конкретными вышестоящими коммитами (записаны в `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Обновление базы данных

1. Выберите вышестоящие коммиты, за которыми нужно закрепиться (один для iOS, один для macOS).
2. Обновите хэши коммитов в `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Повторно скачайте JSON-файлы, закрепленные за этими коммитами:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Убедитесь, что `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` по-прежнему соответствует вышестоящему репозиторию (замените его, если вышестоящая лицензия изменится).
5. Проверьте, что приложение macOS собирается без ошибок (без предупреждений):

```bash
swift build --package-path apps/macos
```

## Связанные материалы

- [Nodes](/ru/nodes)
- [Устранение неполадок Node](/ru/nodes/troubleshooting)

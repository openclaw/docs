---
read_when:
    - Обновление сопоставлений идентификаторов моделей устройств или файлов NOTICE/лицензий
    - Изменение отображения имён устройств в интерфейсе экземпляров
summary: Как OpenClaw включает идентификаторы моделей устройств Apple для отображения понятных названий в приложении macOS.
title: База данных моделей устройств
x-i18n:
    generated_at: "2026-07-12T11:49:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Интерфейс **Instances** вспомогательного приложения для macOS сопоставляет идентификаторы моделей Apple с понятными названиями (`iPad16,6` -> «iPad Pro 13 дюймов (M4)», `Mac16,6` -> «MacBook Pro (14 дюймов, 2024)»). `DeviceModelCatalog` также использует префикс идентификатора (а при его отсутствии — семейство устройства), чтобы выбрать SF Symbol для каждого устройства.

Файлы в `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Файл                                   | Назначение                                      |
| -------------------------------------- | ----------------------------------------------- |
| `ios-device-identifiers.json`          | Сопоставление идентификатора iOS/iPadOS с именем |
| `mac-device-identifiers.json`          | Сопоставление идентификатора Mac с именем       |
| `NOTICE.md`                            | Закреплённые SHA исходных коммитов              |
| `LICENSE.apple-device-identifiers.txt` | Исходная лицензия MIT                           |

## Источник данных

Скопировано из репозитория GitHub `kyle-seongwoo-jun/apple-device-identifiers`, распространяемого по лицензии MIT. Файлы JSON закреплены за SHA коммитов, указанными в `NOTICE.md`, чтобы обеспечить детерминированность сборок.

## Обновление базы данных

1. Выберите SHA исходных коммитов, которые нужно закрепить (один для iOS и один для macOS).
2. Обновите `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`, указав новые SHA.
3. Повторно скачайте файлы JSON, закреплённые за этими коммитами:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Убедитесь, что `LICENSE.apple-device-identifiers.txt` по-прежнему соответствует исходной версии; замените его, если исходная лицензия изменилась.
5. Убедитесь, что приложение для macOS собирается без ошибок:

```bash
swift build --package-path apps/macos
```

## Связанные материалы

- [Узлы](/ru/nodes)
- [Устранение неполадок Node](/ru/nodes/troubleshooting)

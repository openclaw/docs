---
read_when:
    - Обновление сопоставлений идентификаторов моделей устройств или файлов NOTICE/лицензий
    - Изменение отображения имен устройств в интерфейсе экземпляров
summary: Как OpenClaw включает идентификаторы моделей устройств Apple для отображения понятных названий в приложении для macOS.
title: База данных моделей устройств
x-i18n:
    generated_at: "2026-07-13T18:44:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Интерфейс **Instances** вспомогательного приложения для macOS сопоставляет идентификаторы моделей Apple с понятными названиями (`iPad16,6` -> «iPad Pro 13 дюймов (M4)», `Mac16,6` -> «MacBook Pro (14 дюймов, 2024)»). `DeviceModelCatalog` также использует префикс идентификатора (с резервным определением по семейству устройств), чтобы выбрать символ SF для каждого устройства.

Файлы в `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Файл                                   | Назначение                                      |
| -------------------------------------- | ----------------------------------------------- |
| `ios-device-identifiers.json`          | Сопоставление идентификатора iOS/iPadOS с именем |
| `mac-device-identifiers.json`          | Сопоставление идентификатора Mac с именем        |
| `NOTICE.md`                            | Зафиксированные SHA коммитов исходного проекта  |
| `LICENSE.apple-device-identifiers.txt` | Лицензия MIT исходного проекта                  |

## Источник данных

Добавлено в кодовую базу из GitHub-репозитория `kyle-seongwoo-jun/apple-device-identifiers`, распространяемого по лицензии MIT. JSON-файлы привязаны к SHA коммитов, указанным в `NOTICE.md`, чтобы обеспечить воспроизводимость сборок.

## Обновление базы данных

1. Выберите SHA коммитов исходного проекта для фиксации (один для iOS и один для macOS).
2. Обновите `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`, указав новые SHA.
3. Повторно загрузите JSON-файлы, зафиксированные на этих коммитах:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Убедитесь, что `LICENSE.apple-device-identifiers.txt` по-прежнему соответствует исходному проекту; замените файл, если лицензия исходного проекта изменилась.
5. Убедитесь, что приложение для macOS собирается без ошибок:

```bash
swift build --package-path apps/macos
```

## См. также

- [Nodes](/ru/nodes)
- [Устранение неполадок Node](/ru/nodes/troubleshooting)

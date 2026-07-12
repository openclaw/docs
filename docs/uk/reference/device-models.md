---
read_when:
    - Оновлення зіставлень ідентифікаторів моделей пристроїв або файлів NOTICE/ліцензій
    - Зміна способу відображення назв пристроїв в інтерфейсі екземплярів
summary: Як OpenClaw постачає ідентифікатори моделей пристроїв Apple для відображення зрозумілих назв у застосунку macOS.
title: База даних моделей пристроїв
x-i18n:
    generated_at: "2026-07-12T13:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Інтерфейс **Instances** допоміжного застосунку macOS зіставляє ідентифікатори моделей Apple зі зрозумілими назвами (`iPad16,6` -> "iPad Pro 13-inch (M4)", `Mac16,6` -> "MacBook Pro (14-inch, 2024)"). `DeviceModelCatalog` також використовує префікс ідентифікатора (а за його відсутності — сімейство пристрою), щоб вибрати SF Symbol для кожного пристрою.

Файли в `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Файл                                   | Призначення                                      |
| -------------------------------------- | ------------------------------------------------ |
| `ios-device-identifiers.json`          | Зіставлення ідентифікатора iOS/iPadOS із назвою  |
| `mac-device-identifiers.json`          | Зіставлення ідентифікатора Mac із назвою         |
| `NOTICE.md`                            | Зафіксовані SHA комітів першоджерела              |
| `LICENSE.apple-device-identifiers.txt` | Ліцензія MIT першоджерела                         |

## Джерело даних

Додано до репозиторію з GitHub-репозиторію `kyle-seongwoo-jun/apple-device-identifiers`, ліцензованого за умовами MIT. JSON-файли зафіксовано на SHA комітів, записаних у `NOTICE.md`, щоб забезпечити відтворюваність збірок.

## Оновлення бази даних

1. Виберіть SHA комітів першоджерела, які потрібно зафіксувати (один для iOS, один для macOS).
2. Оновіть `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`, указавши нові SHA.
3. Повторно завантажте JSON-файли, зафіксовані на цих комітах:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Переконайтеся, що `LICENSE.apple-device-identifiers.txt` досі відповідає першоджерелу; замініть його, якщо ліцензія першоджерела змінилася.
5. Переконайтеся, що застосунок macOS збирається без помилок:

```bash
swift build --package-path apps/macos
```

## Пов’язані матеріали

- [Вузли](/uk/nodes)
- [Усунення несправностей вузлів](/uk/nodes/troubleshooting)

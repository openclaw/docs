---
read_when:
    - Оновлення зіставлень ідентифікаторів моделей пристроїв або файлів NOTICE/license
    - Зміна того, як UI Instances відображає назви пристроїв
summary: Як OpenClaw вендорить ідентифікатори моделей пристроїв Apple для дружніх назв у застосунку macOS.
title: База моделей пристроїв
x-i18n:
    generated_at: "2026-04-23T21:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86fd45d31a030db44b7ef9da73a3eccbadd5d0f213c0ed45eead9c115c42dc0
    source_path: reference/device-models.md
    workflow: 15
---

# База моделей пристроїв (дружні назви)

Супутній застосунок macOS показує дружні назви моделей пристроїв Apple в UI **Instances**, зіставляючи ідентифікатори моделей Apple (наприклад, `iPad16,6`, `Mac16,6`) з назвами, зрозумілими людині.

Зіставлення вендориться як JSON у:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Джерело даних

Наразі ми вендоримо зіставлення з репозиторію під ліцензією MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Щоб збірки були детермінованими, JSON-файли прив’язані до конкретних upstream-комітів (записаних у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Оновлення бази даних

1. Виберіть upstream-коміти, до яких хочете прив’язатися (один для iOS, один для macOS).
2. Оновіть хеші комітів у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Повторно завантажте JSON-файли, прив’язані до цих комітів:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Переконайтеся, що `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` усе ще відповідає upstream (замініть його, якщо upstream-ліцензія зміниться).
5. Переконайтеся, що застосунок macOS збирається без застережень:

```bash
swift build --package-path apps/macos
```

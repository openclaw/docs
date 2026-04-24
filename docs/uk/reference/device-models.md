---
read_when:
    - Оновлення зіставлень ідентифікаторів моделей пристроїв або файлів NOTICE/license
    - Зміна того, як UI Instances відображає назви пристроїв
summary: Як OpenClaw вендорить ідентифікатори моделей пристроїв Apple для дружніх назв у застосунку macOS.
title: база даних моделей пристроїв
x-i18n:
    generated_at: "2026-04-24T18:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
---

Супутній застосунок macOS показує дружні назви моделей пристроїв Apple в UI **Instances**, зіставляючи ідентифікатори моделей Apple (наприклад, `iPad16,6`, `Mac16,6`) з людиночитаними назвами.

Зіставлення вендориться як JSON у:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Джерело даних

Наразі ми вендоримо зіставлення з репозиторію під ліцензією MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Щоб забезпечити детермінованість збірок, JSON-файли прив’язані до конкретних комітів upstream (записаних у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Оновлення бази даних

1. Виберіть коміти upstream, до яких хочете прив’язатися (один для iOS, один для macOS).
2. Оновіть hash комітів у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
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
5. Перевірте, що застосунок macOS збирається без попереджень:

```bash
swift build --package-path apps/macos
```

## Пов’язане

- [Nodes](/uk/nodes)
- [Усунення проблем Node](/uk/nodes/troubleshooting)

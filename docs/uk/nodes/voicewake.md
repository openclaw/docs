---
read_when:
    - Зміна поведінки або типових значень voice wake words
    - Додавання нових платформ вузлів, яким потрібна синхронізація wake words
summary: Глобальні wake words для голосу (керовані Gateway) і те, як вони синхронізуються між вузлами
title: Голосове пробудження
x-i18n:
    generated_at: "2026-04-23T20:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ec2cf1cd4f57a7f40908830c2288fcaa77104a39528b409cdc30655a6d65636
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (глобальні wake words)

OpenClaw розглядає **wake words як один глобальний список**, яким керує **Gateway**.

- **Немає кастомних wake words для окремих вузлів.**
- **Будь-який UI вузла/застосунку може редагувати** список; зміни зберігаються Gateway і транслюються всім.
- macOS та iOS зберігають локальні перемикачі **Voice Wake увімкнено/вимкнено** (локальний UX і дозволи відрізняються).
- Android наразі тримає Voice Wake вимкненим і використовує ручний потік мікрофона у вкладці Voice.

## Зберігання (хост Gateway)

Wake words зберігаються на машині gateway за адресою:

- `~/.openclaw/settings/voicewake.json`

Форма:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Протокол

### Методи

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` з параметрами `{ triggers: string[] }` → `{ triggers: string[] }`

Примітки:

- Triggers нормалізуються (обрізання пробілів, порожні значення відкидаються). Порожні списки повертаються до типових значень.
- Для безпеки застосовуються обмеження (ліміти кількості/довжини).

### Події

- `voicewake.changed` payload `{ triggers: string[] }`

Хто її отримує:

- Усі WebSocket-клієнти (застосунок macOS, WebChat тощо)
- Усі підключені вузли (iOS/Android), а також під час підключення вузла як початковий push поточного стану

## Поведінка клієнтів

### Застосунок macOS

- Використовує глобальний список, щоб шлюзувати trigger-и `VoiceWakeRuntime`.
- Редагування “Trigger words” у налаштуваннях Voice Wake викликає `voicewake.set`, а потім покладається на broadcast, щоб синхронізувати інші клієнти.

### Вузол iOS

- Використовує глобальний список для визначення trigger-ів у `VoiceWakeManager`.
- Редагування Wake Words у Settings викликає `voicewake.set` (через Gateway WS) і також підтримує чутливість локального визначення wake words.

### Вузол Android

- Voice Wake наразі вимкнено в runtime/Settings Android.
- Голос в Android використовує ручне захоплення мікрофона у вкладці Voice замість trigger-ів wake word.

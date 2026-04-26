---
read_when:
    - Зміна поведінки або значень за замовчуванням для слів активації голосом
    - Додавання нових платформ вузлів, яким потрібна синхронізація слів активації голосом
summary: Глобальні слова активації голосом (належать Gateway) і як вони синхронізуються між вузлами
title: Голосова активація
x-i18n:
    generated_at: "2026-04-26T05:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw розглядає **слова активації як єдиний глобальний список**, яким керує **Gateway**.

- **Немає окремих користувацьких слів активації для кожного Node**.
- **Будь-який UI Node/застосунку може редагувати** список; зміни зберігаються Gateway і розсилаються всім.
- macOS та iOS зберігають локальні перемикачі **увімкнення/вимкнення Voice Wake** (локальний UX і дозволи відрізняються).
- Android наразі тримає Voice Wake вимкненим і використовує ручний потік мікрофона на вкладці Voice.

## Зберігання (хост Gateway)

Слова активації зберігаються на машині gateway тут:

- `~/.openclaw/settings/voicewake.json`

Структура:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Протокол

### Методи

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` з параметрами `{ triggers: string[] }` → `{ triggers: string[] }`

Примітки:

- Тригери нормалізуються (пробіли по краях обрізаються, порожні значення відкидаються). Порожні списки повертаються до значень за замовчуванням.
- Для безпеки застосовуються обмеження (ліміти на кількість/довжину).

### Методи маршрутизації (тригер → ціль)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` з параметрами `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Структура `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Цілі маршруту підтримують рівно один із варіантів:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Події

- `voicewake.changed` з навантаженням `{ triggers: string[] }`
- `voicewake.routing.changed` з навантаженням `{ config: VoiceWakeRoutingConfig }`

Хто це отримує:

- Усі клієнти WebSocket (застосунок macOS, WebChat тощо)
- Усі підключені Node (iOS/Android), а також під час підключення Node як початкове надсилання “поточного стану”.

## Поведінка клієнта

### Застосунок macOS

- Використовує глобальний список для керування тригерами `VoiceWakeRuntime`.
- Редагування “Trigger words” у налаштуваннях Voice Wake викликає `voicewake.set`, а потім покладається на розсилання, щоб підтримувати синхронізацію інших клієнтів.

### Node iOS

- Використовує глобальний список для виявлення тригерів `VoiceWakeManager`.
- Редагування Wake Words у Settings викликає `voicewake.set` (через Gateway WS), а також зберігає локальне виявлення слів активації чутливим до змін.

### Node Android

- Voice Wake наразі вимкнено в runtime/Settings Android.
- Голосова взаємодія на Android використовує ручне захоплення мікрофона на вкладці Voice замість тригерів слів активації.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)

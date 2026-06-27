---
read_when:
    - Зміна поведінки або стандартних параметрів голосових слів активації
    - Додавання нових платформ вузлів, яким потрібна синхронізація wake word
summary: Глобальні голосові слова активації (належать Gateway) і як вони синхронізуються між вузлами
title: Голосове пробудження
x-i18n:
    generated_at: "2026-06-27T17:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw розглядає **слова пробудження як єдиний глобальний список**, яким володіє **Gateway**.

- **Немає користувацьких слів пробудження для окремих вузлів**.
- **Будь-який вузол або UI застосунку може редагувати** список; зміни зберігаються Gateway і транслюються всім.
- macOS та iOS зберігають локальні перемикачі **увімкнення/вимкнення голосового пробудження** (локальний UX і дозволи відрізняються).
- Android наразі тримає голосове пробудження вимкненим і використовує ручний потік мікрофона на вкладці «Голос».

## Сховище (хост Gateway)

Слова пробудження та правила маршрутизації зберігаються в базі даних стану Gateway:

- `~/.openclaw/state/openclaw.sqlite`

Активні таблиці:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Застарілі файли `settings/voicewake.json` і `settings/voicewake-routing.json` є
лише вхідними даними для міграції doctor; runtime читає та записує таблиці SQLite.

## Протокол

### Методи

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` з параметрами `{ triggers: string[] }` → `{ triggers: string[] }`

Примітки:

- Тригери нормалізуються (обрізаються пробіли, порожні значення відкидаються). Порожні списки повертаються до стандартних значень.
- Обмеження застосовуються для безпеки (ліміти кількості/довжини).

### Методи маршрутизації (тригер → ціль)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` з параметрами `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Форма `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Цілі маршрутів підтримують рівно один із варіантів:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Події

- `voicewake.changed` з payload `{ triggers: string[] }`
- `voicewake.routing.changed` з payload `{ config: VoiceWakeRoutingConfig }`

Хто це отримує:

- Усі клієнти WebSocket (застосунок macOS, WebChat тощо)
- Усі підключені вузли (iOS/Android), а також під час підключення вузла як початкове надсилання «поточного стану».

## Поведінка клієнта

### Застосунок macOS

- Використовує глобальний список, щоб обмежувати тригери `VoiceWakeRuntime`.
- Редагування «Слів-тригерів» у налаштуваннях голосового пробудження викликає `voicewake.set`, а потім покладається на трансляцію, щоб синхронізувати інші клієнти.

### Вузол iOS

- Використовує глобальний список для виявлення тригерів `VoiceWakeManager`.
- Редагування слів пробудження в налаштуваннях викликає `voicewake.set` (через Gateway WS), а також підтримує швидку реакцію локального виявлення слів пробудження.

### Вузол Android

- Голосове пробудження наразі вимкнене в runtime/налаштуваннях Android.
- Голос на Android використовує ручне захоплення мікрофона на вкладці «Голос» замість тригерів слів пробудження.

## Пов’язане

- [Режим розмови](/uk/nodes/talk)
- [Аудіо та голосові нотатки](/uk/nodes/audio)
- [Розуміння медіа](/uk/nodes/media-understanding)

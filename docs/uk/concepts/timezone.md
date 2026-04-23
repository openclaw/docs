---
read_when:
    - Вам потрібно зрозуміти, як часові мітки нормалізуються для моделі
    - Налаштування часового поясу користувача для системних prompt
summary: Обробка часових поясів для агентів, envelopes і prompt
title: Часові пояси
x-i18n:
    generated_at: "2026-04-23T20:51:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw стандартизує часові мітки так, щоб модель бачила **єдиний опорний час**.

## Envelopes повідомлень (типово локальний час)

Вхідні повідомлення обгортаються в envelope такого вигляду:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Часова мітка в envelope за замовчуванням має **локальний час host**, з точністю до хвилин.

Це можна перевизначити так:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` використовує UTC.
- `envelopeTimezone: "user"` використовує `agents.defaults.userTimezone` (з резервним переходом до часового поясу host).
- Використовуйте явний часовий пояс IANA (наприклад, `"Europe/Vienna"`), щоб мати фіксоване зміщення.
- `envelopeTimestamp: "off"` прибирає абсолютні часові мітки із заголовків envelope.
- `envelopeElapsed: "off"` прибирає суфікси відносного часу (у стилі `+2m`).

### Приклади

**Локальний час (типово):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Фіксований часовий пояс:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Відносний час:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Payload інструментів (необроблені дані провайдера + нормалізовані поля)

Виклики інструментів (`channels.discord.readMessages`, `channels.slack.readMessages` тощо) повертають **необроблені часові мітки провайдера**.
Для узгодженості ми також додаємо нормалізовані поля:

- `timestampMs` (мілісекунди епохи UTC)
- `timestampUtc` (рядок UTC у форматі ISO 8601)

Необроблені поля провайдера зберігаються.

## Часовий пояс користувача для системного prompt

Встановіть `agents.defaults.userTimezone`, щоб повідомити моделі локальний часовий пояс користувача. Якщо його
не задано, OpenClaw визначає **часовий пояс host під час виконання** (без запису в конфігурацію).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Системний prompt включає:

- розділ `Current Date & Time` з локальним часом і часовим поясом
- `Time format: 12-hour` або `24-hour`

Ви можете керувати форматом prompt через `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Повну поведінку та приклади див. у [Date & Time](/uk/date-time).

## Пов’язане

- [Heartbeat](/uk/gateway/heartbeat) — активні години використовують часовий пояс для планування
- [Завдання Cron](/uk/automation/cron-jobs) — Cron-вирази використовують часовий пояс для планування
- [Date & Time](/uk/date-time) — повна поведінка дати/часу та приклади

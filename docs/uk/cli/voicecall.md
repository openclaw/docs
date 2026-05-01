---
read_when:
    - Ви використовуєте Plugin голосових викликів і хочете отримати точки входу CLI
    - Вам потрібні швидкі приклади для `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Довідник CLI для `openclaw voicecall` (командний інтерфейс Plugin для голосових викликів)
title: Голосовий виклик
x-i18n:
    generated_at: "2026-05-01T05:39:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` — це команда, надана Plugin. Вона з’являється лише якщо Plugin голосових викликів встановлено й увімкнено.

Коли Gateway запущено, операційні команди (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` і `status`) надсилаються до середовища виконання голосових викликів цього Gateway. Якщо Gateway недоступний, вони повертаються до автономного середовища виконання CLI.

Основна документація:

- Plugin голосових викликів: [Голосовий виклик](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` за замовчуванням виводить перевірки готовності в зручному для читання форматі. Використовуйте `--json` для
скриптів:

```bash
openclaw voicecall setup --json
```

`status` за замовчуванням виводить активні виклики у форматі JSON. Передайте `--call-id <id>`, щоб перевірити
один виклик.

Для зовнішніх провайдерів (`twilio`, `telnyx`, `plivo`) налаштування має визначити публічний
URL Webhook з `publicUrl`, тунелю або експозиції Tailscale. Резервний варіант обслуговування через loopback/приватну мережу
відхиляється, бо оператори не можуть до нього дістатися.

`smoke` запускає ті самі перевірки готовності. Він не здійснюватиме реальний телефонний виклик,
якщо не вказано одночасно `--to` і `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Відкриття Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте кінцеву точку Webhook лише для мереж, яким довіряєте. За можливості надавайте перевагу Tailscale Serve замість Funnel.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Plugin голосових викликів](/uk/plugins/voice-call)

---
read_when:
    - Ви використовуєте voice-call plugin і хочете отримати точки входу CLI
    - Ви хочете отримати швидкі приклади для `voicecall call|continue|status|tail|expose`
summary: Довідник CLI для `openclaw voicecall` (поверхня команд voice-call plugin)
title: голосовий виклик
x-i18n:
    generated_at: "2026-04-23T06:19:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає plugin. Вона з’являється лише тоді, коли plugin voice-call установлено та ввімкнено.

Основна документація:

- Plugin voice-call: [Voice Call](/uk/plugins/voice-call)

## Поширені команди

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Відкриття Webhook назовні (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте endpoint Webhook лише для мереж, яким ви довіряєте. Якщо можливо, надавайте перевагу Tailscale Serve замість Funnel.

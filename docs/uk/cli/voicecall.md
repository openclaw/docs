---
read_when:
    - Ви використовуєте Plugin voice-call і хочете мати точки входу CLI
    - Вам потрібні швидкі приклади для `voicecall call|continue|status|tail|expose`
summary: Довідник CLI для `openclaw voicecall` (поверхня команд Plugin-а голосових викликів)
title: Voicecall
x-i18n:
    generated_at: "2026-04-23T20:49:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0346aaef09f153b288c7610eb34e1295e18655eb54aeead66f14fc1e998cb511
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` — це команда, яку надає Plugin. Вона з’являється лише якщо Plugin voice-call встановлено та ввімкнено.

Основна документація:

- Plugin voice-call: [Voice Call](/uk/plugins/voice-call)

## Типові команди

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Публікація Webhook-ів (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Примітка щодо безпеки: відкривайте endpoint Webhook лише для мереж, яким довіряєте. Коли можливо, надавайте перевагу Tailscale Serve замість Funnel.

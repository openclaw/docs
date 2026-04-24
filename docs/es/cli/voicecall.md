---
read_when:
    - Usas el Plugin de llamadas de voz y quieres los puntos de entrada de CLI
    - Quieres ejemplos rápidos para `voicecall call|continue|dtmf|status|tail|expose`
summary: Referencia de CLI para `openclaw voicecall` (superficie de comandos del Plugin de llamadas de voz)
title: Llamada de voz
x-i18n:
    generated_at: "2026-04-24T05:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` es un comando proporcionado por un Plugin. Solo aparece si el Plugin de llamadas de voz está instalado y habilitado.

Documento principal:

- Plugin de llamadas de voz: [Voice Call](/es/plugins/voice-call)

## Comandos comunes

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Exponer Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota de seguridad: expón el endpoint de Webhook solo a redes en las que confíes. Prefiere Tailscale Serve sobre Funnel cuando sea posible.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugin de llamadas de voz](/es/plugins/voice-call)

---
read_when:
    - Usi il plugin voice-call e vuoi i punti di accesso della CLI
    - Vuoi esempi rapidi per `voicecall call|continue|status|tail|expose`
summary: Riferimento CLI per `openclaw voicecall` (superficie dei comandi del plugin voice-call)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T13:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` è un comando fornito da un plugin. Compare solo se il plugin voice-call è installato e abilitato.

Documentazione principale:

- Plugin voice-call: [Voice Call](/plugins/voice-call)

## Comandi comuni

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Esposizione dei webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota sulla sicurezza: esponi l'endpoint webhook solo a reti di cui ti fidi. Quando possibile, preferisci Tailscale Serve a Funnel.

---
read_when:
    - Usi il Plugin voice-call e vuoi i punti di ingresso della CLI
    - Vuoi esempi rapidi per `voicecall call|continue|dtmf|status|tail|expose`
summary: Riferimento CLI per `openclaw voicecall` (superficie dei comandi del Plugin voice-call)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T08:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` è un comando fornito da un Plugin. Compare solo se il Plugin voice-call è installato e abilitato.

Documento principale:

- Plugin voice-call: [Voice Call](/it/plugins/voice-call)

## Comandi comuni

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Esporre i webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota di sicurezza: esponi l'endpoint webhook solo a reti di cui ti fidi. Quando possibile, preferisci Tailscale Serve a Funnel.

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin voice-call](/it/plugins/voice-call)

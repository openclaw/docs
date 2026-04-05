---
read_when:
    - Używasz pluginu voice-call i chcesz poznać punkty wejścia CLI
    - Chcesz szybkich przykładów dla `voicecall call|continue|status|tail|expose`
summary: Dokumentacja CLI dla `openclaw voicecall` (powierzchnia poleceń pluginu voice-call)
title: voicecall
x-i18n:
    generated_at: "2026-04-05T13:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` to polecenie dostarczane przez plugin. Pojawia się tylko wtedy, gdy plugin voice-call jest zainstalowany i włączony.

Główna dokumentacja:

- Plugin voice-call: [Voice Call](/plugins/voice-call)

## Typowe polecenia

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Udostępnianie webhooków (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Uwaga dotycząca bezpieczeństwa: udostępniaj endpoint webhooka tylko sieciom, którym ufasz. Jeśli to możliwe, preferuj Tailscale Serve zamiast Funnel.

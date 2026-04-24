---
read_when:
    - Używasz Pluginu voice-call i chcesz poznać punkty wejścia CLI
    - Chcesz szybkie przykłady dla `voicecall call|continue|dtmf|status|tail|expose`
summary: Dokumentacja CLI dla `openclaw voicecall` (powierzchnia poleceń Pluginu połączeń głosowych)
title: Voicecall
x-i18n:
    generated_at: "2026-04-24T09:04:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` to polecenie dostarczane przez Plugin. Pojawia się tylko wtedy, gdy Plugin voice-call jest zainstalowany i włączony.

Główna dokumentacja:

- Plugin voice-call: [Voice Call](/pl/plugins/voice-call)

## Typowe polecenia

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Udostępnianie Webhooków (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Uwaga dotycząca bezpieczeństwa: udostępniaj punkt końcowy Webhook tylko zaufanym sieciom. Gdy to możliwe, preferuj Tailscale Serve zamiast Funnel.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)

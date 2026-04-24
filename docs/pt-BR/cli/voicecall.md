---
read_when:
    - Você usa o Plugin de chamadas de voz e quer os pontos de entrada da CLI
    - Você quer exemplos rápidos para `voicecall call|continue|dtmf|status|tail|expose`
summary: Referência da CLI para `openclaw voicecall` (superfície de comandos do Plugin de chamadas de voz)
title: Chamada de voz
x-i18n:
    generated_at: "2026-04-24T05:47:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03773f46d1c9ab407a9734cb2bbe13d2a36bf0da8e6c9c68c18c05e285912c88
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por Plugin. Ele só aparece se o Plugin de chamadas de voz estiver instalado e habilitado.

Documentação principal:

- Plugin de chamadas de voz: [Chamada de voz](/pt-BR/plugins/voice-call)

## Comandos comuns

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

## Expondo Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Observação de segurança: exponha o endpoint do Webhook somente para redes em que você confia. Prefira Tailscale Serve em vez de Funnel sempre que possível.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

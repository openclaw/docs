---
read_when:
    - Você usa o Plugin de chamada de voz e quer os pontos de entrada da CLI
    - Você quer exemplos rápidos para `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referência da CLI para `openclaw voicecall` (superfície de comando do Plugin de chamada de voz)
title: Chamada de voz
x-i18n:
    generated_at: "2026-04-25T13:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por Plugin. Ele só aparece se o Plugin de chamada de voz estiver instalado e ativado.

Documentação principal:

- Plugin de chamada de voz: [Voice Call](/pt-BR/plugins/voice-call)

## Comandos comuns

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` imprime verificações de prontidão legíveis por humanos por padrão. Use `--json` para
scripts:

```bash
openclaw voicecall setup --json
```

Para provedores externos (`twilio`, `telnyx`, `plivo`), `setup` precisa resolver uma
URL pública de Webhook a partir de `publicUrl`, um túnel ou exposição via Tailscale. Um fallback de serviço em loopback/privado
é rejeitado porque as operadoras não conseguem alcançá-lo.

`smoke` executa as mesmas verificações de prontidão. Ele não fará uma chamada telefônica real
a menos que `--to` e `--yes` estejam presentes:

```bash
openclaw voicecall smoke --to "+15555550123"        # execução de teste
openclaw voicecall smoke --to "+15555550123" --yes  # chamada notify real
```

## Expondo Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Observação de segurança: exponha o endpoint de Webhook apenas a redes em que você confia. Prefira Tailscale Serve a Funnel sempre que possível.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

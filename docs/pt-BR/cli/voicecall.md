---
read_when:
    - Você usa o Plugin de chamada de voz e quer os pontos de entrada da CLI
    - Você quer exemplos rápidos para `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Referência da CLI para `openclaw voicecall` (superfície de comandos do Plugin de chamada de voz)
title: Chamada de voz
x-i18n:
    generated_at: "2026-05-01T05:55:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` é um comando fornecido por Plugin. Ele aparece somente se o Plugin de chamada de voz estiver instalado e habilitado.

Quando o Gateway está em execução, comandos operacionais (`call`, `start`,
`continue`, `speak`, `dtmf`, `end` e `status`) são enviados para o runtime de
chamada de voz desse Gateway. Se nenhum Gateway estiver acessível, eles recorrem
a um runtime de CLI independente.

Documentação principal:

- Plugin de chamada de voz: [Chamada de voz](/pt-BR/plugins/voice-call)

## Comandos comuns

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

`setup` imprime verificações de prontidão legíveis por humanos por padrão. Use `--json` para
scripts:

```bash
openclaw voicecall setup --json
```

`status` imprime chamadas ativas como JSON por padrão. Passe `--call-id <id>` para inspecionar
uma chamada.

Para provedores externos (`twilio`, `telnyx`, `plivo`), a configuração precisa resolver uma URL de
Webhook pública a partir de `publicUrl`, de um túnel ou da exposição via Tailscale. Um fallback de
serviço em loopback/privado é rejeitado porque as operadoras não conseguem acessá-lo.

`smoke` executa as mesmas verificações de prontidão. Ele não fará uma chamada telefônica real
a menos que `--to` e `--yes` estejam presentes:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## Expondo Webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Observação de segurança: exponha o endpoint de Webhook somente para redes em que você confia. Prefira Tailscale Serve em vez de Funnel quando possível.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

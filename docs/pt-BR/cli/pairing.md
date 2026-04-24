---
read_when:
    - Você está usando DMs no modo pairing e precisa aprovar remetentes
summary: Referência da CLI para `openclaw pairing` (aprovar/listar solicitações de pairing)
title: Pairing
x-i18n:
    generated_at: "2026-04-24T05:46:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Aprove ou inspecione solicitações de pairing de DM (para canais que oferecem suporte a pairing).

Relacionado:

- Fluxo de pairing: [Pairing](/pt-BR/channels/pairing)

## Comandos

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Lista solicitações de pairing pendentes para um canal.

Opções:

- `[channel]`: ID posicional do canal
- `--channel <channel>`: ID explícito do canal
- `--account <accountId>`: ID da conta para canais com múltiplas contas
- `--json`: saída legível por máquina

Observações:

- Se vários canais com suporte a pairing estiverem configurados, você deverá fornecer um canal posicionalmente ou com `--channel`.
- Canais de extensão são permitidos, desde que o ID do canal seja válido.

## `pairing approve`

Aprova um código de pairing pendente e permite esse remetente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando exatamente um canal com suporte a pairing estiver configurado

Opções:

- `--channel <channel>`: ID explícito do canal
- `--account <accountId>`: ID da conta para canais com múltiplas contas
- `--notify`: envia uma confirmação de volta ao solicitante no mesmo canal

## Observações

- Entrada do canal: passe-a posicionalmente (`pairing list telegram`) ou com `--channel <channel>`.
- `pairing list` oferece suporte a `--account <accountId>` para canais com múltiplas contas.
- `pairing approve` oferece suporte a `--account <accountId>` e `--notify`.
- Se apenas um canal com suporte a pairing estiver configurado, `pairing approve <code>` é permitido.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Pairing de canal](/pt-BR/channels/pairing)

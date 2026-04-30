---
read_when:
    - Você está usando DMs em modo de pareamento e precisa aprovar remetentes
summary: Referência da CLI para `openclaw pairing` (aprovar/listar solicitações de pareamento)
title: Pareamento
x-i18n:
    generated_at: "2026-04-30T09:42:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprove ou inspecione solicitações de emparelhamento por DM (para canais compatíveis com emparelhamento).

Relacionado:

- Fluxo de emparelhamento: [Emparelhamento](/pt-BR/channels/pairing)

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

Lista solicitações de emparelhamento pendentes para um canal.

Opções:

- `[channel]`: id de canal posicional
- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id da conta para canais com várias contas
- `--json`: saída legível por máquina

Observações:

- Se vários canais compatíveis com emparelhamento estiverem configurados, você deve fornecer um canal posicionalmente ou com `--channel`.
- Canais de extensão são permitidos desde que o id do canal seja válido.

## `pairing approve`

Aprova um código de emparelhamento pendente e permite esse remetente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando exatamente um canal compatível com emparelhamento está configurado

Opções:

- `--channel <channel>`: id de canal explícito
- `--account <accountId>`: id da conta para canais com várias contas
- `--notify`: envia uma confirmação de volta ao solicitante no mesmo canal

Bootstrap do proprietário:

- Se `commands.ownerAllowFrom` estiver vazio quando você aprovar um código de emparelhamento, o OpenClaw também registra o remetente aprovado como o proprietário dos comandos, usando uma entrada com escopo de canal como `telegram:123456789`.
- Isso só inicializa o primeiro proprietário. Aprovações de emparelhamento posteriores não substituem nem expandem `commands.ownerAllowFrom`.
- O proprietário dos comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas, como `/diagnostics`, `/export-trajectory`, `/config` e aprovações de execução.

## Observações

- Entrada de canal: passe-a posicionalmente (`pairing list telegram`) ou com `--channel <channel>`.
- `pairing list` dá suporte a `--account <accountId>` para canais com várias contas.
- `pairing approve` dá suporte a `--account <accountId>` e `--notify`.
- Se apenas um canal compatível com emparelhamento estiver configurado, `pairing approve <code>` é permitido.
- Se você aprovou um remetente antes de esse bootstrap existir, execute `openclaw doctor`; ele avisa quando nenhum proprietário dos comandos está configurado e mostra o comando `openclaw config set commands.ownerAllowFrom ...` para corrigir isso.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Emparelhamento de canais](/pt-BR/channels/pairing)

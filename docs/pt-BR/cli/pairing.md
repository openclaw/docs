---
read_when:
    - Você está usando mensagens diretas no modo de pareamento e precisa aprovar os remetentes
summary: Referência da CLI para `openclaw pairing` (aprovar/listar solicitações de pareamento)
title: Pareamento
x-i18n:
    generated_at: "2026-07-11T23:49:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprove ou inspecione solicitações de pareamento por mensagem direta em canais que oferecem suporte a pareamento (apenas mensagens diretas de chat — o pareamento de Node/dispositivo usa `openclaw devices`).

Relacionado: [Fluxo de pareamento](/pt-BR/channels/pairing)

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

Lista as solicitações de pareamento pendentes de um canal.

| Opção                   | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `[channel]`             | ID posicional do canal                         |
| `--channel <channel>`   | ID explícito do canal                          |
| `--account <accountId>` | ID da conta para canais com várias contas      |
| `--json`                | saída legível por máquina                      |

Se vários canais compatíveis com pareamento estiverem configurados, informe um canal como argumento posicional ou com `--channel`. Os canais de extensão funcionam desde que o ID do canal seja válido.

## `pairing approve`

Aprova um código de pareamento pendente e permite esse remetente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando exatamente um canal compatível com pareamento estiver configurado

Opções: `--channel <channel>`, `--account <accountId>`, `--notify` (envia uma confirmação ao solicitante pelo mesmo canal).

### Inicialização do proprietário

Se `commands.ownerAllowFrom` estiver vazio quando você aprovar um código de pareamento, o OpenClaw também registrará o remetente aprovado como proprietário dos comandos, usando uma entrada com escopo de canal, como `telegram:123456789`. Isso inicializa apenas o primeiro proprietário — aprovações de pareamento posteriores nunca substituem nem ampliam `commands.ownerAllowFrom`.

O proprietário dos comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas, como `/diagnostics`, `/export-trajectory`, `/config` e aprovações de execução. O pareamento apenas permite que um remetente converse com o agente; por si só, ele não concede privilégios de proprietário além dessa inicialização única.

Se você aprovou um remetente antes da existência dessa inicialização, execute `openclaw doctor`; ele avisa quando nenhum proprietário dos comandos está configurado e mostra o comando exato `openclaw config set commands.ownerAllowFrom ...` para corrigir isso.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Pareamento de canais](/pt-BR/channels/pairing)

---
read_when:
    - Você está usando mensagens diretas no modo de pareamento e precisa aprovar os remetentes
summary: Referência da CLI para `openclaw pairing` (aprovar/listar solicitações de pareamento)
title: Pareamento
x-i18n:
    generated_at: "2026-07-16T12:22:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Aprove ou inspecione solicitações de pareamento por MD para canais que oferecem suporte a pareamento (somente MDs de chat — o pareamento de Node/dispositivo usa `openclaw devices`).

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

Liste as solicitações de pareamento pendentes para um canal.

| Opção                   | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `[channel]`      | id posicional do canal                         |
| `--channel <channel>`      | id explícito do canal                          |
| `--account <accountId>`      | id da conta para canais com várias contas      |
| `--json`      | saída legível por máquina                      |

Se vários canais compatíveis com pareamento estiverem configurados, passe um canal como argumento posicional ou com `--channel`. Canais de extensão funcionam desde que o id do canal seja válido.

## `pairing approve`

Aprove um código de pareamento pendente e permita esse remetente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando exatamente um canal compatível com pareamento estiver configurado

Opções: `--channel <channel>`, `--account <accountId>`, `--notify` (envia uma confirmação ao solicitante pelo mesmo canal).

### Inicialização do proprietário

Se `commands.ownerAllowFrom` estiver vazio quando um código de pareamento for aprovado, o OpenClaw também registrará o remetente aprovado como proprietário dos comandos, usando uma entrada com escopo de canal, como `telegram:123456789`. Isso inicializa apenas o primeiro proprietário — aprovações de pareamento posteriores nunca substituem nem expandem `commands.ownerAllowFrom`.

O proprietário dos comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas, como `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` e aprovações de execução. O pareamento apenas permite que um remetente converse com o agente; por si só, ele não concede privilégios de proprietário além dessa inicialização única.

Se um remetente tiver sido aprovado antes da existência dessa inicialização, execute `openclaw doctor`; ele emitirá um aviso quando nenhum proprietário dos comandos estiver configurado e mostrará o comando `openclaw config set commands.ownerAllowFrom ...` exato para corrigir isso.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Pareamento de canais](/pt-BR/channels/pairing)

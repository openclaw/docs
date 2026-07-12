---
read_when:
    - Você quer consultar IDs de contatos, grupos e do próprio usuário para um canal
    - Você está desenvolvendo um adaptador de diretório de canais
summary: Referência da CLI para `openclaw directory` (próprio, pares, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-07-11T23:50:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de diretório para canais compatíveis: contatos/pares, grupos e "eu" (o próprio usuário).

Os resultados devem ser colados em outros comandos, especialmente `openclaw message send --target ...`.

## Opções comuns

- `--channel <name>`: id/alias do canal (obrigatório quando vários canais estão configurados; selecionado automaticamente quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: conta padrão do canal)
- `--json`: gera a saída em JSON

A saída padrão (não JSON) é `id` (e, às vezes, `name`) separado por uma tabulação.

## Observações

- Para muitos canais, os resultados são baseados na configuração (listas de permissões/grupos configurados), e não em um diretório em tempo real do provedor.
- Um plugin de canal já instalado pode não oferecer suporte a diretórios. Nesse caso, o comando informa que a operação não é compatível; ele não tenta reinstalar nem atualizar o plugin para adicionar esse suporte.

## Como usar os resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID por canal

| Canal                               | Formato do id de destino                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (mensagem direta), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (canal/boletim, somente saída) |
| Signal                              | Aliases configurados são resolvidos para destinos de mensagem direta E.164/UUID ou destinos de grupo `group:<id>`                 |
| Telegram                            | `@username` ou id numérico do chat; grupos usam ids numéricos                                                                     |
| Slack                               | `user:U…` e `channel:C…`                                                                                                          |
| Discord                             | `user:<id>` e `channel:<id>`                                                                                                      |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` ou `#alias:server`                                                                      |
| Microsoft Teams (plugin)            | `user:<id>` e `conversation:<id>`                                                                                                 |
| Zalo (plugin)                       | Id do usuário (API do bot)                                                                                                        |
| Zalo Personal / `zalouser` (plugin) | Id da conversa (mensagem direta/grupo), obtido de `zca` (`me`, `friend list`, `group list`)                                       |

## O próprio usuário ("eu")

```bash
openclaw directory self --channel zalouser
```

## Pares (contatos/usuários)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Grupos

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Conteúdo relacionado

- [Referência da CLI](/pt-BR/cli)

---
read_when:
    - Você quer consultar IDs de contatos, grupos ou do próprio usuário para um canal
    - Você está desenvolvendo um adaptador de diretório de canal
summary: Referência da CLI para `openclaw directory` (próprio, pares, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-07-12T15:00:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de diretório para canais que oferecem suporte a elas: contatos/pares, grupos e "eu" (o próprio usuário).

Os resultados devem ser colados em outros comandos, especialmente `openclaw message send --target ...`.

## Opções comuns

- `--channel <name>`: id/alias do canal (obrigatório quando vários canais estão configurados; selecionado automaticamente quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: conta padrão do canal)
- `--json`: gera a saída em JSON

A saída padrão (não JSON) é `id` (e, às vezes, `name`) separado por uma tabulação.

## Observações

- Para muitos canais, os resultados são baseados na configuração (listas de permissões/grupos configurados), em vez de um diretório ativo do provedor.
- Um Plugin de canal já instalado pode não oferecer suporte a diretórios. Nesse caso, o comando informa que a operação não é compatível; ele não tenta reinstalar nem atualizar o Plugin para adicionar suporte.

## Como usar os resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID por canal

| Canal                               | Formato do id de destino                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (MD), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (canal/newsletter, somente saída)          |
| Signal                              | Os aliases configurados são resolvidos para destinos de MD E.164/UUID ou destinos de grupo `group:<id>`                           |
| Telegram                            | `@username` ou id numérico do chat; os grupos usam ids numéricos                                                                  |
| Slack                               | `user:U…` e `channel:C…`                                                                                                          |
| Discord                             | `user:<id>` e `channel:<id>`                                                                                                      |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` ou `#alias:server`                                                                      |
| Microsoft Teams (Plugin)            | `user:<id>` e `conversation:<id>`                                                                                                 |
| Zalo (Plugin)                       | Id do usuário (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (Plugin) | Id da conversa (MD/grupo), proveniente de `zca` (`me`, `friend list`, `group list`)                                                 |

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

## Relacionado

- [Referência da CLI](/pt-BR/cli)

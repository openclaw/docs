---
read_when:
    - Você quer consultar IDs de contatos/grupos/próprios para um canal
    - Você está desenvolvendo um adaptador de diretório de canais
summary: Referência da CLI para `openclaw directory` (si mesmo, pares, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-05-02T05:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de diretório para canais que oferecem suporte a isso (contatos/pares, grupos e “me”).

## Flags comuns

- `--channel <name>`: ID/alias do canal (obrigatório quando vários canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: ID da conta (padrão: padrão do canal)
- `--json`: gera JSON

## Observações

- `directory` serve para ajudar você a encontrar IDs que podem ser colados em outros comandos (especialmente `openclaw message send --target ...`).
- Para muitos canais, os resultados são baseados na configuração (listas de permissão / grupos configurados), em vez de um diretório ativo do provedor.
- Plugins de canal instalados ainda podem omitir o suporte a diretório; nesse caso, o comando informa a operação de diretório sem suporte em vez de reinstalar o Plugin.
- A saída padrão é `id` (e às vezes `name`) separado por uma tabulação; use `--json` para scripts.

## Usando resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (MD), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` ou ID numérico do chat; grupos são IDs numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` e `conversation:<id>`
- Zalo (Plugin): ID de usuário (Bot API)
- Zalo Personal / `zalouser` (Plugin): ID da conversa (MD/grupo) de `zca` (`me`, `friend list`, `group list`)

## Próprio usuário ("me")

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

---
read_when:
    - Você quer consultar IDs de contatos/grupos/do próprio usuário para um canal
    - Você está desenvolvendo um adaptador de diretório de canais
summary: Referência da CLI para `openclaw directory` (próprio, pares, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-05-06T17:52:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de diretório para canais que oferecem suporte a isso (contatos/pares, grupos e "eu").

## Flags comuns

- `--channel <name>`: id/alias do canal (obrigatório quando vários canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: padrão do canal)
- `--json`: saída JSON

## Observações

- `directory` serve para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `openclaw message send --target ...`).
- Para muitos canais, os resultados são baseados em configuração (listas de permissões / grupos configurados) em vez de um diretório de provedor ao vivo.
- Plugins de canal instalados ainda podem omitir suporte a diretório; nesse caso, o comando informa a operação de diretório não suportada em vez de reinstalar o Plugin.
- A saída padrão é `id` (e às vezes `name`) separada por uma tabulação; use `--json` para scripts.

## Usando resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (destino de saída de Canal/Newsletter)
- Telegram: `@username` ou id numérico do chat; grupos são ids numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` e `conversation:<id>`
- Zalo (Plugin): id do usuário (Bot API)
- Zalo Personal / `zalouser` (Plugin): id da conversa (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Eu ("me")

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

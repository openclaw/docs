---
read_when:
    - Você quer procurar IDs de contatos/grupos/self de um canal
    - Você está desenvolvendo um adaptador de diretório de canal
summary: Referência da CLI para `openclaw directory` (self, peers, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-04-24T05:45:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Buscas de diretório para canais que oferecem suporte a isso (contatos/pares, grupos e “eu”).

## Flags comuns

- `--channel <name>`: ID/alias do canal (obrigatório quando vários canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: ID da conta (padrão: conta padrão do canal)
- `--json`: saída em JSON

## Observações

- `directory` serve para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `openclaw message send --target ...`).
- Para muitos canais, os resultados são baseados em configuração (allowlists / grupos configurados) em vez de um diretório ativo do provedor.
- A saída padrão é `id` (e às vezes `name`) separados por tabulação; use `--json` para scripts.

## Uso dos resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` ou ID numérico de chat; grupos são IDs numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` e `conversation:<id>`
- Zalo (Plugin): ID de usuário (Bot API)
- Zalo Personal / `zalouser` (Plugin): ID de tópico (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Self ("eu")

```bash
openclaw directory self --channel zalouser
```

## Peers (contatos/usuários)

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

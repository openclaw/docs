---
read_when:
    - Você quer consultar IDs de contatos/grupos/do próprio usuário para um canal
    - Você está desenvolvendo um adaptador de diretório de canais
summary: Referência da CLI para `openclaw directory` (você, pares, grupos)
title: Diretório
x-i18n:
    generated_at: "2026-07-03T15:20:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Consultas de diretório para canais compatíveis (contatos/pares, grupos e "eu").

## Flags comuns

- `--channel <name>`: id/alias do canal (obrigatório quando vários canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: padrão do canal)
- `--json`: gera JSON

## Observações

- `directory` serve para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `openclaw message send --target ...`).
- Para muitos canais, os resultados vêm da configuração (allowlists / grupos configurados), em vez de um diretório do provedor em tempo real.
- Plugins de canal instalados ainda podem omitir suporte a diretório; nesse caso, o comando informa a operação de diretório não compatível em vez de reinstalar o Plugin.
- A saída padrão é `id` (e às vezes `name`) separado por uma tabulação; use `--json` para scripts.

## Usando resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo), `120363123456789@newsletter` (destino de saída de Canal/Newsletter)
- Signal: aliases configurados resolvem para destinos de DM E.164/UUID ou destinos de grupo `group:<id>`
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

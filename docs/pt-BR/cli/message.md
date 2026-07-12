---
read_when:
    - Como adicionar ou modificar ações de mensagens da CLI
    - Alteração do comportamento do canal de saída
summary: Referência da CLI para `openclaw message` (envio + ações de canal)
title: Mensagem
x-i18n:
    generated_at: "2026-07-11T23:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Comando único de saída para enviar mensagens e ações de canal pelo
Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams,
Signal, Slack, Telegram e WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Seleção de canal

- `--channel <name>` é obrigatório se mais de um canal estiver configurado; com
  exatamente um canal configurado, esse canal será o padrão.
- Valores: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (o Mattermost requer o plugin).
- Destinos com prefixo de canal (por exemplo, `discord:channel:123`) identificam o
  plugin responsável sem um `--channel` explícito.

## Formatos de destino (`-t, --target`)

| Canal                | Formato                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Discord              | `channel:<id>`, `user:<id>`, menção `<@id>` ou um id numérico sem prefixo (tratado como id de canal)                           |
| Google Chat          | `spaces/<spaceId>` ou `users/<userId>`                                                                                         |
| iMessage             | identificador, `chat_id:<id>`, `chat_guid:<guid>` ou `chat_identifier:<id>`                                                   |
| Mattermost (plugin)  | `channel:<id>`, `user:<id>`, `@username` ou um id sem prefixo (tratado como canal)                                             |
| Matrix               | `@user:server`, `!room:server` ou `#alias:server`                                                                              |
| Microsoft Teams      | `conversation:<id>` (`19:...@thread.tacv2`), um id de conversa sem prefixo ou `user:<aad-object-id>`                           |
| Signal               | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` ou qualquer um desses com o prefixo `signal:`                |
| Slack                | `channel:<id>` ou `user:<id>` (um id sem prefixo é tratado como canal)                                                         |
| Telegram             | id do chat, `@username` ou destino de tópico de fórum: `<chatId>:topic:<topicId>` (ou `--thread-id <topicId>`)                 |
| WhatsApp             | E.164, JID de grupo (`...@g.us`) ou JID de canal/boletim informativo (`...@newsletter`)                                        |

Pesquisa pelo nome do canal: para provedores que têm um diretório (Discord/Slack/etc.),
nomes como `Help` ou `#help` são resolvidos pelo cache do diretório, recorrendo a uma
consulta ao diretório em tempo real quando não há correspondência no cache e o provedor
oferece suporte a isso.

## Opções comuns

Todas as ações aceitam: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. As ações que recebem um destino também aceitam
`-t, --target <dest>`.

## Resolução de SecretRef

`openclaw message` resolve os SecretRefs do canal antes de executar a ação,
com o escopo mais restrito possível:

- escopo do canal quando `--channel` está definido (ou é inferido de um destino com prefixo)
- escopo da conta quando `--account` também está definido
- todos os canais configurados quando nenhum dos dois está definido

SecretRefs não resolvidos em canais não relacionados nunca bloqueiam uma ação direcionada;
um SecretRef não resolvido no canal/conta selecionado faz a ação falhar de modo fechado.

## Ações

### Principais

| Ação            | Canais                                                                                                          | Obrigatório                                                      | Observações                                                                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, mais um entre `--message`/`--media`/`--presentation` | Consulte [Envio](#send) abaixo.                                                                                                                                                                                                                                                                                                                      |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (repetível)       | Consulte [Enquete](#poll) abaixo.                                                                                                                                                                                                                                                                                                                    |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                       | `--emoji`, `--remove` (requer `--emoji`; omita-o para limpar as próprias reações quando houver suporte; consulte [Reações](/pt-BR/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Reações em grupos do Signal exigem `--target-author` ou `--target-author-uuid`. O Nextcloud Talk apenas adiciona reações; `--remove` gera um erro. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                       | `--limit`.                                                                                                                                                                                                                                                                                                                                          |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                       | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` lê um carimbo de data e hora específico; combine com `--thread-id` para obter uma resposta exata na conversa encadeada.                                                                                                                  |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                          | Conversas encadeadas de fóruns do Telegram usam `--thread-id`.                                                                                                                                                                                                                                                                                       |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                       |                                                                                                                                                                                                                                                                                                                                                     |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                       | `unpin` também aceita `--pinned-message-id` (Microsoft Teams: o id do recurso de fixação/listagem de mensagens fixadas, não o id da mensagem do chat).                                                                                                                                                                                                |
| `pins` (lista)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                       | `--limit`.                                                                                                                                                                                                                                                                                                                                          |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                       | Matrix: disponível somente quando a criptografia está habilitada e as ações de verificação são permitidas.                                                                                                                                                                                                                                          |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                          | `--channel-id`, `--channel-ids` (repetível), `--author-id`, `--author-ids` (repetível), `--limit`.                                                                                                                                                                                                                                                    |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                      | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                             |

### Envio

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: anexa imagem/áudio/vídeo/documento (caminho local ou
  URL).
- `--presentation <json>`: carga útil compartilhada com blocos `text`, `context`, `divider`,
  `chart`, `table`, `buttons` e `select`, renderizados de acordo com a capacidade
  de cada canal. Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation).
- `--delivery <json>`: preferências genéricas de entrega, por exemplo `{"pin":
true}`. `--pin` é uma forma abreviada para entrega fixada quando o canal oferece
  suporte.
- `--reply-to <id>`, `--thread-id <id>` (tópico de fórum do Telegram; carimbo de data e hora
  da conversa encadeada do Slack, o mesmo campo que `--reply-to`).
- `--force-document` (Telegram, WhatsApp): envia imagens/GIFs/vídeos como
  documentos para evitar a compactação do canal.
- `--silent` (Telegram, Discord): envia sem notificação.
- `--gif-playback` (somente WhatsApp): trata a mídia de vídeo como reprodução de GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

O Slack renderiza nativamente os blocos de gráfico compatíveis; os outros canais recebem os mesmos
dados como texto legível:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

O Slack também renderiza blocos de tabela explícitos nativamente. Outros canais recebem a
legenda e cada linha como texto determinístico:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Os botões de Mini App do Telegram usam `webApp` (`web_app` ainda é interpretado para JSON
legado) e são renderizados somente em conversas privadas entre um usuário e o bot:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Enquete

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: repita de 2 a 12 vezes.
- `--poll-multi`: permite várias seleções.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Tópicos

- `thread create`: canais do Discord. Obrigatórios: `--thread-name`, `--target`
  (ID do canal). Opcionais: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: canais do Discord. Obrigatório: `--guild-id`. Opcionais:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: canais do Discord. Obrigatórios: `--target` (ID do tópico),
  `--message`. Opcionais: `--media`, `--reply-to`.

### Emojis

- `emoji list`: Discord (`--guild-id`), Slack (sem flags adicionais).
- `emoji upload`: Discord. Obrigatórios: `--guild-id`, `--emoji-name`, `--media`.
  Opcional: `--role-ids` (pode ser repetido).

### Figurinhas

- `sticker send`: Discord. Obrigatórios: `--target`, `--sticker-id` (pode ser repetido).
  Opcional: `--message`.
- `sticker upload`: Discord. Obrigatórios: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Cargos, canais, voz e eventos (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: obrigatórios `--guild-id`, `--event-name`, `--start-time`;
  opcionais `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderação (Discord)

- `timeout`: `--guild-id`, `--user-id`; opcionais `--duration-min` ou
  `--until` (omita ambos para remover o tempo limite), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Transmissão

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Envia uma carga útil para vários destinos. `--targets` recebe uma lista separada por
espaços. Use `--channel all` para direcionar a todos os provedores configurados.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Envio pelo agente](/pt-BR/tools/agent-send)
- [Apresentação de mensagens](/pt-BR/plugins/message-presentation)

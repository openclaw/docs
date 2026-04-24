---
read_when:
    - Adicionar ou modificar ações da CLI de mensagem
    - Alterar o comportamento do canal de saída
summary: Referência da CLI para `openclaw message` (`send` + ações de canal)
title: Mensagem
x-i18n:
    generated_at: "2026-04-24T05:45:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39932fb54caee37bdf58681da22b30e1b4cc7cc11b654010bf0335b1da3b2b4d
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Comando único de saída para envio de mensagens e ações de canal
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Uso

```
openclaw message <subcommand> [flags]
```

Seleção de canal:

- `--channel` é obrigatório se mais de um canal estiver configurado.
- Se exatamente um canal estiver configurado, ele se torna o padrão.
- Valores: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost requer Plugin)

Formatos de destino (`--target`):

- WhatsApp: E.164 ou JID de grupo
- Telegram: ID do chat ou `@username`
- Discord: `channel:<id>` ou `user:<id>` (ou menção `<@id>`; IDs numéricos brutos são tratados como canais)
- Google Chat: `spaces/<spaceId>` ou `users/<userId>`
- Slack: `channel:<id>` ou `user:<id>` (ID bruto de canal é aceito)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` ou `@username` (IDs sem prefixo são tratados como canais)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` ou `username:<name>`/`u:<name>`
- iMessage: identificador, `chat_id:<id>`, `chat_guid:<guid>` ou `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` ou `#alias:server`
- Microsoft Teams: ID da conversa (`19:...@thread.tacv2`) ou `conversation:<id>` ou `user:<aad-object-id>`

Busca por nome:

- Para provedores compatíveis (Discord/Slack/etc), nomes de canal como `Help` ou `#help` são resolvidos via cache de diretório.
- Em caso de cache miss, o OpenClaw tentará uma busca ao vivo no diretório quando o provedor oferecer suporte.

## Flags comuns

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal ou usuário de destino para send/poll/read/etc)
- `--targets <name>` (repetível; somente broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento de SecretRef

- `openclaw message` resolve SecretRefs de canal compatíveis antes de executar a ação selecionada.
- A resolução tem escopo para o alvo da ação ativa quando possível:
  - escopo de canal quando `--channel` está definido (ou inferido de destinos com prefixo como `discord:...`)
  - escopo de conta quando `--account` está definido (superfícies globais do canal + superfícies da conta selecionada)
  - quando `--account` é omitido, o OpenClaw não força um escopo de SecretRef da conta `default`
- SecretRefs não resolvidos em canais não relacionados não bloqueiam uma ação de mensagem direcionada.
- Se o SecretRef do canal/conta selecionado não for resolvido, o comando falha em modo fail-closed para essa ação.

## Ações

### Core

- `send`
  - Canais: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obrigatório: `--target`, mais `--message`, `--media` ou `--presentation`
  - Opcional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Cargas úteis de apresentação compartilhadas: `--presentation` envia blocos semânticos (`text`, `context`, `divider`, `buttons`, `select`) que o core renderiza por meio das capacidades declaradas do canal selecionado. Consulte [Message Presentation](/pt-BR/plugins/message-presentation).
  - Preferências genéricas de entrega: `--delivery` aceita dicas de entrega como `{ "pin": true }`; `--pin` é uma abreviação para entrega fixada quando o canal oferece suporte.
  - Somente Telegram: `--force-document` (envia imagens e GIFs como documentos para evitar compressão do Telegram)
  - Somente Telegram: `--thread-id` (ID do tópico do fórum)
  - Somente Slack: `--thread-id` (timestamp da thread; `--reply-to` usa o mesmo campo)
  - Telegram + Discord: `--silent`
  - Somente WhatsApp: `--gif-playback`

- `poll`
  - Canais: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obrigatório: `--target`, `--poll-question`, `--poll-option` (repetível)
  - Opcional: `--poll-multi`
  - Somente Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Somente Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canais: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Obrigatório: `--message-id`, `--target`
  - Opcional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Observação: `--remove` exige `--emoji` (omita `--emoji` para limpar suas próprias reações onde houver suporte; consulte /tools/reactions)
  - Somente WhatsApp: `--participant`, `--from-me`
  - Reações em grupo no Signal: `--target-author` ou `--target-author-uuid` obrigatórios

- `reactions`
  - Canais: Discord/Google Chat/Slack/Matrix
  - Obrigatório: `--message-id`, `--target`
  - Opcional: `--limit`

- `read`
  - Canais: Discord/Slack/Matrix
  - Obrigatório: `--target`
  - Opcional: `--limit`, `--before`, `--after`
  - Somente Discord: `--around`

- `edit`
  - Canais: Discord/Slack/Matrix
  - Obrigatório: `--message-id`, `--message`, `--target`

- `delete`
  - Canais: Discord/Slack/Telegram/Matrix
  - Obrigatório: `--message-id`, `--target`

- `pin` / `unpin`
  - Canais: Discord/Slack/Matrix
  - Obrigatório: `--message-id`, `--target`

- `pins` (listar)
  - Canais: Discord/Slack/Matrix
  - Obrigatório: `--target`

- `permissions`
  - Canais: Discord/Matrix
  - Obrigatório: `--target`
  - Somente Matrix: disponível quando a criptografia do Matrix está ativada e ações de verificação são permitidas

- `search`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--query`
  - Opcional: `--channel-id`, `--channel-ids` (repetível), `--author-id`, `--author-ids` (repetível), `--limit`

### Threads

- `thread create`
  - Canais: Discord
  - Obrigatório: `--thread-name`, `--target` (ID do canal)
  - Opcional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canais: Discord
  - Obrigatório: `--guild-id`
  - Opcional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canais: Discord
  - Obrigatório: `--target` (ID da thread), `--message`
  - Opcional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: sem flags extras

- `emoji upload`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--emoji-name`, `--media`
  - Opcional: `--role-ids` (repetível)

### Stickers

- `sticker send`
  - Canais: Discord
  - Obrigatório: `--target`, `--sticker-id` (repetível)
  - Opcional: `--message`

- `sticker upload`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Papéis / Canais / Membros / Voz

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` para Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Eventos

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderação (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcional `--duration-min` ou `--until`; omita ambos para limpar o timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` também oferece suporte a `--reason`

### Broadcast

- `broadcast`
  - Canais: qualquer canal configurado; use `--channel all` para direcionar a todos os provedores
  - Obrigatório: `--targets <target...>`
  - Opcional: `--message`, `--media`, `--dry-run`

## Exemplos

Enviar uma resposta no Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Enviar uma mensagem com botões semânticos:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

O core renderiza a mesma carga útil `presentation` em componentes do Discord, blocos do Slack, botões inline do Telegram, props do Mattermost ou cards do Teams/Feishu, dependendo da capacidade do canal. Consulte [Message Presentation](/pt-BR/plugins/message-presentation) para o contrato completo e as regras de fallback.

Enviar uma carga útil de apresentação mais rica:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Criar uma enquete no Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Criar uma enquete no Telegram (fecha automaticamente em 2 minutos):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Enviar uma mensagem proativa no Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Criar uma enquete no Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Reagir no Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Reagir em um grupo do Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Enviar botões inline do Telegram por apresentação genérica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Enviar um card do Teams por apresentação genérica:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Enviar uma imagem do Telegram como documento para evitar compressão:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Envio do agente](/pt-BR/tools/agent-send)

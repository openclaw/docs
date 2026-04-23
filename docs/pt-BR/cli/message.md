---
read_when:
    - Adicionando ou modificando ações da CLI de mensagem
    - Alterando o comportamento de saída do canal
summary: Referência da CLI para `openclaw message` (envio + ações de canal)
title: mensagem
x-i18n:
    generated_at: "2026-04-23T14:01:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Comando único de saída para enviar mensagens e ações de canal
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

- WhatsApp: E.164 ou group JID
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

- Para providers compatíveis (Discord/Slack/etc), nomes de canal como `Help` ou `#help` são resolvidos pelo cache de diretório.
- Em caso de cache miss, o OpenClaw tentará uma busca de diretório ao vivo quando o provider oferecer suporte.

## Flags comuns

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal ou usuário de destino para send/poll/read/etc)
- `--targets <name>` (repita; apenas broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Comportamento de SecretRef

- `openclaw message` resolve SecretRefs de canal compatíveis antes de executar a ação selecionada.
- A resolução é limitada ao destino da ação ativa quando possível:
  - com escopo de canal quando `--channel` está definido (ou inferido de destinos prefixados como `discord:...`)
  - com escopo de conta quando `--account` está definido (superfícies globais do canal + da conta selecionada)
  - quando `--account` é omitido, o OpenClaw não força um escopo SecretRef da conta `default`
- SecretRefs não resolvidos em canais não relacionados não bloqueiam uma ação de mensagem direcionada.
- Se o SecretRef do canal/conta selecionado não estiver resolvido, o comando falha de forma fechada para essa ação.

## Ações

### Core

- `send`
  - Canais: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Obrigatório: `--target`, além de `--message`, `--media` ou `--presentation`
  - Opcional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Cargas compartilhadas de apresentação: `--presentation` envia blocos semânticos (`text`, `context`, `divider`, `buttons`, `select`) que o core renderiza por meio dos recursos declarados do canal selecionado. Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation).
  - Preferências genéricas de entrega: `--delivery` aceita dicas de entrega como `{ "pin": true }`; `--pin` é um atalho para entrega fixada quando o canal oferece suporte.
  - Somente Telegram: `--force-document` (envia imagens e GIFs como documentos para evitar compressão do Telegram)
  - Somente Telegram: `--thread-id` (ID do tópico do fórum)
  - Somente Slack: `--thread-id` (timestamp da thread; `--reply-to` usa o mesmo campo)
  - Telegram + Discord: `--silent`
  - Somente WhatsApp: `--gif-playback`

- `poll`
  - Canais: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Obrigatório: `--target`, `--poll-question`, `--poll-option` (repita)
  - Opcional: `--poll-multi`
  - Somente Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Somente Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canais: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Obrigatório: `--message-id`, `--target`
  - Opcional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Observação: `--remove` exige `--emoji` (omita `--emoji` para limpar as próprias reações quando compatível; consulte /tools/reactions)
  - Somente WhatsApp: `--participant`, `--from-me`
  - Reações em grupo do Signal: `--target-author` ou `--target-author-uuid` obrigatórios

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
  - Opcional: `--channel-id`, `--channel-ids` (repita), `--author-id`, `--author-ids` (repita), `--limit`

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
  - Opcional: `--role-ids` (repita)

### Stickers

- `sticker send`
  - Canais: Discord
  - Obrigatório: `--target`, `--sticker-id` (repita)
  - Opcional: `--message`

- `sticker upload`
  - Canais: Discord
  - Obrigatório: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Funções / Canais / Membros / Voz

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
  - `timeout` também aceita `--reason`

### Broadcast

- `broadcast`
  - Canais: qualquer canal configurado; use `--channel all` para direcionar a todos os providers
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

O core renderiza a mesma carga `presentation` em componentes do Discord, blocos do Slack, botões inline do Telegram, props do Mattermost ou cartões do Teams/Feishu, dependendo do recurso do canal. Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) para o contrato completo e as regras de fallback.

Enviar uma carga de apresentação mais rica:

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

Enviar botões inline do Telegram por meio de apresentação genérica:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Enviar um cartão do Teams por meio de apresentação genérica:

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

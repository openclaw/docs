---
read_when:
    - Aggiunta o modifica delle azioni CLI per i messaggi
    - Modifica del comportamento del canale in uscita
summary: Riferimento CLI per `openclaw message` (invio + azioni del canale)
title: Messaggio
x-i18n:
    generated_at: "2026-07-12T06:54:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Comando unico in uscita per inviare messaggi ed eseguire azioni sui canali
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram e WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Selezione del canale

- `--channel <name>` è obbligatorio se è configurato più di un canale; se è
  configurato esattamente un canale, tale canale è quello predefinito.
- Valori: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost richiede il Plugin).
- Le destinazioni con prefisso del canale (ad esempio `discord:channel:123`)
  risolvono il Plugin proprietario senza un `--channel` esplicito.

## Formati delle destinazioni (`-t, --target`)

| Canale              | Formato                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, menzione `<@id>` o un ID numerico semplice (trattato come ID del canale)          |
| Google Chat         | `spaces/<spaceId>` o `users/<userId>`                                                                          |
| iMessage            | identificativo, `chat_id:<id>`, `chat_guid:<guid>` o `chat_identifier:<id>`                                    |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username` o un ID semplice (trattato come canale)                               |
| Matrix              | `@user:server`, `!room:server` o `#alias:server`                                                                |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), un ID conversazione semplice o `user:<aad-object-id>`             |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` o uno di questi con prefisso `signal:`       |
| Slack               | `channel:<id>` o `user:<id>` (un ID semplice viene trattato come canale)                                       |
| Telegram            | ID chat, `@username` o destinazione di un argomento del forum: `<chatId>:topic:<topicId>` (oppure `--thread-id <topicId>`) |
| WhatsApp            | E.164, JID del gruppo (`...@g.us`) o JID del canale/della newsletter (`...@newsletter`)                        |

Ricerca per nome del canale: per i provider dotati di una directory
(Discord/Slack/ecc.), nomi come `Help` o `#help` vengono risolti tramite la
cache della directory; se non sono presenti nella cache, viene eseguita una
ricerca in tempo reale nella directory, quando supportata dal provider.

## Flag comuni

Ogni azione accetta: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Le azioni che richiedono una destinazione accettano
anche `-t, --target <dest>`.

## Risoluzione dei SecretRef

`openclaw message` risolve i SecretRef dei canali prima di eseguire l'azione,
con l'ambito più ristretto possibile:

- limitato al canale quando è impostato `--channel` (o dedotto da una destinazione con prefisso)
- limitato all'account quando è impostato anche `--account`
- tutti i canali configurati quando non è impostato nessuno dei due

I SecretRef non risolti su canali non correlati non bloccano mai un'azione
mirata; un SecretRef non risolto sul canale/account selezionato fa fallire
l'azione in modalità chiusa.

## Azioni

### Principali

| Azione          | Canali                                                                                                          | Obbligatorio                                                    | Note                                                                                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp  | `--target`, più uno tra `--message`/`--media`/`--presentation`  | Vedere [Invio](#send) più avanti.                                                                                                                                                                                                                                                                        |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                             | `--target`, `--poll-question`, `--poll-option` (ripetibile)     | Vedere [Sondaggio](#poll) più avanti.                                                                                                                                                                                                                                                                    |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                               | `--message-id`, `--target`                                      | `--emoji`, `--remove` (richiede `--emoji`; ometterlo per cancellare le proprie reazioni dove supportato, vedere [Reazioni](/it/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Le reazioni nei gruppi Signal richiedono `--target-author` o `--target-author-uuid`. Nextcloud Talk consente solo di aggiungere reazioni; `--remove` genera un errore. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                          | `--message-id`, `--target`                                      | `--limit`.                                                                                                                                                                                                                                                                                               |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                          | `--target`                                                      | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` legge un timestamp specifico; combinarlo con `--thread-id` per una risposta esatta nella discussione.                                                                                         |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                                | `--message-id`, `--message`, `--target`                         | Le discussioni dei forum Telegram usano `--thread-id`.                                                                                                                                                                                                                                                   |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                                | `--message-id`, `--target`                                      |                                                                                                                                                                                                                                                                                                         |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                          | `--message-id`, `--target`                                      | `unpin` accetta anche `--pinned-message-id` (Microsoft Teams: l'ID della risorsa di fissaggio/elenco dei messaggi fissati, non l'ID del messaggio di chat).                                                                                                                                                 |
| `pins` (elenco) | Discord, Matrix, Microsoft Teams, Slack                                                                          | `--target`                                                      | `--limit`.                                                                                                                                                                                                                                                                                               |
| `permissions`   | Discord, Matrix                                                                                                  | `--target`                                                      | Matrix: disponibile solo quando la crittografia è abilitata e le azioni di verifica sono consentite.                                                                                                                                                                                                     |
| `search`        | Discord                                                                                                          | `--guild-id`, `--query`                                         | `--channel-id`, `--channel-ids` (ripetibile), `--author-id`, `--author-ids` (ripetibile), `--limit`.                                                                                                                                                                                                      |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                          | `--user-id`                                                     | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                  |

### Invio

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: allega un'immagine, un file audio, un video o un
  documento (percorso locale o URL).
- `--presentation <json>`: payload condiviso con blocchi `text`, `context`,
  `divider`, `chart`, `table`, `buttons` e `select`, visualizzati in base alle
  funzionalità del canale. Vedere [Presentazione dei messaggi](/it/plugins/message-presentation).
- `--delivery <json>`: preferenze generiche di consegna, ad esempio `{"pin":
true}`. `--pin` è un'abbreviazione per la consegna con fissaggio quando il
  canale la supporta.
- `--reply-to <id>`, `--thread-id <id>` (argomento del forum Telegram;
  timestamp della discussione Slack, stesso campo di `--reply-to`).
- `--force-document` (Telegram, WhatsApp): invia immagini/GIF/video come
  documenti per evitare la compressione del canale.
- `--silent` (Telegram, Discord): invia senza notifica.
- `--gif-playback` (solo WhatsApp): tratta i contenuti video come riproduzione
  GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack visualizza in modo nativo i blocchi grafico supportati; gli altri canali
ricevono gli stessi dati come testo leggibile:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack visualizza anche in modo nativo i blocchi tabella espliciti. Gli altri canali ricevono la
didascalia e ogni riga come testo deterministico:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

I pulsanti delle Mini App di Telegram usano `webApp` (`web_app` continua a essere interpretato per compatibilità con il
JSON legacy) e vengono visualizzati solo nelle chat private tra un utente e il bot:

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

### Sondaggio

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: ripetere da 2 a 12 volte.
- `--poll-multi`: consente selezioni multiple.
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

### Thread

- `thread create`: canale Discord. Obbligatori: `--thread-name`, `--target`
  (ID del canale). Facoltativi: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: canale Discord. Obbligatorio: `--guild-id`. Facoltativi:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: canale Discord. Obbligatori: `--target` (ID del thread),
  `--message`. Facoltativi: `--media`, `--reply-to`.

### Emoji

- `emoji list`: Discord (`--guild-id`), Slack (nessun flag aggiuntivo).
- `emoji upload`: Discord. Obbligatori: `--guild-id`, `--emoji-name`, `--media`.
  Facoltativo: `--role-ids` (ripetibile).

### Adesivi

- `sticker send`: Discord. Obbligatori: `--target`, `--sticker-id` (ripetibile).
  Facoltativo: `--message`.
- `sticker upload`: Discord. Obbligatori: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Ruoli, canali, voce ed eventi (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: obbligatori `--guild-id`, `--event-name`, `--start-time`;
  facoltativi `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderazione (Discord)

- `timeout`: `--guild-id`, `--user-id`; facoltativi `--duration-min` o
  `--until` (ometterli entrambi per annullare il timeout), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Trasmissione

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Invia un singolo payload a più destinazioni. `--targets` accetta un elenco
separato da spazi. Usare `--channel all` per indirizzarlo a ogni provider configurato.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Invio dell'agente](/it/tools/agent-send)
- [Presentazione dei messaggi](/it/plugins/message-presentation)

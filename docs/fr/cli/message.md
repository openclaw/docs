---
read_when:
    - Ajout ou modification d’actions de messagerie dans la CLI
    - Modification du comportement du canal sortant
summary: Référence de la CLI pour `openclaw message` (envoi + actions de canal)
title: Message
x-i18n:
    generated_at: "2026-07-12T02:26:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Commande sortante unique permettant d’envoyer des messages et d’effectuer des actions sur les canaux
Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams,
Signal, Slack, Telegram et WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Sélection du canal

- `--channel <name>` est requis si plusieurs canaux sont configurés ; si
  un seul canal est configuré, celui-ci est utilisé par défaut.
- Valeurs : `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost nécessite le plugin).
- Les cibles préfixées par un canal (par exemple `discord:channel:123`) permettent d’identifier le
  plugin propriétaire sans spécifier explicitement `--channel`.

## Formats de cible (`-t, --target`)

| Canal               | Format                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, mention `<@id>` ou identifiant numérique brut (traité comme un identifiant de canal)     |
| Google Chat         | `spaces/<spaceId>` ou `users/<userId>`                                                                                |
| iMessage            | identifiant, `chat_id:<id>`, `chat_guid:<guid>` ou `chat_identifier:<id>`                                             |
| Mattermost (plugin) | `channel:<id>`, `user:<id>`, `@username` ou identifiant brut (traité comme un canal)                                  |
| Matrix              | `@user:server`, `!room:server` ou `#alias:server`                                                                     |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), identifiant de conversation brut ou `user:<aad-object-id>`              |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` ou l’un de ces formats préfixé par `signal:`       |
| Slack               | `channel:<id>` ou `user:<id>` (un identifiant brut est traité comme un canal)                                         |
| Telegram            | identifiant de discussion, `@username` ou cible de sujet de forum : `<chatId>:topic:<topicId>` (ou `--thread-id <topicId>`) |
| WhatsApp            | E.164, JID de groupe (`...@g.us`) ou JID de canal/newsletter (`...@newsletter`)                                       |

Recherche par nom de canal : pour les fournisseurs disposant d’un annuaire (Discord/Slack/etc.), les noms
tels que `Help` ou `#help` sont résolus via le cache de l’annuaire, avec recours à une recherche en direct
dans l’annuaire en cas d’absence dans le cache lorsque le fournisseur la prend en charge.

## Options communes

Chaque action accepte : `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Les actions nécessitant une destination acceptent également
`-t, --target <dest>`.

## Résolution des SecretRefs

`openclaw message` résout les SecretRefs des canaux avant d’exécuter l’action,
avec la portée la plus restreinte possible :

- limitée au canal lorsque `--channel` est défini (ou déduit d’une cible préfixée)
- limitée au compte lorsque `--account` est également défini
- tous les canaux configurés lorsque ni l’un ni l’autre n’est défini

Les SecretRefs non résolues sur des canaux sans rapport ne bloquent jamais une action ciblée ; une
SecretRef non résolue sur le canal ou le compte sélectionné entraîne l’échec sécurisé de l’action.

## Actions

### Principales

| Action          | Canaux                                                                                                          | Requis                                                         | Remarques                                                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, plus l’un de `--message`/`--media`/`--presentation` | Voir [Envoi](#send) ci-dessous.                                                                                                                                                                                                                                                                             |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (répétable)      | Voir [Sondage](#poll) ci-dessous.                                                                                                                                                                                                                                                                           |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (nécessite `--emoji` ; omettez-le pour effacer vos propres réactions lorsque cette fonction est prise en charge, voir [Réactions](/fr/tools/reactions)). WhatsApp : `--participant`, `--from-me`. Les réactions de groupe Signal nécessitent `--target-author` ou `--target-author-uuid`. Nextcloud Talk permet uniquement d’ajouter des réactions ; `--remove` génère une erreur. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                 |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord : `--around`, `--include-thread`. Slack : `--message-id` lit un horodatage précis ; combinez-le avec `--thread-id` pour obtenir une réponse exacte dans un fil.                                                                                      |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Les fils de forum Telegram utilisent `--thread-id`.                                                                                                                                                                                                                                                        |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                            |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` accepte également `--pinned-message-id` (Microsoft Teams : l’identifiant de ressource d’épinglage/de liste des épinglages, et non l’identifiant du message de discussion).                                                                                                                           |
| `pins` (liste)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                 |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix : disponible uniquement lorsque le chiffrement est activé et que les actions de vérification sont autorisées.                                                                                                                                                                                       |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (répétable), `--author-id`, `--author-ids` (répétable), `--limit`.                                                                                                                                                                                                         |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                    |

### Envoi

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>` : joint une image, un fichier audio, une vidéo ou un document (chemin local ou
  URL).
- `--presentation <json>` : charge utile partagée comprenant des blocs `text`, `context`, `divider`,
  `chart`, `table`, `buttons` et `select`, dont le rendu est adapté aux capacités de chaque canal.
  Voir [Présentation des messages](/fr/plugins/message-presentation).
- `--delivery <json>` : préférences générales de distribution, par exemple `{"pin":
true}`. `--pin` est un raccourci permettant d’épingler le message lors de sa distribution lorsque le canal
  le prend en charge.
- `--reply-to <id>`, `--thread-id <id>` (sujet de forum Telegram ; horodatage du fil
  Slack, même champ que `--reply-to`).
- `--force-document` (Telegram, WhatsApp) : envoie les images/GIF/vidéos sous forme de
  documents afin d’éviter la compression du canal.
- `--silent` (Telegram, Discord) : envoie sans notification.
- `--gif-playback` (WhatsApp uniquement) : traite le média vidéo comme une animation GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack affiche nativement les blocs de graphique pris en charge ; les autres canaux reçoivent les mêmes
données sous forme de texte lisible :

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack affiche également les blocs de tableau explicites de manière native. Les autres canaux reçoivent la
légende et chaque ligne sous forme de texte déterministe :

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Les boutons de mini-application Telegram utilisent `webApp` (`web_app` reste analysé pour les anciens
documents JSON) et ne s’affichent que dans les discussions privées entre un utilisateur et le bot :

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

### Sondage

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>` : à répéter de 2 à 12 fois.
- `--poll-multi` : autorise plusieurs sélections.
- Discord : `--poll-duration-hours`, `--silent`, `--message`.
- Telegram : `--poll-duration-seconds <n>` (5-600), `--silent`,
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

### Fils de discussion

- `thread create` : canaux Discord. Obligatoires : `--thread-name`, `--target`
  (identifiant du canal). Facultatifs : `--message-id`, `--message`, `--auto-archive-min`.
- `thread list` : canaux Discord. Obligatoire : `--guild-id`. Facultatifs :
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply` : canaux Discord. Obligatoires : `--target` (identifiant du fil),
  `--message`. Facultatifs : `--media`, `--reply-to`.

### Émojis

- `emoji list` : Discord (`--guild-id`), Slack (aucune option supplémentaire).
- `emoji upload` : Discord. Obligatoires : `--guild-id`, `--emoji-name`, `--media`.
  Facultatif : `--role-ids` (répétable).

### Autocollants

- `sticker send` : Discord. Obligatoires : `--target`, `--sticker-id` (répétable).
  Facultatif : `--message`.
- `sticker upload` : Discord. Obligatoires : `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Rôles, canaux, voix et événements (Discord)

- `role info` : `--guild-id`.
- `role add` / `role remove` : `--guild-id`, `--user-id`, `--role-id`.
- `channel info` : `--target`.
- `channel list` : `--guild-id`.
- `voice status` : `--guild-id`, `--user-id`.
- `event list` : `--guild-id`.
- `event create` : obligatoires : `--guild-id`, `--event-name`, `--start-time` ;
  facultatifs : `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Modération (Discord)

- `timeout` : `--guild-id`, `--user-id` ; facultatifs : `--duration-min` ou
  `--until` (omettez les deux pour supprimer l’exclusion temporaire), `--reason`.
- `kick` : `--guild-id`, `--user-id`, `--reason`.
- `ban` : `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Diffusion

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Envoie une même charge utile à plusieurs destinataires. `--targets` accepte une liste
séparée par des espaces. Utilisez `--channel all` pour cibler tous les fournisseurs configurés.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Envoi par l’agent](/fr/tools/agent-send)
- [Présentation des messages](/fr/plugins/message-presentation)

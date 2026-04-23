---
read_when:
    - Ajout ou modification des actions de message CLI
    - Modification du comportement du canal sortant
summary: Référence CLI pour `openclaw message` (envoi + actions de canal)
title: message
x-i18n:
    generated_at: "2026-04-23T07:01:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Commande sortante unique pour envoyer des messages et des actions de canal
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilisation

```
openclaw message <subcommand> [flags]
```

Sélection du canal :

- `--channel` est requis si plusieurs canaux sont configurés.
- Si un seul canal est configuré, il devient le canal par défaut.
- Valeurs : `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost nécessite un plugin)

Formats de cible (`--target`) :

- WhatsApp : E.164 ou JID de groupe
- Telegram : id de discussion ou `@username`
- Discord : `channel:<id>` ou `user:<id>` (ou mention `<@id>` ; les id numériques bruts sont traités comme des canaux)
- Google Chat : `spaces/<spaceId>` ou `users/<userId>`
- Slack : `channel:<id>` ou `user:<id>` (un id de canal brut est accepté)
- Mattermost (plugin) : `channel:<id>`, `user:<id>` ou `@username` (les id bruts sont traités comme des canaux)
- Signal : `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` ou `username:<name>`/`u:<name>`
- iMessage : handle, `chat_id:<id>`, `chat_guid:<guid>` ou `chat_identifier:<id>`
- Matrix : `@user:server`, `!room:server` ou `#alias:server`
- Microsoft Teams : id de conversation (`19:...@thread.tacv2`) ou `conversation:<id>` ou `user:<aad-object-id>`

Recherche par nom :

- Pour les fournisseurs pris en charge (Discord/Slack/etc.), les noms de canal comme `Help` ou `#help` sont résolus via le cache du répertoire.
- En cas d’absence dans le cache, OpenClaw tente une recherche en direct dans le répertoire lorsque le fournisseur le prend en charge.

## Indicateurs courants

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal ou utilisateur cible pour send/poll/read/etc.)
- `--targets <name>` (répéter ; diffusion uniquement)
- `--json`
- `--dry-run`
- `--verbose`

## Comportement de SecretRef

- `openclaw message` résout les SecretRef de canal pris en charge avant d’exécuter l’action sélectionnée.
- La résolution est limitée à la cible active de l’action lorsque c’est possible :
  - limitée au canal lorsque `--channel` est défini (ou déduit à partir de cibles préfixées comme `discord:...`)
  - limitée au compte lorsque `--account` est défini (surfaces globales du canal + surfaces du compte sélectionné)
  - lorsque `--account` est omis, OpenClaw n’impose pas une portée SecretRef de compte `default`
- Les SecretRef non résolus sur des canaux non liés ne bloquent pas une action de message ciblée.
- Si le SecretRef du canal/compte sélectionné n’est pas résolu, la commande échoue de façon fermée pour cette action.

## Actions

### Noyau

- `send`
  - Canaux : WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Requis : `--target`, plus `--message`, `--media` ou `--presentation`
  - Facultatif : `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Charges utiles de présentation partagées : `--presentation` envoie des blocs sémantiques (`text`, `context`, `divider`, `buttons`, `select`) que le noyau rend via les capacités déclarées du canal sélectionné. Voir [Présentation des messages](/fr/plugins/message-presentation).
  - Préférences de livraison génériques : `--delivery` accepte des indications de livraison telles que `{ "pin": true }` ; `--pin` est un raccourci pour la livraison épinglée lorsque le canal le prend en charge.
  - Telegram uniquement : `--force-document` (envoyer les images et GIF comme documents pour éviter la compression de Telegram)
  - Telegram uniquement : `--thread-id` (id de sujet de forum)
  - Slack uniquement : `--thread-id` (horodatage du fil ; `--reply-to` utilise le même champ)
  - Telegram + Discord : `--silent`
  - WhatsApp uniquement : `--gif-playback`

- `poll`
  - Canaux : WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Requis : `--target`, `--poll-question`, `--poll-option` (répéter)
  - Facultatif : `--poll-multi`
  - Discord uniquement : `--poll-duration-hours`, `--silent`, `--message`
  - Telegram uniquement : `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canaux : Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Requis : `--message-id`, `--target`
  - Facultatif : `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Remarque : `--remove` nécessite `--emoji` (omettez `--emoji` pour effacer vos propres réactions lorsque c’est pris en charge ; voir /tools/reactions)
  - WhatsApp uniquement : `--participant`, `--from-me`
  - Réactions de groupe Signal : `--target-author` ou `--target-author-uuid` requis

- `reactions`
  - Canaux : Discord/Google Chat/Slack/Matrix
  - Requis : `--message-id`, `--target`
  - Facultatif : `--limit`

- `read`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--target`
  - Facultatif : `--limit`, `--before`, `--after`
  - Discord uniquement : `--around`

- `edit`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--message-id`, `--message`, `--target`

- `delete`
  - Canaux : Discord/Slack/Telegram/Matrix
  - Requis : `--message-id`, `--target`

- `pin` / `unpin`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--message-id`, `--target`

- `pins` (liste)
  - Canaux : Discord/Slack/Matrix
  - Requis : `--target`

- `permissions`
  - Canaux : Discord/Matrix
  - Requis : `--target`
  - Matrix uniquement : disponible lorsque le chiffrement Matrix est activé et que les actions de vérification sont autorisées

- `search`
  - Canaux : Discord
  - Requis : `--guild-id`, `--query`
  - Facultatif : `--channel-id`, `--channel-ids` (répéter), `--author-id`, `--author-ids` (répéter), `--limit`

### Fils de discussion

- `thread create`
  - Canaux : Discord
  - Requis : `--thread-name`, `--target` (id de canal)
  - Facultatif : `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Canaux : Discord
  - Requis : `--guild-id`
  - Facultatif : `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Canaux : Discord
  - Requis : `--target` (id de fil), `--message`
  - Facultatif : `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord : `--guild-id`
  - Slack : aucun indicateur supplémentaire

- `emoji upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--emoji-name`, `--media`
  - Facultatif : `--role-ids` (répéter)

### Stickers

- `sticker send`
  - Canaux : Discord
  - Requis : `--target`, `--sticker-id` (répéter)
  - Facultatif : `--message`

- `sticker upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rôles / canaux / membres / vocal

- `role info` (Discord) : `--guild-id`
- `role add` / `role remove` (Discord) : `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord) : `--target`
- `channel list` (Discord) : `--guild-id`
- `member info` (Discord/Slack) : `--user-id` (+ `--guild-id` pour Discord)
- `voice status` (Discord) : `--guild-id`, `--user-id`

### Événements

- `event list` (Discord) : `--guild-id`
- `event create` (Discord) : `--guild-id`, `--event-name`, `--start-time`
  - Facultatif : `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Modération (Discord)

- `timeout` : `--guild-id`, `--user-id` (facultatif `--duration-min` ou `--until` ; omettez les deux pour effacer le délai d’expiration)
- `kick` : `--guild-id`, `--user-id` (+ `--reason`)
- `ban` : `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` prend aussi en charge `--reason`

### Diffusion

- `broadcast`
  - Canaux : tout canal configuré ; utilisez `--channel all` pour cibler tous les fournisseurs
  - Requis : `--targets <target...>`
  - Facultatif : `--message`, `--media`, `--dry-run`

## Exemples

Envoyer une réponse Discord :

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Envoyer un message avec des boutons sémantiques :

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Le noyau rend la même charge utile `presentation` en composants Discord, blocs Slack, boutons en ligne Telegram, props Mattermost ou cartes Teams/Feishu selon les capacités du canal. Voir [Présentation des messages](/fr/plugins/message-presentation) pour le contrat complet et les règles de repli.

Envoyer une charge utile de présentation plus riche :

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Créer un sondage Discord :

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Créer un sondage Telegram (fermeture automatique dans 2 minutes) :

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Envoyer un message proactif Teams :

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Créer un sondage Teams :

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Réagir dans Slack :

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Réagir dans un groupe Signal :

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Envoyer des boutons en ligne Telegram via la présentation générique :

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Envoyer une carte Teams via la présentation générique :

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Envoyer une image Telegram comme document pour éviter la compression :

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

---
read_when:
    - Ajout ou modification d’actions CLI de message
    - Changer le comportement des canaux sortants
summary: Référence CLI pour `openclaw message` (envoi + actions de canal)
title: Message
x-i18n:
    generated_at: "2026-06-27T17:19:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Commande sortante unique pour envoyer des messages et des actions de canal
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Utilisation

```
openclaw message <subcommand> [flags]
```

Sélection du canal :

- `--channel` est requis si plusieurs canaux sont configurés.
- Si un seul canal est configuré, il devient la valeur par défaut.
- Valeurs : `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost nécessite un Plugin)
- `openclaw message` résout le canal sélectionné vers son Plugin propriétaire quand `--channel` ou une cible préfixée par un canal est présent ; sinon, il charge les Plugins de canal configurés pour déduire le canal par défaut.

Formats de cible (`--target`) :

- WhatsApp : E.164, JID de groupe ou JID de canal/newsletter WhatsApp (`...@newsletter`)
- Telegram : id de discussion, `@username` ou cible de sujet de forum (`-1001234567890:topic:42`, ou `--thread-id 42`)
- Discord : `channel:<id>` ou `user:<id>` (ou mention `<@id>` ; les ids numériques bruts sont traités comme des canaux)
- Google Chat : `spaces/<spaceId>` ou `users/<userId>`
- Slack : `channel:<id>` ou `user:<id>` (l’id de canal brut est accepté)
- Mattermost (Plugin) : `channel:<id>`, `user:<id>` ou `@username` (les ids nus sont traités comme des canaux)
- Signal : `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` ou `username:<name>`/`u:<name>`
- iMessage : identifiant, `chat_id:<id>`, `chat_guid:<guid>` ou `chat_identifier:<id>`
- Matrix : `@user:server`, `!room:server` ou `#alias:server`
- Microsoft Teams : id de conversation (`19:...@thread.tacv2`) ou `conversation:<id>` ou `user:<aad-object-id>`

Recherche de noms :

- Pour les fournisseurs pris en charge (Discord/Slack/etc), les noms de canal comme `Help` ou `#help` sont résolus via le cache d’annuaire.
- En cas d’absence dans le cache, OpenClaw tente une recherche d’annuaire en direct quand le fournisseur la prend en charge.

## Options courantes

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (canal cible ou utilisateur pour send/poll/read/etc)
- `--targets <name>` (répétable ; diffusion uniquement)
- `--json`
- `--dry-run`
- `--verbose`

## Comportement de SecretRef

- `openclaw message` résout les SecretRefs de canal pris en charge avant d’exécuter l’action sélectionnée.
- La résolution est limitée à la cible de l’action active quand c’est possible :
  - portée au canal quand `--channel` est défini (ou déduit à partir de cibles préfixées comme `discord:...`)
  - portée au compte quand `--account` est défini (globaux du canal + surfaces du compte sélectionné)
  - quand `--account` est omis, OpenClaw ne force pas une portée SecretRef de compte `default`
- Les SecretRefs non résolues sur des canaux sans rapport ne bloquent pas une action de message ciblée.
- Si la SecretRef du canal/compte sélectionné n’est pas résolue, la commande échoue de manière fermée pour cette action.

## Actions

### Noyau

- `send`
  - Canaux : WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Requis : `--target`, plus `--message`, `--media` ou `--presentation`
  - Facultatif : `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Charges utiles de présentation partagées : `--presentation` envoie des blocs sémantiques (`text`, `context`, `divider`, `buttons`, `select`) que le noyau affiche via les capacités déclarées du canal sélectionné. Voir [Présentation des messages](/fr/plugins/message-presentation).
  - Préférences de livraison génériques : `--delivery` accepte des indications de livraison telles que `{ "pin": true }` ; `--pin` est un raccourci pour une livraison épinglée quand le canal la prend en charge.
  - Telegram + WhatsApp : `--force-document` (envoyer les images, GIFs et vidéos comme documents pour éviter la compression du canal)
  - Telegram uniquement : `--thread-id` (id de sujet de forum)
  - Slack uniquement : `--thread-id` (horodatage de fil ; `--reply-to` utilise le même champ)
  - Telegram + Discord : `--silent`
  - WhatsApp uniquement : `--gif-playback` ; les canaux/newsletters WhatsApp sont adressés avec leur JID natif `@newsletter`.

- `poll`
  - Canaux : WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Requis : `--target`, `--poll-question`, `--poll-option` (répétable)
  - Facultatif : `--poll-multi`
  - Discord uniquement : `--poll-duration-hours`, `--silent`, `--message`
  - Telegram uniquement : `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Canaux : Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Requis : `--message-id`, `--target`
  - Facultatif : `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Remarque : `--remove` nécessite `--emoji` (omettre `--emoji` pour effacer ses propres réactions lorsque cela est pris en charge ; voir /tools/reactions)
  - WhatsApp uniquement : `--participant`, `--from-me`
  - Réactions de groupe Signal : `--target-author` ou `--target-author-uuid` requis
  - Nextcloud Talk : ajout de réactions uniquement ; `--remove` est rejeté avec une erreur claire (voir /tools/reactions)

- `reactions`
  - Canaux : Discord/Google Chat/Slack/Matrix
  - Requis : `--message-id`, `--target`
  - Facultatif : `--limit`

- `read`
  - Canaux : Discord/Slack/Matrix
  - Requis : `--target`
  - Facultatif : `--limit`, `--message-id`, `--before`, `--after`
  - Slack uniquement : `--message-id` lit un horodatage de message Slack spécifique ; combiner avec `--thread-id` pour lire une réponse de fil exacte.
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
  - Matrix uniquement : disponible quand le chiffrement Matrix est activé et que les actions de vérification sont autorisées

- `search`
  - Canaux : Discord
  - Requis : `--guild-id`, `--query`
  - Facultatif : `--channel-id`, `--channel-ids` (répétable), `--author-id`, `--author-ids` (répétable), `--limit`

### Fils

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

### Émojis

- `emoji list`
  - Discord : `--guild-id`
  - Slack : aucune option supplémentaire

- `emoji upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--emoji-name`, `--media`
  - Facultatif : `--role-ids` (répétable)

### Autocollants

- `sticker send`
  - Canaux : Discord
  - Requis : `--target`, `--sticker-id` (répétable)
  - Facultatif : `--message`

- `sticker upload`
  - Canaux : Discord
  - Requis : `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Rôles / Canaux / Membres / Voix

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

- `timeout` : `--guild-id`, `--user-id` (`--duration-min` ou `--until` facultatif ; omettez les deux pour effacer le délai d’expiration)
- `kick` : `--guild-id`, `--user-id` (+ `--reason`)
- `ban` : `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` prend également en charge `--reason`

### Diffusion

- `broadcast`
  - Canaux : n’importe quel canal configuré ; utilisez `--channel all` pour cibler tous les fournisseurs
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

Le noyau restitue le même payload `presentation` en composants Discord, blocs Slack, boutons en ligne Telegram, props Mattermost ou cartes Teams/Feishu selon la capacité du canal. Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat complet et les règles de repli.

Envoyer un payload de présentation plus riche :

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

Envoyer un bouton Telegram Mini App via la présentation générique :

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Les boutons d’app web Telegram ne sont pris en charge que dans les discussions privées entre un utilisateur et
le bot. Les anciens payloads JSON utilisant `web_app` sont toujours analysés, mais `webApp` est le
champ de présentation canonique.

Envoyer une carte Teams via la présentation générique :

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Envoyer une image Telegram ou WhatsApp comme document pour éviter la compression :

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Connexe

- [Référence CLI](/fr/cli)
- [Envoi par l’agent](/fr/tools/agent-send)

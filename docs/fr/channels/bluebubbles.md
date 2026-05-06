---
read_when:
    - Configuration du canal BlueBubbles
    - Dépannage de l’association Webhook
    - Configuration d’iMessage sur macOS
sidebarTitle: BlueBubbles
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, indicateurs de saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T07:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

Statut : Plugin groupé qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple par rapport à l’ancien canal imsg.

<Note>
Les versions actuelles d’OpenClaw intègrent BlueBubbles, donc les builds empaquetés normaux n’ont pas besoin d’une étape `openclaw plugins install` séparée.
</Note>

## Vue d’ensemble

- Fonctionne sur macOS via l’application d’assistance BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler une réussite sans se synchroniser.
- OpenClaw communique avec lui via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des webhooks ; les réponses sortantes, indicateurs de saisie, confirmations de lecture et tapbacks sont des appels REST.
- Les pièces jointes et autocollants sont ingérés comme médias entrants (et exposés à l’agent lorsque possible).
- Les réponses Auto-TTS qui synthétisent de l’audio MP3 ou CAF sont livrées comme bulles de mémo vocal iMessage plutôt que comme simples pièces jointes.
- L’appairage/la liste d’autorisation fonctionne de la même façon que les autres canaux (`/channels/pairing`, etc.) avec `channels.bluebubbles.allowFrom` + des codes d’appairage.
- Les réactions sont exposées comme événements système, comme dans Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modification, annulation d’envoi, fils de réponse, effets de message, gestion des groupes.

## Démarrage rapide

<Steps>
  <Step title="Install BlueBubbles">
    Installez le serveur BlueBubbles sur votre Mac (suivez les instructions sur [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    Dans la configuration BlueBubbles, activez l’API web et définissez un mot de passe.
  </Step>
  <Step title="Configure OpenClaw">
    Exécutez `openclaw onboard` et sélectionnez BlueBubbles, ou configurez manuellement :

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Point webhooks at the gateway">
    Pointez les webhooks BlueBubbles vers votre gateway (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Démarrez le gateway ; il enregistrera le gestionnaire de webhook et lancera l’appairage.
  </Step>
</Steps>

<Warning>
**Sécurité**

- Définissez toujours un mot de passe de webhook.
- L’authentification webhook est toujours requise. OpenClaw rejette les requêtes webhook BlueBubbles sauf si elles incluent un mot de passe/guid qui correspond à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse complète des corps webhook.

</Warning>

## Garder Messages.app actif (configurations VM / sans interface)

Certaines configurations VM macOS / toujours actives peuvent finir avec Messages.app qui passe en « veille » (les événements entrants s’arrêtent jusqu’à ce que l’app soit ouverte/mise au premier plan). Une solution simple consiste à **stimuler Messages toutes les 5 minutes** avec un AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
    Enregistrez ceci sous `~/Scripts/poke-messages.scpt` :

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Enregistrez ceci sous `~/Library/LaunchAgents/com.user.poke-messages.plist` :

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Cela s’exécute **toutes les 300 secondes** et **à la connexion**. La première exécution peut déclencher des invites macOS **Automation** (`osascript` → Messages). Approuvez-les dans la même session utilisateur que celle qui exécute le LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles est disponible dans l’onboarding interactif :

```
openclaw onboard
```

L’assistant demande :

<ParamField path="Server URL" type="string" required>
  Adresse du serveur BlueBubbles (par ex. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Mot de passe API depuis les paramètres de BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Chemin du point de terminaison webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` ou `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Numéros de téléphone, e-mails ou cibles de chat.
</ParamField>

Vous pouvez aussi ajouter BlueBubbles via la CLI :

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Contrôle d’accès (DM + groupes)

<Tabs>
  <Tab title="DMs">
    - Par défaut : `channels.bluebubbles.dmPolicy = "pairing"`.
    - Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
    - Approuver via :
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/fr/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.

  </Tab>
</Tabs>

### Enrichissement du nom des contacts (macOS, facultatif)

Les webhooks de groupe BlueBubbles n’incluent souvent que les adresses brutes des participants. Si vous voulez que le contexte `GroupMembers` affiche plutôt les noms des contacts locaux, vous pouvez activer l’enrichissement local des Contacts sur macOS :

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` active la recherche. Par défaut : `false`.
- Les recherches ne s’exécutent qu’après que l’accès au groupe, l’autorisation de commande et le filtrage par mention ont laissé passer le message.
- Seuls les participants téléphoniques sans nom sont enrichis.
- Les numéros de téléphone bruts restent le repli lorsqu’aucune correspondance locale n’est trouvée.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtrage par mention (groupes)

BlueBubbles prend en charge le filtrage par mention pour les discussions de groupe, conformément au comportement iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Quand `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
- Les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage par mention.

Configuration par groupe :

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Filtrage des commandes

- Les commandes de contrôle (par ex. `/config`, `/model`) nécessitent une autorisation.
- Utilise `allowFrom` et `groupAllowFrom` pour déterminer l’autorisation des commandes.
- Les expéditeurs autorisés peuvent exécuter des commandes de contrôle même sans mention dans les groupes.

### Prompt système par groupe

Chaque entrée sous `channels.bluebubbles.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe, afin de définir des règles de persona ou de comportement par groupe sans modifier les prompts de l’agent :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

La clé correspond à ce que BlueBubbles signale comme `chatGuid` / `chatIdentifier` / `chatId` numérique pour le groupe, et une entrée générique `"*"` fournit une valeur par défaut pour chaque groupe sans correspondance exacte (même motif que celui utilisé par `requireMention` et les politiques d’outils par groupe). Les correspondances exactes l’emportent toujours sur le caractère générique. Les DM ignorent ce champ ; utilisez plutôt la personnalisation du prompt au niveau de l’agent ou du compte.

#### Exemple détaillé : réponses en fil et réactions tapback (API privée)

Avec l’API privée BlueBubbles activée, les messages entrants arrivent avec des ID de message courts (par exemple `[[reply_to:5]]`) et l’agent peut appeler `action=reply` pour répondre en fil à un message précis ou `action=react` pour déposer un tapback. Un `systemPrompt` par groupe est un moyen fiable de faire choisir le bon outil par l’agent :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Les réactions tapback et les réponses en fil nécessitent toutes deux l’API privée BlueBubbles ; consultez [Actions avancées](#advanced-actions) et [ID de message](#message-ids-short-vs-full) pour les mécanismes sous-jacents.

## Liaisons de conversation ACP

Les chats BlueBubbles peuvent être transformés en espaces de travail ACP durables sans modifier la couche de transport.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM ou la discussion de groupe autorisée.
- Les futurs messages de cette même conversation BlueBubbles sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont également prises en charge via des entrées `bindings[]` de niveau supérieur avec `type: "acp"` et `match.channel: "bluebubbles"`.

`match.peer.id` peut utiliser n’importe quelle forme de cible BlueBubbles prise en charge :

- identifiant DM normalisé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Pour des liaisons de groupe stables, préférez `chat_id:*` ou `chat_identifier:*`.

Exemple :

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consultez [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Saisie + confirmations de lecture

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Confirmations de lecture** : contrôlées par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie les événements de début de saisie ; BlueBubbles efface automatiquement la saisie à l’envoi ou à l’expiration du délai (l’arrêt manuel via DELETE n’est pas fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Actions avancées

BlueBubbles prend en charge les actions de message avancées lorsqu’elles sont activées dans la configuration :

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Actions disponibles">
    - **react** : ajoute/supprime des réactions tapback (`messageId`, `emoji`, `remove`). L’ensemble tapback natif d’iMessage est `love`, `like`, `dislike`, `laugh`, `emphasize` et `question`. Lorsqu’un agent choisit un emoji en dehors de cet ensemble (par exemple `👀`), l’outil de réaction se rabat sur `love` afin que le tapback s’affiche quand même au lieu de faire échouer toute la requête. Les réactions d’accusé de réception configurées restent validées strictement et produisent une erreur sur les valeurs inconnues.
    - **edit** : modifie un message envoyé (`messageId`, `text`).
    - **unsend** : annule l’envoi d’un message (`messageId`).
    - **reply** : répond à un message précis (`messageId`, `text`, `to`).
    - **sendWithEffect** : envoie avec un effet iMessage (`text`, `to`, `effectId`).
    - **renameGroup** : renomme une conversation de groupe (`chatGuid`, `displayName`).
    - **setGroupIcon** : définit l’icône/la photo d’une conversation de groupe (`chatGuid`, `media`) - instable sur macOS 26 Tahoe (l’API peut renvoyer un succès alors que l’icône ne se synchronise pas).
    - **addParticipant** : ajoute quelqu’un à un groupe (`chatGuid`, `address`).
    - **removeParticipant** : supprime quelqu’un d’un groupe (`chatGuid`, `address`).
    - **leaveGroup** : quitte une conversation de groupe (`chatGuid`).
    - **upload-file** : envoie des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`).
      - Mémos vocaux : définissez `asVoice: true` avec un audio **MP3** ou **CAF** pour l’envoyer comme message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi de mémos vocaux.
    - Alias historique : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.

  </Accordion>
</AccordionGroup>

### ID de messages (courts ou complets)

OpenClaw peut exposer des ID de message _courts_ (p. ex. `1`, `2`) pour économiser des jetons.

- `MessageSid` / `ReplyToId` peuvent être des ID courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les ID complets du fournisseur.
- Les ID courts sont en mémoire ; ils peuvent expirer au redémarrage ou lors de l’éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les ID courts produiront une erreur s’ils ne sont plus disponibles.

Utilisez les ID complets pour les automatisations et le stockage durables :

- Modèles : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les charges utiles entrantes

Voir [Configuration](/fr/gateway/configuration) pour les variables de modèle.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusion des DM envoyés en plusieurs parties (commande + URL dans une seule composition)

Lorsqu’un utilisateur saisit une commande et une URL ensemble dans iMessage - p. ex. `Dump https://example.com/article` - Apple divise l’envoi en **deux livraisons Webhook distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG en pièces jointes.

Les deux Webhooks arrivent à OpenClaw à environ 0,8-2,0 s d’intervalle sur la plupart des configurations. Sans fusion, l’agent reçoit uniquement la commande au tour 1, répond (souvent « envoyez-moi l’URL »), et ne voit l’URL qu’au tour 2 - à ce moment-là, le contexte de la commande est déjà perdu.

`channels.bluebubbles.coalesceSameSenderDms` active pour un DM la fusion des Webhooks consécutifs du même expéditeur en un seul tour d’agent. Les conversations de groupe continuent à utiliser une clé par message afin de préserver la structure des tours multi-utilisateurs.

<Tabs>
  <Tab title="Quand l’activer">
    Activez-la lorsque :

    - Vous livrez des Skills qui attendent `command + payload` dans un seul message (dump, paste, save, queue, etc.).
    - Vos utilisateurs collent des URL, des images ou du contenu long avec des commandes.
    - Vous pouvez accepter la latence supplémentaire du tour de DM (voir ci-dessous).

    Laissez-la désactivée lorsque :

    - Vous avez besoin d’une latence de commande minimale pour les déclencheurs de DM à un seul mot.
    - Tous vos flux sont des commandes ponctuelles sans charges utiles ultérieures.

  </Tab>
  <Tab title="Activation">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Quand l’option est activée et qu’aucun `messages.inbound.byChannel.bluebubbles` explicite n’est défini, la fenêtre d’anti-rebond s’élargit à **2500 ms** (la valeur par défaut sans fusion est 500 ms). Cette fenêtre plus large est nécessaire - la cadence d’envoi fractionné d’Apple de 0,8-2,0 s ne tient pas dans la valeur par défaut plus stricte.

    Pour ajuster vous-même la fenêtre :

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromis">
    - **Latence ajoutée pour les commandes de contrôle en DM.** Quand l’option est activée, les messages de commande de contrôle en DM (comme `Dump`, `Save`, etc.) attendent désormais jusqu’à la fenêtre d’anti-rebond avant d’être distribués, au cas où un Webhook de charge utile arriverait. Les commandes de conversation de groupe conservent une distribution instantanée.
    - **La sortie fusionnée est bornée** - le texte fusionné est limité à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont limitées à 20 ; les entrées sources sont limitées à 10 (la première et la plus récente sont conservées au-delà). Chaque `messageId` source atteint tout de même la déduplication entrante, de sorte qu’une relecture ultérieure par MessagePoller d’un événement individuel est reconnue comme doublon.
    - **Activation explicite, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés.

  </Tab>
</Tabs>

### Scénarios et ce que voit l’agent

| L’utilisateur compose                                             | Apple livre               | Option désactivée (par défaut)                 | Option activée + fenêtre de 2500 ms                                      |
| ------------------------------------------------------------------ | ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un seul envoi)                         | 2 Webhooks à ~1 s d’écart | Deux tours d’agent : « Dump » seul, puis l’URL | Un tour : texte fusionné `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 Webhooks                | Deux tours                                      | Un tour : texte + image                                                 |
| `/status` (commande autonome)                                      | 1 Webhook                 | Distribution instantanée                       | **Attend jusqu’à la fenêtre, puis distribue**                           |
| URL collée seule                                                   | 1 Webhook                 | Distribution instantanée                       | Distribution instantanée (une seule entrée dans le compartiment)        |
| Texte + URL envoyés comme deux messages séparés délibérés, minutes apart | 2 Webhooks hors fenêtre | Deux tours                                      | Deux tours (la fenêtre expire entre eux)                                |
| Afflux rapide (>10 petits DM dans la fenêtre)                      | N Webhooks                | N tours                                        | Un tour, sortie bornée (premier + dernier, limites texte/pièces jointes appliquées) |

### Dépannage de la fusion des envois fractionnés

Si l’option est activée et que les envois fractionnés arrivent toujours en deux tours, vérifiez chaque couche :

<AccordionGroup>
  <Accordion title="Configuration réellement chargée">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Puis `openclaw gateway restart` - l’option est lue lors de la création du registre d’anti-rebond.

  </Accordion>
  <Accordion title="Fenêtre d’anti-rebond assez large pour votre configuration">
    Consultez le journal du serveur BlueBubbles sous `~/Library/Logs/bluebubbles-server/main.log` :

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mesurez l’écart entre la distribution du texte de style `"Dump"` et la distribution suivante de `"https://..."; Attachments:`. Augmentez `messages.inbound.byChannel.bluebubbles` pour couvrir confortablement cet écart.

  </Accordion>
  <Accordion title="Horodatages JSONL de session ≠ arrivée du Webhook">
    Les horodatages d’événements de session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflètent le moment où le Gateway remet un message à l’agent, **pas** le moment où le Webhook est arrivé. Un deuxième message en file d’attente marqué `[Queued messages while agent was busy]` signifie que le premier tour était encore en cours lorsque le deuxième Webhook est arrivé - le compartiment de fusion avait déjà été vidé. Ajustez la fenêtre à partir du journal du serveur BB, pas du journal de session.
  </Accordion>
  <Accordion title="Pression mémoire ralentissant la distribution des réponses">
    Sur les petites machines (8 Go), les tours d’agent peuvent prendre assez longtemps pour que le compartiment de fusion soit vidé avant la fin de la réponse, et l’URL arrive comme deuxième tour en file d’attente. Vérifiez `memory_pressure` et `ps -o rss -p $(pgrep openclaw-gateway)` ; si le Gateway dépasse ~500 Mo de RSS et que le compresseur est actif, fermez d’autres processus lourds ou passez à un hôte plus grand.
  </Accordion>
  <Accordion title="Les envois avec citation de réponse empruntent un autre chemin">
    Si l’utilisateur a appuyé sur `Dump` comme **réponse** à une bulle d’URL existante (iMessage affiche un badge « 1 Reply » sur la bulle Dump), l’URL se trouve dans `replyToBody`, pas dans un deuxième Webhook. La fusion ne s’applique pas - c’est une question de Skill/prompt, pas une question d’anti-rebond.
  </Accordion>
</AccordionGroup>

## Streaming par blocs

Contrôlez si les réponses sont envoyées comme un seul message ou diffusées en blocs :

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Médias + limites

- Les pièces jointes entrantes sont téléchargées et stockées dans le cache multimédia.
- Plafond des médias via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 Mo).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connexion et Webhook">
    - `channels.bluebubbles.enabled` : active/désactive le canal.
    - `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
    - `channels.bluebubbles.password` : mot de passe de l’API.
    - `channels.bluebubbles.webhookPath` : chemin du point de terminaison Webhook (par défaut : `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Politique d’accès">
    - `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
    - `channels.bluebubbles.allowFrom` : liste d’autorisation DM (identifiants, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichit éventuellement les participants de groupe sans nom à partir des Contacts locaux après le passage du filtrage. Par défaut : `false`.
    - `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Livraison et segmentation">
    - `channels.bluebubbles.sendReadReceipts`: Envoyer des accusés de lecture (par défaut : `true`).
    - `channels.bluebubbles.blockStreaming`: Activer la diffusion par blocs (par défaut : `false` ; requis pour les réponses en streaming).
    - `channels.bluebubbles.textChunkLimit`: Taille des segments sortants en caractères (par défaut : 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Délai d’expiration par requête en ms pour les envois de texte sortants via `/api/v1/message/text` (par défaut : 30000). Augmentez-le sur les configurations macOS 26 où les envois iMessage via l’API privée peuvent se bloquer pendant plus de 60 secondes dans le framework iMessage ; par exemple `45000` ou `60000`. Les sondes, recherches de chat, réactions, modifications et vérifications d’état conservent actuellement le délai par défaut plus court de 10 s ; l’élargissement de la couverture aux réactions et aux modifications est prévu en suivi. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (par défaut) ne segmente qu’en cas de dépassement de `textChunkLimit` ; `newline` segmente sur les lignes vides (limites de paragraphes) avant la segmentation par longueur.

  </Accordion>
  <Accordion title="Médias et historique">
    - `channels.bluebubbles.mediaMaxMb`: Limite des médias entrants/sortants en Mo (par défaut : 8).
    - `channels.bluebubbles.mediaLocalRoots`: Liste d’autorisation explicite des répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois par chemin local sont refusés par défaut sauf si cette option est configurée. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Fusionner les webhooks de messages privés consécutifs du même expéditeur en un seul tour d’agent afin que l’envoi séparé texte+URL d’Apple arrive comme un seul message (par défaut : `false`). Voir [Fusionner les messages privés envoyés en plusieurs parties](#coalescing-split-send-dms-command--url-in-one-composition) pour les scénarios, le réglage de la fenêtre et les compromis. Élargit la fenêtre d’anti-rebond entrante par défaut de 500 ms à 2500 ms lorsque l’option est activée sans `messages.inbound.byChannel.bluebubbles` explicite.
    - `channels.bluebubbles.historyLimit`: Nombre maximal de messages de groupe pour le contexte (0 désactive).
    - `channels.bluebubbles.dmHistoryLimit`: Limite de l’historique des messages privés.
    - `channels.bluebubbles.replyContextApiFallback`: Lorsqu’une réponse entrante arrive sans `replyToBody`/`replyToSender` et que le cache en mémoire du contexte de réponse échoue, récupérer le message d’origine depuis l’API HTTP BlueBubbles en tant que solution de secours au mieux (par défaut : `false`). Utile pour les déploiements multi-instances partageant un compte BlueBubbles, après des redémarrages de processus, ou après l’éviction d’un cache TTL/LRU à longue durée de vie. La récupération est protégée contre les SSRF par la même stratégie que toute autre requête client BlueBubbles, ne lève jamais d’exception et alimente le cache afin d’amortir les réponses suivantes. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Un paramètre au niveau du canal se propage aux comptes qui omettent l’indicateur.

  </Accordion>
  <Accordion title="Actions et comptes">
    - `channels.bluebubbles.actions`: Activer/désactiver des actions spécifiques.
    - `channels.bluebubbles.accounts`: Configuration multi-compte.

  </Accordion>
</AccordionGroup>

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressage / cibles de livraison

Préférez `chat_guid` pour un routage stable :

- `chat_guid:iMessage;-;+15555550123` (préféré pour les groupes)
- `chat_id:123`
- `chat_identifier:...`
- Identifiants directs : `+15555550123`, `user@example.com`
  - Si un identifiant direct n’a pas de chat privé existant, OpenClaw en créera un via `POST /api/v1/chat/new`. Cela nécessite l’activation de l’API privée BlueBubbles.

### Routage iMessage ou SMS

Lorsque le même identifiant possède à la fois un chat iMessage et un chat SMS sur le Mac (par exemple un numéro de téléphone enregistré sur iMessage mais ayant aussi reçu des replis à bulles vertes), OpenClaw préfère le chat iMessage et ne rétrograde jamais silencieusement vers SMS. Pour forcer le chat SMS, utilisez un préfixe de cible `sms:` explicite (par exemple `sms:+15555550123`). Les identifiants sans chat iMessage correspondant s’envoient tout de même via le chat signalé par BlueBubbles.

## Sécurité

- Les requêtes Webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez secrets le mot de passe de l’API et le point de terminaison Webhook (traitez-les comme des identifiants).
- Il n’y a pas de contournement localhost pour l’authentification du Webhook BlueBubbles. Si vous proxifiez le trafic Webhook, conservez le mot de passe BlueBubbles sur la requête de bout en bout. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Voir [Sécurité du Gateway](/fr/gateway/security#reverse-proxy-configuration).
- Activez HTTPS et des règles de pare-feu sur le serveur BlueBubbles si vous l’exposez hors de votre LAN.

## Dépannage

- Si les événements de saisie/lecture cessent de fonctionner, consultez les journaux Webhook BlueBubbles et vérifiez que le chemin du Gateway correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’association expirent au bout d’une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent l’API privée BlueBubbles (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- Modifier/annuler l’envoi nécessite macOS 13+ et une version compatible du serveur BlueBubbles. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements de l’API privée.
- Les mises à jour d’icône de groupe peuvent être instables sur macOS 26 (Tahoe) : l’API peut renvoyer un succès sans que la nouvelle icône se synchronise.
- OpenClaw masque automatiquement les actions connues comme cassées selon la version macOS du serveur BlueBubbles. Si la modification apparaît encore sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` est activé mais les envois séparés (par exemple `Dump` + URL) arrivent toujours en deux tours : consultez la liste de contrôle [dépannage de la fusion des envois séparés](#split-send-coalescing-troubleshooting) - les causes courantes sont une fenêtre d’anti-rebond trop serrée, des horodatages de journal de session confondus avec l’arrivée du Webhook, ou l’envoi d’une citation de réponse (qui utilise `replyToBody`, pas un second Webhook).
- Pour les informations d’état/santé : `openclaw status --all` ou `openclaw status --deep`.

Pour une référence générale sur le flux de travail des canaux, consultez [Canaux](/fr/channels) et le guide [Plugins](/fr/tools/plugin).

## Associés

- [Routage des canaux](/fr/channels/channel-routing) - routage de session pour les messages
- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Groupes](/fr/channels/groups) - comportement des chats de groupe et contrôle des mentions
- [Association](/fr/channels/pairing) - authentification par message privé et flux d’association
- [Sécurité](/fr/gateway/security) - modèle d’accès et durcissement

---
read_when:
    - Configuration du canal BlueBubbles
    - Dépannage de l’appairage Webhook
    - Configuration d’iMessage sur macOS
sidebarTitle: BlueBubbles
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T07:11:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Statut : Plugin inclus qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple que l’ancien canal imsg.

<Note>
Les versions actuelles d’OpenClaw incluent BlueBubbles ; les builds empaquetés standard n’ont donc pas besoin d’une étape `openclaw plugins install` séparée.
</Note>

## Vue d’ensemble

- S’exécute sur macOS via l’application d’assistance BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler une réussite sans se synchroniser.
- OpenClaw communique avec lui via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des webhooks ; les réponses sortantes, indicateurs de saisie, accusés de lecture et tapbacks sont des appels REST.
- Les pièces jointes et les autocollants sont ingérés comme médias entrants (et présentés à l’agent lorsque possible).
- Les réponses Auto-TTS qui synthétisent de l’audio MP3 ou CAF sont livrées sous forme de bulles de mémo vocal iMessage au lieu de simples pièces jointes.
- L’appairage/liste d’autorisation fonctionne de la même manière que les autres canaux (`/channels/pairing`, etc.) avec `channels.bluebubbles.allowFrom` + codes d’appairage.
- Les réactions sont présentées comme des événements système, comme dans Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modification, annulation d’envoi, fils de réponse, effets de message, gestion des groupes.

## Démarrage rapide

<Steps>
  <Step title="Installer BlueBubbles">
    Installez le serveur BlueBubbles sur votre Mac (suivez les instructions sur [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Activer l’API web">
    Dans la configuration BlueBubbles, activez l’API web et définissez un mot de passe.
  </Step>
  <Step title="Configurer OpenClaw">
    Exécutez `openclaw onboard` et sélectionnez BlueBubbles, ou configurez-le manuellement :

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
  <Step title="Faire pointer les webhooks vers le Gateway">
    Faites pointer les webhooks BlueBubbles vers votre Gateway (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Démarrer le Gateway">
    Démarrez le Gateway ; il enregistrera le gestionnaire de webhook et commencera l’appairage.
  </Step>
</Steps>

<Warning>
**Sécurité**

- Définissez toujours un mot de passe de webhook.
- L’authentification du Webhook est toujours obligatoire. OpenClaw rejette les requêtes de webhook BlueBubbles sauf si elles incluent un mot de passe/guid correspondant à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie de local loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse complète des corps de webhook.

</Warning>

## Garder Messages.app actif (configurations VM / sans interface graphique)

Certaines configurations macOS en VM / toujours actives peuvent finir avec Messages.app en état « inactif » (les événements entrants s’arrêtent jusqu’à ce que l’application soit ouverte/placée au premier plan). Une solution simple consiste à **stimuler Messages toutes les 5 minutes** avec un AppleScript + LaunchAgent.

<Steps>
  <Step title="Enregistrer l’AppleScript">
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
  <Step title="Installer un LaunchAgent">
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

    Cela s’exécute **toutes les 300 secondes** et **à la connexion**. La première exécution peut déclencher des invites **Automation** macOS (`osascript` → Messages). Approuvez-les dans la même session utilisateur que celle qui exécute le LaunchAgent.

  </Step>
  <Step title="Le charger">
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
  Adresse du serveur BlueBubbles (par exemple, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Mot de passe API provenant des paramètres du serveur BlueBubbles.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Chemin du point de terminaison Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` ou `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Numéros de téléphone, e-mails ou cibles de discussion.
</ParamField>

Vous pouvez aussi ajouter BlueBubbles via la CLI :

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Contrôle d’accès (DM + groupes)

<Tabs>
  <Tab title="DM">
    - Par défaut : `channels.bluebubbles.dmPolicy = "pairing"`.
    - Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
    - Approuvez via :
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/fr/channels/pairing)

  </Tab>
  <Tab title="Groupes">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.

  </Tab>
</Tabs>

### Enrichissement des noms de contact (macOS, facultatif)

Les webhooks de groupe BlueBubbles n’incluent souvent que les adresses brutes des participants. Si vous voulez que le contexte `GroupMembers` affiche plutôt les noms des contacts locaux, vous pouvez activer l’enrichissement local depuis Contacts sur macOS :

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` active la recherche. Par défaut : `false`.
- Les recherches ne s’exécutent qu’après que l’accès au groupe, l’autorisation de commande et le filtrage par mention ont laissé passer le message.
- Seuls les participants téléphoniques sans nom sont enrichis.
- Les numéros de téléphone bruts restent la solution de repli lorsqu’aucune correspondance locale n’est trouvée.

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

BlueBubbles prend en charge le filtrage par mention pour les discussions de groupe, avec un comportement similaire à iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Lorsque `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
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

- Les commandes de contrôle (par exemple, `/config`, `/model`) nécessitent une autorisation.
- Utilise `allowFrom` et `groupAllowFrom` pour déterminer l’autorisation de commande.
- Les expéditeurs autorisés peuvent exécuter des commandes de contrôle même sans mention dans les groupes.

### Invite système par groupe

Chaque entrée sous `channels.bluebubbles.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans l’invite système de l’agent à chaque tour qui traite un message dans ce groupe, afin que vous puissiez définir une persona ou des règles de comportement propres au groupe sans modifier les invites de l’agent :

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

La clé correspond à ce que BlueBubbles signale comme `chatGuid` / `chatIdentifier` / `chatId` numérique pour le groupe, et une entrée générique `"*"` fournit une valeur par défaut pour chaque groupe sans correspondance exacte (même modèle que celui utilisé par `requireMention` et les politiques d’outils par groupe). Les correspondances exactes l’emportent toujours sur le caractère générique. Les DM ignorent ce champ ; utilisez plutôt la personnalisation d’invite au niveau de l’agent ou du compte.

#### Exemple détaillé : réponses en fil et réactions tapback (API privée)

Avec l’API privée BlueBubbles activée, les messages entrants arrivent avec des ID de message courts (par exemple `[[reply_to:5]]`) et l’agent peut appeler `action=reply` pour répondre dans le fil d’un message précis, ou `action=react` pour déposer un tapback. Un `systemPrompt` par groupe est un moyen fiable de garder l’agent orienté vers le bon outil :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Les réactions tapback et les réponses en fil nécessitent toutes deux l’API privée BlueBubbles ; consultez [Actions avancées](#advanced-actions) et [ID de message](#message-ids-short-vs-full) pour les mécanismes sous-jacents.

## Liaisons de conversation ACP

Les discussions BlueBubbles peuvent être transformées en espaces de travail ACP durables sans modifier la couche de transport.

Flux rapide pour l’opérateur :

- Exécutez `/acp spawn codex --bind here` dans le DM ou la discussion de groupe autorisée.
- Les futurs messages dans cette même conversation BlueBubbles sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont également prises en charge via les entrées de premier niveau `bindings[]` avec `type: "acp"` et `match.channel: "bluebubbles"`.

`match.peer.id` peut utiliser n’importe quelle forme de cible BlueBubbles prise en charge :

- identifiant de DM normalisé tel que `+15555550123` ou `user@example.com`
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

## Saisie + accusés de lecture

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Accusés de lecture** : contrôlés par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie des événements de début de saisie ; BlueBubbles efface automatiquement la saisie lors de l’envoi ou à l’expiration du délai (l’arrêt manuel via DELETE n’est pas fiable).

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

BlueBubbles prend en charge les actions avancées sur les messages lorsqu’elles sont activées dans la configuration :

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
    - **react** : ajouter/supprimer des réactions tapback (`messageId`, `emoji`, `remove`). L’ensemble tapback natif d’iMessage est `love`, `like`, `dislike`, `laugh`, `emphasize` et `question`. Lorsqu’un agent choisit un emoji en dehors de cet ensemble (par exemple `👀`), l’outil de réaction se replie sur `love` afin que le tapback s’affiche quand même au lieu de faire échouer toute la requête. Les réactions d’accusé configurées restent validées strictement et génèrent une erreur pour les valeurs inconnues.
    - **edit** : modifier un message envoyé (`messageId`, `text`).
    - **unsend** : annuler l’envoi d’un message (`messageId`).
    - **reply** : répondre à un message précis (`messageId`, `text`, `to`).
    - **sendWithEffect** : envoyer avec un effet iMessage (`text`, `to`, `effectId`).
    - **renameGroup** : renommer une discussion de groupe (`chatGuid`, `displayName`).
    - **setGroupIcon** : définir l’icône/la photo d’une discussion de groupe (`chatGuid`, `media`) — instable sur macOS 26 Tahoe (l’API peut renvoyer un succès alors que l’icône ne se synchronise pas).
    - **addParticipant** : ajouter quelqu’un à un groupe (`chatGuid`, `address`).
    - **removeParticipant** : retirer quelqu’un d’un groupe (`chatGuid`, `address`).
    - **leaveGroup** : quitter une discussion de groupe (`chatGuid`).
    - **upload-file** : envoyer des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`).
      - Mémos vocaux : définissez `asVoice: true` avec de l’audio **MP3** ou **CAF** pour l’envoyer comme message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi de mémos vocaux.
    - Alias hérité : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.

  </Accordion>
</AccordionGroup>

### ID de messages (courts ou complets)

OpenClaw peut exposer des ID de messages _courts_ (par exemple, `1`, `2`) pour économiser des jetons.

- `MessageSid` / `ReplyToId` peuvent être des ID courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les ID complets du fournisseur.
- Les ID courts sont en mémoire ; ils peuvent expirer après un redémarrage ou une éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les ID courts génèrent une erreur s’ils ne sont plus disponibles.

Utilisez les ID complets pour les automatisations et le stockage durables :

- Modèles : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les charges utiles entrantes

Voir [Configuration](/fr/gateway/configuration) pour les variables de modèle.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusion des DM envoyés en plusieurs parties (commande + URL dans une seule composition)

Lorsqu’un utilisateur saisit une commande et une URL ensemble dans iMessage — par exemple `Dump https://example.com/article` — Apple découpe l’envoi en **deux livraisons Webhook distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG comme pièces jointes.

Les deux Webhooks arrivent dans OpenClaw à environ 0,8 à 2,0 s d’intervalle sur la plupart des configurations. Sans fusion, l’agent reçoit uniquement la commande au tour 1, répond (souvent « envoie-moi l’URL »), et ne voit l’URL qu’au tour 2 — moment où le contexte de commande est déjà perdu.

`channels.bluebubbles.coalesceSameSenderDms` permet à un DM de fusionner les Webhooks consécutifs du même expéditeur en un seul tour d’agent. Les discussions de groupe continuent à être indexées par message afin de préserver la structure des tours multi-utilisateurs.

<Tabs>
  <Tab title="Quand l’activer">
    Activez-le lorsque :

    - Vous fournissez des skills qui attendent `command + payload` dans un seul message (dump, paste, save, queue, etc.).
    - Vos utilisateurs collent des URL, des images ou du contenu long avec des commandes.
    - Vous pouvez accepter la latence de tour de DM ajoutée (voir ci-dessous).

    Laissez-le désactivé lorsque :

    - Vous avez besoin d’une latence minimale pour les déclencheurs DM d’un seul mot.
    - Tous vos flux sont des commandes ponctuelles sans charge utile de suivi.

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

    Avec l’indicateur activé et sans `messages.inbound.byChannel.bluebubbles` explicite, la fenêtre de debounce s’élargit à **2500 ms** (la valeur par défaut sans fusion est 500 ms). Cette fenêtre plus large est nécessaire — la cadence d’envoi découpé d’Apple, de 0,8 à 2,0 s, ne tient pas dans la valeur par défaut plus étroite.

    Pour régler la fenêtre vous-même :

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
    - **Latence ajoutée pour les commandes de contrôle en DM.** Avec l’indicateur activé, les messages de commande de contrôle en DM (comme `Dump`, `Save`, etc.) attendent maintenant jusqu’à la fenêtre de debounce avant d’être distribués, au cas où un Webhook de charge utile arrive. Les commandes de discussion de groupe conservent une distribution instantanée.
    - **La sortie fusionnée est bornée** — le texte fusionné est limité à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont limitées à 20 ; les entrées source sont limitées à 10 (les premières et les plus récentes sont conservées au-delà). Chaque `messageId` source atteint toujours la déduplication entrante afin qu’une relecture ultérieure par MessagePoller de n’importe quel événement individuel soit reconnue comme doublon.
    - **Opt-in, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés.

  </Tab>
</Tabs>

### Scénarios et ce que voit l’agent

| L’utilisateur compose                                              | Apple livre               | Indicateur désactivé (par défaut)             | Indicateur activé + fenêtre de 2500 ms                                  |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un seul envoi)                         | 2 Webhooks à ~1 s d’écart | Deux tours d’agent : « Dump » seul, puis l’URL | Un tour : texte fusionné `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 Webhooks                | Deux tours                                    | Un tour : texte + image                                                 |
| `/status` (commande autonome)                                      | 1 Webhook                 | Distribution instantanée                      | **Attend jusqu’à la fenêtre, puis distribue**                           |
| URL collée seule                                                   | 1 Webhook                 | Distribution instantanée                      | Distribution instantanée (une seule entrée dans le compartiment)        |
| Texte + URL envoyés en deux messages séparés délibérés, à plusieurs minutes d’écart | 2 Webhooks hors fenêtre | Deux tours                                    | Deux tours (la fenêtre expire entre eux)                                |
| Afflux rapide (>10 petits DM dans la fenêtre)                      | N Webhooks                | N tours                                       | Un tour, sortie bornée (premier + dernier, limites texte/pièces jointes appliquées) |

### Dépannage de la fusion des envois découpés

Si l’indicateur est activé et que les envois découpés arrivent toujours en deux tours, vérifiez chaque couche :

<AccordionGroup>
  <Accordion title="Configuration réellement chargée">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Puis `openclaw gateway restart` — l’indicateur est lu lors de la création du registre de debouncers.

  </Accordion>
  <Accordion title="Fenêtre de debounce assez large pour votre configuration">
    Consultez le journal du serveur BlueBubbles sous `~/Library/Logs/bluebubbles-server/main.log` :

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mesurez l’écart entre la distribution du texte de style `"Dump"` et la distribution suivante `"https://..."; Attachments:`. Augmentez `messages.inbound.byChannel.bluebubbles` pour couvrir confortablement cet écart.

  </Accordion>
  <Accordion title="Horodatages JSONL de session ≠ arrivée du Webhook">
    Les horodatages des événements de session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflètent le moment où le Gateway remet un message à l’agent, **pas** celui où le Webhook est arrivé. Un deuxième message en file d’attente marqué `[Queued messages while agent was busy]` signifie que le premier tour était encore en cours lorsque le deuxième Webhook est arrivé — le compartiment de fusion avait déjà été vidé. Réglez la fenêtre d’après le journal du serveur BB, pas d’après le journal de session.
  </Accordion>
  <Accordion title="Pression mémoire ralentissant la distribution des réponses">
    Sur les machines plus modestes (8 Go), les tours d’agent peuvent durer assez longtemps pour que le compartiment de fusion se vide avant la fin de la réponse, et l’URL arrive alors comme deuxième tour en file d’attente. Vérifiez `memory_pressure` et `ps -o rss -p $(pgrep openclaw-gateway)` ; si le Gateway dépasse ~500 Mo de RSS et que le compresseur est actif, fermez d’autres processus lourds ou passez à un hôte plus grand.
  </Accordion>
  <Accordion title="Les envois avec citation de réponse suivent un autre chemin">
    Si l’utilisateur a touché `Dump` comme **réponse** à une bulle d’URL existante (iMessage affiche un badge « 1 réponse » sur la bulle Dump), l’URL se trouve dans `replyToBody`, pas dans un deuxième Webhook. La fusion ne s’applique pas — c’est une question de skill/prompt, pas de debouncer.
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

- Les pièces jointes entrantes sont téléchargées et stockées dans le cache média.
- Limite des médias via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 Mo).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connexion et Webhook">
    - `channels.bluebubbles.enabled` : activer/désactiver le canal.
    - `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
    - `channels.bluebubbles.password` : mot de passe de l’API.
    - `channels.bluebubbles.webhookPath` : chemin du point de terminaison Webhook (par défaut : `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Politique d’accès">
    - `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
    - `channels.bluebubbles.allowFrom` : liste d’autorisation des DM (identifiants, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichit éventuellement les participants de groupe sans nom depuis les Contacts locaux après validation des contrôles d’accès. Par défaut : `false`.
    - `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).

  </Accordion>
  <Accordion title="Livraison et découpage">
    - `channels.bluebubbles.sendReadReceipts` : Envoyer les accusés de lecture (par défaut : `true`).
    - `channels.bluebubbles.blockStreaming` : Activer le streaming par blocs (par défaut : `false` ; requis pour les réponses en streaming).
    - `channels.bluebubbles.textChunkLimit` : Taille des segments sortants en caractères (par défaut : 4000).
    - `channels.bluebubbles.sendTimeoutMs` : Délai d’expiration par requête en ms pour les envois de texte sortants via `/api/v1/message/text` (par défaut : 30000). Augmentez-le sur les configurations macOS 26 où les envois iMessage via Private API peuvent se bloquer pendant plus de 60 secondes dans le framework iMessage ; par exemple `45000` ou `60000`. Les sondes, les recherches de discussions, les réactions, les modifications et les contrôles d’état conservent actuellement la valeur par défaut plus courte de 10 s ; l’élargissement de la couverture aux réactions et aux modifications est prévu comme suivi. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode` : `length` (par défaut) découpe uniquement en cas de dépassement de `textChunkLimit` ; `newline` découpe sur les lignes vides (limites de paragraphes) avant le découpage par longueur.

  </Accordion>
  <Accordion title="Médias et historique">
    - `channels.bluebubbles.mediaMaxMb` : Limite des médias entrants/sortants en Mo (par défaut : 8).
    - `channels.bluebubbles.mediaLocalRoots` : Liste d’autorisation explicite des répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois par chemin local sont refusés par défaut sauf si cette option est configurée. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms` : Fusionner les Webhooks de DM consécutifs du même expéditeur en un seul tour d’agent afin que l’envoi fractionné texte+URL d’Apple arrive comme un seul message (par défaut : `false`). Consultez [Fusion des DM à envoi fractionné](#coalescing-split-send-dms-command--url-in-one-composition) pour les scénarios, le réglage de la fenêtre et les compromis. Élargit la fenêtre anti-rebond entrante par défaut de 500 ms à 2500 ms lorsqu’elle est activée sans `messages.inbound.byChannel.bluebubbles` explicite.
    - `channels.bluebubbles.historyLimit` : Nombre maximal de messages de groupe pour le contexte (0 désactive).
    - `channels.bluebubbles.dmHistoryLimit` : Limite de l’historique des DM.

  </Accordion>
  <Accordion title="Actions et comptes">
    - `channels.bluebubbles.actions` : Activer/désactiver des actions spécifiques.
    - `channels.bluebubbles.accounts` : Configuration multi-comptes.

  </Accordion>
</AccordionGroup>

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressage / cibles de livraison

Privilégiez `chat_guid` pour un routage stable :

- `chat_guid:iMessage;-;+15555550123` (préféré pour les groupes)
- `chat_id:123`
- `chat_identifier:...`
- Identifiants directs : `+15555550123`, `user@example.com`
  - Si un identifiant direct n’a pas de discussion DM existante, OpenClaw en créera une via `POST /api/v1/chat/new`. Cela nécessite l’activation de la Private API BlueBubbles.

### Routage iMessage et SMS

Lorsque le même identifiant possède à la fois une discussion iMessage et une discussion SMS sur le Mac (par exemple un numéro de téléphone enregistré sur iMessage mais qui a aussi reçu des replis en bulles vertes), OpenClaw privilégie la discussion iMessage et ne bascule jamais silencieusement vers SMS. Pour forcer la discussion SMS, utilisez un préfixe de cible explicite `sms:` (par exemple `sms:+15555550123`). Les identifiants sans discussion iMessage correspondante continuent d’envoyer via la discussion signalée par BlueBubbles.

## Sécurité

- Les requêtes Webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez le mot de passe de l’API et le point de terminaison Webhook secrets (traitez-les comme des identifiants).
- Il n’y a pas de contournement localhost pour l’authentification Webhook BlueBubbles. Si vous proxyfiez le trafic Webhook, conservez le mot de passe BlueBubbles sur la requête de bout en bout. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Consultez [Sécurité du Gateway](/fr/gateway/security#reverse-proxy-configuration).
- Activez HTTPS et des règles de pare-feu sur le serveur BlueBubbles si vous l’exposez hors de votre LAN.

## Dépannage

- Si les événements de saisie/lecture cessent de fonctionner, consultez les journaux Webhook BlueBubbles et vérifiez que le chemin du gateway correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’appairage expirent après une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent la Private API BlueBubbles (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- Modifier/annuler l’envoi nécessite macOS 13+ et une version compatible du serveur BlueBubbles. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements de l’API privée.
- Les mises à jour d’icône de groupe peuvent être peu fiables sur macOS 26 (Tahoe) : l’API peut renvoyer un succès, mais la nouvelle icône ne se synchronise pas.
- OpenClaw masque automatiquement les actions connues comme cassées selon la version de macOS du serveur BlueBubbles. Si la modification apparaît encore sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` est activé, mais les envois fractionnés (par ex. `Dump` + URL) arrivent encore en deux tours : consultez la liste de contrôle [dépannage de la fusion des envois fractionnés](#split-send-coalescing-troubleshooting) — les causes courantes sont une fenêtre anti-rebond trop courte, des horodatages de journal de session interprétés à tort comme l’arrivée du Webhook, ou un envoi de citation de réponse (qui utilise `replyToBody`, pas un second Webhook).
- Pour les informations de statut/état : `openclaw status --all` ou `openclaw status --deep`.

Pour une référence générale sur les workflows de canaux, consultez [Canaux](/fr/channels) et le guide [Plugins](/fr/tools/plugin).

## Connexe

- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Appairage](/fr/channels/pairing) — authentification des DM et flux d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement

---
read_when:
    - Configurer le canal BlueBubbles
    - Résolution des problèmes d'appairage du Webhook
    - Configurer iMessage sur macOS
sidebarTitle: BlueBubbles
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Statut : Plugin intégré qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple par rapport à l’ancien canal imsg.

<Note>
Les versions actuelles d’OpenClaw intègrent BlueBubbles, donc les builds empaquetés normaux n’ont pas besoin d’une étape `openclaw plugins install` distincte.
</Note>

## Vue d’ensemble

- S’exécute sur macOS via l’application d’assistance BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler un succès sans se synchroniser.
- OpenClaw communique avec lui via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des Webhooks ; les réponses sortantes, indicateurs de saisie, accusés de lecture et tapbacks sont des appels REST.
- Les pièces jointes et autocollants sont ingérés comme médias entrants (et transmis à l’agent quand c’est possible).
- Les réponses TTS automatiques qui synthétisent de l’audio MP3 ou CAF sont envoyées sous forme de bulles de mémo vocal iMessage au lieu de simples pièces jointes de fichier.
- L’appairage/la liste d’autorisation fonctionne de la même manière que pour les autres canaux (`/channels/pairing`, etc.) avec `channels.bluebubbles.allowFrom` + codes d’appairage.
- Les réactions apparaissent comme des événements système, comme sur Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modification, annulation d’envoi, réponses en fil, effets de message, gestion des groupes.

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
  <Step title="Pointer les Webhooks vers la Gateway">
    Pointez les Webhooks BlueBubbles vers votre Gateway (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Démarrer la Gateway">
    Démarrez la Gateway ; elle enregistrera le gestionnaire de Webhook et lancera l’appairage.
  </Step>
</Steps>

<Warning>
**Sécurité**

- Définissez toujours un mot de passe de Webhook.
- L’authentification du Webhook est toujours requise. OpenClaw rejette les requêtes de Webhook BlueBubbles sauf si elles incluent un mot de passe/guid correspondant à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse complète des corps de Webhook.
</Warning>

## Maintenir Messages.app actif (configurations VM / headless)

Certaines configurations de VM macOS / toujours actives peuvent entraîner l’état « inactif » de Messages.app (les événements entrants s’arrêtent jusqu’à ce que l’application soit ouverte/mise au premier plan). Une solution simple consiste à **solliciter Messages toutes les 5 minutes** à l’aide d’un AppleScript + LaunchAgent.

<Steps>
  <Step title="Enregistrer l’AppleScript">
    Enregistrez ceci dans `~/Scripts/poke-messages.scpt` :

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
    Enregistrez ceci dans `~/Library/LaunchAgents/com.user.poke-messages.plist` :

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
  <Step title="Le charger">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Intégration guidée

BlueBubbles est disponible dans l’intégration guidée interactive :

```
openclaw onboard
```

L’assistant demande :

<ParamField path="Server URL" type="string" required>
  Adresse du serveur BlueBubbles (par ex. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Mot de passe d’API depuis les paramètres du serveur BlueBubbles.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Chemin du point de terminaison du Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, ou `disabled`.
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
    - Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent au bout d’1 heure).
    - Approuver via :
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - L’appairage est l’échange de jetons par défaut. Détails : [Appairage](/fr/channels/pairing)
  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.
  </Tab>
</Tabs>

### Enrichissement des noms de contact (macOS, facultatif)

Les Webhooks de groupe BlueBubbles n’incluent souvent que les adresses brutes des participants. Si vous souhaitez que le contexte `GroupMembers` affiche à la place les noms de contacts locaux, vous pouvez activer l’enrichissement à partir des contacts locaux sur macOS :

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` active la recherche. Par défaut : `false`.
- Les recherches ne s’exécutent qu’après que l’accès au groupe, l’autorisation des commandes et le filtrage des mentions ont autorisé le passage du message.
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

### Filtrage des mentions (groupes)

BlueBubbles prend en charge le filtrage des mentions pour les discussions de groupe, en cohérence avec le comportement d’iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Lorsque `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
- Les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage des mentions.

Configuration par groupe :

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // valeur par défaut pour tous les groupes
        "iMessage;-;chat123": { requireMention: false }, // remplacement pour un groupe spécifique
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

Chaque entrée sous `channels.bluebubbles.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe, ce qui vous permet de définir une personnalité ou des règles comportementales par groupe sans modifier les prompts de l’agent :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Gardez les réponses sous 3 phrases. Reprenez le ton décontracté du groupe.",
        },
      },
    },
  },
}
```

La clé correspond à tout ce que BlueBubbles rapporte comme `chatGuid` / `chatIdentifier` / `chatId` numérique pour le groupe, et une entrée générique `"*"` fournit une valeur par défaut pour chaque groupe sans correspondance exacte (même modèle utilisé par `requireMention` et les politiques d’outils par groupe). Les correspondances exactes ont toujours priorité sur le joker. Les DM ignorent ce champ ; utilisez plutôt une personnalisation du prompt au niveau de l’agent ou du compte.

#### Exemple pratique : réponses en fil et réactions tapback (Private API)

Avec la BlueBubbles Private API activée, les messages entrants arrivent avec des IDs de message courts (par exemple `[[reply_to:5]]`) et l’agent peut appeler `action=reply` pour répondre dans un message spécifique ou `action=react` pour déposer un tapback. Un `systemPrompt` par groupe est un moyen fiable d’amener l’agent à choisir le bon outil :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Lorsque vous répondez dans ce groupe, appelez toujours action=reply avec le",
            "messageId [[reply_to:N]] du contexte afin que votre réponse soit envoyée en fil",
            "sous le message déclencheur. N’envoyez jamais un nouveau message non lié.",
            "",
            "Pour les accusés de réception courts ('ok', 'bien reçu', 'j’y suis'), utilisez",
            "action=react avec un emoji tapback approprié (❤️, 👍, 😂, ‼️, ❓)",
            "au lieu d’envoyer une réponse texte.",
          ].join(" "),
        },
      },
    },
  },
}
```

Les réactions tapback et les réponses en fil nécessitent toutes deux la BlueBubbles Private API ; voir [Actions avancées](#advanced-actions) et [IDs de message](#message-ids-short-vs-full) pour les mécanismes sous-jacents.

## Liaisons de conversation ACP

Les discussions BlueBubbles peuvent être transformées en espaces de travail ACP durables sans modifier la couche de transport.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM ou la discussion de groupe autorisée.
- Les messages ultérieurs dans cette même conversation BlueBubbles sont acheminés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place cette même session ACP liée.
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

Voir [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Saisie + accusés de lecture

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Accusés de lecture** : contrôlés par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie des événements de début de saisie ; BlueBubbles efface automatiquement l’état de saisie lors de l’envoi ou à l’expiration du délai (l’arrêt manuel via DELETE n’est pas fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // désactiver les accusés de lecture
    },
  },
}
```

## Actions avancées

BlueBubbles prend en charge des actions de message avancées lorsqu’elles sont activées dans la configuration :

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (par défaut : true)
        edit: true, // modifier les messages envoyés (macOS 13+, cassé sur macOS 26 Tahoe)
        unsend: true, // annuler l’envoi des messages (macOS 13+)
        reply: true, // réponses en fil par GUID de message
        sendWithEffect: true, // effets de message (slam, loud, etc.)
        renameGroup: true, // renommer les discussions de groupe
        setGroupIcon: true, // définir l’icône/photo d’une discussion de groupe (instable sur macOS 26 Tahoe)
        addParticipant: true, // ajouter des participants aux groupes
        removeParticipant: true, // retirer des participants des groupes
        leaveGroup: true, // quitter les discussions de groupe
        sendAttachment: true, // envoyer des pièces jointes/médias
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Actions disponibles">
    - **react** : ajouter/supprimer des réactions tapback (`messageId`, `emoji`, `remove`). L’ensemble natif de tapbacks d’iMessage est `love`, `like`, `dislike`, `laugh`, `emphasize` et `question`. Lorsqu’un agent choisit un emoji en dehors de cet ensemble (par exemple `👀`), l’outil de réaction revient à `love` afin que le tapback s’affiche quand même au lieu de faire échouer toute la requête. Les réactions d’accusé de réception configurées continuent à être validées strictement et produisent une erreur sur les valeurs inconnues.
    - **edit** : modifier un message envoyé (`messageId`, `text`).
    - **unsend** : annuler l’envoi d’un message (`messageId`).
    - **reply** : répondre à un message spécifique (`messageId`, `text`, `to`).
    - **sendWithEffect** : envoyer avec un effet iMessage (`text`, `to`, `effectId`).
    - **renameGroup** : renommer une discussion de groupe (`chatGuid`, `displayName`).
    - **setGroupIcon** : définir l’icône/photo d’une discussion de groupe (`chatGuid`, `media`) — instable sur macOS 26 Tahoe (l’API peut retourner un succès, mais l’icône ne se synchronise pas).
    - **addParticipant** : ajouter quelqu’un à un groupe (`chatGuid`, `address`).
    - **removeParticipant** : retirer quelqu’un d’un groupe (`chatGuid`, `address`).
    - **leaveGroup** : quitter une discussion de groupe (`chatGuid`).
    - **upload-file** : envoyer des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`).
      - Mémos vocaux : définissez `asVoice: true` avec de l’audio **MP3** ou **CAF** pour l’envoyer comme message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi de mémos vocaux.
    - Alias hérité : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.
  </Accordion>
</AccordionGroup>

### IDs de message (courts vs complets)

OpenClaw peut exposer des IDs de message _courts_ (par ex. `1`, `2`) pour économiser des tokens.

- `MessageSid` / `ReplyToId` peuvent être des IDs courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les IDs complets du fournisseur.
- Les IDs courts sont en mémoire ; ils peuvent expirer après un redémarrage ou une éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les IDs courts produiront une erreur s’ils ne sont plus disponibles.

Utilisez des IDs complets pour les automatisations durables et le stockage :

- Modèles : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les payloads entrants

Voir [Configuration](/fr/gateway/configuration) pour les variables de modèle.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusion des DM en envoi scindé (commande + URL dans une seule composition)

Lorsqu’un utilisateur saisit une commande et une URL ensemble dans iMessage — par exemple `Dump https://example.com/article` — Apple scinde l’envoi en **deux livraisons de Webhook distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG comme pièces jointes.

Les deux Webhooks arrivent à OpenClaw avec ~0,8 à 2,0 s d’écart sur la plupart des configurations. Sans fusion, l’agent reçoit la commande seule au tour 1, répond (souvent « envoie-moi l’URL »), et ne voit l’URL qu’au tour 2 — à ce moment-là, le contexte de la commande est déjà perdu.

`channels.bluebubbles.coalesceSameSenderDms` permet à un DM de fusionner des Webhooks consécutifs du même expéditeur en un seul tour agent. Les discussions de groupe continuent à être indexées par message afin de préserver la structure multi-utilisateur des tours.

<Tabs>
  <Tab title="Quand l’activer">
    Activez-le lorsque :

    - vous fournissez des Skills qui attendent `commande + payload` dans un seul message (dump, paste, save, queue, etc.) ;
    - vos utilisateurs collent des URL, images ou contenus longs en même temps que des commandes ;
    - vous pouvez accepter la latence supplémentaire des tours DM (voir ci-dessous).

    Laissez-le désactivé lorsque :

    - vous avez besoin d’une latence minimale des commandes pour les déclencheurs DM à mot unique ;
    - tous vos flux sont des commandes ponctuelles sans charge utile en suivi.

  </Tab>
  <Tab title="Activation">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // activation explicite (par défaut : false)
        },
      },
    }
    ```

    Avec ce drapeau activé et sans `messages.inbound.byChannel.bluebubbles` explicite, la fenêtre de debounce s’élargit à **2500 ms** (la valeur par défaut sans fusion est 500 ms). Cette fenêtre plus large est nécessaire — le rythme d’envoi scindé d’Apple de 0,8 à 2,0 s ne tient pas dans la valeur par défaut plus serrée.

    Pour ajuster vous-même la fenêtre :

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms fonctionne pour la plupart des configurations ; augmentez à 4000 ms si votre Mac est lent
            // ou sous pression mémoire (l’écart observé peut alors dépasser 2 s).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromis">
    - **Latence supplémentaire pour les commandes de contrôle DM.** Avec ce drapeau activé, les messages de commande de contrôle DM (comme `Dump`, `Save`, etc.) attendent désormais jusqu’à la fenêtre de debounce avant l’envoi, au cas où un Webhook de payload arriverait. Les commandes de discussion de groupe conservent un envoi instantané.
    - **La sortie fusionnée est limitée** — le texte fusionné est plafonné à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont plafonnées à 20 ; les entrées source sont plafonnées à 10 (le premier et le plus récent sont conservés au-delà de cette limite). Chaque `messageId` source atteint toujours la déduplication entrante, de sorte qu’une relecture ultérieure MessagePoller d’un événement individuel est reconnue comme un doublon.
    - **Activation explicite, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés.
  </Tab>
</Tabs>

### Scénarios et ce que l’agent voit

| L’utilisateur compose                                             | Apple livre              | Drapeau désactivé (par défaut)          | Drapeau activé + fenêtre de 2500 ms                                     |
| ----------------------------------------------------------------- | ------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un seul envoi)                        | 2 Webhooks à ~1 s d’écart | Deux tours agent : `Dump` seul, puis URL | Un tour : texte fusionné `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (pièce jointe + texte)            | 2 Webhooks               | Deux tours                              | Un tour : texte + image                                                 |
| `/status` (commande autonome)                                     | 1 Webhook                | Envoi instantané                        | **Attend jusqu’à la fenêtre, puis envoie**                              |
| URL collée seule                                                  | 1 Webhook                | Envoi instantané                        | Envoi instantané (une seule entrée dans le compartiment)                |
| Texte + URL envoyés comme deux messages distincts délibérés, à quelques minutes d’intervalle | 2 Webhooks hors fenêtre | Deux tours                              | Deux tours (la fenêtre expire entre les deux)                           |
| Rafale rapide (>10 petits DM dans la fenêtre)                     | N Webhooks               | N tours                                 | Un tour, sortie limitée (premier + plus récent, plafonds texte/pièces jointes appliqués) |

### Dépannage de la fusion des envois scindés

Si le drapeau est activé et que les envois scindés arrivent toujours en deux tours, vérifiez chaque couche :

<AccordionGroup>
  <Accordion title="Configuration réellement chargée">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Puis `openclaw gateway restart` — le drapeau est lu lors de la création du registre de debouncer.

  </Accordion>
  <Accordion title="Fenêtre de debounce assez large pour votre configuration">
    Consultez le journal du serveur BlueBubbles dans `~/Library/Logs/bluebubbles-server/main.log` :

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Mesurez l’écart entre l’envoi du texte de type `"Dump"` et l’envoi suivant de type `"https://..."; Attachments:`. Augmentez `messages.inbound.byChannel.bluebubbles` pour couvrir confortablement cet écart.

  </Accordion>
  <Accordion title="Les horodatages JSONL de session ≠ arrivée du Webhook">
    Les horodatages des événements de session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflètent le moment où la Gateway remet un message à l’agent, **pas** le moment où le Webhook est arrivé. Un second message en file d’attente marqué `[Queued messages while agent was busy]` signifie que le premier tour était encore en cours lorsque le second Webhook est arrivé — le compartiment de fusion avait déjà été vidé. Ajustez la fenêtre à partir du journal du serveur BB, pas du journal de session.
  </Accordion>
  <Accordion title="Pression mémoire ralentissant l’envoi des réponses">
    Sur les petites machines (8 Go), les tours d’agent peuvent être suffisamment longs pour que le compartiment de fusion se vide avant la fin de la réponse, et l’URL arrive alors comme un second tour mis en file d’attente. Vérifiez `memory_pressure` et `ps -o rss -p $(pgrep openclaw-gateway)` ; si la Gateway dépasse ~500 Mo de RSS et que le compresseur est actif, fermez les autres processus lourds ou passez à un hôte plus grand.
  </Accordion>
  <Accordion title="Les envois par citation-réponse suivent un autre chemin">
    Si l’utilisateur a touché `Dump` comme **réponse** à une bulle d’URL existante (iMessage affiche un badge « 1 Reply » sur la bulle Dump), l’URL se trouve dans `replyToBody`, pas dans un second Webhook. La fusion ne s’applique pas — c’est une question de Skill/prompt, pas de debouncer.
  </Accordion>
</AccordionGroup>

## Streaming par blocs

Contrôlez si les réponses sont envoyées comme un seul message ou diffusées par blocs :

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // activer le streaming par blocs (désactivé par défaut)
    },
  },
}
```

## Médias + limites

- Les pièces jointes entrantes sont téléchargées et stockées dans le cache média.
- Limite média via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 Mo).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connexion et Webhook">
    - `channels.bluebubbles.enabled` : activer/désactiver le canal.
    - `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
    - `channels.bluebubbles.password` : mot de passe de l’API.
    - `channels.bluebubbles.webhookPath` : chemin du point de terminaison du Webhook (par défaut : `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="Politique d’accès">
    - `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
    - `channels.bluebubbles.allowFrom` : liste d’autorisation DM (identifiants, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichit éventuellement les participants de groupe sans nom à partir des Contacts locaux après validation du filtrage. Par défaut : `false`.
    - `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).
  </Accordion>
  <Accordion title="Livraison et segmentation">
    - `channels.bluebubbles.sendReadReceipts` : envoyer des accusés de lecture (par défaut : `true`).
    - `channels.bluebubbles.blockStreaming` : activer le streaming par blocs (par défaut : `false` ; requis pour les réponses en streaming).
    - `channels.bluebubbles.textChunkLimit` : taille des segments sortants en caractères (par défaut : 4000).
    - `channels.bluebubbles.sendTimeoutMs` : délai d’attente par requête en ms pour les envois de texte sortants via `/api/v1/message/text` (par défaut : 30000). Augmentez cette valeur sur les configurations macOS 26 où les envois iMessage via la Private API peuvent se bloquer pendant 60+ secondes dans le framework iMessage ; par exemple `45000` ou `60000`. Les sondes, recherches de chat, réactions, modifications et vérifications d’état conservent actuellement le délai plus court par défaut de 10 s ; l’extension de cette couverture aux réactions et aux modifications est prévue dans un suivi. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode` : `length` (par défaut) ne segmente qu’en cas de dépassement de `textChunkLimit` ; `newline` segmente sur les lignes vides (limites de paragraphe) avant la segmentation par longueur.
  </Accordion>
  <Accordion title="Médias et historique">
    - `channels.bluebubbles.mediaMaxMb` : limite de taille des médias entrants/sortants en Mo (par défaut : 8).
    - `channels.bluebubbles.mediaLocalRoots` : liste d’autorisation explicite de répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois depuis des chemins locaux sont refusés par défaut tant que cela n’est pas configuré. Remplacement par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms` : fusionner des Webhooks DM consécutifs du même expéditeur en un seul tour agent afin que l’envoi scindé texte+URL d’Apple arrive comme un seul message (par défaut : `false`). Voir [Fusion des DM en envoi scindé](#coalescing-split-send-dms-command--url-in-one-composition) pour les scénarios, l’ajustement de la fenêtre et les compromis. Élargit la fenêtre de debounce entrante par défaut de 500 ms à 2500 ms lorsqu’elle est activée sans `messages.inbound.byChannel.bluebubbles` explicite.
    - `channels.bluebubbles.historyLimit` : nombre maximal de messages de groupe pour le contexte (0 désactive).
    - `channels.bluebubbles.dmHistoryLimit` : limite d’historique DM.
  </Accordion>
  <Accordion title="Actions et comptes">
    - `channels.bluebubbles.actions` : activer/désactiver des actions spécifiques.
    - `channels.bluebubbles.accounts` : configuration multi-comptes.
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
  - Si un identifiant direct n’a pas de chat DM existant, OpenClaw en créera un via `POST /api/v1/chat/new`. Cela nécessite que la BlueBubbles Private API soit activée.

### Routage iMessage vs SMS

Lorsque le même identifiant possède à la fois un chat iMessage et un chat SMS sur le Mac (par exemple un numéro de téléphone enregistré sur iMessage mais ayant aussi reçu des replis en bulle verte), OpenClaw préfère le chat iMessage et ne rétrograde jamais silencieusement vers SMS. Pour forcer le chat SMS, utilisez un préfixe de cible explicite `sms:` (par exemple `sms:+15555550123`). Les identifiants sans chat iMessage correspondant envoient quand même via le chat que BlueBubbles signale.

## Sécurité

- Les requêtes Webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez le mot de passe de l’API et le point de terminaison du Webhook secrets (traitez-les comme des identifiants sensibles).
- Il n’existe pas de contournement localhost pour l’authentification des Webhooks BlueBubbles. Si vous faites transiter le trafic Webhook via un proxy, conservez le mot de passe BlueBubbles de bout en bout dans la requête. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Voir [Sécurité de la Gateway](/fr/gateway/security#reverse-proxy-configuration).
- Activez HTTPS + des règles de pare-feu sur le serveur BlueBubbles si vous l’exposez en dehors de votre LAN.

## Résolution des problèmes

- Si les événements de saisie/lecture cessent de fonctionner, vérifiez les journaux de Webhook BlueBubbles et assurez-vous que le chemin de la Gateway correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’appairage expirent au bout d’une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent la BlueBubbles private API (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- La modification/l’annulation d’envoi nécessite macOS 13+ et une version compatible du serveur BlueBubbles. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements de la private API.
- Les mises à jour d’icône de groupe peuvent être instables sur macOS 26 (Tahoe) : l’API peut retourner un succès, mais la nouvelle icône ne se synchronise pas.
- OpenClaw masque automatiquement les actions connues comme cassées en fonction de la version macOS du serveur BlueBubbles. Si la modification apparaît encore sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` activé mais les envois scindés (par ex. `Dump` + URL) arrivent toujours en deux tours : consultez la checklist de [dépannage de la fusion des envois scindés](#split-send-coalescing-troubleshooting) — les causes courantes sont une fenêtre de debounce trop étroite, des horodatages de journal de session interprétés à tort comme l’arrivée du Webhook, ou un envoi par citation-réponse (qui utilise `replyToBody`, pas un second Webhook).
- Pour les informations d’état/santé : `openclaw status --all` ou `openclaw status --deep`.

Pour la référence générale sur le flux des canaux, voir [Canaux](/fr/channels) et le guide [Plugins](/fr/tools/plugin).

## Associé

- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

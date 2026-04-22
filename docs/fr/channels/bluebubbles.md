---
read_when:
    - Configuration du canal BlueBubbles
    - Résolution des problèmes d’appairage du Webhook
    - Configuration de iMessage sur macOS
summary: iMessage via le serveur macOS BlueBubbles (envoi/réception REST, saisie, réactions, appairage, actions avancées).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Statut : plugin intégré qui communique avec le serveur macOS BlueBubbles via HTTP. **Recommandé pour l’intégration iMessage** grâce à son API plus riche et à sa configuration plus simple par rapport à l’ancien canal imsg.

## Plugin intégré

Les versions actuelles d’OpenClaw intègrent BlueBubbles, donc les builds packagés normaux n’ont pas besoin d’une étape séparée `openclaw plugins install`.

## Vue d’ensemble

- Fonctionne sur macOS via l’application auxiliaire BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recommandé/testé : macOS Sequoia (15). macOS Tahoe (26) fonctionne ; la modification est actuellement cassée sur Tahoe, et les mises à jour d’icône de groupe peuvent signaler un succès sans se synchroniser.
- OpenClaw y accède via son API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Les messages entrants arrivent via des Webhooks ; les réponses sortantes, indicateurs de saisie, accusés de lecture et tapbacks sont des appels REST.
- Les pièces jointes et autocollants sont ingérés comme médias entrants (et transmis à l’agent lorsque c’est possible).
- L’appairage/la liste d’autorisation fonctionne de la même façon que pour les autres canaux (`/channels/pairing`, etc.) avec `channels.bluebubbles.allowFrom` + codes d’appairage.
- Les réactions sont exposées comme événements système, comme dans Slack/Telegram, afin que les agents puissent les « mentionner » avant de répondre.
- Fonctionnalités avancées : modification, annulation d’envoi, réponses en fil, effets de message, gestion des groupes.

## Démarrage rapide

1. Installez le serveur BlueBubbles sur votre Mac (suivez les instructions sur [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Dans la configuration BlueBubbles, activez l’API Web et définissez un mot de passe.
3. Exécutez `openclaw onboard` et sélectionnez BlueBubbles, ou configurez manuellement :

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

4. Dirigez les Webhooks BlueBubbles vers votre Gateway (exemple : `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Démarrez la Gateway ; elle enregistrera le gestionnaire de Webhook et lancera l’appairage.

Note de sécurité :

- Définissez toujours un mot de passe de Webhook.
- L’authentification du Webhook est toujours requise. OpenClaw rejette les requêtes de Webhook BlueBubbles sauf si elles incluent un mot de passe/guid correspondant à `channels.bluebubbles.password` (par exemple `?password=<password>` ou `x-password`), quelle que soit la topologie loopback/proxy.
- L’authentification par mot de passe est vérifiée avant la lecture/l’analyse complète des corps de Webhook.

## Garder Messages.app active (configurations VM / headless)

Certaines configurations de VM macOS / toujours actives peuvent amener Messages.app à devenir « inactive » (les événements entrants s’arrêtent jusqu’à ce que l’application soit ouverte/passe au premier plan). Une solution simple consiste à **solliciter Messages toutes les 5 minutes** à l’aide d’un AppleScript + LaunchAgent.

### 1) Enregistrer l’AppleScript

Enregistrez ceci sous :

- `~/Scripts/poke-messages.scpt`

Exemple de script (non interactif ; ne vole pas le focus) :

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

### 2) Installer un LaunchAgent

Enregistrez ceci sous :

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

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

Remarques :

- Cela s’exécute **toutes les 300 secondes** et **à la connexion**.
- La première exécution peut déclencher des demandes d’autorisation macOS **Automation** (`osascript` → Messages). Approuvez-les dans la même session utilisateur qui exécute le LaunchAgent.

Chargez-le :

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles est disponible dans l’onboarding interactif :

````
openclaw onboard
````

L’assistant demande :

- **URL du serveur** (obligatoire) : adresse du serveur BlueBubbles (par ex., `http://192.168.1.100:1234`)
- **Mot de passe** (obligatoire) : mot de passe d’API depuis les paramètres de BlueBubbles Server
- **Chemin du Webhook** (optionnel) : par défaut `/bluebubbles-webhook`
- **Politique DM** : appairage, liste d’autorisation, ouvert ou désactivé
- **Liste d’autorisation** : numéros de téléphone, e-mails ou cibles de chat

Vous pouvez également ajouter BlueBubbles via la CLI :

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Contrôle d’accès (DM + groupes)

DM :

- Par défaut : `channels.bluebubbles.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuvez via :
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- L’appairage est l’échange de jetons par défaut. Détails : [Appairage](/channels/pairing)

Groupes :

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.

### Enrichissement des noms de contacts (macOS, optionnel)

Les Webhooks de groupe BlueBubbles n’incluent souvent que les adresses brutes des participants. Si vous voulez que le contexte `GroupMembers` affiche à la place les noms de contacts locaux, vous pouvez activer l’enrichissement à partir des Contacts locaux sur macOS :

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` active la recherche. Par défaut : `false`.
- Les recherches ne s’exécutent qu’une fois que l’accès au groupe, l’autorisation des commandes et le filtrage des mentions ont permis le passage du message.
- Seuls les participants téléphone sans nom sont enrichis.
- Les numéros de téléphone bruts restent utilisés en secours lorsqu’aucune correspondance locale n’est trouvée.

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

BlueBubbles prend en charge le filtrage par mention pour les discussions de groupe, comme iMessage/WhatsApp :

- Utilise `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) pour détecter les mentions.
- Quand `requireMention` est activé pour un groupe, l’agent ne répond que lorsqu’il est mentionné.
- Les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage par mention.

Configuration par groupe :

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // valeur par défaut pour tous les groupes
        "iMessage;-;chat123": { requireMention: false }, // surcharge pour un groupe spécifique
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

Chaque entrée sous `channels.bluebubbles.groups.*` accepte une chaîne `systemPrompt` optionnelle. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe, afin que vous puissiez définir une personnalité ou des règles de comportement par groupe sans modifier les prompts de l’agent :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Gardez les réponses en dessous de 3 phrases. Reprenez le ton décontracté du groupe.",
        },
      },
    },
  },
}
```

La clé correspond à ce que BlueBubbles signale comme `chatGuid` / `chatIdentifier` / `chatId` numérique pour le groupe, et une entrée générique `"*"` fournit une valeur par défaut pour chaque groupe sans correspondance exacte (même modèle utilisé par `requireMention` et les politiques d’outils par groupe). Les correspondances exactes ont toujours la priorité sur le générique. Les DM ignorent ce champ ; utilisez plutôt une personnalisation du prompt au niveau de l’agent ou du compte.

#### Exemple concret : réponses en fil et réactions tapback (API privée)

Avec l’API privée BlueBubbles activée, les messages entrants arrivent avec des identifiants de message courts (par exemple `[[reply_to:5]]`) et l’agent peut appeler `action=reply` pour répondre dans un message spécifique ou `action=react` pour ajouter un tapback. Un `systemPrompt` par groupe est un moyen fiable pour amener l’agent à choisir le bon outil :

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Lorsque vous répondez dans ce groupe, appelez toujours action=reply avec le",
            "messageId [[reply_to:N]] du contexte afin que votre réponse soit liée",
            "au message déclencheur. N’envoyez jamais un nouveau message non lié.",
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

Les réactions tapback et les réponses en fil nécessitent toutes deux l’API privée BlueBubbles ; voir [Actions avancées](#advanced-actions) et [Identifiants de message](#message-ids-short-vs-full) pour les mécanismes sous-jacents.

## Liaisons de conversation ACP

Les conversations BlueBubbles peuvent être transformées en espaces de travail ACP durables sans modifier la couche de transport.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans la DM ou le chat de groupe autorisé.
- Les futurs messages dans cette même conversation BlueBubbles sont acheminés vers la session ACP créée.
- `/new` et `/reset` réinitialisent en place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont également prises en charge via des entrées `bindings[]` de niveau supérieur avec `type: "acp"` et `match.channel: "bluebubbles"`.

`match.peer.id` peut utiliser n’importe quel format de cible BlueBubbles pris en charge :

- identifiant DM normalisé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Pour des liaisons de groupe stables, préférez `chat_id:*` ou `chat_identifier:*`.

Exemple :

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

- **Indicateurs de saisie** : envoyés automatiquement avant et pendant la génération de la réponse.
- **Accusés de lecture** : contrôlés par `channels.bluebubbles.sendReadReceipts` (par défaut : `true`).
- **Indicateurs de saisie** : OpenClaw envoie des événements de début de saisie ; BlueBubbles efface automatiquement l’état de saisie à l’envoi ou après expiration (l’arrêt manuel via DELETE n’est pas fiable).

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

BlueBubbles prend en charge des actions de message avancées lorsqu’elles sont activées dans la configuration :

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (par défaut : true)
        edit: true, // modifier les messages envoyés (macOS 13+, cassé sur macOS 26 Tahoe)
        unsend: true, // annuler l’envoi de messages (macOS 13+)
        reply: true, // réponses en fil par GUID de message
        sendWithEffect: true, // effets de message (slam, loud, etc.)
        renameGroup: true, // renommer les discussions de groupe
        setGroupIcon: true, // définir l’icône/photo de la discussion de groupe (instable sur macOS 26 Tahoe)
        addParticipant: true, // ajouter des participants aux groupes
        removeParticipant: true, // retirer des participants des groupes
        leaveGroup: true, // quitter les discussions de groupe
        sendAttachment: true, // envoyer des pièces jointes/médias
      },
    },
  },
}
```

Actions disponibles :

- **react** : ajouter/supprimer des réactions tapback (`messageId`, `emoji`, `remove`). L’ensemble natif de tapbacks d’iMessage est `love`, `like`, `dislike`, `laugh`, `emphasize` et `question`. Lorsqu’un agent choisit un emoji hors de cet ensemble (par exemple `👀`), l’outil de réaction bascule sur `love` afin que le tapback s’affiche quand même au lieu de faire échouer toute la requête. Les réactions d’accusé de réception configurées restent strictement validées et renvoient une erreur sur les valeurs inconnues.
- **edit** : modifier un message envoyé (`messageId`, `text`)
- **unsend** : annuler l’envoi d’un message (`messageId`)
- **reply** : répondre à un message spécifique (`messageId`, `text`, `to`)
- **sendWithEffect** : envoyer avec un effet iMessage (`text`, `to`, `effectId`)
- **renameGroup** : renommer une discussion de groupe (`chatGuid`, `displayName`)
- **setGroupIcon** : définir l’icône/photo d’une discussion de groupe (`chatGuid`, `media`) — instable sur macOS 26 Tahoe (l’API peut renvoyer un succès mais l’icône ne se synchronise pas).
- **addParticipant** : ajouter quelqu’un à un groupe (`chatGuid`, `address`)
- **removeParticipant** : retirer quelqu’un d’un groupe (`chatGuid`, `address`)
- **leaveGroup** : quitter une discussion de groupe (`chatGuid`)
- **upload-file** : envoyer des médias/fichiers (`to`, `buffer`, `filename`, `asVoice`)
  - Mémos vocaux : définissez `asVoice: true` avec un audio **MP3** ou **CAF** pour l’envoyer comme message vocal iMessage. BlueBubbles convertit MP3 → CAF lors de l’envoi des mémos vocaux.
- Alias hérité : `sendAttachment` fonctionne toujours, mais `upload-file` est le nom d’action canonique.

### Identifiants de message (courts vs complets)

OpenClaw peut exposer des identifiants de message _courts_ (par ex. `1`, `2`) pour économiser des tokens.

- `MessageSid` / `ReplyToId` peuvent être des identifiants courts.
- `MessageSidFull` / `ReplyToIdFull` contiennent les identifiants complets du fournisseur.
- Les identifiants courts sont en mémoire ; ils peuvent expirer après un redémarrage ou une éviction du cache.
- Les actions acceptent un `messageId` court ou complet, mais les identifiants courts renverront une erreur s’ils ne sont plus disponibles.

Utilisez les identifiants complets pour les automatisations durables et le stockage :

- Modèles : `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexte : `MessageSidFull` / `ReplyToIdFull` dans les charges utiles entrantes

Voir [Configuration](/fr/gateway/configuration) pour les variables de modèle.

## Coalescence des DM envoyés en plusieurs parties (commande + URL dans une seule composition)

Quand un utilisateur saisit une commande et une URL ensemble dans iMessage — par ex. `Dump https://example.com/article` — Apple découpe l’envoi en **deux livraisons de Webhook distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG en pièces jointes.

Les deux Webhooks arrivent dans OpenClaw avec un écart d’environ 0,8 à 2,0 s sur la plupart des configurations. Sans coalescence, l’agent reçoit uniquement la commande au tour 1, répond (souvent « envoie-moi l’URL »), et ne voit l’URL qu’au tour 2 — moment où le contexte de la commande est déjà perdu.

`channels.bluebubbles.coalesceSameSenderDms` permet à un DM de fusionner des Webhooks consécutifs d’un même expéditeur en un seul tour agent. Les discussions de groupe continuent à être indexées par message afin de préserver la structure des tours multi-utilisateurs.

### Quand l’activer

Activez-le lorsque :

- Vous fournissez des Skills qui attendent `commande + charge utile` dans un seul message (dump, paste, save, queue, etc.).
- Vos utilisateurs collent des URL, images ou contenus longs en même temps que des commandes.
- Vous pouvez accepter la latence supplémentaire sur les tours DM (voir ci-dessous).

Laissez-le désactivé lorsque :

- Vous avez besoin d’une latence minimale pour les déclencheurs DM à mot unique.
- Tous vos flux sont des commandes ponctuelles sans charge utile de suivi.

### Activation

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // opt-in (par défaut : false)
    },
  },
}
```

Avec cet indicateur activé et sans `messages.inbound.byChannel.bluebubbles` explicite, la fenêtre d’anti-rebond s’élargit à **2500 ms** (la valeur par défaut sans coalescence est de 500 ms). Cette fenêtre plus large est nécessaire — la cadence de découpage d’envoi d’Apple de 0,8 à 2,0 s n’entre pas dans la valeur par défaut plus serrée.

Pour ajuster vous-même la fenêtre :

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms fonctionne sur la plupart des configurations ; augmentez à 4000 ms si votre Mac est lent
        // ou sous pression mémoire (l’écart observé peut alors dépasser 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compromis

- **Latence supplémentaire pour les commandes de contrôle en DM.** Avec l’indicateur activé, les messages de commande de contrôle en DM (comme `Dump`, `Save`, etc.) attendent désormais jusqu’à la fenêtre d’anti-rebond avant l’envoi, au cas où un Webhook de charge utile arriverait. Les commandes de discussion de groupe restent envoyées instantanément.
- **La sortie fusionnée est bornée** — le texte fusionné est plafonné à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont plafonnées à 20 ; les entrées source sont plafonnées à 10 (la première et la plus récente sont conservées au-delà de cette limite). Chaque `messageId` source passe toujours par la déduplication entrante, de sorte qu’une relecture ultérieure par MessagePoller d’un événement individuel est reconnue comme un doublon.
- **Opt-in, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés.

### Scénarios et ce que voit l’agent

| L’utilisateur compose                                              | Apple livre              | Indicateur désactivé (par défaut)       | Indicateur activé + fenêtre de 2500 ms                                  |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un seul envoi)                         | 2 Webhooks à ~1 s d’écart | Deux tours agent : « Dump » seul, puis URL | Un tour : texte fusionné `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 Webhooks               | Deux tours                              | Un tour : texte + image                                                 |
| `/status` (commande autonome)                                      | 1 Webhook                | Envoi instantané                        | **Attend jusqu’à la fenêtre, puis envoie**                              |
| URL collée seule                                                   | 1 Webhook                | Envoi instantané                        | Envoi instantané (une seule entrée dans le compartiment)                |
| Texte + URL envoyés comme deux messages séparés délibérés, à quelques minutes d’intervalle | 2 Webhooks hors fenêtre | Deux tours                              | Deux tours (la fenêtre expire entre les deux)                           |
| Rafale rapide (>10 petits DM dans la fenêtre)                      | N Webhooks               | N tours                                 | Un tour, sortie bornée (premier + plus récent, plafonds texte/pièces jointes appliqués) |

### Résolution des problèmes de coalescence des envois découpés

Si l’indicateur est activé et que les envois découpés arrivent toujours comme deux tours, vérifiez chaque couche :

1. **Configuration réellement chargée.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Puis `openclaw gateway restart` — l’indicateur est lu lors de la création du registre d’anti-rebond.

2. **Fenêtre d’anti-rebond suffisamment large pour votre configuration.** Consultez le journal du serveur BlueBubbles dans `~/Library/Logs/bluebubbles-server/main.log` :

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Mesurez l’écart entre l’envoi du texte de type `"Dump"` et l’envoi suivant de `"https://..."; Attachments:`. Augmentez `messages.inbound.byChannel.bluebubbles` pour couvrir confortablement cet écart.

3. **Les horodatages JSONL de session ≠ arrivée du Webhook.** Les horodatages des événements de session (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflètent le moment où la Gateway transmet un message à l’agent, **pas** le moment où le Webhook est arrivé. Un second message en file d’attente marqué `[Queued messages while agent was busy]` signifie que le premier tour était encore en cours lorsque le deuxième Webhook est arrivé — le compartiment de coalescence avait déjà été vidé. Ajustez la fenêtre à partir du journal du serveur BB, pas du journal de session.

4. **La pression mémoire ralentit l’envoi des réponses.** Sur les petites machines (8 Go), les tours agent peuvent prendre suffisamment de temps pour que le compartiment de coalescence se vide avant la fin de la réponse, et l’URL arrive alors comme un deuxième tour en file d’attente. Vérifiez `memory_pressure` et `ps -o rss -p $(pgrep openclaw-gateway)` ; si la Gateway dépasse ~500 Mo de RSS et que le compresseur est actif, fermez les autres processus gourmands ou passez à un hôte plus puissant.

5. **Les envois par citation-réponse suivent un autre chemin.** Si l’utilisateur a tapé `Dump` comme **réponse** à une bulle d’URL existante (iMessage affiche un badge « 1 Reply » sur la bulle Dump), l’URL se trouve dans `replyToBody`, pas dans un second Webhook. La coalescence ne s’applique pas — c’est un sujet de Skill/prompt, pas de debouncer.

## Streaming par blocs

Contrôlez si les réponses sont envoyées comme un seul message ou diffusées par blocs :

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
- Limite média via `channels.bluebubbles.mediaMaxMb` pour les médias entrants et sortants (par défaut : 8 Mo).
- Le texte sortant est découpé selon `channels.bluebubbles.textChunkLimit` (par défaut : 4000 caractères).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.bluebubbles.enabled` : activer/désactiver le canal.
- `channels.bluebubbles.serverUrl` : URL de base de l’API REST BlueBubbles.
- `channels.bluebubbles.password` : mot de passe d’API.
- `channels.bluebubbles.webhookPath` : chemin du point de terminaison Webhook (par défaut : `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : `pairing`).
- `channels.bluebubbles.allowFrom` : liste d’autorisation DM (identifiants, e-mails, numéros E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy` : `open | allowlist | disabled` (par défaut : `allowlist`).
- `channels.bluebubbles.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts` : sur macOS, enrichit éventuellement les participants de groupe sans nom à partir des Contacts locaux après le passage du filtrage. Par défaut : `false`.
- `channels.bluebubbles.groups` : configuration par groupe (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts` : envoyer des accusés de lecture (par défaut : `true`).
- `channels.bluebubbles.blockStreaming` : activer le streaming par blocs (par défaut : `false` ; requis pour les réponses en streaming).
- `channels.bluebubbles.textChunkLimit` : taille des segments sortants en caractères (par défaut : 4000).
- `channels.bluebubbles.sendTimeoutMs` : délai d’expiration par requête en ms pour les envois de texte sortants via `/api/v1/message/text` (par défaut : 30000). Augmentez cette valeur sur les configurations macOS 26 où les envois iMessage via l’API privée peuvent se bloquer pendant plus de 60 secondes dans le framework iMessage ; par exemple `45000` ou `60000`. Les sondes, recherches de chats, réactions, modifications et contrôles d’état conservent actuellement le délai plus court par défaut de 10 s ; l’élargissement de cette couverture aux réactions et aux modifications est prévu en suivi. Surcharge par compte : `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode` : `length` (par défaut) découpe uniquement lorsque `textChunkLimit` est dépassé ; `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.bluebubbles.mediaMaxMb` : limite des médias entrants/sortants en Mo (par défaut : 8).
- `channels.bluebubbles.mediaLocalRoots` : liste d’autorisation explicite de répertoires locaux absolus autorisés pour les chemins de médias locaux sortants. Les envois de chemins locaux sont refusés par défaut sauf si ce paramètre est configuré. Surcharge par compte : `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms` : fusionne les Webhooks DM consécutifs d’un même expéditeur en un seul tour agent afin que le découpage texte+URL d’Apple arrive comme un seul message (par défaut : `false`). Voir [Coalescence des DM envoyés en plusieurs parties](#coalescing-split-send-dms-command--url-in-one-composition) pour les scénarios, le réglage de la fenêtre et les compromis. Élargit la fenêtre d’anti-rebond entrante par défaut de 500 ms à 2500 ms lorsqu’elle est activée sans `messages.inbound.byChannel.bluebubbles` explicite.
- `channels.bluebubbles.historyLimit` : nombre maximal de messages de groupe pour le contexte (0 désactive).
- `channels.bluebubbles.dmHistoryLimit` : limite d’historique DM.
- `channels.bluebubbles.actions` : activer/désactiver des actions spécifiques.
- `channels.bluebubbles.accounts` : configuration multi-comptes.

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adressage / cibles de distribution

Préférez `chat_guid` pour un routage stable :

- `chat_guid:iMessage;-;+15555550123` (préféré pour les groupes)
- `chat_id:123`
- `chat_identifier:...`
- Identifiants directs : `+15555550123`, `user@example.com`
  - Si un identifiant direct n’a pas de chat DM existant, OpenClaw en créera un via `POST /api/v1/chat/new`. Cela nécessite que l’API privée BlueBubbles soit activée.

### Routage iMessage vs SMS

Quand le même identifiant dispose à la fois d’un chat iMessage et d’un chat SMS sur le Mac (par exemple un numéro de téléphone enregistré sur iMessage mais ayant aussi reçu des replis en bulle verte), OpenClaw privilégie le chat iMessage et ne rétrograde jamais silencieusement vers SMS. Pour forcer le chat SMS, utilisez un préfixe de cible explicite `sms:` (par exemple `sms:+15555550123`). Les identifiants sans chat iMessage correspondant envoient tout de même via le chat signalé par BlueBubbles.

## Sécurité

- Les requêtes Webhook sont authentifiées en comparant les paramètres de requête ou en-têtes `guid`/`password` à `channels.bluebubbles.password`.
- Gardez le mot de passe d’API et le point de terminaison Webhook secrets (traitez-les comme des identifiants).
- Il n’existe aucun contournement localhost pour l’authentification des Webhooks BlueBubbles. Si vous proxifiez le trafic Webhook, conservez le mot de passe BlueBubbles dans la requête de bout en bout. `gateway.trustedProxies` ne remplace pas `channels.bluebubbles.password` ici. Voir [Sécurité de la Gateway](/fr/gateway/security#reverse-proxy-configuration).
- Activez HTTPS + règles de pare-feu sur le serveur BlueBubbles si vous l’exposez en dehors de votre LAN.

## Résolution des problèmes

- Si les événements de saisie/lecture cessent de fonctionner, consultez les journaux Webhook BlueBubbles et vérifiez que le chemin de la Gateway correspond à `channels.bluebubbles.webhookPath`.
- Les codes d’appairage expirent après une heure ; utilisez `openclaw pairing list bluebubbles` et `openclaw pairing approve bluebubbles <code>`.
- Les réactions nécessitent l’API privée BlueBubbles (`POST /api/v1/message/react`) ; assurez-vous que la version du serveur l’expose.
- La modification/l’annulation d’envoi nécessite macOS 13+ et une version de serveur BlueBubbles compatible. Sur macOS 26 (Tahoe), la modification est actuellement cassée en raison de changements dans l’API privée.
- Les mises à jour d’icône de groupe peuvent être instables sur macOS 26 (Tahoe) : l’API peut renvoyer un succès mais la nouvelle icône ne se synchronise pas.
- OpenClaw masque automatiquement les actions connues comme cassées en fonction de la version macOS du serveur BlueBubbles. Si la modification apparaît toujours sur macOS 26 (Tahoe), désactivez-la manuellement avec `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` est activé mais les envois découpés (par ex. `Dump` + URL) arrivent toujours comme deux tours : consultez la checklist [résolution des problèmes de coalescence des envois découpés](#split-send-coalescing-troubleshooting) — les causes fréquentes sont une fenêtre d’anti-rebond trop courte, des horodatages de journal de session interprétés à tort comme l’arrivée du Webhook, ou un envoi par citation-réponse (qui utilise `replyToBody`, pas un deuxième Webhook).
- Pour les informations d’état/santé : `openclaw status --all` ou `openclaw status --deep`.

Pour la documentation générale sur les flux de canaux, voir [Canaux](/fr/channels) et le guide [Plugins](/fr/tools/plugin).

## Lié

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous devez configurer le webhook LINE et les identifiants d’accès
    - Vous souhaitez des options de message propres à LINE
summary: Configuration, paramétrage et utilisation du plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-16T13:03:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via l’API LINE Messaging. Le plugin s’exécute comme récepteur de Webhook
sur le Gateway et utilise votre jeton d’accès au canal ainsi que votre secret de canal pour
l’authentification.

État : plugin officiel, installé séparément. Les messages directs, les discussions de groupe, les médias,
les emplacements, les messages Flex, les messages modèles et les réponses rapides sont pris en charge.
Les réactions et les fils de discussion ne sont pas pris en charge.

## Installation

Installez LINE avant de configurer le canal :

```bash
openclaw plugins install @openclaw/line
```

Copie locale (en cas d’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration initiale

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou sélectionnez) un Provider et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de Messaging API.
5. Définissez l’URL du Webhook sur le point de terminaison de votre Gateway (HTTPS requis) :

```text
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification du Webhook de LINE (GET) et accuse réception des événements
entrants signés (POST) immédiatement après la validation de la signature et de la charge utile ; le traitement
par l’agent se poursuit de manière asynchrone.
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Remarques de sécurité :

- La vérification de la signature LINE dépend du corps (HMAC calculé sur le corps brut) ; OpenClaw applique donc une limite stricte du corps avant authentification (64 KB) et un délai d’expiration de lecture avant la vérification.
- OpenClaw traite les événements du Webhook à partir des octets bruts de la requête vérifiée. Les valeurs `req.body` transformées par un middleware en amont sont ignorées afin de préserver l’intégrité de la signature.

## Configuration

Configuration minimale :

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Configuration des messages directs publics :

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Variables d’environnement (compte par défaut uniquement) :

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Fichiers de jeton et de secret :

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` et `secretFile` doivent pointer vers des fichiers ordinaires. Les liens symboliques sont refusés.
Les valeurs de configuration en ligne ont priorité sur les fichiers ; les variables d’environnement constituent le dernier recours pour le compte par défaut.

Plusieurs comptes :

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Contrôle d’accès

Par défaut, les messages directs nécessitent un appairage. Les expéditeurs inconnus reçoivent un code d’appairage et leurs
messages sont ignorés jusqu’à leur approbation :

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : `pairing`)
- `channels.line.allowFrom` : identifiants utilisateur LINE autorisés pour les messages directs ; `dmPolicy: "open"` nécessite `["*"]`
- `channels.line.groupPolicy` : `allowlist | open | disabled` (valeur par défaut : `allowlist`)
- `channels.line.groupAllowFrom` : identifiants utilisateur LINE autorisés pour les groupes ; les entrées `allowFrom` des messages directs n’autorisent pas les expéditeurs de groupe
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom` (ainsi que `enabled`, `requireMention`, `systemPrompt`, `skills`). Avec
  `groupPolicy: "allowlist"`, définissez `groupAllowFrom` ou la valeur `allowFrom` propre au groupe ; une liste d’autorisation de groupe vide bloque les messages de groupe même lorsque les messages directs sont ouverts.
- Les groupes d’accès statiques d’expéditeurs peuvent être référencés depuis `allowFrom`, `groupAllowFrom` et la valeur `allowFrom` propre au groupe avec `accessGroup:<name>` ; consultez [Groupes d’accès](/fr/channels/access-groups).
- Remarque sur l’exécution : si `channels.line` est entièrement absent, l’exécution utilise `groupPolicy="allowlist"` comme solution de repli pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les identifiants LINE sont sensibles à la casse. Les identifiants valides se présentent comme suit :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en segments de 5000 caractères.
- La mise en forme Markdown est supprimée ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque cela est possible.
- Les réponses diffusées en continu sont mises en mémoire tampon ; LINE reçoit des segments complets avec une animation
  de chargement pendant que l’agent travaille.
- La taille des téléchargements de médias est limitée par `channels.line.mediaMaxMb` (valeur par défaut : 10).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d’être transmis
  à l’agent, conformément au stockage de médias partagé utilisé par les autres plugins de canal.

## Données du canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages
modèles.

```json5
{
  text: "Voici",
  channelData: {
    line: {
      quickReplies: ["État", "Aide"],
      location: {
        title: "Bureau",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Carte d’état",
        contents: {/* Charge utile Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "Continuer ?",
        confirmLabel: "Oui",
        confirmData: "yes",
        cancelLabel: "Non",
        cancelData: "no",
      },
    },
  },
}
```

Le plugin LINE fournit également une commande `/card` pour les préréglages de messages Flex :

```text
/card info "Bienvenue" "Merci de nous avoir rejoints !"
```

## Prise en charge d’ACP

LINE prend en charge les liaisons de conversations ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [Agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le plugin LINE envoie des images, des vidéos et du contenu audio par l’intermédiaire de l’outil de messagerie de l’agent :

- **Images** : envoyées sous forme de messages image LINE ; l’image d’aperçu utilise par défaut l’URL du média.
- **Vidéos** : nécessitent une image d’aperçu ; définissez `channelData.line.previewImageUrl` sur une URL d’image.
- **Audio** : envoyé sous forme de messages audio LINE ; la durée est de 60 secondes par défaut, sauf si `channelData.line.durationMs` est défini.

Le type de média provient de `channelData.line.mediaKind` lorsqu’il est défini ; sinon, il est déduit
des autres options LINE ou du suffixe de fichier de l’URL, avec le type image comme solution de repli.

Les URL de médias sortants doivent être des URL HTTPS publiques de 2000 caractères au maximum. OpenClaw
valide le nom d’hôte cible avant de transmettre l’URL à LINE et refuse les cibles en boucle locale,
locales au lien et appartenant à un réseau privé.

Les envois de médias génériques sans options propres à LINE utilisent la voie des images.

## Dépannage

- **Échec de la vérification du Webhook :** vérifiez que l’URL du Webhook utilise HTTPS et que
  `channelSecret` correspond à la Console LINE.
- **Aucun événement entrant :** vérifiez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que le Gateway est accessible depuis LINE.
- **Erreurs de téléchargement des médias :** augmentez `channels.line.mediaMaxMb` si les médias dépassent la
  limite par défaut.

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et processus d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité

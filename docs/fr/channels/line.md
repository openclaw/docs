---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous devez configurer le Webhook LINE et les identifiants d’accès
    - Vous souhaitez des options de message propres à LINE
summary: Configuration, paramétrage et utilisation du Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T02:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via l’API LINE Messaging. Le plugin s’exécute comme récepteur de Webhook
sur le Gateway et utilise votre jeton d’accès au canal ainsi que le secret du canal pour
l’authentification.

Statut : plugin officiel, installé séparément. Les messages directs, les discussions de groupe, les médias,
les emplacements, les messages Flex, les messages modèles et les réponses rapides sont pris en charge.
Les réactions et les fils de discussion ne sont pas pris en charge.

## Installation

Installez LINE avant de configurer le canal :

```bash
openclaw plugins install @openclaw/line
```

Dépôt local (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration initiale

1. Créez un compte LINE Developers et ouvrez la console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un fournisseur et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de Messaging API.
5. Définissez l’URL du Webhook sur le point de terminaison de votre Gateway (HTTPS requis) :

```text
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification du Webhook de LINE (GET) et accuse immédiatement réception des
événements entrants signés (POST) après validation de la signature et de la charge utile ; le traitement
par l’agent se poursuit de manière asynchrone.
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath`, puis mettez à jour l’URL en conséquence.

Remarques de sécurité :

- La vérification de la signature LINE dépend du corps de la requête (HMAC calculé sur le corps brut). OpenClaw applique donc une limite stricte de 64 Ko au corps avant authentification ainsi qu’un délai maximal de lecture avant la vérification.
- OpenClaw traite les événements du Webhook à partir des octets bruts vérifiés de la requête. Les valeurs `req.body` transformées par un intergiciel en amont sont ignorées afin de préserver l’intégrité de la signature.

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

`tokenFile` et `secretFile` doivent désigner des fichiers ordinaires. Les liens symboliques sont refusés.
Les valeurs de configuration intégrées sont prioritaires sur les fichiers ; les variables d’environnement constituent le dernier recours pour le compte par défaut.

Comptes multiples :

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

Listes d’autorisation et stratégies :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled` (`pairing` par défaut)
- `channels.line.allowFrom` : identifiants utilisateur LINE autorisés pour les messages directs ; `dmPolicy: "open"` nécessite `["*"]`
- `channels.line.groupPolicy` : `allowlist | open | disabled` (`allowlist` par défaut)
- `channels.line.groupAllowFrom` : identifiants utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom` (ainsi que `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Les groupes statiques d’accès des expéditeurs peuvent être référencés depuis `allowFrom`, `groupAllowFrom` et la propriété `allowFrom` propre à chaque groupe avec `accessGroup:<name>` ; consultez [Groupes d’accès](/fr/channels/access-groups).
- Remarque sur l’exécution : si `channels.line` est totalement absent, l’exécution utilise par défaut `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les identifiants LINE sont sensibles à la casse. Les identifiants valides se présentent comme suit :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en segments de 5 000 caractères.
- La mise en forme Markdown est supprimée ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque cela est possible.
- Les réponses diffusées en continu sont mises en mémoire tampon ; LINE reçoit des segments complets avec une animation
  de chargement pendant que l’agent travaille.
- La taille des téléchargements de médias est limitée par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d’être transmis
  à l’agent, conformément au stockage de médias partagé utilisé par les autres plugins de canal.

## Données du canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages
modèles.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {/* Flex payload */},
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Le plugin LINE fournit également une commande `/card` pour les préréglages de messages Flex :

```text
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge d’ACP

LINE prend en charge les liaisons de conversation ACP (protocole de communication entre agents) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [Agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le plugin LINE envoie des images, des vidéos et du contenu audio au moyen de l’outil de messagerie de l’agent :

- **Images** : envoyées sous forme de messages image LINE ; l’image d’aperçu utilise par défaut l’URL du média.
- **Vidéos** : nécessitent une image d’aperçu ; définissez `channelData.line.previewImageUrl` sur l’URL d’une image.
- **Audio** : envoyé sous forme de messages audio LINE ; la durée est de 60 secondes par défaut, sauf si `channelData.line.durationMs` est défini.

Le type de média provient de `channelData.line.mediaKind` lorsqu’il est défini ; sinon, il est déduit
des autres options LINE ou du suffixe de fichier de l’URL, avec le type image comme solution de repli.

Les URL des médias sortants doivent être des URL HTTPS publiques de 2 000 caractères au maximum. OpenClaw
valide le nom d’hôte cible avant de transmettre l’URL à LINE et refuse les cibles de bouclage local,
les adresses locales au lien et les réseaux privés.

Les envois de médias génériques sans options propres à LINE utilisent la voie des images.

## Dépannage

- **Échec de la vérification du Webhook :** assurez-vous que l’URL du Webhook utilise HTTPS et que
  `channelSecret` correspond à celui de la console LINE.
- **Aucun événement entrant :** vérifiez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que le Gateway est accessible depuis LINE.
- **Erreurs de téléchargement des médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la
  limite par défaut.

## Voir aussi

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et processus d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité

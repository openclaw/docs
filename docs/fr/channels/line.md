---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous avez besoin de configurer le Webhook LINE et les identifiants
    - Vous souhaitez utiliser des options de message spécifiques à LINE
summary: Configuration, config et utilisation du Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE se connecte à OpenClaw via la LINE Messaging API. Le Plugin fonctionne comme un récepteur de Webhook
sur la Gateway et utilise votre jeton d’accès au canal + le secret du canal pour
l’authentification.

Statut : Plugin inclus. Les messages directs, les discussions de groupe, les médias, les emplacements, les messages Flex,
les messages de modèle et les réponses rapides sont pris en charge. Les réactions et les fils
ne sont pas pris en charge.

## Plugin inclus

LINE est fourni comme Plugin inclus dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut LINE, installez-le
manuellement :

```bash
openclaw plugins install @openclaw/line
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un Provider et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de la Messaging API.
5. Définissez l’URL du Webhook sur votre point de terminaison Gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

La Gateway répond à la vérification de Webhook de LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps de la requête (HMAC sur le corps brut), donc OpenClaw applique avant l’authentification des limites strictes sur le corps et un délai d’expiration avant la vérification.
- OpenClaw traite les événements de Webhook à partir des octets bruts de la requête vérifiée. Les valeurs `req.body` transformées par un middleware en amont sont ignorées pour préserver l’intégrité de la signature.

## Configurer

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

Variables d’environnement (compte par défaut uniquement) :

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Fichiers de jeton/secret :

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

`tokenFile` et `secretFile` doivent pointer vers des fichiers ordinaires. Les liens symboliques sont rejetés.

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

Les messages directs utilisent par défaut l’appairage. Les expéditeurs inconnus reçoivent un code d’appairage et leurs
messages sont ignorés jusqu’à leur approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: identifiants utilisateur LINE autorisés pour les messages directs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: identifiants utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Note d’exécution : si `channels.line` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les identifiants LINE sont sensibles à la casse. Les identifiants valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salle : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en blocs de 5000 caractères.
- Le formatage Markdown est supprimé ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque c’est possible.
- Les réponses en streaming sont mises en mémoire tampon ; LINE reçoit des blocs complets avec une animation
  de chargement pendant que l’agent travaille.
- Les téléchargements de médias sont limités par `channels.line.mediaMaxMb` (10 par défaut).

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages
de modèle.

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
        contents: {
          /* Flex payload */
        },
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

Le Plugin LINE fournit également une commande `/card` pour les préréglages de messages Flex :

```
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge d’ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [ACP agents](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le Plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de message de l’agent. Les médias sont envoyés via le chemin de distribution spécifique à LINE avec une gestion appropriée des aperçus et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyés comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d’hôte cible avant de transmettre l’URL à LINE et rejette les cibles loopback, link-local et réseau privé.

Les envois de médias génériques reviennent au chemin existant limité aux images lorsqu’un chemin spécifique à LINE n’est pas disponible.

## Dépannage

- **La vérification du Webhook échoue :** assurez-vous que l’URL du Webhook est en HTTPS et que
  `channelSecret` correspond à celui de la console LINE.
- **Aucun événement entrant :** confirmez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que la Gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si les médias dépassent la
  limite par défaut.

## Liens associés

- [Channels Overview](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification des messages directs et flux d’appairage
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et contrôle des mentions
- [Channel Routing](/fr/channels/channel-routing) — routage de session pour les messages
- [Security](/fr/gateway/security) — modèle d’accès et durcissement

---
read_when:
    - Vous voulez connecter OpenClaw à LINE
    - Vous devez configurer le Webhook LINE et les identifiants
    - Vous souhaitez des options de message spécifiques à LINE
summary: Installation, configuration et utilisation du Plugin LINE Messaging API
title: LIGNE
x-i18n:
    generated_at: "2026-05-06T07:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via l’API LINE Messaging. Le plugin s’exécute comme récepteur Webhook
sur le gateway et utilise votre jeton d’accès au canal + secret du canal pour
l’authentification.

État : plugin téléchargeable. Les messages directs, discussions de groupe, médias, positions, messages Flex,
messages modèles et réponses rapides sont pris en charge. Les réactions et les fils de discussion
ne sont pas pris en charge.

## Installer

Installez LINE avant de configurer le canal :

```bash
openclaw plugins install @openclaw/line
```

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un Provider et ajoutez un canal **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres de Messaging API.
5. Définissez l’URL du Webhook sur le point de terminaison de votre gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

Le gateway répond à la vérification Webhook de LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps (HMAC sur le corps brut), donc OpenClaw applique des limites strictes de corps avant authentification et un délai d’expiration avant la vérification.
- OpenClaw traite les événements Webhook à partir des octets bruts vérifiés de la requête. Les valeurs `req.body` transformées par un middleware en amont sont ignorées pour préserver l’intégrité de la signature.

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

Configuration DM publique :

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

Les messages directs utilisent l’association par défaut. Les expéditeurs inconnus reçoivent un code d’association et leurs
messages sont ignorés jusqu’à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utilisateur LINE autorisés pour les DM ; `dmPolicy: "open"` nécessite `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Note d’exécution : si `channels.line` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les ID LINE sont sensibles à la casse. Les ID valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en blocs de 5000 caractères.
- Le formatage Markdown est supprimé ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque c’est possible.
- Les réponses en streaming sont mises en tampon ; LINE reçoit des blocs complets avec une animation
  de chargement pendant que l’agent travaille.
- Les téléchargements de médias sont plafonnés par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d’être transmis
  à l’agent, conformément au magasin de médias partagé utilisé par les autres plugins de canaux
  groupés.

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des positions, des cartes Flex ou des messages modèles.

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

Le plugin LINE fournit également une commande `/card` pour les préréglages de messages Flex :

```
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de message de l’agent. Les médias sont envoyés via le chemin de livraison spécifique à LINE, avec une gestion appropriée des aperçus et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec une gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d’hôte cible avant de transmettre l’URL à LINE et rejette les cibles local loopback, link-local et de réseau privé.

Les envois de médias génériques reviennent à la route existante limitée aux images lorsqu’un chemin spécifique à LINE n’est pas disponible.

## Dépannage

- **La vérification Webhook échoue :** assurez-vous que l’URL du Webhook est en HTTPS et que le
  `channelSecret` correspond à la console LINE.
- **Aucun événement entrant :** confirmez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que le gateway est joignable depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la
  limite par défaut.

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Routage de canal](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

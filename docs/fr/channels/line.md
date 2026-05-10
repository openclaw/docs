---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous devez configurer le Webhook LINE et les identifiants
    - Vous voulez des options de message propres à LINE
summary: Installation, configuration et utilisation du plugin LINE Messaging API
title: LIGNE
x-i18n:
    generated_at: "2026-05-10T19:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via la LINE Messaging API. Le Plugin s'exécute comme récepteur de Webhook
sur le Gateway et utilise votre jeton d'accès de canal + secret de canal pour
l'authentification.

Statut : Plugin téléchargeable. Les messages directs, discussions de groupe, médias, emplacements, messages Flex,
messages de modèle et réponses rapides sont pris en charge. Les réactions et fils de discussion
ne sont pas pris en charge.

## Installer

Installez LINE avant de configurer le canal :

```bash
openclaw plugins install @openclaw/line
```

Checkout local (lors de l'exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un fournisseur et ajoutez un canal **Messaging API**.
3. Copiez le **jeton d'accès de canal** et le **secret de canal** depuis les paramètres du canal.
4. Activez **Utiliser le Webhook** dans les paramètres de Messaging API.
5. Définissez l'URL du Webhook sur votre point de terminaison Gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification du Webhook de LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d'un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez à jour l'URL en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps (HMAC sur le corps brut), OpenClaw applique donc des limites strictes de corps avant authentification et un délai d'expiration avant la vérification.
- OpenClaw traite les événements Webhook à partir des octets bruts vérifiés de la requête. Les valeurs `req.body` transformées par le middleware en amont sont ignorées pour garantir l'intégrité de la signature.

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

Variables d'environnement (compte par défaut uniquement) :

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

`tokenFile` et `secretFile` doivent pointer vers des fichiers réguliers. Les liens symboliques sont rejetés.

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

## Contrôle d'accès

Les messages directs utilisent l'appariement par défaut. Les expéditeurs inconnus reçoivent un code d'appariement et leurs
messages sont ignorés jusqu'à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d'autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled`
- `channels.line.allowFrom` : IDs utilisateur LINE autorisés pour les DM ; `dmPolicy: "open"` nécessite `["*"]`
- `channels.line.groupPolicy` : `allowlist | open | disabled`
- `channels.line.groupAllowFrom` : IDs utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Les groupes d'accès expéditeur statiques peuvent être référencés depuis `allowFrom`, `groupAllowFrom` et `allowFrom` par groupe avec `accessGroup:<name>`.
- Note d'exécution : si `channels.line` est complètement absent, l'exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les IDs LINE sont sensibles à la casse. Les IDs valides ressemblent à :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salle : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en blocs de 5000 caractères.
- La mise en forme Markdown est supprimée ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque c'est possible.
- Les réponses en streaming sont mises en mémoire tampon ; LINE reçoit des blocs complets avec une animation de
  chargement pendant que l'agent travaille.
- Les téléchargements de médias sont plafonnés par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d'être transmis
  à l'agent, conformément au magasin de médias partagé utilisé par les autres Plugins de canal
  groupés.

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages de modèle.

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

## Prise en charge d'ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le Plugin LINE prend en charge l'envoi d'images, de vidéos et de fichiers audio via l'outil de message de l'agent. Les médias sont envoyés via le chemin de livraison spécifique à LINE avec une gestion appropriée de l'aperçu et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d'aperçu.
- **Vidéos** : envoyées avec gestion explicite de l'aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d'hôte cible avant de transmettre l'URL à LINE et rejette les cibles de loopback, link-local et de réseau privé.

Les envois de médias génériques reviennent à la route existante limitée aux images lorsqu'un chemin spécifique à LINE n'est pas disponible.

## Dépannage

- **La vérification du Webhook échoue :** assurez-vous que l'URL du Webhook utilise HTTPS et que le
  `channelSecret` correspond à la console LINE.
- **Aucun événement entrant :** confirmez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que le Gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la
  limite par défaut.

## Connexe

- [Vue d'ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appariement](/fr/channels/pairing) — authentification DM et flux d'appariement
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle des mentions
- [Routage de canal](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d'accès et durcissement

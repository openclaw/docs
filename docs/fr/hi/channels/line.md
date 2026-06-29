---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous avez besoin de la configuration du Webhook LINE + des identifiants
    - Vous souhaitez des options de message spécifiques à LINE
summary: Installation, configuration et utilisation du Plugin API de messagerie LINE
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via l’API LINE Messaging API. Le Plugin fonctionne comme
récepteur Webhook sur le Gateway et utilise votre channel access token + channel secret pour
l’authentification.

État : Plugin téléchargeable. Les messages directs, les discussions de groupe, les médias, les positions, les messages Flex,
les messages de modèle et les réponses rapides sont pris en charge. Les réactions et les fils de discussion
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

## Configuration initiale

1. Créez un compte LINE Developers et ouvrez la Console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un Provider et ajoutez un channel **Messaging API**.
3. Copiez le **Channel access token** et le **Channel secret** depuis les paramètres du channel.
4. Activez **Use webhook** dans les paramètres Messaging API.
5. Définissez l’URL Webhook sur votre endpoint Gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification Webhook (GET) de LINE et accepte les événements
entrants signés (POST) immédiatement après la validation de la signature et du payload ; le traitement par l’agent
se poursuit de manière asynchrone.
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps (HMAC sur le corps brut), donc OpenClaw applique des limites strictes de corps pré-authentification et un délai d’expiration avant la vérification.
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

Configuration des DM publics :

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

Fichiers de token/secret :

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

Les messages directs utilisent le pairing par défaut. Les expéditeurs inconnus reçoivent un code de pairing et leurs
messages sont ignorés jusqu’à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled`
- `channels.line.allowFrom` : IDs utilisateur LINE autorisés pour les DM ; `["*"]` est requis pour `dmPolicy: "open"`
- `channels.line.groupPolicy` : `allowlist | open | disabled`
- `channels.line.groupAllowFrom` : IDs utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Les groupes d’accès statiques d’expéditeurs peuvent être référencés depuis `allowFrom`, `groupAllowFrom` et le `allowFrom` par groupe avec `accessGroup:<name>`.
- Note d’exécution : si `channels.line` est entièrement absent, le runtime revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les IDs LINE sont sensibles à la casse. Les IDs valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en fragments de 5000 caractères.
- La mise en forme Markdown est supprimée ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque c’est possible.
- Les réponses en streaming sont mises en mémoire tampon ; LINE reçoit des fragments complets avec une
  animation de chargement pendant que l’agent travaille.
- Les téléchargements de médias sont plafonnés par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d’être transmis à l’agent,
  ce qui correspond au stockage de médias partagé utilisé par les autres Plugins de canal
  groupés.

## Données de canal (messages enrichis)

Utilisez `channelData.line` pour envoyer des réponses rapides, des positions, des cartes Flex ou des messages
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

Le Plugin LINE fournit aussi la commande `/card` pour les préréglages de messages Flex :

```
/card info "Welcome" "Thanks for joining!"
```

## Prise en charge ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à la session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent comme les autres canaux de conversation sur LINE.

Consultez [agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le Plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de message de l’agent. Les médias sont envoyés via le chemin de livraison propre à LINE, avec une gestion appropriée des aperçus et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec une gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d’hôte cible avant de transmettre l’URL à LINE et refuse les cibles loopback, link-local et de réseau privé.

Les envois de médias génériques reviennent au chemin image uniquement existant lorsque le chemin propre à LINE n’est pas disponible.

## Dépannage

- **Échec de la vérification Webhook :** assurez-vous que l’URL Webhook utilise HTTPS et que
  `channelSecret` correspond à la console LINE.
- **Aucun événement entrant :** vérifiez que le chemin Webhook correspond à `channels.line.webhookPath`
  et que le Gateway est joignable depuis LINE.
- **Erreurs de téléchargement de médias :** si un média dépasse la limite par défaut, augmentez `channels.line.mediaMaxMb`.

## Associés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification DM et flux de pairing
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

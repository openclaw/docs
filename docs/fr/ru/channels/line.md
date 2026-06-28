---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous devez configurer le Webhook LINE et les identifiants
    - Vous avez besoin de paramètres de message spécifiques à LINE
summary: Configuration, paramétrage et utilisation du Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via la LINE Messaging API. Le Plugin fonctionne comme récepteur de Webhook
sur le Gateway et utilise votre jeton d’accès au canal + secret du canal pour
l’authentification.

Statut : Plugin chargeable. Les messages privés, les discussions de groupe, les médias, les emplacements, les messages Flex,
les messages template et les réponses rapides sont pris en charge. Les réactions et les fils
ne sont pas pris en charge.

## Installation

Installez LINE avant de configurer le canal :

```bash
openclaw plugins install @openclaw/line
```

Copie de travail locale (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou sélectionnez) un Provider et ajoutez un canal **Messaging API**.
3. Copiez **Channel access token** et **Channel secret** depuis les paramètres du canal.
4. Activez **Use webhook** dans les paramètres Messaging API.
5. Définissez l’URL du Webhook pour votre point de terminaison Gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification du Webhook de LINE (GET) et confirme les événements
entrants signés (POST) immédiatement après la vérification de la signature et de la charge utile ; le traitement
par l’agent se poursuit de manière asynchrone.
Si un chemin personnalisé est nécessaire, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Remarque de sécurité :

- La vérification de signature LINE dépend du corps de la requête (HMAC sur le corps brut), OpenClaw applique donc des limites strictes de taille du corps et un délai d’expiration avant authentification avant la vérification.
- OpenClaw traite les événements Webhook à partir des octets bruts vérifiés de la requête. Les valeurs `req.body` transformées par un middleware en amont sont ignorées afin de préserver l’intégrité de la signature.

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

Configuration des messages privés ouverts :

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

Les messages privés nécessitent un appairage par défaut. Les expéditeurs inconnus reçoivent un code d’appairage, et leurs
messages sont ignorés jusqu’à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled`
- `channels.line.allowFrom` : ID utilisateur LINE autorisés pour les messages privés ; `dmPolicy: "open"` nécessite `["*"]`
- `channels.line.groupPolicy` : `allowlist | open | disabled`
- `channels.line.groupAllowFrom` : ID utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Les groupes d’accès statiques d’expéditeurs peuvent être référencés depuis `allowFrom`, `groupAllowFrom` et le `allowFrom` de groupe via `accessGroup:<name>`.
- Remarque sur le runtime : si `channels.line` est entièrement absent, le runtime revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les ID LINE sont sensibles à la casse. Les ID valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en fragments de 5 000 caractères.
- Le formatage Markdown est supprimé ; les blocs de code et les tableaux sont convertis en cartes Flex
  lorsque c’est possible.
- Les réponses en flux continu sont mises en mémoire tampon ; LINE reçoit des fragments complets avec une animation de chargement,
  pendant que l’agent travaille.
- Le téléchargement des médias est limité par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés dans `~/.openclaw/media/inbound/` avant d’être transmis
  à l’agent, conformément au stockage multimédia partagé utilisé par les autres Plugins de
  canaux intégrés.

## Données de canal (messages avancés)

Utilisez `channelData.line` pour envoyer des réponses rapides, des emplacements, des cartes Flex ou des messages
template.

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

LINE prend en charge les liaisons de conversations ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent dans LINE comme dans les autres canaux de conversation.

Voir [agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le Plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de messages de l’agent. Les médias sont envoyés via le chemin de livraison propre à LINE, avec la gestion appropriée de l’aperçu et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw vérifie le nom d’hôte cible avant de transmettre l’URL à LINE et refuse local loopback, link-local et les destinations sur des réseaux privés.

Les envois de médias génériques reviennent à la route existante réservée aux images lorsque le chemin propre à LINE n’est pas disponible.

## Dépannage

- **La vérification du Webhook échoue :** assurez-vous que l’URL du Webhook utilise HTTPS et que
  `channelSecret` correspond à la console LINE.
- **Aucun événement entrant :** vérifiez que le chemin du Webhook correspond à `channels.line.webhookPath`
  et que le Gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse
  la limite par défaut.

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et limitation par mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la protection

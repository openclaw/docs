---
read_when:
    - Vous souhaitez connecter OpenClaw à LINE
    - Vous devez configurer le Webhook LINE et les identifiants
    - Vous souhaitez des options de message propres à LINE
summary: Installation, configuration et utilisation du Plugin LINE Messaging API
title: LIGNE
x-i18n:
    generated_at: "2026-04-30T07:13:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE se connecte à OpenClaw via la LINE Messaging API. Le Plugin s’exécute comme récepteur de Webhook sur le Gateway et utilise votre jeton d’accès au canal + secret de canal pour l’authentification.

Statut : Plugin intégré. Les messages directs, discussions de groupe, médias, emplacements, messages Flex, messages de modèle et réponses rapides sont pris en charge. Les réactions et fils de discussion ne sont pas pris en charge.

## Plugin intégré

LINE est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux n’ont donc pas besoin d’une installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut LINE, installez un paquet npm actuel lorsqu’il est publié :

```bash
openclaw plugins install @openclaw/line
```

Si npm indique que le paquet appartenant à OpenClaw est obsolète ou manquant, utilisez un build OpenClaw empaqueté actuel ou un checkout local jusqu’à ce que le train de paquets npm rattrape son retard.

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuration

1. Créez un compte LINE Developers et ouvrez la console :
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Créez (ou choisissez) un fournisseur et ajoutez un canal **Messaging API**.
3. Copiez le **jeton d’accès au canal** et le **secret de canal** depuis les paramètres du canal.
4. Activez **Utiliser le Webhook** dans les paramètres Messaging API.
5. Définissez l’URL du Webhook sur votre point de terminaison Gateway (HTTPS requis) :

```
https://gateway-host/line/webhook
```

Le Gateway répond à la vérification Webhook de LINE (GET) et aux événements entrants (POST).
Si vous avez besoin d’un chemin personnalisé, définissez `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` et mettez l’URL à jour en conséquence.

Note de sécurité :

- La vérification de signature LINE dépend du corps (HMAC sur le corps brut), donc OpenClaw applique des limites strictes de corps avant authentification et un délai d’expiration avant la vérification.
- OpenClaw traite les événements Webhook à partir des octets bruts de la requête vérifiée. Les valeurs `req.body` transformées par un middleware en amont sont ignorées pour préserver l’intégrité de la signature.

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

Les messages directs utilisent l’association par défaut. Les expéditeurs inconnus reçoivent un code d’association et leurs messages sont ignorés jusqu’à approbation.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listes d’autorisation et politiques :

- `channels.line.dmPolicy` : `pairing | allowlist | open | disabled`
- `channels.line.allowFrom` : IDs utilisateur LINE autorisés pour les MD
- `channels.line.groupPolicy` : `allowlist | open | disabled`
- `channels.line.groupAllowFrom` : IDs utilisateur LINE autorisés pour les groupes
- Remplacements par groupe : `channels.line.groups.<groupId>.allowFrom`
- Note d’exécution : si `channels.line` est totalement absent, l’exécution se rabat sur `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Les IDs LINE respectent la casse. Les IDs valides ressemblent à ceci :

- Utilisateur : `U` + 32 caractères hexadécimaux
- Groupe : `C` + 32 caractères hexadécimaux
- Salon : `R` + 32 caractères hexadécimaux

## Comportement des messages

- Le texte est découpé en morceaux de 5000 caractères.
- La mise en forme Markdown est supprimée ; les blocs de code et tableaux sont convertis en cartes Flex lorsque c’est possible.
- Les réponses en streaming sont mises en mémoire tampon ; LINE reçoit des morceaux complets avec une animation de chargement pendant que l’agent travaille.
- Les téléchargements de médias sont limités par `channels.line.mediaMaxMb` (10 par défaut).
- Les médias entrants sont enregistrés sous `~/.openclaw/media/inbound/` avant d’être transmis à l’agent, conformément au magasin de médias partagé utilisé par les autres Plugins de canal intégrés.

## Données de canal (messages riches)

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

## Prise en charge ACP

LINE prend en charge les liaisons de conversation ACP (Agent Communication Protocol) :

- `/acp spawn <agent> --bind here` lie la discussion LINE actuelle à une session ACP sans créer de fil enfant.
- Les liaisons ACP configurées et les sessions ACP actives liées à une conversation fonctionnent sur LINE comme sur les autres canaux de conversation.

Consultez [Agents ACP](/fr/tools/acp-agents) pour plus de détails.

## Médias sortants

Le Plugin LINE prend en charge l’envoi d’images, de vidéos et de fichiers audio via l’outil de message de l’agent. Les médias sont envoyés via le chemin de livraison propre à LINE avec une gestion appropriée des aperçus et du suivi :

- **Images** : envoyées comme messages image LINE avec génération automatique d’aperçu.
- **Vidéos** : envoyées avec une gestion explicite de l’aperçu et du type de contenu.
- **Audio** : envoyé comme messages audio LINE.

Les URL de médias sortants doivent être des URL HTTPS publiques. OpenClaw valide le nom d’hôte cible avant de transmettre l’URL à LINE et rejette les cibles loopback, link-local et de réseau privé.

Les envois de médias génériques se rabattent sur la route existante limitée aux images lorsqu’un chemin propre à LINE n’est pas disponible.

## Dépannage

- **La vérification du Webhook échoue :** assurez-vous que l’URL du Webhook est en HTTPS et que le `channelSecret` correspond à la console LINE.
- **Aucun événement entrant :** vérifiez que le chemin du Webhook correspond à `channels.line.webhookPath` et que le Gateway est accessible depuis LINE.
- **Erreurs de téléchargement de médias :** augmentez `channels.line.mediaMaxMb` si le média dépasse la limite par défaut.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification par MD et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement

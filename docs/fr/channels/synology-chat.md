---
read_when:
    - Configuration de Synology Chat avec OpenClaw
    - Débogage du routage Webhook de Synology Chat
summary: Configuration du Webhook Synology Chat et de la configuration OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T06:59:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Statut : canal de messages directs du Plugin groupé utilisant les webhooks Synology Chat.
Le Plugin accepte les messages entrants provenant des webhooks sortants Synology Chat et envoie les réponses
via un webhook entrant Synology Chat.

## Plugin groupé

Synology Chat est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw ; les builds
packagés normaux ne nécessitent donc pas d’installation distincte.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Synology Chat,
installez-le manuellement :

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Vérifiez que le Plugin Synology Chat est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement depuis un checkout source avec la commande ci-dessus.
   - `openclaw onboard` affiche désormais Synology Chat dans la même liste de configuration de canal que `openclaw channels add`.
   - Configuration non interactive : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Dans les intégrations Synology Chat :
   - Créez un webhook entrant et copiez son URL.
   - Créez un webhook sortant avec votre jeton secret.
3. Faites pointer l’URL du webhook sortant vers votre Gateway OpenClaw :
   - `https://gateway-host/webhook/synology` par défaut.
   - Ou votre `channels.synology-chat.webhookPath` personnalisé.
4. Terminez la configuration dans OpenClaw.
   - Guidée : `openclaw onboard`
   - Directe : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Redémarrez le Gateway et envoyez un MP au bot Synology Chat.

Détails d’authentification du Webhook :

- OpenClaw accepte le jeton du webhook sortant depuis `body.token`, puis
  `?token=...`, puis les en-têtes.
- Formes d’en-tête acceptées :
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Les jetons vides ou manquants échouent de manière fermée.

Configuration minimale :

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variables d’environnement

Pour le compte par défaut, vous pouvez utiliser des variables d’environnement :

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (séparés par des virgules)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Les valeurs de configuration remplacent les variables d’environnement.

`SYNOLOGY_CHAT_INCOMING_URL` ne peut pas être défini depuis un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Politique de MP et contrôle d’accès

- `dmPolicy: "allowlist"` est la valeur par défaut recommandée.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’identifiants utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est traitée comme une mauvaise configuration et la route du webhook ne démarrera pas (utilisez `dmPolicy: "open"` avec `allowedUserIds: ["*"]` pour tout autoriser).
- `dmPolicy: "open"` autorise les MP publics uniquement lorsque `allowedUserIds` inclut `"*"` ; avec des entrées restrictives, seuls les utilisateurs correspondants peuvent discuter.
- `dmPolicy: "disabled"` bloque les MP.
- La liaison du destinataire des réponses reste fondée par défaut sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité d’urgence qui réactive la recherche par nom d’utilisateur/surnom mutable pour la remise des réponses.
- Les approbations d’appairage fonctionnent avec :
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Livraison sortante

Utilisez des identifiants utilisateur numériques Synology Chat comme cibles.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Les envois de médias sont pris en charge via la livraison de fichiers basée sur URL.
Les URL de fichiers sortants doivent utiliser `http` ou `https`, et les cibles réseau privées ou autrement bloquées sont rejetées avant qu’OpenClaw ne transmette l’URL au webhook du NAS.

## Multi-compte

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut remplacer le jeton, l’URL entrante, le chemin du webhook, la politique de MP et les limites.
Les sessions de messages directs sont isolées par compte et par utilisateur ; ainsi, le même `user_id`
numérique sur deux comptes Synology différents ne partage pas l’état de transcription.
Attribuez à chaque compte activé un `webhookPath` distinct. OpenClaw rejette désormais les chemins exacts dupliqués
et refuse de démarrer les comptes nommés qui héritent uniquement d’un chemin de webhook partagé dans les configurations multi-compte.
Si vous avez intentionnellement besoin de l’héritage historique pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou dans `channels.synology-chat`,
mais les chemins exacts dupliqués restent rejetés de manière fermée. Préférez des chemins explicites par compte.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Notes de sécurité

- Gardez `token` secret et effectuez une rotation s’il est divulgué.
- Gardez `allowInsecureSsl: false`, sauf si vous faites explicitement confiance à un certificat NAS local auto-signé.
- Les requêtes de webhook entrantes sont vérifiées par jeton et limitées en débit par expéditeur.
- Les vérifications de jeton invalide utilisent une comparaison de secret en temps constant et échouent de manière fermée.
- Préférez `dmPolicy: "allowlist"` en production.
- Gardez `dangerouslyAllowNameMatching` désactivé, sauf si vous avez explicitement besoin de la livraison de réponses historique basée sur le nom d’utilisateur.
- Gardez `dangerouslyAllowInheritedWebhookPath` désactivé, sauf si vous acceptez explicitement le risque de routage par chemin partagé dans une configuration multi-compte.

## Dépannage

- `Missing required fields (token, user_id, text)` :
  - la charge utile du webhook sortant ne contient pas l’un des champs requis
  - si Synology envoie le jeton dans les en-têtes, assurez-vous que le Gateway/proxy conserve ces en-têtes
- `Invalid token` :
  - le secret du webhook sortant ne correspond pas à `channels.synology-chat.token`
  - la requête atteint le mauvais compte ou chemin de webhook
  - un proxy inverse a supprimé l’en-tête du jeton avant que la requête n’atteigne OpenClaw
- `Rate limit exceeded` :
  - trop de tentatives avec jeton invalide depuis la même source peuvent temporairement bloquer cette source
  - les expéditeurs authentifiés ont aussi une limite distincte de débit de messages par utilisateur
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].` :
  - `dmPolicy="allowlist"` est activé mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur n’est pas dans `allowedUserIds`

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des MP et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

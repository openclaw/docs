---
read_when:
    - Configuration de Synology Chat avec OpenClaw
    - Débogage du routage des Webhooks Synology Chat
summary: Configuration du Webhook Synology Chat et d’OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T02:21:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat se connecte à OpenClaw au moyen d’une paire de Webhooks : un Webhook sortant de Synology Chat transmet les messages directs entrants au Gateway, et les réponses sont renvoyées par l’intermédiaire d’un Webhook entrant de Synology Chat.

Statut : Plugin officiel, installé séparément. Messages directs uniquement ; l’envoi de texte et de fichiers par URL est pris en charge.

## Installation

```bash
openclaw plugins install @openclaw/synology-chat
```

Copie de travail locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Installez le Plugin (ci-dessus).
2. Dans les intégrations de Synology Chat :
   - Créez un Webhook entrant et copiez son URL.
   - Créez un Webhook sortant avec votre jeton secret.
3. Faites pointer l’URL du Webhook sortant vers votre Gateway OpenClaw :
   - `https://gateway-host/webhook/synology` par défaut.
   - Ou votre chemin personnalisé `channels.synology-chat.webhookPath`.
4. Terminez la configuration dans OpenClaw. Synology Chat apparaît dans la même liste de configuration des canaux pour les deux procédures :
   - Guidée : `openclaw onboard` ou `openclaw channels add`
   - Directe : `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Redémarrez le Gateway et envoyez un message direct au bot Synology Chat.

Détails de l’authentification du Webhook :

- OpenClaw accepte le jeton du Webhook sortant depuis `body.token`, puis
  `?token=...`, puis les en-têtes.
- Formats d’en-tête acceptés :
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Les jetons vides ou absents entraînent un refus sécurisé.
- Les charges utiles peuvent être au format `application/x-www-form-urlencoded` ou `application/json` ; `token`, `user_id` et `text` sont obligatoires.

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

`SYNOLOGY_CHAT_INCOMING_URL` et `SYNOLOGY_NAS_HOST` ne peuvent pas être définies depuis un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security#workspace-env-files).

## Politique de messages directs et contrôle d’accès

- Valeurs de `dmPolicy` prises en charge : `allowlist` (par défaut), `open` et `disabled`. Synology Chat ne dispose d’aucune procédure d’appairage ; autorisez les expéditeurs en ajoutant leurs identifiants utilisateur Synology numériques à `allowedUserIds`.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’identifiants utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est considérée comme une mauvaise configuration et la route du Webhook ne démarre pas.
- `dmPolicy: "open"` autorise les messages directs publics uniquement lorsque `allowedUserIds` contient `"*"` ; avec des entrées restrictives, seuls les utilisateurs correspondants peuvent discuter. Le mode `open` avec une liste `allowedUserIds` vide empêche également le démarrage de la route.
- `dmPolicy: "disabled"` bloque les messages directs.
- Par défaut, l’association du destinataire des réponses reste fondée sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité d’urgence qui réactive la recherche par nom d’utilisateur ou pseudonyme modifiable pour la remise des réponses.

## Envoi sortant

Utilisez les identifiants utilisateur Synology Chat numériques comme cibles. Les préfixes `synology-chat:`, `synology_chat:` et `synology:` sont acceptés.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Le texte sortant est segmenté par blocs de 2 000 caractères. L’envoi de médias est pris en charge par la remise de fichiers fondée sur une URL : le NAS télécharge et joint le fichier (32 Mo maximum). Les URL de fichiers sortants doivent utiliser `http` ou `https`, et les cibles réseau privées ou autrement bloquées sont rejetées avant qu’OpenClaw ne transmette l’URL au Webhook du NAS.

## Comptes multiples

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut remplacer le jeton, l’URL entrante, le chemin du Webhook, la politique de messages directs et les limites.
Les sessions de messages directs sont isolées par compte et par utilisateur ; ainsi, un même `user_id`
numérique sur deux comptes Synology différents ne partage pas l’état de la transcription.
Attribuez un `webhookPath` distinct à chaque compte activé. OpenClaw rejette les chemins exactement identiques
et refuse de démarrer les comptes nommés qui héritent uniquement d’un chemin de Webhook partagé dans les configurations à plusieurs comptes.
Si vous avez délibérément besoin de l’héritage historique pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou dans `channels.synology-chat`,
mais les chemins exactement identiques sont toujours rejetés de manière sécurisée. Privilégiez des chemins explicites pour chaque compte.

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

## Remarques de sécurité

- Gardez `token` secret et renouvelez-le en cas de fuite.
- Conservez `allowInsecureSsl: false`, sauf si vous faites explicitement confiance à un certificat local autosigné du NAS.
- Les requêtes de Webhook entrantes font l’objet d’une vérification du jeton et d’une limitation du débit par expéditeur (`rateLimitPerMinute`, 30 par défaut).
- Les vérifications de jetons non valides utilisent une comparaison des secrets en temps constant et entraînent un refus sécurisé ; des tentatives répétées avec un jeton non valide bloquent temporairement l’adresse IP source.
- Le texte des messages entrants est assaini contre les schémas connus d’injection d’invite et tronqué à 4 000 caractères.
- Privilégiez `dmPolicy: "allowlist"` en production.
- Laissez `dangerouslyAllowNameMatching` désactivé, sauf si vous avez explicitement besoin de la remise historique des réponses fondée sur le nom d’utilisateur.
- Laissez `dangerouslyAllowInheritedWebhookPath` désactivé, sauf si vous acceptez explicitement le risque de routage par chemin partagé dans une configuration à plusieurs comptes.

## Résolution des problèmes

- `Missing required fields (token, user_id, text)` :
  - la charge utile du Webhook sortant ne contient pas l’un des champs obligatoires
  - si Synology envoie le jeton dans les en-têtes, assurez-vous que la passerelle ou le proxy conserve ces en-têtes
- `Invalid token` :
  - le secret du Webhook sortant ne correspond pas à `channels.synology-chat.token`
  - la requête atteint le mauvais compte ou le mauvais chemin de Webhook
  - un proxy inverse a supprimé l’en-tête du jeton avant que la requête n’atteigne OpenClaw
- `Rate limit exceeded` :
  - un trop grand nombre de tentatives avec un jeton non valide depuis la même source peut bloquer temporairement cette source
  - les expéditeurs authentifiés disposent également d’une limite distincte du débit de messages par utilisateur
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].` :
  - `dmPolicy="allowlist"` est activé, mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur ne figure pas dans `allowedUserIds`

## Ressources associées

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité

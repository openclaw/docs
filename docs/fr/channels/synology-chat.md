---
read_when:
    - Configurer Synology Chat avec OpenClaw
    - Débogage du routage du Webhook Synology Chat
summary: Configuration du Webhook Synology Chat et d’OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T07:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Statut : plugin fourni pour canal de message direct utilisant les webhooks Synology Chat.
Le plugin accepte les messages entrants provenant des webhooks sortants Synology Chat et envoie les réponses
via un webhook entrant Synology Chat.

## Plugin fourni

Synology Chat est livré comme plugin fourni dans les versions actuelles d’OpenClaw, donc les builds
packagés normaux ne nécessitent pas d’installation distincte.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Synology Chat,
installez-le manuellement :

Installation depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Assurez-vous que le plugin Synology Chat est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement depuis un checkout source avec la commande ci-dessus.
   - `openclaw onboard` affiche désormais Synology Chat dans la même liste de configuration de canaux que `openclaw channels add`.
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
5. Redémarrez le Gateway et envoyez un DM au bot Synology Chat.

Détails d’authentification du Webhook :

- OpenClaw accepte le jeton du webhook sortant depuis `body.token`, puis
  `?token=...`, puis les en-têtes.
- Formes d’en-têtes acceptées :
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Les jetons vides ou absents échouent en mode fermé.

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

## Politique de DM et contrôle d’accès

- `dmPolicy: "allowlist"` est la valeur par défaut recommandée.
- `allowedUserIds` accepte une liste (ou une chaîne séparée par des virgules) d’ID utilisateur Synology.
- En mode `allowlist`, une liste `allowedUserIds` vide est traitée comme une mauvaise configuration et la route du webhook ne démarrera pas (utilisez `dmPolicy: "open"` avec `allowedUserIds: ["*"]` pour tout autoriser).
- `dmPolicy: "open"` autorise les DM publics uniquement lorsque `allowedUserIds` inclut `"*"` ; avec des entrées restrictives, seuls les utilisateurs correspondants peuvent discuter.
- `dmPolicy: "disabled"` bloque les DM.
- La liaison du destinataire de réponse reste par défaut sur le `user_id` numérique stable. `channels.synology-chat.dangerouslyAllowNameMatching: true` est un mode de compatibilité de dernier recours qui réactive la recherche par nom d’utilisateur/pseudonyme mutable pour la livraison des réponses.
- Les approbations d’appairage fonctionnent avec :
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Livraison sortante

Utilisez les ID utilisateur numériques Synology Chat comme cibles.

Exemples :

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Les envois de médias sont pris en charge via la livraison de fichiers basée sur URL.
Les URL de fichiers sortants doivent utiliser `http` ou `https`, et les cibles réseau privées ou autrement bloquées sont rejetées avant qu’OpenClaw ne transmette l’URL au webhook du NAS.

## Multicompte

Plusieurs comptes Synology Chat sont pris en charge sous `channels.synology-chat.accounts`.
Chaque compte peut remplacer le jeton, l’URL entrante, le chemin du webhook, la politique de DM et les limites.
Les sessions de message direct sont isolées par compte et par utilisateur, donc le même `user_id`
numérique sur deux comptes Synology différents ne partage pas l’état de transcription.
Donnez à chaque compte activé un `webhookPath` distinct. OpenClaw rejette désormais les chemins exacts en double
et refuse de démarrer les comptes nommés qui héritent seulement d’un chemin de webhook partagé dans les configurations multicompte.
Si vous avez intentionnellement besoin de l’héritage historique pour un compte nommé, définissez
`dangerouslyAllowInheritedWebhookPath: true` sur ce compte ou au niveau de `channels.synology-chat`,
mais les chemins exacts en double restent rejetés en mode fermé. Préférez des chemins explicites par compte.

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

- Gardez `token` secret et faites-le tourner s’il a fuité.
- Gardez `allowInsecureSsl: false` sauf si vous faites explicitement confiance à un certificat NAS local autosigné.
- Les requêtes de webhook entrantes sont vérifiées par jeton et limitées en débit par expéditeur.
- Les vérifications de jeton invalide utilisent une comparaison de secrets en temps constant et échouent en mode fermé.
- Préférez `dmPolicy: "allowlist"` en production.
- Gardez `dangerouslyAllowNameMatching` désactivé sauf si vous avez explicitement besoin de la livraison de réponses historique basée sur les noms d’utilisateur.
- Gardez `dangerouslyAllowInheritedWebhookPath` désactivé sauf si vous acceptez explicitement le risque de routage par chemin partagé dans une configuration multicompte.

## Dépannage

- `Missing required fields (token, user_id, text)` :
  - la charge utile du webhook sortant ne contient pas l’un des champs obligatoires
  - si Synology envoie le jeton dans les en-têtes, assurez-vous que le Gateway/proxy préserve ces en-têtes
- `Invalid token` :
  - le secret du webhook sortant ne correspond pas à `channels.synology-chat.token`
  - la requête atteint le mauvais compte ou chemin de webhook
  - un proxy inverse a supprimé l’en-tête de jeton avant que la requête n’atteigne OpenClaw
- `Rate limit exceeded` :
  - trop de tentatives avec un jeton invalide depuis la même source peuvent temporairement bloquer cette source
  - les expéditeurs authentifiés ont aussi une limite de débit de messages distincte par utilisateur
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].` :
  - `dmPolicy="allowlist"` est activé mais aucun utilisateur n’est configuré
- `User not authorized` :
  - le `user_id` numérique de l’expéditeur ne figure pas dans `allowedUserIds`

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

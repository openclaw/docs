---
read_when:
    - Configuration du contrôle d’accès aux messages privés
    - Appairage d’un nouveau Node iOS/Android
    - Examen de la posture de sécurité d’OpenClaw
summary: 'Vue d’ensemble de l’appairage : approuver qui peut vous envoyer un message direct + quels nœuds peuvent rejoindre'
title: Appairage
x-i18n:
    generated_at: "2026-05-10T19:23:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

Le « pairing » est l’étape explicite d’approbation d’accès d’OpenClaw.
Il est utilisé à deux endroits:

1. **Pairing par DM** (qui est autorisé à parler au bot)
2. **Pairing de Node** (quels appareils/nœuds sont autorisés à rejoindre le réseau du Gateway)

Contexte de sécurité: [Sécurité](/fr/gateway/security)

## 1) Pairing par DM (accès aux chats entrants)

Lorsqu’un canal est configuré avec la politique DM `pairing`, les expéditeurs inconnus reçoivent un code court et leur message n’est **pas traité** tant que vous ne l’avez pas approuvé.

Les politiques DM par défaut sont documentées dans: [Sécurité](/fr/gateway/security)

`dmPolicy: "open"` n’est public que lorsque la liste d’autorisation DM effective inclut `"*"`.
La configuration et la validation exigent ce caractère générique pour les configurations publiques ouvertes. Si l’état existant
contient `open` avec des entrées `allowFrom` concrètes, l’exécution admet toujours
uniquement ces expéditeurs, et les approbations du magasin de pairing n’élargissent pas l’accès `open`.

Codes de pairing:

- 8 caractères, en majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message de pairing que lorsqu’une nouvelle demande est créée (environ une fois par heure par expéditeur).
- Les demandes de pairing DM en attente sont limitées à **3 par canal** par défaut; les demandes supplémentaires sont ignorées jusqu’à ce qu’une demande expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aucun propriétaire de commande n’est encore configuré, l’approbation d’un code de pairing DM initialise aussi
`commands.ownerAllowFrom` avec l’expéditeur approuvé, par exemple `telegram:123456789`.
Cela donne aux premières configurations un propriétaire explicite pour les commandes privilégiées et les invites
d’approbation d’exécution. Une fois qu’un propriétaire existe, les approbations de pairing ultérieures accordent uniquement l’accès DM; elles n’ajoutent pas d’autres propriétaires.

Canaux pris en charge: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Groupes d’expéditeurs réutilisables

Utilisez `accessGroups` de premier niveau lorsque le même ensemble d’expéditeurs de confiance doit s’appliquer à
plusieurs canaux de messages, ou à la fois aux listes d’autorisation DM et de groupe.

Les groupes statiques utilisent `type: "message.senders"` et sont référencés avec
`accessGroup:<name>` depuis les listes d’autorisation des canaux:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Les groupes d’accès sont documentés en détail ici: [Groupes d’accès](/fr/channels/access-groups)

### Où se trouve l’état

Stocké sous `~/.openclaw/credentials/`:

- Demandes en attente: `<channel>-pairing.json`
- Magasin de liste d’autorisation approuvée:
  - Compte par défaut: `<channel>-allowFrom.json`
  - Compte non par défaut: `<channel>-<accountId>-allowFrom.json`

Comportement de portée par compte:

- Les comptes non par défaut lisent/écrivent uniquement leur fichier de liste d’autorisation avec portée.
- Le compte par défaut utilise le fichier de liste d’autorisation sans portée, limité au canal.

Traitez-les comme sensibles (ils contrôlent l’accès à votre assistant).

<Note>
Le magasin de liste d’autorisation de pairing sert à l’accès DM. L’autorisation de groupe est séparée.
Approuver un code de pairing DM n’autorise pas automatiquement cet expéditeur à exécuter des
commandes de groupe ni à contrôler le bot dans les groupes. L’initialisation du premier propriétaire est un état de configuration séparé
dans `commands.ownerAllowFrom`, et la livraison des chats de groupe suit toujours les
listes d’autorisation de groupe du canal (par exemple `groupAllowFrom`, `groups`, ou des remplacements par groupe
ou par sujet selon le canal).
</Note>

## 2) Pairing d’appareil Node (nœuds iOS/Android/macOS/headless)

Les nœuds se connectent au Gateway en tant qu’**appareils** avec `role: node`. Le Gateway
crée une demande de pairing d’appareil qui doit être approuvée.

### Pairing via Telegram (recommandé pour iOS)

Si vous utilisez le Plugin `device-pair`, vous pouvez effectuer le premier pairing d’appareil entièrement depuis Telegram:

1. Dans Telegram, envoyez un message à votre bot: `/pair`
2. Le bot répond avec deux messages: un message d’instructions et un message séparé contenant le **code de configuration** (facile à copier/coller dans Telegram).
3. Sur votre téléphone, ouvrez l’app iOS OpenClaw → Réglages → Gateway.
4. Scannez le code QR ou collez le code de configuration et connectez-vous.
5. De retour dans Telegram: `/pair pending` (vérifiez les ID de demande, le rôle et les portées), puis approuvez.

Le code de configuration est une charge utile JSON encodée en base64 qui contient:

- `url`: l’URL WebSocket du Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: un jeton d’amorçage de courte durée, limité à un seul appareil, utilisé pour la poignée de main de pairing initiale

Ce jeton d’amorçage porte le profil d’amorçage de pairing intégré:

- le jeton `node` principal transmis reste `scopes: []`
- tout jeton `operator` transmis reste limité à la liste d’autorisation d’amorçage:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- les vérifications de portée d’amorçage sont préfixées par rôle, et non un seul pool de portées plat:
  les entrées de portée operator ne satisfont que les demandes operator, et les rôles non-operator
  doivent toujours demander des portées sous leur propre préfixe de rôle
- la rotation/révocation ultérieure des jetons reste limitée à la fois par le contrat de rôle approuvé
  de l’appareil et par les portées operator de la session appelante

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

Pour Tailscale, public ou tout autre pairing mobile distant, utilisez Tailscale Serve/Funnel
ou une autre URL de Gateway `wss://`. Les codes de configuration en clair `ws://` ne sont acceptés que
pour local loopback, les adresses de réseau local privé, les hôtes Bonjour `.local` et l’hôte
d’émulateur Android. Les adresses CGNAT Tailnet, les noms `.ts.net` et les hôtes publics échouent toujours
fermés avant l’émission du QR/code de configuration.

### Approuver un appareil Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Lorsqu’une approbation explicite est refusée parce que la session d’appareil appairé approbatrice
a été ouverte avec une portée limitée au pairing, la CLI réessaie la même demande avec
`operator.admin`. Cela permet à un appareil appairé existant ayant des capacités d’administration de récupérer un nouveau
pairing d’interface Control UI/navigateur sans modifier `devices/paired.json` à la main. Le
Gateway valide toujours la connexion relancée; les jetons qui ne peuvent pas s’authentifier
avec `operator.admin` restent bloqués.

Si le même appareil réessaie avec des détails d’authentification différents (par exemple une
rôle/des portées/une clé publique différents), la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

<Note>
Un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il se reconnecte en demandant plus de portées ou un rôle plus large, OpenClaw conserve l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez `openclaw devices list` pour comparer l’accès actuellement approuvé avec l’accès nouvellement demandé avant d’approuver.
</Note>

### Approbation automatique facultative des nœuds par CIDR de confiance

Le pairing d’appareil reste manuel par défaut. Pour les réseaux de nœuds étroitement contrôlés,
vous pouvez activer l’approbation automatique des nœuds lors de la première connexion avec des CIDR explicites ou des IP exactes:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Cela ne s’applique qu’aux nouvelles demandes de pairing `role: node` sans portées
demandées. Les clients operator, navigateur, Control UI et WebChat exigent toujours une
approbation manuelle. Les changements de rôle, de portée, de métadonnées et de clé publique exigent toujours une
approbation manuelle.

### Stockage de l’état de pairing Node

Stocké sous `~/.openclaw/devices/`:

- `pending.json` (de courte durée; les demandes en attente expirent)
- `paired.json` (appareils appairés + jetons)

### Notes

- L’ancienne API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) est un
  magasin de pairing distinct, détenu par le gateway. Les nœuds WS exigent toujours le pairing d’appareil.
- L’enregistrement de pairing est la source de vérité durable pour les rôles approuvés. Les jetons
  d’appareil actifs restent limités à cet ensemble de rôles approuvé; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Docs associées

- Modèle de sécurité + injection de prompt: [Sécurité](/fr/gateway/security)
- Mise à jour sûre (exécuter doctor): [Mise à jour](/fr/install/updating)
- Configurations de canaux:
  - Telegram: [Telegram](/fr/channels/telegram)
  - WhatsApp: [WhatsApp](/fr/channels/whatsapp)
  - Signal: [Signal](/fr/channels/signal)
  - iMessage: [iMessage](/fr/channels/imessage)
  - Discord: [Discord](/fr/channels/discord)
  - Slack: [Slack](/fr/channels/slack)

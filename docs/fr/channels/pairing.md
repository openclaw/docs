---
read_when:
    - Configuration du contrôle d’accès aux messages directs
    - Association d’un nouveau nœud iOS/Android
    - Examen de la posture de sécurité d'OpenClaw
summary: 'Aperçu de l’appairage : approuvez qui peut vous envoyer des messages directs + quels nœuds peuvent rejoindre'
title: Appairage
x-i18n:
    generated_at: "2026-05-02T06:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

« L’appairage » est l’étape explicite d’approbation d’accès d’OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage DM** (qui est autorisé à parler au bot)
2. **Appairage Node** (quels appareils/nœuds sont autorisés à rejoindre le réseau Gateway)

Contexte de sécurité : [Sécurité](/fr/gateway/security)

## 1) Appairage DM (accès entrant par chat)

Quand un canal est configuré avec la stratégie DM `pairing`, les expéditeurs inconnus reçoivent un code court et leur message n’est **pas traité** tant que vous ne l’avez pas approuvé.

Les stratégies DM par défaut sont documentées dans : [Sécurité](/fr/gateway/security)

`dmPolicy: "open"` n’est public que lorsque la liste d’autorisation DM effective inclut `"*"`.
La configuration et la validation exigent ce joker pour les configurations publiques ouvertes. Si l’état existant
contient `open` avec des entrées `allowFrom` concrètes, le runtime n’admet toujours
que ces expéditeurs, et les approbations du magasin d’appairage n’élargissent pas l’accès `open`.

Codes d’appairage :

- 8 caractères, en majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message d’appairage que lorsqu’une nouvelle demande est créée (environ une fois par heure et par expéditeur).
- Les demandes d’appairage DM en attente sont limitées à **3 par canal** par défaut ; les demandes supplémentaires sont ignorées jusqu’à ce qu’une demande expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Si aucun propriétaire de commandes n’est encore configuré, l’approbation d’un code d’appairage DM initialise aussi
`commands.ownerAllowFrom` avec l’expéditeur approuvé, par exemple `telegram:123456789`.
Cela donne aux premières configurations un propriétaire explicite pour les commandes privilégiées et les invites
d’approbation d’exécution. Une fois qu’un propriétaire existe, les approbations d’appairage suivantes ne donnent que
l’accès DM ; elles n’ajoutent pas d’autres propriétaires.

Canaux pris en charge : `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Groupes d’expéditeurs réutilisables

Utilisez `accessGroups` au niveau supérieur lorsque le même ensemble d’expéditeurs de confiance doit s’appliquer à
plusieurs canaux de messagerie ou à la fois aux listes d’autorisation DM et de groupe.

Les groupes statiques utilisent `type: "message.senders"` et sont référencés avec
`accessGroup:<name>` depuis les listes d’autorisation des canaux :

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

Les groupes d’accès sont documentés en détail ici : [Groupes d’accès](/fr/channels/access-groups)

### Où vit l’état

Stocké sous `~/.openclaw/credentials/` :

- Demandes en attente : `<channel>-pairing.json`
- Magasin de liste d’autorisation approuvée :
  - Compte par défaut : `<channel>-allowFrom.json`
  - Compte non par défaut : `<channel>-<accountId>-allowFrom.json`

Comportement de portée des comptes :

- Les comptes non par défaut lisent/écrivent uniquement leur fichier de liste d’autorisation avec portée.
- Le compte par défaut utilise le fichier de liste d’autorisation sans portée propre au canal.

Traitez ces éléments comme sensibles (ils contrôlent l’accès à votre assistant).

<Note>
Le magasin de liste d’autorisation d’appairage concerne l’accès DM. L’autorisation de groupe est séparée.
Approuver un code d’appairage DM n’autorise pas automatiquement cet expéditeur à exécuter des commandes de groupe
ou à contrôler le bot dans les groupes. L’initialisation du premier propriétaire est un état de configuration séparé
dans `commands.ownerAllowFrom`, et la livraison des chats de groupe suit toujours les listes d’autorisation de groupe
du canal (par exemple `groupAllowFrom`, `groups`, ou les remplacements par groupe
ou par sujet selon le canal).
</Note>

## 2) Appairage d’appareils Node (nœuds iOS/Android/macOS/headless)

Les nœuds se connectent au Gateway en tant qu’**appareils** avec `role: node`. Le Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairer via Telegram (recommandé pour iOS)

Si vous utilisez le Plugin `device-pair`, vous pouvez effectuer le premier appairage d’appareil entièrement depuis Telegram :

1. Dans Telegram, envoyez un message à votre bot : `/pair`
2. Le bot répond avec deux messages : un message d’instructions et un message séparé de **code de configuration** (facile à copier/coller dans Telegram).
3. Sur votre téléphone, ouvrez l’app iOS OpenClaw → Réglages → Gateway.
4. Collez le code de configuration et connectez-vous.
5. De retour dans Telegram : `/pair pending` (vérifiez les ID de demande, le rôle et les portées), puis approuvez.

Le code de configuration est une charge utile JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket du Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken` : un jeton d’initialisation éphémère à appareil unique utilisé pour la poignée de main d’appairage initiale

Ce jeton d’initialisation porte le profil d’initialisation d’appairage intégré :

- le jeton `node` principal transmis reste `scopes: []`
- tout jeton `operator` transmis reste limité à la liste d’autorisation d’initialisation :
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- les vérifications de portée d’initialisation sont préfixées par rôle, et non regroupées dans un pool de portées plat :
  les entrées de portée d’opérateur ne satisfont que les demandes d’opérateur, et les rôles non opérateurs
  doivent toujours demander des portées sous leur propre préfixe de rôle
- la rotation/révocation ultérieure des jetons reste limitée à la fois par le contrat de rôle approuvé de l’appareil
  et par les portées d’opérateur de la session appelante

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

### Approuver un appareil Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si le même appareil réessaie avec des détails d’authentification différents (par exemple un rôle/des portées/une clé publique différents),
la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

<Note>
Un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il se reconnecte en demandant plus de portées ou un rôle plus large, OpenClaw conserve l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez `openclaw devices list` pour comparer l’accès actuellement approuvé avec l’accès nouvellement demandé avant d’approuver.
</Note>

### Approbation automatique facultative des Node par CIDR de confiance

L’appairage d’appareils reste manuel par défaut. Pour les réseaux Node étroitement contrôlés,
vous pouvez activer l’approbation automatique du premier appairage Node avec des CIDR explicites ou des adresses IP exactes :

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

Cela ne s’applique qu’aux nouvelles demandes d’appairage `role: node` sans portées demandées.
Les clients opérateur, navigateur, Control UI et WebChat nécessitent toujours une approbation manuelle.
Les changements de rôle, de portée, de métadonnées et de clé publique nécessitent toujours une approbation manuelle.

### Stockage de l’état d’appairage Node

Stocké sous `~/.openclaw/devices/` :

- `pending.json` (éphémère ; les demandes en attente expirent)
- `paired.json` (appareils appairés + jetons)

### Notes

- L’API héritée `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|remove|rename`) est un
  magasin d’appairage distinct appartenant au Gateway. Les nœuds WS nécessitent toujours un appairage d’appareil.
- L’enregistrement d’appairage est la source de vérité durable pour les rôles approuvés. Les jetons d’appareil actifs
  restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Docs connexes

- Modèle de sécurité + injection d’invite : [Sécurité](/fr/gateway/security)
- Mise à jour en toute sécurité (exécuter doctor) : [Mise à jour](/fr/install/updating)
- Configurations de canaux :
  - Telegram : [Telegram](/fr/channels/telegram)
  - WhatsApp : [WhatsApp](/fr/channels/whatsapp)
  - Signal : [Signal](/fr/channels/signal)
  - BlueBubbles (iMessage) : [BlueBubbles](/fr/channels/bluebubbles)
  - iMessage (hérité) : [iMessage](/fr/channels/imessage)
  - Discord : [Discord](/fr/channels/discord)
  - Slack : [Slack](/fr/channels/slack)

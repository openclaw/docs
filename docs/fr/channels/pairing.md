---
read_when:
    - Configuration du contrôle d’accès aux messages privés
    - Appairage d’un nouveau nœud iOS/Android
    - Examen de la posture de sécurité d’OpenClaw
summary: 'Aperçu de l’appairage : approuver qui peut vous envoyer des messages privés et quels nœuds peuvent rejoindre'
title: Appairage
x-i18n:
    generated_at: "2026-04-25T13:41:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f11c992f7cbde12f8c6963279dbaea420941e2fc088179d3fd259e4aa007e34
    source_path: channels/pairing.md
    workflow: 15
---

L’« appairage » est l’étape explicite d’**approbation par le propriétaire** d’OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage des messages privés** (qui est autorisé à parler au bot)
2. **Appairage des nœuds** (quels appareils/nœuds sont autorisés à rejoindre le réseau Gateway)

Contexte de sécurité : [Security](/fr/gateway/security)

## 1) Appairage des messages privés (accès au chat entrant)

Lorsqu’un canal est configuré avec la politique de messages privés `pairing`, les expéditeurs inconnus reçoivent un code court et leur message n’est **pas traité** tant que vous ne l’avez pas approuvé.

Les politiques de messages privés par défaut sont documentées dans : [Security](/fr/gateway/security)

Codes d’appairage :

- 8 caractères, majuscules, sans caractères ambigus (`0O1I`).
- **Expirent au bout d’1 heure**. Le bot n’envoie le message d’appairage que lorsqu’une nouvelle demande est créée (environ une fois par heure et par expéditeur).
- Les demandes d’appairage de messages privés en attente sont limitées à **3 par canal** par défaut ; les demandes supplémentaires sont ignorées jusqu’à ce qu’une demande expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canaux pris en charge : `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Où l’état est stocké

Stocké dans `~/.openclaw/credentials/` :

- Demandes en attente : `<channel>-pairing.json`
- Stockage de la liste d’autorisation approuvée :
  - Compte par défaut : `<channel>-allowFrom.json`
  - Compte non par défaut : `<channel>-<accountId>-allowFrom.json`

Comportement de portée des comptes :

- Les comptes non par défaut lisent/écrivent uniquement leur fichier de liste d’autorisation dédié.
- Le compte par défaut utilise le fichier de liste d’autorisation non scoped au niveau du canal.

Traitez ces fichiers comme sensibles (ils contrôlent l’accès à votre assistant).

Important : ce stockage concerne l’accès aux messages privés. L’autorisation des groupes est distincte.
L’approbation d’un code d’appairage de message privé n’autorise pas automatiquement cet expéditeur à exécuter des commandes de groupe ou à contrôler le bot dans des groupes. Pour l’accès aux groupes, configurez les listes d’autorisation de groupe explicites du canal (par exemple `groupAllowFrom`, `groups` ou des remplacements par groupe/par sujet selon le canal).

## 2) Appairage des appareils nœuds (nœuds iOS/Android/macOS/headless)

Les nœuds se connectent à la Gateway en tant qu’**appareils** avec `role: node`. La Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairer via Telegram (recommandé pour iOS)

Si vous utilisez le Plugin `device-pair`, vous pouvez effectuer le premier appairage de l’appareil entièrement depuis Telegram :

1. Dans Telegram, envoyez à votre bot : `/pair`
2. Le bot répond avec deux messages : un message d’instructions et un message séparé contenant le **code de configuration** (facile à copier/coller dans Telegram).
3. Sur votre téléphone, ouvrez l’application OpenClaw iOS → Settings → Gateway.
4. Collez le code de configuration et connectez-vous.
5. De retour dans Telegram : `/pair pending` (passez en revue les ID de demande, le rôle et les scopes), puis approuvez.

Le code de configuration est une charge utile JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket de la Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken` : un jeton bootstrap à appareil unique et de courte durée utilisé pour la poignée de main initiale d’appairage

Ce jeton bootstrap transporte le profil bootstrap d’appairage intégré :

- le jeton `node` principal transmis reste `scopes: []`
- tout jeton `operator` transmis reste limité à la liste d’autorisation bootstrap :
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- les vérifications de scope bootstrap sont préfixées par rôle, et non regroupées dans un seul pool plat :
  les entrées de scope operator ne satisfont que les demandes operator, et les rôles non operator
  doivent toujours demander des scopes sous leur propre préfixe de rôle

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

### Approuver un appareil nœud

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si le même appareil réessaie avec des détails d’authentification différents (par exemple un
rôle/scopes/clé publique différents), la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

Important : un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il
se reconnecte en demandant plus de scopes ou un rôle plus large, OpenClaw conserve
l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez
`openclaw devices list` pour comparer l’accès actuellement approuvé avec l’accès nouvellement
demandé avant d’approuver.

### Approbation automatique optionnelle des nœuds via CIDR approuvé

L’appairage des appareils reste manuel par défaut. Pour des réseaux de nœuds étroitement contrôlés,
vous pouvez activer l’approbation automatique du premier appairage des nœuds avec des CIDR explicites ou des IP exactes :

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

Cela s’applique uniquement aux nouvelles demandes d’appairage `role: node` sans
scopes demandés. Les clients operator, navigateur, Control UI et WebChat nécessitent toujours une
approbation manuelle. Les modifications de rôle, de scope, de métadonnées et de clé publique nécessitent toujours une
approbation manuelle.

### Stockage de l’état de l’appairage des nœuds

Stocké dans `~/.openclaw/devices/` :

- `pending.json` (de courte durée ; les demandes en attente expirent)
- `paired.json` (appareils appairés + jetons)

### Remarques

- L’API héritée `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|rename`) est un
  stockage d’appairage distinct géré par la Gateway. Les nœuds WS nécessitent toujours l’appairage des appareils.
- L’enregistrement d’appairage est la source de vérité durable pour les rôles approuvés. Les
  jetons d’appareil actifs restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Documentation connexe

- Modèle de sécurité + injection de prompt : [Security](/fr/gateway/security)
- Mettre à jour en toute sécurité (exécuter doctor) : [Updating](/fr/install/updating)
- Configurations des canaux :
  - Telegram : [Telegram](/fr/channels/telegram)
  - WhatsApp : [WhatsApp](/fr/channels/whatsapp)
  - Signal : [Signal](/fr/channels/signal)
  - BlueBubbles (iMessage) : [BlueBubbles](/fr/channels/bluebubbles)
  - iMessage (hérité) : [iMessage](/fr/channels/imessage)
  - Discord : [Discord](/fr/channels/discord)
  - Slack : [Slack](/fr/channels/slack)

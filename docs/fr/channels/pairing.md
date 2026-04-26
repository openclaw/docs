---
read_when:
    - Configurer le contrôle d’accès aux messages privés
    - Appairer un nouveau nœud iOS/Android
    - Vérifier la posture de sécurité d’OpenClaw
summary: 'Vue d’ensemble de l’appairage : approuver qui peut vous envoyer des messages privés + quels nœuds peuvent rejoindre'
title: Appairage
x-i18n:
    generated_at: "2026-04-26T11:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

« Appairage » est l’étape explicite d’**approbation par le propriétaire** dans OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage DM** (qui est autorisé à parler au bot)
2. **Appairage de nœud** (quels appareils/nœuds sont autorisés à rejoindre le réseau Gateway)

Contexte de sécurité : [Security](/fr/gateway/security)

## 1) Appairage DM (accès au chat entrant)

Lorsqu’un canal est configuré avec la politique DM `pairing`, les expéditeurs inconnus reçoivent un code court et leur message **n’est pas traité** tant que vous ne l’avez pas approuvé.

Les politiques DM par défaut sont documentées dans : [Security](/fr/gateway/security)

Codes d’appairage :

- 8 caractères, majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message d’appairage que lorsqu’une nouvelle demande est créée (environ une fois par heure et par expéditeur).
- Les demandes d’appairage DM en attente sont plafonnées à **3 par canal** par défaut ; les demandes supplémentaires sont ignorées jusqu’à ce que l’une expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canaux pris en charge : `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Où l’état est stocké

Stocké dans `~/.openclaw/credentials/` :

- Demandes en attente : `<channel>-pairing.json`
- Magasin de liste d’autorisation approuvée :
  - Compte par défaut : `<channel>-allowFrom.json`
  - Compte non par défaut : `<channel>-<accountId>-allowFrom.json`

Comportement de portée des comptes :

- Les comptes non par défaut lisent/écrivent uniquement dans leur fichier de liste d’autorisation à portée dédiée.
- Le compte par défaut utilise le fichier de liste d’autorisation sans portée dédié au canal.

Traitez ces fichiers comme sensibles (ils contrôlent l’accès à votre assistant).

Important : ce magasin concerne l’accès DM. L’autorisation de groupe est distincte.
L’approbation d’un code d’appairage DM n’autorise pas automatiquement cet expéditeur à exécuter des commandes de groupe ni à contrôler le bot dans des groupes. Pour l’accès de groupe, configurez les listes d’autorisation explicites du canal pour les groupes (par exemple `groupAllowFrom`, `groups` ou des remplacements par groupe/par topic selon le canal).

## 2) Appairage d’appareil nœud (nœuds iOS/Android/macOS/headless)

Les nœuds se connectent à la Gateway comme **appareils** avec `role: node`. La Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairer via Telegram (recommandé pour iOS)

Si vous utilisez le Plugin `device-pair`, vous pouvez effectuer le premier appairage d’appareil entièrement depuis Telegram :

1. Dans Telegram, envoyez à votre bot : `/pair`
2. Le bot répond avec deux messages : un message d’instruction et un message séparé contenant le **code de configuration** (facile à copier/coller dans Telegram).
3. Sur votre téléphone, ouvrez l’app OpenClaw iOS → Settings → Gateway.
4. Collez le code de configuration et connectez-vous.
5. De retour dans Telegram : `/pair pending` (consultez les ID de demande, le rôle et les portées), puis approuvez.

Le code de configuration est une charge JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket de la Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken` : un jeton bootstrap temporaire à appareil unique utilisé pour le handshake initial d’appairage

Ce jeton bootstrap porte le profil bootstrap d’appairage intégré :

- le jeton `node` principal transmis reste `scopes: []`
- tout jeton `operator` transmis reste limité à la liste d’autorisation bootstrap :
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- les vérifications de portée bootstrap sont préfixées par rôle, et non regroupées dans un seul pool plat de portées :
  les entrées de portée operator ne satisfont que les demandes operator, et les rôles non operator
  doivent toujours demander des portées sous leur propre préfixe de rôle
- la rotation/révocation ultérieure des jetons reste limitée à la fois par le contrat de rôle approuvé de l’appareil et par les portées operator de la session appelante

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

### Approuver un appareil nœud

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Si le même appareil réessaie avec des détails d’authentification différents (par exemple un
rôle/portées/clé publique différents), la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

Important : un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il
se reconnecte en demandant davantage de portées ou un rôle plus étendu, OpenClaw conserve
l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez
`openclaw devices list` pour comparer l’accès actuellement approuvé avec l’accès nouvellement
demandé avant d’approuver.

### Auto-approbation facultative des nœuds de CIDR de confiance

L’appairage d’appareil reste manuel par défaut. Pour des réseaux de nœuds étroitement contrôlés,
vous pouvez activer l’auto-approbation du premier appairage de nœud avec des CIDR explicites ou des IP exactes :

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
portées demandées. Les clients operator, browser, Control UI et WebChat nécessitent toujours une
approbation manuelle. Les changements de rôle, de portée, de métadonnées et de clé publique nécessitent toujours une
approbation manuelle.

### Stockage de l’état d’appairage des nœuds

Stocké dans `~/.openclaw/devices/` :

- `pending.json` (de courte durée ; les demandes en attente expirent)
- `paired.json` (appareils appairés + jetons)

### Remarques

- L’API héritée `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|rename`) est un
  magasin d’appairage distinct détenu par la gateway. Les nœuds WS nécessitent toujours un appairage d’appareil.
- L’enregistrement d’appairage est la source de vérité durable pour les rôles approuvés. Les
  jetons d’appareil actifs restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Documentation associée

- Modèle de sécurité + injection de prompt : [Security](/fr/gateway/security)
- Mettre à jour en toute sécurité (exécuter doctor) : [Updating](/fr/install/updating)
- Configurations de canal :
  - Telegram : [Telegram](/fr/channels/telegram)
  - WhatsApp : [WhatsApp](/fr/channels/whatsapp)
  - Signal : [Signal](/fr/channels/signal)
  - BlueBubbles (iMessage) : [BlueBubbles](/fr/channels/bluebubbles)
  - iMessage (hérité) : [iMessage](/fr/channels/imessage)
  - Discord : [Discord](/fr/channels/discord)
  - Slack : [Slack](/fr/channels/slack)

---
read_when:
    - Configuration du contrôle d’accès aux messages privés
    - Appairage d’un nouveau Node iOS/Android
    - Examen de la posture de sécurité d’OpenClaw
summary: 'Présentation de l’appairage : approuvez qui peut vous envoyer des messages privés et quels nœuds peuvent se connecter'
title: Appairage
x-i18n:
    generated_at: "2026-07-12T15:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

« L’appairage » est l’étape explicite d’approbation d’accès d’OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage des messages privés** (qui est autorisé à parler au bot)
2. **Appairage des Node** (quels appareils/Node sont autorisés à rejoindre le réseau du Gateway)

Contexte de sécurité : [Sécurité](/fr/gateway/security)

## 1) Appairage des messages privés (accès aux discussions entrantes)

Lorsqu’un canal est configuré avec la politique de messages privés `pairing`, les expéditeurs inconnus reçoivent un code court et leur message n’est **pas traité** tant que vous ne les avez pas approuvés.

Les politiques de messages privés par défaut sont documentées dans : [Sécurité](/fr/gateway/security)

`dmPolicy: "open"` n’est public que lorsque la liste d’autorisation effective des messages privés inclut `"*"`.
La configuration et la validation exigent ce caractère générique pour les configurations publiques ouvertes. Si l’état existant
contient `open` avec des entrées `allowFrom` précises, l’exécution continue de n’autoriser
que ces expéditeurs, et les approbations du registre d’appairage n’élargissent pas l’accès `open`.

Codes d’appairage :

- 8 caractères, en majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message d’appairage que lorsqu’une nouvelle demande est créée (environ une fois par heure et par expéditeur).
- Le nombre de demandes d’appairage de messages privés en attente est limité à **3 par compte de canal** ; les demandes supplémentaires sont ignorées jusqu’à ce que l’une d’elles expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Ajoutez `--notify` à la commande d’approbation pour informer le demandeur sur le même canal. Les canaux multicomptes acceptent `--account <id>`.

Si aucun propriétaire de commandes n’est encore configuré, l’approbation d’un code d’appairage de messages privés initialise également
`commands.ownerAllowFrom` avec l’expéditeur approuvé, par exemple `telegram:123456789`.
Cela fournit aux nouvelles configurations un propriétaire explicite pour les commandes privilégiées et les demandes
d’approbation d’exécution. Une fois qu’un propriétaire existe, les approbations d’appairage ultérieures accordent uniquement l’accès
aux messages privés ; elles n’ajoutent pas d’autres propriétaires.

Canaux pris en charge (tout plugin de canal installé qui déclare l’appairage ; des plugins externes comme `openclaw-weixin` peuvent en ajouter) : `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Groupes d’expéditeurs réutilisables

Utilisez `accessGroups` au niveau supérieur lorsque le même ensemble d’expéditeurs de confiance doit s’appliquer à
plusieurs canaux de messagerie ou à la fois aux listes d’autorisation des messages privés et des groupes.

Les groupes statiques utilisent `type: "message.senders"` et sont référencés avec
`accessGroup:<name>` dans les listes d’autorisation des canaux :

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

### Emplacement de l’état

Stocké dans `~/.openclaw/credentials/` :

- Demandes en attente : `<channel>-pairing.json`
- Registre de la liste d’autorisation approuvée : `<channel>-<accountId>-allowFrom.json` (les approbations du
  compte par défaut utilisent `<channel>-default-allowFrom.json`)

Comportement de la portée des comptes :

- Les comptes autres que celui par défaut lisent et écrivent uniquement leur fichier de liste d’autorisation propre.
- Le compte par défaut continue également de prendre en charge un ancien fichier non limité à un compte `<channel>-allowFrom.json`
  provenant d’installations antérieures ; les entrées des deux fichiers sont fusionnées lors de la lecture.

Considérez ces fichiers comme sensibles (ils contrôlent l’accès à votre assistant).

<Note>
Le registre de la liste d’autorisation d’appairage concerne l’accès aux messages privés. L’autorisation des groupes est distincte.
L’approbation d’un code d’appairage de messages privés n’autorise pas automatiquement cet expéditeur à exécuter des
commandes de groupe ni à contrôler le bot dans les groupes. L’initialisation du premier propriétaire constitue un état de configuration
distinct dans `commands.ownerAllowFrom`, et la distribution des discussions de groupe continue de suivre les
listes d’autorisation de groupe du canal (par exemple `groupAllowFrom`, `groups` ou les remplacements propres à chaque groupe
ou sujet, selon le canal).
</Note>

## 2) Appairage des appareils Node (Node iOS/Android/macOS/sans interface)

Les Node se connectent au Gateway comme **appareils** avec `role: node`. Le Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairage depuis l’interface de contrôle (recommandé)

Utilisez une session de l’interface de contrôle déjà connectée disposant de l’accès `operator.admin` :

1. Ouvrez l’interface de contrôle et sélectionnez **Nodes**.
2. Sur la page **Devices**, cliquez sur **Pair mobile device**.
3. Sur votre téléphone, ouvrez l’application OpenClaw → **Settings** → **Gateway**.
4. Scannez le code QR ou collez le code de configuration, puis connectez-vous.

Les applications OpenClaw officielles pour iOS et Android sont approuvées automatiquement lorsque les métadonnées de leur
code de configuration correspondent. Si **Pending approval** affiche une demande (par
exemple pour un client non officiel ou des métadonnées non concordantes), examinez son rôle et
ses portées avant de l’approuver.

Le bouton est désactivé lorsque la session actuelle de l’interface de contrôle ne dispose pas de
l’accès administrateur. Dans ce cas, utilisez le processus d’approbation par CLI ci-dessous depuis l’hôte du Gateway.

### Appairage via Telegram

Si vous utilisez le plugin `device-pair`, vous pouvez effectuer entièrement le premier appairage de l’appareil depuis Telegram :

1. Dans Telegram, envoyez à votre bot : `/pair`
2. Le bot répond avec deux messages : un message d’instructions et un message distinct contenant le **code de configuration** (facile à copier-coller dans Telegram).
3. Sur votre téléphone, ouvrez l’application OpenClaw pour iOS → Settings → Gateway.
4. Scannez le code QR (`/pair qr`) ou collez le code de configuration et connectez-vous.
5. L’application mobile officielle se connecte automatiquement. Si `/pair pending` affiche une
   demande, examinez son rôle et ses portées avant de l’approuver.

Le code de configuration est une charge utile JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket du Gateway (`ws://...` ou `wss://...`)
- `urls` : lorsqu’elles sont disponibles, les routes LAN/Tailnet ordonnées que l’application mobile peut essayer
- `bootstrapToken` : un jeton d’initialisation à usage unique pour la négociation d’appairage initiale ; le Gateway le fait expirer après 10 minutes

Exécutez `/pair cleanup` pour invalider les codes de configuration inutilisés une fois l’appairage terminé.

Ce jeton d’initialisation comporte le profil d’initialisation d’appairage intégré :

- le profil de configuration intégré autorise uniquement la base de référence du nouveau code QR/code de configuration :
  `node` plus un transfert `operator` limité
- le jeton `node` transféré conserve `scopes: []`
- le jeton `operator` transféré est limité à `operator.approvals`,
  `operator.read`, `operator.talk.secrets` et `operator.write`
- `operator.admin` n’est pas accordé par l’initialisation au moyen d’un code QR/code de configuration ; il nécessite un
  processus distinct d’appairage d’opérateur approuvé ou de jeton
- la rotation ou la révocation ultérieure des jetons reste limitée à la fois par le contrat de rôle approuvé
  de l’appareil et par les portées d’opérateur de la session appelante

Traitez le code de configuration comme un mot de passe tant qu’il est valide.

Pour l’appairage mobile à distance via Tailscale, un réseau public ou autre, utilisez Tailscale Serve/Funnel
ou une autre URL de Gateway en `wss://`. Les codes de configuration en texte clair `ws://` ne sont acceptés que
pour la boucle locale, les adresses LAN privées, les hôtes Bonjour `.local` et l’hôte de
l’émulateur Android. Les adresses CGNAT Tailnet, les noms `.ts.net` et les hôtes publics continuent
d’échouer de manière fermée avant l’émission du code QR/code de configuration.

Pour les URL de configuration avec `gateway.bind=lan`, OpenClaw détecte les racines HTTPS persistantes de Tailscale Serve
qui servent de proxy au port de boucle locale du Gateway actif et les annonce
avec la route LAN. La commande de configuration ajoute cette solution de repli uniquement
pour `lan` ; `custom` et `tailnet` conservent leurs routes explicitement annoncées. L’application
iOS teste les routes annoncées dans l’ordre et enregistre le premier
point de terminaison accessible.

### Approuver un appareil Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Lorsqu’une approbation explicite est refusée parce que la session de l’appareil appairé qui l’approuve
a été ouverte avec une portée limitée à l’appairage, la CLI retente la même demande avec
`operator.admin`. Cela permet à un appareil appairé existant disposant de capacités d’administration de restaurer un nouvel
appairage de l’interface de contrôle/du navigateur sans modifier manuellement le registre d’appairage. Le
Gateway valide toujours la nouvelle tentative de connexion ; les jetons qui ne peuvent pas s’authentifier
avec `operator.admin` restent bloqués.

Si le même appareil réessaie avec des informations d’authentification différentes (par exemple un
rôle, des portées ou une clé publique différents), la demande en attente précédente est remplacée et un nouveau
`requestId` est créé.

<Note>
Un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il se reconnecte en demandant davantage de portées ou un rôle plus large, OpenClaw conserve l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez `openclaw devices list` pour comparer l’accès actuellement approuvé au nouvel accès demandé avant d’approuver.
</Note>

### Approbation automatique facultative des Node par CIDR de confiance

L’appairage des appareils reste manuel par défaut. Pour les réseaux de Node étroitement contrôlés,
vous pouvez activer l’approbation automatique des nouveaux Node avec des CIDR explicites ou des adresses IP exactes :

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

Cela s’applique uniquement aux nouvelles demandes d’appairage avec `role: node` qui ne demandent aucune
portée. Les clients opérateur, navigateur, interface de contrôle et WebChat nécessitent toujours une
approbation manuelle. Les modifications du rôle, des portées, des métadonnées et de la clé publique nécessitent toujours une
approbation manuelle.

### Stockage de l’état d’appairage des Node

Stocké dans la base de données d’état SQLite partagée à l’emplacement `~/.openclaw/state/openclaw.sqlite` :

- demandes d’appairage d’appareils en attente (de courte durée ; elles expirent après 5 minutes)
- appareils appairés et jetons

Les anciens Gateway conservaient cet état dans `~/.openclaw/devices/*.json` ; ces fichiers sont
importés dans SQLite au démarrage du Gateway et archivés avec le suffixe `.migrated`.

### Remarques

- L’API `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|remove|rename`) gère
  les approbations de capacités des Node stockées dans les mêmes enregistrements d’appareils appairés. Les Node WS
  nécessitent toujours un appairage d’appareil ; consultez [Appairage des Node](/fr/gateway/pairing).
- L’enregistrement d’appairage est la source de référence durable des rôles approuvés. Les jetons
  d’appareil actifs restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  ne correspondant pas aux rôles approuvés ne crée pas de nouvel accès.

## Documentation associée

- Modèle de sécurité et injection de prompt : [Sécurité](/fr/gateway/security)
- Mise à jour sécurisée (exécutez doctor) : [Mise à jour](/fr/install/updating)
- Configurations des canaux :
  - Telegram : [Telegram](/fr/channels/telegram)
  - WhatsApp : [WhatsApp](/fr/channels/whatsapp)
  - Signal : [Signal](/fr/channels/signal)
  - iMessage : [iMessage](/fr/channels/imessage)
  - Discord : [Discord](/fr/channels/discord)
  - Slack : [Slack](/fr/channels/slack)

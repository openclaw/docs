---
read_when:
    - Configuration du contrôle d’accès aux messages privés
    - Association d’un nouveau Node iOS/Android
    - Examen de la posture de sécurité d’OpenClaw
summary: 'Présentation de l’appairage : approuvez qui peut vous envoyer des messages privés et quels nœuds peuvent rejoindre le réseau'
title: Appairage
x-i18n:
    generated_at: "2026-07-16T13:04:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

L’« appairage » est l’étape explicite d’approbation de l’accès d’OpenClaw.
Il est utilisé à deux endroits :

1. **Appairage des messages privés** (qui est autorisé à parler au bot)
2. **Appairage des Node** (quels appareils/Node sont autorisés à rejoindre le réseau du Gateway)

Contexte de sécurité : [Sécurité](/fr/gateway/security)

## 1) Appairage des messages privés (accès aux discussions entrantes)

Lorsqu’un canal est configuré avec la politique de messages privés `pairing`, les expéditeurs inconnus reçoivent un code court et leur message n’est **pas traité** tant que vous ne les avez pas approuvés.

Les politiques de messages privés par défaut sont documentées dans : [Sécurité](/fr/gateway/security)

`dmPolicy: "open"` n’est public que lorsque la liste d’autorisation effective des messages privés inclut `"*"`.
La configuration et la validation exigent ce caractère générique pour les configurations publiques ouvertes. Si l’état existant
contient `open` avec des entrées `allowFrom` concrètes, l’exécution continue de n’admettre
que ces expéditeurs, et les approbations du magasin d’appairage n’élargissent pas l’accès `open`.

Codes d’appairage :

- 8 caractères, en majuscules, sans caractères ambigus (`0O1I`).
- **Expirent après 1 heure**. Le bot n’envoie le message d’appairage que lors de la création d’une nouvelle demande (environ une fois par heure et par expéditeur).
- Les demandes d’appairage de messages privés en attente sont limitées à **3 par compte de canal** ; les demandes supplémentaires sont ignorées jusqu’à ce que l’une d’elles expire ou soit approuvée.

### Approuver un expéditeur

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Ajoutez `--notify` à la commande d’approbation pour informer le demandeur sur le même canal. Les canaux multicomptes acceptent `--account <id>`.

Si aucun propriétaire de commande n’est encore configuré, l’approbation d’un code d’appairage de message privé initialise également
`commands.ownerAllowFrom` avec l’expéditeur approuvé, tel que `telegram:123456789`.
Cela fournit aux configurations initiales un propriétaire explicite pour les commandes privilégiées et les invites
d’approbation d’exécution. Une fois qu’un propriétaire existe, les approbations d’appairage ultérieures accordent uniquement l’accès
aux messages privés ; elles n’ajoutent pas d’autres propriétaires.

Canaux pris en charge (tout plugin de canal installé qui déclare l’appairage ; des plugins externes tels que `openclaw-weixin` peuvent en ajouter d’autres) : `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Groupes d’expéditeurs réutilisables

Utilisez `accessGroups` au niveau supérieur lorsque le même ensemble d’expéditeurs de confiance doit s’appliquer à
plusieurs canaux de messagerie ou à la fois aux listes d’autorisation des messages privés et des groupes.

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

### Emplacement de l’état

Stocké dans la base de données d’état SQLite partagée à l’emplacement
`~/.openclaw/state/openclaw.sqlite` :

- demandes en attente dans `channel_pairing_requests`
- expéditeurs approuvés dans `channel_pairing_allow_entries`

Comportement de la portée des comptes :

- chaque demande et chaque expéditeur approuvé sont indexés par canal et par compte
- l’exécution lit uniquement les lignes SQLite canoniques ; elle ne fusionne pas les anciens fichiers

Les anciennes versions du Gateway écrivaient `<channel>-pairing.json` et
`<channel>-<accountId>-allowFrom.json` sous `~/.openclaw/credentials/`.
La migration au démarrage et `openclaw doctor --fix` importent ces fichiers dans SQLite et
suppriment chaque source après une importation réussie. Considérez la base de données SQLite comme
sensible, car ces lignes contrôlent l’accès à votre assistant.

<Note>
Le magasin de listes d’autorisation d’appairage concerne l’accès aux messages privés. L’autorisation des groupes est distincte.
L’approbation d’un code d’appairage de message privé n’autorise pas automatiquement cet expéditeur à exécuter des
commandes de groupe ni à contrôler le bot dans les groupes. L’initialisation du premier propriétaire correspond à un état de configuration
distinct dans `commands.ownerAllowFrom`, et la distribution des discussions de groupe continue de suivre les
listes d’autorisation de groupe du canal (par exemple `groupAllowFrom`, `groups`, ou les remplacements propres à chaque groupe
ou sujet selon le canal).
</Note>

## 2) Appairage des appareils Node (Node iOS/Android/macOS/sans interface)

Les Node se connectent au Gateway en tant qu’**appareils** avec `role: node`. Le Gateway
crée une demande d’appairage d’appareil qui doit être approuvée.

### Appairer depuis l’interface de contrôle (recommandé)

Utilisez une session d’interface de contrôle déjà connectée avec l’accès `operator.admin` :

1. Ouvrez l’interface de contrôle et accédez à **Settings → Devices**.
2. Sur la page **Devices**, cliquez sur **Pair mobile device**.
3. Conservez **Full access (recommended)**, ou sélectionnez **Limited access** pour exclure
   les contrôles administratifs du Gateway.
4. Cliquez sur **Create setup code**.
5. Sur votre téléphone, ouvrez l’application OpenClaw → **Settings** → **Gateway**.
6. Scannez le code QR ou collez le code de configuration, puis connectez-vous.

Les applications OpenClaw officielles pour iOS et Android sont approuvées automatiquement lorsque leurs
métadonnées de code de configuration correspondent. Si **Pending approval** affiche une demande (par
exemple pour un client non officiel ou des métadonnées incompatibles), examinez son rôle et
ses portées avant de l’approuver.

Le bouton est désactivé lorsque la session actuelle de l’interface de contrôle ne dispose pas d’un
accès administrateur. Dans ce cas, utilisez depuis l’hôte du Gateway le processus d’approbation par CLI
ci-dessous.

### Appairer via Telegram

Si vous utilisez le plugin `device-pair`, vous pouvez effectuer le premier appairage d’un appareil entièrement depuis Telegram :

1. Dans Telegram, envoyez à votre bot : `/pair`
2. Le bot répond avec deux messages : un message d’instructions et un message **setup code** distinct (facile à copier-coller dans Telegram).
3. Sur votre téléphone, ouvrez l’application OpenClaw pour iOS → Settings → Gateway.
4. Scannez le code QR (`/pair qr`) ou collez le code de configuration, puis connectez-vous.
5. L’application mobile officielle se connecte automatiquement. Si `/pair pending` affiche une
   demande, examinez son rôle et ses portées avant de l’approuver.

Le code de configuration est une charge utile JSON encodée en base64 qui contient :

- `url` : l’URL WebSocket du Gateway (`ws://...` ou `wss://...`)
- `urls` : lorsqu’elles sont disponibles, les routes LAN/Tailnet ordonnées que l’application mobile peut essayer
- `bootstrapToken` : un jeton d’amorçage à usage unique pour la négociation d’appairage initiale ; le Gateway le fait expirer après 10 minutes

Exécutez `/pair cleanup` pour invalider les codes de configuration inutilisés une fois l’appairage terminé.

Ce jeton d’amorçage porte le profil d’amorçage d’appairage intégré :

- une configuration `wss://` sécurisée (ou une boucle locale sur le même hôte) utilise par défaut `node` ainsi qu’un accès
  natif mobile `operator` complet
- le jeton `node` transmis reste `scopes: []`
- le jeton `operator` transmis par défaut inclut `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` et
  `operator.write`
- l’option **Limited access** de l’interface de contrôle et `openclaw qr --limited` omettent
  `operator.admin` tout en conservant les autres portées d’opérateur
- une configuration `ws://` en texte clair sur le LAN utilise automatiquement le même profil limité ;
  configurez `wss://` ou Tailscale Serve et générez un nouveau code pour obtenir un accès complet
- la rotation ou révocation ultérieure du jeton reste limitée à la fois par le contrat de rôle approuvé
  de l’appareil et par les portées d’opérateur de la session appelante

Traitez le code de configuration comme un mot de passe pendant sa durée de validité.

Les pages **Settings → Gateway** d’iOS et d’Android affichent un accès **Full** ou **Limited**.
Pour mettre à niveau un téléphone à accès limité, configurez d’abord une route `wss://` sécurisée ou
Tailscale Serve, puis générez un nouveau code de configuration à accès complet, scannez-le ou collez-le
dans cette page de paramètres et reconnectez-vous.

Pour l’appairage mobile via Tailscale, un réseau public ou un autre accès distant, utilisez Tailscale Serve/Funnel
ou une autre URL `wss://` du Gateway. Les codes de configuration `ws://` en texte clair sont acceptés uniquement
pour la boucle locale, les adresses LAN privées, les hôtes Bonjour `.local` et l’hôte de
l’émulateur Android. Les routes en texte clair hors boucle locale reçoivent un accès limité. Les adresses
CGNAT du Tailnet, les noms `.ts.net` et les hôtes publics sont toujours refusés par défaut avant
l’émission du code QR ou du code de configuration.

Pour les URL de configuration `gateway.bind=lan`, OpenClaw détecte les racines HTTPS persistantes de Tailscale Serve
qui transmettent le port de boucle locale du Gateway actif et les publie
avec la route LAN. La commande de configuration ajoute cette solution de repli uniquement
pour `lan` ; `custom` et `tailnet` conservent leurs routes explicitement publiées. L’application
iOS teste les routes publiées dans l’ordre et enregistre le premier
point de terminaison accessible.

### Approuver un appareil Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Lorsqu’une approbation explicite est refusée parce que la session de l’appareil appairé qui donne l’approbation
a été ouverte avec une portée limitée à l’appairage, la CLI relance la même demande avec
`operator.admin`. Cela permet à un appareil appairé existant doté de capacités d’administration de rétablir un nouvel
appairage d’interface de contrôle ou de navigateur sans modifier manuellement le magasin d’appairage. Le
Gateway valide toujours la nouvelle tentative de connexion ; les jetons qui ne peuvent pas s’authentifier
avec `operator.admin` restent bloqués.

Si le même appareil réessaie avec des informations d’authentification différentes (par exemple un
rôle, des portées ou une clé publique différents), la demande en attente précédente est remplacée et un nouvel
`requestId` est créé.

<Note>
Un appareil déjà appairé n’obtient pas silencieusement un accès plus large. S’il se reconnecte en demandant davantage de portées ou un rôle plus large, OpenClaw conserve l’approbation existante telle quelle et crée une nouvelle demande de mise à niveau en attente. Utilisez `openclaw devices list` pour comparer l’accès actuellement approuvé au nouvel accès demandé avant de l’approuver.
</Note>

### Approbation automatique facultative des Node par CIDR de confiance

L’appairage des appareils reste manuel par défaut. Pour les réseaux de Node strictement contrôlés,
vous pouvez activer l’approbation automatique du premier appairage d’un Node avec des CIDR ou des adresses IP exactes explicites :

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

Cela s’applique uniquement aux nouvelles demandes d’appairage `role: node` sans portée
demandée. Les clients opérateur, navigateur, interface de contrôle et WebChat nécessitent toujours une approbation
manuelle. Les modifications du rôle, de la portée, des métadonnées et de la clé publique nécessitent toujours une approbation
manuelle.

### Stockage de l’état d’appairage des Node

Stocké dans la base de données d’état SQLite partagée à l’emplacement `~/.openclaw/state/openclaw.sqlite` :

- demandes d’appairage d’appareils en attente (de courte durée ; elles expirent après 5 minutes)
- appareils appairés + jetons

Les anciennes versions du Gateway conservaient cet état dans `~/.openclaw/devices/*.json` ; ces fichiers sont
importés dans SQLite au démarrage du Gateway et archivés avec un suffixe `.migrated`.

### Remarques

- L’API `node.pair.*` (CLI : `openclaw nodes pending|approve|reject|remove|rename`) gère
  les approbations de capacités des Node stockées dans les mêmes enregistrements d’appareils appairés. Les Node WS
  nécessitent toujours l’appairage de l’appareil ; consultez [Appairage des Node](/fr/gateway/pairing).
- L’enregistrement d’appairage constitue la source de vérité durable pour les rôles approuvés. Les jetons
  d’appareil actifs restent limités à cet ensemble de rôles approuvés ; une entrée de jeton isolée
  en dehors des rôles approuvés ne crée pas de nouvel accès.

## Documentation connexe

- Modèle de sécurité + injection de prompt : [Sécurité](/fr/gateway/security)
- Mise à jour sécurisée (exécuter doctor) : [Mise à jour](/fr/install/updating)
- Configurations des canaux :
  - Telegram : [Telegram](/fr/channels/telegram)
  - WhatsApp : [WhatsApp](/fr/channels/whatsapp)
  - Signal : [Signal](/fr/channels/signal)
  - iMessage : [iMessage](/fr/channels/imessage)
  - Discord : [Discord](/fr/channels/discord)
  - Slack : [Slack](/fr/channels/slack)

---
read_when:
    - Configurer Matrix dans OpenClaw
    - Configurer le chiffrement de bout en bout et la vérification de Matrix
summary: État de la prise en charge de Matrix, configuration initiale et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix est un plugin de canal fourni avec OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les MP, les salons, les fils, les médias, les réactions, les sondages, la localisation et le chiffrement de bout en bout.

## Plugin fourni

Matrix est inclus comme plugin fourni dans les versions actuelles d'OpenClaw, donc les
builds packagées normales ne nécessitent pas d'installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui n'inclut pas Matrix, installez-le
manuellement :

Installer depuis npm :

```bash
openclaw plugins install @openclaw/matrix
```

Installer depuis une copie locale :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consultez [Plugins](/fr/tools/plugin) pour le comportement des plugins et les règles d'installation.

## Configuration initiale

1. Assurez-vous que le plugin Matrix est disponible.
   - Les versions packagées actuelles d'OpenClaw l'incluent déjà.
   - Les installations anciennes/personnalisées peuvent l'ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Redémarrez la Gateway.
5. Lancez un MP avec le bot ou invitez-le dans un salon.
   - Les nouvelles invitations Matrix ne fonctionnent que lorsque `channels.matrix.autoJoin` les autorise.

Chemins de configuration interactifs :

```bash
openclaw channels add
openclaw configure --section channels
```

L'assistant Matrix demande :

- l'URL du homeserver
- la méthode d'authentification : jeton d'accès ou mot de passe
- l'ID utilisateur (authentification par mot de passe uniquement)
- le nom d'appareil facultatif
- s'il faut activer le chiffrement de bout en bout
- s'il faut configurer l'accès aux salons et la jointure automatique sur invitation

Comportements clés de l'assistant :

- Si des variables d'environnement d'authentification Matrix existent déjà et que ce compte n'a pas encore d'authentification enregistrée dans la configuration, l'assistant propose un raccourci via variables d'environnement pour conserver l'authentification dans les variables d'environnement.
- Les noms de compte sont normalisés vers l'ID de compte. Par exemple, `Ops Bot` devient `ops-bot`.
- Les entrées de liste d'autorisation de MP acceptent directement `@user:server` ; les noms d'affichage ne fonctionnent que lorsqu'une recherche en direct dans l'annuaire trouve une correspondance exacte unique.
- Les entrées de liste d'autorisation de salons acceptent directement les IDs et les alias de salon. Préférez `!room:server` ou `#alias:server` ; les noms non résolus sont ignorés à l'exécution lors de la résolution de la liste d'autorisation.
- En mode liste d'autorisation pour la jointure automatique sur invitation, utilisez uniquement des cibles d'invitation stables : `!roomId:server`, `#alias:server` ou `*`. Les noms de salon simples sont rejetés.
- Pour résoudre des noms de salon avant l'enregistrement, utilisez `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` est désactivé par défaut (`off`).

Si vous le laissez non défini, le bot ne rejoindra pas les salons invités ni les nouvelles invitations de type MP ; il n'apparaîtra donc pas dans les nouveaux groupes ni dans les MP sur invitation, sauf si vous le faites rejoindre manuellement d'abord.

Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour restreindre les invitations qu'il accepte, ou définissez `autoJoin: "always"` si vous voulez qu'il rejoigne toutes les invitations.

En mode `allowlist`, `autoJoinAllowlist` n'accepte que `!roomId:server`, `#alias:server` ou `*`.
</Warning>

Exemple de liste d'autorisation :

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Rejoindre toutes les invitations :

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configuration minimale basée sur un jeton :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuration basée sur un mot de passe (le jeton est mis en cache après connexion) :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix stocke les informations d'authentification mises en cache dans `~/.openclaw/credentials/matrix/`.
Le compte par défaut utilise `credentials.json` ; les comptes nommés utilisent `credentials-<account>.json`.
Lorsque des informations d'authentification mises en cache existent à cet emplacement, OpenClaw considère Matrix comme configuré pour la configuration initiale, doctor et la découverte de l'état du canal, même si l'authentification actuelle n'est pas définie directement dans la configuration.

Équivalents en variables d'environnement (utilisés lorsque la clé de configuration n'est pas définie) :

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Pour les comptes non par défaut, utilisez des variables d'environnement propres au compte :

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemple pour le compte `ops` :

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Pour l'ID de compte normalisé `ops-bot`, utilisez :

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix échappe la ponctuation dans les IDs de compte pour éviter les collisions entre variables d'environnement propres au compte.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` correspond à `MATRIX_OPS_X2D_PROD_*`.

L'assistant interactif ne propose le raccourci via variables d'environnement que lorsque ces variables d'authentification sont déjà présentes et que le compte sélectionné n'a pas déjà d'authentification Matrix enregistrée dans la configuration.

## Exemple de configuration

Voici une configuration de base pratique avec appairage des MP, liste d'autorisation de salons et chiffrement de bout en bout activé :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` s'applique à toutes les invitations Matrix, y compris les invitations de type MP. OpenClaw ne peut pas
classifier de manière fiable un salon invité comme MP ou groupe au moment de l'invitation, donc toutes les invitations passent d'abord par `autoJoin`.
`dm.policy` s'applique après que le bot a rejoint le salon et que le salon a été classé comme MP.

## Aperçus en streaming

Le streaming des réponses Matrix est optionnel.

Définissez `channels.matrix.streaming` sur `"partial"` lorsque vous voulez qu'OpenClaw envoie une seule réponse d'aperçu en direct,
modifie cet aperçu sur place pendant que le modèle génère le texte, puis le finalise lorsque la
réponse est terminée :

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` est la valeur par défaut. OpenClaw attend la réponse finale et l'envoie une seule fois.
- `streaming: "partial"` crée un message d'aperçu modifiable pour le bloc assistant actuel en utilisant des messages texte Matrix normaux. Cela préserve le comportement historique de notification « aperçu d'abord » de Matrix ; les clients standard peuvent donc notifier sur le premier texte d'aperçu diffusé au lieu du bloc terminé.
- `streaming: "quiet"` crée un aperçu discret modifiable pour le bloc assistant actuel. Utilisez-le uniquement si vous configurez aussi des règles push côté destinataire pour les modifications d'aperçu finalisées.
- `blockStreaming: true` active des messages de progression Matrix distincts. Avec le streaming d'aperçu activé, Matrix conserve le brouillon en direct du bloc actuel et préserve les blocs terminés comme messages distincts.
- Lorsque le streaming d'aperçu est activé et que `blockStreaming` est désactivé, Matrix modifie le brouillon en direct sur place et finalise ce même événement lorsque le bloc ou le tour se termine.
- Si l'aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming d'aperçu et revient à la livraison finale normale.
- Les réponses avec médias envoient toujours les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le supprime avant d'envoyer la réponse média finale.
- Les modifications d'aperçu coûtent des appels supplémentaires à l'API Matrix. Laissez le streaming désactivé si vous voulez le comportement le plus conservateur vis-à-vis des limites de débit.

`blockStreaming` n'active pas à lui seul les aperçus de brouillon.
Utilisez `streaming: "partial"` ou `streaming: "quiet"` pour les modifications d'aperçu ; puis ajoutez `blockStreaming: true` uniquement si vous voulez aussi que les blocs assistant terminés restent visibles comme messages de progression distincts.

Si vous avez besoin des notifications Matrix standard sans règles push personnalisées, utilisez `streaming: "partial"` pour un comportement « aperçu d'abord » ou laissez `streaming` désactivé pour une livraison finale uniquement. Avec `streaming: "off"` :

- `blockStreaming: true` envoie chaque bloc terminé comme un message Matrix normal avec notification.
- `blockStreaming: false` envoie uniquement la réponse finale complète comme un message Matrix normal avec notification.

### Règles push auto-hébergées pour des aperçus finalisés discrets

Si vous exploitez votre propre infrastructure Matrix et souhaitez que les aperçus discrets ne notifient que lorsqu'un bloc ou la
réponse finale est terminée, définissez `streaming: "quiet"` et ajoutez une règle push par utilisateur pour les modifications d'aperçu finalisées.

Il s'agit généralement d'une configuration au niveau de l'utilisateur destinataire, et non d'un changement global de configuration du homeserver :

Repère rapide avant de commencer :

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix OpenClaw qui envoie la réponse
- utilisez le jeton d'accès de l'utilisateur destinataire pour les appels API ci-dessous
- faites correspondre `sender` dans la règle push avec le MXID complet de l'utilisateur bot

1. Configurez OpenClaw pour utiliser des aperçus discrets :

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Assurez-vous que le compte destinataire reçoit déjà les notifications push Matrix normales. Les règles
   d'aperçu discret ne fonctionnent que si cet utilisateur a déjà des pushers/appareils opérationnels.

3. Récupérez le jeton d'accès de l'utilisateur destinataire.
   - Utilisez le jeton de l'utilisateur receveur, pas celui du bot.
   - Réutiliser un jeton de session client existant est généralement le plus simple.
   - Si vous devez générer un nouveau jeton, vous pouvez vous connecter via l'API Client-Server Matrix standard :

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Vérifiez que le compte destinataire a déjà des pushers :

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si cela ne renvoie aucun pusher/appareil actif, corrigez d'abord les notifications Matrix normales avant d'ajouter la
règle OpenClaw ci-dessous.

OpenClaw marque les modifications d'aperçu finalisées contenant uniquement du texte avec :

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Créez une règle push de substitution pour chaque compte destinataire qui doit recevoir ces notifications :

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Remplacez ces valeurs avant d'exécuter la commande :

- `https://matrix.example.org` : l'URL de base de votre homeserver
- `$USER_ACCESS_TOKEN` : le jeton d'accès de l'utilisateur receveur
- `openclaw-finalized-preview-botname` : un ID de règle unique à ce bot pour cet utilisateur receveur
- `@bot:example.org` : le MXID de votre bot Matrix OpenClaw, pas le MXID de l'utilisateur receveur

Important pour les configurations avec plusieurs bots :

- Les règles push sont indexées par `ruleId`. Réexécuter `PUT` sur le même ID de règle met à jour cette règle.
- Si un même utilisateur receveur doit recevoir des notifications de plusieurs comptes bots Matrix OpenClaw, créez une règle par bot avec un ID de règle unique pour chaque correspondance de l'expéditeur.
- Un modèle simple est `openclaw-finalized-preview-<botname>`, par exemple `openclaw-finalized-preview-ops` ou `openclaw-finalized-preview-support`.

La règle est évaluée par rapport à l'expéditeur de l'événement :

- authentifiez-vous avec le jeton de l'utilisateur receveur
- faites correspondre `sender` au MXID du bot OpenClaw

6. Vérifiez que la règle existe :

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testez une réponse en streaming. En mode discret, le salon doit afficher un brouillon d'aperçu discret et la
   modification finale sur place doit déclencher une notification une fois le bloc ou le tour terminé.

Si vous devez supprimer la règle plus tard, supprimez ce même ID de règle avec le jeton de l'utilisateur receveur :

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Remarques :

- Créez la règle avec le jeton d'accès de l'utilisateur receveur, pas celui du bot.
- Les nouvelles règles `override` définies par l'utilisateur sont insérées avant les règles de suppression par défaut, donc aucun paramètre d'ordre supplémentaire n'est nécessaire.
- Cela n'affecte que les modifications d'aperçu contenant uniquement du texte qu'OpenClaw peut finaliser en toute sécurité sur place. Les solutions de repli pour les médias et les aperçus obsolètes utilisent toujours la livraison Matrix normale.
- Si `GET /_matrix/client/v3/pushers` n'affiche aucun pusher, l'utilisateur n'a pas encore de livraison push Matrix fonctionnelle pour ce compte/appareil.

#### Synapse

Pour Synapse, la configuration ci-dessus est généralement suffisante à elle seule :

- Aucun changement spécial dans `homeserver.yaml` n'est nécessaire pour les notifications d'aperçu OpenClaw finalisé.
- Si votre déploiement Synapse envoie déjà des notifications push Matrix normales, le jeton utilisateur + l'appel `pushrules` ci-dessus constituent l'étape principale de configuration.
- Si vous exécutez Synapse derrière un proxy inverse ou des workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse.
- Si vous utilisez des workers Synapse, assurez-vous que les pushers sont en bon état. La livraison push est gérée par le processus principal ou par `synapse.app.pusher` / les workers pusher configurés.

#### Tuwunel

Pour Tuwunel, utilisez le même flux de configuration et le même appel d'API `pushrules` que ci-dessus :

- Aucune configuration spécifique à Tuwunel n'est requise pour le marqueur d'aperçu finalisé lui-même.
- Si les notifications Matrix normales fonctionnent déjà pour cet utilisateur, le jeton utilisateur + l'appel `pushrules` ci-dessus constituent l'étape principale de configuration.
- Si les notifications semblent disparaître pendant que l'utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans Tuwunel 1.4.2 le 12 septembre 2025, et elle peut intentionnellement supprimer les notifications push vers d'autres appareils pendant qu'un appareil est actif.

## Salons bot à bot

Par défaut, les messages Matrix provenant d'autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous voulez intentionnellement du trafic Matrix inter-agents :

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accepte les messages d'autres comptes bots Matrix configurés dans les salons et MP autorisés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu'ils mentionnent visiblement ce bot dans les salons. Les MP restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon donné.
- OpenClaw ignore toujours les messages provenant du même ID utilisateur Matrix afin d'éviter les boucles d'autoréponse.
- Matrix n'expose pas ici d'indicateur natif de bot ; OpenClaw considère « rédigé par un bot » comme « envoyé par un autre compte Matrix configuré sur cette Gateway OpenClaw ».

Utilisez des listes d'autorisation de salons strictes et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d'image sortants utilisent `thumbnail_file` afin que les aperçus d'image soient chiffrés en même temps que la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n'est nécessaire — le plugin détecte automatiquement l'état E2EE.

Activer le chiffrement :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Vérifier l'état de la vérification :

```bash
openclaw matrix verify status
```

État détaillé (diagnostic complet) :

```bash
openclaw matrix verify status --verbose
```

Inclure la clé de récupération stockée dans la sortie lisible par machine :

```bash
openclaw matrix verify status --include-recovery-key --json
```

Initialiser l'état de signature croisée et de vérification :

```bash
openclaw matrix verify bootstrap
```

Diagnostic détaillé de l'initialisation :

```bash
openclaw matrix verify bootstrap --verbose
```

Forcer une réinitialisation complète de l'identité de signature croisée avant l'initialisation :

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Vérifier cet appareil avec une clé de récupération :

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Détails détaillés de la vérification de l'appareil :

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Vérifier l'état de santé de la sauvegarde des clés de salon :

```bash
openclaw matrix verify backup status
```

Diagnostic détaillé de la sauvegarde :

```bash
openclaw matrix verify backup status --verbose
```

Restaurer les clés de salon depuis la sauvegarde serveur :

```bash
openclaw matrix verify backup restore
```

Diagnostic détaillé de la restauration :

```bash
openclaw matrix verify backup restore --verbose
```

Supprimer la sauvegarde serveur actuelle et créer une nouvelle base de référence de sauvegarde. Si la
clé de sauvegarde stockée ne peut pas être chargée correctement, cette réinitialisation peut aussi recréer le stockage de secrets afin que
les futurs démarrages à froid puissent charger la nouvelle clé de sauvegarde :

```bash
openclaw matrix verify backup reset --yes
```

Toutes les commandes `verify` sont concises par défaut (y compris la journalisation interne discrète du SDK) et n'affichent des diagnostics détaillés qu'avec `--verbose`.
Utilisez `--json` pour une sortie entièrement lisible par machine lors de scripts.

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite, sauf si vous passez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d'abord `channels.matrix.defaultAccount`, sinon ces opérations CLI implicites s'arrêteront et vous demanderont de choisir explicitement un compte.
Utilisez `--account` chaque fois que vous voulez que les opérations de vérification ou d'appareil ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

### Ce que signifie « vérifié »

OpenClaw considère cet appareil Matrix comme vérifié uniquement lorsqu'il est vérifié par votre propre identité de signature croisée.
En pratique, `openclaw matrix verify status --verbose` expose trois signaux de confiance :

- `Locally trusted` : cet appareil n'est approuvé que par le client actuel
- `Cross-signing verified` : le SDK signale l'appareil comme vérifié via la signature croisée
- `Signed by owner` : l'appareil est signé par votre propre clé d'autosignature

`Verified by owner` devient `yes` uniquement lorsque la vérification par signature croisée ou la signature du propriétaire est présente.
La confiance locale seule ne suffit pas pour qu'OpenClaw considère l'appareil comme entièrement vérifié.

### Ce que fait l'initialisation

`openclaw matrix verify bootstrap` est la commande de réparation et de configuration pour les comptes Matrix chiffrés.
Elle effectue tout ce qui suit dans l'ordre :

- initialise le stockage de secrets, en réutilisant une clé de récupération existante quand c'est possible
- initialise la signature croisée et téléverse les clés publiques de signature croisée manquantes
- tente de marquer et de signer de façon croisée l'appareil actuel
- crée une nouvelle sauvegarde côté serveur des clés de salon si aucune n'existe déjà

Si le homeserver exige une authentification interactive pour téléverser les clés de signature croisée, OpenClaw essaie d'abord le téléversement sans authentification, puis avec `m.login.dummy`, puis avec `m.login.password` lorsque `channels.matrix.password` est configuré.

Utilisez `--force-reset-cross-signing` uniquement si vous voulez intentionnellement abandonner l'identité actuelle de signature croisée et en créer une nouvelle.

Si vous voulez intentionnellement abandonner la sauvegarde actuelle des clés de salon et démarrer une nouvelle
base de référence de sauvegarde pour les futurs messages, utilisez `openclaw matrix verify backup reset --yes`.
Faites-le uniquement si vous acceptez qu'un ancien historique chiffré irrécupérable reste
indisponible et qu'OpenClaw puisse recréer le stockage de secrets si le secret de sauvegarde actuel ne peut pas être chargé en toute sécurité.

### Nouvelle base de référence de sauvegarde

Si vous voulez que les futurs messages chiffrés continuent de fonctionner et acceptez de perdre l'ancien historique irrécupérable, exécutez ces commandes dans l'ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Ajoutez `--account <id>` à chaque commande lorsque vous voulez cibler explicitement un compte Matrix nommé.

### Comportement au démarrage

Lorsque `encryption: true`, Matrix définit par défaut `startupVerification` sur `"if-unverified"`.
Au démarrage, si cet appareil n'est toujours pas vérifié, Matrix demandera une auto-vérification dans un autre client Matrix,
évitera les demandes en double lorsqu'une demande est déjà en attente, et appliquera un délai local avant de réessayer après des redémarrages.
Par défaut, les tentatives de demande échouées sont retentées plus tôt que les créations de demande réussies.
Définissez `startupVerification: "off"` pour désactiver les demandes automatiques au démarrage, ou ajustez `startupVerificationCooldownHours`
si vous voulez une fenêtre de nouvelle tentative plus courte ou plus longue.

Le démarrage effectue aussi automatiquement un passage conservateur d'initialisation crypto.
Ce passage essaie d'abord de réutiliser le stockage de secrets actuel et l'identité actuelle de signature croisée, et évite de réinitialiser la signature croisée sauf si vous exécutez un flux explicite de réparation par initialisation.

Si le démarrage trouve malgré tout un état d'initialisation défectueux, OpenClaw peut tenter un chemin de réparation protégé même lorsque `channels.matrix.password` n'est pas configuré.
Si le homeserver exige une UIA basée sur mot de passe pour cette réparation, OpenClaw journalise un avertissement et conserve un démarrage non fatal au lieu d'interrompre le bot.
Si l'appareil actuel est déjà signé par le propriétaire, OpenClaw préserve cette identité au lieu de la réinitialiser automatiquement.

Consultez [Migration Matrix](/fr/install/migrating-matrix) pour le flux complet de mise à niveau, les limites, les commandes de récupération et les messages de migration courants.

### Avis de vérification

Matrix publie les avis du cycle de vie de vérification directement dans le salon strict de MP de vérification sous forme de messages `m.notice`.
Cela inclut :

- les avis de demande de vérification
- les avis de vérification prête (avec des instructions explicites « Vérifier par emoji »)
- les avis de début et de fin de vérification
- les détails SAS (emoji et décimal) lorsqu'ils sont disponibles

Les demandes de vérification entrantes provenant d'un autre client Matrix sont suivies et automatiquement acceptées par OpenClaw.
Pour les flux d'auto-vérification, OpenClaw démarre aussi automatiquement le flux SAS lorsque la vérification par emoji devient disponible et confirme son propre côté.
Pour les demandes de vérification provenant d'un autre utilisateur/appareil Matrix, OpenClaw accepte automatiquement la demande, puis attend que le flux SAS se déroule normalement.
Vous devez toujours comparer les emoji ou le SAS décimal dans votre client Matrix et confirmer « Ils correspondent » là-bas pour terminer la vérification.

OpenClaw n'accepte pas aveuglément les flux en double auto-initiés. Au démarrage, il évite de créer une nouvelle demande lorsqu'une demande d'auto-vérification est déjà en attente.

Les avis de protocole/système de vérification ne sont pas transmis au pipeline de chat de l'agent, donc ils ne produisent pas `NO_REPLY`.

### Hygiène des appareils

D'anciens appareils Matrix gérés par OpenClaw peuvent s'accumuler sur le compte et rendre la confiance dans les salons chiffrés plus difficile à interpréter.
Listez-les avec :

```bash
openclaw matrix devices list
```

Supprimez les appareils OpenClaw gérés obsolètes avec :

```bash
openclaw matrix devices prune-stale
```

### Magasin crypto

Le chiffrement de bout en bout Matrix utilise le chemin crypto Rust officiel de `matrix-js-sdk` dans Node, avec `fake-indexeddb` comme shim IndexedDB. L'état crypto est conservé dans un fichier d'instantané (`crypto-idb-snapshot.json`) et restauré au démarrage. Le fichier d'instantané est un état d'exécution sensible stocké avec des permissions de fichier restrictives.

L'état d'exécution chiffré se trouve sous des racines par compte, par utilisateur, par hachage de jeton dans
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ce répertoire contient le magasin de synchronisation (`bot-storage.json`), le magasin crypto (`crypto/`),
le fichier de clé de récupération (`recovery-key.json`), l'instantané IndexedDB (`crypto-idb-snapshot.json`),
les liaisons de fils (`thread-bindings.json`) et l'état de vérification au démarrage (`startup-verification.json`).
Lorsque le jeton change mais que l'identité du compte reste la même, OpenClaw réutilise la meilleure racine existante
pour ce tuple compte/homeserver/utilisateur afin que l'état de synchronisation antérieur, l'état crypto, les liaisons de fils
et l'état de vérification au démarrage restent visibles.

## Gestion du profil

Mettez à jour le profil Matrix du compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` lorsque vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d'avatar `mxc://`. Lorsque vous passez une URL d'avatar `http://` ou `https://`, OpenClaw la téléverse d'abord dans Matrix puis enregistre l'URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans la substitution du compte sélectionné).

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et les envois d'outils de message.

- `dm.sessionScope: "per-user"` (par défaut) conserve le routage des MP Matrix avec une portée par expéditeur, de sorte que plusieurs salons de MP peuvent partager une session lorsqu'ils se résolvent vers le même pair.
- `dm.sessionScope: "per-room"` isole chaque salon de MP Matrix dans sa propre clé de session tout en utilisant l'authentification MP normale et les vérifications de liste d'autorisation.
- Les liaisons explicites de conversation Matrix priment toujours sur `dm.sessionScope`, de sorte que les salons et fils liés conservent leur session cible choisie.
- `threadReplies: "off"` conserve les réponses au niveau supérieur et garde les messages entrants dans des fils sur la session parente.
- `threadReplies: "inbound"` répond dans un fil uniquement lorsque le message entrant était déjà dans ce fil.
- `threadReplies: "always"` conserve les réponses du salon dans un fil ancré au message déclencheur et route cette conversation via la session à portée de fil correspondante à partir du premier message déclencheur.
- `dm.threadReplies` remplace le paramètre de niveau supérieur pour les MP uniquement. Par exemple, vous pouvez garder les fils de salon isolés tout en conservant les MP à plat.
- Les messages entrants dans des fils incluent le message racine du fil comme contexte supplémentaire pour l'agent.
- Les envois d'outils de message héritent automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou la même cible utilisateur de MP, sauf si un `threadId` explicite est fourni.
- La réutilisation de la même cible utilisateur de MP dans la même session ne s'active que lorsque les métadonnées de session actuelles prouvent le même pair MP sur le même compte Matrix ; sinon OpenClaw revient au routage normal à portée utilisateur.
- Lorsque OpenClaw voit un salon de MP Matrix entrer en collision avec un autre salon de MP sur la même session partagée de MP Matrix, il publie un `m.notice` ponctuel dans ce salon avec l'échappatoire `/focus` lorsque les liaisons de fils sont activées et avec l'indication `dm.sessionScope`.
- Les liaisons de fils d'exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent dans les salons et MP Matrix.
- Le `/focus` de niveau supérieur dans un salon/MP Matrix crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- Exécuter `/focus` ou `/acp spawn --thread here` à l'intérieur d'un fil Matrix existant lie ce fil actuel à la place.

## Liaisons de conversation ACP

Les salons, MP et fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans changer la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le MP Matrix, le salon ou le fil existant que vous voulez continuer à utiliser.
- Dans un MP ou salon Matrix de niveau supérieur, le MP/salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- À l'intérieur d'un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n'est requis que pour `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration de liaison de fils

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings` et prend aussi en charge des substitutions par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les indicateurs de création liés aux fils Matrix sont optionnels :

- Définissez `threadBindings.spawnSubagentSessions: true` pour permettre à `/focus` de niveau supérieur de créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour permettre à `/acp spawn --thread auto|here` de lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d'accusé de réception entrantes.

- L'outillage de réaction sortante est contrôlé par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les propres réactions du compte bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

La portée des réactions d'accusé de réception se résout dans cet ordre standard OpenClaw :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- repli vers l'emoji d'identité de l'agent

La portée de la réaction d'accusé de réception se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- par défaut : `own`

Comportement :

- `reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu'ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réaction ne sont pas synthétisées en événements système parce que Matrix les expose comme des rédactions, et non comme des suppressions autonomes de `m.reaction`.

## Contexte d'historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu'un message de salon Matrix déclenche l'agent. Se replie sur `messages.groupChat.historyLimit` ; si les deux sont non définis, la valeur effective par défaut est `0`. Définissez `0` pour désactiver.
- L'historique des salons Matrix est limité au salon. Les MP continuent d'utiliser l'historique de session normal.
- L'historique des salons Matrix est en attente uniquement : OpenClaw met en tampon les messages de salon qui n'ont pas encore déclenché de réponse, puis capture cet intervalle lorsqu'une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n'est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent l'instantané d'historique d'origine au lieu de dériver vers des messages plus récents du salon.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte de salon supplémentaire tel que le texte de réponse récupéré, les racines de fils et l'historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire aux expéditeurs autorisés par les vérifications actives de liste d'autorisation de salon/utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve quand même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, pas la possibilité pour le message entrant lui-même de déclencher une réponse.
L'autorisation de déclenchement provient toujours des paramètres `groupPolicy`, `groups`, `groupAllowFrom` et de la stratégie MP.

## Politique des MP et salons

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consultez [Groups](/fr/channels/groups) pour le comportement de filtrage par mention et de liste d'autorisation.

Exemple d'appairage pour les MP Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant l'approbation, OpenClaw réutilise le même code d'appairage en attente et peut renvoyer une réponse de rappel après un court délai au lieu de générer un nouveau code.

Consultez [Pairing](/fr/channels/pairing) pour le flux partagé d'appairage des MP et l'agencement de stockage.

## Réparation de salon direct

Si l'état des messages directs se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes qui pointent vers d'anciens salons en solo au lieu du MP actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Le flux de réparation :

- préfère un MP strict 1:1 déjà mappé dans `m.direct`
- se replie sur n'importe quel MP strict 1:1 actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun MP sain n'existe

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il choisit uniquement le MP sain et met à jour le mappage afin que les nouveaux envois Matrix, avis de vérification et autres flux de message direct ciblent de nouveau le bon salon.

## Approbations exec

Matrix peut agir comme client d'approbation natif pour un compte Matrix. Les paramètres natifs
de routage MP/canal restent sous la configuration des approbations exec :

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; se replie sur `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des IDs utilisateur Matrix tels que `@owner:example.org`. Matrix active automatiquement les approbations natives lorsque `enabled` est non défini ou `"auto"` et qu'au moins un approbateur peut être résolu. Les approbations exec utilisent d'abord `execApprovals.approvers` et peuvent se replier sur `channels.matrix.dm.allowFrom`. Les approbations de plugin autorisent via `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d'approbation natif. Sinon, les demandes d'approbation se replient vers d'autres routes d'approbation configurées ou vers la stratégie de repli d'approbation.

Le routage natif Matrix prend en charge les deux types d'approbation :

- `channels.matrix.execApprovals.*` contrôle le mode natif de diffusion DM/canal des invites d'approbation Matrix.
- Les approbations exec utilisent l'ensemble des approbateurs exec provenant de `execApprovals.approvers` ou de `channels.matrix.dm.allowFrom`.
- Les approbations de plugin utilisent la liste d'autorisation de MP Matrix de `channels.matrix.dm.allowFrom`.
- Les raccourcis par réaction Matrix et les mises à jour de message s'appliquent à la fois aux approbations exec et aux approbations de plugin.

Règles de livraison :

- `target: "dm"` envoie les invites d'approbation dans les MP des approbateurs
- `target: "channel"` renvoie l'invite dans le salon ou MP Matrix d'origine
- `target: "both"` envoie aux MP des approbateurs et au salon ou MP Matrix d'origine

Les invites d'approbation Matrix initialisent des raccourcis par réaction sur le message principal d'approbation :

- `✅` = autoriser une fois
- `❌` = refuser
- `♾️` = toujours autoriser lorsque cette décision est permise par la stratégie exec effective

Les approbateurs peuvent réagir sur ce message ou utiliser les commandes slash de repli : `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. Pour les approbations exec, la livraison dans le canal inclut le texte de commande ; n'activez donc `channel` ou `both` que dans des salons de confiance.

Substitution par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation associée : [Exec approvals](/fr/tools/exec-approvals)

## Commandes slash

Les commandes slash Matrix (par exemple `/new`, `/reset`, `/model`) fonctionnent directement dans les MP. Dans les salons, OpenClaw reconnaît aussi les commandes slash précédées par la propre mention Matrix du bot ; ainsi, `@bot:server /new` déclenche le chemin de commande sans nécessiter de regex de mention personnalisée. Cela permet au bot de rester réactif aux messages de type salon `@mention /command` qu'Element et des clients similaires émettent lorsqu'un utilisateur complète le bot avec Tab avant de saisir la commande.

Les règles d'autorisation s'appliquent toujours : les expéditeurs de commandes doivent satisfaire les politiques de liste d'autorisation/propriétaire des MP ou des salons, comme pour les messages ordinaires.

## Multi-compte

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour les comptes nommés, sauf si un compte les remplace.
Vous pouvez limiter les entrées de salon héritées à un seul compte Matrix avec `groups.<room>.account`.
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` continuent de fonctionner lorsque le compte par défaut est configuré directement dans `channels.matrix.*` de niveau supérieur.
Les valeurs par défaut d'authentification partagées partielles ne créent pas à elles seules un compte implicite par défaut séparé. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque ce compte par défaut dispose d'une authentification valide (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent néanmoins rester détectables à partir de `homeserver` plus `userId` lorsque des informations d'authentification mises en cache satisfont l'authentification plus tard.
Si Matrix a déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion réparation/configuration d'un seul compte vers plusieurs comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d'authentification/initialisation Matrix sont déplacées dans ce compte promu ; les clés partagées de politique de livraison restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu'OpenClaw privilégie un compte Matrix nommé pour le routage, la détection et les opérations CLI implicites.
Si plusieurs comptes Matrix sont configurés et qu'un ID de compte est `default`, OpenClaw utilise ce compte implicitement même lorsque `defaultAccount` n'est pas défini.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou passez `--account <id>` pour les commandes CLI qui reposent sur une sélection implicite de compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

Consultez la [Référence de configuration](/fr/gateway/configuration-reference#multi-account-all-channels) pour le modèle multi-compte partagé.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF, sauf si vous
choisissez explicitement de les autoriser compte par compte.

Si votre homeserver fonctionne sur localhost, une IP LAN/Tailscale ou un nom d'hôte interne, activez
`network.dangerouslyAllowPrivateNetwork` pour ce compte Matrix :

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Exemple de configuration en CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette option ne permet que les cibles privées/internes de confiance. Les homeservers publics en clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` lorsque c'est possible.

## Proxy du trafic Matrix

Si votre déploiement Matrix nécessite un proxy HTTP(S) sortant explicite, définissez `channels.matrix.proxy` :

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec `channels.matrix.accounts.<id>.proxy`.
OpenClaw utilise le même paramètre de proxy pour le trafic Matrix à l'exécution et les sondes d'état de compte.

## Résolution de cible

Matrix accepte ces formes de cible partout où OpenClaw vous demande une cible de salon ou d'utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

La recherche en direct dans l'annuaire utilise le compte Matrix connecté :

- Les recherches d'utilisateur interrogent l'annuaire d'utilisateurs Matrix sur ce homeserver.
- Les recherches de salon acceptent directement les IDs et alias explicites de salon, puis se replient sur la recherche dans les noms des salons rejoints pour ce compte.
- La recherche par nom de salon rejoint est fournie au mieux. Si un nom de salon ne peut pas être résolu en ID ou alias, il est ignoré lors de la résolution de la liste d'autorisation à l'exécution.

## Référence de configuration

- `enabled` : activer ou désactiver le canal.
- `name` : étiquette facultative pour le compte.
- `defaultAccount` : ID de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autoriser ce compte Matrix à se connecter à des homeservers privés/internes. Activez ceci lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL de proxy HTTP(S) facultative pour le trafic Matrix. Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : ID utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d'accès pour l'authentification basée sur jeton. Les valeurs en clair et les valeurs SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` via les fournisseurs env/file/exec. Consultez [Secrets Management](/fr/gateway/secrets).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en clair et les valeurs SecretRef sont prises en charge.
- `deviceId` : ID d'appareil Matrix explicite.
- `deviceName` : nom d'affichage de l'appareil pour la connexion par mot de passe.
- `avatarUrl` : URL d'avatar propre stockée pour la synchronisation du profil et les mises à jour `profile set`.
- `initialSyncLimit` : nombre maximal d'événements récupérés pendant la synchronisation au démarrage.
- `encryption` : activer le chiffrement de bout en bout.
- `allowlistOnly` : lorsque `true`, fait passer la politique de salon `open` à `allowlist`, et force toutes les politiques MP actives sauf `disabled` (y compris `pairing` et `open`) à `allowlist`. N'affecte pas les politiques `disabled`.
- `allowBots` : autoriser les messages provenant d'autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist` ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte supplémentaire du salon (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : liste d'autorisation des IDs utilisateur pour le trafic de salon. Les IDs utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes d'annuaire sont résolues au démarrage et lorsque la liste d'autorisation change pendant l'exécution du moniteur. Les noms non résolus sont ignorés.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d'historique de groupe. Se replie sur `messages.groupChat.historyLimit` ; si les deux sont non définis, la valeur effective par défaut est `0`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, `all` ou `batched`.
- `markdown` : configuration facultative du rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` et `true` activent les mises à jour de brouillon en aperçu d'abord avec des messages texte Matrix normaux. `"quiet"` utilise des avis d'aperçu sans notification pour les configurations auto-hébergées avec règles push. `false` équivaut à `"off"`.
- `blockStreaming` : `true` active des messages de progression distincts pour les blocs assistant terminés pendant que le streaming d'aperçu de brouillon est actif.
- `threadReplies` : `off`, `inbound` ou `always`.
- `threadBindings` : substitutions par canal pour le routage et le cycle de vie des sessions liées aux fils.
- `startupVerification` : mode automatique de demande d'auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai avant une nouvelle tentative de demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille des segments de message sortant en caractères (s'applique lorsque `chunkMode` est `length`).
- `chunkMode` : `length` découpe les messages par nombre de caractères ; `newline` découpe aux limites de ligne.
- `responsePrefix` : chaîne facultative ajoutée au début de toutes les réponses sortantes pour ce canal.
- `ackReaction` : substitution facultative de réaction d'accusé de réception pour ce canal/compte.
- `ackReactionScope` : substitution facultative de portée de réaction d'accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification des réactions entrantes (`own`, `off`).
- `mediaMaxMb` : limite de taille des médias en Mo pour les envois sortants et le traitement des médias entrants.
- `autoJoin` : politique de jointure automatique sur invitation (`always`, `allowlist`, `off`). Par défaut : `off`. S'applique à toutes les invitations Matrix, y compris celles de type MP.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` est `allowlist`. Les entrées alias sont résolues en IDs de salon pendant la gestion des invitations ; OpenClaw ne fait pas confiance à l'état d'alias revendiqué par le salon invité.
- `dm` : bloc de politique MP (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy` : contrôle l'accès MP après qu'OpenClaw a rejoint le salon et l'a classé comme MP. Ne change pas si une invitation est rejointe automatiquement.
- `dm.allowFrom` : liste d'autorisation des IDs utilisateur pour le trafic MP. Les IDs utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes d'annuaire sont résolues au démarrage et lorsque la liste d'autorisation change pendant l'exécution du moniteur. Les noms non résolus sont ignorés.
- `dm.sessionScope` : `per-user` (par défaut) ou `per-room`. Utilisez `per-room` lorsque vous voulez que chaque salon de MP Matrix conserve un contexte séparé même si le pair est le même.
- `dm.threadReplies` : substitution de politique de fil pour les MP uniquement (`off`, `inbound`, `always`). Elle remplace le paramètre `threadReplies` de niveau supérieur à la fois pour l'emplacement des réponses et l'isolation de session dans les MP.
- `execApprovals` : livraison native Matrix des approbations exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : IDs utilisateur Matrix autorisés à approuver les demandes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : substitutions nommées par compte. Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : mappage de politique par salon. Préférez les IDs ou alias de salon ; les noms de salon non résolus sont ignorés à l'exécution. L'identité de session/groupe utilise l'ID de salon stable après résolution.
- `groups.<room>.account` : limite une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : substitution au niveau du salon pour les expéditeurs bots configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : liste d'autorisation des expéditeurs par salon.
- `groups.<room>.tools` : substitutions d'autorisation/refus d'outils par salon.
- `groups.<room>.autoReply` : substitution de filtrage par mention au niveau du salon. `true` désactive les exigences de mention pour ce salon ; `false` les réactive de force.
- `groups.<room>.skills` : filtre de Skills facultatif au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif de prompt système au niveau du salon.
- `rooms` : alias hérité pour `groups`.
- `actions` : filtrage par outil et par action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Associé

- [Vue d'ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification des MP et flux d'appairage
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d'accès et durcissement

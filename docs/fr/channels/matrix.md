---
read_when:
    - Configuration de Matrix dans OpenClaw
    - Configuration du chiffrement E2EE et de la vérification de Matrix
summary: État de la prise en charge de Matrix, installation et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix est un Plugin de canal intégré pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les messages privés, les salons, les fils, les médias, les réactions, les sondages, la localisation et le chiffrement E2EE.

## Plugin intégré

Matrix est inclus comme Plugin intégré dans les versions actuelles d’OpenClaw, donc les builds packagés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez un ancien build ou une installation personnalisée qui exclut Matrix, installez-le manuellement :

Installer depuis npm :

```bash
openclaw plugins install @openclaw/matrix
```

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Voir [Plugins](/fr/tools/plugin) pour le comportement des plugins et les règles d’installation.

## Configuration

1. Assurez-vous que le Plugin Matrix est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, soit
   - `homeserver` + `userId` + `password`.
4. Redémarrez la Gateway.
5. Démarrez un message privé avec le bot ou invitez-le dans un salon.
   - Les nouvelles invitations Matrix ne fonctionnent que lorsque `channels.matrix.autoJoin` les autorise.

Chemins de configuration interactifs :

```bash
openclaw channels add
openclaw configure --section channels
```

L’assistant Matrix demande :

- l’URL du homeserver
- la méthode d’authentification : jeton d’accès ou mot de passe
- l’ID utilisateur (authentification par mot de passe uniquement)
- le nom d’appareil facultatif
- s’il faut activer le chiffrement E2EE
- s’il faut configurer l’accès aux salons et la jonction automatique aux invitations

Comportements clés de l’assistant :

- Si des variables d’environnement d’authentification Matrix existent déjà et que ce compte n’a pas encore d’authentification enregistrée dans la configuration, l’assistant propose un raccourci via variable d’environnement pour conserver l’authentification dans les variables d’environnement.
- Les noms de compte sont normalisés en ID de compte. Par exemple, `Ops Bot` devient `ops-bot`.
- Les entrées de liste d’autorisation pour messages privés acceptent directement `@user:server` ; les noms d’affichage ne fonctionnent que lorsqu’une recherche en direct dans l’annuaire trouve une seule correspondance exacte.
- Les entrées de liste d’autorisation pour salons acceptent directement les ID et alias de salon. Préférez `!room:server` ou `#alias:server` ; les noms non résolus sont ignorés à l’exécution lors de la résolution de la liste d’autorisation.
- En mode liste d’autorisation pour la jonction automatique aux invitations, utilisez uniquement des cibles d’invitation stables : `!roomId:server`, `#alias:server` ou `*`. Les noms de salon simples sont rejetés.
- Pour résoudre les noms de salon avant l’enregistrement, utilisez `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` vaut par défaut `off`.

Si vous ne le définissez pas, le bot ne rejoindra pas les salons invités ni les nouvelles invitations de type message privé ; il n’apparaîtra donc pas dans les nouveaux groupes ou messages privés sur invitation, sauf si vous le faites rejoindre manuellement d’abord.

Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour restreindre les invitations qu’il accepte, ou définissez `autoJoin: "always"` si vous voulez qu’il rejoigne toutes les invitations.

En mode `allowlist`, `autoJoinAllowlist` n’accepte que `!roomId:server`, `#alias:server` ou `*`.
</Warning>

Exemple de liste d’autorisation :

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

Matrix stocke les identifiants mis en cache dans `~/.openclaw/credentials/matrix/`.
Le compte par défaut utilise `credentials.json` ; les comptes nommés utilisent `credentials-<account>.json`.
Lorsque des identifiants mis en cache existent à cet emplacement, OpenClaw considère Matrix comme configuré pour la configuration, doctor et la détection de l’état du canal, même si l’authentification actuelle n’est pas directement définie dans la configuration.

Équivalents en variables d’environnement (utilisés lorsque la clé de configuration n’est pas définie) :

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Pour les comptes non par défaut, utilisez des variables d’environnement limitées au compte :

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemple pour le compte `ops` :

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Pour l’ID de compte normalisé `ops-bot`, utilisez :

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix échappe la ponctuation dans les ID de compte afin d’éviter les collisions dans les variables d’environnement limitées au compte.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` correspond à `MATRIX_OPS_X2D_PROD_*`.

L’assistant interactif ne propose le raccourci par variable d’environnement que si ces variables d’environnement d’authentification sont déjà présentes et que le compte sélectionné n’a pas déjà l’authentification Matrix enregistrée dans la configuration.

`MATRIX_HOMESERVER` ne peut pas être défini depuis un `.env` d’espace de travail ; voir [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Exemple de configuration

Voici une configuration de base pratique avec appairage en message privé, liste d’autorisation de salon et chiffrement E2EE activé :

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

`autoJoin` s’applique à toutes les invitations Matrix, y compris les invitations de type message privé. OpenClaw ne peut pas classifier de manière fiable un salon invité comme message privé ou groupe au moment de l’invitation, donc toutes les invitations passent d’abord par `autoJoin`. `dm.policy` s’applique après que le bot a rejoint et que le salon a été classé comme message privé.

## Aperçus en streaming

Le streaming des réponses Matrix est opt-in.

Définissez `channels.matrix.streaming` sur `"partial"` si vous voulez qu’OpenClaw envoie une seule réponse d’aperçu en direct, modifie cet aperçu sur place pendant que le modèle génère le texte, puis le finalise une fois la réponse terminée :

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` est la valeur par défaut. OpenClaw attend la réponse finale et l’envoie une seule fois.
- `streaming: "partial"` crée un message d’aperçu modifiable pour le bloc assistant en cours à l’aide de messages texte Matrix normaux. Cela préserve le comportement historique de notification « aperçu d’abord » de Matrix ; ainsi, les clients standard peuvent notifier sur le premier texte d’aperçu diffusé plutôt que sur le bloc finalisé.
- `streaming: "quiet"` crée un aperçu discret modifiable pour le bloc assistant en cours. Utilisez cela uniquement si vous configurez également des règles push côté destinataire pour les modifications d’aperçu finalisées.
- `blockStreaming: true` active des messages de progression Matrix séparés. Avec le streaming d’aperçu activé, Matrix conserve le brouillon en direct pour le bloc en cours et préserve les blocs terminés comme messages séparés.
- Lorsque le streaming d’aperçu est activé et que `blockStreaming` est désactivé, Matrix modifie le brouillon en direct sur place et finalise ce même événement lorsque le bloc ou le tour se termine.
- Si l’aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming d’aperçu et revient à une livraison finale normale.
- Les réponses multimédias envoient toujours les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le rédige avant d’envoyer la réponse multimédia finale.
- Les modifications d’aperçu coûtent des appels API Matrix supplémentaires. Laissez le streaming désactivé si vous voulez le comportement le plus conservateur vis-à-vis des limites de débit.

`blockStreaming` n’active pas à lui seul les aperçus de brouillon.
Utilisez `streaming: "partial"` ou `streaming: "quiet"` pour les modifications d’aperçu ; ajoutez ensuite `blockStreaming: true` uniquement si vous voulez également que les blocs assistant terminés restent visibles comme messages de progression séparés.

Si vous avez besoin des notifications Matrix standard sans règles push personnalisées, utilisez `streaming: "partial"` pour le comportement « aperçu d’abord » ou laissez `streaming` désactivé pour une livraison finale uniquement. Avec `streaming: "off"` :

- `blockStreaming: true` envoie chaque bloc terminé comme message Matrix normal avec notification.
- `blockStreaming: false` envoie uniquement la réponse finale complète comme message Matrix normal avec notification.

### Règles push auto-hébergées pour les aperçus discrets finalisés

Le streaming discret (`streaming: "quiet"`) ne notifie les destinataires qu’une fois qu’un bloc ou un tour est finalisé — une règle push par utilisateur doit correspondre au marqueur d’aperçu finalisé. Voir [Règles push Matrix pour les aperçus discrets](/fr/channels/matrix-push-rules) pour la configuration complète (jeton destinataire, vérification du pusher, installation de règle, remarques par homeserver).

## Salons bot à bot

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous souhaitez intentionnellement du trafic Matrix inter-agent :

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

- `allowBots: true` accepte les messages d’autres comptes bot Matrix configurés dans les salons et messages privés autorisés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu’ils mentionnent visiblement ce bot dans les salons. Les messages privés restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- OpenClaw ignore toujours les messages du même ID utilisateur Matrix pour éviter les boucles d’auto-réponse.
- Matrix n’expose pas ici d’indicateur natif de bot ; OpenClaw considère qu’un message est « rédigé par un bot » s’il est envoyé par un autre compte Matrix configuré sur cette Gateway OpenClaw.

Utilisez des listes d’autorisation de salon strictes et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d’image sortants utilisent `thumbnail_file` afin que les aperçus d’image soient chiffrés avec la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n’est nécessaire — le Plugin détecte automatiquement l’état E2EE.

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

Commandes de vérification (toutes acceptent `--verbose` pour les diagnostics et `--json` pour une sortie lisible par machine) :

```bash
openclaw matrix verify status
```

État détaillé (diagnostics complets) :

```bash
openclaw matrix verify status --verbose
```

Inclure la clé de récupération stockée dans une sortie lisible par machine :

```bash
openclaw matrix verify status --include-recovery-key --json
```

Initialiser l’état de cross-signing et de vérification :

```bash
openclaw matrix verify bootstrap
```

Diagnostics détaillés pour l’initialisation :

```bash
openclaw matrix verify bootstrap --verbose
```

Forcer une nouvelle réinitialisation de l’identité de cross-signing avant l’initialisation :

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Vérifier cet appareil avec une clé de récupération :

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Cette commande signale trois états distincts :

- `Recovery key accepted` : Matrix a accepté la clé de récupération pour le stockage des secrets ou la confiance de l’appareil.
- `Backup usable` : la sauvegarde des clés de salon peut être chargée avec un élément de récupération approuvé.
- `Device verified by owner` : l’appareil OpenClaw actuel dispose d’une confiance complète dans l’identité Matrix via le cross-signing.

`Signed by owner` dans la sortie détaillée ou JSON est uniquement un diagnostic. OpenClaw ne considère pas cela comme suffisant sauf si `Cross-signing verified` vaut aussi `yes`.

La commande renvoie quand même un code de sortie non nul lorsque la confiance complète dans l’identité Matrix est incomplète, même si la clé de récupération peut déverrouiller les éléments de sauvegarde. Dans ce cas, terminez l’auto-vérification depuis un autre client Matrix :

```bash
openclaw matrix verify self
```

Acceptez la demande dans un autre client Matrix, comparez les emoji SAS ou les nombres décimaux, puis saisissez `yes` uniquement s’ils correspondent. La commande attend que Matrix signale `Cross-signing verified: yes` avant de se terminer avec succès.

Utilisez `verify bootstrap --force-reset-cross-signing` uniquement si vous souhaitez volontairement remplacer l’identité actuelle de cross-signing.

Détails détaillés de la vérification d’appareil :

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Vérifier l’état de santé de la sauvegarde des clés de salon :

```bash
openclaw matrix verify backup status
```

Diagnostics détaillés de l’état de santé de la sauvegarde :

```bash
openclaw matrix verify backup status --verbose
```

Restaurer les clés de salon depuis la sauvegarde serveur :

```bash
openclaw matrix verify backup restore
```

Si la clé de sauvegarde n’est pas déjà chargée sur le disque, fournissez la clé de récupération Matrix :

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Flux interactif d’auto-vérification :

```bash
openclaw matrix verify self
```

Pour les demandes de vérification de niveau inférieur ou entrantes, utilisez :

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Utilisez `openclaw matrix verify cancel <id>` pour annuler une demande.

Diagnostics détaillés de restauration :

```bash
openclaw matrix verify backup restore --verbose
```

Supprimez la sauvegarde serveur actuelle et créez une nouvelle base de sauvegarde. Si la clé de sauvegarde stockée ne peut pas être chargée proprement, cette réinitialisation peut aussi recréer le stockage des secrets afin que les futurs démarrages à froid puissent charger la nouvelle clé de sauvegarde :

```bash
openclaw matrix verify backup reset --yes
```

Toutes les commandes `verify` sont concises par défaut (y compris la journalisation interne discrète du SDK) et n’affichent des diagnostics détaillés qu’avec `--verbose`.
Utilisez `--json` pour une sortie complète lisible par machine dans les scripts.

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite sauf si vous fournissez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d’abord `channels.matrix.defaultAccount`, sinon ces opérations CLI implicites s’arrêteront et vous demanderont de choisir un compte explicitement.
Utilisez `--account` chaque fois que vous voulez que les opérations de vérification ou d’appareil ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Ce que signifie verified">
    OpenClaw considère un appareil comme vérifié uniquement lorsque votre propre identité de cross-signing le signe. `verify status --verbose` expose trois signaux de confiance :

    - `Locally trusted` : approuvé par ce client uniquement
    - `Cross-signing verified` : le SDK signale une vérification via le cross-signing
    - `Signed by owner` : signé par votre propre clé de self-signing

    `Verified by owner` ne devient `yes` que lorsque la vérification via cross-signing est présente.
    La confiance locale ou une signature du propriétaire seule ne suffit pas pour qu’OpenClaw considère l’appareil comme complètement vérifié.

  </Accordion>

  <Accordion title="Ce que fait bootstrap">
    `verify bootstrap` est la commande de réparation et de configuration pour les comptes chiffrés. Dans l’ordre, elle :

    - initialise le stockage des secrets, en réutilisant une clé de récupération existante si possible
    - initialise le cross-signing et téléverse les clés publiques de cross-signing manquantes
    - marque et signe via cross-signing l’appareil actuel
    - crée une sauvegarde des clés de salon côté serveur si elle n’existe pas déjà

    Si le homeserver exige une UIA pour téléverser les clés de cross-signing, OpenClaw essaie d’abord sans authentification, puis `m.login.dummy`, puis `m.login.password` (nécessite `channels.matrix.password`). Utilisez `--force-reset-cross-signing` uniquement si vous avez l’intention d’abandonner l’identité actuelle.

  </Accordion>

  <Accordion title="Nouvelle base de sauvegarde">
    Si vous voulez conserver le fonctionnement des futurs messages chiffrés et acceptez de perdre l’ancien historique irrécupérable :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Ajoutez `--account <id>` pour cibler un compte nommé. Cela peut aussi recréer le stockage des secrets si le secret de sauvegarde actuel ne peut pas être chargé en toute sécurité.
    Ajoutez `--rotate-recovery-key` uniquement si vous voulez volontairement que l’ancienne clé de récupération ne puisse plus déverrouiller la nouvelle base de sauvegarde.

  </Accordion>

  <Accordion title="Comportement au démarrage">
    Avec `encryption: true`, `startupVerification` vaut par défaut `"if-unverified"`. Au démarrage, un appareil non vérifié demande une auto-vérification dans un autre client Matrix, en évitant les doublons et en appliquant un délai de refroidissement. Ajustez cela avec `startupVerificationCooldownHours` ou désactivez-le avec `startupVerification: "off"`.

    Le démarrage exécute également une passe conservatrice d’initialisation crypto qui réutilise le stockage des secrets et l’identité de cross-signing actuels. Si l’état d’initialisation est corrompu, OpenClaw tente une réparation protégée même sans `channels.matrix.password` ; si le homeserver exige une UIA par mot de passe, le démarrage journalise un avertissement et reste non fatal. Les appareils déjà signés par le propriétaire sont préservés.

    Voir [Migration Matrix](/fr/install/migrating-matrix) pour le flux complet de mise à niveau.

  </Accordion>

  <Accordion title="Notifications de vérification">
    Matrix publie des notifications du cycle de vie de la vérification dans le message privé strict de vérification sous forme de messages `m.notice` : demande, prêt (avec les instructions « Vérifier par emoji »), début/fin, et détails SAS (emoji/décimal) lorsque disponibles.

    Les demandes entrantes provenant d’un autre client Matrix sont suivies et acceptées automatiquement. Pour l’auto-vérification, OpenClaw démarre automatiquement le flux SAS et confirme son propre côté dès que la vérification par emoji est disponible — vous devez toujours comparer et confirmer « They match » dans votre client Matrix.

    Les notifications système de vérification ne sont pas transmises au pipeline de chat de l’agent.

  </Accordion>

  <Accordion title="Appareil Matrix supprimé ou invalide">
    Si `verify status` indique que l’appareil actuel n’est plus listé sur le
    homeserver, créez un nouvel appareil Matrix OpenClaw. Pour une connexion par mot de passe :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Pour une authentification par jeton, créez un nouveau jeton d’accès dans votre client Matrix ou interface d’administration,
    puis mettez OpenClaw à jour :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Remplacez `assistant` par l’ID de compte de la commande en échec, ou omettez
    `--account` pour le compte par défaut.

  </Accordion>

  <Accordion title="Hygiène des appareils">
    Les anciens appareils gérés par OpenClaw peuvent s’accumuler. Listez-les et supprimez les obsolètes :

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magasin crypto">
    Le chiffrement E2EE de Matrix utilise le chemin crypto Rust officiel de `matrix-js-sdk` avec `fake-indexeddb` comme shim IndexedDB. L’état crypto persiste dans `crypto-idb-snapshot.json` (autorisations de fichier restrictives).

    L’état d’exécution chiffré se trouve sous `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` et inclut le magasin de synchronisation, le magasin crypto, la clé de récupération, l’instantané IDB, les liaisons de fil et l’état de vérification au démarrage. Lorsque le jeton change mais que l’identité du compte reste la même, OpenClaw réutilise la meilleure racine existante afin que l’état antérieur reste visible.

  </Accordion>
</AccordionGroup>

## Gestion du profil

Mettez à jour le profil Matrix du compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` si vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d’avatar `mxc://`. Lorsque vous fournissez une URL d’avatar `http://` ou `https://`, OpenClaw la téléverse d’abord dans Matrix puis enregistre l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans la surcharge du compte sélectionné).

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et les envois via l’outil de message.

- `dm.sessionScope: "per-user"` (par défaut) conserve un routage des messages privés Matrix limité à l’expéditeur, donc plusieurs salons de message privé peuvent partager une seule session lorsqu’ils se résolvent vers le même pair.
- `dm.sessionScope: "per-room"` isole chaque salon de message privé Matrix dans sa propre clé de session tout en utilisant les vérifications normales d’authentification et de liste d’autorisation des messages privés.
- Les liaisons explicites de conversation Matrix ont toujours priorité sur `dm.sessionScope`, donc les salons et fils liés conservent leur session cible choisie.
- `threadReplies: "off"` conserve les réponses au niveau supérieur et maintient les messages entrants en fil sur la session parente.
- `threadReplies: "inbound"` répond dans un fil uniquement lorsque le message entrant se trouvait déjà dans ce fil.
- `threadReplies: "always"` conserve les réponses du salon dans un fil enraciné au message déclencheur et route cette conversation via la session limitée au fil correspondante depuis le premier message déclencheur.
- `dm.threadReplies` remplace le paramètre de niveau supérieur pour les messages privés uniquement. Par exemple, vous pouvez garder les fils des salons isolés tout en conservant des messages privés à plat.
- Les messages entrants en fil incluent le message racine du fil comme contexte supplémentaire pour l’agent.
- Les envois via l’outil de message héritent automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou le même utilisateur de message privé cible, sauf si un `threadId` explicite est fourni.
- La réutilisation de cible utilisateur de message privé dans la même session n’intervient que lorsque les métadonnées de la session actuelle prouvent le même pair de message privé sur le même compte Matrix ; sinon OpenClaw revient au routage normal limité à l’utilisateur.
- Lorsque OpenClaw détecte qu’un salon de message privé Matrix entre en collision avec un autre salon de message privé sur la même session Matrix partagée, il publie un `m.notice` unique dans ce salon avec l’échappatoire `/focus` lorsque les liaisons de fil sont activées et avec l’indication `dm.sessionScope`.
- Les liaisons de fil à l’exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent dans les salons et messages privés Matrix.
- Le `/focus` de niveau supérieur dans un salon/message privé Matrix crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- L’exécution de `/focus` ou `/acp spawn --thread here` à l’intérieur d’un fil Matrix existant lie ce fil actuel à la place.

## Liaisons de conversation ACP

Les salons, messages privés et fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans changer la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message privé Matrix, le salon ou le fil existant que vous voulez continuer à utiliser.
- Dans un message privé ou salon Matrix de niveau supérieur, le message privé/salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- À l’intérieur d’un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n’est requis que pour `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fil

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings`, et prend aussi en charge des surcharges par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les indicateurs de création liés aux fils Matrix sont opt-in :

- Définissez `threadBindings.spawnSubagentSessions: true` pour autoriser `/focus` de niveau supérieur à créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour autoriser `/acp spawn --thread auto|here` à lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d’accusé de réception entrantes.

- Les outils de réaction sortante sont contrôlés par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les propres réactions du compte bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

La portée des réactions d’accusé de réception est résolue dans cet ordre standard OpenClaw :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- repli sur l’emoji de l’identité de l’agent

La portée de la réaction d’accusé de réception est résolue dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions est résolu dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- par défaut : `own`

Comportement :

- `reactionNotifications: "own"` transfère les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réactions ne sont pas synthétisées en événements système, car Matrix les expose comme des rédactions, et non comme des suppressions autonomes de `m.reaction`.

## Contexte d’historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu’un message de salon Matrix déclenche l’agent. Revient à `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur effective par défaut est `0`. Définissez `0` pour désactiver.
- L’historique des salons Matrix est limité au salon. Les messages privés continuent d’utiliser l’historique normal de session.
- L’historique des salons Matrix est uniquement en attente : OpenClaw met en tampon les messages du salon qui n’ont pas encore déclenché de réponse, puis prend un instantané de cette fenêtre lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent l’instantané d’historique d’origine au lieu de dériver vers des messages plus récents du salon.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte supplémentaire du salon, comme le texte de réponse récupéré, les racines de fil et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire aux expéditeurs autorisés par les vérifications actives de liste d’autorisation du salon/de l’utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve quand même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, et non la possibilité pour le message entrant lui-même de déclencher une réponse.
L’autorisation du déclencheur provient toujours des paramètres `groupPolicy`, `groups`, `groupAllowFrom` et de la politique des messages privés.

## Politique des messages privés et des salons

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

Voir [Groupes](/fr/channels/groups) pour le filtrage par mention et le comportement des listes d’autorisation.

Exemple d’appairage pour les messages privés Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant approbation, OpenClaw réutilise le même code d’appairage en attente et peut renvoyer une réponse de rappel après un court délai de refroidissement au lieu de générer un nouveau code.

Voir [Appairage](/fr/channels/pairing) pour le flux partagé d’appairage en message privé et la structure de stockage.

## Réparation directe de salon

Si l’état des messages directs se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes pointant vers d’anciens salons individuels au lieu du message privé actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Le flux de réparation :

- privilégie un message privé strict 1:1 déjà mappé dans `m.direct`
- revient à tout message privé strict 1:1 actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun message privé sain n’existe

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il choisit uniquement le message privé sain et met à jour le mappage afin que les nouveaux envois Matrix, les notifications de vérification et les autres flux de messages directs ciblent à nouveau le bon salon.

## Approbations exec

Matrix peut agir comme client d’approbation natif pour un compte Matrix. Les
paramètres natifs de routage message privé/canal restent sous la configuration des approbations exec :

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; revient à `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des ID utilisateur Matrix tels que `@owner:example.org`. Matrix active automatiquement les approbations natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu. Les approbations exec utilisent d’abord `execApprovals.approvers` et peuvent revenir à `channels.matrix.dm.allowFrom`. Les approbations de Plugin autorisent via `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d’approbation natif. Sinon, les demandes d’approbation reviennent à d’autres routes d’approbation configurées ou à la politique de repli d’approbation.

Le routage natif Matrix prend en charge les deux types d’approbation :

- `channels.matrix.execApprovals.*` contrôle le mode natif de diffusion message privé/canal pour les invites d’approbation Matrix.
- Les approbations exec utilisent l’ensemble d’approbateurs exec provenant de `execApprovals.approvers` ou de `channels.matrix.dm.allowFrom`.
- Les approbations de Plugin utilisent la liste d’autorisation des messages privés Matrix provenant de `channels.matrix.dm.allowFrom`.
- Les raccourcis de réaction Matrix et les mises à jour de message s’appliquent à la fois aux approbations exec et aux approbations de Plugin.

Règles de livraison :

- `target: "dm"` envoie les invites d’approbation dans les messages privés des approbateurs
- `target: "channel"` renvoie l’invite dans le salon Matrix ou message privé d’origine
- `target: "both"` envoie aux messages privés des approbateurs et au salon Matrix ou message privé d’origine

Les invites d’approbation Matrix initialisent des raccourcis de réaction sur le message principal d’approbation :

- `✅` = autoriser une fois
- `❌` = refuser
- `♾️` = toujours autoriser lorsque cette décision est permise par la politique exec effective

Les approbateurs peuvent réagir sur ce message ou utiliser les commandes slash de repli : `/approve <id> allow-once`, `/approve <id> allow-always`, ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. Pour les approbations exec, la livraison par canal inclut le texte de commande ; n’activez donc `channel` ou `both` que dans des salons de confiance.

Surcharge par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

## Commandes slash

Les commandes slash Matrix (par exemple `/new`, `/reset`, `/model`) fonctionnent directement dans les messages privés. Dans les salons, OpenClaw reconnaît aussi les commandes slash précédées de la propre mention Matrix du bot ; ainsi, `@bot:server /new` déclenche le chemin de commande sans nécessiter de regex de mention personnalisée. Cela permet au bot de rester réactif aux messages de salon de style `@mention /command` qu’Element et des clients similaires émettent lorsqu’un utilisateur complète le bot avec la touche Tab avant de taper la commande.

Les règles d’autorisation s’appliquent toujours : les expéditeurs de commandes doivent satisfaire aux politiques de liste d’autorisation/propriétaire des messages privés ou des salons, comme pour les messages ordinaires.

## Multi-comptes

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

Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour les comptes nommés sauf si un compte les remplace.
Vous pouvez limiter les entrées de salon héritées à un compte Matrix avec `groups.<room>.account`.
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` continuent de fonctionner lorsque le compte par défaut est configuré directement au niveau supérieur `channels.matrix.*`.
Les valeurs par défaut d’authentification partagée partielles ne créent pas à elles seules un compte implicite par défaut distinct. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque cette valeur par défaut dispose d’une authentification complète (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent tout de même rester détectables avec `homeserver` plus `userId` lorsque des identifiants mis en cache satisfont ensuite l’authentification.
Si Matrix a déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion réparation/configuration d’un compte unique vers plusieurs comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d’authentification/bootstrap Matrix sont déplacées dans ce compte promu ; les clés partagées de politique de livraison restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu’OpenClaw préfère un compte Matrix nommé pour le routage implicite, la détection et les opérations CLI.
Si plusieurs comptes Matrix sont configurés et qu’un ID de compte est `default`, OpenClaw utilise ce compte implicitement même lorsque `defaultAccount` n’est pas défini.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou fournissez `--account <id>` pour les commandes CLI qui reposent sur une sélection implicite du compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

Voir [Référence de configuration](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle multi-comptes partagé.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF sauf si vous
activez explicitement cette possibilité pour chaque compte.

Si votre homeserver fonctionne sur localhost, une IP LAN/Tailscale ou un nom d’hôte interne, activez
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

Exemple de configuration via CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette activation explicite autorise uniquement des cibles privées/internes de confiance. Les homeservers publics en clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` lorsque c’est possible.

## Proxy du trafic Matrix

Si votre déploiement Matrix a besoin d’un proxy HTTP(S) sortant explicite, définissez `channels.matrix.proxy` :

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
OpenClaw utilise le même paramètre de proxy pour le trafic Matrix d’exécution et les sondes d’état du compte.

## Résolution de cible

Matrix accepte ces formats de cible partout où OpenClaw vous demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server`, ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server`, ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server`, ou `matrix:channel:#alias:server`

Les ID de salon Matrix sont sensibles à la casse. Utilisez la casse exacte de l’ID de salon depuis Matrix
lorsque vous configurez des cibles de livraison explicites, des tâches Cron, des bindings ou des listes d’autorisation.
OpenClaw conserve des clés de session internes canoniques pour le stockage ; ces clés en minuscules
ne constituent donc pas une source fiable pour les ID de livraison Matrix.

La recherche en direct dans l’annuaire utilise le compte Matrix connecté :

- Les recherches d’utilisateurs interrogent l’annuaire d’utilisateurs Matrix sur ce homeserver.
- Les recherches de salons acceptent directement les ID et alias de salon explicites, puis reviennent à une recherche dans les noms des salons rejoints pour ce compte.
- La recherche par nom parmi les salons rejoints est fournie au mieux. Si le nom d’un salon ne peut pas être résolu en ID ou en alias, il est ignoré par la résolution de liste d’autorisation à l’exécution.

## Référence de configuration

- `enabled` : active ou désactive le canal.
- `name` : étiquette facultative du compte.
- `defaultAccount` : ID de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autorise ce compte Matrix à se connecter à des homeservers privés/internes. Activez ceci lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale, ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL facultative de proxy HTTP(S) pour le trafic Matrix. Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : ID utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d’accès pour l’authentification par jeton. Les valeurs en texte brut et les valeurs SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` avec les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en texte brut et les valeurs SecretRef sont prises en charge.
- `deviceId` : ID explicite de l’appareil Matrix.
- `deviceName` : nom d’affichage de l’appareil pour la connexion par mot de passe.
- `avatarUrl` : URL d’avatar propre stockée pour la synchronisation du profil et les mises à jour `profile set`.
- `initialSyncLimit` : nombre maximal d’événements récupérés pendant la synchronisation au démarrage.
- `encryption` : active le chiffrement E2EE.
- `allowlistOnly` : lorsque `true`, fait passer la politique de salon `open` à `allowlist`, et force toutes les politiques actives de message privé sauf `disabled` (y compris `pairing` et `open`) à `allowlist`. N’affecte pas les politiques `disabled`.
- `allowBots` : autorise les messages provenant d’autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist` ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte supplémentaire du salon (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : liste d’autorisation des ID utilisateur pour le trafic des salons. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes de l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d’historique de groupe. Revient à `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur effective par défaut est `0`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, `all` ou `batched`.
- `markdown` : configuration facultative de rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `"partial"`, `"quiet"`, `true`, ou `false`. `"partial"` et `true` activent les mises à jour de brouillon avec aperçu d’abord à l’aide de messages texte Matrix normaux. `"quiet"` utilise des aperçus discrets sans notification pour les configurations auto-hébergées avec règles push. `false` est équivalent à `"off"`.
- `blockStreaming` : `true` active des messages de progression séparés pour les blocs assistant terminés lorsque le streaming d’aperçu de brouillon est actif.
- `threadReplies` : `off`, `inbound` ou `always`.
- `threadBindings` : surcharges par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `startupVerification` : mode automatique de demande d’auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai de refroidissement avant de réessayer les demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille des segments de message sortant en caractères (s’applique lorsque `chunkMode` vaut `length`).
- `chunkMode` : `length` découpe les messages selon le nombre de caractères ; `newline` les découpe aux sauts de ligne.
- `responsePrefix` : chaîne facultative préfixée à toutes les réponses sortantes pour ce canal.
- `ackReaction` : surcharge facultative de la réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : surcharge facultative de la portée de la réaction d’accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification des réactions entrantes (`own`, `off`).
- `mediaMaxMb` : limite de taille des médias en Mo pour les envois sortants et le traitement des médias entrants.
- `autoJoin` : politique de jonction automatique des invitations (`always`, `allowlist`, `off`). Par défaut : `off`. S’applique à toutes les invitations Matrix, y compris celles de type message privé.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `allowlist`. Les entrées d’alias sont résolues en ID de salon lors du traitement des invitations ; OpenClaw ne fait pas confiance à l’état d’alias revendiqué par le salon invité.
- `dm` : bloc de politique de message privé (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy` : contrôle l’accès aux messages privés après qu’OpenClaw a rejoint le salon et l’a classé comme message privé. Cela ne modifie pas la jonction automatique à une invitation.
- `dm.allowFrom` : liste d’autorisation des ID utilisateur pour le trafic des messages privés. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes de l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `dm.sessionScope` : `per-user` (par défaut) ou `per-room`. Utilisez `per-room` si vous voulez que chaque salon de message privé Matrix conserve un contexte séparé même si le pair est le même.
- `dm.threadReplies` : surcharge de politique des fils pour messages privés uniquement (`off`, `inbound`, `always`). Elle remplace le paramètre `threadReplies` de niveau supérieur à la fois pour le placement des réponses et l’isolation de session dans les messages privés.
- `execApprovals` : livraison native Matrix des approbations exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : ID utilisateur Matrix autorisés à approuver les requêtes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : surcharges nommées par compte. Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : mappage de politiques par salon. Préférez les ID ou alias de salon ; les noms de salon non résolus sont ignorés à l’exécution. L’identité de session/groupe utilise l’ID de salon stable après résolution.
- `groups.<room>.account` : limite une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : surcharge au niveau du salon pour les expéditeurs de bots configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
- `groups.<room>.tools` : surcharges d’autorisation/interdiction d’outils par salon.
- `groups.<room>.autoReply` : surcharge au niveau du salon pour le filtrage par mention. `true` désactive les exigences de mention pour ce salon ; `false` les réactive de force.
- `groups.<room>.skills` : filtre facultatif de Skills au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif de prompt système au niveau du salon.
- `rooms` : alias historique de `groups`.
- `actions` : contrôle par action des outils (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification en message privé et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement

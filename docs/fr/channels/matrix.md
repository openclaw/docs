---
read_when:
    - Configuration de Matrix dans OpenClaw
    - Configuration de l’E2EE et de la vérification Matrix
summary: État de prise en charge, configuration et exemples de configuration de Matrix
title: Matrice
x-i18n:
    generated_at: "2026-06-27T17:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix est un Plugin de canal téléchargeable pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les MP, les salons, les fils de discussion, les médias, les réactions, les sondages, la localisation et l’E2EE.

## Installer

Installez Matrix depuis ClawHub avant de configurer le canal :

```bash
openclaw plugins install @openclaw/matrix
```

Les spécifications de Plugin nues essaient d’abord ClawHub, puis se rabattent sur npm. Pour forcer la source du registre, utilisez `openclaw plugins install clawhub:@openclaw/matrix` ou `openclaw plugins install npm:@openclaw/matrix`.

Depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` enregistre et active le Plugin ; aucune étape séparée `openclaw plugins enable matrix` n’est donc nécessaire. Le Plugin ne fait toutefois rien tant que vous n’avez pas configuré le canal ci-dessous. Consultez [Plugins](/fr/tools/plugin) pour le comportement général des Plugins et les règles d’installation.

## Configuration

1. Créez un compte Matrix sur votre homeserver.
2. Configurez `channels.matrix` avec soit `homeserver` + `accessToken`, soit `homeserver` + `userId` + `password`.
3. Redémarrez le Gateway.
4. Démarrez un MP avec le bot, ou invitez-le dans un salon (voir [auto-join](#auto-join) - les nouvelles invitations ne sont acceptées que lorsque `autoJoin` les autorise).

### Configuration interactive

```bash
openclaw channels add
openclaw configure --section channels
```

L’assistant demande : l’URL du homeserver, la méthode d’authentification (jeton d’accès ou mot de passe), l’ID utilisateur (authentification par mot de passe uniquement), le nom d’appareil facultatif, s’il faut activer l’E2EE et s’il faut configurer l’accès aux salons et l’auto-join.

Si des variables d’environnement `MATRIX_*` correspondantes existent déjà et que le compte sélectionné n’a pas d’authentification enregistrée, l’assistant propose un raccourci via variable d’environnement. Pour résoudre les noms de salons avant d’enregistrer une liste d’autorisation, exécutez `openclaw channels resolve --channel matrix "Project Room"`. Lorsque l’E2EE est activée, l’assistant écrit la configuration et exécute le même amorçage que [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configuration minimale

Avec jeton :

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

Avec mot de passe (le jeton est mis en cache après la première connexion) :

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

### Auto-join

`channels.matrix.autoJoin` vaut `off` par défaut. Avec la valeur par défaut, le bot n’apparaîtra pas dans les nouveaux salons ni les MP provenant de nouvelles invitations tant que vous ne l’aurez pas rejoint manuellement.

OpenClaw ne peut pas déterminer au moment de l’invitation si un salon invité est un MP ou un groupe ; toutes les invitations, y compris celles de type MP, passent donc d’abord par `autoJoin`. `dm.policy` ne s’applique que plus tard, une fois que le bot a rejoint le salon et que celui-ci a été classé.

<Warning>
Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour restreindre les invitations que le bot accepte, ou `autoJoin: "always"` pour accepter toutes les invitations.

`autoJoinAllowlist` n’accepte que les cibles stables : `!roomId:server`, `#alias:server` ou `*`. Les noms de salon simples sont rejetés ; les entrées d’alias sont résolues auprès du homeserver, pas à partir de l’état revendiqué par le salon invité.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Pour accepter toutes les invitations, utilisez `autoJoin: "always"`.

### Formats des cibles de liste d’autorisation

Les listes d’autorisation de MP et de salons sont idéalement renseignées avec des ID stables :

- MP (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`) : utilisez `@user:server`. Les noms d’affichage sont ignorés par défaut, car ils sont modifiables ; définissez `dangerouslyAllowNameMatching: true` uniquement si vous avez explicitement besoin d’une compatibilité avec des entrées de nom d’affichage.
- Clés de liste d’autorisation de salon (`groups`, ancien `rooms`) : utilisez `!room:server` ou `#alias:server`. Les noms de salon simples sont ignorés par défaut ; définissez `dangerouslyAllowNameMatching: true` uniquement si vous avez explicitement besoin d’une compatibilité avec la recherche par nom de salon rejoint.
- Listes d’autorisation d’invitation (`autoJoinAllowlist`) : utilisez `!room:server`, `#alias:server` ou `*`. Les noms de salon simples sont rejetés.

### Normalisation de l’ID de compte

L’assistant convertit un nom convivial en ID de compte normalisé. Par exemple, `Ops Bot` devient `ops-bot`. La ponctuation est échappée dans les noms de variables d’environnement à portée limitée afin que deux comptes ne puissent pas entrer en collision : `-` → `_X2D_`, donc `ops-prod` correspond à `MATRIX_OPS_X2D_PROD_*`.

### Identifiants mis en cache

Matrix stocke les identifiants mis en cache sous `~/.openclaw/credentials/matrix/` :

- compte par défaut : `credentials.json`
- comptes nommés : `credentials-<account>.json`

Lorsque des identifiants mis en cache y existent, OpenClaw considère Matrix comme configuré même si le jeton d’accès n’est pas dans le fichier de configuration : cela couvre la configuration, `openclaw doctor` et les sondes d’état du canal.

### Variables d’environnement

Utilisées lorsque la clé de configuration équivalente n’est pas définie. Le compte par défaut utilise des noms sans préfixe ; les comptes nommés utilisent l’ID de compte inséré avant le suffixe.

| Compte par défaut     | Compte nommé (`<ID>` est l’ID de compte normalisé) |
| --------------------- | -------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                           |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                         |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                              |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                             |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                            |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                          |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                         |

Pour le compte `ops`, les noms deviennent `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, etc. Les variables d’environnement de clé de récupération sont lues par les flux CLI compatibles avec la récupération (`verify backup restore`, `verify device`, `verify bootstrap`) lorsque vous transmettez la clé via `--recovery-key-stdin`.

`MATRIX_HOMESERVER` ne peut pas être défini depuis un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Exemple de configuration

Une base pratique avec appairage MP, liste d’autorisation de salons et E2EE :

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
        "!roomid:example.org": { requireMention: true },
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

## Aperçus en streaming

Le streaming des réponses Matrix est optionnel. `streaming` contrôle la manière dont OpenClaw livre la réponse de l’assistant en cours ; `blockStreaming` contrôle si chaque bloc terminé est conservé comme son propre message Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Pour conserver les aperçus de réponses en direct tout en masquant les lignes intermédiaires d’outils/de progression, utilisez la forme objet :

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | Comportement                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Attend la réponse complète, puis envoie une seule fois. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                          |
| `"partial"`       | Modifie sur place un message texte normal pendant que le modèle écrit le bloc actuel. Les clients Matrix standard peuvent notifier au premier aperçu, pas lors de la modification finale. |
| `"quiet"`         | Identique à `"partial"`, mais le message est un avis sans notification. Les destinataires ne reçoivent une notification que lorsqu’une règle push par utilisateur correspond à la modification finalisée (voir ci-dessous). |

`blockStreaming` est indépendant de `streaming` :

| `streaming`             | `blockStreaming: true`                                            | `blockStreaming: false` (default)                         |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `"partial"` / `"quiet"` | Brouillon en direct pour le bloc actuel, blocs terminés conservés comme messages | Brouillon en direct pour le bloc actuel, finalisé sur place |
| `"off"`                 | Un message Matrix avec notification par bloc terminé              | Un message Matrix avec notification pour la réponse complète |

Remarques :

- Si un aperçu dépasse la limite de taille par événement de Matrix, OpenClaw arrête le streaming d’aperçu et revient à une livraison finale uniquement.
- Les réponses multimédias envoient toujours les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le caviarde avant d’envoyer la réponse multimédia finale.
- Les mises à jour d’aperçu de progression des outils sont activées par défaut lorsque le streaming d’aperçu Matrix est actif. Définissez `streaming.preview.toolProgress: false` pour conserver les modifications d’aperçu pour le texte de réponse, mais laisser la progression des outils sur le chemin de livraison normal.
- Les modifications d’aperçu coûtent des appels supplémentaires à l’API Matrix. Laissez `streaming: "off"` si vous voulez le profil de limitation de débit le plus conservateur.

## Messages vocaux

Les notes vocales Matrix entrantes sont transcrites avant le verrou de mention du salon. Cela permet à une note vocale qui prononce le nom du bot de déclencher l’agent dans un salon `requireMention: true`, et fournit à l’agent la transcription plutôt qu’un simple placeholder de pièce jointe audio.

Matrix utilise le fournisseur de médias audio partagé configuré sous `tools.media.audio`, comme OpenAI `gpt-4o-mini-transcribe`. Consultez [Vue d’ensemble des outils multimédias](/fr/tools/media-overview) pour la configuration des fournisseurs et les limites.

Détails du comportement :

- Les événements `m.audio` et les événements `m.file` avec un type MIME `audio/*` sont éligibles.
- Dans les salons chiffrés, OpenClaw déchiffre la pièce jointe via le chemin média Matrix existant avant la transcription.
- La transcription est marquée comme générée par machine et non fiable dans le prompt de l’agent.
- La pièce jointe est marquée comme déjà transcrite afin que les outils multimédias en aval ne transcrivent pas à nouveau la même note vocale.
- Définissez `tools.media.audio.enabled: false` pour désactiver globalement la transcription audio.

## Métadonnées d’approbation

Les invites d’approbation natives de Matrix sont des événements `m.room.message` normaux avec un contenu d’événement personnalisé spécifique à OpenClaw sous `com.openclaw.approval`. Matrix autorise les clés de contenu d’événement personnalisées ; les clients standard affichent donc toujours le corps du texte, tandis que les clients compatibles OpenClaw peuvent lire l’ID d’approbation structuré, le type, l’état, les décisions disponibles et les détails d’exécution/de Plugin.

Lorsqu’une invite d’approbation est trop longue pour un seul événement Matrix, OpenClaw segmente le texte visible et attache `com.openclaw.approval` uniquement au premier segment. Les réactions pour les décisions d’autorisation/refus sont liées à ce premier événement ; les longues invites conservent donc la même cible d’approbation que les invites à événement unique.

### Règles push auto-hébergées pour les aperçus finalisés silencieux

`streaming: "quiet"` ne notifie les destinataires qu’une fois qu’un bloc ou tour est finalisé : une règle push par utilisateur doit correspondre au marqueur d’aperçu finalisé. Consultez [Règles push Matrix pour les aperçus silencieux](/fr/channels/matrix-push-rules) pour la recette complète (jeton du destinataire, vérification du pusher, installation de la règle, notes par homeserver).

## Salons bot-à-bot

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous voulez intentionnellement du trafic Matrix inter-agents :

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

- `allowBots: true` accepte les messages provenant d'autres comptes de bot Matrix configurés dans les salons autorisés et les messages directs.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu'ils mentionnent visiblement ce bot dans les salons. Les messages directs restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- Les messages de bots configurés acceptés utilisent la [protection contre les boucles de bots](/fr/channels/bot-loop-protection) partagée. Configurez `channels.defaults.botLoopProtection`, puis remplacez avec `channels.matrix.botLoopProtection` ou `channels.matrix.groups.<room>.botLoopProtection` lorsqu'un salon nécessite un budget différent.
- OpenClaw ignore toujours les messages provenant du même ID utilisateur Matrix afin d'éviter les boucles d'auto-réponse.
- Matrix n'expose pas ici d'indicateur de bot natif ; OpenClaw traite « rédigé par un bot » comme « envoyé par un autre compte Matrix configuré sur ce Gateway OpenClaw ».

Utilisez des listes d'autorisation de salons strictes et des exigences de mention lorsque vous activez le trafic de bot à bot dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d'image sortants utilisent `thumbnail_file` afin que les aperçus d'image soient chiffrés avec la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n'est nécessaire - le Plugin détecte automatiquement l'état E2EE.

Toutes les commandes `openclaw matrix` acceptent `--verbose` (diagnostics complets), `--json` (sortie lisible par machine) et `--account <id>` (configurations multi-comptes). La sortie est concise par défaut, avec une journalisation SDK interne silencieuse. Les exemples ci-dessous montrent la forme canonique ; ajoutez les options selon vos besoins.

### Activer le chiffrement

```bash
openclaw matrix encryption setup
```

Amorce le stockage secret et la signature croisée, crée une sauvegarde des clés de salon si nécessaire, puis affiche l'état et les étapes suivantes. Options utiles :

- `--recovery-key <key>` appliquer une clé de récupération avant l'amorçage (préférez la forme via stdin documentée ci-dessous)
- `--force-reset-cross-signing` abandonner l'identité de signature croisée actuelle et en créer une nouvelle (à utiliser uniquement intentionnellement)

Pour un nouveau compte, activez E2EE au moment de la création :

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` est un alias de `--enable-e2ee`.

Équivalent en configuration manuelle :

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

### État et signaux de confiance

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` signale trois signaux de confiance indépendants (`--verbose` les affiche tous) :

- `Locally trusted` : approuvé uniquement par ce client
- `Cross-signing verified` : le SDK signale une vérification via la signature croisée
- `Signed by owner` : signé par votre propre clé d'auto-signature (diagnostic uniquement)

`Verified by owner` devient `yes` uniquement lorsque `Cross-signing verified` vaut `yes`. La confiance locale ou une signature du propriétaire seule ne suffit pas.

`--allow-degraded-local-state` renvoie des diagnostics au mieux sans préparer d'abord le compte Matrix ; utile pour les sondes hors ligne ou partiellement configurées.

### Vérifier cet appareil avec une clé de récupération

La clé de récupération est sensible - transmettez-la via stdin au lieu de la passer sur la ligne de commande. Définissez `MATRIX_RECOVERY_KEY` (ou `MATRIX_<ID>_RECOVERY_KEY` pour un compte nommé) :

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

La commande signale trois états :

- `Recovery key accepted` : Matrix a accepté la clé pour le stockage secret ou la confiance de l'appareil.
- `Backup usable` : la sauvegarde des clés de salon peut être chargée avec le matériel de récupération approuvé.
- `Device verified by owner` : cet appareil dispose de la confiance complète de l'identité de signature croisée Matrix.

Elle se termine avec un code non nul lorsque la confiance complète de l'identité est incomplète, même si la clé de récupération a déverrouillé le matériel de sauvegarde. Dans ce cas, terminez l'auto-vérification depuis un autre client Matrix :

```bash
openclaw matrix verify self
```

`verify self` attend `Cross-signing verified: yes` avant de se terminer avec succès. Utilisez `--timeout-ms <ms>` pour ajuster l'attente.

La forme avec clé littérale `openclaw matrix verify device "<recovery-key>"` est également acceptée, mais la clé se retrouve dans l'historique de votre shell.

### Amorcer ou réparer la signature croisée

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` est la commande de réparation et de configuration pour les comptes chiffrés. Dans l'ordre, elle :

- amorce le stockage secret, en réutilisant une clé de récupération existante lorsque possible
- amorce la signature croisée et téléverse les clés publiques manquantes
- marque et signe de manière croisée l'appareil actuel
- crée une sauvegarde des clés de salon côté serveur s'il n'en existe pas déjà une

Si le serveur d'accueil exige UIA pour téléverser les clés de signature croisée, OpenClaw essaie d'abord sans authentification, puis `m.login.dummy`, puis `m.login.password` (nécessite `channels.matrix.password`).

Options utiles :

- `--recovery-key-stdin` (à associer avec `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) ou `--recovery-key <key>`
- `--force-reset-cross-signing` pour abandonner l'identité de signature croisée actuelle (uniquement intentionnellement ; nécessite que la clé de récupération active soit stockée ou fournie avec `--recovery-key-stdin`)

### Sauvegarde des clés de salon

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` indique si une sauvegarde côté serveur existe et si cet appareil peut la déchiffrer. `backup restore` importe les clés de salon sauvegardées dans le magasin crypto local ; si la clé de récupération est déjà sur disque, vous pouvez omettre `--recovery-key-stdin`.

Pour remplacer une sauvegarde cassée par une nouvelle base de référence (accepte la perte de l'ancien historique irrécupérable ; peut aussi recréer le stockage secret si le secret de sauvegarde actuel ne peut pas être chargé) :

```bash
openclaw matrix verify backup reset --yes
```

Ajoutez `--rotate-recovery-key` uniquement lorsque vous souhaitez intentionnellement que la clé de récupération précédente cesse de déverrouiller la nouvelle base de référence de sauvegarde.

### Lister, demander et répondre aux vérifications

```bash
openclaw matrix verify list
```

Liste les demandes de vérification en attente pour le compte sélectionné.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envoie une demande de vérification depuis ce compte OpenClaw. `--own-user` demande une auto-vérification (vous acceptez l'invite dans un autre client Matrix du même utilisateur) ; `--user-id`/`--device-id`/`--room-id` ciblent quelqu'un d'autre. `--own-user` ne peut pas être combiné avec les autres options de ciblage.

Pour une gestion de cycle de vie de plus bas niveau - généralement lors du suivi en miroir des demandes entrantes depuis un autre client - ces commandes agissent sur une demande spécifique `<id>` (affichée par `verify list` et `verify request`) :

| Commande                                   | Objectif                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accepter une demande entrante                                       |
| `openclaw matrix verify start <id>`        | Démarrer le flux SAS                                                |
| `openclaw matrix verify sas <id>`          | Afficher les emojis ou décimales SAS                                |
| `openclaw matrix verify confirm-sas <id>`  | Confirmer que le SAS correspond à ce que montre l'autre client      |
| `openclaw matrix verify mismatch-sas <id>` | Rejeter le SAS lorsque les emojis ou décimales ne correspondent pas |
| `openclaw matrix verify cancel <id>`       | Annuler ; accepte `--reason <text>` et `--code <matrix-code>` facultatifs |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` et `cancel` acceptent tous `--user-id` et `--room-id` comme indications de suivi en message direct lorsque la vérification est ancrée à un salon de message direct spécifique.

### Notes multi-comptes

Sans `--account <id>`, les commandes CLI Matrix utilisent le compte par défaut implicite. Si vous avez plusieurs comptes nommés et que vous n'avez pas défini `channels.matrix.defaultAccount`, elles refuseront de deviner et vous demanderont de choisir. Lorsque E2EE est désactivé ou indisponible pour un compte nommé, les erreurs pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportement au démarrage">
    Avec `encryption: true`, `startupVerification` vaut `"if-unverified"` par défaut. Au démarrage, un appareil non vérifié demande une auto-vérification dans un autre client Matrix, en évitant les doublons et en appliquant un délai de récupération (24 heures par défaut). Ajustez avec `startupVerificationCooldownHours` ou désactivez avec `startupVerification: "off"`.

    Le démarrage exécute aussi une passe prudente d'amorçage crypto qui réutilise le stockage secret et l'identité de signature croisée actuels. Si l'état d'amorçage est cassé, OpenClaw tente une réparation encadrée même sans `channels.matrix.password` ; si le serveur d'accueil exige une UIA par mot de passe, le démarrage journalise un avertissement et reste non fatal. Les appareils déjà signés par le propriétaire sont préservés.

    Consultez [Migration Matrix](/fr/channels/matrix-migration) pour le flux de mise à niveau complet.

  </Accordion>

  <Accordion title="Avis de vérification">
    Matrix publie les avis de cycle de vie de vérification dans le salon de vérification strict en message direct sous forme de messages `m.notice` : demande, prêt (avec les indications « Vérifier par emoji »), démarrage/achèvement et détails SAS (emoji/décimal) lorsqu'ils sont disponibles.

    Les demandes entrantes depuis un autre client Matrix sont suivies et acceptées automatiquement. Pour l'auto-vérification, OpenClaw démarre automatiquement le flux SAS et confirme son propre côté une fois la vérification par emoji disponible - vous devez tout de même comparer et confirmer « Ils correspondent » dans votre client Matrix.

    Les avis système de vérification ne sont pas transmis au pipeline de chat de l'agent.

  </Accordion>

  <Accordion title="Appareil Matrix supprimé ou invalide">
    Si `verify status` indique que l'appareil actuel n'est plus listé sur le serveur d'accueil, créez un nouvel appareil Matrix OpenClaw. Pour une connexion par mot de passe :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Pour l'authentification par jeton, créez un nouveau jeton d'accès dans votre client Matrix ou votre interface d'administration, puis mettez OpenClaw à jour :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Remplacez `assistant` par l'ID de compte provenant de la commande en échec, ou omettez `--account` pour le compte par défaut.

  </Accordion>

  <Accordion title="Hygiène des appareils">
    Les anciens appareils gérés par OpenClaw peuvent s'accumuler. Listez et élaguez :

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magasin crypto">
    Matrix E2EE utilise le chemin crypto Rust officiel de `matrix-js-sdk` avec `fake-indexeddb` comme shim IndexedDB. L'état crypto persiste dans `crypto-idb-snapshot.json` (permissions de fichier restrictives).

    L'état d'exécution chiffré se trouve sous `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` et inclut le magasin de synchronisation, le magasin crypto, la clé de récupération, l'instantané IDB, les liaisons de fils de discussion et l'état de vérification au démarrage. Lorsque le jeton change mais que l'identité du compte reste la même, OpenClaw réutilise la meilleure racine existante afin que l'état antérieur reste visible.

  </Accordion>
</AccordionGroup>

## Gestion du profil

Mettez à jour l'auto-profil Matrix pour le compte sélectionné :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Vous pouvez passer les deux options dans un seul appel. Matrix accepte directement les URL d’avatar `mxc://` ; lorsque vous passez `http://` ou `https://`, OpenClaw téléverse d’abord le fichier et stocke l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans la substitution par compte).

## Fils de discussion

Matrix prend en charge les fils de discussion Matrix natifs pour les réponses automatiques comme pour les envois via l’outil de messages. Deux réglages indépendants contrôlent le comportement :

### Routage des sessions (`sessionScope`)

`dm.sessionScope` décide comment les salons DM Matrix sont associés aux sessions OpenClaw :

- `"per-user"` (par défaut) : tous les salons DM avec le même pair routé partagent une session.
- `"per-room"` : chaque salon DM Matrix obtient sa propre clé de session, même lorsque le pair est identique.

Les liaisons de conversation explicites priment toujours sur `sessionScope`, donc les salons et fils liés conservent leur session cible choisie.

### Réponses en fil (`threadReplies`)

`threadReplies` décide où le bot publie sa réponse :

- `"off"` : les réponses sont au niveau supérieur. Les messages entrants en fil restent sur la session parente.
- `"inbound"` : répond dans un fil uniquement lorsque le message entrant était déjà dans ce fil.
- `"always"` : répond dans un fil enraciné au message déclencheur ; cette conversation est routée via une session correspondante à portée de fil dès le premier déclencheur.

`dm.threadReplies` remplace cela uniquement pour les DM - par exemple, pour garder les fils de salon isolés tout en conservant des DM à plat.

### Héritage des fils et commandes slash

- Les messages entrants en fil incluent le message racine du fil comme contexte agent supplémentaire.
- Les envois via l’outil de messages héritent automatiquement du fil Matrix actuel lorsqu’ils ciblent le même salon (ou la même cible utilisateur DM), sauf si un `threadId` explicite est fourni.
- La réutilisation de cible utilisateur DM ne s’active que lorsque les métadonnées de la session actuelle prouvent le même pair DM sur le même compte Matrix ; sinon, OpenClaw revient au routage normal à portée utilisateur.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent tous dans les salons Matrix et les DM.
- Un `/focus` au niveau supérieur crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSessions` est activé.
- Exécuter `/focus` ou `/acp spawn --thread here` dans un fil Matrix existant lie ce fil sur place.

Quand OpenClaw détecte qu’un salon DM Matrix entre en collision avec un autre salon DM sur la même session partagée, il publie un `m.notice` unique dans ce salon pointant vers l’échappatoire `/focus` et suggérant un changement de `dm.sessionScope`. L’avis n’apparaît que lorsque les liaisons de fils sont activées.

## Liaisons de conversation ACP

Les salons Matrix, les DM et les fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans changer la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM Matrix, le salon ou le fil existant que vous voulez continuer à utiliser.
- Dans un DM ou un salon Matrix au niveau supérieur, le DM/salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- Dans un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnSessions` contrôle `/acp spawn --thread auto|here`, où OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fils

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings` et prend également en charge les substitutions par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Les créations de sessions liées à des fils Matrix sont activées par défaut :

- Définissez `threadBindings.spawnSessions: false` pour empêcher les `/focus` au niveau supérieur et `/acp spawn --thread auto|here` de créer/lier des fils Matrix.
- Définissez `threadBindings.defaultSpawnContext: "isolated"` lorsque les créations de fils de sous-agents natifs ne doivent pas bifurquer la transcription parente.

## Réactions

Matrix prend en charge les réactions sortantes, les notifications de réactions entrantes et les réactions d’acquittement.

Les outils de réaction sortante sont contrôlés par `channels.matrix.actions.reactions` :

- `react` ajoute une réaction à un événement Matrix.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix.
- `emoji=""` supprime les propres réactions du bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du bot.

**Ordre de résolution** (la première valeur définie gagne) :

| Paramètre               | Ordre                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | par compte → canal → `messages.ackReaction` → repli sur l’emoji d’identité de l’agent |
| `ackReactionScope`      | par compte → canal → `messages.ackReactionScope` → valeur par défaut `"group-mentions"` |
| `reactionNotifications` | par compte → canal → valeur par défaut `"own"`                                   |

`reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot ; `"off"` désactive les événements système de réaction. Les suppressions de réactions ne sont pas synthétisées en événements système, car Matrix les expose comme des rédactions, pas comme des suppressions autonomes de `m.reaction`.

## Contexte d’historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu’un message de salon Matrix déclenche l’agent. Revient à `messages.groupChat.historyLimit` ; si les deux sont non définis, la valeur par défaut effective est `0`. Définissez `0` pour désactiver.
- L’historique de salon Matrix est limité au salon. Les DM continuent d’utiliser l’historique de session normal.
- L’historique de salon Matrix est uniquement en attente : OpenClaw met en mémoire tampon les messages de salon qui n’ont pas encore déclenché de réponse, puis capture cette fenêtre lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent la capture d’historique d’origine au lieu de dériver vers des messages de salon plus récents.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte de salon supplémentaire, comme le texte de réponse récupéré, les racines de fils et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire pour le limiter aux expéditeurs autorisés par les vérifications actives de liste d’autorisation du salon/de l’utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve quand même une réponse explicitement citée.

Ce paramètre affecte la visibilité du contexte supplémentaire, pas le fait que le message entrant lui-même puisse déclencher une réponse.
L’autorisation de déclenchement vient toujours de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de politique DM.

## Politique des DM et des salons

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Pour réduire entièrement les DM au silence tout en gardant les salons fonctionnels, définissez `dm.enabled: false` :

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Consultez [Groupes](/fr/channels/groups) pour le comportement de filtrage par mention et de liste d’autorisation.

Exemple d’appairage pour les DM Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue de vous envoyer des messages avant l’approbation, OpenClaw réutilise le même code d’appairage en attente et peut envoyer une réponse de rappel après un bref délai de récupération au lieu de créer un nouveau code.

Consultez [Appairage](/fr/channels/pairing) pour le flux partagé d’appairage DM et l’organisation du stockage.

## Réparation de salon direct

Si l’état des messages directs se désynchronise, OpenClaw peut se retrouver avec des correspondances `m.direct` obsolètes qui pointent vers d’anciens salons solo au lieu du DM actif. Inspectez la correspondance actuelle pour un pair :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-la :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Les deux commandes acceptent `--account <id>` pour les configurations multi-comptes. Le flux de réparation :

- privilégie un DM strict 1:1 déjà mappé dans `m.direct`
- revient à n’importe quel DM strict 1:1 actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun DM sain n’existe

Il ne supprime pas automatiquement les anciens salons. Il choisit le DM sain et met à jour la correspondance afin que les futurs envois Matrix, avis de vérification et autres flux de messages directs ciblent le bon salon.

## Approbations d’exécution

Matrix peut agir comme client d’approbation natif. Configurez sous `channels.matrix.execApprovals` (ou `channels.matrix.accounts.<account>.execApprovals` pour une substitution par compte) :

- `enabled` : livre les approbations via des invites natives Matrix. Lorsque non défini ou `"auto"`, Matrix s’active automatiquement dès qu’au moins un approbateur peut être résolu. Définissez `false` pour désactiver explicitement.
- `approvers` : ID d’utilisateurs Matrix (`@owner:example.org`) autorisés à approuver les demandes d’exécution. Facultatif - revient à `channels.matrix.dm.allowFrom`.
- `target` : destination des invites. `"dm"` (par défaut) envoie aux DM des approbateurs ; `"channel"` envoie au salon ou DM Matrix d’origine ; `"both"` envoie aux deux.
- `agentFilter` / `sessionFilter` : listes d’autorisation facultatives pour déterminer quels agents/sessions déclenchent la livraison Matrix.

L’autorisation diffère légèrement selon les types d’approbation :

- **Approbations d’exécution** utilise `execApprovals.approvers`, avec repli sur `dm.allowFrom`.
- **Approbations de Plugin** autorise uniquement via `dm.allowFrom`.

Les deux types partagent les raccourcis de réaction Matrix et les mises à jour de message. Les approbateurs voient des raccourcis de réaction sur le message d’approbation principal :

- `✅` autoriser une fois
- `❌` refuser
- `♾️` toujours autoriser (lorsque la politique d’exécution effective le permet)

Commandes slash de repli : `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Seuls les approbateurs résolus peuvent approuver ou refuser. La livraison au canal pour les approbations d’exécution inclut le texte de la commande - activez `channel` ou `both` uniquement dans des salons de confiance.

Voir aussi : [Approbations d’exécution](/fr/tools/exec-approvals).

## Commandes slash

Les commandes slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) fonctionnent directement dans les DM. Dans les salons, OpenClaw reconnaît aussi les commandes préfixées par la propre mention Matrix du bot, donc `@bot:server /new` déclenche le chemin de commande sans regex de mention personnalisée. Cela garde le bot réactif aux publications de style salon `@mention /command` qu’Element et les clients similaires émettent lorsqu’un utilisateur complète automatiquement le bot avant de taper la commande.

Les règles d’autorisation s’appliquent toujours : les expéditeurs de commandes doivent satisfaire aux mêmes politiques DM ou de salon de liste d’autorisation/propriétaire que les messages ordinaires.

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

**Héritage :**

- Les valeurs `channels.matrix` de niveau supérieur servent de valeurs par défaut pour les comptes nommés, sauf si un compte les remplace.
- Limitez une entrée de salon héritée à un compte spécifique avec `groups.<room>.account`. Les entrées sans `account` sont partagées entre les comptes ; `account: "default"` fonctionne toujours lorsque le compte par défaut est configuré au niveau supérieur.

**Sélection du compte par défaut :**

- Définissez `defaultAccount` pour sélectionner le compte nommé que le routage implicite, les sondes et les commandes CLI doivent privilégier.
- Si vous avez plusieurs comptes et que l’un d’eux se nomme littéralement `default`, OpenClaw l’utilise implicitement même lorsque `defaultAccount` n’est pas défini.
- Si vous avez plusieurs comptes nommés et qu’aucun compte par défaut n’est sélectionné, les commandes CLI refusent de deviner - définissez `defaultAccount` ou passez `--account <id>`.
- Le bloc de premier niveau `channels.matrix.*` n’est traité comme compte `default` implicite que lorsque son authentification est complète (`homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`). Les comptes nommés restent détectables à partir de `homeserver` + `userId` dès que les identifiants mis en cache couvrent l’authentification.

**Promotion :**

- Quand OpenClaw promeut une configuration à compte unique en configuration multicomptes lors d’une réparation ou d’une configuration initiale, il conserve le compte nommé existant s’il y en a un ou si `defaultAccount` pointe déjà vers l’un d’eux. Seules les clés d’authentification/d’amorçage Matrix sont déplacées dans le compte promu ; les clés partagées de politique de livraison restent au niveau supérieur.

Consultez la [référence de configuration](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle multicomptes partagé.

## Serveurs d’accueil privés/LAN

Par défaut, OpenClaw bloque les serveurs d’accueil Matrix privés/internes pour la protection SSRF, sauf si vous
les autorisez explicitement par compte.

Si votre serveur d’accueil s’exécute sur localhost, une adresse IP LAN/Tailscale ou un nom d’hôte interne, activez
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

Exemple de configuration CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette autorisation explicite n’autorise que les cibles privées/internes de confiance. Les serveurs d’accueil publics en clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` chaque fois que possible.

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

Les comptes nommés peuvent remplacer la valeur par défaut de premier niveau avec `channels.matrix.accounts.<id>.proxy`.
OpenClaw utilise le même réglage de proxy pour le trafic Matrix à l’exécution et les sondes d’état des comptes.

## Résolution des cibles

Matrix accepte ces formes de cible partout où OpenClaw vous demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

Les identifiants de salons Matrix sont sensibles à la casse. Utilisez la casse exacte de l’identifiant de salon dans Matrix
lorsque vous configurez des cibles de livraison explicites, des tâches Cron, des liaisons ou des listes d’autorisation.
OpenClaw conserve des clés de session internes canoniques pour le stockage ; ces clés en minuscules
ne sont donc pas une source fiable pour les identifiants de livraison Matrix.

La recherche d’annuaire en direct utilise le compte Matrix connecté :

- Les recherches d’utilisateurs interrogent l’annuaire des utilisateurs Matrix sur ce serveur d’accueil.
- Les recherches de salons acceptent directement les identifiants et alias de salons explicites. La recherche par nom de salon rejoint est approximative et ne s’applique aux listes d’autorisation de salons à l’exécution que lorsque `dangerouslyAllowNameMatching: true` est défini.
- Si le nom d’un salon ne peut pas être résolu en identifiant ou en alias, il est ignoré par la résolution de liste d’autorisation à l’exécution.

## Référence de configuration

Les champs utilisateur de type liste d’autorisation (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) acceptent les identifiants utilisateur Matrix complets (le plus sûr). Les entrées utilisateur qui ne sont pas des identifiants sont ignorées par défaut. Si vous définissez `dangerouslyAllowNameMatching: true`, les correspondances exactes avec les noms d’affichage de l’annuaire Matrix sont résolues au démarrage et chaque fois que la liste d’autorisation change pendant l’exécution du moniteur ; les entrées qui ne peuvent pas être résolues sont ignorées à l’exécution.

Les clés de liste d’autorisation de salons (`groups`, anciennement `rooms`) doivent être des identifiants ou des alias de salons. Les clés de noms de salons simples sont ignorées par défaut ; `dangerouslyAllowNameMatching: true` rétablit une recherche approximative parmi les noms de salons rejoints.

### Compte et connexion

- `enabled` : active ou désactive le canal.
- `name` : libellé d’affichage facultatif pour le compte.
- `defaultAccount` : identifiant de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `accounts` : remplacements nommés par compte. Les valeurs de premier niveau `channels.matrix` sont héritées comme valeurs par défaut.
- `homeserver` : URL du serveur d’accueil, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autorise ce compte à se connecter à `localhost`, à des adresses IP LAN/Tailscale ou à des noms d’hôte internes.
- `proxy` : URL de proxy HTTP(S) facultative pour le trafic Matrix. Remplacement par compte pris en charge.
- `userId` : identifiant utilisateur Matrix complet (`@bot:example.org`).
- `accessToken` : jeton d’accès pour l’authentification par jeton. Les valeurs en clair et SecretRef sont prises en charge avec les fournisseurs env/file/exec ([gestion des secrets](/fr/gateway/secrets)).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en clair et SecretRef sont prises en charge.
- `deviceId` : identifiant d’appareil Matrix explicite.
- `deviceName` : nom d’affichage de l’appareil utilisé lors de la connexion par mot de passe.
- `avatarUrl` : URL d’avatar personnel stockée pour la synchronisation du profil et les mises à jour `profile set`.
- `initialSyncLimit` : nombre maximal d’événements récupérés pendant la synchronisation de démarrage.

### Chiffrement

- `encryption` : active l’E2EE. Valeur par défaut : `false`.
- `startupVerification` : `"if-unverified"` (valeur par défaut lorsque l’E2EE est activé) ou `"off"`. Demande automatiquement une autovérification au démarrage lorsque cet appareil n’est pas vérifié.
- `startupVerificationCooldownHours` : délai avant la prochaine demande automatique au démarrage. Valeur par défaut : `24`.

### Accès et politique

- `groupPolicy` : `"open"`, `"allowlist"` ou `"disabled"`. Valeur par défaut : `"allowlist"`.
- `groupAllowFrom` : liste d’autorisation d’identifiants utilisateur pour le trafic de salon.
- `dm.enabled` : lorsque `false`, ignore tous les DM. Valeur par défaut : `true`.
- `dm.policy` : `"pairing"` (valeur par défaut), `"allowlist"`, `"open"` ou `"disabled"`. S’applique après que le bot a rejoint et classé le salon comme DM ; n’affecte pas la gestion des invitations.
- `dm.allowFrom` : liste d’autorisation d’identifiants utilisateur pour le trafic DM.
- `dm.sessionScope` : `"per-user"` (valeur par défaut) ou `"per-room"`.
- `dm.threadReplies` : remplacement propre aux DM pour le fil des réponses (`"off"`, `"inbound"`, `"always"`).
- `allowBots` : accepte les messages d’autres comptes de bots Matrix configurés (`true` ou `"mentions"`).
- `allowlistOnly` : lorsque `true`, force toutes les politiques DM actives (sauf `"disabled"`) et les politiques de groupe `"open"` à `"allowlist"`. Ne modifie pas les politiques `"disabled"`.
- `dangerouslyAllowNameMatching` : lorsque `true`, autorise la recherche dans l’annuaire Matrix par nom d’affichage pour les entrées de liste d’autorisation utilisateur et la recherche par nom de salon rejoint pour les clés de liste d’autorisation de salons. Préférez les identifiants complets `@user:server` et les identifiants ou alias de salons.
- `autoJoin` : `"always"`, `"allowlist"` ou `"off"`. Valeur par défaut : `"off"`. S’applique à chaque invitation Matrix, y compris les invitations de type DM.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `"allowlist"`. Les entrées d’alias sont résolues auprès du serveur d’accueil, pas par rapport à l’état revendiqué par le salon invité.
- `contextVisibility` : visibilité supplémentaire du contexte (`"all"` par défaut, `"allowlist"`, `"allowlist_quote"`).

### Comportement des réponses

- `replyToMode` : `"off"`, `"first"`, `"all"` ou `"batched"`.
- `threadReplies` : `"off"`, `"inbound"` ou `"always"`.
- `threadBindings` : remplacements par canal pour le routage et le cycle de vie des sessions liées aux fils.
- `streaming` : `"off"` (valeur par défaut), `"partial"`, `"quiet"` ou forme objet `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming` : lorsque `true`, les blocs assistant terminés sont conservés comme messages de progression distincts.
- `markdown` : configuration facultative du rendu Markdown pour le texte sortant.
- `responsePrefix` : chaîne facultative ajoutée au début des réponses sortantes.
- `textChunkLimit` : taille des fragments sortants en caractères lorsque `chunkMode: "length"`. Valeur par défaut : `4000`.
- `chunkMode` : `"length"` (par défaut, découpe par nombre de caractères) ou `"newline"` (découpe aux limites de lignes).
- `historyLimit` : nombre de messages récents du salon inclus comme `InboundHistory` lorsqu’un message de salon déclenche l’agent. Se rabat sur `messages.groupChat.historyLimit` ; valeur par défaut effective `0` (désactivé).
- `mediaMaxMb` : plafond de taille des médias en Mo pour les envois sortants et le traitement entrant.

### Paramètres de réactions

- `ackReaction` : remplacement de la réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : remplacement de la portée (`"group-mentions"` par défaut, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications` : mode de notification des réactions entrantes (`"own"` par défaut, `"off"`).

### Outils et remplacements par salon

- `actions` : contrôle d’accès aux outils par action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups` : carte des politiques par salon. L’identité de session utilise l’identifiant de salon stable après résolution. (`rooms` est un alias hérité.)
  - `groups.<room>.account` : limite une entrée de salon héritée à un compte spécifique.
  - `groups.<room>.allowBots` : remplacement par salon du réglage au niveau du canal (`true` ou `"mentions"`).
  - `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
  - `groups.<room>.tools` : remplacements d’autorisation/refus d’outils par salon.
  - `groups.<room>.autoReply` : remplacement par salon du filtrage par mentions. `true` désactive les exigences de mention pour ce salon ; `false` les réactive.
  - `groups.<room>.skills` : filtre de Skills par salon.
  - `groups.<room>.systemPrompt` : extrait de prompt système par salon.

### Paramètres d’approbation d’exécution

- `execApprovals.enabled` : livre les approbations d’exécution via des invites natives Matrix.
- `execApprovals.approvers` : identifiants utilisateur Matrix autorisés à approuver. Se rabat sur `dm.allowFrom`.
- `execApprovals.target` : `"dm"` (valeur par défaut), `"channel"` ou `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter` : listes d’autorisation facultatives d’agents/sessions pour la livraison.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) - comportement de discussion de groupe et filtrage par mentions
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement

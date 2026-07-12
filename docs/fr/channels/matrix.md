---
read_when:
    - Configuration de Matrix dans OpenClaw
    - Configuration du chiffrement de bout en bout et de la vérification de Matrix
summary: État de la prise en charge de Matrix, installation et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-07-12T02:20:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix est un plugin de canal téléchargeable (`@openclaw/matrix`) basé sur le SDK officiel `matrix-js-sdk`. Il prend en charge les messages privés, les salons, les fils de discussion, les médias, les réactions, les sondages, la localisation et le chiffrement de bout en bout.

## Installation

```bash
openclaw plugins install @openclaw/matrix
```

Les spécifications de plugin sans préfixe essaient d’abord ClawHub, puis se rabattent sur npm. Forcez une source avec `openclaw plugins install clawhub:@openclaw/matrix` ou `npm:@openclaw/matrix`. Depuis une copie de travail locale : `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` enregistre et active le plugin ; aucune étape `enable` distincte n’est nécessaire. Le canal reste inactif tant qu’il n’est pas configuré comme indiqué ci-dessous. Consultez [Plugins](/fr/tools/plugin) pour connaître les règles générales d’installation.

## Configuration

1. Créez un compte Matrix sur votre serveur d’accueil.
2. Configurez `channels.matrix` avec `homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`.
3. Redémarrez le Gateway.
4. Démarrez une conversation privée avec le bot ou invitez-le dans un salon. Les nouvelles invitations ne sont acceptées que lorsque [`autoJoin`](#auto-join) les autorise.

### Configuration interactive

```bash
openclaw channels add
openclaw configure --section channels
```

L’assistant demande l’URL du serveur d’accueil, la méthode d’authentification (jeton ou mot de passe), l’identifiant utilisateur (uniquement pour l’authentification par mot de passe), un nom d’appareil facultatif, s’il faut activer le chiffrement de bout en bout, ainsi que l’accès aux salons et leur intégration automatique. Si des variables d’environnement `MATRIX_*` correspondantes existent déjà et que le compte ne possède aucune authentification enregistrée, l’assistant propose un raccourci utilisant ces variables. Résolvez les noms de salons avant d’enregistrer une liste d’autorisation avec `openclaw channels resolve --channel matrix "Project Room"`. L’activation du chiffrement de bout en bout dans l’assistant exécute la même initialisation que [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configuration minimale

Par jeton :

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

Par mot de passe (le jeton est mis en cache après la première connexion) :

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

### Intégration automatique

La valeur par défaut de `channels.matrix.autoJoin` est `"off"` : le bot n’apparaît pas dans les nouveaux salons ni dans les nouvelles conversations privées issues d’invitations tant que vous ne les avez pas rejoints manuellement. Au moment de l’invitation, OpenClaw ne peut pas déterminer s’il s’agit d’une conversation privée ou d’un groupe ; chaque invitation passe donc d’abord par `autoJoin`. `dm.policy` ne s’applique qu’ensuite, une fois que le bot a rejoint le salon et que celui-ci a été classé.

<Warning>
Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour limiter les invitations acceptées, ou `autoJoin: "always"` pour accepter toutes les invitations.

`autoJoinAllowlist` accepte uniquement `!roomId:server`, `#alias:server` ou `*`. Les noms de salons simples sont rejetés ; les alias sont résolus auprès du serveur d’accueil et non à partir de l’état revendiqué par le salon ayant envoyé l’invitation.
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

### Formats des cibles des listes d’autorisation

- Messages privés (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`) : utilisez `@user:server`. Les noms d’affichage sont ignorés par défaut, car ils sont modifiables ; définissez `dangerouslyAllowNameMatching: true` uniquement pour assurer explicitement une compatibilité fondée sur les noms d’affichage.
- Clés de liste d’autorisation des salons (`groups`, ancien alias `rooms`) : utilisez `!room:server` ou `#alias:server`. Les noms simples sont ignorés, sauf si `dangerouslyAllowNameMatching: true`.
- Listes d’autorisation des invitations (`autoJoinAllowlist`) : utilisez `!room:server`, `#alias:server` ou `*`. Les noms simples sont toujours rejetés.

### Normalisation de l’identifiant de compte

L’assistant convertit un nom convivial en identifiant de compte normalisé (`Ops Bot` -> `ops-bot`). La ponctuation est échappée en hexadécimal dans les noms de variables d’environnement propres au compte afin d’éviter les collisions : `-` (0x2D) devient `_X2D_`, de sorte que `ops-prod` correspond au préfixe d’environnement `MATRIX_OPS_X2D_PROD_`.

### Identifiants mis en cache

Matrix met les identifiants en cache sous `~/.openclaw/credentials/matrix/` : `credentials.json` pour le compte par défaut et `credentials-<account>.json` pour les comptes nommés. Lorsque des identifiants mis en cache existent, OpenClaw considère Matrix comme configuré même sans `accessToken` dans le fichier de configuration ; cela couvre la configuration, `openclaw doctor` et les vérifications d’état du canal.

### Variables d’environnement

Variables d’environnement associées aux clés de configuration, utilisées lorsque la clé de configuration équivalente n’est pas définie. Le compte par défaut utilise les noms sans préfixe ; les comptes nommés insèrent le jeton de compte avant le suffixe (voir la [normalisation](#account-id-normalization)).

| Compte par défaut      | Compte nommé (`<ID>` = jeton de compte) |
| ---------------------- | --------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Pour le compte `ops`, les noms deviennent `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, etc. `MATRIX_HOMESERVER` et toute variante `*_HOMESERVER` propre à un compte ne peuvent pas être définis depuis un fichier `.env` d’espace de travail ; consultez [Fichiers `.env` de l’espace de travail](/fr/gateway/security).

<Note>
La clé de récupération n’est pas une variable d’environnement associée à la configuration : OpenClaw ne la lit jamais directement depuis l’environnement. Les instructions de la CLI suggèrent de la transmettre par tube au moyen d’une variable d’interpréteur nommée `MATRIX_RECOVERY_KEY` pour le compte par défaut, ou `MATRIX_RECOVERY_KEY_<ID>` pour un compte nommé (identifiant de compte simplement converti en majuscules, sans échappement hexadécimal) ; consultez [Vérifier cet appareil avec une clé de récupération](#verify-this-device-with-a-recovery-key).
</Note>

## Exemple de configuration

Une base pratique avec appairage des messages privés, liste d’autorisation des salons et chiffrement de bout en bout :

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

## Aperçus en flux continu

La diffusion en flux continu des réponses Matrix est facultative. `streaming` détermine comment OpenClaw transmet la réponse en cours de génération par l’assistant ; `blockStreaming` détermine si chaque bloc terminé est conservé comme message Matrix distinct.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Pour conserver les aperçus en direct de la réponse tout en masquant les lignes intermédiaires des outils et de progression, utilisez la forme objet :

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

La forme objet complète accepte `{ mode, preview, progress }` :

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label` : libellé personnalisé, `"auto"` ou valeur non définie pour choisir un libellé configuré ou intégré, ou `false` pour le masquer.
- `progress.labels` : candidats utilisés uniquement lorsque `label` vaut `"auto"` ou n’est pas défini.
- `progress.maxLines` : nombre maximal de lignes de progression défilantes conservées dans le brouillon ; les lignes les plus anciennes au-delà de cette limite sont supprimées.
- `progress.maxLineChars` : nombre maximal de caractères par ligne de progression compacte avant troncature.
- `progress.toolProgress` : lorsque la valeur est `true` (par défaut), l’activité en direct des outils et de progression apparaît dans le brouillon.

| `streaming`       | Comportement                                                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (défaut)  | Attend la réponse complète, puis l’envoie en une seule fois. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                             |
| `"partial"`       | Modifie sur place un message texte normal à mesure que le modèle rédige le bloc actuel. Les clients standard peuvent notifier au premier aperçu, mais pas lors de la modification finale.            |
| `"quiet"`         | Identique à `"partial"`, mais le message est une notification silencieuse. Les destinataires sont avertis lorsqu’une règle de notification propre à l’utilisateur correspond à la modification finale (voir ci-dessous). |
| `"progress"`      | Envoie des lignes de progression compactes individuelles au moyen d’un brouillon de progression.                                                                                                     |

`blockStreaming` (`false` par défaut) est indépendant de `streaming` :

| `streaming`             | `blockStreaming: true`                                                          | `blockStreaming: false` (défaut)                            |
| ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `"partial"` / `"quiet"` | Brouillon en direct pour le bloc actuel, blocs terminés conservés comme messages | Brouillon en direct pour le bloc actuel, finalisé sur place |
| `"off"`                 | Un message Matrix avec notification par bloc terminé                            | Un message Matrix avec notification pour la réponse complète |

Remarques :

- Si un aperçu dépasse la limite de taille par événement de Matrix, OpenClaw interrompt sa diffusion en flux continu et se rabat sur l’envoi de la réponse finale uniquement.
- Les réponses contenant des médias envoient toujours les pièces jointes normalement ; si un ancien aperçu ne peut pas être réutilisé en toute sécurité, OpenClaw le masque avant d’envoyer la réponse multimédia finale.
- Les mises à jour d’aperçu de progression des outils sont activées par défaut lorsque la diffusion des aperçus est active. Définissez `streaming.preview.toolProgress: false` pour conserver les modifications d’aperçu du texte de réponse tout en laissant la progression des outils suivre le chemin d’envoi normal.
- Les modifications d’aperçu entraînent des appels supplémentaires à l’API Matrix. Conservez `streaming: "off"` pour le profil de limitation de débit le plus prudent.

## Messages vocaux

Les notes vocales Matrix entrantes sont transcrites avant le contrôle de mention du salon. Ainsi, une note vocale prononçant le nom du bot peut déclencher l’agent dans un salon configuré avec `requireMention: true`, et l’agent reçoit la transcription plutôt qu’un simple substitut de pièce jointe audio.

Matrix utilise le fournisseur multimédia audio partagé sous `tools.media.audio`, tel que `gpt-4o-mini-transcribe` d’OpenAI. Consultez la [Présentation des outils multimédias](/fr/tools/media-overview) pour configurer le fournisseur et connaître les limites.

- Les événements `m.audio` et les événements `m.file` dont le type MIME est `audio/*` sont admissibles.
- Dans les salons chiffrés, OpenClaw déchiffre la pièce jointe au moyen du chemin multimédia Matrix existant avant la transcription.
- La transcription est indiquée comme générée automatiquement et non fiable dans l’invite de l’agent.
- La pièce jointe est indiquée comme déjà transcrite afin que les outils multimédias en aval ne la transcrivent pas de nouveau.
- Définissez `tools.media.audio.enabled: false` pour désactiver globalement la transcription audio.

## Métadonnées d’approbation

Les demandes d’approbation natives de Matrix sont des événements `m.room.message` normaux contenant des données propres à OpenClaw sous la clé `com.openclaw.approval`. Les clients standard affichent toujours le corps textuel ; les clients compatibles avec OpenClaw peuvent lire l’identifiant structuré de l’approbation, son type, son état, les décisions ainsi que les détails d’exécution ou du plugin.

Lorsqu’une demande est trop longue pour un seul événement Matrix, OpenClaw découpe le texte visible et n’associe `com.openclaw.approval` qu’au premier segment. Les réactions d’autorisation ou de refus sont liées à ce premier événement ; les longues demandes conservent donc la même cible d’approbation que celles tenant dans un seul événement.

### Règles de push autohébergées pour les aperçus finalisés silencieux

`streaming: "quiet"` ne notifie les destinataires qu’une fois qu’un bloc ou un tour est finalisé — une règle de push par utilisateur doit correspondre au marqueur d’aperçu finalisé. Consultez [Règles de push Matrix pour les aperçus silencieux](/fr/channels/matrix-push-rules) pour connaître la procédure complète.

## Salons entre bots

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés. Utilisez `allowBots` pour autoriser intentionnellement le trafic entre agents :

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

- `allowBots: true` accepte les messages provenant d’autres comptes de bots Matrix configurés dans les salons autorisés et les messages privés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu’ils mentionnent visiblement ce bot dans les salons ; les messages privés restent autorisés dans tous les cas.
- `groups.<room>.allowBots` remplace le paramètre défini au niveau du compte pour un salon.
- Les messages acceptés provenant de bots configurés utilisent la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection). Configurez `channels.defaults.botLoopProtection`, puis remplacez ce paramètre par compte avec `channels.matrix.botLoopProtection` ou par salon avec `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw continue d’ignorer les messages provenant du même identifiant utilisateur Matrix afin d’éviter les boucles d’autoréponse.
- Matrix ne dispose d’aucun indicateur natif de bot ; OpenClaw considère comme « écrit par un bot » tout message « envoyé par un autre compte Matrix configuré sur ce Gateway OpenClaw ».

Utilisez des listes d’autorisation de salons strictes et imposez les mentions lorsque vous activez le trafic entre bots dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d’image sortants utilisent `thumbnail_file` afin que les aperçus d’image soient chiffrés avec la pièce jointe complète ; les salons non chiffrés utilisent simplement `thumbnail_url`. Aucune configuration n’est nécessaire — le Plugin détecte automatiquement l’état E2EE.

Toutes les commandes `openclaw matrix` acceptent `--verbose` (diagnostics complets), `--json` (sortie lisible par une machine) et `--account <id>` (configurations multicomptes). Par défaut, la sortie est concise.

### Activer le chiffrement

```bash
openclaw matrix encryption setup
```

Initialise le stockage des secrets et la signature croisée, crée si nécessaire une sauvegarde des clés de salon, puis affiche l’état et les étapes suivantes. Options utiles :

- `--recovery-key <key>` applique une clé de récupération avant l’initialisation (préférez la forme utilisant l’entrée standard ci-dessous)
- `--force-reset-cross-signing` abandonne l’identité de signature croisée actuelle et en crée une nouvelle (uniquement de manière intentionnelle)

Pour un nouveau compte, activez E2EE lors de sa création :

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` est un alias de `--enable-e2ee`. Configuration manuelle équivalente :

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

`verify status` indique trois signaux de confiance indépendants (`--verbose` les affiche tous) :

- `Approuvé localement` : approuvé uniquement par ce client
- `Vérifié par signature croisée` : le SDK signale une vérification par signature croisée
- `Signé par le propriétaire` : signé par votre propre clé d’autosignature (diagnostic uniquement)

`Vérifié par le propriétaire` vaut `oui` uniquement lorsque `Vérifié par signature croisée` vaut `oui` ; la confiance locale ou la seule signature du propriétaire ne suffit pas.

`--allow-degraded-local-state` renvoie des diagnostics au mieux sans préparer d’abord le compte Matrix ; cette option est utile pour les vérifications hors ligne ou avec une configuration partielle.

### Vérifier cet appareil avec une clé de récupération

Transmettez la clé de récupération via l’entrée standard au lieu de la fournir sur la ligne de commande :

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

La commande indique trois états :

- `Clé de récupération acceptée` : Matrix a accepté la clé pour le stockage des secrets ou l’approbation de l’appareil.
- `Sauvegarde utilisable` : la sauvegarde des clés de salon peut être chargée avec les éléments de récupération approuvés.
- `Appareil vérifié par le propriétaire` : cet appareil bénéficie de la confiance complète de l’identité de signature croisée Matrix.

Elle se termine avec un code différent de zéro lorsque la confiance complète de l’identité est incomplète, même si la clé de récupération a déverrouillé les éléments de sauvegarde. Dans ce cas, terminez l’autovérification depuis un autre client Matrix :

```bash
openclaw matrix verify self
```

`verify self` attend que `Vérifié par signature croisée : oui` soit établi avant de se terminer avec succès. Utilisez `--timeout-ms <ms>` pour ajuster l’attente.

La forme avec clé littérale `openclaw matrix verify device "<recovery-key>"` fonctionne également, mais la clé se retrouve dans l’historique du shell.

### Initialiser ou réparer la signature croisée

```bash
openclaw matrix verify bootstrap
```

Commande de réparation et de configuration des comptes chiffrés. Dans l’ordre, elle :

- initialise le stockage des secrets en réutilisant une clé de récupération existante lorsque cela est possible
- initialise la signature croisée et téléverse les clés publiques manquantes
- marque et signe de manière croisée l’appareil actuel
- crée une sauvegarde des clés de salon côté serveur s’il n’en existe pas déjà une

Si le serveur d’accueil exige une UIA pour téléverser les clés de signature croisée, OpenClaw essaie d’abord sans authentification, puis avec `m.login.dummy`, puis avec `m.login.password` (nécessite `channels.matrix.password`).

Options utiles :

- `--recovery-key-stdin` (à associer à `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) ou `--recovery-key <key>`
- `--force-reset-cross-signing` pour abandonner l’identité de signature croisée actuelle (uniquement de manière intentionnelle ; nécessite que la clé de récupération active soit stockée ou fournie avec `--recovery-key-stdin`)

### Sauvegarde des clés de salon

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` indique s’il existe une sauvegarde côté serveur et si cet appareil peut la déchiffrer. `backup restore` importe les clés de salon sauvegardées dans le stockage cryptographique local ; omettez `--recovery-key-stdin` si la clé de récupération est déjà enregistrée sur le disque.

Pour remplacer une sauvegarde défectueuse par une nouvelle base de référence (en acceptant la perte de l’ancien historique irrécupérable ; cette commande peut également recréer le stockage des secrets si le secret de sauvegarde actuel ne peut pas être chargé) :

```bash
openclaw matrix verify backup reset --yes
```

Ajoutez `--rotate-recovery-key` uniquement si l’ancienne clé de récupération ne doit intentionnellement plus permettre de déverrouiller la nouvelle base de référence de sauvegarde.

### Répertorier, demander et traiter les vérifications

```bash
openclaw matrix verify list
```

Répertorie les demandes de vérification en attente pour le compte sélectionné.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envoie une demande de vérification depuis ce compte. `--own-user` demande une autovérification (acceptez l’invite dans un autre client Matrix du même utilisateur) ; `--user-id`/`--device-id`/`--room-id` ciblent une autre personne. `--own-user` ne peut pas être combiné avec les autres options de ciblage.

Pour une gestion plus fine du cycle de vie — généralement lors du suivi parallèle de demandes entrantes provenant d’un autre client — ces commandes agissent sur une demande précise `<id>` (affichée par `verify list` et `verify request`) :

| Commande                                   | Objectif                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accepter une demande entrante                                               |
| `openclaw matrix verify start <id>`        | Démarrer le processus SAS                                                   |
| `openclaw matrix verify sas <id>`          | Afficher les emoji ou les nombres décimaux du SAS                           |
| `openclaw matrix verify confirm-sas <id>`  | Confirmer que le SAS correspond à ce qu’affiche l’autre client              |
| `openclaw matrix verify mismatch-sas <id>` | Rejeter le SAS lorsque les emoji ou les nombres décimaux ne correspondent pas |
| `openclaw matrix verify cancel <id>`       | Annuler ; accepte les options facultatives `--reason <text>` et `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` et `cancel` acceptent tous `--user-id` et `--room-id` comme indications de suivi par message privé lorsque la vérification est rattachée à un salon précis de messages directs.

### Remarques sur les configurations multicomptes

Sans `--account <id>`, les commandes de la CLI Matrix utilisent le compte par défaut implicite. En présence de plusieurs comptes nommés et en l’absence de `channels.matrix.defaultAccount`, les commandes refusent de choisir arbitrairement et vous demandent de sélectionner un compte. Lorsque E2EE est désactivé ou indisponible pour un compte nommé, les erreurs indiquent la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Avec `encryption: true`, `startupVerification` vaut par défaut `"if-unverified"`. Au démarrage, un appareil non vérifié demande une autovérification dans un autre client Matrix, en évitant les doublons et en appliquant un délai de temporisation (24 heures par défaut). Ajustez-le avec `startupVerificationCooldownHours` ou désactivez-le avec `startupVerification: "off"`.

    Le démarrage exécute également une initialisation cryptographique prudente qui réutilise le stockage des secrets et l’identité de signature croisée actuels. Si l’état d’initialisation est défectueux, OpenClaw tente une réparation contrôlée même sans `channels.matrix.password` ; si le serveur d’accueil exige une UIA par mot de passe, le démarrage consigne un avertissement sans provoquer d’échec fatal. Les appareils déjà signés par le propriétaire sont préservés.

    Consultez [Migration Matrix](/fr/channels/matrix-migration) pour connaître la procédure complète de mise à niveau.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publie les notifications du cycle de vie de la vérification dans le salon strict de vérification par message privé sous forme de messages `m.notice` : demande, disponibilité (avec des instructions « Vérifier par emoji »), début/fin et détails du SAS (emoji/nombres décimaux) lorsqu’ils sont disponibles.

    Les demandes entrantes provenant d’un autre client Matrix sont suivies et automatiquement acceptées. Pour l’autovérification, OpenClaw démarre automatiquement le processus SAS et confirme son propre côté dès que la vérification par emoji est disponible — vous devez tout de même comparer puis confirmer « Ils correspondent » dans votre client Matrix.

    Les notifications système de vérification ne sont pas transmises au pipeline de discussion de l’agent.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Si `verify status` indique que l’appareil actuel ne figure plus sur le serveur d’accueil, créez un nouvel appareil Matrix OpenClaw. Pour une connexion par mot de passe :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Pour une authentification par jeton, créez un nouveau jeton d’accès dans votre client Matrix ou votre interface d’administration, puis mettez à jour OpenClaw :

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Remplacez `assistant` par l’identifiant de compte indiqué par la commande ayant échoué, ou omettez `--account` pour utiliser le compte par défaut.

  </Accordion>

  <Accordion title="Device hygiene">
    Les anciens appareils gérés par OpenClaw peuvent s’accumuler. Répertoriez-les et supprimez ceux qui sont obsolètes :

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Le chiffrement E2EE de Matrix utilise le chemin cryptographique Rust officiel de `matrix-js-sdk`, avec `fake-indexeddb` comme adaptateur IndexedDB. L’état cryptographique est conservé dans `crypto-idb-snapshot.json` (avec des autorisations de fichier restrictives).

    L’état d’exécution chiffré se trouve sous `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` et comprend le stockage de synchronisation, le stockage cryptographique, la clé de récupération, l’instantané IDB, les associations de fils de discussion et l’état de vérification au démarrage. Lorsque le jeton change mais que l’identité du compte reste identique, OpenClaw réutilise la meilleure racine existante afin que l’état antérieur reste visible.

    Une seule ancienne racine de hachage de jeton peut constituer un chemin normal de continuité lors de la rotation des jetons. Si OpenClaw consigne `matrix: multiple populated token-hash storage roots detected`, inspectez le répertoire du compte et archivez les anciennes racines sœurs uniquement après avoir confirmé que la racine active sélectionnée est saine. Préférez déplacer les anciennes racines dans un répertoire `_archive/` plutôt que de les supprimer immédiatement.

  </Accordion>
</AccordionGroup>

## Gestion du profil

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Transmettez les deux options en un seul appel. Matrix accepte directement les URL d’avatar `mxc://` ; la transmission d’une URL `http://`/`https://` téléverse d’abord le fichier, puis stocke l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans la valeur de remplacement propre au compte).

## Fils de discussion

Matrix prend en charge les fils de discussion natifs pour les réponses automatiques comme pour les envois via l’outil de messagerie. Deux réglages indépendants contrôlent ce comportement :

### Routage des sessions (`sessionScope`)

`dm.sessionScope` détermine comment les salons de messages privés Matrix sont associés aux sessions OpenClaw :

- `"per-user"` (par défaut) : tous les salons de messages privés ayant le même pair routé partagent une session.
- `"per-room"` : chaque salon de messages privés Matrix obtient sa propre clé de session, même pour un même pair.

Les liaisons de conversation explicites ont toujours priorité sur `sessionScope` ; les salons et fils liés conservent la session cible choisie.

### Réponses dans les fils (`threadReplies`)

`threadReplies` détermine où le bot publie sa réponse :

- `"off"` : les réponses sont publiées au niveau principal. Les messages entrants d’un fil restent dans la session parente.
- `"inbound"` : répond dans un fil uniquement lorsque le message entrant se trouvait déjà dans ce fil.
- `"always"` : répond dans un fil ayant pour racine le message déclencheur ; dès le premier déclenchement, cette conversation est routée par une session correspondante propre au fil.

`dm.threadReplies` remplace ce réglage uniquement pour les messages privés ; vous pouvez, par exemple, isoler les fils des salons tout en conservant des messages privés sans fils.

### Héritage des fils et commandes slash

- Les messages entrants d’un fil incluent le message racine du fil comme contexte supplémentaire pour l’agent.
- Les envois via l’outil de messagerie héritent automatiquement du fil Matrix actuel lorsqu’ils ciblent le même salon (ou le même utilisateur cible en message privé), sauf si un `threadId` explicite est fourni.
- La réutilisation d’un utilisateur cible en message privé ne s’applique que lorsque les métadonnées de la session actuelle prouvent qu’il s’agit du même pair de message privé sur le même compte Matrix ; sinon, OpenClaw revient au routage normal propre à l’utilisateur.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent tous dans les salons et messages privés Matrix.
- La commande `/focus` exécutée au niveau principal crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSessions` est activé.
- L’exécution de `/focus` ou de `/acp spawn --thread here` dans un fil Matrix existant lie ce fil sur place.

Lorsque OpenClaw détecte qu’un salon de messages privés Matrix entre en collision avec un autre salon de messages privés dans la même session partagée, il publie une notification `m.notice` unique indiquant la solution de secours `/focus` et suggérant de modifier `dm.sessionScope`. Cette notification n’apparaît que lorsque les liaisons de fils sont activées.

## Liaisons de conversations ACP

Les salons, messages privés et fils Matrix existants peuvent devenir des espaces de travail ACP durables sans modifier l’interface de discussion.

Procédure rapide pour l’opérateur :

- Exécutez `/acp spawn codex --bind here` dans le message privé, le salon ou le fil Matrix existant que vous souhaitez continuer à utiliser.
- Dans un message privé ou un salon au niveau principal, le message privé ou salon actuel reste l’interface de discussion, et les messages futurs sont routés vers la session ACP créée.
- Dans un fil existant, `--bind here` lie ce fil sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

`--bind here` ne crée pas de fil Matrix enfant. `threadBindings.spawnSessions` contrôle `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil enfant.

### Configuration des liaisons de fils

Matrix hérite des valeurs globales par défaut de `session.threadBindings` et prend en charge des remplacements propres au canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions` : contrôle la création de fils pour les sous-agents et ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions` : remplacements plus précis pour les créations réservées aux sous-agents ou à ACP.
- `threadBindings.defaultSpawnContext`

Les créations de sessions liées à des fils Matrix sont activées par défaut. Définissez `threadBindings.spawnSessions: false` pour empêcher `/focus` au niveau principal et `/acp spawn --thread auto|here` de créer ou lier des fils Matrix. Définissez `threadBindings.defaultSpawnContext: "isolated"` lorsque les créations de fils natifs pour les sous-agents ne doivent pas dupliquer la transcription parente.

## Réactions

Matrix prend en charge les réactions sortantes, les notifications de réactions entrantes et les réactions d’accusé de réception.

Les outils de réaction sortante sont contrôlés par `channels.matrix.actions.reactions` :

- `react` ajoute une réaction à un événement Matrix.
- `reactions` répertorie le résumé actuel des réactions à un événement Matrix.
- `emoji=""` supprime les propres réactions du bot à cet événement.
- `remove: true` supprime uniquement la réaction correspondant à l’emoji indiqué parmi celles du bot.

**Ordre de résolution** (la première valeur définie l’emporte) :

| Paramètre               | Ordre                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `ackReaction`           | par compte -> canal -> `messages.ackReaction` -> emoji de secours de l’identité de l’agent    |
| `ackReactionScope`      | par compte -> canal -> `messages.ackReactionScope` -> valeur par défaut `"group-mentions"`    |
| `reactionNotifications` | par compte -> canal -> valeur par défaut `"own"`                                              |

`reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot ; `"off"` désactive les événements système de réaction. Les suppressions de réactions ne sont pas synthétisées sous forme d’événements système : Matrix les expose comme des occultations, et non comme des suppressions `m.reaction` autonomes.

## Contexte de l’historique

- `channels.matrix.historyLimit` contrôle le nombre de messages récents du salon inclus comme `InboundHistory` lorsqu’un message de salon déclenche l’agent. Revient à `messages.groupChat.historyLimit` ; la valeur effective par défaut est `0` si aucun des deux n’est défini (désactivé).
- L’historique des salons Matrix est limité au salon ; les messages privés continuent d’utiliser l’historique normal de la session.
- L’historique du salon ne contient que les messages en attente : OpenClaw met en mémoire tampon les messages du salon qui n’ont pas encore déclenché de réponse, puis prend un instantané de cette fenêtre lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives pour un même événement Matrix réutilisent l’instantané d’historique d’origine au lieu de progresser vers des messages plus récents du salon.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte supplémentaire du salon, tel que le texte récupéré d’une réponse, les racines de fils et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel qu’il a été reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire pour ne conserver que les expéditeurs autorisés par les vérifications actives de liste d’autorisation du salon ou de l’utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve tout de même une réponse explicitement citée.

Cela affecte uniquement la visibilité du contexte supplémentaire, et non la capacité du message entrant lui-même à déclencher une réponse. L’autorisation du déclenchement dépend toujours de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de stratégie des messages privés.

## Stratégie des messages privés et des salons

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

Pour désactiver entièrement les messages privés tout en conservant le fonctionnement des salons, définissez `dm.enabled: false` :

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

Consultez [Groupes](/fr/channels/groups) pour le comportement du déclenchement par mention et des listes d’autorisation.

Exemple d’association pour les messages privés Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue d’envoyer des messages avant l’approbation, OpenClaw réutilise le même code d’association en attente et peut envoyer une réponse de rappel après un court délai de récupération au lieu de générer un nouveau code.

Consultez [Association](/fr/channels/pairing) pour le flux partagé d’association des messages privés et la disposition du stockage.

## Réparation des salons directs

Si l’état des messages directs dérive, OpenClaw peut conserver des associations `m.direct` obsolètes pointant vers d’anciens salons individuels au lieu du message privé actif. Inspectez l’association actuelle d’un pair :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-la :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Les deux commandes acceptent `--account <id>` pour les configurations à plusieurs comptes. Le processus de réparation :

- préfère un message privé strictement individuel déjà associé dans `m.direct`
- se rabat sur tout message privé strictement individuel actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun message privé sain n’existe

Il ne supprime pas automatiquement les anciens salons. Il sélectionne le message privé sain et met à jour l’association afin que les futurs envois Matrix, notifications de vérification et autres flux de messages directs ciblent le bon salon.

## Approbations d’exécution

Matrix peut servir de client d’approbation natif. Configurez cette fonction sous `channels.matrix.execApprovals` (ou `channels.matrix.accounts.<account>.execApprovals` pour un remplacement propre au compte) :

- `enabled` : transmet les approbations au moyen d’invites natives de Matrix. Une valeur non définie ou `"auto"` active automatiquement la fonction dès qu’au moins un approbateur peut être résolu ; définissez `false` pour la désactiver explicitement.
- `approvers` : identifiants d’utilisateurs Matrix (`@owner:example.org`) autorisés à approuver les demandes d’exécution. Revient à `channels.matrix.dm.allowFrom`.
- `target` : destination des invites. `"dm"` (par défaut) les envoie dans les messages privés des approbateurs ; `"channel"` les envoie dans le salon ou message privé d’origine ; `"both"` les envoie aux deux.
- `agentFilter` / `sessionFilter` : listes d’autorisation facultatives déterminant quels agents ou quelles sessions déclenchent la transmission Matrix.

L’autorisation diffère légèrement selon le type d’approbation :

- Les **approbations d’exécution** utilisent `execApprovals.approvers`, avec repli sur `dm.allowFrom`.
- Les **approbations de Plugins** sont autorisées uniquement par `dm.allowFrom`.

Les deux types partagent les raccourcis de réaction Matrix et les mises à jour des messages. Les approbateurs voient des raccourcis de réaction sur le message d’approbation principal :

- ✅ autoriser une fois
- ❌ refuser
- ♾️ toujours autoriser (lorsque la stratégie d’exécution effective le permet)

Commandes slash de secours : `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Seuls les approbateurs résolus peuvent approuver ou refuser. La transmission dans le canal des approbations d’exécution inclut le texte de la commande ; n’activez `channel` ou `both` que dans des salons de confiance.

Voir aussi : [Approbations d’exécution](/fr/tools/exec-approvals).

## Commandes slash

Les commandes slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) fonctionnent directement dans les messages privés. Dans les salons, OpenClaw reconnaît également les commandes précédées de la propre mention Matrix du bot ; ainsi, `@bot:server /new` déclenche le chemin de commande sans expression régulière de mention personnalisée. Le bot reste ainsi réactif aux publications de salon de type `@mention /command` qu’Element et les clients similaires émettent lorsqu’un utilisateur utilise l’autocomplétion par tabulation sur le nom du bot avant de saisir la commande.

Les règles d’autorisation continuent de s’appliquer : les expéditeurs de commandes doivent satisfaire aux mêmes stratégies de liste d’autorisation ou de propriétaire pour les messages privés ou les salons que les messages ordinaires.

## Comptes multiples

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

- Les valeurs de premier niveau de `channels.matrix` servent de valeurs par défaut pour les comptes nommés, sauf si un compte les remplace.
- Limitez une entrée de salon héritée à un compte précis avec `groups.<room>.account`. Les entrées sans `account` sont partagées entre les comptes ; `account: "default"` fonctionne toujours lorsque le compte par défaut est configuré au premier niveau.

**Sélection du compte par défaut :**

- Définissez `defaultAccount` pour choisir le compte nommé privilégié par le routage implicite, les sondes et les commandes CLI.
- Si vous disposez de plusieurs comptes et que l’un d’eux est littéralement nommé `default`, OpenClaw l’utilise implicitement même lorsque `defaultAccount` n’est pas défini.
- Avec plusieurs comptes nommés et aucun compte par défaut sélectionné, les commandes CLI refusent de faire une supposition : définissez `defaultAccount` ou transmettez `--account <id>`.
- Le bloc de premier niveau `channels.matrix.*` n’est considéré comme le compte implicite `default` que lorsque son authentification est complète (`homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`). Les comptes nommés restent détectables à partir de `homeserver` + `userId` lorsque des identifiants mis en cache assurent l’authentification.

**Promotion :**

- Lorsque OpenClaw transforme une configuration à compte unique en configuration multicomptes pendant une réparation ou une configuration, il conserve le compte nommé existant, le cas échéant, ou celui vers lequel `defaultAccount` pointe déjà. Seules les clés d’authentification et d’amorçage de Matrix sont déplacées dans le compte promu ; les clés partagées de stratégie de distribution restent au premier niveau.

Consultez la [référence de configuration](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle multicomptes commun.

## Serveurs d’accueil privés ou sur le réseau local

Par défaut, OpenClaw bloque les serveurs d’accueil Matrix privés ou internes afin de protéger contre les attaques SSRF, sauf si vous les autorisez explicitement pour chaque compte.

Si votre serveur d’accueil s’exécute sur localhost, une adresse IP de réseau local/Tailscale ou un nom d’hôte interne, activez `network.dangerouslyAllowPrivateNetwork` pour ce compte :

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

Exemple de configuration avec la CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette autorisation explicite ne permet que les cibles privées ou internes de confiance. Les serveurs d’accueil publics en texte clair, tels que `http://matrix.example.org:8008`, restent bloqués. Privilégiez `https://` chaque fois que possible.

## Acheminement du trafic Matrix par proxy

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

Les comptes nommés peuvent remplacer la valeur par défaut de premier niveau avec `channels.matrix.accounts.<id>.proxy`. OpenClaw utilise le même paramètre de proxy pour le trafic Matrix à l’exécution et les sondes d’état des comptes.

## Résolution des cibles

Matrix accepte les formes de cible suivantes partout où OpenClaw demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

Les identifiants de salon Matrix sont sensibles à la casse. Utilisez exactement la casse de l’identifiant de salon fournie par Matrix lors de la configuration de cibles de distribution explicites, de tâches Cron, de liaisons ou de listes d’autorisation. OpenClaw conserve des clés de session internes sous une forme canonique pour le stockage ; ces clés en minuscules ne constituent donc pas une source fiable pour les identifiants de distribution Matrix.

La recherche dynamique dans l’annuaire utilise le compte Matrix connecté :

- Les recherches d’utilisateurs interrogent l’annuaire des utilisateurs Matrix sur ce serveur d’origine.
- Les recherches de salons acceptent directement les identifiants et alias explicites. La recherche par nom parmi les salons rejoints est effectuée au mieux et ne s’applique aux listes d’autorisation de salons à l’exécution que lorsque `dangerouslyAllowNameMatching: true` est défini.
- Si le nom d’un salon ne peut pas être résolu en identifiant ou en alias, il est ignoré lors de la résolution de la liste d’autorisation à l’exécution.

## Référence de configuration

Les champs utilisateur de type liste d’autorisation (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) acceptent les identifiants utilisateur Matrix complets (option la plus sûre). Les entrées qui ne sont pas des identifiants sont ignorées par défaut. Si `dangerouslyAllowNameMatching: true` est défini, les correspondances exactes avec les noms d’affichage de l’annuaire Matrix sont résolues au démarrage et chaque fois que la liste d’autorisation change pendant l’exécution du moniteur ; les entrées qui ne peuvent pas être résolues sont ignorées à l’exécution.

Les clés de liste d’autorisation de salons (`groups`, anciennement `rooms`) doivent être des identifiants ou des alias de salon. Les clés constituées d’un simple nom de salon sont ignorées par défaut ; `dangerouslyAllowNameMatching: true` rétablit une recherche au mieux parmi les noms des salons rejoints.

### Compte et connexion

- `enabled` : active ou désactive le canal.
- `name` : libellé d’affichage facultatif du compte.
- `defaultAccount` : identifiant de compte privilégié lorsque plusieurs comptes Matrix sont configurés.
- `accounts` : remplacements nommés propres à chaque compte. Les valeurs de premier niveau de `channels.matrix` sont héritées comme valeurs par défaut.
- `homeserver` : URL du serveur d’origine, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autorise ce compte à se connecter à `localhost`, à des adresses IP de réseau local/Tailscale ou à des noms d’hôte internes.
- `proxy` : URL facultative d’un proxy HTTP(S) pour le trafic Matrix. Le remplacement par compte est pris en charge.
- `userId` : identifiant utilisateur Matrix complet (`@bot:example.org`).
- `accessToken` : jeton d’accès pour l’authentification par jeton. Les valeurs en texte clair et SecretRef sont prises en charge avec les fournisseurs d’environnement, de fichier et d’exécution ([Gestion des secrets](/fr/gateway/secrets)).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en texte clair et SecretRef sont prises en charge.
- `deviceId` : identifiant explicite de l’appareil Matrix.
- `deviceName` : nom d’affichage de l’appareil utilisé lors de la connexion par mot de passe.
- `avatarUrl` : URL stockée de l’avatar du compte, utilisée pour la synchronisation du profil et les mises à jour avec `profile set`.
- `initialSyncLimit` : nombre maximal d’événements récupérés lors de la synchronisation au démarrage.

### Chiffrement

- `encryption` : active le chiffrement de bout en bout. Valeur par défaut : `false`.
- `startupVerification` : `"if-unverified"` (valeur par défaut lorsque le chiffrement de bout en bout est activé) ou `"off"`. Demande automatiquement une auto-vérification au démarrage lorsque cet appareil n’est pas vérifié.
- `startupVerificationCooldownHours` : délai avant la prochaine demande automatique au démarrage. Valeur par défaut : `24`.

### Accès et stratégie

- `groupPolicy` : `"open"`, `"allowlist"` ou `"disabled"`. Valeur par défaut : `"allowlist"`.
- `groupAllowFrom` : liste d’autorisation d’identifiants utilisateur pour le trafic des salons.
- `mentionPatterns` : expressions régulières limitées à certains salons pour les mentions. Objet de la forme `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Détermine, salon par salon, si les valeurs `agents.list[].groupChat.mentionPatterns` configurées s’appliquent.
- `dm.enabled` : lorsque la valeur est `false`, ignore tous les messages privés. Valeur par défaut : `true`.
- `dm.policy` : `"pairing"` (valeur par défaut), `"allowlist"`, `"open"` ou `"disabled"`. S’applique une fois que le bot a rejoint le salon et l’a classé comme conversation privée ; cela n’affecte pas le traitement des invitations.
- `dm.allowFrom` : liste d’autorisation d’identifiants utilisateur pour le trafic des messages privés.
- `dm.sessionScope` : `"per-user"` (valeur par défaut) ou `"per-room"`.
- `dm.threadReplies` : remplacement réservé aux messages privés pour les réponses dans les fils (`"off"`, `"inbound"`, `"always"`).
- `allowBots` : accepte les messages provenant d’autres comptes de bot Matrix configurés (`true` ou `"mentions"`).
- `allowlistOnly` : lorsque la valeur est `true`, force toutes les stratégies actives de messages privés (sauf `"disabled"`) et les stratégies de groupe `"open"` à utiliser `"allowlist"`. Ne modifie pas les stratégies `"disabled"`.
- `dangerouslyAllowNameMatching` : lorsque la valeur est `true`, autorise la recherche dans l’annuaire Matrix par nom d’affichage pour les entrées des listes d’autorisation d’utilisateurs, ainsi que la recherche par nom des salons rejoints pour les clés des listes d’autorisation de salons. Privilégiez les identifiants complets `@user:server` et les identifiants ou alias de salon.
- `autoJoin` : `"always"`, `"allowlist"` ou `"off"`. Valeur par défaut : `"off"`. S’applique à toutes les invitations Matrix, y compris celles de type conversation privée.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `"allowlist"`. Les entrées d’alias sont résolues auprès du serveur d’origine, et non d’après l’état déclaré par le salon ayant envoyé l’invitation.
- `contextVisibility` : visibilité du contexte supplémentaire (`"all"` par défaut, `"allowlist"`, `"allowlist_quote"`).

### Comportement des réponses

- `replyToMode` : `"off"` (valeur par défaut), `"first"`, `"all"` ou `"batched"`.
- `threadReplies` : `"off"` (la valeur par défaut de premier niveau est résolue en `"inbound"` sauf si elle est explicitement définie), `"inbound"` ou `"always"`.
- `threadBindings` : remplacements par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `streaming` : `"off"` (valeur par défaut), `"partial"`, `"quiet"`, `"progress"` ou sous forme d’objet `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming` : lorsque la valeur est `true`, les blocs terminés de l’assistant sont conservés comme messages de progression distincts. Valeur par défaut : `false`.
- `markdown` : configuration facultative du rendu Markdown pour le texte sortant.
- `responsePrefix` : chaîne facultative ajoutée au début des réponses sortantes.
- `textChunkLimit` : taille des segments sortants en caractères lorsque `chunkMode: "length"`. Valeur par défaut : `4000`.
- `chunkMode` : `"length"` (valeur par défaut, découpage selon le nombre de caractères) ou `"newline"` (découpage aux limites de ligne).
- `historyLimit` : nombre de messages récents du salon inclus comme `InboundHistory` lorsqu’un message du salon déclenche l’agent. Utilise à défaut `messages.groupChat.historyLimit` ; valeur par défaut effective : `0` (désactivé).
- `mediaMaxMb` : taille maximale des médias en Mo pour les envois sortants et le traitement entrant. Valeur par défaut : `20`.

### Paramètres des réactions

- `ackReaction` : remplacement de la réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : remplacement de la portée (`"group-mentions"` par défaut, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications` : mode de notification des réactions entrantes (`"own"` par défaut, `"off"`).

### Outils et remplacements par salon

- `actions` : contrôle de l’accès aux outils par action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups` : table des stratégies par salon. L’identité de session utilise l’identifiant stable du salon après résolution. (`rooms` est un ancien alias.)
  - `groups.<room>.account` : limite une entrée de salon héritée à un compte précis.
  - `groups.<room>.enabled` : activation ou désactivation par salon. Lorsque la valeur est `false`, le salon est ignoré comme s’il ne figurait pas dans la table.
  - `groups.<room>.requireMention` : remplacement par salon de l’exigence de mention définie au niveau du canal.
  - `groups.<room>.allowBots` : remplacement par salon du paramètre défini au niveau du canal (`true` ou `"mentions"`).
  - `groups.<room>.botLoopProtection` : remplacement par salon du budget de protection contre les boucles entre bots.
  - `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
  - `groups.<room>.tools` : remplacements par salon des autorisations/interdictions d’outils.
  - `groups.<room>.autoReply` : remplacement par salon du filtrage par mention. `true` désactive les exigences de mention pour ce salon ; `false` les réactive.
  - `groups.<room>.skills` : filtre de Skills par salon.
  - `groups.<room>.systemPrompt` : extrait d’invite système propre au salon.

### Paramètres d’approbation des exécutions

- `execApprovals.enabled` : distribue les demandes d’approbation d’exécution au moyen d’invites natives de Matrix.
- `execApprovals.approvers` : identifiants utilisateur Matrix autorisés à approuver. Utilise à défaut `dm.allowFrom`.
- `execApprovals.target` : `"dm"` (valeur par défaut), `"channel"` ou `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter` : listes d’autorisation facultatives d’agents/sessions pour la distribution.

## Voir aussi

- [Présentation des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification des messages privés et processus d’appairage
- [Groupes](/fr/channels/groups) - comportement des conversations de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement

---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios QA adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Aperçu de l’assurance qualité
x-i18n:
    generated_at: "2026-05-07T13:16:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée est destinée à tester OpenClaw de manière plus réaliste et structurée autour des canaux qu’un simple test unitaire ne le permet.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins de runner : adaptateurs de transport en direct qui
  pilotent un canal réel dans un Gateway QA enfant.
- `qa/` : ressources d’initialisation versionnées dans le dépôt pour la tâche de démarrage et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état de VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                                                                                                              |
| `qa suite`                                          | Exécuter les scénarios versionnés dans le dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                                                                                            |
| `qa coverage`                                       | Afficher l’inventaire de couverture des scénarios en Markdown (`--json` pour une sortie exploitable par machine).                                                                                                                                                       |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                                                                                                                 |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles en direct avec un rapport évalué. Voir [Rapports](#reporting).                                                                                                                                              |
| `qa manual`                                         | Exécuter un prompt ponctuel contre la voie fournisseur/modèle sélectionnée.                                                                                                                                                                                              |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Construire l’image Docker QA préintégrée.                                                                                                                                                                                                                                |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                                                                                                       |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                 |
| `qa aimock`                                         | Démarrer uniquement le serveur de fournisseur AIMock.                                                                                                                                                                                                                    |
| `qa mock-openai`                                    | Démarrer uniquement le serveur de fournisseur `mock-openai` sensible aux scénarios.                                                                                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool d’identifiants Convex partagé.                                                                                                                                                                                                                             |
| `qa matrix`                                         | Voie de transport en direct contre un serveur domestique Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                                                                                        |
| `qa telegram`                                       | Voie de transport en direct contre un vrai groupe Telegram privé.                                                                                                                                                                                                        |
| `qa discord`                                        | Voie de transport en direct contre un vrai canal de serveur Discord privé.                                                                                                                                                                                               |
| `qa slack`                                          | Voie de transport en direct contre un vrai canal Slack privé.                                                                                                                                                                                                            |
| `qa mantis`                                         | Runner de vérification avant et après pour les bugs de transport en direct, avec preuves de réactions de statut Discord, smoke desktop/navigateur Crabbox, et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis) et [Runbook Desktop Slack Mantis](/fr/concepts/mantis-slack-desktop-runbook). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus rapidement sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab
change.

Pour un smoke local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le scénario QA
`otel-trace-smoke` avec le Plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la release :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors de tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste limitée à une extraction source. L’archive npm omet intentionnellement
QA Lab, donc les voies de release Docker de package n’exécutent pas de commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis une extraction source construite lorsque vous modifiez l’instrumentation
de diagnostics.

Pour une voie smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue de profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un serveur domestique Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires conducteur/SUT/observateur, exécute le vrai Plugin Matrix dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en bout : filtrage par mention, politiques allow-bot, listes d’autorisation, réponses de premier niveau et en fil, routage des MP, gestion des réactions, suppression des modifications entrantes, déduplication de relecture après redémarrage, récupération après interruption du serveur domestique, livraison des métadonnées d’approbation, gestion des médias, et flux d’amorçage/récupération/vérification E2EE Matrix. Le profil CLI E2EE pilote aussi `openclaw matrix encryption setup` et les commandes de vérification via le même serveur domestique jetable avant de vérifier les réponses du Gateway.

Discord dispose aussi de scénarios à activation explicite réservés à Mantis pour la reproduction de bugs. Utilisez
`--scenario discord-status-reactions-tool-only` pour la chronologie explicite des réactions de statut,
ou `--scenario discord-thread-reply-filepath-attachment` pour créer un
vrai fil Discord et vérifier que `message.thread-reply` préserve une pièce jointe
`filePath`. Ces scénarios restent hors de la voie Discord en direct par défaut,
car ce sont des sondes de reproduction avant/après plutôt qu’une large couverture smoke.
Le workflow Mantis de pièce jointe de fil peut aussi ajouter une vidéo témoin Discord Web
connectée lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement
QA. Ce profil de visualisation sert uniquement à la capture visuelle ; la décision
réussite/échec provient toujours de l’oracle REST Discord.

La CI utilise la même surface de commande dans `.github/workflows/qa-live-transports-convex.yml`. Les exécutions planifiées et manuelles par défaut exécutent le profil Matrix rapide avec des identifiants frontier en direct, `--fast` et `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Le `matrix_profile=all` manuel se répartit sur les cinq fragments de profil afin que le catalogue exhaustif puisse s’exécuter en parallèle tout en conservant un répertoire d’artefacts par fragment.

Pour les voies smoke Telegram, Discord et Slack avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (conducteur + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Pour une exécution complète de VM de bureau Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine de bureau/navigateur Crabbox, exécute la voie Slack en direct
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible vers le répertoire d’artefacts Mantis. Les locations
de bureau/navigateur Crabbox fournissent d’emblée les outils de capture et les packages
d’aide pour navigateur/build natif ; le scénario ne devrait donc installer des solutions de repli que sur les
anciennes locations. Mantis rapporte les temps totaux et par phase dans
`mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes montrent si le temps a été passé dans
le préchauffage de la location, l’acquisition des identifiants, la configuration distante ou la copie des artefacts. Réutilisez
`--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ;
les locations réutilisées gardent également le cache du store pnpm de Crabbox au chaud. Le mode par défaut
`--hydrate-mode source` vérifie depuis un checkout source et exécute l’installation/le build
dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
dispose déjà de `node_modules` et d’un `dist/` construit ; ce mode ignore l’étape
coûteuse d’installation/build et échoue de manière fermée lorsque l’espace de travail n’est pas prêt.
Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant
s’exécuter dans la VM sur le port `38973` ; sans cette option, la commande exécute la voie QA Slack
bot à bot normale et se termine après la capture des artefacts.

La checklist opérateur, la commande de déclenchement du workflow GitHub, le contrat de commentaire de preuve,
la table de décision du mode d’hydratation, l’interprétation des temps et les étapes de gestion des échecs
se trouvent dans le [runbook Mantis du bureau Slack](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de style agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` loue ou réutilise une machine de bureau/navigateur Crabbox, démarre
`crabbox record --while`, pilote le navigateur visible via un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, et
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, le prompt de vision demande un verdict JSON
structuré et ne réussit que lorsque le modèle rapporte une preuve visible positive ; une
réponse négative qui se contente de citer le texte cible échoue l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve la tuyauterie du bureau,
du navigateur, de la capture d’écran et de la vidéo sans appeler un fournisseur de compréhension
d’image. L’enregistrement est un artefact requis pour `visual-task` ; si Crabbox n’enregistre
aucun `visual-task.mp4` non vide, la tâche échoue même si le pilote visuel
a réussi. En cas d’échec, Mantis conserve la location pour VNC sauf si la tâche avait déjà
réussi et que `--keep-lease` n’était pas défini.

Avant d’utiliser des identifiants en direct mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du courtier Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture du transport en direct

Les voies de transport en direct partagent un même contrat au lieu que chacune invente sa propre forme de liste de scénarios. `qa-channel` est la vaste suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture du transport en direct.

| Voie     | Canary | Filtrage des mentions | Bot à bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise au redémarrage | Suivi de thread | Isolation de thread | Observation des réactions | Commande d’aide | Enregistrement des commandes natives |
| -------- | ------ | --------------------- | --------- | -------------------------------- | ------------------------- | ---------------------- | ---------------- | ------------------- | ------------------------- | --------------- | ------------------------------------ |
| Matrix   | x      | x                     | x         | x                                | x                         | x                      | x                | x                   | x                         |                 |                                      |
| Telegram | x      | x                     | x         |                                  |                           |                        |                  |                     |                           | x               |                                      |
| Discord  | x      | x                     | x         |                                  |                           |                        |                  |                     |                           |                 | x                                    |
| Slack    | x      | x                     | x         | x                                | x                         | x                      | x                | x                   |                           |                 |                                      |

Cela garde `qa-channel` comme vaste suite de comportement produit, tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite de contrat de transport.

Pour une voie VM Linux jetable sans intégrer Docker au chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass frais, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé vers `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez obtenir des artefacts sans code de sortie d’échec.
Les exécutions en direct transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseurs basées sur l’environnement, chemin de configuration du fournisseur QA en direct et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram, Discord et Slack

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram, Discord et Slack sont plus petits - quelques scénarios chacun, pas de système de profils, contre de vrais canaux préexistants - leur référence se trouve donc ici.

### Flags CLI partagés

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes flags :

| Flag                                  | Valeur par défaut                                             | Description                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                             | Exécute uniquement ce scénario. Répétable.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où sont écrits les rapports/résumés/messages observés et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                               | Racine du dépôt lors de l’invocation depuis un cwd neutre.                                                                    |
| `--sut-account <id>`                  | `sut`                                                         | ID de compte temporaire dans la configuration Gateway QA.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                               | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                    |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                              | Références des modèles principal/alternatif.                                                                                 |
| `--fast`                              | désactivé                                                     | Mode rapide du fournisseur lorsqu’il est pris en charge.                                                                      |
| `--credential-source <env\|convex>`   | `env`                                                         | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                  |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                                | Rôle utilisé lorsque `--credential-source convex`.                                                                            |

Chaque voie se termine avec un code non nul pour tout scénario échoué. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe privé Telegram avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot à bot fonctionne le mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve les corps de messages dans les artefacts de messages observés (masqués par défaut).

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`) :

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefacts de sortie :

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - inclut le RTT par réponse (envoi par le pilote → réponse SUT observée) à partir du canary.
- `telegram-qa-observed-messages.json` - corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de serveur Discord privé avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le plugin Discord groupé. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, et les scénarios de preuve Mantis à inscription explicite.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’ID utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps de messages dans les artefacts de messages observés.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le canal vocal/stage pour `discord-voice-autojoin` ; sans cela, le scénario choisit le premier canal vocal/stage visible pour le bot SUT.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal avec activation explicite. S’exécute seul, active `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT correspond au salon vocal/de scène cible. Les identifiants Convex Discord peuvent inclure `voiceChannelId` en option ; sinon l’exécuteur découvre le premier salon vocal/de scène visible dans la guilde.
- `discord-status-reactions-tool-only` - scénario Mantis avec activation explicite. S’exécute seul, car il bascule le SUT en réponses de guilde toujours actives et uniquement par outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie des réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après conservent également les artefacts MP4 fournis par le scénario sous `baseline.mp4` et `candidate.mp4`.

Exécuter explicitement le scénario de connexion automatique vocale Discord :

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Exécuter explicitement le scénario de réactions de statut Mantis :

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefacts de sortie :

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - corps masqués sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` quand le scénario de réactions de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un vrai salon Slack privé avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le plugin Slack intégré.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optionnel :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`) :

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefacts de sortie :

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - corps masqués sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configuration de l’espace de travail Slack

La voie nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un salon dont les deux bots sont membres :

- `channelId` - l’identifiant `Cxxxxxxxxxx` d’un salon auquel les deux bots ont été invités. Utilisez un salon dédié ; la voie publie à chaque exécution.
- `driverBotToken` - jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` - jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée du pilote afin que son identifiant d’utilisateur bot soit distinct.
- `sutAppToken` - jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail de production.

Le manifeste SUT ci-dessous restreint intentionnellement l’installation de production du plugin Slack intégré (`extensions/slack/src/setup-shared.ts:10`) aux permissions et événements couverts par la suite QA Slack en direct. Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [Configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire Driver/SUT de QA est volontairement séparée parce que la voie nécessite deux identifiants d’utilisateurs bots distincts dans un même espace de travail.

**1. Créer l’application Driver**

Accédez à [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → choisissez l’espace de travail QA, collez le manifeste suivant, puis _Install to Workspace_ :

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copiez le _Bot User OAuth Token_ (`xoxb-...`) - il devient `driverBotToken`. Le pilote doit seulement publier des messages et s’identifier ; pas d’événements, pas de Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application QA utilise intentionnellement une version plus restreinte du manifeste de production du plugin Slack intégré (`extensions/slack/src/setup-shared.ts:10`) : les portées et événements de réaction sont omis parce que la suite QA Slack en direct ne couvre pas encore la gestion des réactions.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Après que Slack a créé l’application, effectuez deux actions sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des identifiants d’utilisateurs distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par identifiant d’utilisateur ; réutiliser une seule application pour les deux fera échouer immédiatement le filtrage des mentions.

**3. Créer le salon**

Dans l’espace de travail QA, créez un salon (par exemple `#openclaw-qa`) et invitez les deux bots depuis le salon :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’identifiant `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ - il devient `channelId`. Un salon public fonctionne ; si vous utilisez un salon privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront tout de même.

**4. Enregistrer les identifiants**

Deux options. Utilisez les variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou amorcez le pool Convex partagé afin que la CI et d’autres mainteneurs puissent les louer.

Pour le pool Convex, écrivez les quatre champs dans un fichier JSON :

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Avec `OPENCLAW_QA_CONVEX_SITE_URL` et `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportés dans votre shell, enregistrez et vérifiez :

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Attendez-vous à `count: 1`, `status: "active"`, sans champ `lease`.

**5. Vérifier de bout en bout**

Exécutez la voie localement pour confirmer que les deux bots peuvent communiquer entre eux via le courtier :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution verte se termine en bien moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la voie reste bloquée pendant environ 90 secondes et se termine avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit chaque ligne est louée - `qa credentials list --kind slack --status all --json` vous indiquera lequel des deux cas s’applique.

### Pool d’identifiants Convex

Les voies Telegram, Discord et Slack peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des Heartbeats pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de charge utile que le courtier valide sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` doit être une chaîne d’identifiant de discussion numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`) : `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` doit correspondre à `^[A-Z][A-Z0-9]+$` (un identifiant Slack comme `Cxxxxxxxxxx`). Consultez [Configuration de l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application et des portées.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de section est antérieur à la prise en charge de Discord ; les sémantiques du courtier sont identiques pour les deux types).

## Amorces adossées au dépôt

Les ressources d’amorce se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- des références de documentation et de code
- des exigences de plugin facultatives
- un correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface de runtime réutilisable qui prend en charge `qa-flow` est autorisée à rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport avec des helpers côté navigateur qui pilotent l’interface Control UI intégrée via la couture Gateway `browser.request`, sans ajouter d’exécuteur spécifique.

Les fichiers de scénario doivent être groupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les identifiants de scénario stables lorsque des fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de base doit rester suffisamment large pour couvrir :

- les conversations en DM et en salon
- le comportement des fils de discussion
- le cycle de vie des actions de message
- les rappels Cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture de dépôt et la lecture de documentation
- une petite tâche de build telle que Lobster Invaders

## Voies de mock de fournisseur

`qa suite` dispose de deux voies locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la voie de mock déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration de modèle Gateway, les besoins de préparation de profil d’authentification et les indicateurs de capacité live/mock. Le code de la suite partagée et du Gateway doit passer par le registre des fournisseurs au lieu de créer des branches sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une interface de transport générique pour les scénarios QA en markdown. `qa-channel` est le premier adaptateur sur cette interface, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques devraient se brancher sur le même exécuteur de suite au lieu d’ajouter un exécuteur QA propre à un transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- L’adaptateur de transport possède la configuration du Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit l’interface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown exige exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède la mécanique d’hôte partagée :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécution possèdent le contrat de transport :

- la manière dont `openclaw qa <runner>` est monté sous la racine `qa` partagée
- la manière dont le Gateway est configuré pour ce transport
- la manière dont l’état prêt est vérifié
- la manière dont les événements entrants sont injectés
- la manière dont les messages sortants sont observés
- la manière dont les transcriptions et l’état de transport normalisé sont exposés
- la manière dont les actions appuyées par le transport sont exécutées
- la manière dont la réinitialisation ou le nettoyage propre au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Conserver `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémenter l’exécuteur de transport sur l’interface d’hôte partagée `qa-lab`.
3. Garder la mécanique propre au transport dans le Plugin d’exécution ou le harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins d’exécution doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; l’exécution CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si le comportement dépend d’un seul transport de canal, gardez-le dans ce Plugin d’exécution ou ce harnais de Plugin.
- Si un scénario nécessite une nouvelle capacité utilisable par plusieurs canaux, ajoutez un assistant générique au lieu d’une branche propre à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario propre au transport et rendez cela explicite dans le contrat du scénario.

### Noms des assistants de scénario

Assistants génériques préférés pour les nouveaux scénarios :

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Les alias de compatibilité restent disponibles pour les scénarios existants - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Ces alias existent pour éviter une migration en une seule fois, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observée.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qui méritent d’être ajoutés

Pour l’inventaire des scénarios disponibles - utile pour dimensionner le travail de suivi ou câbler un nouveau transport - exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs
références de modèles en direct et rédigez un rapport Markdown jugé :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants locaux du Gateway QA, pas Docker. Les scénarios d’évaluation de caractère
doivent définir le persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme une discussion, une aide sur l’espace de travail et de petites tâches de fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque transcription complète,
enregistre les statistiques de base de l’exécution, puis demande aux modèles juges en mode fast avec un raisonnement
`xhigh` lorsqu’il est pris en charge de classer les exécutions par naturel, ambiance et humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours
chaque transcription et état d’exécution, mais les références candidates sont remplacées par des libellés neutres
comme `candidate-01` ; le rapport associe de nouveau les classements aux vraies références après
l’analyse.
Les exécutions candidates utilisent `high` thinking par défaut, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez une candidate spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent le mode fast par défaut afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’une
candidate ou un juge unique nécessite un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer l’activation du mode fast pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse de benchmark, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux une concurrence de 16 par défaut. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites fournisseur ou la pression locale sur le Gateway
rendent une exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation connexe

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

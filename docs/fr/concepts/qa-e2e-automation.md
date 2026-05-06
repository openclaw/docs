---
read_when:
    - Comprendre comment la pile QA s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Vue d’ensemble de l’assurance qualité
x-i18n:
    generated_at: "2026-05-06T07:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw de manière plus réaliste et
structurée par canal qu’un simple test unitaire ne le peut.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétiques avec surfaces de DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer le transcript,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transport en direct qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de démarrage et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup disposent d’alias de script `pnpm qa:*` ; les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                                                                                                              |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                                                                                                     |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                                                                                                                          |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                                                                                                                |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles en direct avec un rapport jugé. Voir [Rapports](#reporting).                                                                                                                                                |
| `qa manual`                                         | Exécuter un prompt ponctuel contre la voie fournisseur/modèle sélectionnée.                                                                                                                                                                                             |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                      |
| `qa docker-build-image`                             | Construire l’image Docker QA préconstruite.                                                                                                                                                                                                                             |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                                                                                                       |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                 |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                                                                                                                      |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` conscient des scénarios.                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool d’identifiants Convex partagé.                                                                                                                                                                                                                            |
| `qa matrix`                                         | Voie de transport en direct contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                                                                                                |
| `qa telegram`                                       | Voie de transport en direct contre un vrai groupe Telegram privé.                                                                                                                                                                                                       |
| `qa discord`                                        | Voie de transport en direct contre un vrai canal de guilde Discord privé.                                                                                                                                                                                               |
| `qa slack`                                          | Voie de transport en direct contre un vrai canal Slack privé.                                                                                                                                                                                                           |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bugs de transport en direct, avec preuves par réactions de statut Discord, smoke Crabbox bureau/navigateur et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis) et [Runbook Mantis Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant le transcript de type Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner une mission
QA à l’agent, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour une itération plus rapide de l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté en bind :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte en bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hash des ressources QA Lab
change.

Pour un smoke de trace OpenTelemetry local, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur de traces OTLP/HTTP local, exécute le
scénario QA `otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` sur les tours réussis ; les ID de diagnostic bruts et
les attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de suite QA.

La QA d’observabilité reste réservée aux checkouts source. La tarball npm omet intentionnellement
QA Lab, donc les voies de publication Docker de package n’exécutent pas de commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis un checkout source construit lorsque vous modifiez l’instrumentation
de diagnostic.

Pour une voie smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue de profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en bout : filtrage par mention, politiques allow-bot, listes d’autorisation, réponses de premier niveau et en fil, routage DM, gestion des réactions, suppression des modifications entrantes, déduplication du rejeu au redémarrage, récupération après interruption du homeserver, livraison des métadonnées d’approbation, gestion des médias et flux d’amorçage/récupération/vérification E2EE Matrix. Le profil CLI E2EE pilote aussi `openclaw matrix encryption setup` et les commandes de vérification via le même homeserver jetable avant de vérifier les réponses du Gateway.

Discord dispose aussi de scénarios opt-in réservés à Mantis pour la reproduction de bugs. Utilisez
`--scenario discord-status-reactions-tool-only` pour la chronologie explicite des réactions de statut,
ou `--scenario discord-thread-reply-filepath-attachment` pour créer un vrai fil Discord et vérifier que `message.thread-reply` préserve une pièce jointe
`filePath`. Ces scénarios restent hors de la voie Discord en direct par défaut
car ce sont des sondes de repro avant/après plutôt qu’une large couverture smoke.
Le workflow Mantis de pièce jointe de fil peut aussi ajouter une vidéo témoin Discord Web
connectée lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement QA.
Ce profil de visualisation sert uniquement à la capture visuelle ; la décision de réussite/échec
vient toujours de l’oracle REST Discord.

CI utilise la même surface de commande dans `.github/workflows/qa-live-transports-convex.yml`. Les exécutions planifiées et manuelles par défaut exécutent le profil Matrix rapide avec des identifiants frontier en direct, `--fast` et `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Le mode manuel `matrix_profile=all` se répartit sur les cinq shards de profil afin que le catalogue exhaustif puisse s’exécuter en parallèle tout en conservant un répertoire d’artefacts par shard.

Pour les voies smoke Telegram, Discord et Slack avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Pour une exécution complète de VM de bureau Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande réserve une machine Crabbox de bureau/navigateur, exécute la voie live Slack
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible vers le répertoire d’artefacts Mantis. Les réservations
de bureau/navigateur Crabbox fournissent d’emblée les outils de capture et les paquets d’aide
pour le navigateur/la compilation native, de sorte que le scénario ne devrait installer que des solutions de repli sur les
anciennes réservations. Mantis indique les durées totales et par phase dans
`mantis-slack-desktop-smoke-report.md`, afin que les exécutions lentes montrent si le temps a été consacré au
préchauffage de la réservation, à l’acquisition des identifiants, à la configuration distante ou à la copie des artefacts. Réutilisez
`--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ;
les réservations réutilisées gardent également le cache du store pnpm de Crabbox au chaud. Le mode par défaut
`--hydrate-mode source` vérifie depuis un checkout source et exécute l’installation/la compilation
dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
contient déjà `node_modules` et un `dist/` compilé ; ce mode ignore l’étape
coûteuse d’installation/de compilation et échoue de manière fermée lorsque l’espace de travail n’est pas prêt.
Avec `--gateway-setup`, Mantis laisse un Gateway OpenClaw Slack persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute la voie QA Slack
bot-à-bot normale et se termine après la capture des artefacts.

La checklist opérateur, la commande de déclenchement du workflow GitHub, le contrat de commentaire de preuves,
le tableau de décision du mode d’hydratation, l’interprétation des durées et les étapes de gestion des échecs
se trouvent dans [Runbook de bureau Slack Mantis](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de style agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` réserve ou réutilise une machine Crabbox de bureau/navigateur, démarre
`crabbox record --while`, pilote le navigateur visible via un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, et
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, le prompt de vision demande un verdict JSON
structuré et ne réussit que lorsque le modèle signale une preuve visible positive ; une
réponse négative qui se contente de citer le texte cible fait échouer l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve le bureau,
le navigateur, la capture d’écran et la plomberie vidéo sans appeler un fournisseur de compréhension d’images.
L’enregistrement est un artefact requis pour `visual-task` ; si Crabbox n’enregistre
aucun `visual-task.mp4` non vide, la tâche échoue même lorsque le pilote visuel
a réussi. En cas d’échec, Mantis conserve la réservation pour VNC, sauf si la tâche avait déjà
réussi et que `--keep-lease` n’était pas défini.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports live

Les voies de transport live partagent un seul contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la grande suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture des transports live.

| Voie     | Canari | Filtrage par mention | Bot-à-bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de thread | Isolation de thread | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | --------- | -------------------------------- | ------------------------- | ------------------------- | ---------------- | -------------------- | ------------------------- | ---------------- | --------------------------------- |
| Matrix   | x      | x                    | x         | x                                | x                         | x                         | x                | x                    | x                         |                  |                                   |
| Telegram | x      | x                    | x         |                                  |                           |                           |                  |                      |                           | x                |                                   |
| Discord  | x      | x                    | x         |                                  |                           |                           |                  |                      |                           |                  | x                                 |
| Slack    | x      | x                    | x         | x                                | x                         | x                         | x                | x                    |                           |                  |                                   |

Cela garde `qa-channel` comme grande suite de comportement produit, tandis que Matrix,
Telegram et les futurs transports live partagent une checklist explicite de contrat de transport.

Pour une voie de VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cette commande démarre un invité Multipass neuf, installe les dépendances, compile OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Elle réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution sérielle.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie d’échec.
Les exécutions live transfèrent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram, Discord et Slack

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram, Discord et Slack sont plus petits - quelques scénarios chacun, sans système de profils, contre des canaux réels préexistants - leur référence se trouve donc ici.

### Flags CLI partagés

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes flags :

| Flag                                  | Défaut                                                          | Description                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Exécuter uniquement ce scénario. Répétable.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement d’écriture des rapports/résumés/messages observés et du journal de sortie. Les chemins relatifs se résolvent par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Racine du dépôt lors de l’appel depuis un cwd neutre.                                                                           |
| `--sut-account <id>`                  | `sut`                                                           | ID de compte temporaire dans la configuration du Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                      |
| `--model <ref>` / `--alt-model <ref>` | défaut du fournisseur                                           | Réfs de modèle principal/alternatif.                                                                                            |
| `--fast`                              | désactivé                                                       | Mode rapide du fournisseur lorsque pris en charge.                                                                              |
| `--credential-source <env\|convex>`   | `env`                                                           | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                                  | Rôle utilisé avec `--credential-source convex`.                                                                                 |

Chaque voie se termine avec un code non nul en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne le mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optionnel :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés (par défaut, ils sont caviardés).

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
- `telegram-qa-summary.json` - inclut le RTT par réponse (envoi du pilote → réponse SUT observée) à partir du canari.
- `telegram-qa-observed-messages.json` - corps caviardés sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de guilde Discord privé réel avec deux bots : un bot pilote contrôlé par le harness et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord fourni. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios de preuves Mantis activés explicitement.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’ID utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Optionnel :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - scénario Mantis activé explicitement. S’exécute seul, car il bascule le SUT vers des réponses de guilde toujours actives, uniquement via outils, avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après conservent également les artefacts MP4 fournis par le scénario sous `baseline.mp4` et `candidate.mp4`.

Exécutez explicitement le scénario Mantis de réactions de statut :

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
- `discord-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réactions de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un vrai canal Slack privé avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT lancé par le Gateway OpenClaw enfant via le Plugin Slack groupé.

Env requise avec `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps de messages dans les artefacts de messages observés.

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
- `slack-qa-observed-messages.json` - corps expurgés sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configuration de l’espace de travail Slack

La voie nécessite deux applications Slack distinctes dans un espace de travail, ainsi qu’un canal dont les deux bots sont membres :

- `channelId` - l’id `Cxxxxxxxxxx` d’un canal auquel les deux bots ont été invités. Utilisez un canal dédié ; la voie publie à chaque exécution.
- `driverBotToken` - jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` - jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée du pilote afin que son id d’utilisateur bot soit distinct.
- `sutAppToken` - jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode afin que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail de production.

Le manifeste SUT ci-dessous restreint intentionnellement l’installation de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) aux autorisations et événements couverts par la suite QA Slack en direct. Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire Driver/SUT de QA est intentionnellement séparée, car la voie a besoin de deux ids d’utilisateurs bot distincts dans un même espace de travail.

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

Copiez le _Bot User OAuth Token_ (`xoxb-...`) - il devient `driverBotToken`. Le pilote a seulement besoin de publier des messages et de s’identifier ; aucun événement, aucun Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application QA utilise intentionnellement une version plus restreinte du manifeste de production du Plugin Slack groupé (`extensions/slack/src/setup-shared.ts:10`) : les portées et événements de réaction sont omis, car la suite QA Slack en direct ne couvre pas encore la gestion des réactions.

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

Après la création de l’application par Slack, faites deux choses sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des ids d’utilisateur distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par id d’utilisateur ; réutiliser une seule application pour les deux fera échouer immédiatement le filtrage des mentions.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis l’intérieur du canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’id `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ - il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront quand même.

**4. Enregistrer les identifiants**

Deux options. Utilisez des variables d’env pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que la CI et les autres mainteneurs puissent les louer.

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

Exécutez la voie localement pour confirmer que les deux bots peuvent communiquer entre eux via le broker :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution verte se termine en bien moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si la voie se bloque pendant environ 90 secondes et quitte avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit toutes les lignes sont louées - `qa credentials list --kind slack --status all --json` vous indiquera lequel.

### Pool d’identifiants Convex

Les voies Telegram, Discord et Slack peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’env ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie son Heartbeat pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de charge utile validées par le broker sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` doit être une chaîne d’id de discussion numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`) : `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` doit correspondre à `^[A-Z][A-Z0-9]+$` (un id Slack comme `Cxxxxxxxxxx`). Consultez [Configuration de l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application et des portées.

Les variables d’env opérationnelles et le contrat d’endpoint du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de section est antérieur à la prise en charge de Discord ; la sémantique du broker est identique pour les deux types).

## Seeds adossés au dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est la source de vérité d’une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, capacité, voie et risque
- les références de documentation et de code
- les exigences facultatives de Plugin
- le patch facultatif de configuration du Gateway
- le `qa-flow` exécutable

La surface runtime réutilisable qui prend en charge `qa-flow` peut rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des assistants côté transport avec des assistants côté navigateur qui pilotent le Control UI intégré via le raccord `browser.request` du Gateway sans ajouter d’exécuteur spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les ids de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les discussions en DM et en canal
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks Cron
- le rappel de mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build telle que Lobster Invaders

## Voies de mocks de fournisseurs

`qa suite` dispose de deux voies locales de mocks de fournisseurs :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la voie de mock déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le dispatcher de scénarios `mock-openai`.

L’implémentation des voies de fournisseurs se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration de modèle du Gateway, les besoins de préparation de profil d’authentification et les indicateurs de capacités live/mock. Le code partagé de la suite et du Gateway doit passer par le registre des fournisseurs plutôt que de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un raccord de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur ce raccord, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- L’adaptateur de transport possède la configuration du Gateway, la disponibilité, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface runtime réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte `qa-lab` partagé peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de la commande `openclaw qa`
- le démarrage et le teardown de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération des rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins de runner possèdent le contrat de transport :

- la façon dont `openclaw qa <runner>` est monté sous la racine partagée `qa`
- la façon dont le gateway est configuré pour ce transport
- la façon dont l’état prêt est vérifié
- la façon dont les événements entrants sont injectés
- la façon dont les messages sortants sont observés
- la façon dont les transcriptions et l’état de transport normalisé sont exposés
- la façon dont les actions adossées au transport sont exécutées
- la façon dont la réinitialisation ou le nettoyage propres au transport sont gérés

Le seuil minimal d’adoption pour un nouveau canal :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter le runner de transport sur la seam hôte partagée de `qa-lab`.
3. Garder les mécaniques propres au transport dans le plugin de runner ou le harnais du canal.
4. Monter le runner sous la forme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les plugins de runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Garder `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown dans les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Maintenir le fonctionnement des alias de compatibilité existants, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce plugin de runner ou ce harnais de plugin.
- Si un scénario a besoin d’une nouvelle capacité utilisable par plusieurs canaux, ajoutez un helper générique au lieu d’une branche propre au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario propre au transport et rendez cela explicite dans le contrat du scénario.

### Noms des helpers de scénario

Helpers génériques recommandés pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration en une seule fois, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown depuis la chronologie du bus observé.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles - utile pour dimensionner le travail de suivi ou raccorder un nouveau transport - exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs refs de modèles live et écrivez un rapport Markdown jugé :

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

La commande lance des processus enfants de gateway QA locaux, pas Docker. Les scénarios d’évaluation de caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires comme le chat, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat ne doit pas être informé qu’il est évalué. La commande conserve chaque transcription complète, enregistre les statistiques de base de l’exécution, puis demande aux modèles juges en mode rapide avec un raisonnement `xhigh` lorsque cela est pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours chaque transcription et chaque état d’exécution, mais les refs candidates sont remplacées par des libellés neutres comme `candidate-01` ; le rapport remappe les classements vers les refs réelles après l’analyse.
Les exécutions candidates utilisent par défaut une réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh` pour les anciennes refs d’évaluation OpenAI qui la prennent en charge. Remplacez un candidat précis en ligne avec `--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un fallback global, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour compatibilité.
Les refs candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un seul candidat ou juge a besoin d’un remplacement. Passez `--fast` uniquement lorsque vous voulez forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur le gateway local rendent une exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documents associés

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

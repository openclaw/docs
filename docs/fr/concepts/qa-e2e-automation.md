---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile d’assurance qualité : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’assurance qualité
x-i18n:
    generated_at: "2026-05-11T20:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée est destinée à exercer OpenClaw d’une manière plus réaliste,
modelée par les canaux, qu’un seul test unitaire ne le permet.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM,
  canal, fil, réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la
  transcription, injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs Plugins d’exécution : adaptateurs de transport
  en direct qui pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources initiales adossées au dépôt pour la tâche de démarrage et
  les scénarios QA de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant et après pour les
  bogues qui nécessitent de vrais transports, des captures d’écran de
  navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des
alias de scripts `pnpm qa:*` ; les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                                                                                                              |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt sur la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                                                                                                       |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie exploitable par machine).                                                                                                                                                         |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                                                                                                                |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles en direct avec un rapport jugé. Voir [Rapports](#reporting).                                                                                                                                               |
| `qa manual`                                         | Exécuter une invite ponctuelle sur la voie du fournisseur/modèle sélectionné.                                                                                                                                                                                           |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                                                                                      |
| `qa docker-build-image`                             | Construire l’image Docker QA préassemblée.                                                                                                                                                                                                                              |
| `qa docker-scaffold`                                | Écrire une structure docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                                                                                                       |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                               |
| `qa aimock`                                         | Démarrer uniquement le serveur du fournisseur AIMock.                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Démarrer uniquement le serveur du fournisseur `mock-openai` conscient des scénarios.                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                                                                                            |
| `qa matrix`                                         | Voie de transport en direct avec un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                                                                                                                 |
| `qa telegram`                                       | Voie de transport en direct avec un vrai groupe Telegram privé.                                                                                                                                                                                                         |
| `qa discord`                                        | Voie de transport en direct avec un vrai canal de guilde Discord privé.                                                                                                                                                                                                 |
| `qa slack`                                          | Voie de transport en direct avec un vrai canal Slack privé.                                                                                                                                                                                                             |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bogues de transport en direct, avec preuves de réactions de statut Discord, smoke test de bureau/navigateur Crabbox et smoke test Slack dans VNC. Voir [Mantis](/fr/concepts/mantis) et [Runbook Mantis Slack Desktop](/fr/concepts/mantis-slack-desktop-runbook). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- À gauche : tableau de bord Gateway (interface de contrôle) avec l’agent.
- À droite : QA Lab, affichant la transcription façon Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner une
mission QA à l’agent, observer le comportement réel du canal et consigner ce qui
a fonctionné, échoué ou est resté bloqué.

Pour itérer plus rapidement sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et
monte par liaison `extensions/qa-lab/web/dist` dans le conteneur `qa-lab`.
`qa:lab:watch` reconstruit ce bundle à chaque changement, et le navigateur se
recharge automatiquement lorsque le hachage des ressources QA Lab change.

Pour un smoke test local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le scénario QA
`otel-trace-smoke` avec le Plugin `diagnostics-otel` activé, puis décode les
spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors de tours
réussis ; les identifiants de diagnostic bruts et les attributs
`openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste limitée à l’extraction source. Le tarball npm omet
intentionnellement QA Lab, donc les voies de publication Docker de paquet
n’exécutent pas les commandes `qa`. Utilisez `pnpm qa:otel:smoke` depuis une
extraction source construite lorsque vous modifiez l’instrumentation de
diagnostic.

Pour une voie de smoke test Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue de profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires pilote/SUT/observateur, exécute le vrai Plugin Matrix dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Les scénarios couvrent des comportements de transport que les tests unitaires ne peuvent pas prouver de bout en bout : filtrage des mentions, politiques d’autorisation des bots, listes d’autorisation, réponses de premier niveau et en fil, routage des DM, gestion des réactions, suppression des modifications entrantes, déduplication de rejeu au redémarrage, récupération après interruption du homeserver, livraison des métadonnées d’approbation, gestion des médias et flux d’amorçage/récupération/vérification E2EE Matrix. Le profil CLI E2EE pilote également `openclaw matrix encryption setup` et les commandes de vérification via le même homeserver jetable avant de vérifier les réponses du Gateway.

Discord dispose également de scénarios Mantis optionnels uniquement pour la reproduction de bogues. Utilisez
`--scenario discord-status-reactions-tool-only` pour la chronologie explicite des réactions de statut,
ou `--scenario discord-thread-reply-filepath-attachment` pour créer un vrai fil
Discord et vérifier que `message.thread-reply` préserve une pièce jointe
`filePath`. Ces scénarios restent hors de la voie Discord en direct par défaut
car ce sont des sondes de reproduction avant/après plutôt qu’une large couverture de smoke test.
Le workflow Mantis de pièce jointe de fil peut aussi ajouter une vidéo témoin
Discord Web connecté lorsque `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` est configuré dans l’environnement
QA. Ce profil de visualisation sert uniquement à la capture visuelle ; la décision
réussite/échec provient toujours de l’oracle REST Discord.

La CI utilise la même surface de commande dans `.github/workflows/qa-live-transports-convex.yml`. Les exécutions planifiées et manuelles par défaut lancent le profil Matrix rapide avec des identifiants frontier en direct, `--fast` et `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Le mode manuel `matrix_profile=all` se déploie en éventail dans les cinq fragments de profils afin que le catalogue exhaustif puisse s’exécuter en parallèle tout en conservant un répertoire d’artefacts par fragment.

Pour les voies de smoke test Telegram, Discord et Slack avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (pilote + SUT). Les variables d’environnement requises, listes de scénarios, artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Pour une exécution complète de VM de bureau Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine Crabbox de bureau/navigateur, exécute la voie Slack en direct
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/`, `slack-desktop-smoke.png` et `slack-desktop-smoke.mp4`
lorsque la capture vidéo est disponible vers le répertoire d’artefacts Mantis. Les locations
Crabbox de bureau/navigateur fournissent d’emblée les outils de capture et les paquets
d’aide pour navigateur/build natif ; le scénario ne devrait donc installer des solutions
de repli que sur les locations plus anciennes. Mantis signale les durées totales et par phase dans
`mantis-slack-desktop-smoke-report.md` afin que les exécutions lentes indiquent si le temps a été consacré
au préchauffage de la location, à l’acquisition des identifiants, à la configuration distante ou à la copie des artefacts. Réutilisez
`--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web via VNC ;
les locations réutilisées gardent aussi le cache du store pnpm de Crabbox chaud. Le mode par défaut
`--hydrate-mode source` vérifie à partir d’un checkout source et exécute install/build
dans la VM. Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
possède déjà `node_modules` et un `dist/` construit ; ce mode saute l’étape
coûteuse install/build et échoue de façon fermée lorsque l’espace de travail n’est pas prêt.
Avec `--gateway-setup`, Mantis laisse un Gateway OpenClaw Slack persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute la voie QA Slack
bot-à-bot normale et se termine après la capture des artefacts.

La checklist opérateur, la commande de dispatch du workflow GitHub, le contrat de commentaire de preuve,
le tableau de décision du mode d’hydratation, l’interprétation des durées et les étapes
de gestion des échecs se trouvent dans [Runbook du bureau Slack Mantis](/fr/concepts/mantis-slack-desktop-runbook).

Pour une tâche de bureau de type agent/CV, exécutez :

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` loue ou réutilise une machine Crabbox de bureau/navigateur, démarre
`crabbox record --while`, pilote le navigateur visible via un
`visual-driver` imbriqué, capture `visual-task.png`, exécute `openclaw infer image describe`
sur la capture d’écran lorsque `--vision-mode image-describe` est sélectionné, et
écrit `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` et `mantis-visual-task-report.md`.
Lorsque `--expect-text` est défini, le prompt de vision demande un verdict JSON
structuré et ne réussit que lorsque le modèle signale une preuve visible positive ; une
réponse négative qui se contente de citer le texte cible échoue à l’assertion.
Utilisez `--vision-mode metadata` pour un smoke sans modèle qui prouve la tuyauterie du bureau,
du navigateur, de la capture d’écran et de la vidéo sans appeler de fournisseur de compréhension d’image.
L’enregistrement est un artefact requis pour `visual-task` ; si Crabbox n’enregistre
aucun `visual-task.mp4` non vide, la tâche échoue même si le pilote visuel
a réussi. En cas d’échec, Mantis conserve la location pour VNC sauf si la tâche avait déjà
réussi et que `--keep-lease` n’était pas défini.

Avant d’utiliser des identifiants en direct mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres de point de terminaison et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports en direct

Les voies de transport en direct partagent un seul contrat au lieu que chacune invente sa propre forme de liste de scénarios. `qa-channel` est la grande suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture des transports en direct.

| Voie     | Canary | Filtrage des mentions | Bot-à-bot | Blocage de liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation des fils | Observation des réactions | Commande d’aide | Enregistrement des commandes natives |
| -------- | ------ | --------------------- | ---------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ------------------- | -------------------------- | --------------- | ------------------------------------- |
| Matrix   | x      | x                     | x          | x                                | x                         | x                         | x            | x                   | x                          |                 |                                       |
| Telegram | x      | x                     | x          |                                  |                           |                           |              |                     |                            | x               |                                       |
| Discord  | x      | x                     | x          |                                  |                           |                           |              |                     |                            |                 | x                                     |
| Slack    | x      | x                     | x          | x                                | x                         | x                         | x            | x                   |                            |                 |                                       |

Cela conserve `qa-channel` comme grande suite de comportement produit tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite de contrat de transport.

Pour une voie de VM Linux jetable sans intégrer Docker au chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA et le
résumé habituels dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution série.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie d’échec.
Les exécutions en direct transmettent les entrées d’authentification QA prises en charge et pratiques pour
l’invité : clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA en direct et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram, Discord et Slack

Matrix possède une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et de son provisionnement de homeserver adossé à Docker. Telegram, Discord et Slack sont plus petits - quelques scénarios chacun, pas de système de profils, contre des canaux réels préexistants - leur référence se trouve donc ici.

### Indicateurs CLI partagés

Ces voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes indicateurs :

| Indicateur                           | Par défaut                                                     | Description                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                              | Exécuter uniquement ce scénario. Répétable.                                                                           |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où les rapports/résumés/messages observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                                | Racine du dépôt lors de l’invocation depuis un cwd neutre.                                                            |
| `--sut-account <id>`                 | `sut`                                                          | Identifiant de compte temporaire dans la configuration du Gateway QA.                                                 |
| `--provider-mode <mode>`             | `live-frontier`                                                | `mock-openai` ou `live-frontier` (l’ancien `live-openai` fonctionne toujours).                                        |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                              | Références de modèle primaire/alternatif.                                                                             |
| `--fast`                             | désactivé                                                      | Mode rapide du fournisseur lorsque pris en charge.                                                                    |
| `--credential-source <env\|convex>`  | `env`                                                          | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>` | `ci` en CI, `maintainer` sinon                                 | Rôle utilisé lorsque `--credential-source convex`.                                                                    |

Chaque voie se termine avec un code non nul pour tout scénario échoué. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un groupe Telegram privé réel avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont activé **Bot-to-Bot Communication Mode** dans `@BotFather`.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - identifiant numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés (rédigés par défaut).

Scénarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`) :

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

L’ensemble implicite par défaut couvre toujours le canary, le filtrage des mentions, les réponses de commandes natives, l’adressage de commandes et les réponses de groupe bot-à-bot. Les valeurs par défaut `mock-openai` incluent aussi des vérifications déterministes de chaîne de réponses et de streaming du message final. `telegram-current-session-status-tool` reste opt-in parce qu’il n’est stable que lorsqu’il est enfilé directement après le canary, pas après des réponses arbitraires de commandes natives. Utilisez `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` pour afficher la répartition actuelle par défaut/facultative avec les références de régression.

Artefacts de sortie :

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - inclut le RTT par réponse (envoi du pilote → réponse SUT observée) à partir du canary.
- `telegram-qa-observed-messages.json` - corps rédigés sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un canal de guilde Discord privé réel avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord inclus. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, et les scénarios de preuve Mantis opt-in.

Environnement requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - doit correspondre à l’id utilisateur du bot SUT renvoyé par Discord (sinon le couloir échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` sélectionne le canal vocal/de scène pour `discord-voice-autojoin` ; sans cela, le scénario choisit le premier canal vocal/de scène visible pour le bot SUT.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scénario vocal opt-in. S’exécute seul, active `channels.discord.voice.autoJoin` et vérifie que l’état vocal Discord actuel du bot SUT est le canal vocal/de scène cible. Les identifiants Discord Convex peuvent inclure un `voiceChannelId` facultatif ; sinon le lanceur découvre le premier canal vocal/de scène visible dans le serveur.
- `discord-status-reactions-tool-only` - scénario Mantis opt-in. S’exécute seul parce qu’il bascule le SUT en réponses de serveur toujours actives et uniquement via outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie des réactions REST ainsi que des artefacts visuels HTML/PNG. Les rapports Mantis avant/après conservent aussi les artefacts MP4 fournis par le scénario sous `baseline.mp4` et `candidate.mp4`.

Exécuter explicitement le scénario d’auto-jonction vocale Discord :

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
- `discord-qa-observed-messages.json` - corps masqués sauf avec `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réaction de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un vrai canal Slack privé avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack intégré.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

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
- `slack-qa-observed-messages.json` - corps masqués sauf avec `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurer l’espace de travail Slack

Le couloir nécessite deux applications Slack distinctes dans un même espace de travail, ainsi qu’un canal dont les deux bots sont membres :

- `channelId` - l’id `Cxxxxxxxxxx` d’un canal où les deux bots ont été invités. Utilisez un canal dédié ; le couloir y publie à chaque exécution.
- `driverBotToken` - jeton de bot (`xoxb-...`) de l’application **Driver**.
- `sutBotToken` - jeton de bot (`xoxb-...`) de l’application **SUT**, qui doit être une application Slack séparée du pilote afin que son id utilisateur de bot soit distinct.
- `sutAppToken` - jeton de niveau application (`xapp-...`) de l’application SUT avec `connections:write`, utilisé par Socket Mode pour que l’application SUT puisse recevoir des événements.

Préférez un espace de travail Slack dédié à la QA plutôt que de réutiliser un espace de travail de production.

Le manifeste SUT ci-dessous restreint intentionnellement l’installation de production du Plugin Slack intégré (`extensions/slack/src/setup-shared.ts:10`) aux autorisations et événements couverts par la suite QA Slack live. Pour la configuration du canal de production telle que les utilisateurs la voient, consultez [configuration rapide du canal Slack](/fr/channels/slack#quick-setup) ; la paire Driver/SUT de QA est intentionnellement séparée parce que le couloir nécessite deux ids utilisateur de bot distincts dans un même espace de travail.

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

Copiez le _Bot User OAuth Token_ (`xoxb-...`) - il devient `driverBotToken`. Le pilote doit seulement publier des messages et s’identifier ; aucun événement, aucun Socket Mode.

**2. Créer l’application SUT**

Répétez _Create New App → From a manifest_ dans le même espace de travail. Cette application QA utilise intentionnellement une version plus restreinte du manifeste de production du Plugin Slack intégré (`extensions/slack/src/setup-shared.ts:10`) : les portées et événements de réaction sont omis parce que la suite QA Slack live ne couvre pas encore la gestion des réactions.

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

Après la création de l’application par Slack, effectuez deux actions sur sa page de paramètres :

- _Install to Workspace_ → copiez le _Bot User OAuth Token_ → il devient `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → ajoutez la portée `connections:write` → enregistrez → copiez la valeur `xapp-...` → elle devient `sutAppToken`.

Vérifiez que les deux bots ont des ids utilisateur distincts en appelant `auth.test` sur chaque jeton. Le runtime distingue le pilote et le SUT par id utilisateur ; réutiliser une application pour les deux fera échouer immédiatement `mention-gating`.

**3. Créer le canal**

Dans l’espace de travail QA, créez un canal (par exemple `#openclaw-qa`) et invitez les deux bots depuis l’intérieur du canal :

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiez l’id `Cxxxxxxxxxx` depuis _channel info → About → Channel ID_ - il devient `channelId`. Un canal public fonctionne ; si vous utilisez un canal privé, les deux applications disposent déjà de `groups:history`, donc les lectures d’historique du harnais réussiront quand même.

**4. Enregistrer les identifiants**

Deux options. Utilisez les variables d’environnement pour le débogage sur une seule machine (définissez les quatre variables `OPENCLAW_QA_SLACK_*` et passez `--credential-source env`), ou alimentez le pool Convex partagé afin que la CI et les autres mainteneurs puissent les louer.

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

Exécutez le couloir localement pour confirmer que les deux bots peuvent communiquer entre eux via le broker :

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Une exécution verte se termine en nettement moins de 30 secondes et `slack-qa-report.md` affiche `slack-canary` et `slack-mention-gating` avec le statut `pass`. Si le couloir se bloque pendant environ 90 secondes et se termine avec `Convex credential pool exhausted for kind "slack"`, soit le pool est vide, soit toutes les lignes sont louées - `qa credentials list --kind slack --status all --json` vous indiquera lequel.

### Pool d’identifiants Convex

Les couloirs Telegram, Discord, Slack et WhatsApp peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert une location exclusive, envoie des Heartbeats pendant toute la durée de l’exécution et la libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"`, `"slack"` et `"whatsapp"`.

Formes de charge utile validées par le broker sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` doit être une chaîne d’id de discussion numérique.
- Utilisateur réel Telegram (`kind: "telegram-user"`) : `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - une location exclusive de compte jetable utilisée à la fois par le pilote CLI TDLib et par le témoin visuel Telegram Desktop.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`) : `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - les numéros de téléphone doivent être des chaînes E.164 distinctes.

Pour une preuve visuelle Telegram avec utilisateur réel, préférez une session Crabbox conservée :

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` conserve une location Convex `telegram-user` exclusive pour le pilote CLI
TDLib et le témoin Telegram Desktop, démarre l’enregistrement du bureau et laisse
Crabbox actif pour des étapes de reproduction arbitraires pilotées par l’agent. Les agents peuvent utiliser `send`,
`run`, `screenshot` et `status` jusqu’à être satisfaits, puis `finish`
collecte la capture d’écran, la vidéo, la vidéo/GIF découpée par mouvement, les sorties de sonde TDLib
et les journaux avant de libérer l’identifiant. `publish --session <file> --pr
<number>` commente uniquement le GIF de mouvement par défaut ; `--full-artifacts` est
l’opt-in explicite pour les journaux et la sortie JSON. La commande `probe` par défaut reste un
raccourci en une seule commande pour les vérifications rapides `/status`.

Utilisez `--mock-response-file <path>` lorsqu’une PR nécessite un diff visuel déterministe :
la même réponse de modèle simulée peut être exécutée sur `main` et sur la tête de la PR pendant que le
formateur Telegram ou la couche de livraison change. Les valeurs de capture par défaut sont ajustées pour les commentaires de PR : classe Crabbox standard, enregistrement de bureau à 24 i/s, GIF de mouvement à 24 i/s et largeur d’aperçu de 1920 px. Les commentaires avant/après doivent publier un bundle propre qui ne contient que les GIF prévus.

Les voies Slack peuvent aussi utiliser le pool. Les vérifications de forme de charge utile Slack se trouvent actuellement dans l’exécuteur QA Slack plutôt que dans le broker ; utilisez `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, avec un identifiant de canal Slack comme `Cxxxxxxxxxx`. Consultez [Configurer l’espace de travail Slack](#setting-up-the-slack-workspace) pour le provisionnement de l’application et des portées.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur au pool multicanal ; la sémantique de bail est partagée entre les types).

## Seeds adossés au dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- les références de documentation et de code
- les exigences facultatives de Plugin
- le correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des
helpers côté transport avec des helpers côté navigateur qui pilotent l’interface de contrôle intégrée via la
jonction Gateway `browser.request`, sans ajouter d’exécuteur spécial.

Les fichiers de scénario doivent être groupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les identifiants de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les discussions en DM et dans les canaux
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture de dépôt et de documentation
- une petite tâche de build comme Lobster Invaders

## Voies de mocks de fournisseurs

`qa suite` dispose de deux voies locales de mocks de fournisseurs :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la voie de mock déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour la couverture expérimentale de protocole, fixtures, enregistrement/relecture et chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseurs se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration de modèle Gateway,
les besoins de préparation de profil d’authentification, ainsi que les indicateurs de capacités live/mock. Le code partagé de suite et de Gateway doit passer par le registre des fournisseurs au lieu de créer des branches sur
les noms des fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jonction de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur cette jonction, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite au lieu d’ajouter un exécuteur QA propre à un transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration Gateway, l’état de préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécaniques d’hôte partagées :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécuteur possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment la Gateway est configurée pour ce transport
- comment l’état de préparation est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage propres au transport sont gérés

Le seuil minimal d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur la jonction d’hôte partagée `qa-lab`.
3. Garder les mécaniques propres au transport dans le Plugin d’exécuteur ou le harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si le comportement dépend d’un transport de canal, gardez-le dans ce Plugin d’exécuteur ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un helper générique au lieu d’une branche propre à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un transport, gardez le scénario propre au transport et rendez cela explicite dans le contrat du scénario.

### Noms des helpers de scénario

Helpers génériques préférés pour les nouveaux scénarios :

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

Les alias de compatibilité restent disponibles pour les scénarios existants - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration à date fixe, pas comme modèle à suivre.

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observé.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles - utile pour dimensionner le travail de suivi ou raccorder un nouveau transport - exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèles live
et écrivez un rapport Markdown jugé :

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

La commande exécute des processus enfants locaux de Gateway QA, pas Docker. Les scénarios character eval
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme la discussion, l’aide sur l’espace de travail et de petites tâches de fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque
transcription complète, enregistre les statistiques d’exécution de base, puis demande aux modèles juges en mode fast avec un raisonnement
`xhigh` lorsque pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours
chaque transcription et statut d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres comme `candidate-01` ; le rapport remappe les classements vers les références réelles après
l’analyse.
Les exécutions candidates utilisent par défaut le raisonnement `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour la compatibilité.
Les références candidates OpenAI utilisent par défaut le mode fast afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique a besoin d’un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer le mode fast pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse de benchmark, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions de modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites de fournisseur ou la pression locale sur la Gateway
rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, character eval utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

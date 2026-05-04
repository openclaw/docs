---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Créer une automatisation de l’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Présentation de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’assurance qualité
x-i18n:
    generated_at: "2026-05-04T07:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw d’une manière plus réaliste,
façonnée par les canaux, que ne le peut un seul test unitaire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, canal, thread,
  réaction, modification et suppression.
- `extensions/qa-lab` : UI de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins de runner : adaptateurs de transport en direct qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de lancement et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification en direct avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                                   |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                                        |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                                              |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                                    |
| `qa character-eval`                                 | Exécuter le scénario QA de caractère sur plusieurs modèles en direct avec un rapport évalué. Voir [Rapports](#reporting).                                                                    |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                                                |
| `qa ui`                                             | Démarrer l’UI de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                                                   |
| `qa docker-build-image`                             | Construire l’image Docker QA précuite.                                                                                                                                                       |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                                           |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).       |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                                           |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` sensible aux scénarios.                                                                                                             |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                                                 |
| `qa matrix`                                         | Voie de transport en direct contre un homeserver Tuwunel jetable. Voir [Matrix QA](/fr/concepts/qa-matrix).                                                                                     |
| `qa telegram`                                       | Voie de transport en direct contre un vrai groupe Telegram privé.                                                                                                                            |
| `qa discord`                                        | Voie de transport en direct contre un vrai canal de guilde Discord privé.                                                                                                                    |
| `qa slack`                                          | Voie de transport en direct contre un vrai canal Slack privé.                                                                                                                                |
| `qa mantis`                                         | Runner de vérification avant et après pour les bugs de transport en direct, avec preuves de réactions de statut Discord, smoke desktop/navigateur Crabbox et smoke Slack-dans-VNC. Voir [Mantis](/fr/concepts/mantis). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux panneaux :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription façon Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le vrai comportement du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus rapidement sur l’UI QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un paquet QA Lab monté en bind :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte en bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce paquet à chaque changement, et le navigateur se recharge automatiquement lorsque le hash des ressources QA Lab
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
les appels de modèle ne doivent pas exporter `StreamAbandoned` sur les tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste réservée au checkout source. Le tarball npm omet volontairement
QA Lab, donc les voies de release Docker du package n’exécutent pas de commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis un checkout source construit lors de modifications de l’instrumentation
de diagnostic.

Pour une voie smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue de profils/scénarios, les variables d’environnement et l’agencement des artefacts de cette voie se trouvent dans [Matrix QA](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai Plugin Matrix dans un Gateway QA enfant limité à ce transport (pas de `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies smoke à transport réel Telegram, Discord et Slack :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, listes de scénarios, artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Pour une exécution complète de VM desktop Slack avec secours VNC, exécutez :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Cette commande loue une machine desktop/navigateur Crabbox, exécute la voie live Slack
dans la VM, ouvre Slack Web dans le navigateur VNC, capture le bureau et
copie `slack-qa/` ainsi que `slack-desktop-smoke.png` dans le répertoire d’artefacts
Mantis. Réutilisez `--lease-id <cbx_...>` après vous être connecté manuellement à Slack Web
via VNC. Avec `--gateway-setup`, Mantis laisse un Gateway Slack OpenClaw persistant
en cours d’exécution dans la VM sur le port `38973` ; sans cette option, la commande exécute la
voie QA Slack bot-à-bot normale et quitte après la capture des artefacts.

Avant d’utiliser les identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports en direct

Les voies de transport en direct partagent un seul contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la large suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture des transports en direct.

| Voie     | Canary | Filtrage des mentions | Bot-à-bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de thread | Isolation de thread | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | --------------------- | ---------- | -------------------------------- | ------------------------- | ------------------------- | ---------------- | ------------------- | -------------------------- | --------------- | --------------------------------- |
| Matrix   | x      | x                     | x          | x                                | x                         | x                         | x                | x                   | x                          |                 |                                   |
| Telegram | x      | x                     | x          |                                  |                           |                           |                  |                     |                            | x               |                                   |
| Discord  | x      | x                     | x          |                                  |                           |                           |                  |                     |                            |                 | x                                 |
| Slack    | x      | x                     | x          |                                  |                           |                           |                  |                     |                            |                 |                                   |

Cela conserve `qa-channel` comme large suite de comportement produit tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite de contrat de transport.

Pour une voie VM Linux jetable sans intégrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suites hôte et Multipass exécutent plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés par défaut. `qa-channel` utilise par défaut une concurrence
de 4, limitée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez obtenir des artefacts sans code de sortie d’échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA pour Telegram, Discord et Slack

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver appuyé par Docker. Telegram, Discord et Slack sont plus petits — quelques scénarios chacun, aucun système de profil, contre des canaux réels préexistants — leur référence se trouve donc ici.

### Options CLI partagées

Ces lanes s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes options :

| Option                                | Par défaut                                                     | Description                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Exécute uniquement ce scénario. Répétable.                                                                                    |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où les rapports, résumés, messages observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                         |
| `--sut-account <id>`                  | `sut`                                                           | Id de compte temporaire dans la configuration QA Gateway.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (l’ancien `live-openai` fonctionne toujours).                                                |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                               | Réfs de modèle primaire/alternatif.                                                                                          |
| `--fast`                              | désactivé                                                       | Mode rapide du fournisseur lorsque pris en charge.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Voir [Pool d’identifiants Convex](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                                  | Rôle utilisé lorsque `--credential-source convex`.                                                                            |

Chaque lane se termine avec un code non nul en cas de scénario échoué. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe privé Telegram avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont le **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérique du chat (chaîne).
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

Artefacts de sortie :

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi par le pilote → réponse SUT observée) à partir du canari.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de guilde privée Discord avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord groupé. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios d’éléments probants Mantis avec inscription explicite.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’id utilisateur du bot SUT renvoyé par Discord (sinon la lane échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps de messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scénario Mantis avec inscription explicite. S’exécute seul car il bascule le SUT en réponses de guilde toujours actives et uniquement par outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST plus un artefact visuel HTML/PNG.

Exécutez explicitement le scénario de réactions de statut Mantis :

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
- `discord-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` lorsque le scénario de réactions de statut s’exécute.

### QA Slack

```bash
pnpm openclaw qa slack
```

Cible un vrai canal privé Slack avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack groupé.

Env requis lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facultatif :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve les corps de messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`) :

- `slack-canary`
- `slack-mention-gating`

Artefacts de sortie :

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les lanes Telegram, Discord et Slack peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, lui envoie des Heartbeats pendant toute la durée de l’exécution, puis le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de payload que le broker valide sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne de chat-id numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Les variables d’environnement opérationnelles et le contrat d’endpoint du broker Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; les sémantiques du broker sont identiques pour les deux types).

## Seeds appuyés par le dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont volontairement dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un runner Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées de scénario
- des métadonnées facultatives de catégorie, capacité, lane et risque
- les références de docs et de code
- les exigences facultatives de Plugin
- un patch facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface runtime réutilisable qui soutient `qa-flow` est autorisée à rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport
avec des helpers côté navigateur qui pilotent la Control UI intégrée via le
seam Gateway `browser.request` sans ajouter de runner spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les IDs de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité de l’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les chats DM et canal
- le comportement des threads
- le cycle de vie des actions de message
- les rappels Cron
- le rappel mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Lanes de mock de fournisseur

`qa suite` dispose de deux lanes locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la lane de mock
  déterministe par défaut pour la QA appuyée par le dépôt et les gates de parité.
- `aimock` démarre un serveur fournisseur appuyé par AIMock pour la couverture expérimentale de protocole,
  fixtures, enregistrement/relecture et chaos. Il est additif et ne
  remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des lanes de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration de modèle Gateway,
les besoins de staging des profils d’authentification, ainsi que les flags de capacité live/mock. Le code de suite partagée et
de Gateway doit passer par le registre des fournisseurs au lieu de bifurquer sur
les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un seam de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur ce seam, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher sur le même runner de suite au lieu d’ajouter un runner QA spécifique au transport.

Au niveau de l’architecture, la séparation est :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface runtime réutilisable qui les exécute.

### Ajouter un canal

L’ajout d’un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt des suites
- la concurrence des workers
- l’écriture des artefacts
- la génération des rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins de runner possèdent le contrat de transport :

- la façon dont `openclaw qa <runner>` est monté sous la racine `qa` partagée
- la façon dont le Gateway est configuré pour ce transport
- la façon dont l’état prêt est vérifié
- la façon dont les événements entrants sont injectés
- la façon dont les messages sortants sont observés
- la façon dont les transcriptions et l’état de transport normalisé sont exposés
- la façon dont les actions adossées au transport sont exécutées
- la façon dont la réinitialisation ou le nettoyage propre au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Conserver `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémenter le runner de transport sur la jonction d’hôte `qa-lab` partagée.
3. Garder les mécanismes propres au transport dans le plugin de runner ou le harness de canal.
4. Monter le runner sous la forme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les plugins de runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Garder `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter les scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, le mettre dans `qa-lab`.
- Si un comportement dépend d’un seul transport de canal, le garder dans ce plugin de runner ou harness de plugin.
- Si un scénario a besoin d’une nouvelle capacité utilisable par plusieurs canaux, ajouter un helper générique plutôt qu’une branche propre à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, garder le scénario propre au transport et l’expliciter dans le contrat du scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais les nouveaux scénarios doivent utiliser les noms génériques. Les alias existent pour éviter une migration à date unique, pas comme modèle à suivre à l’avenir.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observée.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour l’inventaire des scénarios disponibles — utile pour dimensionner le travail de suivi ou raccorder un nouveau transport — exécuter `pnpm openclaw qa coverage` (ajouter `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécuter le même scénario sur plusieurs refs de modèles live et écrire un rapport Markdown évalué :

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

La commande lance des processus enfants locaux de Gateway QA, pas Docker. Les scénarios d’évaluation de caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires comme la discussion, l’aide dans l’espace de travail et de petites tâches sur les fichiers. Le modèle candidat ne doit pas être informé qu’il est évalué. La commande conserve chaque transcription complète, enregistre les statistiques de base de l’exécution, puis demande aux modèles juges en mode rapide avec un raisonnement `xhigh` lorsque pris en charge de classer les exécutions selon le naturel, le ton et l’humour.
Utiliser `--blind-judge-models` lors de la comparaison de fournisseurs : le prompt du juge reçoit toujours chaque transcription et chaque statut d’exécution, mais les refs candidates sont remplacées par des libellés neutres comme `candidate-01` ; le rapport rattache les classements aux refs réelles après l’analyse.
Les exécutions candidates utilisent par défaut une réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh` pour les anciennes refs d’évaluation OpenAI qui le prennent en charge. Remplacer un candidat précis en ligne avec `--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour compatibilité.
Les refs candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque le fournisseur le prend en charge. Ajouter `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un candidat ou juge unique nécessite un remplacement. Passer `--fast` uniquement pour forcer l’activation du mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions de modèles candidats et juges utilisent toutes deux une concurrence par défaut de 16. Réduire `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur le Gateway local rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Docs connexes

- [QA Matrix](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

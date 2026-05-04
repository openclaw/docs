---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Vue d’ensemble de l’assurance qualité
x-i18n:
    generated_at: "2026-05-04T02:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La stack QA privée sert à exercer OpenClaw d’une manière plus réaliste,
structurée comme un canal, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins de runner : adaptateurs de transport live qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources initiales adossées au dépôt pour la tâche de lancement et les scénarios
  QA de référence.
- [Mantis](/fr/concepts/mantis) : vérification live avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, un état de VM et des preuves de PR.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de scripts `pnpm qa:*` ; les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                                |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt contre la lane Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                         |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                            |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                                  |
| `qa character-eval`                                 | Exécuter le scénario QA de caractère sur plusieurs modèles live avec un rapport jugé. Voir [Rapports](#reporting).                                                       |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la lane du fournisseur/modèle sélectionné.                                                                                          |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                        |
| `qa docker-build-image`                             | Construire l’image Docker QA préintégrée.                                                                                                                                 |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la lane Gateway.                                                                                        |
| `qa up`                                             | Construire le site QA, démarrer la stack adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                        |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` sensible aux scénarios.                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                              |
| `qa matrix`                                         | Lane de transport live contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                      |
| `qa telegram`                                       | Lane de transport live contre un vrai groupe Telegram privé.                                                                                                              |
| `qa discord`                                        | Lane de transport live contre un vrai canal de guilde Discord privé.                                                                                                      |
| `qa slack`                                          | Lane de transport live contre un vrai canal Slack privé.                                                                                                                  |
| `qa mantis`                                         | Runner de vérification avant et après pour les bugs de transport live, avec preuves de réactions de statut Discord et smoke Crabbox desktop/navigateur. Voir [Mantis](/fr/concepts/mantis). |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux panneaux :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de style Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la lane Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner une mission
QA à l’agent, observer le vrai comportement du canal et enregistrer ce qui a fonctionné,
échoué ou est resté bloqué.

Pour une itération plus rapide de l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la stack avec un bundle QA Lab monté en bind :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte en bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle lors des changements, et le navigateur se recharge automatiquement lorsque le hash des ressources QA Lab
change.

Pour un smoke de trace OpenTelemetry local, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur de traces OTLP/HTTP local, exécute le scénario QA
`otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la release :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les ID de diagnostic bruts et les attributs
`openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste réservée aux checkouts source. Le tarball npm omet volontairement
QA Lab, donc les lanes de release Docker de package n’exécutent pas de commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis un checkout source construit lorsque vous modifiez l’instrumentation
de diagnostic.

Pour une lane smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et la disposition des artefacts de cette lane se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observateur, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les lanes smoke Telegram, Discord et Slack avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Elles ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram, Discord et Slack](#telegram-discord-and-slack-qa-reference) ci-dessous.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les réglages d’endpoint et vérifie l’accessibilité admin/liste lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture du transport live

Les lanes de transport live partagent un seul contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la suite large de comportements produit synthétiques et ne fait pas partie de la matrice de couverture du transport live.

| Lane     | Canary | Filtrage des mentions | Bot-à-bot | Blocage par allowlist | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | --------------------- | ---------- | --------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- | ---------------------------------- |
| Matrix   | x      | x                     | x          | x                     | x                         | x                         | x            | x                | x                         |                 |                                    |
| Telegram | x      | x                     | x          |                       |                           |                           |              |                  |                           | x               |                                    |
| Discord  | x      | x                     | x          |                       |                           |                           |              |                  |                           |                 | x                                  |
| Slack    | x      | x                     | x          |                       |                           |                           |              |                  |                           |                 |                                    |

Cela garde `qa-channel` comme suite large de comportements produit tandis que Matrix,
Telegram et les futurs transports live partagent une checklist explicite de contrat
de transport.

Pour une lane VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise une concurrence par défaut de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge et pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram, Discord et Slack

Matrix a une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram, Discord et Slack sont plus petits — une poignée de scénarios chacun, sans système de profil, contre des canaux réels préexistants — leur référence se trouve donc ici.

### Flags CLI partagés

Ces lanes s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes flags :

| Option                                | Par défaut                                                     | Description                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Exécute uniquement ce scénario. Peut être répétée.                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Emplacement où sont écrits les rapports, le résumé, les messages observés et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                       |
| `--sut-account <id>`                  | `sut`                                                           | ID de compte temporaire dans la configuration du Gateway QA.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                 |
| `--model <ref>` / `--alt-model <ref>` | modèle par défaut du fournisseur                                | Références des modèles principal et secondaire.                                                                            |
| `--fast`                              | désactivé                                                       | Mode rapide du fournisseur, lorsque pris en charge.                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                           | Consultez [pool d’identifiants Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` dans CI, sinon `maintainer`                                | Rôle utilisé lorsque `--credential-source convex`.                                                                         |

Chaque voie se termine avec un code non nul en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe privé Telegram avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID de discussion numérique (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optionnel :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés (masqués par défaut).

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
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi par le pilote → réponse SUT observée) en commençant par le canary.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de guilde privé Discord avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord intégré. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios d’éléments de preuve Mantis à activation explicite.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’ID utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Optionnel :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scénario Mantis à activation explicite. S’exécute seul parce qu’il bascule le SUT en réponses de guilde toujours actives et uniquement via outils avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi qu’un artefact visuel HTML/PNG.

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

Cible un vrai canal privé Slack avec deux bots distincts : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Slack intégré.

Variables d’environnement requises lorsque `--credential-source env` :

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optionnel :

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`) :

- `slack-canary`
- `slack-mention-gating`

Artefacts de sortie :

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les voies Telegram, Discord et Slack peuvent louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, lui envoie des Heartbeats pendant toute la durée de l’exécution, puis le libère à l’arrêt. Les types de pool sont `"telegram"`, `"discord"` et `"slack"`.

Formes de charge utile validées par le courtier sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’ID de discussion numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Les variables d’environnement opérationnelles et le contrat de point de terminaison du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; la sémantique du courtier est identique pour les deux types).

## Graines basées sur le dépôt

Les ressources de graines se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un exécuteur markdown générique. Chaque fichier markdown de scénario est la source de vérité d’une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées optionnelles de catégorie, capacité, voie et risque
- les références de documentation et de code
- les exigences optionnelles de Plugin
- le correctif optionnel de configuration du Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique et transversale. Par exemple, les scénarios markdown peuvent combiner des helpers côté transport avec des helpers côté navigateur qui pilotent l’interface Control UI embarquée via la jonction Gateway `browser.request` sans ajouter d’exécuteur spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les discussions en DM et en canal
- le comportement des fils
- le cycle de vie des actions de message
- les rappels cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et la lecture de la documentation
- une petite tâche de build telle que Lobster Invaders

## Voies de simulation de fournisseur

`qa suite` dispose de deux voies locales de simulation de fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la voie de mock déterministe par défaut pour la QA basée sur le dépôt et les portes de parité.
- `aimock` démarre un serveur fournisseur basé sur AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration de modèle du Gateway, ses besoins de préparation de profil d’authentification et ses indicateurs de capacité live/mock. Le code partagé de suite et de Gateway doit passer par le registre des fournisseurs au lieu de créer des branches sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jonction de transport générique pour les scénarios QA markdown. `qa-channel` est le premier adaptateur sur cette jonction, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher dans le même exécuteur de suite au lieu d’ajouter un exécuteur QA propre au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- L’adaptateur de transport possède la configuration du Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA markdown exige exactement deux éléments :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécuteur possèdent le contrat de transport :

- la façon dont `openclaw qa <runner>` est monté sous la racine partagée `qa`
- la façon dont le Gateway est configuré pour ce transport
- la façon dont l’état prêt est vérifié
- la façon dont les événements entrants sont injectés
- la façon dont les messages sortants sont observés
- la façon dont les transcriptions et l’état de transport normalisé sont exposés
- la façon dont les actions appuyées par le transport sont exécutées
- la façon dont la réinitialisation ou le nettoyage propre au transport est géré

La barre minimale d’adoption pour un nouveau canal :

1. Gardez `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémentez le runner de transport sur la jointure d’hôte `qa-lab` partagée.
3. Gardez les mécaniques propres au transport dans le Plugin runner ou le harnais de canal.
4. Montez le runner sous `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins runners doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédigez ou adaptez des scénarios Markdown dans les répertoires thématiques `qa/scenarios/`.
6. Utilisez les helpers de scénario génériques pour les nouveaux scénarios.
7. Gardez les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce Plugin runner ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité utilisable par plus d’un canal, ajoutez un helper générique au lieu d’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez-le explicite dans le contrat du scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration basculée d’un seul coup, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie de bus observée.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles — utile pour dimensionner le travail de suivi ou câbler un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs refs de modèles live et rédigez un rapport Markdown évalué :

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

La commande exécute des processus enfants du Gateway QA local, pas Docker. Les scénarios d’évaluation de caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires comme du chat, de l’aide sur l’espace de travail et de petites tâches de fichiers. Le modèle candidat ne doit pas être informé qu’il est évalué. La commande préserve chaque transcription complète, enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec un raisonnement `xhigh`, lorsque pris en charge, de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : le prompt du juge reçoit toujours chaque transcription et statut d’exécution, mais les refs candidates sont remplacées par des libellés neutres comme `candidate-01` ; le rapport remappe les classements vers les vraies refs après l’analyse.
Les exécutions candidates utilisent par défaut le raisonnement `high`, avec `medium` pour GPT-5.5 et `xhigh` pour les anciennes refs d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat précis en ligne avec `--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour compatibilité.
Les refs candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un seul candidat ou juge nécessite une surcharge. Passez `--fast` uniquement lorsque vous voulez forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont enregistrées dans le rapport pour l’analyse de benchmark, mais les prompts des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression du Gateway local rendent une exécution trop bruitée.
Lorsqu’aucun candidat `--model` n’est passé, l’évaluation de caractère utilise par défaut `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` et `google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut `openai/gpt-5.5,thinking=xhigh,fast` et `anthropic/claude-opus-4-6,thinking=high`.

## Docs associées

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

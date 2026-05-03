---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios d’assurance qualité basés sur le dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’assurance qualité
x-i18n:
    generated_at: "2026-05-03T21:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée est destinée à tester OpenClaw de manière plus réaliste,
structurée comme un canal, qu’un simple test unitaire ne le permet.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : UI de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transport live qui
  pilotent un canal réel dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage sauvegardées dans le dépôt pour la tâche de démarrage et les scénarios QA
  de référence.
- [Mantis](/fr/concepts/mantis) : vérification live avant et après pour les bugs qui
  nécessitent de vrais transports, des captures d’écran de navigateur, l’état d’une VM et des preuves de PR.

## Surface de commande

Tous les flux QA s’exécutent sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                             |
| `qa suite`                                          | Exécuter les scénarios sauvegardés dans le dépôt contre la voie Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.             |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                         |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                               |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles live avec un rapport évalué. Voir [Rapports](#reporting).                                                  |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                         |
| `qa ui`                                             | Démarrer l’UI de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                            |
| `qa docker-build-image`                             | Construire l’image Docker QA préconstruite.                                                                                                                           |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                    |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Démarrer uniquement le serveur de fournisseur AIMock.                                                                                                                 |
| `qa mock-openai`                                    | Démarrer uniquement le serveur de fournisseur `mock-openai` sensible aux scénarios.                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool d’identifiants Convex partagé.                                                                                                                           |
| `qa matrix`                                         | Voie de transport live contre un serveur domestique Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                           |
| `qa telegram`                                       | Voie de transport live contre un vrai groupe Telegram privé.                                                                                                          |
| `qa discord`                                        | Voie de transport live contre un vrai canal de guilde Discord privé.                                                                                                  |
| `qa mantis`                                         | Exécuteur de vérification avant et après pour les bugs de transport live, avec le premier scénario de réactions de statut Discord. Voir [Mantis](/fr/concepts/mantis).    |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription façon Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission
QA, observer le comportement réel du canal et enregistrer ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus vite sur l’UI QA Lab locale sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté en liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte en liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab
change.

Pour un smoke test local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur de traces OTLP/HTTP local, exécute le scénario QA
`otel-trace-smoke` avec le Plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les ID de diagnostic bruts et les
attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste réservée aux extractions de source. Le tarball npm omet intentionnellement
QA Lab, donc les voies de publication Docker de paquet n’exécutent pas les commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis une extraction de source construite lorsque vous modifiez l’instrumentation
de diagnostic.

Pour une voie de smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue de profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un serveur domestique Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai Plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies de smoke Telegram et Discord avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Les deux ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram et Discord](#telegram-and-discord-qa-reference) ci-dessous.

Avant d’utiliser des identifiants live mis en pool, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du courtier Convex, valide les paramètres de point de terminaison et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture du transport live

Les voies de transport live partagent un contrat unique au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la vaste suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture du transport live.

| Voie     | Canary | Filtrage des mentions | Bot-à-bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | --------------------- | --------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | -------------------------- | ---------------- | --------------------------------- |
| Matrix   | x      | x                     | x         | x                                | x                         | x                         | x            | x                | x                          |                  |                                   |
| Telegram | x      | x                     | x         |                                  |                           |                           |              |                  |                            | x                |                                   |
| Discord  | x      | x                     | x         |                                  |                           |                           |              |                  |                            |                  | x                                 |

Cela conserve `qa-channel` comme vaste suite de comportement produit tandis que Matrix,
Telegram et les futurs transports live partagent une liste de contrôle explicite unique de contrat
de transport.

Pour une voie de VM Linux jetable sans intégrer Docker au chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Il réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise une concurrence par défaut
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution série.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie d’échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’
invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram et Discord

Matrix a une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de serveur domestique adossé à Docker. Telegram et Discord sont plus petits — quelques scénarios chacun, sans système de profil, contre de vrais canaux préexistants — leur référence se trouve donc ici.

### Flags CLI partagés

Les deux voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes flags :

| Indicateur                           | Par défaut                                               | Description                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                         | Exécute uniquement ce scénario. Répétable.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Emplacement où sont écrits les rapports, le résumé, les messages observés et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Racine du dépôt lors de l’appel depuis un cwd neutre.                                                                          |
| `--sut-account <id>`                  | `sut`                                                     | Identifiant de compte temporaire dans la configuration du Gateway QA.                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                     |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                          | Références des modèles principal et alternatif.                                                                                |
| `--fast`                              | désactivé                                                 | Mode rapide du fournisseur lorsque pris en charge.                                                                             |
| `--credential-source <env\|convex>`   | `env`                                                     | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                            | Rôle utilisé quand `--credential-source convex`.                                                                               |

Les deux quittent avec un code non nul en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir un code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe Telegram privé avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation de bot à bot fonctionne au mieux quand les deux bots ont **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requis quand `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — identifiant numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés (caviardé par défaut).

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
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi du pilote → réponse SUT observée) à partir du canari.
- `telegram-qa-observed-messages.json` — corps caviardés sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de guilde Discord privé avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le Plugin Discord fourni. Vérifie la gestion des mentions de canal, que le bot SUT a enregistré la commande native `/help` auprès de Discord, ainsi que les scénarios de preuves Mantis avec activation explicite.

Env requis quand `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’identifiant d’utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve le corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scénario Mantis avec activation explicite. S’exécute seul, car il fait basculer le SUT vers des réponses de guilde toujours actives et uniquement par outil avec `messages.statusReactions.enabled=true`, puis capture une chronologie de réactions REST ainsi qu’un artefact visuel HTML/PNG.

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
- `discord-qa-observed-messages.json` — corps caviardés sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` et `discord-status-reactions-tool-only-timeline.png` quand le scénario de réactions de statut s’exécute.

### Pool d’identifiants Convex

Les voies Telegram et Discord peuvent toutes deux louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des Heartbeats pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"` et `"discord"`.

Formes de charge utile que le courtier valide sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’identifiant de chat numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Les variables d’environnement opérationnelles et le contrat de point de terminaison du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; la sémantique du courtier est identique pour les deux types).

## Graines adossées au dépôt

Les ressources de graines se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois par les humains et par
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité d’une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, de capacité, de voie et de risque
- les références aux docs et au code
- les exigences facultatives de Plugin
- le correctif facultatif de configuration du Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui prend en charge `qa-flow` est autorisée à rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des
assistants côté transport avec des assistants côté navigateur qui pilotent l’interface Control UI embarquée via la
liaison Gateway `browser.request`, sans ajouter d’exécuteur spécifique.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Conservez des identifiants de scénario stables quand les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les discussions DM et de canal
- le comportement des fils
- le cycle de vie des actions de message
- les callbacks Cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture de dépôt et la lecture de docs
- une petite tâche de build comme Lobster Invaders

## Voies mock de fournisseur

`qa suite` a deux voies mock locales de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la voie mock
  déterministe par défaut pour la QA adossée au dépôt et les barrières de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour la couverture expérimentale de protocole,
  de fixtures, d’enregistrement/relecture et de chaos. Il est additif et ne
  remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration de modèle du Gateway,
les besoins de préparation des profils d’authentification, ainsi que les indicateurs de capacité live/mock. Le code partagé de suite et de
Gateway doit passer par le registre de fournisseurs plutôt que brancher sur
les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une liaison de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur cette liaison, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher dans le même exécuteur de suite au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration du Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau quand l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécuteur possèdent le contrat de transport :

- la façon dont `openclaw qa <runner>` est monté sous la racine `qa` partagée
- la façon dont le Gateway est configuré pour ce transport
- la façon dont l’état prêt est vérifié
- la façon dont les événements entrants sont injectés
- la façon dont les messages sortants sont observés
- la façon dont les transcriptions et l’état de transport normalisé sont exposés
- la façon dont les actions adossées au transport sont exécutées
- la façon dont la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Conserver `qa-lab` comme propriétaire de la racine `qa` partagée.
2. Implémenter l’exécuteur de transport sur la liaison d’hôte `qa-lab` partagée.
3. Conserver les mécanismes spécifiques au transport dans le Plugin d’exécuteur ou le harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution de l’exécuteur doivent rester derrière des points d’entrée distincts.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si le comportement dépend d’un transport de canal, conservez-le dans ce Plugin d’exécuteur ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez un assistant générique plutôt qu’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un transport, gardez le scénario spécifique au transport et rendez-le explicite dans le contrat du scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la création de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration à bascule unique, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie du bus observée.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles — utile pour estimer le travail de suivi ou raccorder un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

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

La commande exécute des processus enfants de Gateway QA local, pas Docker. Les scénarios d’évaluation du caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme du chat, de l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque transcription complète,
enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec un
raisonnement `xhigh` lorsque pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : l’invite du juge reçoit toujours
chaque transcription et statut d’exécution, mais les références candidates sont remplacées par des
libellés neutres comme `candidate-01`; le rapport associe les classements aux vraies références après
analyse.
Les exécutions candidates utilisent par défaut un raisonnement `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez un candidat précis en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin d’utiliser le traitement prioritaire lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou un juge précis a besoin d’une substitution. Passez `--fast` uniquement lorsque vous voulez
forcer l’activation du mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la
pression sur le Gateway local rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation du caractère utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Matrice QA](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

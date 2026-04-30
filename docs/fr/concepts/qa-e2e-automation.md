---
read_when:
    - Comprendre comment la pile d’assurance qualité s’articule
    - Étendre qa-lab, qa-channel ou un adaptateur de transport
    - Ajout de scénarios QA adossés au dépôt
    - Mise en place d’une automatisation de l’assurance qualité plus réaliste autour du tableau de bord du Gateway
summary: 'Vue d’ensemble de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’assurance qualité
x-i18n:
    generated_at: "2026-04-30T07:22:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée est destinée à exercer OpenClaw d’une manière plus réaliste,
structurée comme un canal, qu’un test unitaire isolé ne le peut.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transport live qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage adossées au dépôt pour la tâche de lancement et les scénarios QA
  de référence.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de scripts `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                            |
| `qa suite`                                          | Exécuter les scénarios adossés au dépôt contre la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.                  |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                        |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport agentique de porte de parité.                                                                     |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles live avec un rapport jugé. Voir [Rapports](#reporting).                                                   |
| `qa manual`                                         | Exécuter une invite ponctuelle contre la voie fournisseur/modèle sélectionnée.                                                                                         |
| `qa ui`                                             | Démarrer l’interface de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                    |
| `qa docker-build-image`                             | Construire l’image Docker QA préconstruite.                                                                                                                           |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                    |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Démarrer uniquement le serveur fournisseur AIMock.                                                                                                                    |
| `qa mock-openai`                                    | Démarrer uniquement le serveur fournisseur `mock-openai` sensible aux scénarios.                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool partagé d’identifiants Convex.                                                                                                                          |
| `qa matrix`                                         | Voie de transport live contre un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                  |
| `qa telegram`                                       | Voie de transport live contre un vrai groupe Telegram privé.                                                                                                          |
| `qa discord`                                        | Voie de transport live contre un vrai canal de guilde Discord privé.                                                                                                  |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une
mission QA, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus vite sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par bind mount :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte par bind mount
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab
change.

Pour un smoke test local de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le scénario QA
`otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` sur les tours réussis ; les ID de diagnostic bruts et les attributs
`openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste limitée au checkout source. Le tarball npm omet intentionnellement
QA Lab, donc les voies de publication Docker de package n’exécutent pas les commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis un checkout source construit lorsque vous modifiez l’instrumentation
de diagnostic.

Pour une voie de smoke Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver/SUT/observer, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies de smoke Telegram et Discord avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Les deux ciblent un vrai canal préexistant avec deux bots (driver + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram et Discord](#telegram-and-discord-qa-reference) ci-dessous.

Avant d’utiliser des identifiants live mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le doctor vérifie l’environnement du broker Convex, valide les paramètres des points de terminaison et vérifie l’accessibilité admin/liste lorsque le secret mainteneur est présent. Il ne signale que l’état défini/manquant des secrets.

## Couverture des transports live

Les voies de transport live partagent un même contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la grande suite synthétique de comportement produit et ne fait pas partie de la matrice de couverture des transports live.

| Voie     | Canary | Garde par mention | Bot à bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | ----------------- | --------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | ---------------- | ---------------------------------- |
| Matrix   | x      | x                 | x         | x                                | x                         | x                         | x            | x                | x                         |                  |                                    |
| Telegram | x      | x                 | x         |                                  |                           |                           |              |                  |                           | x                |                                    |
| Discord  | x      | x                 | x         |                                  |                           |                           |              |                  |                           |                  | x                                  |

Cela garde `qa-channel` comme grande suite de comportement produit tandis que Matrix,
Telegram et les futurs transports live partagent une liste de contrôle explicite de contrat de transport.

Pour une voie VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis recopie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection des scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence
de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez les artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’
invité : clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram et Discord

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram et Discord sont plus petits — quelques scénarios chacun, pas de système de profils, contre des canaux réels préexistants — leur référence se trouve donc ici.

### Indicateurs CLI partagés

Les deux voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes indicateurs :

| Indicateur                            | Valeur par défaut                                       | Description                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                         | Exécute uniquement ce scénario. Répétable.                                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Emplacement où les rapports, le résumé, les messages observés et le journal de sortie sont écrits. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                                 |
| `--sut-account <id>`                  | `sut`                                                     | Identifiant de compte temporaire dans la configuration du Gateway de QA.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne encore).                                                            |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                          | Références des modèles principal/alternatif.                                                                                          |
| `--fast`                              | désactivé                                                 | Mode rapide du fournisseur lorsque pris en charge.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                     | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                            | Rôle utilisé lorsque `--credential-source convex`.                                                                                    |

Les deux se terminent avec un code différent de zéro en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe Telegram privé avec deux bots distincts (driver + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — identifiant numérique du chat (chaîne).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facultatif :

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés (masqués par défaut).

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
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi du driver → réponse SUT observée) à partir du canary.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de guilde Discord privé avec deux bots : un bot driver contrôlé par le harnais et un bot SUT démarré par le Gateway OpenClaw enfant via le plugin Discord groupé. Vérifie la gestion des mentions de canal et que le bot SUT a enregistré la commande native `/help` auprès de Discord.

Variables d’environnement requises avec `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’identifiant utilisateur du bot SUT renvoyé par Discord (sinon la lane échoue immédiatement).

Facultatif :

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserve les corps des messages dans les artefacts de messages observés.

Scénarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`) :

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefacts de sortie :

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool d’identifiants Convex

Les lanes Telegram et Discord peuvent toutes deux louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des heartbeats pendant toute la durée de l’exécution, puis le libère à l’arrêt. Les types de pool sont `"telegram"` et `"discord"`.

Formes de payload que le courtier valide sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’identifiant numérique de chat.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; les sémantiques du courtier sont identiques pour les deux types).

## Seeds adossés au dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan de QA soit visible à la fois par les humains et par l’agent.

`qa-lab` doit rester un runner Markdown générique. Chaque fichier Markdown de scénario est la source de vérité d’une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, capacité, lane et risque
- les références de documentation et de code
- les exigences facultatives de plugin
- le correctif facultatif de configuration du Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui soutient `qa-flow` peut rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport avec des helpers côté navigateur qui pilotent l’interface Control UI intégrée via le seam `browser.request` du Gateway, sans ajouter de runner à cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les discussions en DM et en canal
- le comportement des threads
- le cycle de vie des actions de message
- les callbacks cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture de dépôt et de documentation
- une petite tâche de build comme Lobster Invaders

## Lanes de simulation de fournisseur

`qa suite` a deux lanes locales de simulation de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la lane de mock déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le dispatcher de scénarios `mock-openai`.

L’implémentation des lanes de fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage du serveur local, la configuration du modèle du Gateway, les besoins de staging du profil d’authentification et les indicateurs de capacité live/mock. Le code partagé de la suite et du Gateway doit passer par le registre de fournisseurs au lieu de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un seam de transport générique pour les scénarios QA Markdown. `qa-channel` est le premier adaptateur sur ce seam, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher dans le même runner de suite au lieu d’ajouter un runner QA spécifique à un transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- L’adaptateur de transport possède la configuration du Gateway, la disponibilité, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système QA Markdown exige exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécaniques de l’hôte partagé :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins de runner possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment la disponibilité est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter le runner de transport sur le seam d’hôte partagé `qa-lab`.
3. Garder les mécaniques spécifiques au transport dans le plugin de runner ou le harnais de canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les plugins de runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; l’exécution paresseuse de la CLI et du runner doit rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Conserver les alias de compatibilité existants sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce plugin de runner ou ce harnais de plugin.
- Si un scénario a besoin d’une nouvelle capacité utilisable par plus d’un canal, ajoutez un helper générique plutôt qu’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique au transport et rendez-le explicite dans le contrat du scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration en une seule fois, pas comme modèle pour la suite.

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la timeline du bus observé.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour l’inventaire des scénarios disponibles — utile pour dimensionner le travail de suivi ou raccorder un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les vérifications de personnage et de style, exécutez le même scénario sur plusieurs références de modèles en direct
et écrivez un rapport Markdown évalué :

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

La commande exécute des processus enfants du Gateway QA local, pas Docker. Les scénarios d’évaluation de personnage
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme la discussion, l’aide sur l’espace de travail et les petites tâches sur des fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande conserve chaque transcription complète,
enregistre les statistiques de base de l’exécution, puis demande aux modèles juges en mode rapide avec
le raisonnement `xhigh` lorsque pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge reçoit toujours
chaque transcription et état d’exécution, mais les références candidates sont remplacées par des libellés
neutres comme `candidate-01` ; le rapport associe les classements aux références réelles après
l’analyse.
Les exécutions candidates utilisent par défaut la réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui la prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé là où
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique nécessite un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer l’activation du mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux la concurrence 16 par défaut. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur le Gateway
local rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de personnage utilise par défaut
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

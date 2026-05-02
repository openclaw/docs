---
read_when:
    - Comprendre comment la pile QA s’articule
    - Extension de qa-lab, qa-channel ou d’un adaptateur de transport
    - Ajout de scénarios d’assurance qualité adossés au dépôt
    - Créer une automatisation d’assurance qualité plus réaliste autour du tableau de bord Gateway
summary: 'Présentation de la pile QA : qa-lab, qa-channel, scénarios adossés au dépôt, voies de transport en direct, adaptateurs de transport et rapports.'
title: Présentation de l’assurance qualité
x-i18n:
    generated_at: "2026-05-02T20:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pile QA privée vise à exercer OpenClaw d’une manière plus réaliste,
proche d’un canal, que ne le permet un simple test unitaire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : UI de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `extensions/qa-matrix`, futurs plugins d’exécution : adaptateurs de transport en direct qui
  pilotent un vrai canal dans un Gateway QA enfant.
- `qa/` : ressources d’amorçage versionnées dans le dépôt pour la tâche de démarrage et les scénarios QA
  de référence.

## Surface de commande

Chaque flux QA s’exécute sous `pnpm openclaw qa <subcommand>`. Beaucoup ont des alias de script `pnpm qa:*` ;
les deux formes sont prises en charge.

| Commande                                            | Objectif                                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Auto-vérification QA intégrée ; écrit un rapport Markdown.                                                                                                            |
| `qa suite`                                          | Exécuter les scénarios versionnés dans le dépôt sur la voie du Gateway QA. Alias : `pnpm openclaw qa suite --runner multipass` pour une VM Linux jetable.            |
| `qa coverage`                                       | Afficher l’inventaire Markdown de couverture des scénarios (`--json` pour une sortie machine).                                                                        |
| `qa parity-report`                                  | Comparer deux fichiers `qa-suite-summary.json` et écrire le rapport de parité agentique.                                                                              |
| `qa character-eval`                                 | Exécuter le scénario QA de personnage sur plusieurs modèles en direct avec un rapport évalué. Voir [Rapports](#reporting).                                            |
| `qa manual`                                         | Exécuter un prompt ponctuel sur la voie provider/modèle sélectionnée.                                                                                                 |
| `qa ui`                                             | Démarrer l’UI de débogage QA et le bus QA local (alias : `pnpm qa:lab:ui`).                                                                                           |
| `qa docker-build-image`                             | Construire l’image Docker QA préassemblée.                                                                                                                            |
| `qa docker-scaffold`                                | Écrire un échafaudage docker-compose pour le tableau de bord QA + la voie Gateway.                                                                                    |
| `qa up`                                             | Construire le site QA, démarrer la pile adossée à Docker, afficher l’URL (alias : `pnpm qa:lab:up` ; la variante `:fast` ajoute `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Démarrer uniquement le serveur provider AIMock.                                                                                                                       |
| `qa mock-openai`                                    | Démarrer uniquement le serveur provider `mock-openai` conscient des scénarios.                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gérer le pool d’identifiants Convex partagé.                                                                                                                          |
| `qa matrix`                                         | Voie de transport en direct sur un homeserver Tuwunel jetable. Voir [QA Matrix](/fr/concepts/qa-matrix).                                                                 |
| `qa telegram`                                       | Voie de transport en direct sur un vrai groupe privé Telegram.                                                                                                        |
| `qa discord`                                        | Voie de transport en direct sur un vrai canal de guilde Discord privé.                                                                                                |

## Flux opérateur

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (UI de contrôle) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une
mission QA, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus vite sur l’UI QA Lab locale sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque changement, et le navigateur se recharge automatiquement lorsque le hachage des ressources
QA Lab change.

Pour une vérification rapide locale de trace OpenTelemetry, exécutez :

```bash
pnpm qa:otel:smoke
```

Ce script démarre un récepteur local de traces OTLP/HTTP, exécute le
scénario QA `otel-trace-smoke` avec le plugin `diagnostics-otel` activé, puis
décode les spans protobuf exportés et vérifie la forme critique pour la publication :
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` et `openclaw.message.delivery` doivent être présents ;
les appels de modèle ne doivent pas exporter `StreamAbandoned` lors des tours réussis ; les ID de diagnostic bruts et
les attributs `openclaw.content.*` doivent rester hors de la trace. Il écrit
`otel-smoke-summary.json` à côté des artefacts de la suite QA.

La QA d’observabilité reste limitée aux extractions de source. L’archive npm omet intentionnellement
QA Lab ; les voies de publication Docker de package n’exécutent donc pas les commandes `qa`. Utilisez
`pnpm qa:otel:smoke` depuis une extraction de source construite lorsque vous modifiez l’instrumentation
des diagnostics.

Pour une voie de vérification rapide Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La référence CLI complète, le catalogue des profils/scénarios, les variables d’environnement et la disposition des artefacts pour cette voie se trouvent dans [QA Matrix](/fr/concepts/qa-matrix). En bref : elle provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires pilote/SUT/observateur, exécute le vrai plugin Matrix dans un Gateway QA enfant limité à ce transport (sans `qa-channel`), puis écrit un rapport Markdown, un résumé JSON, un artefact d’événements observés et un journal de sortie combiné sous `.artifacts/qa-e2e/matrix-<timestamp>/`.

Pour les voies de vérification rapide Telegram et Discord avec transport réel :

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Les deux ciblent un vrai canal préexistant avec deux bots (pilote + SUT). Les variables d’environnement requises, les listes de scénarios, les artefacts de sortie et le pool d’identifiants Convex sont documentés dans la [référence QA Telegram et Discord](#telegram-and-discord-qa-reference) ci-dessous.

Avant d’utiliser des identifiants en direct mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le diagnostic vérifie l’environnement du broker Convex, valide les paramètres d’endpoint et vérifie l’accessibilité admin/liste lorsque le secret mainteneur est présent. Il ne rapporte que l’état défini/manquant des secrets.

## Couverture des transports en direct

Les voies de transport en direct partagent un même contrat au lieu d’inventer chacune leur propre forme de liste de scénarios. `qa-channel` est la suite large de comportement produit synthétique et ne fait pas partie de la matrice de couverture des transports en direct.

| Voie     | Canary | Filtrage par mention | Bot à bot | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | --------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | -------------------------- | --------------- | ---------------------------------- |
| Matrix   | x      | x                    | x         | x                                | x                         | x                         | x            | x                | x                          |                 |                                    |
| Telegram | x      | x                    | x         |                                  |                           |                           |              |                  |                            | x               |                                    |
| Discord  | x      | x                    | x         |                                  |                           |                           |              |                  |                            |                 | x                                  |

Cela conserve `qa-channel` comme suite large de comportement produit, tandis que Matrix,
Telegram et les futurs transports en direct partagent une liste de contrôle explicite
du contrat de transport.

Pour une voie VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénario que `qa suite` sur l’hôte.
Les exécutions de suite hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution série.
La commande se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez obtenir les artefacts sans code de sortie en échec.
Les exécutions en direct transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés provider basées sur l’environnement, chemin de configuration du provider QA en direct et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Référence QA Telegram et Discord

Matrix dispose d’une [page dédiée](/fr/concepts/qa-matrix) en raison de son nombre de scénarios et du provisionnement de homeserver adossé à Docker. Telegram et Discord sont plus petits — quelques scénarios chacun, pas de système de profils, sur de vrais canaux préexistants — leur référence se trouve donc ici.

### Options CLI partagées

Les deux voies s’enregistrent via `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` et acceptent les mêmes options :

| Indicateur                           | Par défaut                                               | Description                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Exécute uniquement ce scénario. Répétable.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Emplacement où sont écrits les rapports, le résumé, les messages observés et le journal de sortie. Les chemins relatifs sont résolus par rapport à `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Racine du dépôt lors d’un appel depuis un cwd neutre.                                                                 |
| `--sut-account <id>`                  | `sut`                                                     | ID de compte temporaire dans la configuration du Gateway de QA.                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` ou `live-frontier` (`live-openai` hérité fonctionne toujours).                                          |
| `--model <ref>` / `--alt-model <ref>` | valeur par défaut du fournisseur                          | Références des modèles principal/alternatif.                                                                          |
| `--fast`                              | désactivé                                                 | Mode rapide du fournisseur lorsque pris en charge.                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                     | Voir [pool d’identifiants Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, sinon `maintainer`                            | Rôle utilisé lorsque `--credential-source convex`.                                                                    |

Les deux se terminent avec un code non nul en cas d’échec d’un scénario. `--allow-failures` écrit les artefacts sans définir de code de sortie d’échec.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Cible un vrai groupe Telegram privé avec deux bots distincts (pilote + SUT). Le bot SUT doit avoir un nom d’utilisateur Telegram ; l’observation de bot à bot fonctionne mieux lorsque les deux bots ont **Bot-to-Bot Communication Mode** activé dans `@BotFather`.

Env requises lorsque `--credential-source env` :

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID numérique du chat (chaîne).
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
- `telegram-qa-summary.json` — inclut le RTT par réponse (envoi pilote → réponse SUT observée) à partir du canari.
- `telegram-qa-observed-messages.json` — corps masqués sauf si `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Cible un vrai canal de guilde Discord privé avec deux bots : un bot pilote contrôlé par le harnais et un bot SUT démarré par le Gateway enfant OpenClaw via le Plugin Discord groupé. Vérifie la gestion des mentions de canal et que le bot SUT a enregistré la commande native `/help` auprès de Discord.

Env requises lorsque `--credential-source env` :

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — doit correspondre à l’ID utilisateur du bot SUT renvoyé par Discord (sinon la voie échoue rapidement).

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

Les voies Telegram et Discord peuvent toutes deux louer des identifiants depuis un pool Convex partagé au lieu de lire les variables d’environnement ci-dessus. Passez `--credential-source convex` (ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) ; QA Lab acquiert un bail exclusif, envoie des Heartbeat pendant toute la durée de l’exécution et le libère à l’arrêt. Les types de pool sont `"telegram"` et `"discord"`.

Formes de charge utile validées par le courtier sur `admin/add` :

- Telegram (`kind: "telegram"`) : `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` doit être une chaîne d’ID de chat numérique.
- Discord (`kind: "discord"`) : `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Les variables d’environnement opérationnelles et le contrat du point de terminaison du courtier Convex se trouvent dans [Tests → Identifiants Telegram partagés via Convex](/fr/help/testing#shared-telegram-credentials-via-convex-v1) (le nom de la section est antérieur à la prise en charge de Discord ; la sémantique du courtier est identique pour les deux types).

## Seeds appuyés par le dépôt

Les ressources de seed se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan de QA soit visible à la fois pour les humains et pour l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- les métadonnées facultatives de catégorie, de capacité, de voie et de risque
- les références aux docs et au code
- les exigences facultatives de Plugin
- un correctif facultatif de configuration du Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport avec des helpers côté navigateur qui pilotent l’interface Control UI intégrée via le seam `browser.request` du Gateway, sans ajouter d’exécuteur pour cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers sont déplacés ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de référence doit rester assez large pour couvrir :

- les DM et les chats de canal
- le comportement des fils
- le cycle de vie des actions de message
- les rappels Cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et des docs
- une petite tâche de build comme Lobster Invaders

## Voies de mock de fournisseur

`qa suite` a deux voies locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw conscient des scénarios. Il reste la voie de mock déterministe par défaut pour la QA appuyée par le dépôt et les portes de parité.
- `aimock` démarre un serveur de fournisseur basé sur AIMock pour la couverture expérimentale du protocole, des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`. Chaque fournisseur possède ses valeurs par défaut, le démarrage de son serveur local, la configuration du modèle Gateway, les besoins de préparation des profils d’authentification et les indicateurs de capacité live/mock. Le code partagé de la suite et du Gateway doit passer par le registre de fournisseurs plutôt que de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un seam de transport générique pour les scénarios de QA Markdown. `qa-channel` est le premier adaptateur sur ce seam, mais la cible de conception est plus large : les futurs canaux réels ou synthétiques doivent se brancher au même exécuteur de suite au lieu d’ajouter un exécuteur de QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- L’adaptateur de transport possède la configuration du Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- Les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

### Ajouter un canal

Ajouter un canal au système de QA Markdown exige exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas de nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut posséder le flux.

`qa-lab` possède les mécaniques d’hôte partagées :

- la racine de commande `openclaw qa`
- le démarrage et le démontage de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécution possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment l’état prêt est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions appuyées par le transport sont exécutées
- comment la réinitialisation ou le nettoyage propre au transport est géré

Le seuil minimal d’adoption pour un nouveau canal :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur le seam d’hôte partagé `qa-lab`.
3. Garder les mécaniques propres au transport dans le Plugin d’exécution ou le harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente. Les Plugins d’exécution doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`. Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si le comportement peut être exprimé une fois dans `qa-lab`, mettez-le dans `qa-lab`.
- Si le comportement dépend d’un transport de canal, gardez-le dans ce Plugin d’exécution ou ce harnais de Plugin.
- Si un scénario nécessite une nouvelle capacité utilisable par plusieurs canaux, ajoutez un helper générique au lieu d’une branche propre au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un transport, gardez le scénario propre au transport et rendez-le explicite dans le contrat du scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mais la rédaction de nouveaux scénarios doit utiliser les noms génériques. Les alias existent pour éviter une migration en une seule bascule, pas comme modèle à suivre.

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Les scénarios de suivi qu’il vaut la peine d’ajouter

Pour l’inventaire des scénarios disponibles — utile pour dimensionner les travaux de suivi ou raccorder un nouveau transport — exécutez `pnpm openclaw qa coverage` (ajoutez `--json` pour une sortie lisible par machine).

Pour les contrôles de caractère et de style, exécutez le même scénario sur plusieurs
réfs de modèles live et écrivez un rapport Markdown évalué :

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

La commande exécute des processus enfants locaux du Gateway QA, pas Docker. Les
scénarios d’évaluation de caractère doivent définir le persona via `SOUL.md`, puis
exécuter des tours utilisateur ordinaires comme le chat, l’aide sur l’espace de
travail et de petites tâches sur des fichiers. Il ne faut pas indiquer au modèle
candidat qu’il est évalué. La commande conserve chaque transcription complète,
enregistre les statistiques d’exécution de base, puis demande aux modèles juges
en mode rapide avec un raisonnement `xhigh` lorsque c’est pris en charge de classer
les exécutions selon le naturel, l’atmosphère et l’humour. Utilisez
`--blind-judge-models` lorsque vous comparez des fournisseurs : le prompt du juge
reçoit toujours chaque transcription et chaque état d’exécution, mais les réfs
candidates sont remplacées par des libellés neutres comme `candidate-01` ; le
rapport associe à nouveau les classements aux réfs réelles après l’analyse.
Les exécutions candidates utilisent `high` comme thinking par défaut, avec `medium`
pour GPT-5.5 et `xhigh` pour les anciennes réfs d’évaluation OpenAI qui le prennent
en charge. Remplacez un candidat précis en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours
un repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les réfs candidates OpenAI utilisent le mode rapide par défaut afin que le traitement
prioritaire soit utilisé lorsque le fournisseur le prend en charge. Ajoutez `,fast`,
`,no-fast` ou `,fast=false` en ligne lorsqu’un candidat ou un juge unique nécessite
un remplacement. Passez `--fast` uniquement lorsque vous voulez forcer l’activation
du mode rapide pour chaque modèle candidat. Les durées des candidats et des juges
sont enregistrées dans le rapport pour l’analyse comparative, mais les prompts des
juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux une concurrence
de 16 par défaut. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les
limites des fournisseurs ou la pression sur le Gateway local rendent une exécution
trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par
défaut `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Docs associées

- [QA matricielle](/fr/concepts/qa-matrix)
- [Canal QA](/fr/channels/qa-channel)
- [Tests](/fr/help/testing)
- [Tableau de bord](/fr/web/dashboard)

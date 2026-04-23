---
read_when:
    - Exécuter les tests localement ou en CI
    - Ajouter des tests de régression pour des bogues de modèle/fournisseur
    - Débogage du comportement de la Gateway + de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker, et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-23T07:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb3c7e0644b66e5ca8bce51ec52e874ac8c1dfe02193afa3b34d5e6b5e8a355
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw dispose de trois suites Vitest (unit/integration, e2e, live) et d’un petit ensemble d’exécuteurs Docker.

Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_)
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage)
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs
- Comment ajouter des tests de régression pour des problèmes réels de modèle/fournisseur

## Démarrage rapide

La plupart des jours :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine bien dimensionnée : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier achemine maintenant aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez davantage de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outil/image Gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Test de fumée de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription assistant stocke `usage.cost` normalisé.

Astuce : lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Exécuteurs spécifiques à la QA

Ces commandes se trouvent à côté des suites de tests principales lorsque vous avez besoin du réalisme de QA-lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la barrière de parité simulée, la voie Matrix live, et
la voie Telegram live gérée par Convex sous forme de tâches parallèles. `OpenClaw Release Checks`
exécute les mêmes voies avant approbation de la version.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte des scénarios QA adossés au dépôt.
  - Exécute en parallèle plusieurs scénarios sélectionnés par défaut avec des
    workers gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de
    workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec une valeur non nulle si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale de
    fixtures et de simulation de protocole sans remplacer la voie `mock-openai` consciente des scénarios.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire via
    l’espace de travail monté.
  - Écrit le rapport + le résumé QA normaux ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm à partir du checkout actuel, l’installe globalement dans
    Docker, exécute un onboarding non interactif avec clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances d’exécution à la demande, exécute doctor, et exécute un tour d’agent local contre un point de terminaison OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie
    d’installation packagée avec Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Packe et installe le build OpenClaw actuel dans Docker, démarre la Gateway
    avec OpenAI configuré, puis active les canaux/plugins intégrés via des
    modifications de configuration.
  - Vérifie que la découverte de setup laisse absentes les dépendances d’exécution de Plugin non configurées, que la première exécution configurée de Gateway ou de doctor installe à la demande les dépendances d’exécution de chaque Plugin intégré, et qu’un second redémarrage ne réinstalle pas les dépendances déjà activées.
  - Installe également une base npm antérieure connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise-à-jour du
    candidat répare les dépendances d’exécution des canaux intégrés sans réparation postinstall côté harness.
- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur local AIMock pour des tests de fumée directs du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA Matrix live contre un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/développement. Les installations OpenClaw packagées n’embarquent pas
    `qa-lab`, elles n’exposent donc pas `openclaw qa`.
  - Les checkouts du dépôt chargent directement l’exécuteur intégré ; aucune étape séparée d’installation de Plugin n’est nécessaire.
  - Provisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus une salle privée, puis démarre un enfant gateway QA avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas d’indicateurs partagés de source d’identifiants car la voie provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact d’événements observés, et un journal combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA Telegram live contre un groupe privé réel en utilisant les jetons de bot driver et SUT issus de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’ID de groupe doit être l’ID numérique de chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour utiliser des baux mutualisés.
  - Se termine avec une valeur non nulle si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable de bot à bot, activez Bot-to-Bot Communication Mode dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic de bots du groupe.
  - Écrit un rapport QA Telegram, un résumé, et un artefact de messages observés sous `.artifacts/qa-e2e/...`.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture du transport live.

| Voie     | Canary | Filtrage par mention | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide |
| -------- | ------ | -------------------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                    | x                                | x                         | x                         | x            | x                | x                         |                 |
| Telegram | x      |                      |                                  |                           |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des Heartbeat pour
ce bail tant que la voie s’exécute, puis libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` de loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé/rejouable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’ID numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à la QA

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau lorsque l’hôte partagé `qa-lab` peut
porter le flux.

`qa-lab` possède les mécanismes hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins d’exécuteur possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment la Gateway est configurée pour ce transport
- comment l’état de préparation est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal est :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur la couture d’hôte partagée `qa-lab`.
3. Conserver les mécanismes spécifiques au transport dans le Plugin d’exécuteur ou le harnais du canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; la CLI lazy et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Conserver les alias de compatibilité existants, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, conservez-le dans ce Plugin d’exécuteur ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un assistant générique plutôt qu’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique à ce transport et rendez cela explicite dans le contrat du scénario.

Les noms d’assistants génériques privilégiés pour les nouveaux scénarios sont :

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

Des alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Les nouveaux travaux de canal doivent utiliser les noms d’assistants génériques.
Les alias de compatibilité existent pour éviter une migration brutale, pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une fragilité/un coût croissants) :

### Unit / integration (par défaut)

- Commande : `pnpm test`
- Config : dix exécutions de shards séquentielles (`vitest.full-*.config.ts`) sur les projets Vitest à portée existants
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` en liste blanche couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour des bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune clé réelle requise
  - Doit être rapide et stable
- Remarque sur les projets :
  - `pnpm test` sans ciblage exécute maintenant onze configurations shard plus petites (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus racine natif. Cela réduit le RSS maximal sur les machines chargées et évite que le travail auto-reply/extension n’affame les suites sans lien.
  - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de watch multi-shards n’est pas pratique.
  - `pnpm test`, `pnpm test:watch`, et `pnpm test:perf:imports` acheminent d’abord les cibles explicites de fichier/répertoire via des voies à portée, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite le coût de démarrage du projet racine complet.
  - `pnpm test:changed` étend les chemins git modifiés en les acheminant vers les mêmes voies à portée lorsque la différence ne touche que des fichiers source/test routables ; les modifications de configuration/setup reviennent toujours à une réexécution large du projet racine.
  - `pnpm check:changed` est la barrière locale intelligente normale pour le travail ciblé. Elle classe la différence en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release, et outillage, puis exécute les voies correspondantes de typecheck/lint/test. Les changements du SDK Plugin public et du contrat de Plugin incluent une validation des extensions, car les extensions dépendent de ces contrats core. Les simples hausses de version dans les métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine au lieu de la suite complète, avec une garde qui rejette les changements de package hors du champ de version de premier niveau.
  - Les tests unitaires légers à l’import provenant des agents, commandes, plugins, assistants auto-reply, `plugin-sdk`, et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers à état/runtime lourd restent sur les voies existantes.
  - Certains fichiers source d’assistants `plugin-sdk` et `commands` sélectionnés associent également les exécutions en mode changed à des tests frères explicites dans ces voies légères, de sorte que les modifications d’assistants évitent de relancer toute la suite lourde de ce répertoire.
  - `auto-reply` a maintenant trois compartiments dédiés : assistants core de premier niveau, tests d’intégration `reply.*` de premier niveau, et le sous-arbre `src/auto-reply/reply/**`. Cela maintient le travail le plus lourd du harnais de réponse hors des tests bon marché de statut/chunks/jetons.
- Remarque sur l’exécuteur intégré :
  - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte d’exécution de Compaction,
    conservez les deux niveaux de couverture.
  - Ajoutez des régressions d’assistant ciblées pour les frontières pures de routage/normalisation.
  - Gardez également saines les suites d’intégration de l’exécuteur intégré :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les ID à portée et le comportement de compaction continuent de passer
    par les vrais chemins `run.ts` / `compact.ts` ; les tests d’assistant seuls ne sont pas un
    substitut suffisant à ces chemins d’intégration.
- Remarque sur le pool :
  - La configuration Vitest de base utilise maintenant `threads` par défaut.
  - La configuration Vitest partagée fixe aussi `isolate: false` et utilise l’exécuteur non isolé sur les projets racine, ainsi que sur les configurations e2e et live.
  - La voie UI racine conserve son setup `jsdom` et son optimiseur, mais s’exécute maintenant aussi sur l’exécuteur non isolé partagé.
  - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute désormais aussi `--no-maglev` par défaut aux processus Node enfants de Vitest afin de réduire l’agitation de compilation V8 pendant les grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Remarque sur l’itération locale rapide :
  - `pnpm changed:lanes` affiche quelles voies architecturales une différence déclenche.
  - Le hook pre-commit exécute `pnpm check:changed --staged` après le formatage/lint des fichiers indexés, de sorte que les commits core-only ne paient pas le coût des tests d’extension sauf s’ils touchent des contrats publics destinés aux extensions. Les commits portant uniquement sur des métadonnées de release restent sur la voie ciblée version/configuration/dépendances racine.
  - Si l’ensemble exact de changements indexés a déjà été validé avec des barrières équivalentes ou plus fortes, utilisez `scripts/committer --fast "<message>" <files...>` pour ne sauter que la réexécution du hook à portée modifiée. Le formatage/lint des fichiers indexés s’exécute toujours. Mentionnez les barrières déjà passées dans votre transmission. C’est également acceptable après qu’un échec flaky isolé du hook a été réexécuté avec succès avec une preuve ciblée.
  - `pnpm test:changed` achemine via des voies à portée lorsque les chemins modifiés correspondent proprement à une suite plus petite.
  - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec une limite de workers plus élevée.
  - L’auto-dimensionnement local des workers est maintenant volontairement conservateur et réduit aussi la cadence lorsque la charge moyenne de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest concurrentes causent moins de dégâts par défaut.
  - La configuration Vitest de base marque les fichiers projets/configuration comme `forceRerunTriggers` afin que les réexécutions en mode changed restent correctes quand le câblage des tests change.
  - La configuration conserve `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.
- Remarque de débogage des performances :
  - `pnpm test:perf:imports` active le rapport de durée d’import Vitest ainsi qu’une sortie de ventilation des imports.
  - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare `test:changed` routé avec le chemin natif du projet racine pour cette différence validée et affiche le temps mur ainsi que le RSS max macOS.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre sale actuel en acheminant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la configuration Vitest racine.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour la surcharge de démarrage et de transformation Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+heap de l’exécuteur pour la suite unitaire avec le parallélisme de fichiers désactivé.

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Config : `vitest.gateway.config.ts`, forcé à un worker
- Portée :
  - Démarre une vraie Gateway loopback avec diagnostics activés par défaut
  - Fait passer un churn synthétique de messages gateway, mémoire, et grosses charges utiles par le chemin d’événement de diagnostic
  - Interroge `diagnostics.stability` via la RPC WS Gateway
  - Couvre les assistants de persistance du bundle de stabilité diagnostique
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression, et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clés
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke gateway)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et les tests E2E de Plugin intégré sous `extensions/`
- Valeurs d’exécution par défaut :
  - Utilise Vitest `threads` avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût I/O console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console verbeuse.
- Portée :
  - Comportement end-to-end de gateway multi-instances
  - Surfaces WebSocket/HTTP, appairage de nœuds, et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune clé réelle requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre sur l’hôte une Gateway OpenShell isolée via Docker
  - Crée une sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exec SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale et un démon Docker fonctionnel
  - Utilise un `HOME` / `XDG_CONFIG_HOME` isolé, puis détruit la gateway de test et la sandbox
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et les tests live de Plugin intégré sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités de tool-calling, les problèmes d’authentification, et le comportement des limites de débit
- Attentes :
  - Pas stable en CI par conception (vrais réseaux, vraies politiques fournisseur, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférez exécuter des sous-ensembles ciblés plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent quand même `HOME` et copient le matériel config/auth dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas muter votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous voulez intentionnellement que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise maintenant par défaut un mode plus discret : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire sur `~/.profile` et coupe les journaux de bootstrap Gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez retrouver les journaux de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression sur stderr pour que les longs appels fournisseur restent visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeat de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat de gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modifier de la logique/des tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Toucher au réseau gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Déboguer « mon bot est en panne » / échecs spécifiques à un fournisseur / tool calling : exécutez un `pnpm test:live` ciblé

## Live : balayage des capacités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **toute commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe/n’exécute/n’appaie pas l’application).
  - Validation commande par commande de `node.invoke` gateway pour le nœud Android sélectionné.
- Pré-configuration requise :
  - Application Android déjà connectée + appairée à la gateway.
  - Application maintenue au premier plan.
  - Permissions/consentement de capture accordés pour les capacités que vous attendez comme réussies.
- Remplacements facultatifs de cible :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Application Android](/fr/platforms/android)

## Live : smoke modèle (clés de profil)

Les tests live sont divisés en deux couches afin de pouvoir isoler les échecs :

- « Modèle direct » nous indique si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- « Smoke Gateway » nous indique si tout le pipeline gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique sandbox, etc.).

### Couche 1 : complétion de modèle direct (sans gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée afin de garder `pnpm test:live` focalisé sur le smoke Gateway
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par virgules)
  - Les balayages modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par virgules)
- D’où viennent les clés :
  - Par défaut : magasin de profils et replis d’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer **uniquement** le magasin de profils
- Pourquoi cela existe :
  - Sépare « l’API fournisseur est cassée / la clé est invalide » de « le pipeline d’agent gateway est cassé »
  - Contient de petites régressions isolées (exemple : flux de replay reasoning + tool-call OpenAI Responses/Codex Responses)

### Couche 2 : smoke Gateway + agent dev (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer une gateway en processus
  - Créer/corriger une session `agent:dev:*` (remplacement de modèle à chaque exécution)
  - Itérer sur les modèles-avec-clés et vérifier :
    - réponse « significative » (sans outils)
    - qu’une vraie invocation d’outil fonctionne (sonde de lecture)
    - sondes d’outils supplémentaires facultatives (sonde exec+read)
    - que les chemins de régression OpenAI (tool-call-only → suivi) continuent de fonctionner
- Détails des sondes (pour expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` puis de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l’agent d’écrire via `exec` un nonce dans un fichier temporaire, puis de le `read`.
  - sonde image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou liste séparée par virgules) pour restreindre
  - Les balayages gateway modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par virgules)
- Les sondes d’outil + image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress d’outils)
  - la sonde image s’exécute lorsque le modèle annonce la prise en charge des entrées image
  - Flux (haut niveau) :
    - Le test génère un minuscule PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - La Gateway analyse les pièces jointes en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent intégré transmet un message utilisateur multimodal au modèle
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

Astuce : pour voir ce que vous pouvez tester sur votre machine (et les ID exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke backend CLI (Claude, Codex, Gemini, ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent en utilisant un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut du smoke spécifiques au backend vivent avec la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/args/image provient des métadonnées du Plugin backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour passer les chemins de fichier image comme args CLI au lieu de l’injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler comment les args image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` pour désactiver la sonde de continuité par défaut Claude Sonnet -> Opus dans la même session (définissez `1` pour la forcer lorsque le modèle sélectionné prend en charge une cible de bascule).

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker mono-fournisseur :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- L’exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live CLI-backend dans l’image Docker du dépôt en tant qu’utilisateur non root `node`.
- Il résout les métadonnées du smoke CLI depuis l’extension propriétaire, puis installe le package CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite une authentification OAuth d’abonnement Claude Code portable via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` issu de `claude setup-token`. Il prouve d’abord `claude -p` direct dans Docker, puis exécute deux tours Gateway CLI-backend sans conserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut les sondes Claude MCP/tool et image parce que Claude route actuellement l’usage d’apps tierces via une facturation d’usage supplémentaire plutôt que via les limites normales du forfait d’abonnement.
- Le smoke live CLI-backend exerce maintenant le même flux end-to-end pour Claude, Codex, et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI gateway.
- Le smoke par défaut de Claude corrige également la session de Sonnet vers Opus et vérifie que la session reprise se souvient toujours d’une note antérieure.

## Live : smoke ACP bind (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de liaison de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier en place une conversation synthétique de canal de message
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type DM Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Remarques :
  - Cette voie utilise la surface gateway `chat.send` avec des champs de route d’origine synthétiques réservés à l’administrateur afin que les tests puissent attacher le contexte de canal de message sans prétendre livrer à l’extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre d’agents intégré du Plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.

Exemple :

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-acp-bind
```

Recettes Docker mono-agent :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP contre tous les agents CLI live pris en charge en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` pour restreindre la matrice.
- Il charge `~/.profile`, prépare le matériel d’authentification CLI correspondant dans le conteneur, installe `acpx` dans un préfixe npm inscriptible, puis installe la CLI live demandée (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) si elle manque.
- À l’intérieur de Docker, l’exécuteur définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin que `acpx` conserve pour la CLI enfant du harnais les variables d’environnement fournisseur issues du profil chargé.

## Live : smoke du harnais Codex app-server

- Objectif : valider le harnais Codex possédé par le Plugin via la méthode
  `agent` gateway normale :
  - charger le Plugin `codex` intégré
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent gateway vers `codex/gpt-5.4`
  - envoyer un second tour vers la même session OpenClaw et vérifier que le thread
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    gateway
  - exécuter éventuellement deux sondes shell escaladées revues par Guardian : une
    commande bénigne qui devrait être approuvée et un faux téléversement de secret qui devrait être
    refusé afin que l’agent redemande
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activer : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `codex/gpt-5.4`
- Sonde image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/tool facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex
  cassé ne puisse pas réussir en revenant silencieusement à PI.
- Authentification : `OPENAI_API_KEY` depuis le shell/profil, plus copie facultative de
  `~/.codex/auth.json` et `~/.codex/config.toml`

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il charge le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers
  d’authentification Codex CLI lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm
  monté et inscriptible, prépare l’arbre source, puis n’exécute que le test live du harnais Codex.
- Docker active par défaut les sondes image, MCP/tool et Guardian. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d’une
  exécution de débogage plus ciblée.
- Docker exporte également `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, conformément à la
  configuration de test live afin que le repli `openai-codex/*` ou PI ne puisse pas masquer une
  régression du harnais Codex.

### Recettes live recommandées

Les listes d’autorisation étroites et explicites sont les plus rapides et les moins fragiles :

- Modèle unique, direct (sans gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Remarques :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification distincte + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée par Google via HTTP (authentification par clé API / profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw exécute une binaire locale `gemini` ; elle a sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement avec des clés.

### Ensemble de smoke moderne (tool calling + image)

C’est l’exécution « modèles courants » que nous attendons comme fonctionnelle :

- OpenAI (non-Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécutez le smoke gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence : tool calling (Read + Exec facultatif)

Choisissez au moins un modèle par famille de fournisseurs :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (agréable à avoir) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « tools » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; le tool calling dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI compatibles vision, etc.) pour exercer la sonde image.

### Agrégateurs / passerelles alternatives

Si vous avez des clés activées, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outil+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice live (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Astuce : n’essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est ce que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais committer)

Les tests live découvrent les identifiants de la même manière que la CLI. Conséquences pratiques :

- Si la CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live dit « pas d’identifiants », déboguez comme vous le feriez pour `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que « clés de profil » signifie dans les tests live)
- Config : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état hérité : `~/.openclaw/credentials/` (copié dans le home live préparé lorsqu’il est présent, mais pas le magasin principal de clés de profil)
- Les exécutions live locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, `credentials/` hérité, et les répertoires d’authentification CLI externes pris en charge dans un home de test temporaire ; les homes live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont supprimés pour que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par ex. exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les exécuteurs Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Deepgram live (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test : `extensions/byteplus/live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement de modèle facultatif : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins image, vidéo et `music_generate` comfy intégrés
  - Ignore chaque capacité sauf si `models.providers.comfy.<capability>` est configuré
  - Utile après modification de la soumission de workflow comfy, du polling, des téléchargements, ou de l’enregistrement du Plugin

## Génération d’images live

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness : `pnpm test:live:media image`
- Portée :
  - Énumère chaque Plugin fournisseur de génération d’image enregistré
  - Charge les variables d’environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les variantes standard de génération d’image via la capacité d’exécution partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Fournisseurs intégrés actuellement couverts :
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements env-only

## Génération de musique live

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération de musique
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les deux modes d’exécution déclarés lorsqu’ils sont disponibles :
    - `generate` avec entrée basée uniquement sur un prompt
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier live Comfy séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements env-only

## Génération de vidéo live

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération de vidéo
  - Utilise par défaut le chemin de smoke sûr pour les releases : fournisseurs hors FAL, une requête texte-vers-vidéo par fournisseur, prompt homard d’une seconde, et un plafond d’opération par fournisseur issu de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut car la latence de file côté fournisseur peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - N’exécute que `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte dans le balayage partagé une entrée image locale adossée à un buffer
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte dans le balayage partagé une entrée vidéo locale adossée à un buffer
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` car `veo3` intégré est text-only et `kling` intégré nécessite une URL d’image distante
  - Couverture Vydra spécifique au fournisseur :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` en texte-vers-vidéo plus une voie `kling` qui utilise par défaut une fixture d’URL d’image distante
  - Couverture live actuelle de `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` car ces chemins nécessitent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` car la voie Gemini/Veo partagée actuelle utilise une entrée locale adossée à un buffer et ce chemin n’est pas accepté dans le balayage partagé
    - `openai` car la voie partagée actuelle n’offre pas de garanties d’accès organisation-spécifique à l’inpaint/remix vidéo
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure chaque fournisseur dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire le plafond d’opération de chaque fournisseur lors d’un smoke agressif
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements env-only

## Harness live média

- Commande : `pnpm test:live:media`
- But :
  - Exécute les suites live partagées image, musique et vidéo via un point d’entrée natif du dépôt unique
  - Charge automatiquement les variables d’environnement fournisseur manquantes depuis `~/.profile`
  - Restreint automatiquement chaque suite par défaut aux fournisseurs disposant actuellement d’une authentification utilisable
  - Réutilise `scripts/test-live.mjs`, de sorte que le comportement Heartbeat et le mode silencieux restent cohérents
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se divisent en deux catégories :

- Exécuteurs live-model : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live à clés de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker live utilisent par défaut un plafond de smoke plus petit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement une analyse exhaustive plus large.
- `test:docker:all` construit une fois l’image Docker live via `test:docker:live-build`, puis la réutilise pour les deux voies Docker live. Il construit également une image partagée `scripts/e2e/Dockerfile` via `test:docker:e2e-build` et la réutilise pour les exécuteurs smoke de conteneur E2E qui exercent l’application construite.

Les exécuteurs Docker live-model montent également en bind uniquement les homes d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse rafraîchir les jetons sans muter le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais Codex app-server : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, scaffolding complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/canal/agent depuis archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive OpenClaw packée, configure OpenAI via un onboarding env-ref plus Telegram par défaut, vérifie que l’activation du Plugin installe ses dépendances d’exécution à la demande, exécute doctor, puis un tour d’agent OpenAI simulé. Réutilisez une archive préconstruite avec `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Réseau Gateway (deux conteneurs, auth WS + health) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Régression minimale reasoning OpenAI Responses web_search : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` relève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisée + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP bundle Pi (vrai serveur MCP stdio + smoke allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (vraie Gateway + suppression d’enfant MCP stdio après Cron isolé et exécutions one-shot de sous-agent) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke d’installation + alias `/plugin` + sémantique de redémarrage Claude-bundle) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
- Smoke inchangé de mise à jour de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances d’exécution de Plugin intégré : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image d’exécuteur Docker, construit et packe OpenClaw une fois sur l’hôte, puis monte cette archive dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après un build local récent avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers une archive existante avec `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restreignez les dépendances d’exécution de Plugin intégré pendant l’itération en désactivant les scénarios sans lien, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image partagée built-app :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image spécifiques à une suite, comme `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, gardent la priorité lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et d’installation conservent leurs propres Dockerfiles car ils valident le comportement de package/installation plutôt que le runtime built-app partagé.

Les exécuteurs Docker live-model montent également en lecture seule le checkout actuel et
le préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image runtime
légère tout en exécutant Vitest exactement sur votre source/configuration locale.
L’étape de préparation ignore les gros caches locaux et les sorties de build d’application comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires de sortie locaux `.build` ou
Gradle afin que les exécutions Docker live ne passent pas des minutes à copier des artefacts
spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est la manière principale de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
initialisé, démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièce jointe,
le comportement de la file d’événements live, le routage d’envoi sortant, et les notifications de canal +
permission de style Claude via le vrai pont MCP stdio. La vérification de notification
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier expose par hasard.
`test:docker:pi-bundle-mcp-tools` est déterministe et n’a pas besoin d’une clé de
modèle live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent
les outils `bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et n’a pas besoin de clé de modèle live.
Il démarre une Gateway initialisée avec un vrai serveur de sonde MCP stdio, exécute un
tour Cron isolé et un tour enfant one-shot `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP en langage naturel sur fil (pas CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourra redevenir nécessaire pour la validation du routage de fil ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant d’exécuter les tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et sans montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par fournisseur ne montent que les répertoires/fichiers nécessaires déduits depuis `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour des réexécutions qui n’ont pas besoin d’une reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par la gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de documentation

Exécutez les vérifications de documentation après des modifications de doc : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sûr pour la CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Tool calling Gateway (OpenAI simulé, vraie boucle gateway + agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit config + auth appliqués) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests sûrs pour la CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Tool-calling simulé via la vraie boucle gateway + agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant end-to-end qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listées dans le prompt, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui sont hors sujet) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/args requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, le report de l’historique de session, et les limites sandbox.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outil + leur ordre, les lectures de fichier de Skill, et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, gating, injection de prompt).
- Des évaluations live facultatives (opt-in, contrôlées par env) uniquement une fois la suite sûre pour la CI en place.

## Tests de contrat (forme Plugin et canal)

Les tests de contrat vérifient que chaque Plugin et canal enregistré est conforme à son
contrat d’interface. Ils itèrent sur tous les plugins découverts et exécutent une suite de
vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test` ignore
intentionnellement ces fichiers de couture partagée et de smoke ; exécutez explicitement les commandes de contrat
lorsque vous touchez à des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseur uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, name, capabilities)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile du message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion de l’ID de fil
- **directory** - API d’annuaire/de roster
- **group-policy** - Application de la politique de groupe

### Contrats d’état du fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d’état de canal
- **registry** - Forme du registre de Plugin

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’authentification
- **auth-choice** - Choix/sélection de l’authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de Plugin
- **loader** - Chargement de Plugin
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un canal ou Plugin fournisseur
- Après refactorisation de l’enregistrement ou de la découverte de Plugin

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (guide)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression sûre pour la CI (fournisseur simulé/stub, ou capture de la transformation exacte de forme de requête)
- Si le problème est intrinsèquement live-only (limites de débit, politiques d’authentification), gardez le test live étroit et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui intercepte le bogue :
  - bogue de conversion/relecture de requête fournisseur → test de modèles directs
  - bogue de pipeline gateway session/historique/outils → smoke gateway live ou test mock gateway sûr pour la CI
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillon par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les ID exec de segment de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les ID de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

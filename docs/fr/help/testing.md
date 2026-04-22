---
read_when:
    - Exécution des tests en local ou en CI
    - Ajout de régressions pour les bugs de modèle/provider
    - Débogage du comportement de Gateway + de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, runners Docker et couverture de chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-22T04:23:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw comporte trois suites Vitest (unitaires/intégration, e2e, live) et un petit ensemble de runners Docker.

Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_)
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage)
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/providers
- Comment ajouter des régressions pour des problèmes réels de modèle/provider

## Démarrage rapide

La plupart des jours :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine confortable : `pnpm test:max`
- Boucle directe Vitest en mode watch : `pnpm test:watch`
- Le ciblage direct de fichier route maintenant aussi les chemins d’extension/de canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez plus de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais providers/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON indique Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

Astuce : lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Runners spécifiques à la QA

Ces commandes se placent à côté des suites de test principales lorsque vous avez besoin du réalisme de qa-lab :

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte des scénarios QA adossés au dépôt.
  - Exécute en parallèle plusieurs scénarios sélectionnés par défaut avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4
    (bornée par le nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour retrouver l’ancienne voie série.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Prend en charge les modes provider `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur provider local adossé à AIMock pour une couverture expérimentale
    des fixtures et des mocks de protocole sans remplacer la voie
    `mock-openai` sensible aux scénarios.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes indicateurs de sélection de provider/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’auth QA prises en charge et pratiques pour l’invité :
    clés provider basées sur l’environnement, chemin de configuration du provider live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire
    via l’espace de travail monté.
  - Écrit le rapport QA et le résumé habituels, plus les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour un travail QA de type opérateur.
- `pnpm test:docker:bundled-channel-deps`
  - Packe et installe la version actuelle d’OpenClaw dans Docker, démarre Gateway
    avec OpenAI configuré, puis active Telegram et Discord via des modifications de configuration.
  - Vérifie que le premier redémarrage de Gateway installe à la demande les dépendances d’exécution
    de chaque Plugin de canal intégré, et qu’un second redémarrage ne réinstalle pas
    des dépendances déjà activées.
  - Installe aussi une base npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le
    doctor post-mise à jour du candidat répare les dépendances d’exécution des canaux intégrés sans
    réparation postinstall côté harnais.
- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur provider AIMock local pour du smoke direct de protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/au développement. Les installations packagées d’OpenClaw ne livrent pas
    `qa-lab`, elles n’exposent donc pas `openclaw qa`.
  - Les checkouts du dépôt chargent directement le runner intégré ; aucune étape
    d’installation de Plugin séparée n’est nécessaire.
  - Provisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus un salon privé, puis démarre un enfant QA Gateway avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image stable Tuwunel épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas d’indicateurs partagés de source d’identifiants car la voie provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact d’événements observés, et un journal combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé avec les tokens de bot driver et SUT issus de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant numérique de discussion Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour adopter des baux mutualisés.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT devant exposer un nom d’utilisateur Telegram.
  - Pour une observation stable bot-à-bot, activez le mode Bot-to-Bot Communication dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact des messages observés sous `.artifacts/qa-e2e/...`.

Les voies de transport live partagent un contrat standard afin que les nouveaux transports ne divergent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture des transports live.

| Voie | Canary | Contrôle des mentions | Blocage par liste d’autorisation | Réponse de niveau supérieur | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | --------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                           | x                         | x            | x                | x                         |                 |
| Telegram | x      |                       |                                  |                             |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, qa-lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie des Heartbeats
sur ce bail pendant l’exécution de la voie, puis libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (vaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de trace facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en loopback uniquement pour le développement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration maintainer (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers CLI pour les maintainers :

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
  - Épuisé/réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret maintainer uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret maintainer uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret maintainer uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme du payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de discussion Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à la QA

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de niveau supérieur lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` possède les mécaniques d’hôte partagées :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins de runner possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment Gateway est configuré pour ce transport
- comment la disponibilité est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal est :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter le runner de transport sur le point d’extension de l’hôte partagé `qa-lab`.
3. Conserver les mécanismes spécifiques au transport dans le Plugin de runner ou le harnais du canal.
4. Monter le runner comme `openclaw qa <runner>` au lieu d’enregistrer une commande racine concurrente.
   Les Plugins de runner doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; le CLI paresseux et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter les scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les helpers de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un seul transport de canal, gardez-le dans ce Plugin de runner ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un helper générique plutôt qu’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique à ce transport et explicitez-le dans le contrat du scénario.

Les noms de helpers génériques préférés pour les nouveaux scénarios sont :

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

Les alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Le nouveau travail sur les canaux doit utiliser les noms de helpers génériques.
Les alias de compatibilité existent pour éviter une migration brutale, pas comme modèle
pour la rédaction de nouveaux scénarios.

## Suites de test (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une augmentation de la fragilité/du coût) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : dix exécutions séquentielles de shards (`vitest.full-*.config.ts`) sur les projets Vitest ciblés existants
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration dans le processus (auth Gateway, routage, outils, parsing, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
- Remarque sur les projets :
  - `pnpm test` sans cible exécute désormais onze configurations de shard plus petites (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus de projet racine natif. Cela réduit le RSS maximal sur les machines chargées et évite que le travail auto-reply/extensions n’affame les suites non liées.
  - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle watch multi-shard n’est pas pratique.
  - `pnpm test`, `pnpm test:watch`, et `pnpm test:perf:imports` routent d’abord les cibles explicites fichier/répertoire via des voies ciblées, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite le coût complet de démarrage du projet racine.
  - `pnpm test:changed` étend les chemins git modifiés vers les mêmes voies ciblées lorsque le diff ne touche que des fichiers source/test routables ; les modifications de config/setup se replient toujours sur une réexécution large du projet racine.
  - `pnpm check:changed` est la barrière locale intelligente normale pour du travail ciblé. Il classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de release et outillage, puis exécute les voies correspondantes de typecheck/lint/test. Les changements du SDK Plugin public et des contrats de plugin incluent la validation des extensions parce que les extensions dépendent de ces contrats core. Les bumps de version limités aux métadonnées de release exécutent des vérifications ciblées version/config/dépendances racine au lieu de la suite complète, avec une garde qui rejette les changements de package en dehors du champ de version de niveau supérieur.
  - Les tests unitaires légers en imports issus des agents, commandes, plugins, helpers auto-reply, `plugin-sdk`, et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers lourds en état/runtime restent sur les voies existantes.
  - Certains fichiers source helpers `plugin-sdk` et `commands` sélectionnés font aussi correspondre les exécutions en mode changed à des tests frères explicites dans ces voies légères, afin que les modifications de helper évitent de relancer toute la suite lourde pour ce répertoire.
  - `auto-reply` possède maintenant trois compartiments dédiés : helpers core de niveau supérieur, tests d’intégration `reply.*` de niveau supérieur, et le sous-arbre `src/auto-reply/reply/**`. Cela garde le travail du harnais reply le plus lourd hors des tests bon marché status/chunk/token.
- Remarque sur le runner embarqué :
  - Lorsque vous modifiez les entrées de découverte des outils de message ou le contexte d’exécution de Compaction,
    gardez les deux niveaux de couverture.
  - Ajoutez des régressions ciblées de helper pour les frontières pures de routage/normalisation.
  - Gardez aussi saines les suites d’intégration du runner embarqué :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les identifiants ciblés et le comportement de Compaction continuent bien à transiter
    par les vrais chemins `run.ts` / `compact.ts` ; des tests de helper seuls ne
    remplacent pas suffisamment ces chemins d’intégration.
- Remarque sur le pool :
  - La configuration Vitest de base utilise désormais `threads` par défaut.
  - La configuration Vitest partagée fixe aussi `isolate: false` et utilise le runner non isolé sur les projets racine, e2e et live.
  - La voie UI racine garde sa configuration `jsdom` et son optimiseur, mais s’exécute désormais aussi sur le runner partagé non isolé.
  - Chaque shard `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute désormais aussi `--no-maglev` par défaut aux processus Node enfants de Vitest afin de réduire le churn de compilation V8 pendant les grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Remarque sur l’itération locale rapide :
  - `pnpm changed:lanes` affiche quelles voies architecturales un diff déclenche.
  - Le hook pre-commit exécute `pnpm check:changed --staged` après le formatage/lint des fichiers indexés, afin que les commits core-only ne paient pas le coût des tests d’extension à moins de toucher des contrats publics orientés extension. Les commits limités aux métadonnées de release restent sur la voie ciblée version/config/dépendances racine.
  - `pnpm test:changed` passe par des voies ciblées lorsque les chemins modifiés correspondent proprement à une suite plus petite.
  - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec une limite de workers plus élevée.
  - L’auto-scaling local des workers est désormais volontairement conservateur et réduit aussi l’allure lorsque la moyenne de charge de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest concurrentes fassent moins de dégâts par défaut.
  - La configuration Vitest de base marque les fichiers projets/config comme `forceRerunTriggers` afin que les réexécutions en mode changed restent correctes lorsque le câblage des tests change.
  - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour un profilage direct.
- Remarque sur le débogage des performances :
  - `pnpm test:perf:imports` active le reporting de durée d’import Vitest plus une sortie de détail des imports.
  - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare `test:changed` routé au chemin natif du projet racine pour ce diff validé et affiche le temps mur ainsi que le RSS maximal macOS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarke l’arbre de travail modifié actuel en routant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la configuration Vitest racine.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour le coût de démarrage et de transformation Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la suite unitaire avec parallélisme de fichiers désactivé.

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valeurs d’exécution par défaut :
  - Utilise Vitest `threads` avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le coût d’E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console verbeuse.
- Portée :
  - Comportement end-to-end Gateway multi-instance
  - Surfaces WebSocket/HTTP, association de Node, et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `test/openshell-sandbox.e2e.test.ts`
- Portée :
  - Démarre sur l’hôte une Gateway OpenShell isolée via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite un CLI `openshell` local plus un démon Docker fonctionnel
  - Utilise un `HOME` / `XDG_CONFIG_HOME` isolé, puis détruit la Gateway de test et le sandbox
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non standard ou un script wrapper

### Live (vrais providers + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Est-ce que ce provider/modèle fonctionne réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format provider, les particularités de tool-calling, les problèmes d’auth et le comportement des limitations de débit
- Attentes :
  - Pas stable en CI par conception (vrais réseaux, vraies politiques provider, quotas, pannes)
  - Coûte de l’argent / consomme des quotas
  - Préférez exécuter des sous-ensembles limités plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent quand même `HOME` et copient la configuration/le matériel d’auth dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise maintenant un mode plus silencieux par défaut : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire sur `~/.profile` et coupe les journaux de bootstrap Gateway/le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les journaux complets de démarrage.
- Rotation de clés API (spécifique au provider) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limitation de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les appels provider longs restent visiblement actifs même lorsque la capture console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression provider/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeats du modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeats Gateway/probe avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Si vous touchez au réseau Gateway / au protocole WS / à l’association : ajoutez `pnpm test:e2e`
- Pour déboguer « mon bot est en panne » / des échecs spécifiques à un provider / le tool calling : exécutez un `pnpm test:live` restreint

## Live : balayage des capacités du Node Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un Node Android connecté et vérifier le comportement contractuel de la commande.
- Portée :
  - Préconditionné/configuration manuelle (la suite n’installe pas, n’exécute pas et n’associe pas l’app).
  - Validation Gateway `node.invoke` commande par commande pour le Node Android sélectionné.
- Préconfiguration requise :
  - App Android déjà connectée et associée à Gateway.
  - App maintenue au premier plan.
  - Permissions/consentement de capture accordés pour les capacités que vous attendez comme réussies.
- Remplacements facultatifs de cible :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [App Android](/fr/platforms/android)

## Live : smoke de modèle (clés de profil)

Les tests live sont divisés en deux couches pour pouvoir isoler les échecs :

- Le « modèle direct » nous indique si le provider/modèle peut répondre tout court avec la clé donnée.
- Le « smoke Gateway » nous indique si tout le pipeline Gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique de sandbox, etc.).

### Couche 1 : complétion de modèle directe (sans Gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées lorsque nécessaire)
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée pour garder `pnpm test:live` centré sur le smoke Gateway
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut une limite organisée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les providers :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- D’où viennent les clés :
  - Par défaut : store de profils et replis d’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer **uniquement** le store de profils
- Pourquoi cela existe :
  - Sépare « l’API du provider est cassée / la clé est invalide » de « le pipeline d’agent Gateway est cassé »
  - Contient de petites régressions isolées (exemple : flux de raisonnement replay + tool-call OpenAI Responses/Codex Responses)

### Couche 2 : smoke Gateway + agent dev (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer une Gateway dans le processus
  - Créer/patcher une session `agent:dev:*` (remplacement de modèle à chaque exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - une réponse « significative » (sans outils)
    - qu’une invocation réelle d’outil fonctionne (sonde de lecture)
    - des sondes d’outils supplémentaires facultatives (sonde exec+read)
    - que les chemins de régression OpenAI (tool-call-only → suivi) continuent de fonctionner
- Détails des sondes (pour pouvoir expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` puis de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l’agent d’écrire un nonce via `exec` dans un fichier temporaire, puis de le `read`.
  - sonde d’image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre
  - Les balayages Gateway modern/all utilisent par défaut une limite organisée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les providers (éviter « OpenRouter partout ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outil + d’image sont toujours actives dans ce test live :
  - sonde `read` + sonde `exec+read` (stress des outils)
  - la sonde d’image s’exécute lorsque le modèle annonce la prise en charge de l’entrée image
  - Flux (haut niveau) :
    - Le test génère un petit PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parse les pièces jointes en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent embarqué transmet un message utilisateur multimodal au modèle
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

Astuce : pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke du backend CLI (Claude, Codex, Gemini ou autres CLI locaux)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent en utilisant un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut de smoke spécifiques au backend se trouvent dans la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Provider/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement de commande/arguments/image provient des métadonnées du Plugin de backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour transmettre les chemins de fichier image comme arguments CLI au lieu d’une injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler comment les arguments image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` pour désactiver la sonde de continuité de session par défaut Claude Sonnet -> Opus (définissez `1` pour la forcer lorsque le modèle sélectionné prend en charge une cible de bascule).

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

Recettes Docker mono-provider :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- Le runner Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live du backend CLI dans l’image Docker du dépôt en tant qu’utilisateur non root `node`.
- Il résout les métadonnées de smoke CLI à partir de l’extension propriétaire, puis installe le package CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite un OAuth d’abonnement portable Claude Code via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` depuis `claude setup-token`. Il prouve d’abord un `claude -p` direct dans Docker, puis exécute deux tours Gateway CLI-backend sans conserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut les sondes Claude MCP/tool et image parce que Claude route actuellement l’usage d’apps tierces via une facturation d’usage supplémentaire au lieu des limites normales du plan d’abonnement.
- Le smoke live du backend CLI exerce maintenant le même flux end-to-end pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la Gateway CLI.
- Le smoke par défaut de Claude patche aussi la session de Sonnet vers Opus et vérifie que la session reprise se souvient toujours d’une note précédente.

## Live : smoke de binding ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de binding de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de message
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de la session ACP liée
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
- Remarques :
  - Cette voie utilise la surface Gateway `chat.send` avec des champs admin-only synthétiques de route d’origine afin que les tests puissent attacher un contexte de canal de message sans prétendre à une livraison externe.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre intégré d’agents du Plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.

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

- Le runner Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de binding ACP contre tous les agents CLI live pris en charge en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` pour restreindre la matrice.
- Il charge `~/.profile`, prépare le matériel d’auth CLI correspondant dans le conteneur, installe `acpx` dans un préfixe npm inscriptible, puis installe le CLI live demandé (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) s’il manque.
- Dans Docker, le runner définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin que acpx conserve les variables d’environnement provider issues du profil chargé disponibles pour le CLI de harnais enfant.

## Live : smoke du harnais Codex app-server

- Objectif : valider le harnais Codex détenu par le Plugin via la méthode Gateway
  `agent` normale :
  - charger le Plugin `codex` intégré
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent Gateway à `codex/gpt-5.4`
  - envoyer un second tour à la même session OpenClaw et vérifier que le fil
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    Gateway
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activer : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `codex/gpt-5.4`
- Sonde d’image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex
  cassé ne puisse pas réussir en basculant silencieusement vers Pi.
- Auth : `OPENAI_API_KEY` depuis le shell/profil, plus éventuellement
  `~/.codex/auth.json` et `~/.codex/config.toml` copiés

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Remarques Docker :

- Le runner Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il charge le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers d’auth
  du CLI Codex lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm
  monté et inscriptible, prépare l’arborescence source, puis n’exécute que le test live du harnais Codex.
- Docker active par défaut les sondes d’image et MCP/outil. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lorsque vous avez besoin d’une exécution de débogage plus restreinte.
- Docker exporte aussi `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, conformément à la configuration
  du test live, afin qu’un repli `openai-codex/*` ou Pi ne puisse pas masquer une régression
  du harnais Codex.

### Recettes live recommandées

Les listes d’autorisation étroites et explicites sont les plus rapides et les moins fragiles :

- Modèle unique, direct (sans Gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke Gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling sur plusieurs providers :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ciblage Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Remarques :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise le CLI Gemini local sur votre machine (auth séparée + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée de Google via HTTP (auth par clé API / profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw exécute un binaire `gemini` local ; il possède sa propre auth et peut se comporter différemment (streaming/pris en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (le live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement avec des clés.

### Ensemble de smoke moderne (tool calling + image)

C’est l’exécution « modèles courants » que nous attendons de garder fonctionnelle :

- OpenAI (hors Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le smoke Gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence de base : tool calling (Read + Exec facultatif)

Choisissez au moins un modèle par famille de provider :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (appréciable) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « tools » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; le tool calling dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI compatibles vision, etc.) afin d’exercer la sonde d’image.

### Agrégateurs / passerelles alternatives

Si vous avez activé les clés, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outils+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres providers que vous pouvez inclure dans la matrice live (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Astuce : n’essayez pas de coder en dur « tous les modèles » dans la documentation. La liste d’autorité est celle que renvoie `discoverModels(...)` sur votre machine + les clés disponibles.

## Identifiants (ne jamais commit)

Les tests live découvrent les identifiants de la même façon que le CLI. Implications pratiques :

- Si le CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live indique « pas d’identifiants », déboguez-le comme vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d’auth par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que « clés de profil » signifie dans les tests live)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état historique : `~/.openclaw/credentials/` (copié dans le home live préparé lorsqu’il est présent, mais pas dans le store principal des clés de profil)
- Les exécutions live locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, le répertoire historique `credentials/`, et les répertoires d’auth CLI externes pris en charge dans un home de test temporaire ; les homes live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par ex. exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les runners Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Live Deepgram (transcription audio)

- Test : `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test : `src/agents/byteplus.live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Remplacement de modèle facultatif : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live des médias de workflow ComfyUI

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins image, vidéo et `music_generate` du comfy intégré
  - Ignore chaque capacité sauf si `models.providers.comfy.<capability>` est configuré
  - Utile après des modifications de soumission de workflow comfy, polling, téléchargements ou enregistrement du Plugin

## Live de génération d’image

- Test : `src/image-generation/runtime.live.test.ts`
- Commande : `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harnais : `pnpm test:live:media image`
- Portée :
  - Énumère tous les Plugins provider de génération d’image enregistrés
  - Charge les variables d’environnement provider manquantes depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/d’environnement avant les profils d’auth stockés, afin que des clés de test périmées dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les providers sans auth/profil/modèle utilisable
  - Exécute les variantes standard de génération d’image via la capacité runtime partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Providers intégrés actuellement couverts :
  - `openai`
  - `google`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportement d’auth facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’auth du store de profils et ignorer les remplacements fondés uniquement sur l’environnement

## Live de génération musicale

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé intégré du provider de génération musicale
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement provider depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/d’environnement avant les profils d’auth stockés, afin que des clés de test périmées dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les providers sans auth/profil/modèle utilisable
  - Exécute les deux modes runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec entrée basée uniquement sur le prompt
    - `edit` lorsque le provider déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier live Comfy séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportement d’auth facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’auth du store de profils et ignorer les remplacements fondés uniquement sur l’environnement

## Live de génération vidéo

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé intégré du provider de génération vidéo
  - Utilise par défaut le chemin de smoke sûr pour la release : providers autres que FAL, une requête text-to-video par provider, prompt lobster d’une seconde, et un plafond d’opération par provider via `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut, car la latence de file d’attente côté provider peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement provider depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/d’environnement avant les profils d’auth stockés, afin que des clés de test périmées dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les providers sans auth/profil/modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le provider déclare `capabilities.imageToVideo.enabled` et que le provider/modèle sélectionné accepte une entrée image locale adossée à un buffer dans le balayage partagé
    - `videoToVideo` lorsque le provider déclare `capabilities.videoToVideo.enabled` et que le provider/modèle sélectionné accepte une entrée vidéo locale adossée à un buffer dans le balayage partagé
  - Providers actuellement déclarés mais ignorés pour `imageToVideo` dans le balayage partagé :
    - `vydra` parce que le `veo3` intégré est text-only et que le `kling` intégré nécessite une URL d’image distante
  - Couverture Vydra spécifique au provider :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` text-to-video plus une voie `kling` qui utilise par défaut une fixture d’URL d’image distante
  - Couverture live actuelle de `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Providers actuellement déclarés mais ignorés pour `videoToVideo` dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` parce que ces chemins exigent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` parce que la voie Gemini/Veo partagée actuelle utilise une entrée locale adossée à un buffer et que ce chemin n’est pas accepté dans le balayage partagé
    - `openai` parce que la voie partagée actuelle ne garantit pas l’accès spécifique à l’organisation pour l’inpaint/remix vidéo
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure tous les providers dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire le plafond d’opération de chaque provider lors d’un smoke agressif
- Comportement d’auth facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’auth du store de profils et ignorer les remplacements fondés uniquement sur l’environnement

## Harnais live média

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites live partagées image, musique et vidéo via un point d’entrée natif du dépôt unique
  - Charge automatiquement les variables d’environnement provider manquantes depuis `~/.profile`
  - Restreint automatiquement chaque suite aux providers qui disposent actuellement d’une auth utilisable par défaut
  - Réutilise `scripts/test-live.mjs`, afin que le comportement Heartbeat et mode silencieux reste cohérent
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker se répartissent en deux catégories :

- Runners live-model : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live de clés de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker live utilisent par défaut une limite de smoke plus petite afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement le balayage exhaustif plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, puis la réutilise pour les deux voies Docker live.
- Runners smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, et `test:docker:plugins` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.

Les runners Docker live-model montent aussi uniquement les homes d’auth CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse rafraîchir les tokens sans modifier le store d’auth hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de binding ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais Codex app-server : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, scaffolding complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Réseau Gateway (deux conteneurs, auth WS + health) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Pont de canal MCP (Gateway amorcé + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke d’installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)

Les runners Docker live-model montent aussi le checkout courant en lecture seule et
le préparent dans un répertoire de travail temporaire dans le conteneur. Cela maintient l’image runtime
compacte tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les gros caches locaux uniquement et les sorties de build d’app telles que
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires `.build` locaux à l’app ou
de sortie Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live Gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute quand même `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
live Gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de discussion via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir extraire l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Docker.
Les exécutions réussies affichent un petit payload JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
amorcé, lance un second conteneur qui exécute `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièce jointe,
le comportement de file d’attente d’événements live, le routage d’envoi sortant, ainsi que les notifications de canal +
permissions de style Claude sur le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier expose.

Smoke manuel ACP en langage naturel sur fil (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/de débogage. Il peut être de nouveau nécessaire pour la validation du routage de fil ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et sans montages d’auth CLI externes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour des installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’auth CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés vers `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par provider ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les providers dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors des relances ne nécessitant pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du store de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification du nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de cohérence de la documentation

Exécutez les vérifications docs après des modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifications d’en-têtes dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sûre pour la CI)

Ce sont des régressions de « vrai pipeline » sans vrais providers :

- Tool calling Gateway (mock OpenAI, vraie boucle Gateway + agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écriture de config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité de l’agent (Skills)

Nous avons déjà quelques tests sûrs pour la CI qui se comportent comme des « évaluations de fiabilité de l’agent » :

- Tool-calling mock via la vraie boucle Gateway + agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant end-to-end qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont listés dans le prompt, l’agent choisit-il le bon Skill (ou évite-t-il ceux qui sont hors sujet) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session, et les limites du sandbox.

Les futures évaluations doivent d’abord rester déterministes :

- Un runner de scénarios utilisant des providers mock pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skill, et le câblage des sessions.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, filtrage, injection de prompt).
- Des évaluations live facultatives (opt-in, filtrées par environnement) seulement après la mise en place de la suite sûre pour la CI.

## Tests de contrat (forme des Plugins et canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré se conforme à son
contrat d’interface. Ils itèrent sur tous les Plugins découverts et exécutent une suite de
vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers partagés de jonction et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous touchez à des surfaces partagées de canal ou de provider.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de provider uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de binding de session
- **outbound-payload** - Structure du payload de message
- **inbound** - Gestion des messages entrants
- **actions** - Handlers d’actions de canal
- **threading** - Gestion des identifiants de fil
- **directory** - API d’annuaire/de roster
- **group-policy** - Application de la politique de groupe

### Contrats de statut de provider

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut de canal
- **registry** - Forme du registre de Plugins

### Contrats de provider

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat de flux d’auth
- **auth-choice** - Choix/sélection d’auth
- **catalog** - API de catalogue de modèles
- **discovery** - Découverte de Plugins
- **loader** - Chargement de Plugins
- **runtime** - Runtime du provider
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins de plugin-sdk
- Après ajout ou modification d’un Plugin de canal ou de provider
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (guide)

Lorsque vous corrigez un problème de provider/modèle découvert en live :

- Ajoutez si possible une régression sûre pour la CI (provider mock/stub, ou capture de la transformation exacte de la forme de requête)
- Si le problème est intrinsèquement live-only (limitations de débit, politiques d’auth), gardez le test live étroit et opt-in via des variables d’environnement
- Préférez cibler la couche la plus petite qui intercepte le bug :
  - bug de conversion/replay de requête provider → test direct de modèles
  - bug de pipeline Gateway session/historique/outils → smoke live Gateway ou test mock Gateway sûr pour la CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec de segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les identifiants de cible non classifiés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.

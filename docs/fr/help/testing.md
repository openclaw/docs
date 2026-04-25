---
read_when:
    - Exécution des tests en local ou en CI
    - Ajout de régressions pour les bogues de modèle/fournisseur
    - Débogage du comportement de Gateway + de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-25T13:49:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw dispose de trois suites Vitest (unitaires/intégration, e2e, live) et d’un petit ensemble
d’exécuteurs Docker. Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les flux de travail courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèle/fournisseur.

## Démarrage rapide

La plupart du temps :

- Porte complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de toute la suite sur une machine confortable : `pnpm test:max`
- Boucle directe Vitest watch : `pnpm test:watch`
- Le ciblage direct de fichier route maintenant aussi les chemins extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord des exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou voulez davantage de confiance :

- Porte de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage Docker live des modèles : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute maintenant un tour texte plus une petite sonde de style lecture de fichier.
    Les modèles dont les métadonnées annoncent l’entrée `image` exécutent aussi un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des défaillances fournisseur.
  - Couverture CI : le job quotidien `OpenClaw Scheduled Live And E2E Checks` et le job manuel
    `OpenClaw Release Checks` appellent tous deux le workflow live/E2E réutilisable avec
    `include_live_suites: true`, ce qui inclut des jobs matriciels Docker live de modèles séparés
    découpés par fournisseur.
  - Pour des reruns CI ciblés, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de version.
- Smoke natif Codex bound-chat : `pnpm test:docker:live-codex-bind`
  - Exécute une voie live Docker sur le chemin app-server Codex, lie un DM Slack synthétique
    avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison native du Plugin au lieu d’ACP.
- Smoke de commande de secours Crestodian : `pnpm test:live:crestodian-rescue-channel`
  - Vérification opt-in « ceinture et bretelles » pour la surface de commande de secours de canal de message.
    Elle exerce `/crestodian status`, met en file un changement de modèle persistant,
    répond `/crestodian yes`, et vérifie le chemin d’écriture audit/config.
- Smoke Docker du planificateur Crestodian : `pnpm test:docker:crestodian-planner`
  - Exécute Crestodian dans un conteneur sans configuration avec un faux Claude CLI sur `PATH`
    et vérifie que le repli de planificateur approximatif se traduit par une écriture typée de config auditée.
- Smoke Docker de première exécution Crestodian : `pnpm test:docker:crestodian-first-run`
  - Démarre à partir d’un répertoire d’état OpenClaw vide, route `openclaw` nu vers
    Crestodian, applique les écritures setup/modèle/agent/Plugin Discord + SecretRef,
    valide la config et vérifie les entrées d’audit. Le même chemin de configuration Ring 0 est
    aussi couvert dans QA Lab par
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription assistant stocke `usage.cost` normalisé.

Conseil : lorsque vous n’avez besoin que d’un seul cas défaillant, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Exécuteurs spécifiques QA

Ces commandes se placent à côté des suites de tests principales lorsque vous avez besoin du réalisme de QA Lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la porte de parité simulée, la voie live Matrix et
la voie live Telegram gérée par Convex comme jobs parallèles. `OpenClaw Release Checks`
exécute les mêmes voies avant l’approbation de version.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte des scénarios QA adossés au dépôt.
  - Exécute plusieurs scénarios sélectionnés en parallèle par défaut avec des
    workers Gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre
    de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    de fixtures et de simulation de protocole sans remplacer la voie `mock-openai`
    orientée scénario.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénario que `qa suite` sur l’hôte.
  - Réutilise les mêmes drapeaux de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de config du fournisseur live QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt pour que l’invité puisse écrire en retour via
    l’espace de travail monté.
  - Écrit le rapport + résumé QA normaux ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour un travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit un tarball npm à partir de l’extraction courante, l’installe globalement dans
    Docker, exécute l’intégration initiale non interactive avec clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances runtime à la demande,
    exécute doctor et exécute un tour d’agent local contre un point de terminaison OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même voie
    d’installation packagée avec Discord.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package OpenClaw publié dans Docker, exécute l’intégration initiale
    du package installé, configure Telegram via la CLI installée, puis réutilise la
    voie QA live Telegram avec ce package installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Utilise les mêmes identifiants d’environnement Telegram ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/version, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie comme workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Elle ne s’exécute pas lors d’une fusion. Le workflow utilise l’environnement
    `qa-live-shared` et des baux d’identifiants CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Packe et installe la build OpenClaw courante dans Docker, démarre Gateway
    avec OpenAI configuré, puis active les canaux/Plugins intégrés via des modifications de config.
  - Vérifie que la découverte setup laisse absentes les dépendances runtime des Plugins non configurés,
    que la première exécution configurée de Gateway ou doctor installe à la demande les dépendances runtime
    de chaque Plugin intégré, et qu’un second redémarrage ne réinstalle pas des dépendances
    déjà activées.
  - Installe aussi une base npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, puis vérifie que le
    doctor post-mise-à-jour du candidat répare les dépendances runtime des canaux intégrés sans
    réparation postinstall côté harnais.
- `pnpm test:parallels:npm-update`
  - Exécute le smoke natif de mise à jour d’installation packagée sur des invités Parallels. Chaque
    plateforme sélectionnée installe d’abord le package de base demandé, puis exécute la commande
    `openclaw update` installée dans le même invité et vérifie la version installée,
    l’état de mise à jour, l’état prêt de Gateway, et un tour d’agent local.
  - Utilisez `--platform macos`, `--platform windows`, ou `--platform linux` pendant l’itération sur un seul invité. Utilisez `--json` pour le chemin d’artefact du résumé et
    l’état par voie.
  - Encadrez les longues exécutions locales avec un délai hôte afin que les blocages de transport Parallels
    ne consomment pas le reste de la fenêtre de test :

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Le script écrit des journaux de voie imbriqués sous `/tmp/openclaw-parallels-npm-update.*`.
    Inspectez `windows-update.log`, `macos-update.log`, ou `linux-update.log`
    avant de supposer que le wrapper externe est bloqué.
  - La mise à jour Windows peut passer 10 à 15 minutes dans le doctor post-mise-à-jour/réparation
    des dépendances runtime sur un invité froid ; cela reste sain lorsque le journal de débogage npm imbriqué
    continue d’avancer.
  - N’exécutez pas ce wrapper agrégé en parallèle avec des voies smoke Parallels
    macOS, Windows ou Linux individuelles. Elles partagent l’état des VM et peuvent entrer en collision sur
    la restauration de snapshot, la mise à disposition de package ou l’état Gateway invité.
  - La preuve post-mise-à-jour exécute la surface normale des Plugins intégrés car
    les façades de capacité telles que la parole, la génération d’images et la
    compréhension des médias sont chargées via les API runtime intégrées même lorsque le
    tour d’agent lui-même ne vérifie qu’une simple réponse texte.

- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur local AIMock pour des tests smoke directs
    du protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/au développement. Les installations OpenClaw packagées n’embarquent pas
    `qa-lab`, elles n’exposent donc pas `openclaw qa`.
  - Les extractions du dépôt chargent directement l’exécuteur intégré ; aucune étape d’installation de Plugin
    séparée n’est nécessaire.
  - Provisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus un salon privé, puis démarre un processus enfant QA Gateway avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas de drapeaux partagés de source d’identifiants car la voie provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact observed-events et un journal de sortie combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
  - Émet la progression par défaut et applique un délai d’exécution strict avec `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (30 minutes par défaut). Le nettoyage est borné par `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` et les échecs incluent la commande de récupération `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un vrai groupe privé en utilisant les jetons de bot driver et SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant de groupe doit être l’identifiant numérique de discussion Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés partagés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour activer les baux mutualisés.
  - Se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez les artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT devant exposer un nom d’utilisateur Telegram.
  - Pour une observation stable bot-à-bot, activez le mode Bot-to-Bot Communication dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic de bot dans le groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact observed-messages sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT entre la requête d’envoi du driver et la réponse observée du SUT.

Les voies de transport live partagent un contrat standard unique afin que les nouveaux transports ne divergent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture des transports live.

| Voie     | Canary | Filtrage des mentions | Blocage par liste d’autorisation | Réponse de niveau supérieur | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | --------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                           | x                         | x            | x                | x                         |                 |
| Telegram | x      |                       |                                  |                             |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA Lab acquiert un bail exclusif dans un pool adossé à Convex, envoie un Heartbeat
pour ce bail pendant l’exécution de la voie, puis libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut d’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (`ci` par défaut en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex loopback en `http://` pour un développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste de pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `doctor` avant les exécutions live pour vérifier l’URL du site Convex, les secrets du broker,
le préfixe de point de terminaison, le délai HTTP et l’accessibilité admin/list sans afficher
les valeurs secrètes. Utilisez `--json` pour une sortie exploitable par machine dans les scripts et utilitaires CI.

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
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Protection de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de discussion Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à QA

L’ajout d’un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de niveau supérieur lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` possède les mécanismes hôtes partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécuteur possèdent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment Gateway est configuré pour ce transport
- comment la préparation est vérifiée
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

La barre d’adoption minimale pour un nouveau canal est :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur la couture hôte partagée `qa-lab`.
3. Conserver les mécanismes spécifiques au transport à l’intérieur du Plugin d’exécuteur ou du harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les Plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; le chargement paresseux de la CLI et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Conserver le fonctionnement des alias de compatibilité existants sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal unique, conservez-le dans ce Plugin d’exécuteur ou ce harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un assistant générique au lieu d’une branche spécifique au canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, conservez le scénario spécifique au transport et rendez cela explicite dans le contrat de scénario.

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

Les alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Les nouveaux travaux sur les canaux doivent utiliser les noms d’assistants génériques.
Les alias de compatibilité existent pour éviter une migration « flag day », pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de fragments `vitest.full-*.config.ts` et peuvent développer les fragments multi-projets en configurations par projet pour l’ordonnancement parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests Node `ui` autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification Gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bogues connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable

<AccordionGroup>
  <Accordion title="Projets, fragments et voies ciblées">

    - Les exécutions non ciblées de `pnpm test` utilisent douze petites configurations de fragments (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus géant de projet racine natif. Cela réduit le pic de RSS sur les machines chargées et évite que le travail auto-reply/extension n’affame des suites sans rapport.
    - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, car une boucle watch multi-fragments n’est pas pratique.
    - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` routent d’abord les cibles explicites de fichier/répertoire via des voies ciblées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine.
    - `pnpm test:changed` développe les chemins git modifiés dans ces mêmes voies ciblées lorsque le diff ne touche que des fichiers source/test routables ; les modifications de config/setup retombent toujours sur la relance large du projet racine.
    - `pnpm check:changed` est la porte locale intelligente normale pour un travail étroit. Elle classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de version et outillage, puis exécute les voies de typecheck/lint/test correspondantes. Les modifications du SDK Plugin public et du contrat de plugin incluent une passe de validation d’extension car les extensions dépendent de ces contrats core. Les hausses de version limitées aux métadonnées de version exécutent des vérifications ciblées de version/config/dépendances racine au lieu de la suite complète, avec une protection qui rejette les modifications de package hors du champ de version de niveau supérieur.
    - Les tests unitaires à import léger provenant des agents, commandes, Plugins, assistants auto-reply, `plugin-sdk` et zones utilitaires pures similaires sont routés via la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers à état/runtime lourd restent sur les voies existantes.
    - Certains fichiers source assistants `plugin-sdk` et `commands` sélectionnés font aussi correspondre les exécutions en mode changed à des tests frères explicites dans ces voies légères, afin que les modifications d’assistants évitent de relancer la suite lourde complète pour ce répertoire.
    - `auto-reply` dispose de trois compartiments dédiés : assistants core de niveau supérieur, tests d’intégration `reply.*` de niveau supérieur, et le sous-arbre `src/auto-reply/reply/**`. Cela maintient le travail du harnais de réponse le plus lourd hors des tests bon marché de statut/segmentation/jetons.

  </Accordion>

  <Accordion title="Couverture de l’exécuteur intégré">

    - Lorsque vous modifiez les entrées de découverte des outils de message ou le
      contexte de runtime de Compaction, conservez les deux niveaux de couverture.
    - Ajoutez des régressions d’assistants ciblées pour les limites pures de
      routage et de normalisation.
    - Gardez en bon état les suites d’intégration de l’exécuteur intégré :
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ces suites vérifient que les identifiants de portée et le comportement de Compaction continuent
      à passer par les vrais chemins `run.ts` / `compact.ts` ; les tests d’assistants seuls
      ne constituent pas un substitut suffisant à ces chemins d’intégration.

  </Accordion>

  <Accordion title="Valeurs par défaut du pool et de l’isolation Vitest">

    - La configuration Vitest de base utilise par défaut `threads`.
    - La configuration Vitest partagée fixe `isolate: false` et utilise
      l’exécuteur non isolé dans les projets racine, e2e et live.
    - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute aussi sur le
      même exécuteur partagé non isolé.
    - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false`
      depuis la configuration Vitest partagée.
    - `scripts/run-vitest.mjs` ajoute par défaut `--no-maglev` pour les
      processus Node enfants Vitest afin de réduire l’activité de compilation V8 lors des grandes exécutions locales.
      Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer avec le
      comportement V8 standard.

  </Accordion>

  <Accordion title="Itération locale rapide">

    - `pnpm changed:lanes` affiche quelles voies architecturales un diff déclenche.
    - Le hook pre-commit ne fait que du formatage. Il remet en scène les fichiers
      formatés et n’exécute ni lint, ni typecheck, ni tests.
    - Exécutez explicitement `pnpm check:changed` avant le transfert ou le push lorsque vous
      avez besoin de la porte locale intelligente. Les modifications du SDK Plugin public et du contrat de plugin
      incluent une passe de validation d’extension.
    - `pnpm test:changed` route via des voies ciblées lorsque les chemins modifiés
      correspondent proprement à une suite plus petite.
    - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
      simplement avec une limite de workers plus élevée.
    - L’auto-dimensionnement local des workers est volontairement conservateur et se retire
      lorsque la moyenne de charge de l’hôte est déjà élevée, afin que plusieurs exécutions
      Vitest concurrentes fassent moins de dégâts par défaut.
    - La configuration Vitest de base marque les projets/fichiers de configuration comme
      `forceRerunTriggers` afin que les reruns en mode changed restent corrects lorsque le câblage des tests change.
    - La configuration conserve `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les
      hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
      un emplacement de cache explicite unique pour un profilage direct.

  </Accordion>

  <Accordion title="Débogage des performances">

    - `pnpm test:perf:imports` active le rapport de durée d’import Vitest ainsi
      que la sortie de ventilation des imports.
    - `pnpm test:perf:imports:changed` limite cette même vue de profilage aux
      fichiers modifiés depuis `origin/main`.
    - Lorsqu’un test chaud passe encore l’essentiel de son temps dans les imports de démarrage,
      gardez les dépendances lourdes derrière une couture locale étroite `*.runtime.ts` et
      moquez directement cette couture au lieu de faire des imports profonds d’assistants runtime juste
      pour les passer à `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare la voie routée
      `test:changed` avec le chemin natif du projet racine pour ce diff validé et affiche
      le temps mur plus le max RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail sale actuel
      en routant la liste de fichiers modifiés via
      `scripts/test-projects.mjs` et la configuration Vitest racine.
    - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
      les surcoûts de démarrage et de transformation Vitest/Vite.
    - `pnpm test:perf:profile:runner` écrit des profils CPU+tas de l’exécuteur pour la
      suite unitaire avec le parallélisme de fichiers désactivé.

  </Accordion>
</AccordionGroup>

### Stabilité (Gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un worker
- Portée :
  - Démarre une vraie Gateway loopback avec diagnostics activés par défaut
  - Fait passer des perturbations synthétiques de messages, mémoire et grosses charges utiles Gateway par le chemin d’événement de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS Gateway
  - Couvre les assistants de persistance du bundle de stabilité des diagnostics
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression, et que les profondeurs de file par session retombent à zéro
- Attentes :
  - Sûr pour la CI et sans clés
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E de Plugins intégrés sous `extensions/`
- Valeurs par défaut du runtime :
  - Utilise Vitest `threads` avec `isolate: false`, conformément au reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût d’E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (limité à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver une sortie console détaillée.
- Portée :
  - Comportement end-to-end Gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage Node, et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre une Gateway OpenShell isolée sur l’hôte via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement canonique distant du système de fichiers via le pont fs du sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale plus un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit la Gateway et le sandbox de test
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors d’une exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou un script wrapper non par défaut

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live de Plugins intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement des limites de débit
- Attentes :
  - Pas stable en CI par conception (vrais réseaux, vraies politiques fournisseur, quotas, pannes)
  - Coûte de l’argent / utilise les limites de débit
  - Préférez exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent tout de même `HOME` et copient le matériel de config/auth dans un home de test temporaire afin que les fixtures unitaires ne puissent pas muter votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` adopte maintenant par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime la notification supplémentaire `~/.profile` et coupe les journaux de bootstrap Gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer l’intégralité des journaux de démarrage.
- Rotation de clé API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limite de débit.
- Sortie progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression sur stderr afin que les longs appels fournisseur restent visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeat de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Si vous touchez au réseau Gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / défaillances spécifiques au fournisseur / appel d’outils : exécutez un `pnpm test:live` restreint

## Tests live (touchant le réseau)

Pour la matrice live de modèles, les smokes de backend CLI, les smokes ACP, le harnais
app-server Codex, et tous les tests live de fournisseur média (Deepgram, BytePlus, ComfyUI, image,
musique, vidéo, harnais média) — ainsi que la gestion des identifiants pour les exécutions live — voir
[Tests — suites live](/fr/help/testing-live).

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se divisent en deux catégories :

- Exécuteurs de modèles live : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live à clé de profil correspondant à l’intérieur de l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration et votre espace de travail locaux (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker live utilisent par défaut un plafond smoke plus petit afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement le scan exhaustif plus large.
- `test:docker:all` construit l’image Docker live une fois via `test:docker:live-build`, puis la réutilise pour les voies Docker live. Il construit aussi une image partagée `scripts/e2e/Dockerfile` via `test:docker:e2e-build` et la réutilise pour les exécuteurs smoke E2E en conteneur qui exercent l’application construite. L’agrégat utilise un ordonnanceur local pondéré : `OPENCLAW_DOCKER_ALL_PARALLELISM` contrôle les emplacements de processus, tandis que des plafonds de ressources empêchent que les voies live lourdes, d’installation npm et multi-services ne démarrent toutes en même temps. Les valeurs par défaut sont 10 emplacements, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; n’ajustez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` que lorsque l’hôte Docker a plus de marge. L’exécuteur effectue par défaut un préflight Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état toutes les 30 secondes, stocke les timings des voies réussies dans `.artifacts/docker-tests/lane-timings.json`, et utilise ces timings pour démarrer en premier les voies plus longues lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste pondéré des voies sans construire ni exécuter Docker.
- Exécuteurs smoke en conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, et `test:docker:config-reload` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker de modèles live montent aussi seulement les homes d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth de CLI externe puisse actualiser les jetons sans muter le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke ACP bind : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh` ; couvre Claude, Codex et Gemini par défaut, avec couverture OpenCode stricte via `pnpm test:docker:live-acp-bind:opencode`)
- Smoke de backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’intégration initiale (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball onboarding/channel/agent : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker le tarball OpenClaw packé, configure OpenAI via l’intégration initiale par référence d’environnement plus Telegram par défaut, vérifie que doctor répare les dépendances runtime du Plugin activé, et exécute un tour d’agent OpenAI simulé. Réutilisez un tarball préconstruit avec `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` packe l’arbre courant, l’installe avec `bun install -g` dans un home isolé, et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images intégrés au lieu de se bloquer. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la construction hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un cache npm unique entre ses conteneurs root, update et direct-npm. Le smoke de mise à jour utilise par défaut npm `latest` comme base stable avant la mise à niveau vers le tarball candidat. Les vérifications de l’installateur non-root conservent un cache npm isolé afin que les entrées de cache appartenant à root ne masquent pas le comportement d’installation locale utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm entre les reruns locaux.
- La CI Install Smoke ignore la mise à jour globale directe npm dupliquée avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Smoke CLI de suppression d’agents avec espace de travail partagé : `pnpm test:docker:agents-delete-shared-workspace` (script : `scripts/e2e/agents-delete-shared-workspace-docker.sh`) construit par défaut l’image Dockerfile racine, amorce deux agents avec un espace de travail dans un home de conteneur isolé, exécute `agents delete --json`, puis vérifie un JSON valide ainsi que le comportement de conservation de l’espace de travail. Réutilisez l’image install-smoke avec `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Régression minimale de raisonnement OpenAI Responses `web_search` : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` relève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway amorcée + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP intégrés Pi (vrai serveur MCP stdio + smoke d’autorisation/refus de profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/subagent (vraie Gateway + destruction d’un enfant MCP stdio après des exécutions cron isolées et one-shot subagent) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke d’installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
- Smoke inchangé de mise à jour de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances runtime des Plugins intégrés : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image d’exécuteur Docker, construit et packe OpenClaw une fois sur l’hôte, puis monte ce tarball dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une nouvelle construction locale avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers un tarball existant avec `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. L’agrégat Docker complet pré-packe ce tarball une fois, puis découpe les vérifications des canaux intégrés en voies indépendantes, y compris des voies de mise à jour séparées pour Telegram, Discord, Slack, Feishu, memory-lancedb et ACPX. Utilisez `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` pour restreindre la matrice de canaux lors d’une exécution directe de la voie intégrée, ou `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` pour restreindre le scénario de mise à jour. La voie vérifie aussi que `channels.<id>.enabled=false` et `plugins.entries.<id>.enabled=false` suppriment la réparation doctor/dépendance runtime.
- Restreignez les dépendances runtime des Plugins intégrés pendant l’itération en désactivant les scénarios sans rapport, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image partagée de l’application construite :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image spécifiques à une suite tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gardent toujours la priorité lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et installateur conservent leurs propres Dockerfiles car ils valident le comportement de package/installation plutôt que le runtime partagé de l’application construite.

Les exécuteurs Docker de modèles live montent aussi l’extraction courante en lecture seule et
la copient dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela permet de garder l’image runtime
légère tout en exécutant Vitest contre votre source/config locale exacte.
L’étape de copie ignore les gros caches locaux uniquement et les sorties de build d’application telles que
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires `.build` ou
de sortie Gradle locaux à l’application, afin que les exécutions Docker live ne passent pas
des minutes à copier des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live Gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. à l’intérieur du conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous avez besoin de restreindre ou d’exclure la couverture
live Gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de discussion via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway amorcé,
démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièces jointes,
le comportement de la file d’événements live, le routage d’envoi sortant, et les notifications
de canal + d’autorisation de style Claude sur le vrai pont MCP stdio. La vérification
des notifications inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier expose.
`test:docker:pi-bundle-mcp-tools` est déterministe et n’a pas besoin d’une
clé de modèle live. Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
à l’intérieur du conteneur, matérialise ce serveur via le runtime bundle
MCP Pi intégré, exécute l’outil, puis vérifie que `coding` et `messaging` conservent
les outils `bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et n’a pas besoin d’une clé de modèle live.
Il démarre une Gateway amorcée avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant one-shot `/subagents spawn`, puis vérifie que
le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP de fil en langage naturel (pas CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les flux de travail de régression/débogage. Il peut être à nouveau nécessaire pour la validation du routage de fil ACP ; ne le supprimez donc pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et aucun montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions de fournisseur restreintes ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de reruns qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer l’invite de vérification nonce utilisée par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de la documentation

Exécutez les vérifications de documentation après des modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sûre pour la CI)

Ce sont des régressions de « pipeline réel » sans vrais fournisseurs :

- Appel d’outil Gateway (OpenAI simulé, vraie Gateway + boucle d’agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écritures de config + auth imposées) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests sûrs pour la CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outil simulé via la vraie Gateway + boucle d’agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour Skills (voir [Skills](/fr/tools/skills)) :

- **Décision** : lorsque des Skills sont listées dans l’invite, l’agent choisit-il la bonne Skill (ou évite-t-il les non pertinentes) ?
- **Conformité** : l’agent lit-il `SKILL.md` avant usage et suit-il les étapes/arguments requis ?
- **Contrats de flux de travail** : scénarios multi-tours qui vérifient l’ordre des outils, le report de l’historique de session, et les limites de sandbox.

Les évaluations futures doivent rester d’abord déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers Skill et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, contrôle, injection d’invite).
- Des évaluations live facultatives (opt-in, conditionnées par l’environnement) seulement après la mise en place de la suite sûre pour la CI.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré se conforme à son
contrat d’interface. Ils itèrent sur tous les Plugins découverts et exécutent une suite
de vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore intentionnellement ces fichiers de couture partagée et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous touchez à des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - forme de Plugin de base (id, nom, capacités)
- **setup** - contrat de l’assistant de configuration
- **session-binding** - comportement de liaison de session
- **outbound-payload** - structure de charge utile de message
- **inbound** - gestion des messages entrants
- **actions** - gestionnaires d’actions de canal
- **threading** - gestion des identifiants de fil
- **directory** - API de répertoire/liste
- **group-policy** - application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - sondes d’état de canal
- **registry** - forme du registre de Plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - contrat de flux d’authentification
- **auth-choice** - choix/sélection de l’authentification
- **catalog** - API de catalogue de modèles
- **discovery** - découverte de Plugins
- **loader** - chargement de Plugins
- **runtime** - runtime du fournisseur
- **shape** - forme/interface du Plugin
- **wizard** - assistant de configuration

### Quand les exécuter

- Après modification des exportations ou sous-chemins de `plugin-sdk`
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (conseils)

Lorsque vous corrigez un problème fournisseur/modèle découvert en live :

- Ajoutez si possible une régression sûre pour la CI (fournisseur simulé/mocké, ou capture de la transformation exacte de forme de requête)
- Si c’est intrinsèquement live-only (limites de débit, politiques d’authentification), gardez le test live étroit et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui attrape le bogue :
  - bogue de conversion/rejeu de requête fournisseur → test direct de modèles
  - bogue de session/historique/pipeline d’outils Gateway → smoke live Gateway ou test mock Gateway sûr pour la CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef depuis les métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec à segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les identifiants de cible non classifiés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.

## Liens associés

- [Tests live](/fr/help/testing-live)
- [CI](/fr/ci)

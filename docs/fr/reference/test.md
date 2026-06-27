---
read_when:
    - Exécuter ou corriger les tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-06-27T18:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, live, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages de plugins : [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

- Ordre habituel des tests locaux :
  1. `pnpm test:changed` pour une preuve Vitest limitée au périmètre modifié.
  2. `pnpm test <path-or-filter>` pour un fichier, un répertoire ou une cible explicite.
  3. `pnpm test` uniquement lorsque vous avez volontairement besoin de toute la suite Vitest locale.
- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port Gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez-le lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une porte de couverture de la voie unitaire par défaut, pas d’une couverture de tout le dépôt et de tous les fichiers. Les seuils sont de 70 % pour lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false et que la voie par défaut limite les inclusions de couverture aux tests unitaires non rapides avec des fichiers source frères, la porte mesure le source possédé par cette voie plutôt que chaque import transitif qu’elle charge par hasard.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des mappages source explicites et du graphe d’import local. Les modifications larges de configuration/paquet sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution explicite large des tests modifiés. Utilisez-la lorsqu’une modification de harnais de test/configuration/paquet doit revenir au comportement plus large de tests modifiés de Vitest.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff avec `origin/main`.
- `pnpm check:changed` : délègue par défaut à Crabbox/Testbox hors CI, puis exécute la porte de vérification intelligente des changements pour le diff avec `origin/main` dans l’enfant distant. Elle exécute les commandes de vérification de types, lint et garde pour les voies architecturales affectées, mais n’exécute pas de tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite pour la preuve par tests.
- Worktrees Codex et checkouts liés/fragmentaires : évitez les `pnpm test*`, `pnpm check*` et `pnpm crabbox:run` locaux directs sauf si vous avez vérifié que pnpm ne réconciliera pas les dépendances. Pour une preuve minuscule sur fichier explicite, utilisez `node scripts/run-vitest.mjs <path-or-filter>` ; pour les portes de changement ou une preuve large, utilisez `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` afin que pnpm s’exécute dans Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>` : conserve la sérialisation des vérifications lourdes dans le worktree courant au lieu du répertoire Git commun pour des commandes comme `pnpm check:changed` et `pnpm test ...` ciblé. Utilisez-le uniquement sur des hôtes locaux à haute capacité lorsque vous exécutez volontairement des vérifications indépendantes sur plusieurs worktrees liés.
- `pnpm test` : route les cibles explicites de fichiers/répertoires via des voies Vitest limitées. Les exécutions sans cible sont une preuve de suite complète : elles utilisent des groupes de shards fixes, se développent en configurations feuilles pour l’exécution parallèle locale et affichent l’éventail attendu des shards locaux avant de démarrer. Le groupe d’extensions se développe toujours en configurations de shard par extension au lieu d’un seul énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de configuration, d’un espace de travail, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolé.
- `pnpm test:env-mutations:report` : rapport non bloquant des tests et harnais qui modifient directement `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou les clés d’environnement OpenClaw associées. Utilisez-le pour trouver des candidats à migrer vers l’assistant d’état de test partagé.
- E2E simulée de l’interface de contrôle : utilisez `pnpm test:ui:e2e` pour la voie Vitest + Playwright qui démarre l’interface de contrôle Vite et pilote une vraie page Chromium contre un WebSocket Gateway simulé. Les tests résident dans `ui/src/**/*.e2e.test.ts` ; les mocks et contrôles partagés résident dans `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclut cette voie. Dans les worktrees Codex, préférez `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` pour une petite preuve ciblée après installation des dépendances, ou Testbox/Crabbox pour une preuve GUI plus large.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E de niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture des logs et d’un nettoyage au même endroit.
- Tests TUI PTY : utilisez `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` pour la voie PTY rapide avec faux backend. Utilisez `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` pour le smoke plus lent `tui --local`, qui ne simule que le point de terminaison externe du modèle. Affirmez du texte visible stable ou des appels de fixtures, pas des instantanés ANSI bruts.
- Assistants E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node plus récents de traiter `--env-file` comme un indicateur Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de l’entrypoint, le démarrage OpenAI simulé, le lancement Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export d’environnement d’état, les dumps de logs et le nettoyage des processus.
- Les exécutions complètes, d’extension et de shard par motif d’inclusion mettent à jour les données de chronométrage locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration entière utilisent ces chronométrages pour équilibrer les shards lents et rapides. Les shards CI par motif d’inclusion ajoutent le nom du shard à la clé de chronométrage, ce qui garde les chronométrages de shards filtrés visibles sans remplacer les données de chronométrage de configuration entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artifact de chronométrage local.
- Les fichiers de test `plugin-sdk` et `commands` sélectionnés passent désormais par des voies légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds en runtime sur leurs voies existantes.
- Les fichiers source avec tests frères correspondent à ce frère avant de revenir à des globs de répertoires plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement tous les shards lorsque le chemin de dépendance est précis.
- `auto-reply` se divise désormais aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jetons/assistants de niveau supérieur.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extension/Plugin. Les Plugins de canal lourds, le Plugin de navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de Plugins restent groupés. Utilisez `pnpm test extensions/<id>` pour une voie de Plugin groupé unique.
- `pnpm test:perf:imports` : active les rapports de durée d’import Vitest + répartition des imports, tout en utilisant encore le routage de voies limitées pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare les performances du chemin routé en mode changements à l’exécution native du projet racine pour le même diff Git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure les performances de l’ensemble de changements du worktree courant sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + tas pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de la suite complète en série et écrit des données de durée groupées ainsi que des artifacts JSON/log par configuration. Le Test Performance Agent l’utilise comme base avant de tenter des correctifs de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- `pnpm test:docker:timings <summary.json>` inspecte les voies Docker lentes après une exécution Docker complète ; utilisez `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblée peu coûteuses à partir des mêmes artifacts.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute l’agrégat E2E du dépôt : tests smoke Gateway de bout en bout plus la voie E2E navigateur simulée de l’interface de contrôle.
- `pnpm test:e2e:gateway` : exécute les tests smoke Gateway de bout en bout (appariement multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs verbeux.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` propre au fournisseur) pour lever le saut.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une seule fois sous forme d’archive npm, construit/réutilise une image de runner Node/Git minimale ainsi qu’une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les voies de test rapide Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation, de mise à jour et de dépendances de Plugin ; ces voies montent l’archive préconstruite au lieu d’utiliser des sources du dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies normales de fonctionnalité de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur local/CI et valide l’archive ainsi que `dist/postinstall-inventory.json` avant leur consommation par Docker. Les définitions des voies Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur réside dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI appartenant à l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins en paquet/image live, les scénarios d’état et les vérifications d’identifiants, sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool final sensible aux fournisseurs et vaut 10 par défaut. Les plafonds des voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs limitent par défaut à une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le plafond effectif de poids ou de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécuter seule jusqu’à libérer sa capacité. Les démarrages de voies sont espacés de 2 secondes par défaut pour éviter des rafales de création sur le démon Docker local ; remplacez ce réglage avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner prévalide Docker par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI des fournisseurs entre voies compatibles, retente une fois par défaut les défaillances transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les durées des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des durées. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les voies déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les voies de fournisseurs live uniquement ; les alias de paquet sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live uniquement fusionne les voies live principales et finales dans un seul pool ordonné du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles voies en pool après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un délai de secours de 120 minutes, remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/finales sélectionnées utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par voie, `summary.json`, `failures.json` et les durées de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre un CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep`, puis vérifie que les instantanés de rôles CDP incluent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frame.
- `pnpm test:docker:skill-install` : installe l’archive OpenClaw empaquetée dans un runner Docker minimal, désactive `skills.install.allowUploadedArchives`, résout un slug de skill actuel depuis la recherche live ClawHub, l’installe via `openclaw skills install`, puis vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.
- Les sondes Docker live du backend CLI peuvent être exécutées sous forme de voies ciblées, par exemple `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` ou `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini dispose d’alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI conteneurisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute une vraie discussion relayée via `/api/chat/completions`. Nécessite une clé de modèle live utilisable, récupère une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage des envois sortants et les notifications de canal + autorisation de style Claude via le véritable pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le test rapide reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive OpenClaw empaquetée par-dessus un fixture d’ancien utilisateur sale, exécute la mise à jour du paquet ainsi que doctor non interactif sans clés de fournisseur live ni de canal, puis démarre un Gateway en local loopback et vérifie que les agents, la configuration des canaux, les listes d’autorisation de Plugin, les fichiers d’espace de travail/session, l’état obsolète des dépendances de Plugin héritées, le démarrage et l’état RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers d’utilisateur existant réalistes sans clés de fournisseur live ni de canal, configure cette base avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers l’archive OpenClaw empaquetée, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en local loopback et vérifie que les intentions configurées, les fichiers d’espace de travail/session, la configuration de Plugin obsolète et l’état des dépendances héritées, le démarrage, `/healthz`, `/readyz` et l’état RPC survivent ou se réparent proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice locale exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, par exemple `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour vérifier que les Plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau, et `stale-source-plugin-shadow` pour empêcher les masquages de Plugins présents uniquement dans les sources de casser le démarrage. Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, et résout les jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23` avant de transmettre les spécifications exactes de paquet aux voies Docker.
- `pnpm test:docker:update-migration` : exécute le harnais published-upgrade survivor dans le scénario fortement axé sur le nettoyage `plugin-deps-cleanup`, en partant de `openclaw@2026.4.23` par défaut. Le workflow distinct `Update Migration` développe cette voie avec `baselines=all-since-2026.4.23` afin que chaque paquet stable publié depuis `.23` soit mis à jour vers le candidat et prouve le nettoyage des dépendances de Plugin configurées hors de Full Release CI.
- `pnpm test:docker:plugins` : exécute un test rapide d’installation/mise à jour pour le chemin local, `file:`, les paquets de registre npm avec dépendances hissées, les références git mobiles, les fixtures ClawHub, les mises à jour de marketplace et l’activation/inspection du bundle Claude.

## Contrôle local de PR

Pour les contrôles locaux de validation/intégration de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes avec mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : "Répondez avec un seul mot : ok. Aucune ponctuation ni texte supplémentaire."

Dernière exécution (2025-12-31, 20 exécutions) :

- médiane minimax 1279 ms (min 1114, max 2431)
- médiane opus 2454 ms (min 1224, max 3170)

## Banc de démarrage CLI

Script : [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Utilisation :

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Préréglages :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux préréglages

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux et les résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent les profils V8 par exécution afin que le minutage et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artéfact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artéfact de suite complète dans `.artifacts/cli-startup-bench-all.json` en utilisant `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` en utilisant `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## Banc de démarrage du Gateway

Script : [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Le benchmark utilise par défaut l’entrée CLI construite à `dist/entry.js` ; exécutez
`pnpm build` avant d’utiliser les commandes de scripts du package. Pour mesurer
plutôt le runner source, passez `--entry scripts/run-node.mjs` et gardez ces
résultats séparés des références de l’entrée construite.

Utilisation :

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Identifiants de cas :

- `default` : démarrage normal du Gateway.
- `skipChannels` : démarrage du Gateway avec le démarrage des canaux ignoré.
- `oneInternalHook` : un hook interne configuré.
- `allInternalHooks` : tous les hooks internes.
- `fiftyPlugins` : 50 plugins de manifeste.
- `fiftyStartupLazyPlugins` : 50 plugins de manifeste à démarrage différé.

La sortie inclut la première sortie du processus, `/healthz`, `/readyz`, l’heure du journal d’écoute HTTP,
l’heure du journal de disponibilité du Gateway, le temps CPU, le ratio de cœurs CPU, le RSS maximal, le tas, les
métriques de trace de démarrage, le délai de boucle d’événements et les métriques détaillées de la table de recherche des plugins. Le script
active `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dans l’environnement du Gateway enfant.

Lisez `/healthz` comme liveness : le serveur HTTP peut répondre. Lisez `/readyz` comme
disponibilité utilisable : les sidecars des plugins de démarrage, les canaux et le travail
post-attache critique pour la disponibilité sont stabilisés. Les hooks de démarrage du Gateway sont distribués
de façon asynchrone et ne font pas partie de la garantie de disponibilité. L’heure du journal de disponibilité est l’horodatage
interne du journal de disponibilité du Gateway ; elle est utile pour l’attribution côté processus,
mais ne remplace pas la sonde externe `/readyz`.

Utilisez la sortie JSON ou `--output` lorsque vous comparez des changements. Utilisez `--cpu-prof-dir` uniquement
après que la sortie de trace pointe vers un import, une compilation ou un travail limité par le CPU qui ne peut pas
être expliqué par les seuls minutages de phase. Ne comparez pas les résultats du runner source aux
résultats `dist/entry.js` construits comme s’il s’agissait de la même référence.

## Banc de redémarrage du Gateway

Script : [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Le benchmark de redémarrage est pris en charge uniquement sur macOS et Linux. Il utilise SIGUSR1 pour
les redémarrages dans le processus et échoue immédiatement sous Windows.

Le benchmark utilise par défaut l’entrée CLI construite à `dist/entry.js` ; exécutez
`pnpm build` avant d’utiliser les commandes de scripts du package. Pour mesurer
plutôt le runner source, passez `--entry scripts/run-node.mjs` et gardez ces
résultats séparés des références de l’entrée construite.

Utilisation :

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Identifiants de cas :

- `skipChannels` : redémarrage avec les canaux ignorés.
- `skipChannelsAcpxProbe` : redémarrage avec les canaux ignorés et la sonde de démarrage ACPX activée.
- `skipChannelsNoAcpxProbe` : redémarrage avec les canaux ignorés et la sonde de démarrage ACPX désactivée.
- `default` : redémarrage normal.
- `fiftyPlugins` : redémarrage avec 50 plugins de manifeste.

La sortie inclut les prochains `/healthz`, prochains `/readyz`, le temps d’indisponibilité, le minutage de disponibilité au redémarrage,
le CPU, le RSS, les métriques de trace de démarrage pour le processus de remplacement et les métriques de trace de redémarrage
pour la gestion du signal, le drainage du travail actif, les phases de fermeture, le prochain démarrage, le minutage de disponibilité
et les instantanés mémoire. Le script active
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` et `OPENCLAW_GATEWAY_RESTART_TRACE=1` dans
l’environnement du Gateway enfant.

Utilisez ce benchmark lorsqu’un changement touche la signalisation de redémarrage, les gestionnaires de fermeture,
le démarrage après redémarrage, l’arrêt des sidecars, le transfert de service ou la disponibilité après
redémarrage. Commencez par `skipChannels` lorsque vous isolez la mécanique du Gateway du démarrage des canaux. Utilisez `default` ou les cas chargés en plugins uniquement après que le cas étroit explique
le chemin de redémarrage.

Les métriques de trace sont des indices d’attribution, pas des verdicts. Un changement de redémarrage doit être
jugé à partir de plusieurs échantillons, du span propriétaire correspondant, du comportement de `/healthz` et `/readyz`,
et du contrat de redémarrage visible par l’utilisateur.

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests de smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Vérifie que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Connexe

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et plugins](/fr/help/testing-updates-plugins)

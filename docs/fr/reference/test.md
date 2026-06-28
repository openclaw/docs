---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-06-28T00:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, live, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages de plugins : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

- Ordre habituel des tests locaux :
  1. `pnpm test:changed` pour une preuve Vitest limitée au périmètre modifié.
  2. `pnpm test <path-or-filter>` pour un fichier, un répertoire ou une cible explicite.
  3. `pnpm test` uniquement lorsque vous avez volontairement besoin de toute la suite Vitest locale.
- `pnpm test:force` : tue tout processus gateway persistant qui occupe le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez-le lorsqu’une exécution gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 via `vitest.unit.config.ts`. Il s’agit d’une porte de couverture de la voie unitaire par défaut, pas d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false et que la voie par défaut limite les inclusions de couverture aux tests unitaires non rapides ayant des fichiers source frères, la porte mesure le source possédé par cette voie au lieu de chaque import transitif qu’elle charge par hasard.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des correspondances source explicites et du graphe d’import local. Les changements larges de configuration ou de package sont ignorés sauf s’ils correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution explicite large des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test, de la configuration ou d’un package doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : délègue par défaut à Crabbox/Testbox hors CI, puis exécute la porte de vérification intelligente des changements pour le diff par rapport à `origin/main` dans l’enfant distant. Elle exécute le typecheck, le lint et les commandes de garde pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test.
- Worktrees Codex et checkouts liés/épars : évitez les `pnpm test*`, `pnpm check*` et `pnpm crabbox:run` locaux directs sauf si vous avez vérifié que pnpm ne réconciliera pas les dépendances. Pour une preuve minuscule sur fichier explicite, utilisez `node scripts/run-vitest.mjs <path-or-filter>` ; pour les portes de changements ou une preuve large, utilisez `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` afin que pnpm s’exécute dans Testbox.
- Preuve Testbox via Crabbox : utilisez le `exitCode` final du wrapper et le JSON de durée comme résultat de commande. L’exécution Blacksmith GitHub Actions déléguée peut afficher `cancelled` après une commande SSH réussie parce que la Testbox est arrêtée depuis l’extérieur de l’action keepalive ; vérifiez le résumé du wrapper et la sortie de commande avant de traiter cela comme un échec de test.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>` : maintient la sérialisation des vérifications lourdes dans le worktree courant au lieu du répertoire Git commun pour des commandes comme `pnpm check:changed` et les `pnpm test ...` ciblés. Utilisez-le uniquement sur des hôtes locaux à forte capacité lorsque vous exécutez volontairement des vérifications indépendantes dans plusieurs worktrees liés.
- `pnpm test` : route les cibles explicites de fichiers/répertoires via des voies Vitest limitées au périmètre. Les exécutions sans cible sont une preuve de suite complète : elles utilisent des groupes de shards fixes, s’étendent aux configurations feuille pour l’exécution parallèle locale et affichent le fanout de shards local attendu avant de démarrer. Le groupe d’extensions s’étend toujours aux configurations de shard par extension au lieu d’un seul énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un bref résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuration, workspace, répertoire d’agent ou magasin de profils d’authentification isolé.
- `pnpm test:env-mutations:report` : rapport non bloquant des tests et harnais qui modifient directement `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou des clés d’environnement OpenClaw liées. Utilisez-le pour trouver des candidats à la migration vers l’assistant d’état de test partagé.
- E2E simulé de l’interface de contrôle : utilisez `pnpm test:ui:e2e` pour la voie Vitest + Playwright qui démarre l’interface de contrôle Vite et pilote une vraie page Chromium contre un WebSocket Gateway simulé. Les tests vivent dans `ui/src/**/*.e2e.test.ts` ; les mocks et contrôles partagés vivent dans `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclut cette voie. Dans les worktrees Codex, préférez `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` pour une petite preuve ciblée après installation des dépendances, ou Testbox/Crabbox pour une preuve GUI plus large.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E au niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture des journaux et du nettoyage au même endroit.
- Tests PTY TUI : utilisez `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` pour la voie PTY rapide à faux backend. Utilisez `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` pour le smoke `tui --local` plus lent, qui ne simule que le point de terminaison de modèle externe. Vérifiez du texte visible stable ou des appels de fixtures, pas des snapshots ANSI bruts.
- Assistants E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un indicateur Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution du point d’entrée, le démarrage simulé d’OpenAI, le lancement du Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les dumps de journaux et le nettoyage des processus.
- Les exécutions de shards complètes, d’extensions et à motif d’inclusion mettent à jour les données de durée locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration entière utilisent ces durées pour équilibrer les shards lents et rapides. Les shards CI à motif d’inclusion ajoutent le nom du shard à la clé de durée, ce qui garde visibles les durées de shards filtrés sans remplacer les données de durée de configuration entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de durées.
- Certains fichiers de test `plugin-sdk` et `commands` sélectionnés passent maintenant par des voies légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds côté runtime sur leurs voies existantes.
- Les fichiers source ayant des tests frères correspondent à ce frère avant de revenir à des globs de répertoire plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` est maintenant aussi divisé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jetons/assistants au niveau supérieur.
- La configuration Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent groupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin groupé unique.
- `pnpm test:perf:imports` : active les rapports de durée d’import + ventilation des imports de Vitest, tout en utilisant encore le routage par voie limitée au périmètre pour les cibles explicites de fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin du mode modifié routé par rapport à l’exécution native du projet racine pour le même diff Git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de changements du worktree courant sans validation préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de suite complète en série et écrit les données de durée groupées ainsi que les artefacts JSON/journaux par configuration. Le Test Performance Agent l’utilise comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après un changement axé sur les performances.
- `pnpm test:docker:timings <summary.json>` inspecte les voies Docker lentes après une exécution Docker complète ; utilisez `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées peu coûteuses à partir des mêmes artefacts.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute l’agrégat E2E du dépôt : tests smoke Gateway end-to-end plus la voie E2E navigateur simulée de l’interface de contrôle.
- `pnpm test:e2e:gateway` : exécute les tests smoke Gateway end-to-end (appariement multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` ou un `*_LIVE_TEST=1` propre au fournisseur pour ne pas être ignoré.
- `pnpm test:docker:all` : construit l’image partagée de test live, emballe OpenClaw une seule fois sous forme de tarball npm, construit/réutilise une image d’exécution Node/Git nue ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les voies de smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un planificateur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendances de Plugin ; ces voies montent le tarball préconstruit au lieu d’utiliser des sources de dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normales de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique emballeur de package local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant leur consommation par Docker. Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par le planificateur pour les voies sélectionnées, les types d’images, les besoins en package/image live, les scénarios d’état et les vérifications d’identifiants, sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds des voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds par fournisseur valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le plafond effectif de poids ou de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages des voies sont espacés de 2 secondes par défaut afin d’éviter les tempêtes de création du démon Docker local ; remplacez ce réglage avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. L’exécuteur prévalide Docker par défaut, nettoie les conteneurs OpenClaw E2E obsolètes, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre voies compatibles, retente une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les temps des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les seules voies déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les seules voies de fournisseurs live ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live uniquement fusionne les voies live principales et de fin dans un seul pool du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. L’exécuteur cesse de planifier de nouvelles voies groupées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un délai d’expiration de secours de 120 minutes, remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai d’expiration via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par voie, `summary.json`, `failures.json` et les timings de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées et peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source reposant sur Chromium, démarre CDP brut plus un Gateway isolé, exécute `browser doctor --deep` et vérifie que les instantanés de rôle CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- `pnpm test:docker:skill-install` : installe le tarball OpenClaw emballé dans un exécuteur Docker nu, désactive `skills.install.allowUploadedArchives`, résout un slug de skill actuel depuis la recherche live ClawHub, l’installe via `openclaw skills install`, puis vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` ou `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini dispose d’alias `:resume` et `:mcp` équivalents.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dans Docker, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable, télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, les lectures de transcription, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage d’envoi sortant et les notifications de canal et de permissions de style Claude via le véritable pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe le tarball OpenClaw emballé par-dessus un fixture d’ancien utilisateur sale, exécute la mise à jour du package plus doctor non interactif sans clés de fournisseur live ni de canal, puis démarre un Gateway en boucle locale et vérifie que les agents, la configuration de canal, les listes d’autorisation de Plugins, les fichiers d’espace de travail/session, l’état obsolète des dépendances de Plugin héritées, le démarrage et l’état RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur live ni de canal, configure cette base avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers le tarball OpenClaw emballé, exécute doctor non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie que les intents configurés, les fichiers d’espace de travail/session, la configuration de Plugin obsolète et l’état hérité des dépendances, le démarrage, `/healthz`, `/readyz` et l’état RPC survivent ou se réparent proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice locale exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour vérifier que les Plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau et `stale-source-plugin-shadow` pour empêcher les ombres de Plugins disponibles uniquement en source de casser le démarrage. Package Acceptance expose ces paramètres sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, et résout les jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23` avant de transmettre les spécifications exactes de package aux voies Docker.
- `pnpm test:docker:update-migration` : exécute le harnais published-upgrade survivor dans le scénario `plugin-deps-cleanup`, intensif en nettoyage, en commençant à `openclaw@2026.4.23` par défaut. Le workflow séparé `Update Migration` développe cette voie avec `baselines=all-since-2026.4.23` afin que chaque package stable publié depuis `.23` soit mis à jour vers le candidat et prouve le nettoyage des dépendances de Plugins configurées en dehors de Full Release CI.
- `pnpm test:docker:plugins` : exécute le smoke d’installation/mise à jour pour le chemin local, les packages `file:`, les packages du registre npm avec dépendances hissées, les refs git mobiles, les fixtures ClawHub, les mises à jour de marketplace et l’activation/inspection du bundle Claude.

## Gate PR local

Pour les vérifications locales de validation/gate des PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur un hôte chargé, relancez-le une fois avant de le traiter comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : "Répondez avec un seul mot : ok. Pas de ponctuation ni de texte supplémentaire."

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279ms (min 1114, max 2431)
- opus médiane 2454ms (min 1224, max 3170)

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution code de sortie/signal, ainsi que les résumés RSS max pour chaque commande. L’option facultative `--cpu-prof-dir` / `--heap-prof-dir` écrit des profils V8 par exécution afin que le minutage et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualiser avec `pnpm test:startup:bench:update`
- Comparer les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## Banc de démarrage Gateway

Script : [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Le benchmark utilise par défaut l’entrée CLI construite dans `dist/entry.js` ; exécutez
`pnpm build` avant d’utiliser les commandes de script de package. Pour mesurer
le runner source à la place, passez `--entry scripts/run-node.mjs` et gardez ces
résultats séparés des références d’entrée construite.

Utilisation :

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Identifiants de cas :

- `default` : démarrage Gateway normal.
- `skipChannels` : démarrage Gateway avec le démarrage des canaux ignoré.
- `oneInternalHook` : un hook interne configuré.
- `allInternalHooks` : tous les hooks internes.
- `fiftyPlugins` : 50 plugins de manifeste.
- `fiftyStartupLazyPlugins` : 50 plugins de manifeste à démarrage paresseux.

La sortie inclut la première sortie du processus, `/healthz`, `/readyz`, l’heure
du journal d’écoute HTTP, l’heure du journal prêt du Gateway, le temps CPU, le
ratio de cœurs CPU, le RSS max, le tas, les métriques de trace de démarrage, le
délai de boucle d’événements et les métriques détaillées de table de recherche
des plugins. Le script active `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dans
l’environnement Gateway enfant.

Lisez `/healthz` comme vivacité : le serveur HTTP peut répondre. Lisez `/readyz`
comme disponibilité utilisable : les sidecars de plugins de démarrage, les
canaux et le travail post-attachement critique pour l’état prêt sont stabilisés.
Les hooks de démarrage Gateway sont envoyés de manière asynchrone et ne font pas
partie de la garantie de disponibilité. L’heure du journal prêt est l’horodatage
interne du journal prêt du Gateway ; elle est utile pour l’attribution côté
processus, mais ne remplace pas la sonde externe `/readyz`.

Utilisez la sortie JSON ou `--output` lors de la comparaison de changements.
Utilisez `--cpu-prof-dir` uniquement après que la sortie de trace indique un
travail d’import, de compilation ou lié au CPU qui ne peut pas être expliqué par
les seuls minutages de phase. Ne comparez pas les résultats du runner source avec
les résultats construits `dist/entry.js` comme s’ils avaient la même référence.

## Banc de redémarrage Gateway

Script : [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Le benchmark de redémarrage est pris en charge uniquement sur macOS et Linux. Il
utilise SIGUSR1 pour les redémarrages dans le processus et échoue immédiatement
sur Windows.

Le benchmark utilise par défaut l’entrée CLI construite dans `dist/entry.js` ;
exécutez `pnpm build` avant d’utiliser les commandes de script de package. Pour
mesurer le runner source à la place, passez `--entry scripts/run-node.mjs` et
gardez ces résultats séparés des références d’entrée construite.

Utilisation :

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Identifiants de cas :

- `skipChannels` : redémarrage avec canaux ignorés.
- `skipChannelsAcpxProbe` : redémarrage avec canaux ignorés et sonde de démarrage ACPX activée.
- `skipChannelsNoAcpxProbe` : redémarrage avec canaux ignorés et sonde de démarrage ACPX désactivée.
- `default` : redémarrage normal.
- `fiftyPlugins` : redémarrage avec 50 plugins de manifeste.

La sortie inclut le prochain `/healthz`, le prochain `/readyz`, le temps
d’indisponibilité, le minutage prêt du redémarrage, le CPU, le RSS, les métriques
de trace de démarrage pour le processus de remplacement et les métriques de
trace de redémarrage pour la gestion du signal, le drain du travail actif, les
phases de fermeture, le démarrage suivant, le minutage prêt et les instantanés
mémoire. Le script active `OPENCLAW_GATEWAY_STARTUP_TRACE=1` et
`OPENCLAW_GATEWAY_RESTART_TRACE=1` dans l’environnement Gateway enfant.

Utilisez ce benchmark lorsqu’un changement touche la signalisation de
redémarrage, les gestionnaires de fermeture, le démarrage après redémarrage,
l’arrêt des sidecars, le transfert de service ou la disponibilité après
redémarrage. Commencez par `skipChannels` lorsque vous isolez la mécanique
Gateway du démarrage des canaux. Utilisez `default` ou les cas riches en plugins
seulement après que le cas étroit explique le chemin de redémarrage.

Les métriques de trace sont des indices d’attribution, pas des verdicts. Un
changement de redémarrage doit être jugé à partir de plusieurs échantillons, du
span propriétaire correspondant, du comportement de `/healthz` et `/readyz`, et
du contrat de redémarrage visible par l’utilisateur.

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les smoke tests
d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de config/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Connexe

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

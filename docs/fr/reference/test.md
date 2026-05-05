---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-05-05T01:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, tests en direct, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages Plugin : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente du Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire des fichiers chargés, et non d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` est false, la barrière mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source de voie fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des mappages source explicites et du graphe d’import local. Les changements larges/config/package sont ignorés sauf s’ils correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test/de la config/du package doit revenir au comportement plus large de tests modifiés de Vitest.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la barrière de vérification intelligente des changements pour le diff par rapport à `origin/main`. Elle exécute les commandes de typecheck, lint et garde pour les voies architecturales concernées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite comme preuve de test.
- `pnpm test` : achemine les cibles explicites de fichiers/répertoires vers des voies Vitest ciblées. Les exécutions sans cible utilisent des groupes de fragments fixes et s’étendent aux configs feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configs de fragments par extension au lieu d’un unique énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un bref résumé `[test] passed|failed|skipped ... in ...`. La propre ligne de durée de Vitest reste le détail par fragment.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de config, d’un espace de travail, d’un répertoire d’agent ou d’un magasin de profils d’auth isolé.
- Helpers E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E au niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un env CLI, d’une capture de logs et d’un nettoyage au même endroit.
- Helpers E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier env hôte sourçable. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un flag Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution du point d’entrée, le démarrage OpenAI simulé, le lancement Gateway au premier plan/en arrière-plan, les probes de disponibilité, l’export d’env d’état, les dumps de logs et le nettoyage des processus.
- Les exécutions de fragments complètes, d’extensions et à motif d’inclusion mettent à jour les données de temps locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de config entière utilisent ces temps pour équilibrer les fragments lents et rapides. Les fragments CI à motif d’inclusion ajoutent le nom du fragment à la clé de temps, ce qui garde les temps de fragments filtrés visibles sans remplacer les données de temps de config entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artéfact de temps local.
- Certains fichiers de test `plugin-sdk` et `commands` passent désormais par des voies légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds en runtime sur leurs voies existantes.
- Les fichiers source avec des tests frères correspondent à ce frère avant de revenir à des globs de répertoire plus larges. Les modifications de helpers sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importeurs au lieu d’exécuter largement chaque fragment lorsque le chemin de dépendance est précis.
- `auto-reply` se divise désormais aussi en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/token/helper au niveau supérieur.
- La config Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extensions/plugins. Les plugins de canaux lourds, le plugin de navigateur et OpenAI s’exécutent comme fragments dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin groupé.
- `pnpm test:perf:imports` : active les rapports de durée d’import Vitest et de ventilation des imports, tout en continuant à utiliser le routage de voies ciblées pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage d’import, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare les performances du chemin routé en mode changed avec l’exécution native du projet racine pour le même diff git commité.
- `pnpm test:perf:changed:bench -- --worktree` compare les performances de l’ensemble de changements de l’arbre de travail actuel sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque config feuille Vitest de suite complète en série et écrit des données de durée groupées ainsi que des artéfacts JSON/log par config. Le Test Performance Agent l’utilise comme baseline avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke Gateway end-to-end (appariement multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs verbeux.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour ne pas être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois comme tarball npm, construit/réutilise une image runner Node/Git minimale ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendance de plugin ; ces voies montent le tarball préconstruit au lieu d’utiliser des sources de dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normale de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique packer de package local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant que Docker ne le consomme. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins en package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les slots de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds de voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le poids effectif ou le plafond de ressources sur un hôte à faible parallélisme, elle peut quand même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer la capacité. Les démarrages de voies sont espacés de 2 secondes par défaut afin d’éviter des tempêtes de création du daemon Docker local ; surchargez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner pré-vérifie Docker par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet le statut des voies actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre les voies compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les temps de voies dans `.artifacts/docker-tests/lane-timings.json` pour un tri du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie de statut, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des temps. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les voies déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les voies de fournisseurs live uniquement ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les voies live principales et de fin dans un seul pool du plus long au plus court afin que les buckets de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles voies groupées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un timeout de secours de 120 minutes surchargeable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin sélectionnées utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker de backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (par défaut 180). Les logs par voie, `summary.json`, `failures.json` et les temps de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour imprimer des commandes de réexécution ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source basé sur Chromium, démarre un CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep` et vérifie que les instantanés de rôles CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les refs d’iframe et les métadonnées de frame.
- Les probes Docker live de backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), récupère une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, les lectures de transcripts, les métadonnées de pièces jointes, le comportement de file d’événements live, le routage des envois sortants et les notifications de canal + permission au style Claude via le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe le tarball OpenClaw empaqueté sur un fixture d’ancien utilisateur non vierge, exécute la mise à jour du package ainsi que `doctor` en mode non interactif sans clés de fournisseur ou de canal live, puis démarre un Gateway en boucle locale et vérifie que les agents, la configuration des canaux, les listes d’autorisation de plugins, les fichiers d’espace de travail/de session, l’état obsolète des dépendances de plugins héritées, le démarrage et l’état RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, injecte des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal live, configure cette base avec une recette de commande `openclaw config set` intégrée, met à jour cette installation publiée vers le tarball OpenClaw empaqueté, exécute `doctor` en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie que les intents configurés, les fichiers d’espace de travail/de session, la configuration obsolète des plugins et l’état hérité des dépendances, le démarrage, `/healthz`, `/readyz` et l’état RPC survivent ou sont réparés proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `all-since-2026.4.23`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble `reported-issues` inclut `configured-plugin-installs` pour vérifier que les plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau, et `stale-source-plugin-shadow` pour empêcher les ombres de plugins source uniquement de casser le démarrage. Package Acceptance les expose sous les noms `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration` : exécute le harness `published-upgrade survivor` dans le scénario `plugin-deps-cleanup`, qui met fortement l’accent sur le nettoyage, en commençant à `openclaw@2026.4.23` par défaut. Le workflow séparé `Update Migration` développe cette voie avec `baselines=all-since-2026.4.23` afin que chaque package stable publié à partir de `.23` soit mis à jour vers le candidat et prouve le nettoyage des dépendances des plugins configurés en dehors de Full Release CI.
- `pnpm test:docker:plugins` : exécute un smoke test d’installation/mise à jour pour le chemin local, `file:`, les packages de registre npm avec dépendances hissées, les références git mobiles, les fixtures ClawHub, les mises à jour du marketplace et l’activation/l’inspection du bundle Claude.

## Contrôle PR local

Pour les vérifications locales de fusion/contrôle de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : “Répondez par un seul mot : ok. Sans ponctuation ni texte supplémentaire.”

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux, ainsi que des résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution afin que le chronométrage et la capture de profils utilisent le même harnais.

Conventions des sorties enregistrées :

- `pnpm test:startup:bench:smoke` écrit l’artefact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence archivé dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture archivé :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les smoke tests d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/d’espace de travail/de session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Liens connexes

- [Tests](/fr/help/testing)
- [Tests en direct](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

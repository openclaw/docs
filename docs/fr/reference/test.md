---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-30T18:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Kit de tests complet (suites, tests en direct, Docker) : [Tests](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez-le lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une porte de couverture unitaire des fichiers chargés, et non d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, la porte mesure les fichiers chargés par la suite de couverture unitaire au lieu de considérer chaque fichier source de voie fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des correspondances de sources explicites et du graphe d’import local. Les changements larges de configuration ou de package sont ignorés sauf s’ils correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test, de la configuration ou d’un package doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la porte de vérification intelligente des changements pour le diff par rapport à `origin/main`. Elle exécute les commandes de vérification de types, de lint et de garde pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou un `pnpm test <target>` explicite comme preuve de test.
- `pnpm test` : achemine les cibles explicites de fichiers/répertoires via les voies Vitest limitées au périmètre. Les exécutions sans cible utilisent des groupes de fragments fixes et se développent en configurations feuilles pour l’exécution parallèle locale ; le groupe d’extensions se développe toujours en configurations de fragments par extension au lieu d’un seul énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par fragment.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de configuration, d’un espace de travail, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolé.
- Helpers E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E Vitest au niveau processus a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture de journaux et d’un nettoyage au même endroit.
- Helpers E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent transmettre `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent transmettre `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un indicateur Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de l’entrypoint, le démarrage OpenAI simulé, le lancement Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les dumps de journaux et le nettoyage des processus.
- Les exécutions fragmentées complètes, par extension et avec motif d’inclusion mettent à jour les données de timings locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration complète utilisent ces timings pour équilibrer les fragments lents et rapides. Les fragments CI avec motif d’inclusion ajoutent le nom du fragment à la clé de timing, ce qui garde les timings filtrés visibles sans remplacer les données de timing de configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artifact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` passent maintenant par des voies légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds côté runtime sur leurs voies existantes.
- Les fichiers source avec des tests frères correspondent à ce frère avant de revenir à des globs de répertoires plus larges. Les modifications de helpers sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importeurs au lieu d’exécuter largement chaque fragment lorsque le chemin de dépendance est précis.
- `auto-reply` se divise maintenant aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut, de jetons et de helpers au niveau supérieur.
- La configuration Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extensions/Plugin. Les Plugins de canaux lourds, le Plugin de navigateur et OpenAI s’exécutent comme fragments dédiés ; les autres groupes de Plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de Plugin groupé.
- `pnpm test:perf:imports` : active les rapports de durée d’import et de répartition des imports de Vitest, tout en utilisant toujours le routage par voie limitée au périmètre pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare par benchmark le chemin routé en mode changements avec l’exécution native du projet racine pour le même diff git commité.
- `pnpm test:perf:changed:bench -- --worktree` benchmarke l’ensemble de changements du worktree courant sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de suite complète en série et écrit des données de durée groupées ainsi que des artifacts JSON/journaux par configuration. Le Test Performance Agent l’utilise comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke Gateway de bout en bout (appariement multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` propre au fournisseur) pour ne plus être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une seule fois comme tarball npm, construit/réutilise une image runner Node/Git nue ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation, de mise à jour et de dépendances de Plugin ; ces voies montent le tarball préconstruit au lieu d’utiliser les sources copiées du dépôt. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normale de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur de package local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant consommation par Docker. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins de package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds de voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le poids effectif ou le plafond de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécuter seule jusqu’à libérer de la capacité. Les démarrages de voies sont espacés de 2 secondes par défaut pour éviter les tempêtes de création du daemon Docker local ; remplacez ce délai avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner prévérifie Docker par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI fournisseur entre voies compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les timings des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` uniquement pour les voies déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` uniquement pour les voies de fournisseurs live ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live uniquement fusionne les voies live principales et de fin dans un seul pool du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles voies en pool après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un délai d’expiration de repli de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin sélectionnées utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai d’expiration via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par voie, `summary.json`, `failures.json` et les timings de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour imprimer des commandes de réexécution ciblées et peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep`, puis vérifie que les instantanés de rôle CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini disposent d’alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute une vraie conversation proxifiée via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), tire une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway préinitialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, la lecture de transcriptions, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage d’envois sortants, ainsi que les notifications de canal et d’autorisation de style Claude via le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tarball OpenClaw empaquetée par-dessus une fixture sale d’ancien utilisateur, exécute la mise à jour du paquet ainsi que le doctor non interactif sans clés de provider ou de canal actives, puis démarre un Gateway en loopback et vérifie que les agents, la configuration des canaux, les listes d’autorisation des plugins, les fichiers d’espace de travail/session, l’état obsolète des dépendances d’exécution des plugins, le démarrage et l’état RPC survivent.

## Gate PR local

Pour les vérifications locales de fusion/gate de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de manière intermittente sur un hôte fortement chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes contraints en mémoire, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de mesure de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables d’environnement optionnelles : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : « Reply with a single word: ok. No punctuation or extra text. »

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279 ms (min 1114, max 2431)
- opus médiane 2454 ms (min 1224, max 3170)

## Banc de mesure du démarrage de la CLI

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution code de sortie/signal, ainsi que des résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution afin que le minutage et la capture de profils utilisent le même banc.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact ciblé de test de fumée dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le jeu de données de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Jeu de données de test versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au jeu de données avec `pnpm test:startup:bench:check`

## E2E d’intégration initiale (Docker)

Docker est facultatif ; cela n’est nécessaire que pour les tests de fumée d’intégration initiale conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Test de fumée d’import QR (Docker)

Vérifie que l’assistant d’exécution QR maintenu se charge sous les environnements d’exécution Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Associés

- [Tests](/fr/help/testing)
- [Tests en direct](/fr/help/testing-live)

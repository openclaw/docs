---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes de forçage et de couverture
title: Tests
x-i18n:
    generated_at: "2026-05-01T07:17:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d50f77fdb8dcf7153c59d1bd9f3d61d745ba17ea846eb0610d0f064ad0d1761
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, en direct, Docker) : [Tests](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway restant qui occupe le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port Gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez ceci lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). C’est une porte de couverture unitaire des fichiers chargés, pas une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, la porte mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source de voie fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des mappages de source explicites et du graphe d’import local. Les changements larges de configuration ou de paquet sont ignorés sauf s’ils correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution explicite large des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test, de la configuration ou d’un paquet doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la porte de vérification intelligente des changements pour le diff par rapport à `origin/main`. Elle exécute les commandes de vérification de types, de lint et de garde pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite comme preuve de test.
- `pnpm test` : achemine les cibles explicites de fichiers/répertoires via des voies Vitest ciblées. Les exécutions sans cible utilisent des groupes de fragments fixes et s’étendent aux configurations feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configurations de fragments par extension au lieu d’un énorme processus de projet racine unique.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par fragment.
- État de test partagé OpenClaw : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de configuration, d’un espace de travail, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolé.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E de niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture des journaux et d’un nettoyage au même endroit.
- Assistants E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte pouvant être sourcé. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un indicateur Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de l’entrypoint, le démarrage OpenAI simulé, le lancement du Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les vidages de journaux et le nettoyage des processus.
- Les exécutions de fragments complètes, d’extension et par motif d’inclusion mettent à jour les données de durée locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration entière utilisent ces durées pour équilibrer les fragments lents et rapides. Les fragments CI par motif d’inclusion ajoutent le nom du fragment à la clé de durée, ce qui garde les durées de fragments filtrés visibles sans remplacer les données de durée de configuration entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de durée.
- Certains fichiers de test `plugin-sdk` et `commands` passent maintenant par des voies légères dédiées qui conservent uniquement `test/setup.ts`, laissant les cas lourds en runtime sur leurs voies existantes.
- Les fichiers sources avec des tests frères sont mappés vers ce test frère avant de revenir à des globs de répertoires plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement chaque fragment lorsque le chemin de dépendance est précis.
- `auto-reply` se divise maintenant aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut, de jetons et d’assistants au niveau supérieur.
- La configuration Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extension/plugin. Les plugins de canaux lourds, le plugin de navigateur et OpenAI s’exécutent comme fragments dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin groupé.
- `pnpm test:perf:imports` : active les rapports de durée d’import et de répartition des imports Vitest, tout en utilisant toujours l’acheminement par voies ciblées pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare le chemin acheminé du mode des changements à l’exécution native du projet racine pour le même diff Git validé.
- `pnpm test:perf:changed:bench -- --worktree` compare l’ensemble de changements du worktree actuel sans validation préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU et heap pour l’exécuteur unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de la suite complète en série et écrit les données de durée groupées ainsi que les artefacts JSON/journaux par configuration. Le Test Performance Agent l’utilise comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après un changement axé sur la performance.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke de bout en bout du Gateway (appariement multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés d’API et `LIVE=1` (ou `*_LIVE_TEST=1` propre au fournisseur) pour ne plus être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois sous forme de tarball npm, construit/réutilise une image d’exécution Node/Git nue ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendances de plugins ; ces voies montent le tarball préconstruit au lieu d’utiliser des sources de dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies normales de fonctionnalité de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant que Docker ne les consomme. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins de paquet/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool final sensible aux fournisseurs et vaut 10 par défaut. Les plafonds des voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le plafond effectif de poids ou de ressources sur un hôte à faible parallélisme, elle peut quand même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages de voies sont échelonnés de 2 secondes par défaut pour éviter les tempêtes de création du démon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. L’exécuteur effectue par défaut un contrôle préalable Docker, nettoie les conteneurs E2E OpenClaw périmés, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre voies compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les durées des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des durées. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les voies déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les voies de fournisseurs live uniquement ; les alias de paquet sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live uniquement fusionne les voies live principales et finales en un seul pool du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. L’exécuteur arrête de planifier de nouvelles voies groupées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un délai de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/finales sélectionnées utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par voie, `summary.json`, `failures.json` et les durées de phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées et peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep` et vérifie que les instantanés de rôle CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute une vraie conversation proxifiée via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image externe Open WebUI et ne devrait pas être aussi stable en CI que les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations acheminées, les lectures de transcript, les métadonnées de pièces jointes, le comportement de file d’événements live, l’acheminement des envois sortants et les notifications de canal + autorisation de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tar OpenClaw empaquetée par-dessus une fixture d’ancien utilisateur modifiée, exécute la mise à jour du paquet ainsi que `doctor` en mode non interactif sans clés de fournisseur ni de canal en direct, puis démarre un Gateway en boucle locale et vérifie que les agents, la configuration des canaux, les listes d’autorisation de plugins, les fichiers d’espace de travail/session, l’état obsolète des dépendances runtime de plugin, le démarrage et le statut RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur ni de canal en direct, configure cette référence avec une recette de commande `openclaw config set` intégrée, met à jour cette installation publiée vers l’archive tar OpenClaw empaquetée, exécute `doctor` en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie que les intentions configurées, les fichiers d’espace de travail/session, l’état obsolète de la configuration/dependances runtime de plugin, le démarrage et le statut RPC survivent ou se réparent proprement. Remplacez la référence avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ; Package Acceptance expose la même valeur sous le nom `published_upgrade_survivor_baseline`.

## Gate de PR locale

Pour les vérifications locales de fusion/gate de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de manière intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes contraints en mémoire, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Répondez avec un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- médiane minimax 1279 ms (min. 1114, max. 2431)
- médiane opus 2454 ms (min. 1224, max. 3170)

## Banc de démarrage de la CLI

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la répartition des codes de sortie/signaux et les résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution, afin que le chronométrage et la capture de profil utilisent le même banc d’exécution.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artéfact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artéfact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Liens connexes

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)

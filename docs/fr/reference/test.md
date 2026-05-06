---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-05-06T07:37:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Kit complet de tests (suites, en direct, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages de Plugin : [Tests des mises à jour et des Plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway persistant qui détient le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez ceci lorsqu’une exécution précédente du Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une porte de couverture pour la voie unitaire par défaut, pas d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false et que la voie par défaut limite les inclusions de couverture aux tests unitaires non rapides avec des fichiers source voisins, la porte mesure le source détenu par cette voie au lieu de chaque import transitif qu’elle charge par hasard.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers `*.test.ts` voisins, des correspondances explicites de sources et du graphe d’import local. Les changements larges de config/package sont ignorés sauf s’ils correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution explicite large des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test/de la config/du package doit revenir au comportement plus large de tests modifiés de Vitest.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff avec `origin/main`.
- `pnpm check:changed` : exécute la porte de vérification intelligente des changements pour le diff avec `origin/main`. Elle exécute typecheck, lint et les commandes de garde pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou un `pnpm test <target>` explicite comme preuve de test.
- `pnpm test` : route les cibles explicites de fichiers/répertoires via des voies Vitest limitées. Les exécutions sans cible utilisent des groupes de shards fixes et s’étendent aux configs feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configs de shard par extension au lieu d’un seul énorme processus de projet racine.
- Les exécutions via le wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La propre ligne de durée de Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de config, d’un workspace, d’un répertoire d’agent ou d’un magasin d’auth-profile isolé.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E au niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture de logs et d’un nettoyage au même endroit.
- Assistants E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de niveau inférieur peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un flag Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution d’entrypoint, le démarrage OpenAI simulé, le lancement du Gateway en avant-plan/arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les dumps de logs et le nettoyage des processus.
- Les exécutions de shards complètes, d’extension et avec motif d’inclusion mettent à jour les données de timing locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configs complètes utilisent ces timings pour équilibrer les shards lents et rapides. Les shards CI avec motif d’inclusion ajoutent le nom du shard à la clé de timing, ce qui garde les timings des shards filtrés visibles sans remplacer les données de timing de config complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Les fichiers de test `plugin-sdk` et `commands` sélectionnés sont désormais routés via des voies légères dédiées qui ne gardent que `test/setup.ts`, en laissant les cas lourds en runtime sur leurs voies existantes.
- Les fichiers source avec tests voisins correspondent à ce voisin avant de revenir à des globs de répertoire plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importeurs au lieu d’exécuter largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` se divise maintenant aussi en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/token/assistants de premier niveau.
- La config Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin groupé.
- `pnpm test:perf:imports` : active le reporting de durée d’import Vitest et de détail des imports, tout en continuant d’utiliser le routage par voie limitée pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare les performances du chemin routé en mode changé avec l’exécution native du projet racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de changements du worktree courant sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque config feuille Vitest de la suite complète et écrit des données de durée groupées ainsi que des artefacts JSON/log par config. Le Test Performance Agent l’utilise comme baseline avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après un changement axé sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke de bout en bout du Gateway (appariement multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs détaillés.
- `pnpm test:live` : exécute les tests live des providers (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au provider) pour ne pas être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois comme tarball npm, construit/réutilise une image de runner Node/Git nue plus une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendance de plugin ; ces voies montent le tarball préconstruit au lieu d’utiliser des sources copiées du dépôt. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normale de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant que Docker ne le consomme. Les définitions de voies Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification réside dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les slots de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool final sensible aux providers et vaut 10 par défaut. Les plafonds de voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de providers valent par défaut une voie lourde par provider via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une voie dépasse le poids effectif ou le plafond de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages de voies sont espacés de 2 secondes par défaut afin d’éviter des tempêtes de création du démon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner pré-vérifie Docker par défaut, nettoie les conteneurs E2E OpenClaw périmés, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI de providers entre voies compatibles, réessaie une fois par défaut les échecs transitoires de providers live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les timings des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les voies déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les voies de providers live uniquement ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live uniquement fusionne les voies live principales et finales dans un seul pool du plus long au plus court afin que les compartiments de providers puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles voies en pool après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie a un timeout de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/finales sélectionnées utilisent des plafonds par voie plus serrés. Les commandes de configuration Docker du backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les logs par voie, `summary.json`, `failures.json` et les timings de phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de relance ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source appuyé par Chromium, démarre CDP brut plus un Gateway isolé, exécute `browser doctor --deep` et vérifie que les snapshots de rôles CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dans Docker, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), tire une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway préconfiguré et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, la lecture des transcriptions, les métadonnées des pièces jointes, le comportement de la file d’événements en direct, le routage des envois sortants, ainsi que les notifications de canal et d’autorisation de style Claude via le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tarball OpenClaw empaquetée par-dessus une fixture d’ancien utilisateur en état modifié, exécute la mise à jour du package ainsi que `doctor` non interactif sans clés de fournisseur ou de canal live, puis démarre un Gateway en local loopback et vérifie que les agents, la configuration des canaux, les listes d’autorisation de plugins, les fichiers d’espace de travail/session, l’ancien état obsolète des dépendances de plugins, le démarrage et le statut RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal live, configure cette référence avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers l’archive tarball OpenClaw empaquetée, exécute `doctor` non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en local loopback et vérifie que les intentions configurées, les fichiers d’espace de travail/session, la configuration de plugins obsolète et l’ancien état des dépendances, le démarrage, `/healthz`, `/readyz` et le statut RPC survivent ou sont réparés proprement. Remplacez une référence avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice locale exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, par exemple `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble `reported-issues` inclut `configured-plugin-installs` pour vérifier que les plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau, et `stale-source-plugin-shadow` pour empêcher les ombres de plugins uniquement source de casser le démarrage. Package Acceptance expose ces éléments sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, et résout les jetons de référence méta tels que `last-stable-4` ou `all-since-2026.4.23` avant de transmettre les spécifications exactes des packages aux lanes Docker.
- `pnpm test:docker:update-migration` : exécute le harness published-upgrade survivor dans le scénario `plugin-deps-cleanup`, fortement axé sur le nettoyage, en démarrant à `openclaw@2026.4.23` par défaut. Le workflow séparé `Update Migration` développe cette lane avec `baselines=all-since-2026.4.23`, afin que chaque package stable publié depuis `.23` inclus soit mis à jour vers le candidat et prouve le nettoyage des dépendances de plugins configurés en dehors de la Full Release CI.
- `pnpm test:docker:plugins` : exécute le smoke d’installation/mise à jour pour le chemin local, `file:`, les packages du registre npm avec dépendances remontées, les refs git mobiles, les fixtures ClawHub, les mises à jour du marketplace et l’activation/inspection du bundle Claude.

## Garde de PR locale

Pour les contrôles locaux d’intégration/de garde de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : "Répondez avec un seul mot : ok. Pas de ponctuation ni de texte supplémentaire."

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux, ainsi que les résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent les profils V8 par exécution afin que le minutage et la capture de profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artéfact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artéfact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; cela n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/d’espace de travail/de session, puis démarre le gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Vérifie que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Connexe

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

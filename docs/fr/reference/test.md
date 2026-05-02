---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes de forçage/couverture
title: Tests
x-i18n:
    generated_at: "2026-05-02T07:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Kit complet de tests (suites, en direct, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des paquets de plugins : [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway résiduel qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez ceci lorsqu’une exécution précédente du Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’un seuil de couverture unitaire des fichiers chargés, pas d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, ce seuil mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source de lane fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution intelligente et peu coûteuse des tests modifiés. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers `*.test.ts` frères, des mappings source explicites et du graphe d’import local. Les modifications larges/config/package sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution explicite et large des tests modifiés. Utilisez-la lorsqu’une modification de harnais de test/config/package doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les lanes architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute le seuil de vérification intelligent des changements pour le diff par rapport à `origin/main`. Il exécute les commandes de typecheck, de lint et de garde pour les lanes architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite pour une preuve de test.
- `pnpm test` : route les cibles explicites de fichiers/répertoires à travers des lanes Vitest délimitées. Les exécutions sans cible utilisent des groupes de shards fixes et s’étendent en configs feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configs de shard par extension au lieu d’un seul énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’une fixture de config, d’un workspace, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolés.
- Helpers E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E de niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture de logs et d’un nettoyage au même endroit.
- Helpers E2E Docker/Bash : les lanes qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node récents de traiter `--env-file` comme un flag Node. Les lanes Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de l’entrypoint, le démarrage mock OpenAI, le lancement du Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export d’environnement d’état, les dumps de logs et le nettoyage des processus.
- Les exécutions de shards complètes, d’extensions et à motif d’inclusion mettent à jour les données locales de durée dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de config entière utilisent ces durées pour équilibrer les shards lents et rapides. Les shards CI à motif d’inclusion ajoutent le nom du shard à la clé de durée, ce qui garde les durées de shards filtrés visibles sans remplacer les données de durée de config entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de durée local.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des lanes légères dédiées qui ne gardent que `test/setup.ts`, en laissant les cas lourds côté runtime sur leurs lanes existantes.
- Les fichiers source ayant des tests frères correspondent à ce frère avant de revenir à des globs de répertoire plus larges. Les modifications de helpers sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` se divise désormais aussi en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/token/helpers de haut niveau.
- La config Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les plugins de canaux lourds, le Plugin de navigateur et OpenAI s’exécutent comme des shards dédiés ; les autres groupes de plugins restent groupés. Utilisez `pnpm test extensions/<id>` pour une lane d’un Plugin groupé.
- `pnpm test:perf:imports` : active le reporting de durée d’import + décomposition des imports de Vitest, tout en continuant à utiliser le routage de lanes délimitées pour les cibles explicites de fichiers/répertoires.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarke le chemin routé en mode changed par rapport à l’exécution native du projet racine pour le même diff git committé.
- `pnpm test:perf:changed:bench -- --worktree` benchmarke l’ensemble de modifications du worktree actuel sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque config feuille Vitest de la suite complète et écrit les données de durée groupées ainsi que des artefacts JSON/log par config. Le Test Performance Agent l’utilise comme baseline avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les smoke tests Gateway de bout en bout (appariement multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` propre au fournisseur) pour lever le skip.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois sous forme de tarball npm, construit/réutilise une image runner Node/Git nue ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les lanes de smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un scheduler pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les lanes installateur/mise à jour/dépendance de Plugin ; ces lanes montent le tarball préconstruit au lieu d’utiliser les sources copiées du dépôt. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les lanes de fonctionnalité normales de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant que Docker ne le consomme. Les définitions de lanes Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planificateur réside dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par le scheduler pour les lanes sélectionnées, les types d’images, les besoins package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les limites des lanes lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les limites fournisseurs valent par défaut une lane lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus grands. Si une lane dépasse la limite effective de poids ou de ressource sur un hôte à faible parallélisme, elle peut quand même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer la capacité. Les démarrages de lanes sont espacés de 2 secondes par défaut afin d’éviter les tempêtes de création du daemon Docker local ; surchargez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner pré-vérifie Docker par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives toutes les 30 secondes, partage les caches d’outils CLI fournisseurs entre lanes compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les durées de lanes dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des lanes sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des durées. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les lanes déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les lanes de fournisseurs live uniquement ; les alias package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les lanes live principales et de fin dans un seul pool du plus long au plus court afin que les buckets de fournisseurs puissent regrouper les travaux Claude, Codex et Gemini. Le runner arrête de planifier de nouvelles lanes groupées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane a un timeout de repli de 120 minutes surchargeable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines lanes live/de fin utilisent des limites par lane plus serrées. Les commandes de configuration Docker du backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les logs par lane, `summary.json`, `failures.json` et les durées de phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les lanes lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep` et vérifie que les instantanés de rôle CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les refs d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme des lanes ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), tire une image Open WebUI externe et ne devrait pas être aussi stable en CI que les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway ensemencé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, la lecture de transcriptions, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage des envois sortants et les notifications de canal + permissions de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tar OpenClaw empaquetée par-dessus un fixture sale d’ancien utilisateur, exécute la mise à jour du paquet puis doctor en mode non interactif sans clés de fournisseur ou de canal live, puis démarre un Gateway en boucle locale et vérifie que les agents, la configuration des canaux, les listes d’autorisation de Plugin, les fichiers d’espace de travail/session, l’état obsolète des dépendances de Plugin héritées, le démarrage et le statut RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal live, configure cette base avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers l’archive tar OpenClaw empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie que les intents configurés, les fichiers d’espace de travail/session, la configuration obsolète de Plugin et l’état des dépendances héritées, le démarrage, `/healthz`, `/readyz` et le statut RPC survivent ou sont réparés proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, étendez une matrice exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; Package Acceptance les expose sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration` : exécute le harnais de survivant de mise à niveau publiée dans le scénario très axé nettoyage `plugin-deps-cleanup`, en partant de `openclaw@2026.4.23` par défaut. Le workflow séparé `Update Migration` étend cette voie avec `baselines=all-since-2026.4.23` afin que chaque paquet stable publié à partir de `.23` soit mis à jour vers le candidat et démontre le nettoyage des dépendances des Plugins configurés en dehors de Full Release CI.
- `pnpm test:docker:plugins` : exécute un smoke test d’installation/mise à jour pour les chemins locaux, `file:`, les paquets du registre npm avec dépendances hissées, les références git mobiles, les fixtures ClawHub, les mises à jour de marketplace et l’activation/inspection du bundle Claude.

## Contrôle local de PR

Pour les vérifications locales d’intégration/de contrôle de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Répondez avec un seul mot : ok. Aucune ponctuation ni texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- médiane minimax 1279 ms (min 1114, max 2431)
- médiane opus 2454 ms (min 1224, max 3170)

## Benchmark de démarrage CLI

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux, ainsi que les résumés de RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution, afin que la mesure des temps et la capture des profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence versionnée dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionnée :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels à la fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de config/workspace/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Associés

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

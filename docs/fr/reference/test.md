---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-05-05T06:18:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, live, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et du package Plugin : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway restant qui occupe le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez ceci lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’un seuil de couverture unitaire des fichiers chargés, pas d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, le seuil mesure les fichiers chargés par la suite de couverture unitaire au lieu de considérer chaque fichier source des lanes séparées comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution bon marché et intelligente des tests modifiés. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des correspondances source explicites et du graphe d’import local. Les modifications larges/config/package sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test/de la config/du package doit revenir au comportement plus large de tests modifiés de Vitest.
- `pnpm changed:lanes` : affiche les lanes architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute le seuil intelligent de vérification des modifications pour le diff par rapport à `origin/main`. Il exécute les commandes de typecheck, de lint et de garde pour les lanes architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite pour une preuve par les tests.
- `pnpm test` : route les cibles explicites fichier/répertoire via des lanes Vitest ciblées. Les exécutions sans cible utilisent des groupes de shards fixes et s’étendent aux configs feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configs de shards par extension plutôt qu’à un seul énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de config, d’un espace de travail, d’un répertoire agent ou d’un magasin de profils d’authentification isolés.
- Helpers E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E au niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, de la capture des logs et du nettoyage au même endroit.
- Helpers E2E Docker/Bash : les lanes qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node plus récents de traiter `--env-file` comme un flag Node. Les lanes Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de l’entrypoint, le démarrage OpenAI simulé, le lancement Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les dumps de logs et le nettoyage des processus.
- Les exécutions de shards complètes, d’extensions et à motif d’inclusion mettent à jour les données de timings locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configs complètes utilisent ces timings pour équilibrer les shards lents et rapides. Les shards CI à motif d’inclusion ajoutent le nom du shard à la clé de timing, ce qui garde les timings de shards filtrés visibles sans remplacer les données de timing de config complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des lanes légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds en runtime sur leurs lanes existantes.
- Les fichiers source avec tests frères correspondent d’abord à ce frère avant de revenir à des globs de répertoire plus larges. Les modifications de helpers sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importeurs au lieu de lancer largement tous les shards lorsque le chemin de dépendance est précis.
- `auto-reply` est maintenant aussi séparé en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/token/helpers de premier niveau.
- La config Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme des shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une lane d’un seul plugin groupé.
- `pnpm test:perf:imports` : active le reporting de durée d’import et de répartition des imports Vitest, tout en utilisant encore le routage par lane ciblée pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare en benchmark le chemin routé en mode modifié à l’exécution native du projet racine pour le même diff git committé.
- `pnpm test:perf:changed:bench -- --worktree` compare en benchmark l’ensemble de modifications de l’arbre de travail actuel sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + tas pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque config feuille Vitest de suite complète et écrit les données de durée groupées ainsi que les artefacts JSON/log par config. Le Test Performance Agent l’utilise comme référence avant de tenter des correctifs de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur la performance.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les smoke tests Gateway de bout en bout (appariement multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs verbeux.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour ne plus être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, package OpenClaw une fois comme tarball npm, construit/réutilise une image runner Node/Git nue ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les lanes de smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les lanes d’installation/mise à jour/dépendances de plugin ; ces lanes montent le tarball préconstruit au lieu d’utiliser les sources du dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les lanes normales de fonctionnalité d’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique packager de package local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant consommation par Docker. Les définitions de lanes Docker vivent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique du planificateur vit dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI possédé par l’ordonnanceur pour les lanes sélectionnées, les types d’images, les besoins package/image live, les scénarios d’état et les vérifications d’identifiants, sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les slots de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de queue sensible aux fournisseurs et vaut 10 par défaut. Les plafonds des lanes lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une lane lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus grands. Si une lane dépasse le plafond effectif de poids ou de ressources sur un hôte à faible parallélisme, elle peut quand même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages de lanes sont espacés de 2 secondes par défaut pour éviter les tempêtes de création du démon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner effectue par défaut des vérifications préalables Docker, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre lanes compatibles, réessaie par défaut une fois les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les timings de lanes dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des lanes sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les lanes déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les lanes de fournisseurs live uniquement ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les lanes live principales et de queue dans un pool unique du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles lanes groupées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane dispose d’un timeout de repli de 120 minutes, remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines lanes live/de queue sélectionnées utilisent des plafonds par lane plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (par défaut 180). Les logs par lane, `summary.json`, `failures.json` et les timings de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les lanes lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de relance ciblées bon marché.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut ainsi qu’un Gateway isolé, exécute `browser doctor --deep`, et vérifie que les instantanés de rôle CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme lanes ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini disposent d’alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, les lectures de transcripts, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage des envois sortants et les notifications de canal + permission de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tar OpenClaw empaquetée par-dessus un fixture d’ancien utilisateur non nettoyé, exécute la mise à jour du paquet ainsi que doctor en mode non interactif sans clés de fournisseur ou de canal live, puis démarre un Gateway en loopback et vérifie que les agents, la configuration des canaux, les listes d’autorisation de Plugin, les fichiers d’espace de travail/session, l’état obsolète des dépendances de Plugin héritées, le démarrage et l’état RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, prépare des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal live, configure cette base avec une recette de commande `openclaw config set` intégrée, met à jour cette installation publiée vers l’archive tar OpenClaw empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en loopback et vérifie que les intents configurés, les fichiers d’espace de travail/session, la configuration de Plugin obsolète et l’état des dépendances héritées, le démarrage, `/healthz`, `/readyz` et l’état RPC survivent ou se réparent proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, étendez une matrice locale exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour vérifier que les plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau et `stale-source-plugin-shadow` pour empêcher les ombres de Plugin uniquement source de casser le démarrage. Package Acceptance expose ces options sous forme de `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, et résout les jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23` avant de transmettre les spécifications exactes de paquet aux lanes Docker.
- `pnpm test:docker:update-migration` : exécute le harnais published-upgrade survivor dans le scénario `plugin-deps-cleanup`, qui privilégie fortement le nettoyage, en commençant à `openclaw@2026.4.23` par défaut. Le workflow distinct `Update Migration` étend cette lane avec `baselines=all-since-2026.4.23` afin que chaque paquet stable publié depuis `.23` mette à jour vers le candidat et prouve le nettoyage des dépendances de Plugin configurées en dehors de Full Release CI.
- `pnpm test:docker:plugins` : exécute un smoke test d’installation/mise à jour pour les chemins locaux, `file:`, les paquets de registre npm avec dépendances hissées, les refs git mobiles, les fixtures ClawHub, les mises à jour marketplace et l’activation/inspection du bundle Claude.

## Gate PR local

Pour les vérifications locales de landing/gate de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes limités en mémoire, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env optionnel : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Réponds avec un seul mot : ok. Pas de ponctuation ni de texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279 ms (min 1114, max 2431)
- opus médiane 2454 ms (min 1224, max 3170)

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

La sortie inclut `sampleCount`, avg, p50, p95, min/max, la distribution exit-code/signal et les résumés RSS max pour chaque commande. Les options `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution, afin que le chronométrage et la capture de profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence archivé dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture archivé :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est optionnel ; ceci n’est nécessaire que pour les smoke tests d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration, d’espace de travail et de session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’auxiliaire d’exécution QR maintenu se charge sous les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Associé

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

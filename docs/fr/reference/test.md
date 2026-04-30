---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-30T07:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, en direct, Docker) : [Tests](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez cela lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’un contrôle de couverture unitaire des fichiers chargés, pas d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont 70 % pour les lignes/fonctions/instructions et 55 % pour les branches. Comme `coverage.all` vaut false, le contrôle mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source de voie séparée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des correspondances source explicites et du graphe d’import local. Les modifications larges de configuration/paquet sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification de harnais de test/configuration/paquet doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute le contrôle intelligent des changements pour le diff par rapport à `origin/main`. Il exécute les commandes de typage, de lint et de garde pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou `pnpm test <target>` explicite pour la preuve par les tests.
- `pnpm test` : route les cibles de fichier/répertoire explicites vers des voies Vitest limitées. Les exécutions sans cible utilisent des groupes de partitions fixes et s’étendent aux configurations feuilles pour l’exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configurations de partitions par extension au lieu d’un unique processus de projet racine géant.
- Les exécutions de l’enveloppe de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par partition.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de configuration, d’un espace de travail, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolé.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E au niveau processus Vitest a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture de journaux et du nettoyage au même endroit.
- Assistants E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-maisons peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node plus récents de traiter `--env-file` comme un indicateur Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution du point d’entrée, le démarrage OpenAI factice, le lancement du Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les vidages de journaux et le nettoyage des processus.
- Les exécutions de partitions complètes, d’extensions et à motif d’inclusion mettent à jour les données de minutage locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration complète utilisent ces minutages pour équilibrer les partitions lentes et rapides. Les partitions CI à motif d’inclusion ajoutent le nom de la partition à la clé de minutage, ce qui garde les minutages filtrés visibles sans remplacer les données de minutage de configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de minutage local.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés par des voies légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds à l’exécution sur leurs voies existantes.
- Les fichiers source avec des tests frères correspondent d’abord à ce frère avant de revenir à des globs de répertoire plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement chaque partition lorsque le chemin de dépendance est précis.
- `auto-reply` se sépare désormais aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jeton/assistant de premier niveau.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur non isolé partagé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent toutes les partitions d’extension/plugin. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme partitions dédiées ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin groupé.
- `pnpm test:perf:imports` : active les rapports de durée d’import et de décomposition des imports Vitest, tout en utilisant le routage par voie limitée pour les cibles explicites de fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin routé en mode changements par rapport à l’exécution native du projet racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de changements de l’arbre de travail actuel sans validation préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU et tas pour l’exécuteur unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de suite complète en série et écrit des données de durée groupées ainsi que des artefacts JSON/journaux par configuration. Le Test Performance Agent l’utilise comme référence avant de tenter de corriger les tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après un changement axé sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests de fumée de bout en bout du Gateway (appariement multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live de fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour lever l’exclusion.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois comme archive npm, construit/réutilise une image d’exécution Node/Git minimale plus une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les voies de fumée Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendances de plugin ; ces voies montent l’archive préconstruite au lieu d’utiliser des sources du dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normale de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’empaqueteur unique local/CI et valide l’archive ainsi que `dist/postinstall-inventory.json` avant que Docker ne la consomme. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les voies sélectionnées, les types d’images, les besoins de paquet/image live, les scénarios d’état et les contrôles d’identifiants, sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le groupe de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds de voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus grands. Si une voie dépasse le poids effectif ou le plafond de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un groupe vide et s’exécuter seule jusqu’à libérer de la capacité. Les démarrages de voies sont espacés de 2 secondes par défaut pour éviter les tempêtes de création du démon Docker local ; surchargez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. L’exécuteur précontrôle Docker par défaut, nettoie les conteneurs E2E OpenClaw périmés, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre voies compatibles, retente une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les minutages de voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des minutages. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` uniquement pour les voies déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` uniquement pour les voies de fournisseurs live ; les alias de paquet sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live seul fusionne les voies live principales et de fin dans un groupe unique du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. L’exécuteur cesse de planifier de nouvelles voies groupées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie a un délai d’expiration de repli de 120 minutes surchargeable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai d’expiration via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par voie, `summary.json`, `failures.json` et les minutages de phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour imprimer des commandes de réexécution ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre le CDP brut plus un Gateway isolé, exécute `browser doctor --deep` et vérifie que les instantanés de rôles CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de cadre.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dans Docker, se connecte via Open WebUI, vérifie `/api/models`, puis exécute une vraie discussion proxifiée via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), récupère une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway prérempli et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage des envois sortants, ainsi que les notifications de canal et d’autorisation de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le test de fumée reflète ce que le pont émet réellement.

## Contrôle PR local

Pour les vérifications locales d’intégration et de validation de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de façon intermittente sur un hôte chargé, relancez-le une fois avant de le considérer comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env optionnelles : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Réponds avec un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux et les résumés du RSS maximal pour chaque commande. Les options `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution afin que la mesure du temps et la capture des profils utilisent le même harnais.

Conventions des sorties enregistrées :

- `pnpm test:startup:bench:smoke` écrit l’artefact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence versionnée dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionnée :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels à la fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les smoke tests d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Vérifie que l’aide d’exécution QR maintenue se charge avec les runtimes Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Connexe

- [Tests](/fr/help/testing)
- [Tests en direct](/fr/help/testing-live)

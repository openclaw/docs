---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes forcé et couverture
title: Tests
x-i18n:
    generated_at: "2026-05-02T21:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Kit complet de tests (suites, live, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages de Plugin : [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway persistant qui détient le port de contrôle par défaut, puis exécute toute la suite Vitest avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente du Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). C’est un garde de couverture unitaire des fichiers chargés, pas une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, le garde mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source de lane fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des correspondances source explicites et du graphe d’import local. Les modifications larges de configuration/package sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification d’un harnais de test, de configuration ou de package doit retomber sur le comportement plus large de tests modifiés de Vitest.
- `pnpm changed:lanes` : affiche les lanes architecturales déclenchées par le diff avec `origin/main`.
- `pnpm check:changed` : exécute le garde de vérification intelligente des changements pour le diff avec `origin/main`. Il exécute les commandes de typecheck, de lint et de garde pour les lanes architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou un `pnpm test <target>` explicite pour une preuve de test.
- `pnpm test` : route les cibles explicites fichier/répertoire via des lanes Vitest limitées au périmètre. Les exécutions sans cible utilisent des groupes de shards fixes et s’étendent aux configurations feuilles pour une exécution parallèle locale ; le groupe d’extension s’étend toujours aux configurations de shards par extension plutôt qu’à un unique énorme processus de projet racine.
- Les exécutions du wrapper de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, d’un fixture de configuration, d’un workspace, d’un répertoire d’agent ou d’un magasin de profils d’authentification isolés.
- Assistants E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E Vitest au niveau processus a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture des journaux et d’un nettoyage au même endroit.
- Assistants E2E Docker/Bash : les lanes qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent passer `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent passer `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte sourçable. Le `--` avant `create` empêche les runtimes Node plus récents de traiter `--env-file` comme un flag Node. Les lanes Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution de point d’entrée, le démarrage OpenAI simulé, le lancement du Gateway au premier plan/en arrière-plan, les sondes de disponibilité, l’export d’environnement d’état, les dumps de journaux et le nettoyage des processus.
- Les exécutions de shards complètes, d’extension et à motif d’inclusion mettent à jour les données de timing locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions complètes de configuration ultérieures utilisent ces timings pour équilibrer les shards lents et rapides. Les shards CI à motif d’inclusion ajoutent le nom du shard à la clé de timing, ce qui garde les timings de shards filtrés visibles sans remplacer les données de timing de configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des lanes légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds en runtime sur leurs lanes existantes.
- Les fichiers source avec des tests frères correspondent à ce frère avant de retomber sur des globs de répertoire plus larges. Les modifications d’assistants sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu d’exécuter largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` est désormais aussi fractionné en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut, token et assistants de haut niveau.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner non isolé partagé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extension/plugin. Les plugins de canal lourds, le plugin de navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent groupés. Utilisez `pnpm test extensions/<id>` pour une lane de plugin groupé unique.
- `pnpm test:perf:imports` : active le rapport de durée d’import et de répartition des imports de Vitest, tout en utilisant le routage de lane limité au périmètre pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin en mode modifié routé par rapport à l’exécution native du projet racine pour le même diff git commité.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de changements du worktree actuel sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU et heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de suite complète en série et écrit des données de durée groupées ainsi que des artefacts JSON/journaux par configuration. Le Test Performance Agent l’utilise comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end du Gateway (appariement multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour ne pas être ignoré.
- `pnpm test:docker:all` : construit l’image de test live partagée, empaquette OpenClaw une fois comme tarball npm, construit/réutilise une image runner Node/Git minimale ainsi qu’une image fonctionnelle qui installe ce tarball dans `/app`, puis exécute les lanes smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. L’image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les lanes d’installation/mise à jour/dépendance de plugin ; ces lanes montent le tarball préconstruit au lieu d’utiliser les sources copiées du dépôt. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les lanes normales de fonctionnalité de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur package local/CI et valide le tarball ainsi que `dist/postinstall-inventory.json` avant que Docker ne le consomme. Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par l’ordonnanceur pour les lanes sélectionnées, les types d’images, les besoins package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds de lanes lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds de fournisseurs valent par défaut une lane lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour les hôtes plus grands. Si une lane dépasse la limite effective de poids ou de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages de lanes sont espacés de 2 secondes par défaut pour éviter des rafales de création du daemon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner pré-vérifie Docker par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives toutes les 30 secondes, partage les caches des outils CLI de fournisseurs entre lanes compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les timings de lanes dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des lanes sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour uniquement les lanes déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour uniquement les lanes de fournisseurs live ; les alias package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les lanes live principales et de fin dans un pool unique du plus long au plus court afin que les groupes de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles lanes en pool après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane dispose d’un timeout de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines lanes live/de fin sélectionnées utilisent des plafonds par lane plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par lane, `summary.json`, `failures.json` et les timings de phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les lanes lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut plus un Gateway isolé, exécute `browser doctor --deep` et vérifie que les snapshots de rôles CDP incluent les URL de liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.
- Les sondes Docker live du backend CLI peuvent être exécutées comme lanes ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute une vraie discussion proxifiée via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway ensemencé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes, le comportement de file d’événements live, le routage d’envoi sortant et les notifications de canal + permissions de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tar OpenClaw empaquetée par-dessus un ancien fixture utilisateur modifié, exécute la mise à jour du package ainsi que `doctor` en mode non interactif sans clés de fournisseur ou de canal en direct, puis démarre un Gateway en boucle locale et vérifie que les agents, la configuration des canaux, les listes d’autorisation de Plugin, les fichiers d’espace de travail/session, l’état obsolète des dépendances de Plugin hérité, le démarrage et le statut RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal en direct, configure cette base avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers l’archive tar OpenClaw empaquetée, exécute `doctor` en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway en boucle locale et vérifie que les intentions configurées, les fichiers d’espace de travail/session, la configuration obsolète de Plugin et l’état hérité des dépendances, le démarrage, `/healthz`, `/readyz` et le statut RPC survivent ou sont réparés proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `all-since-2026.4.23`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble `reported-issues` inclut `configured-plugin-installs` pour vérifier que les Plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau. Acceptation du package expose ces valeurs sous `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration` : exécute le harnais de survivance de mise à niveau publiée dans le scénario `plugin-deps-cleanup`, fortement axé sur le nettoyage, en commençant à `openclaw@2026.4.23` par défaut. Le workflow séparé Migration de mise à jour développe cette voie avec `baselines=all-since-2026.4.23`, afin que chaque package stable publié depuis `.23` soit mis à jour vers le candidat et prouve le nettoyage des dépendances de Plugins configurés en dehors de la CI de version complète.
- `pnpm test:docker:plugins` : exécute un test de fumée d’installation/mise à jour pour le chemin local, les packages `file:`, les packages du registre npm avec dépendances hissées, les références git mouvantes, les fixtures ClawHub, les mises à jour de place de marché et l’activation/inspection du bundle Claude.

## Contrôle PR local

Pour les vérifications locales de fusion/contrôle de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur un hôte chargé, relancez-le une fois avant de le considérer comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env optionnelle : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : « Répondez avec un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279 ms (min 1114, max 2431)
- opus médiane 2454 ms (min 1224, max 3170)

## Benchmark de démarrage de la CLI

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux et les résumés du RSS max pour chaque commande. Les options `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution, afin que la mesure des temps et la capture des profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` en utilisant `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence suivie dans le dépôt dans `test/fixtures/cli-startup-bench.json` en utilisant `runs=5` et `warmup=1`

Fixture suivie dans le dépôt :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels à la fixture avec `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker est optionnel ; cela n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de config/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Vérifie que l’assistant d’exécution QR maintenu se charge sous les environnements d’exécution Docker Node pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Associé

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
- [Tests des mises à jour et Plugins](/fr/help/testing-updates-plugins)

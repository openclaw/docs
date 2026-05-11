---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes forçage/couverture
title: Tests
x-i18n:
    generated_at: "2026-05-11T20:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, en direct, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages Plugin : [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez ceci lorsqu’une exécution précédente de Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’un gate de couverture de la voie unitaire par défaut, et non d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false et que la voie par défaut limite les inclusions de couverture aux tests unitaires non rapides avec fichiers source frères, le gate mesure la source détenue par cette voie plutôt que chaque import transitif qu’elle charge par hasard.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : exécution de tests modifiés intelligente et peu coûteuse. Elle exécute des cibles précises à partir des modifications directes de tests, des fichiers frères `*.test.ts`, des mappages source explicites et du graphe d’import local. Les modifications larges de configuration ou de package sont ignorées sauf si elles correspondent à des tests précis.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` : exécution large explicite des tests modifiés. Utilisez-la lorsqu’une modification du harnais de test, de configuration ou de package doit revenir au comportement plus large de Vitest pour les tests modifiés.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute le gate de vérification intelligente des modifications pour le diff par rapport à `origin/main`. Elle exécute les commandes de typecheck, lint et guard pour les voies architecturales affectées, mais n’exécute pas les tests Vitest. Utilisez `pnpm test:changed` ou un `pnpm test <target>` explicite pour la preuve de test.
- `pnpm test` : achemine les cibles explicites de fichier/répertoire vers des voies Vitest ciblées. Les exécutions sans cible utilisent des groupes de shards fixes et se développent en configurations feuilles pour une exécution parallèle locale ; le groupe d’extensions se développe toujours en configurations de shard par extension plutôt qu’en un énorme processus de projet racine.
- Les exécutions de l’enveloppe de test se terminent par un court résumé `[test] passed|failed|skipped ... in ...`. La ligne de durée propre à Vitest reste le détail par shard.
- État de test OpenClaw partagé : utilisez `src/test-utils/openclaw-test-state.ts` depuis Vitest lorsqu’un test a besoin d’un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuration, workspace, répertoire d’agent ou magasin de profils d’authentification isolé.
- Helpers E2E de processus : utilisez `test/helpers/openclaw-test-instance.ts` lorsqu’un test E2E Vitest au niveau processus a besoin d’un Gateway en cours d’exécution, d’un environnement CLI, d’une capture de logs et du nettoyage au même endroit.
- Helpers E2E Docker/Bash : les voies qui sourcent `scripts/lib/docker-e2e-image.sh` peuvent transmettre `docker_e2e_test_state_shell_b64 <label> <scenario>` dans le conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts multi-home peuvent transmettre `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. Les appelants de plus bas niveau peuvent utiliser `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` pour un extrait shell dans le conteneur, ou `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` pour un fichier d’environnement hôte pouvant être sourcé. Le `--` avant `create` empêche les runtimes Node plus récents de traiter `--env-file` comme un flag Node. Les voies Docker/Bash qui lancent un Gateway peuvent sourcer `scripts/lib/openclaw-e2e-instance.sh` dans le conteneur pour la résolution d’entrypoint, le démarrage OpenAI simulé, le lancement Gateway en premier plan/arrière-plan, les sondes de disponibilité, l’export de l’environnement d’état, les dumps de logs et le nettoyage de processus.
- Les exécutions de shards complètes, d’extensions et par motif d’inclusion mettent à jour les données de durée locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configuration entière utilisent ces durées pour équilibrer les shards lents et rapides. Les shards CI par motif d’inclusion ajoutent le nom du shard à la clé de durée, ce qui garde les durées de shards filtrés visibles sans remplacer les données de durée de configuration entière. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de durées.
- Certains fichiers de test `plugin-sdk` et `commands` sélectionnés passent désormais par des voies légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds en runtime sur leurs voies existantes.
- Les fichiers source avec tests frères sont mappés vers ce frère avant de revenir à des globs de répertoire plus larges. Les modifications de helpers sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’import local pour exécuter les tests importeurs au lieu de lancer largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` se scinde désormais aussi en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut, token et helpers de haut niveau.
- La configuration Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extensions/plugins. Les plugins de canal lourds, le plugin navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une seule voie de plugin groupé.
- `pnpm test:perf:imports` : active le reporting de durée d’import et de ventilation d’import Vitest, tout en continuant à utiliser le routage par voie ciblée pour les cibles explicites de fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure le chemin routé en mode modifications par rapport à l’exécution native du projet racine pour le même diff git commité.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de modifications du worktree actuel sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour l’exécuteur unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque configuration feuille Vitest de la suite complète et écrit les données de durée groupées ainsi que les artefacts JSON/log par configuration. L’agent de performance de test l’utilise comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur la performance.
- Intégration Gateway : activation volontaire via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end du Gateway (appairage multi-instance WS/HTTP/node). Par défaut, utilise `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` propre au fournisseur) pour ne pas être ignoré.
- `pnpm test:docker:all` : construit l’image live-test partagée, empaquette OpenClaw une fois sous forme d’archive npm, construit/réutilise une image d’exécuteur Node/Git nue ainsi qu’une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un planificateur pondéré. L’image nue (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) est utilisée pour les voies d’installation/mise à jour/dépendance de plugin ; ces voies montent l’archive préconstruite au lieu d’utiliser les sources du dépôt copiées. L’image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) est utilisée pour les voies de fonctionnalité normales de l’application construite. `scripts/package-openclaw-for-docker.mjs` est l’unique empaqueteur local/CI et valide l’archive ainsi que `dist/postinstall-inventory.json` avant que Docker ne la consomme. Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs` ; la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` ; `scripts/test-docker-all.mjs` exécute le plan sélectionné. `node scripts/test-docker-all.mjs --plan-json` émet le plan CI détenu par le planificateur pour les voies sélectionnées, les types d’images, les besoins en package/image live, les scénarios d’état et les vérifications d’identifiants sans construire ni exécuter Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les limites de voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les limites de fournisseurs valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus grands. Si une voie dépasse la pondération effective ou la limite de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécutera seule jusqu’à libérer de la capacité. Les démarrages de voies sont échelonnés de 2 secondes par défaut afin d’éviter des rafales de création du démon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. L’exécuteur effectue par défaut un préflight Docker, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI de fournisseurs entre voies compatibles, retente une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) et stocke les durées des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordonnancement du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour imprimer le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des durées. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` uniquement pour les voies déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` uniquement pour les voies de fournisseurs live ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les voies live principales et de fin dans un seul pool ordonné du plus long au plus court afin que les compartiments de fournisseurs puissent regrouper le travail Claude, Codex et Gemini. L’exécuteur cesse de planifier de nouvelles voies en pool après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un timeout de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin utilisent des limites par voie plus strictes. Les commandes de configuration Docker du backend CLI ont leur propre timeout via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les logs par voie, `summary.json`, `failures.json` et les durées de phase sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour inspecter les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour imprimer des commandes de relance ciblées et peu coûteuses.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source adossé à Chromium, démarre CDP brut plus un Gateway isolé, exécute `browser doctor --deep` et vérifie que les snapshots de rôle CDP incluent les URL de liens, les éléments cliquables promus par curseur, les références d’iframe et les métadonnées de frame.
- `pnpm test:docker:skill-install` : installe l’archive OpenClaw empaquetée dans un exécuteur Docker nu, désactive `skills.install.allowUploadedArchives`, résout un slug de skill actuel depuis la recherche live ClawHub, l’installe via `openclaw skills install` et vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.
- Les sondes Docker live du backend CLI peuvent être exécutées comme voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI dockerisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), tire une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unit/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway avec données initiales et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, la lecture des transcriptions, les métadonnées des pièces jointes, le comportement de la file d’événements en direct, le routage des envois sortants, ainsi que les notifications de canal et d’autorisation de style Claude via le véritable pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke test reflète ce que le pont émet réellement.
- `pnpm test:docker:upgrade-survivor` : installe l’archive tar OpenClaw empaquetée par-dessus une fixture d’ancien utilisateur en état modifié, exécute la mise à jour du paquet ainsi que doctor en mode non interactif sans clés de fournisseur ou de canal en direct, puis démarre un Gateway loopback et vérifie que les agents, la configuration des canaux, les listes d’autorisation de plugins, les fichiers d’espace de travail/de session, l’état obsolète des dépendances de plugins hérités, le démarrage et le statut RPC survivent.
- `pnpm test:docker:published-upgrade-survivor` : installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant sans clés de fournisseur ou de canal en direct, configure cette base avec une recette intégrée de commande `openclaw config set`, met à jour cette installation publiée vers l’archive tar OpenClaw empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis démarre un Gateway loopback et vérifie que les intentions configurées, les fichiers d’espace de travail/de session, la configuration obsolète des plugins et l’état des dépendances héritées, le démarrage, `/healthz`, `/readyz` et le statut RPC survivent ou se réparent proprement. Remplacez une base avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice locale exacte avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` comme `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ; l’ensemble reported-issues inclut `configured-plugin-installs` pour vérifier que les plugins OpenClaw externes configurés s’installent automatiquement pendant la mise à niveau, et `stale-source-plugin-shadow` pour empêcher les ombres de plugins uniquement source de casser le démarrage. Package Acceptance expose ces valeurs sous les noms `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` et `published_upgrade_survivor_scenarios`, et résout les jetons de base méta tels que `last-stable-4` ou `all-since-2026.4.23` avant de transmettre les spécifications exactes de paquets aux lanes Docker.
- `pnpm test:docker:update-migration` : exécute le harnais published-upgrade survivor dans le scénario `plugin-deps-cleanup`, fortement axé sur le nettoyage, en commençant par `openclaw@2026.4.23` par défaut. Le workflow distinct `Update Migration` développe cette lane avec `baselines=all-since-2026.4.23` afin que chaque paquet stable publié depuis `.23` soit mis à jour vers le candidat et prouve le nettoyage des dépendances de plugins configurés en dehors de la CI Full Release.
- `pnpm test:docker:plugins` : exécute un smoke test d’installation/mise à jour pour les chemins locaux, `file:`, les paquets du registre npm avec dépendances hissées, les références git mobiles, les fixtures ClawHub, les mises à jour du marketplace et l’activation/inspection du bundle Claude.

## Barrière locale de demande de fusion

Pour les vérifications locales de validation/barrière de demande de fusion, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur un hôte chargé, relancez-le une fois avant de le traiter comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banc d’essai de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Invite par défaut : « Réponds avec un seul mot : ok. Pas de ponctuation ni de texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- médiane minimax 1279 ms (min 1114, max 2431)
- médiane opus 2454 ms (min 1224, max 3170)

## Banc d’essai de démarrage de la CLI

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

La sortie inclut `sampleCount`, la moyenne, p50, p95, min/max, la distribution des codes de sortie/signaux et les résumés du RSS maximal pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la mesure du temps et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact de smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise la fixture de référence suivie dans le dépôt à `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture suivie dans le dépôt :

- `test/fixtures/cli-startup-bench.json`
- Actualisez avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels à la fixture avec `pnpm test:startup:bench:check`

## E2E d’intégration initiale (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests de smoke d’intégration initiale conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-tty, vérifie les fichiers de configuration/espace de travail/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’importation QR (Docker)

Vérifie que l’assistant d’exécution QR maintenu se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Liens associés

- [Tests](/fr/help/testing)
- [Tests en direct](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)

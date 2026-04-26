---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-26T11:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente de Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire sur les fichiers chargés, et non d’une couverture de tous les fichiers de l’ensemble du dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, la barrière mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source d’une voie fractionnée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : développe les chemins git modifiés en voies Vitest ciblées lorsque le diff ne touche que des fichiers source/test routables. Les modifications de config/setup reviennent toujours à l’exécution native des projets racine afin que les changements de câblage relancent largement les tests lorsque nécessaire.
- `pnpm test:changed:focused` : exécution de tests sur modifications pour la boucle interne. Il n’exécute que des cibles précises à partir des modifications directes de tests, des fichiers `*.test.ts` voisins, des mappages source explicites et du graphe d’import local. Les changements larges/de config/de package sont ignorés au lieu d’être développés vers le repli complet des tests modifiés.
- `pnpm changed:lanes` : affiche les voies d’architecture déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la barrière intelligente sur les fichiers modifiés par rapport à `origin/main`. Elle exécute le travail du cœur avec les voies de test du cœur, le travail des extensions avec les voies de test des extensions, le travail test-only avec seulement le typecheck/tests des tests, développe les changements publics du SDK Plugin ou du contrat de plugin en une passe de validation d’extension, et conserve les montées de version limitées aux métadonnées de release sur des vérifications ciblées de version/config/dépendances racine.
- `pnpm test` : route les cibles explicites fichier/répertoire via des voies Vitest ciblées. Les exécutions sans cible utilisent des groupes de shards fixes et se développent en configs feuilles pour une exécution parallèle locale ; le groupe d’extensions se développe toujours en configs de shards par extension au lieu d’un unique grand processus de projet racine.
- Les exécutions complètes, d’extensions et par motif d’inclusion de shards mettent à jour les données de timing locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes sur l’ensemble des configs utilisent ces timings pour équilibrer les shards lents et rapides. Les shards CI à motif d’inclusion ajoutent le nom du shard à la clé de timing, ce qui garde les timings des shards filtrés visibles sans remplacer les données de timing des configs complètes. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` sélectionnés sont désormais routés via des voies légères dédiées qui ne conservent que `test/setup.ts`, tout en laissant les cas lourds à l’exécution sur leurs voies existantes.
- Les fichiers source avec des tests voisins sont mappés vers ce test voisin avant de se rabattre sur des globs de répertoire plus larges. Les modifications d’assistants sous `test/helpers/channels` et `test/helpers/plugins` utilisent un graphe d’import local pour exécuter les tests importateurs au lieu de relancer largement chaque shard lorsque le chemin de dépendance est précis.
- `auto-reply` est désormais aussi scindé en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/jetons/helpers au niveau supérieur.
- La config Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans toutes les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extension/plugin. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme des shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une voie de plugin intégré unique.
- `pnpm test:perf:imports` : active le reporting de durée des imports + détail des imports de Vitest, tout en continuant à utiliser le routage ciblé des voies pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarke le chemin routé du mode changed par rapport à l’exécution native des projets racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` benchmarke l’ensemble de changements du worktree courant sans devoir valider d’abord.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque config feuille Vitest de la suite complète en série et écrit des données de durée groupées ainsi que des artefacts JSON/logs par config. Le Test Performance Agent l’utilise comme base de référence avant de tenter de corriger des tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de Gateway (pairage multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs détaillés.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour ne plus être ignoré.
- `pnpm test:docker:all` : construit une fois l’image partagée de tests live et l’image Docker E2E, puis exécute les voies smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les slots de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible au fournisseur et vaut 10 par défaut. Les plafonds des voies lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds par fournisseur valent par défaut une voie lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus puissants. Les démarrages de voie sont échelonnés de 2 secondes par défaut pour éviter les rafales de création sur le daemon Docker local ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner pré-vérifie Docker par défaut, nettoie les conteneurs OpenClaw E2E obsolètes, émet l’état des voies actives toutes les 30 secondes, partage les caches d’outils CLI des fournisseurs entre les voies compatibles, réessaie une fois par défaut les échecs transitoires des fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), et stocke les timings des voies dans `.artifacts/docker-tests/lane-timings.json` pour un ordre du plus long au plus court lors des exécutions ultérieures. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des voies sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour les voies déterministes/locales uniquement ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour les seules voies de fournisseurs live ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les voies live principales et de fin en un seul pool ordonné du plus long au plus court afin que les groupes par fournisseur puissent emballer ensemble le travail Claude, Codex et Gemini. Le runner cesse de planifier de nouvelles voies mutualisées après le premier échec sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque voie dispose d’un délai maximal de secours de 120 minutes remplaçable via `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/de fin sélectionnées utilisent des plafonds par voie plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les logs par voie sont écrits sous `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot` : construit un conteneur E2E source avec Chromium, démarre un CDP brut plus une Gateway isolée, exécute `browser doctor --deep`, et vérifie que les snapshots de rôle CDP incluent les URL de lien, les éléments cliquables promus par curseur, les refs d’iframe et les métadonnées de frame.
- Les sondes live Docker du backend CLI peuvent être exécutées comme des voies ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini ont des alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI conteneurisés avec Docker, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live exploitable (par exemple OpenAI dans `~/.profile`), récupère une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway pré-initialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversation routée, les lectures de transcript, les métadonnées de pièces jointes, le comportement de la file d’événements live, le routage d’envoi sortant, ainsi que les notifications de canal + permission de style Claude sur le vrai pont stdio. L’assertion sur les notifications Claude lit directement les trames MCP stdio brutes afin que le test smoke reflète ce que le pont émet réellement.

## Barrière PR locale

Pour les vérifications locales avant fusion/barrière PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur une machine chargée, relancez une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les machines contraintes en mémoire, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence de modèle (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : “Reply with a single word: ok. No punctuation or extra text.”

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279ms (min 1114, max 2431)
- opus médiane 2454ms (min 1224, max 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Préréglages :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux préréglages

La sortie inclut `sampleCount`, avg, p50, p95, min/max, la distribution des codes de sortie/signaux, et les résumés RSS max pour chaque commande. Les options `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la capture des timings et des profils utilise le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de la suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez-le avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker est facultatif ; cela n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-TTY, vérifie les fichiers de config/espace de travail/session, puis démarre la Gateway et exécute `openclaw health`.

## Test smoke d’import QR (Docker)

Garantit que le helper d’exécution QR maintenu se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Liens associés

- [Testing](/fr/help/testing)
- [Testing live](/fr/help/testing-live)

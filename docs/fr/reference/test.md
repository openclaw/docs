---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests en local (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-25T13:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Kit complet de tests (suites, live, Docker) : [Tests](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente de Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une porte de couverture unitaire basée sur les fichiers chargés, et non d’une couverture de tous les fichiers de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, la porte mesure les fichiers chargés par la suite de couverture unitaire au lieu de considérer chaque fichier source des lanes fractionnées comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : étend les chemins git modifiés en lanes Vitest ciblées lorsque le diff ne touche que des fichiers source/de test routables. Les modifications de config/setup reviennent toujours à l’exécution native des projets racine afin que les modifications de câblage relancent largement les tests lorsque nécessaire.
- `pnpm changed:lanes` : affiche les lanes d’architecture déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la porte intelligente sur les fichiers modifiés par rapport à `origin/main`. Elle exécute le travail du cœur avec les lanes de tests du cœur, le travail des extensions avec les lanes de tests des extensions, le travail limité aux tests avec uniquement le typage/tests des tests, étend les modifications publiques du SDK Plugin ou du contrat des plugins à un passage de validation d’extension, et maintient les incréments de version limités aux métadonnées de release sur des vérifications ciblées de version/config/dépendances racine.
- `pnpm test` : route les cibles explicites fichier/répertoire via des lanes Vitest ciblées. Les exécutions sans cible utilisent des groupes de fragments fixes et s’étendent aux configs feuille pour une exécution parallèle locale ; le groupe d’extensions s’étend toujours aux configs de fragment par extension au lieu d’un unique processus géant de projet racine.
- Les exécutions complètes et les fragments d’extensions mettent à jour les données de timing locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes utilisent ces timings pour équilibrer les fragments lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de timing local.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des lanes légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds à l’exécution sur leurs lanes existantes.
- Certains fichiers source d’aide `plugin-sdk` et `commands` font également mapper `pnpm test:changed` vers des tests frères explicites dans ces lanes légères, afin que de petites modifications d’aides évitent de relancer les suites lourdes adossées au runtime.
- `auto-reply` est maintenant également scindé en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut/token/helpers au niveau supérieur.
- La config Vitest de base utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans toutes les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extension/plugin. Les plugins de canal lourds, le plugin navigateur et OpenAI s’exécutent en fragments dédiés ; les autres groupes de plugins restent groupés. Utilisez `pnpm test extensions/<id>` pour une seule lane de plugin groupée.
- `pnpm test:perf:imports` : active le rapport de durée d’import + détail des imports de Vitest, tout en continuant à utiliser le routage ciblé par lane pour les cibles explicites fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` : compare le chemin du mode changed routé à l’exécution native des projets racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` : compare l’ensemble de modifications actuel du worktree sans devoir d’abord valider.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour l’exécuteur unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque config feuille Vitest de la suite complète en série et écrit des données de durée groupées ainsi que des artefacts JSON/log par config. L’agent de performance des tests utilise cela comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification axée sur les performances.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de Gateway (appairage multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux verbeux.
- `pnpm test:live` : exécute les tests live des fournisseurs (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour désactiver le saut.
- `pnpm test:docker:all` : construit une fois l’image partagée de tests live et l’image Docker E2E, puis exécute les lanes smoke Docker avec `OPENCLAW_SKIP_DOCKER_BUILD=1` via un ordonnanceur pondéré. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` contrôle les emplacements de processus et vaut 10 par défaut ; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` contrôle le pool de fin sensible aux fournisseurs et vaut 10 par défaut. Les plafonds des lanes lourdes valent par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` ; les plafonds par fournisseur valent par défaut une lane lourde par fournisseur via `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` et `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Utilisez `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` ou `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` pour des hôtes plus grands. Les démarrages de lane sont espacés de 2 secondes par défaut afin d’éviter les rafales de création sur le démon Docker local ; remplacez cela avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. L’exécuteur vérifie Docker au préalable par défaut, nettoie les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives toutes les 30 secondes, partage les caches d’outils CLI des fournisseurs entre les lanes compatibles, réessaie une fois par défaut les échecs transitoires de fournisseurs live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), et stocke les timings de lane dans `.artifacts/docker-tests/lane-timings.json` pour un ordonnancement du plus long au plus court lors des exécutions suivantes. Utilisez `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour afficher le manifeste des lanes sans exécuter Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` pour ajuster la sortie d’état, ou `OPENCLAW_DOCKER_ALL_TIMINGS=0` pour désactiver la réutilisation des timings. Utilisez `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` pour uniquement les lanes déterministes/locales ou `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` pour uniquement les lanes de fournisseurs live ; les alias de package sont `pnpm test:docker:local:all` et `pnpm test:docker:live:all`. Le mode live-only fusionne les lanes live principales et de fin en un seul pool du plus long au plus court afin que les groupes de fournisseurs puissent regrouper ensemble le travail Claude, Codex et Gemini. L’exécuteur cesse de planifier de nouvelles lanes mutualisées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane dispose d’un délai d’expiration de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines lanes live/de fin sélectionnées utilisent des plafonds par lane plus stricts. Les commandes de configuration Docker du backend CLI ont leur propre délai d’expiration via `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (180 par défaut). Les journaux par lane sont écrits sous `.artifacts/docker-tests/<run-id>/`.
- Les sondes Docker live du backend CLI peuvent être exécutées comme lanes ciblées, par exemple `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` ou `pnpm test:docker:live-cli-backend:codex:mcp`. Claude et Gemini disposent d’alias `:resume` et `:mcp` correspondants.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI conteneurisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe, et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway initialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversations routées, les lectures de transcriptions, les métadonnées de pièces jointes, le comportement de file d’événements live, le routage des envois sortants, ainsi que les notifications de canal + permissions de style Claude via le véritable pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Porte PR locale

Pour les vérifications locales de gate/atterrissage de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur un hôte chargé, relancez une fois avant de considérer cela comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les hôtes avec mémoire limitée, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

La sortie inclut `sampleCount`, avg, p50, p95, min/max, la distribution exit-code/signal, ainsi que des résumés de RSS max pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la capture de timing et de profil utilise le même harnais.

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

Ce script pilote l’assistant interactif via un pseudo-TTY, vérifie les fichiers de configuration/workspace/session, puis démarre le Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que l’assistant runtime QR maintenu se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Lié

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)

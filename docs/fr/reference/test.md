---
read_when:
    - Exécuter ou corriger des tests
summary: Comment exécuter les tests en local (Vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-04-24T08:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway persistant qui détient le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en collision avec une instance en cours d’exécution. Utilisez cette commande lorsqu’une exécution précédente de Gateway a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec la couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une porte de couverture unitaire sur les fichiers chargés, et non d’une couverture globale all-file de tout le dépôt. Les seuils sont de 70 % pour les lignes/fonctions/instructions et de 55 % pour les branches. Comme `coverage.all` vaut false, la porte mesure les fichiers chargés par la suite de couverture unitaire au lieu de considérer chaque fichier source de lane scindée comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : développe les chemins git modifiés en lanes Vitest ciblées lorsque le diff ne touche que des fichiers source/de test routables. Les changements de configuration/setup reviennent tout de même à l’exécution native des projets racine afin que les modifications de câblage relancent largement lorsque c’est nécessaire.
- `pnpm changed:lanes` : affiche les lanes d’architecture déclenchées par le diff par rapport à `origin/main`.
- `pnpm check:changed` : exécute la porte intelligente des changements pour le diff par rapport à `origin/main`. Elle exécute le travail du cœur avec les lanes de test du cœur, le travail des extensions avec les lanes de test des extensions, le travail limité aux tests avec uniquement le typecheck/tests des tests, étend les changements du Plugin SDK public ou du plugin-contract à un passage de validation d’extension, et maintient les incréments de version limités aux métadonnées de release sur des vérifications ciblées de version/configuration/dépendances racine.
- `pnpm test` : achemine les cibles explicites de fichier/répertoire via des lanes Vitest ciblées. Les exécutions sans cible utilisent des groupes de shards fixes et se développent en configurations feuille pour une exécution parallèle locale ; le groupe d’extensions se développe toujours en configurations de shard par extension au lieu d’un unique processus géant de projet racine.
- Les exécutions complètes et par shard d’extension mettent à jour les données locales de minutage dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes utilisent ensuite ces minutages pour équilibrer les shards lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de minutage.
- Certains fichiers de test `plugin-sdk` et `commands` sélectionnés sont désormais acheminés via des lanes légères dédiées qui ne conservent que `test/setup.ts`, en laissant les cas lourds en runtime sur leurs lanes existantes.
- Certains fichiers source utilitaires `plugin-sdk` et `commands` sélectionnés font également correspondre `pnpm test:changed` à des tests voisins explicites dans ces lanes légères, afin que de petites modifications d’utilitaires évitent de relancer les suites lourdes adossées au runtime.
- `auto-reply` est désormais lui aussi scindé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le harnais reply ne domine pas les tests plus légers de statut/token/utilitaires de niveau supérieur.
- La configuration de base Vitest utilise désormais par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans toutes les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les shards d’extension/plugin. Les plugins de canaux lourds, le plugin navigateur et OpenAI s’exécutent comme shards dédiés ; les autres groupes de plugins restent regroupés. Utilisez `pnpm test extensions/<id>` pour une seule lane de plugin groupé.
- `pnpm test:perf:imports` : active les rapports Vitest de durée d’import + détail des imports, tout en utilisant toujours le routage ciblé des lanes pour les cibles explicites de fichier/répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare en benchmark le chemin changed-mode acheminé à l’exécution native du projet racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` compare en benchmark l’ensemble de changements du worktree actuel sans devoir le valider d’abord.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute chaque configuration feuille Vitest de la suite complète en série et écrit des données de durée groupées ainsi que des artefacts JSON/log par configuration. Le Test Performance Agent utilise cela comme référence avant de tenter des corrections de tests lents.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` : compare les rapports groupés après une modification centrée sur la performance.
- Intégration Gateway : activation explicite via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de Gateway (appairage multi-instance WS/HTTP/node). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des logs verbeux.
- `pnpm test:live` : exécute les tests live du fournisseur (minimax/zai). Nécessite des clés API et `LIVE=1` (ou `*_LIVE_TEST=1` spécifique au fournisseur) pour lever le skip.
- `pnpm test:docker:all` : construit une fois l’image partagée de test live et l’image Docker E2E, puis exécute les lanes Docker smoke avec `OPENCLAW_SKIP_DOCKER_BUILD=1` avec une concurrence de 8 par défaut. Ajustez le pool principal avec `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` et le pool final sensible au fournisseur avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ; les deux valent 8 par défaut. Le démarrage des lanes est échelonné de 2 secondes par défaut pour éviter les tempêtes locales de création du daemon Docker ; remplacez cela avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Le runner cesse de planifier de nouvelles lanes groupées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini, et chaque lane possède un délai maximal de 120 minutes remplaçable via `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Les logs par lane sont écrits dans `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui` : démarre OpenClaw et Open WebUI conteneurisés, ouvre une session via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), télécharge une image Open WebUI externe et n’est pas censé être stable en CI comme les suites unitaires/e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway amorcé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte de conversation routée, la lecture des transcriptions, les métadonnées des pièces jointes, le comportement de la file d’événements live, le routage des envois sortants et les notifications de type Claude pour canal + permissions sur le vrai pont stdio. L’assertion de notification Claude lit directement les frames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Porte PR locale

Pour les vérifications locales de landing/porte de PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur une machine chargée, relancez-le une fois avant de le considérer comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les machines avec peu de mémoire, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence de modèle (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facultatif : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Répondez avec un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

Dernière exécution (2025-12-31, 20 exécutions) :

- minimax médiane 1279 ms (min 1114, max 2431)
- opus médiane 2454 ms (min 1224, max 3170)

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

La sortie inclut `sampleCount`, avg, p50, p95, min/max, la distribution exit-code/signal et les résumés de RSS max pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la mesure temporelle et la capture de profil utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` en utilisant `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` rafraîchit le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` en utilisant `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Rafraîchir avec `pnpm test:startup:bench:update`
- Comparer les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## E2E d’onboarding (Docker)

Docker est facultatif ; cela n’est nécessaire que pour les tests smoke d’onboarding conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-TTY, vérifie les fichiers de configuration/workspace/session, puis démarre Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que le helper runtime QR maintenu se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

## Liens connexes

- [Testing](/fr/help/testing)
- [Testing live](/fr/help/testing-live)

---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests en local (Vitest) et quand utiliser les modes force / coverage
title: Tests
x-i18n:
    generated_at: "2026-04-22T04:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Kit de test complet (suites, live, Docker) : [Testing](/fr/help/testing)

- `pnpm test:force` : tue tout processus Gateway résiduel qui occupe le port de contrôle par défaut, puis exécute la suite Vitest complète avec un port Gateway isolé afin que les tests serveur n’entrent pas en conflit avec une instance déjà en cours. Utilisez ceci lorsqu’une exécution Gateway précédente a laissé le port 18789 occupé.
- `pnpm test:coverage` : exécute la suite unitaire avec couverture V8 (via `vitest.unit.config.ts`). Il s’agit d’une barrière de couverture unitaire sur les fichiers chargés, et non d’une couverture globale de tous les fichiers du dépôt. Les seuils sont de 70 % pour les lignes / fonctions / instructions et 55 % pour les branches. Comme `coverage.all` est faux, la barrière mesure les fichiers chargés par la suite de couverture unitaire au lieu de traiter chaque fichier source des voies fragmentées comme non couvert.
- `pnpm test:coverage:changed` : exécute la couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:changed` : étend les chemins git modifiés en voies Vitest ciblées lorsque le diff ne touche que des fichiers source / test routables. Les changements de config / setup reviennent quand même à l’exécution native des projets racine, afin que les modifications de câblage relancent largement si nécessaire.
- `pnpm changed:lanes` : affiche les voies architecturales déclenchées par le diff contre `origin/main`.
- `pnpm check:changed` : exécute la barrière intelligente des fichiers modifiés pour le diff contre `origin/main`. Elle exécute le travail du cœur avec les voies de test du cœur, le travail des extensions avec les voies de test des extensions, le travail limité aux tests avec uniquement le typecheck / les tests des tests, étend les changements du SDK public du Plugin ou du plugin-contract à la validation des extensions, et garde les incréments de version limités aux métadonnées de release sur des vérifications ciblées de version / config / dépendances racine.
- `pnpm test` : route des cibles explicites de fichier / répertoire via des voies Vitest ciblées. Les exécutions non ciblées utilisent des groupes de fragments fixes et s’étendent vers des configs feuille pour une exécution locale en parallèle ; le groupe d’extensions s’étend toujours vers les configs de fragments par extension au lieu d’un seul processus géant de projet racine.
- Les exécutions complètes et fragmentées d’extensions mettent à jour les données locales de durée dans `.artifacts/vitest-shard-timings.json` ; les exécutions suivantes utilisent ces durées pour équilibrer les fragments lents et rapides. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de durée.
- Certains fichiers de test `plugin-sdk` et `commands` sont désormais routés via des voies légères dédiées qui ne conservent que `test/setup.ts`, laissant les cas lourds à l’exécution sur leurs voies existantes.
- Certains fichiers source helpers `plugin-sdk` et `commands` font également mapper `pnpm test:changed` vers des tests voisins explicites dans ces voies légères, afin que de petites modifications de helpers évitent de relancer les suites lourdes adossées au runtime.
- `auto-reply` est désormais aussi divisé en trois configs dédiées (`core`, `top-level`, `reply`) afin que le harnais de réponse ne domine pas les tests plus légers de statut / jeton / helper de niveau supérieur.
- La config Vitest de base utilise maintenant par défaut `pool: "threads"` et `isolate: false`, avec le runner partagé non isolé activé dans les configs du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extension / Plugin. Les extensions lourdes de canaux et OpenAI s’exécutent comme fragments dédiés ; les autres groupes d’extensions restent regroupés. Utilisez `pnpm test extensions/<id>` pour la voie d’un seul Plugin inclus.
- `pnpm test:perf:imports` : active les rapports Vitest de durée d’import + répartition des imports, tout en utilisant encore le routage ciblé par voie pour les cibles explicites de fichier / répertoire.
- `pnpm test:perf:imports:changed` : même profilage des imports, mais uniquement pour les fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure la voie changée routée par rapport à l’exécution native des projets racine pour le même diff git validé.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’ensemble de changements du worktree courant sans commit préalable.
- `pnpm test:perf:profile:main` : écrit un profil CPU pour le thread principal Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner` : écrit des profils CPU + heap pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- Intégration Gateway : activation opt-in via `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : exécute les tests smoke end-to-end de la Gateway (multi-instance WS / HTTP / appairage de nœuds). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez avec `OPENCLAW_E2E_WORKERS=<n>` et définissez `OPENCLAW_E2E_VERBOSE=1` pour des journaux détaillés.
- `pnpm test:live` : exécute les tests live des providers (minimax / zai). Nécessite des clés API et `LIVE=1` (ou le `*_LIVE_TEST=1` spécifique au provider) pour les démasquer.
- `pnpm test:docker:openwebui` : démarre OpenClaw + Open WebUI conteneurisés, se connecte via Open WebUI, vérifie `/api/models`, puis exécute un vrai chat proxifié via `/api/chat/completions`. Nécessite une clé de modèle live utilisable (par exemple OpenAI dans `~/.profile`), récupère une image Open WebUI externe, et n’est pas censé être stable en CI comme les suites unitaires / e2e normales.
- `pnpm test:docker:mcp-channels` : démarre un conteneur Gateway initialisé et un second conteneur client qui lance `openclaw mcp serve`, puis vérifie la découverte des conversations routées, la lecture des transcriptions, les métadonnées de pièces jointes, le comportement de file d’événements live, le routage d’envoi sortant, et les notifications de canal + permissions de style Claude sur le vrai pont stdio. L’assertion de notification Claude lit directement les trames MCP stdio brutes afin que le smoke reflète ce que le pont émet réellement.

## Barrière PR locale

Pour les vérifications locales de validation / fusion d’une PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` est instable sur une machine chargée, relancez une fois avant de le traiter comme une régression, puis isolez avec `pnpm test <path/to/test>`. Pour les machines à mémoire contrainte, utilisez :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latence des modèles (clés locales)

Script : [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Utilisation :

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt par défaut : « Reply with a single word: ok. No punctuation or extra text. »

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

La sortie inclut `sampleCount`, moyenne, p50, p95, min / max, distribution des codes de sortie / signaux, et résumés RSS max pour chaque commande. Les options facultatives `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 par exécution afin que la mesure du temps et la capture des profils utilisent le même harnais.

Conventions de sortie enregistrée :

- `pnpm test:startup:bench:smoke` écrit l’artefact smoke ciblé dans `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` écrit l’artefact de suite complète dans `.artifacts/cli-startup-bench-all.json` avec `runs=5` et `warmup=1`
- `pnpm test:startup:bench:update` actualise le fixture de référence versionné dans `test/fixtures/cli-startup-bench.json` avec `runs=5` et `warmup=1`

Fixture versionné :

- `test/fixtures/cli-startup-bench.json`
- Actualisez-le avec `pnpm test:startup:bench:update`
- Comparez les résultats actuels au fixture avec `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker est facultatif ; ceci n’est nécessaire que pour les tests smoke d’intégration initiale conteneurisés.

Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Ce script pilote l’assistant interactif via un pseudo-TTY, vérifie les fichiers de config / espace de travail / session, puis démarre la Gateway et exécute `openclaw health`.

## Smoke d’import QR (Docker)

Garantit que `qrcode-terminal` se charge sous les runtimes Node Docker pris en charge (Node 24 par défaut, Node 22 compatible) :

```bash
pnpm test:docker:qr
```

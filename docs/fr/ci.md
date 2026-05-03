---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez le déclenchement de ClawSweeper ou le transfert d’activité GitHub
summary: Graphe des jobs CI, gates de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-03T21:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le ciblage intelligent et déploient tout le graphe pour les release candidates et les validations larges. Les lanes Android restent opt-in via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute qu’à partir de [`Full Release Validation`](#full-release-validation) ou d’un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                            | Quand il s’exécute                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                      | Détecter les changements limités aux docs, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PRs non draft              |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                                       | Toujours sur les pushs et PRs non draft              |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux advisories npm                                     | Toujours sur les pushs et PRs non draft              |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                                    | Toujours sur les pushs et PRs non draft              |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances plus garde de l’allowlist des fichiers inutilisés                  | Changements concernant Node                          |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artifacts construits, et les artifacts réutilisables en aval    | Changements concernant Node                          |
| `checks-fast-core`               | Lanes de correction Linux rapides comme les vérifications bundled/plugin-contract/protocol                          | Changements concernant Node                          |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat de vérification agrégé stable                        | Changements concernant Node                          |
| `checks-node-core-test`          | Shards de tests Node cœur, hors lanes canaux, bundled, contrats et extensions                                       | Changements concernant Node                          |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, gardes, types de test, et smoke strict           | Changements concernant Node                          |
| `check-additional`               | Architecture, dérive shardée boundary/prompt, gardes d’extensions, frontière de package et surveillance Gateway     | Changements concernant Node                          |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                                   | Changements concernant Node                          |
| `checks`                         | Vérificateur pour les tests de canaux sur artifacts construits                                                      | Changements concernant Node                          |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                                     | Dispatch CI manuel pour les releases                 |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                                           | Docs modifiées                                       |
| `skills-python`                  | Ruff + pytest pour les Skills adossés à Python                                                                      | Changements concernant les Skills Python             |
| `checks-windows`                 | Tests spécifiques Windows de processus/chemins plus régressions partagées de spécificateurs d’import runtime        | Changements concernant Windows                       |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artifacts construits partagés                                          | Changements concernant macOS                         |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                                         | Changements concernant macOS                         |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build d’APK debug                                             | Changements concernant Android                       |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après activité fiable                                                | Succès de la CI principale ou dispatch manuel        |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.4 live | Planifié et dispatch manuel                          |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes de ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artifacts et de matrices de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI sauf si l’exécution la plus récente pour la même ref échoue aussi. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, sans toutefois se mettre en file après que tout le workflow a déjà été remplacé. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les exécutions plus récentes de main. Les exécutions manuelles de la suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Portée et routage

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection `changed-scope` et fait agir le manifeste preflight comme si chaque zone portée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node plus le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de core-test, et les modifications étroites de helpers/tests de routage de contrats Plugin** utilisent un chemin de manifeste rapide Node uniquement : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artifacts de build, la compatibilité Node 22, les contrats de canaux, les shards cœur complets, les shards de Plugins bundled et les matrices de gardes supplémentaires lorsque le changement est limité aux surfaces de routage ou de helpers exercées directement par la tâche rapide.
- **Les vérifications Node Windows** sont limitées aux wrappers de processus/chemins spécifiques Windows, aux helpers de runners npm/pnpm/UI, à la config du gestionnaire de packages et aux surfaces du workflow CI qui exécutent cette lane ; les changements sans rapport dans les sources, Plugins, install-smoke et tests restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont scindées ou équilibrées afin que chaque job reste petit sans sur-réserver des runners : les contrats de canaux s’exécutent en trois shards pondérés, les lanes core unit fast/support s’exécutent séparément, l’infra runtime cœur est scindée entre shards état et processus/config, auto-reply s’exécute avec des workers équilibrés (avec le sous-arbre reply scindé en shards agent-runner, dispatch et commands/state-routing), et les configs agentiques gateway/server sont scindées sur des lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artifacts construits. Les tests larges navigateur, QA, média et plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all Plugin partagé. Les shards à motifs d’inclusion enregistrent des entrées de timing avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canary de frontière de package et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste de gardes de frontière est répartie sur quatre shards de matrice, chacun exécutant simultanément des gardes indépendantes sélectionnées et imprimant les timings par vérification, y compris `pnpm prompt:snapshots:check`, afin que la dérive de prompt du chemin heureux runtime Codex soit rattachée à la PR qui l’a causée. La surveillance Gateway, les tests de canaux et le shard de frontière de support cœur s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor tiers n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile tout de même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging d’APK debug en double à chaque push concernant Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de Plugin dynamique, générées, build, live-test et pont de package que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout ni n’exécute de code de pull request non fiable. Le workflow crée un token GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis dispatch des payloads `repository_dispatch` compacts vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issue et de pull request ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits de commentaires ou de reviews lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale relève de l’observation, pas d’une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne devrait publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, éditions, bruit de bots, bruit de Webhook en doublon et trafic normal de reviews devraient produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de review, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatchs manuels

Les dispatchs CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque lane scoped non Android : shards Linux Node, shards de plugins intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke build, vérifications docs, Skills Python, Windows, macOS et i18n de Control UI. Les dispatchs CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’umbrella de release complète active Android en passant `include_android=true`. Les vérifications statiques de prérelease de Plugin, le shard `agentic-plugins` réservé à la release, le sweep complet par lot des extensions et les lanes Docker de prérelease de plugin sont exclus de la CI. La suite Docker de prérelease s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec le gate de validation de release activé.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution push ou PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/bundled, vérifications de contrats de canaux shardées, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file de 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

## Équivalents locaux

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performances OpenClaw

`OpenClaw Performance` est le workflow de performances produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le dispatch manuel benchmarke normalement la ref du workflow. Définissez `target_ref` pour benchmarker un tag de release ou une autre branche avec l’implémentation de workflow actuelle. Les chemins de rapports publiés et les pointeurs latest sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testé, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova sur un runtime buildé localement avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profiling CPU/heap/trace pour les hotspots de démarrage, Gateway et tour d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : timing de démarrage Gateway et mémoire pour les cas de démarrage par défaut, hook et 50 plugins ; boucles hello répétées mock-OpenAI `channel-chat-baseline` ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown de sonde source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commite aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur de la ref testée actuelle est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de release complète

`Full Release Validation` est le workflow umbrella manuel pour « tout exécuter avant la release ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves plugin/package/statique/Docker réservées à la release, et déclenche `OpenClaw Release Checks` pour install smoke, acceptation de package, suites Docker du chemin de release, live/E2E, OpenWebUI, parité QA Lab, Matrix et lanes Telegram. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des release checks. Après publication, passez `npm_telegram_package_spec` pour réexécuter la même lane de package Telegram contre le package npm publié.

Consultez [Validation de release complète](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des jobs de workflow, les différences de profils, les artefacts et les
handles de réexécution ciblée.

`OpenClaw Release Publish` est le workflow de release mutateur manuel. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de release, puis déclenche seulement ensuite
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour la preuve par commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque `headSha` de workflow enfant correspond à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur umbrella échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de release. Les
workflows de release manuelle utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la large matrice consultative fournisseur/média.

- `minimum` conserve les lanes OpenAI/noyau critiques pour la release les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseur/média.

Le workflow englobant enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat englobant et le résumé des temps.

Pour la reprise, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de release, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prérelease de Plugin, `release-checks` pour chaque enfant de release, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow englobant. Cela maintient bornée la relance d’une boîte de release en échec après un correctif ciblé.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact au workflow Docker live/E2E du chemin de release et au shard d’acceptation de package. Cela garde les octets du package cohérents entre les boîtes de release et évite de repackager le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent le workflow englobant plus ancien. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, de sorte qu’une validation plus récente de main
ne reste pas bloquée derrière une ancienne exécution de release-check de deux heures. La validation de branche/tag
de release et les groupes de relance ciblés gardent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute comme shards nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche série :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- tâches `native-live-src-gateway-profiles` filtrées par fournisseur
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards audio/vidéo média séparés et shards musicaux filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en facilitant la relance et le diagnostic des échecs lents de fournisseurs live. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches média ne vérifient que les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les tâches conteneurisées ne conviennent pas au lancement de tests Docker imbriqués.

Les shards live de modèles/backends adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une fois, puis les shards Docker live de modèle, de Gateway shardé par fournisseur, de backend CLI, de liaison ACP et de harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de release-check. Si ces shards reconstruisent indépendamment la cible Docker complète des sources, l’exécution de release est mal configurée et gaspillera du temps horloge en builds d’image dupliqués.

## Acceptation de package

Utilisez `Package Acceptance` lorsque la question est : « ce package OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence des sources, tandis que l’acceptation de package valide une seule archive tar via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive tar, prépare les images Docker de digest de package lorsque nécessaire, et exécute les lanes Docker sélectionnées contre ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis déploie ces lanes comme tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` quand Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la lane Telegram optionnelle a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de release OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prérelease/stable publiée.
- `source=ref` empaquette une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est joignable depuis l’historique de branche du dépôt ou un tag de release, installe les dépendances dans un worktree détaché, et l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais doit être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks complets Docker de chemin de release avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation de package publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les déclenchements autonomes.

Pour la politique dédiée aux tests de mise à jour et de Plugin, y compris les commandes locales,
les lanes Docker, les entrées Package Acceptance, les valeurs par défaut de release et le triage des échecs,
consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent Package Acceptance avec `source=artifact`, l’artefact de package de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` et `telegram_mode=mock-openai`. Cela maintient la migration de package, la mise à jour, le nettoyage de dépendances de Plugin obsolètes, la réparation d’installation de Plugin configuré, le Plugin hors ligne, la mise à jour de Plugin et la preuve Telegram sur la même archive tar de package résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un package npm livré au lieu de l’artefact construit depuis le SHA. Les vérifications de release multi-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme spécifiques à l’OS ; la validation produit package/mise à jour doit commencer par Package Acceptance. La lane Docker `published-upgrade-survivor` valide une base de référence de package publié par exécution. Dans Package Acceptance, l’archive tar `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base de référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de relance de lane échouée préservent cette base de référence. Définissez `published_upgrade_survivor_baselines=all-since-2026.4.23` pour étendre la CI Full Release à chaque release npm stable de `2026.4.23` à `latest` ; `release-history` reste disponible pour un échantillonnage manuel plus large avec l’ancien point d’ancrage antérieur à cette date. Définissez `published_upgrade_survivor_scenarios=reported-issues` pour étendre les mêmes bases de référence à des fixtures façonnées comme des issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances de Plugin héritées obsolètes. Le workflow séparé `Update Migration` utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, garder une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la base de référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les lanes fraîches Windows empaquetées et installateur vérifient aussi qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke OpenAI multi-OS de tour d’agent utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres de compatibilité héritée bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tar ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes de la fixture fake git dérivée de l’archive tar et peut journaliser l’absence de `update.channel` persisté ;
- les smokes Plugin peuvent lire des emplacements hérités d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut également avertir pour les fichiers de tampon de métadonnées de build local qui ont déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

### Exemples

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lanes, les minutages de phases et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer toute la validation de release.

## Smoke test d’installation

Le workflow distinct `Install Smoke` réutilise le même script de périmètre via son propre job `preflight`. Il divise la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de Plugin intégré, ou les surfaces principales de Plugin/canal/Gateway/SDK Plugin exercées par les jobs de smoke Docker. Les changements de Plugin intégré limités au code source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression des agents dans l’espace de travail partagé, exécute l’e2e du réseau Gateway de conteneur, vérifie un argument de build de Plugin intégré et exécute le profil Docker borné de Plugin intégré sous un délai d’expiration agrégé de 240 secondes pour la commande, chaque exécution Docker de scénario étant plafonnée séparément.
- **Chemin complet** conserve la couverture d’installation de package QR et Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release via workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installateur/update et l’E2E Docker rapide de Plugin intégré en tant que jobs séparés afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushes sur `main`, y compris les commits de merge, ne forcent pas le chemin complet ; lorsque la logique de périmètre modifié demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent d’installation globale Bun pour le fournisseur d’image est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute lors de la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les pull requests et les pushes sur `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une seule fois sous forme de tarball npm et construit deux images partagées `scripts/e2e/Dockerfile` :

- un runner Node/Git minimal pour les lanes installateur/update/dépendances de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normales.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et le runner exécute uniquement le plan sélectionné. Le planificateur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                      |
| -------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de slots du pool principal pour les lanes normales.                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de slots du pool final sensible aux fournisseurs.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond de lanes live concurrentes afin que les fournisseurs ne limitent pas le débit.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                | Plafond de lanes d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond de lanes multi-services concurrentes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai d’expiration de secours par lane (120 minutes) ; certaines lanes live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset             | `1` affiche le plan du planificateur sans exécuter les lanes.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset             | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécuter seule jusqu’à libérer de la capacité. Le préflight agrégé local vérifie Docker, supprime les anciens conteneurs E2E OpenClaw, émet l’état des lanes actives, persiste les minutages de lanes pour un ordre du plus long au plus court, et arrête par défaut de planifier de nouvelles lanes groupées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, type d’image, image live, lane et identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images E2E Docker GHCR minimales/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les récupérations d’images Docker sont retentées avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Chunks du chemin de release

La couverture Docker de release exécute de plus petits jobs découpés avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque chunk récupère uniquement le type d’image dont il a besoin et exécute plusieurs lanes via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les chunks Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de lane `install-e2e` reste l’alias de réexécution manuelle agrégé pour les deux lanes d’installation de fournisseurs.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un chunk autonome `openwebui` uniquement pour les déclenchements OpenWebUI seuls. Les lanes de mise à jour de canaux intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque chunk téléverse `.artifacts/docker-tests/` avec les journaux de lanes, les minutages, `summary.json`, `failures.json`, les minutages de phases, le JSON du plan du planificateur, les tableaux de lanes lentes et les commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées sur les images préparées au lieu des jobs de chunks, ce qui limite le débogage d’une lane échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes GitHub générées de réexécution par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Prérelease Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il répartit les tests de Plugins intégrés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois, avec un worker Vitest par groupe et un heap Node plus grand afin que les lots de Plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin Docker de prérelease réservé aux releases regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## Labo QA

Le Labo QA dispose de lanes CI dédiées en dehors du workflow principal à périmètre intelligent. La parité agentique est imbriquée sous les harnais QA et de release larges, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie la lane de parité simulée, la lane Matrix live, ainsi que les lanes Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les lanes de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal du Plugin fournisseur. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité des fournisseurs est couverte par les suites distinctes modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un déclenchement manuel `matrix_profile=all` segmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les lanes QA Lab critiques pour la release avant l’approbation de la release ; son gate de parité QA exécute les packs candidat et de référence comme jobs de lanes parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/check à périmètre limité au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité de premier passage restreint, et non une analyse complète du dépôt. Les exécutions quotidiennes, manuelles et de garde pour les pull requests non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevée/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent hors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, cron et base de référence du Gateway                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus runtime des Plugins de canal, Gateway, Plugin SDK, secrets et points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de stratégie SSRF du cœur, analyse d’IP, garde réseau, récupération web et Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et gardes d’exécution d’outils d’agent                       |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, loader, manifeste, registre, installation par gestionnaire de paquets, chargement de source et contrat de paquet du Plugin SDK |

### Fragments de sécurité propres à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit exécuteur Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non sécuritaire correspondant. Il n’exécute que des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non sécuritaires sur des surfaces restreintes à forte valeur, sur le plus petit exécuteur Blacksmith Linux. Sa garde de pull request est volontairement plus réduite que le profil planifié : les PR non brouillon n’exécutent que les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements de code d’exécution de commandes/modèles/outils d’agent et de distribution des réponses, de schéma/migration/E/S de configuration, d’authentification/secrets/sandbox/sécurité, de canaux du cœur et runtime des Plugins de canal groupés, de protocole Gateway/méthodes serveur, de runtime mémoire/glue SDK, de MCP/processus/livraison sortante, de runtime fournisseur/catalogue de modèles, de diagnostics de session/files de livraison, de loader de Plugin, de contrat Plugin SDK/paquet ou de runtime de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow qualité exécutent les douze fragments qualité de PR.

Le déclenchement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils restreints sont des points d’accroche d’apprentissage/itération pour exécuter un fragment qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour authentification, secrets, sandbox, cron et Gateway                                                                            |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, migration, normalisation et E/S                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du cœur et des Plugins de canal groupés                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats de runtime pour exécution de commandes, distribution modèle/fournisseur, distribution et files d’auto-réponse, et plan de contrôle ACP                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et passerelles d’outils, assistants de supervision de processus, et contrats de livraison sortante                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades de runtime mémoire, alias mémoire du Plugin SDK, glue d’activation du runtime mémoire, et commandes doctor mémoire                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/bundles de journaux, et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, assistants de payload/découpage/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur, et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’UI de contrôle, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime pour récupération/recherche web du cœur, E/S média, compréhension média, génération d’images et génération média                              |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de loader, registre, surface publique et points d’entrée du Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté paquet publié et assistants de contrat de paquet Plugin                                                                                 |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans brouiller le signal de sécurité. L’extension CodeQL à Swift, Python et aux Plugins groupés devrait être réintroduite sous forme de suivi restreint ou fragmenté uniquement après stabilisation du runtime et du signal des profils restreints.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non bot sur `main` peut le déclencher, et le déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée au cours de la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non bot sur `main` peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur toute la suite, laisse Codex n’effectuer que de petites corrections de performance de tests préservant la couverture au lieu de refactorisations larges, puis relance le rapport sur toute la suite et rejette les changements qui réduisent le nombre de tests réussis dans la base de référence. Si la base de référence contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport sur toute la suite après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’arrive, la voie rebase le patch validé, relance `pnpm check:changed`, puis réessaie le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

### PR en double après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut un dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies modifiées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck prod du cœur et test du cœur, plus lint/gardes du cœur ;
- les changements uniquement de tests du cœur exécutent seulement le typecheck test du cœur, plus le lint du cœur ;
- les changements de production d’extension exécutent le typecheck prod d’extension et test d’extension, plus le lint d’extension ;
- les changements uniquement de tests d’extension exécutent le typecheck test d’extension, plus le lint d’extension ;
- les changements publics du Plugin SDK ou de contrat Plugin s’étendent au typecheck d’extension parce que les extensions dépendent de ces contrats du cœur (les analyses Vitest d’extensions restent un travail de test explicite) ;
- les montées de version uniquement de métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements root/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La configuration partagée de livraison group-room fait partie des mappings explicites : les changements de configuration de réponse visible de groupe, du mode de livraison de réponse source ou du prompt système de l’outil de message passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez transversal au harnais pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une instance fraîchement préparée pour une validation large. Avant de lancer une vérification lente sur une instance réutilisée, expirée ou qui vient de signaler une synchronisation anormalement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans l’instance.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions de fichiers suivis. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette instance et préparez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs avec de nombreuses suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux exceptionnellement volumineux.

Crabbox est le second chemin d’instance distante propre au dépôt pour la validation Linux lorsque Blacksmith n’est pas disponible ou lorsque la capacité cloud détenue est préférable. Préparez une instance, hydratez-la via le workflow du projet, puis exécutez les commandes avec la CLI Crabbox :

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` détient les valeurs par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et les magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution et de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` détient le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission de l’environnement non secret que les commandes ultérieures `crabbox run --id <cbx_id>` sourcent.

## Liens connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

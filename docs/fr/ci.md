---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez le routage de ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, regroupements de publication et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-05T01:44:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le périmétrage intelligent et déploient le graphe complet pour les candidats de release et la validation large. Les lanes Android restent opt-in via `include_android`. La couverture des Plugins réservée aux releases se trouve dans le workflow séparé [`Prépublication de Plugin`](#plugin-prerelease) et ne s’exécute qu’à partir de [`Validation complète de release`](#full-release-validation) ou d’un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                      | Quand il s’exécute                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les périmètres modifiés, les extensions modifiées et construire le manifeste CI | Toujours sur les pushs non brouillons et les PR |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                                  | Toujours sur les pushs non brouillons et les PR |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                      | Toujours sur les pushs non brouillons et les PR |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                               | Toujours sur les pushs non brouillons et les PR |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde allowlist des fichiers inutilisés                 | Changements pertinents pour Node                |
| `build-artifacts`                | Construire `dist/`, la Control UI, les vérifications d’artefacts construits et les artefacts aval réutilisables | Changements pertinents pour Node                |
| `checks-fast-core`               | Lanes de correction Linux rapides, comme les vérifications bundled/plugin-contract/protocol                    | Changements pertinents pour Node                |
| `checks-fast-contracts-channels` | Vérifications sharded des contrats de canaux avec un résultat de vérification agrégé stable                    | Changements pertinents pour Node                |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors lanes de canaux, bundled, contrats et extensions                            | Changements pertinents pour Node                |
| `check`                          | Équivalent sharded de la porte locale principale : types prod, lint, gardes, types de test et smoke strict     | Changements pertinents pour Node                |
| `check-additional`               | Architecture, drift sharded des frontières/prompts, gardes d’extension, frontière de package et Gateway watch  | Changements pertinents pour Node                |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                              | Changements pertinents pour Node                |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits                                                 | Changements pertinents pour Node                |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                                | Déclenchement CI manuel pour les releases       |
| `check-docs`                     | Formatage, lint et vérifications de liens brisés de la documentation                                           | Docs modifiées                                  |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                                                | Changements pertinents pour les skills Python   |
| `checks-windows`                 | Tests de processus/chemins propres à Windows, plus régressions partagées des spécificateurs d’import runtime   | Changements pertinents pour Windows             |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                     | Changements pertinents pour macOS               |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                                    | Changements pertinents pour macOS               |
| `android`                        | Tests unitaires Android pour les deux flavors, plus un build APK debug                                         | Changements pertinents pour Android             |
| `test-performance-agent`         | Optimisation quotidienne par Codex des tests lents après activité fiable                                       | Succès de la CI principale ou dispatch manuel   |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.4 live | Dispatch planifié et manuel                     |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les vérifications agrégées des shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, mais sans se mettre en file après que tout le workflow a déjà été supplanté. La clé de concurrence CI automatique est versionnée (`CI-v7-*`), afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les exécutions plus récentes sur main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications de workflows CI** valident le graphe CI Node plus le linting de workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications de fixtures de tests cœur peu coûteuses, et les modifications étroites d’aides/tests de routage des contrats de Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards complets du cœur, les shards de Plugins bundled et les matrices de gardes additionnelles lorsque le changement est limité aux surfaces de routage ou d’aides que la tâche rapide exerce directement.
- **Les vérifications Windows Node** sont limitées aux wrappers de processus/chemins propres à Windows, aux aides de runners npm/pnpm/UI, à la configuration de gestionnaire de packages et aux surfaces de workflows CI qui exécutent cette lane ; les changements sans rapport de sources, de Plugins, d’install-smoke et de tests seuls restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans réserver trop de runners : les contrats de canaux s’exécutent en trois shards pondérés, les lanes rapides/support d’unités cœur s’exécutent séparément, l’infrastructure runtime cœur est divisée entre shards d’état et de processus/config, auto-reply s’exécute avec des workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentiques Gateway/server sont divisées entre lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et Plugins divers utilisent leurs configurations Vitest dédiées plutôt que le catch-all partagé des Plugins. Les shards par motifs d’inclusion enregistrent les entrées de timing avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration complète d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canary de frontière de package et sépare l’architecture de topologie runtime de la couverture Gateway watch ; la liste des gardes de frontière est répartie sur quatre shards de matrice, chacun exécutant des gardes indépendantes sélectionnées en parallèle et affichant les timings par vérification, y compris `pnpm prompt:snapshots:check`, afin que le drift des prompts du chemin heureux du runtime Codex soit rattaché à la PR qui l’a causé. Gateway watch, les tests de canaux et le shard de frontière de support du cœur s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparés ; sa lane de tests unitaires compile tout de même le flavor avec les indicateurs BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug dupliqué à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip avec `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de Plugins dynamiques, générées, de build, de live-test et de pont de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout ni n’exécute de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’item, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale relève de l’observation, pas d’une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures, modifications, bruit de bots, bruit de Webhooks dupliqués et trafic normal de revue doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables sur tout ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque lane à portée non Android : shards Linux Node, shards de plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de build, vérifications de docs, Skills Python, Windows, macOS et i18n de Control UI. Les dispatches CI manuels autonomes exécutent uniquement Android avec `include_android=true`; l’umbrella de version complète active Android en passant `include_android=true`. Les vérifications statiques de préversion de Plugin, le shard `agentic-plugins` réservé aux releases, le balayage complet par lots des extensions et les lanes Docker de préversion de Plugin sont exclus de la CI. La suite de préversion Docker s’exécute uniquement lorsque `Full Release Validation` dispatche le workflow `Plugin Prerelease` séparé avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de version candidate ne soit pas annulée par une autre exécution de push ou de PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe contre une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow de la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/plugins groupés, vérifications de contrats de canaux shardées, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps d’attente de file 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

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

## Performance OpenClaw

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute quotidiennement sur `main` et peut être dispatché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Un dispatch manuel benchmarke normalement la ref du workflow. Définissez `target_ref` pour benchmarker un tag de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs latest sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testé, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime buildé localement avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds au démarrage, dans le Gateway et lors d’un tour d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré quand `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes de source natives OpenClaw après le passage Kova : timing de démarrage du Gateway et mémoire dans les cas de démarrage par défaut, avec hook et avec 50 plugins ; boucles répétées de salutations `channel-chat-baseline` mock-OpenAI ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown des sondes de source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Quand `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sondes de source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la ref testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de release complète

`Full Release Validation` est le workflow umbrella manuel pour « tout exécuter avant la release ». Il accepte une branche, un tag ou un SHA de commit complet, dispatche le workflow `CI` manuel avec cette cible, dispatche `Plugin Prerelease` pour les preuves réservées aux releases de Plugin/package/statique/Docker, et dispatche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package multi-OS, la parité QA Lab, Matrix et les lanes Telegram. Les exécutions stables/par défaut gardent la couverture exhaustive live/E2E et du chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation de cette couverture soak afin que la validation large des avis reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des vérifications de release. Après publication, passez `npm_telegram_package_spec` pour réexécuter la même lane de package Telegram contre le package npm publié.

Voir [validation de release complète](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des jobs de workflow, les différences de
profils, les artefacts et les handles de réexécution ciblée.

`OpenClaw Release Publish` est le workflow de release manuel et mutateur. Dispatchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
dispatche `Plugin NPM Release` pour tous les packages de Plugin publiables, dispatche
`Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite dispatche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve par commit épinglé sur une branche qui évolue vite, utilisez l’aide au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’aide pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
dispatche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque
workflow enfant a un `headSha` qui correspond à la cible, et supprime la branche temporaire quand
l’exécution se termine. Le vérificateur umbrella échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de publication. Les workflows de publication manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous voulez intentionnellement la large matrice consultative de fournisseurs/médias. `run_release_soak` contrôle si les vérifications de publication stables/par défaut exécutent le soak exhaustif live/E2E et Docker du chemin de publication ; `full` force l’activation du soak.

- `minimum` conserve les lanes OpenAI/core critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative de fournisseurs/médias.

L’umbrella enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente afin d’actualiser le résultat umbrella et le récapitulatif des timings.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prépublication de Plugin, `release-checks` pour chaque enfant de publication, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur l’umbrella. Cela permet de borner la relance d’une boîte de publication échouée après un correctif ciblé. Pour une lane cross-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes cross-OS émettent des lignes Heartbeat et les récapitulatifs packaged-upgrade incluent les timings par phase. Les lanes QA des release-checks sont consultatives, donc les échecs QA uniquement avertissent, mais ne bloquent pas le vérificateur des release-checks.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre la référence sélectionnée une fois en une archive `release-package-under-test`, puis transmet cet artefact aux vérifications cross-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de publication lorsque la couverture de soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de publication et évite de reconditionner le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent l’umbrella plus ancien. Le moniteur parent annule tout workflow enfant
qu’il a déjà déclenché lorsque le parent est annulé, afin que la validation main
plus récente ne reste pas derrière une ancienne exécution de release-check de deux heures. La validation de branche/tag de publication et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche série :

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
- shards média audio/vidéo séparés et shards musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les tâches conteneurisées ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards live modèle/backend adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de publication live construit et pousse cette image une seule fois, puis les shards modèle live Docker, Gateway segmenté par fournisseur, backend CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des plafonds explicites de `timeout` au niveau du script, inférieurs au délai d’expiration de la tâche du workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des release-checks. Si ces shards reconstruisent indépendamment la cible Docker source complète, l’exécution de publication est mal configurée et gaspillera du temps réel sur des constructions d’image dupliquées.

## Package Acceptance

Utilisez `Package Acceptance` lorsque la question est : « ce package OpenClaw installable fonctionne-t-il comme produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que Package Acceptance valide une seule archive via le même harnais Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker package-digest si nécessaire, et exécute les lanes Docker sélectionnées contre ce package au lieu de packager l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une fois, puis distribue ces lanes en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spec npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la lane Telegram optionnelle a échoué.

### Sources de candidats

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prépublication/stable publiée.
- `source=ref` package une branche, un tag ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou un tag de publication, installe les dépendances dans un worktree détaché, puis le package avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel, mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est packagé lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks complets Docker du chemin de publication avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation du package publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spec npm publiée conservé pour les déclenchements autonomes.

Pour la politique dédiée de test des mises à jour et des Plugins, y compris les commandes locales,
les lanes Docker, les entrées Package Acceptance, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les release checks appellent Package Acceptance avec `source=artifact`, l’artefact de package de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la preuve de migration de package, mise à jour, nettoyage de dépendances de Plugin obsolètes, réparation d’installation de Plugin configuré, Plugin hors ligne, mise à jour de Plugin et Telegram sur la même archive de package résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un package npm livré plutôt que l’artefact construit depuis le SHA. Les release checks cross-OS couvrent toujours l’onboarding, l’installeur et le comportement de plateforme propres à l’OS ; la validation produit package/mise à jour devrait commencer par Package Acceptance. La lane Docker `published-upgrade-survivor` valide une base de référence de package publié par exécution dans le chemin de publication bloquant. Dans Package Acceptance, l’archive `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base de référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de relance de lane échouée préservent cette base de référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines=all-since-2026.4.23` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la couverture à chaque publication npm stable de `2026.4.23` à `latest` et à des fixtures calquées sur les issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugin OpenClaw configurées, les chemins de journaux avec tilde et les racines de dépendances de Plugin héritées obsolètes. Le workflow distinct `Update Migration` utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des specs de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la base de référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les lanes Windows fresh packagées et installeur vérifient également qu’un package installé peut importer un remplacement browser-control depuis un chemin Windows absolu brut. Le smoke agent-turn cross-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas cet indicateur ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes depuis la fixture fake git dérivée de l’archive et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de Plugin peuvent lire d’anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance de l’enregistrement d’installation marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut aussi avertir pour les fichiers d’empreinte de métadonnées de build locales qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lorsque vous déboguez une exécution d’acceptation de package échouée, commencez par le récapitulatif `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lanes, les timings de phases et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer la validation complète de release.

## Vérification d’installation

Le workflow séparé `Install Smoke` réutilise le même script de périmètre via son propre job `preflight`. Il répartit la couverture de vérification entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de plugins groupés, ou les surfaces de Plugin SDK, Gateway, channel ou plugin cœur que les jobs de vérification Docker exercent. Les changements de plugins groupés limités aux sources, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image du Dockerfile racine une seule fois, vérifie la CLI, exécute la vérification CLI de suppression d’agents dans l’espace de travail partagé, exécute l’e2e du réseau Gateway en conteneur, vérifie un argument de build d’extension groupée, et exécute le profil Docker borné des plugins groupés avec un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker d’installation/mise à jour pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release via workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image de vérification du Dockerfile racine GHCR au SHA cible, puis exécute l’installation de package QR, les vérifications du Dockerfile racine/Gateway, les vérifications d’installation/mise à jour, et l’E2E Docker rapide des plugins groupés comme jobs séparés afin que le travail d’installation n’attende pas derrière les vérifications de l’image racine.

Les pushes sur `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de périmètre modifié demanderait une couverture complète sur un push, le workflow conserve la vérification Docker rapide et laisse la vérification complète d’installation aux validations nocturnes ou de release.

La vérification lente du fournisseur d’images avec installation globale Bun est contrôlée séparément par `run_bun_global_install_smoke`. Elle s’exécute selon la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les pull requests et les pushes sur `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, emballe OpenClaw une seule fois sous forme d’archive tar npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les lanes installateur/mise à jour/dépendance de plugin ;
- une image fonctionnelle qui installe la même archive tar dans `/app` pour les lanes de fonctionnalité normale.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                      |
| -------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre d’emplacements du pool principal pour les lanes normales.                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre d’emplacements du pool de fin sensible aux fournisseurs.                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond de lanes live concurrentes afin que les fournisseurs ne limitent pas le débit.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                | Plafond de lanes d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond de lanes multiservices concurrentes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de lanes pour éviter des rafales de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai de secours par lane (120 minutes) ; les lanes live/de fin sélectionnées utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset             | `1` affiche le plan du planificateur sans exécuter les lanes.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset             | Liste exacte de lanes séparées par des virgules ; ignore la vérification de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. Le prévol agrégé local vérifie Docker, supprime les conteneurs OpenClaw E2E obsolètes, émet l’état des lanes actives, persiste les timings de lanes pour l’ordonnancement du plus long au plus court, et cesse par défaut de planifier de nouvelles lanes mises en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, de type d’image, d’image live, de lane et d’identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et récapitulatifs GitHub. Il emballe OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire de l’archive tar ; construit et pousse des images Docker E2E GHCR nues/fonctionnelles étiquetées avec le digest du package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué soit réessayé rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Fragments du chemin de release

La couverture Docker de release exécute des jobs fragmentés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque fragment ne tire que le type d’image dont il a besoin et exécute plusieurs lanes via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les fragments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés plugin/runtime. L’alias de lane `install-e2e` reste l’alias de réexécution manuelle agrégée pour les deux lanes d’installation fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un fragment autonome `openwebui` uniquement pour les déclenchements propres à OpenWebUI. Les lanes de mise à jour de channels groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque fragment téléverse `.artifacts/docker-tests/` avec les journaux de lanes, timings, `summary.json`, `failures.json`, timings de phases, JSON du plan du planificateur, tableaux des lanes lentes et commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées sur les images préparées au lieu des jobs de fragments, ce qui limite le débogage d’une lane échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Prérelease Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests de plugins groupés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de prérelease Docker réservé à la release regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## Laboratoire QA

Le laboratoire QA dispose de lanes CI dédiées en dehors du workflow principal à périmètre intelligent. La parité agentique est imbriquée sous les harnais QA et de release larges, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur déclenchement manuel ; il déploie en éventail la lane de parité mock, la lane Matrix live, et les lanes Telegram et Discord live en jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les lanes de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de channel soit isolé de la latence des modèles live et du démarrage normal des plugins fournisseurs. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle live, de fournisseur natif et de fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; un déclenchement manuel `matrix_profile=all` répartit toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les lanes QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packages candidats et de référence comme jobs de lanes parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/check à périmètre limité au lieu de traiter la parité comme un état requis.

## CodeQL

Le workflow `CodeQL` est volontairement un analyseur de sécurité de première passe étroit, et non un balayage complet du dépôt. Les exécutions de garde quotidiennes, manuelles et sur demandes d’extraction non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à haute confiance filtrées sur les valeurs `security-severity` élevées/critiques.

La garde des demandes d’extraction reste légère : elle ne démarre que pour les modifications sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent hors des valeurs par défaut des demandes d’extraction.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, cron et socle Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux cœur, ainsi que l’exécution du plugin de canal, le Gateway, le SDK Plugin, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces cœur de politique SSRF, analyse d’IP, garde réseau, récupération web et SSRF du SDK Plugin                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et gardes d’exécution d’outils d’agent                     |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour l’installation de Plugin, le chargeur, le manifeste, le registre, l’installation par gestionnaire de paquets, le chargement de source et le contrat de paquet du SDK Plugin |

### Fragments de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Compile l’application Android manuellement pour CodeQL sur le plus petit exécuteur Blacksmith Linux accepté par le contrôle de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Compile l’application macOS manuellement pour CodeQL sur Blacksmith macOS, filtre les résultats de compilation des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes parce que la compilation macOS domine le temps d’exécution même lorsqu’elle est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript sans sécurité et de sévérité erreur, sur des surfaces étroites à forte valeur, sur le plus petit exécuteur Blacksmith Linux. Sa garde des demandes d’extraction est volontairement plus petite que le profil planifié : les demandes d’extraction non brouillon n’exécutent que les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant le code d’exécution de commandes/modèles/outils d’agent et de distribution de réponses, le code de schéma/migration/E/S de configuration, le code d’authentification/secrets/bac à sable/sécurité, l’exécution cœur des canaux et des plugins de canal intégrés, le protocole Gateway/la méthode serveur, la colle d’exécution mémoire/SDK, MCP/processus/livraison sortante, le catalogue d’exécution/modèles de fournisseurs, les diagnostics de session/files de livraison, le chargeur de Plugin, le contrat SDK Plugin/paquet, ou l’exécution de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze fragments de qualité des demandes d’extraction.

Le déclenchement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentification, secrets, bac à sable, cron et code de frontière de sécurité Gateway                                                                              |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, migration, normalisation et E/S                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux cœur et des plugins de canal intégrés                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèles/fournisseurs, distribution et files de réponses automatiques, et contrats d’exécution du plan de contrôle ACP         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades d’exécution mémoire, alias mémoire du SDK Plugin, colle d’activation de l’exécution mémoire et commandes doctor mémoire            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/bundles de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK Plugin, assistants de payload/fragmentation/exécution de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte de fournisseurs, enregistrement d’exécution de fournisseurs, valeurs par défaut/catalogues de fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats d’exécution du plan de contrôle des tâches                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d’exécution cœur de récupération/recherche web, E/S médias, compréhension média, génération d’images et génération de médias                              |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de chargeur, registre, surface publique et points d’entrée du SDK Plugin                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source SDK Plugin côté paquet publié et assistants de contrat de paquet plugin                                                                                     |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL à Swift, Python et aux plugins intégrés devrait être réajoutée uniquement comme travail de suivi borné ou fragmenté, une fois que les profils étroits ont un temps d’exécution et un signal stables.

## Workflows de maintenance

### Agent Docs

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder la documentation existante alignée avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, et le déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’à `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage documentaire.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, mais il s’arrête si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette garde d’activité quotidienne. La voie produit un rapport de performance Vitest groupé de suite complète, laisse Codex faire seulement de petites corrections de performance de tests qui préservent la couverture au lieu de larges refactorisations, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis dans la référence. Si la référence contient des tests en échec, Codex ne peut corriger que les échecs évidents, et le rapport de suite complète après agent doit passer avant tout commit. Lorsque `main` avance avant que le push du bot n’aboutisse, la voie rebase le patch validé, réexécute `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### Demandes d’extraction dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut un mode simulation et ne ferme les demandes d’extraction explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la demande d’extraction intégrée est fusionnée et que chaque doublon a soit un ticket référencé commun, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gardes de vérification locale et routage des changements

La logique locale des voies de changements se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette garde de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production cœur exécutent la vérification de types cœur prod et cœur test, ainsi que le lint/les gardes cœur ;
- les changements cœur uniquement de test exécutent seulement la vérification de types cœur test, ainsi que le lint cœur ;
- les changements de production d’extension exécutent la vérification de types extension prod et extension test, ainsi que le lint extension ;
- les changements d’extension uniquement de test exécutent la vérification de types extension test, ainsi que le lint extension ;
- les changements du SDK Plugin public ou du contrat de plugin s’étendent à la vérification de types des extensions parce que les extensions dépendent de ces contrats cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les montées de version uniquement de métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests, les modifications de source privilégient les correspondances explicites, puis les tests frères et les dépendants du graphe d’import. La configuration de livraison partagée des salles de groupe fait partie des correspondances explicites : les changements de la configuration de réponse visible au groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse cœur ainsi que les régressions de livraison Discord et Slack afin qu’un changement de valeur par défaut partagée échoue avant le premier push de demande d’extraction. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large au niveau du harnais pour que l’ensemble mappé peu coûteux ne soit pas un substitut fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une nouvelle box préchauffée pour une preuve large. Avant de lancer une gate lente sur une box qui a été réutilisée, a expiré ou vient de signaler une synchronisation étonnamment volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la box.

Le contrôle de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette box et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs avec de nombreuses suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` met également fin à une invocation locale de la Blacksmith CLI qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux exceptionnellement volumineux.

Crabbox est le wrapper de box distante détenu par le dépôt pour les preuves Linux des mainteneurs. Utilisez-le lorsqu’un contrôle est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve nécessite des secrets, Docker, des lanes de paquets, des boxes réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli en cas de pannes Blacksmith, de problèmes de quota ou de tests explicites sur capacité détenue.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut pour le cloud détenu.

Gate des changements :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Réexécution de test ciblée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Suite complète :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox ponctuelles adossées à Blacksmith devraient arrêter la Testbox automatiquement ; si une exécution est interrompue ou si le nettoyage est incertain, inspectez les boxes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même box hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez Blacksmith directement comme solution de repli étroite :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Ne passez à la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` définit les valeurs par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions pour les lanes de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` définit le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes `crabbox run --id <cbx_id>` sur cloud détenu.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez l’envoi ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, validations globales de release et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-05T06:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans lien ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le cadrage intelligent et déploient tout le graphe pour les release candidates et la validation large. Les lanes Android restent optionnelles via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Détecter les changements limités aux docs, les scopes modifiés, les extensions modifiées et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit de workflow via `zizmor`                                               | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production, sans dépendances, par rapport aux advisories npm                         | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushes et PR non brouillons |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde de la liste d’autorisation des fichiers inutilisés | Changements liés à Node                     |
| `build-artifacts`                | Construire `dist/`, l’UI de contrôle, les vérifications d’artefacts construits et les artefacts réutilisables en aval | Changements liés à Node                     |
| `checks-fast-core`               | Lanes rapides de correction Linux, comme les vérifications groupées/contrat Plugin/protocole              | Changements liés à Node                     |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat agrégé stable                           | Changements liés à Node                     |
| `checks-node-core-test`          | Fragments de tests Core Node, hors lanes canal, groupées, contrat et extension                            | Changements liés à Node                     |
| `check`                          | Équivalent fragmenté de la gate locale principale : types prod, lint, gardes, types de test et smoke strict | Changements liés à Node                     |
| `check-additional`               | Architecture, dérive fragmentée des limites/prompts, gardes d’extension, limite de package et surveillance Gateway | Changements liés à Node                     |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke mémoire au démarrage                                            | Changements liés à Node                     |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits                                             | Changements liés à Node                     |
| `checks-node-compat-node22`      | Build de compatibilité Node 22 et lane smoke                                                              | Déclenchement manuel CI pour les releases   |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                                 | Docs modifiées                              |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                                           | Changements liés aux Skills Python          |
| `checks-windows`                 | Tests spécifiques à Windows sur processus/chemins, plus régressions partagées de spécificateurs d’import runtime | Changements liés à Windows                  |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements liés à macOS                    |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                               | Changements liés à macOS                    |
| `android`                        | Tests unitaires Android pour les deux saveurs, plus un build APK de debug                                 | Changements liés à Android                  |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après activité fiable                                      | Succès CI principal ou déclenchement manuel |
| `openclaw-performance`           | Rapports quotidiens/à la demande de performance runtime Kova avec lanes fournisseur mock, profil profond et GPT 5.4 live | Déclenchement planifié et manuel            |

## Ordre d’échec rapide

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice artefacts et plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateforme et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin de signaler quand même les échecs normaux de fragments, sans se mettre en file après que tout le workflow a déjà été supplanté. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Scope et routage

La logique de scope se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone scopée avait changé.

- **Les modifications des workflows CI** valident le graphe CI Node et le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests core, et les modifications étroites d’aides/tests de routage de contrats Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les fragments core complets, les fragments de Plugins groupés et les matrices de gardes additionnelles lorsque le changement se limite aux surfaces de routage ou d’aides que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont limitées aux wrappers processus/chemins spécifiques à Windows, aux aides npm/pnpm/runner UI, à la config de gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements de sources, Plugin, install-smoke et tests seuls sans lien restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont découpées ou équilibrées afin que chaque job reste petit sans sur-réserver les runners : les contrats de canaux s’exécutent en trois fragments pondérés, les lanes core unit fast/support s’exécutent séparément, l’infrastructure runtime core est répartie entre des fragments state et process/config, auto-reply s’exécute en workers équilibrés (avec le sous-arbre reply découpé en fragments agent-runner, dispatch et commands/state-routing), et les configs agentic gateway/server sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. Les tests larges navigateur, QA, média et Plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all Plugin partagé. Les fragments par motifs d’inclusion enregistrent les entrées de timing avec le nom de fragment CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un fragment filtré. `check-additional` regroupe le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste des gardes de limites est répartie sur quatre fragments de matrice, chacun exécutant des gardes indépendants sélectionnés en parallèle et imprimant les timings par vérification, y compris `pnpm prompt:snapshots:check` afin que la dérive du prompt du chemin heureux runtime Codex soit rattachée à la PR qui l’a causée. La surveillance Gateway, les tests de canaux et le fragment support-boundary core s’exécutent en parallèle dans `build-artifacts` une fois `dist/` et `dist-runtime/` déjà construits.

Android CI exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK de debug Play. La saveur tierce n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile quand même la saveur avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant un job de packaging APK de debug en double à chaque push lié à Android.

Le fragment `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde unused-file échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non révisé ou laisse une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de Plugins dynamiques, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement les métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits de commentaires ou de revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé dans le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale relève de l’observation, pas de la livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, modifications, bruit de bots, bruit de Webhook dupliqué et trafic de revue normal doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les dispatchs CI manuels exécutent le même graphe de tâches que la CI normale, mais forcent l’activation de chaque lane à portée non Android : shards Linux Node, shards de plugins intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de build, vérifications docs, Skills Python, Windows, macOS et i18n Control UI. Les dispatchs CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prérelease Plugin, le shard `agentic-plugins` réservé aux releases, le balayage complet par lot des extensions et les lanes Docker de prérelease Plugin sont exclus de la CI. La suite Docker de prérelease s’exécute uniquement lorsque `Full Release Validation` dispatche le workflow `Plugin Prerelease` distinct avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution de push ou de PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, une balise ou un SHA de commit complet tout en utilisant le fichier de workflow de la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/intégrés, vérifications de contrats de canaux en shards, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file d’attente plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisaient) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |

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

Le dispatch manuel benchmarke normalement la ref du workflow. Définissez `target_ref` pour benchmarker une balise de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs latest sont indexés par la ref testée, et chaque `index.md` consigne la ref/SHA testé, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénario.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une authentification compatible OpenAI factice et déterministe.
- `mock-deep-profile` : profilage CPU/heap/trace pour les points chauds de démarrage, Gateway et tour d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : timing de démarrage Gateway et mémoire pour les cas de démarrage par défaut, hook et 50 plugins ; boucles hello répétées mock-OpenAI `channel-chat-baseline` ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown des sondes source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la ref testée est écrit comme `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de release

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la release ». Il accepte une branche, une balise ou un SHA de commit complet, dispatche le workflow manuel `CI` avec cette cible, dispatche `Plugin Prerelease` pour la preuve plugins/packages/statique/Docker réservée aux releases, et dispatche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package cross-OS, la parité QA Lab, Matrix et les lanes Telegram. Les exécutions stables/par défaut gardent la couverture live/E2E exhaustive et le chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force cette couverture soak afin que la validation d’advisory large reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des vérifications de release. Après publication, passez `npm_telegram_package_spec` pour relancer la même lane de package Telegram contre le package npm publié.

Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et
les handles de relance ciblés.

`OpenClaw Release Publish` est le workflow de release manuel et mutateur. Dispatchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence de la balise de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
dispatche `Plugin NPM Release` pour tous les packages Plugin publiables, dispatche
`Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite dispatche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue vite, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des balises, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
dispatche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque
workflow enfant `headSha` correspond à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur ombrelle échoue aussi si un workflow enfant s’est exécuté sur un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de publication. Les workflows de publication manuelle utilisent `stable` par défaut ; utilisez `full` seulement lorsque vous voulez intentionnellement la large matrice consultative de fournisseurs/médias. `run_release_soak` contrôle si les vérifications de publication stables/par défaut exécutent le soak exhaustif live/E2E et Docker du chemin de publication ; `full` force l’activation du soak.

- `minimum` conserve les lanes critiques de publication OpenAI/core les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/back-ends.
- `full` exécute la large matrice consultative de fournisseurs/médias.

Le workflow parapluie enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat parapluie et le résumé des timings.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prépublication de Plugin, `release-checks` pour chaque enfant de publication, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow parapluie. Cela permet de borner la relance d’une boîte de publication échouée après une correction ciblée. Pour une seule lane cross-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes cross-OS émettent des lignes de heartbeat et les résumés packaged-upgrade incluent les timings par phase. Les lanes QA des vérifications de publication sont consultatives ; les échecs uniquement QA avertissent donc sans bloquer le vérificateur des vérifications de publication.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre la ref sélectionnée une fois en une archive tar `release-package-under-test`, puis transmet cet artefact aux vérifications cross-OS et à l’acceptation du package, ainsi qu’au workflow Docker live/E2E du chemin de publication lorsque la couverture de soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de publication et évite de reconditionner le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent le workflow parapluie plus ancien. Le moniteur parent annule tout workflow enfant
qu’il a déjà déclenché lorsque le parent est annulé, de sorte qu’une validation main plus récente
ne reste pas bloquée derrière une exécution obsolète de vérifications de publication de deux heures. La validation de branche/tag de publication et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Fragments live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche sérielle :

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
- fragments audio/vidéo média séparés et fragments musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour des relances manuelles ponctuelles.

Les fragments média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux : les tâches conteneurisées ne sont pas l’endroit approprié pour lancer des tests Docker imbriqués.

Les fragments live de modèles/back-ends adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` pour chaque commit sélectionné. Le workflow de publication live construit et pousse cette image une fois, puis les fragments Docker live de modèles, Gateway par fournisseur, back-end CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Gateway Docker portent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche du workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de publication. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de publication est mal configurée et gaspillera du temps réel en constructions d’images dupliquées.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide une seule archive tar via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat package unique, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la ref de workflow, la ref de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive tar, prépare les images Docker à résumé de package si nécessaire, et exécute les lanes Docker sélectionnées contre ce package au lieu de conditionner l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une fois, puis diffuse ces lanes en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du package en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la lane Telegram facultative a échoué.

### Sources de candidats

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prépublication/publication stable publiée.
- `source=ref` conditionne une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est joignable depuis l’historique de branche du dépôt ou depuis un tag de publication, installe les dépendances dans un worktree détaché, puis le conditionne avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un seul `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est conditionné lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter une ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments Docker complets du chemin de publication avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation de package publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tandis que le chemin de spécification npm publiée est conservé pour les déclenchements autonomes.

Pour la politique dédiée de mise à jour et de test des Plugins, y compris les commandes locales,
les lanes Docker, les entrées d’acceptation du package, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de publication appellent l’acceptation du package avec `source=artifact`, l’artefact de package de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la migration de package, la mise à jour, le nettoyage de dépendances de Plugins obsolètes, la réparation d’installation de Plugins configurés, le Plugin hors ligne, la mise à jour de Plugins et la preuve Telegram sur la même archive tar de package résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un package npm publié au lieu de l’artefact construit depuis le SHA. Les vérifications de publication cross-OS couvrent toujours l’intégration, l’installeur et le comportement de plateforme propres à l’OS ; la validation produit du package/de la mise à jour devrait commencer par l’acceptation du package. La lane Docker `published-upgrade-survivor` valide une ligne de base de package publié par exécution dans le chemin de publication bloquant. Dans l’acceptation du package, l’archive tar `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la ligne de base publiée de repli, par défaut `openclaw@latest` ; les commandes de relance de lane échouée préservent cette ligne de base. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin d’élargir aux quatre dernières publications npm stables plus des publications de frontière de compatibilité Plugin épinglées et des fixtures en forme de problèmes pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugins OpenClaw configurées, les chemins de journaux avec tilde et les racines de dépendances de Plugins héritées obsolètes. Les sélections published-upgrade survivor multi-lignes de base sont fragmentées par ligne de base en tâches runner Docker ciblées séparées. Le workflow distinct `Update Migration` utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question est le nettoyage exhaustif des mises à jour publiées, et non l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent transmettre des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la ligne de base avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json` et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les lanes fraîches Windows packagées et installeur vérifient aussi qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke de tour d’agent OpenAI cross-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation du package dispose de fenêtres de compatibilité héritée bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tar ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce flag ;
- `update-channel-switch` peut retirer les `pnpm.patchedDependencies` manquantes de la fixture git factice dérivée de l’archive tar et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de Plugin peuvent lire les emplacements hérités des enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet publié `2026.4.26` peut aussi émettre un avertissement pour des fichiers d’horodatage de métadonnées de build local qui avaient déjà été livrés. Les paquets ultérieurs doivent satisfaire aux contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de paquet échouée, commencez par le résumé `resolve_package` pour confirmer la source du paquet, sa version et son SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux des lanes, les minutages des phases et les commandes de réexécution. Préférez réexécuter le profil de paquet échoué ou les lanes Docker exactes plutôt que de relancer toute la validation de release.

## Test de fumée d’installation

Le workflow séparé `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il divise la couverture de fumée en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/paquet, les changements de paquet/manifeste de plugins intégrés, ou les surfaces centrales plugin/canal/gateway/Plugin SDK exercées par les jobs de fumée Docker. Les changements de plugins intégrés limités au code source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le test de fumée CLI de suppression d’agents avec espace de travail partagé, exécute l’e2e du réseau de Gateway en conteneur, vérifie un argument de build d’extension intégrée et exécute le profil Docker borné de plugin intégré avec un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve la couverture d’installation de paquet QR et Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement les surfaces installateur/paquet/Docker. En mode complet, install-smoke prépare ou réutilise une image de fumée Dockerfile racine GHCR pour le SHA cible, puis exécute l’installation de paquet QR, les fumées Dockerfile racine/Gateway, les fumées installateur/update et l’E2E Docker rapide des plugins intégrés comme des jobs séparés afin que le travail de l’installateur n’attende pas derrière les fumées de l’image racine.

Les poussées sur `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée modifiée demanderait une couverture complète sur une poussée, le workflow conserve la fumée Docker rapide et laisse la fumée d’installation complète à la validation nocturne ou de release.

La fumée lente d’installation globale Bun pour image-provider est contrôlée séparément par `run_bun_global_install_smoke`. Elle s’exécute selon la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les pull requests et les poussées sur `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois comme archive npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git nu pour les lanes installateur/update/dépendance de plugin ;
- une image fonctionnelle qui installe la même archive dans `/app` pour les lanes de fonctionnalité normale.

Les définitions de lanes Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur réside dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                       |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de créneaux du pool principal pour les lanes normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de créneaux du pool final sensible aux fournisseurs.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de lanes live concurrentes afin que les fournisseurs ne limitent pas le débit.          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de lanes d’installation npm concurrentes.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de lanes multi-services concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de repli par lane (120 minutes) ; certaines lanes live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` affiche le plan du planificateur sans exécuter les lanes.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Liste exacte de lanes séparées par des virgules ; ignore la fumée de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécuter seule jusqu’à libérer sa capacité. Les précontrôles agrégés locaux vérifient Docker, suppriment les conteneurs E2E OpenClaw obsolètes, émettent le statut des lanes actives, persistent les minutages de lanes pour l’ordre du plus long au plus court, et cessent par défaut de planifier de nouvelles lanes groupées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels paquet, type d’image, image live, lane et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de paquet de l’exécution courante, ou télécharge un artefact de paquet depuis `package_artifact_run_id` ; valide l’inventaire de l’archive ; construit et pousse des images E2E Docker GHCR nues/fonctionnelles taguées par digest de paquet via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec paquet installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes taguées par digest de paquet au lieu de reconstruire. Les extractions d’images Docker sont retentées avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux registry/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Morceaux du chemin de release

La couverture Docker de release exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque morceau ne tire que le type d’image dont il a besoin et exécute plusieurs lanes via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés plugin/runtime. L’alias de lane `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux lanes d’installateur de fournisseurs.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète release-path le demande, et conserve un morceau autonome `openwebui` uniquement pour les déclenchements limités à OpenWebUI. Les lanes de mise à jour des canaux intégrés réessaient une fois en cas de défaillances réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de lanes, les minutages, `summary.json`, `failures.json`, les minutages des phases, le JSON du plan du planificateur, les tableaux de lanes lentes et les commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées contre les images préparées au lieu des jobs de morceaux, ce qui limite le débogage d’une lane échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de paquet pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le paquet et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute chaque jour la suite Docker release-path complète.

## Prérelease de Plugin

`Plugin Prerelease` est une couverture produit/paquet plus coûteuse ; c’est donc un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les poussées sur `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests de plugins intégrés sur huit workers d’extension ; ces jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration de plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de plugins riches en imports ne créent pas de jobs CI supplémentaires. Le chemin de prérelease Docker réservé aux releases regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines d’exécuteurs pour des jobs d’une à trois minutes.

## QA Lab

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les grands harnais QA et release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une large exécution de validation.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie en éventail la lane de parité simulée, la lane Matrix live et les lanes Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les lanes de transport live Matrix et Telegram avec le fournisseur simulé déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des plugins de fournisseurs. Le Gateway de transport live désactive la recherche en mémoire parce que la parité QA couvre séparément le comportement mémoire ; la connectivité des fournisseurs est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un déclenchement manuel `matrix_profile=all` divise toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les lanes QA Lab critiques pour la release avant l’approbation de release ; sa porte de parité QA exécute les packs candidat et de référence comme jobs de lanes parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves de CI/vérification ciblées au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité étroit de première passe, et non un balayage complet du dépôt. Les exécutions de garde quotidiennes, manuelles et de pull request non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à haute confiance filtrées sur une `security-severity` élevée/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, Cron et base de référence du Gateway                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur plus le runtime de Plugin de canal, le Gateway, le Plugin SDK, les secrets, les points d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse IP, garde réseau, récupération web et politique SSRF du Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante et gardes d’exécution d’outils d’agent                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, du chargeur, du manifeste, du registre, de l’installation par gestionnaire de packages, du chargement de source et du contrat de package du Plugin SDK |

### Fragments de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build de dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même quand il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript sans sécurité, de sévérité erreur, sur des surfaces étroites à forte valeur sur le plus petit runner Blacksmith Linux. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillon n’exécutent que les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements de code d’exécution de commandes/modèles/outils d’agent et d’envoi de réponses, de schéma/migration/E/S de config, d’authentification/secrets/bac à sable/sécurité, de runtime du canal du cœur et du Plugin de canal groupé, de protocole/méthode serveur du Gateway, de runtime mémoire/glue SDK, de livraison MCP/processus/sortante, de runtime fournisseur/catalogue de modèles, de diagnostics de session/files de livraison, de chargeur de Plugin, de contrat Plugin SDK/package ou de runtime de réponse du Plugin SDK. Les changements de config CodeQL et de workflow qualité exécutent les douze fragments qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des hooks pédagogiques/d’itération pour exécuter un fragment qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                                                |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de config, migration, normalisation et E/S                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole du Gateway et contrats de méthodes serveur                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal du cœur et du Plugin de canal groupé                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, dispatch modèle/fournisseur, dispatch et files de réponse automatique, et contrats de runtime du plan de contrôle ACP                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, helpers de supervision de processus et contrats de livraison sortante                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades de runtime mémoire, alias mémoire du Plugin SDK, glue d’activation du runtime mémoire et commandes doctor mémoire                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, helpers de liaison/livraison de session sortante, surfaces d’événements de diagnostic/bundles de logs et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch de réponse entrante du Plugin SDK, helpers de charge utile/découpage/runtime de réponse, options de réponse de canal, files de livraison et helpers de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte fournisseur, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’UI de contrôle, persistance locale, flux de contrôle du Gateway et contrats de runtime du plan de contrôle des tâches                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime pour récupération/recherche web du cœur, E/S média, compréhension des médias, génération d’images et génération de médias                          |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du Plugin SDK                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté package publié et helpers de contrat de package de Plugin                                                                                   |

La qualité reste séparée de la sécurité afin que les résultats qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL pour Swift, Python et les Plugins groupés ne doit être réajoutée comme travail de suivi ciblé ou fragmenté qu’après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder la documentation existante alignée sur les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, et le dispatch manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il passe en revue la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage documentation.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé de suite complète, permet à Codex de n’apporter que de petites corrections de performance de test préservant la couverture au lieu de refontes larges, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests passants de la ligne de base. Si la ligne de base contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot arrive, la voie rebase le patch validé, réexécute `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent de documentation.

### PR dupliquées après merge

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut le mode dry-run et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est mergée et que chaque doublon a soit une issue référencée partagée, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Garde-fous de vérification locale et routage des changements

La logique locale de voies de changements réside dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette garde de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types prod du cœur et tests du cœur plus lint/gardes du cœur ;
- les changements seulement de tests du cœur exécutent uniquement la vérification de types des tests du cœur plus lint du cœur ;
- les changements de production d’extension exécutent la vérification de types prod d’extension et tests d’extension plus lint d’extension ;
- les changements seulement de tests d’extension exécutent la vérification de types des tests d’extension plus lint d’extension ;
- les changements publics du Plugin SDK ou de contrat de Plugin s’étendent à la vérification de types d’extension parce que les extensions dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les augmentations de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés réside dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappages explicites, puis les tests voisins et les dépendants du graphe d’imports. La config partagée de livraison de salon de groupe fait partie des mappages explicites : les changements de la config de réponse visible par le groupe, du mode de livraison de réponse source ou du prompt système de l’outil de message passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche assez largement le harnais pour que l’ensemble mappé léger ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une boîte fraîchement préparée pour les preuves larges. Avant de lancer une porte lente sur une boîte réutilisée, expirée ou qui vient de signaler une synchronisation anormalement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

Le contrôle de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette boîte et préparez-en une fraîche au lieu de déboguer l’échec du test produit. Pour les PR avec de nombreuses suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur plus élevée en millisecondes pour les diffs locaux exceptionnellement volumineux.

Crabbox est le wrapper de boîte distante appartenant au dépôt pour les preuves Linux des mainteneurs. Utilisez-le lorsqu’un contrôle est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve nécessite des secrets, Docker, des voies de paquets, des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner possédée est une solution de repli pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité possédée.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` contient des valeurs par défaut de cloud possédé.

Porte des changements :

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

Relance de test ciblée :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox ponctuelles appuyées par Blacksmith devraient arrêter automatiquement le Testbox ; si une exécution est interrompue ou si le nettoyage n’est pas clair, inspectez les boîtes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même boîte hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défectueuse mais que Blacksmith lui-même fonctionne, utilisez Blacksmith directement comme solution de repli étroite :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

N’escaladez vers la capacité Crabbox possédée que lorsque Blacksmith est indisponible, limité par quota, ne fournit pas l’environnement requis, ou que la capacité possédée est explicitement l’objectif :

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` possède les valeurs par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions pour les voies de cloud possédé. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes de cloud possédé `crabbox run --id <cbx_id>`.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

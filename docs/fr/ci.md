---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez le déclenchement de ClawSweeper ou la transmission de l’activité GitHub
summary: Graphe des tâches CI, garde-fous de périmètre, ensembles de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-07T13:13:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le scoping intelligent et déploient tout le graphe pour les release candidates et la validation large. Les lanes Android restent opt-in via `include_android`. La couverture des Plugins réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les scopes modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit de workflow via `zizmor`                                               | Toujours sur les pushs et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production, sans dépendances, contre les avis npm                                    | Toujours sur les pushs et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushs et PR non brouillons |
| `check-dependencies`             | Passe Knip production limitée aux dépendances, plus garde de l’allowlist des fichiers inutilisés          | Changements pertinents pour Node   |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artefacts construits, et les artefacts downstream réutilisables | Changements pertinents pour Node   |
| `checks-fast-core`               | Lanes rapides de correction Linux, comme les vérifications bundled/plugin-contract/protocol               | Changements pertinents pour Node   |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat de vérification agrégé stable              | Changements pertinents pour Node   |
| `checks-node-core-test`          | Shards de tests Core Node, hors lanes canal, bundled, contract et extension                               | Changements pertinents pour Node   |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, gardes, types de tests et smoke strict | Changements pertinents pour Node   |
| `check-additional`               | Architecture, drift shardé boundary/prompt, gardes d’extensions, limite de package, et gateway watch      | Changements pertinents pour Node   |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                         | Changements pertinents pour Node   |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits                                            | Changements pertinents pour Node   |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                           | Dispatch CI manuel pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens brisés de la documentation                                      | Documentation modifiée             |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                                           | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Tests spécifiques Windows de processus/chemins, plus régressions partagées des spécificateurs d’import runtime | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements pertinents pour macOS  |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                               | Changements pertinents pour macOS  |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build APK debug                                     | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après activité de confiance                                | Succès CI sur main ou dispatch manuel |
| `openclaw-performance`           | Rapports quotidiens/à la demande de performance runtime Kova avec lanes mock-provider, deep-profile et GPT 5.4 live | Dispatch planifié et manuel        |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs downstream puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications agrégées des shards utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux de shards sans se mettre en file après que tout le workflow a déjà été supplanté. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Le job `ci-timings-summary` téléverse un artefact compact `ci-timings-summary` pour chaque exécution CI non brouillon. Il enregistre le temps mural, le temps en file d’attente, les jobs les plus lents et les jobs échoués pour l’exécution courante, afin que les contrôles de santé CI n’aient pas besoin de relire sans cesse toute la charge utile Actions.

## Scope et routage

La logique de scope se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone scopée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le linting des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent scopées aux changements de sources de plateformes.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests core, et les modifications étroites de helpers/tests de routage de contrats de plugins** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin saute les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards core complets, les shards de plugins bundled et les matrices de gardes supplémentaires lorsque le changement se limite aux surfaces de routage ou de helpers que la tâche rapide exerce directement.
- **Les vérifications Windows Node** sont scopées aux wrappers Windows spécifiques de processus/chemins, aux helpers de runners npm/pnpm/UI, à la config du gestionnaire de packages, et aux surfaces de workflow CI qui exécutent cette lane ; les changements de source, plugin, install-smoke et tests-only sans rapport restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont découpées ou équilibrées pour que chaque job reste petit sans réserver trop de runners : les contrats de canaux s’exécutent en trois shards pondérés adossés à Blacksmith avec le runner GitHub standard en fallback, les lanes core unit fast/support s’exécutent séparément, l’infra runtime core est répartie entre les shards state, process/config, cron et shared, auto-reply s’exécute sous forme de workers équilibrés (avec le sous-arbre reply réparti en shards agent-runner, dispatch et commands/state-routing), et les configurations agentic gateway/server sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. Les tests larges browser, QA, media et de plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all plugin partagé. Les shards include-pattern enregistrent les entrées de timing avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; la liste des gardes boundary est rayée sur quatre shards de matrice, chacun exécutant des gardes indépendantes sélectionnées en parallèle et affichant les timings par vérification. La vérification coûteuse de drift des snapshots de prompts happy-path Codex s’exécute comme son propre job additionnel pour la CI manuelle et uniquement pour les changements affectant les prompts, afin que les changements Node normaux sans rapport n’attendent pas derrière la génération froide de snapshots de prompts et que les shards boundary restent équilibrés pendant que le drift de prompt reste attribué à la PR qui l’a causé ; le même flag saute la génération Vitest de snapshots de prompts dans le shard core support-boundary des artefacts construits. Gateway watch, les tests de canaux et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` sont déjà construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile tout de même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug dupliqué à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde unused-file échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non relu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de tests live et de passerelles de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un token GitHub App depuis `CLAWSWEEPER_APP_PRIVATE_KEY`, puis déclenche des charges utiles `repository_dispatch` compactes vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de review d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes explicites ClawSweeper dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de review au niveau commit sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits de commentaires ou de reviews lorsqu’ils sont présents. Elle évite intentionnellement de transférer tout le corps du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui poste l’événement normalisé au hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne devrait poster dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures routinières, modifications, bruit de bots, bruit de webhooks dupliqués et trafic normal de review devraient donner `NO_REPLY`.

Considérez les titres, commentaires, corps, textes de revue, noms de branche et messages de commit GitHub comme des données non fiables dans tout ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les déclenchements CI manuels exécutent le même graphe de jobs que la CI normale, mais forcent l’activation de chaque lane à portée non Android : shards Linux Node, shards de Plugins intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de build, vérifications de docs, Skills Python, Windows, macOS et i18n de Control UI. Les déclenchements CI manuels autonomes exécutent seulement Android avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prérelease de Plugin, le shard `agentic-plugins` réservé à la release, le sweep complet des extensions et les lanes Docker de prérelease de Plugin sont exclus de la CI. La suite Docker de prérelease ne s’exécute que lorsque `Full Release Validation` déclenche le workflow `Plugin Prerelease` séparé avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution push ou PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow de la référence de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/intégrés, vérifications fragmentées des contrats de canaux, shards `check` sauf lint, agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards d’extensions moins lourds, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de Plugins intégrés, shards `check-additional`, `android`                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut. Pendant `preflight`, `scripts/ci-runner-labels.mjs` vérifie les exécutions Actions récentes en file d’attente et en cours pour les jobs Blacksmith en file d’attente. Si un libellé Blacksmith spécifique a déjà des jobs en file d’attente, les jobs en aval qui utiliseraient ce libellé exact se replient sur le runner hébergé par GitHub correspondant (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) uniquement pour cette exécution. Les autres tailles Blacksmith de la même famille d’OS restent sur leurs libellés principaux. Si la sonde API échoue, aucun repli n’est appliqué.

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

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le déclenchement manuel benchmarke normalement la référence du workflow. Définissez `target_ref` pour benchmarker un tag de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs latest sont indexés par la référence testée, et chaque `index.md` enregistre la référence/le SHA testés, la référence/le SHA du workflow, la référence Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénario.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU/heap/trace pour les points chauds de démarrage, Gateway et tours d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : timing de démarrage Gateway et mémoire sur les cas de démarrage par défaut, hook et 50 Plugins ; boucles hello répétées mock-OpenAI `channel-chat-baseline` ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur de référence testée courant est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de release complète

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la release ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow `CI` manuel avec cette cible, déclenche `Plugin Prerelease` pour la preuve release-only de Plugin/package/statique/Docker, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package cross-OS, la parité QA Lab, Matrix et les lanes Telegram. Les exécutions stables/par défaut gardent la couverture live/E2E exhaustive et du chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation de cette couverture de soak afin que la validation consultative large reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des vérifications de release. Après publication, passez `npm_telegram_package_spec` pour réexécuter la même lane de package Telegram contre le package npm publié.

Voir [Validation de release complète](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des jobs de workflow, les différences de
profils, les artefacts et les poignées de relance ciblée.

`OpenClaw Release Publish` est le workflow de release manuel et mutateur. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de Plugin publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de release, et déclenche seulement ensuite
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve sur commit épinglé sur une branche qui évolue rapidement, utilisez l’utilitaire d’aide plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de déclenchement des flux de travail GitHub doivent être des branches ou des étiquettes, pas des SHA de commit bruts. L’utilitaire pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, déclenche `Full Release Validation` depuis cette référence épinglée, vérifie que chaque `headSha` de flux de travail enfant correspond à la cible, puis supprime la branche temporaire lorsque l’exécution se termine. Le vérificateur ombrelle échoue aussi si un flux de travail enfant s’est exécuté sur un SHA différent.

`release_profile` contrôle l’étendue des tests en conditions réelles/fournisseurs transmise aux vérifications de publication. Les flux de travail de publication manuelle utilisent `stable` par défaut ; utilisez `full` seulement lorsque vous voulez intentionnellement la vaste matrice indicative fournisseurs/médias. `run_release_soak` contrôle si les vérifications de publication stables/par défaut exécutent le test d’endurance exhaustif en conditions réelles/E2E et du chemin de publication Docker ; `full` force l’activation du test d’endurance.

- `minimum` conserve les voies critiques de publication OpenAI/noyau les plus rapides.
- `stable` ajoute le jeu stable de fournisseurs/moteurs.
- `full` exécute la vaste matrice indicative fournisseurs/médias.

Le workflow ombrelle enregistre les identifiants d’exécution des workflows enfants déclenchés, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un flux de travail enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat du workflow ombrelle et le résumé des durées.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` pour uniquement le workflow enfant de CI complète normal, `plugin-prerelease` pour uniquement le workflow enfant de prépublication de plugin, `release-checks` pour chaque workflow enfant de publication, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow ombrelle. Cela garde bornée la relance d’un environnement de publication échoué après un correctif ciblé. Pour une seule voie inter-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes inter-OS émettent des lignes Heartbeat et les résumés de mise à niveau packagée incluent les durées par phase. Les voies QA de vérification de publication sont indicatives, donc les échecs QA seuls avertissent mais ne bloquent pas le vérificateur de vérifications de publication.

`OpenClaw Release Checks` utilise la référence fiable du flux de travail pour résoudre une seule fois la référence sélectionnée en archive `release-package-under-test`, puis transmet cet artefact aux vérifications inter-OS et à l’acceptation du paquet, ainsi qu’au flux de travail Docker du chemin de publication en conditions réelles/E2E lorsque la couverture de test d’endurance s’exécute. Cela garde les octets du paquet cohérents entre les environnements de publication et évite de reconditionner le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow ombrelle. Le moniteur parent annule tout flux de travail enfant déjà déclenché lorsque le parent est annulé, donc une validation plus récente de main ne reste pas bloquée derrière une ancienne exécution de vérification de publication de deux heures. La validation de branche/étiquette de publication et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Fragments de tests réels et E2E

Le workflow enfant réel/E2E de publication conserve une large couverture native `pnpm test:live`, mais il l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche sérielle :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- split media audio/video shards and provider-filtered music shards

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs réels plus faciles à relancer et diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les fragments médias natifs en conditions réelles s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le flux de travail `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches médias vérifient seulement les binaires avant la configuration. Gardez les suites réelles adossées à Docker sur des exécuteurs Blacksmith normaux — les tâches en conteneur ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments réels de modèles/moteurs adossés à Docker utilisent une image partagée séparée `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le flux de travail de publication en conditions réelles construit et pousse cette image une seule fois, puis les fragments de modèle réel Docker, Gateway fragmenté par fournisseur, moteur CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker du Gateway portent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche du flux de travail, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de vérification de publication. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de publication est mal configurée et gaspillera du temps réel sur des constructions d’images en double.

## Acceptation du paquet

Utilisez `Package Acceptance` lorsque la question est : « ce paquet OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du paquet valide une seule archive via le même harnais Docker E2E que les utilisateurs exécutent après installation ou mise à jour.

### Tâches

1. `resolve_package` récupère `workflow_ref`, résout un candidat de paquet, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et affiche la source, la référence du flux de travail, la référence du paquet, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le flux de travail réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker d’empreinte de paquet si nécessaire, puis exécute les voies Docker sélectionnées contre ce paquet au lieu d’empaqueter l’arborescence récupérée du flux de travail. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le flux de travail réutilisable prépare le paquet et les images partagées une seule fois, puis répartit ces voies sous forme de tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du paquet en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le flux de travail si la résolution du paquet, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prépublications/stables publiées.
- `source=ref` empaquette une branche, une étiquette ou un SHA de commit complet `package_ref` fiable. Le résolveur récupère les branches/étiquettes OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou une étiquette de publication, installe les dépendances dans un arbre de travail détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge une archive HTTPS `.tgz` ; `package_sha256` est requis.
- `source=artifact` télécharge une archive `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code fiable du flux de travail/harnais qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits sources fiables sans exécuter l’ancienne logique de flux de travail.

### Profils de suites

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de plugins hors ligne afin que la validation du paquet publié ne dépende pas de la disponibilité en conditions réelles de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publiée étant conservé pour les déclenchements autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, y compris les commandes locales,
les voies Docker, les entrées d’acceptation du paquet, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de publication appellent l’acceptation du paquet avec `source=artifact`, l’artefact de paquet de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la migration de paquet, la mise à jour, le nettoyage des dépendances de plugin obsolètes, la réparation de l’installation de plugin configuré, le plugin hors ligne, la mise à jour de plugin et la preuve Telegram sur la même archive de paquet résolue. Définissez `package_acceptance_package_spec` sur la validation complète de publication ou les vérifications de publication OpenClaw pour exécuter cette même matrice contre un paquet npm livré plutôt que contre l’artefact construit depuis le SHA. Les vérifications de publication inter-OS couvrent toujours l’intégration initiale, l’installateur et le comportement de plateforme propres à l’OS ; la validation produit du paquet/de la mise à jour doit commencer par l’acceptation du paquet. La voie Docker `published-upgrade-survivor` valide une référence de paquet publié par exécution dans le chemin de publication bloquant. Dans l’acceptation du paquet, l’archive `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de relance de voie échouée préservent cette référence. La validation complète de publication avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la couverture aux quatre dernières publications stables npm ainsi qu’aux publications frontières épinglées de compatibilité des plugins et aux données de test structurées comme des issues pour la configuration Feishu, les fichiers d’amorçage/persona préservés, les installations de plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances de plugins hérités obsolètes. Les sélections de survie à la mise à niveau publiée à références multiples sont fragmentées par référence en tâches d’exécuteur Docker ciblées séparées. Le flux de travail séparé `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur la couverture normale de la CI de publication complète. Les exécutions agrégées locales peuvent passer des spécifications exactes de paquet avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette de commandes `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les voies Windows packagée et installation fraîche vérifient aussi qu’un paquet installé peut importer une surcharge de contrôle du navigateur depuis un chemin Windows absolu brut. Le test de vérification rapide inter-OS de tour d’agent OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` si elle est définie, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation des paquets comporte des fenêtres bornées de compatibilité avec l’ancien comportement pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas cette option ;
- `update-channel-switch` peut retirer les `pnpm.patchedDependencies` manquantes du jeu de données Git factice dérivé de l’archive et peut consigner l’absence de `update.channel` persisté ;
- les tests de fumée de plugins peuvent lire les anciens emplacements d’enregistrement d’installation ou accepter l’absence de persistance de l’enregistrement d’installation de la place de marché ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet `2026.4.26` publié peut également émettre un avertissement concernant les fichiers d’empreinte de métadonnées de compilation locale qui avaient déjà été livrés. Les paquets ultérieurs doivent satisfaire aux contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de paquet échouée, commencez par le résumé `resolve_package` pour confirmer la source, la version et le SHA-256 du paquet. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voies, les durées de phase et les commandes de réexécution. Préférez réexécuter le profil de paquet échoué ou les voies Docker exactes plutôt que de relancer la validation complète de publication.

## Test de fumée d’installation

Le flux de travail `Install Smoke` distinct réutilise le même script de portée via sa propre tâche `preflight`. Il divise la couverture de tests de fumée entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les demandes de tirage qui touchent les surfaces Docker/paquet, les modifications de paquet/manifeste de plugin intégré, ou les surfaces cœur de plugin/canal/Gateway/Plugin SDK que les tâches de tests de fumée Docker exercent. Les modifications de plugins intégrés limitées au code source, les modifications limitées aux tests et les modifications limitées aux docs ne réservent pas de travailleurs Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le test de fumée CLI de suppression des agents dans l’espace de travail partagé, exécute l’E2E du réseau de Gateway en conteneur, vérifie un argument de construction d’extension intégrée et exécute le profil Docker borné de plugin intégré avec un délai d’expiration de commande agrégé de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de paquet QR et la couverture Docker/mise à jour de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de publication par appel de flux de travail et les demandes de tirage qui touchent réellement les surfaces installateur/paquet/Docker. En mode complet, le test de fumée d’installation prépare ou réutilise une image de test de fumée GHCR du Dockerfile racine pour le SHA cible, puis exécute l’installation de paquet QR, les tests de fumée du Dockerfile racine/Gateway, les tests de fumée d’installateur/mise à jour et l’E2E Docker rapide de plugin intégré sous forme de tâches séparées, afin que le travail d’installateur n’attende pas derrière les tests de fumée de l’image racine.

Les envois vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée modifiée demanderait une couverture complète lors d’un envoi, le flux de travail conserve le test de fumée Docker rapide et laisse le test de fumée d’installation complet à la validation nocturne ou de publication.

Le test de fumée lent du fournisseur d’images pour l’installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon le calendrier nocturne et depuis le flux de travail de vérifications de publication, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les demandes de tirage et les envois vers `main` ne le font pas. Les tests Docker QR et de l’installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image partagée de test en direct, empaquette OpenClaw une fois sous forme d’archive npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git nu pour les voies d’installateur/mise à jour/dépendance de plugin ;
- une image fonctionnelle qui installe la même archive dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur exécute uniquement le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                                  |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre d’emplacements du groupe principal pour les voies normales.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre d’emplacements du groupe final sensible aux fournisseurs.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond des voies en direct concurrentes pour éviter que les fournisseurs appliquent une limitation.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond des voies concurrentes d’installation npm.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond des voies multiservices concurrentes.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de repli par voie (120 minutes) ; les voies en direct/finales sélectionnées utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` imprime le plan du planificateur sans exécuter les voies.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de voies séparées par des virgules ; ignore le test de fumée de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut quand même démarrer depuis un groupe vide, puis s’exécute seule jusqu’à libérer la capacité. L’agrégat local exécute les précontrôles Docker, supprime les conteneurs OpenClaw E2E obsolètes, émet l’état des voies actives, enregistre durablement les durées de voies pour l’ordre du plus long au plus court, et cesse par défaut de planifier de nouvelles voies mutualisées après le premier échec.

### Flux de travail en direct/E2E réutilisable

Le flux de travail en direct/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels paquet, type d’image, image en direct, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de paquet de l’exécution actuelle ou télécharge un artefact de paquet depuis `package_artifact_run_id` ; valide l’inventaire de l’archive ; construit et pousse des images Docker E2E GHCR nues/fonctionnelles étiquetées par le condensat du paquet via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec paquet installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par condensat de paquet au lieu de reconstruire. Les récupérations d’images Docker sont retentées avec un délai d’expiration borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué soit retenté rapidement au lieu de consommer la majeure partie du chemin critique de la CI.

### Segments du chemin de publication

La couverture Docker de publication exécute de plus petites tâches découpées avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne récupère que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de publication actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` et `plugins-runtime-install-a` jusqu’à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de plugin/exécution. L’alias de voie `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux voies d’installateur de fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un segment autonome `openwebui` uniquement pour les déclenchements OpenWebUI seuls. Les voies de mise à jour des canaux intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phase, le JSON du plan du planificateur, les tableaux des voies lentes et les commandes de réexécution par voie. L’entrée `docker_lanes` du flux de travail exécute les voies sélectionnées sur les images préparées au lieu des tâches de segment, ce qui limite le débogage des voies échouées à une seule tâche Docker ciblée et prépare, télécharge ou réutilise l’artefact de paquet pour cette exécution ; si une voie sélectionnée est une voie Docker en direct, la tâche ciblée construit localement l’image de test en direct pour cette réexécution. Les commandes GitHub générées de réexécution par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le paquet et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le flux de travail en direct/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication.

## Préversion de Plugin

`Plugin Prerelease` fournit une couverture produit/paquet plus coûteuse ; il s’agit donc d’un flux de travail distinct déclenché par `Full Release Validation` ou par un opérateur explicite. Les demandes de tirage normales, les envois vers `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il répartit les tests de plugins intégrés sur huit travailleurs d’extension ; ces tâches de partition d’extension exécutent jusqu’à deux groupes de configuration de plugin à la fois, avec un processus de travail Vitest par groupe et un tas Node plus grand, afin que les lots de plugins lourds en importations ne créent pas de tâches CI supplémentaires. Le chemin Docker de préversion réservé à la publication regroupe les voies Docker ciblées en petits groupes afin d’éviter de réserver des dizaines d’exécuteurs pour des tâches d’une à trois minutes.

## Laboratoire QA

Le laboratoire QA dispose de voies CI dédiées en dehors du principal flux de travail à portée intelligente. La parité agentique est imbriquée sous les cadres larges de QA et de publication, et non dans un flux de travail de demande de tirage autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le flux de travail `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie la voie de parité simulée, la voie Matrix en direct, ainsi que les voies Telegram et Discord en direct sous forme de tâches parallèles. Les tâches en direct utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de publication exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence du modèle live et du démarrage normal du plugin de fournisseur. Le Gateway de transport live désactive la recherche de mémoire, car la parité QA couvre séparément le comportement de la mémoire ; la connectivité des fournisseurs est couverte par les suites distinctes de modèle live, de fournisseur natif et de fournisseur Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; un déclenchement manuel avec `matrix_profile=all` fragmente toujours la couverture Matrix complète en tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les voies QA Lab critiques pour la publication avant l’approbation de publication ; sa porte de parité QA exécute les packs candidat et de référence sous forme de tâches de voies parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/vérifications à portée limitée au lieu de traiter la parité comme un statut obligatoire.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité étroit de première passe, et non l’analyse complète du dépôt. Les exécutions de garde quotidiennes, manuelles et de pull requests non brouillons analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à confiance élevée filtrées sur `security-severity` élevée/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à confiance élevée que le workflow planifié. Android et macOS CodeQL restent hors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, cron et référence Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du noyau ainsi que runtime de plugin de canal, Gateway, Plugin SDK, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF du noyau, analyse d’IP, garde réseau, récupération web et surfaces de politique SSRF du Plugin SDK                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et portes d’exécution d’outils d’agent                        |
| `/codeql-security-high/plugin-trust-boundary`     | Installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de sources et surfaces de confiance du contrat de paquet du Plugin SDK |

### Fragments de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Compile manuellement l’app Android pour CodeQL sur le plus petit exécuteur Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Compile manuellement l’app macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de compilation des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car la compilation macOS domine le temps d’exécution même lorsqu’elle est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non liées à la sécurité sur des surfaces étroites à forte valeur, sur le plus petit exécuteur Blacksmith Linux. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillons exécutent uniquement les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements concernant le code d’exécution de commandes/modèles/outils d’agent et de distribution des réponses, le code de schéma/migration/E/S de configuration, le code d’authentification/secrets/sandbox/sécurité, le runtime des canaux du noyau et des plugins de canal groupés, le protocole Gateway/méthode serveur, la glue runtime/SDK de mémoire, MCP/processus/livraison sortante, le runtime fournisseur/catalogue de modèles, les diagnostics de session/files de livraison, le chargeur de plugins, le Plugin SDK/contrat de paquet ou le runtime de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow qualité exécutent les douze fragments de qualité PR.

Le déclenchement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentification, secrets, sandbox, cron et code de frontière de sécurité Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du noyau et des plugins de canal groupés                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponses automatiques, et contrats runtime du plan de contrôle ACP                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK d’hôte mémoire, façades runtime de mémoire, alias mémoire du Plugin SDK, glue d’activation du runtime de mémoire et commandes doctor de mémoire                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de la file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/paquets de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, assistants de charge utile/fragmentation/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues de fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats runtime du plan de contrôle des tâches                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Récupération/recherche web du noyau, E/S média, compréhension média, génération d’images et contrats runtime de génération média                                   |
| `/codeql-critical-quality/plugin-boundary`              | Chargeur, registre, surface publique et contrats de point d’entrée du Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté paquet publié et assistants de contrat de paquet de plugin                                                                               |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL Swift, Python et plugins groupés doit être rajoutée sous forme de travail de suivi à portée limitée ou fragmenté uniquement après que les profils étroits ont une durée d’exécution et un signal stables.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex déclenchée par événement pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, et un déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits allant du SHA source précédent Docs Agent non ignoré jusqu’au `main` actuel, afin qu’une exécution horaire puisse couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex déclenchée par événement pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, mais il s’interrompt si une autre invocation par workflow-run s’est déjà exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette porte d’activité quotidienne. La voie construit un rapport de performance Vitest groupé pour la suite complète, laisse Codex n’effectuer que de petites corrections de performance de tests préservant la couverture au lieu de refactorisations larges, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis dans la référence. Si la référence contient des tests en échec, Codex peut seulement corriger les échecs évidents, et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot arrive, la voie rebase le correctif validé, relance `pnpm check:changed` et retente le push ; les correctifs obsolètes avec conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex conserve la même posture de sécurité sans sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il est par défaut en simulation et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit une issue référencée partagée, soit des blocs modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changements vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types de production du cœur et de tests du cœur, plus le lint et les gardes du cœur ;
- les changements limités aux tests du cœur exécutent uniquement la vérification de types des tests du cœur, plus le lint du cœur ;
- les changements de production des extensions exécutent la vérification de types de production des extensions et de tests des extensions, plus le lint des extensions ;
- les changements limités aux tests des extensions exécutent la vérification de types des tests des extensions, plus le lint des extensions ;
- les changements du SDK Plugin public ou du contrat de Plugin s’étendent à la vérification de types des extensions, car les extensions dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les incréments de version limités aux métadonnées de publication exécutent des vérifications ciblées de version, de configuration et de dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests, les modifications de source préfèrent les correspondances explicites, puis les tests frères et les dépendants du graphe d’importation. La configuration partagée de distribution de salon de groupe fait partie des correspondances explicites : les changements apportés à la configuration de réponse visible du groupe, au mode de distribution des réponses source ou au prompt système de l’outil de message passent par les tests de réponse du cœur, plus les régressions de distribution Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche assez largement le harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et préférez une boîte fraîche préchauffée pour les preuves larges. Avant de lancer une garde lente sur une boîte réutilisée, expirée ou qui vient de signaler une synchronisation étonnamment volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distante n’est pas une copie fiable de la PR ; arrêtez cette boîte et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PR intentionnelles avec de nombreuses suppressions, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` met également fin à une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux exceptionnellement volumineux.

Crabbox est l’enveloppe de boîte distante appartenant au dépôt pour les preuves Linux des mainteneurs. Utilisez-la lorsqu’une vérification est trop large pour une boucle locale d’édition, lorsque la parité CI compte, ou lorsque la preuve a besoin de secrets, de Docker, de voies de paquets, de boîtes réutilisables ou de journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité détenue.

Avant une première exécution, vérifiez l’enveloppe depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

L’enveloppe du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut de cloud détenu.

Garde des changements :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox ponctuelles adossées à Blacksmith doivent arrêter automatiquement la Testbox ; si une exécution est interrompue ou que le nettoyage n’est pas clair, inspectez les boîtes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Utilisez la réutilisation uniquement lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même boîte hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith fonctionne lui-même, utilisez directement Blacksmith comme solution de repli étroite :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes, traitez cela comme une pression liée au fournisseur Blacksmith, à la file d’attente, à la facturation ou à la limite d’organisation. Arrêtez les identifiants en file d’attente que vous avez créés, évitez de démarrer davantage de Testboxes et déplacez la preuve vers le chemin de capacité Crabbox détenue ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith, la facturation et les limites d’organisation.

N’escaladez vers la capacité Crabbox détenue que lorsque Blacksmith est hors service, limité par quota, ne dispose pas de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite vraiment un CPU de classe 48xlarge. Une requête `beast` commence à 192 vCPU et constitue le moyen le plus simple de déclencher un quota régional EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` appartenant au dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS négociés affichent la région/le marché sélectionné, la pression de quota, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` uniquement lorsque standard/fast ne suffisent pas, et `beast` seulement pour des voies exceptionnelles limitées par le CPU, comme la suite complète ou les matrices Docker tous Plugins, une validation explicite de publication/bloquant, ou un profilage de performance à beaucoup de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, le travail limité aux docs, le lint/la vérification de types ordinaires, les petites reproductions E2E ou le triage d’une panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que les fluctuations du marché Spot ne soient pas mélangées au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes `crabbox run --id <cbx_id>` sur cloud détenu.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

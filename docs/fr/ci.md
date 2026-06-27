---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des jobs CI, garde-fous de périmètre, ensembles de release et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-27T17:13:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Les pushes
canoniques vers `main` passent d’abord par une fenêtre d’admission de 90 secondes sur runner hébergé.
Le groupe de concurrence `CI` existant annule cette exécution en attente lorsqu’un commit
plus récent arrive, de sorte que les merges séquentiels n’enregistrent pas chacun une matrice
Blacksmith complète. Les pull requests et les dispatchs manuels ignorent cette attente. Le job `preflight`
classe ensuite le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport
ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le
scoping intelligent et déploient le graphe complet pour les release candidates et la validation
large. Les lanes Android restent opt-in via `include_android`. La couverture des plugins réservée
aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease)
et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation)
ou un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                   | Quand il s’exécute                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Détecter les changements docs-only, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non-draft             |
| `runner-admission`                 | Debounce hébergé de 90 secondes pour les pushes canoniques vers `main` avant l’enregistrement du travail Blacksmith | Chaque exécution CI ; pause uniquement sur les pushes canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor`, et audit du lockfile de production | Toujours sur les pushes et PR non-draft             |
| `check-dependencies`               | Passe Knip de production limitée aux dépendances, plus garde de l’allowlist des fichiers inutilisés       | Changements pertinents pour Node                    |
| `build-artifacts`                  | Construire `dist/`, Control UI, smoke checks de CLI construite, checks d’artefacts construits intégrés, et artefacts réutilisables | Changements pertinents pour Node                    |
| `checks-fast-core`                 | Lanes de correction Linux rapides, comme bundled, protocol, QA Smoke CI, et checks de routage CI          | Changements pertinents pour Node                    |
| `checks-fast-contracts-plugins-*`  | Deux checks de contrats de plugins sharded                                                                | Changements pertinents pour Node                    |
| `checks-fast-contracts-channels-*` | Deux checks de contrats de canaux sharded                                                                 | Changements pertinents pour Node                    |
| `checks-node-core-*`               | Shards de tests Node du core, hors lanes de canaux, bundled, contrats et extensions                       | Changements pertinents pour Node                    |
| `check-*`                          | Équivalent sharded du gate local principal : types prod, lint, gardes, types de test, et smoke strict     | Changements pertinents pour Node                    |
| `check-additional-*`               | Architecture, drift de boundary/prompt sharded, gardes d’extensions, boundary de package, et topologie runtime | Changements pertinents pour Node                    |
| `checks-node-compat-node22`        | Build de compatibilité Node 22 et lane smoke                                                              | Dispatch CI manuel pour les releases                |
| `check-docs`                       | Formatage, lint et checks de liens cassés des docs                                                        | Docs modifiées                                      |
| `skills-python`                    | Ruff + pytest pour les skills adossés à Python                                                            | Changements pertinents pour les Skills Python       |
| `checks-windows`                   | Tests process/path spécifiques à Windows plus régressions partagées des spécificateurs d’import runtime   | Changements pertinents pour Windows                 |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements pertinents pour macOS                   |
| `macos-swift`                      | Lint, build et tests Swift pour l’app macOS                                                               | Changements pertinents pour macOS                   |
| `ios-build`                        | Génération du projet Xcode plus build simulateur de l’app iOS                                             | App iOS, kit d’app partagé, ou changements Swabble  |
| `android`                          | Tests unitaires Android pour les deux flavors plus un build APK debug                                     | Changements pertinents pour Android                 |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après activité de confiance                               | Succès de la CI main ou dispatch manuel             |
| `openclaw-performance`             | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.5 live | Dispatch planifié et manuel                         |

## Ordre fail-fast

1. `runner-admission` attend uniquement pour les pushes canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs de matrice d’artefacts et de plateformes plus lourds.
4. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
5. Les lanes de plateformes et de runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI sauf si l’exécution la plus récente pour la même ref échoue aussi. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs embedded channel, core-support-boundary et gateway-watch au lieu de mettre en file de minuscules jobs vérificateurs. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps mural, le temps en file, les jobs les plus lents, les échecs et la barrière de fanout `pnpm-store-warmup` depuis GitHub Actions. CI téléverse aussi le même résumé d’exécution comme artefact `ci-timings-summary`. Pour le timing de build, vérifiez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artefact `startup-memory`.

Pour les exécutions de pull request, le job terminal timing-summary exécute l’assistant depuis la révision de base de confiance avant de passer `GH_TOKEN` à `gh run view`. Cela garde la requête avec jeton hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte et preuves de PR

Les PR de contributeurs externes exécutent un gate de contexte et de preuves de PR depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow checkout le commit de base de confiance
et évalue uniquement le corps de la PR ; il n’exécute pas de code depuis la branche du
contributeur.

Le gate s’applique aux auteurs de PR qui ne sont pas propriétaires du dépôt, membres,
collaborateurs ou bots. Il réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. La preuve peut être un test ciblé,
un résultat CI, une capture d’écran, un enregistrement, une sortie de terminal, une observation live,
un journal expurgé ou un lien d’artefact. Le corps fournit l’intention et une validation utile ;
les reviewers inspectent le code, les tests et la CI pour évaluer la correction.

Lorsque le check échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Scoping et routage

La logique de scope vit dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone scopée avait changé.

- **Éditions du workflow CI** valident le graphe CI Node plus le linting des workflows, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android ou macOS ; ces lanes de plateformes restent scopées aux changements de sources de plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, le garde d’interpolation d’actions composites et le garde de marqueurs de conflit. Le job `security-fast` scopé à la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les findings de sécurité de workflow échouent tôt dans le graphe CI principal.
- **Docs sur les pushes `main`** sont vérifiées par le workflow autonome `Docs` avec le même miroir docs ClawHub que celui utilisé par CI, afin que les pushes mixtes code+docs ne mettent pas aussi en file le shard CI `check-docs`. Les pull requests et la CI manuelle exécutent toujours `check-docs` depuis CI lorsque les docs ont changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, ce qui couvre à la fois la lane déterministe de fixture `TuiBackend` et le smoke plus lent `tui --local` qui mocke uniquement l’endpoint de modèle externe.
- **Les éditions limitées au routage CI, certaines éditions peu coûteuses de fixtures core-test, et les éditions étroites de helpers/tests de routage de contrats de plugins** utilisent un chemin de manifeste Node-only rapide : `preflight`, security et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards core complets, les shards de plugins bundled et les matrices de gardes additionnelles lorsque le changement se limite aux surfaces de routage ou de helpers que la tâche rapide exerce directement.
- **Les checks Windows Node** sont scopés aux wrappers process/path spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration de gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements de source, de plugin, d’install-smoke et de tests seuls sans rapport restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans réserver excessivement des exécuteurs : les contrats de plugin et les contrats de canal s’exécutent chacun sous forme de deux shards pondérés adossés à Blacksmith avec le repli standard vers les exécuteurs GitHub, les lanes rapides/de support des unités core s’exécutent séparément, l’infra runtime core est répartie entre state, process/config, shared et trois shards de domaine cron, auto-reply s’exécute avec des workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configs Gateway/server agentiques sont réparties sur les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale ne regroupe ensuite que les shards à motifs d’inclusion d’infra isolée dans des lots déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites command/cron non isolées, agents-core avec état, ou Gateway/server ; les suites fixes lourdes restent sur 8 vCPU tandis que les lanes groupées et de poids inférieur utilisent 4 vCPU. Les pull requests sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par config s’exécutent dans des sous-processus isolés à l’intérieur du plan Linux Node actuel de 34 jobs, de sorte qu’une seule PR n’enregistre pas toute la matrice Node de plus de 70 jobs. Les pushes sur `main`, les déclenchements manuels et les gates de release conservent la matrice complète. Les tests de navigateur larges, QA, média et divers plugins utilisent leurs configs Vitest dédiées au lieu du fourre-tout plugin partagé. Les shards à motifs d’inclusion enregistrent les entrées de durée avec le nom de shard CI, de sorte que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional-*` garde ensemble le travail de compilation/canary des limites de package et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste des gardes de limite est répartie en un shard fortement orienté prompts et un shard combiné pour les autres bandes de gardes, chacun exécutant des gardes indépendantes sélectionnées en parallèle et affichant les durées par vérification. La vérification coûteuse de dérive du snapshot de prompt du chemin heureux Codex s’exécute comme son propre job supplémentaire uniquement pour la CI manuelle et les changements affectant les prompts, de sorte que les changements Node normaux sans rapport n’attendent pas derrière la génération froide de snapshots de prompt et que les shards de limite restent équilibrés tandis que la dérive de prompt reste rattachée à la PR qui l’a causée ; le même indicateur saute la génération Vitest de snapshots de prompt dans le shard core support-boundary sur artefacts construits. Gateway watch, les tests de canal et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 24 jobs de test Node concurrents et
12 pour les lanes fast/check plus petites ; Windows et Android restent à deux, car
ces pools d’exécuteurs sont plus étroits.

Le plan PR compact émet 18 jobs Node pour la suite actuelle : les groupes
whole-config sont traités par lots dans des sous-processus isolés avec un délai d’expiration de lot de 120 minutes,
tandis que les groupes à motifs d’inclusion partagent le même budget de jobs borné.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK Play debug. La variante third-party n’a ni source set ni manifeste séparé ; sa lane de tests unitaires compile toujours la variante avec les indicateurs BuildConfig SMS/call-log, tout en évitant un job dupliqué de packaging de l’APK debug à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers inutilisés en production de Knip avec `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non relu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de plugin dynamique, générées, de build, de tests live et de pont de package que Knip ne peut pas résoudre statiquement.

## Transmission de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un token GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issue et de pull request ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issue ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transmet uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transmettre le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé sur le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est une observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures routinières, modifications, bruit de bots, bruit de webhooks dupliqués et trafic normal de revue doivent aboutir à `NO_REPLY`.

Traitez les titres GitHub, commentaires, corps, textes de revue, noms de branches et messages de commit comme des données non fiables sur tout ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime d’agent.

## Déclenchements manuels

Les déclenchements manuels de CI exécutent le même graphe de jobs que la CI normale, mais forcent l’activation de chaque lane scopée non Android : shards Linux Node, shards de plugins groupés, shards de contrats plugin et canal, compatibilité Node 22, `check-*`, `check-additional-*`, smoke checks d’artefacts construits, vérifications docs, Skills Python, Windows, macOS, build iOS et i18n Control UI. Les déclenchements manuels CI autonomes n’exécutent Android qu’avec `include_android=true` ; l’ombrelle complète de release active Android en passant `include_android=true`. Les vérifications statiques de prérelease plugin, le shard réservé aux releases `agentic-plugins`, le balayage complet par lots d’extensions et les lanes Docker de prérelease plugin sont exclus de la CI. La suite Docker de prérelease ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par un autre push ou une autre PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant fiable d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow de la ref de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Exécuteurs

| Exécuteur                       | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Déclenchement manuel CI et replis des dépôts non canoniques, scans qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows docs hors CI et prévol install-smoke afin que la matrice Blacksmith puisse être mise en file plus tôt                         |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards d’extensions de poids inférieur, `checks-fast-core`, shards de contrats plugin/canal, la plupart des shards Linux Node groupés/de poids inférieur, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` sélectionnés, et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, shards `check-additional-*` lourds en limites/extensions, et `android`                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file 32 vCPU coûtait plus qu’il n’économisait)                                                                            |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-15`                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks se replient sur `macos-26`                                                                                                                                                                                          |

## Budget d’enregistrement des exécuteurs

Le compartiment actuel d’enregistrement des exécuteurs GitHub d’OpenClaw autorise 3 000
enregistrements d’exécuteurs auto-hébergés par tranche de 5 minutes. La limite est partagée par tous les enregistrements d’exécuteurs Blacksmith
dans l’organisation `openclaw`, donc ajouter une autre installation Blacksmith
n’ajoute pas de nouveau compartiment.

Traitez les labels Blacksmith comme la ressource rare pour le contrôle des rafales. Les jobs qui
ne font que router, notifier, synthétiser, sélectionner des shards ou exécuter de courts scans CodeQL doivent
rester sur des exécuteurs hébergés par GitHub, sauf s’ils ont des besoins spécifiques à Blacksmith
mesurés. Toute nouvelle matrice Blacksmith, `max-parallel` plus élevé ou workflow à haute fréquence
doit montrer son nombre d’enregistrements dans le pire cas et maintenir la cible au niveau de l’organisation
sous 2 000 enregistrements par tranche de 5 minutes, en laissant de la marge pour les dépôts concurrents
et les jobs relancés.

La CI du dépôt canonique conserve Blacksmith comme chemin d’exécuteur par défaut pour les exécutions normales de push et de pull request. `workflow_dispatch` et les exécutions de dépôts non canoniques utilisent des exécuteurs hébergés par GitHub, mais les exécutions canoniques normales ne sondent pas actuellement la santé de la file Blacksmith et ne se replient pas automatiquement vers des labels hébergés par GitHub lorsque Blacksmith est indisponible.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performances d'OpenClaw

`OpenClaw Performance` est le workflow de performances du produit et du runtime. Il s'exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le déclenchement manuel mesure normalement la référence du workflow. Définissez `target_ref` pour mesurer un tag de version ou une autre branche avec l'implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` consigne la référence/SHA testé, la référence/SHA du workflow, la référence Kova, le profil, le mode d'authentification de la lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une version épinglée et Kova depuis `openclaw/Kova` à l'entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime construit localement avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU, tas et traces pour les points chauds du démarrage, du Gateway et des tours d'agent.
- `live-openai-candidate` : un vrai tour d'agent OpenAI `openai/gpt-5.5`, ignoré quand `OPENAI_API_KEY` n'est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage et mémoire du Gateway pour les cas de démarrage par défaut, avec hook et avec 50 Plugins ; RSS d'import des Plugins intégrés, boucles de salutation mock-OpenAI `channel-chat-baseline` répétées, commandes de démarrage CLI contre le Gateway démarré, et sonde de performances smoke de l'état SQLite. Quand le rapport source mock-provider publié précédent est disponible pour la référence testée, le résumé source compare les valeurs RSS et de tas actuelles à cette base de référence et marque les fortes augmentations de RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le lot de rapports, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Quand `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow valide aussi `report.json`, `report.md`, les lots, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la référence testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de version

`Full Release Validation` est le workflow manuel global pour « tout exécuter avant la publication ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves propres à la publication des Plugins, paquets, éléments statiques et Docker, et déclenche `OpenClaw Release Checks` pour le smoke d'installation, l'acceptation de paquet, les vérifications de paquets multi-OS, le rendu de la fiche de maturité à partir des preuves de profil QA, la parité QA Lab, Matrix et les lanes Telegram. Les profils stable et complet incluent toujours une couverture exhaustive live/E2E et de soak du chemin de publication Docker ; le profil bêta peut l'activer avec `run_release_soak=true`. L'E2E Telegram canonique du paquet s'exécute dans Package Acceptance, donc un candidat complet ne démarre pas de poller live en double. Après publication, passez `release_package_spec` pour réutiliser le paquet npm publié dans les vérifications de publication, Package Acceptance, Docker, multi-OS et Telegram sans reconstruire. Utilisez `npm_telegram_package_spec` uniquement pour une relance Telegram ciblée du paquet publié. La lane de paquet live du Plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié dérive `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact empaquettent `extensions/codex` depuis la référence sélectionnée. Définissez explicitement `codex_plugin_spec` pour des sources de Plugin personnalisées comme les specs `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de version](/fr/reference/full-release-validation) pour la matrice des étapes, les noms exacts des jobs de workflow, les différences de profils, les artefacts et les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication qui modifie l'état. Déclenchez-le depuis `release/YYYY.M.PATCH` ou `main` après l'existence du tag de version et la réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`, déclenche `Plugin NPM Release` pour tous les paquets de Plugin publiables, déclenche `Plugin ClawHub Release` pour le même SHA de version, puis seulement ensuite déclenche `OpenClaw NPM Release` avec le `preflight_run_id` enregistré. La publication stable exige aussi un `windows_node_tag` exact ; le workflow vérifie la version source Windows et compare ses installateurs x64/ARM64 avec l'entrée candidate approuvée `windows_node_installer_digests` avant tout enfant de publication, puis promeut et vérifie ces mêmes condensats d'installateurs épinglés ainsi que le contrat exact d'actif compagnon et de somme de contrôle avant de publier le brouillon de version GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue vite, utilisez l'assistant au lieu de `gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de déclenchement de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L'assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, déclenche `Full Release Validation` depuis cette référence épinglée, vérifie que chaque workflow enfant a un `headSha` correspondant à la cible, et supprime la branche temporaire quand l'exécution se termine. Le vérificateur global échoue aussi si un workflow enfant s'est exécuté sur un SHA différent.

`release_profile` contrôle l'étendue live/fournisseurs transmise aux vérifications de publication. Les workflows de publication manuels utilisent `stable` par défaut ; utilisez `full` seulement quand vous voulez intentionnellement la large matrice consultative fournisseurs/médias. Les vérifications de publication stable et complète exécutent toujours le soak exhaustif live/E2E et du chemin de publication Docker ; le profil bêta peut l'activer avec `run_release_soak=true`.

- `minimum` conserve les lanes OpenAI/core critiques pour la publication les plus rapides.
- `stable` ajoute l'ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseurs/médias.

Le workflow global enregistre les identifiants des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez seulement le job de vérification parent pour rafraîchir le résultat global et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de version, `ci` pour seulement l'enfant CI complet normal, `plugin-prerelease` pour seulement l'enfant de préversion des Plugins, `release-checks` pour chaque enfant de publication, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow global. Cela garde la relance d'une boîte de publication échouée bornée après un correctif ciblé. Pour une seule lane multi-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes multi-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent des temps par phase. Les lanes QA de vérification de publication sont consultatives, sauf la porte standard de couverture des outils de runtime, qui bloque quand des outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé du niveau standard.

`OpenClaw Release Checks` utilise la référence de workflow fiable pour résoudre une seule fois la référence sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact aux vérifications multi-OS et à Package Acceptance, ainsi qu'au workflow Docker live/E2E du chemin de publication quand la couverture soak s'exécute. Cela garde les octets du paquet cohérents entre les boîtes de publication et évite de réempaqueter le même candidat dans plusieurs jobs enfants. Pour la lane live du Plugin npm Codex, les vérifications de publication transmettent soit une spec de Plugin publié correspondante dérivée de `release_package_spec`, soit le `codex_plugin_spec` fourni par l'opérateur, soit laissent l'entrée vide pour que le script Docker empaquette le Plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all` remplacent l'ancien workflow global. Le moniteur parent annule tout workflow enfant qu'il a déjà déclenché quand le parent est annulé, de sorte qu'une validation main plus récente ne reste pas bloquée derrière une ancienne exécution de vérification de publication de deux heures. Les validations de branche/tag de publication et les groupes de relance ciblée gardent `cancel-in-progress: false`.

## Shards live et E2E

L'enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais il l'exécute comme shards nommés via `scripts/test-live-shard.mjs` au lieu d'un seul job série :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrés par fournisseur
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards média audio/vidéo séparés et shards musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards de média live natifs s'exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux : les jobs en conteneur ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards de modèles/backends live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les shards du modèle live Docker, du Gateway partitionné par provider, du backend CLI, de la liaison ACP et du harness Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker du Gateway portent des limites `timeout` explicites au niveau des scripts, inférieures au délai d’expiration du job de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de release. Si ces shards reconstruisent indépendamment la cible Docker complète des sources, l’exécution de release est mal configurée et gaspillera du temps réel en constructions d’images dupliquées.

## Acceptation des paquets

Utilisez `Package Acceptance` lorsque la question est « ce paquet OpenClaw installable fonctionne-t-il comme produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence des sources, tandis que l’acceptation des paquets valide un seul tarball au moyen du même harness Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout un candidat de paquet, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis imprime la source, la référence de workflow, la référence de paquet, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare des images Docker avec digest de paquet si nécessaire, puis exécute les lanes Docker sélectionnées contre ce paquet au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le paquet et les images partagées une seule fois, puis répartit ces lanes en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` quand Package Acceptance en a résolu un ; un dispatch Telegram autonome peut toujours installer une spec npm publiée.
4. `summary` fait échouer le workflow si la résolution du paquet, l’acceptation Docker ou la lane Telegram optionnelle a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de release OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation d’une préversion ou d’une version stable publiée.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou depuis une balise de release, installe les dépendances dans un worktree détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS public ; `package_sha256` est requis. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou IP résolues privés/internes/à usage spécial, ainsi que les redirections hors de la même politique de sécurité publique.
- `source=trusted-url` télécharge un `.tgz` HTTPS depuis une politique de source de confiance nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont requis. Utilisez ceci uniquement pour des miroirs d’entreprise détenus par les mainteneurs ou des dépôts de paquets privés qui nécessitent des hôtes, ports, préfixes de chemin, hôtes de redirection ou résolutions de réseau privé configurés. Si la politique déclare une authentification bearer, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés à l’URL restent rejetés.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel, mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harness de confiance qui exécute le test. `package_ref` est le commit source empaqueté lorsque `source=ref`. Cela permet au harness de test actuel de valider d’anciens commits de source de confiance sans exécuter une ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocs complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de plugins hors ligne afin que la validation du paquet publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spec npm publiée conservé pour les dispatches autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, incluant les commandes locales,
les lanes Docker, les entrées Package Acceptance, les valeurs par défaut de release et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent Package Acceptance avec `source=artifact`, l’artefact de paquet de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la migration de paquet, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de plugin obsolètes, la réparation de l’installation de plugins configurés, les plugins hors ligne, la mise à jour des plugins et la preuve Telegram sur le même tarball de paquet résolu. Définissez `release_package_spec` sur Full Release Validation ou OpenClaw Release Checks après la publication d’une bêta pour exécuter la même matrice contre le paquet npm livré sans reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque Package Acceptance doit utiliser un paquet différent du reste de la validation de release. Les vérifications de release multiplateformes couvrent toujours l’onboarding, l’installeur et le comportement de plateforme propres à chaque OS ; la validation produit des paquets/mises à jour devrait commencer par Package Acceptance. La lane Docker `published-upgrade-survivor` valide une base de référence de paquet publié par exécution dans le chemin de release bloquant. Dans Package Acceptance, le tarball `package-under-test` résolu est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base de référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de réexécution des lanes échouées préservent cette base de référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin d’élargir la couverture aux quatre dernières releases npm stables, plus des releases bornes de compatibilité plugin épinglées et des fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de plugins OpenClaw configurés, les chemins de logs avec tilde et les racines de dépendances de plugins legacy obsolètes. Les sélections multi-bases de référence published-upgrade survivor sont sharded par base de référence dans des jobs Docker runner ciblés séparés. Le workflow `Update Migration` séparé utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur un nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions locales agrégées peuvent transmettre des specs de paquet exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, garder une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la base de référence avec une recette intégrée de commande `openclaw config set`, enregistre les étapes de recette dans `summary.json`, puis sonde `/healthz`, `/readyz` ainsi que le statut RPC après le démarrage du Gateway. Les lanes fraîches de paquet Windows et d’installeur vérifient aussi qu’un paquet installé peut importer une surcharge de contrôle de navigateur depuis un chemin Windows absolu brut. Le smoke de tour d’agent OpenAI multiplateforme utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, de sorte que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité legacy

Package Acceptance dispose de fenêtres bornées de compatibilité legacy pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes depuis la fixture fake git dérivée du tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de plugins peuvent lire d’anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance des enregistrements d’installation marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet publié `2026.4.26` peut aussi avertir pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les paquets ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Lors du débogage d’une exécution d’acceptation de paquet échouée, commencez par le résumé `resolve_package` pour confirmer la source du paquet, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les logs de lanes, les durées de phases et les commandes de réexécution. Préférez réexécuter le profil de paquet échoué ou les lanes Docker exactes plutôt que de relancer la validation complète de release.

## Smoke d’installation

Le workflow séparé `Install Smoke` réutilise le même script de périmètre via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de plugins groupés, ou les surfaces principales plugin/canal/gateway/Plugin SDK exercées par les tâches de smoke Docker. Les changements de plugins groupés limités au code source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image Dockerfile racine une fois, vérifie la CLI, exécute le smoke CLI agents delete shared-workspace, exécute l’e2e container gateway-network, vérifie un argument de build d’extension groupée, et exécute le profil Docker borné des plugins groupés sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation du package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call, et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image GHCR de smoke du Dockerfile racine pour le SHA cible, puis exécute l’installation du package QR, les smokes du Dockerfile racine/gateway, les smokes installateur/update, et l’E2E Docker rapide des plugins groupés en tant que tâches séparées afin que le travail sur l’installateur n’attende pas derrière les smokes de l’image racine.

Les poussées vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur une poussée, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent du fournisseur d’image avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute lors de la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels `Install Smoke` peuvent l’activer, mais les pull requests et les poussées vers `main` ne le font pas. La CI normale des PR exécute toujours la voie de régression rapide du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois sous forme de tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installateur/update/dépendance de plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification dans `scripts/lib/docker-e2e-plan.mjs`, et le runner exécute uniquement le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                      |
| -------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de créneaux du pool principal pour les voies normales.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de créneaux du pool de fin sensible aux fournisseurs.                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond de voies live simultanées afin que les fournisseurs n’appliquent pas de throttling.    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                 | Plafond de voies d’installation npm simultanées.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond de voies multi-service simultanées.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de voies pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai de secours par voie (120 minutes) ; certaines voies live/de fin sélectionnées utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan du planificateur sans exécuter les voies.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage pour que les agents puissent reproduire une voie en échec. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. Le préflight global local vérifie Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, persiste les durées des voies pour l’ordonnancement des plus longues d’abord, et arrête par défaut de planifier de nouvelles voies groupées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, type d’image, image live, voie et identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images E2E Docker GHCR bare/fonctionnelles taguées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes taguées par digest de package au lieu de reconstruire. Les téléchargements d’images Docker sont retentés avec un délai borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique de CI.

### Morceaux du chemin de release

La couverture Docker de release exécute des tâches découpées plus petites avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque morceau ne télécharge que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live du package de plugin Codex, qui installe le package candidat OpenClaw, installe le plugin Codex depuis `codex_plugin_spec` ou un tarball de la même référence avec approbation explicite d’installation de la CLI Codex, exécute le préflight de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw dans la même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime`, et `plugins-integrations` restent des alias agrégés de plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux voies d’installateur fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un morceau autonome `openwebui` uniquement pour les déclenchements limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux des voies, les durées, `summary.json`, `failures.json`, les durées de phases, le JSON du plan du planificateur, les tableaux des voies lentes, et les commandes de réexécution par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des tâches de morceaux, ce qui limite le débogage d’une voie en échec à une seule tâche Docker ciblée et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, la tâche ciblée construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name`, et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie en échec puisse réutiliser le package et les images exacts de l’exécution en échec.

```bash
pnpm test:docker:rerun <run-id>      # télécharger les artefacts Docker et afficher les commandes de réexécution ciblées combinées/par voie
pnpm test:docker:timings <summary>   # résumés des voies lentes et du chemin critique par phase
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Prérelease de Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les poussées vers `main`, et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il répartit les tests des plugins groupés sur huit workers d’extension ; ces tâches de shards d’extension exécutent jusqu’à deux groupes de configuration de plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de plugins riches en imports ne créent pas de tâches CI supplémentaires. Le chemin Docker de prérelease réservé aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des tâches d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur sont des entrées de triage et ne modifient pas la barrière bloquante Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnais larges de QA et de release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une large exécution de validation.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie la voie de parité mock, la voie Matrix live, et les voies Telegram et Discord live en tâches parallèles. Les tâches live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat du canal soit isolé de la latence du modèle live et du démarrage normal du plugin fournisseur. Le Gateway de transport live désactive la recherche mémoire parce que la parité QA couvre séparément le comportement mémoire ; la connectivité des fournisseurs est couverte par les suites séparées de modèle live, fournisseur natif, et fournisseur Docker.

Matrix utilise `--profile fast` pour les barrières planifiées et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; un déclenchement manuel `matrix_profile=all` découpe toujours la couverture Matrix complète en tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la release avant l’approbation de release ; sa barrière de parité QA exécute les packs candidat et de référence comme tâches de voies parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/vérification à portée limitée au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité de premier passage étroit, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde pour les pull requests non brouillon scannent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevée/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent hors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                        | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron et référence Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation du canal cœur, plus runtime du plugin de canal, Gateway, Plugin SDK, secrets, points de contact d’audit  |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF cœur, analyse IP, garde réseau, web-fetch et politique SSRF du Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et barrières d’exécution des outils d’agent                  |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance liées à l’installation de Plugin, au chargeur, au manifeste, au registre, à l’installation par gestionnaire de paquets, au chargement de source et au contrat de paquet du Plugin SDK |

### Fragments de sécurité propres à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit exécuteur Blacksmith Linux accepté par la validation de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de construction des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car la construction macOS domine le temps d’exécution même lorsqu’elle est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript sans sécurité, de sévérité erreur, sur des surfaces étroites à forte valeur, sur des exécuteurs Linux hébergés par GitHub, afin que les analyses de qualité ne consomment pas le budget d’enregistrement des exécuteurs Blacksmith. Sa garde de pull request est intentionnellement plus petite que le profil planifié : les PR non brouillon exécutent uniquement les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant le code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, le code de schéma/migration/IO de config, le code auth/secrets/sandbox/sécurité, le canal cœur et le runtime du plugin de canal groupé, le protocole Gateway/la méthode serveur, le runtime mémoire/la colle SDK, MCP/processus/livraison sortante, le runtime fournisseur/le catalogue de modèles, les diagnostics de session/files de livraison, le chargeur de plugins, le Plugin SDK/contrat de paquet, ou le runtime de réponse du Plugin SDK. Les changements de config CodeQL et de workflow de qualité exécutent les douze fragments de qualité de PR.

Le lancement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage et d’itération pour exécuter un fragment de qualité isolément.

| Catégorie                                              | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron et code de frontière de sécurité Gateway                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Schéma de config, migration, normalisation et contrats d’IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal cœur et du plugin de canal groupé                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponse automatique, et contrats de runtime du plan de contrôle ACP              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades du runtime mémoire, alias mémoire du Plugin SDK, colle d’activation du runtime mémoire et commandes doctor mémoire                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/paquets de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, assistants de payload/segmentation/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, auth et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur et registres web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime du fetch/search web cœur, IO média, compréhension média, génération d’images et génération média                                               |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et du point d’entrée Plugin SDK                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté paquet publié et assistants de contrat de paquet de plugin                                                                              |

La qualité reste séparée de la sécurité afin que les résultats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL Swift, Python et plugins groupés devrait être réajoutée sous forme de travail de suivi cadré ou fragmenté uniquement après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour maintenir les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, et le lancement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées quand `main` a avancé ou quand une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Quand il s’exécute, il révise la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, afin qu’une exécution horaire puisse couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le lancement manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé de suite complète, laisse Codex n’effectuer que de petites corrections de performance des tests qui préservent la couverture au lieu de grands refactors, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la référence. Le rapport groupé enregistre le temps mural par config et le RSS max sur Linux et macOS, afin que la comparaison avant/après fasse apparaître les deltas de mémoire des tests à côté des deltas de durée. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant que quoi que ce soit soit committé. Quand `main` avance avant que le push du bot aboutisse, la voie rebase le correctif validé, réexécute `pnpm check:changed` et retente le push ; les correctifs obsolètes conflictuels sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex conserve la même posture de sécurité drop-sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut le dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de muter GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée partagée, soit des fragments modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barrières de vérification locales et routage des changements

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck de production cœur et de tests cœur, plus le lint/les gardes cœur ;
- les changements uniquement sur les tests du cœur exécutent seulement le typecheck des tests cœur, plus le lint cœur ;
- les changements de production des extensions exécutent le typecheck de production extension et de tests extension, plus le lint extension ;
- les changements uniquement sur les tests d’extension exécutent le typecheck des tests extension, plus le lint extension ;
- les changements publics du Plugin SDK ou du contrat de plugin étendent au typecheck des extensions, car les extensions dépendent de ces contrats cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les bumps de version uniquement métadonnées de release exécutent des vérifications ciblées de version/config/dépendance racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappings explicites, puis les tests voisins et les dépendants du graphe d’import. La config de livraison des réponses visibles en salon partagé fait partie des mappings explicites : les changements apportés à la config de réponse visible en groupe, au mode de livraison des réponses source ou au prompt système de l’outil de message passent par les tests de réponse cœur ainsi que les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche suffisamment largement le harnais pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de boîte distante appartenant au dépôt pour la preuve mainteneur Linux. Utilisez-le
depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle d’édition locale, lorsque la parité CI
importe, ou lorsque la preuve nécessite des secrets, Docker, des voies de paquet,
des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est
`blacksmith-testbox` ; la capacité AWS/Hetzner possédée est une solution de repli pour les pannes Blacksmith,
les problèmes de quota ou les tests explicites sur capacité possédée.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réservent, synchronisent, exécutent, rapportent et nettoient des Testboxes à usage unique. Le contrôle de cohérence de synchronisation intégré échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` disparaissent ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Pour les PR à suppressions massives intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur en millisecondes plus grande pour des diffs locales inhabituellement volumineuses.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` contient des valeurs par défaut pour le cloud possédé. Dans les worktrees Codex ou les checkouts liés/épars, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper Node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou plus récent afin que le wrapper bénéficie du comportement actuel de synchronisation, de file d’attente et de nettoyage des Testboxes. Lorsque vous utilisez le checkout frère, reconstruisez le binaire local ignoré avant tout travail de chronométrage ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Point de contrôle des changements :

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox à usage unique adossées à Blacksmith doivent arrêter automatiquement la Testbox ; si une exécution est interrompue ou si le nettoyage est incertain, inspectez les boîtes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même boîte hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez directement Blacksmith uniquement pour les diagnostics comme `list`, `status` et le nettoyage. Corrigez le chemin Crabbox avant de considérer une exécution directe Blacksmith comme preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent, mais que les nouveaux préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes, considérez qu’il s’agit d’une pression côté fournisseur Blacksmith, file d’attente, facturation ou limite d’organisation. Arrêtez les identifiants en file d’attente que vous avez créés, évitez de démarrer d’autres Testboxes et déplacez la preuve vers le chemin de capacité Crabbox possédé ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith, la facturation et les limites d’organisation.

N’escaladez vers la capacité Crabbox possédée que lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité possédée est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite réellement un CPU de classe 48xlarge. Une demande `beast` démarre à 192 vCPU et constitue le moyen le plus simple de déclencher les quotas régionaux EC2 Spot ou On-Demand Standard. Le fichier `.crabbox.yaml` possédé par le dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS négociés affichent la région/le marché sélectionné, la pression de quota, le basculement Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les contrôles larges plus lourds, `large` seulement après que standard/fast se sont révélés insuffisants, et `beast` uniquement pour des voies exceptionnelles liées au CPU comme les matrices Docker de suite complète ou de tous les Plugins, la validation explicite de release/bloquant, ou le profilage de performance à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, le travail uniquement documentaire, les lint/typecheck ordinaires, les petites reproductions E2E ou le triage d’une panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que les fluctuations du marché Spot ne soient pas mélangées au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies de cloud possédé. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secrète pour les commandes `crabbox run --id <cbx_id>` de cloud possédé.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

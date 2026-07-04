---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des jobs CI, gates de périmètre, umbrellas de release et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-04T17:56:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. Les pushes
canoniques vers `main` passent d’abord par une fenêtre d’admission de 90 secondes
sur runner hébergé. Le groupe de concurrence `CI` existant annule cette exécution
en attente lorsqu’un commit plus récent arrive, afin que les merges séquentiels
n’enregistrent pas chacun une matrice Blacksmith complète. Les pull requests et
les déclenchements manuels ignorent cette attente. Le job `preflight` classe
ensuite le diff et désactive les lanes coûteuses lorsque seules des zones sans
rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent
intentionnellement le scoping intelligent et déploient le graphe complet pour les
release candidates et la validation large. Les lanes Android restent optionnelles
via `include_android`. La couverture des plugins réservée aux releases se trouve
dans le workflow distinct [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute
qu’à partir de [`Full Release Validation`](#full-release-validation) ou d’un
déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                  | Quand il s’exécute                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `preflight`                        | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons            |
| `runner-admission`                 | Debounce hébergé de 90 secondes pour les pushes canoniques vers `main` avant l’enregistrement du travail Blacksmith | À chaque exécution CI ; pause uniquement sur les pushes canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor`, et audit du lockfile de production | Toujours sur les pushes et PR non brouillons            |
| `check-dependencies`               | Passe Knip de production limitée aux dépendances, plus garde de l’allowlist des fichiers inutilisés       | Changements pertinents pour Node                        |
| `build-artifacts`                  | Construire `dist/`, Control UI, smoke checks de la CLI construite, vérifications des artefacts construits embarqués, et artefacts réutilisables | Changements pertinents pour Node                        |
| `checks-fast-core`                 | Lanes rapides de correction Linux, comme bundled, protocol, QA Smoke CI, et vérifications de routage CI   | Changements pertinents pour Node                        |
| `checks-fast-contracts-plugins-*`  | Deux vérifications sharded des contrats de plugins                                                        | Changements pertinents pour Node                        |
| `checks-fast-contracts-channels-*` | Deux vérifications sharded des contrats de channels                                                       | Changements pertinents pour Node                        |
| `checks-node-core-*`               | Shards de tests Node du core, hors lanes de channel, bundled, contract et extension                       | Changements pertinents pour Node                        |
| `check-*`                          | Équivalent sharded du gate local principal : types prod, lint, guards, types de test, et smoke strict     | Changements pertinents pour Node                        |
| `check-additional-*`               | Architecture, boundary/prompt drift sharded, guards d’extension, limite de package, et topologie runtime  | Changements pertinents pour Node                        |
| `checks-node-compat-node22`        | Lane de build et smoke de compatibilité Node 22                                                          | Dispatch CI manuel pour les releases                    |
| `check-docs`                       | Formatage des docs, lint et vérifications de liens cassés                                                | Docs modifiées                                          |
| `skills-python`                    | Ruff + pytest pour les skills adossés à Python                                                           | Changements pertinents pour les skills Python           |
| `checks-windows`                   | Tests de processus/chemins spécifiques à Windows, plus régressions partagées des spécificateurs d’import runtime | Changements pertinents pour Windows                     |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements pertinents pour macOS                       |
| `macos-swift`                      | Lint, build et tests Swift pour l’app macOS                                                              | Changements pertinents pour macOS                       |
| `ios-build`                        | Génération du projet Xcode plus build simulateur de l’app iOS                                            | App iOS, kit d’app partagé, ou changements Swabble      |
| `android`                          | Tests unitaires Android pour les deux flavors, plus un build APK debug                                   | Changements pertinents pour Android                     |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après activité fiable                                     | Succès CI principal ou dispatch manuel                  |
| `openclaw-performance`             | Rapports quotidiens/à la demande sur les performances runtime Kova avec lanes mock-provider, deep-profile et live GPT 5.5 | Dispatch planifié et manuel                             |

## Ordre fail-fast

1. `runner-admission` attend uniquement pour les pushes canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
4. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
5. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs embedded channel, core-support-boundary et gateway-watch au lieu de mettre en file de petits jobs de vérification. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps mural, le temps de file, les jobs les plus lents, les échecs et la barrière de fanout `pnpm-store-warmup` depuis GitHub Actions. CI téléverse aussi le même résumé d’exécution comme artefact `ci-timings-summary`. Pour les temps de build, consultez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artefact `startup-memory`.

Pour les exécutions de pull request, le job terminal de résumé des temps exécute l’assistant depuis la révision de base fiable avant de passer `GH_TOKEN` à `gh run view`. Cela maintient la requête avec jeton hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte PR et preuves

Les PR de contributeurs externes exécutent un gate de contexte PR et de preuves depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow checkout le commit de base
fiable et évalue uniquement le corps de la PR ; il n’exécute pas de code depuis la
branche du contributeur.

Le gate s’applique aux auteurs de PR qui ne sont pas propriétaires, membres,
collaborateurs ou bots du dépôt. Il réussit lorsque le corps de la PR contient
des sections rédigées `What Problem This Solves` et `Evidence`. La preuve peut être
un test ciblé, un résultat CI, une capture d’écran, un enregistrement, une sortie
de terminal, une observation live, un journal expurgé ou un lien d’artefact. Le
corps fournit l’intention et une validation utile ; les reviewers inspectent le
code, les tests et la CI pour évaluer la correction.

Lorsque la vérification échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Portée et routage

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone scoped avait changé.

- **Modifications du workflow CI** valident le graphe CI Node plus le linting des workflows, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de source de plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, le guard d’interpolation d’action composite et le guard de marqueurs de conflit. Le job `security-fast` scoped à la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les constats de sécurité de workflow échouent tôt dans le graphe CI principal.
- **Docs sur les pushes `main`** sont vérifiées par le workflow autonome `Docs` avec le même miroir docs ClawHub utilisé par CI, afin que les pushes mixtes code+docs ne mettent pas aussi en file le shard CI `check-docs`. Les pull requests et CI manuel exécutent toujours `check-docs` depuis CI lorsque les docs ont changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, il couvre donc à la fois la lane de fixture déterministe `TuiBackend` et le smoke plus lent `tui --local` qui mocke uniquement l’endpoint de modèle externe.
- **Modifications uniquement de routage CI, certaines modifications peu coûteuses de fixtures de tests core, et modifications étroites de helpers/routage de tests de contrats de plugins** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de channels, les shards core complets, les shards de plugins bundled et les matrices de guards additionnels lorsque le changement est limité aux surfaces de routage ou de helpers que la tâche rapide exerce directement.
- **Vérifications Windows Node** sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux helpers de runner npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport de source, plugin, install-smoke et uniquement de tests restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans réserver trop de runners : les contrats de plugins et les contrats de canaux s’exécutent chacun sous forme de deux shards pondérés appuyés par Blacksmith avec le fallback standard vers les runners GitHub, les voies rapides/de support des tests unitaires du cœur s’exécutent séparément, l’infrastructure d’exécution du cœur est répartie entre état, processus/configuration, partagé, et trois shards de domaines Cron, la réponse automatique s’exécute avec des workers équilibrés (avec le sous-arbre de réponse divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentiques Gateway/serveur sont réparties entre les voies chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale regroupe ensuite uniquement les shards d’infra isolés à motifs d’inclusion dans des bundles déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites non isolées de commandes/Cron, agents-core avec état, ou Gateway/serveur ; les suites fixes lourdes restent sur 8 vCPU tandis que les voies groupées et de poids inférieur utilisent 4 vCPU. Les pull requests sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés au sein du plan Linux Node actuel de 34 tâches, afin qu’une seule PR n’enregistre pas toute la matrice Node de plus de 70 tâches. Les poussées sur `main`, les dispatches manuels et les portes de release conservent la matrice complète. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées plutôt que le fourre-tout partagé des plugins. Les shards à motifs d’inclusion enregistrent les entrées de timing avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional-*` garde ensemble le travail de compilation/canari lié aux frontières de packages et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste des gardes de frontière est répartie en un shard riche en prompts et un shard combiné pour les bandes de gardes restantes, chacun exécutant simultanément des gardes indépendantes sélectionnées et affichant les timings par vérification. La coûteuse vérification de dérive des snapshots de prompts du chemin heureux Codex s’exécute comme tâche supplémentaire distincte uniquement pour la CI manuelle et les changements affectant les prompts, afin que les changements Node normaux sans lien n’attendent pas derrière la génération froide des snapshots de prompts et que les shards de frontière restent équilibrés, tout en rattachant toujours la dérive des prompts à la PR qui l’a causée ; le même indicateur ignore la génération Vitest des snapshots de prompts dans le shard construit de frontière de support du cœur. La surveillance Gateway, les tests de canaux et le shard de frontière de support du cœur s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique permet jusqu’à 24 tâches de test Node concurrentes et
12 pour les voies rapides/de vérification plus petites ; Windows et Android restent à deux, car
ces pools de runners sont plus étroits.

Le plan PR compact émet 18 tâches Node pour la suite actuelle : les groupes de
configurations entières sont traités par lots dans des sous-processus isolés avec un délai d’expiration de lot de 120 minutes,
tandis que les groupes à motifs d’inclusion partagent le même budget borné de tâches.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK Play debug. La variante tierce n’a pas de jeu de sources ni de manifeste séparé ; sa voie de tests unitaires compile toujours la variante avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant une tâche dupliquée de packaging de l’APK debug à chaque poussée pertinente pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip en production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers inutilisés en production de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée obsolète dans l’allowlist, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne récupère pas et n’exécute pas de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts vers `openclaw/clawsweeper`.

Le workflow comporte quatre voies :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau des commits lors des poussées sur `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La voie `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures routinières, modifications, agitation de bots, bruit de Webhook en double et trafic de revue normal doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de tâches que la CI normale, mais forcent l’activation de chaque voie scopée non Android : shards Linux Node, shards de plugins groupés, shards de contrats de plugins et de canaux, compatibilité Node 22, `check-*`, `check-additional-*`, vérifications smoke d’artefacts construits, vérifications docs, Skills Python, Windows, macOS, build iOS et i18n de Control UI. Les dispatches CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’enveloppe complète de release active Android en passant `include_android=true`. Les vérifications statiques de prérelease de plugins, le shard `agentic-plugins` réservé aux releases, le balayage complet par lots des extensions et les voies Docker de prérelease de plugins sont exclus de la CI. La suite Docker de prérelease s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la porte de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de candidate release ne soit pas annulée par une autre poussée ou exécution PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant fiable d’exécuter ce graphe contre une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Le chemin extended-stable mensuel réservé à npm est l’exception : déclenchez à la fois le prévol `OpenClaw NPM
Release` et `Full Release Validation` depuis la branche exacte
`extended-stable/YYYY.M.33`, conservez leurs ID d’exécution et transmettez les deux ID à l’exécution
de publication npm directe. Consultez [Publication extended-stable mensuelle réservée à npm](/fr/reference/RELEASING#monthly-npm-only-extended-stable-publication) pour
les commandes, les exigences exactes d’identité, la relecture du registre et la procédure
de réparation du sélecteur. Ce chemin ne déclenche pas la publication de plugins, macOS, Windows, GitHub
Release, dist-tag privé ni d’autres plateformes.

## Runners

| Runner                          | Tâches                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch CI manuel et fallbacks des dépôts non canoniques, analyses qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows docs hors CI et prévol install-smoke afin que la matrice Blacksmith puisse se mettre en file plus tôt                                      |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards d’extensions de poids inférieur, `checks-fast-core` sauf QA Smoke CI, shards de contrats plugin/canal, la plupart des shards Linux Node groupés/de poids inférieur, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` sélectionnés et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, shards `check-additional-*` lourds en frontières/extensions et `android`                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI et Testbox, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file 32 vCPU coûtait plus qu’il n’économisait)                                                                      |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks retombent sur `macos-15`                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks retombent sur `macos-26`                                                                                                                                                                                                                |

## Budget d’enregistrement des runners

Le bucket actuel d’enregistrement des runners GitHub d’OpenClaw indique 10 000
enregistrements de runners auto-hébergés par 5 minutes dans `ghx api rate_limit`. Revérifiez
`actions_runner_registration` avant chaque passe de réglage, car GitHub peut modifier
ce bucket. La limite est partagée par tous les enregistrements de runners Blacksmith dans
l’organisation `openclaw`, donc ajouter une autre installation Blacksmith n’ajoute pas
de nouveau bucket.

Traitez les labels Blacksmith comme la ressource rare pour le contrôle des rafales. Les tâches qui
ne font que router, notifier, résumer, sélectionner des shards ou exécuter de courtes analyses CodeQL doivent
rester sur des runners hébergés par GitHub, sauf si elles ont des besoins propres à Blacksmith
mesurés. Toute nouvelle matrice Blacksmith, tout `max-parallel` plus grand ou tout workflow
à haute fréquence doit montrer son nombre d’enregistrements dans le pire cas et maintenir la cible
au niveau de l’organisation sous environ 60 % du bucket live. Avec le bucket actuel de 10 000 enregistrements,
cela signifie une cible opérationnelle de 6 000 enregistrements, laissant de la marge pour
les dépôts concurrents, les nouvelles tentatives et les chevauchements de rafales.

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut pour les exécutions normales sur poussée et pull request. Les exécutions `workflow_dispatch` et celles des dépôts non canoniques utilisent des runners hébergés par GitHub, mais les exécutions canoniques normales ne sondent pas actuellement l’état de la file Blacksmith et ne retombent pas automatiquement sur des labels hébergés par GitHub lorsque Blacksmith est indisponible.

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

## Performances d’OpenClaw

`OpenClaw Performance` est le workflow de performances produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le déclenchement manuel mesure normalement la référence du workflow. Définissez `target_ref` pour évaluer un tag de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` consigne la référence/SHA testé, la référence/SHA du workflow, la référence Kova, le profil, le mode d’authentification de la lane, le modèle, le nombre de répétitions et les filtres de scénario.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime en build local avec une authentification factice déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/heap/trace des points chauds au démarrage, dans le Gateway et lors des tours d’agent.
- `live-openai-candidate` : un vrai tour d’agent OpenAI `openai/gpt-5.5`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire pour les cas de démarrage par défaut, avec hook et avec 50 plugins ; RSS d’import des plugins groupés, boucles hello répétées mock-OpenAI `channel-chat-baseline`, commandes de démarrage CLI contre le Gateway démarré, et sonde de performance smoke de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la référence testée, le résumé source compare les valeurs RSS et heap actuelles à cette baseline et marque les fortes augmentations RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la référence testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de release

`Full Release Validation` est le workflow manuel global pour « tout exécuter avant la release ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves propres aux releases concernant les plugins/packages/statique/Docker, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation des packages, les vérifications de packages inter-OS, le rendu de la scorecard de maturité à partir des preuves de profil QA, la parité QA Lab, Matrix et les lanes Telegram. Les profils stable et full incluent toujours une couverture live/E2E exhaustive et un soak Docker du chemin de release ; le profil beta peut l’activer avec `run_release_soak=true`. L’E2E Telegram canonique du package s’exécute dans Package Acceptance, donc un candidat complet ne démarre pas de poller live en double. Après publication, passez `release_package_spec` pour réutiliser le package npm publié dans les release checks, Package Acceptance, Docker, les vérifications inter-OS et Telegram sans rebuild. Utilisez `npm_telegram_package_spec` uniquement pour une relance Telegram ciblée sur un package publié. La lane package live du plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié dérive `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact packagent `extensions/codex` depuis la référence sélectionnée. Définissez explicitement `codex_plugin_spec` pour des sources de plugin personnalisées comme les specs `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des jobs de workflow, les différences entre profils, les artefacts et les
identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel mutatif de release. Déclenchez-le
depuis `release/YYYY.M.PATCH` ou `main` après l’existence du tag de release et après la réussite du
préflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de plugin publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré. La publication stable
exige aussi un `windows_node_tag` exact ; le workflow vérifie la release source Windows
et compare ses installateurs x64/ARM64 avec l’entrée
`windows_node_installer_digests` approuvée pour le candidat avant tout workflow enfant de publication, puis promeut
et vérifie ces mêmes empreintes d’installateur épinglées ainsi que le contrat exact d’artefact compagnon
et de checksum avant de publier le brouillon de release GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de déclenchement des workflows GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque
workflow enfant `headSha` correspond à la cible, puis supprime la branche temporaire lorsque l’exécution
se termine. Le vérificateur global échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/provider transmise aux release checks. Les
workflows manuels de release utilisent `stable` par défaut ; utilisez `full` seulement lorsque vous
voulez intentionnellement la large matrice consultative provider/média. Les release checks stable et full
exécutent toujours le soak exhaustif live/E2E et Docker du chemin de release ;
le profil beta peut l’activer avec `run_release_soak=true`.

- `minimum` conserve les lanes OpenAI/core critiques pour la release les plus rapides.
- `stable` ajoute l’ensemble stable de providers/backends.
- `full` exécute la large matrice consultative provider/média.

Le workflow global enregistre les ids des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement le job vérificateur parent pour actualiser le résultat global et le résumé des timings.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de release, `ci` pour seulement l’enfant CI complet normal, `plugin-prerelease` pour seulement l’enfant de prérelease des plugins, `release-checks` pour chaque enfant de release, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` dans le workflow global. Cela limite la relance d’une boîte de release échouée après un correctif ciblé. Pour une lane inter-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes inter-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent des timings par phase. Les lanes de release-check QA sont consultatives, sauf la porte standard de couverture des outils runtime, qui bloque lorsque les outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé du niveau standard.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre une fois la ref sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact aux vérifications inter-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de release lorsque la couverture soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de release et évite de repackager le même candidat dans plusieurs jobs enfants. Pour la lane live npm-plugin Codex, les release checks transmettent soit une spec de plugin publié correspondante dérivée de `release_package_spec`, soit le `codex_plugin_spec` fourni par l’opérateur, soit laissent l’entrée vide pour que le script Docker package le plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow global. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin que la nouvelle validation main
ne reste pas bloquée derrière une ancienne exécution de release-check de deux heures. La validation de branche/tag de release
et les groupes de relance ciblée conservent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’un seul job sériel :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrés par provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards média audio/vidéo séparés et shards musique filtrés par provider

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de providers live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards de modèle/backend live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les shards du modèle live Docker, du Gateway partitionné par fournisseur, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker du Gateway portent des plafonds `timeout` explicites au niveau des scripts, inférieurs au délai d’expiration de la tâche de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de vérification de release. Si ces shards reconstruisent indépendamment la cible Docker complète depuis les sources, l’exécution de release est mal configurée et gaspillera du temps réel en constructions d’images dupliquées.

## Acceptation de package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation de package valide une seule tarball au moyen du même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` récupère `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et affiche la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de la tarball, prépare les images Docker de résumé de package si nécessaire, et exécute les lanes Docker sélectionnées contre ce package au lieu d’empaqueter la copie de travail du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis déploie ces lanes en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation de package en a résolu un ; une distribution Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la lane Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw, telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation des préreleases/stables publiées.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique de branche du dépôt ou depuis une balise de release, installe les dépendances dans une copie de travail détachée, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS public ; `package_sha256` est requis. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou IP résolues privés/internes/à usage spécial, et les redirections hors de la même politique de sécurité publique.
- `source=trusted-url` télécharge un `.tgz` HTTPS depuis une politique de source de confiance nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont requis. Utilisez cela uniquement pour les miroirs d’entreprise détenus par les mainteneurs ou les dépôts de packages privés qui ont besoin d’hôtes, de ports, de préfixes de chemin, d’hôtes de redirection ou d’une résolution de réseau privé configurés. Si la politique déclare une authentification bearer, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés à l’URL sont toujours rejetés.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif, mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider des commits source de confiance plus anciens sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de Plugin hors ligne afin que la validation du package publié ne soit pas conditionnée par la disponibilité live de ClawHub. La lane Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publiée étant conservé pour les distributions autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, y compris les commandes locales,
les lanes Docker, les entrées d’acceptation de package, les valeurs par défaut de release et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent l’acceptation de package avec `source=artifact`, l’artefact de package de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, et `telegram_mode=mock-openai`. Cela garde la migration de package, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de plugin obsolètes, la réparation de l’installation de Plugin configuré, le Plugin hors ligne, la mise à jour de Plugin et la preuve Telegram sur la même tarball de package résolue. Définissez `release_package_spec` sur Full Release Validation ou OpenClaw Release Checks après la publication d’une beta pour exécuter la même matrice contre le package npm expédié sans reconstruction ; définissez `package_acceptance_package_spec` uniquement lorsque l’acceptation de package a besoin d’un package différent du reste de la validation de release. Les vérifications de release multi-OS couvrent toujours l’onboarding, l’installeur et le comportement de plateforme propres à chaque OS ; la validation produit package/mise à jour devrait commencer par l’acceptation de package. La lane Docker `published-upgrade-survivor` valide une base de package publiée par exécution dans le chemin de release bloquant. Dans l’acceptation de package, la tarball `package-under-test` résolue est toujours la candidate et `published_upgrade_survivor_baseline` sélectionne la base publiée de secours, par défaut `openclaw@latest` ; les commandes de relance de lane échouée conservent cette base. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la matrice aux quatre dernières releases npm stables, plus des releases de frontière de compatibilité de Plugin épinglées et des fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugin OpenClaw configurées, les chemins de logs avec tilde et les racines de dépendances de plugin héritées obsolètes. Les sélections published-upgrade survivor multi-bases sont partitionnées par base en tâches de runner Docker ciblées séparées. Le workflow séparé `Update Migration` utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des spécifications de packages exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la base avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que l’état RPC après le démarrage du Gateway. Les lanes fraîches Windows empaquetées et avec installeur vérifient aussi qu’un package installé peut importer une surcharge de contrôle de navigateur depuis un chemin Windows absolu brut. Le smoke de tour d’agent OpenAI multi-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation de package comporte des fenêtres de compatibilité héritée bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de la tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes depuis la fixture de faux git dérivée de la tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de plugin peuvent lire des emplacements hérités d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation marketplace ;
- `plugin-update` peut autoriser la migration de métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut aussi avertir pour les fichiers d’estampille de métadonnées de build local déjà expédiés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lane, les timings de phase et les commandes de relance. Préférez relancer le profil de package échoué ou les lanes Docker exactes plutôt que de relancer la validation de release complète.

## Smoke d’installation

Le workflow séparé `Install Smoke` réutilise le même script de périmètre au moyen de sa propre tâche `preflight`. Il divise la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de plugin intégré, ou les surfaces centrales plugin/channel/gateway/SDK de Plugin que les jobs de smoke Docker exercent. Les changements de source uniquement dans un plugin intégré, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI agents delete shared-workspace, exécute l’e2e container gateway-network, vérifie un argument de build d’extension intégrée, et exécute le profil Docker borné de plugin intégré sous un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call, et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/gateway, les smokes installateur/update, et l’E2E Docker rapide de plugin intégré comme jobs séparés afin que le travail d’installateur n’attende pas derrière les smokes d’image racine.

Les pushes sur `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent Bun global install image-provider est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute sur le planning nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels `Install Smoke` peuvent l’activer, mais les pull requests et les pushes sur `main` ne le font pas. La CI normale des PR exécute toujours la voie de régression rapide du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image live-test partagée, empaquette OpenClaw une seule fois comme tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installateur/update/dépendances de plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker vivent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification vit dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre d’emplacements du pool principal pour les voies normales.                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre d’emplacements du pool final sensible aux fournisseurs.                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de voies live simultanées afin que les fournisseurs ne limitent pas le débit.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | Plafond de voies d’installation npm simultanées.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de voies multi-services simultanées.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les tempêtes de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de secours par voie (120 minutes) ; certaines voies live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` affiche le plan du planificateur sans exécuter les voies.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. Le préflight agrégé local vérifie Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet le statut des voies actives, persiste les durées des voies pour un ordre du plus long au plus court, et arrête par défaut de planifier de nouvelles voies en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelles couvertures de package, type d’image, image live, voie et identifiants sont requises. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images Docker E2E GHCR bare/functional taguées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou des images existantes taguées par digest de package au lieu de reconstruire. Les pulls d’images Docker sont réessayés avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux registry/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique de la CI.

### Morceaux du chemin de release

La couverture Docker de release exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque morceau ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live du package de plugin Codex, qui installe le package OpenClaw candidat, installe le plugin Codex depuis `codex_plugin_spec` ou un tarball de la même référence avec approbation explicite d’installation de la CLI Codex, exécute le préflight de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw dans la même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de relance manuelle pour les deux voies d’installation de fournisseur.

OpenWebUI est intégré dans `plugins-runtime-services` lorsque la couverture complète release-path le demande, et conserve un morceau autonome `openwebui` uniquement pour les déclenchements limités à OpenWebUI. Les voies de mise à jour de channels intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phases, le JSON du plan du planificateur, les tableaux de voies lentes et les commandes de relance par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des jobs par morceaux, ce qui limite le débogage d’une voie échouée à un job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image live-test pour cette relance. Les commandes GitHub de relance générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker release-path complète.

## Prérelease Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse, donc il s’agit d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il répartit les tests de plugins intégrés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin Docker prerelease réservé aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur servent d’entrée de triage et ne changent pas le gate bloquant Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les grands harnais QA et release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une large exécution de validation.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur déclenchement manuel ; il ventile la voie de parité mock, la voie Matrix live, et les voies Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de channel soit isolé de la latence du modèle live et du démarrage normal du plugin fournisseur. Le Gateway de transport live désactive la recherche mémoire parce que la parité QA couvre séparément le comportement de mémoire ; la connectivité fournisseur est couverte par les suites séparées modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un déclenchement manuel `matrix_profile=all` répartit toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les voies QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et baseline comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/check à portée définie au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité de premier passage étroit, pas le balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde sur pull request non brouillon scannent le code de workflow Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevée/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, ou les chemins runtime de plugins intégrés propriétaires de processus, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Référence de base pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus le runtime du Plugin de canal, le Gateway, le SDK Plugin, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de politique SSRF du cœur, d’analyse IP, de garde réseau, de récupération web et du SDK Plugin                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et portes d’exécution des outils d’agent                       |
| `/codeql-security-high/process-exec-boundary`     | Shell local, assistants de lancement de processus, runtimes de Plugins groupés propriétaires de sous-processus et glue des scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour l’installation de Plugin, le chargeur, le manifeste, le registre, l’installation via gestionnaire de paquets, le chargement de source et le contrat de paquet du SDK Plugin |

### Éclats de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — éclat de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Linux Blacksmith accepté par les contrôles de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — éclat de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé en dehors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critiques

`CodeQL Critical Quality` est l’éclat non sécuritaire correspondant. Il exécute uniquement les requêtes de qualité JavaScript/TypeScript non sécuritaires de sévérité erreur sur des surfaces étroites à forte valeur, sur des runners Linux hébergés par GitHub, afin que les analyses de qualité ne consomment pas le budget d’enregistrement des runners Blacksmith. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillon n’exécutent que les éclats correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant au code d’exécution des commandes/modèles/outils d’agent et de dispatch des réponses, au schéma de configuration/migration/IO, à l’authentification/aux secrets/au bac à sable/à la sécurité, au canal du cœur et au runtime de Plugin de canal groupé, au protocole Gateway/aux méthodes serveur, au runtime mémoire/à la glue SDK, à MCP/processus/livraison sortante, au runtime fournisseur/catalogue de modèles, aux diagnostics de session/files de livraison, au chargeur de Plugin, au SDK Plugin/contrat de paquet ou au runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze éclats qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/d’itération pour exécuter un éclat qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                                            |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, migration, normalisation et IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats des méthodes serveur                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal du cœur et du Plugin de canal groupé                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, dispatch modèle/fournisseur, dispatch et files d’auto-réponse, et contrats de runtime du plan de contrôle ACP                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades de runtime mémoire, alias mémoire du SDK Plugin, glue d’activation du runtime mémoire et commandes doctor mémoire                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/de bundles de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch des réponses entrantes du SDK Plugin, assistants de payload/découpage/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues de fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime pour la récupération/recherche web du cœur, l’IO média, la compréhension média, la génération d’images et la génération média                 |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et du point d’entrée du SDK Plugin                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté paquet du SDK Plugin et assistants de contrat de paquet de plugin                                                                             |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL à Swift, Python et aux Plugins groupés doit être réajoutée sous forme de travail de suivi ciblé ou éclaté uniquement après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Agent Docs

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, et le dispatch manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits allant du SHA source du précédent Docs Agent non ignoré jusqu’au `main` courant, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis la dernière passe docs.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, mais il s’interrompt si une autre invocation workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur la suite complète, permet à Codex de n’effectuer que de petites corrections de performance de tests qui préservent la couverture au lieu de grands refactorings, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la référence. Le rapport groupé enregistre, par configuration, le temps réel et le RSS maximal sous Linux et macOS, de sorte que la comparaison avant/après expose les deltas mémoire des tests à côté des deltas de durée. Si la référence contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète post-agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’arrive, la voie rebase le patch validé, réexécute `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow manuel de mainteneur pour nettoyer les doublons après intégration. Il utilise par défaut un dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies modifiées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck prod du cœur et le typecheck tests du cœur, plus le lint/les gardes du cœur ;
- les changements uniquement de tests du cœur n’exécutent que le typecheck tests du cœur, plus le lint du cœur ;
- les changements de production d’extension exécutent le typecheck prod d’extension et le typecheck tests d’extension, plus le lint d’extension ;
- les changements uniquement de tests d’extension exécutent le typecheck tests d’extension, plus le lint d’extension ;
- les changements du SDK Plugin public ou du contrat de Plugin étendent au typecheck d’extension parce que les extensions dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les montées de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendance racine ;
- les changements inconnus racine/config échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source préfèrent les mappings explicites, puis les tests frères et les dépendants du graphe d’import. La configuration de livraison partagée des salons de groupe fait partie des mappings explicites : les changements de configuration de réponse visible au groupe, de mode de livraison des réponses source ou de prompt système de l’outil de message passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large sur le harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de machine distante détenu par le dépôt pour les preuves Linux des mainteneurs. Utilisez-le
depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle de modification locale, lorsque la parité
avec la CI compte, ou lorsque la preuve nécessite des secrets, Docker, des lanes de paquets,
des machines réutilisables ou des journaux distants. Le backend OpenClaw normal est
`blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes de Blacksmith,
les problèmes de quota ou les tests explicites sur capacité détenue.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réservent, synchronisent, exécutent, signalent et nettoient
des Testboxes à usage unique. La vérification de cohérence de synchronisation intégrée échoue rapidement lorsque des fichiers
racine requis comme `pnpm-lock.yaml` disparaissent, ou lorsque `git status --short`
affiche au moins 200 suppressions suivies. Pour les PR avec suppressions massives intentionnelles, définissez
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox termine aussi une invocation locale de la CLI Blacksmith qui reste dans la
phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur
en millisecondes plus élevée pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut de cloud détenu. Dans les worktrees Codex ou les checkouts liés/partiels, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou une version plus récente afin que le wrapper obtienne le comportement actuel de synchronisation, de file d’attente et de nettoyage des Testboxes. Lorsque vous utilisez le checkout frère, reconstruisez le binaire local ignoré avant les travaux de mesure ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Contrôle des modifications :

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

Réexécution ciblée de test :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Pour les exécutions
Blacksmith Testbox déléguées, le code de sortie du wrapper Crabbox et le résumé JSON constituent le
résultat de la commande. L’exécution GitHub Actions liée possède l’hydratation et le keepalive ; elle
peut se terminer avec l’état `cancelled` lorsque la Testbox est arrêtée en externe après que la commande SSH
a déjà retourné. Traitez cela comme un artefact de nettoyage/statut, sauf si
l’`exitCode` du wrapper est différent de zéro ou si la sortie de commande montre un test échoué.
Les exécutions Crabbox adossées à Blacksmith à usage unique doivent arrêter automatiquement la Testbox ;
si une exécution est interrompue ou si le nettoyage est ambigu, inspectez les machines actives et arrêtez uniquement
celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Utilisez la réutilisation uniquement lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même machine hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez directement
Blacksmith uniquement pour les diagnostics comme `list`, `status` et le nettoyage. Corrigez le
chemin Crabbox avant de traiter une exécution directe Blacksmith comme une preuve mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent, mais que les nouveaux
préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes,
traitez cela comme une pression liée au fournisseur Blacksmith, à la file d’attente, à la facturation ou aux limites d’organisation. Arrêtez les
identifiants en file d’attente que vous avez créés, évitez de démarrer davantage de Testboxes, et déplacez la preuve vers le
chemin de capacité Crabbox détenue ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith,
la facturation et les limites d’organisation.

Escaladez vers la capacité Crabbox détenue uniquement lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite réellement du CPU de classe 48xlarge. Une requête `beast` commence à 192 vCPU et constitue le moyen le plus simple de déclencher un quota régional EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` détenu par le dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS intermédiés affichent la région/le marché sélectionné, la pression de quota, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` uniquement après que standard/fast se sont révélés insuffisants, et `beast` uniquement pour les lanes exceptionnelles limitées par le CPU comme les matrices Docker de suite complète ou tous Plugins, la validation explicite de release/bloquant, ou le profilage de performance à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, les travaux de documentation uniquement, le lint/typecheck ordinaire, les petites reproductions E2E ou le triage d’une panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que l’instabilité du marché Spot ne soit pas mélangée au signal.

`.crabbox.yaml` possède les valeurs par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions pour les lanes de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et le transfert d’environnement non secret pour les commandes de cloud détenu `crabbox run --id <cbx_id>`.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

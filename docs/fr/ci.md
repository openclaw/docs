---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non.
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de release
    - Vous modifiez la répartition ClawSweeper ou le transfert d’activité GitHub
summary: Graphe des tâches CI, garde-fous de portée, périmètres de version et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-04T06:29:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

La CI d’OpenClaw s’exécute à chaque push vers `main` et pour chaque pull request. Les pushes canoniques vers
`main` passent d’abord par une fenêtre d’admission de 90 secondes sur runner hébergé.
Le groupe de concurrence `CI` existant annule cette exécution en attente lorsqu’un commit
plus récent arrive, de sorte que les merges séquentiels n’enregistrent pas chacun une matrice
Blacksmith complète. Les pull requests et les déclenchements manuels ignorent cette attente. Le job `preflight`
classe ensuite le diff et désactive les lanes coûteuses lorsque seules des zones non liées
ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le
scoping intelligent et déploient tout le graphe pour les release candidates et la validation
large. Les lanes Android restent opt-in via `include_android`. La couverture Plugin réservée aux releases
se trouve dans le workflow séparé [`Prépublication Plugin`](#plugin-prerelease)
et ne s’exécute que depuis [`Validation complète de release`](#full-release-validation)
ou par déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                   | Quand il s’exécute                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Détecter les changements docs-only, les scopes modifiés, les extensions modifiées et construire le manifeste de CI | Toujours sur les pushes et PRs non draft            |
| `runner-admission`                 | Debounce hébergé de 90 secondes pour les pushes canoniques vers `main` avant l’enregistrement du travail Blacksmith | Chaque exécution CI ; pause uniquement sur les pushes canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor` et audit du lockfile de production    | Toujours sur les pushes et PRs non draft            |
| `check-dependencies`               | Passe Knip production limitée aux dépendances, plus garde de la liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node                    |
| `build-artifacts`                  | Construire `dist/`, Control UI, smoke checks du CLI construit, contrôles des artéfacts construits embarqués et artéfacts réutilisables | Changements pertinents pour Node                    |
| `checks-fast-core`                 | Lanes de correction Linux rapides, comme les contrôles bundled, protocol, QA Smoke CI et routage CI        | Changements pertinents pour Node                    |
| `checks-fast-contracts-plugins-*`  | Deux contrôles de contrat Plugin shardés                                                                  | Changements pertinents pour Node                    |
| `checks-fast-contracts-channels-*` | Deux contrôles de contrat de canaux shardés                                                               | Changements pertinents pour Node                    |
| `checks-node-core-*`               | Shards de tests Node core, excluant les lanes canal, bundled, contrat et extension                         | Changements pertinents pour Node                    |
| `check-*`                          | Équivalent shardé de la gate locale principale : types prod, lint, guards, types de test et smoke strict  | Changements pertinents pour Node                    |
| `check-additional-*`               | Architecture, drift boundary/prompt shardé, guards d’extension, limite de package et topologie runtime    | Changements pertinents pour Node                    |
| `checks-node-compat-node22`        | Lane de build et smoke de compatibilité Node 22                                                           | Déclenchement manuel CI pour les releases           |
| `check-docs`                       | Formatage des docs, lint et contrôles de liens cassés                                                     | Docs modifiées                                      |
| `skills-python`                    | Ruff + pytest pour les Skills adossées à Python                                                           | Changements pertinents pour les Skills Python       |
| `checks-windows`                   | Tests de processus/chemins propres à Windows plus régressions partagées des spécificateurs d’import runtime | Changements pertinents pour Windows                 |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artéfacts construits partagés                                 | Changements pertinents pour macOS                   |
| `macos-swift`                      | Lint, build et tests Swift pour l’app macOS                                                               | Changements pertinents pour macOS                   |
| `ios-build`                        | Génération du projet Xcode plus build de l’app iOS dans le simulateur                                     | App iOS, kit d’app partagé ou changements Swabble   |
| `android`                          | Tests unitaires Android pour les deux saveurs plus build d’un APK de debug                                | Changements pertinents pour Android                 |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après activité fiable                                      | Succès de la CI principale ou déclenchement manuel  |
| `openclaw-performance`             | Rapports quotidiens/à la demande sur les performances du runtime Kova avec lanes mock-provider, deep-profile et GPT 5.5 live | Planifié et déclenchement manuel                    |

## Ordre fail-fast

1. `runner-admission` n’attend que pour les pushes canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes de ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs de matrice d’artéfacts et de plateformes plus lourds.
4. `build-artifacts` se superpose aux lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
5. Les lanes de plateformes et de runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si la plus récente exécution pour la même ref échoue également. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs embedded channel, core-support-boundary et gateway-watch au lieu de mettre en file de petits jobs vérificateurs. La clé de concurrence CI automatique est versionnée (`CI-v7-*`), de sorte qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps mural, le temps de file, les jobs les plus lents, les échecs et la barrière de fanout `pnpm-store-warmup` depuis GitHub Actions. La CI téléverse également le même résumé d’exécution comme artéfact `ci-timings-summary`. Pour le timing de build, vérifiez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artéfact `startup-memory`.

Pour les exécutions de pull request, le job terminal timing-summary exécute l’assistant depuis la révision de base fiable avant de transmettre `GH_TOKEN` à `gh run view`. Cela garde la requête avec token hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte PR et preuves

Les PRs de contributeurs externes exécutent une gate de contexte PR et de preuve depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow checkout le commit de base fiable
et évalue uniquement le corps de la PR ; il n’exécute pas le code de la branche
du contributeur.

La gate s’applique aux auteurs de PR qui ne sont pas propriétaires, membres,
collaborateurs ou bots du dépôt. Elle réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. Une preuve peut être un test ciblé,
un résultat CI, une capture d’écran, un enregistrement, une sortie de terminal, une observation live,
un log expurgé ou un lien d’artéfact. Le corps fournit l’intention et une validation utile ;
les reviewers inspectent le code, les tests et la CI pour évaluer la correction.

Lorsque le contrôle échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Scope et routage

La logique de scope se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone scopée avait changé.

- **Modifications du workflow CI** valident le graphe CI Node plus le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android ou macOS ; ces lanes de plateformes restent scopées aux changements de sources de plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, la garde d’interpolation des actions composites et la garde des marqueurs de conflit. Le job `security-fast` scopé à la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les findings de sécurité workflow échouent tôt dans le graphe CI principal.
- **Docs sur les pushes vers `main`** sont contrôlées par le workflow autonome `Docs` avec le même miroir de docs ClawHub utilisé par la CI, donc les pushes mixtes code+docs ne mettent pas aussi en file le shard CI `check-docs`. Les pull requests et la CI manuelle exécutent toujours `check-docs` depuis la CI lorsque les docs ont changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, ce qui couvre à la fois la lane déterministe de fixture `TuiBackend` et le smoke plus lent `tui --local` qui mocke uniquement l’endpoint de modèle externe.
- **Modifications limitées au routage CI, modifications sélectionnées de fixtures core-test peu coûteuses et modifications étroites d’assistants/tests de routage de contrats Plugin** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artéfacts de build, la compatibilité Node 22, les contrats de canaux, les shards core complets, les shards de Plugins bundled et les matrices de guards supplémentaires lorsque le changement est limité aux surfaces de routage ou d’assistants que la tâche rapide exerce directement.
- **Contrôles Node Windows** sont scopés aux wrappers de processus/chemins propres à Windows, aux assistants de runners npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements non liés de source, Plugin, install-smoke et test-only restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans réserver excessivement de runners : les contrats de plugins et les contrats de canaux s’exécutent chacun sous forme de deux fragments pondérés adossés à Blacksmith avec le repli standard sur runner GitHub, les voies rapides/de support des tests unitaires du cœur s’exécutent séparément, l’infrastructure d’exécution du cœur est répartie entre l’état, le processus/la configuration, le partagé et trois fragments de domaine Cron, la réponse automatique s’exécute avec des workers équilibrés (avec le sous-arbre des réponses divisé en fragments agent-runner, dispatch et commandes/routage d’état), et les configurations agentiques de Gateway/serveur sont réparties entre les voies chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale ne regroupe ensuite que les fragments d’infrastructure isolés à motifs d’inclusion dans des lots déterministes d’au plus 64 fichiers de test, réduisant la matrice Node sans fusionner les suites non isolées command/cron, agents-core avec état, ou gateway/server ; les suites fixes lourdes restent sur 8 vCPU tandis que les voies regroupées et moins lourdes utilisent 4 vCPU. Les pull requests sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés à l’intérieur du plan Linux Node actuel de 34 tâches, de sorte qu’une seule PR n’enregistre pas toute la matrice Node de plus de 70 tâches. Les poussées sur `main`, les déclenchements manuels et les barrières de release conservent toute la matrice. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. Les fragments à motifs d’inclusion enregistrent les entrées de durée avec le nom du fragment CI, ce qui permet à `.artifacts/vitest-shard-timings.json` de distinguer une configuration entière d’un fragment filtré. `check-additional-*` garde ensemble le travail de compilation/canari lié aux limites de packages et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste des garde-fous de limites est répartie en un fragment fortement axé sur les invites et un fragment combiné pour les bandes de garde restantes, chacun exécutant simultanément des garde-fous indépendants sélectionnés et affichant les durées par vérification. La coûteuse vérification de dérive d’instantanés d’invites du chemin nominal Codex s’exécute comme sa propre tâche supplémentaire uniquement pour la CI manuelle et pour les changements qui affectent les invites, de sorte que les changements Node normaux sans rapport n’attendent pas derrière la génération à froid d’instantanés d’invites et que les fragments de limites restent équilibrés tandis que la dérive des invites reste rattachée à la PR qui l’a provoquée ; le même indicateur ignore la génération Vitest d’instantanés d’invites dans le fragment core support-boundary des artefacts construits. La surveillance Gateway, les tests de canaux et le fragment core support-boundary s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 24 tâches de tests Node simultanées et
12 pour les voies fast/check plus petites ; Windows et Android restent à deux parce que
ces pools de runners sont plus étroits.

Le plan PR compact émet 18 tâches Node pour la suite actuelle : les groupes
de configurations entières sont traités par lots dans des sous-processus isolés avec un délai d’expiration de lot de 120 minutes,
tandis que les groupes à motifs d’inclusion partagent le même budget de tâches borné.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a pas de source set ni de manifeste séparé ; sa voie de tests unitaires compile tout de même la variante avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant une tâche de packaging d’APK debug dupliquée à chaque poussée pertinente pour Android.

Le fragment `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip en production uniquement sur les dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les fichiers inutilisés trouvés par Knip en production à `scripts/deadcode-unused-files.allowlist.mjs`. Le garde-fou des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne récupère ni n’exécute le code non fiable des pull requests. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre voies :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau des commits sur les poussées vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La voie `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer tout le corps du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé sur le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son invite et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile aux opérations. Les ouvertures routinières, les modifications, l’activité de bots, le bruit de Webhooks dupliqués et le trafic normal de revues doivent produire `NO_REPLY`.

Traitez les titres GitHub, commentaires, corps, textes de revue, noms de branches et messages de commit comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les déclenchements manuels de CI exécutent le même graphe de tâches que la CI normale, mais forcent l’activation de chaque voie à portée non Android : fragments Linux Node, fragments de plugins groupés, fragments de contrats de plugins et de canaux, compatibilité Node 22, `check-*`, `check-additional-*`, vérifications smoke des artefacts construits, vérifications docs, Skills Python, Windows, macOS, build iOS et i18n de l’interface de contrôle. Les déclenchements manuels autonomes de CI exécutent Android uniquement avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prérelease de plugins, le fragment `agentic-plugins` réservé aux releases, le balayage complet par lots des extensions et les voies Docker de prérelease de plugins sont exclus de la CI. La suite Docker de prérelease ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la barrière de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre poussée ou exécution de PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, une balise ou un SHA de commit complet tout en utilisant le fichier de workflow de la référence de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Tâches                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Déclenchement manuel de CI et replis pour les dépôts non canoniques, scans qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows docs hors CI et prévol install-smoke pour que la matrice Blacksmith puisse entrer en file plus tôt                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, fragments d’extensions moins lourds, `checks-fast-core` sauf QA Smoke CI, fragments de contrats de plugins/canaux, la plupart des fragments Linux Node groupés/moins lourds, `check-guards`, `check-prod-types`, `check-test-types`, fragments `check-additional-*` sélectionnés et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, fragments `check-additional-*` lourds en limites/extensions, et `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI et Testbox, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne faisaient économiser) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il ne faisait économiser)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks se replient sur `macos-26`                                                                                                                                                                                                                     |

## Budget d’enregistrement des runners

Le compartiment actuel d’enregistrement des runners GitHub d’OpenClaw indique 10 000 enregistrements de runners auto-hébergés par 5 minutes dans `ghx api rate_limit`. Revérifiez
`actions_runner_registration` avant chaque passe de réglage, car GitHub peut modifier
ce compartiment. La limite est partagée par tous les enregistrements de runners Blacksmith dans l’organisation
`openclaw`, donc ajouter une autre installation Blacksmith n’ajoute pas
un nouveau compartiment.

Traitez les libellés Blacksmith comme la ressource rare pour le contrôle des rafales. Les tâches qui
ne font que router, notifier, résumer, sélectionner des fragments ou exécuter de courts scans CodeQL doivent
rester sur des runners hébergés par GitHub sauf si elles ont des besoins spécifiques à Blacksmith
mesurés. Toute nouvelle matrice Blacksmith, tout `max-parallel` plus élevé ou tout workflow
à haute fréquence doit indiquer son nombre d’enregistrements au pire cas et maintenir la cible
au niveau de l’organisation sous environ 60 % du compartiment live. Avec le compartiment actuel de 10 000 enregistrements,
cela signifie une cible opérationnelle de 6 000 enregistrements, en laissant de la marge pour
les dépôts concurrents, les nouvelles tentatives et les chevauchements de rafales.

La CI du dépôt canonique conserve Blacksmith comme chemin de runner par défaut pour les exécutions normales de poussées et de pull requests. Les exécutions `workflow_dispatch` et les dépôts non canoniques utilisent des runners hébergés par GitHub, mais les exécutions canoniques normales ne sondent pas actuellement l’état de la file Blacksmith et ne se replient pas automatiquement sur des libellés hébergés par GitHub lorsque Blacksmith est indisponible.

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

Un déclenchement manuel mesure normalement la ref du workflow. Définissez `target_ref` pour mesurer un tag de version ou une autre branche avec l’implémentation actuelle du workflow. Les chemins des rapports publiés et les pointeurs les plus récents sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testée, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de la lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une version épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime construit localement avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-openai-candidate` : un vrai tour d’agent OpenAI `openai/gpt-5.5`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire pour les cas de démarrage par défaut, avec hook et avec 50 Plugins ; RSS d’importation des Plugins intégrés, boucles hello répétées `channel-chat-baseline` avec OpenAI simulé, commandes de démarrage CLI contre le Gateway démarré, et sonde de performances smoke de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la ref testée, le résumé source compare les valeurs RSS et de tas actuelles à cette baseline et marque les fortes augmentations de RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit également `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la ref testée est écrit sous la forme `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de la version

`Full Release Validation` est le workflow manuel chapeau pour « tout exécuter avant la publication ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves Plugins/packages/statiques/Docker réservées aux versions, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de packages inter-OS, le rendu de la carte de score de maturité depuis les preuves du profil QA, la parité QA Lab, Matrix et les lanes Telegram. Les profils stable et complet incluent toujours une couverture exhaustive live/E2E et de soak du chemin de version Docker ; le profil bêta peut l’activer avec `run_release_soak=true`. L’E2E Telegram canonique du package s’exécute dans Package Acceptance, donc un candidat complet ne démarre pas de second poller live. Après publication, passez `release_package_spec` pour réutiliser le package npm livré dans les vérifications de version, Package Acceptance, Docker, inter-OS et Telegram sans reconstruire. Utilisez `npm_telegram_package_spec` uniquement pour une relance Telegram ciblée sur un package publié. La lane de package live du Plugin Codex utilise par défaut le même état sélectionné : le `release_package_spec=openclaw@<tag>` publié dérive `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact empaquettent `extensions/codex` depuis la ref sélectionnée. Définissez explicitement `codex_plugin_spec` pour des sources de Plugin personnalisées telles que les specs `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de version](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des jobs de workflow, les différences entre profils, les artefacts et les
poignées de relance ciblées.

`OpenClaw Release Publish` est le workflow manuel de publication mutateur. Déclenchez-le
depuis `release/YYYY.M.PATCH` ou `main` après l’existence du tag de version et après la
réussite de la prévalidation npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de Plugin publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de version, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré. Une publication stable
requiert aussi un `windows_node_tag` exact ; le workflow vérifie la version source Windows
et compare ses installateurs x64/ARM64 avec l’entrée
`windows_node_installer_digests` approuvée pour le candidat avant tout workflow enfant de publication, puis promeut
et vérifie ces mêmes empreintes d’installateurs épinglées ainsi que l’asset compagnon exact
et le contrat de somme de contrôle avant de publier le brouillon de version GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve par commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de déclenchement des workflows GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque
`headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire lorsque l’exécution se termine. Le vérificateur chapeau échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de version. Les
workflows de version manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la matrice consultative étendue fournisseur/média. Les vérifications de version
stable et complètes exécutent toujours le soak exhaustif live/E2E et du chemin de version Docker ;
le profil bêta peut l’activer avec `run_release_soak=true`.

- `minimum` conserve les lanes OpenAI/core critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la matrice consultative étendue fournisseur/média.

Le workflow chapeau enregistre les ids des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement le job vérificateur parent pour actualiser le résultat chapeau et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de version, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de préversion des Plugins, `release-checks` pour chaque enfant de version, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow chapeau. Cela limite la relance d’une boîte de version échouée après un correctif ciblé. Pour une seule lane inter-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes inter-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent des temps par phase. Les lanes QA release-check sont consultatives, sauf la porte standard de couverture des outils runtime, qui bloque lorsque les outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé de niveau standard.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre une seule fois la ref sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact aux vérifications inter-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de version lorsque la couverture de soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de version et évite de réempaqueter le même candidat dans plusieurs jobs enfants. Pour la lane live du Plugin npm Codex, les vérifications de version transmettent soit une spec de Plugin publié correspondante dérivée de `release_package_spec`, soit le `codex_plugin_spec` fourni par l’opérateur, soit laissent l’entrée vide afin que le script Docker empaquette le Plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` en doublon pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow chapeau. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin qu’une validation main plus récente
ne reste pas derrière une exécution stale de deux heures de release-check. Les validations de branche/tag
de version et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de version conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’un seul job sériel :

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
- shards média audio/vidéo séparés et shards musicaux filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments de modèles/moteurs serveur en direct adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le flux de travail de publication en direct construit et pousse cette image une seule fois, puis les fragments de modèle Docker en direct, de Gateway partitionné par fournisseur, de moteur serveur CLI, de liaison ACP et de harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker du Gateway portent des plafonds `timeout` explicites au niveau des scripts, inférieurs au délai d’expiration de la tâche du flux de travail, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de vérification de publication. Si ces fragments reconstruisent indépendamment la cible Docker complète des sources, l’exécution de publication est mal configurée et gaspillera du temps réel en constructions d’images dupliquées.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est : « ce package OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide une seule archive tarball au moyen du même harnais Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis affiche la source, la référence du flux de travail, la référence du package, la version, le SHA-256 et le profil dans le résumé de l’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le flux de travail réutilisable télécharge cet artefact, valide l’inventaire de l’archive tarball, prépare les images Docker à empreinte de package lorsque nécessaire, puis exécute les voies Docker sélectionnées contre ce package au lieu de empaqueter l’extraction du flux de travail. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le flux de travail réutilisable prépare le package et les images partagées une seule fois, puis répartit ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du package en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le flux de travail si la résolution du package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` n’accepte que `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation de prépublication/stable publiée.
- `source=ref` empaquette une branche, une étiquette ou un SHA de commit complet `package_ref` fiable. Le résolveur récupère les branches/étiquettes OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou une étiquette de publication, installe les dépendances dans un arbre de travail détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge une archive `.tgz` HTTPS publique ; `package_sha256` est obligatoire. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte privés/internes/à usage spécial ou les IP résolues correspondantes, ainsi que les redirections en dehors de la même politique de sûreté publique.
- `source=trusted-url` télécharge une archive `.tgz` HTTPS depuis une politique de source fiable nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont obligatoires. Utilisez ceci uniquement pour des miroirs d’entreprise détenus par les mainteneurs ou des dépôts de packages privés qui nécessitent des hôtes, ports, préfixes de chemin, hôtes de redirection ou une résolution de réseau privé configurés. Si la politique déclare une authentification par jeton bearer, le flux de travail utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés dans l’URL restent rejetés.
- `source=artifact` télécharge une archive `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code fiable du flux de travail/harnais qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits sources fiables sans exécuter l’ancienne logique de flux de travail.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — morceaux complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; obligatoire lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de Plugins hors ligne afin que la validation du package publié ne dépende pas de la disponibilité en direct de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les déclenchements autonomes.

Pour la politique dédiée de test des mises à jour et des Plugins, y compris les commandes locales,
les voies Docker, les entrées d’acceptation du package, les valeurs par défaut de publication et le triage des échecs,
voir [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de publication appellent l’acceptation du package avec `source=artifact`, l’artefact de package de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la migration du package, la mise à jour, l’installation de Skills ClawHub en direct, le nettoyage des dépendances de Plugins périmées, la réparation d’installation de Plugins configurés, les Plugins hors ligne, la mise à jour de Plugins et la preuve Telegram sur la même archive tarball de package résolue. Définissez `release_package_spec` sur la validation complète de publication ou les vérifications de publication OpenClaw après la publication d’une bêta pour exécuter la même matrice contre le package npm livré sans reconstruction ; définissez `package_acceptance_package_spec` uniquement lorsque l’acceptation du package nécessite un package différent du reste de la validation de publication. Les vérifications de publication multi-OS couvrent toujours l’intégration, l’installeur et le comportement de plateforme propres à chaque OS ; la validation produit du package/de la mise à jour devrait commencer par l’acceptation du package. La voie Docker `published-upgrade-survivor` valide une ligne de base de package publié par exécution dans le chemin de publication bloquant. Dans l’acceptation du package, l’archive tarball `package-under-test` résolue est toujours la candidate et `published_upgrade_survivor_baseline` sélectionne la ligne de base publiée de repli, par défaut `openclaw@latest` ; les commandes de réexécution des voies échouées préservent cette ligne de base. La validation complète de publication avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin de l’étendre aux quatre dernières publications npm stables, plus des publications de frontière de compatibilité Plugin épinglées et des fixtures en forme de problèmes pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances héritées de Plugins périmées. Les sélections de survivants de mise à niveau publiée à plusieurs lignes de base sont partitionnées par ligne de base dans des tâches d’exécuteur Docker ciblées séparées. Le flux de travail séparé `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI de publication complète. Les exécutions agrégées locales peuvent passer des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, garder une voie unique avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la ligne de base avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, puis sonde `/healthz`, `/readyz` et l’état RPC après le démarrage du Gateway. Les voies fraîches Windows empaquetées et installateur vérifient aussi qu’un package installé peut importer une substitution de contrôle de navigateur depuis un chemin Windows absolu brut. Le test de fumée de tour d’agent OpenAI multi-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation du package a des fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce drapeau ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes depuis la fixture git factice dérivée de l’archive tarball et peut consigner l’absence de `update.channel` persistant ;
- les tests de fumée de Plugins peuvent lire d’anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation de place de marché ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut aussi avertir pour les fichiers d’horodatage de métadonnées de construction locale qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lorsque vous déboguez une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les minutages de phases et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer la validation complète de publication.

## Test de fumée d’installation

Le flux de travail séparé `Install Smoke` réutilise le même script de périmètre via sa propre tâche `preflight`. Il divise la couverture de test de fumée en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent aux surfaces Docker/package, aux changements de package/manifeste de plugin groupé, ou aux surfaces principales plugin/canal/gateway/Plugin SDK exercées par les jobs Docker smoke. Les changements de plugin groupé limités au code source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression des agents dans l’espace de travail partagé, exécute l’e2e du réseau Gateway de conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné des plugins groupés sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installeur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement aux surfaces installeur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR du Dockerfile racine pour un SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installeur/update et l’E2E Docker rapide des plugins groupés en jobs séparés, afin que le travail sur l’installeur n’attende pas derrière les smokes de l’image racine.

Les poussées vers `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de périmètre modifié demanderait une couverture complète sur une poussée, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent du fournisseur d’images avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon le planning nocturne et depuis le workflow des vérifications de release, et les déclenchements manuels `Install Smoke` peuvent l’activer, mais les pull requests et les poussées vers `main` ne le font pas. La CI normale des PR exécute toujours la voie rapide de régression du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installeur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, emballe OpenClaw une seule fois sous forme d’archive npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installeur/update/dépendance de plugin ;
- une image fonctionnelle qui installe la même archive dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. L’ordonnanceur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Valeur par défaut | Objectif                                                                                      |
| -------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de créneaux du pool principal pour les voies normales.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de créneaux du pool final sensible aux fournisseurs.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond de voies live simultanées afin que les fournisseurs ne limitent pas le débit.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                 | Plafond de voies d’installation npm simultanées.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond de voies multiservices simultanées.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de voies pour éviter les tempêtes de création du daemon Docker ; définir sur `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai de secours par voie (120 minutes) ; certaines voies live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset             | `1` affiche le plan de l’ordonnanceur sans exécuter les voies.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset             | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage pour que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut quand même démarrer depuis un pool vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. Le précontrôle global local vérifie Docker, supprime les conteneurs OpenClaw E2E obsolètes, émet l’état des voies actives, persiste les durées des voies pour l’ordre du plus long au plus court, et cesse par défaut de planifier de nouvelles voies groupées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels package, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il emballe OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution en cours, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire de l’archive ; construit et pousse des images Docker E2E GHCR minimales/fonctionnelles taguées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les tirages d’images Docker sont réessayés avec un délai borné de 180 secondes par tentative, afin qu’un flux registry/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique de la CI.

### Segments du chemin de release

La couverture Docker de release exécute des jobs plus petits par segments avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live du package du plugin Codex, qui installe le package OpenClaw candidat, installe le plugin Codex depuis `codex_plugin_spec` ou une archive de la même référence avec approbation explicite de l’installation de la CLI Codex, exécute le précontrôle de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw dans la même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de relance manuelle pour les deux voies d’installeur fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et ne conserve un segment autonome `openwebui` que pour les déclenchements limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas de défaillances réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phase, le JSON du plan de l’ordonnanceur, les tableaux de voies lentes et les commandes de relance par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des jobs de segment, ce qui limite le débogage d’une voie échouée à un job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit l’image de test live localement pour cette relance. Les commandes de relance GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # télécharger les artefacts Docker et afficher les commandes de relance ciblées combinées/par voie
pnpm test:docker:timings <summary>   # résumés des voies lentes et du chemin critique des phases
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Prérelease de plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les poussées vers `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests de plugins groupés entre huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de prérelease Docker réservé aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur servent d’entrée de triage et ne modifient pas le gate bloquant Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à périmètre intelligent. La parité agentique est imbriquée sous les harnais QA larges et de release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur déclenchement manuel ; il déploie en parallèle la voie de parité mock, la voie Matrix live, ainsi que les voies Telegram et Discord live. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des plugins fournisseur. Le Gateway de transport live désactive la recherche mémoire car la parité QA couvre séparément le comportement mémoire ; la connectivité des fournisseurs est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un déclenchement manuel `matrix_profile=all` segmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et de référence comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves de CI/vérifications à périmètre ciblé au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité de premier passage étroit, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillons analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript à plus haut risque, avec des requêtes de sécurité à confiance élevée filtrées sur `security-severity` élevé/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou les chemins d’exécution de plugins groupés propriétaires de processus, et exécute la même matrice de sécurité à confiance élevée que le workflow planifié. Android et macOS CodeQL restent en dehors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                        | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, Cron et référence de base du Gateway                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus runtime du plugin de canal, Gateway, SDK Plugin, secrets et points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de politique SSRF du cœur, analyse d’IP, garde réseau, récupération web et SSRF du SDK Plugin                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante et garde-fous d’exécution d’outils d’agent                       |
| `/codeql-security-high/process-exec-boundary`     | Shell local, helpers de lancement de processus, runtimes de plugins groupés propriétaires de sous-processus et colle de scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de source et surfaces de confiance du contrat de paquet du SDK Plugin |

### Shards de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par les vérifications de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories Critical Quality

`CodeQL Critical Quality` est le shard non sécuritaire correspondant. Il exécute uniquement les requêtes qualité JavaScript/TypeScript de sévérité erreur et non sécuritaires sur des surfaces étroites à forte valeur, sur des runners Linux hébergés par GitHub, afin que les analyses qualité ne consomment pas le budget d’enregistrement des runners Blacksmith. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillons exécutent seulement les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements de code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, de schéma/migration/E/S de configuration, d’authentification/secrets/sandbox/sécurité, de canal cœur et runtime de plugin de canal groupé, de protocole Gateway/méthode serveur, de runtime mémoire/colle SDK, MCP/processus/livraison sortante, runtime fournisseur/catalogue de modèles, diagnostics de session/files de livraison, chargeur de Plugin, SDK Plugin/contrat de paquet, ou runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

Le déclenchement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                              | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, le sandbox, Cron et le Gateway                                                                |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal cœur et du plugin de canal groupé                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponse automatique, et contrats de runtime du plan de contrôle ACP              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, helpers de supervision de processus et contrats de livraison sortante                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades runtime mémoire, alias mémoire du SDK Plugin, colle d’activation du runtime mémoire et commandes doctor de mémoire                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, helpers de liaison/livraison de session sortante, surfaces d’événements diagnostiques/paquets de journaux et contrats CLI de doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK Plugin, helpers de payload/découpage/runtime de réponse, options de réponse de canal, files de livraison et helpers de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur et registres web/recherche/récupération/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Récupération/recherche web du cœur, E/S média, compréhension média, génération d’images et contrats de runtime de génération média                                |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de chargeur, registre, surface publique et point d’entrée du SDK Plugin                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du SDK Plugin côté paquet publié et helpers de contrat de paquet de plugin                                                                                 |

La qualité reste séparée de la sécurité afin que les constats qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL à Swift, Python et aux plugins groupés doit être réajoutée comme travail de suivi cadré ou shardé uniquement après que les profils étroits disposent d’un runtime et d’un signal stables.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour maintenir les documents existants alignés avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, et le déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits entre le SHA source du précédent Docs Agent non ignoré et le `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis la dernière passe de documentation.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, mais il s’interrompt si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé de suite complète, autorise Codex à effectuer seulement de petites corrections de performance des tests qui préservent la couverture au lieu de larges refactorisations, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la référence. Le rapport groupé enregistre le temps réel par configuration et le RSS maximal sur Linux et macOS, de sorte que la comparaison avant/après expose les deltas de mémoire des tests à côté des deltas de durée. Si la référence comporte des tests en échec, Codex peut corriger uniquement les échecs évidents et le rapport de suite complète après agent doit réussir avant qu’un commit soit créé. Lorsque `main` avance avant que le push du bot soit intégré, la voie rebase le patch validé, relance `pnpm check:changed` et réessaie le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent de documentation.

### PR dupliquées après merge

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut un dry-run et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est mergée et que chaque doublon a soit un ticket référencé partagé, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gardes de vérification locales et routage des changements

La logique locale des voies modifiées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette garde de vérification locale est plus stricte sur les frontières d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck de production cœur et de tests cœur, plus le lint/les gardes cœur ;
- les changements uniquement de tests du cœur exécutent seulement le typecheck des tests cœur plus le lint cœur ;
- les changements de production d’extension exécutent le typecheck de production extension et de tests extension, plus le lint extension ;
- les changements uniquement de tests d’extension exécutent le typecheck des tests extension plus le lint extension ;
- les changements publics du SDK Plugin ou du contrat de plugin s’étendent au typecheck d’extension, car les extensions dépendent de ces contrats cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les augmentations de version portant uniquement sur les métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus basculent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source préfèrent des mappings explicites, puis les tests voisins et les dépendants du graphe d’import. La configuration de livraison de salle de groupe partagée fait partie des mappings explicites : les changements de la configuration de réponse visible par le groupe, du mode de livraison des réponses source ou du prompt système de l’outil de messages passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack, de sorte qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche suffisamment largement le harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de boîte distante appartenant au dépôt pour les preuves mainteneur sous Linux. Utilisez-le
depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle de modification locale, lorsque la
parité avec la CI compte, ou lorsque la preuve nécessite des secrets, Docker, des lanes de package,
des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est
`blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes Blacksmith,
les problèmes de quota ou les tests explicites sur capacité détenue.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réservent, synchronisent, exécutent, rapportent et nettoient
des Testboxes ponctuelles. La vérification de cohérence de synchronisation intégrée échoue rapidement lorsque des fichiers
racine requis tels que `pnpm-lock.yaml` disparaissent ou lorsque `git status --short`
affiche au moins 200 suppressions suivies. Pour les PRs avec de grandes suppressions intentionnelles, définissez
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox met également fin à une invocation locale de la CLI Blacksmith qui reste dans la
phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur plus grande
en millisecondes pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut de cloud détenu. Dans les worktrees Codex ou les checkouts liés/clairsemés, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou plus récent afin que le wrapper obtienne le comportement actuel de synchronisation, de file d’attente et de nettoyage de Testbox. Lorsque vous utilisez le checkout frère, reconstruisez le binaire local ignoré avant tout travail de mesure ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Barrière des changements :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Pour les exécutions
Blacksmith Testbox déléguées, le code de sortie du wrapper Crabbox et le résumé JSON sont le
résultat de la commande. L’exécution GitHub Actions liée possède l’hydratation et le maintien en vie ; elle
peut se terminer en `cancelled` lorsque la Testbox est arrêtée de l’extérieur après que la commande SSH
a déjà retourné. Traitez cela comme un artefact de nettoyage/statut sauf si
le `exitCode` du wrapper est non nul ou si la sortie de commande montre un test échoué.
Les exécutions Crabbox ponctuelles adossées à Blacksmith doivent arrêter la Testbox automatiquement ;
si une exécution est interrompue ou si le nettoyage est incertain, inspectez les boîtes actives et n’arrêtez que
les boîtes que vous avez créées :

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

Si Crabbox est la couche cassée mais que Blacksmith lui-même fonctionne, utilisez directement
Blacksmith uniquement pour des diagnostics tels que `list`, `status` et le nettoyage. Corrigez le
chemin Crabbox avant de traiter une exécution directe Blacksmith comme une preuve mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux
préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes,
traitez cela comme une pression liée au fournisseur Blacksmith, à la file d’attente, à la facturation ou aux limites d’organisation. Arrêtez les
ids en file d’attente que vous avez créés, évitez de démarrer davantage de Testboxes et déplacez la preuve vers le
chemin de capacité Crabbox détenue ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith,
la facturation et les limites d’organisation.

N’escaladez vers la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite réellement un CPU de classe 48xlarge. Une requête `beast` commence à 192 vCPU et constitue le moyen le plus simple de déclencher un quota régional EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` appartenant au dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true` afin que les baux AWS négociés affichent la région/le marché sélectionné, la pression de quota, le repli Spot et les avertissements de classe à forte pression. Utilisez `fast` pour des vérifications larges plus lourdes, `large` seulement après que standard/fast ne suffisent pas, et `beast` uniquement pour des lanes exceptionnellement limitées par le CPU comme une suite complète ou des matrices Docker tous Plugins, une validation explicite de release/bloqueur, ou un profilage de performance à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, des tests ciblés, du travail uniquement documentaire, du lint/typecheck ordinaire, de petits repros E2E, ou le triage d’une panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que les fluctuations du marché Spot ne soient pas mélangées au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les lanes de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/construction qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes de cloud détenu `crabbox run --id <cbx_id>`.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

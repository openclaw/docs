---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou le transfert d’activité GitHub
summary: Graphe des tâches CI, garde-fous de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-28T00:10:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

La CI OpenClaw s’exécute à chaque push vers `main` et à chaque pull request. Les pushs canoniques vers
`main` passent d’abord par une fenêtre d’admission de 90 secondes sur runner hébergé.
Le groupe de concurrence `CI` existant annule cette exécution en attente lorsqu’un commit
plus récent arrive, afin que des fusions séquentielles n’enregistrent pas chacune une matrice
Blacksmith complète. Les pull requests et les déclenchements manuels ignorent l’attente. Le job `preflight`
classe ensuite le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport
ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le
scoping intelligent et déploient tout le graphe pour les release candidates et les validations
larges. Les lanes Android restent à activation explicite via `include_android`. La couverture
des Plugin réservée aux releases vit dans le workflow séparé [`Préversion Plugin`](#plugin-prerelease)
et ne s’exécute que depuis [`Validation complète de release`](#full-release-validation)
ou depuis un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                  | Quand il s’exécute                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Détecter les changements de documentation uniquement, les périmètres modifiés, les extensions modifiées et construire le manifeste CI | Toujours sur les pushs et PR non brouillons         |
| `runner-admission`                 | Anti-rebond hébergé de 90 secondes pour les pushs canoniques vers `main` avant l’enregistrement du travail Blacksmith | Chaque exécution CI ; pause uniquement sur les pushs canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor` et audit du lockfile de production   | Toujours sur les pushs et PR non brouillons         |
| `check-dependencies`               | Passe Knip de production limitée aux dépendances, plus garde de liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node                    |
| `build-artifacts`                  | Construire `dist/`, Control UI, contrôles smoke de la CLI construite, contrôles d’artefacts construits intégrés et artefacts réutilisables | Changements pertinents pour Node                    |
| `checks-fast-core`                 | Lanes Linux rapides de correction, comme les contrôles bundled, protocol, QA Smoke CI et routage CI       | Changements pertinents pour Node                    |
| `checks-fast-contracts-plugins-*`  | Deux contrôles shardés de contrat Plugin                                                                  | Changements pertinents pour Node                    |
| `checks-fast-contracts-channels-*` | Deux contrôles shardés de contrat channel                                                                 | Changements pertinents pour Node                    |
| `checks-node-core-*`               | Shards de tests Node du cœur, hors lanes channel, bundled, contrat et extension                           | Changements pertinents pour Node                    |
| `check-*`                          | Équivalent shardé de la porte locale principale : types de production, lint, gardes, types de test et smoke strict | Changements pertinents pour Node                    |
| `check-additional-*`               | Architecture, dérive de boundary/prompt shardée, gardes d’extension, boundary de package et topologie runtime | Changements pertinents pour Node                    |
| `checks-node-compat-node22`        | Build de compatibilité Node 22 et lane smoke                                                              | Déclenchement CI manuel pour les releases           |
| `check-docs`                       | Formatage, lint et contrôles de liens cassés de la documentation                                          | Documentation modifiée                              |
| `skills-python`                    | Ruff + pytest pour les Skills adossées à Python                                                           | Changements pertinents pour les Skills Python       |
| `checks-windows`                   | Tests de processus/chemins spécifiques à Windows, plus régressions partagées de spécificateurs d’import runtime | Changements pertinents pour Windows                 |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements pertinents pour macOS                   |
| `macos-swift`                      | Lint, build et tests Swift pour l’application macOS                                                       | Changements pertinents pour macOS                   |
| `ios-build`                        | Génération du projet Xcode, plus build simulateur de l’application iOS                                    | Application iOS, kit d’application partagé ou changements Swabble |
| `android`                          | Tests unitaires Android pour les deux variantes, plus un build APK de debug                               | Changements pertinents pour Android                 |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après une activité fiable                                  | Succès de la CI principale ou déclenchement manuel  |
| `openclaw-performance`             | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.5 live | Planification et déclenchement manuel               |

## Ordre fail-fast

1. `runner-admission` attend uniquement pour les pushs canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
4. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
5. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs intégrés channel, core-support-boundary et gateway-watch au lieu de mettre en file de petits jobs de vérification. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps total, le temps de file d’attente, les jobs les plus lents, les échecs et la barrière de déploiement `pnpm-store-warmup` depuis GitHub Actions. La CI téléverse aussi le même résumé d’exécution comme artefact `ci-timings-summary`. Pour le timing de build, consultez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artefact `startup-memory`.

Pour les exécutions de pull request, le job terminal de résumé de timing exécute l’assistant depuis la révision de base fiable avant de transmettre `GH_TOKEN` à `gh run view`. Cela garde la requête avec jeton hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte et preuves de PR

Les PRs de contributeurs externes exécutent une porte de contexte et de preuve de PR depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow récupère le commit de base fiable
et évalue uniquement le corps de la PR ; il n’exécute pas de code depuis la branche
du contributeur.

La porte s’applique aux auteurs de PR qui ne sont pas propriétaires, membres,
collaborateurs ou bots du dépôt. Elle réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. La preuve peut être un test ciblé,
un résultat CI, une capture d’écran, un enregistrement, une sortie de terminal, une observation live,
un journal expurgé ou un lien d’artefact. Le corps fournit l’intention et une validation utile ;
les reviewers inspectent le code, les tests et la CI pour évaluer la correction.

Lorsque le contrôle échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Périmètre et routage

La logique de périmètre vit dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection de périmètre modifié et fait agir le manifeste preflight comme si chaque zone couverte avait changé.

- **Modifications du workflow CI** valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateformes.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, le garde d’interpolation des actions composites et le garde des marqueurs de conflit. Le job `security-fast` limité à la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les constats de sécurité de workflow échouent tôt dans le graphe CI principal.
- **Documentation sur les pushs vers `main`** est vérifiée par le workflow autonome `Docs` avec le même miroir de documentation ClawHub utilisé par la CI, afin que les pushs mixtes code+documentation ne mettent pas aussi en file le shard CI `check-docs`. Les pull requests et la CI manuelle exécutent toujours `check-docs` depuis la CI lorsque la documentation a changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, ce qui couvre à la fois la lane de fixture déterministe `TuiBackend` et le smoke plus lent `tui --local` qui mocke uniquement l’endpoint de modèle externe.
- **Modifications limitées au routage CI, modifications choisies de fixtures de tests cœur peu coûteuses et modifications étroites d’assistants/ routage de tests de contrat Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats channel, les shards complets du cœur, les shards de Plugin bundled et les matrices de gardes additionnelles lorsque le changement se limite aux surfaces de routage ou d’assistants que la tâche rapide exerce directement.
- **Contrôles Node Windows** sont limités aux wrappers de processus/chemins spécifiques à Windows, aux assistants de runners npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport de source, Plugin, install-smoke et uniquement de tests restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans réserver trop de runners : les contrats de Plugin et les contrats de canal s’exécutent chacun sous forme de deux shards pondérés adossés à Blacksmith avec le fallback standard de runner GitHub, les voies rapides/de support des unités core s’exécutent séparément, l’infrastructure d’exécution core est répartie entre état, processus/configuration, partagé et trois shards de domaine Cron, l’auto-réponse s’exécute sous forme de workers équilibrés (avec le sous-arbre de réponse divisé en shards agent-runner, dispatch et commandes/routage d’état), et les configurations agentiques de Gateway/serveur sont réparties entre les voies chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale regroupe ensuite uniquement les shards isolés d’infrastructure à motifs d’inclusion dans des bundles déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites command/Cron non isolées, agents-core avec état, ou Gateway/serveur ; les suites fixes lourdes restent sur 8 vCPU tandis que les voies regroupées et moins lourdes utilisent 4 vCPU. Les pull requests sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés à l’intérieur du plan Linux Node actuel de 34 tâches, de sorte qu’une seule PR n’enregistre pas toute la matrice Node de plus de 70 tâches. Les poussées sur `main`, les dispatchs manuels et les gates de release conservent la matrice complète. Les tests larges de navigateur, QA, média et Plugin divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé de Plugin. Les shards à motifs d’inclusion enregistrent les entrées de timing avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional-*` garde ensemble le travail de compilation/canary aux frontières de packages et sépare l’architecture de topologie runtime de la couverture de surveillance du Gateway ; la liste des guards de frontière est répartie en un shard riche en prompts et un shard combiné pour les bandes de guards restantes, chacun exécutant des guards indépendants sélectionnés en parallèle et affichant les timings par vérification. La coûteuse vérification de dérive des snapshots de prompts du happy path Codex s’exécute comme sa propre tâche supplémentaire pour la CI manuelle et uniquement pour les changements affectant les prompts, de sorte que les changements Node normaux sans rapport n’attendent pas derrière la génération à froid de snapshots de prompts et que les shards de frontière restent équilibrés tout en maintenant la dérive de prompts rattachée à la PR qui l’a causée ; le même indicateur saute la génération Vitest de snapshots de prompts à l’intérieur du shard de frontière support-core avec artefacts construits. La surveillance Gateway, les tests de canaux et le shard de frontière support-core s’exécutent en parallèle à l’intérieur de `build-artifacts` une fois que `dist/` et `dist-runtime/` sont déjà construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 24 tâches de test Node
simultanées et 12 pour les voies rapides/check plus petites ; Windows et Android
restent à deux parce que ces pools de runners sont plus étroits.

Le plan compact de PR émet 18 tâches Node pour la suite actuelle : les groupes
de configuration entière sont traités par lots dans des sous-processus isolés
avec un timeout de lot de 120 minutes, tandis que les groupes à motifs d’inclusion
partagent le même budget borné de tâches.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La flavor tierce n’a pas de source set ni de manifeste séparés ; sa voie de tests unitaires compile toujours la flavor avec les flags BuildConfig SMS/journal d’appels, tout en évitant une tâche de packaging d’APK debug en double à chaque push concernant Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers inutilisés en production de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le guard de fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de Plugin dynamique, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout ni n’exécute de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads compacts `repository_dispatch` à `openclaw/clawsweeper`.

Le workflow comporte quatre voies :

- `clawsweeper_item` pour les demandes exactes de revue d’issue et de pull request ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issue ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les poussées vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La voie `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé sur le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne devrait publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, modifications, agitation de bots, bruit de webhooks dupliqués et trafic normal de revues devraient donner `NO_REPLY`.

Traitez les titres GitHub, commentaires, corps, textes de revue, noms de branches et messages de commit comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatchs manuels

Les dispatchs CI manuels exécutent le même graphe de tâches que la CI normale, mais activent de force chaque voie ciblée non Android : shards Linux Node, shards de Plugins groupés, shards de contrats Plugin et canal, compatibilité Node 22, `check-*`, `check-additional-*`, smoke checks d’artefacts construits, checks de docs, Skills Python, Windows, macOS, build iOS et i18n Control UI. Les dispatchs CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’umbrella de release complète active Android en passant `include_android=true`. Les checks statiques de prérelease de Plugin, le shard réservé à la release `agentic-plugins`, le balayage complet des lots d’extensions et les voies Docker de prérelease de Plugin sont exclus de la CI. La suite Docker de prérelease s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec le gate de validation de release activé.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution de push ou de PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe contre une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow de la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Tâches                                                                                                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI manuel et fallbacks de dépôt non canonique, analyses qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs hors CI et préflight install-smoke afin que la matrice Blacksmith puisse entrer en file plus tôt                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards d’extensions moins lourds, `checks-fast-core`, shards de contrats Plugin/canal, la plupart des shards Linux Node groupés/moins lourds, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` sélectionnés et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, shards `check-additional-*` lourds en frontières/extensions et `android`                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file 32 vCPU coûtait plus qu’il n’économisait)                                                                                 |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks retombent sur `macos-15`                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks retombent sur `macos-26`                                                                                                                                                                                           |

## Budget d’enregistrement des runners

Le bucket actuel d’enregistrement des runners GitHub d’OpenClaw autorise 3 000
enregistrements de runners auto-hébergés par tranche de 5 minutes. La limite est
partagée par tous les enregistrements de runners Blacksmith dans l’organisation
`openclaw`, donc ajouter une autre installation Blacksmith n’ajoute pas de
nouveau bucket.

Traitez les labels Blacksmith comme la ressource rare pour le contrôle des rafales. Les tâches qui ne font que router, notifier, résumer, sélectionner des shards ou exécuter de courtes analyses CodeQL devraient rester sur des runners hébergés par GitHub, sauf si elles ont des besoins spécifiques à Blacksmith mesurés. Toute nouvelle matrice Blacksmith, tout `max-parallel` plus grand ou tout workflow à haute fréquence doit montrer son nombre d’enregistrements dans le pire cas et maintenir la cible au niveau de l’organisation sous 2 000 enregistrements par tranche de 5 minutes, en laissant une marge pour les dépôts concurrents et les tâches relancées.

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut pour les exécutions normales de push et de pull request. Les exécutions `workflow_dispatch` et les dépôts non canoniques utilisent des runners hébergés par GitHub, mais les exécutions canoniques normales ne sondent actuellement pas l’état de la file Blacksmith et ne retombent pas automatiquement sur les labels hébergés par GitHub lorsque Blacksmith est indisponible.

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

`OpenClaw Performance` est le workflow de performances du produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le déclenchement manuel mesure normalement la référence du workflow. Définissez `target_ref` pour mesurer une étiquette de publication ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` enregistre la référence/SHA testée, la référence/SHA du workflow, la référence Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une publication épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime construit localement avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-openai-candidate` : un vrai tour d’agent OpenAI `openai/gpt-5.5`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire dans les cas de démarrage par défaut, hook et avec 50 plugins ; RSS d’import des plugins groupés, boucles hello répétées `channel-chat-baseline` avec faux OpenAI, commandes de démarrage CLI contre le Gateway démarré, et sonde de performance smoke de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la référence testée, le résumé source compare les valeurs RSS et de tas actuelles à cette référence de base et marque les fortes augmentations RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le paquet de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow valide aussi `report.json`, `report.md`, les paquets, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la référence testée est écrit sous forme de `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de publication

`Full Release Validation` est le workflow manuel global pour « tout exécuter avant la publication ». Il accepte une branche, une étiquette ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves plugin/package/statique/Docker propres aux publications, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package multi-OS, le rendu de la carte de maturité à partir des preuves du profil QA, la parité QA Lab, Matrix et les lanes Telegram. Les profils stable et full incluent toujours une couverture exhaustive live/E2E et de soak Docker du chemin de publication ; le profil bêta peut l’activer avec `run_release_soak=true`. L’E2E Telegram canonique du package s’exécute dans Package Acceptance, donc un candidat complet ne démarre pas de poller live dupliqué. Après publication, passez `release_package_spec` pour réutiliser le package npm livré dans les release checks, Package Acceptance, Docker, multi-OS et Telegram sans reconstruction. Utilisez `npm_telegram_package_spec` uniquement pour une réexécution Telegram ciblée sur un package publié. La lane package live du plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié dérive `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact empaquettent `extensions/codex` depuis la référence sélectionnée. Définissez explicitement `codex_plugin_spec` pour des sources de plugin personnalisées telles que les spécifications `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des jobs de workflow, les différences de profils, les artefacts et les
identifiants de réexécution ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication qui modifie l’état. Déclenchez-le
depuis `release/YYYY.M.PATCH` ou `main` après l’existence de l’étiquette de publication et après la
réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de publication, puis déclenche seulement ensuite
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré. La publication stable exige aussi
un `windows_node_tag` exact ; le workflow vérifie la publication source Windows
et compare ses installateurs x64/ARM64 avec l’entrée candidate approuvée
`windows_node_installer_digests` avant tout workflow enfant de publication, puis promeut
et vérifie ces mêmes condensats d’installateurs épinglés ainsi que le contrat exact
d’artefact compagnon et de somme de contrôle avant de publier le brouillon de publication GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve sur commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de déclenchement de workflow GitHub doivent être des branches ou des étiquettes, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette référence épinglée, vérifie que le
`headSha` de chaque workflow enfant correspond à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur global échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/provider transmise aux release checks. Les
workflows de publication manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la large matrice consultative de providers/médias. Les checks de publication stable et full
exécutent toujours le soak exhaustif live/E2E et Docker du chemin de publication ;
le profil bêta peut l’activer avec `run_release_soak=true`.

- `minimum` conserve les lanes OpenAI/core critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de providers/backends.
- `full` exécute la large matrice consultative de providers/médias.

Le workflow global enregistre les identifiants des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est réexécuté et passe au vert, réexécutez uniquement le job vérificateur parent pour actualiser le résultat global et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prépublication des plugins, `release-checks` pour chaque enfant de publication, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow global. Cela garde bornée la réexécution d’une boîte de publication échouée après un correctif ciblé. Pour une lane multi-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes multi-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent les temps par phase. Les lanes QA de release-check sont consultatives, sauf la porte standard de couverture des outils runtime, qui bloque lorsque les outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé de niveau standard.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une seule fois la référence sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact aux checks multi-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de publication lorsque la couverture soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de publication et évite de réempaqueter le même candidat dans plusieurs jobs enfants. Pour la lane live du plugin npm Codex, les release checks transmettent soit une spécification de plugin publiée correspondante dérivée de `release_package_spec`, soit le `codex_plugin_spec` fourni par l’opérateur, soit laissent l’entrée vide afin que le script Docker empaquette le plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent le workflow global plus ancien. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin que la validation main plus récente
ne reste pas derrière une exécution obsolète de release-check de deux heures. La validation
de branche/étiquette de publication et les groupes de réexécution ciblée gardent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’un job série unique :

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
- shards média audio/vidéo séparés et shards musicaux filtrés par provider

Cela conserve la même couverture de fichiers tout en facilitant la réexécution et le diagnostic des échecs lents de providers live. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les réexécutions manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient uniquement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments de modèles/backends live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de version live construit et publie cette image une seule fois, puis les fragments du modèle live Docker, du Gateway segmenté par fournisseur, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker du Gateway portent des plafonds `timeout` explicites au niveau des scripts, inférieurs au délai d’expiration du job du workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de version. Si ces fragments reconstruisent indépendamment la cible Docker complète des sources, l’exécution de version est mal configurée et gaspillera du temps réel dans des constructions d’images en double.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est : « ce package OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence des sources, tandis que l’acceptation du package valide une seule archive tar via le même harnais E2E Docker que les utilisateurs exercent après une installation ou une mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence du workflow, la référence du package, la version, le SHA-256 et le profil dans le résumé de l’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive tar, prépare les images Docker à condensat de package si nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis répartit ces voies en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle facultativement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du package en a résolu un ; un dispatch Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` n’accepte que `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw telle que `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation d’une préversion ou d’une version stable publiée.
- `source=ref` empaquette une branche, une étiquette ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/étiquettes OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique des branches du dépôt ou depuis une étiquette de version, installe les dépendances dans un worktree détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS public ; `package_sha256` est requis. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou IP résolues privés/internes/à usage spécial, ainsi que les redirections hors de la même politique de sécurité publique.
- `source=trusted-url` télécharge un `.tgz` HTTPS depuis une politique de source de confiance nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont requis. Utilisez ceci uniquement pour les miroirs d’entreprise détenus par les mainteneurs ou les dépôts de packages privés qui nécessitent des hôtes, ports, préfixes de chemin, hôtes de redirection ou une résolution de réseau privé configurés. Si la politique déclare une authentification bearer, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés dans l’URL sont toujours rejetés.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais doit être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation du package publié ne dépende pas de la disponibilité live de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tandis que le chemin de spécification npm publiée est conservé pour les dispatches autonomes.

Pour la politique dédiée de test des mises à jour et des Plugins, y compris les commandes locales,
les voies Docker, les entrées de l’acceptation du package, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de version appellent l’acceptation du package avec `source=artifact`, l’artefact de package de version préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde la migration du package, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de Plugin obsolètes, la réparation d’installation de Plugin configuré, le Plugin hors ligne, la mise à jour de Plugin et la preuve Telegram sur la même archive tar de package résolue. Définissez `release_package_spec` sur Full Release Validation ou OpenClaw Release Checks après la publication d’une bêta pour exécuter la même matrice contre le package npm livré sans reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque l’acceptation du package nécessite un package différent du reste de la validation de version. Les vérifications de version multi-OS couvrent toujours l’intégration, l’installateur et le comportement de plateforme propres à chaque OS ; la validation produit des packages/mises à jour doit commencer par l’acceptation du package. La voie Docker `published-upgrade-survivor` valide une référence de package publié par exécution dans le chemin bloquant de publication. Dans l’acceptation du package, l’archive tar `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de secours, par défaut `openclaw@latest` ; les commandes de relance des voies échouées préservent cette référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin d’étendre la couverture aux quatre dernières versions npm stables, plus des versions de frontière de compatibilité Plugin épinglées et des fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugin OpenClaw configurées, les chemins de journaux avec tilde et les racines de dépendances de Plugin héritées obsolètes. Les sélections published-upgrade survivor multi-références sont découpées par référence en jobs de runner Docker ciblés séparés. Le workflow séparé `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent transmettre des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette intégrée de commande `openclaw config set`, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que l’état RPC après le démarrage du Gateway. Les voies Windows fraîches avec package et installateur vérifient également qu’un package installé peut importer une surcharge de contrôle du navigateur depuis un chemin Windows absolu brut. Le smoke multi-OS OpenAI agent-turn utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritées

L’acceptation du package dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tar ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes de la fausse fixture git dérivée de l’archive tar et peut journaliser l’absence de `update.channel` persistant ;
- les smokes Plugin peuvent lire d’anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance des enregistrements d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut également avertir pour les fichiers d’empreinte de métadonnées de build locales qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation du package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, sa version et son SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les chronométrages de phase et les commandes de relance. Préférez relancer le profil de package échoué ou les voies Docker exactes plutôt que de relancer toute la validation de version.

## Smoke d’installation

Le workflow séparé `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent aux surfaces Docker/package, aux changements de package/manifeste de Plugin intégré, ou aux surfaces core Plugin/channel/gateway/Plugin SDK exercées par les jobs de smoke Docker. Les changements de Plugin intégré uniquement source, les modifications uniquement de tests et les modifications uniquement de documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image Dockerfile racine une fois, vérifie la CLI, exécute le smoke CLI agents delete shared-workspace, exécute l’e2e container gateway-network, vérifie un argument de build d’extension intégrée, et exécute le profil Docker borné de Plugin intégré sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation du package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call, et les pull requests qui touchent réellement aux surfaces installer/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation du package QR, les smokes Dockerfile/gateway racine, les smokes installer/update et l’E2E Docker rapide de Plugin intégré comme jobs séparés afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushs vers `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent d’installation globale Bun image-provider est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute sur la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels `Install Smoke` peuvent l’activer, mais les pull requests et les pushs vers `main` ne le font pas. La CI normale des PR exécute toujours la voie rapide de régression du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image live-test partagée, empaquette OpenClaw une fois comme tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installer/update/plugin-dependency ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normale.

Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Par défaut | Objectif                                                                                       |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre d’emplacements du pool principal pour les voies normales.                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre d’emplacements du pool de queue sensible aux fournisseurs.                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond des voies live concurrentes pour éviter que les fournisseurs ne limitent le débit.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | Plafond des voies d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond des voies multi-services concurrentes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les tempêtes de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai de secours par voie (120 minutes) ; certaines voies live/tail sélectionnées utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan du planificateur sans exécuter les voies.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage pour que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut quand même démarrer depuis un pool vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. Le préflight global local vérifie Docker, supprime les conteneurs E2E OpenClaw périmés, émet l’état des voies actives, persiste les durées des voies pour l’ordre du plus long au plus court, et arrête par défaut de planifier de nouvelles voies en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, type d’image, image live, voie et identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse les images E2E Docker GHCR bare/functional taguées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont réessayés avec un délai borné de 180 secondes par tentative, afin qu’un flux de registry/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique de CI.

### Segments du chemin de release

La couverture Docker de release exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne récupère que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live du package Plugin Codex, qui installe le package OpenClaw candidat, installe le Plugin Codex depuis `codex_plugin_spec` ou un tarball de la même ref avec approbation explicite d’installation de la CLI Codex, exécute le préflight de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw dans la même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime`, et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de relance manuelle pour les deux voies d’installation fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète release-path le demande, et conserve un segment autonome `openwebui` uniquement pour les déclenchements OpenWebUI seuls. Les voies de mise à jour de channels intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phases, le JSON du plan du planificateur, les tableaux de voies lentes et les commandes de relance par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des jobs de segment, ce qui limite le débogage d’une voie échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image live-test pour cette relance. Les commandes de relance GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker release-path complète.

## Prerelease Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; c’est donc un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushs vers `main` et les déclenchements manuels CI autonomes gardent cette suite désactivée. Il équilibre les tests de Plugins intégrés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration Plugin à la fois, avec un worker Vitest par groupe et un heap Node plus grand afin que les lots de Plugins riches en imports ne créent pas de jobs CI supplémentaires. Le chemin prerelease Docker réservé aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes. Le workflow téléverse également un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur sont une entrée de triage et ne modifient pas le gate bloquant Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnais larges QA et release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il répartit la voie de parité mock, la voie Matrix live, ainsi que les voies Telegram et Discord live en jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des leases Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de channel soit isolé de la latence des modèles live et du démarrage normal des provider-plugins. Le Gateway de transport live désactive la recherche en mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèles live, fournisseurs natifs et fournisseurs Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un déclenchement manuel `matrix_profile=all` répartit toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et baseline comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/check à portée définie au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité de premier passage étroit, pas un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde de pull request non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevé/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                          | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, Cron et base de référence du Gateway                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus runtime du Plugin de canal, Gateway, SDK de Plugin, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse d’IP, garde réseau, récupération web et politique SSRF du SDK de Plugin                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et garde-fous d’exécution d’outils par les agents            |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance d’installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de source et contrat de paquet du SDK de Plugin |

### Shards de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Linux Blacksmith accepté par les contrôles de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs quotidiennes par défaut, car le build macOS domine le runtime même lorsqu’il est propre.

### Catégories de qualité critiques

`CodeQL Critical Quality` est le shard non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de gravité erreur, non liées à la sécurité, sur des surfaces étroites à forte valeur sur des runners Linux hébergés par GitHub, afin que les analyses qualité ne consomment pas le budget d’enregistrement de runners Blacksmith. Son garde de pull request est volontairement plus petit que le profil planifié : les PR non brouillonnes exécutent seulement les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les modifications du code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, du code de schéma/migration/E/S de config, du code d’authentification/secrets/bac à sable/sécurité, du runtime des canaux du cœur et des Plugins de canal inclus, du protocole Gateway/méthode serveur, du runtime mémoire/liaison SDK, de MCP/processus/livraison sortante, du runtime fournisseur/catalogue de modèles, des diagnostics de session/files de livraison, du chargeur de Plugins, du SDK de Plugin/contrat de paquet, ou du runtime de réponse du SDK de Plugin. Les changements de config CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

La distribution manuelle accepte :

````
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
````

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                                | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité de l’authentification, des secrets, du bac à sable, de Cron et du Gateway                                                           |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de config, migration, normalisation et E/S                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du cœur et des Plugins de canal inclus                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats runtime d’exécution de commandes, distribution modèle/fournisseur, distribution et files d’auto-réponse, et plan de contrôle ACP                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades du runtime mémoire, alias mémoire du SDK de Plugin, liaison d’activation du runtime mémoire et commandes doctor mémoire             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de bundles d’événements/journaux de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK de Plugin, assistants de payload/découpage/runtime des réponses, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte de fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues de fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats runtime du plan de contrôle des tâches                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats runtime de récupération/recherche web du cœur, E/S média, compréhension média, génération d’images et génération média                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du SDK de Plugin                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du SDK de Plugin côté paquet publié et assistants de contrat de paquet de Plugin                                                                            |

La qualité reste séparée de la sécurité afin que les résultats qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL Swift, Python et Plugins inclus devrait être rajoutée comme travail de suivi borné ou fragmenté uniquement après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder la documentation existante alignée sur les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie après un push non-bot sur `main` peut le déclencher, et la distribution manuelle peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source précédent non ignoré de Docs Agent jusqu’à `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage documentation.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie après un push non-bot sur `main` peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. La distribution manuelle contourne ce garde d’activité quotidien. La voie construit un rapport de performance Vitest groupé de suite complète, laisse Codex n’apporter que de petites corrections de performance de tests qui préservent la couverture au lieu de refactorisations larges, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la base de référence. Le rapport groupé enregistre le temps mural par config et le RSS maximal sur Linux et macOS, de sorte que la comparaison avant/après fait ressortir les deltas de mémoire des tests à côté des deltas de durée. Si la base de référence contient des tests en échec, Codex ne peut corriger que des échecs évidents, et le rapport de suite complète après agent doit réussir avant tout commit. Quand `main` avance avant que le push du bot n’atterrisse, la voie rebase le patch validé, relance `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex conserve la même posture de sécurité drop-sudo que l’agent de documentation.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise dry-run par défaut et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gardes de vérification locale et routage des changements

La logique locale de voies modifiées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Ce garde de vérification local est plus strict sur les frontières d’architecture que le périmètre large de plateforme CI :

- les changements de production du cœur exécutent le typecheck de production cœur et de tests cœur, plus les lints/gardes cœur ;
- les changements uniquement de tests du cœur exécutent seulement le typecheck de tests cœur plus le lint cœur ;
- les changements de production d’extension exécutent le typecheck de production extension et de tests extension, plus le lint extension ;
- les changements uniquement de tests d’extension exécutent le typecheck de tests extension plus le lint extension ;
- les changements du SDK de Plugin public ou de contrat de plugin étendent au typecheck des extensions, car les extensions dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les incréments de version uniquement de métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source préfèrent des mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La config partagée de livraison des salles de groupe est l’un des mappings explicites : les changements de la config de réponse visible par le groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large au niveau du harness pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de boîte distante détenu par le dépôt pour les preuves Linux mainteneur. Utilisez-le depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve a besoin de secrets, Docker, voies de paquets, boîtes réutilisables ou journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est un repli pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité détenue.

Crabbox-backed Blacksmith exécute le préchauffage, la revendication, la synchronisation, l’exécution, le rapport et le nettoyage de Testboxes à usage unique. Le contrôle d’intégrité de synchronisation intégré échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` disparaissent ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Pour les PR avec de nombreuses suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox termine aussi une invocation locale de la CLI Blacksmith qui reste dans la phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur supérieure en millisecondes pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` possède des valeurs par défaut pour le cloud détenu. Dans les worktrees Codex ou les checkouts liés/partiels, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou une version plus récente afin que le wrapper bénéficie du comportement actuel de synchronisation, de file d’attente et de nettoyage des Testbox. Lorsque vous utilisez le checkout frère, reconstruisez le binaire local ignoré avant les mesures de temps ou le travail de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Contrôle des changements :

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

Lisez le récapitulatif JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Pour les exécutions Blacksmith Testbox déléguées, le code de sortie du wrapper Crabbox et le récapitulatif JSON constituent le résultat de la commande. L’exécution GitHub Actions liée possède l’hydratation et le keepalive ; elle peut se terminer avec l’état `cancelled` lorsque la Testbox est arrêtée extérieurement après que la commande SSH a déjà renvoyé son résultat. Traitez cela comme un artefact de nettoyage/d’état, sauf si le `exitCode` du wrapper est non nul ou si la sortie de commande montre un test échoué. Les exécutions Crabbox adossées à Blacksmith et à usage unique doivent arrêter automatiquement la Testbox ; si une exécution est interrompue ou si le nettoyage n’est pas clair, inspectez les boxes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même box hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez directement Blacksmith uniquement pour des diagnostics comme `list`, `status` et le nettoyage. Corrigez le chemin Crabbox avant de traiter une exécution Blacksmith directe comme une preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent, mais que les nouveaux préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes, traitez cela comme une pression liée au fournisseur Blacksmith, à la file d’attente, à la facturation ou aux limites de l’organisation. Arrêtez les ids en file d’attente que vous avez créés, évitez de démarrer davantage de Testboxes et déplacez la preuve vers le chemin de capacité Crabbox détenue ci-dessous pendant qu’une personne vérifie le tableau de bord Blacksmith, la facturation et les limites de l’organisation.

Passez à la capacité Crabbox détenue uniquement lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche a réellement besoin de CPU de classe 48xlarge. Une requête `beast` démarre à 192 vCPU et constitue le moyen le plus simple d’atteindre les quotas régionaux EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` détenu par le dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS négociés affichent la région/le marché sélectionnés, la pression de quota, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour des contrôles larges plus lourds, `large` seulement après que standard/fast ne suffisent pas, et `beast` uniquement pour des voies exceptionnelles limitées par le CPU, comme les matrices Docker suite complète ou tous les plugins, la validation explicite de release/bloquant, ou le profilage de performances à nombreux cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, les travaux docs-only, le lint/typecheck ordinaire, les petites reproductions E2E ou le triage d’indisponibilité Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que la volatilité du marché Spot ne se mêle pas au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies cloud détenues. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, le fetch de `origin/main` et le transfert d’environnement non secret pour les commandes cloud détenues `crabbox run --id <cbx_id>`.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

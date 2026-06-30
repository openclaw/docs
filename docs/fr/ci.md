---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la distribution ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, garde-fous de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-06-30T13:57:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Les pushes
canoniques vers `main` passent d’abord par une fenêtre d’admission de 90 secondes sur
exécuteur hébergé. Le groupe de concurrence `CI` existant annule cette exécution en
attente lorsqu’un commit plus récent arrive, de sorte que les fusions séquentielles
n’enregistrent pas chacune une matrice Blacksmith complète. Les pull requests et les
déclenchements manuels ignorent l’attente. Le job `preflight` classe ensuite le diff
et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les
exécutions manuelles `workflow_dispatch` contournent intentionnellement le cadrage
intelligent et déploient le graphe complet pour les candidates de version et la
validation large. Les lanes Android restent optionnelles via `include_android`. La
couverture Plugin réservée aux versions se trouve dans le workflow séparé
[`Prépublication Plugin`](#plugin-prerelease) et ne s’exécute que depuis
[`Validation complète de version`](#full-release-validation) ou via un déclenchement
manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                  | Quand il s’exécute                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Détecter les changements limités à la documentation, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons        |
| `runner-admission`                 | Antirebond hébergé de 90 secondes pour les pushes canoniques vers `main` avant l’enregistrement du travail Blacksmith | Chaque exécution CI ; attente uniquement sur les pushes canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor`, et audit du lockfile de production | Toujours sur les pushes et PR non brouillons        |
| `check-dependencies`               | Passe Knip de production limitée aux dépendances, plus garde de liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node                    |
| `build-artifacts`                  | Construire `dist/`, Control UI, contrôles de fumée de la CLI construite, contrôles d’artefacts construits embarqués, et artefacts réutilisables | Changements pertinents pour Node                    |
| `checks-fast-core`                 | Lanes rapides de correction Linux, comme les contrôles groupés, protocole, QA Smoke CI, et routage CI     | Changements pertinents pour Node                    |
| `checks-fast-contracts-plugins-*`  | Deux contrôles fragmentés de contrats de Plugins                                                          | Changements pertinents pour Node                    |
| `checks-fast-contracts-channels-*` | Deux contrôles fragmentés de contrats de canaux                                                           | Changements pertinents pour Node                    |
| `checks-node-core-*`               | Fragments de tests Node du cœur, excluant les lanes canal, groupée, contrat et extension                  | Changements pertinents pour Node                    |
| `check-*`                          | Équivalent fragmenté de la porte locale principale : types de production, lint, gardes, types de test, et fumée stricte | Changements pertinents pour Node                    |
| `check-additional-*`               | Architecture, dérive fragmentée de limites/prompts, gardes d’extensions, limite de package, et topologie d’exécution | Changements pertinents pour Node                    |
| `checks-node-compat-node22`        | Build de compatibilité Node 22 et lane de fumée                                                           | Déclenchement CI manuel pour les versions           |
| `check-docs`                       | Formatage, lint, et contrôles de liens cassés de la documentation                                         | Documentation modifiée                              |
| `skills-python`                    | Ruff + pytest pour les Skills adossées à Python                                                           | Changements pertinents pour les Skills Python       |
| `checks-windows`                   | Tests de processus/chemins propres à Windows plus régressions de spécificateurs d’import d’exécution partagés | Changements pertinents pour Windows                 |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements pertinents pour macOS                   |
| `macos-swift`                      | Lint, build, et tests Swift pour l’application macOS                                                       | Changements pertinents pour macOS                   |
| `ios-build`                        | Génération du projet Xcode plus build simulateur de l’application iOS                                     | Application iOS, kit d’application partagé, ou changements Swabble |
| `android`                          | Tests unitaires Android pour les deux variantes plus build d’un APK debug                                 | Changements pertinents pour Android                 |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après activité fiable                                      | Succès CI principal ou déclenchement manuel         |
| `openclaw-performance`             | Rapports de performance quotidiens/à la demande de l’exécution Kova avec fournisseur simulé, profilage profond, et lanes live GPT 5.5 | Planifié et déclenchement manuel                    |

## Ordre d’échec rapide

1. `runner-admission` attend uniquement pour les pushes canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
4. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent commencer dès que le build partagé est prêt.
5. Les lanes plus lourdes de plateformes et d’exécution se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI sauf si l’exécution la plus récente pour la même référence échoue aussi. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs embarqués de canal, core-support-boundary, et gateway-watch au lieu de mettre en file de petits jobs de vérification. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent`, ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps écoulé, le temps de file d’attente, les jobs les plus lents, les échecs, et la barrière de déploiement `pnpm-store-warmup` depuis GitHub Actions. CI téléverse aussi le même résumé d’exécution comme artefact `ci-timings-summary`. Pour les temps de build, consultez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artefact `startup-memory`.

Pour les exécutions de pull request, le job terminal de résumé des temps exécute l’assistant depuis la révision de base fiable avant de passer `GH_TOKEN` à `gh run view`. Cela garde la requête avec jeton hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte et preuves de PR

Les PR de contributeurs externes exécutent une porte de contexte et de preuves de PR depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow extrait le commit de base fiable
et évalue uniquement le corps de la PR ; il n’exécute pas de code depuis la branche du
contributeur.

La porte s’applique aux auteurs de PR qui ne sont pas propriétaires du dépôt, membres,
collaborateurs, ou bots. Elle réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. La preuve peut être un test ciblé,
un résultat CI, une capture d’écran, un enregistrement, une sortie de terminal,
une observation live, un journal expurgé, ou un lien d’artefact. Le corps fournit
l’intention et une validation utile ; les relecteurs inspectent le code, les tests, et CI
pour évaluer la correction.

Lorsque le contrôle échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Portée et routage

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection de portée modifiée et fait agir le manifeste preflight comme si chaque zone cadrée avait changé.

- **Modifications du workflow CI** valident le graphe CI Node plus le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android, ou macOS ; ces lanes de plateformes restent cadrées sur les changements de sources de plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, le garde d’interpolation d’action composite, et le garde de marqueurs de conflit. Le job `security-fast` cadré sur la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les constats de sécurité de workflow échouent tôt dans le graphe CI principal.
- **Documentation sur les pushes vers `main`** est vérifiée par le workflow autonome `Docs` avec le même miroir de documentation ClawHub utilisé par CI, donc les pushes mixtes code+docs ne mettent pas aussi en file le fragment CI `check-docs`. Les pull requests et la CI manuelle exécutent toujours `check-docs` depuis CI lorsque la documentation a changé.
- **TUI PTY** s’exécute dans le fragment Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le fragment exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, donc il couvre à la fois la lane de fixture déterministe `TuiBackend` et la fumée plus lente `tui --local` qui simule uniquement le point de terminaison du modèle externe.
- **Modifications limitées au routage CI, modifications sélectionnées de fixtures de tests cœur peu coûteuses, et modifications étroites d’assistants/routage de tests de contrats Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les fragments cœur complets, les fragments de Plugins groupés, et les matrices de gardes supplémentaires lorsque le changement est limité aux surfaces de routage ou d’assistance que la tâche rapide exerce directement.
- **Contrôles Node Windows** sont cadrés sur les wrappers de processus/chemins propres à Windows, les assistants d’exécuteurs npm/pnpm/UI, la configuration du gestionnaire de packages, et les surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport de source, Plugin, fumée d’installation, et tests seuls restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver de runners : les contrats de Plugin et les contrats de canal s’exécutent chacun sous forme de deux shards pondérés adossés à Blacksmith avec le fallback standard du runner GitHub, les lanes rapides/de support des tests unitaires core s’exécutent séparément, l’infrastructure d’exécution core est répartie entre l’état, le processus/la configuration, le partagé et trois shards de domaine cron, l’auto-réponse s’exécute sous forme de workers équilibrés (avec le sous-arbre de réponse divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations Gateway/server agentiques sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale regroupe ensuite uniquement les shards d’infrastructure isolés fondés sur des motifs d’inclusion dans des bundles déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites command/cron non isolées, agents-core avec état, ou gateway/server ; les suites fixes lourdes restent sur 8 vCPU tandis que les lanes groupées et de poids plus faible utilisent 4 vCPU. Les pull requests sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés au sein du plan Linux Node actuel de 34 jobs, de sorte qu’une seule PR n’enregistre pas toute la matrice Node de plus de 70 jobs. Les pushes sur `main`, les dispatches manuels et les gates de release conservent la matrice complète. Les tests larges de navigateur, de QA, de médias et de Plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des Plugins. Les shards à motifs d’inclusion enregistrent les entrées de durée avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration complète d’un shard filtré. `check-additional-*` garde ensemble le travail de compilation/canary des frontières de packages et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste de garde des frontières est répartie en un shard lourd en prompts et un shard combiné pour les autres bandes de garde, chacun exécutant simultanément des gardes indépendantes sélectionnées et affichant les durées par vérification. La coûteuse vérification de dérive du snapshot de prompt du chemin nominal Codex s’exécute comme job additionnel propre pour la CI manuelle et uniquement pour les changements qui affectent les prompts, de sorte que les changements Node ordinaires sans rapport n’attendent pas derrière la génération à froid des snapshots de prompt et que les shards de frontières restent équilibrés pendant que la dérive de prompt reste épinglée à la PR qui l’a causée ; le même flag ignore la génération Vitest de snapshots de prompt à l’intérieur du shard construit de frontières de support core. La surveillance Gateway, les tests de canal et le shard de frontières de support core s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 24 jobs de test Node simultanés et
12 pour les lanes fast/check plus petites ; Windows et Android restent à deux, car
ces pools de runners sont plus étroits.

Le plan PR compact émet 18 jobs Node pour la suite actuelle : les groupes de
configuration complète sont traités par lots dans des sous-processus isolés avec un timeout de lot de 120 minutes,
tandis que les groupes à motifs d’inclusion partagent le même budget de jobs borné.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a ni source set ni manifeste séparé ; sa lane de tests unitaires compile tout de même la variante avec les flags BuildConfig SMS/journal d’appels, tout en évitant un job de packaging APK debug dupliqué à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les fichiers inutilisés trouvés par Knip en production avec `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non relu ou laisse une entrée obsolète dans l’allowlist, tout en préservant les surfaces intentionnelles de Plugin dynamiques, générées, de build, de tests live et de pont de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code non fiable issu de pull requests. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite intentionnellement de transférer le corps complet du Webhook. Le workflow de réception dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, exploitable, risqué ou utile opérationnellement. Les ouvertures ordinaires, modifications, bruit de bots, bruit de Webhook dupliqué et trafic normal de revue doivent produire `NO_REPLY`.

Traitez les titres GitHub, commentaires, corps, textes de revue, noms de branches et messages de commit comme des données non fiables sur tout ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ni pour le runtime de l’agent.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de jobs que la CI normale, mais forcent l’activation de chaque lane scopée non Android : shards Linux Node, shards de Plugins groupés, shards de contrats de Plugin et de canal, compatibilité Node 22, `check-*`, `check-additional-*`, smoke checks sur artefacts construits, vérifications docs, Skills Python, Windows, macOS, build iOS et i18n Control UI. Les dispatches CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prépublication de Plugin, le shard réservé à la release `agentic-plugins`, le sweep complet de lots d’extensions et les lanes Docker de prépublication de Plugin sont exclus de la CI. La suite Docker de prépublication ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par un autre push ou une exécution PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant de confiance d’exécuter ce graphe contre une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI manuel et fallbacks des dépôts non canoniques, scans qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows docs hors CI et préflight install-smoke afin que la matrice Blacksmith puisse entrer en file plus tôt                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards d’extensions de poids plus faible, `checks-fast-core`, shards de contrats de Plugin/canal, la plupart des shards Linux Node groupés/de poids plus faible, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` sélectionnés et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, shards `check-additional-*` lourds en frontières/extensions et `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne faisaient gagner) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il ne faisait gagner)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks retombent sur `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks retombent sur `macos-26`                                                                                                                                                                                                  |

## Budget d’enregistrement des runners

Le bucket actuel d’enregistrement des runners GitHub d’OpenClaw signale 10 000
enregistrements de runners auto-hébergés par 5 minutes dans `ghx api rate_limit`. Revérifiez
`actions_runner_registration` avant chaque passe de réglage, car GitHub peut modifier
ce bucket. La limite est partagée par tous les enregistrements de runners Blacksmith dans
l’organisation `openclaw`, donc ajouter une autre installation Blacksmith n’ajoute pas
de nouveau bucket.

Traitez les labels Blacksmith comme la ressource rare pour le contrôle des pics. Les jobs qui
se contentent de router, notifier, synthétiser, sélectionner des shards ou exécuter de courts scans CodeQL doivent
rester sur les runners hébergés par GitHub sauf s’ils ont des besoins spécifiques à Blacksmith
mesurés. Toute nouvelle matrice Blacksmith, tout `max-parallel` plus élevé ou tout workflow
à haute fréquence doit montrer son nombre d’enregistrements dans le pire cas et maintenir la cible
au niveau de l’organisation sous environ 60 % du bucket live. Avec le bucket actuel de 10 000 enregistrements,
cela signifie une cible opérationnelle de 6 000 enregistrements, laissant de la marge pour
les dépôts concurrents, les reprises et le chevauchement des pics.

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut pour les exécutions normales de push et de pull request. `workflow_dispatch` et les exécutions de dépôts non canoniques utilisent des runners hébergés par GitHub, mais les exécutions canoniques normales ne sondent actuellement pas la santé de la file Blacksmith et ne basculent pas automatiquement vers les labels hébergés par GitHub lorsque Blacksmith est indisponible.

## Équivalents locaux

```bash
pnpm changed:lanes                            # inspecter le classificateur local des lanes modifiées pour origin/main...HEAD
pnpm check:changed                            # garde de vérification locale intelligente : typecheck/lint/gardes modifiés par lane de frontière
pnpm check                                    # garde locale rapide : tsgo prod + lint fragmenté + gardes rapides en parallèle
pnpm check:test-types
pnpm check:timed                              # même garde avec les temps par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # tests vitest
pnpm test:changed                             # cibles Vitest modifiées intelligentes et peu coûteuses
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # format docs + lint + liens brisés
pnpm build                                    # construire dist lorsque les artefacts CI/vérifications smoke comptent
pnpm ios:build                                # générer et construire le projet d’application iOS
pnpm ci:timings                               # résumer la dernière exécution CI de push origin/main
pnpm ci:timings:recent                        # comparer les exécutions CI main réussies récentes
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps écoulé, le temps en file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --latest-main # ignorer le bruit des issues/commentaires et choisir la CI de push origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI main réussies récentes
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performance OpenClaw

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute quotidiennement sur `main` et peut être lancé manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Un lancement manuel évalue normalement la référence du workflow. Définissez `target_ref` pour évaluer un tag de version ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` enregistre la référence/SHA testée, la référence/SHA du workflow, la référence Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une version épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime construit localement avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU/heap/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-openai-candidate` : un vrai tour d’agent OpenAI `openai/gpt-5.5`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute également des sondes source natives d’OpenClaw après le passage Kova : temps de démarrage et mémoire du Gateway sur les cas de démarrage par défaut, avec hook et avec 50 Plugins ; RSS d’import des Plugins groupés ; boucles hello répétées `channel-chat-baseline` avec mock OpenAI ; commandes de démarrage CLI contre le Gateway démarré ; et sonde smoke de performance de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la référence testée, le résumé source compare les valeurs RSS et heap actuelles à cette base de référence et marque les fortes augmentations RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le lot de rapports, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit également `report.json`, `report.md`, les lots, `index.md` et les artefacts de sondes source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la référence testée est écrit sous la forme `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de version complète

`Full Release Validation` est le workflow manuel général pour « tout exécuter avant une version ». Il accepte une branche, un tag ou un SHA de commit complet, lance le workflow manuel `CI` avec cette cible, lance `Plugin Prerelease` pour les preuves plugin/package/statique/Docker réservées à la version, et lance `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package multi-OS, le rendu de la scorecard de maturité à partir des preuves de profil QA, la parité QA Lab, Matrix et les lanes Telegram. Les profils stable et complet incluent toujours une couverture exhaustive live/E2E et un soak du chemin de version Docker ; le profil bêta peut l’activer avec `run_release_soak=true`. L’E2E Telegram de package canonique s’exécute dans Package Acceptance, donc un candidat complet ne démarre pas de poller live en double. Après publication, passez `release_package_spec` pour réutiliser le package npm livré dans les vérifications de version, Package Acceptance, Docker, multi-OS et Telegram sans reconstruire. Utilisez `npm_telegram_package_spec` uniquement pour une relance Telegram ciblée sur un package publié. La lane de package live du Plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié dérive `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact packagent `extensions/codex` depuis la référence sélectionnée. Définissez `codex_plugin_spec` explicitement pour des sources de Plugin personnalisées comme les specs `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation de version complète](/fr/reference/full-release-validation) pour la matrice des étapes, les noms exacts des jobs de workflow, les différences entre profils, les artefacts et les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication de version mutateur. Lancez-le depuis `release/YYYY.M.PATCH` ou `main` après l’existence du tag de version et après la réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`, lance `Plugin NPM Release` pour tous les packages Plugin publiables, lance `Plugin ClawHub Release` pour le même SHA de version, puis seulement ensuite lance `OpenClaw NPM Release` avec le `preflight_run_id` enregistré. La publication stable exige également un `windows_node_tag` exact ; le workflow vérifie la version source Windows et compare ses installateurs x64/ARM64 avec l’entrée candidate approuvée `windows_node_installer_digests` avant tout enfant de publication, puis promeut et vérifie ces mêmes condensats d’installateurs épinglés ainsi que l’asset compagnon exact et le contrat de somme de contrôle avant de publier le brouillon de version GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue vite, utilisez l’assistant plutôt que `gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de lancement de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, lance `Full Release Validation` depuis cette référence épinglée, vérifie que chaque workflow enfant `headSha` correspond à la cible et supprime la branche temporaire lorsque l’exécution se termine. Le vérificateur général échoue également si un workflow enfant s’est exécuté sur un SHA différent.

`release_profile` contrôle l’étendue live/provider transmise aux vérifications de version. Les workflows de version manuels utilisent par défaut `stable` ; utilisez `full` uniquement lorsque vous voulez intentionnellement la large matrice consultative provider/média. Les vérifications de version stable et complète exécutent toujours le soak exhaustif live/E2E et Docker du chemin de version ; le profil bêta peut l’activer avec `run_release_soak=true`.

- `minimum` conserve les lanes OpenAI/core critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable provider/backend.
- `full` exécute la large matrice consultative provider/média.

Le workflow général enregistre les identifiants d’exécution des enfants lancés, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement le job vérificateur parent pour actualiser le résultat général et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de version, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de préversion Plugin, `release-checks` pour chaque enfant de version, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow général. Cela maintient bornée la relance d’une boîte de version échouée après un correctif ciblé. Pour une lane multi-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes multi-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent des temps par phase. Les lanes de vérification de version QA sont consultatives, sauf la garde standard de couverture des outils runtime, qui bloque lorsque les outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé de niveau standard.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une fois la référence sélectionnée en une archive tarball `release-package-under-test`, puis transmet cet artefact aux vérifications multi-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de version lorsque la couverture soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de version et évite de repackager le même candidat dans plusieurs jobs enfants. Pour la lane live du Plugin npm Codex, les vérifications de version transmettent soit une spec de Plugin publié correspondante dérivée de `release_package_spec`, soit la `codex_plugin_spec` fournie par l’opérateur, soit laissent l’entrée vide afin que le script Docker package le Plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all` remplacent le workflow général plus ancien. Le moniteur parent annule tout workflow enfant qu’il a déjà lancé lorsque le parent est annulé, afin qu’une validation main plus récente ne reste pas derrière une exécution de release-check obsolète de deux heures. La validation de branche/tag de version et les groupes de relance ciblés gardent `cancel-in-progress: false`.

## Fragments live et E2E

L’enfant live/E2E de version conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’un seul job sériel :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs provider-filtrés `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragments média audio/vidéo séparés et fragments musicaux provider-filtrés

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de providers live plus faciles à relancer et diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles en une seule fois.

Les fragments média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live appuyées par Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards de modèle/backend live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les shards du modèle live Docker, du Gateway réparti par fournisseur, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker du Gateway portent des plafonds `timeout` explicites au niveau des scripts, inférieurs au délai d’expiration de la tâche du workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de vérification de release. Si ces shards reconstruisent indépendamment la cible Docker source complète, l’exécution de release est mal configurée et gaspillera du temps réel en constructions d’images dupliquées.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide un seul tarball au moyen du même harnais E2E Docker que les utilisateurs exercent après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis imprime la source, la référence du workflow, la référence du package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker de condensé de package lorsque nécessaire, puis exécute les voies Docker sélectionnées contre ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis répartit ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle facultativement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut encore installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources des candidats

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw comme `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation des préreleases/releases stables publiées.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou depuis une balise de release, installe les dépendances dans un worktree détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS public ; `package_sha256` est requis. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou IP résolus privés/internes/à usage spécial, ainsi que les redirections hors de la même politique de sécurité publique.
- `source=trusted-url` télécharge un `.tgz` HTTPS depuis une politique de source de confiance nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont requis. Utilisez cela uniquement pour les miroirs d’entreprise détenus par les mainteneurs ou les dépôts de packages privés qui nécessitent des hôtes, ports, préfixes de chemin, hôtes de redirection ou une résolution réseau privée configurés. Si la politique déclare une authentification bearer, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés dans l’URL sont toujours rejetés.
- `source=artifact` télécharge un seul `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocs complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture plugin hors ligne afin que la validation des packages publiés ne dépende pas de la disponibilité live de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publiée étant conservé pour les déclenchements autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, y compris les commandes locales,
les voies Docker, les entrées Package Acceptance, les valeurs par défaut de release et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent Package Acceptance avec `source=artifact`, l’artefact de package de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela conserve la migration de package, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de plugins obsolètes, la réparation d’installation de plugins configurés, le plugin hors ligne, la mise à jour de plugin et la preuve Telegram sur le même tarball de package résolu. Définissez `release_package_spec` sur Full Release Validation ou OpenClaw Release Checks après la publication d’une bêta pour exécuter la même matrice contre le package npm livré sans reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque Package Acceptance a besoin d’un package différent du reste de la validation de release. Les vérifications de release multi-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme propres à chaque OS ; la validation produit des packages/mises à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une référence de package publié par exécution dans le chemin de release bloquant. Dans Package Acceptance, le tarball `package-under-test` résolu est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de réexécution des voies échouées préservent cette référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la couverture aux quatre dernières releases npm stables plus les releases épinglées de frontière de compatibilité plugin et les fixtures façonnées par des issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances de plugins legacy obsolètes. Les sélections published-upgrade survivor à plusieurs références sont partitionnées par référence dans des tâches runner Docker ciblées séparées. Le workflow distinct `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent fournir des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, puis sonde `/healthz`, `/readyz` ainsi que l’état RPC après le démarrage du Gateway. Les voies Windows fraîches packagées et installateur vérifient aussi qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke multi-OS de tour d’agent OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité legacy

Package Acceptance dispose de fenêtres de compatibilité legacy bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas cet indicateur ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes du fixture git factice dérivé du tarball et peut journaliser l’absence de `update.channel` persistant ;
- les smokes de plugins peuvent lire les emplacements legacy d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut également avertir pour les fichiers d’horodatage de métadonnées de build locales qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les timings de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer la validation de release complète.

## Smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de périmètre au moyen de sa propre tâche `preflight`. Il divise la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les requêtes de tirage qui touchent les surfaces Docker/paquet, les changements de paquet/manifeste de Plugin groupé, ou les surfaces centrales de Plugin/canal/Gateway/SDK de Plugin que les tâches de smoke Docker exercent. Les changements de Plugin groupé limités au source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image du Dockerfile racine une fois, vérifie la CLI, exécute le smoke CLI de suppression du workspace partagé par les agents, exécute l’e2e du réseau Gateway du conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné des Plugins groupés sous un délai d’expiration global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de paquet QR et la couverture Docker/update de l’installeur pour les exécutions planifiées nocturnes, les dispatchs manuels, les vérifications de release par workflow-call et les requêtes de tirage qui touchent réellement les surfaces installeur/paquet/Docker. En mode complet, install-smoke prépare ou réutilise une image de smoke GHCR du Dockerfile racine pour un SHA cible, puis exécute l’installation de paquet QR, les smokes Dockerfile racine/Gateway, les smokes installeur/update et l’E2E Docker rapide des Plugins groupés comme tâches séparées afin que le travail d’installeur n’attende pas derrière les smokes de l’image racine.

Les pushes vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; quand la logique de portée des changements demanderait une couverture complète lors d’un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent du fournisseur d’image avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon le planning nocturne et depuis le workflow de vérifications de release, et les dispatchs manuels `Install Smoke` peuvent l’activer, mais les requêtes de tirage et les pushes vers `main` ne le font pas. La CI normale des PR exécute toujours la voie rapide de régression du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installeur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois comme tarball npm, et construit deux images partagées `scripts/e2e/Dockerfile` :

- un runner Node/Git minimal pour les voies installeur/update/dépendances de Plugins ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification réside dans `scripts/lib/docker-e2e-plan.mjs`, et le runner exécute uniquement le plan sélectionné. Le planificateur choisit l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Réglages

| Variable                               | Valeur par défaut | Objectif                                                                                       |
| -------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de créneaux du pool principal pour les voies normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de créneaux du pool de fin sensible aux fournisseurs.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond des voies live concurrentes afin que les fournisseurs ne limitent pas le débit.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                 | Plafond des voies d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond des voies multi-services concurrentes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de voies pour éviter les tempêtes de création du daemon Docker ; définir `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai d’expiration de secours par voie (120 minutes) ; certaines voies live/de fin utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan du planificateur sans exécuter les voies.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. L’agrégat local effectue les prévols Docker, supprime les conteneurs OpenClaw E2E obsolètes, émet l’état des voies actives, persiste les durées des voies pour l’ordre du plus long au plus court, et arrête par défaut de planifier de nouvelles voies groupées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels paquet, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de paquet de l’exécution courante ou télécharge un artefact de paquet depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images GHCR Docker E2E bare/fonctionnelles étiquetées par digest de paquet via le cache de couches Docker de Blacksmith quand le plan nécessite des voies avec paquet installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de paquet au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai d’expiration borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué retente rapidement au lieu de consommer la majeure partie du chemin critique de la CI.

### Segments du chemin de release

La couverture Docker de release exécute de plus petites tâches segmentées avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live du paquet du Plugin Codex, qui installe le paquet OpenClaw candidat, installe le Plugin Codex depuis `codex_plugin_spec` ou un tarball de la même ref avec approbation explicite de l’installation de la CLI Codex, exécute le prévol de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw dans la même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux voies d’installeur de fournisseurs.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un segment autonome `openwebui` uniquement pour les dispatchs limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phases, le JSON du plan du planificateur, les tableaux de voies lentes et les commandes de réexécution par voie. L’entrée de workflow `docker_lanes` exécute les voies sélectionnées contre les images préparées au lieu des tâches de segments, ce qui limite le débogage d’une voie échouée à une tâche Docker ciblée et prépare, télécharge ou réutilise l’artefact de paquet pour cette exécution ; si une voie sélectionnée est une voie Docker live, la tâche ciblée construit l’image de test live localement pour cette réexécution. Les commandes de réexécution GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le paquet et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # télécharge les artefacts Docker et affiche les commandes de réexécution ciblées combinées/par voie
pnpm test:docker:timings <summary>   # résumés des voies lentes et du chemin critique des phases
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Pré-release des Plugins

`Plugin Prerelease` est une couverture produit/paquet plus coûteuse, c’est donc un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les requêtes de tirage normales, les pushes vers `main` et les dispatchs CI manuels autonomes gardent cette suite désactivée. Elle répartit les tests de Plugins groupés sur huit workers d’extension ; ces tâches de fragments d’extension exécutent jusqu’à deux groupes de configuration de Plugins à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de Plugins lourds en imports ne créent pas de tâches CI supplémentaires. Le chemin Docker de pré-release réservé aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des tâches d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur servent d’entrée de triage et ne modifient pas le gate bloquant de Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées hors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnais QA larges et de release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un dispatch manuel ; il distribue la voie de parité mock, la voie Matrix live, ainsi que les voies Telegram et Discord live comme tâches parallèles. Les tâches live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugins de fournisseurs. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un dispatch manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les voies QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et de référence comme tâches de voies parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/vérification à portée limitée au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité étroit de première passe, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde des requêtes de tirage non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque avec des requêtes de sécurité à haute confiance filtrées sur une `security-severity` élevée/critique.

La garde des requêtes de tirage reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent hors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                        | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Référence de base pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                           |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation du canal principal, plus le runtime de Plugin de canal, le Gateway, le Plugin SDK, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de politique SSRF du noyau, d’analyse IP, de garde réseau, de récupération web et du Plugin SDK                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et barrières d’exécution des outils d’agent                   |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour l’installation de Plugin, le chargeur, le manifeste, le registre, l’installation par gestionnaire de paquets, le chargement de source et le contrat de paquet du Plugin SDK |

### Fragments de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Compile l’application Android manuellement pour CodeQL sur le plus petit runner Linux Blacksmith accepté par les contrôles de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Compile l’application macOS manuellement pour CodeQL sur Blacksmith macOS, filtre les résultats de compilation des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car la compilation macOS domine le temps d’exécution même lorsqu’elle est propre.

### Catégories Critical Quality

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de gravité erreur, non liées à la sécurité, sur des surfaces étroites à forte valeur, sur des runners Linux hébergés par GitHub, afin que les analyses de qualité ne consomment pas le budget d’enregistrement des runners Blacksmith. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillons exécutent uniquement les fragments `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` correspondants pour les changements touchant le code d’exécution des commandes/modèles/outils d’agent et de dispatch de réponse, le schéma de configuration/la migration/le code d’E/S, le code d’authentification/secrets/bac à sable/sécurité, le runtime du canal principal et du Plugin de canal groupé, le protocole Gateway/la méthode serveur, le runtime mémoire/la colle SDK, MCP/processus/livraison sortante, le runtime fournisseur/le catalogue de modèles, les diagnostics de session/files de livraison, le chargeur de Plugin, le Plugin SDK/contrat de paquet, ou le runtime de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow qualité exécutent les douze fragments de qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage et d’itération pour exécuter un fragment de qualité isolément.

| Catégorie                                              | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                                            |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, de migration, de normalisation et d’E/S                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal principal et du Plugin de canal groupé                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats de runtime pour l’exécution des commandes, le dispatch modèle/fournisseur, le dispatch et les files de réponse automatique, et le plan de contrôle ACP    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK d’hôte mémoire, façades de runtime mémoire, alias mémoire du Plugin SDK, colle d’activation du runtime mémoire et commandes doctor mémoire                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de la file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de lots d’événements/journaux de diagnostic et contrats CLI du doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch de réponse entrante du Plugin SDK, assistants de charge utile/fragmentation/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de la Control UI, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime pour la récupération/recherche web du noyau, les E/S média, la compréhension média, la génération d’images et la génération média              |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du Plugin SDK                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté paquet du Plugin SDK et assistants de contrat de paquet de Plugin                                                                             |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. Les extensions CodeQL pour Swift, Python et les Plugins groupés doivent être rajoutées comme travaux de suivi cadrés ou fragmentés uniquement après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex déclenchée par événement pour garder la documentation existante alignée avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, et le dispatch manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il passe en revue la plage de commits allant du SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage de documentation.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex déclenchée par événement pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main` après un push non-bot peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur l’ensemble de la suite, permet à Codex d’apporter uniquement de petites corrections de performance de tests qui préservent la couverture au lieu de larges refactorisations, puis réexécute le rapport sur l’ensemble de la suite et rejette les changements qui réduisent le nombre de tests réussis de la base de référence. Le rapport groupé enregistre le temps réel par configuration et le RSS maximal sur Linux et macOS, de sorte que la comparaison avant/après fait apparaître les deltas mémoire des tests à côté des deltas de durée. Si la base de référence contient des tests en échec, Codex ne peut corriger que les échecs évidents, et le rapport après-agent sur l’ensemble de la suite doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’arrive, la voie rebase le correctif validé, réexécute `pnpm check:changed` et réessaie le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité drop-sudo que l’agent de documentation.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise dry-run par défaut et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée partagée, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barrières de vérification locales et routage des changements

La logique locale des voies modifiées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière de vérification locale est plus stricte sur les frontières d’architecture que le large périmètre de plateforme CI :

- les changements de production du noyau exécutent le typecheck prod du noyau et le typecheck des tests du noyau, plus le lint/les gardes du noyau ;
- les changements uniquement de tests du noyau exécutent seulement le typecheck des tests du noyau, plus le lint du noyau ;
- les changements de production d’extension exécutent le typecheck prod d’extension et le typecheck des tests d’extension, plus le lint d’extension ;
- les changements uniquement de tests d’extension exécutent le typecheck des tests d’extension, plus le lint d’extension ;
- les changements du Plugin SDK public ou du contrat de Plugin s’étendent au typecheck des extensions, car les extensions dépendent de ces contrats du noyau (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les hausses de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La configuration de livraison partagée pour les salons de groupe fait partie des mappings explicites : les changements de la configuration de réponse visible par le groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse du noyau, plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est suffisamment transversal au harnais pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est l’enveloppe de boîtes distantes propre au dépôt pour les preuves Linux de mainteneur. Utilisez-le depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve nécessite des secrets, Docker, des voies de paquet, des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de secours pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité détenue.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réclament, synchronisent, exécutent, rapportent et nettoient
des Testboxes à usage unique. Le contrôle de cohérence de synchronisation intégré échoue rapidement lorsque des fichiers
racine requis comme `pnpm-lock.yaml` disparaissent ou lorsque `git status --short`
affiche au moins 200 suppressions suivies. Pour les PR à suppressions massives intentionnelles, définissez
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox termine aussi une invocation locale de la CLI Blacksmith qui reste dans la
phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur plus élevée
en millisecondes pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` possède des valeurs par défaut de cloud propriétaire. Dans les worktrees Codex ou les checkouts liés/clairsemés, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou version ultérieure afin que le wrapper obtienne le comportement actuel de synchronisation, de file d’attente et de nettoyage des Testbox. Lorsque vous utilisez le checkout voisin, reconstruisez le binaire local ignoré avant les travaux de chronométrage ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Porte de vérification des changements :

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
résultat de la commande. L’exécution GitHub Actions liée possède l’hydratation et le keepalive ; elle
peut se terminer avec `cancelled` lorsque la Testbox est arrêtée depuis l’extérieur après que la commande SSH
a déjà retourné. Traitez cela comme un artefact de nettoyage/statut, sauf si
le `exitCode` du wrapper est non nul ou si la sortie de la commande montre un test échoué.
Les exécutions Crabbox à usage unique adossées à Blacksmith doivent arrêter automatiquement la Testbox ;
si une exécution est interrompue ou si le nettoyage est incertain, inspectez les boxes actives et arrêtez uniquement
les boxes que vous avez créées :

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

Si Crabbox est la couche défaillante mais que Blacksmith fonctionne lui-même, utilisez directement
Blacksmith uniquement pour des diagnostics comme `list`, `status` et le nettoyage. Corrigez le
chemin Crabbox avant de traiter une exécution directe Blacksmith comme une preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux
préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes,
traitez cela comme une pression du fournisseur Blacksmith, de la file d’attente, de la facturation ou des limites d’organisation. Arrêtez les
ids en file d’attente que vous avez créés, évitez de démarrer plus de Testboxes et déplacez la preuve vers le
chemin de capacité Crabbox propriétaire ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith,
la facturation et les limites d’organisation.

Escaladez vers la capacité Crabbox propriétaire uniquement lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité propriétaire est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche a vraiment besoin d’un CPU de classe 48xlarge. Une requête `beast` démarre à 192 vCPU et constitue le moyen le plus simple de déclencher un quota EC2 Spot régional ou On-Demand Standard. Le `.crabbox.yaml` détenu par le dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS négociés affichent la région/le marché sélectionnés, la pression sur les quotas, le repli Spot et les avertissements de classe à forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` seulement après que standard/fast ne suffisent plus, et `beast` uniquement pour les voies exceptionnellement liées au CPU comme les matrices Docker suite complète ou tous les plugins, la validation explicite de release/bloquant, ou le profilage de performance à nombreux cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, le travail de documentation uniquement, les lint/typecheck ordinaires, les petites reproductions E2E ou le triage d’une panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que la volatilité du marché Spot ne soit pas mélangée au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies de cloud propriétaire. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes de cloud propriétaire `crabbox run --id <cbx_id>`.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

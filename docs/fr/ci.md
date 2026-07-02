---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une nouvelle exécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, garde-fous de portée, ensembles de release et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-02T14:02:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. Les pushs
canoniques vers `main` passent d’abord par une fenêtre d’admission de 90 secondes
sur runner hébergé. Le groupe de concurrence `CI` existant annule cette exécution
en attente lorsqu’un commit plus récent arrive, afin que les fusions séquentielles
n’enregistrent pas chacune une matrice Blacksmith complète. Les pull requests et
les déclenchements manuels ignorent l’attente. Le job `preflight` classe ensuite
le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport
ont changé. Les exécutions manuelles `workflow_dispatch` contournent
intentionnellement le cadrage intelligent et déploient tout le graphe pour les
release candidates et la validation large. Les lanes Android restent optionnelles
via `include_android`. La couverture des Plugins réservée aux releases se trouve
dans le workflow séparé [`Prérelease de Plugin`](#plugin-prerelease) et ne
s’exécute que depuis [`Validation complète de release`](#full-release-validation)
ou un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                                | Objectif                                                                                                  | Quand il s’exécute                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et générer le manifeste CI | Toujours sur les pushs et PRs non draft             |
| `runner-admission`                 | Anti-rebond hébergé de 90 secondes pour les pushs canoniques vers `main` avant l’enregistrement du travail Blacksmith | Chaque exécution CI ; attente seulement sur les pushs canoniques vers `main` |
| `security-fast`                    | Détection de clés privées, audit des workflows modifiés via `zizmor`, et audit du lockfile de production  | Toujours sur les pushs et PRs non draft             |
| `check-dependencies`               | Passe Knip de production limitée aux dépendances, plus garde de liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node                    |
| `build-artifacts`                  | Générer `dist/`, l’UI de contrôle, les smoke checks de CLI générée, les vérifications d’artéfacts intégrés, et les artéfacts réutilisables | Changements pertinents pour Node                    |
| `checks-fast-core`                 | Lanes de correction Linux rapides, comme bundled, protocol, QA Smoke CI, et vérifications du routage CI   | Changements pertinents pour Node                    |
| `checks-fast-contracts-plugins-*`  | Deux vérifications shardées de contrat de Plugin                                                          | Changements pertinents pour Node                    |
| `checks-fast-contracts-channels-*` | Deux vérifications shardées de contrat de canal                                                           | Changements pertinents pour Node                    |
| `checks-node-core-*`               | Shards de tests Node du cœur, en excluant les lanes canal, bundled, contrat, et extension                 | Changements pertinents pour Node                    |
| `check-*`                          | Équivalent shardé de la gate locale principale : types prod, lint, gardes, types de test, et smoke strict | Changements pertinents pour Node                    |
| `check-additional-*`               | Architecture, dérive shardée des boundaries/prompts, gardes d’extension, boundary de package, et topologie runtime | Changements pertinents pour Node                    |
| `checks-node-compat-node22`        | Lane de build et de smoke de compatibilité Node 22                                                        | Déclenchement CI manuel pour les releases           |
| `check-docs`                       | Formatage, lint, et vérifications de liens cassés des docs                                                | Docs modifiées                                      |
| `skills-python`                    | Ruff + pytest pour les Skills adossées à Python                                                           | Changements pertinents pour les Skills Python       |
| `checks-windows`                   | Tests de processus/chemins spécifiques à Windows, plus régressions partagées de spécificateurs d’import runtime | Changements pertinents pour Windows                 |
| `macos-node`                       | Lane de tests TypeScript macOS utilisant les artéfacts générés partagés                                   | Changements pertinents pour macOS                   |
| `macos-swift`                      | Lint, build, et tests Swift pour l’app macOS                                                              | Changements pertinents pour macOS                   |
| `ios-build`                        | Génération du projet Xcode, plus build simulateur de l’app iOS                                            | App iOS, kit d’app partagé, ou changements Swabble  |
| `android`                          | Tests unitaires Android pour les deux flavors, plus un build APK debug                                    | Changements pertinents pour Android                 |
| `test-performance-agent`           | Optimisation quotidienne des tests lents Codex après activité de confiance                                | Succès de la CI principale ou déclenchement manuel  |
| `openclaw-performance`             | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile, et GPT 5.5 live | Planifié et déclenchement manuel                    |

## Ordre fail-fast

1. `runner-admission` attend seulement pour les pushs canoniques vers `main` ; un push plus récent annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artéfacts et de plateformes.
4. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
5. Les lanes de plateformes et de runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les jobs de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs embedded channel, core-support-boundary, et gateway-watch au lieu de mettre en file de minuscules jobs de vérification. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent`, ou `node scripts/ci-run-timings.mjs <run-id>` pour résumer le temps total, le temps de file, les jobs les plus lents, les échecs, et la barrière de fanout `pnpm-store-warmup` depuis GitHub Actions. La CI téléverse aussi le même résumé d’exécution comme artéfact `ci-timings-summary`. Pour le timing de build, consultez l’étape `Build dist` du job `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; le job téléverse aussi l’artéfact `startup-memory`.

Pour les exécutions de pull request, le job terminal timing-summary exécute le helper depuis la révision de base de confiance avant de passer `GH_TOKEN` à `gh run view`. Cela maintient la requête avec jeton hors du code contrôlé par la branche tout en résumant l’exécution CI actuelle de la pull request.

## Contexte et preuve de PR

Les PRs de contributeurs externes exécutent une gate de contexte et de preuve de PR depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow checkout le commit de base de confiance
et évalue seulement le corps de la PR ; il n’exécute pas de code depuis la branche du contributeur.

La gate s’applique aux auteurs de PR qui ne sont pas propriétaires du dépôt, membres,
collaborateurs, ou bots. Elle réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. La preuve peut être un test ciblé, un résultat
CI, une capture d’écran, un enregistrement, une sortie de terminal, une observation live,
un log caviardé, ou un lien d’artéfact. Le corps fournit l’intention et une validation utile ;
les reviewers inspectent le code, les tests, et la CI pour évaluer la correction.

Lorsque la vérification échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Portée et routage

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone cadrée avait changé.

- **Modifications du workflow CI** valident le graphe CI Node plus le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, iOS, Android, ou macOS ; ces lanes de plateformes restent cadrées aux changements de sources de plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, la garde d’interpolation des actions composites, et la garde de marqueurs de conflit. Le job `security-fast` cadré à la PR exécute aussi `zizmor` sur les fichiers de workflow modifiés afin que les constats de sécurité de workflow échouent tôt dans le graphe CI principal.
- **Docs sur les pushs vers `main`** sont vérifiées par le workflow autonome `Docs` avec le même miroir de docs ClawHub que celui utilisé par la CI, afin que les pushs mixtes code+docs ne mettent pas aussi en file le shard CI `check-docs`. Les pull requests et la CI manuelle exécutent toujours `check-docs` depuis la CI lorsque les docs ont changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les changements TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, il couvre donc à la fois la lane de fixture déterministe `TuiBackend` et le smoke plus lent `tui --local` qui mocke seulement l’endpoint de modèle externe.
- **Modifications limitées au routage CI, modifications sélectionnées de fixtures de core-test bon marché, et modifications étroites de helper/routage de tests de contrat de Plugin** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artéfacts de build, la compatibilité Node 22, les contrats de canal, les shards complets du cœur, les shards de Plugins bundled, et les matrices de gardes additionnelles lorsque le changement est limité aux surfaces de routage ou de helper que la tâche rapide exerce directement.
- **Vérifications Windows Node** sont cadrées aux wrappers de processus/chemins spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de packages, et aux surfaces de workflow CI qui exécutent cette lane ; les changements de source, Plugin, install-smoke, et test-only sans rapport restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans réserver excessivement de runners : les contrats de plugins et les contrats de canaux s’exécutent chacun sous forme de deux shards pondérés adossés à Blacksmith avec le recours standard au runner GitHub, les lanes rapides/de support des tests unitaires du cœur s’exécutent séparément, l’infrastructure d’exécution du cœur est répartie entre état, processus/configuration, partagé, et trois shards de domaines cron, l’auto-réponse s’exécute avec des workers équilibrés (le sous-arbre des réponses étant divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentiques de Gateway/serveur sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. La CI normale regroupe ensuite uniquement les shards d’infrastructure isolés par motifs d’inclusion dans des ensembles déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites non isolées command/cron, agents-core avec état, ou gateway/server ; les suites fixes lourdes restent sur 8 vCPU tandis que les lanes groupées et de poids inférieur utilisent 4 vCPU. Les demandes de tirage sur le dépôt canonique utilisent un plan d’admission compact supplémentaire : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés au sein du plan Linux Node actuel à 34 jobs, de sorte qu’une seule demande de tirage n’enregistre pas toute la matrice Node de plus de 70 jobs. Les poussées vers `main`, les déclenchements manuels et les portes de publication conservent la matrice complète. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. Les shards par motifs d’inclusion enregistrent des entrées de durée avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional-*` garde ensemble le travail de compilation/canary de limite de paquet et sépare l’architecture de topologie d’exécution de la couverture de surveillance du Gateway ; la liste des gardes de limite est rayée en un shard chargé en prompts et un shard combiné pour les bandes de garde restantes, chacun exécutant en parallèle des gardes indépendants sélectionnés et affichant les durées par vérification. La vérification coûteuse de dérive de snapshot de prompt du chemin nominal Codex s’exécute comme job supplémentaire propre pour la CI manuelle et uniquement pour les changements affectant les prompts, de sorte que les changements Node normaux sans rapport n’attendent pas derrière la génération à froid des snapshots de prompt et que les shards de limite restent équilibrés tandis que la dérive de prompt reste rattachée à la demande de tirage qui l’a causée ; le même indicateur ignore la génération Vitest de snapshots de prompt dans le shard de limite de support du cœur avec artefacts construits. La surveillance du Gateway, les tests de canaux et le shard de limite de support du cœur s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 24 jobs de test Node simultanés et
12 pour les lanes rapides/de vérification plus petites ; Windows et Android restent à deux, car
ces pools de runners sont plus restreints.

Le plan compact de demande de tirage émet 18 jobs Node pour la suite actuelle : les groupes
de configurations entières sont regroupés dans des sous-processus isolés avec un délai d’expiration de lot de 120 minutes,
tandis que les groupes par motifs d’inclusion partagent le même budget de jobs limité.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK de débogage Play. La variante tierce n’a pas de jeu de sources ni de manifeste séparé ; sa lane de tests unitaires compile tout de même la variante avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant un job de packaging d’APK de débogage dupliqué à chaque poussée pertinente pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, figée sur la dernière version de Knip, avec l’âge minimum de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers inutilisés en production de Knip avec `scripts/deadcode-unused-files.allowlist.mjs`. Le garde de fichiers inutilisés échoue lorsqu’une demande de tirage ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée périmée dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de tests live et de ponts de paquets que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il n’extrait ni n’exécute le code non fiable des demandes de tirage. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des charges utiles compactes `repository_dispatch` vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de demandes de tirage ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit lors des poussées vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits de commentaires ou de revues lorsqu’ils existent. Elle évite intentionnellement de transférer le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est une observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures courantes, modifications, bruit de bots, doublons de webhooks et trafic de revue normal doivent produire `NO_REPLY`.

Traitez les titres GitHub, commentaires, corps, textes de revue, noms de branches et messages de commit comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou l’exécution de l’agent.

## Déclenchements manuels

Les déclenchements CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque lane ciblée non Android : shards Linux Node, shards de plugins groupés, shards de contrats de plugins et de canaux, compatibilité Node 22, `check-*`, `check-additional-*`, vérifications smoke d’artefacts construits, vérifications de docs, Skills Python, Windows, macOS, build iOS et i18n de Control UI. Les déclenchements CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’orchestrateur de publication complète active Android en passant `include_android=true`. Les vérifications statiques de prépublication de plugins, le shard `agentic-plugins` réservé aux publications, le balayage complet par lot des extensions et les lanes Docker de prépublication de plugins sont exclus de la CI. La suite Docker de prépublication ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la porte de validation de publication activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de version candidate ne soit pas annulée par une autre poussée ou exécution de demande de tirage sur la même référence. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe contre une branche, une balise ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la référence de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Déclenchement CI manuel et recours pour les dépôts non canoniques, analyses qualité CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs hors CI, et précontrôle install-smoke afin que la matrice Blacksmith puisse se mettre en file plus tôt                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards d’extensions de poids inférieur, `checks-fast-core`, shards de contrats de plugins/canaux, la plupart des shards Linux Node groupés/de poids inférieur, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` sélectionnés, et `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, shards `check-additional-*` lourds en limites/extensions, et `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il n’économisait)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-26`                                                                                                                                                                                                  |

## Budget d’enregistrement des runners

Le bucket actuel d’enregistrement de runners GitHub d’OpenClaw indique 10 000
enregistrements de runners auto-hébergés par 5 minutes dans `ghx api rate_limit`. Revérifiez
`actions_runner_registration` avant chaque passe de réglage, car GitHub peut modifier
ce bucket. La limite est partagée par tous les enregistrements de runners Blacksmith dans
l’organisation `openclaw`, donc ajouter une autre installation Blacksmith n’ajoute pas
de nouveau bucket.

Traitez les labels Blacksmith comme la ressource rare pour le contrôle des pics. Les jobs qui
ne font que router, notifier, synthétiser, sélectionner des shards ou exécuter de courtes analyses CodeQL doivent
rester sur des runners hébergés par GitHub sauf s’ils ont des besoins mesurés propres à Blacksmith.
Toute nouvelle matrice Blacksmith, tout `max-parallel` plus élevé ou tout workflow haute fréquence
doit montrer son nombre d’enregistrements dans le pire cas et garder la cible au niveau organisation
sous environ 60 % du bucket live. Avec le bucket actuel de 10 000 enregistrements,
cela signifie une cible opérationnelle de 6 000 enregistrements, laissant de la marge pour
les dépôts concurrents, les reprises et le chevauchement des pics.

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut pour les exécutions normales de poussées et de demandes de tirage. `workflow_dispatch` et les exécutions de dépôts non canoniques utilisent des runners hébergés par GitHub, mais les exécutions canoniques normales ne sondent pas actuellement la santé de la file Blacksmith et ne se rabattent pas automatiquement sur des labels hébergés par GitHub lorsque Blacksmith est indisponible.

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

Le déclenchement manuel mesure normalement la référence du workflow. Définissez `target_ref` pour mesurer une étiquette de version ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` enregistre la référence/SHA testée, la référence/SHA du workflow, la référence Kova, le profil, le mode d’authentification de la voie, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une version épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime compilé localement avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-openai-candidate` : un vrai tour d’agent OpenAI `openai/gpt-5.5`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La voie mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire pour les cas de démarrage par défaut, avec hook et avec 50 Plugins ; RSS d’import des Plugins groupés, boucles répétées de salutation mock-OpenAI `channel-chat-baseline`, commandes de démarrage CLI contre le Gateway démarré, et sonde de performances smoke de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la référence testée, le résumé source compare les valeurs RSS et de tas actuelles à cette base de référence et marque les fortes hausses RSS comme `watch`. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque voie téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sondes source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la référence testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de la version

`Full Release Validation` est le workflow manuel chapeau pour « tout exécuter avant une version ». Il accepte une branche, une étiquette ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves propres à la version des Plugins/packages/statiques/Docker, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package multi-OS, le rendu de la grille de maturité depuis les preuves de profil QA, la parité QA Lab, Matrix et les voies Telegram. Les profils stable et complet incluent toujours une couverture exhaustive live/E2E et soak du chemin de version Docker ; le profil bêta peut l’activer avec `run_release_soak=true`. L’E2E Telegram canonique du package s’exécute dans Package Acceptance, donc un candidat complet ne démarre pas de poller live en double. Après publication, passez `release_package_spec` pour réutiliser le package npm publié dans les vérifications de version, Package Acceptance, Docker, multi-OS et Telegram sans reconstruire. Utilisez `npm_telegram_package_spec` uniquement pour une relance Telegram ciblée sur un package publié. La voie de package live du Plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié déduit `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions SHA/artefact packagent `extensions/codex` depuis la référence sélectionnée. Définissez explicitement `codex_plugin_spec` pour des sources de Plugin personnalisées telles que les specs `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des jobs de workflow, les différences entre profils, les artefacts et
les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel de version avec mutation. Déclenchez-le
depuis `release/YYYY.M.PATCH` ou `main` après l’existence de l’étiquette de version et après la
réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de Plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de version, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré. La publication stable exige aussi
un `windows_node_tag` exact ; le workflow vérifie la version source Windows
et compare ses installateurs x64/ARM64 avec l’entrée
`windows_node_installer_digests` approuvée par le candidat avant tout workflow enfant de publication, puis promeut
et vérifie ces mêmes condensats d’installateurs épinglés ainsi que l’actif compagnon exact
et le contrat de somme de contrôle avant de publier le brouillon de version GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche à évolution rapide, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de déclenchement de workflow GitHub doivent être des branches ou des étiquettes, pas des SHA de commit bruts. L’
assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette référence épinglée, vérifie que chaque
workflow enfant a un `headSha` correspondant à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur chapeau échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de version. Les
workflows de version manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la large matrice consultative fournisseurs/médias. Les vérifications de version
stable et complète exécutent toujours le soak exhaustif live/E2E et du chemin de version Docker ;
le profil bêta peut l’activer avec `run_release_soak=true`.

- `minimum` conserve les voies OpenAI/cœur critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseurs/médias.

Le workflow chapeau enregistre les identifiants des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute les tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et devient vert, relancez seulement le job vérificateur parent pour actualiser le résultat chapeau et le résumé des timings.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de version, `ci` pour seulement l’enfant CI complet normal, `plugin-prerelease` pour seulement l’enfant de préversion des Plugins, `release-checks` pour chaque enfant de version, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow chapeau. Cela garde la relance d’une boîte de version échouée bornée après un correctif ciblé. Pour une seule voie multi-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes multi-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent des timings par phase. Les voies QA de vérification de version sont consultatives sauf la porte de couverture standard des outils runtime, qui bloque lorsque des outils dynamiques OpenClaw requis dérivent ou disparaissent du résumé du palier standard.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact aux vérifications multi-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de version lorsque la couverture soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de version et évite de reconditionner le même candidat dans plusieurs jobs enfants. Pour la voie live du Plugin npm Codex, les vérifications de version transmettent soit une spec de Plugin publié correspondante déduite de `release_package_spec`, soit le `codex_plugin_spec` fourni par l’opérateur, soit laissent l’entrée vide afin que le script Docker package le Plugin Codex du checkout sélectionné.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow chapeau. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin qu’une validation plus récente de main
ne reste pas derrière une exécution de vérification de version obsolète de deux heures. Les validations de branche/étiquette
de version et les groupes de relance ciblée conservent `cancel-in-progress: false`.

## Éclats live et E2E

L’enfant live/E2E de version conserve une large couverture native `pnpm test:live`, mais il l’exécute sous forme d’éclats nommés via `scripts/test-live-shard.mjs` au lieu d’un job série unique :

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
- éclats média audio/vidéo séparés et éclats musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents des fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms d’éclats agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les éclats média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards de modèle/backend live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` pour chaque commit sélectionné. Le workflow de version live construit et pousse cette image une seule fois, puis les shards de modèle live Docker, de Gateway partitionné par fournisseur, de backend CLI, de liaison ACP et de harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker du Gateway portent des plafonds `timeout` explicites au niveau des scripts, inférieurs au délai d’expiration de la tâche du workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de version. Si ces shards reconstruisent indépendamment la cible Docker complète du source, l’exécution de version est mal configurée et gaspillera du temps réel sur des constructions d’image en double.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide une seule archive tarball au moyen du même harnais E2E Docker que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et affiche la source, la référence du workflow, la référence du package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive tarball, prépare les images Docker de résumé de package si nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis répartit ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; une exécution Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram optionnelle a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest`, ou une version de publication OpenClaw exacte comme `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation d’une préversion ou version stable publiée.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est joignable depuis l’historique d’une branche du dépôt ou une balise de publication, installe les dépendances dans une arborescence de travail détachée, et l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS public ; `package_sha256` est requis. Ce chemin rejette les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou IP résolues privés/internes/à usage spécial, et les redirections hors de la même politique de sécurité publique.
- `source=trusted-url` télécharge un `.tgz` HTTPS depuis une politique de source approuvée nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont requis. Utilisez ceci uniquement pour des miroirs d’entreprise appartenant aux mainteneurs ou des dépôts de packages privés qui nécessitent des hôtes, ports, préfixes de chemin, hôtes de redirection ou résolutions de réseau privé configurés. Si la politique déclare une authentification bearer, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés à l’URL sont toujours rejetés.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter une ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — morceaux complets du chemin de version Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de plugin hors ligne afin que la validation du package publié ne dépende pas de la disponibilité live de ClawHub. La voie Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tout en conservant le chemin de spécification npm publiée pour les exécutions autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, y compris les commandes locales,
les voies Docker, les entrées de Package Acceptance, les valeurs par défaut de version et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de version appellent Package Acceptance avec `source=artifact`, l’artefact de package de version préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, et `telegram_mode=mock-openai`. Cela garde la migration de package, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de plugin obsolètes, la réparation d’installation de plugin configuré, le plugin hors ligne, la mise à jour de plugin et la preuve Telegram sur la même archive tarball de package résolue. Définissez `release_package_spec` sur Full Release Validation ou OpenClaw Release Checks après la publication d’une bêta pour exécuter la même matrice contre le package npm livré sans reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque Package Acceptance nécessite un package différent du reste de la validation de version. Les vérifications de version inter-OS couvrent toujours l’intégration, l’installateur et le comportement propre à la plateforme ; la validation produit de package/mise à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une base de référence de package publiée par exécution dans le chemin de version bloquant. Dans Package Acceptance, l’archive tarball `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base de référence publiée de repli, par défaut `openclaw@latest` ; les commandes de réexécution de voie échouée préservent cette base. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la couverture aux quatre dernières versions npm stables, plus des versions de frontière de compatibilité plugin épinglées et des fixtures calquées sur des issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances de plugins hérités obsolètes. Les sélections multi-bases published-upgrade survivor sont partitionnées par base en tâches de runner Docker ciblées séparées. Le workflow distinct `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur un nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une voie unique avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la base avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, plus l’état RPC après le démarrage du Gateway. Les voies Windows de package et d’installation fraîche vérifient aussi qu’un package installé peut importer une surcharge de contrôle de navigateur depuis un chemin Windows absolu brut. Le smoke d’un tour d’agent OpenAI inter-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce drapeau ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes de la fixture git factice dérivée de l’archive tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de plugin peuvent lire les emplacements historiques d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant toujours que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut aussi émettre un avertissement pour les fichiers d’horodatage de métadonnées de build local qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les minutages de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer la validation complète de version.

## Smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de portée via sa propre tâche `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces cœur de Plugin/canal/gateway/Plugin SDK exercées par les jobs de smoke Docker. Les changements de Plugin groupé limités aux sources, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image du Dockerfile racine une fois, vérifie la CLI, exécute le smoke CLI de suppression des agents en espace de travail partagé, exécute l’e2e gateway-network du conteneur, vérifie un argument de construction d’extension groupée, et exécute le profil Docker borné des Plugins groupés sous un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve la couverture d’installation du package QR et des Docker/update de l’installateur pour les exécutions planifiées nocturnes, les lancements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image de smoke GHCR du Dockerfile racine pour le SHA cible, puis exécute l’installation du package QR, les smokes du Dockerfile racine/gateway, les smokes d’installateur/update, et l’E2E Docker rapide des Plugins groupés comme jobs séparés, afin que le travail d’installateur n’attende pas derrière les smokes de l’image racine.

Les pushs sur `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent d’installation globale Bun pour image-provider est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute lors de la planification nocturne et depuis le workflow de vérifications de release, et les lancements manuels `Install Smoke` peuvent l’activer explicitement, mais les pull requests et les pushs sur `main` ne le font pas. La CI normale des PR exécute toujours la voie de régression rapide du lanceur Bun pour les changements pertinents pour Node. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois comme tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installateur/update/dépendance de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur dans `scripts/lib/docker-e2e-plan.mjs`, et le runner exécute uniquement le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Valeur par défaut | Objectif                                                                                       |
| -------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre d’emplacements du pool principal pour les voies normales.                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre d’emplacements du pool final sensible aux fournisseurs.                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Limite de voies live concurrentes pour éviter que les fournisseurs ne limitent le débit.       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                 | Limite de voies d’installation npm concurrentes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Limite de voies multi-services concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de voies pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai d’expiration de repli par voie (120 minutes) ; certaines voies live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan du planificateur sans exécuter les voies.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. L’agrégat local effectue les précontrôles Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, persiste les durées des voies pour l’ordonnancement de la plus longue à la plus courte, et arrête par défaut de planifier de nouvelles voies mises en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, type d’image, image live, voie et identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse les images E2E Docker GHCR minimal/fonctionnel balisées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes balisées par digest de package au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai d’expiration borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique de CI.

### Segments du chemin de release

La couverture Docker de release exécute des jobs segmentés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `package-update-openai` inclut la voie live de package du Plugin Codex, qui installe le package OpenClaw candidat, installe le Plugin Codex depuis `codex_plugin_spec` ou un tarball de même référence avec approbation explicite d’installation de la CLI Codex, exécute le précontrôle de la CLI Codex, puis exécute plusieurs tours d’agent OpenClaw de même session contre OpenAI. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de Plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de relance manuelle pour les deux voies d’installateur fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un segment autonome `openwebui` uniquement pour les lancements limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les durées, `summary.json`, `failures.json`, les durées de phases, le JSON du plan du planificateur, les tableaux de voies lentes et les commandes de relance par voie. L’entrée de workflow `docker_lanes` exécute les voies sélectionnées contre les images préparées au lieu des jobs de segments, ce qui limite le débogage d’une voie échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image de test live pour cette relance. Les commandes GitHub de relance générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # télécharger les artefacts Docker et afficher les commandes de relance ciblées combinées/par voie
pnpm test:docker:timings <summary>   # résumés des voies lentes et du chemin critique des phases
```

Le workflow live/E2E planifié exécute chaque jour la suite Docker complète du chemin de release.

## Prerelease de Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé lancé par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushs sur `main` et les lancements manuels autonomes de CI gardent cette suite désactivée. Il équilibre les tests de Plugins groupés sur huit workers d’extension ; ces jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration de Plugins à la fois, avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de Plugins à nombreux imports ne créent pas de jobs CI supplémentaires. Le chemin prerelease Docker réservé aux releases groupe les voies Docker ciblées en petits groupes afin d’éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constats de l’inspecteur sont des entrées de triage et ne modifient pas la barrière bloquante Plugin Prerelease.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les larges harnais QA et de release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une large exécution de validation.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un lancement manuel ; il déploie en éventail la voie de parité simulée, la voie Matrix live, et les voies Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur simulé déterministe et des modèles qualifiés par mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence du modèle live et du démarrage normal du Plugin fournisseur. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement de mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les barrières planifiées et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un lancement manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la release avant l’approbation de release ; sa barrière de parité QA exécute les packs candidat et de référence comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves de CI/vérifications à portée limitée au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité de première passe étroit, et non le balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillons analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevée/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, ou les chemins runtime de Plugins groupés propriétaires de processus, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Référence de base pour auth, secrets, sandbox, cron et gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du core, plus le runtime du plugin de canal, le gateway, le Plugin SDK, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de stratégie SSRF du core, d’analyse IP, de garde réseau, de récupération web et du Plugin SDK                              |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et barrières d’exécution des outils d’agent                   |
| `/codeql-security-high/process-exec-boundary`     | Shell local, assistants de lancement de processus, runtimes de plugins groupés propriétaires de sous-processus et colle de scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour l’installation de Plugin, le loader, le manifeste, le registre, l’installation par gestionnaire de paquets, le chargement de source et le contrat de paquet du Plugin SDK |

### Fragments de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit l’application Android manuellement pour CodeQL sur le plus petit runner Linux Blacksmith accepté par les vérifications de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit l’application macOS manuellement pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript sans sécurité et de gravité erreur sur des surfaces étroites à forte valeur, sur des runners Linux hébergés par GitHub, afin que les scans de qualité ne consomment pas le budget d’inscription des runners Blacksmith. Son garde de pull request est intentionnellement plus petit que le profil planifié : les PR non brouillon exécutent uniquement les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant le code d’exécution des commandes/modèles/outils d’agent et de dispatch des réponses, le schéma de config/la migration/le code IO, le code auth/secrets/sandbox/sécurité, le runtime de canal du core et de plugin de canal groupé, les méthodes serveur/protocole du Gateway, le runtime mémoire/la colle SDK, MCP/processus/livraison sortante, le runtime fournisseur/catalogue de modèles, les diagnostics de session/files de livraison, le loader de plugin, le Plugin SDK/contrat de paquet, ou le runtime de réponse du Plugin SDK. Les changements de config CodeQL et de workflow qualité exécutent les douze fragments de qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’appui d’apprentissage/itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour auth, secrets, sandbox, cron et gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de config, de migration, de normalisation et d’IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du core et des plugins de canal groupés                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, dispatch modèle/fournisseur, dispatch et files de réponses automatiques, et contrats de runtime du plan de contrôle ACP                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et passerelles d’outils, assistants de supervision de processus, et contrats de livraison sortante                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK d’hôte mémoire, façades de runtime mémoire, alias de mémoire du Plugin SDK, colle d’activation du runtime mémoire et commandes doctor de mémoire             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/de bundles de logs, et contrats CLI de doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch des réponses entrantes du Plugin SDK, assistants de payload/découpage/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, auth et découverte fournisseur, enregistrement du runtime fournisseur, valeurs par défaut/catalogues fournisseur, et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats de runtime du plan de contrôle des tâches                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Récupération/recherche web du core, IO média, compréhension média, génération d’images et contrats de runtime de génération média                                 |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de loader, registre, surface publique et point d’entrée du Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté paquet du Plugin SDK et assistants de contrat de paquet de plugin                                                                             |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension de CodeQL à Swift, Python et aux plugins groupés doit être réintroduite sous forme de travail de suivi limité ou fragmenté uniquement après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex déclenchée par événement pour garder la documentation existante alignée avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur push non-bot vers `main` peut le déclencher, et un dispatch manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source de l’ancien Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage de documentation.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex déclenchée par événement pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur push non-bot vers `main` peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur suite complète, autorise Codex à effectuer uniquement de petites corrections de performance de tests préservant la couverture plutôt que de larges refactorisations, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la référence. Le rapport groupé enregistre le temps mural par config et le RSS maximum sur Linux et macOS, de sorte que la comparaison avant/après expose les deltas de mémoire de test à côté des deltas de durée. Si la référence contient des tests en échec, Codex peut corriger uniquement les échecs évidents et le rapport de suite complète après l’agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’arrive, la voie rebase le patch validé, relance `pnpm check:changed` et réessaie le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent de documentation.

### PR dupliquées après merge

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Par défaut, il s’exécute à blanc et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est mergée et que chaque doublon a soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gardes de vérification locale et routage des changements

La logique locale des voies de changements vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette garde de vérification locale est plus stricte sur les frontières d’architecture que la large portée de plateforme CI :

- les changements de production du core exécutent la vérification de types prod core et tests core, plus lint/gardes core ;
- les changements limités aux tests du core exécutent uniquement la vérification de types des tests core, plus le lint core ;
- les changements de production d’extension exécutent la vérification de types prod extension et tests extension, plus le lint extension ;
- les changements limités aux tests d’extension exécutent la vérification de types des tests extension, plus le lint extension ;
- les changements publics du Plugin SDK ou de contrat de plugin s’étendent à la vérification de types des extensions, car les extensions dépendent de ces contrats du core (les balayages d’extensions Vitest restent du travail de test explicite) ;
- les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests changés vit dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests eux-mêmes, les modifications de source préfèrent les mappages explicites, puis les tests frères et les dépendants du graphe d’import. La config partagée de livraison aux salons de groupe fait partie des mappages explicites : les changements de la config de réponse visible en groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse du core, plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large au niveau du harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de boîte distante appartenant au dépôt pour les preuves Linux des mainteneurs. Utilisez-le
depuis la racine du dépôt quand une vérification est trop large pour une boucle de modification locale, quand la
parité CI est importante, ou quand la preuve nécessite des secrets, Docker, des voies de packages,
des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est
`blacksmith-testbox`; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes Blacksmith,
les problèmes de quota ou les tests explicites sur capacité détenue.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réservent, synchronisent, exécutent, rapportent et nettoient
des Testboxes à usage unique. La vérification de cohérence de synchronisation intégrée échoue rapidement quand des fichiers racine
requis comme `pnpm-lock.yaml` disparaissent ou quand `git status --short`
affiche au moins 200 suppressions suivies. Pour les PR intentionnelles avec suppressions massives, définissez
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox termine aussi une invocation locale de la CLI Blacksmith qui reste dans la
phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur en
millisecondes plus élevée pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut de cloud détenu. Dans les worktrees Codex ou les checkouts liés/partiels, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement le wrapper node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Les exécutions adossées à Blacksmith nécessitent Crabbox 0.22.0 ou plus récent afin que le wrapper obtienne le comportement actuel de synchronisation, de file d’attente et de nettoyage des Testbox. Quand vous utilisez le checkout frère, reconstruisez le binaire local ignoré avant tout travail de chronométrage ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Pour les exécutions
Blacksmith Testbox déléguées, le code de sortie du wrapper Crabbox et le résumé JSON sont le
résultat de la commande. L’exécution GitHub Actions liée possède l’hydratation et le keepalive ; elle
peut se terminer avec `cancelled` quand la Testbox est arrêtée de l’extérieur après que la commande SSH
a déjà renvoyé son résultat. Traitez cela comme un artefact de nettoyage/statut sauf si
le `exitCode` du wrapper est non nul ou si la sortie de commande montre un test échoué.
Les exécutions Crabbox ponctuelles adossées à Blacksmith doivent arrêter la Testbox automatiquement ;
si une exécution est interrompue ou si le nettoyage n’est pas clair, inspectez les boîtes actives et n’arrêtez que
les boîtes que vous avez créées :

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

Si Crabbox est la couche cassée mais que Blacksmith lui-même fonctionne, utilisez Blacksmith
directement uniquement pour des diagnostics comme `list`, `status` et le nettoyage. Corrigez le
chemin Crabbox avant de traiter une exécution Blacksmith directe comme preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux
préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes,
traitez cela comme une pression liée au fournisseur Blacksmith, à la file d’attente, à la facturation ou aux limites d’organisation. Arrêtez les
identifiants en file d’attente que vous avez créés, évitez de démarrer d’autres Testboxes et déplacez la preuve vers le
chemin de capacité Crabbox détenue ci-dessous pendant que quelqu’un vérifie le tableau de bord Blacksmith,
la facturation et les limites d’organisation.

N’escaladez vers la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou que la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite vraiment un CPU de classe 48xlarge. Une requête `beast` démarre à 192 vCPU et constitue le moyen le plus simple de heurter un quota régional EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` appartenant au dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true` afin que les baux AWS négociés affichent la région/le marché sélectionné, la pression sur les quotas, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` seulement après que standard/fast ne suffisent pas, et `beast` uniquement pour des voies exceptionnelles liées au CPU, comme la suite complète ou les matrices Docker de tous les plugins, la validation explicite de release/bloqueur, ou le profilage de performance à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, le travail docs-only, les lint/typecheck ordinaires, les petites reproductions E2E ou le triage de panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que l’instabilité du marché Spot ne soit pas mêlée au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission de l’environnement non secret pour les commandes `crabbox run --id <cbx_id>` sur cloud détenu.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

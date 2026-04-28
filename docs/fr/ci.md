---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, filtres de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:24:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

La CI s’exécute à chaque push vers `main` et pour chaque pull request. Elle utilise un filtrage intelligent de portée pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les changements PR correspondants et sur
déclenchement manuel ; il construit le runtime QA privé et compare les packs agentiques
mock GPT-5.5 et Opus 4.6. Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur
déclenchement manuel ; il répartit en jobs parallèles la parity gate mock, la lane Matrix live, et la lane Telegram live. Les jobs live utilisent l’environnement `qa-live-shared`,
et la lane Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également ces mêmes lanes QA Lab avant l’approbation de release.

Le workflow `Duplicate PRs After Merge` est un workflow manuel réservé aux mainteneurs pour le
nettoyage des doublons après fusion. Il utilise par défaut le mode dry-run et ne ferme
que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la
PR fusionnée est bien mergée et que chaque doublon a soit une issue référencée en commun,
soit des hunks modifiés qui se chevauchent.

Le workflow `Docs Agent` est une lane de maintenance Codex pilotée par événements pour maintenir
la documentation existante alignée sur les changements récemment fusionnés. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur `main` peut le déclencher, et un déclenchement manuel peut
l’exécuter directement. Les invocations `workflow_run` sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée au cours de la dernière heure. Lorsqu’il s’exécute, il
examine la plage de commits allant du SHA source du précédent Docs Agent non ignoré jusqu’au
`main` actuel ; une exécution horaire peut donc couvrir tous les changements sur `main`
accumulés depuis le dernier passage docs.

Le workflow `Test Performance Agent` est une lane de maintenance Codex pilotée par événements
pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non-bot sur
`main` peut le déclencher, mais il est ignoré si une autre invocation `workflow_run` a déjà
été exécutée ou est en cours ce jour UTC-là. Un déclenchement manuel contourne cette
barrière d’activité quotidienne. La lane construit un rapport complet de performance Vitest
groupé sur toute la suite, laisse Codex effectuer uniquement de petites corrections de performance des tests préservant la couverture au lieu de refactorings larges, puis réexécute le rapport complet et rejette les changements qui réduisent le nombre de tests réussis de référence. Si la référence comporte des tests en échec, Codex peut corriger uniquement les échecs évidents et le rapport complet après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’arrive, la lane
rebase le patch validé, réexécute `pnpm check:changed`, et retente le push ;
les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex
puisse conserver la même posture de sécurité sans `sudo` que le docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PR non-brouillon |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushs et PR non-brouillon |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances contre les avis npm                         | Toujours sur les pushs et PR non-brouillon |
| `security-fast`                  | Agrégat requis pour les jobs rapides de sécurité                                             | Toujours sur les pushs et PR non-brouillon |
| `build-artifacts`                | Construire `dist/`, Control UI, vérifier les artefacts construits, et produire des artefacts réutilisables en aval | Changements liés à Node               |
| `checks-fast-core`               | Lanes rapides de validation Linux comme les vérifications bundled/plugin-contract/protocol   | Changements liés à Node               |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat d’agrégat stable             | Changements liés à Node               |
| `checks-node-extensions`         | Shards complets de tests des Plugins intégrés sur toute la suite d’extensions                | Changements liés à Node               |
| `checks-node-core-test`          | Shards de tests Node du noyau, hors lanes de canaux, intégrées, contrats et extensions      | Changements liés à Node               |
| `extension-fast`                 | Tests ciblés uniquement pour les Plugins intégrés modifiés                                   | Pull requests avec changements d’extension |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, guards, types de test, et smoke strict | Changements liés à Node               |
| `check-additional`               | Architecture, frontières, guards de surface d’extension, frontières de packages, et shards gateway-watch | Changements liés à Node               |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke mémoire au démarrage                               | Changements liés à Node               |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus compatibilité Node 22 sur push uniquement | Changements liés à Node               |
| `check-docs`                     | Formatage docs, lint, et vérification des liens cassés                                       | Documentation modifiée                |
| `skills-python`                  | Ruff + pytest pour les Skills basées sur Python                                              | Changements liés aux Skills Python    |
| `checks-windows`                 | Lanes de test spécifiques à Windows                                                          | Changements liés à Windows            |
| `macos-node`                     | Lane de tests TypeScript sur macOS utilisant les artefacts construits partagés               | Changements liés à macOS              |
| `macos-swift`                    | Lint, build, et tests Swift pour l’app macOS                                                 | Changements liés à macOS              |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build APK debug                      | Changements liés à Android            |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité approuvée                  | Succès de la CI sur main ou déclenchement manuel |

## Ordre fail-fast

Les jobs sont ordonnés pour que les vérifications peu coûteuses échouent avant le lancement des plus coûteuses :

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, pas à des jobs distincts.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice de plateforme et d’artefacts.
3. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateforme et de runtime se répartissent ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications des workflows CI valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements dans les sources de ces plateformes.
Les modifications limitées au routage CI, certaines modifications sélectionnées et peu coûteuses de fixtures de tests du noyau, ainsi que les modifications ciblées d’aides de plugin contract ou de routage de tests, utilisent un chemin de manifeste rapide Node-only : preflight, sécurité, et une seule tâche `checks-fast-core`. Ce chemin évite les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards complets du noyau, les shards de Plugins intégrés, ainsi que les matrices de guards supplémentaires lorsque les fichiers modifiés sont limités aux surfaces de routage ou d’aide directement exercées par cette tâche rapide.
Les vérifications Node Windows sont limitées aux wrappers Windows spécifiques pour processus/chemins, aux aides d’exécution npm/pnpm/UI, à la configuration du gestionnaire de paquets, et aux surfaces de workflow CI qui exécutent cette lane ; les changements non liés dans les sources, Plugins, install-smoke et tests-only restent sur les lanes Node Linux afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les shards de test normaux.
Le workflow distinct `install-smoke` réutilise le même script de portée via son propre job `preflight`. Il sépare la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`. Les pull requests exécutent le chemin rapide pour les surfaces Docker/package, les changements de package/manifeste des Plugins intégrés, et les surfaces principales plugin/channel/Gateway/Plugin SDK exercées par les jobs Docker smoke. Les changements source-only de Plugins intégrés, les modifications tests-only et les modifications docs-only ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI `agents delete shared-workspace`, exécute l’e2e `container gateway-network`, vérifie un argument de build d’extension intégrée, et exécute le profil Docker de Plugin intégré borné avec un délai d’attente agrégé de commande de 240 secondes, chaque scénario ayant son propre plafond de `docker run`. Le chemin complet conserve la couverture d’installation de package QR et d’installer Docker/update pour les exécutions nocturnes planifiées, les déclenchements manuels, les vérifications de release par workflow-call, et les pull requests qui touchent réellement les surfaces installer/package/Docker. Les pushs vers `main`, y compris les commits de fusion, ne forcent pas le chemin complet ; lorsque la logique changed-scope demanderait une couverture complète sur un push, le workflow conserve le Docker smoke rapide et laisse l’install smoke complet à la validation nocturne ou de release. Le smoke lent du fournisseur d’images `Bun global install` est contrôlé séparément par `run_bun_global_install_smoke` ; il s’exécute dans la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels `install-smoke` peuvent l’inclure explicitement, mais les pull requests et les pushs vers `main` ne l’exécutent pas. Les tests Docker QR et installer conservent leurs propres Dockerfiles orientés installation. En local, `test:docker:all` préconstruit une image live-test partagée et une image built-app partagée `scripts/e2e/Dockerfile`, puis exécute les lanes smoke live/E2E avec un ordonnanceur pondéré et `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le nombre par défaut de slots du pool principal de 10 avec `OPENCLAW_DOCKER_ALL_PARALLELISM` et le nombre de slots du tail-pool sensible au fournisseur de 10 avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Les plafonds des lanes lourdes sont par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` afin que les lanes d’installation npm et multi-service ne surchargent pas Docker pendant que les lanes plus légères remplissent encore les slots disponibles. Le démarrage des lanes est décalé de 2 secondes par défaut pour éviter les tempêtes locales de création du démon Docker ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou une autre valeur en millisecondes. L’agrégat local vérifie Docker en préflight, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives, conserve les durées des lanes pour un ordonnancement du plus long au plus court, et prend en charge `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour l’inspection de l’ordonnanceur. Il arrête par défaut de planifier de nouvelles lanes mutualisées après le premier échec, et chaque lane a un délai de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines lanes live/tail sélectionnées utilisent des plafonds plus serrés par lane. Le workflow réutilisable live/E2E reproduit le modèle d’image partagée en construisant et en poussant une image Docker E2E GHCR taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow live/E2E planifié exécute chaque jour la suite Docker complète du chemin de release. La matrice de mise à jour intégrée est divisée par cible de mise à jour afin que les passages répétés de `npm update` et de réparation doctor puissent être shardés avec d’autres vérifications intégrées.

La logique locale des lanes modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette gate locale est plus stricte sur les frontières d’architecture que la large portée CI de plateforme : les changements de production du noyau exécutent la vérification de types prod du noyau plus les tests du noyau, les changements du noyau limités aux tests n’exécutent que la vérification de types/tests du noyau pour tests, les changements de production d’extension exécutent la vérification de types prod des extensions plus les tests d’extension, et les changements d’extension limités aux tests n’exécutent que la vérification de types/tests des extensions pour tests. Les changements publics de Plugin SDK ou de plugin contract étendent la validation aux extensions parce que les extensions dépendent de ces contrats du noyau. Les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine. Les changements inconnus à la racine ou dans la configuration échouent en mode sûr vers toutes les lanes.

Sur les pushs, la matrice `checks` ajoute la lane `compat-node22` réservée aux pushs. Sur les pull requests, cette lane est ignorée et la matrice reste concentrée sur les lanes normales de test/canal.

Les familles de tests Node les plus lentes sont divisées ou équilibrées pour que chaque job reste petit sans sur-réserver de runners : les contrats de canaux s’exécutent sous forme de trois shards pondérés, les tests des Plugins intégrés sont équilibrés sur six workers d’extension, les petites lanes unitaires du noyau sont appariées, auto-reply s’exécute sur quatre workers équilibrés avec l’arborescence reply divisée en shards agent-runner, dispatch, et commands/state-routing, et les configurations Gateway/plugin agentiques sont réparties sur les jobs Node agentiques existants source-only au lieu d’attendre les artefacts construits. Les larges suites browser, QA, média, et divers tests de Plugins utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des Plugins. Les jobs shard d’extension exécutent jusqu’à deux groupes de config de plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de Plugins lourds à l’importation ne créent pas de jobs CI supplémentaires. La large lane agents utilise l’ordonnanceur parallèle par fichier Vitest partagé parce qu’elle est dominée par l’importation/l’ordonnancement plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le shard infra core-runtime pour éviter que le shard runtime partagé ne porte toute la queue. Les shards à motif d’inclusion enregistrent des entrées de durée en utilisant le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config complète d’un shard filtré. `check-additional` regroupe les travaux package-boundary compile/canary et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard boundary guard exécute ses petits guards indépendants en parallèle au sein d’un même job. Gateway watch, les tests de canaux, et le shard core support-boundary s’exécutent en parallèle à l’intérieur de `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits, en conservant leurs anciens noms de check comme jobs de vérification légers tout en évitant deux workers Blacksmith supplémentaires et une seconde file de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a ni source set ni manifeste séparés ; sa lane de tests unitaires compile tout de même cette variante avec les indicateurs SMS/call-log de BuildConfig, tout en évitant un job de packaging APK debug en doublon à chaque push pertinent pour Android.
`extension-fast` est réservé aux PR car les exécutions sur push exécutent déjà les shards complets des Plugins intégrés. Cela conserve un retour rapide sur les Plugins modifiés pendant les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour cette même ref échoue aussi. Les checks agrégés de shard utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux de shard, sans toutefois se mettre en file après que l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file n’empêche pas indéfiniment les nouvelles exécutions sur `main`.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs rapides de sécurité et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/intégrées, vérifications shardées des contrats de canaux, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight d’install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse entrer en file plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Node Linux, shards de tests de Plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font économiser ; builds Docker install-smoke, où le coût du temps de file d’attente à 32 vCPU était supérieur au gain obtenu                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des lanes modifiées pour origin/main...HEAD
pnpm check:changed   # gate locale intelligente : typecheck/lint/tests modifiés par lane de frontière
pnpm check          # gate locale rapide : tsgo de production + lint shardé + guards rapides parallèles
pnpm check:test-types
pnpm check:timed    # même gate avec timings par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + liens cassés
pnpm build          # construire dist quand les lanes CI artifact/build-smoke sont pertinentes
pnpm ci:timings                               # résumer la dernière exécution CI de push origin/main
pnpm ci:timings:recent                        # comparer les exécutions CI main récentes réussies
node scripts/ci-run-timings.mjs <run-id>      # résumer la durée murale, le temps de file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --latest-main # ignorer le bruit des issues/commentaires et choisir la CI de push origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions main récentes réussies
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

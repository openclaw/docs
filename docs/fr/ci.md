---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, contrôles de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-25T13:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

La CI s’exécute sur chaque push vers `main` et sur chaque pull request. Elle utilise une portée intelligente pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les changements de PR correspondants et sur déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques simulés GPT-5.4 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur
déclenchement manuel ; il répartit en jobs parallèles le parity gate simulé, la voie Matrix live et la voie
Telegram live. Les jobs live utilisent l’environnement `qa-live-shared`,
et la voie Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également les mêmes voies QA Lab avant l’approbation de publication.

Le workflow `Duplicate PRs After Merge` est un workflow manuel de maintenance pour
le nettoyage des doublons après fusion. Il utilise par défaut le mode dry-run et ne ferme que les PR
explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR
fusionnée est bien mergée et que chaque doublon a soit une issue référencée commune,
soit des hunks modifiés qui se chevauchent.

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour maintenir
la documentation existante alignée avec les changements récemment fusionnés. Il n’a pas de planification pure :
une exécution CI réussie sur `main` après un push non effectué par un bot peut le déclencher,
et un déclenchement manuel peut l’exécuter directement. Les invocations via workflow-run sont ignorées si
`main` a déjà avancé ou si une autre exécution de Docs Agent non ignorée a été créée dans la dernière heure.
Lorsqu’il s’exécute, il examine l’intervalle de commits entre le SHA source du précédent Docs Agent non ignoré et
le `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements sur `main`
accumulés depuis le dernier passage sur la documentation.

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements
pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main`
après un push non effectué par un bot peut le déclencher, mais il est ignoré si une autre invocation workflow-run
a déjà été exécutée ou est en cours ce jour UTC-là. Le déclenchement manuel contourne
ce contrôle d’activité quotidienne. Cette voie construit un rapport complet de performance Vitest
regroupé, permet à Codex d’apporter uniquement de petites corrections de performance des tests
préservant la couverture plutôt que de larges refactorisations, puis relance le rapport complet
et rejette les changements qui réduisent le nombre de tests réussis de référence. Si la référence
contient des tests en échec, Codex peut corriger uniquement les échecs évidents et le rapport
complet après action de l’agent doit réussir avant tout commit. Lorsque `main` avance avant que le push
du bot soit fusionné, la voie rebase le correctif validé, relance `pnpm check:changed`,
et réessaie le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex
puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances face aux avis npm                           | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`                | Construire `dist/`, l’UI de contrôle, les vérifications d’artefacts construits et les artefacts réutilisables pour l’aval | Changements liés à Node              |
| `checks-fast-core`               | Voies Linux rapides de correction comme les vérifications bundled/plugin-contract/protocol   | Changements liés à Node              |
| `checks-fast-contracts-channels` | Vérifications de contrats de canaux fragmentées avec un résultat d’agrégation stable         | Changements liés à Node              |
| `checks-node-extensions`         | Fragments complets de tests de plugins intégrés sur l’ensemble de la suite d’extensions      | Changements liés à Node              |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors voies channel, bundled, contract et extension          | Changements liés à Node              |
| `extension-fast`                 | Tests ciblés pour les seuls plugins intégrés modifiés                                        | Pull requests avec changements d’extension |
| `check`                          | Équivalent principal local fragmenté : types prod, lint, gardes, types de test et smoke strict | Changements liés à Node              |
| `check-additional`               | Garde-fous d’architecture, de frontières, de surface d’extension, de frontières de package et fragments gateway-watch | Changements liés à Node              |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                            | Changements liés à Node              |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus compatibilité Node 22 uniquement sur push | Changements liés à Node              |
| `check-docs`                     | Formatage de la documentation, lint et vérifications de liens cassés                         | Documentation modifiée               |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements liés aux Skills Python   |
| `checks-windows`                 | Voies de tests spécifiques à Windows                                                         | Changements liés à Windows           |
| `macos-node`                     | Voie de tests TypeScript sur macOS utilisant les artefacts construits partagés               | Changements liés à macOS             |
| `macos-swift`                    | Lint Swift, build et tests pour l’application macOS                                          | Changements liés à macOS             |
| `android`                        | Tests unitaires Android pour les deux variantes plus une build APK debug                     | Changements liés à Android           |
| `test-performance-agent`         | Optimisation quotidienne Codex des tests lents après activité de confiance                   | Succès de la CI main ou déclenchement manuel |

## Ordre fail-fast

Les jobs sont ordonnés de sorte que les vérifications peu coûteuses échouent avant le lancement des plus coûteuses :

1. `preflight` décide quelles voies existent tout court. La logique `docs-scope` et `changed-scope` correspond à des étapes à l’intérieur de ce job, et non à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice de plateforme et d’artefacts.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que la build partagée est prête.
4. Les voies plus lourdes de plateforme et de runtime se répartissent ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` uniquement pour les PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais n’imposent pas à elles seules des builds natives Windows, Android ou macOS ; ces voies de plateforme restent limitées aux changements dans les sources de la plateforme.
Les modifications limitées au routage CI, certaines modifications choisies et peu coûteuses de fixtures de tests du cœur, ainsi que les modifications étroites d’assistants de contrats de Plugin/de routage de tests utilisent un chemin de manifeste Node rapide : preflight, sécurité, et une seule tâche `checks-fast-core`. Ce chemin évite les artefacts de build, la compatibilité Node 22, les contrats de canaux, les fragments complets du cœur, les fragments de plugins intégrés et les matrices de garde supplémentaires lorsque les fichiers modifiés sont limités aux surfaces de routage ou d’assistance que la tâche rapide exerce directement.
Les vérifications Node Windows sont limitées aux wrappers Windows spécifiques aux processus/chemins, aux assistants d’exécution npm/pnpm/UI, à la configuration du gestionnaire de paquets et aux surfaces de workflow CI qui exécutent cette voie ; les changements non liés dans les sources, les plugins, install-smoke et les tests uniquement restent sur les voies Linux Node afin de ne pas réserver un worker Windows à 16 vCPU pour une couverture déjà exercée par les fragments de test normaux.
Le workflow `install-smoke` séparé réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`. Les pull requests exécutent le chemin rapide pour les surfaces Docker/package, les changements de package/manifest de plugins intégrés et les surfaces du cœur plugin/channel/Gateway/Plugin SDK que les jobs Docker smoke exercent. Les changements source uniquement dans les plugins intégrés, les modifications de test uniquement et les modifications docs uniquement ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le smoke CLI agents delete shared-workspace, exécute l’e2e gateway-network du conteneur, vérifie un argument de build d’extension intégrée, et exécute le profil Docker de plugin intégré borné sous un délai cumulé de commande de 240 secondes avec un plafond séparé pour chaque exécution Docker de scénario. Le chemin complet conserve l’installation de package QR et la couverture installateur Docker/update pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de publication workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. Les pushes vers `main`, y compris les commits de fusion, n’imposent pas le chemin complet ; lorsque la logique changed-scope demanderait une couverture complète sur un push, le workflow conserve le Docker smoke rapide et laisse le full install smoke à la validation nocturne ou de publication. Le smoke lent du fournisseur d’image Bun global install est contrôlé séparément par `run_bun_global_install_smoke` ; il s’exécute sur le planning nocturne et depuis le workflow de vérifications de publication, et les déclenchements manuels `install-smoke` peuvent l’activer, mais les pull requests et les pushes vers `main` ne l’exécutent pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles orientés installation. En local, `test:docker:all` préconstruit une image live-test partagée et une image built-app partagée `scripts/e2e/Dockerfile`, puis exécute les voies smoke live/E2E avec un ordonnanceur pondéré et `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le nombre de slots par défaut du pool principal de 10 avec `OPENCLAW_DOCKER_ALL_PARALLELISM` et le nombre de slots du pool final sensible au fournisseur de 10 avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Les plafonds des voies lourdes sont par défaut `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` et `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` afin que les voies npm install et multi-service ne surengagent pas Docker tandis que les voies plus légères remplissent encore les slots disponibles. Les démarrages de voie sont échelonnés de 2 secondes par défaut pour éviter les tempêtes locales de création du daemon Docker ; remplacez avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou une autre valeur en millisecondes. L’agrégat local exécute un preflight sur Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet le statut des voies actives, persiste les durées des voies pour un ordonnancement du plus long au plus court, et prend en charge `OPENCLAW_DOCKER_ALL_DRY_RUN=1` pour l’inspection de l’ordonnanceur. Il arrête par défaut de planifier de nouvelles voies mutualisées après le premier échec, et chaque voie a un délai de secours de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ; certaines voies live/finales sélectionnées utilisent des plafonds plus serrés par voie. Le workflow live/E2E réutilisable reproduit le modèle d’image partagée en construisant et en poussant une image Docker E2E GHCR taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication. La matrice bundled update est divisée par cible de mise à jour afin que les passes répétées npm update et doctor repair puissent être fragmentées avec d’autres vérifications bundled.

La logique locale des changed-lanes se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte sur les frontières d’architecture que la large portée CI des plateformes : les changements de production du cœur exécutent le typecheck prod du cœur plus les tests du cœur, les changements uniquement dans les tests du cœur n’exécutent que le typecheck/tests des tests du cœur, les changements de production d’extension exécutent le typecheck prod des extensions plus les tests des extensions, et les changements uniquement dans les tests d’extension n’exécutent que le typecheck/tests des tests d’extension. Les changements sur le Plugin SDK public ou les contrats de Plugin étendent la validation aux extensions parce que les extensions dépendent de ces contrats du cœur. Les hausses de version limitées aux métadonnées de publication exécutent des vérifications ciblées de version/config/dépendances racine. Les changements inconnus dans la racine/configuration échouent en mode prudent vers toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22`, réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de tests/canaux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver les runners : les contrats de canaux s’exécutent comme trois fragments pondérés, les tests de plugins intégrés sont équilibrés sur six workers d’extension, les petites voies unitaires du cœur sont appariées, auto-reply s’exécute sur trois workers équilibrés au lieu de six petits workers, et les configurations gateway/plugin agentiques sont réparties sur les jobs Node agentiques existants source-only au lieu d’attendre des artefacts construits. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé pour plugins. Les jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un heap Node plus grand, afin que les lots de plugins à fortes importations ne créent pas de jobs CI supplémentaires. La large voie agents utilise l’ordonnanceur parallèle par fichier Vitest partagé parce qu’elle est dominée par l’importation/l’ordonnancement plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le fragment infra core-runtime afin d’éviter que le fragment runtime partagé ne porte la fin de file. `check-additional` garde ensemble le travail compile/canary des frontières de package et sépare l’architecture de topologie runtime de la couverture gateway watch ; le fragment boundary guard exécute simultanément ses petits garde-fous indépendants dans un seul job. Gateway watch, les tests de canaux et le fragment core support-boundary s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits, en conservant leurs anciens noms de vérification comme jobs de vérification légers tout en évitant deux workers Blacksmith supplémentaires et une seconde file de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a pas de source set ni de manifest séparés ; sa voie de tests unitaires compile tout de même cette variante avec les indicateurs SMS/call-log de BuildConfig, tout en évitant un job de packaging APK debug dupliqué sur chaque push lié à Android.
`extension-fast` est réservé aux PR car les exécutions sur push lancent déjà les fragments complets de plugins intégrés. Cela permet un retour rapide sur les plugins modifiés pendant les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même ref `main`. Traitez cela comme du bruit CI sauf si la plus récente exécution pour la même ref échoue également. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin qu’elles signalent toujours les échecs normaux des fragments mais ne se mettent pas en file après que l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions sur `main`.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et leurs agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides protocol/contract/bundled, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégation des tests Node, vérifications de la documentation, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse entrer en file plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent ; builds Docker install-smoke, où le coût du temps de file d’attente en 32 vCPU était supérieur au gain réalisé                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des changed-lanes pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par voie de frontière
pnpm check          # porte locale rapide : tsgo de production + lint fragmenté + garde-fous rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même porte avec durées par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont pertinentes
node scripts/ci-run-timings.mjs <run-id>      # résumer la durée totale, le temps de file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --recent 10   # comparer les récentes exécutions CI réussies sur main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de publication](/fr/install/development-channels)

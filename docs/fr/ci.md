---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non.
    - Vous déboguez des vérifications GitHub Actions en échec.
summary: Graphe des jobs CI, portes de portée et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

Le CI s’exécute sur chaque push vers `main` et sur chaque pull request. Il utilise une portée intelligente pour ignorer les jobs coûteux lorsque seules des zones sans rapport ont changé.

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les modifications de PR correspondantes et sur déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques simulés GPT-5.4 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur
déclenchement manuel ; il répartit en jobs parallèles la parity gate simulée, la lane Matrix live et la lane Telegram live.
Les jobs live utilisent l’environnement `qa-live-shared`,
et la lane Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également les mêmes lanes QA Lab avant l’approbation de la release.

Le workflow `Duplicate PRs After Merge` est un workflow manuel de maintenance pour
le nettoyage des doublons après intégration. Il utilise le mode dry-run par défaut et ne ferme
que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub,
il vérifie que la PR intégrée est bien fusionnée et que chaque doublon a soit une issue référencée commune,
soit des hunks modifiés qui se chevauchent.

Le workflow `Docs Agent` est une lane de maintenance Codex pilotée par événements pour maintenir
la documentation existante alignée avec les changements récemment intégrés. Il n’a pas de planification pure :
une exécution CI réussie sur `main` issue d’un push non-bot peut le déclencher,
et un déclenchement manuel peut l’exécuter directement. Les invocations via workflow-run sont ignorées si
`main` a déjà avancé ou si une autre exécution Docs Agent non ignorée a été créée dans la dernière heure.
Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au
`main` actuel ; ainsi, une exécution horaire peut couvrir tous les changements de `main`
accumulés depuis le dernier passage docs.

Le workflow `Test Performance Agent` est une lane de maintenance Codex pilotée par événements
pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main`
issue d’un push non-bot peut le déclencher, mais il est ignoré si une autre invocation workflow-run
s’est déjà exécutée ou est en cours ce jour UTC. Un déclenchement manuel contourne cette
porte d’activité quotidienne. La lane construit un rapport de performance Vitest groupé de la suite complète,
laisse Codex apporter uniquement de petites corrections de performance des tests préservant la couverture plutôt que de larges
refactorings, puis relance le rapport de suite complète et rejette les changements qui réduisent
le nombre de tests de référence réussis. Si la référence comporte des tests en échec, Codex
ne peut corriger que les échecs évidents et le rapport complet après intervention de l’agent doit réussir avant
qu’un quelconque commit soit effectué. Lorsque `main` avance avant que le push du bot n’atterrisse,
la lane rebase le patch validé, relance `pnpm check:changed`, puis réessaie le push ;
les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex
puisse conserver la même posture de sécurité sans sudo que l’agent docs.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées et construire le manifeste CI | Toujours sur les pushs et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushs et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances contre les avis npm                         | Toujours sur les pushs et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les pushs et PR non brouillons |
| `build-artifacts`                | Construire `dist/`, l’interface Control UI, les vérifications d’artefacts construits et les artefacts réutilisables en aval | Changements pertinents pour Node      |
| `checks-fast-core`               | Lanes de correction Linux rapides, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node      |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat agrégé stable                 | Changements pertinents pour Node      |
| `checks-node-extensions`         | Shards de tests complets des plugins groupés sur toute la suite d’extensions                 | Changements pertinents pour Node      |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors lanes canal, groupées, contrat et extension               | Changements pertinents pour Node      |
| `extension-fast`                 | Tests ciblés pour les seuls plugins groupés modifiés                                         | Pull requests avec changements d’extension |
| `check`                          | Équivalent de la porte locale principale shardée : types prod, lint, gardes, types de test et smoke strict | Changements pertinents pour Node      |
| `check-additional`               | Shards architecture, limites, gardes de surface d’extension, limites de package et gateway-watch | Changements pertinents pour Node      |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke mémoire au démarrage                               | Changements pertinents pour Node      |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus compatibilité Node 22 uniquement sur push | Changements pertinents pour Node      |
| `check-docs`                     | Vérifications de formatage docs, lint et liens cassés                                        | Docs modifiées                        |
| `skills-python`                  | Ruff + pytest pour les Skills basées sur Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Lanes de tests spécifiques à Windows                                                         | Changements pertinents pour Windows   |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                   | Changements pertinents pour macOS     |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS     |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build APK debug                      | Changements pertinents pour Android   |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité de confiance               | Succès du CI principal ou déclenchement manuel |

## Ordre fail-fast

Les jobs sont ordonnés de façon à ce que les vérifications peu coûteuses échouent avant le lancement des jobs plus coûteux :

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes à l’intérieur de ce job, pas à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice artefacts et plateformes.
3. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Ensuite, les lanes plus lourdes de plateforme et de runtime se répartissent : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements de sources propres à la plateforme.
Les vérifications Node Windows sont limitées aux wrappers spécifiques à Windows pour les processus et chemins, aux helpers npm/pnpm/UI runner, à la configuration du gestionnaire de paquets et aux surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport dans le code source, les plugins, le smoke d’installation et les tests uniquement restent sur les lanes Node Linux afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les shards de tests normaux.
Le workflow séparé `install-smoke` réutilise le même script de portée via son propre job `preflight`. Il scinde la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`. Les pull requests exécutent le chemin rapide pour les surfaces Docker/package, les changements de package/manifeste de plugins groupés et les surfaces cœur plugin/channel/gateway/Plugin SDK que les jobs Docker smoke exercent. Les changements limités au code source de plugins groupés, les modifications de tests uniquement et les modifications de documentation uniquement ne réservent pas de workers Docker. Le chemin rapide construit une seule fois l’image du Dockerfile racine, vérifie la CLI, exécute l’e2e container gateway-network, vérifie un build arg d’extension groupée et exécute le profil Docker de plugin groupé borné avec un timeout de commande de 120 secondes. Le chemin complet conserve l’installation du package QR ainsi que la couverture installer Docker/update pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement les surfaces installer/package/Docker. Les pushs sur `main`, y compris les merge commits, ne forcent pas le chemin complet ; lorsque la logique changed-scope demanderait une couverture complète sur un push, le workflow conserve le Docker smoke rapide et laisse le smoke d’installation complet à la validation nocturne ou de release. Le smoke lent du fournisseur d’images d’installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke` ; il s’exécute selon la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `install-smoke` peuvent l’activer, mais les pull requests et les pushs sur `main` ne l’exécutent pas. Les tests Docker QR et installer conservent leurs propres Dockerfiles orientés installation. En local, `test:docker:all` préconstruit une image partagée pour les tests live et une image applicative partagée construite depuis `scripts/e2e/Dockerfile`, puis exécute en parallèle les lanes smoke live/E2E avec `OPENCLAW_SKIP_DOCKER_BUILD=1` ; réglez la concurrence par défaut du pool principal de 8 avec `OPENCLAW_DOCKER_ALL_PARALLELISM` et la concurrence du pool final sensible au fournisseur de 8 avec `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Le démarrage des lanes est échelonné de 2 secondes par défaut pour éviter les tempêtes locales de création du daemon Docker ; remplacez cela avec `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` ou une autre valeur en millisecondes. L’agrégat local cesse de planifier de nouvelles lanes groupées après le premier échec par défaut, et chaque lane a un timeout de 120 minutes remplaçable via `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Le workflow réutilisable live/E2E reproduit le modèle d’image partagée en construisant et en poussant une image Docker E2E GHCR taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow planifié live/E2E exécute chaque jour la suite Docker complète du chemin de release. La matrice complète de mise à jour groupée/canal reste manuelle/suite complète, car elle effectue des passages répétés réels de mise à jour npm et de réparation doctor.

La logique locale des lanes modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte sur les limites d’architecture que la large portée CI par plateforme : les changements de production du cœur exécutent le typecheck prod du cœur plus les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production des extensions exécutent le typecheck prod des extensions plus les tests des extensions, et les changements limités aux tests des extensions n’exécutent que le typecheck/tests des extensions. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions, car les extensions dépendent de ces contrats du cœur. Les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine. Les changements inconnus à la racine ou dans la configuration échouent de manière sécurisée vers toutes les lanes.

Sur les pushs, la matrice `checks` ajoute la lane `compat-node22`, uniquement sur push. Sur les pull requests, cette lane est ignorée et la matrice reste concentrée sur les lanes normales de test/canal.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver les runners : les contrats de canaux s’exécutent en trois shards pondérés, les tests de plugins groupés sont équilibrés sur six workers d’extension, les petites lanes unitaires du cœur sont appariées, auto-reply s’exécute sur trois workers équilibrés au lieu de six petits workers, et les configurations agentiques gateway/plugin sont réparties sur les jobs Node agentiques existants limités au code source au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé pour plugins. Les jobs de shards d’extension exécutent les groupes de configuration de plugins en série avec un seul worker Vitest et un tas Node plus grand afin que les lots de plugins lourds à l’import ne surchargent pas les petits runners CI. La large lane agents utilise le planificateur parallèle par fichier Vitest partagé, car elle est dominée par les imports et l’ordonnancement plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le shard infra core-runtime afin d’éviter que le shard runtime partagé ne porte la traîne. `check-additional` conserve ensemble le travail de compilation/canary sur les limites de package et sépare l’architecture de topologie du runtime de la couverture gateway watch ; le shard boundary guard exécute ses petits gardes indépendants en concurrence à l’intérieur d’un même job. Gateway watch, les tests de canaux et le shard core support-boundary s’exécutent en concurrence dans `build-artifacts` une fois que `dist/` et `dist-runtime/` sont déjà construits, en conservant leurs anciens noms de vérification comme jobs vérificateurs légers tout en évitant deux workers Blacksmith supplémentaires et une seconde file d’attente de consommateurs d’artefacts.
Le CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a ni source set ni manifeste séparés ; sa lane de tests unitaires compile tout de même cette variante avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug dupliqué sur chaque push pertinent pour Android.
`extension-fast` est réservé aux PR car les exécutions sur push exécutent déjà les shards complets de plugins groupés. Cela permet de conserver un retour rapide sur les plugins modifiés pendant les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI, sauf si l’exécution la plus récente pour cette même référence échoue également. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux des shards, sans toutefois se mettre en file d’attente lorsque l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur `main`.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs et agrégats de sécurité rapides (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides protocol/contract/groupées, vérifications shardées des contrats de canaux, shards `check` sauf lint, shards et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight d’install-smoke utilise également Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse se mettre en file d’attente plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de tests Node Linux, shards de tests de plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font gagner ; builds Docker d’install-smoke, où le coût en temps de file d’attente de 32 vCPU dépassait le gain obtenu                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des lanes modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par lane de limite
pnpm check          # porte locale rapide : tsgo de production + lint shardé + gardes rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même porte avec minutage par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + liens cassés
pnpm build          # construire dist lorsque les lanes CI artifact/build-smoke sont pertinentes
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps total, le temps de file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI récentes réussies sur main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Liens connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de release](/fr/install/development-channels)

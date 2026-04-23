---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, barrières de périmètre et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T14:55:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et sur chaque pull request. Elle utilise un périmètre intelligent pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à périmètre intelligent. Le
workflow `Parity gate` s’exécute sur les changements de PR correspondants et via déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques mock GPT-5.4 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et via
déclenchement manuel ; il répartit en jobs parallèles la parity gate mock, la voie Matrix en direct, et la voie Telegram en direct.
Les jobs en direct utilisent l’environnement `qa-live-shared`,
et la voie Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également ces mêmes voies QA Lab avant l’approbation d’une release.

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                     | Quand il s’exécute                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushes et PR non brouillons |
| `security-dependency-audit`      | Audit sans dépendances du lockfile de production contre les avis npm                         | Toujours sur les pushes et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les pushes et PR non brouillons |
| `build-artifacts`                | Construire `dist/`, l’UI de contrôle, les vérifications des artefacts construits, et les artefacts réutilisables en aval | Changements pertinents pour Node      |
| `checks-fast-core`               | Voies Linux rapides de correction, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node      |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat de vérification agrégé stable | Changements pertinents pour Node   |
| `checks-node-extensions`         | Fragments complets de tests des plugins groupés sur toute la suite d’extensions              | Changements pertinents pour Node      |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors voies de canaux, bundled, contrats et extensions       | Changements pertinents pour Node      |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins groupés modifiés                                    | Pull requests avec changements d’extensions |
| `check`                          | Équivalent principal local fragmenté des barrières : types prod, lint, gardes, types de test, et smoke strict | Changements pertinents pour Node |
| `check-additional`               | Gardes d’architecture, de limites, de surface d’extension, de frontières de package, et fragments gateway-watch | Changements pertinents pour Node |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                            | Changements pertinents pour Node      |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus la compatibilité Node 22 réservée aux pushes | Changements pertinents pour Node |
| `check-docs`                     | Vérifications de formatage, lint, et liens cassés de la documentation                        | Documentation modifiée                |
| `skills-python`                  | Ruff + pytest pour les Skills basées sur Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                          | Changements pertinents pour Windows   |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                    | Changements pertinents pour macOS     |
| `macos-swift`                    | Lint, build, et tests Swift pour l’application macOS                                         | Changements pertinents pour macOS     |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build d’APK debug                    | Changements pertinents pour Android   |

## Ordre d’échec rapide

Les jobs sont ordonnés pour que les vérifications peu coûteuses échouent avant que les plus coûteuses ne s’exécutent :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` se trouve dans les étapes de ce job, pas dans des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateforme.
3. `build-artifacts` se superpose aux voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les voies plus lourdes de plateforme et de runtime se répartissent ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, et `android`.

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais n’imposent pas à elles seules des builds natifs Windows, Android, ou macOS ; ces voies de plateforme restent limitées aux changements du code source de la plateforme.
Les vérifications Node Windows sont limitées aux wrappers Windows spécifiques aux processus/chemins, aux helpers npm/pnpm/UI runner, à la configuration du gestionnaire de paquets, et aux surfaces du workflow CI qui exécutent cette voie ; les changements non liés dans le code source, les plugins, install-smoke, et les tests uniquement restent sur les voies Linux Node afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les fragments de test normaux.
Le workflow séparé `install-smoke` réutilise le même script de périmètre via son propre job `preflight`. Il calcule `run_install_smoke` à partir du signal plus étroit changed-smoke, de sorte que le smoke Docker/install s’exécute pour les changements liés à l’installation, au packaging, aux conteneurs, aux changements de production des extensions groupées, ainsi qu’aux surfaces cœur plugin/channel/gateway/Plugin SDK que les jobs smoke Docker exercent. Les modifications docs-only et test-only ne réservent pas de workers Docker. Son smoke de package QR force la couche Docker `pnpm install` à se réexécuter tout en préservant le cache du store pnpm BuildKit, de sorte qu’il teste toujours l’installation sans retélécharger les dépendances à chaque exécution. Son e2e gateway-network réutilise l’image runtime construite plus tôt dans le job, ce qui ajoute une couverture WebSocket réelle de conteneur à conteneur sans ajouter un autre build Docker. L’agrégat local `test:docker:all` préconstruit une image partagée de test live et une image d’application construite partagée `scripts/e2e/Dockerfile`, puis exécute les voies smoke live/E2E en parallèle avec `OPENCLAW_SKIP_DOCKER_BUILD=1` ; ajustez le parallélisme par défaut de 4 avec `OPENCLAW_DOCKER_ALL_PARALLELISM`. L’agrégat local cesse de planifier de nouvelles voies mutualisées après le premier échec par défaut, et chaque voie dispose d’un délai d’expiration de 120 minutes remplaçable avec `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Les voies sensibles au démarrage ou au fournisseur s’exécutent exclusivement après le pool parallèle. Le workflow réutilisable live/E2E reflète le modèle d’image partagée en construisant et poussant une image Docker E2E GHCR taggée SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release. Les tests Docker QR et installer conservent leurs propres Dockerfiles centrés sur l’installation. Un job séparé `docker-e2e-fast` exécute le profil Docker groupé borné du plugin sous un délai d’expiration de commande de 120 secondes : réparation des dépendances setup-entry plus isolation synthétique d’échec du bundled-loader. La matrice complète grouped update/channel reste manuelle/suite complète parce qu’elle effectue des passages répétés de véritable mise à jour npm et de réparation doctor.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière locale est plus stricte sur les limites d’architecture que le large périmètre de plateforme de la CI : les changements de production du cœur exécutent le typecheck de production du cœur plus les tests du cœur, les changements du cœur limités aux tests n’exécutent que le typecheck/tests du cœur pour les tests, les changements de production des extensions exécutent le typecheck de production des extensions plus les tests des extensions, et les changements d’extensions limités aux tests n’exécutent que le typecheck/tests des extensions pour les tests. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions parce que les extensions dépendent de ces contrats du cœur. Les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine. Les changements inconnus dans la racine/config échouent prudemment vers toutes les voies.

Sur les pushes, la matrice `checks` ajoute la voie `compat-node22` réservée aux pushes. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de test/canal.

Les familles de tests Node les plus lentes sont divisées ou équilibrées pour que chaque job reste réduit sans sur-réserver de runners : les contrats de canaux s’exécutent en trois fragments pondérés, les tests de plugins groupés sont équilibrés sur six workers d’extension, les petites voies unitaires du cœur sont appariées, auto-reply s’exécute sur trois workers équilibrés au lieu de six petits workers, et les configurations agentiques gateway/plugin sont réparties sur les jobs Node agentiques existants limités au code source au lieu d’attendre les artefacts construits. Les grands tests browser, QA, media, et de plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. La large voie agents utilise le planificateur parallèle par fichier Vitest partagé parce qu’elle est dominée par les imports/la planification plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le fragment infra core-runtime pour éviter que le fragment runtime partagé ne porte la traîne. `check-additional` conserve ensemble le travail compile/canary de package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; le fragment boundary guard exécute ses petites gardes indépendantes en parallèle à l’intérieur d’un seul job. Gateway watch, les tests de canaux, et le fragment core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` sont déjà construits, en conservant leurs anciens noms de vérification comme jobs vérificateurs légers tout en évitant deux workers Blacksmith supplémentaires et une seconde file de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante third-party n’a pas d’ensemble de sources ni de manifeste séparés ; sa voie de test unitaire compile quand même cette variante avec les drapeaux SMS/call-log de BuildConfig, tout en évitant un job dupliqué de packaging d’APK debug à chaque push pertinent pour Android.
`extension-fast` est réservé aux PR parce que les exécutions sur push exécutent déjà les fragments complets de plugins groupés. Cela conserve un retour rapide sur les plugins modifiés pour les revues sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI à moins que l’exécution la plus récente pour cette même référence échoue aussi. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux de fragments, mais ne se mettent pas en file d’attente après que l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur `main`.

## Exécuteurs

| Exécuteur                        | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides protocol/contract/bundled, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications de documentation, Skills Python, workflow-sanity, labeler, auto-response ; le preflight d’install-smoke utilise également Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests des plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent ; builds Docker d’install-smoke, où le temps d’attente de la file 32 vCPU coûtait plus qu’il n’économisait                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # barrière locale intelligente : typecheck/lint/tests modifiés par voie de limite
pnpm check          # barrière locale rapide : tsgo de production + lint fragmenté + gardes rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même barrière avec minutage par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont pertinentes
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps total, le temps d’attente en file, et les jobs les plus lents
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI `main` récentes réussies
```

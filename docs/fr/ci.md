---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des tâches CI, portes de portée et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T06:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et pour chaque pull request. Elle utilise une portée intelligente pour ignorer les tâches coûteuses lorsque seules des zones non liées ont changé.

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. Le
workflow `Parity gate` s’exécute sur les changements de PR correspondants et via déclenchement manuel ; il
construit le runtime QA privé et compare les packs agentiques simulés GPT-5.4 et Opus 4.6.
Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` ainsi que via
déclenchement manuel ; il répartit en tâches parallèles la mock parity gate, la voie Matrix en direct et la voie Telegram en direct. Les tâches en direct utilisent l’environnement `qa-live-shared`,
et la voie Telegram utilise des baux Convex. `OpenClaw Release
Checks` exécute également ces mêmes voies QA Lab avant l’approbation d’une version.

## Vue d’ensemble des tâches

| Tâche                            | Objectif                                                                                     | Quand elle s’exécute                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées et construire le manifeste CI | Toujours sur les push et PR non brouillon |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les push et PR non brouillon |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances contre les avis npm                         | Toujours sur les push et PR non brouillon |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                           | Toujours sur les push et PR non brouillon |
| `build-artifacts`                | Construire `dist/`, l’interface Control UI, les vérifications d’artefacts construits et les artefacts réutilisables en aval | Changements liés à Node |
| `checks-fast-core`               | Voies de correction Linux rapides telles que les vérifications bundled/plugin-contract/protocol | Changements liés à Node |
| `checks-fast-contracts-channels` | Vérifications de contrats de canaux fragmentées avec un résultat de vérification agrégé stable | Changements liés à Node |
| `checks-node-extensions`         | Fragments complets de tests de plugins groupés sur toute la suite d’extensions              | Changements liés à Node |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors voies de canaux, groupées, de contrats et d’extensions | Changements liés à Node |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins groupés modifiés                                    | Pull requests avec changements d’extensions |
| `check`                          | Équivalent de la porte locale principale fragmentée : types prod, lint, gardes, types de test et smoke strict | Changements liés à Node |
| `check-additional`               | Architecture, limites, gardes de surface d’extensions, limites de paquets et fragments gateway-watch | Changements liés à Node |
| `build-smoke`                    | Tests smoke de CLI construite et smoke de mémoire au démarrage                               | Changements liés à Node |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits plus compatibilité Node 22 réservée aux push | Changements liés à Node |
| `check-docs`                     | Formatage de la documentation, lint et vérifications de liens cassés                         | Documentation modifiée |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                              | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de tests spécifiques à Windows                                                         | Changements pertinents pour Windows |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                    | Changements pertinents pour macOS |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                          | Changements pertinents pour macOS |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build d’APK debug                    | Changements pertinents pour Android |

## Ordre d’échec rapide

Les tâches sont ordonnées pour que les vérifications peu coûteuses échouent avant le lancement des tâches coûteuses :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans cette tâche, pas à des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches plus lourdes d’artefacts et de matrice plateforme.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Ensuite, les voies plus lourdes de plateforme et de runtime se répartissent : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` réservé aux PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Les modifications du workflow CI valident le graphe CI Node ainsi que le lint des workflows, mais n’imposent pas à elles seules des builds natifs Windows, Android ou macOS ; ces voies plateforme restent limitées aux changements de code source de la plateforme.
Les vérifications Node Windows sont limitées aux wrappers Windows spécifiques de processus/chemins, aux aides de runner npm/pnpm/UI, à la configuration du gestionnaire de paquets et aux surfaces de workflow CI qui exécutent cette voie ; les changements non liés du code source, des plugins, de l’install-smoke et des tests restent sur les voies Linux Node afin de ne pas réserver un worker Windows 16 vCPU pour une couverture déjà exercée par les fragments de tests normaux.
Le workflow séparé `install-smoke` réutilise le même script de portée via sa propre tâche `preflight`. Il calcule `run_install_smoke` à partir du signal modifié plus étroit `changed-smoke`, de sorte que le smoke Docker/install s’exécute pour les changements d’installation, de packaging, liés aux conteneurs, de production des extensions groupées, ainsi que pour les surfaces cœur plugin/channel/gateway/Plugin SDK exercées par les tâches smoke Docker. Les modifications docs-only et test-only ne réservent pas de workers Docker. Son smoke de package QR force la réexécution de la couche Docker `pnpm install` tout en préservant le cache BuildKit du store pnpm, de sorte qu’il continue à exercer l’installation sans retélécharger les dépendances à chaque exécution. Son e2e gateway-network réutilise l’image runtime construite plus tôt dans la tâche, ce qui ajoute une couverture WebSocket réelle de conteneur à conteneur sans ajouter un autre build Docker. En local, `test:docker:all` préconstruit une image partagée d’application construite `scripts/e2e/Dockerfile` et la réutilise dans les exécuteurs smoke E2E de conteneur ; le workflow réutilisable live/E2E reproduit ce schéma en construisant et poussant une image Docker E2E GHCR unique taguée par SHA avant la matrice Docker, puis en exécutant la matrice avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les tests Docker QR et d’installateur conservent leurs propres Dockerfiles orientés installation. Une tâche distincte `docker-e2e-fast` exécute le profil Docker de plugin groupé borné avec un délai de commande de 120 secondes : réparation des dépendances setup-entry plus isolation synthétique des échecs du bundled-loader. La matrice complète grouped update/channel reste manuelle/suite complète parce qu’elle effectue des passes répétées réelles de mise à jour npm et de réparation doctor.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte locale est plus stricte concernant les limites d’architecture que la large portée CI par plateforme : les changements de production du cœur exécutent le typecheck prod du cœur plus les tests du cœur, les changements limités aux tests du cœur n’exécutent que le typecheck/tests du cœur, les changements de production des extensions exécutent le typecheck prod des extensions plus les tests des extensions, et les changements limités aux tests des extensions n’exécutent que le typecheck/tests des extensions. Les changements du Plugin SDK public ou du plugin-contract étendent la validation aux extensions parce que celles-ci dépendent de ces contrats du cœur. Les montées de version limitées aux métadonnées de version déclenchent des vérifications ciblées de version/config/dépendances racine. Les changements racine/config inconnus échouent de manière sûre vers toutes les voies.

Sur les push, la matrice `checks` ajoute la voie `compat-node22` réservée aux push. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de tests/canaux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin de garder chaque tâche légère : les contrats de canaux divisent la couverture registry et cœur en six fragments pondérés au total, les tests de plugins groupés sont équilibrés sur six workers d’extensions, auto-reply s’exécute sur trois workers équilibrés au lieu de six petits workers, et les configurations agentiques gateway/plugin sont réparties sur les tâches Node agentiques existantes réservées au code source au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, média et plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé pour plugins. La large voie agents utilise le planificateur partagé Vitest parallèle par fichier parce qu’elle est dominée par les imports/la planification plutôt que par un seul fichier de test lent. `runtime-config` s’exécute avec le fragment infra core-runtime pour éviter que le fragment runtime partagé ne conserve la traîne. `check-additional` garde ensemble le travail de compilation/canari de limite de paquet et sépare l’architecture de topologie runtime de la couverture gateway watch ; le fragment de gardes de limites exécute en parallèle ses petits gardes indépendants à l’intérieur d’une seule tâche. Gateway watch, les tests de canaux et le fragment cœur support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits, en conservant leurs anciens noms de vérification comme tâches de vérification légères tout en évitant deux workers Blacksmith supplémentaires et une seconde file de consommateurs d’artefacts.
La CI Android exécute `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a ni source set ni manifeste séparé ; sa voie de tests unitaires compile tout de même cette variante avec les drapeaux BuildConfig SMS/call-log, tout en évitant une tâche dupliquée de packaging d’APK debug à chaque push pertinent pour Android.
`extension-fast` est réservé aux PR parce que les exécutions sur push exécutent déjà les fragments complets des plugins groupés. Cela préserve un retour rapide pour les plugins modifiés pendant la revue sans réserver un worker Blacksmith supplémentaire sur `main` pour une couverture déjà présente dans `checks-node-extensions`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI à moins que la dernière exécution pour cette même référence échoue aussi. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin qu’elles signalent toujours les échecs normaux des fragments, sans toutefois se mettre en file d’attente lorsque l’ensemble du workflow a déjà été remplacé.
La clé de concurrence CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur `main`.

## Exécuteurs

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides protocol/contract/grouped, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications de documentation, Skills Python, workflow-sanity, labeler, auto-response ; le preflight de install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse se mettre en file d’attente plus tôt |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, qui reste suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font économiser ; builds Docker d’install-smoke, où le coût en temps de file d’attente du 32 vCPU dépassait le gain obtenu                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                         |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local de voies modifiées pour origin/main...HEAD
pnpm check:changed   # porte locale intelligente : typecheck/lint/tests modifiés par voie de limite
pnpm check          # porte locale rapide : tsgo de production + lint fragmenté + gardes rapides parallèles
pnpm check:test-types
pnpm check:timed    # même porte avec minutage par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont pertinentes
node scripts/ci-run-timings.mjs <run-id>  # résumer le temps mur, le temps de file d’attente et les tâches les plus lentes
```

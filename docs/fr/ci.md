---
read_when:
    - Vous devez comprendre pourquoi un job CI s’est exécuté ou non
    - Vous déboguez des vérifications GitHub Actions en échec
summary: Graphe des jobs CI, barrières de périmètre et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T04:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI s’exécute à chaque push vers `main` et sur chaque pull request. Elle utilise un ciblage intelligent pour ignorer les jobs coûteux lorsque seules des zones non liées ont changé.

## Vue d’ensemble des jobs

| Job                              | Objectif                                                                                    | Quand il s’exécute                   |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Détecter les changements limités à la documentation, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                              | Toujours sur les pushs et PR non brouillons |
| `security-dependency-audit`      | Audit sans dépendances du lockfile de production contre les avis npm                       | Toujours sur les pushs et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                           | Toujours sur les pushs et PR non brouillons |
| `build-artifacts`                | Construire `dist/` et l’interface Control UI une fois, puis téléverser des artefacts réutilisables pour les jobs en aval | Changements pertinents pour Node     |
| `checks-fast-core`               | Voies rapides de vérification Linux, comme les contrôles bundled/plugin-contract/protocol  | Changements pertinents pour Node     |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canal avec un résultat de vérification agrégé stable | Changements pertinents pour Node  |
| `checks-node-extensions`         | Fragments complets de tests de Plugin inclus sur toute la suite d’extensions               | Changements pertinents pour Node     |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors canaux, bundled, contrats et extensions              | Changements pertinents pour Node     |
| `extension-fast`                 | Tests ciblés uniquement pour les plugins inclus modifiés                                   | Lorsque des changements d’extension sont détectés |
| `check`                          | Équivalent principal local fragmenté : types prod, lint, garde-fous, types de test et smoke strict | Changements pertinents pour Node |
| `check-additional`               | Architecture, frontières, garde-fous de surface d’extension, frontières de package et fragments gateway-watch | Changements pertinents pour Node |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                          | Changements pertinents pour Node     |
| `checks`                         | Voies Linux Node restantes : tests de canal et compatibilité Node 22 réservée aux pushs    | Changements pertinents pour Node     |
| `check-docs`                     | Formatage, lint et vérification des liens cassés dans la documentation                     | Documentation modifiée               |
| `skills-python`                  | Ruff + pytest pour les Skills basées sur Python                                            | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Voies de test spécifiques à Windows                                                        | Changements pertinents pour Windows  |
| `macos-node`                     | Voie de test TypeScript macOS utilisant les artefacts construits partagés                  | Changements pertinents pour macOS    |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                        | Changements pertinents pour macOS    |
| `android`                        | Matrice de build et de test Android                                                        | Changements pertinents pour Android  |

## Ordre d’échec rapide

Les jobs sont ordonnés pour que les vérifications peu coûteuses échouent avant que les plus coûteuses ne s’exécutent :

1. `preflight` décide quelles voies existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, pas à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artefacts et de matrices de plateforme.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Ensuite, les voies plus lourdes de plateforme et d’exécution se déploient : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`.
Le workflow séparé `install-smoke` réutilise le même script de périmètre via son propre job `preflight`. Il calcule `run_install_smoke` à partir du signal plus étroit changed-smoke, de sorte que le smoke Docker/install ne s’exécute que pour les changements liés à l’installation, au packaging et aux conteneurs.

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière locale est plus stricte sur les frontières d’architecture que le large périmètre de plateforme de la CI : les changements de production du cœur exécutent le contrôle de types prod du cœur plus les tests du cœur, les changements limités aux tests du cœur n’exécutent que le contrôle de types/tests du cœur, les changements de production d’extension exécutent le contrôle de types prod des extensions plus les tests d’extension, et les changements limités aux tests d’extension n’exécutent que le contrôle de types/tests d’extension. Les changements du SDK public du Plugin ou du plugin-contract étendent la validation aux extensions, car les extensions dépendent de ces contrats du cœur. Les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées sur la version/la config/les dépendances racine. Les changements inconnus à la racine ou dans la config basculent par sécurité vers toutes les voies.

Sur les pushs, la matrice `checks` ajoute la voie `compat-node22`, réservée aux pushs. Sur les pull requests, cette voie est ignorée et la matrice reste concentrée sur les voies normales de test/canal.

Les familles de tests Node les plus lentes sont divisées en fragments par fichiers inclus afin que chaque job reste petit : les contrats de canal divisent la couverture registry et cœur en huit fragments pondérés chacun, les tests de commande de réponse auto-reply sont divisés en quatre fragments par motif d’inclusion, et les autres grands groupes de préfixes de réponse auto-reply sont divisés en deux fragments chacun. `check-additional` sépare aussi le travail de compilation/canary des frontières de package du travail runtime topology gateway/architecture.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit CI, sauf si la dernière exécution pour cette même référence échoue aussi. Les vérifications agrégées de fragments signalent explicitement ce cas d’annulation afin de le distinguer plus facilement d’un échec de test.

## Exécuteurs

| Exécuteur                        | Jobs                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, vérifications Linux, vérifications de documentation, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                          |

## Équivalents locaux

```bash
pnpm changed:lanes   # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed   # barrière locale intelligente : typecheck/lint/tests modifiés par voie de frontière
pnpm check          # barrière locale rapide : tsgo de production + lint fragmenté + garde-fous rapides en parallèle
pnpm check:test-types
pnpm check:timed    # même barrière avec durées par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # tests vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + liens cassés de la documentation
pnpm build          # construire dist lorsque les voies CI artifact/build-smoke sont pertinentes
```

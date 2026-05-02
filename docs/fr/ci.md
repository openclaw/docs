---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez l’exécution ou la réexécution d’une validation de version
    - Vous modifiez le dispatch ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T07:00:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. La tâche `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le périmétrage intelligent et déploient tout le graphe pour les versions candidates et les validations larges. Les lanes Android restent opt-in via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Préversion Plugin`](#plugin-prerelease) et ne s’exécute que depuis [`Validation complète de release`](#full-release-validation) ou un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Tâche                            | Objectif                                                                                     | Moment d’exécution                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les périmètres modifiés, les extensions modifiées et construire le manifeste CI | Toujours sur les pushes et PRs non draft |
| `security-scm-fast`              | Détection de clés privées et audit de workflow via `zizmor`                                  | Toujours sur les pushes et PRs non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                    | Toujours sur les pushes et PRs non draft |
| `security-fast`                  | Agrégat obligatoire pour les tâches de sécurité rapides                                      | Toujours sur les pushes et PRs non draft |
| `check-dependencies`             | Passe Knip production limitée aux dépendances plus garde de liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artefacts construits et les artefacts réutilisables en aval | Changements pertinents pour Node |
| `checks-fast-core`               | Lanes Linux rapides de conformité, comme les vérifications bundled/plugin-contract/protocol  | Changements pertinents pour Node |
| `checks-fast-contracts-channels` | Vérifications de contrats de channels partitionnées avec un résultat agrégé stable           | Changements pertinents pour Node |
| `checks-node-core-test`          | Shards de tests Node du core, hors lanes channel, bundled, contract et extension             | Changements pertinents pour Node |
| `check`                          | Équivalent partitionné de la gate locale principale : types prod, lint, gardes, types de test et smoke strict | Changements pertinents pour Node |
| `check-additional`               | Architecture, limites, gardes de surface extension, package-boundary et shards gateway-watch | Changements pertinents pour Node |
| `build-smoke`                    | Tests smoke de CLI construite et smoke de mémoire au démarrage                               | Changements pertinents pour Node |
| `checks`                         | Vérificateur pour les tests channel sur artefacts construits                                 | Changements pertinents pour Node |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                              | Déclenchement manuel CI pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                    | Docs modifiées                    |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                              | Changements pertinents pour les skills Python |
| `checks-windows`                 | Tests spécifiques Windows de processus/chemins plus régressions partagées d’import specifier runtime | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                   | Changements pertinents pour macOS |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build d’APK debug                      | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité fiable                     | Succès CI sur main ou déclenchement manuel |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans cette tâche, pas à des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches plus lourdes d’artefacts et de matrices de plateformes.
3. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs en aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer des tâches remplacées comme `cancelled` lorsqu’un nouveau push arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si la plus récente exécution pour la même ref échoue également. Les vérifications de shards agrégées utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, sans toutefois se mettre en file après que tout le workflow a déjà été remplacé. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le linting des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent périmétrées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures core-test, et les modifications étroites d’aides/tests de routage de contrats de plugins** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin saute les artefacts de build, la compatibilité Node 22, les contrats de channels, les shards core complets, les shards de plugins bundled et les matrices de gardes supplémentaires lorsque le changement se limite aux surfaces de routage ou d’aide que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont périmétrées aux wrappers processus/chemins spécifiques Windows, aux aides npm/pnpm/UI runner, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport dans les sources, plugins, install-smoke et tests-only restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans sur-réserver les runners : les contrats de channels s’exécutent en trois shards pondérés, les petites lanes unitaires du core sont appariées, auto-reply s’exécute avec quatre workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentic gateway/plugin sont réparties dans les tâches Node agentic source-only existantes au lieu d’attendre les artefacts construits. Les tests larges browser, QA, media et plugins divers utilisent leurs configurations Vitest dédiées plutôt que le catch-all partagé des plugins. Les shards include-pattern enregistrent les entrées de timing avec le nom du shard CI, de sorte que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard de garde boundary exécute ses petites gardes indépendantes en parallèle dans une seule tâche. Gateway watch, les tests channel et le shard support-boundary du core s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Android CI exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a ni source set ni manifeste séparé ; sa lane de tests unitaires compile tout de même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant une tâche de packaging d’APK debug en double à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimum de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de live-test et de pont de package que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout ni n’exécute du code de pull request non fiable. Le workflow crée un token GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé au hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est une observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne devrait publier dans `#clawsweeper` que lorsque l’événement est surprenant, exploitable, risqué ou utile sur le plan opérationnel. Les ouvertures ordinaires, modifications, bruit de bots, bruit de webhooks dupliqués et trafic de revue normal devraient aboutir à `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les déclenchements manuels CI exécutent le même graphe de tâches que la CI normale, mais forcent l’activation de chaque lane périmétrée non Android : shards Linux Node, shards de plugins bundled, contrats de channels, compatibilité Node 22, `check`, `check-additional`, build smoke, vérifications docs, skills Python, Windows, macOS et i18n Control UI. Les déclenchements CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’umbrella de release complète active Android en passant `include_android=true`. Les vérifications statiques de préversion de plugins, le shard `agentic-plugins` réservé aux releases, le balayage complet par lot des extensions et les lanes Docker de préversion de plugins sont exclus de la CI. La suite Docker de préversion s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la gate release-validation activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par un autre push ou une autre exécution de PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant fiable d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Exécuteurs

| Exécuteur                         | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                    | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/intégrées, vérifications de contrat de canal fragmentées, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le prévol install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`    | `CodeQL Critical Quality`, fragments d’extensions à charge plus légère, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`    | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests des plugins intégrés, `android`                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`   | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente à 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`   | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest`  | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

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
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Validation complète de publication

`Full Release Validation` est le workflow manuel englobant pour « tout exécuter avant la publication ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour la preuve plugin/package/statique/Docker propre à la publication, et déclenche `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation de package, les suites Docker du chemin de publication, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` avec l’artefact `release-package-under-test` issu des vérifications de publication. Après la publication, passez `npm_telegram_package_spec` pour relancer la même voie de package Telegram avec le package npm publié.

Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et
les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication avec mutation. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de publication et après la
réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de publication, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche à évolution rapide, utilisez l’assistant plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’
assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire lorsque l’
exécution se termine. Le vérificateur englobant échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de publication. Les
workflows de publication manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la large matrice consultative fournisseur/média.

- `minimum` conserve les voies OpenAI/noyau critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseur/média.

Le workflow englobant enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute les tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat englobant et le résumé des timings.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prépublication des plugins, `release-checks` pour chaque enfant de publication, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow englobant. Cela permet de borner la relance d’une boîte de publication en échec après un correctif ciblé.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre la ref sélectionnée une seule fois en une archive `release-package-under-test`, puis transmet cet artefact à la fois au workflow Docker live/E2E du chemin de publication et au fragment d’acceptation de package. Cela garde les octets du package cohérents entre les boîtes de publication et évite de repackager le même candidat dans plusieurs tâches enfants.

Les exécutions dupliquées de `Full Release Validation` pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow englobant. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin que la validation main plus récente
ne reste pas derrière une exécution de vérifications de publication obsolète de deux heures. La validation de branche/tag de publication
et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Fragments live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche sérielle :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- tâches `native-live-src-gateway-profiles` filtrées par fournisseur
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragments média audio/vidéo séparés et fragments musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en facilitant la relance et le diagnostic des échecs lents de fournisseurs live. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles en une seule fois.

Les fragments média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des exécuteurs Blacksmith normaux — les tâches conteneurisées ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments de modèles/backends live appuyés sur Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les fragments du modèle live Docker, du Gateway fragmenté par provider, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker Gateway portent des plafonds `timeout` explicites au niveau du script, inférieurs au délai d’expiration du job de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de release. Si ces fragments reconstruisent indépendamment toute la cible Docker source, l’exécution de release est mal configurée et gaspillera du temps réel sur des constructions d’image en double.

## Acceptation des packages

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation des packages valide un seul tarball via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker de condensé de package lorsque nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis distribue ces voies en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle optionnellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram optionnelle a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest`, ou une version exacte de release OpenClaw telle que `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation beta/stable publiée.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique de branche du dépôt ou une balise de release, installe les dépendances dans un worktree détaché et l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation de package publié ne soit pas conditionnée à la disponibilité live de ClawHub. La voie Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publié conservé pour les déclenchements autonomes.

Pour la politique dédiée aux tests de mise à jour et de Plugin, y compris les commandes locales,
les voies Docker, les entrées Package Acceptance, les valeurs par défaut de release et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent Package Acceptance avec `source=artifact`, l’artefact de package de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues`, et `telegram_mode=mock-openai`. Cela garde les preuves de migration de package, de mise à jour, de nettoyage de dépendances de Plugin obsolètes, de Plugin hors ligne, de mise à jour de Plugin et de Telegram sur le même tarball de package résolu. Les vérifications de release inter-OS couvrent toujours l’onboarding spécifique à l’OS, l’installateur et le comportement de plateforme ; la validation produit de package/mise à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une base de package publiée par exécution. Dans Package Acceptance, le tarball `package-under-test` résolu est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base publiée de repli, avec `openclaw@latest` par défaut ; les commandes de réexécution des voies échouées préservent cette base. Définissez `published_upgrade_survivor_baselines=release-history` pour étendre la voie sur une matrice d’historique dédupliquée : les six dernières releases stables, `2026.4.23`, et la dernière release stable avant `2026-03-15`. Définissez `published_upgrade_survivor_scenarios=reported-issues` pour étendre les mêmes bases sur des fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les chemins de journaux avec tilde et les racines de dépendances Plugin héritées obsolètes. Le workflow distinct `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur la couverture normale de Full Release CI. Les exécutions agrégées locales peuvent passer des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la base avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les voies de package Windows et de nouvelle installation par installateur vérifient aussi qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke agent-turn OpenAI inter-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.5`, afin que la preuve d’installation et de Gateway reste sur le modèle de test GPT-5 préféré.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes de la fixture git factice dérivée du tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes Plugin peuvent lire des emplacements hérités d’enregistrement d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant encore que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut également avertir pour les fichiers de tampon de métadonnées de build local qui avaient déjà été livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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
  -f package_ref=release/YYYY.M.D \
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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les timings de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer toute la validation de release.

## Smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces cœur Plugin/canal/Gateway/Plugin SDK que les jobs smoke Docker exercent. Les changements source uniquement de Plugin groupé, les modifications uniquement de tests et les modifications uniquement de docs ne réservent pas de workers Docker. Le chemin rapide construit l’image Dockerfile racine une seule fois, vérifie la CLI, exécute le smoke CLI de suppression agents shared-workspace, exécute l’e2e container gateway-network, vérifie un argument de build d’extension groupée et exécute le profil Docker de Plugin groupé borné sous un délai d’expiration de commande agrégé de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release par workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installateur/update et l’E2E Docker rapide de Plugin groupé comme jobs séparés afin que le travail d’installateur n’attende pas derrière les smokes de l’image racine.

Les pushes vers `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent de provider d’image par installation globale Bun est conditionné séparément par `run_bun_global_install_smoke`. Il s’exécute selon le planning nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels `Install Smoke` peuvent l’activer, mais pas les pull requests ni les pushes vers `main`. Les tests Docker QR et installateur conservent leurs propres Dockerfiles axés sur l’installation.

## Docker E2E local

`pnpm test:docker:all` préconstruit une image live-test partagée, empaquette OpenClaw une seule fois comme tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git nu pour les voies installateur/mise à jour/dépendances de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur ne lance que le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis lance les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de créneaux du pool principal pour les voies normales.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de créneaux du pool final sensibles aux fournisseurs.                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de voies en direct concurrentes pour éviter la limitation par les fournisseurs.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de voies d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de voies multiservices concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les rafales de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de secours par voie (120 minutes) ; certaines voies en direct/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan du planificateur sans lancer les voies.                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de voies séparées par des virgules ; ignore le smoke test de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut quand même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. L’agrégat local effectue les précontrôles Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, conserve les temps d’exécution des voies pour un ordre du plus long au plus court, et cesse par défaut de planifier de nouvelles voies mises en pool après le premier échec.

### Workflow en direct/E2E réutilisable

Le workflow en direct/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels paquet, type d’image, image en direct, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de paquet de l’exécution actuelle, ou télécharge un artefact de paquet depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse les images Docker E2E bare/fonctionnelles GHCR étiquetées par digest de paquet via le cache de couche Docker de Blacksmith lorsque le plan a besoin de voies avec paquet installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de paquet au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai d’expiration borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué retente rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Morceaux du chemin de publication

La couverture Docker de publication exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque morceau ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de publication actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` jusqu’à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, et `plugins-integrations` restent des alias d’agrégat Plugin/runtime. L’alias de voie `install-e2e` reste l’alias de relance manuelle agrégé pour les deux voies d’installation de fournisseurs.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un morceau autonome `openwebui` uniquement pour les dispatches propres à OpenWebUI. Les voies de mise à jour de canaux groupés retentent une fois en cas d’échecs réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de voies, les temps d’exécution, `summary.json`, `failures.json`, les temps de phases, le JSON du plan du planificateur, les tableaux des voies lentes, et les commandes de relance par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des jobs par morceaux, ce qui borne le débogage d’une voie échouée à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de paquet pour cette exécution ; si une voie sélectionnée est une voie Docker en direct, le job ciblé construit localement l’image de test en direct pour cette relance. Les commandes de relance GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name`, et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le paquet et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow en direct/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication.

## Prépublication Plugin

`Plugin Prerelease` est une couverture produit/paquet plus coûteuse ; c’est donc un workflow distinct, dispatché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main`, et les dispatches CI manuels autonomes maintiennent cette suite désactivée. Il répartit les tests de Plugins groupés entre huit workers d’extensions ; ces jobs d’éclats d’extensions exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugins riches en imports ne créent pas de jobs CI supplémentaires. Le chemin de prépublication Docker réservé aux publications regroupe les voies Docker ciblées en petits groupes afin d’éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## QA Lab

QA Lab dispose de voies CI dédiées en dehors du workflow principal à périmètre intelligent.

- Le workflow `Parity gate` s’exécute sur les changements PR correspondants et sur dispatch manuel ; il construit le runtime QA privé et compare les packs agentiques mock GPT-5.5 et Opus 4.6.
- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur dispatch manuel ; il déploie en éventail la porte de parité mock, la voie Matrix en direct, et les voies Telegram et Discord en direct comme jobs parallèles. Les jobs en direct utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les contrôles de publication exécutent les voies de transport Matrix et Telegram en direct avec le fournisseur mock déterministe et des modèles qualifiés pour mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles en direct et du démarrage normal des Plugins fournisseurs. Le Gateway de transport en direct désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité des fournisseurs est couverte par les suites distinctes de modèle en direct, fournisseur natif, et fournisseur Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque le CLI extrait le prend en charge. La valeur par défaut du CLI et l’entrée de workflow manuelle restent `all` ; un dispatch manuel `matrix_profile=all` découpe toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la publication avant l’approbation de publication ; sa porte de parité QA exécute les packs candidat et de référence comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison de parité finale.

Ne placez pas le chemin d’atterrissage PR derrière `Parity gate`, sauf si le changement touche réellement le runtime QA, la parité des packs de modèles, ou une surface détenue par le workflow de parité. Pour les corrections normales de canal, de configuration, de docs ou de tests unitaires, traitez-le comme un signal facultatif et suivez plutôt les preuves CI/contrôles à périmètre ciblé.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité étroit de premier passage, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles, et de garde des pull requests non brouillon scannent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur les `security-severity` élevées/critiques.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent hors des valeurs par défaut PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Référence de base auth, secrets, sandbox, Cron, et Gateway                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur plus le runtime de Plugin de canal, Gateway, SDK Plugin, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse d’IP, garde réseau, web-fetch, et politique SSRF du SDK Plugin                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante, et portes d’exécution d’outils agent                           |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance d’installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de source, et contrat de paquet du SDK Plugin |

### Éclats de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — éclat de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la sanity du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — éclat de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est l’éclat non sécuritaire correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript non sécuritaires de sévérité erreur sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa garde des pull requests est volontairement plus petite que le profil planifié : les PR non brouillon n’exécutent que les éclats correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, et `plugin-sdk-reply-runtime` pour les changements de code d’exécution des commandes/modèles/outils agent et de dispatch de réponses, de schéma/migration/IO de configuration, d’auth/secrets/sandbox/sécurité, de canal cœur et runtime de Plugin de canal groupé, de protocole Gateway/méthode serveur, de runtime mémoire/liaison SDK, de livraison MCP/processus/sortante, de runtime fournisseur/catalogue de modèles, de diagnostics de session/files de livraison, de chargeur Plugin, de SDK Plugin/contrat de paquet, ou de runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze éclats qualité PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils restreints sont des points d'accroche d'apprentissage et d'itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l'authentification, les secrets, le sandbox, Cron et le Gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d'E/S                                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats des méthodes serveur                                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d'implémentation des canaux du cœur et du Plugin de canal groupé                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, répartition des modèles/fournisseurs, répartition et files d'attente des réponses automatiques, et contrats d'exécution du plan de contrôle ACP                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d'outils, assistants de supervision de processus et contrats de livraison sortante                                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte de mémoire, façades d'exécution de mémoire, alias du SDK de Plugin de mémoire, colle d'activation de l'exécution de mémoire et commandes doctor de mémoire                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de la file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d'événements diagnostics/de bundles de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Répartition des réponses entrantes du SDK de Plugin, assistants de charge utile/fragmentation/exécution de réponse, options de réponse de canal, files de livraison et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement de l'exécution des fournisseurs, valeurs par défaut/catalogues des fournisseurs et registres web/recherche/récupération/intégration |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l'interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats d'exécution du plan de contrôle des tâches                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d'exécution de récupération/recherche web du cœur, E/S média, compréhension média, génération d'images et génération média                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d'entrée du SDK de Plugin                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée du SDK de Plugin côté paquet et assistants de contrat de paquet de Plugin                                                                                                  |

La qualité reste séparée de la sécurité afin que les résultats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L'extension CodeQL pour Swift, Python et les plugins groupés doit être réintroduite sous forme de travail de suivi délimité ou fragmenté uniquement après que les profils restreints disposent d'une exécution et d'un signal stables.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par les événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n'a pas de planification pure : une exécution CI réussie, non issue d'un bot, après un push sur `main` peut le déclencher, et un dispatch manuel peut l'exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu'une autre exécution Docs Agent non ignorée a été créée au cours de la dernière heure. Lorsqu'il s'exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu'au `main` actuel, de sorte qu'une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage sur les docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par les événements pour les tests lents. Il n'a pas de planification pure : une exécution CI réussie, non issue d'un bot, après un push sur `main` peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette barrière d'activité quotidienne. La voie génère un rapport de performances Vitest groupé pour la suite complète, laisse Codex n'effectuer que de petites corrections de performances de test préservant la couverture plutôt que de larges refactorisations, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests de référence réussis. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant qu'un commit ne soit créé. Lorsque `main` avance avant que le push du bot n'atterrisse, la voie rebase le correctif validé, réexécute `pnpm check:changed` et réessaie le push ; les correctifs obsolètes conflictuels sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l'action Codex puisse conserver la même posture de sécurité drop-sudo que l'agent des docs.

### PR en double après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage post-intégration des doublons. Il est par défaut en simulation et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée en commun, soit des fragments modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barrières de vérification locale et routage des changements

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière de vérification locale est plus stricte concernant les frontières d'architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types prod du cœur et tests du cœur, ainsi que le lint/les garde-fous du cœur ;
- les changements uniquement de tests du cœur exécutent uniquement la vérification de types des tests du cœur, ainsi que le lint du cœur ;
- les changements de production d'extension exécutent la vérification de types prod et tests d'extension, ainsi que le lint d'extension ;
- les changements uniquement de tests d'extension exécutent la vérification de types des tests d'extension, ainsi que le lint d'extension ;
- les changements du SDK de Plugin public ou de contrat de plugin s'étendent à la vérification de types d'extension parce que les extensions dépendent de ces contrats du cœur (les balayages d'extensions Vitest restent du travail de test explicite) ;
- les montées de version uniquement de métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s'exécutent elles-mêmes, les modifications de source privilégient les correspondances explicites, puis les tests frères et les dépendants du graphe d'importation. La configuration partagée de livraison en salle de groupe fait partie des correspondances explicites : les changements apportés à la configuration de réponse visible de groupe, au mode de livraison de réponse source ou au prompt système de l'outil de messages passent par les tests de réponse du cœur ainsi que par les régressions de livraison Discord et Slack, afin qu'un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large au niveau du harnais pour que l'ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une box fraîchement préchauffée pour une preuve large. Avant de consacrer une barrière lente à une box réutilisée, expirée ou qui vient de signaler une synchronisation étonnamment importante, exécutez d'abord `pnpm testbox:sanity` dans la box.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l'état de synchronisation distant n'est pas une copie fiable de la PR ; arrêtez cette box et préchauffez-en une nouvelle au lieu de déboguer l'échec du test produit. Pour les PR intentionnelles avec de nombreuses suppressions, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine également une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver ce garde-fou, ou utilisez une valeur plus grande en millisecondes pour des diffs locaux inhabituellement volumineux.

Crabbox est le second chemin de box distante détenu par le dépôt pour la preuve Linux lorsque Blacksmith est indisponible ou lorsque la capacité cloud détenue est préférable. Préchauffez une box, hydratez-la via le workflow du projet, puis exécutez les commandes via la CLI Crabbox :

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` possède les valeurs par défaut du fournisseur, de la synchronisation et de l'hydratation GitHub Actions. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d'objets locaux du mainteneur, et il exclut les artefacts locaux d'exécution/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d'environnement non secrète que les commandes ultérieures `crabbox run --id <cbx_id>` utilisent comme source.

## Connexe

- [Vue d'ensemble de l'installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
summary: Graphe des tâches CI, contrôles de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-30T18:38:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent intentionnellement le périmétrage intelligent et déploient tout le graphe pour les release candidates et les validations larges. Les lanes Android restent opt-in via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute qu’à partir de [`Full Release Validation`](#full-release-validation) ou d’un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                     | Quand il s’exécute                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecter les changements limités aux docs, les scopes modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PRs non draft |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les pushs et PRs non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                    | Toujours sur les pushs et PRs non draft |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les pushs et PRs non draft |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances plus garde de l’allowlist des fichiers inutilisés | Changements pertinents pour Node   |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artefacts construits, et les artefacts aval réutilisables | Changements pertinents pour Node   |
| `checks-fast-core`               | Lanes de correction Linux rapides telles que les vérifications groupées/contrat Plugin/protocole | Changements pertinents pour Node   |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de channels avec un résultat de vérification agrégé stable | Changements pertinents pour Node   |
| `checks-node-core-test`          | Shards de tests Node du noyau, hors lanes channel, groupées, contrat et extension            | Changements pertinents pour Node   |
| `check`                          | Équivalent fragmenté de la porte locale principale : types prod, lint, gardes, types de tests et smoke strict | Changements pertinents pour Node   |
| `check-additional`               | Shards d’architecture, de frontières, de gardes de surface d’extension, de frontières de package et de gateway-watch | Changements pertinents pour Node   |
| `build-smoke`                    | Tests smoke de CLI construite et smoke de mémoire au démarrage                               | Changements pertinents pour Node   |
| `checks`                         | Vérificateur pour les tests de channels d’artefacts construits                               | Changements pertinents pour Node   |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                              | Dispatch CI manuel pour les releases |
| `check-docs`                     | Vérifications de formatage, lint et liens cassés des docs                                    | Docs modifiées                     |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                              | Changements pertinents pour les skills Python |
| `checks-windows`                 | Tests spécifiques Windows de processus/chemins plus régressions de spécificateurs d’import runtime partagés | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                   | Changements pertinents pour macOS  |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS  |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build APK debug                        | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après une activité approuvée              | Succès de la CI principale ou dispatch manuel |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, et non des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artefacts et de matrice de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent commencer dès que le build partagé est prêt.
4. Les lanes de plateformes et de runtimes plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI, sauf si la plus récente exécution pour la même référence échoue aussi. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, sans toutefois se mettre en file d’attente une fois tout le workflow déjà remplacé. La clé de concurrence automatique CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node plus le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateformes.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests core, et les modifications étroites de helpers/tests de routage de contrats Plugin** utilisent un chemin de manifeste rapide Node uniquement : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de channels, les shards core complets, les shards de Plugins groupés, et les matrices de gardes supplémentaires lorsque le changement est limité aux surfaces de routage ou de helpers directement exercées par la tâche rapide.
- **Les vérifications Node Windows** sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de packages, et aux surfaces du workflow CI qui exécutent cette lane ; les changements sans rapport de sources, Plugin, install-smoke et tests uniquement restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver de runners : les contrats de channels s’exécutent en trois shards pondérés, les petites lanes d’unités core sont appairées, auto-reply s’exécute avec quatre workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentic gateway/Plugin sont réparties sur les jobs Node agentic existants limités aux sources au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et Plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all Plugin partagé. Les shards à motifs d’inclusion enregistrent les entrées de timing avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional` conserve ensemble les travaux de compilation/canary de frontières de packages et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard de garde de frontières exécute ses petits gardes indépendants en parallèle dans un seul job. Gateway watch, les tests de channels et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor tiers n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile tout de même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug en double à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de Plugins dynamiques, générées, de build, de live-test et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de jobs que la CI normale mais forcent l’activation de chaque lane périmétrée non Android : shards Node Linux, shards de Plugins groupés, contrats de channels, compatibilité Node 22, `check`, `check-additional`, build smoke, vérifications docs, Skills Python, Windows, macOS et i18n Control UI. Les dispatches CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prerelease Plugin, le shard `agentic-plugins` réservé aux releases, le balayage complet par lots des extensions, et les lanes Docker de prerelease Plugin sont exclus de la CI. La suite Docker de prerelease ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec la porte release-validation activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par un autre push ou une autre exécution de PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant approuvé d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow de la référence de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/groupées, vérifications fragmentées de contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse se mettre en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments de Plugin à charge plus faible, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Node Linux, fragments de tests de Plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file de 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` est le workflow parapluie manuel pour « tout exécuter avant la publication ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour la preuve réservée à la publication des Plugins/packages/statiques/Docker, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les suites de chemin de publication Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Il peut aussi exécuter le workflow post-publication `NPM Telegram Beta E2E` lorsqu’une spécification de package publiée est fournie.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de publication :

- `minimum` conserve les voies OpenAI/core critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseur/médias.

Le parapluie enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat du parapluie et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de publication, `ci` uniquement pour l’enfant CI complet normal, `release-checks` pour chaque enfant de publication, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le parapluie. Cela limite la relance d’une boîte de publication échouée après un correctif ciblé.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une fois la référence sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact à la fois au workflow Docker de chemin de publication live/E2E et au fragment d’acceptation de package. Cela maintient des octets de package cohérents entre les boîtes de publication et évite de réemballer le même candidat dans plusieurs tâches enfants.

## Fragments live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche série :

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
- fragments médias audio/vidéo séparés et fragments musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les défaillances lentes des fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles en une seule fois.

Les fragments de médias live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches médias ne font que vérifier les binaires avant la configuration. Gardez les suites live adossées à Docker sur des exécuteurs Blacksmith normaux : les tâches conteneur sont le mauvais endroit pour lancer des tests Docker imbriqués.

Les fragments live de modèles/backends adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de publication live construit et pousse cette image une seule fois, puis les fragments du modèle live Docker, du Gateway, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de publication est mal configurée et gaspillera du temps mural avec des builds d’image dupliqués.

## Acceptation de package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation de package valide un tarball unique via le même harnais Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux en tant qu’artefact `package-under-test`, et affiche la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker de digest de package lorsque nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu de packager l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis déploie ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation des versions bêta/stables publiées.
- `source=ref` empaquette une branche, une étiquette ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/étiquettes OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou une étiquette de publication, installe les dépendances dans un worktree détaché et l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais doit être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exact ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture des plugins hors ligne afin que la validation des packages publiés ne dépende pas de la disponibilité en direct de ClawHub. Le lane Telegram facultatif réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les dispatchs autonomes.

Les vérifications de publication appellent Package Acceptance avec `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` et `telegram_mode=mock-openai`. Les fragments Docker du chemin de publication couvrent les lanes qui se chevauchent pour les packages/mises à jour/plugins ; Package Acceptance conserve la preuve de compatibilité des canaux groupés native de l’artefact, des plugins hors ligne et de Telegram contre le même tarball de package résolu. Les vérifications de publication multi-OS couvrent toujours l’onboarding propre au système d’exploitation, l’installeur et le comportement de plateforme ; la validation produit des packages/mises à jour doit commencer par Package Acceptance. Les lanes Windows de package et d’installation fraîche vérifient également qu’un package installé peut importer un remplacement de contrôle du navigateur depuis un chemin Windows absolu brut. Le smoke de tour d’agent multi-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4-mini`, afin que la preuve d’installation et de Gateway reste rapide et déterministe.

### Fenêtres de compatibilité héritées

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas cet indicateur ;
- `update-channel-switch` peut supprimer les `pnpm.patchedDependencies` manquantes du faux fixture git dérivé du tarball et peut journaliser l’absence du `update.channel` persistant ;
- les smokes de plugins peuvent lire les anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance de l’enregistrement d’installation marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut aussi avertir pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’émettre un avertissement ou d’être ignorées.

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

Lors du débogage d’une exécution Package Acceptance échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lane, les minutages de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exacts plutôt que de relancer la validation complète de publication.

## Smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de plugin groupé, ou les surfaces Plugin SDK de plugin/canal/Gateway cœur que les jobs smoke Docker exercent. Les changements de plugin groupé uniquement source, les modifications uniquement de tests et les modifications uniquement de documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression des agents pour l’espace de travail partagé, exécute l’e2e gateway-network du conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné des plugins groupés sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve la couverture d’installation de package QR et d’installation/mise à jour Docker pour les exécutions nocturnes planifiées, les dispatchs manuels, les vérifications de publication workflow-call et les pull requests qui touchent réellement les surfaces d’installeur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installeur/mise à jour et l’E2E Docker rapide des plugins groupés comme jobs séparés afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushs vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de publication.

Le smoke lent du fournisseur d’image d’installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute sur la planification nocturne et depuis le workflow de vérifications de publication, et les dispatchs manuels `Install Smoke` peuvent l’activer, mais pas les pull requests ni les pushs vers `main`. Les tests Docker QR et d’installeur conservent leurs propres Dockerfiles orientés installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test en direct partagée, empaquette OpenClaw une fois comme tarball npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git minimal pour les lanes installeur/mise à jour/dépendance de plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normale.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur n’exécute que le plan sélectionné. L’ordonnanceur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de slots du pool principal pour les lanes normales.                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de slots du pool de fin sensible aux fournisseurs.                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de lanes en direct concurrentes afin que les fournisseurs ne limitent pas le débit.   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de lanes d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de lanes multiservices concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai de secours par lane (120 minutes) ; certaines lanes en direct/de fin utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan de l’ordonnanceur sans exécuter les lanes.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut quand même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. L’agrégat local effectue les prévalidations Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des lanes actives, persiste les minutages de lanes pour l’ordre du plus long d’abord et arrête par défaut de planifier de nouvelles lanes groupées après le premier échec.

### Workflow en direct/E2E réutilisable

Le workflow en direct/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels package, type d’image, image en direct, lane et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution actuelle ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images E2E Docker GHCR bare/fonctionnelles étiquetées par le digest du package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou des images existantes fondées sur le digest du package au lieu de reconstruire. Les extractions d’images Docker sont réessayées avec un délai borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué soit réessayé rapidement au lieu de consommer l’essentiel du chemin critique CI.

### Fragments du chemin de publication

La couverture Docker de publication exécute des jobs fragmentés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque fragment ne récupère que le type d’image dont il a besoin et exécute plusieurs lanes via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Les fragments Docker de la version actuelle sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` à `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` et `bundled-channels-contracts`. Le fragment agrégé `bundled-channels` reste disponible pour les relances manuelles en une seule passe, et `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de Plugin/runtime. L’alias de voie `install-e2e` reste l’alias de relance manuelle agrégé pour les deux voies d’installation de fournisseur. Le fragment `bundled-channels` exécute les voies divisées `bundled-channel-*` et `bundled-channel-update-*` plutôt que la voie sérielle tout-en-un `bundled-channel-deps`.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un fragment autonome `openwebui` uniquement pour les dispatchs limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque fragment téléverse `.artifacts/docker-tests/` avec les journaux de voie, les timings, `summary.json`, `failures.json`, les timings de phase, le JSON du plan d’ordonnancement, les tableaux des voies lentes et les commandes de relance par voie. L’entrée de workflow `docker_lanes` exécute les voies sélectionnées sur les images préparées au lieu des jobs de fragments, ce qui limite le débogage des voies en échec à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image de test live pour cette relance. Les commandes de relance GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie en échec puisse réutiliser exactement le package et les images de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication.

## Préversion de Plugin

`Plugin Prerelease` offre une couverture produit/package plus coûteuse, c’est donc un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les poussées sur `main` et les dispatchs CI manuels autonomes laissent cette suite désactivée. Il répartit les tests des Plugins groupés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois, avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugins lourds en imports ne créent pas de jobs CI supplémentaires.

## Laboratoire QA

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente.

- Le workflow `Parity gate` s’exécute sur les changements de PR correspondants et par dispatch manuel ; il construit le runtime QA privé et compare les packs agentiques simulés GPT-5.5 et Opus 4.6.
- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et par dispatch manuel ; il distribue en jobs parallèles la porte de parité simulée, la voie Matrix live et les voies Telegram et Discord live. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de publication exécutent les voies de transport live Matrix et Telegram avec le fournisseur simulé déterministe et les modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugins de fournisseur. Le gateway de transport live désactive la recherche mémoire parce que la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèles live, de fournisseurs natifs et de fournisseurs Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; le dispatch manuel `matrix_profile=all` répartit toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la publication avant l’approbation de publication ; sa porte de parité QA exécute les packs candidat et de référence comme jobs de voie parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison de parité finale.

Ne placez pas le chemin de landing de PR derrière `Parity gate` sauf si le changement touche réellement le runtime QA, la parité des packs de modèles ou une surface détenue par le workflow de parité. Pour les corrections normales de canal, de configuration, de documentation ou de tests unitaires, traitez-le comme un signal facultatif et suivez plutôt les preuves CI/vérifications à portée limitée.

## CodeQL

Le workflow `CodeQL` est volontairement un analyseur de sécurité de premier passage étroit, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque, avec des requêtes de sécurité à haute confiance filtrées sur les `security-severity` élevées/critiques.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, cron et base de référence du Gateway                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux cœur, plus le runtime de Plugin de canal, le Gateway, le SDK Plugin, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF cœur, analyse IP, garde réseau, récupération web et politique SSRF du SDK Plugin                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et portes d’exécution d’outils agent                             |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, du chargeur, du manifeste, du registre, de la mise en attente des dépendances runtime, du chargement de source et du contrat de package du SDK Plugin |

### Shards de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build de dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le shard non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non liées à la sécurité sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillon n’exécutent que les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements concernant l’exécution de commandes/modèles/outils agent et le code de dispatch des réponses, le schéma/la migration/les E/S de configuration, le code d’authentification/secrets/sandbox/sécurité, le runtime des canaux cœur et des Plugins de canaux groupés, le protocole/la méthode serveur du Gateway, la colle runtime/SDK de mémoire, MCP/processus/livraison sortante, le runtime fournisseur/catalogue de modèles, les diagnostics de session/files de livraison, le chargeur de Plugin, le contrat SDK Plugin/package, ou le runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’entrée d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de limite de sécurité pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                                                              |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats de méthodes serveur                                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal central et des Plugins de canal intégrés                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution des commandes, dispatch des modèles/fournisseurs, dispatch et files d’attente des réponses automatiques, et contrats d’exécution du plan de contrôle ACP               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte de mémoire, façades d’exécution de mémoire, alias du SDK de Plugin mémoire, liaison d’activation de l’exécution mémoire et commandes doctor de mémoire                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces d’événements diagnostiques/de bundles de journaux, et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch des réponses entrantes du SDK de Plugin, assistants de charge utile/segmentation/exécution des réponses, options de réponse de canal, files de livraison et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement de l’exécution des fournisseurs, valeurs par défaut/catalogues des fournisseurs, et registres web/recherche/récupération/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats d’exécution du plan de contrôle des tâches                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d’exécution pour la récupération/recherche web centrale, les E/S média, la compréhension des médias, la génération d’images et la génération de médias                  |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du SDK de Plugin                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du SDK de Plugin côté package publié et assistants de contrat de package de Plugin                                                                                        |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL à Swift, Python et aux Plugins intégrés ne doit être réintégrée sous forme de travail de suivi limité ou partitionné qu’une fois que les profils étroits disposent d’une exécution et d’un signal stables.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour maintenir les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie déclenchée par un push non-bot sur `main` peut le lancer, et un dispatch manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits allant du SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie déclenchée par un push non-bot sur `main` peut le lancer, mais il s’interrompt si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le dispatch manuel contourne cette barrière d’activité quotidienne. Cette voie construit un rapport de performance Vitest groupé sur la suite complète, permet à Codex de n’effectuer que de petites corrections de performance de tests qui préservent la couverture au lieu de vastes refactorisations, puis relance le rapport sur la suite complète et rejette les changements qui réduisent le nombre de tests réussis dans la référence. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le patch validé, relance `pnpm check:changed` et réessaie le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### PRs dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel destiné au nettoyage des doublons après intégration. Il utilise le mode simulation par défaut et ne ferme que les PRs explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changements se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les limites d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck de production du cœur et des tests du cœur, ainsi que le lint/les gardes du cœur ;
- les changements limités aux tests du cœur n’exécutent que le typecheck des tests du cœur et le lint du cœur ;
- les changements de production d’extension exécutent le typecheck de production et de test des extensions, ainsi que le lint des extensions ;
- les changements limités aux tests d’extension exécutent le typecheck des tests d’extension et le lint des extensions ;
- les changements publics du SDK de Plugin ou des contrats de Plugin s’étendent au typecheck des extensions, car les extensions dépendent de ces contrats du cœur (les balayages Vitest d’extensions restent un travail de test explicite) ;
- les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests eux-mêmes, les modifications de source privilégient les mappings explicites, puis les tests voisins et les dépendants du graphe d’import. La configuration partagée de livraison de salle de groupe fait partie des mappings explicites : les changements apportés à la configuration de réponse visible du groupe, au mode de livraison des réponses source ou au prompt système de l’outil de messages passent par les tests de réponse du cœur ainsi que par les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche assez largement le harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une box fraîche préchauffée pour les preuves larges. Avant de consacrer une porte lente à une box réutilisée, expirée ou venant de signaler une synchronisation anormalement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la box.

La vérification de sanité échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette box et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs comportant intentionnellement de nombreuses suppressions, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de sanité.

`pnpm testbox:run` termine également une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux exceptionnellement volumineux.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
summary: Graphe des jobs CI, garde-fous de périmètre, regroupements de publication et équivalents locaux des commandes
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-30T07:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque poussée vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les voies coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le cadrage intelligent et déploient le graphe complet pour les versions candidates et la validation large. Les voies Android restent optionnelles via `include_android`. La couverture des plugins réservée aux releases se trouve dans le workflow séparé [`Plugin Préversion`](#plugin-prerelease) et ne s’exécute qu’à partir de [`Validation complète de release`](#full-release-validation) ou d’un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                     | Quand il s’exécute                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Détecter les changements limités aux docs, les portées modifiées, les extensions modifiées et construire le manifeste CI | Toujours sur les poussées et PR non brouillon |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                | Toujours sur les poussées et PR non brouillon |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                    | Toujours sur les poussées et PR non brouillon |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                             | Toujours sur les poussées et PR non brouillon |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde de la liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node           |
| `build-artifacts`                | Construire `dist/`, la Control UI, les vérifications d’artefacts construits et les artefacts aval réutilisables | Changements pertinents pour Node           |
| `checks-fast-core`               | Voies rapides de correction Linux, comme les vérifications bundled/contrat de plugin/protocole | Changements pertinents pour Node           |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat de vérification agrégé stable | Changements pertinents pour Node           |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors voies canal, bundled, contrat et extension             | Changements pertinents pour Node           |
| `check`                          | Équivalent fragmenté de la porte locale principale : types prod, lint, gardes, types de tests et smoke strict | Changements pertinents pour Node           |
| `check-additional`               | Fragments d’architecture, de frontière, de gardes de surface d’extension, de frontière de package et de gateway-watch | Changements pertinents pour Node           |
| `build-smoke`                    | Tests smoke de CLI construite et smoke de mémoire au démarrage                               | Changements pertinents pour Node           |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits                               | Changements pertinents pour Node           |
| `checks-node-compat-node22`      | Voie de build et smoke de compatibilité Node 22                                              | Dispatch CI manuel pour les releases       |
| `check-docs`                     | Formatage, lint et vérifications de liens brisés des docs                                    | Docs modifiées                             |
| `skills-python`                  | Ruff + pytest pour les skills adossés à Python                                               | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Tests de processus/chemins spécifiques à Windows, plus régressions de spécificateurs d’import runtime partagés | Changements pertinents pour Windows        |
| `macos-node`                     | Voie de tests TypeScript macOS utilisant les artefacts construits partagés                   | Changements pertinents pour macOS          |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                  | Changements pertinents pour macOS          |
| `android`                        | Tests unitaires Android pour les deux variantes, plus un build d’APK debug                   | Changements pertinents pour Android        |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après une activité approuvée                  | Succès de la CI principale ou dispatch manuel |

## Ordre fail-fast

1. `preflight` décide quelles voies existent effectivement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, et non à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` se chevauche avec les voies Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les voies plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’une poussée plus récente arrive sur la même PR ou la même référence `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications agrégées de fragments utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de fragments, mais sans se mettre en file d’attente après que l’ensemble du workflow a déjà été remplacé. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions principales. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Portée et routage

La logique de portée se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection `changed-scope` et fait agir le manifeste preflight comme si chaque zone cadrée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces voies de plateforme restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests du cœur, ainsi que les modifications étroites d’aides/tests de routage de contrat de plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, la sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les fragments complets du cœur, les fragments de plugins bundled et les matrices de gardes additionnelles lorsque le changement se limite aux surfaces de routage ou d’aide que la tâche rapide exerce directement.
- **Les vérifications Windows Node** sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux aides d’exécution npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces du workflow CI qui exécutent cette voie ; les changements sans rapport de source, de plugin, d’install-smoke et uniquement de tests restent sur les voies Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver les runners : les contrats de canaux s’exécutent en trois fragments pondérés, les petites voies unitaires du cœur sont appariées, auto-reply s’exécute avec quatre workers équilibrés (avec le sous-arbre reply divisé en fragments agent-runner, dispatch et commands/state-routing), et les configurations agentic de Gateway/plugin sont réparties dans les jobs Node agentic existants limités aux sources au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées plutôt que le fourre-tout partagé des plugins. Les fragments par motifs d’inclusion enregistrent les entrées de durée avec le nom du fragment CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration complète d’un fragment filtré. `check-additional` garde ensemble le travail de compilation/canary de frontière de package et sépare l’architecture de topologie runtime de la couverture gateway watch ; le fragment de garde de frontière exécute ses petits gardes indépendants simultanément dans un seul job. Gateway watch, les tests de canaux et le fragment de frontière de support du cœur s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a pas de source set ni de manifeste séparé ; sa voie de tests unitaires compile tout de même la variante avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug dupliqué à chaque poussée pertinente pour Android.

Le fragment `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés trouvés par Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée périmée dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugin dynamique, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Dispatchs manuels

Les dispatchs CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque voie cadrée non Android : fragments Linux Node, fragments de plugins bundled, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, build smoke, vérifications des docs, Skills Python, Windows, macOS et i18n de la Control UI. Les dispatchs CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de préversion de plugins, le fragment `agentic-plugins` réservé aux releases, le balayage complet par lots des extensions et les voies Docker de préversion de plugins sont exclus de la CI. La suite Docker de préversion s’exécute uniquement lorsque `Validation complète de release` déclenche le workflow séparé `Plugin Préversion` avec la porte de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre poussée ou exécution de PR sur la même référence. L’entrée optionnelle `target_ref` permet à un appelant approuvé d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet, tout en utilisant le fichier de workflow depuis la référence de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches et agrégats de sécurité rapides (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/bundled, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Node Linux, fragments de tests de Plugins bundled, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU aient coûté plus qu’ils n’ont économisé) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU a coûté plus qu’il n’a économisé)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Validation complète de release

`Full Release Validation` est le workflow manuel englobant pour « tout exécuter avant la release ». Il accepte une branche, une balise ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves réservées à la release concernant Plugin/package/statique/Docker, et déclenche `OpenClaw Release Checks` pour les install smoke, l’acceptation de package, les suites de chemin de release Docker, live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Il peut aussi exécuter le workflow post-publication `NPM Telegram Beta E2E` lorsqu’une spécification de package publiée est fournie.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de release :

- `minimum` conserve les voies critiques de release OpenAI/core les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseurs/médias.

L’englobant enregistre les ID d’exécution enfant déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfant et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez seulement la tâche de vérification parente pour actualiser le résultat englobant et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une release candidate, `ci` uniquement pour l’enfant CI complet normal, `release-checks` pour chaque enfant de release, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur l’englobant. Cela garde bornée la relance d’une boîte de release échouée après un correctif ciblé.

`OpenClaw Release Checks` utilise la ref de workflow de confiance pour résoudre une fois la ref sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact à la fois au workflow Docker de chemin de release live/E2E et au fragment d’acceptation de package. Cela maintient les octets du package cohérents entre les boîtes de release et évite de reconditionner le même candidat dans plusieurs tâches enfant.

## Fragments live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute comme fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une tâche sérielle unique :

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
- fragments médias audio/vidéo séparés et fragments musicaux filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les fragments médias live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches médias vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur les exécuteurs Blacksmith normaux — les tâches de conteneur ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments live modèle/backend adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow live de release construit et pousse cette image une fois, puis les fragments modèle live Docker, Gateway, backend CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de release est mal configurée et gaspillera du temps réel sur des builds d’image en double.

## Acceptation de package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme produit ? ». Elle diffère de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation de package valide un seul tarball via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la ref de workflow, la ref de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker à condensé de package si nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu de packager l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une fois, puis déploie ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution de package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation publiée bêta/stable.
- `source=ref` empaquette une branche, une balise ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/balises OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique de branche du dépôt ou une balise de publication, installe les dépendances dans un worktree détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est empaqueté quand `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exact ; requis quand `suite_profile=custom`

Le profil `package` utilise une couverture de plugins hors ligne afin que la validation des packages publiés ne dépende pas de la disponibilité en direct de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publié étant conservé pour les dispatches autonomes.

Les vérifications de publication appellent Package Acceptance avec `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` et `telegram_mode=mock-openai`. Les fragments Docker du chemin de publication couvrent les voies package/update/plugin qui se chevauchent ; Package Acceptance conserve la compatibilité bundled-channel native de l’artefact, le plugin hors ligne et la preuve Telegram sur la même archive tar de package résolue. Les vérifications de publication inter-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme propres à l’OS ; la validation produit package/update devrait commencer avec Package Acceptance. Les voies Windows packaged et installer fresh vérifient aussi qu’un package installé peut importer un remplacement browser-control depuis un chemin Windows absolu brut. Le smoke de tour d’agent OpenAI inter-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` quand il est défini, sinon `openai/gpt-5.4-mini`, afin que la preuve d’installation et de Gateway reste rapide et déterministe.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tar ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` quand le package n’expose pas ce drapeau ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquants depuis la fausse fixture git dérivée de l’archive tar et peut journaliser l’absence de `update.channel` persistant ;
- les smokes de plugins peuvent lire d’anciens emplacements d’enregistrement d’installation ou accepter l’absence de persistance de l’enregistrement d’installation de la marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut aussi avertir pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution Package Acceptance échouée, commencez par le résumé `resolve_package` pour confirmer la source, la version et le SHA-256 du package. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voie, les temps de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer toute la validation de publication.

## Smoke d’installation

Le workflow `Install Smoke` séparé réutilise le même script de portée via sa propre tâche `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de plugins groupés, ou les surfaces principales de plugin/canal/Gateway/Plugin SDK que les tâches de smoke Docker exercent. Les changements de plugins groupés limités au source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image Dockerfile racine une fois, vérifie la CLI, exécute le smoke CLI de suppression des agents dans l’espace de travail partagé, exécute l’e2e gateway-network du conteneur, vérifie un argument de build d’extension groupée, puis exécute le profil Docker borné de plugin groupé sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les dispatches manuels, les vérifications de publication par workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image de smoke Dockerfile racine GHCR pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installateur/update et l’E2E Docker rapide de plugin groupé comme tâches séparées afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushes sur `main` (y compris les commits de merge) ne forcent pas le chemin complet ; quand la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de publication.

Le smoke lent de fournisseur d’image par installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon le planning nocturne et depuis le workflow de vérifications de publication, et les dispatches manuels `Install Smoke` peuvent choisir de l’inclure, mais les pull requests et les pushes sur `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test en direct partagée, empaquette OpenClaw une fois sous forme d’archive tar npm, puis construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git minimal pour les voies installateur/update/dépendances de plugin ;
- une image fonctionnelle qui installe la même archive tar dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur exécute uniquement le plan sélectionné. L’ordonnanceur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de créneaux du pool principal pour les voies normales.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de créneaux du pool final sensible aux fournisseurs.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de voies en direct concurrentes pour éviter que les fournisseurs ne limitent le débit. |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de voies d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de voies multi-services concurrentes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai de secours par voie (120 minutes) ; certaines voies live/tail utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan de l’ordonnanceur sans exécuter les voies.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de voies séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécuter seule jusqu’à libérer de la capacité. Le préflight agrégé local vérifie Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, persiste les temps de voie pour l’ordre du plus long au plus court, et cesse par défaut de planifier de nouvelles voies mutualisées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, type d’image, image live, voie et identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire de l’archive tar ; construit et pousse les images E2E Docker GHCR bare/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith quand le plan a besoin de voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai borné de 180 secondes par tentative afin qu’un flux registre/cache bloqué retente rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Fragments du chemin de publication

La couverture Docker de publication exécute des tâches fragmentées plus petites avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque fragment ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Les fragments Docker de la version actuelle sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` à `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` et `bundled-channels-contracts`. Le fragment agrégé `bundled-channels` reste disponible pour les réexécutions manuelles ponctuelles, et `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de plugin/runtime. L’alias de voie `install-e2e` reste l’alias de réexécution manuelle agrégé pour les deux voies d’installation des fournisseurs. Le fragment `bundled-channels` exécute des voies scindées `bundled-channel-*` et `bundled-channel-update-*` plutôt que la voie série tout-en-un `bundled-channel-deps`.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un fragment autonome `openwebui` uniquement pour les dispatches limités à OpenWebUI. Les voies de mise à jour des canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque fragment téléverse `.artifacts/docker-tests/` avec les journaux de voie, les durées, `summary.json`, `failures.json`, les durées de phase, le JSON du planificateur, les tableaux de voies lentes et les commandes de réexécution par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées sur les images préparées au lieu des jobs de fragments, ce qui limite le débogage d’une voie en échec à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, de sorte qu’une voie en échec puisse réutiliser exactement le package et les images de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication.

## Préversion de Plugin

`Plugin Prerelease` offre une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow distinct déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main` et les dispatches CI manuels autonomes gardent cette suite désactivée. Il répartit les tests des plugins groupés sur huit workers d’extension ; ces jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration de plugin à la fois, avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de plugins lourds en imports ne créent pas de jobs CI supplémentaires.

## Labo QA

Le Labo QA dispose de voies CI dédiées en dehors du workflow principal à périmètre intelligent.

- Le workflow `Parity gate` s’exécute sur les changements de PR correspondants et par dispatch manuel ; il construit le runtime QA privé et compare les packs agentiques fictifs GPT-5.5 et Opus 4.6.
- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et par dispatch manuel ; il répartit en jobs parallèles la porte de parité fictive, la voie Matrix live, ainsi que les voies Telegram et Discord live. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les contrôles de publication exécutent les voies de transport live Matrix et Telegram avec le fournisseur fictif déterministe et des modèles qualifiés pour le mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des plugins fournisseurs. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites distinctes de modèles live, fournisseurs natifs et fournisseurs Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un dispatch manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la publication avant l’approbation de publication ; sa porte de parité QA exécute les packs candidat et de référence comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Ne placez pas le chemin d’intégration des PR derrière `Parity gate` sauf si le changement touche réellement au runtime QA, à la parité des packs de modèles ou à une surface appartenant au workflow de parité. Pour les correctifs normaux de canal, de configuration, de documentation ou de tests unitaires, traitez-le comme un signal facultatif et suivez plutôt les preuves CI/contrôles à périmètre défini.

## CodeQL

Le workflow `CodeQL` est intentionnellement un analyseur de sécurité étroit de premier passage, et non un balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde sur pull requests non brouillons analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées, avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevée/critique.

La garde des pull requests reste légère : elle démarre uniquement pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, Cron et référence du Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation du canal principal, plus runtime de plugin de canal, Gateway, SDK Plugin, secrets et points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF principales, analyse IP, garde réseau, web-fetch et politique SSRF du SDK Plugin                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante et portes d’exécution d’outils agent                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Installation de Plugin, chargeur, manifeste, registre, préparation des dépendances runtime, chargement des sources et surfaces de confiance du contrat de package du SDK Plugin |

### Fragments de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build de dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs quotidiennes par défaut, car le build macOS domine la durée d’exécution même lorsqu’il est propre.

### Catégories de qualité critiques

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non liées à la sécurité sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa garde de pull request est intentionnellement plus réduite que le profil planifié : les PR non brouillons exécutent uniquement les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements de code d’exécution des commandes/modèles/outils d’agent et de dispatch de réponses, de code de schéma/migration/E/S de configuration, de code auth/secrets/sandbox/sécurité, de runtime des canaux principaux et des plugins de canaux groupés, de protocole Gateway/méthode serveur, de runtime mémoire/liaison SDK, de MCP/processus/livraison sortante, de runtime fournisseur/catalogue de modèles, de diagnostics de session/files de livraison, de chargeur de plugin, de SDK Plugin/contrat de package ou de runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze fragments de qualité PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’entrée d’apprentissage et d’itération pour exécuter un fragment de qualité isolément.

| Catégorie                                              | Surface                                                                                                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, le sandbox, Cron et le Gateway                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats des méthodes serveur                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal principal et du plugin de canal groupé                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution des commandes, dispatch des modèles/fournisseurs, dispatch et files de réponse automatique, et contrats d’exécution du plan de contrôle ACP                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus, et contrats de livraison sortante                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades d’exécution mémoire, alias mémoire du Plugin SDK, logique d’activation de l’exécution mémoire, et commandes doctor de mémoire                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de la file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de bundle d’événements/journaux de diagnostic, et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch des réponses entrantes du Plugin SDK, assistants de charge utile/découpage/exécution des réponses, options de réponse de canal, files de livraison, et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement de l’exécution des fournisseurs, valeurs par défaut/catalogues des fournisseurs, et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway, et contrats d’exécution du plan de contrôle des tâches                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d’exécution pour la récupération/recherche web principale, les E/S média, la compréhension média, la génération d’images et la génération de médias                           |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté package publié et assistants de contrat de package de plugin                                                                                                 |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL pour Swift, Python et les plugins groupés ne doit être réintroduite sous forme de travail de suivi ciblé ou fragmenté qu’une fois que les profils restreints disposent d’une exécution et d’un signal stables.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par les événements pour garder la documentation existante alignée sur les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie issue d’un push non-bot sur `main` peut le déclencher, et un déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée au cours de la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits allant du précédent SHA source non ignoré de Docs Agent jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis la dernière passe de documentation.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par les événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie issue d’un push non-bot sur `main` peut le déclencher, mais il s’interrompt si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé pour toute la suite, autorise Codex à n’apporter que de petites corrections de performance de tests préservant la couverture au lieu de larges refactorisations, puis réexécute le rapport de toute la suite et rejette les changements qui réduisent le nombre de tests de référence réussis. Si la référence contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de toute la suite après l’agent doit réussir avant que quoi que ce soit soit committé. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le correctif validé, réexécute `pnpm check:changed`, puis retente le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent de documentation.

### PR dupliquées après merge

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il est en simulation par défaut et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit une issue référencée en commun, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types prod du cœur et tests du cœur, plus le lint/les gardes du cœur ;
- les changements concernant uniquement les tests du cœur exécutent seulement la vérification de types des tests du cœur plus le lint du cœur ;
- les changements de production des plugins exécutent la vérification de types prod des plugins et tests des plugins, plus le lint des plugins ;
- les changements concernant uniquement les tests des plugins exécutent la vérification de types des tests des plugins plus le lint des plugins ;
- les changements du Plugin SDK public ou du contrat de plugin s’étendent à la vérification de types des plugins parce que les plugins dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les augmentations de version limitées aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les correspondances explicites, puis les tests frères et les dépendants du graphe d’import. La configuration partagée de livraison group-room fait partie des correspondances explicites : les changements apportés à la configuration des réponses visibles de groupe, au mode de livraison des réponses source ou au prompt système de l’outil de message passent par les tests de réponse du cœur, plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est suffisamment global au harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une boîte fraîche préchauffée pour les preuves larges. Avant de consacrer une porte lente à une boîte réutilisée, expirée ou qui vient de signaler une synchronisation inhabituellement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette boîte et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PR avec suppressions massives intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine également une invocation locale du CLI Blacksmith qui reste en phase de synchronisation plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur plus grande en millisecondes pour des diffs locaux inhabituellement volumineux.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

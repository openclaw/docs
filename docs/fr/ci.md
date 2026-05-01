---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
summary: Graphe des jobs CI, contrôles de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-01T07:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. La tâche `preflight` classe le diff et désactive les lanes coûteuses lorsque seuls des domaines sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le périmétrage intelligent et déploient tout le graphe pour les candidats de release et la validation large. Les lanes Android restent opt-in via `include_android`. La couverture des Plugins réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou lors d’un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Tâche                            | Objectif                                                                                    | Quand elle s’exécute              |
| -------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushes et PRs non draft |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                               | Toujours sur les pushes et PRs non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux advisories npm             | Toujours sur les pushes et PRs non draft |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                          | Toujours sur les pushes et PRs non draft |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances plus garde de la allowlist des fichiers inutilisés | Changements pertinents pour Node |
| `build-artifacts`                | Construire `dist/`, l’interface utilisateur Control, les vérifications d’artifacts construits, et les artifacts downstream réutilisables | Changements pertinents pour Node |
| `checks-fast-core`               | Lanes de correction Linux rapides comme les vérifications bundled/plugin-contract/protocol | Changements pertinents pour Node |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de channels avec un résultat de vérification agrégé stable | Changements pertinents pour Node |
| `checks-node-core-test`          | Shards de tests Core Node, hors lanes channel, bundled, contract et extension               | Changements pertinents pour Node |
| `check`                          | Équivalent shardé du gate local principal : types prod, lint, guards, types de test et smoke strict | Changements pertinents pour Node |
| `check-additional`               | Shards d’architecture, boundary, guards de surface d’extension, package-boundary et gateway-watch | Changements pertinents pour Node |
| `build-smoke`                    | Tests smoke du CLI construit et smoke de mémoire au démarrage                               | Changements pertinents pour Node |
| `checks`                         | Vérificateur pour les tests channel sur artifacts construits                                | Changements pertinents pour Node |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                             | Dispatch CI manuel pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                   | Docs modifiées                    |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                             | Changements pertinents pour les skills Python |
| `checks-windows`                 | Tests spécifiques à Windows pour les processus/chemins plus régressions partagées des spécificateurs d’import runtime | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artifacts construits partagés                  | Changements pertinents pour macOS |
| `macos-swift`                    | Swift lint, build et tests pour l’application macOS                                         | Changements pertinents pour macOS |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build d’APK debug                     | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après une activité fiable                    | Succès CI sur main ou dispatch manuel |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans cette tâche, pas des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches de matrice d’artifacts et de plateformes plus lourdes.
3. `build-artifacts` s’exécute en parallèle des lanes Linux rapides afin que les consommateurs downstream puissent démarrer dès que le build partagé est prêt.
4. Les lanes de plateforme et runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les vérifications de shards agrégés utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards sans toutefois se mettre en file d’attente après que tout le workflow a déjà été remplacé. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de la suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests Core, et les modifications étroites de helpers/tests de routage de contrats de Plugins** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artifacts de build, la compatibilité Node 22, les contrats de channels, les shards Core complets, les shards de Plugins bundled, et les matrices de guards supplémentaires lorsque le changement est limité aux surfaces de routage ou de helpers que la tâche rapide exerce directement.
- **Les vérifications Windows Node** sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux helpers npm/pnpm/UI runner, à la configuration du gestionnaire de paquets, et aux surfaces de workflow CI qui exécutent cette lane ; les changements de source, plugin, install-smoke et tests-only sans rapport restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans sur-réserver de runners : les contrats de channels s’exécutent en trois shards pondérés, les petites lanes unitaires Core sont appariées, auto-reply s’exécute avec quatre workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentic gateway/plugin sont réparties sur les tâches Node agentic source-only existantes au lieu d’attendre les artifacts construits. Les tests larges de navigateur, QA, médias et Plugins divers utilisent leurs configurations Vitest dédiées au lieu du catch-all partagé des Plugins. Les shards include-pattern enregistrent les entrées de timing avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard boundary guard exécute ses petits guards indépendants en parallèle dans une seule tâche. Gateway watch, les tests de channels, et le shard Core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Android CI exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparés ; sa lane de tests unitaires compile tout de même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant une tâche redondante de packaging d’APK debug à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimum de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le guard des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée d’allowlist périmée, tout en préservant les surfaces intentionnelles de plugin dynamique, générées, build, live-test et package bridge que Knip ne peut pas résoudre statiquement.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de tâches que la CI normale mais forcent toutes les lanes périmétrées non Android : shards Linux Node, shards de Plugins bundled, contrats de channels, compatibilité Node 22, `check`, `check-additional`, build smoke, vérifications docs, Skills Python, Windows, macOS et i18n de l’interface utilisateur Control. Les dispatches CI manuels autonomes exécutent Android uniquement avec `include_android=true` ; l’umbrella de release complète active Android en passant `include_android=true`. Les vérifications statiques de prerelease Plugins, le shard `agentic-plugins` réservé aux releases, le sweep complet par batch des extensions, et les lanes Docker de prerelease Plugins sont exclus de la CI. La suite Docker prerelease ne s’exécute que lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec le gate de validation de release activé.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de candidat de release ne soit pas annulée par une autre exécution de push ou PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant fiable d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/groupées, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs agrégés des tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le précontrôle install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments de Plugin moins lourds, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Node Linux, fragments de tests de Plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font gagner) ; builds Docker install-smoke (le temps d’attente en file 32 vCPU coûte plus qu’il ne fait gagner)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |

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

## Validation complète de la version

`Full Release Validation` est le workflow manuel global pour « tout exécuter avant une version ». Il accepte une branche, une balise ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour la preuve réservée aux versions concernant les Plugins/paquets/statiques/Docker, et déclenche `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation du paquet, les suites du chemin de version Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Il peut aussi exécuter le workflow post-publication `NPM Telegram Beta E2E` lorsqu’une spécification de paquet publié est fournie.

Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et les
points de relance ciblés.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de version. Les
workflows de version manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
voulez intentionnellement la vaste matrice consultative fournisseurs/médias.

- `minimum` conserve les voies OpenAI/noyau critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la vaste matrice consultative fournisseurs/médias.

Le workflow global enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute les tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat global et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une version candidate, `ci` pour uniquement l’enfant CI complet normal, `plugin-prerelease` pour uniquement l’enfant de préversion du Plugin, `release-checks` pour chaque enfant de version, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le workflow global. Cela maintient bornée la relance d’une boîte de version échouée après un correctif ciblé.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact à la fois au workflow Docker live/E2E du chemin de version et au fragment d’acceptation du paquet. Cela garde les octets du paquet cohérents entre les boîtes de version et évite de reconditionner le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow global. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin que la validation main plus récente
ne reste pas bloquée derrière une exécution release-check obsolète de deux heures. La validation des branches/balises
de version et les groupes de relance ciblés gardent `cancel-in-progress: false`.

## Fragments live et E2E

L’enfant live/E2E de version conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche série :

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

Cela conserve la même couverture de fichiers tout en rendant les échecs live lents de fournisseurs plus faciles à relancer et diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles en une seule fois.

Les fragments médias live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches médias vérifient seulement les binaires avant la configuration. Gardez les suites live basées sur Docker sur des exécuteurs Blacksmith normaux — les tâches en conteneur ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les fragments live de modèles/backends basés sur Docker utilisent une image partagée séparée `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de version live construit et pousse cette image une seule fois, puis les fragments du modèle live Docker, du Gateway fragmenté par fournisseur, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker du Gateway portent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget release-check. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de version est mal configurée et gaspillera du temps d’horloge sur des builds d’images en double.

## Acceptation du paquet

Utilisez `Package Acceptance` lorsque la question est « ce paquet OpenClaw installable fonctionne-t-il comme un produit ? ». Elle est différente de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du paquet valide une archive unique au moyen du même harnais Docker E2E que les utilisateurs exercent après l’installation ou la mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis imprime la source, la référence du workflow, la référence du package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker package-digest si nécessaire, puis exécute les voies Docker sélectionnées avec ce package au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis déploie ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle facultativement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; une distribution Telegram autonome peut toujours installer une spec npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte comme `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation bêta/stable publiée.
- `source=ref` empaquette une branche, une étiquette ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/étiquettes OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique des branches du dépôt ou depuis une étiquette de publication, installe les dépendances dans un worktree détaché, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif, mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de plugins hors ligne afin que la validation du package publié ne dépende pas de la disponibilité en direct de ClawHub. La voie Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tout en conservant le chemin de spec npm publiée pour les distributions autonomes.

Les vérifications de publication appellent Package Acceptance avec `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` et `telegram_mode=mock-openai`. Les segments Docker du chemin de publication couvrent les voies package/mise à jour/plugin qui se chevauchent ; Package Acceptance conserve la preuve native à l’artefact pour la compatibilité des canaux groupés, le plugin hors ligne et Telegram avec le même tarball de package résolu. Les vérifications de publication inter-OS couvrent toujours l’onboarding, l’installeur et le comportement de plateforme propres à chaque OS ; la validation produit package/mise à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une référence de package publiée par exécution. Dans Package Acceptance, le tarball `package-under-test` résolu est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée, par défaut `openclaw@latest` ; les commandes de relance des voies en échec préservent cette référence. Les exécutions locales peuvent définir `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` sur un package exact comme `openclaw@2026.4.15`. La voie publiée configure la référence avec une recette de commande `openclaw config set` intégrée, puis enregistre les étapes de la recette dans `summary.json`. Une couverture plus large des versions précédentes devrait fragmenter Package Acceptance entre des valeurs `published_upgrade_survivor_baseline` exactes. Les voies Windows fraîches packagées et installeur vérifient également qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke agent-turn OpenAI inter-OS utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4-mini`, afin que la preuve d’installation et de Gateway reste rapide et déterministe.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres de compatibilité héritée bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas cet indicateur ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes de la fausse fixture git dérivée du tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de plugin peuvent lire les anciens emplacements d’enregistrements d’installation ou accepter l’absence de persistance de l’enregistrement d’installation marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut également avertir pour les fichiers de cachet de métadonnées de build local déjà livrés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le récapitulatif `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux des lanes, les minutages de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer toute la validation de release.

## Test smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de périmètre via son propre job `preflight`. Il répartit la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces principales de Plugin/canal/Gateway/Plugin SDK exercées par les jobs de smoke Docker. Les changements de Plugin groupé uniquement dans le source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression d’agents en espace de travail partagé, exécute l’E2E du réseau de Gateway de conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné de Plugin groupé avec un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les dispatches manuels, les vérifications de release via workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR du Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installateur/update et l’E2E Docker rapide de Plugin groupé comme jobs séparés, afin que le travail d’installateur n’attende pas derrière les smokes de l’image racine.

Les pushes sur `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de périmètre modifié demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent du fournisseur d’images avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute sur la planification nocturne et depuis le workflow des vérifications de release, et les dispatches manuels `Install Smoke` peuvent l’activer, mais les pull requests et les pushes sur `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une seule fois sous forme de tarball npm, et construit deux images partagées `scripts/e2e/Dockerfile` :

- un runner Node/Git minimal pour les lanes installateur/update/dépendances de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normales.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification dans `scripts/lib/docker-e2e-plan.mjs`, et le runner exécute uniquement le plan sélectionné. Le planificateur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                                      |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de créneaux du pool principal pour les lanes normales.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de créneaux du pool de fin sensible aux fournisseurs.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Limite de lanes live concurrentes afin que les fournisseurs ne brident pas.                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                | Limite de lanes d’installation npm concurrentes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Limite de lanes multiservice concurrentes.                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai de secours par lane (120 minutes) ; les lanes live/de fin sélectionnées utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan du planificateur sans exécuter les lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis une réserve vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. L’agrégat local précontrôle Docker, supprime les anciens conteneurs E2E OpenClaw, émet l’état des voies actives, persiste les durées des voies pour un ordre du plus long au plus court, et arrête par défaut de planifier de nouvelles voies mutualisées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels package, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il emballe OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution en cours, ou télécharge un artefact de package depuis `package_artifact_run_id`; valide l’inventaire du tarball; construit et pousse des images Docker E2E GHCR bare/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de les reconstruire. Les tirages d’images Docker sont retentés avec un délai d’expiration borné de 180 secondes par tentative, afin qu’un flux de registre/cache bloqué retente rapidement au lieu de consommer la majeure partie du chemin critique de la CI.

### Fragments de chemin de publication

La couverture Docker de publication exécute de plus petits jobs fragmentés avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque fragment ne tire que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Les fragments Docker de publication actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` à `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` et `bundled-channels-contracts`. Le fragment agrégé `bundled-channels` reste disponible pour les relances manuelles ponctuelles, et `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de relance manuelle pour les deux voies d’installation des fournisseurs. Le fragment `bundled-channels` exécute des voies fractionnées `bundled-channel-*` et `bundled-channel-update-*` plutôt que la voie série tout-en-un `bundled-channel-deps`.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un fragment autonome `openwebui` uniquement pour les dispatchs réservés à OpenWebUI. Les voies de mise à jour de canaux groupés retentent une fois en cas d’échecs réseau npm transitoires.

Chaque fragment téléverse `.artifacts/docker-tests/` avec les journaux de voie, les durées, `summary.json`, `failures.json`, les durées de phase, le JSON de plan du planificateur, les tableaux de voies lentes et les commandes de relance par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées sur les images préparées au lieu des jobs de fragments, ce qui limite le débogage des voies en échec à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image de test live pour cette relance. Les commandes de relance GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie en échec puisse réutiliser le package et les images exacts de l’exécution en échec.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication.

## Préversion de Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse; il s’agit donc d’un workflow distinct déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes sur `main` et les dispatchs CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests des Plugin groupés sur huit workers d’extension; ces jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration Plugin à la fois, avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugin lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de prépublication Docker réservé à la publication regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## Laboratoire QA

Le laboratoire QA dispose de voies CI dédiées en dehors du workflow principal à portée intelligente.

- Le workflow `Parity gate` s’exécute sur les modifications de PR correspondantes et en dispatch manuel; il construit le runtime QA privé et compare les packs agentiques mock GPT-5.5 et Opus 4.6.
- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et en dispatch manuel; il répartit le portail de parité mock, la voie Matrix live, ainsi que les voies Telegram et Discord live en jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de publication exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugin de fournisseur. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire; la connectivité des fournisseurs est couverte par les suites distinctes de modèles live, fournisseurs natifs et fournisseurs Docker.

Matrix utilise `--profile fast` pour les contrôles planifiés et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all`; le dispatch manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies critiques de publication du laboratoire QA avant l’approbation de publication; son portail de parité QA exécute les packs candidat et de référence en jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Ne placez pas le chemin de landing de PR derrière `Parity gate`, sauf si la modification touche réellement au runtime QA, à la parité des packs de modèles ou à une surface possédée par le workflow de parité. Pour les correctifs normaux de canal, configuration, documentation ou tests unitaires, traitez-le comme un signal facultatif et suivez plutôt les preuves de CI/vérifications à portée limitée.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité étroit de premier passage, et non le balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de protection des pull requests non brouillonnes analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque, avec des requêtes de sécurité à forte confiance filtrées sur `security-severity` élevée/critique.

La protection des pull requests reste légère : elle ne démarre que pour les modifications sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et exécute la même matrice de sécurité à forte confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, Cron et référence de base du Gateway                                                            |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux cœur, plus le runtime Plugin de canal, le Gateway, le SDK Plugin, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF cœur, analyse IP, garde réseau, récupération web et politique SSRF du SDK Plugin                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, aides d’exécution de processus, livraison sortante et portails d’exécution d’outils d’agent                              |
| `/codeql-security-high/plugin-trust-boundary`     | Installation Plugin, chargeur, manifeste, registre, préparation des dépendances runtime, chargement des sources et surfaces de confiance du contrat de package du SDK Plugin |

### Fragments de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la validation de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il n’exécute que des requêtes de qualité JavaScript/TypeScript non liées à la sécurité et de sévérité erreur, sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa protection des pull requests est volontairement plus petite que le profil planifié : les PR non brouillonnes n’exécutent que les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les modifications du code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, du code de schéma/migration/E/S de configuration, du code d’authentification/secrets/bac à sable/sécurité, du runtime des canaux cœur et des Plugin de canaux groupés, du protocole Gateway/méthode serveur, de la colle runtime mémoire/SDK, de MCP/processus/livraison sortante, du runtime fournisseur/catalogue de modèles, des diagnostics de session/files de livraison, du chargeur de Plugin, du contrat SDK Plugin/package, ou du runtime de réponse SDK Plugin. Les modifications de configuration CodeQL et de workflow de qualité exécutent les douze fragments qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’entrée d’apprentissage/itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentification, secrets, sandbox, Cron et code de frontière de sécurité du Gateway                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats des méthodes serveur                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux principaux et des plugins de canal groupés                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution des commandes, distribution des modèles/fournisseurs, distribution et files d’attente des réponses automatiques, et contrats d’exécution du plan de contrôle ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades d’exécution mémoire, alias du SDK de Plugin mémoire, couche d’activation de l’exécution mémoire et commandes doctor de la mémoire       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file d’attente de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de lots d’événements/journaux de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK de Plugin, assistants d’exécution/de fragmentation/de charge utile de réponse, options de réponse de canal, files de livraison et assistants de liaison de session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement de l’exécution des fournisseurs, valeurs par défaut/catalogues des fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats d’exécution du plan de contrôle des tâches                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d’exécution de récupération/recherche web principale, d’E/S média, de compréhension des médias, de génération d’images et de génération de médias             |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du SDK de Plugin                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté package du SDK de Plugin et assistants de contrats de package de plugin                                                                             |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL pour Swift, Python et les plugins groupés ne doit être réintroduite que comme travail de suivi circonscrit ou fragmenté, une fois que les profils étroits disposent d’une exécution et d’un signal stables.

## Flux de maintenance

### Agent Docs

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par les événements pour garder la documentation existante alignée avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie, non bot, déclenchée par push sur `main` peut le déclencher, et un déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’à `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis la dernière passe de documentation.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par les événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie, non bot, déclenchée par push sur `main` peut le déclencher, mais il s’arrête si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé pour la suite complète, permet à Codex d’appliquer uniquement de petites corrections de performance des tests qui préservent la couverture au lieu de larges refactorisations, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests de référence réussis. Si la référence contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant l’arrivée du push du bot, la voie rebase le patch validé, relance `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### PRs en double après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il fonctionne par défaut en dry-run et ne ferme que les PRs explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée en commun, soit des blocs modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changement se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types de production et de tests du cœur, ainsi que le lint et les garde-fous du cœur ;
- les changements uniquement de tests du cœur exécutent seulement la vérification de types des tests du cœur, ainsi que le lint du cœur ;
- les changements de production d’extension exécutent la vérification de types de production et de tests d’extension, ainsi que le lint d’extension ;
- les changements uniquement de tests d’extension exécutent la vérification de types des tests d’extension, ainsi que le lint d’extension ;
- les changements du SDK de Plugin public ou des contrats de plugin s’étendent à la vérification de types des extensions, car les extensions dépendent de ces contrats du cœur (les balayages d’extensions Vitest restent un travail de test explicite) ;
- les augmentations de version limitées aux métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus basculent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests eux-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La configuration partagée de livraison en salon de groupe fait partie des mappings explicites : les changements de la configuration des réponses visibles de groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse du cœur ainsi que les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez étendu au harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une boîte fraîchement préchauffée pour une preuve large. Avant de consacrer une porte lente à une boîte réutilisée, expirée ou venant de signaler une synchronisation étonnamment volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

La vérification d’assainissement échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette boîte et préchauffez-en une nouvelle au lieu de déboguer l’échec de test du produit. Pour les PRs avec de grandes suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution d’assainissement.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver ce garde-fou, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux inhabituellement volumineux.

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

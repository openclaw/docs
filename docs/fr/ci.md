---
read_when:
    - Vous devez comprendre pourquoi une tâche de CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez l’acheminement ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des jobs CI, contrôles de portée, ensembles de publication et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T23:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque demande de tirage. La tâche `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le cadrage intelligent et déploient tout le graphe pour les release candidates et la validation large. Les lanes Android restent optionnelles via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Prépublication Plugin`](#plugin-prerelease) et ne s’exécute que depuis [`Validation complète de release`](#full-release-validation) ou via un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Tâche                            | Objectif                                                                                                                   | Quand elle s’exécute                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                      | Détecter les changements limités aux docs, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et demandes de tirage non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit du workflow via `zizmor`                                                                | Toujours sur les pushs et demandes de tirage non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                                   | Toujours sur les pushs et demandes de tirage non brouillons |
| `security-fast`                  | Agrégat requis pour les tâches de sécurité rapides                                                                          | Toujours sur les pushs et demandes de tirage non brouillons |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde de la liste d’autorisation des fichiers inutilisés             | Changements pertinents pour Node               |
| `build-artifacts`                | Construire `dist/`, l’interface Control UI, les vérifications d’artefacts construits et les artefacts aval réutilisables    | Changements pertinents pour Node               |
| `checks-fast-core`               | Lanes de correction Linux rapides, comme les vérifications bundled/contrat Plugin/protocole                                | Changements pertinents pour Node               |
| `checks-fast-contracts-channels` | Vérifications segmentées des contrats de canaux avec un résultat de vérification agrégé stable                             | Changements pertinents pour Node               |
| `checks-node-core-test`          | Segments de tests Node du cœur, hors lanes canaux, bundled, contrats et extensions                                         | Changements pertinents pour Node               |
| `check`                          | Équivalent segmenté de la porte locale principale : types prod, lint, gardes, types de test et smoke strict                | Changements pertinents pour Node               |
| `check-additional`               | Architecture, frontières, dérive des snapshots de prompts, gardes de surface d’extension, frontière de package et segments gateway-watch | Changements pertinents pour Node               |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                                          | Changements pertinents pour Node               |
| `checks`                         | Vérificateur des tests de canaux sur artefacts construits                                                                  | Changements pertinents pour Node               |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                                            | Déclenchement manuel CI pour les releases       |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                                                  | Docs modifiées                                 |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                                                            | Changements pertinents pour les Skills Python  |
| `checks-windows`                 | Tests Windows propres aux processus/chemins, plus régressions partagées des spécificateurs d’import runtime                | Changements pertinents pour Windows            |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                                  | Changements pertinents pour macOS              |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                                                | Changements pertinents pour macOS              |
| `android`                        | Tests unitaires Android pour les deux variantes, plus build d’un APK debug                                                 | Changements pertinents pour Android            |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après activité de confiance                                             | Réussite de la CI principale ou déclenchement manuel |
| `openclaw-performance`           | Rapports de performance quotidiens/à la demande du runtime Kova avec lanes fournisseur factice, profil profond et GPT 5.4 live | Planifié et déclenchement manuel               |

## Ordre d’échec rapide

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes de cette tâche, pas des tâches autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches plus lourdes de matrice d’artefacts et de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même demande de tirage ou ref `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même ref échoue aussi. Les vérifications agrégées de segments utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de segments, sans toutefois se mettre en file après que l’ensemble du workflow a déjà été remplacé. La clé de concurrence automatique CI est versionnée (`CI-v7-*`), afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone cadrée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node ainsi que le linting du workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent cadrées sur les changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests du cœur, et les modifications étroites d’aides ou de routage de tests de contrats Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les segments complets du cœur, les segments de Plugins bundled et les matrices de gardes supplémentaires lorsque le changement est limité aux surfaces de routage ou d’aide que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont cadrées sur les wrappers de processus/chemins propres à Windows, les aides de runner npm/pnpm/UI, la configuration du gestionnaire de packages et les surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport de source, Plugin, install-smoke et tests uniquement restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans sur-réserver les runners : les contrats de canaux s’exécutent en trois segments pondérés, les petites lanes unitaires du cœur sont appairées, auto-reply s’exécute avec quatre workers équilibrés (avec le sous-arbre de réponse divisé en segments agent-runner, dispatch et commands/state-routing), et les configurations agentiques gateway/Plugin sont réparties entre les tâches Node agentiques source-only existantes au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et Plugins divers utilisent leurs configurations Vitest dédiées au lieu du catch-all Plugin partagé. Les segments include-pattern enregistrent les entrées de timing avec le nom du segment CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration complète d’un segment filtré. `check-additional` garde ensemble le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; le segment de garde de frontière exécute ses petits gardes indépendants en parallèle dans une seule tâche, y compris `pnpm prompt:snapshots:check`, afin que la dérive des prompts du chemin heureux du runtime Codex soit rattachée à la demande de tirage qui l’a causée. Gateway watch, les tests de canaux et le segment support-boundary du cœur s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

Android CI exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a pas de jeu de sources ni de manifeste séparé ; sa lane de tests unitaires compile tout de même la variante avec les drapeaux BuildConfig SMS/call-log, tout en évitant une tâche de packaging d’APK debug dupliquée à chaque push pertinent pour Android.

Le segment `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimum de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats Knip de fichiers de production inutilisés à `scripts/deadcode-unused-files.allowlist.mjs`. Le garde des fichiers inutilisés échoue lorsqu’une demande de tirage ajoute un nouveau fichier inutilisé non revu ou laisse une entrée de liste d’autorisation obsolète, tout en préservant les surfaces intentionnelles de Plugins dynamiques, générées, de build, de tests live et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout pas et n’exécute pas de code non fiable issu de demandes de tirage. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis déclenche des payloads `repository_dispatch` compacts vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de demandes de tirage ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits de commentaires ou de revues lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est une observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures de routine, modifications, agitation de bots, bruit de Webhook dupliqué et trafic de revue normal doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les dispatches CI manuels exécutent le même graphe de tâches que la CI normale, mais activent de force toutes les voies à portée non Android : fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke test de build, vérifications de docs, Skills Python, Windows, macOS et i18n de l’interface Control UI. Les dispatches CI manuels autonomes n’exécutent Android qu’avec `include_android=true` ; l’ombrelle de publication complète active Android en passant `include_android=true`. Les vérifications statiques de prépublication de Plugin, le fragment `agentic-plugins` réservé à la publication, le balayage complet par lot des extensions et les voies Docker de prépublication de Plugin sont exclus de la CI. La suite Docker de prépublication ne s’exécute que lorsque `Full Release Validation` déclenche le workflow `Plugin Prerelease` séparé avec la gate de validation de publication activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution de push ou de PR sur la même ref. L’entrée optionnelle `target_ref` permet à un appelant de confiance d’exécuter ce graphe contre une branche, un tag ou un SHA de commit complet, tout en utilisant le fichier de workflow de la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Exécuteurs

| Exécuteur                        | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/plugins groupés, vérifications fragmentées de contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente de 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performance OpenClaw

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute chaque jour sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Le workflow installe OCM depuis une publication épinglée et Kova depuis l’entrée `kova_ref` épinglée, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La voie mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : mesure du temps de démarrage et de la mémoire du Gateway dans les cas de démarrage par défaut, hook et 50 plugins ; boucles hello `channel-chat-baseline` mock-OpenAI répétées ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown des sondes source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque voie téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit également `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sondes source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Le pointeur de branche courant est écrit sous `openclaw-performance/<ref>/latest-<lane>.json`.

## Validation complète de publication

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la publication ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves de Plugin/package/statique/Docker réservées à la publication, et déclenche `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation de package, les suites de chemin de publication Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des vérifications de publication. Après publication, passez `npm_telegram_package_spec` pour relancer la même voie de package Telegram contre le package npm publié.

Voir [Validation complète de publication](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et
les handles de réexécution ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication avec mutation. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de publication et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de Plugin publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de publication, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche à évolution rapide, utilisez l’aide plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’aide pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque
workflow enfant `headSha` correspond à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur ombrelle échoue aussi si un workflow enfant s’est exécuté sur un
SHA différent.

`release_profile` contrôle l’étendue live/provider transmise aux vérifications de publication. Les
workflows de publication manuels utilisent `stable` par défaut ; utilisez `full` seulement lorsque vous
voulez intentionnellement la large matrice consultative de providers/médias.

- `minimum` conserve les voies OpenAI/core critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de providers/backends.
- `full` exécute la large matrice consultative de providers/médias.

L’ombrelle enregistre les ids des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute les tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat ombrelle et le résumé de timing.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une version candidate, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de préversion du Plugin, `release-checks` pour chaque enfant de publication, ou un groupe plus précis : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur l’ombrelle. Cela maintient la réexécution d’une box de publication échouée dans un périmètre limité après un correctif ciblé.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence sélectionnée en tarball `release-package-under-test`, puis transmet cet artefact à la fois au workflow Docker de chemin de publication live/E2E et au shard d’acceptation de package. Cela maintient les octets du package cohérents entre les boxes de publication et évite de reconditionner le même candidat dans plusieurs jobs enfants.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent l’ancienne ombrelle. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché quand le parent est annulé, afin que la validation plus récente de main
ne reste pas bloquée derrière une ancienne exécution release-check de deux heures. La validation
de branche/tag de publication et les groupes de réexécution ciblés conservent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’un seul job sériel :

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrés par fournisseur
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards média audio/vidéo séparés et shards musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les réexécutions manuelles en une seule fois.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas l’endroit approprié pour lancer des tests Docker imbriqués.

Les shards live de modèles/backends adossés à Docker utilisent une image partagée séparée `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow live de publication construit et pousse cette image une seule fois, puis les shards modèle live Docker, Gateway partitionné par fournisseur, backend CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des limites `timeout` explicites au niveau des scripts, inférieures au délai d’expiration du job de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget de release-check. Si ces shards reconstruisent indépendamment la cible Docker complète du source, l’exécution de publication est mal configurée et gaspillera du temps réel sur des constructions d’image dupliquées.

## Acceptation du package

Utilisez `Package Acceptance` quand la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arbre source, tandis que l’acceptation du package valide un tarball unique via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout un candidat de package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et affiche la source, la référence de workflow, la référence de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire du tarball, prépare les images Docker de digest de package si nécessaire, et exécute les voies Docker sélectionnées contre ce package au lieu de packager l’extraction du workflow. Quand un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une fois, puis distribue ces voies en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle optionnellement `NPM Telegram Beta E2E`. Il s’exécute quand `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` quand Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram optionnelle a échoué.

### Sources de candidats

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de préversions/versions stables publiées.
- `source=ref` package une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou un tag de publication, installe les dépendances dans un worktree détaché et le package avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est packagé quand `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — blocs Docker complets du chemin de publication avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis quand `suite_profile=custom`

Le profil `package` utilise une couverture de Plugin hors ligne afin que la validation de package publié ne dépende pas de la disponibilité live de ClawHub. La voie Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les déclenchements autonomes.

Pour la politique dédiée de mise à jour et de test des Plugins, y compris les commandes locales,
les voies Docker, les entrées de Package Acceptance, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les contrôles de publication appellent Package Acceptance avec `source=artifact`, l’artefact de package de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` et `telegram_mode=mock-openai`. Cela conserve la preuve de migration de package, mise à jour, nettoyage des dépendances de Plugins obsolètes, réparation de l’installation de Plugins configurés, Plugin hors ligne, mise à jour de Plugin et Telegram sur le même tarball de package résolu. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un package npm expédié au lieu de l’artefact construit à partir du SHA. Les contrôles de publication inter-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme propres à l’OS ; la validation produit package/mise à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une référence de package publié par exécution. Dans Package Acceptance, le tarball `package-under-test` résolu est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, par défaut `openclaw@latest` ; les commandes de réexécution de voie échouée préservent cette référence. Définissez `published_upgrade_survivor_baselines=all-since-2026.4.23` pour étendre la CI Full Release à chaque version npm stable de `2026.4.23` jusqu’à `latest` ; `release-history` reste disponible pour un échantillonnage manuel plus large avec l’ancien point d’ancrage antérieur à cette date. Définissez `published_upgrade_survivor_scenarios=reported-issues` pour étendre les mêmes références aux fixtures inspirées d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugins OpenClaw configurés, les chemins de logs avec tilde et les racines de dépendances de Plugins historiques obsolètes. Le workflow séparé `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` quand la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur la largeur normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz` ainsi que le statut RPC après le démarrage du Gateway. Les voies Windows d’installation fresh packagée et par installateur vérifient aussi qu’un package installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke agent-turn inter-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` quand il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité historique

Package Acceptance dispose de fenêtres de compatibilité historique bornées pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` quand le package n’expose pas ce drapeau ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes de la fausse fixture git dérivée du tarball et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de Plugins peuvent lire les anciens emplacements d’enregistrement d’installation ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant encore que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package publié `2026.4.26` peut aussi avertir pour les fichiers d’horodatage de métadonnées de build local qui avaient déjà été expédiés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, sa version et son SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lane, les minutages de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer toute la validation de release.

## Smoke d’installation

Le workflow séparé `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- Le **chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces du cœur Plugin/canal/Gateway/SDK Plugin exercées par les jobs smoke Docker. Les changements de Plugin groupé uniquement dans le source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression d’agents dans l’espace de travail partagé, exécute l’E2E du Gateway réseau de conteneur, vérifie un argument de build d’extension groupée, et exécute le profil Docker borné de Plugin groupé sous un délai d’expiration global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- Le **chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installeur pour les exécutions planifiées nocturnes, les dispatchs manuels, les vérifications de release via workflow-call, et les pull requests qui touchent réellement les surfaces installeur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR de Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installeur/update, et l’E2E Docker rapide de Plugin groupé comme jobs séparés afin que le travail d’installeur n’attende pas derrière les smokes de l’image racine.

Les pushs vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent Bun d’installation globale du fournisseur d’images est gardé séparément par `run_bun_global_install_smoke`. Il s’exécute selon la planification nocturne et depuis le workflow de vérifications de release, et les dispatchs manuels de `Install Smoke` peuvent l’activer, mais pas les pull requests ni les pushs vers `main`. Les tests Docker QR et installeur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une seule fois comme tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les lanes installeur/update/dépendance de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normales.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. L’ordonnanceur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                                      |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre de slots du pool principal pour les lanes normales.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre de slots du pool de fin sensible aux fournisseurs.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Plafond de lanes live concurrentes afin que les fournisseurs n’appliquent pas de limitation.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                | Plafond de lanes d’installation npm concurrentes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Plafond de lanes multi-services concurrentes.                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai d’expiration de repli par lane (120 minutes) ; certaines lanes live/de fin utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan de l’ordonnanceur sans exécuter les lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à ce qu’elle libère de la capacité. Les préflights locaux globaux vérifient Docker, suppriment les conteneurs OpenClaw E2E obsolètes, émettent l’état des lanes actives, persistent les minutages de lanes pour un ordre du plus long au plus court, et arrêtent par défaut la planification de nouvelles lanes en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelles couvertures de package, type d’image, image live, lane et identifiants sont requises. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse les images GHCR Docker E2E minimal/fonctionnelle balisées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan exige des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont réessayés avec un délai d’expiration borné à 180 secondes par tentative afin qu’un flux de registre/cache bloqué réessaie rapidement au lieu de consommer l’essentiel du chemin critique CI.

### Segments du chemin de release

La couverture Docker de release exécute des jobs segmentés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment ne tire que le type d’image dont il a besoin et exécute plusieurs lanes via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les segments Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de lane `install-e2e` reste l’alias de réexécution manuelle agrégé pour les deux lanes d’installeur fournisseur.

OpenWebUI est inclus dans `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un segment autonome `openwebui` uniquement pour les dispatchs limités à OpenWebUI. Les lanes de mise à jour de canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux de lanes, les minutages, `summary.json`, `failures.json`, les minutages de phase, le JSON du plan de l’ordonnanceur, les tableaux de lanes lentes et les commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées contre les images préparées au lieu des jobs de segment, ce qui limite le débogage des lanes échouées à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement toute la suite Docker du chemin de release.

## Préversion Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushs vers `main` et les dispatchs CI manuels autonomes gardent cette suite désactivée. Il répartit les tests de Plugins groupés sur huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois, avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de préversion Docker réservé aux releases regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## QA Lab

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnesses larges QA et release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et sur dispatch manuel ; il déploie en éventail la lane de parité mock, la lane Matrix live et les lanes Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de release exécutent les lanes de transport live Matrix et Telegram avec le fournisseur mock déterministe et les modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugins fournisseurs. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre le comportement de mémoire séparément ; la connectivité fournisseur est couverte par les suites distinctes de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiées et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; un dispatch manuel `matrix_profile=all` découpe toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les lanes QA Lab critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et de référence comme jobs de lanes parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison de parité finale.

Pour les PR normales, suivez les preuves CI/check à portée définie plutôt que de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un analyseur de sécurité de premier passage étroit, et non une analyse complète du dépôt. Les exécutions de garde quotidiennes, manuelles et de pull request non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque avec des requêtes de sécurité à haute confiance filtrées sur une `security-severity` élevée/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Les CodeQL Android et macOS restent en dehors des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, Cron et base de référence du Gateway                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur plus runtime de Plugin de canal, Gateway, SDK Plugin, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse IP, garde réseau, récupération web et politique SSRF du SDK Plugin                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et gardes d’exécution d’outils des agents                    |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance d’installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de source et contrat de paquet du SDK Plugin |

### Shards de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit exécuteur Blacksmith Linux accepté par la validation de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé en dehors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le shard non-sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript non-sécurité de gravité erreur sur des surfaces étroites à forte valeur sur le plus petit exécuteur Blacksmith Linux. Sa garde de pull request est intentionnellement plus petite que le profil planifié : les PR non brouillon n’exécutent que les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant le code d’exécution de commandes/modèles/outils des agents et de distribution des réponses, le schéma/la migration/l’IO de configuration, le code d’authentification/secrets/bac à sable/sécurité, le runtime du canal du cœur et du Plugin de canal groupé, le protocole Gateway/méthodes serveur, la colle runtime mémoire/SDK, MCP/processus/livraison sortante, le runtime fournisseur/catalogue de modèles, les diagnostics de session/files de livraison, le chargeur de Plugin, le SDK Plugin/contrat de paquet, ou le runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow de qualité exécutent les douze shards de qualité PR.

La distribution manuelle accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des crochets d’apprentissage/itération pour exécuter un shard de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentification, secrets, bac à sable, Cron et code de frontière de sécurité du Gateway                                                                         |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal du cœur et du Plugin de canal groupé                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponse automatique, et contrats de runtime du plan de contrôle ACP             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades de runtime mémoire, alias mémoire du SDK Plugin, colle d’activation du runtime mémoire et commandes doctor mémoire                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de bundle d’événements/journaux de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK Plugin, assistants de payload/fragmentation/runtime de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues des fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats de runtime du plan de contrôle des tâches                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Récupération/recherche web du cœur, IO média, compréhension média, génération d’images et contrats de runtime de génération média                                 |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de chargeur, registre, surface publique et points d’entrée du SDK Plugin                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté paquet du SDK Plugin et assistants de contrat de paquet de plugin                                                                            |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension de CodeQL à Swift, Python et aux plugins groupés doit être réintroduite sous forme de travail de suivi borné ou shardé uniquement après stabilisation du temps d’exécution et du signal des profils étroits.

## Workflows de maintenance

### Agent de documentation

Le workflow `Docs Agent` est une voie de maintenance Codex déclenchée par événement pour maintenir les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI de push non-bot réussie sur `main` peut le déclencher, et la distribution manuelle peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits de la SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Agent de performance des tests

Le workflow `Test Performance Agent` est une voie de maintenance Codex déclenchée par événement pour les tests lents. Il n’a pas de planification pure : une exécution CI de push non-bot réussie sur `main` peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. La distribution manuelle contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé de suite complète, laisse Codex n’apporter que de petites corrections de performance de tests qui préservent la couverture au lieu de grands refactorings, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la base de référence. Si la base de référence contient des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le correctif validé, réexécute `pnpm check:changed` et retente le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow manuel de mainteneur pour le nettoyage des doublons après intégration. Il utilise dry-run par défaut et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée partagée, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changement vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types prod du cœur et tests du cœur, plus lint/gardes du cœur ;
- les changements uniquement de tests du cœur exécutent seulement la vérification de types des tests du cœur plus lint du cœur ;
- les changements de production d’extension exécutent la vérification de types prod d’extension et tests d’extension, plus lint d’extension ;
- les changements uniquement de tests d’extension exécutent la vérification de types des tests d’extension plus lint d’extension ;
- les changements publics de SDK Plugin ou de contrat de plugin s’étendent à la vérification de types des extensions parce que les extensions dépendent de ces contrats du cœur (les balayages Vitest d’extensions restent du travail de test explicite) ;
- les augmentations de version uniquement de métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests eux-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La configuration partagée de livraison de salle de groupe fait partie des mappings explicites : les changements de la configuration de réponse visible de groupe, du mode de livraison des réponses source ou du prompt système de l’outil de messages passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack afin qu’un changement de valeur par défaut partagé échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est suffisamment large au niveau du harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une box fraîchement préparée pour une validation large. Avant de lancer une vérification lente sur une box réutilisée, expirée ou qui vient de signaler une synchronisation anormalement importante, exécutez d’abord `pnpm testbox:sanity` dans la box.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette box et préparez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs avec de nombreuses suppressions intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste dans la phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur plus élevée en millisecondes pour des diffs locaux exceptionnellement volumineux.

Crabbox est le second parcours de box distante propre au dépôt pour la validation Linux lorsque Blacksmith est indisponible ou lorsque la capacité cloud dédiée est préférable. Préparez une box, hydratez-la via le workflow du projet, puis exécutez les commandes avec la CLI Crabbox :

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` définit les valeurs par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` définit le checkout, la configuration Node/pnpm, la récupération de `origin/main` et le transfert d’environnement non secret que les commandes ultérieures `crabbox run --id <cbx_id>` sourcent.

## Voir aussi

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

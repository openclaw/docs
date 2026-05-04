---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou la transmission de l’activité GitHub
summary: Graphe des jobs CI, garde-fous de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-04T07:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses quand seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le périmétrage intelligent et déploient tout le graphe pour les release candidates et les validations larges. Les lanes Android restent optionnelles via `include_android`. La couverture Plugin réservée aux releases vit dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou une dispatch manuelle explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecter les changements docs-only, les portées modifiées, les extensions modifiées et générer le manifeste CI | Toujours sur les pushs et PRs non draft |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                             | Toujours sur les pushs et PRs non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                 | Toujours sur les pushs et PRs non draft |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushs et PRs non draft |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde de l’allowlist des fichiers inutilisés       | Changements pertinents pour Node   |
| `build-artifacts`                | Générer `dist/`, Control UI, les vérifications d’artefacts générés et les artefacts aval réutilisables    | Changements pertinents pour Node   |
| `checks-fast-core`               | Lanes Linux rapides de correction, comme les vérifications bundled/plugin-contract/protocol               | Changements pertinents pour Node   |
| `checks-fast-contracts-channels` | Vérifications de contrats de channels shardées avec un résultat de vérification agrégé stable             | Changements pertinents pour Node   |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors lanes de channel, bundled, contract et extension                       | Changements pertinents pour Node   |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, guards, types de test et smoke strict  | Changements pertinents pour Node   |
| `check-additional`               | Architecture, boundary/prompt drift shardés, guards d’extension, boundary de package et gateway watch     | Changements pertinents pour Node   |
| `build-smoke`                    | Tests smoke de la CLI générée et smoke de mémoire au démarrage                                            | Changements pertinents pour Node   |
| `checks`                         | Vérificateur pour les tests de channel sur artefacts générés                                              | Changements pertinents pour Node   |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                           | Dispatch CI manuelle pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés de la documentation                                      | Docs modifiées                     |
| `skills-python`                  | Ruff + pytest pour les Skills adossés à Python                                                            | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Tests Windows spécifiques aux processus/chemins, plus régressions partagées de spécificateurs d’import runtime | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts générés partagés                                   | Changements pertinents pour macOS  |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                               | Changements pertinents pour macOS  |
| `android`                        | Tests unitaires Android pour les deux flavors, plus un build d’APK debug                                  | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents par Codex après une activité fiable                              | Succès de la CI principale ou dispatch manuelle |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.4 live | Planification et dispatch manuelle |

## Ordre de fail-fast

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes de ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artefacts et de matrices de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer des jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI, sauf si la plus récente exécution pour la même ref échoue aussi. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards sans se mettre en file après que tout le workflow a déjà été supplanté. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les exécutions main plus récentes. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Portée et routage

La logique de portée vit dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. La dispatch manuelle saute la détection `changed-scope` et fait agir le manifeste preflight comme si chaque zone délimitée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests core et les modifications étroites d’helpers/tests de routage de contrats Plugin** utilisent un chemin rapide de manifeste Node-only : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin saute les artefacts de build, la compatibilité Node 22, les contrats de channels, les shards core complets, les shards de bundled plugins et les matrices de guards additionnelles lorsque le changement est limité aux surfaces de routage ou d’helpers que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont limitées aux wrappers processus/chemins spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces du workflow CI qui exécutent cette lane ; les changements de sources sans rapport, de plugins, d’install-smoke et de tests seuls restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans réserver trop de runners : les contrats de channels s’exécutent en trois shards pondérés, les lanes core unit fast/support s’exécutent séparément, l’infra runtime core est divisée entre shards state et process/config, auto-reply s’exécute comme des workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configs agentic gateway/server sont divisées entre lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts générés. Les tests larges browser, QA, media et de plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all partagé des plugins. Les shards include-pattern enregistrent les entrées de timing avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional` garde ensemble le travail compile/canary de package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; la liste de guards boundary est répartie sur quatre shards de matrice, chacun exécutant des guards indépendants sélectionnés en parallèle et affichant les timings par vérification, y compris `pnpm prompt:snapshots:check` afin que la dérive de prompt du chemin nominal du runtime Codex soit rattachée à la PR qui l’a causée. Gateway watch, les tests de channels et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été générés.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis génère l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile quand même le flavor avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging d’APK debug dupliqué à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés trouvés par Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le guard des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de live-test et de pont de package que Knip ne peut pas résoudre statiquement.

## Transfert d’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un token GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads `repository_dispatch` compacts à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou reviews lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est une observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, modifications, agitation de bots, bruit de Webhook dupliqué et trafic normal de review doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de review, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatchs manuelles

Les dispatchs CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque lane à portée non Android : fragments Linux Node, fragments de Plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de build, vérifications docs, Skills Python, Windows, macOS et i18n de Control UI. Les dispatchs CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’ombrelle de release complète active Android en transmettant `include_android=true`. Les vérifications statiques de préversion de Plugin, le fragment `agentic-plugins` réservé aux releases, le sweep complet par lot des extensions et les lanes Docker de préversion de Plugin sont exclus de la CI. La suite Docker de préversion s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow `Plugin Prerelease` séparé avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par un autre push ou une exécution de PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, un tag ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/groupées, vérifications fragmentées de contrats de canaux, fragments `check` sauf lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de Plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks reviennent à `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                               |

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

## Performances OpenClaw

`OpenClaw Performance` est le workflow de performances produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Un dispatch manuel benchmarke normalement la ref du workflow. Définissez `target_ref` pour benchmarker un tag de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testée, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de lane, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une fausse auth déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/heap/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes de source natives OpenClaw après le passage Kova : temps de démarrage et mémoire du Gateway sur les cas de démarrage par défaut, hook et 50 Plugins ; boucles hello répétées `channel-chat-baseline` mock-OpenAI ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown des sondes de source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sondes de source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la ref testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de release

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la release ». Il accepte une branche, un tag ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour la preuve Plugin/package/statique/Docker réservée aux releases, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les suites de chemin de release Docker, live/E2E, OpenWebUI, la parité QA Lab, Matrix et les lanes Telegram. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` des vérifications de release. Après publication, transmettez `npm_telegram_package_spec` pour réexécuter la même lane de package Telegram contre le package npm publié.

Voir [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des jobs de workflow, les différences de
profils, les artefacts et les identifiants de réexécution ciblée.

`OpenClaw Release Publish` est le workflow manuel de release qui modifie l’état. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence du tag de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de Plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de release, puis déclenche seulement ensuite
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les refs de dispatch de workflow GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque `headSha` de workflow enfant correspond à la cible, et supprime la branche temporaire lorsque l’exécution se termine. Le vérificateur ombrelle échoue aussi si un workflow enfant s’est exécuté sur un SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux contrôles de publication. Les workflows manuels de publication utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous voulez intentionnellement la matrice consultative étendue fournisseurs/médias.

- `minimum` conserve les lanes OpenAI/cœur critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable des fournisseurs/backends.
- `full` exécute la matrice consultative étendue fournisseurs/médias.

Le workflow chapeau enregistre les ids d’exécution des workflows enfants déclenchés, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement le job vérificateur parent pour actualiser le résultat chapeau et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une candidate de publication, `ci` pour seulement l’enfant CI complet normal, `plugin-prerelease` pour seulement l’enfant de prépublication des plugins, `release-checks` pour chaque enfant de publication, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, ou `npm-telegram` sur le workflow chapeau. Cela limite la relance d’une boîte de publication échouée après un correctif ciblé.

`OpenClaw Release Checks` utilise la ref de workflow de confiance pour résoudre une seule fois la ref sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact au workflow Docker du chemin de publication live/E2E et au shard d’acceptation du paquet. Cela garde les octets du paquet cohérents entre les boîtes de publication et évite de repaqueter la même candidate dans plusieurs jobs enfants.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’ancien workflow chapeau. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin qu’une validation plus récente de main
ne reste pas bloquée derrière une exécution de contrôles de publication obsolète de deux heures. La validation de branche/tag de publication
et les groupes de relance ciblés gardent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de publication conserve une large couverture native `pnpm test:live`, mais l’exécute comme shards nommés via `scripts/test-live-shard.mjs` au lieu d’un seul job sériel :

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
- shards audio/vidéo médias séparés et shards musique filtrés par fournisseur

Cela garde la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour des relances manuelles ponctuelles.

Les shards médias live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs médias vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux — les jobs conteneurisés ne sont pas l’endroit approprié pour lancer des tests Docker imbriqués.

Les shards live de modèles/backends adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow live de publication construit et pousse cette image une seule fois, puis les shards de modèle live Docker, de Gateway shardé par fournisseur, de backend CLI, de liaison ACP et de harness Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des plafonds `timeout` explicites au niveau script sous le timeout du job de workflow afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des contrôles de publication. Si ces shards reconstruisent indépendamment la cible Docker source complète, l’exécution de publication est mal configurée et gaspillera du temps réel sur des builds d’image en double.

## Acceptation du paquet

Utilisez `Package Acceptance` lorsque la question est « ce paquet OpenClaw installable fonctionne-t-il comme produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du paquet valide une seule archive via le même harness Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout une candidate de paquet, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et affiche la source, la ref de workflow, la ref du paquet, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker à condensé de paquet si nécessaire, et exécute les lanes Docker sélectionnées contre ce paquet au lieu de paqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le paquet et les images partagées une seule fois, puis déploie ces lanes en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle facultativement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du paquet en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du paquet, l’acceptation Docker ou la lane Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte seulement `openclaw@beta`, `openclaw@latest`, ou une version exacte de publication OpenClaw comme `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prépublication/publication stable publiée.
- `source=ref` paquete une branche, un tag ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou un tag de publication, installe les dépendances dans un worktree détaché, et le paquete avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harness de confiance qui exécute le test. `package_ref` est le commit source qui est paqueté lorsque `source=ref`. Cela permet au harness de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de plugins hors ligne afin que la validation du paquet publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publié étant conservé pour les déclenchements autonomes.

Pour la politique dédiée aux tests de mise à jour et de plugins, y compris les commandes locales,
les lanes Docker, les entrées d’acceptation du paquet, les valeurs par défaut de publication et le triage des échecs,
consultez [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les contrôles de publication appellent l’acceptation du paquet avec `source=artifact`, l’artefact de paquet de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, et `telegram_mode=mock-openai`. Cela garde la migration du paquet, la mise à jour, le nettoyage des dépendances obsolètes de plugins, la réparation d’installation de plugin configuré, le plugin hors ligne, la mise à jour de plugin et la preuve Telegram sur la même archive de paquet résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un paquet npm livré au lieu de l’artefact construit depuis le SHA. Les contrôles de publication inter-OS couvrent toujours l’onboarding, l’installeur et le comportement de plateforme spécifiques aux OS ; la validation produit paquet/mise à jour devrait commencer par l’acceptation du paquet. La lane Docker `published-upgrade-survivor` valide une baseline de paquet publié par exécution. Dans l’acceptation du paquet, l’archive `package-under-test` résolue est toujours la candidate et `published_upgrade_survivor_baseline` sélectionne la baseline publiée de repli, par défaut `openclaw@latest` ; les commandes de relance de lanes échouées préservent cette baseline. Définissez `published_upgrade_survivor_baselines=all-since-2026.4.23` pour étendre la CI complète de publication à chaque publication npm stable de `2026.4.23` à `latest` ; `release-history` reste disponible pour un échantillonnage manuel plus large avec l’ancre antérieure plus ancienne. Définissez `published_upgrade_survivor_scenarios=reported-issues` pour étendre les mêmes baselines aux fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de plugins OpenClaw configurés, les chemins de logs avec tilde, et les racines de dépendances de plugins hérités obsolètes. Le workflow séparé `Update Migration` utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, pas sur l’étendue normale de la CI complète de publication. Les exécutions agrégées locales peuvent passer des spécifications exactes de paquets avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, garder une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la baseline avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les lanes fraîches Windows empaquetée et installeur vérifient aussi qu’un paquet installé peut importer un override browser-control depuis un chemin Windows absolu brut. La smoke inter-OS de tour d’agent OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation du paquet dispose de fenêtres bornées de compatibilité héritée pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes depuis la fixture git factice dérivée de l’archive et peut journaliser un `update.channel` persistant manquant ;
- les smokes de plugins peuvent lire les anciens emplacements d’enregistrements d’installation ou accepter une persistance manquante des enregistrements d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet publié `2026.4.26` peut aussi avertir pour les fichiers d’estampille de métadonnées de build local déjà livrés. Les paquets ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source, la version et le SHA-256 du package. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lanes, les timings de phases et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer la validation complète de publication.

## Smoke test d’installation

Le workflow `Install Smoke` séparé réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces Plugin SDK, Plugin, canal ou Gateway centrales que les jobs smoke Docker exercent. Les changements de source uniquement dans un Plugin groupé, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression d’agents en espace de travail partagé, exécute l’e2e container gateway-network, vérifie un argument de build d’extension groupée, et exécute le profil Docker de Plugin groupé borné sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker d’installation/mise à jour pour les exécutions planifiées nocturnes, les déclenchements manuels, les contrôles de publication par workflow-call et les pull requests qui touchent réellement les surfaces installeur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR Dockerfile racine de SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installeur/mise à jour et l’E2E Docker rapide de Plugin groupé comme jobs séparés afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushs sur `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée modifiée demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de publication.

Le smoke lent du fournisseur d’images avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon la planification nocturne et depuis le workflow des contrôles de publication, et les déclenchements manuels de `Install Smoke` peuvent l’activer explicitement, mais les pull requests et les pushs sur `main` ne le font pas. Les tests Docker QR et installeur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image live-test partagée, empaquette OpenClaw une fois sous forme de tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les lanes installeur/mise à jour/dépendances de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normales.

Les définitions de lanes Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. L’ordonnanceur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de slots du pool principal pour les lanes normales.                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de slots du pool de queue sensible aux fournisseurs.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de lanes live concurrentes afin que les fournisseurs ne limitent pas le débit.        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de lanes d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de lanes multi-services concurrentes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de lanes pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai de secours par lane (120 minutes) ; certaines lanes live/de queue sélectionnées utilisent des plafonds plus serrés. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan de l’ordonnanceur sans exécuter les lanes.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. Les précontrôles locaux agrégés vérifient Docker, suppriment les conteneurs E2E OpenClaw périmés, émettent l’état des lanes actives, persistent les timings des lanes pour l’ordre du plus long au plus court, et arrêtent par défaut de planifier de nouvelles lanes en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, de type d’image, d’image live, de lane et d’identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse les images E2E Docker GHCR bare/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou des images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont retentés avec un délai borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué retente rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Morceaux du chemin de publication

La couverture Docker de publication exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque morceau ne tire que le type d’image dont il a besoin et exécute plusieurs lanes via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de publication actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de lane `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux lanes d’installation fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture release-path complète le demande, et conserve un morceau autonome `openwebui` uniquement pour les déclenchements limités à OpenWebUI. Les lanes de mise à jour de canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de lanes, les timings, `summary.json`, `failures.json`, les timings de phases, le JSON du plan de l’ordonnanceur, les tableaux de lanes lentes et les commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées contre les images préparées au lieu des jobs de morceaux, ce qui limite le débogage d’une lane échouée à un job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image live-test pour cette réexécution. Les commandes GitHub de réexécution générées par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement toute la suite Docker release-path.

## Prépublication de Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushs sur `main` et les déclenchements CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests de Plugins groupés entre huit workers d’extensions ; ces jobs de shards d’extensions exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugins lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de prépublication Docker réservé à la publication regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## Laboratoire QA

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnais QA et de publication larges, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie en parallèle la lane de parité mock, la lane Matrix live, ainsi que les lanes Telegram et Discord live sous forme de jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des leases Convex.

Les contrôles de publication exécutent les lanes de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugins fournisseurs. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèles live, fournisseurs natifs et fournisseurs Docker.

Matrix utilise `--profile fast` pour les gates planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée de workflow manuelle restent `all` ; un déclenchement manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les lanes QA Lab critiques pour la publication avant l’approbation de publication ; son gate de parité QA exécute les packs candidat et de référence comme jobs de lanes parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/contrôles à portée limitée au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité de premier passage à périmètre étroit, pas une analyse complète du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur les niveaux `security-severity` élevé/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, Cron et base de référence Gateway                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, ainsi que l’exécution du Plugin de canal, le Gateway, le Plugin SDK, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse d’IP, garde réseau, récupération web et politique SSRF du Plugin SDK                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et barrières d’exécution d’outils d’agent                    |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, du chargeur, du manifeste, du registre, de l’installation via gestionnaire de paquets, du chargement de source et du contrat de paquet du Plugin SDK |

### Éclats de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — éclat de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Linux Blacksmith accepté par la validation de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — éclat de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de construction des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Conservé en dehors des valeurs par défaut quotidiennes parce que la construction macOS domine le temps d’exécution même lorsqu’elle est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est l’éclat non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non liées à la sécurité, sur des surfaces étroites à forte valeur, sur le plus petit runner Linux Blacksmith. Sa garde de pull request est intentionnellement plus petite que le profil planifié : les PR non brouillon n’exécutent que les éclats correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant le code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, le schéma/la migration/les E/S de configuration, le code d’authentification/secrets/sandbox/sécurité, l’exécution des canaux du cœur et des Plugins de canal groupés, le protocole Gateway/la méthode serveur, la colle d’exécution mémoire/SDK, MCP/processus/livraison sortante, le catalogue de modèles/l’exécution fournisseur, les diagnostics de session/files de livraison, le chargeur de Plugin, le contrat Plugin SDK/paquet ou l’exécution de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow de qualité exécutent les douze éclats de qualité PR.

La distribution manuelle accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’ancrage d’apprentissage/itération pour exécuter un éclat de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour l’authentification, les secrets, la sandbox, Cron et le Gateway                                                                |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, migration, normalisation et E/S                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du cœur et des Plugins de canal groupés                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponses automatiques, et contrats d’exécution du plan de contrôle ACP          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus, et contrats de livraison sortante                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte de mémoire, façades d’exécution mémoire, alias mémoire du Plugin SDK, colle d’activation de l’exécution mémoire et commandes doctor mémoire             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de bundles d’événements/logs de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, assistants de payload/découpage/exécution de réponse, options de réponse de canal, files de livraison et assistants de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte fournisseur, enregistrement de l’exécution fournisseur, valeurs par défaut/catalogues fournisseur, et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle Gateway et contrats d’exécution du plan de contrôle des tâches                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Récupération/recherche web du cœur, E/S média, compréhension des médias, génération d’images et contrats d’exécution de génération de médias                      |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de chargeur, registre, surface publique et points d’entrée du Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté paquet publié et assistants de contrat de paquet de plugin                                                                              |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL Swift, Python et Plugins groupés doit être réintroduite comme travail de suivi à périmètre défini ou fragmenté uniquement après que les profils étroits disposent d’un temps d’exécution et d’un signal stables.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur `main` après push non bot peut le déclencher, et la distribution manuelle peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans l’heure précédente. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` courant, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur `main` après push non bot peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. La distribution manuelle contourne cette garde d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur toute la suite, laisse Codex effectuer uniquement de petites corrections de performance de tests préservant la couverture au lieu de refactorisations larges, puis réexécute le rapport de toute la suite et rejette les changements qui réduisent le nombre de tests de base réussis. Si la base de référence contient des tests en échec, Codex peut ne corriger que les échecs évidents et le rapport de toute la suite après l’agent doit réussir avant toute validation. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le patch validé, réexécute `pnpm check:changed` et réessaie le push ; les patchs obsolètes conflictuels sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Il utilise par défaut le mode dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit un ticket référencé commun, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changement se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck prod du cœur et le typecheck des tests du cœur, plus le lint/les gardes du cœur ;
- les changements touchant uniquement les tests du cœur n’exécutent que le typecheck des tests du cœur plus le lint du cœur ;
- les changements de production d’extension exécutent le typecheck prod d’extension et le typecheck des tests d’extension, plus le lint d’extension ;
- les changements touchant uniquement les tests d’extension exécutent le typecheck des tests d’extension plus le lint d’extension ;
- les changements de Plugin SDK public ou de contrat de plugin s’étendent au typecheck d’extension parce que les extensions dépendent de ces contrats du cœur (les balayages Vitest d’extension restent du travail de test explicite) ;
- les incréments de version portant uniquement sur les métadonnées de release exécutent des vérifications ciblées version/configuration/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappages explicites, puis les tests frères et les dépendants du graphe d’importation. La configuration de livraison de salle de groupe partagée fait partie des mappages explicites : les changements de la configuration de réponse visible de groupe, du mode de livraison des réponses source ou du prompt système de l’outil de message passent par les tests de réponse du cœur ainsi que les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagé échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez transversal au harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et préférez une box fraîche préchauffée pour une validation étendue. Avant de lancer un gate lent sur une box qui a été réutilisée, a expiré ou vient de signaler une synchronisation étonnamment volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la box.

Le contrôle d’intégrité échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette box et préchauffez-en une fraîche au lieu de déboguer l’échec du test produit. Pour les PRs comportant intentionnellement de nombreuses suppressions, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution d’intégrité.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur plus grande en millisecondes pour des diffs locaux exceptionnellement volumineux.

Crabbox est le wrapper de box distante appartenant au dépôt pour les validations Linux des mainteneurs. Utilisez-le quand une vérification est trop large pour une boucle d’édition locale, quand la parité avec la CI importe, ou quand la validation nécessite des secrets, Docker, des lanes de paquet, des boxes réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité détenue.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut owned-cloud.

Gate des modifications :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Relance de test ciblée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Suite complète :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions ponctuelles de Crabbox adossées à Blacksmith doivent arrêter la Testbox automatiquement ; si une exécution est interrompue ou si le nettoyage n’est pas clair, inspectez les boxes actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même box hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez directement Blacksmith comme solution de repli limitée :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

N’escaladez vers la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par quota, privé de l’environnement nécessaire, ou que la capacité détenue est explicitement l’objectif :

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` détient les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les lanes owned-cloud. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` détient le checkout, la configuration Node/pnpm, la récupération de `origin/main` et le transfert d’environnement non secret pour les commandes owned-cloud `crabbox run --id <cbx_id>`.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez la répartition ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline d’intégration continue
x-i18n:
    generated_at: "2026-05-07T01:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et à chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le périmétrage intelligent et déploient tout le graphe pour les release candidates et les validations larges. Les lanes Android restent opt-in via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                                   | Quand il s’exécute                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Détecter les changements limités aux docs, les périmètres modifiés, les extensions modifiées et construire le manifeste CI | Toujours sur les pushes et PR non draft    |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                                              | Toujours sur les pushes et PR non draft    |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                                  | Toujours sur les pushes et PR non draft    |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                                           | Toujours sur les pushes et PR non draft    |
| `check-dependencies`             | Passage Knip limité aux dépendances de production, plus garde de l’allowlist des fichiers inutilisés                       | Changements pertinents pour Node           |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artifacts construits et les artifacts réutilisables en aval            | Changements pertinents pour Node           |
| `checks-fast-core`               | Lanes rapides de correction Linux, comme les vérifications bundled/contrat Plugin/protocole                                | Changements pertinents pour Node           |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat de vérification agrégé stable                              | Changements pertinents pour Node           |
| `checks-node-core-test`          | Shards de tests Node du cœur, hors lanes canal, bundled, contrat et extension                                              | Changements pertinents pour Node           |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, gardes, types de tests et smoke strict                  | Changements pertinents pour Node           |
| `check-additional`               | Architecture, dérive shardée des limites/prompts, gardes d’extensions, limite de package et gateway watch                  | Changements pertinents pour Node           |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                                          | Changements pertinents pour Node           |
| `checks`                         | Vérificateur pour les tests de canaux sur artifacts construits                                                             | Changements pertinents pour Node           |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                                            | Déclenchement manuel CI pour les releases  |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés des docs                                                                  | Docs modifiées                             |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                                                            | Changements pertinents pour les Skills Python |
| `checks-windows`                 | Tests de processus/chemins spécifiques à Windows, plus régressions partagées des spécificateurs d’import runtime           | Changements pertinents pour Windows        |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artifacts construits partagés                                                 | Changements pertinents pour macOS          |
| `macos-swift`                    | Lint, build et tests Swift pour l’application macOS                                                                        | Changements pertinents pour macOS          |
| `android`                        | Tests unitaires Android pour les deux flavors plus un build APK debug                                                      | Changements pertinents pour Android        |
| `test-performance-agent`         | Optimisation quotidienne Codex des tests lents après activité approuvée                                                    | Succès de la CI principale ou déclenchement manuel |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et GPT 5.4 live        | Déclenchement planifié et manuel           |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent réellement. La logique `docs-scope` et `changed-scope` correspond à des étapes dans ce job, pas à des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artifacts et de plateformes.
3. `build-artifacts` se superpose aux lanes Linux rapides afin que les consommateurs en aval puissent commencer dès que le build partagé est prêt.
4. Les lanes de plateforme et runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer des jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications de shards agrégées utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, sans toutefois se mettre en file d’attente après que tout le workflow a déjà été remplacé. La clé de concurrence automatique de CI est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Le job `ci-timings-summary` téléverse un artifact compact `ci-timings-summary` pour chaque exécution CI non draft. Il enregistre le temps mural, le temps en file d’attente, les jobs les plus lents et les jobs échoués pour l’exécution courante, afin que les vérifications de santé CI n’aient pas besoin de scraper à répétition toute la charge utile Actions.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection changed-scope et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node ainsi que le lint des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests core et les modifications étroites d’helpers/tests de routage de contrats Plugin** utilisent un chemin de manifeste rapide Node-only : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artifacts de build, la compatibilité Node 22, les contrats de canaux, les shards core complets, les shards de Plugin bundled et les matrices de gardes supplémentaires lorsque le changement se limite aux surfaces de routage ou d’helpers que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont limitées aux wrappers de processus/chemins spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de paquets et aux surfaces de workflow CI qui exécutent cette lane ; les changements sans rapport de source, Plugin, install-smoke et tests seuls restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans réserver trop de runners : les contrats de canaux s’exécutent en trois shards pondérés, les lanes core unit fast/support s’exécutent séparément, l’infra runtime core est répartie entre les shards state, process/config, Cron et shared, auto-reply s’exécute sous forme de workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configs agentic gateway/server sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artifacts construits. Les tests larges de navigateur, QA, média et Plugins divers utilisent leurs configs Vitest dédiées au lieu du catch-all Plugin partagé. Les shards include-pattern enregistrent les entrées de timing avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un shard filtré. `check-additional` regroupe le travail de compilation/canary package-boundary et sépare l’architecture de topologie runtime de la couverture gateway watch ; la liste de gardes boundary est répartie sur quatre shards de matrice, chacun exécutant des gardes indépendants sélectionnés en parallèle et imprimant les timings par vérification. La coûteuse vérification de dérive des snapshots de prompts Codex happy-path s’exécute uniquement pour la CI manuelle et les changements affectant les prompts, afin que les changements Node normaux sans rapport n’attendent pas derrière une génération froide de snapshots de prompts, tout en maintenant la dérive des prompts rattachée à la PR qui l’a causée ; le même indicateur saute la génération Vitest de snapshots de prompts dans le shard core support-boundary des artifacts construits. Gateway watch, les tests de canaux et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` une fois `dist/` et `dist-runtime/` déjà construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile tout de même le flavor avec les indicateurs BuildConfig SMS/call-log, tout en évitant un job de packaging APK debug en double à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (un passage Knip limité aux dépendances de production, épinglé sur la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les constats de fichiers inutilisés en production de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de Plugins dynamiques, générées, de build, de live-test et de ponts de packages que Knip ne peut pas résoudre statiquement.

## Transmission de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout ni n’exécute le code non fiable des pull requests. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des charges utiles `repository_dispatch` compactes vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transmet uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite volontairement de transmettre le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale relève de l’observation, pas d’une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, les modifications, le bruit de bots, le bruit de Webhook en double et le trafic normal de revue doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les déclenchements manuels de CI exécutent le même graphe de jobs que la CI normale, mais activent de force chaque voie délimitée non Android : fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke test de build, vérifications de docs, Skills Python, Windows, macOS et i18n de l’interface utilisateur de contrôle. Les déclenchements manuels autonomes de CI exécutent Android uniquement avec `include_android=true` ; l’orchestrateur complet de release active Android en passant `include_android=true`. Les vérifications statiques de prérelease de plugins, le fragment réservé à la release `agentic-plugins`, le balayage complet par lots des extensions et les voies Docker de prérelease de plugins sont exclus de la CI. La suite de prérelease Docker s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow `Plugin Prerelease` séparé avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution push ou PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, une balise ou un SHA de commit complet tout en utilisant le fichier de workflow provenant de la ref de déclenchement sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs et agrégats de sécurité rapides (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/groupées, vérifications fragmentées des contrats de canaux, fragments `check` sauf lint, agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, Skills Python, workflow-sanity, labeler, auto-response ; le préflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragments d’extensions moins lourds, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de plugins groupés, fragments `check-additional`, `android`                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps d’attente en file 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks se replient sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |

La CI du dépôt canonique conserve Blacksmith comme chemin de runner par défaut. Pendant `preflight`, `scripts/ci-runner-labels.mjs` vérifie les exécutions Actions récemment en file et en cours pour les jobs Blacksmith en file. Si une étiquette Blacksmith spécifique a déjà des jobs en file, les jobs en aval qui utiliseraient exactement cette étiquette se replient sur le runner hébergé par GitHub correspondant (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) uniquement pour cette exécution. Les autres tailles Blacksmith de la même famille de systèmes d’exploitation restent sur leurs étiquettes principales. Si la sonde d’API échoue, aucun repli n’est appliqué.

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

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Un déclenchement manuel mesure normalement la ref du workflow. Définissez `target_ref` pour mesurer une balise de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testée, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de voie, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une fausse authentification compatible OpenAI déterministe.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds du démarrage, du Gateway et des tours d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La voie mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire dans les cas de démarrage par défaut, avec hook et avec 50 plugins ; boucles hello répétées `channel-chat-baseline` mock-OpenAI ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown de la sonde source se trouve dans `source/index.md` dans le paquet de rapport, avec le JSON brut à côté.

Chaque voie téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commite aussi `report.json`, `report.md`, les paquets, `index.md` et les artefacts de sonde source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de la ref testée est écrit comme `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation complète de release

`Full Release Validation` est le workflow orchestrateur manuel pour « tout exécuter avant la release ». Il accepte une branche, une balise ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible, déclenche `Plugin Prerelease` pour les preuves réservées à la release liées aux plugins/paquets/vérifications statiques/Docker, et déclenche `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation de paquets, les vérifications de paquets multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent la couverture live/E2E exhaustive et du chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation de cette couverture de soak afin que la validation consultative large reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` provenant des vérifications de release. Après publication, passez `npm_telegram_package_spec` pour relancer la même voie de paquet Telegram contre le paquet npm publié.

Voir [Validation complète de release](/fr/reference/full-release-validation) pour la matrice des étapes, les noms exacts des jobs de workflow, les différences de profils, les artefacts et les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow manuel de release mutateur. Déclenchez-le depuis `release/YYYY.M.D` ou `main` après l’existence de la balise de release et après la réussite du préflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`, déclenche `Plugin NPM Release` pour tous les paquets de plugins publiables, déclenche `Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite déclenche `OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

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

Les refs de déclenchement des workflows GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque workflow enfant a un `headSha` correspondant à la cible, puis supprime la branche temporaire quand l’exécution se termine. Le vérificateur parapluie échoue aussi si un workflow enfant s’est exécuté à un SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de release. Les workflows de release manuels utilisent `stable` par défaut ; utilisez `full` seulement lorsque vous voulez intentionnellement la matrice consultative large de fournisseurs/médias. `run_release_soak` contrôle si les vérifications de release stable/par défaut exécutent le soak exhaustif live/E2E et du chemin de release Docker ; `full` force l’activation du soak.

- `minimum` conserve les voies OpenAI/cœur critiques pour la release les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la matrice consultative large de fournisseurs/médias.

Le parapluie enregistre les identifiants des exécutions enfants déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez seulement le job vérificateur parent pour actualiser le résultat parapluie et le résumé des durées.

Pour la récupération, `Full Release Validation` comme `OpenClaw Release Checks` acceptent `rerun_group`. Utilisez `all` pour un candidat de release, `ci` seulement pour l’enfant CI complet normal, `plugin-prerelease` seulement pour l’enfant de prérelease Plugin, `release-checks` pour chaque enfant de release, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le parapluie. Cela permet de limiter la relance d’une boîte de release échouée après un correctif ciblé. Pour une seule voie cross-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes cross-OS émettent des lignes de Heartbeat et les résumés packaged-upgrade incluent les durées par phase. Les voies QA de release-check sont consultatives, donc les échecs QA seuls avertissent mais ne bloquent pas le vérificateur release-check.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre la ref sélectionnée une seule fois en une archive `release-package-under-test`, puis transmet cet artefact aux vérifications cross-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de release lorsque la couverture de soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de release et évite de reconditionner le même candidat dans plusieurs jobs enfants.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent le parapluie plus ancien. Le moniteur parent annule tout workflow enfant qu’il a déjà déclenché lorsque le parent est annulé, afin que la validation plus récente de main ne reste pas bloquée derrière une exécution release-check obsolète de deux heures. La validation de branche/tag de release et les groupes de relance ciblée gardent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute comme des shards nommés via `scripts/test-live-shard.mjs` plutôt que comme un job série unique :

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

Cela conserve la même couverture de fichiers tout en rendant les échecs lents des fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live basées sur Docker sur les runners Blacksmith normaux : les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards live modèle/backend basés sur Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les shards modèle live Docker, Gateway découpé par fournisseur, backend CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des plafonds `timeout` explicites au niveau du script, inférieurs au délai d’expiration du job de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget release-check. Si ces shards reconstruisent indépendamment toute la cible Docker source, l’exécution de release est mal configurée et gaspillera du temps réel sur des constructions d’image dupliquées.

## Acceptation des packages

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme un produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide une seule archive tar via le même harnais Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Jobs

1. `resolve_package` récupère `workflow_ref`, résout un candidat de package unique, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis affiche la source, la ref de workflow, la ref de package, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive tar, prépare les images Docker de digest de package si nécessaire, puis exécute les voies Docker sélectionnées contre ce package au lieu de conditionner la copie de travail du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis répartit ces voies en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la voie Telegram optionnelle a échoué.

### Sources des candidats

- `source=npm` accepte seulement `openclaw@beta`, `openclaw@latest` ou une version de release OpenClaw exacte comme `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prérelease/stable publiée.
- `source=ref` conditionne une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou un tag de release, installe les dépendances dans une worktree détachée, puis le conditionne avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est conditionné lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — morceaux complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de Plugin hors ligne afin que la validation des packages publiés ne dépende pas de la disponibilité live de ClawHub. La voie Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les déclenchements autonomes.

Pour la politique dédiée de mise à jour et de test des Plugins, y compris les commandes locales,
les voies Docker, les entrées Package Acceptance, les valeurs par défaut de release et le triage des échecs,
voir [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent Package Acceptance avec `source=artifact`, l’artefact de package de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela garde les preuves de migration de package, mise à jour, nettoyage de dépendance de Plugin obsolète, réparation d’installation de Plugin configuré, Plugin hors ligne, mise à jour de Plugin et Telegram sur la même archive tar de package résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un package npm publié au lieu de l’artefact construit à partir du SHA. Les vérifications de release cross-OS couvrent toujours l’onboarding, l’installeur et le comportement de plateforme propres à l’OS ; la validation produit du package/de la mise à jour devrait commencer par Package Acceptance. La voie Docker `published-upgrade-survivor` valide une base de référence de package publié par exécution dans le chemin de release bloquant. Dans Package Acceptance, l’archive tar `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la base de référence publiée de repli, par défaut `openclaw@latest` ; les commandes de relance de voie échouée préservent cette base de référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour s’étendre aux quatre dernières releases npm stables, plus des releases de frontière de compatibilité Plugin épinglées et des fixtures calquées sur des issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations configurées de Plugin OpenClaw, les chemins de journaux avec tilde et les racines de dépendances Plugin héritées obsolètes. Les sélections published-upgrade survivor multi-bases sont découpées par base de référence en jobs de runner Docker ciblés séparés. Le workflow distinct `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, pas sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent transmettre des spécifications de package exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la base de référence avec une recette de commande intégrée `openclaw config set`, enregistre les étapes de recette dans `summary.json`, puis sonde `/healthz`, `/readyz` et le statut RPC après le démarrage du Gateway. Les voies Windows fresh empaquetée et installeur vérifient aussi qu’un package installé peut importer un remplacement de contrôle de navigateur depuis un chemin Windows absolu brut. Le smoke agent-turn cross-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’acceptation des packages comporte des fenêtres bornées de compatibilité héritée pour les packages déjà publiés. Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées de QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis du tarball ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le package n’expose pas ce drapeau ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes depuis le faux fixture git dérivé du tarball et peut journaliser l’absence de `update.channel` persistant ;
- les smokes de Plugin peuvent lire les emplacements hérités des enregistrements d’installation ou accepter l’absence de persistance des enregistrements d’installation de la marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut aussi avertir au sujet de fichiers d’empreinte de métadonnées de build locales qui avaient déjà été expédiés. Les packages ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de lanes, les timings de phases et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les lanes Docker exactes plutôt que de relancer la validation complète de release.

## Smoke d’installation

Le workflow `Install Smoke` séparé réutilise le même script de portée via son propre job `preflight`. Il divise la couverture smoke en `run_fast_install_smoke` et `run_full_install_smoke`.

- Le **chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de Plugin groupé, ou les surfaces de Plugin/canal/Gateway/SDK de Plugin de base exercées par les jobs de smoke Docker. Les changements de Plugin groupé uniquement dans le source, les modifications uniquement de tests et les modifications uniquement de documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression des agents dans l’espace de travail partagé, exécute l’e2e gateway-network du conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné de Plugin groupé sous un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- Le **chemin complet** conserve l’installation de package QR et la couverture Docker/update d’installeur pour les exécutions planifiées nocturnes, les dispatches manuels, les contrôles de release via workflow-call et les pull requests qui touchent réellement les surfaces installeur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR de Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installeur/update et l’E2E Docker rapide de Plugin groupé comme jobs séparés afin que le travail d’installeur n’attende pas derrière les smokes de l’image racine.

Les pushes vers `main` (y compris les commits de merge) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent de fournisseur d’image avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon le calendrier nocturne et depuis le workflow des contrôles de release, et les dispatches manuels `Install Smoke` peuvent l’activer, mais les pull requests et les pushes vers `main` ne le font pas. Les tests Docker QR et installeur conservent leurs propres Dockerfiles axés installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois sous forme de tarball npm, et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git nu pour les lanes installeur/update/dépendance de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les lanes de fonctionnalité normales.

Les définitions de lanes Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification réside dans `scripts/lib/docker-e2e-plan.mjs`, et le runner n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par lane avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les lanes avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Réglages

| Variable                               | Par défaut | Objectif                                                                                       |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de slots du pool principal pour les lanes normales.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de slots du pool de queue sensible aux fournisseurs.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond des lanes live concurrentes afin que les fournisseurs ne limitent pas le débit.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond des lanes d’installation npm concurrentes.                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond des lanes multi-service concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de lanes pour éviter les rafales de création du daemon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de secours par lane (120 minutes) ; certaines lanes live/de queue utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1` affiche le plan du planificateur sans exécuter les lanes.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Liste exacte de lanes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une lane échouée. |

Une lane plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécuter seule jusqu’à libérer de la capacité. Les préflights agrégés locaux vérifient Docker, suppriment les conteneurs E2E OpenClaw obsolètes, émettent le statut des lanes actives, persistent les timings de lanes pour l’ordre du plus long au plus court, et cessent par défaut de planifier de nouvelles lanes mutualisées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelles couvertures de package, type d’image, image live, lane et identifiants sont requises. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante, ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images Docker E2E GHCR nues/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des lanes avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les pulls d’images Docker sont réessayés avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué soit réessayé rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Morceaux du chemin de release

La couverture Docker de release exécute des jobs découpés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque morceau ne tire que le type d’image dont il a besoin et exécute plusieurs lanes via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, et `plugins-integrations` restent des alias agrégés de Plugin/runtime. L’alias de lane `install-e2e` reste l’alias de réexécution manuelle agrégée pour les deux lanes d’installeur de fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de release le demande, et conserve un morceau autonome `openwebui` uniquement pour les dispatches limités à OpenWebUI. Les lanes de mise à jour de canaux groupés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de lanes, les timings, `summary.json`, `failures.json`, les timings de phases, le JSON du plan du planificateur, les tableaux de lanes lentes et les commandes de réexécution par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées contre les images préparées au lieu des jobs de morceaux, ce qui garde le débogage d’une lane échouée borné à un job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par lane incluent `package_artifact_run_id`, `package_artifact_name`, et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de release.

## Préversion du Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes vers `main` et les dispatches CI manuels autonomes gardent cette suite désactivée. Il répartit les tests de Plugin groupé entre huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de Plugin lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de prérelease Docker réservé aux releases regroupe les lanes Docker ciblées en petits groupes afin d’éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes.

## Laboratoire QA

Le laboratoire QA dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnesses larges de QA et de release, et non dans un workflow de PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors de dispatch manuel ; il déploie en éventail la lane de parité mock, la lane Matrix live, et les lanes Telegram et Discord live sous forme de jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les vérifications de publication exécutent les voies de transport en direct Matrix et Telegram avec le fournisseur fictif déterministe et les modèles qualifiés fictifs (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles en direct et du démarrage normal des plugins fournisseur. Le gateway de transport en direct désactive la recherche mémoire, car la parité QA couvre séparément le comportement de la mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle en direct, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée du workflow manuel restent `all` ; un déclenchement manuel avec `matrix_profile=all` répartit toujours la couverture Matrix complète entre les tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les voies QA Lab critiques pour la publication avant l’approbation de publication ; sa porte de parité QA exécute les packs candidat et de référence comme tâches de voie parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison de parité finale.

Pour les PR normales, suivez les preuves CI/vérification limitées au périmètre au lieu de traiter la parité comme un état requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un analyseur de sécurité de premier passage étroit, et non l’analyse complète du dépôt. Les exécutions de garde quotidiennes, manuelles et de pull request non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur une `security-severity` élevée/critique.

La garde de pull request reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, cron et référence gateway                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation du canal central, plus le runtime de plugin de canal, le gateway, le Plugin SDK, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse d’IP, garde réseau, web-fetch et politique SSRF du Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, aides d’exécution de processus, livraison sortante et portes d’exécution d’outils d’agent                            |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, du loader, du manifeste, du registre, de l’installation par gestionnaire de packages, du chargement de source et du contrat de package du Plugin SDK |

### Shards de sécurité propres à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit l’application Android manuellement pour CodeQL sur le plus petit runner Linux Blacksmith accepté par la validation de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit l’application macOS manuellement pour CodeQL sur Blacksmith macOS, filtre les résultats de build de dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Maintenu hors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le shard non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript à sévérité erreur et non liées à la sécurité sur des surfaces étroites à forte valeur, sur le plus petit runner Linux Blacksmith. Sa garde de pull request est intentionnellement plus petite que le profil planifié : les PR non brouillon n’exécutent que les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements de code d’exécution de commandes/modèles/outils d’agent et d’envoi de réponses, de schéma/migration/E/S de configuration, d’authentification/secrets/bac à sable/sécurité, de canal central et de runtime de plugin de canal intégré, de protocole/méthode serveur gateway, de runtime mémoire/glue SDK, de livraison MCP/processus/sortante, de runtime fournisseur/catalogue de modèles, de diagnostics de session/files de livraison, de loader de plugin, de contrat Plugin SDK/package, ou de runtime de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

Le déclenchement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des hooks d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentification, secrets, bac à sable, cron et code de frontière de sécurité gateway                                                                             |
| `/codeql-critical-quality/config-boundary`              | Schéma de configuration, migration, normalisation et contrats d’E/S                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal central et des plugins de canal intégrés                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, envoi de modèles/fournisseurs, envoi et files de réponses automatiques, et contrats de runtime du plan de contrôle ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, aides de supervision de processus et contrats de livraison sortante                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hôte mémoire, façades de runtime mémoire, alias mémoire du Plugin SDK, glue d’activation du runtime mémoire et commandes doctor mémoire                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, aides de liaison/livraison de session sortante, surfaces d’événements diagnostiques/bundles de logs et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Envoi de réponses entrantes du Plugin SDK, payloads de réponse/aides de découpage/runtime, options de réponse de canal, files de livraison et aides de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues des fournisseurs et registres web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle gateway et contrats de runtime du plan de contrôle des tâches                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime du fetch/search web central, E/S média, compréhension média, génération d’images et génération média                                           |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de point d’entrée du loader, du registre, de la surface publique et du Plugin SDK                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté package publié et aides de contrat de package de plugin                                                                                 |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension de CodeQL à Swift, Python et aux plugins intégrés ne doit être réintroduite comme travail de suivi limité ou réparti qu’après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur un push non-bot vers `main` peut le déclencher, et le déclenchement manuel peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur un push non-bot vers `main` peut le déclencher, mais il s’ignore si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette porte d’activité quotidienne. La voie construit un rapport de performance Vitest groupé de suite complète, autorise Codex à n’effectuer que de petites corrections de performance de tests préservant la couverture plutôt que de vastes refactorisations, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests de référence réussis. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’aboutisse, la voie rebase le patch validé, réexécute `pnpm check:changed` et retente le push ; les patchs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### PR en double après fusion

Le workflow `Duplicate PRs After Merge` est un workflow manuel de mainteneur pour le nettoyage des doublons après intégration. Il utilise par défaut un dry-run et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changements réside dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre général de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types prod du cœur et des tests du cœur, plus le lint et les gardes du cœur ;
- les changements limités aux tests du cœur exécutent uniquement la vérification de types des tests du cœur, plus le lint du cœur ;
- les changements de production des extensions exécutent la vérification de types prod des extensions et des tests d’extensions, plus le lint des extensions ;
- les changements limités aux tests d’extensions exécutent la vérification de types des tests d’extensions, plus le lint des extensions ;
- les changements publics du SDK Plugin ou des contrats de Plugin s’étendent à la vérification de types des extensions, car les extensions dépendent de ces contrats du cœur (les balayages Vitest des extensions restent un travail de test explicite) ;
- les changements de version limités aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est intentionnellement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappages explicites, puis les tests frères et les dépendants du graphe d’import. La configuration de livraison partagée des salons de groupe fait partie des mappages explicites : les changements de la configuration de réponse visible en groupe, du mode de livraison de réponse source ou de l’invite système de l’outil de message passent par les tests de réponse du cœur, plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche assez largement le harnais pour que l’ensemble mappé peu coûteux ne soit pas un substitut fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une boîte fraîchement préchauffée pour les preuves larges. Avant de lancer un garde lent sur une boîte réutilisée, expirée ou qui vient de signaler une synchronisation anormalement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette boîte et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PR comportant intentionnellement de nombreuses suppressions, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine également une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur plus élevée en millisecondes pour des diffs locaux inhabituellement volumineux.

Crabbox est le wrapper de boîtes distantes détenu par le dépôt pour les preuves Linux des mainteneurs. Utilisez-le lorsqu’une vérification est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve nécessite des secrets, Docker, des voies de package, des boîtes réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli pour les pannes Blacksmith, les problèmes de quota ou les tests explicites sur capacité détenue.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez le fournisseur explicitement même si `.crabbox.yaml` contient des valeurs par défaut de cloud détenu.

Garde des changements :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox ponctuelles adossées à Blacksmith doivent arrêter la Testbox automatiquement ; si une exécution est interrompue ou que le nettoyage n’est pas clair, inspectez les boîtes actives et n’arrêtez que celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Utilisez la réutilisation uniquement lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même boîte hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez Blacksmith directement comme solution de repli étroite :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes, traitez cela comme une pression liée au fournisseur Blacksmith, à la file, à la facturation ou aux limites d’organisation. Arrêtez les identifiants en file que vous avez créés, évitez de lancer davantage de Testboxes et déplacez la preuve vers le chemin de capacité Crabbox détenue ci-dessous pendant qu’une personne vérifie le tableau de bord Blacksmith, la facturation et les limites d’organisation.

N’escaladez vers la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Sous pression AWS, évitez `class=beast` sauf si la tâche nécessite vraiment un processeur de classe 48xlarge. Une demande `beast` commence à 192 vCPU et constitue le moyen le plus simple de déclencher un quota régional EC2 Spot ou On-Demand Standard. Le `.crabbox.yaml` détenu par le dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les locations AWS négociées affichent la région/le marché sélectionné, la pression de quota, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` seulement lorsque standard/fast ne suffisent pas, et `beast` uniquement pour des voies exceptionnellement limitées par le CPU, comme les suites complètes ou les matrices Docker de tous les Plugins, la validation explicite de release/bloqueur, ou le profilage de performance à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, le travail limité à la documentation, le lint/la vérification de types ordinaires, les petites reproductions E2E ou le triage de panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que l’instabilité du marché Spot ne soit pas mélangée au signal.

`.crabbox.yaml` possède les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` possède le checkout, la configuration Node/pnpm, la récupération de `origin/main` et le transfert d’environnement non secret pour les commandes `crabbox run --id <cbx_id>` de cloud détenu.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

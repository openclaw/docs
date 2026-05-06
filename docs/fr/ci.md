---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez l’acheminement ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, contrôles globaux de publication et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-06T09:02:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le cadrage intelligent et déploient tout le graphe pour les release candidates et les validations larges. Les lanes Android restent optionnelles via `include_android`. La couverture Plugin réservée aux releases se trouve dans le workflow séparé [`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis [`Full Release Validation`](#full-release-validation) ou un déclenchement manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecter les changements limités à la doc, les périmètres modifiés, les extensions modifiées, et construire le manifeste CI | Toujours sur les pushs et PRs non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                             | Toujours sur les pushs et PRs non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                 | Toujours sur les pushs et PRs non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushs et PRs non brouillons |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances plus garde de liste d’autorisation des fichiers inutilisés | Changements pertinents pour Node   |
| `build-artifacts`                | Construire `dist/`, Control UI, les vérifications d’artefacts générés, et les artefacts aval réutilisables | Changements pertinents pour Node   |
| `checks-fast-core`               | Lanes de correction Linux rapides, comme les vérifications groupées/plugin-contract/protocole             | Changements pertinents pour Node   |
| `checks-fast-contracts-channels` | Vérifications fragmentées des contrats de canaux avec un résultat de vérification agrégé stable           | Changements pertinents pour Node   |
| `checks-node-core-test`          | Fragments de tests Node du cœur, hors lanes de canaux, groupées, de contrats et d’extensions              | Changements pertinents pour Node   |
| `check`                          | Équivalent fragmenté de la porte locale principale : types prod, lint, gardes, types de tests et smoke strict | Changements pertinents pour Node   |
| `check-additional`               | Architecture, dérive fragmentée des frontières/prompts, gardes d’extensions, frontière de package et surveillance Gateway | Changements pertinents pour Node   |
| `build-smoke`                    | Tests smoke du CLI généré et smoke de mémoire au démarrage                                                | Changements pertinents pour Node   |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts générés                                               | Changements pertinents pour Node   |
| `checks-node-compat-node22`      | Lane de build et smoke de compatibilité Node 22                                                           | Déclenchement CI manuel pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés de la doc                                                | Doc modifiée                       |
| `skills-python`                  | Ruff + pytest pour les skills adossées à Python                                                           | Changements pertinents pour les skills Python |
| `checks-windows`                 | Tests Windows spécifiques de processus/chemins plus régressions partagées des spécificateurs d’import runtime | Changements pertinents pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts générés partagés                                   | Changements pertinents pour macOS  |
| `macos-swift`                    | Swift lint, build et tests pour l’app macOS                                                               | Changements pertinents pour macOS  |
| `android`                        | Tests unitaires Android pour les deux variantes plus un build APK debug                                   | Changements pertinents pour Android |
| `test-performance-agent`         | Optimisation quotidienne par Codex des tests lents après activité fiable                                  | Succès CI sur main ou déclenchement manuel |
| `openclaw-performance`           | Rapports de performance quotidiens/à la demande du runtime Kova avec lanes mock-provider, deep-profile et GPT 5.4 live | Planifié et déclenchement manuel   |

## Ordre fail-fast

1. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` se chevauche avec les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateformes et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs supplantés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou référence `main`. Traitez cela comme du bruit CI sauf si la dernière exécution pour la même référence échoue aussi. Les vérifications agrégées des fragments utilisent `!cancelled() && always()` afin de continuer à signaler les échecs normaux de fragments, mais de ne pas se mettre en file après que tout le workflow a déjà été supplanté. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions sur main. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection `changed-scope` et fait agir le manifeste preflight comme si chaque zone cadrée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le linting des workflows, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateformes restent limitées aux changements de sources de plateformes.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests du cœur, et les modifications étroites d’aides de contrats Plugin/tests de routage** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité, et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les fragments complets du cœur, les fragments de plugins groupés et les matrices de gardes supplémentaires lorsque le changement se limite aux surfaces de routage ou d’aides que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont limitées aux wrappers de processus/chemins propres à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les sources, plugins, install-smoke et changements limités aux tests sans rapport restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont découpées ou équilibrées afin que chaque job reste petit sans sur-réserver de runners : les contrats de canaux s’exécutent en trois fragments pondérés, les lanes rapides/support des unités du cœur s’exécutent séparément, l’infrastructure runtime du cœur est répartie entre fragments d’état et de processus/config, auto-reply s’exécute comme workers équilibrés (avec le sous-arbre de réponse découpé en fragments agent-runner, dispatch et commands/state-routing), et les configs agentic gateway/server sont réparties entre les lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts générés. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configs Vitest dédiées au lieu du fourre-tout partagé des plugins. Les fragments à motif d’inclusion enregistrent les entrées de timing avec le nom de fragment CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une config entière d’un fragment filtré. `check-additional` garde ensemble le travail de compilation/canary de frontières de packages et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste de garde des frontières est répartie sur quatre fragments de matrice, chacun exécutant en parallèle des gardes indépendantes sélectionnées et imprimant les timings par vérification, y compris `pnpm prompt:snapshots:check`, afin que la dérive de prompt du chemin heureux du runtime Codex soit épinglée à la PR qui l’a causée. La surveillance Gateway, les tests de canaux et le fragment de frontière de support du cœur s’exécutent simultanément dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été générés.

Android CI exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. La variante tierce n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile tout de même la variante avec les drapeaux BuildConfig SMS/journal d’appels, tout en évitant un job de packaging d’APK debug en double à chaque push pertinent pour Android.

Le fragment `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimum de release de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers inutilisés de production de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde des fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non revu ou laisse une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugin dynamique, générées, de build, de tests live et de pont de package que Knip ne peut pas résoudre statiquement.

## Transfert de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des payloads compacts `repository_dispatch` à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau des commits sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état, et courts extraits de commentaires ou revues lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé dans le hook OpenClaw Gateway pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures de routine, modifications, activité de bots, bruit de webhooks dupliqués et trafic normal de revues doivent aboutir à `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Déclenchements manuels

Les dispatches CI manuels exécutent le même graphe de tâches que la CI normale, mais activent de force chaque voie d’étendue non Android : shards Linux Node, shards de plugins intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de build, vérifications de documentation, Skills Python, Windows, macOS et i18n de Control UI. Les dispatches CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’ombrelle de version complète active Android en passant `include_android=true`. Les vérifications statiques de préversion des plugins, le shard réservé à la release `agentic-plugins`, le balayage complet par lots des extensions et les voies Docker de préversion des plugins sont exclus de la CI. La suite Docker de préversion s’exécute uniquement lorsque `Full Release Validation` déclenche le workflow séparé `Plugin Prerelease` avec le garde de validation de release activé.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution push ou PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant approuvé d’exécuter ce graphe sur une branche, une étiquette ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la référence de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Exécuteurs

| Exécuteur                         | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                    | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/plugins intégrés, vérifications shardées des contrats de canaux, shards `check` sauf lint, agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de documentation, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`    | `CodeQL Critical Quality`, shards d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`    | `build-artifacts`, build-smoke, shards de tests Linux Node, shards de tests de plugins intégrés, shards `check-additional`, `android`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`   | `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils n’économisent) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il n’économisait)                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`   | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest`  | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                          |

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

## Performance d’OpenClaw

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Un dispatch manuel benchmarke normalement la référence du workflow. Définissez `target_ref` pour benchmarker une étiquette de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs les plus récents sont indexés par la référence testée, et chaque `index.md` enregistre la référence/SHA testée, la référence/SHA du workflow, la référence Kova, le profil, le mode d’authentification de voie, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/heap/trace pour les points chauds au démarrage, du Gateway et des tours d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La voie mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : temps de démarrage du Gateway et mémoire pour les cas de démarrage par défaut, hook et 50 plugins ; boucles hello répétées `channel-chat-baseline` mock-OpenAI ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown de la sonde source se trouve à `source/index.md` dans le paquet de rapports, avec le JSON brut à côté.

Chaque voie téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commit également `report.json`, `report.md`, les paquets, `index.md` et les artefacts de sondes source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur actuel de référence testée est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de release complète

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la release ». Il accepte une branche, une étiquette ou un SHA de commit complet, déclenche le workflow `CI` manuel avec cette cible, déclenche `Plugin Prerelease` pour les preuves réservées à la release concernant les plugins/packages/statique/Docker, et déclenche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation des packages, les vérifications de packages multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent la couverture live/E2E exhaustive et le chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force cette couverture de soak à s’activer afin que la validation consultative large reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` issu des vérifications de release. Après publication, passez `npm_telegram_package_spec` pour réexécuter la même voie de package Telegram contre le package npm publié.

Consultez [Validation de release complète](/fr/reference/full-release-validation) pour la
matrice des étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et
les poignées de réexécution ciblée.

`OpenClaw Release Publish` est le workflow de release manuel et mutateur. Déclenchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence de l’étiquette de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
déclenche `Plugin NPM Release` pour tous les packages de plugins publiables, déclenche
`Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite déclenche
`OpenClaw NPM Release` avec le `preflight_run_id` enregistré.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant au lieu de
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de dispatch de workflow GitHub doivent être des branches ou des étiquettes, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible,
déclenche `Full Release Validation` depuis cette référence épinglée, vérifie que chaque
`headSha` de workflow enfant correspond à la cible, et supprime la branche temporaire lorsque
l’exécution se termine. Le vérificateur ombrelle échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de publication. Les workflows de publication manuelle utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous voulez intentionnellement la large matrice consultative fournisseurs/médias. `run_release_soak` contrôle si les vérifications de publication stables/par défaut exécutent le soak exhaustif live/E2E et du chemin de publication Docker ; `full` force l’activation du soak.

- `minimum` conserve les lanes OpenAI/cœur critiques pour la publication les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseurs/médias.

L’umbrella enregistre les identifiants des exécutions enfants déclenchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est relancé et devient vert, relancez uniquement la tâche de vérification parente pour actualiser le résultat umbrella et le résumé des durées.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une candidate de publication, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prépublication de Plugin, `release-checks` pour chaque enfant de publication, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur l’umbrella. Cela garde la relance d’une boîte de publication échouée bornée après une correction ciblée. Pour une lane cross-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes cross-OS émettent des lignes Heartbeat et les résumés packaged-upgrade incluent les durées par phase. Les lanes QA des vérifications de publication sont consultatives ; les échecs QA uniquement avertissent donc sans bloquer le vérificateur des vérifications de publication.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact aux vérifications cross-OS et à Package Acceptance, ainsi qu’au workflow Docker live/E2E du chemin de publication lorsque la couverture de soak s’exécute. Cela maintient les octets du paquet cohérents entre les boîtes de publication et évite de réemballer la même candidate dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all` remplacent l’ancienne umbrella. Le moniteur parent annule tout workflow enfant qu’il a déjà déclenché lorsque le parent est annulé, afin qu’une validation main plus récente ne reste pas derrière une exécution obsolète de deux heures des vérifications de publication. Les validations de branche/tag de publication et les groupes de relance ciblés conservent `cancel-in-progress: false`.

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
- fragments audio/vidéo média séparés et fragments musique filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les fragments média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches média ne font que vérifier les binaires avant la configuration. Gardez les suites live basées sur Docker sur des runners Blacksmith normaux — les tâches conteneurisées ne sont pas adaptées au lancement de tests Docker imbriqués.

Les fragments live de modèles/backends basés sur Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de publication live construit et pousse cette image une seule fois, puis les fragments du modèle live Docker, du Gateway fragmenté par fournisseur, du backend CLI, de la liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker Gateway portent des limites `timeout` explicites au niveau des scripts, inférieures au délai d’expiration de la tâche de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget des vérifications de publication. Si ces fragments reconstruisent indépendamment la cible Docker complète des sources, l’exécution de publication est mal configurée et gaspillera du temps d’horloge sur des constructions d’image dupliquées.

## Acceptation du paquet

Utilisez `Package Acceptance` lorsque la question est : « ce paquet OpenClaw installable fonctionne-t-il comme produit ? » C’est différent de la CI normale : la CI normale valide l’arbre des sources, tandis que l’acceptation du paquet valide une seule archive via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout une candidate de paquet, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence de workflow, la référence du paquet, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker à condensat de paquet si nécessaire, et exécute les lanes Docker sélectionnées contre ce paquet au lieu d’emballer l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le paquet et les images partagées une seule fois, puis distribue ces lanes sous forme de tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un déclenchement Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du paquet, l’acceptation Docker ou la lane Telegram facultative a échoué.

### Sources candidates

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw comme `openclaw@2026.4.27-beta.2`. Utilisez ceci pour l’acceptation de prépublications/publications stables publiées.
- `source=ref` emballe une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est joignable depuis l’historique des branches du dépôt ou depuis un tag de publication, installe les dépendances dans un worktree détaché, puis l’emballe avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source emballé lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits sources approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segments complets du chemin de publication Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation d’un paquet publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram facultative réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tandis que le chemin de spécification npm publiée est conservé pour les déclenchements autonomes.

Pour la politique dédiée de test des mises à jour et des Plugins, y compris les commandes locales, les lanes Docker, les entrées Package Acceptance, les valeurs de publication par défaut et le tri des échecs, consultez [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).

Les vérifications de publication appellent Package Acceptance avec `source=artifact`, l’artefact de paquet de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela maintient la migration de paquet, la mise à jour, le nettoyage des dépendances de Plugins obsolètes, la réparation d’installation de Plugins configurés, le Plugin hors ligne, la mise à jour de Plugin et la preuve Telegram sur la même archive de paquet résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un paquet npm livré au lieu de l’artefact construit depuis le SHA. Les vérifications de publication cross-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme propres à l’OS ; la validation produit paquet/mise à jour devrait commencer par Package Acceptance. La lane Docker `published-upgrade-survivor` valide une baseline de paquet publiée par exécution dans le chemin de publication bloquant. Dans Package Acceptance, l’archive `package-under-test` résolue est toujours la candidate et `published_upgrade_survivor_baseline` sélectionne la baseline publiée de repli, avec `openclaw@latest` par défaut ; les commandes de relance des lanes échouées préservent cette baseline. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` pour étendre la couverture aux quatre dernières publications npm stables, ainsi qu’aux publications épinglées de frontière de compatibilité Plugin et aux fixtures en forme d’issues pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations de Plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines obsolètes de dépendances de Plugins hérités. Les sélections multi-baselines du survivant de mise à niveau publiée sont fragmentées par baseline dans des tâches de runner Docker ciblées séparées. Le workflow `Update Migration` distinct utilise la lane Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur un nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent transmettre des spécifications exactes de paquets avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule lane avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La lane publiée configure la baseline avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, ainsi que le statut RPC après le démarrage du Gateway. Les lanes fraîches Windows emballées et installateur vérifient aussi qu’un paquet installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le smoke cross-OS OpenAI de tour d’agent utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

Package Acceptance dispose de fenêtres bornées de compatibilité héritée pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquants depuis la fixture git factice dérivée de l’archive et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de Plugins peuvent lire des emplacements hérités d’enregistrements d’installation ou accepter l’absence de persistance d’enregistrement d’installation du marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en continuant d’exiger que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le package `2026.4.26` publié peut également émettre un avertissement pour les fichiers d’horodatage de métadonnées de build local qui avaient déjà été livrés. Les packages ultérieurs doivent respecter les contrats modernes ; dans les mêmes conditions, ils échouent au lieu d’émettre un avertissement ou d’être ignorés.

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

Lors du débogage d’une exécution d’acceptation de package échouée, commencez par le résumé `resolve_package` pour confirmer la source du package, sa version et son SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux des voies, les minutages de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer la validation complète de release.

## Smoke d’installation

Le workflow distinct `Install Smoke` réutilise le même script de portée via sa propre tâche `preflight`. Il divise la couverture smoke entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests qui touchent les surfaces Docker/package, les changements de package/manifeste de plugins groupés, ou les surfaces de Plugin SDK, de Gateway, de canal ou de plugin cœur que les tâches de smoke Docker exercent. Les changements de source uniquement dans les plugins groupés, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le smoke CLI de suppression d’agents dans un espace de travail partagé, exécute l’e2e Gateway-réseau du conteneur, vérifie un argument de build d’extension groupée et exécute le profil Docker borné de plugins groupés sous un délai global de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update des installateurs pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de release appelées par workflow et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image smoke GHCR du Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les smokes Dockerfile racine/Gateway, les smokes installateur/update et l’E2E Docker rapide des plugins groupés comme tâches séparées afin que le travail d’installation n’attende pas derrière les smokes de l’image racine.

Les pushes vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée modifiée demanderait une couverture complète sur un push, le workflow conserve le smoke Docker rapide et laisse le smoke d’installation complet à la validation nocturne ou de release.

Le smoke lent de fournisseur d’images avec installation globale Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon la planification nocturne et depuis le workflow de vérifications de release, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les pull requests et les pushes vers `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, emballe OpenClaw une fois sous forme de tarball npm, puis construit deux images partagées `scripts/e2e/Dockerfile` :

- un exécuteur Node/Git minimal pour les voies installateur/update/dépendance de plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normales.

Les définitions de voies Docker résident dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Par défaut | Objectif                                                                                          |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre d’emplacements du pool principal pour les voies normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre d’emplacements du pool final sensible aux fournisseurs.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond des voies live concurrentes afin que les fournisseurs n’appliquent pas de throttling.     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond des voies d’installation npm concurrentes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond des voies multi-services concurrentes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les rafales de créations du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai de secours par voie (120 minutes) ; certaines voies live/finales utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan du planificateur sans exécuter les voies.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste de voies exactes séparées par des virgules ; ignore le smoke de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. L’agrégat local effectue les prévols Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, persiste les minutages des voies pour l’ordonnancement du plus long au plus court et arrête par défaut de planifier de nouvelles voies mutualisées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels package, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il emballe OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution courante ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images E2E Docker GHCR minimalistes/fonctionnelles étiquetées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de package au lieu de reconstruire. Les extractions d’images Docker sont retentées avec un délai borné de 180 secondes par tentative, afin qu’un flux registre/cache bloqué soit relancé rapidement plutôt que de consommer la majeure partie du chemin critique CI.

### Morceaux du chemin de release

La couverture Docker de release exécute des tâches découpées plus petites avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque morceau n’extraie que le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les morceaux Docker de release actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux voies d’installateur de fournisseur.

OpenWebUI est intégré dans `plugins-runtime-services` lorsque la couverture release-path complète le demande, et conserve un morceau autonome `openwebui` uniquement pour les déclenchements limités à OpenWebUI. Les voies de mise à jour de canaux groupés retentent une fois en cas d’échecs transitoires du réseau npm.

Chaque morceau téléverse `.artifacts/docker-tests/` avec les journaux de voies, les minutages, `summary.json`, `failures.json`, les minutages de phase, le JSON du plan du planificateur, les tableaux de voies lentes et les commandes de réexécution par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées sur les images préparées au lieu des tâches par morceaux, ce qui limite le débogage d’une voie échouée à une seule tâche Docker ciblée et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, la tâche ciblée construit localement l’image de test live pour cette réexécution. Les commandes de réexécution GitHub générées par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement toute la suite Docker release-path.

## Préversion Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; il s’agit donc d’un workflow distinct déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushes vers `main` et les déclenchements manuels CI autonomes gardent cette suite désactivée. Il répartit les tests de plugins groupés sur huit workers d’extension ; ces tâches de fragments d’extension exécutent jusqu’à deux groupes de configuration de plugin à la fois, avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de plugins lourds en imports ne créent pas de tâches CI supplémentaires. Le chemin de prérelease Docker limité aux releases regroupe les voies Docker ciblées en petits groupes pour éviter de réserver des dizaines d’exécuteurs pour des tâches d’une à trois minutes.

## Labo QA

Le Labo QA dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les larges harnais QA et de release, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une large exécution de validation.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un déclenchement manuel ; il déploie en éventail la voie de parité mock, la voie Matrix live, ainsi que les voies Telegram et Discord live comme tâches parallèles. Les tâches live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des leases Convex.

Les vérifications de release exécutent les voies de transport live Matrix et Telegram avec le fournisseur mock déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des plugins de fournisseur. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement de mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les gates planifiés et de release, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. L’entrée de workflow manuelle et la valeur par défaut de la CLI restent `all` ; un déclenchement manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies Labo QA critiques pour la release avant l’approbation de release ; son gate de parité QA exécute les packs candidat et de référence comme tâches de voies parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/check à portée limitée au lieu de traiter parity comme un statut requis.

## CodeQL

Le workflow `CodeQL` est volontairement un scanner de sécurité de premier passage étroit, et non un balayage complet du dépôt. Les exécutions de garde quotidiennes, manuelles et de pull request non draft scannent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevé/critique.

La garde de pull request reste légère : elle démarre uniquement pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. CodeQL Android et macOS restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, cron et base de référence du Gateway                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur plus le runtime du Plugin de canal, Gateway, SDK de Plugin, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces de politique SSRF du cœur, analyse IP, garde réseau, web-fetch et SDK de Plugin                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante et portes d’exécution d’outils d’agent                            |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour installation de Plugin, chargeur, manifeste, registre, installation par gestionnaire de paquets, chargement de source et contrat de paquet du SDK de Plugin |

### Fragments de sécurité spécifiques à la plateforme

- `CodeQL Android Critical Security` — fragment de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Blacksmith Linux accepté par le contrôle de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragment de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build de dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Maintenu hors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le fragment non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur, non liées à la sécurité, sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non draft exécutent uniquement les fragments correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant au code d’exécution des commandes/modèles/outils d’agent et de distribution des réponses, au code de schéma/migration/IO de configuration, au code auth/secrets/sandbox/sécurité, au runtime des canaux du cœur et des Plugins de canal intégrés, au protocole Gateway/méthodes serveur, au runtime mémoire/glue SDK, à MCP/processus/livraison sortante, au runtime provider/catalogue de modèles, aux diagnostics de session/files de livraison, au chargeur de Plugin, au SDK de Plugin/contrat de paquet ou au runtime de réponse du SDK de Plugin. Les changements de configuration CodeQL et de workflow de qualité exécutent les douze fragments de qualité PR.

Le lancement manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un fragment de qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité pour authentification, secrets, sandbox, cron et Gateway                                                                            |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, migration, normalisation et IO                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du cœur et des Plugins de canal intégrés                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats runtime pour exécution de commandes, distribution modèle/provider, distribution et files de réponse automatique, et plan de contrôle ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, helpers de supervision de processus et contrats de livraison sortante                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK d’hôte mémoire, façades runtime mémoire, alias mémoire du SDK de Plugin, glue d’activation du runtime mémoire et commandes doctor mémoire                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, helpers de liaison/livraison de session sortante, surfaces d’événements diagnostics/bundles de journaux et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK de Plugin, helpers de payload/segmentation/runtime de réponse, options de réponse de canal, files de livraison et helpers de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, auth et découverte des providers, enregistrement du runtime provider, valeurs par défaut/catalogues des providers et registres web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats runtime du plan de contrôle des tâches                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats runtime pour fetch/search web du cœur, IO média, compréhension média, génération d’images et génération média                                             |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de chargeur, registre, surface publique et points d’entrée du SDK de Plugin                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée côté paquet du SDK de Plugin et helpers de contrat de paquet Plugin                                                                                |

La qualité reste séparée de la sécurité afin que les résultats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL pour Swift, Python et les Plugins intégrés ne doit être réintroduite comme travail de suivi à portée limitée ou fragmenté qu’après stabilisation du temps d’exécution et du signal des profils étroits.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex déclenchée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie d’un push non bot sur `main` peut le déclencher, et un lancement manuel peut l’exécuter directement. Les invocations workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire puisse couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex déclenchée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie d’un push non bot sur `main` peut le déclencher, mais il est ignoré si une autre invocation workflow-run s’est déjà exécutée ou est en cours ce jour UTC. Le lancement manuel contourne cette porte d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur toute la suite, laisse Codex apporter uniquement de petites corrections de performance de tests qui préservent la couverture au lieu de refactorisations larges, puis réexécute le rapport sur toute la suite et rejette les changements qui réduisent le nombre de tests réussis de référence. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport sur toute la suite après l’agent doit passer avant tout commit. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le patch validé, réexécute `pnpm check:changed` et retente le push ; les patchs obsolètes conflictuels sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent docs.

### PR dupliquées après merge

Le workflow `Duplicate PRs After Merge` est un workflow manuel de mainteneur pour nettoyer les duplicats après intégration. Il utilise dry-run par défaut et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est mergée et que chaque duplicat possède soit une issue référencée partagée, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des voies de changements vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent le typecheck prod du cœur et test du cœur plus le lint/les gardes du cœur ;
- les changements uniquement de tests du cœur exécutent seulement le typecheck des tests du cœur plus le lint du cœur ;
- les changements de production d’extension exécutent le typecheck prod d’extension et test d’extension plus le lint d’extension ;
- les changements uniquement de tests d’extension exécutent le typecheck des tests d’extension plus le lint d’extension ;
- les changements publics du SDK de Plugin ou de contrat de Plugin s’étendent au typecheck d’extension parce que les extensions dépendent de ces contrats du cœur (les balayages Vitest d’extension restent un travail de test explicite) ;
- les changements de version uniquement dans les métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine ;
- les changements inconnus de racine/config échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’import. La configuration de livraison partagée en salon de groupe fait partie des mappings explicites : les changements de la configuration de réponse visible au groupe, du mode de livraison de réponse source ou du prompt système de l’outil de message passent par les tests de réponse du cœur plus les régressions de livraison Discord et Slack afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement est assez large au niveau du harness pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation avec Testbox

Exécutez Testbox depuis la racine du dépôt et privilégiez une box fraîchement préchauffée pour une preuve large. Avant de lancer une gate lente sur une box réutilisée, expirée ou qui vient de signaler une synchronisation anormalement volumineuse, exécutez d’abord `pnpm testbox:sanity` dans la box.

La vérification de bon état échoue rapidement lorsque des fichiers racine requis tels que `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette box et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs avec suppressions massives intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de vérification.

`pnpm testbox:run` termine également une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie après synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette protection, ou utilisez une valeur en millisecondes plus grande pour des diffs locaux inhabituellement volumineux.

Crabbox est le wrapper de box distante appartenant au dépôt pour les preuves Linux des mainteneurs. Utilisez-le lorsqu’une vérification est trop large pour une boucle d’édition locale, lorsque la parité CI compte, ou lorsque la preuve nécessite des secrets, Docker, des lanes de packages, des box réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner détenue est une solution de repli en cas de pannes Blacksmith, de problèmes de quota ou de tests explicites sur capacité détenue.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` contient des valeurs par défaut pour le cloud détenu.

Gate des changements :

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

Réexécution de test ciblée :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox ponctuelles adossées à Blacksmith devraient arrêter automatiquement la Testbox ; si une exécution est interrompue ou que le nettoyage n’est pas clair, inspectez les box actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Utilisez la réutilisation uniquement lorsque vous avez intentionnellement besoin de plusieurs commandes sur la même box hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith fonctionne, utilisez Blacksmith directement comme solution de repli ciblée :

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Escaladez vers la capacité Crabbox détenue uniquement lorsque Blacksmith est indisponible, limité par quota, ne dispose pas de l’environnement nécessaire, ou lorsque la capacité détenue est explicitement l’objectif :

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` détient les valeurs par défaut de fournisseur, synchronisation et hydratation GitHub Actions pour les lanes de cloud détenu. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` détient le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes `crabbox run --id <cbx_id>` sur cloud détenu.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

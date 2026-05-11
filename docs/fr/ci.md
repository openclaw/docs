---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec.
    - Vous coordonnez une exécution ou une réexécution de validation de publication
    - Vous modifiez le routage ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des jobs CI, garde-fous de périmètre, regroupements de publication et équivalents de commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-11T20:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

La CI OpenClaw s’exécute à chaque push vers `main` et pour chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le cadrage intelligent et déploient le graphe complet pour les release candidates et la validation large. Les lanes Android restent optionnelles via `include_android`. La couverture des plugins réservée aux releases vit dans le workflow séparé [`Préversion des Plugins`](#plugin-prerelease) et ne s’exécute qu’à partir de [`Validation complète de release`](#full-release-validation) ou d’un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecte les changements docs-only, les scopes modifiés, les extensions modifiées et construit le manifeste CI | Toujours sur les pushes et PRs non draft |
| `security-scm-fast`              | Détection de clés privées et audit des workflows via `zizmor`                                             | Toujours sur les pushes et PRs non draft |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances contre les avis npm                                      | Toujours sur les pushes et PRs non draft |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushes et PRs non draft |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances plus garde d’allowlist des fichiers inutilisés           | Modifications pertinentes pour Node |
| `build-artifacts`                | Construit `dist/`, l’interface Control, les vérifications d’artefacts construits et les artefacts aval réutilisables | Modifications pertinentes pour Node |
| `checks-fast-core`               | Lanes rapides de correction Linux, comme les vérifications bundled/plugin-contract/protocol               | Modifications pertinentes pour Node |
| `checks-fast-contracts-channels` | Vérifications shardées des contrats de canaux avec un résultat de vérification agrégé stable              | Modifications pertinentes pour Node |
| `checks-node-core-test`          | Shards de tests Node cœur, hors lanes canaux, bundled, contrats et extensions                             | Modifications pertinentes pour Node |
| `check`                          | Équivalent shardé de la gate locale principale : types prod, lint, gardes, types de test et smoke strict  | Modifications pertinentes pour Node |
| `check-additional`               | Architecture, dérive shardée boundary/prompt, gardes d’extensions, boundary de package et surveillance Gateway | Modifications pertinentes pour Node |
| `build-smoke`                    | Tests smoke de CLI construite et smoke de mémoire au démarrage                                            | Modifications pertinentes pour Node |
| `checks`                         | Vérificateur pour les tests de canaux sur artefacts construits                                            | Modifications pertinentes pour Node |
| `checks-node-compat-node22`      | Lane de build et de smoke de compatibilité Node 22                                                        | Dispatch CI manuel pour les releases |
| `check-docs`                     | Formatage, lint et vérifications de liens brisés des docs                                                 | Docs modifiées                     |
| `skills-python`                  | Ruff + pytest pour les Skills adossés à Python                                                            | Modifications pertinentes pour les Skills Python |
| `checks-windows`                 | Tests de processus/chemins spécifiques à Windows plus régressions de spécificateurs d’import runtime partagés | Modifications pertinentes pour Windows |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Modifications pertinentes pour macOS |
| `macos-swift`                    | Lint, build et tests Swift pour l’app macOS                                                               | Modifications pertinentes pour macOS |
| `android`                        | Tests unitaires Android pour les deux flavors plus build d’un APK debug                                   | Modifications pertinentes pour Android |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après activité de confiance                                | Succès de la CI principale ou dispatch manuel |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes mock-provider, deep-profile et live GPT 5.4 | Dispatch planifié et manuel        |

## Ordre de fail-fast

1. `preflight` décide quelles lanes existent tout court. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds de matrice d’artefacts et de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes plus lourdes de plateforme et de runtime se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou ref `main`. Traitez cela comme du bruit CI sauf si l’exécution la plus récente pour la même ref échoue aussi. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs de shards normaux, sans pour autant se mettre en file après que tout le workflow a déjà été remplacé. La clé de concurrence CI automatique est versionnée (`CI-v7-*`) afin qu’un zombie côté GitHub dans un ancien groupe de file ne puisse pas bloquer indéfiniment les nouvelles exécutions principales. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

Le job `ci-timings-summary` téléverse un artefact compact `ci-timings-summary` pour chaque exécution CI non draft. Il enregistre le temps mur, le temps de file, les jobs les plus lents et les jobs échoués pour l’exécution courante, afin que les vérifications de santé CI n’aient pas besoin de récupérer à répétition la charge utile Actions complète.

## Scope et routage

La logique de scope vit dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection de changed-scope et fait agir le manifeste preflight comme si chaque zone scopée avait changé.

- **Les modifications du workflow CI** valident le graphe CI Node plus le linting de workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent scopées aux changements de source de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures core-test, et les modifications étroites de helpers/tests de routage de contrats de plugins** utilisent un chemin de manifeste Node-only rapide : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canaux, les shards cœur complets, les shards de plugins bundled et les matrices de gardes additionnelles lorsque le changement se limite aux surfaces de routage ou de helpers que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont scopées aux wrappers de processus/chemins spécifiques à Windows, aux helpers de runners npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les modifications sans rapport de source, de plugin, d’install-smoke et de tests seulement restent sur les lanes Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver les runners : les contrats de canaux s’exécutent en trois shards pondérés adossés à Blacksmith avec le fallback runner GitHub standard, les lanes rapides/support d’unités cœur s’exécutent séparément, l’infra runtime cœur est divisée entre shards state, process/config, cron et shared, l’auto-reply s’exécute sous forme de workers équilibrés (avec le sous-arbre reply divisé en shards agent-runner, dispatch et commands/state-routing), et les configurations agentic gateway/server sont divisées entre lanes chat/auth/model/http-plugin/runtime/startup au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, médias et plugins divers utilisent leurs configurations Vitest dédiées au lieu du catch-all de plugins partagé. Les shards à motifs d’inclusion enregistrent les entrées de temps avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional` garde ensemble le travail compile/canary de package-boundary et sépare l’architecture de topologie runtime de la couverture de surveillance Gateway ; la liste de gardes boundary est répartie sur quatre shards de matrice, chacun exécutant des gardes indépendantes sélectionnées en parallèle et imprimant les temps par vérification. La vérification coûteuse de dérive du snapshot de prompt Codex happy-path s’exécute comme son propre job additionnel pour la CI manuelle et uniquement pour les changements affectant les prompts, afin que les changements Node normaux sans rapport n’attendent pas derrière la génération froide de snapshots de prompt et que les shards boundary restent équilibrés tout en gardant la dérive de prompt liée à la PR qui l’a causée ; le même flag ignore la génération Vitest de snapshots de prompt dans le shard core support-boundary sur artefact construit. La surveillance Gateway, les tests de canaux et le shard core support-boundary s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` ont déjà été construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK debug Play. Le flavor third-party n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile toujours le flavor avec les flags BuildConfig SMS/call-log, tout en évitant un job de packaging d’APK debug en double à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. La garde de fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée d’allowlist obsolète, tout en préservant les surfaces intentionnelles de plugins dynamiques, générées, de build, de tests live et de bridges de package que Knip ne peut pas résoudre statiquement.

## Transfert d’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le bridge côté cible de l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un token GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des charges utiles `repository_dispatch` compactes à `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issue et de pull request ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issues ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau commit sur les pushes vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’item, URL, titre, état et courts extraits de commentaires ou de revues lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui poste l’événement normalisé au hook Gateway OpenClaw pour l’agent ClawSweeper.

L’activité générale est de l’observation, pas une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit poster sur `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile sur le plan opérationnel. Les ouvertures routinières, modifications, churn de bots, bruit de webhooks en double et trafic normal de revues doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ils servent d’entrée pour la synthèse et le triage, pas d’instructions pour le workflow ni pour l’environnement d’exécution de l’agent.

## Dispatches manuels

Les dispatches CI manuels exécutent le même graphe de jobs que la CI normale, mais activent de force chaque voie à portée non Android : shards Linux Node, shards de Plugins intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke test de build, vérifications docs, Skills Python, Windows, macOS et i18n de l’interface Control. Les dispatches CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’ombrelle de release complète active Android en passant `include_android=true`. Les vérifications statiques de prérelease de Plugin, le shard réservé aux releases `agentic-plugins`, le balayage complet par lot des extensions et les voies Docker de prérelease de Plugin sont exclus de la CI. La suite Docker de prérelease ne s’exécute que lorsque `Full Release Validation` dispatche le workflow séparé `Plugin Prerelease` avec la gate de validation de release activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de release candidate ne soit pas annulée par une autre exécution push ou PR sur la même ref. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, une balise ou un SHA de commit complet tout en utilisant le fichier de workflow de la ref de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, jobs de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/intégrées, vérifications shardées des contrats de canaux, shards `check` sauf lint, agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications docs, Skills Python, workflow-sanity, labeler, auto-response ; le preflight install-smoke utilise aussi Ubuntu hébergé par GitHub pour que la matrice Blacksmith puisse être mise en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards d’extensions plus légers, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shards de tests Linux Node, shards de tests de Plugins intégrés, shards `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (assez sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne font gagner) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il ne faisait gagner)                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` sur `openclaw/openclaw` ; les forks retombent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` sur `openclaw/openclaw` ; les forks retombent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                               |

La CI du dépôt canonique garde Blacksmith comme chemin de runner par défaut. Pendant `preflight`, `scripts/ci-runner-labels.mjs` vérifie les exécutions Actions récentes en file d’attente et en cours pour les jobs Blacksmith en file. Si une étiquette Blacksmith précise a déjà des jobs en file, les jobs en aval qui utiliseraient exactement cette étiquette retombent sur le runner hébergé par GitHub correspondant (`ubuntu-24.04`, `windows-2025` ou `macos-latest`) uniquement pour cette exécution. Les autres tailles Blacksmith de la même famille d’OS restent sur leurs étiquettes principales. Si la sonde API échoue, aucun fallback n’est appliqué.

## Équivalents locaux

```bash
pnpm changed:lanes                            # inspecter le classifieur local de voies modifiées pour origin/main...HEAD
pnpm check:changed                            # gate de vérification locale intelligente : typecheck/lint/guards modifiés par voie de frontière
pnpm check                                    # gate locale rapide : tsgo prod + lint shardé + guards rapides en parallèle
pnpm check:test-types
pnpm check:timed                              # même gate avec temps par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # tests vitest
pnpm test:changed                             # cibles Vitest modifiées intelligentes et peu coûteuses
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # format docs + lint + liens rompus
pnpm build                                    # construire dist lorsque les voies d’artefacts CI/build-smoke comptent
pnpm ci:timings                               # résumer la dernière exécution CI push origin/main
pnpm ci:timings:recent                        # comparer les exécutions CI main réussies récentes
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps mur, le temps de file d’attente et les jobs les plus lents
node scripts/ci-run-timings.mjs --latest-main # ignorer le bruit des issues/commentaires et choisir la CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions CI main réussies récentes
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performance OpenClaw

`OpenClaw Performance` est le workflow de performance produit/environnement d’exécution. Il s’exécute chaque jour sur `main` et peut être dispatché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le dispatch manuel benchmarke normalement la ref du workflow. Définissez `target_ref` pour benchmarker une balise de release ou une autre branche avec l’implémentation actuelle du workflow. Les chemins de rapports publiés et les pointeurs latest sont indexés par la ref testée, et chaque `index.md` enregistre la ref/SHA testé, la ref/SHA du workflow, la ref Kova, le profil, le mode d’authentification de voie, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une release épinglée et Kova depuis `openclaw/Kova` à l’entrée épinglée `kova_ref`, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova contre un environnement d’exécution de build local avec une fausse authentification déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace des points chauds de démarrage, de Gateway et de tour d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible.

La voie mock-provider exécute aussi des sondes de source natives OpenClaw après le passage Kova : temps de démarrage et mémoire du Gateway pour les cas de démarrage par défaut, hook et 50 Plugins ; boucles hello répétées mock-OpenAI `channel-chat-baseline` ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown de la sonde de source se trouve dans `source/index.md` dans le paquet de rapport, avec le JSON brut à côté.

Chaque voie téléverse des artefacts GitHub. Lorsque `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commite aussi `report.json`, `report.md`, les paquets, `index.md` et les artefacts de sonde de source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Le pointeur de ref testée actuelle est écrit sous `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validation de release complète

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la release ». Il accepte une branche, une balise ou un SHA de commit complet, dispatche le workflow `CI` manuel avec cette cible, dispatche `Plugin Prerelease` pour les preuves Plugin/package/statique/Docker réservées aux releases, et dispatche `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent la couverture live/E2E exhaustive et du chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force cette couverture de soak pour que la validation consultative large reste large. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` issu des vérifications de release. Après publication, passez `release_package_spec` pour réutiliser le package npm livré dans les vérifications de release, Package Acceptance, Docker, multi-OS et Telegram sans reconstruire. Utilisez `npm_telegram_package_spec` uniquement lorsque Telegram doit prouver un package différent.

Consultez [Validation de release complète](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts de jobs de workflow, les différences de profils, les artefacts et
les identifiants de relance ciblée.

`OpenClaw Release Publish` est le workflow de release manuel mutateur. Dispatchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence de la balise de release et après la
réussite du preflight npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
dispatche `Plugin NPM Release` pour tous les packages Plugin publiables, dispatche
`Plugin ClawHub Release` pour le même SHA de release, puis seulement ensuite dispatche
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

Les refs de dispatch des workflows GitHub doivent être des branches ou des tags, pas des SHA de commit bruts. L’assistant pousse une branche temporaire `release-ci/<sha>-...` au SHA cible, déclenche `Full Release Validation` depuis cette ref épinglée, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire lorsque l’exécution se termine. Le vérificateur parapluie échoue aussi si un workflow enfant s’est exécuté sur un SHA différent.

`release_profile` contrôle l’étendue live/fournisseur transmise aux vérifications de release. Les workflows de release manuels utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous voulez intentionnellement la large matrice consultative fournisseur/média. `run_release_soak` contrôle si les vérifications de release stables/par défaut exécutent le soak exhaustif live/E2E et Docker du chemin de release ; `full` force l’activation du soak.

- `minimum` conserve les lanes OpenAI/noyau critiques pour la release les plus rapides.
- `stable` ajoute l’ensemble stable fournisseur/backend.
- `full` exécute la large matrice consultative fournisseur/média.

Le parapluie enregistre les identifiants des exécutions enfant déclenchées, et le job final `Verify full validation` revérifie les conclusions actuelles des exécutions enfant et ajoute des tableaux des jobs les plus lents pour chaque exécution enfant. Si un workflow enfant est relancé et passe au vert, relancez uniquement le job vérificateur parent pour actualiser le résultat parapluie et le récapitulatif des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour un candidat de release, `ci` uniquement pour l’enfant CI complet normal, `plugin-prerelease` uniquement pour l’enfant de prérelease de Plugin, `release-checks` pour chaque enfant de release, ou un groupe plus étroit : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur le parapluie. Cela maintient bornée la relance d’une boîte de release échouée après une correction ciblée. Pour une seule lane cross-OS échouée, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les commandes cross-OS longues émettent des lignes Heartbeat et les récapitulatifs packaged-upgrade incluent les temps par phase. Les lanes QA de release-check sont consultatives, donc les échecs QA seuls avertissent mais ne bloquent pas le vérificateur release-check.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre la ref sélectionnée une seule fois en une archive `release-package-under-test`, puis transmet cet artefact aux vérifications cross-OS et à l’acceptation du package, ainsi qu’au workflow Docker live/E2E du chemin de release lorsque la couverture soak s’exécute. Cela garde les octets du package cohérents entre les boîtes de release et évite de reconditionner le même candidat dans plusieurs jobs enfant.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent le parapluie plus ancien. Le moniteur parent annule tout workflow enfant qu’il
a déjà déclenché lorsque le parent est annulé, afin qu’une validation main plus récente
ne reste pas derrière une exécution release-check obsolète de deux heures. La validation
des branches/tags de release et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Shards live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de shards nommés via `scripts/test-live-shard.mjs` au lieu d’un job série unique :

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

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de shards agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les shards média live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les jobs média vérifient seulement les binaires avant la configuration. Gardez les suites live adossées à Docker sur des runners Blacksmith normaux : les jobs conteneurisés ne sont pas le bon endroit pour lancer des tests Docker imbriqués.

Les shards modèle/backend live adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les shards modèle live Docker, Gateway partitionné par fournisseur, backend CLI, liaison ACP et harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les shards Docker Gateway portent des plafonds `timeout` explicites au niveau script, inférieurs au délai d’expiration du job de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue rapidement au lieu de consommer tout le budget release-check. Si ces shards reconstruisent indépendamment la cible Docker complète depuis les sources, l’exécution de release est mal configurée et gaspillera du temps réel sur des constructions d’image dupliquées.

## Acceptation du package

Utilisez `Package Acceptance` lorsque la question est « ce package OpenClaw installable fonctionne-t-il comme produit ? ». C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation du package valide une seule archive via le même harnais Docker E2E que les utilisateurs exercent après installation ou mise à jour.

### Jobs

1. `resolve_package` extrait `workflow_ref`, résout un candidat package, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la ref de workflow, la ref du package, la version, le SHA-256 et le profil dans le récapitulatif d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker de digest de package si nécessaire et exécute les lanes Docker sélectionnées sur ce package au lieu de conditionner l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le package et les images partagées une seule fois, puis déploie ces lanes en jobs Docker ciblés parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque l’acceptation du package en a résolu un ; un dispatch Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du package, l’acceptation Docker ou la lane Telegram optionnelle a échoué.

### Sources de candidats

- `source=npm` accepte uniquement `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation de prérelease/stable publiée.
- `source=ref` conditionne une branche, un tag ou un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est atteignable depuis l’historique des branches du dépôt ou depuis un tag de release, installe les dépendances dans un worktree détaché, puis le conditionne avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge une archive `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge une archive `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel mais devrait être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais approuvé qui exécute le test. `package_ref` est le commit source qui est conditionné lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks complets Docker de chemin de release avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture Plugin hors ligne afin que la validation de package publié ne dépende pas de la disponibilité live de ClawHub. La lane Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, le chemin de spécification npm publiée étant conservé pour les dispatchs autonomes.

Pour la politique dédiée de test des mises à jour et des plugins, y compris les commandes locales,
les lanes Docker, les entrées d’acceptation du package, les valeurs par défaut de release et le triage des échecs,
voir [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de publication appellent l’Acceptation des paquets avec `source=artifact`, l’artefact de paquet de publication préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` et `telegram_mode=mock-openai`. Cela conserve la migration de paquet, la mise à jour, l’installation live de Skills ClawHub, le nettoyage des dépendances de plugins obsolètes, la réparation d’installation de plugins configurés, le plugin hors ligne, la mise à jour de plugin et la preuve Telegram sur la même archive de paquet résolue. Définissez `release_package_spec` sur Validation complète de publication ou Vérifications de publication OpenClaw après avoir publié une bêta pour exécuter la même matrice sur le paquet npm livré sans reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque l’Acceptation des paquets a besoin d’un paquet différent du reste de la validation de publication. Les vérifications de publication inter-OS couvrent toujours l’onboarding, l’installateur et le comportement de plateforme propres à chaque OS ; la validation produit des paquets/mises à jour doit commencer par l’Acceptation des paquets. La voie Docker `published-upgrade-survivor` valide une référence de paquet publié par exécution dans le chemin de publication bloquant. Dans l’Acceptation des paquets, l’archive `package-under-test` résolue est toujours la candidate et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de réexécution des voies échouées conservent cette référence. La Validation complète de publication avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin d’étendre la couverture aux quatre dernières versions stables npm, ainsi qu’aux versions limites épinglées de compatibilité des plugins et aux jeux d’essai calqués sur des tickets pour la configuration Feishu, les fichiers d’amorçage/persona préservés, les installations de plugins OpenClaw configurés, les chemins de journaux avec tilde et les racines de dépendances de plugins héritées obsolètes. Les sélections published-upgrade survivor à références multiples sont partitionnées par référence dans des jobs de runner Docker ciblés distincts. Le workflow distinct Migration des mises à jour utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur un nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de CI de Validation complète de publication. Les exécutions agrégées locales peuvent passer des spécifications de paquet exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, comme `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json` et sonde `/healthz`, `/readyz`, ainsi que l’état RPC après le démarrage du Gateway. Les voies Windows pour le paquet et l’installation fraîche vérifient aussi qu’un paquet installé peut importer une surcharge browser-control depuis un chemin Windows absolu brut. Le test de fumée de tour d’agent inter-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritée

L’Acceptation des paquets comporte des fenêtres bornées de compatibilité héritée pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas cet indicateur ;
- `update-channel-switch` peut élaguer les `patchedDependencies` pnpm manquantes du jeu d’essai git factice dérivé de l’archive et peut journaliser l’absence de `update.channel` persisté ;
- les tests de fumée de plugin peuvent lire les emplacements hérités des enregistrements d’installation ou accepter l’absence de persistance des enregistrements d’installation du marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet publié `2026.4.26` peut également avertir au sujet de fichiers d’empreinte de métadonnées de build local qui avaient déjà été livrés. Les paquets ultérieurs doivent respecter les contrats modernes ; les mêmes conditions échouent au lieu de produire un avertissement ou d’être ignorées.

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

Lors du débogage d’une exécution d’acceptation de paquet échouée, commencez par le résumé `resolve_package` pour confirmer la source du paquet, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voies, les durées de phase et les commandes de réexécution. Préférez réexécuter le profil de paquet échoué ou les voies Docker exactes plutôt que de relancer toute la validation complète de publication.

## Test de fumée d’installation

Le workflow distinct `Install Smoke` réutilise le même script de portée via son propre job `preflight`. Il répartit la couverture de test de fumée entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les demandes de tirage touchant les surfaces Docker/paquet, les modifications de paquet/manifeste de plugin intégré ou les surfaces cœur plugin/canal/Gateway/Plugin SDK que les jobs de test de fumée Docker exercent. Les modifications de plugin intégré limitées au code source, les modifications limitées aux tests et les modifications limitées à la documentation ne réservent pas de workers Docker. Le chemin rapide construit une fois l’image du Dockerfile racine, vérifie la CLI, exécute le test de fumée CLI de suppression d’agents en espace de travail partagé, exécute l’E2E de réseau Gateway en conteneur, vérifie un argument de build d’extension intégrée et exécute le profil Docker borné de plugin intégré avec un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve la couverture d’installation de paquet QR et Docker/mise à jour de l’installateur pour les exécutions planifiées nocturnes, les déclenchements manuels, les vérifications de publication appelées par workflow et les demandes de tirage qui touchent réellement les surfaces installateur/paquet/Docker. En mode complet, install-smoke prépare ou réutilise une image de test de fumée du Dockerfile racine GHCR pour le SHA cible, puis exécute l’installation de paquet QR, les tests de fumée Dockerfile racine/Gateway, les tests de fumée installateur/mise à jour et l’E2E Docker rapide de plugin intégré comme jobs distincts afin que le travail d’installateur n’attende pas derrière les tests de fumée de l’image racine.

Les envois vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée modifiée demanderait une couverture complète sur un envoi, le workflow conserve le test de fumée Docker rapide et laisse le test de fumée d’installation complet à la validation nocturne ou de publication.

Le test de fumée lent d’installation globale Bun image-provider est conditionné séparément par `run_bun_global_install_smoke`. Il s’exécute lors de la planification nocturne et depuis le workflow de vérifications de publication, et les déclenchements manuels de `Install Smoke` peuvent l’activer, mais les demandes de tirage et les envois vers `main` ne le font pas. Les tests Docker QR et d’installateur conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, emballe OpenClaw une fois sous forme d’archive npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un runner Node/Git minimal pour les voies installateur/mise à jour/dépendances de plugin ;
- une image fonctionnelle qui installe la même archive dans `/app` pour les voies de fonctionnalité normales.

Les définitions des voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification se trouve dans `scripts/lib/docker-e2e-plan.mjs` et l’exécuteur n’exécute que le plan sélectionné. Le planificateur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres ajustables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre de créneaux du pool principal pour les voies normales.                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre de créneaux du pool de queue sensible aux fournisseurs.                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Plafond de voies en conditions réelles simultanées pour éviter que les fournisseurs ne limitent. |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Plafond de voies d’installation npm simultanées.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Plafond de voies multi-services simultanées.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les rafales de créations par le démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de repli par voie (120 minutes) ; les voies sélectionnées en conditions réelles/de queue utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` affiche le plan du planificateur sans exécuter les voies.                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte des voies séparées par des virgules ; ignore le test de fumée de nettoyage afin que les agents puissent reproduire une seule voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. L’exécution agrégée locale effectue les prévalidations Docker, supprime les conteneurs E2E OpenClaw obsolètes, émet l’état des voies actives, persiste les durées des voies pour un ordre du plus long au plus court et cesse par défaut de planifier de nouvelles voies mutualisées après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quel paquet, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il emballe OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de paquet de l’exécution courante ou télécharge un artefact de paquet depuis `package_artifact_run_id` ; valide l’inventaire de l’archive ; construit et pousse des images E2E Docker GHCR minimalistes/fonctionnelles étiquetées par digest de paquet via le cache de couches Docker de Blacksmith lorsque le plan a besoin de voies avec paquet installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou les images existantes par digest de paquet au lieu de reconstruire. Les extractions d’images Docker sont retentées avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué retente rapidement au lieu de consommer l’essentiel du chemin critique CI.

### Segments du chemin de publication

La couverture Docker de publication exécute des jobs segmentés plus petits avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque segment extraie uniquement le type d’image dont il a besoin et exécute plusieurs voies via le même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les blocs Docker de la version actuelle sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de Plugin/runtime. L’alias de lane `install-e2e` reste l’alias agrégé de relance manuelle pour les deux lanes d’installation de fournisseurs.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de publication le demande, et conserve un bloc autonome `openwebui` uniquement pour les dispatchs propres à OpenWebUI. Les lanes de mise à jour des canaux intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque bloc téléverse `.artifacts/docker-tests/` avec les journaux de lane, les timings, `summary.json`, `failures.json`, les timings de phase, le JSON du planificateur, les tableaux des lanes lentes et les commandes de relance par lane. L’entrée `docker_lanes` du workflow exécute les lanes sélectionnées contre les images préparées au lieu des jobs de blocs, ce qui limite le débogage des lanes en échec à un seul job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une lane sélectionnée est une lane Docker live, le job ciblé construit localement l’image de test live pour cette relance. Les commandes de relance GitHub générées par lane incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une lane en échec puisse réutiliser exactement le package et les images de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement toute la suite Docker du chemin de publication.

## Préversion Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse ; c’est donc un workflow séparé déclenché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les pushs vers `main` et les dispatchs CI manuels autonomes gardent cette suite désactivée. Il répartit les tests des Plugin intégrés entre huit workers d’extension ; ces jobs de shards d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de Plugin lourds en imports ne créent pas de jobs CI supplémentaires. Le chemin de préversion Docker réservé aux publications regroupe les lanes Docker ciblées en petits groupes pour éviter de réserver des dizaines de runners pour des jobs d’une à trois minutes. Le workflow téléverse aussi un artefact informatif `plugin-inspector-advisory` depuis `@openclaw/plugin-inspector` ; les constatations de l’inspecteur servent d’entrée de triage et ne modifient pas la barrière bloquante Plugin Prerelease.

## QA Lab

QA Lab dispose de lanes CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée dans les harnais QA larges et de publication, et non dans un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un dispatch manuel ; il déploie en éventail la lane de parité simulée, la lane Matrix live, ainsi que les lanes Telegram et Discord live sous forme de jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des baux Convex.

Les contrôles de publication exécutent les lanes de transport live Matrix et Telegram avec le fournisseur simulé déterministe et des modèles qualifiés mock (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`), afin que le contrat du canal soit isolé de la latence des modèles live et du démarrage normal du Plugin de fournisseur. Le Gateway de transport live désactive la recherche mémoire, car la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèles live, fournisseurs natifs et fournisseurs Docker.

Matrix utilise `--profile fast` pour les barrières planifiées et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un dispatch manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute aussi les lanes QA Lab critiques pour la publication avant l’approbation de la publication ; sa barrière de parité QA exécute les packs candidat et de référence sous forme de jobs de lane parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/contrôles ciblées au lieu de traiter la parité comme un statut obligatoire.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité de premier passage restreint, et non le balayage complet du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillon scannent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus risquées avec des requêtes de sécurité à haute confiance filtrées sur `security-severity` élevé/critique.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et elle exécute la même matrice de sécurité à haute confiance que le workflow planifié. Android et macOS CodeQL restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, sandbox, cron et référence Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus le runtime du Plugin de canal, Gateway, SDK Plugin, secrets, points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces SSRF du cœur, analyse IP, garde réseau, récupération web et politique SSRF du SDK Plugin                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et barrières d’exécution d’outils d’agent                     |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, du loader, du manifeste, du registre, de l’installation par gestionnaire de packages, du chargement de sources et du contrat de package du SDK Plugin |

### Shards de sécurité propres à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit manuellement l’application Android pour CodeQL sur le plus petit runner Linux Blacksmith accepté par la validation du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit manuellement l’application macOS pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé et téléverse sous `/codeql-critical-security/macos`. Maintenu hors des valeurs par défaut quotidiennes, car le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critiques

`CodeQL Critical Quality` est le shard non sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript non sécurité de sévérité erreur sur des surfaces restreintes à forte valeur sur le plus petit runner Linux Blacksmith. Sa garde de pull request est intentionnellement plus petite que le profil planifié : les PR non brouillon exécutent seulement les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements du code d’exécution des commandes/modèles/outils d’agent et de dispatch des réponses, du code de schéma/migration/E/S de configuration, du code auth/secrets/sandbox/sécurité, du cœur de canal et du runtime du Plugin de canal intégré, du protocole Gateway/méthode serveur, du runtime mémoire/glue SDK, de la livraison MCP/processus/sortante, du catalogue runtime/modèles de fournisseur, des files de diagnostics/livraison de session, du chargeur de Plugin, du contrat SDK Plugin/package, ou du runtime de réponse du SDK Plugin. Les changements de configuration CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

Le dispatch manuel accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils restreints sont des points d’accroche d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code des limites de sécurité de l’authentification, des secrets, du sandbox, de Cron et du Gateway                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, de migration, de normalisation et d’E/S                                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas de protocole Gateway et contrats des méthodes serveur                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal central et du Plugin de canal intégré                                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats d’exécution de commandes, de distribution modèle/fournisseur, de distribution et files d’attente des réponses automatiques, et de runtime du plan de contrôle ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, assistants de supervision de processus et contrats de livraison sortante                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK d’hôte mémoire, façades de runtime mémoire, alias du SDK Plugin mémoire, code de liaison d’activation du runtime mémoire et commandes de diagnostic mémoire                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de file de réponses, files de livraison de session, assistants de liaison/livraison de session sortante, surfaces de paquets d’événements/journaux de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du SDK Plugin, assistants de charge utile/segmentation/runtime des réponses, options de réponse de canal, files de livraison et assistants de liaison session/fil |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues des fournisseurs et registres web/recherche/récupération/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Initialisation de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats de runtime du plan de contrôle des tâches                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime pour la récupération/recherche web centrale, les E/S média, la compréhension des médias, la génération d’images et la génération de médias                                 |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du SDK Plugin                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du SDK Plugin côté paquet publié et assistants de contrat de paquet Plugin                                                                                                              |

La qualité reste séparée de la sécurité afin que les signalements de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL pour Swift, Python et les Plugins intégrés ne doit être réintroduite sous forme de travail de suivi ciblé ou fragmenté qu’après stabilisation du runtime et du signal des profils étroits.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie après un push non-bot sur `main` peut le déclencher, et un déclenchement manuel peut l’exécuter directement. Les invocations par exécution de workflow sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution non ignorée de Docs Agent a été créée au cours de la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits allant du SHA source précédent non ignoré de Docs Agent jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage de documentation.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie après un push non-bot sur `main` peut le déclencher, mais il s’ignore si une autre invocation par exécution de workflow a déjà été exécutée ou est en cours ce jour UTC. Le déclenchement manuel contourne cette barrière d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur la suite complète, permet à Codex d’effectuer uniquement de petites corrections de performance de tests qui préservent la couverture au lieu de refactorisations larges, puis réexécute le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de référence. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot ne soit intégré, la voie rebase le correctif validé, réexécute `pnpm check:changed` et retente le push ; les correctifs périmés en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité sans sudo que l’agent de documentation.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow manuel de mainteneur pour le nettoyage des doublons après intégration. Il utilise par défaut le mode dry-run et ne ferme que les PR explicitement listées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon a soit une issue référencée commune, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barrières de vérification locales et routage des changements

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière de vérification locale est plus stricte sur les limites d’architecture que la portée large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types du cœur de production et des tests du cœur, ainsi que le lint/les garde-fous du cœur ;
- les changements limités aux tests du cœur exécutent uniquement la vérification de types des tests du cœur, ainsi que le lint du cœur ;
- les changements de production des extensions exécutent la vérification de types de production et de test des extensions, ainsi que le lint des extensions ;
- les changements limités aux tests des extensions exécutent la vérification de types des tests des extensions, ainsi que le lint des extensions ;
- les changements du SDK Plugin public ou du contrat Plugin élargissent vers la vérification de types des extensions, car les extensions dépendent de ces contrats du cœur (les balayages Vitest des extensions restent du travail de test explicite) ;
- les incréments de version limités aux métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine ;
- les changements racine/configuration inconnus échouent prudemment vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les correspondances explicites, puis les tests frères et les dépendants du graphe d’imports. La configuration partagée de livraison aux salles de groupe fait partie des correspondances explicites : les changements de la configuration de réponse visible par le groupe, du mode de livraison des réponses source ou du prompt système de l’outil de messages passent par les tests de réponse du cœur ainsi que par les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche suffisamment largement le harnais pour que l’ensemble mappé peu coûteux ne soit pas un proxy fiable.

## Validation Testbox

Crabbox est le wrapper de machine distante appartenant au dépôt pour les preuves Linux des mainteneurs. Utilisez-le depuis la racine du dépôt lorsqu’une vérification est trop large pour une boucle de modification locale, lorsque la parité CI importe, ou lorsque la preuve nécessite des secrets, Docker, des voies de paquets, des machines réutilisables ou des journaux distants. Le backend OpenClaw normal est `blacksmith-testbox` ; la capacité AWS/Hetzner possédée est une solution de secours en cas d’indisponibilité de Blacksmith, de problèmes de quota ou de tests explicitement sur capacité possédée.

Les exécutions Blacksmith adossées à Crabbox préchauffent, réservent, synchronisent, exécutent, rapportent et nettoient des Testboxes à usage unique. La vérification d’intégrité de synchronisation intégrée échoue rapidement lorsque des fichiers racine requis tels que `pnpm-lock.yaml` disparaissent ou lorsque `git status --short` montre au moins 200 suppressions suivies. Pour les PR avec suppressions massives intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox met également fin à une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation plus de cinq minutes sans sortie après synchronisation. Définissez `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver ce garde-fou, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux inhabituellement volumineux.

Avant une première exécution, vérifiez le wrapper depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Le wrapper du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas `blacksmith-testbox`. Passez explicitement le fournisseur même si `.crabbox.yaml` contient des valeurs par défaut de cloud possédé.

Barrière des changements :

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

Lisez le résumé JSON final. Les champs utiles sont `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Les exécutions Crabbox à usage unique adossées à Blacksmith doivent arrêter automatiquement la Testbox ; si une exécution est interrompue ou que le nettoyage est incertain, inspectez les machines actives et n’arrêtez que celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Utilisez la réutilisation uniquement lorsque vous avez volontairement besoin de plusieurs commandes sur la même machine hydratée :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox est la couche défaillante mais que Blacksmith lui-même fonctionne, utilisez Blacksmith directement uniquement pour les diagnostics tels que `list`, `status` et le nettoyage. Corrigez le chemin Crabbox avant de considérer une exécution Blacksmith directe comme preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent mais que les nouveaux préchauffages restent `queued` sans IP ni URL d’exécution Actions après quelques minutes, traitez cela comme une pression côté fournisseur Blacksmith, file d’attente, facturation ou limite d’organisation. Arrêtez les ids en file que vous avez créés, évitez de démarrer d’autres Testboxes et déplacez la preuve vers le chemin de capacité Crabbox possédée ci-dessous pendant qu’une personne vérifie le tableau de bord Blacksmith, la facturation et les limites d’organisation.

Escaladez vers la capacité Crabbox possédée uniquement lorsque Blacksmith est indisponible, limité par quota, dépourvu de l’environnement nécessaire ou lorsque la capacité possédée est explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

En cas de pression sur AWS, évitez `class=beast` sauf si la tâche nécessite vraiment un CPU de classe 48xlarge. Une requête `beast` commence à 192 vCPU et constitue le moyen le plus simple de dépasser le quota régional EC2 Spot ou On-Demand Standard. Le fichier `.crabbox.yaml` propre au dépôt utilise par défaut `standard`, plusieurs régions de capacité et `capacity.hints: true`, afin que les baux AWS négociés affichent la région/le marché sélectionnés, la pression sur les quotas, le repli Spot et les avertissements de classe sous forte pression. Utilisez `fast` pour les vérifications larges plus lourdes, `large` uniquement lorsque standard/fast ne suffisent pas, et `beast` seulement pour les voies exceptionnelles fortement dépendantes du CPU, comme les matrices Docker de suite complète ou de tous les plugins, la validation explicite de release/bloquant, ou le profilage de performances à grand nombre de cœurs. N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, les travaux limités aux docs, le lint/typecheck ordinaire, les petites reproductions E2E, ni le triage de panne Blacksmith. Utilisez `--market on-demand` pour le diagnostic de capacité afin que les variations du marché Spot ne soient pas mêlées au signal.

`.crabbox.yaml` définit les valeurs par défaut de fournisseur, de synchronisation et d’hydratation GitHub Actions pour les voies owned-cloud. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et les magasins d’objets locaux du mainteneur, et il exclut les artefacts locaux de runtime/build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` définit le checkout, la configuration Node/pnpm, la récupération de `origin/main` et la transmission d’environnement non secret pour les commandes owned-cloud `crabbox run --id <cbx_id>`.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

---
read_when:
    - Vous devez comprendre pourquoi une tâche CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions en échec
    - Vous coordonnez une exécution ou une réexécution de validation de version
    - Vous modifiez l’acheminement de ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches CI, contrôles de périmètre, regroupements de publication et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-05-02T20:41:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

La CI d’OpenClaw s’exécute à chaque push vers `main` et sur chaque pull request. Le job `preflight` classe le diff et désactive les lanes coûteuses lorsque seules des zones sans rapport ont changé. Les exécutions manuelles `workflow_dispatch` contournent volontairement le périmétrage intelligent et déploient tout le graphe pour les versions candidates et la validation large. Les lanes Android restent optionnelles via `include_android`. La couverture des Plugin réservée aux versions vit dans le workflow séparé [`Plugin en préversion`](#plugin-prerelease) et ne s’exécute que depuis [`Validation complète de version`](#full-release-validation) ou un dispatch manuel explicite.

## Vue d’ensemble du pipeline

| Job                              | Objectif                                                                                                  | Quand il s’exécute                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Détecter les changements limités à la documentation, les périmètres modifiés, les extensions modifiées et construire le manifeste de CI | Toujours sur les pushs et PR non brouillons |
| `security-scm-fast`              | Détection de clés privées et audit de workflow via `zizmor`                                               | Toujours sur les pushs et PR non brouillons |
| `security-dependency-audit`      | Audit du lockfile de production sans dépendances par rapport aux avis npm                                 | Toujours sur les pushs et PR non brouillons |
| `security-fast`                  | Agrégat requis pour les jobs de sécurité rapides                                                          | Toujours sur les pushs et PR non brouillons |
| `check-dependencies`             | Passe Knip de production limitée aux dépendances, plus garde de la liste d’autorisation des fichiers inutilisés | Changements liés à Node            |
| `build-artifacts`                | Construire `dist/`, l’interface utilisateur de contrôle, les vérifications d’artefacts construits et les artefacts aval réutilisables | Changements liés à Node            |
| `checks-fast-core`               | Lanes de correction Linux rapides, comme les vérifications groupées/de contrat Plugin/de protocole        | Changements liés à Node            |
| `checks-fast-contracts-channels` | Vérifications de contrat de canal fragmentées avec un résultat de vérification agrégé stable              | Changements liés à Node            |
| `checks-node-core-test`          | Shards de tests Node cœur, hors lanes de canal, groupées, de contrat et d’extension                       | Changements liés à Node            |
| `check`                          | Équivalent fragmenté de la porte locale principale : types de production, lint, gardes, types de test et smoke strict | Changements liés à Node            |
| `check-additional`               | Shards d’architecture, de limites, de gardes de surface d’extension, de limite de package et de gateway-watch | Changements liés à Node            |
| `build-smoke`                    | Tests smoke de la CLI construite et smoke de mémoire au démarrage                                         | Changements liés à Node            |
| `checks`                         | Vérificateur pour les tests de canal sur artefacts construits                                             | Changements liés à Node            |
| `checks-node-compat-node22`      | Lane de build et de smoke de compatibilité Node 22                                                        | Dispatch manuel de CI pour les versions |
| `check-docs`                     | Formatage, lint et vérifications de liens cassés de la documentation                                      | Documentation modifiée             |
| `skills-python`                  | Ruff + pytest pour les Skills adossées à Python                                                           | Changements liés aux Skills Python |
| `checks-windows`                 | Tests propres à Windows pour les processus/chemins, plus régressions partagées de spécificateurs d’import runtime | Changements liés à Windows         |
| `macos-node`                     | Lane de tests TypeScript macOS utilisant les artefacts construits partagés                                | Changements liés à macOS           |
| `macos-swift`                    | Lint Swift, build et tests pour l’app macOS                                                               | Changements liés à macOS           |
| `android`                        | Tests unitaires Android pour les deux variantes, plus un build APK de débogage                            | Changements liés à Android         |
| `test-performance-agent`         | Optimisation quotidienne des tests lents Codex après activité fiable                                      | Succès de la CI principale ou dispatch manuel |
| `openclaw-performance`           | Rapports de performance runtime Kova quotidiens/à la demande avec lanes fournisseur simulé, profil profond et GPT 5.4 en direct | Dispatch planifié et manuel        |

## Ordre d’échec rapide

1. `preflight` décide quelles lanes existent réellement. Les logiques `docs-scope` et `changed-scope` sont des étapes dans ce job, pas des jobs autonomes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` et `skills-python` échouent rapidement sans attendre les jobs plus lourds d’artefacts et de matrice de plateformes.
3. `build-artifacts` chevauche les lanes Linux rapides afin que les consommateurs aval puissent démarrer dès que le build partagé est prêt.
4. Les lanes de plateforme et de runtime plus lourdes se déploient ensuite : `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` et `android`.

GitHub peut marquer les jobs remplacés comme `cancelled` lorsqu’un nouveau push arrive sur la même PR ou référence `main`. Traitez cela comme du bruit de CI, sauf si l’exécution la plus récente pour la même référence échoue aussi. Les vérifications agrégées de shards utilisent `!cancelled() && always()` afin de toujours signaler les échecs normaux de shards, sans toutefois se mettre en file d’attente après que tout le workflow a déjà été remplacé. La clé de concurrence automatique de CI est versionnée (`CI-v7-*`), afin qu’un zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions principales. Les exécutions manuelles de suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours.

## Périmètre et routage

La logique de périmètre vit dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le dispatch manuel ignore la détection du périmètre modifié et fait agir le manifeste preflight comme si chaque zone périmétrée avait changé.

- **Les modifications de workflow CI** valident le graphe CI Node plus le lint de workflow, mais ne forcent pas à elles seules les builds natifs Windows, Android ou macOS ; ces lanes de plateforme restent limitées aux changements de source de plateforme.
- **Les modifications limitées au routage CI, certaines modifications peu coûteuses de fixtures de tests cœur et les modifications étroites d’aides/de routage de tests de contrat Plugin** utilisent un chemin de manifeste rapide limité à Node : `preflight`, sécurité et une seule tâche `checks-fast-core`. Ce chemin saute les artefacts de build, la compatibilité Node 22, les contrats de canal, les shards cœur complets, les shards de Plugin groupés et les matrices de gardes additionnelles lorsque le changement est limité aux surfaces de routage ou d’aide que la tâche rapide exerce directement.
- **Les vérifications Node Windows** sont limitées aux wrappers propres à Windows pour les processus/chemins, aux aides d’exécution npm/pnpm/UI, à la configuration du gestionnaire de packages et aux surfaces de workflow CI qui exécutent cette lane ; les changements de source, de Plugin, de smoke d’installation et limités aux tests sans rapport restent sur les lanes Node Linux.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque job reste petit sans sur-réserver de runners : les contrats de canal s’exécutent en trois shards pondérés, les petites lanes unitaires cœur sont appariées, la réponse automatique s’exécute avec quatre workers équilibrés (avec le sous-arbre de réponse divisé en shards agent-runner, dispatch et commandes/routage d’état), et les configurations agentiques Gateway/Plugin sont réparties dans les jobs Node agentiques existants limités à la source au lieu d’attendre les artefacts construits. Les tests larges de navigateur, QA, média et Plugin divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout Plugin partagé. Les shards à motifs d’inclusion enregistrent les entrées de temps avec le nom de shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration entière d’un shard filtré. `check-additional` garde ensemble le travail de compilation/canari de limite de package et sépare l’architecture de topologie runtime de la couverture gateway watch ; le shard de garde de limite exécute ses petits gardes indépendants en parallèle dans un seul job. Gateway watch, les tests de canal et le shard cœur de limite de support s’exécutent en parallèle dans `build-artifacts` après que `dist/` et `dist-runtime/` sont déjà construits.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK de débogage Play. La variante tierce n’a pas de source set ni de manifeste séparé ; sa lane de tests unitaires compile quand même la variante avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant un job de packaging d’APK de débogage dupliqué à chaque push pertinent pour Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production limitée aux dépendances, épinglée à la dernière version de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les résultats de fichiers de production inutilisés de Knip à `scripts/deadcode-unused-files.allowlist.mjs`. Le garde de fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non examiné ou laisse une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de Plugin dynamiques, générées, de build, de tests en direct et de ponts de package que Knip ne peut pas résoudre statiquement.

## Transfert d’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` est le pont côté cible depuis l’activité du dépôt OpenClaw vers ClawSweeper. Il ne checkout pas et n’exécute pas de code de pull request non fiable. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis dispatche des charges utiles compactes `repository_dispatch` vers `openclaw/clawsweeper`.

Le workflow comporte quatre lanes :

- `clawsweeper_item` pour les demandes exactes de revue d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issue ;
- `clawsweeper_commit_review` pour les demandes de revue au niveau des commits sur les pushs vers `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut inspecter.

La lane `github_activity` transfère uniquement des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro d’élément, URL, titre, état et courts extraits pour les commentaires ou revues lorsqu’ils sont présents. Elle évite volontairement de transférer le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé vers le hook Gateway OpenClaw pour l’agent ClawSweeper.

L’activité générale relève de l’observation, pas d’une livraison par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne devrait publier dans `#clawsweeper` que lorsque l’événement est surprenant, actionnable, risqué ou utile opérationnellement. Les ouvertures, modifications, activité de bots, bruit de Webhook dupliqué et trafic normal de revues devraient produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de revue, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ce sont des entrées pour la synthèse et le triage, pas des instructions pour le workflow ou le runtime de l’agent.

## Dispatchs manuels

Les dispatchs CI manuels exécutent le même graphe de tâches que la CI normale, mais forcent l’activation de chaque lane à portée non Android : fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke test de build, vérifications de docs, compétences Python, Windows, macOS et i18n de Control UI. Les dispatchs CI manuels autonomes exécutent uniquement Android avec `include_android=true` ; l’ombrelle de version complète active Android en passant `include_android=true`. Les vérifications statiques de préversion des plugins, le fragment réservé à la version `agentic-plugins`, le balayage complet par lots des extensions et les lanes Docker de préversion des plugins sont exclus de la CI. La suite Docker de préversion s’exécute uniquement quand `Full Release Validation` dispatche le workflow `Plugin Prerelease` séparé avec la porte de validation de version activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de version candidate ne soit pas annulée par une autre exécution de push ou de PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant approuvé d’exécuter ce graphe sur une branche, une étiquette ou un SHA de commit complet tout en utilisant le fichier de workflow depuis la référence de dispatch sélectionnée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Exécuteurs

| Exécuteur                         | Tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                    | `preflight`, tâches de sécurité rapides et agrégats (`security-scm-fast`, `security-dependency-audit`, `security-fast`), vérifications rapides de protocole/contrat/plugins groupés, vérifications de contrats de canaux fragmentées, fragments `check` sauf le lint, fragments et agrégats `check-additional`, vérificateurs d’agrégats de tests Node, vérifications de docs, compétences Python, workflow-sanity, labeler, auto-response ; le prévol install-smoke utilise aussi Ubuntu hébergé par GitHub afin que la matrice Blacksmith puisse se mettre en file plus tôt |
| `blacksmith-4vcpu-ubuntu-2404`    | `CodeQL Critical Quality`, fragments d’extensions moins lourds, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` et `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`    | `build-artifacts`, build-smoke, fragments de tests Linux Node, fragments de tests de plugins groupés, `android`                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`   | `check-lint` (suffisamment sensible au CPU pour que 8 vCPU coûtent plus qu’ils ne faisaient gagner) ; builds Docker install-smoke (le temps de file d’attente 32 vCPU coûtait plus qu’il ne faisait gagner)                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025`  | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`   | `macos-node` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest`  | `macos-swift` sur `openclaw/openclaw` ; les forks se rabattent sur `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

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

`OpenClaw Performance` est le workflow de performance produit/runtime. Il s’exécute chaque jour sur `main` et peut être dispatché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Le workflow installe OCM depuis une version épinglée et Kova depuis l’entrée `kova_ref` épinglée, puis exécute trois lanes :

- `mock-provider` : scénarios de diagnostic Kova contre un runtime de build local avec authentification factice déterministe compatible OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace pour les points chauds de démarrage, de Gateway et de tour d’agent.
- `live-gpt54` : un vrai tour d’agent OpenAI `openai/gpt-5.4`, ignoré quand `OPENAI_API_KEY` n’est pas disponible.

La lane mock-provider exécute aussi des sondes source natives OpenClaw après le passage Kova : mesure du temps de démarrage et de la mémoire du Gateway dans les cas de démarrage par défaut, avec hook et avec 50 plugins ; boucles répétées de hello `channel-chat-baseline` mock-OpenAI ; et commandes de démarrage CLI contre le Gateway démarré. Le résumé Markdown des sondes source se trouve dans `source/index.md` dans le bundle de rapport, avec le JSON brut à côté.

Chaque lane téléverse des artefacts GitHub. Quand `CLAWGRIT_REPORTS_TOKEN` est configuré, le workflow commite aussi `report.json`, `report.md`, les bundles, `index.md` et les artefacts de sondes source dans `openclaw/clawgrit-reports` sous `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Le pointeur de branche courant est écrit sous `openclaw-performance/<ref>/latest-<lane>.json`.

## Validation complète de la version

`Full Release Validation` est le workflow ombrelle manuel pour « tout exécuter avant la version ». Il accepte une branche, une étiquette ou un SHA de commit complet, dispatche le workflow manuel `CI` avec cette cible, dispatche `Plugin Prerelease` pour les preuves plugin/package/statique/Docker réservées à la version, et dispatche `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation de package, les suites de chemin de version Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les lanes Telegram. Avec `rerun_group=all` et `release_profile=full`, il exécute aussi `NPM Telegram Beta E2E` contre l’artefact `release-package-under-test` provenant des vérifications de version. Après publication, passez `npm_telegram_package_spec` pour réexécuter la même lane de package Telegram contre le package npm publié.

Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour la
matrice d’étapes, les noms exacts des tâches de workflow, les différences de profils, les artefacts et les
poignées de réexécution ciblées.

`OpenClaw Release Publish` est le workflow manuel de version mutable. Dispatchez-le
depuis `release/YYYY.M.D` ou `main` après l’existence de l’étiquette de version et après la
réussite du prévol npm OpenClaw. Il vérifie `pnpm plugins:sync:check`,
dispatche `Plugin NPM Release` pour tous les packages de plugins publiables, dispatche
`Plugin ClawHub Release` pour le même SHA de version, puis seulement ensuite dispatche
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
dispatche `Full Release Validation` depuis cette référence épinglée, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire quand l’exécution se termine. Le vérificateur ombrelle échoue aussi si un workflow enfant s’est exécuté à un
SHA différent.

`release_profile` contrôle l’étendue live/fournisseurs transmise aux vérifications de version. Les
workflows de version manuels utilisent `stable` par défaut ; utilisez `full` uniquement quand vous
voulez intentionnellement la large matrice consultative fournisseurs/médias.

- `minimum` conserve les lanes OpenAI/cœur critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs/backends.
- `full` exécute la large matrice consultative fournisseurs/médias.

L’ombrelle enregistre les ids des exécutions enfants dispatchées, et la tâche finale `Verify full validation` revérifie les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est réexécuté et passe au vert, réexécutez uniquement la tâche de vérification parente pour actualiser le résultat ombrelle et le résumé des temps.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une version candidate, `ci` pour seulement l’enfant CI complet normal, `plugin-prerelease` pour seulement l’enfant de préversion du Plugin, `release-checks` pour chaque enfant de release, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` sur l’ombrelle. Cela limite la relance d’une boîte de release échouée après une correction ciblée.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact au workflow Docker du chemin de release live/E2E et au fragment d’acceptation du paquet. Cela garde les octets du paquet cohérents entre les boîtes de release et évite de réempaqueter le même candidat dans plusieurs tâches enfants.

Les exécutions `Full Release Validation` dupliquées pour `ref=main` et `rerun_group=all`
remplacent l’ancienne ombrelle. Le moniteur parent annule tout workflow enfant qu’il
a déjà lancé lorsque le parent est annulé, de sorte que la validation main plus récente
ne reste pas bloquée derrière une exécution obsolète de release-check de deux heures. La validation
des branches/tags de release et les groupes de relance ciblés conservent `cancel-in-progress: false`.

## Fragments live et E2E

L’enfant live/E2E de release conserve une large couverture native `pnpm test:live`, mais l’exécute sous forme de fragments nommés via `scripts/test-live-shard.mjs` au lieu d’une seule tâche sérielle :

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
- fragments audio/vidéo multimédias séparés et fragments musicaux filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en rendant les échecs lents de fournisseurs live plus faciles à relancer et à diagnostiquer. Les noms de fragments agrégés `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les relances manuelles ponctuelles.

Les fragments multimédias live natifs s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construit par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches multimédias vérifient seulement les binaires avant la configuration. Conservez les suites live adossées à Docker sur des exécuteurs Blacksmith normaux — les tâches conteneurisées ne sont pas l’endroit approprié pour lancer des tests Docker imbriqués.

Les fragments live de modèles/backends adossés à Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>` par commit sélectionné. Le workflow de release live construit et pousse cette image une seule fois, puis les fragments du modèle live Docker, du Gateway fragmenté par fournisseur, du backend CLI, du bind ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les fragments Docker du Gateway portent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche de workflow, afin qu’un conteneur bloqué ou un chemin de nettoyage échoue vite au lieu de consommer tout le budget de release-check. Si ces fragments reconstruisent indépendamment la cible Docker source complète, l’exécution de release est mal configurée et gaspillera du temps d’horloge sur des constructions d’image dupliquées.

## Acceptation des paquets

Utilisez `Package Acceptance` lorsque la question est « ce paquet OpenClaw installable fonctionne-t-il comme un produit ? » C’est différent de la CI normale : la CI normale valide l’arborescence source, tandis que l’acceptation des paquets valide une seule archive via le même harnais Docker E2E que les utilisateurs exercent après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un candidat de paquet, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, et imprime la source, la référence de workflow, la référence de paquet, la version, le SHA-256 et le profil dans le résumé d’étape GitHub.
2. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec `ref=workflow_ref` et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare les images Docker à digest de paquet si nécessaire, et exécute les voies Docker sélectionnées contre ce paquet au lieu d’empaqueter l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare le paquet et les images partagées une seule fois, puis déploie ces voies en tâches Docker ciblées parallèles avec des artefacts uniques.
3. `package_telegram` appelle éventuellement `NPM Telegram Beta E2E`. Il s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` quand l’acceptation des paquets en a résolu un ; une exécution Telegram autonome peut toujours installer une spécification npm publiée.
4. `summary` fait échouer le workflow si la résolution du paquet, l’acceptation Docker ou la voie Telegram optionnelle a échoué.

### Sources candidates

- `source=npm` accepte seulement `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, ou une version de release OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cela pour l’acceptation des préversions/stables publiées.
- `source=ref` empaquette une branche, un tag ou un SHA de commit complet `package_ref` de confiance. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique des branches du dépôt ou un tag de release, installe les dépendances dans une arborescence de travail détachée, puis l’empaquette avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge un `.tgz` HTTPS ; `package_sha256` est requis.
- `source=artifact` télécharge un `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est optionnel mais doit être fourni pour les artefacts partagés en externe.

Gardez `workflow_ref` et `package_ref` séparés. `workflow_ref` est le code de workflow/harnais de confiance qui exécute le test. `package_ref` est le commit source qui est empaqueté lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits source de confiance sans exécuter l’ancienne logique de workflow.

### Profils de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragments complets du chemin de release Docker avec OpenWebUI
- `custom` — `docker_lanes` exactes ; requis lorsque `suite_profile=custom`

Le profil `package` utilise une couverture de Plugins hors ligne afin que la validation de paquet publié ne dépende pas de la disponibilité live de ClawHub. La voie Telegram optionnelle réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, avec le chemin de spécification npm publiée conservé pour les exécutions autonomes.

Pour la politique dédiée aux mises à jour et aux tests de Plugins, y compris les commandes locales,
les voies Docker, les entrées d’acceptation des paquets, les valeurs par défaut de release et le triage des échecs,
consultez [Tests des mises à jour et des Plugins](/fr/help/testing-updates-plugins).

Les vérifications de release appellent l’acceptation des paquets avec `source=artifact`, l’artefact de paquet de release préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` et `telegram_mode=mock-openai`. Cela conserve les preuves de migration de paquet, de mise à jour, de nettoyage des dépendances de Plugins obsolètes, de réparation d’installation de Plugins configurés, de Plugins hors ligne, de mise à jour de Plugins et de Telegram sur la même archive de paquet résolue. Définissez `package_acceptance_package_spec` sur Full Release Validation ou OpenClaw Release Checks pour exécuter cette même matrice contre un paquet npm livré au lieu de l’artefact construit depuis le SHA. Les vérifications de release cross-OS couvrent toujours l’intégration initiale propre à l’OS, l’installateur et le comportement de plateforme ; la validation produit de paquet/mise à jour doit commencer par l’acceptation des paquets. La voie Docker `published-upgrade-survivor` valide une référence de paquet publié par exécution. Dans l’acceptation des paquets, l’archive `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de relance de voies échouées préservent cette référence. Définissez `published_upgrade_survivor_baselines=all-since-2026.4.23` pour étendre la CI Full Release à chaque release npm stable de `2026.4.23` à `latest` ; `release-history` reste disponible pour un échantillonnage manuel plus large avec l’ancrage antérieur plus ancien. Définissez `published_upgrade_survivor_scenarios=reported-issues` pour étendre les mêmes références à des fixtures inspirées de tickets pour la configuration Feishu, les fichiers bootstrap/persona préservés, les installations configurées de Plugins OpenClaw, les chemins de journaux avec tilde et les racines de dépendances de Plugins héritées obsolètes. Le workflow distinct `Update Migration` utilise la voie Docker `update-migration` avec `all-since-2026.4.23` et `plugin-deps-cleanup` lorsque la question porte sur un nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent passer des spécifications de paquet exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, garder une seule voie avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` telle que `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. La voie publiée configure la référence avec une recette de commande `openclaw config set` intégrée, enregistre les étapes de recette dans `summary.json`, et sonde `/healthz`, `/readyz`, plus l’état RPC après le démarrage du Gateway. Les voies fraîches de paquet Windows et d’installateur vérifient aussi qu’un paquet installé peut importer une substitution browser-control depuis un chemin Windows absolu brut. Le smoke agent-turn cross-OS OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.4`, afin que la preuve d’installation et de Gateway reste sur un modèle de test GPT-5 tout en évitant les valeurs par défaut GPT-4.x.

### Fenêtres de compatibilité héritées

L’acceptation des paquets dispose de fenêtres bornées de compatibilité héritée pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas ce flag ;
- `update-channel-switch` peut élaguer les `pnpm.patchedDependencies` manquantes depuis la fixture git factice dérivée de l’archive et peut journaliser l’absence de `update.channel` persisté ;
- les smokes de Plugins peuvent lire les emplacements d’enregistrements d’installation hérités ou accepter l’absence de persistance d’enregistrement d’installation de marketplace ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet `2026.4.26` publié peut aussi avertir pour les fichiers d’empreinte de métadonnées de build local qui avaient déjà été livrés. Les paquets ultérieurs doivent satisfaire les contrats modernes ; les mêmes conditions échouent au lieu d’avertir ou d’être ignorées.

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

Lors du débogage d’une exécution échouée d’acceptation de package, commencez par le résumé `resolve_package` pour confirmer la source du package, la version et le SHA-256. Inspectez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux de voies, les timings de phase et les commandes de réexécution. Préférez réexécuter le profil de package échoué ou les voies Docker exactes plutôt que de relancer la validation complète de version.

## Fumée d’installation

Le workflow `Install Smoke` distinct réutilise le même script de portée via son propre job `preflight`. Il divise la couverture de fumée entre `run_fast_install_smoke` et `run_full_install_smoke`.

- **Chemin rapide** s’exécute pour les pull requests touchant les surfaces Docker/package, les changements de package/manifeste de Plugin intégré, ou les surfaces de Plugin/canal/Gateway/SDK Plugin du cœur que les jobs de fumée Docker exercent. Les changements de Plugin intégré uniquement source, les modifications uniquement de tests et les modifications uniquement de documentation ne réservent pas de workers Docker. Le chemin rapide construit l’image Dockerfile racine une fois, vérifie la CLI, exécute la fumée CLI de suppression des agents avec espace de travail partagé, exécute l’e2e Gateway-réseau du conteneur, vérifie un argument de build d’extension intégrée et exécute le profil Docker borné de Plugin intégré sous un délai d’expiration agrégé de commande de 240 secondes (chaque exécution Docker de scénario étant plafonnée séparément).
- **Chemin complet** conserve l’installation de package QR et la couverture Docker/update de l’installateur pour les exécutions planifiées nocturnes, les dispatches manuels, les vérifications de version par workflow-call et les pull requests qui touchent réellement les surfaces installateur/package/Docker. En mode complet, install-smoke prépare ou réutilise une image de fumée GHCR Dockerfile racine pour le SHA cible, puis exécute l’installation de package QR, les fumées Dockerfile racine/Gateway, les fumées installateur/update et l’E2E Docker rapide de Plugin intégré comme jobs séparés afin que le travail d’installation n’attende pas derrière les fumées de l’image racine.

Les poussées vers `main` (y compris les commits de fusion) ne forcent pas le chemin complet ; lorsque la logique de portée des changements demanderait une couverture complète sur une poussée, le workflow conserve la fumée Docker rapide et laisse la fumée d’installation complète à la validation nocturne ou de version.

La fumée lente Bun d’installation globale du fournisseur d’images est contrôlée séparément par `run_bun_global_install_smoke`. Elle s’exécute selon le calendrier nocturne et depuis le workflow de vérifications de version, et les dispatches manuels `Install Smoke` peuvent l’activer, mais les pull requests et les poussées vers `main` ne le font pas. Les tests Docker QR et installateur conservent leurs propres Dockerfiles centrés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test live partagée, empaquette OpenClaw une fois sous forme de tarball npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git minimal pour les voies installateur/update/dépendance de Plugin ;
- une image fonctionnelle qui installe le même tarball dans `/app` pour les voies de fonctionnalité normale.

Les définitions de voies Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique du planificateur se trouve dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur n’exécute que le plan sélectionné. L’ordonnanceur sélectionne l’image par voie avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les voies avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Par défaut | Objectif                                                                                      |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Nombre d’emplacements du pool principal pour les voies normales.                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Nombre d’emplacements du pool de fin sensible aux fournisseurs.                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Limite de voies live concurrentes afin que les fournisseurs ne limitent pas le débit.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10         | Limite de voies d’installation npm concurrentes.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Limite de voies multi-services concurrentes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Décalage entre les démarrages de voies pour éviter les tempêtes de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Délai d’expiration de secours par voie (120 minutes) ; certaines voies live/de fin utilisent des plafonds plus stricts. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini | `1` imprime le plan de l’ordonnanceur sans exécuter les voies.                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini | Liste exacte de voies séparées par des virgules ; ignore la fumée de nettoyage afin que les agents puissent reproduire une voie échouée. |

Une voie plus lourde que son plafond effectif peut tout de même démarrer depuis un pool vide, puis s’exécute seule jusqu’à libérer de la capacité. Les prévols agrégés locaux vérifient Docker, suppriment les conteneurs E2E OpenClaw obsolètes, émettent l’état des voies actives, persistent les timings de voies pour l’ordre du plus long au plus court, et cessent par défaut de planifier de nouvelles voies mises en pool après le premier échec.

### Workflow live/E2E réutilisable

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quels package, type d’image, image live, voie et couverture d’identifiants sont requis. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il empaquette OpenClaw via `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l’exécution actuelle ou télécharge un artefact de package depuis `package_artifact_run_id` ; valide l’inventaire du tarball ; construit et pousse des images E2E Docker GHCR minimales/fonctionnelles taguées par digest de package via le cache de couches Docker de Blacksmith lorsque le plan nécessite des voies avec package installé ; et réutilise les entrées `docker_e2e_bare_image`/`docker_e2e_functional_image` fournies ou des images existantes par digest de package au lieu de reconstruire. Les extractions d’images Docker sont réessayées avec un délai d’expiration borné de 180 secondes par tentative afin qu’un flux de registre/cache bloqué réessaie rapidement au lieu de consommer la majeure partie du chemin critique CI.

### Fragments du chemin de version

La couverture Docker de version exécute de plus petits jobs fragmentés avec `OPENCLAW_SKIP_DOCKER_BUILD=1` afin que chaque fragment n’extraie que le type d’image dont il a besoin et exécute plusieurs voies via le même ordonnanceur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Les fragments Docker de version actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, et `plugins-runtime-install-a` à `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés Plugin/runtime. L’alias de voie `install-e2e` reste l’alias agrégé de réexécution manuelle pour les deux voies d’installation de fournisseur.

OpenWebUI est intégré à `plugins-runtime-services` lorsque la couverture complète du chemin de version le demande, et conserve un fragment autonome `openwebui` uniquement pour les dispatches OpenWebUI seuls. Les voies de mise à jour de canaux intégrés réessaient une fois en cas d’échecs réseau npm transitoires.

Chaque fragment téléverse `.artifacts/docker-tests/` avec les journaux de voies, les timings, `summary.json`, `failures.json`, les timings de phase, le JSON du plan d’ordonnanceur, les tableaux de voies lentes et les commandes de réexécution par voie. L’entrée `docker_lanes` du workflow exécute les voies sélectionnées contre les images préparées au lieu des jobs de fragments, ce qui garde le débogage de voie échouée limité à un job Docker ciblé et prépare, télécharge ou réutilise l’artefact de package pour cette exécution ; si une voie sélectionnée est une voie Docker live, le job ciblé construit localement l’image de test live pour cette réexécution. Les commandes GitHub générées de réexécution par voie incluent `package_artifact_run_id`, `package_artifact_name` et les entrées d’images préparées lorsque ces valeurs existent, afin qu’une voie échouée puisse réutiliser le package et les images exacts de l’exécution échouée.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de version.

## Préversion de Plugin

`Plugin Prerelease` est une couverture produit/package plus coûteuse, c’est donc un workflow séparé dispatché par `Full Release Validation` ou par un opérateur explicite. Les pull requests normales, les poussées vers `main` et les dispatches CI manuels autonomes gardent cette suite désactivée. Il équilibre les tests de Plugins intégrés sur huit workers d’extension ; ces jobs de fragments d’extension exécutent jusqu’à deux groupes de configuration de Plugin à la fois avec un worker Vitest par groupe et un tas Node plus grand afin que les lots de Plugins à importations lourdes ne créent pas de jobs CI supplémentaires. Le chemin de préversion Docker réservé aux versions groupe des voies Docker ciblées en petits groupes pour éviter de réserver des dizaines d’exécuteurs pour des jobs d’une à trois minutes.

## Laboratoire QA

QA Lab dispose de voies CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée sous les harnais QA et de version larges, et non un workflow PR autonome. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation large.

- Le workflow `QA-Lab - All Lanes` s’exécute chaque nuit sur `main` et lors d’un dispatch manuel ; il déploie en éventail la voie de parité simulée, la voie Matrix live et les voies Telegram et Discord live comme jobs parallèles. Les jobs live utilisent l’environnement `qa-live-shared`, et Telegram/Discord utilisent des leases Convex.

Les vérifications de version exécutent les voies de transport live Matrix et Telegram avec le fournisseur simulé déterministe et les modèles qualifiés pour simulation (`mock-openai/gpt-5.5` et `mock-openai/gpt-5.5-alt`) afin que le contrat de canal soit isolé de la latence des modèles live et du démarrage normal des Plugins fournisseurs. Le Gateway de transport live désactive la recherche mémoire parce que la parité QA couvre séparément le comportement mémoire ; la connectivité fournisseur est couverte par les suites séparées de modèle live, fournisseur natif et fournisseur Docker.

Matrix utilise `--profile fast` pour les portes planifiées et de version, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée manuelle du workflow restent `all` ; un dispatch manuel `matrix_profile=all` fragmente toujours la couverture Matrix complète en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la version avant l’approbation de version ; sa porte de parité QA exécute les packs candidat et de référence comme jobs de voies parallèles, puis télécharge les deux artefacts dans un petit job de rapport pour la comparaison finale de parité.

Pour les PR normales, suivez les preuves CI/vérifications à portée limitée au lieu de traiter la parité comme un statut requis.

## CodeQL

Le workflow `CodeQL` est intentionnellement un scanner de sécurité étroit de premier passage, et non une analyse complète du dépôt. Les exécutions quotidiennes, manuelles et de garde des pull requests non brouillon analysent le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript les plus à risque, avec des requêtes de sécurité à haute confiance filtrées sur les `security-severity` élevées/critiques.

La garde des pull requests reste légère : elle ne démarre que pour les changements sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` ou `src`, et exécute la même matrice de sécurité à haute confiance que le workflow planifié. Les CodeQL Android et macOS restent exclus des valeurs par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Base auth, secrets, sandbox, Cron et Gateway                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, plus runtime du Plugin de canal, Gateway, Plugin SDK, secrets et points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | Surfaces du cœur SSRF, analyse IP, garde réseau, web-fetch et politique SSRF du Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, helpers d’exécution de processus, livraison sortante et portes d’exécution d’outils des agents                       |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance de l’installation de Plugin, loader, manifeste, registre, installation par gestionnaire de paquets, chargement de source et contrat de paquet du Plugin SDK |

### Shards de sécurité propres à la plateforme

- `CodeQL Android Critical Security` — shard de sécurité Android planifié. Construit l’application Android manuellement pour CodeQL sur le plus petit runner Blacksmith Linux accepté par la vérification de cohérence du workflow. Téléverse sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de sécurité macOS hebdomadaire/manuel. Construit l’application macOS manuellement pour CodeQL sur Blacksmith macOS, filtre les résultats de build des dépendances hors du SARIF téléversé, et téléverse sous `/codeql-critical-security/macos`. Conservé hors des valeurs par défaut quotidiennes parce que le build macOS domine le temps d’exécution même lorsqu’il est propre.

### Catégories de qualité critique

`CodeQL Critical Quality` est le shard non lié à la sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript de sévérité erreur et non liées à la sécurité, sur des surfaces étroites à forte valeur, sur le plus petit runner Blacksmith Linux. Sa garde de pull request est volontairement plus petite que le profil planifié : les PR non brouillon n’exécutent que les shards correspondants `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` et `plugin-sdk-reply-runtime` pour les changements touchant au code d’exécution des commandes/modèles/outils d’agent et à la distribution des réponses, au code de schéma/migration/IO de config, au code auth/secrets/sandbox/sécurité, au runtime du canal du cœur et du Plugin de canal groupé, aux méthodes serveur/protocole du Gateway, au runtime mémoire et au collage SDK, à MCP/processus/livraison sortante, au runtime fournisseur/catalogue de modèles, aux diagnostics de session/files de livraison, au loader de Plugin, au contrat Plugin SDK/paquet ou au runtime de réponse du Plugin SDK. Les changements de configuration CodeQL et de workflow qualité exécutent les douze shards qualité de PR.

La distribution manuelle accepte :

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils étroits sont des points d’accroche d’apprentissage/itération pour exécuter un shard qualité isolément.

| Catégorie                                               | Surface                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de frontière de sécurité auth, secrets, sandbox, Cron et Gateway                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de config, migration, normalisation et IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats de méthodes serveur                                                                                                      |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation du canal du cœur et du Plugin de canal groupé                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Exécution de commandes, distribution modèle/fournisseur, distribution et files de réponse automatique, et contrats de runtime du plan de contrôle ACP             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et ponts d’outils, helpers de supervision de processus, et contrats de livraison sortante                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte mémoire, façades de runtime mémoire, alias mémoire du Plugin SDK, collage d’activation du runtime mémoire et commandes doctor mémoire              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internes de la file de réponses, files de livraison de session, helpers de liaison/livraison de session sortante, surfaces de bundles d’événements/logs de diagnostic et contrats CLI doctor de session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, helpers de payload/découpage/runtime des réponses, options de réponse de canal, files de livraison et helpers de liaison session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, auth et découverte des fournisseurs, enregistrement du runtime fournisseur, valeurs par défaut/catalogues des fournisseurs, et registres web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats de runtime du plan de contrôle des tâches                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats de runtime du cœur pour fetch/search web, IO média, compréhension média, génération d’images et génération média                                         |
| `/codeql-critical-quality/plugin-boundary`              | Contrats de loader, registre, surface publique et points d’entrée du Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source du Plugin SDK côté paquet publié et helpers de contrat de paquet de Plugin                                                                                 |

La qualité reste séparée de la sécurité afin que les constats de qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension CodeQL Swift, Python et des Plugins groupés doit être réintroduite sous forme de travail de suivi borné ou shardé uniquement après stabilisation du temps d’exécution et du signal des profils étroits.

## Workflows de maintenance

### Docs Agent

Le workflow `Docs Agent` est une voie de maintenance Codex pilotée par événements pour garder les docs existantes alignées avec les changements récemment intégrés. Il n’a pas de planification pure : une exécution CI réussie sur un push non bot vers `main` peut le déclencher, et une distribution manuelle peut l’exécuter directement. Les invocations par workflow-run sont ignorées lorsque `main` a avancé ou lorsqu’une autre exécution Docs Agent non ignorée a été créée dans la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits depuis le SHA source du précédent Docs Agent non ignoré jusqu’au `main` actuel, de sorte qu’une exécution horaire peut couvrir tous les changements de main accumulés depuis le dernier passage docs.

### Test Performance Agent

Le workflow `Test Performance Agent` est une voie de maintenance Codex pilotée par événements pour les tests lents. Il n’a pas de planification pure : une exécution CI réussie sur un push non bot vers `main` peut le déclencher, mais il est ignoré si une autre invocation par workflow-run a déjà été exécutée ou est en cours ce jour UTC. La distribution manuelle contourne cette porte d’activité quotidienne. La voie construit un rapport de performance Vitest groupé sur la suite complète, permet à Codex de ne faire que de petites corrections de performance de tests préservant la couverture au lieu de refactorings larges, puis relance le rapport de suite complète et rejette les changements qui réduisent le nombre de tests réussis de la base de référence. Si la base de référence contient des tests en échec, Codex ne peut corriger que des échecs évidents et le rapport de suite complète après agent doit réussir avant tout commit. Lorsque `main` avance avant que le push du bot n’atterrisse, la voie rebase le correctif validé, relance `pnpm check:changed` et retente le push ; les correctifs obsolètes en conflit sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex puisse conserver la même posture de sécurité drop-sudo que l’agent docs.

### PR dupliquées après fusion

Le workflow `Duplicate PRs After Merge` est un workflow mainteneur manuel pour le nettoyage des doublons après intégration. Par défaut, il fonctionne en dry-run et ne ferme les PR explicitement listées que lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée est fusionnée et que chaque doublon possède soit un ticket référencé partagé, soit des hunks modifiés qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Portes de vérification locales et routage des changements

La logique locale des lanes changées vit dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette porte de vérification locale est plus stricte sur les frontières d’architecture que le périmètre large de la plateforme CI :

- les changements de production du cœur exécutent la vérification de types de la prod du cœur et des tests du cœur, plus lint/guards du cœur ;
- les changements uniquement de tests du cœur exécutent uniquement la vérification de types des tests du cœur, plus lint du cœur ;
- les changements de production d’extension exécutent la vérification de types de la prod d’extension et des tests d’extension, plus lint d’extension ;
- les changements uniquement de tests d’extension exécutent la vérification de types des tests d’extension, plus lint d’extension ;
- les changements de Plugin SDK public ou de contrat de Plugin s’étendent à la vérification de types des extensions parce que les extensions dépendent de ces contrats du cœur (les balayages Vitest des extensions restent un travail de test explicite) ;
- les bumps de version uniquement liés aux métadonnées de release exécutent des vérifications ciblées de version/config/dépendances racine ;
- les changements racine/config inconnus échouent prudemment vers toutes les lanes de vérification.

Le routage local des tests changés vit dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests s’exécutent elles-mêmes, les modifications de source privilégient les mappings explicites, puis les tests frères et les dépendants du graphe d’imports. La config partagée de livraison des salons de groupe fait partie des mappings explicites : les changements de config de réponse visible par le groupe, de mode de livraison des réponses source ou de prompt système de l’outil message passent par les tests de réponse du cœur, plus les régressions de livraison Discord et Slack, afin qu’un changement de valeur par défaut partagée échoue avant le premier push de PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque le changement touche suffisamment largement le harnais pour que l’ensemble mappé économique ne soit pas un proxy fiable.

## Validation Testbox

Exécutez Testbox depuis la racine du dépôt et préférez une nouvelle boîte préchauffée pour une validation étendue. Avant de consacrer une validation lente à une boîte qui a été réutilisée, a expiré ou vient de signaler une synchronisation anormalement importante, exécutez d’abord `pnpm testbox:sanity` dans la boîte.

La vérification de cohérence échoue rapidement lorsque des fichiers racine requis comme `pnpm-lock.yaml` ont disparu ou lorsque `git status --short` affiche au moins 200 suppressions suivies. Cela signifie généralement que l’état de synchronisation distant n’est pas une copie fiable de la PR ; arrêtez cette boîte et préchauffez-en une nouvelle au lieu de déboguer l’échec du test produit. Pour les PRs avec suppressions massives intentionnelles, définissez `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` pour cette exécution de cohérence.

`pnpm testbox:run` termine aussi une invocation locale de la CLI Blacksmith qui reste en phase de synchronisation pendant plus de cinq minutes sans sortie post-synchronisation. Définissez `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` pour désactiver cette garde, ou utilisez une valeur en millisecondes plus élevée pour des diffs locaux inhabituellement volumineux.

Crabbox est le deuxième chemin de boîte distante appartenant au dépôt pour les validations Linux lorsque Blacksmith est indisponible ou lorsque la capacité cloud détenue est préférable. Préchauffez une boîte, hydratez-la via le workflow du projet, puis exécutez les commandes avec la CLI Crabbox :

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` définit les paramètres par défaut du fournisseur, de la synchronisation et de l’hydratation GitHub Actions. Il exclut le `.git` local afin que le checkout Actions hydraté conserve ses propres métadonnées Git distantes au lieu de synchroniser les remotes et magasins d’objets locaux des mainteneurs, et il exclut les artefacts locaux d’exécution/de build qui ne doivent jamais être transférés. `.github/workflows/crabbox-hydrate.yml` définit le checkout, la configuration Node/pnpm, la récupération de `origin/main` et le transfert d’environnement non secret que les commandes ultérieures `crabbox run --id <cbx_id>` sourcent.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

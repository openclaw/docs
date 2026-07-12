---
read_when:
    - Vous devez comprendre pourquoi une tâche de CI s’est exécutée ou non
    - Vous déboguez une vérification GitHub Actions qui échoue
    - Vous coordonnez une exécution ou une nouvelle exécution de validation de version
    - Vous modifiez la répartition de ClawSweeper ou le transfert de l’activité GitHub
summary: Graphe des tâches de CI, contrôles de périmètre, workflows de version englobants et équivalents des commandes locales
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-12T15:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

La CI d’OpenClaw s’exécute lors des envois vers `main` (les chemins Markdown et `docs/**` sont ignorés
par le déclencheur), sur les demandes de tirage non marquées comme brouillon (les différences portant uniquement sur le CHANGELOG sont ignorées),
ainsi que lors d’un déclenchement manuel. Les envois canoniques vers `main` passent d’abord par une fenêtre
d’admission de 90 secondes sur un exécuteur hébergé ; le groupe de concurrence `CI` annule cette exécution
en attente lorsqu’un commit plus récent arrive, afin que les fusions séquentielles n’enregistrent pas chacune une matrice
Blacksmith complète. Les demandes de tirage et les déclenchements manuels ne passent pas par cette attente. La tâche
`preflight` classe ensuite les différences et désactive les voies coûteuses lorsque
seules des zones sans rapport ont été modifiées. Les exécutions manuelles de `workflow_dispatch`
contournent volontairement la limitation intelligente de la portée et déploient le graphe complet pour les versions candidates et
les validations étendues. Les voies Android restent facultatives via `include_android` (ou l’entrée
`release_gate`). La couverture des Plugins réservée aux versions se trouve dans le workflow distinct
[`Plugin Prerelease`](#plugin-prerelease) et ne s’exécute que depuis
[`Full Release Validation`](#full-release-validation) ou lors d’un déclenchement manuel
explicite.

## Vue d’ensemble du pipeline

| Tâche                              | Objectif                                                                                                                                                                                                                  | Quand elle s’exécute                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `preflight`                        | Détecter les modifications concernant uniquement la documentation, les périmètres modifiés et les extensions modifiées, puis générer le manifeste de CI                                                                  | Toujours pour les envois et les PR qui ne sont pas en brouillon |
| `runner-admission`                 | Temporisation de 90 secondes sur l’infrastructure hébergée pour les envois vers la branche `main` canonique, avant l’enregistrement du travail Blacksmith                                                                  | À chaque exécution de CI ; attente uniquement pour les envois vers la branche `main` canonique |
| `security-fast`                    | Détection des clés privées, audit des workflows modifiés avec `zizmor` et audit du fichier de verrouillage de production                                                                                                  | Toujours pour les envois et les PR qui ne sont pas en brouillon |
| `pnpm-store-warmup`                | Préchauffer le cache du magasin pnpm épinglé par le fichier de verrouillage sans bloquer les partitions Linux Node                                                                                                        | Lorsque les voies Node ou de vérification de la documentation sont sélectionnées |
| `build-artifacts`                  | Générer `dist/` et l’interface de contrôle, effectuer les tests de bon fonctionnement de la CLI générée et vérifier la mémoire au démarrage ainsi que les artefacts générés intégrés                                      | Modifications concernant Node                             |
| `control-ui-i18n`                  | Vérifier les lots de paramètres régionaux générés de l’interface de contrôle, les métadonnées et la mémoire de traduction ; informatif lors des exécutions automatiques, bloquant lors de la CI de publication manuelle     | Modifications concernant l’internationalisation de l’interface de contrôle et CI manuelle |
| `checks-fast-core`                 | Voies rapides de vérification de l’exactitude sous Linux : composants intégrés et protocole, lanceur Bun et tâche rapide de routage de la CI                                                                               | Modifications concernant Node                             |
| `qa-smoke-ci-profile`              | Deux parties équilibrées et autonomes de l’ensemble représentatif borné et automatique de tests de bon fonctionnement QA ; la couverture taxonomique complète reste disponible au moyen de profils QA explicites           | Modifications concernant Node                             |
| `checks-fast-contracts-plugins-*`  | Deux partitions pondérées des contrats de Plugin                                                                                                                                                                         | Modifications concernant Node                             |
| `checks-fast-contracts-channels-*` | Deux partitions pondérées des contrats de canaux                                                                                                                                                                         | Modifications concernant Node                             |
| `checks-node-*`                    | Partitions des tests Node du cœur, à l’exclusion des voies relatives aux canaux, aux composants intégrés, aux contrats et aux extensions                                                                                   | Modifications concernant Node                             |
| `check-*`                          | Équivalent partitionné de la porte locale principale : garde-fous, shrinkwrap, métadonnées de configuration des canaux intégrés, types de production, lint, dépendances et types de test                                    | Modifications concernant Node                             |
| `check-additional-*`               | Bandes de vérification des frontières (y compris la dérive des instantanés de prompts), frontières des accesseurs de session, du lecteur de transcriptions et des transactions SQLite, groupes de lint des extensions, compilation/test canari des frontières de paquet et architecture de la topologie d’exécution | Modifications concernant Node                             |
| `checks-node-compat-node22`        | Voie de génération et de test de bon fonctionnement pour la compatibilité avec Node 22                                                                                                                                   | Déclenchement manuel de la CI pour les publications       |
| `check-docs`                       | Vérification du formatage, du lint et des liens rompus dans la documentation                                                                                                                                              | Documentation modifiée (PR et déclenchement manuel)       |
| `native-i18n`                      | Vérifications de l’inventaire d’internationalisation de l’application native, d’Android et d’Apple                                                                                                                       | Modifications concernant l’internationalisation native    |
| `skills-python`                    | Ruff + pytest pour les Skills reposant sur Python                                                                                                                                                                        | Modifications concernant les Skills Python                |
| `checks-windows`                   | Tests de processus et de chemins propres à Windows, ainsi que régressions partagées des spécificateurs d’importation de l’environnement d’exécution                                                                       | Modifications concernant Windows                          |
| `macos-node`                       | Tests TypeScript ciblés sous macOS : launchd, Homebrew, chemins d’exécution, scripts de paquetage et enveloppe de groupe de processus                                                                                      | Modifications concernant macOS                            |
| `macos-swift`                      | Lint, génération et tests Swift pour l’application macOS                                                                                                                                                                 | Modifications concernant macOS                            |
| `ios-build`                        | Génération du projet Xcode et génération de l’application iOS pour le simulateur                                                                                                                                          | Modifications concernant l’application iOS, le kit d’application partagé ou Swabble |
| `android`                          | Tests unitaires Android pour les deux variantes et génération d’un APK de débogage                                                                                                                                        | Modifications concernant Android                          |
| `test-performance-agent`           | Workflow distinct : optimisation quotidienne avec Codex des tests lents après une activité approuvée                                                                                                                     | Réussite de la CI principale ou déclenchement manuel       |
| `openclaw-performance`             | Workflow distinct : rapports de performances quotidiens ou à la demande de l’environnement d’exécution Kova, avec des voies de fournisseur simulé, de profilage approfondi et GPT 5.6 en conditions réelles                | Déclenchement planifié et manuel                          |

## Ordre d’arrêt rapide

1. `runner-admission` attend uniquement les poussées canoniques vers `main` ; une poussée plus récente annule l’exécution avant l’enregistrement Blacksmith.
2. `preflight` détermine quelles voies existent. Les logiques `docs-scope` et `changed-scope` sont des étapes de cette tâche, et non des tâches autonomes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` et `skills-python` échouent rapidement sans attendre les tâches plus lourdes de la matrice des artefacts et des plateformes.
4. `build-artifacts` et la vérification consultative `control-ui-i18n` s’exécutent en parallèle des voies Linux rapides. Les dérives des locales générées restent visibles pendant que le workflow autonome d’actualisation les corrige en arrière-plan.
5. Les voies plus lourdes de plateforme et d’exécution sont ensuite lancées en parallèle : `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` et `android`.

GitHub peut marquer les tâches remplacées comme `cancelled` lorsqu’un push plus récent arrive sur la même PR ou la même référence `main`. Considérez cela comme du bruit de CI, sauf si l’exécution la plus récente pour la même référence échoue également. Les tâches de matrice utilisent `fail-fast: false`, et `build-artifacts` signale directement les échecs liés au canal intégré, à la limite de prise en charge du cœur et à la surveillance du Gateway, au lieu de mettre en file d’attente de petites tâches de vérification. La clé de concurrence automatique de la CI est versionnée (`CI-v7-*`), afin qu’un processus zombie côté GitHub dans un ancien groupe de file d’attente ne puisse pas bloquer indéfiniment les nouvelles exécutions sur la branche principale. Les exécutions manuelles de la suite complète utilisent `CI-manual-v1-*` et n’annulent pas les exécutions en cours. Le garde-fou de mémoire au démarrage pour la liste des plugins maintient un plafond de 350 Mio sur Linux Blacksmith auto-hébergé et autorise 425 Mio sur Linux hébergé par GitHub, dont la valeur RSS de référence est plus élevée pour la même CLI compilée.

Utilisez `pnpm ci:timings`, `pnpm ci:timings:recent` ou `node scripts/ci-run-timings.mjs <run-id>` pour récapituler le temps écoulé, le temps d’attente dans la file, les tâches les plus lentes, les échecs et la barrière de déploiement en éventail `pnpm-store-warmup` de GitHub Actions. La tâche `ci-timings-summary` intégrée au workflow existe dans `ci.yml`, mais elle est actuellement désactivée (`if: false`) ; exécutez plutôt l’utilitaire de mesure des temps localement. Pour les temps de compilation, consultez l’étape `Build dist` de la tâche `build-artifacts` : `pnpm build:ci-artifacts` affiche `[build-all] phase timings:` et inclut `ui:build` ; la tâche téléverse également l’artefact `startup-memory`.

## Contexte et preuves de la PR

Les PR de contributeurs externes exécutent un contrôle du contexte et des preuves de la PR depuis
`.github/workflows/real-behavior-proof.yml`. Le workflow extrait la
révision approuvée du workflow (`github.workflow_sha`) et évalue uniquement le corps de la PR ;
il n’exécute pas le code de la branche du contributeur.

La vérification s’applique aux auteurs de PR qui ne sont ni propriétaires du dépôt, ni membres,
ni collaborateurs, ni bots. Elle réussit lorsque le corps de la PR contient des sections rédigées
`What Problem This Solves` et `Evidence`. Les preuves peuvent être un test ciblé,
un résultat de CI, une capture d’écran, un enregistrement, une sortie de terminal, une observation en direct,
un journal expurgé ou un lien vers un artefact. Le corps fournit l’intention et une validation utile ;
les réviseurs inspectent le code, les tests et la CI pour évaluer la correction.

Lorsque la vérification échoue, mettez à jour le corps de la PR au lieu de pousser un autre commit de code.

## Périmètre et routage

La logique de périmètre se trouve dans `scripts/ci-changed-scope.mjs` et est couverte par des tests unitaires dans `src/scripts/ci-changed-scope.test.ts`. Le déclenchement manuel ignore la détection du périmètre modifié et fait en sorte que le manifeste de vérification préalable agisse comme si toutes les zones concernées avaient été modifiées.

- Les **modifications des workflows de CI** valident le graphe de CI Node, l’analyse statique des workflows et la voie Windows (`ci.yml` l’exécute), mais ne forcent pas à elles seules les builds natifs iOS, Android ou macOS ; ces voies de plateforme restent limitées aux modifications du code source propre à leur plateforme.
- **Workflow Sanity** exécute `actionlint`, `zizmor` sur tous les fichiers YAML de workflow, la protection contre l’interpolation des actions composites et la protection contre les marqueurs de conflit. La tâche `security-fast`, limitée aux PR, exécute également `zizmor` sur les fichiers de workflow modifiés afin que les problèmes de sécurité des workflows provoquent un échec précoce dans le graphe principal de CI.
- La **documentation lors des pushs sur `main`** est vérifiée par le workflow autonome `Docs` avec le même miroir de documentation ClawHub que celui utilisé par la CI, afin que les pushs mixtes code+documentation ne mettent pas également en file d’attente le shard CI `check-docs`. Les pull requests et la CI manuelle continuent d’exécuter `check-docs` depuis la CI lorsque la documentation a changé.
- **TUI PTY** s’exécute dans le shard Linux Node `checks-node-core-runtime-tui-pty` pour les modifications de la TUI. Le shard exécute `test/vitest/vitest.tui-pty.config.ts` avec `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, couvrant ainsi à la fois la voie déterministe des fixtures `TuiBackend` et le smoke test plus lent `tui --local`, qui ne simule que le point de terminaison externe du modèle.
- Les **modifications concernant uniquement le routage de la CI, le petit ensemble de fixtures de tests du cœur directement exécutées par la tâche rapide et les modifications ciblées des assistants de contrat des plugins** utilisent un chemin de manifeste rapide réservé à Node : `preflight`, `security-fast` et uniquement les voies rapides affectées par la modification — une seule tâche de routage CI `checks-fast-core`, les deux shards de contrat de plugin, ou les deux. Ce chemin ignore les artefacts de build, la compatibilité Node 22, les contrats de canal, l’ensemble des shards du cœur, les shards des plugins intégrés et les matrices de protections supplémentaires.
- Les **vérifications Node sous Windows** sont limitées aux enveloppes de processus et de chemins propres à Windows, aux assistants d’exécution npm/pnpm/UI, à la configuration du gestionnaire de paquets et aux surfaces de workflow CI qui exécutent cette voie ; les modifications sans rapport concernant le code source, les plugins, les smoke tests d’installation et uniquement les tests restent sur les voies Linux Node.

Les familles de tests Node les plus lentes sont divisées ou équilibrées afin que chaque tâche reste petite sans réserver trop de runners :

- Les contrats de plugin et les contrats de canal s’exécutent chacun sous forme de deux shards pondérés adossés à Blacksmith, avec le runner GitHub standard comme solution de repli.
- Les voies rapides/de support des tests unitaires du cœur s’exécutent séparément ; l’infrastructure d’exécution du cœur est divisée en shards de processus, partagés, de hooks, de secrets et trois shards de domaine Cron.
- La réponse automatique s’exécute avec des workers équilibrés, le sous-arbre de réponse étant divisé en shards d’exécuteur d’agent, de commandes, de distribution, de session et de routage d’état.
- Les configurations agentiques du Gateway/serveur (plan de contrôle) sont réparties entre les voies de chat, d’authentification, de modèle, HTTP/plugin, d’exécution et de démarrage, au lieu d’attendre les artefacts construits.
- La CI normale ne regroupe que les shards d’infrastructure isolés fondés sur des motifs d’inclusion dans des lots déterministes d’au plus 64 fichiers de test, ce qui réduit la matrice Node sans fusionner les suites non isolées de commandes/Cron, d’agents-core avec état ou de Gateway/serveur. Les suites fixes lourdes restent sur 8 vCPU, tandis que les voies regroupées et de poids inférieur utilisent 4 vCPU.
- Les pull requests du dépôt canonique utilisent un plan d’admission compact : les mêmes groupes par configuration s’exécutent dans des sous-processus isolés, actuellement 19 tâches de test Node au lieu de la matrice complète de 74 tâches. Un lot unique couvrant toute une configuration est réparti entre les tâches compactes existantes utilisant le même type de runner, tout en conservant son délai d’expiration de 120 minutes, et la configuration d’outillage série est répartie entre trois groupes réservés aux PR ; les pushs sur `main`, les déclenchements manuels et les barrières de publication conservent la matrice complète.
- Les tests étendus de navigateur, de QA, de médias et de plugins divers utilisent leurs configurations Vitest dédiées au lieu du fourre-tout partagé des plugins. Les shards fondés sur des motifs d’inclusion enregistrent les entrées de durée avec le nom du shard CI, afin que `.artifacts/vitest-shard-timings.json` puisse distinguer une configuration complète d’un shard filtré.
- `check-additional-*` répartit la liste supplémentaire de protections de limites (`scripts/run-additional-boundary-checks.mjs`) entre un shard à forte charge de prompts (`check-additional-boundaries-a`, qui inclut la vérification de dérive des instantanés de prompts Codex) et un shard combiné pour les autres segments (`check-additional-boundaries-bcd`), chacun exécutant simultanément des protections indépendantes et affichant les durées de chaque vérification. Le travail de compilation/canari des limites de paquets reste regroupé, et l’architecture de topologie d’exécution s’exécute séparément de la couverture de surveillance du Gateway intégrée à `build-artifacts`.
- La surveillance du Gateway, les tests de canaux et le shard des limites de support du cœur s’exécutent simultanément dans `build-artifacts` une fois que `dist/` et `dist-runtime/` ont déjà été construits.

Une fois admise, la CI Linux canonique autorise jusqu’à 28 tâches de test Node simultanées et
12 pour les voies rapides/de vérification plus petites ; Windows et Android restent limités à deux, car
leurs pools de runners sont plus restreints. Les lots compacts couvrant toute une configuration s’exécutent avec un
délai d’expiration de lot de 120 minutes, tandis que les groupes fondés sur des motifs d’inclusion partagent le même
budget de tâches limité.

La CI Android exécute à la fois `testPlayDebugUnitTest` et `testThirdPartyDebugUnitTest`, puis construit l’APK de débogage Play. La variante tierce ne possède ni ensemble de sources ni manifeste distinct ; sa voie de tests unitaires compile tout de même la variante avec les indicateurs BuildConfig SMS/journal d’appels, tout en évitant une tâche redondante de création de paquet APK de débogage à chaque push concernant Android.

Le shard `check-dependencies` exécute `pnpm deadcode:dependencies` (une passe Knip de production portant uniquement sur les dépendances, épinglée à une version exacte de Knip, avec l’âge minimal de publication de pnpm désactivé pour l’installation `dlx`) et `pnpm deadcode:unused-files`, qui compare les fichiers inutilisés détectés par Knip en production à `scripts/deadcode-unused-files.allowlist.mjs`, ainsi qu’un rapport indicatif `pnpm deadcode:report:ci:ts-unused` téléversé en tant qu’artefact `deadcode-reports`. La protection contre les fichiers inutilisés échoue lorsqu’une PR ajoute un nouveau fichier inutilisé non révisé ou conserve une entrée obsolète dans la liste d’autorisation, tout en préservant les surfaces intentionnelles de plugins dynamiques, de génération, de build, de tests en direct et de ponts de paquets que Knip ne peut pas résoudre statiquement.

## Transmission de l’activité ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` constitue le pont côté cible entre l’activité du dépôt OpenClaw et ClawSweeper. Il ne récupère ni n’exécute le code non fiable des pull requests. Le workflow crée un jeton GitHub App à partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, puis envoie des charges utiles `repository_dispatch` compactes à `openclaw/clawsweeper`.

Le workflow comporte quatre voies :

- `clawsweeper_item` pour les demandes de révision précises d’issues et de pull requests ;
- `clawsweeper_comment` pour les commandes ClawSweeper explicites dans les commentaires d’issue ;
- `clawsweeper_commit_review` pour les demandes de révision au niveau des commits lors des pushs sur `main` ;
- `github_activity` pour l’activité GitHub générale que l’agent ClawSweeper peut examiner.

La voie `github_activity` ne transmet que des métadonnées normalisées : type d’événement, action, acteur, dépôt, numéro de l’élément, URL, titre, état et courts extraits des commentaires ou révisions lorsqu’ils sont présents. Elle évite intentionnellement de transmettre le corps complet du Webhook. Le workflow récepteur dans `openclaw/clawsweeper` est `.github/workflows/github-activity.yml`, qui publie l’événement normalisé sur le hook du Gateway OpenClaw destiné à l’agent ClawSweeper.

L’activité générale relève de l’observation, et non d’une transmission par défaut. L’agent ClawSweeper reçoit la cible Discord dans son prompt et ne doit publier dans `#clawsweeper` que lorsque l’événement est surprenant, exploitable, risqué ou utile sur le plan opérationnel. Les ouvertures et modifications routinières, l’activité parasite des bots, le bruit de Webhooks en double et le trafic normal de révision doivent produire `NO_REPLY`.

Traitez les titres, commentaires, corps, textes de révision, noms de branches et messages de commit GitHub comme des données non fiables tout au long de ce chemin. Ils servent d’entrées pour le résumé et le triage, et non d’instructions pour le workflow ou l’environnement d’exécution de l’agent.

## Déclenchements manuels

Les déclenchements manuels de la CI exécutent le même graphe de tâches que la CI normale, mais activent de force toutes les voies ciblées hors Android : shards Linux Node, shards des plugins intégrés, shards de contrats de plugins et de canaux, compatibilité Node 22, `check-*`, `check-additional-*`, smoke tests des artefacts construits, vérifications de documentation, Skills Python, Windows, macOS, build iOS et internationalisation de Control UI. La parité des paramètres régionaux de Control UI est indicative lors des exécutions automatiques sur les PR et `main`, car le workflow autonome d’actualisation corrige en arrière-plan les dérives générées ; elle est bloquante dans la CI manuelle et donc lors de la validation complète de publication. Les déclenchements manuels autonomes de la CI n’exécutent Android qu’avec `include_android=true` (l’entrée `release_gate` force également Android) ; le workflow global de publication complète active Android en transmettant `include_android=true`. Les vérifications statiques de prépublication des plugins, le shard `agentic-plugins` réservé à la publication, le balayage complet par lots des extensions et les voies Docker de prépublication des plugins sont exclus de la CI. La suite Docker de prépublication ne s’exécute que lorsque `Full Release Validation` déclenche le workflow distinct `Plugin Prerelease` avec la barrière de validation de publication activée.

Les exécutions manuelles utilisent un groupe de concurrence unique afin qu’une suite complète de version candidate ne soit pas annulée par un autre push ou une autre exécution de PR sur la même référence. L’entrée facultative `target_ref` permet à un appelant de confiance d’exécuter ce graphe sur une branche, une étiquette ou un SHA de commit complet, tout en utilisant le fichier de workflow de la référence de déclenchement sélectionnée. L’entrée `release_gate` est une solution de repli réservée aux mainteneurs et fondée sur un SHA exact pour les CI de PR bloquées par la capacité : elle exige que `target_ref` soit un SHA de commit complet correspondant à la tête de la branche déclenchée.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Le chemin mensuel de stabilité étendue limité à npm constitue l’exception : déclenchez à la fois la vérification préalable `OpenClaw NPM
Release` et `Full Release Validation` depuis la branche exacte
`extended-stable/YYYY.M.33`, conservez leurs identifiants d’exécution et transmettez ces deux identifiants à
l’exécution de publication directe sur npm. Consultez [Publication mensuelle de stabilité étendue limitée à npm](/fr/reference/RELEASING#monthly-npm-only-extended-stable-publication) pour
les commandes, les exigences d’identité exactes, la relecture du registre et la procédure de
réparation des sélecteurs. Ce chemin ne déclenche pas la publication des plugins, de macOS, de Windows, de GitHub
Release, des balises de distribution privées ni d’autres plateformes.

## Runners

| Exécuteur                       | Tâches                                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Déclenchement manuel de la CI et solutions de repli pour les dépôts non canoniques, agrégat QA Smoke, analyses CodeQL de sécurité et de qualité, workflow-sanity, labeler, auto-response, workflow Docs autonome et ensemble du workflow Install Smoke                                               |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` sauf la CI QA Smoke, fragments de contrats de plugins/canaux, plupart des fragments Linux Node intégrés ou légers, voies `check-*` sauf `check-lint`, certains fragments `check-additional-*`, `check-docs` et `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node lourdes conservées, fragments `check-additional-*` axés sur les limites/extensions et `android`                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | Fragments automatiques de la CI QA Smoke, `build-artifacts` dans la CI et Testbox, et `check-lint` (suffisamment sensible au processeur pour que 8 vCPU coûtent plus qu’ils ne permettent d’économiser)                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                    |
| `blacksmith-6vcpu-macos-15`     | `macos-node` sur `openclaw/openclaw` ; les forks se replient sur `macos-15`                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` et `ios-build` sur `openclaw/openclaw` ; les forks se replient sur `macos-26`                                                                                                                                                                                                        |

## Budget d’enregistrement des exécuteurs

Le compartiment actuel d’enregistrement des exécuteurs GitHub d’OpenClaw indique 10,000 enregistrements d’exécuteurs auto-hébergés toutes les 5 minutes dans `ghx api rate_limit`. Revérifiez `actions_runner_registration` avant chaque passe d’ajustement, car GitHub peut modifier ce compartiment. La limite est partagée par tous les enregistrements d’exécuteurs Blacksmith de l’organisation `openclaw` ; l’ajout d’une autre installation Blacksmith ne crée donc pas de nouveau compartiment.

Considérez les labels Blacksmith comme la ressource rare pour contrôler les rafales. Les tâches qui se contentent de router, notifier, résumer, sélectionner des fragments ou exécuter de courtes analyses CodeQL doivent rester sur des exécuteurs hébergés par GitHub, sauf si des besoins propres à Blacksmith ont été mesurés. Toute nouvelle matrice Blacksmith, toute augmentation de `max-parallel` ou tout workflow à haute fréquence doit indiquer son nombre d’enregistrements dans le pire des cas et maintenir la cible au niveau de l’organisation sous environ 60% du compartiment actif. Avec le compartiment actuel de 10,000 enregistrements, cela correspond à une cible opérationnelle de 6,000 enregistrements, laissant une marge pour les dépôts simultanés, les nouvelles tentatives et le chevauchement des rafales.

La CI du dépôt canonique conserve Blacksmith comme chemin d’exécution par défaut pour les exécutions normales sur push et pull request. Les exécutions `workflow_dispatch` et celles des dépôts non canoniques utilisent des exécuteurs hébergés par GitHub, mais les exécutions canoniques normales ne vérifient actuellement pas l’état de la file d’attente Blacksmith et ne se replient pas automatiquement sur des labels hébergés par GitHub lorsque Blacksmith est indisponible.

## Équivalents locaux

```bash
pnpm changed:lanes                            # inspecter le classificateur local des voies modifiées pour origin/main...HEAD
pnpm check:changed                            # contrôle local intelligent : formatage/typecheck/lint/gardes modifiés par voie de limite
pnpm check                                    # contrôle local rapide : tsgo de production + lint fragmenté + gardes rapides parallèles
pnpm check:test-types
pnpm check:timed                              # même contrôle avec durées par étape
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # tests vitest
pnpm test:changed                             # cibles Vitest modifiées, économiques et intelligentes
pnpm test:ui                                  # suite unitaire/navigateur de l’interface de contrôle
pnpm ui:i18n:check                            # parité générée des locales de l’interface de contrôle (contrôle de publication)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formatage + lint + liens rompus de la documentation
pnpm build                                    # compiler dist lorsque les contrôles d’artefacts/de smoke de la CI sont importants
pnpm ios:build                                # générer et compiler le projet d’application iOS
pnpm ci:timings                               # résumer la dernière exécution de CI sur push vers origin/main
pnpm ci:timings:recent                        # comparer les exécutions récentes réussies de la CI principale
node scripts/ci-run-timings.mjs <run-id>      # résumer le temps écoulé, le temps en file d’attente et les tâches les plus lentes
node scripts/ci-run-timings.mjs --latest-main # ignorer le bruit des tickets/commentaires et choisir la CI sur push vers origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparer les exécutions récentes réussies de la CI principale
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Performances d’OpenClaw

`OpenClaw Performance` est le workflow de performances du produit/de l’environnement d’exécution. Il s’exécute quotidiennement sur `main` et peut être déclenché manuellement :

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Le déclenchement manuel évalue normalement les performances de la référence du workflow. Définissez `target_ref` pour évaluer une balise de publication ou une autre branche avec l’implémentation actuelle du workflow. Les chemins des rapports publiés et les pointeurs vers les dernières versions sont indexés par référence testée, et chaque `index.md` consigne la référence/le SHA testé, la référence/le SHA du workflow, la référence Kova, le profil, le mode d’authentification de la voie, le modèle, le nombre de répétitions et les filtres de scénarios.

Le workflow installe OCM depuis une version épinglée et Kova depuis `openclaw/Kova` à l’entrée `kova_ref` épinglée, puis exécute trois voies :

- `mock-provider` : scénarios de diagnostic Kova sur un environnement d’exécution compilé localement avec une fausse authentification déterministe compatible avec OpenAI.
- `mock-deep-profile` : profilage CPU/tas/trace des points critiques du démarrage, du Gateway et des tours d’agent. S’exécute selon la planification ou lors d’un déclenchement avec `deep_profile=true`.
- `live-openai-candidate` : véritable tour d’agent OpenAI `openai/gpt-5.6-luna`, ignoré lorsque `OPENAI_API_KEY` n’est pas disponible. S’exécute selon la planification ou lors d’un déclenchement avec `live_openai_candidate=true`.

La voie mock-provider exécute également des sondes de source natives d’OpenClaw après le passage Kova : durée de démarrage et mémoire du Gateway pour les cas de démarrage par défaut, avec canal ignoré, avec hook interne et avec cinquante plugins ; RSS d’importation des plugins intégrés, boucles répétées de salutations `channel-chat-baseline` avec un faux OpenAI, commandes de démarrage de la CLI sur le Gateway démarré et sonde de performances smoke de l’état SQLite. Lorsque le précédent rapport source mock-provider publié est disponible pour la référence testée, le résumé des sources compare les valeurs RSS et de tas actuelles à cette référence et marque les fortes augmentations de RSS comme `watch`. Le résumé Markdown des sondes source se trouve dans `source/index.md` dans le lot de rapports, accompagné des données JSON brutes.

Chaque voie téléverse son artefact GitHub complet, notamment les lots CPU, tas, trace et diagnostic compressé. Une tâche de publication distincte télécharge et valide ces artefacts, puis génère un jeton éphémère d’application GitHub ClawSweeper limité au contenu de `openclaw/clawgrit-reports` et le transmet uniquement à l’étape Git push. Elle valide `report.json`, `report.md`, `index.md`, les artefacts des sondes source et les métadonnées/sommes de contrôle des lots sous `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ; l’archive de diagnostic complète reste dans l’artefact Actions lié. Le processus de publication rejette tout fichier de rapport de plus de 50 MB avant de tenter un push. Le pointeur actuel de la référence testée est `openclaw-performance/<tested-ref>/latest-<lane>.json`. Les exécutions planifiées et les déclenchements `profile=release` échouent si la création du jeton d’application ou la publication du rapport échoue. Pour les déclenchements manuels hors publication, la publication reste facultative et les artefacts GitHub sont conservés en cas d’échec de l’authentification ou de la publication. La référence source précédente est récupérée anonymement depuis le dépôt public de rapports ; une récupération réussie de cette référence ne prouve donc pas l’authentification du processus de publication.

## Validation complète de publication

`Full Release Validation` est le workflow global manuel permettant de « tout exécuter avant la publication ». Il accepte une branche, une balise ou un SHA de commit complet, déclenche le workflow manuel `CI` avec cette cible (Android compris), déclenche `Plugin Prerelease` pour les preuves réservées à la publication concernant les plugins/paquets/fichiers statiques/Docker, déclenche `OpenClaw Performance` sur le SHA cible et déclenche `OpenClaw Release Checks` pour les tests smoke d’installation, la validation des paquets, les contrôles de paquets multi-OS, la parité QA Lab, Matrix et les voies Telegram (le rendu consultatif du tableau de maturité est activable via `run_maturity_scorecard`). Les profils stable et complet incluent toujours une couverture exhaustive en conditions réelles/E2E et des tests prolongés du chemin de publication Docker ; le profil bêta peut l’activer avec `run_release_soak=true`. L’E2E Telegram du paquet canonique s’exécute dans Package Acceptance ; un candidat complet ne démarre donc pas un second poller en conditions réelles. Après publication, transmettez `release_package_spec` pour réutiliser le paquet npm publié dans les contrôles de publication, Package Acceptance, Docker, les tests multi-OS et Telegram sans nouvelle compilation. Utilisez `npm_telegram_package_spec` uniquement pour une nouvelle exécution Telegram ciblée sur un paquet publié. La voie du paquet en conditions réelles du plugin Codex utilise par défaut le même état sélectionné : `release_package_spec=openclaw@<tag>` publié produit `codex_plugin_spec=npm:@openclaw/codex@<tag>`, tandis que les exécutions par SHA/artefact empaquettent `extensions/codex` depuis la référence sélectionnée. Définissez explicitement `codex_plugin_spec` pour les sources de plugin personnalisées telles que les spécifications `npm:`, `npm-pack:` ou `git:`.

Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la matrice des étapes, les noms exacts des tâches du workflow, les différences entre profils, les artefacts et les paramètres de réexécution ciblée.

`OpenClaw Release Publish` est le workflow manuel de publication de version avec mutations. Lancez
les publications bêta et stables ordinaires depuis la branche `main` approuvée après la création du tag de version
et après la réussite de la vérification préalable npm d’OpenClaw (celle-ci exécute notamment
`pnpm plugins:sync:check`). Le tag sélectionne toujours le commit exact
de la version, y compris un commit sur `release/YYYY.M.PATCH` ; les publications alpha
de Tideclaw continuent d’utiliser leur branche alpha correspondante. Ce workflow exige le
`preflight_run_id` enregistré ainsi qu’un
`full_release_validation_run_id` réussi et son
`full_release_validation_run_attempt` exact, lance `Plugin NPM Release` pour tous
les paquets de plugins publiables, lance `Plugin ClawHub Release` pour le même
SHA de version, puis seulement ensuite lance `OpenClaw NPM Release`. La publication stable
exige également un `windows_node_tag` exact ; le workflow vérifie la version source
Windows et compare ses programmes d’installation x64/ARM64 avec l’entrée
`windows_node_installer_digests` approuvée pour la version candidate avant toute publication
enfant, puis promeut et vérifie ces mêmes condensats épinglés de programmes d’installation ainsi que le contrat exact
de la ressource associée et de la somme de contrôle avant de publier le brouillon de version GitHub.
Les réparations ciblées concernant uniquement les plugins utilisent `plugin_publish_scope=selected` avec une liste
de paquets non vide. Les exécutions `all-publishable` concernant uniquement les plugins exigent les mêmes preuves immuables
de vérification préalable npm et de validation complète de la version qu’une publication du cœur.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Pour obtenir une preuve liée à un commit précis sur une branche évoluant rapidement, utilisez l’utilitaire plutôt que
`gh workflow run ... --ref main -f ref=<sha>` :

```bash
pnpm ci:full-release --sha <full-sha>
```

Les références de lancement des workflows GitHub doivent être des branches ou des tags, et non des SHA de commit bruts. L’utilitaire
pousse une branche temporaire `release-ci/<sha>-...` à partir d’un SHA de workflow de la branche `main`
approuvée, transmet le SHA cible demandé via l’entrée `ref` du workflow,
réutilise les preuves strictes correspondant exactement à la cible lorsqu’elles sont disponibles, vérifie que chaque
`headSha` de workflow enfant correspond au SHA du workflow approuvé, puis supprime la branche temporaire
à la fin de l’exécution. Transmettez `-f reuse_evidence=false` pour forcer une nouvelle
validation. Le vérificateur global échoue également si un workflow enfant s’est exécuté avec un
SHA de workflow différent.

`release_profile` contrôle l’étendue des vérifications en direct et des fournisseurs transmises aux contrôles de version. Les
workflows manuels de version utilisent `stable` par défaut ; utilisez `full` uniquement lorsque vous
souhaitez intentionnellement la vaste matrice consultative de fournisseurs et de médias. Les contrôles de version
stable et complète exécutent toujours les tests exhaustifs en direct/E2E et le test prolongé du parcours de version
Docker ; le profil bêta peut les activer avec `run_release_soak=true`.

- `minimum` conserve les voies OpenAI/cœur critiques pour la version les plus rapides.
- `stable` ajoute l’ensemble stable de fournisseurs et de moteurs.
- `full` exécute la vaste matrice consultative de fournisseurs et de médias.

Le workflow global enregistre les identifiants des exécutions enfants lancées, et la tâche finale `Verify full validation` vérifie à nouveau les conclusions actuelles des exécutions enfants et ajoute des tableaux des tâches les plus lentes pour chaque exécution enfant. Si un workflow enfant est réexécuté et réussit, réexécutez uniquement la tâche de vérification parente afin d’actualiser le résultat global et le récapitulatif des durées.

Pour la récupération, `Full Release Validation` et `OpenClaw Release Checks` acceptent tous deux `rerun_group`. Utilisez `all` pour une version candidate, `ci` uniquement pour l’enfant de CI complète normal, `plugin-prerelease` uniquement pour l’enfant de préversion des plugins, `performance` uniquement pour l’enfant OpenClaw Performance, `release-checks` pour tous les enfants de version, ou un groupe plus restreint : `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ou `npm-telegram` dans le workflow global. Cela permet de limiter la réexécution d’une machine de version ayant échoué après une correction ciblée. Pour une seule voie multiplateforme ayant échoué, combinez `rerun_group=cross-os` avec `cross_os_suite_filter`, par exemple `windows/packaged-upgrade` ; les longues commandes multiplateformes émettent des lignes Heartbeat et les récapitulatifs de mise à niveau de paquet incluent les durées de chaque phase. Les voies de contrôle de version QA sont consultatives, à l’exception du contrôle standard de couverture des outils d’exécution, qui bloque lorsque des outils dynamiques OpenClaw requis divergent ou disparaissent du récapitulatif du niveau standard.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence sélectionnée en une archive `release-package-under-test`, puis transmet cet artefact aux contrôles multiplateformes et à Package Acceptance, ainsi qu’au workflow Docker en direct/E2E du parcours de version lorsque la couverture prolongée s’exécute. Cela garantit la cohérence des octets du paquet entre les machines de version et évite de recréer le même paquet candidat dans plusieurs tâches enfants. Pour la voie en direct du plugin npm Codex, les contrôles de version transmettent soit une spécification de plugin publié correspondante dérivée de `release_package_spec`, soit la valeur `codex_plugin_spec` fournie par l’opérateur, soit une entrée vide afin que le script Docker crée le paquet du plugin Codex de l’extraction sélectionnée.

Les exécutions `Full Release Validation` en double pour `ref=main` et `rerun_group=all`
remplacent l’exécution globale la plus ancienne. Le moniteur parent annule tout workflow enfant qu’il
a déjà lancé lorsque le parent est annulé, afin qu’une validation plus récente de la branche principale
ne reste pas bloquée derrière une exécution obsolète de contrôles de version de deux heures. La validation des branches/tags
de version et les groupes de réexécution ciblés conservent `cancel-in-progress: false`.

## Segments en direct et E2E

L’enfant de version en direct/E2E conserve une large couverture native de `pnpm test:live`, mais l’exécute sous forme de segments nommés via `scripts/test-live-shard.mjs` plutôt que dans une seule tâche séquentielle :

- `native-live-src-agents` et `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- tâches `native-live-src-gateway-profiles` filtrées par fournisseur
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- segments distincts pour les médias audio/vidéo et segments musicaux filtrés par fournisseur

Cela conserve la même couverture de fichiers tout en facilitant la réexécution et le diagnostic des défaillances lentes des fournisseurs en direct. Les noms de segments agrégés `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` et `native-live-extensions-media-music` restent valides pour les réexécutions manuelles ponctuelles.

Les segments natifs de médias en direct s’exécutent dans `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, créé par le workflow `Live Media Runner Image`. Cette image préinstalle `ffmpeg` et `ffprobe` ; les tâches de médias vérifient uniquement les binaires avant la configuration. Conservez les suites en direct reposant sur Docker sur des exécuteurs Blacksmith normaux — les tâches en conteneur ne conviennent pas au lancement de tests Docker imbriqués.

Les segments en direct de modèles/moteurs reposant sur Docker utilisent une image partagée distincte `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` pour chaque commit sélectionné. Le workflow de version en direct crée et pousse cette image une seule fois, puis les segments Docker de modèles en direct, du Gateway réparti par fournisseur, du moteur CLI, de liaison ACP et du harnais Codex s’exécutent avec `OPENCLAW_SKIP_DOCKER_BUILD=1`. Les segments Docker du Gateway comportent des limites `timeout` explicites au niveau du script, inférieures au délai d’expiration de la tâche du workflow, afin qu’un conteneur ou un processus de nettoyage bloqué échoue rapidement au lieu de consommer tout le budget des contrôles de version. Si ces segments recréent indépendamment la cible Docker complète depuis les sources, l’exécution de version est mal configurée et gaspillera du temps réel en créations d’image dupliquées.

## Package Acceptance

Utilisez `Package Acceptance` lorsque la question est « ce paquet OpenClaw installable fonctionne-t-il comme un produit ? ». Cela diffère de la CI normale : la CI normale valide l’arborescence des sources, tandis que l’acceptation du paquet valide une seule archive au moyen du même harnais Docker E2E que les utilisateurs emploient après une installation ou une mise à jour.

### Tâches

1. `resolve_package` extrait `workflow_ref`, résout un paquet candidat unique, écrit `.artifacts/docker-e2e-package/openclaw-current.tgz`, écrit `.artifacts/docker-e2e-package/package-candidate.json`, téléverse les deux comme artefact `package-under-test`, puis affiche la source, la référence du workflow, la référence du paquet, la version, le SHA-256 et le profil dans le récapitulatif de l’étape GitHub.
2. `package_integrity` télécharge l’artefact `package-under-test` et impose le contrat public de l’archive du paquet avec `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` appelle `openclaw-live-and-e2e-checks-reusable.yml` avec le SHA source du paquet résolu (avec repli sur `workflow_ref`) et `package_artifact_name=package-under-test`. Le workflow réutilisable télécharge cet artefact, valide l’inventaire de l’archive, prépare si nécessaire des images Docker fondées sur le condensat du paquet, puis exécute les voies Docker sélectionnées sur ce paquet au lieu de créer un paquet depuis l’extraction du workflow. Lorsqu’un profil sélectionne plusieurs `docker_lanes` ciblées, le workflow réutilisable prépare une seule fois le paquet et les images partagées, puis distribue ces voies sous forme de tâches Docker ciblées parallèles avec des artefacts uniques.
4. `package_telegram` appelle facultativement `NPM Telegram Beta E2E`. Cette tâche s’exécute lorsque `telegram_mode` n’est pas `none` et installe le même artefact `package-under-test` lorsque Package Acceptance en a résolu un ; un lancement Telegram autonome peut toujours installer une spécification npm publiée.
5. `summary` fait échouer le workflow si la résolution du paquet, son intégrité, son acceptation Docker ou la voie Telegram facultative ont échoué. L’entrée `advisory` transforme les échecs d’acceptation en avertissements pour les appelants consultatifs.

### Sources des paquets candidats

- `source=npm` accepte uniquement `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` ou une version OpenClaw exacte telle que `openclaw@2026.4.27-beta.2`. Utilisez cette source pour l’acceptation d’une version étendue stable, d’une préversion ou d’une version stable déjà publiée.
- `source=ref` crée un paquet à partir d’une branche, d’un tag ou d’un SHA de commit complet `package_ref` approuvé. Le résolveur récupère les branches/tags OpenClaw, vérifie que le commit sélectionné est accessible depuis l’historique d’une branche du dépôt ou depuis un tag de version, installe les dépendances dans une arborescence de travail détachée, puis crée le paquet avec `scripts/package-openclaw-for-docker.mjs`.
- `source=url` télécharge une archive `.tgz` HTTPS publique ; `package_sha256` est obligatoire. Ce chemin rejette les identifiants dans les URL, les ports HTTPS non standard, les noms d’hôtes ou les adresses IP résolues qui sont privés, internes ou réservés à un usage spécial, ainsi que les redirections ne respectant pas la même politique de sécurité publique.
- `source=trusted-url` télécharge une archive `.tgz` HTTPS depuis une politique de source approuvée nommée dans `.github/package-trusted-sources.json` ; `package_sha256` et `trusted_source_id` sont obligatoires. Utilisez cette source uniquement pour les miroirs d’entreprise gérés par les mainteneurs ou les dépôts de paquets privés nécessitant des hôtes, des ports, des préfixes de chemin, des hôtes de redirection ou une résolution sur réseau privé configurés. Si la politique déclare une authentification par jeton porteur, le workflow utilise le secret fixe `OPENCLAW_TRUSTED_PACKAGE_TOKEN` ; les identifiants intégrés à l’URL restent rejetés.
- `source=artifact` télécharge une seule archive `.tgz` depuis `artifact_run_id` et `artifact_name` ; `package_sha256` est facultatif, mais devrait être fourni pour les artefacts partagés à l’extérieur.

Conservez `workflow_ref` et `package_ref` séparés. `workflow_ref` désigne le code approuvé du workflow/harnais qui exécute le test. `package_ref` désigne le commit source à partir duquel le paquet est créé lorsque `source=ref`. Cela permet au harnais de test actuel de valider d’anciens commits sources approuvés sans exécuter l’ancienne logique de workflow.

### Profils de suites

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — l’ensemble `package` avec la couverture `plugins` en direct à la place de `plugins-offline`, plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segments complets du parcours de version Docker avec OpenWebUI
- `custom` — valeurs `docker_lanes` exactes ; obligatoire lorsque `suite_profile=custom`

Le profil `package` utilise une couverture hors ligne des plugins afin que la validation du paquet publié ne dépende pas de la disponibilité en direct de ClawHub. Le parcours Telegram facultatif réutilise l’artefact `package-under-test` dans `NPM Telegram Beta E2E`, tandis que le chemin de spécification npm publié est conservé pour les déclenchements autonomes.

Pour consulter la politique dédiée aux tests des mises à jour et des plugins, notamment les commandes locales,
les parcours Docker, les entrées de Package Acceptance, les valeurs par défaut des versions et le triage des échecs,
voir [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).

Les vérifications de version appellent Package Acceptance avec `source=artifact`, l’artefact de paquet de version préparé, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` et `telegram_mode=mock-openai`. Cela permet de vérifier la migration du paquet, la mise à jour, l’installation en direct de Skills depuis ClawHub, le nettoyage des dépendances obsolètes de plugins, la réparation de l’installation des plugins configurés, les plugins hors ligne, la mise à jour des plugins et Telegram sur la même archive tar de paquet résolue. Définissez `release_package_spec` dans Full Release Validation ou OpenClaw Release Checks après la publication d’une bêta afin d’exécuter la même matrice sur le paquet npm publié sans le reconstruire ; définissez `package_acceptance_package_spec` uniquement lorsque Package Acceptance doit utiliser un paquet différent de celui du reste de la validation de version. Les vérifications de version multiplateformes couvrent toujours l’intégration initiale, le programme d’installation et le comportement propre à chaque système d’exploitation ; la validation fonctionnelle des paquets et des mises à jour doit commencer par Package Acceptance.

Le parcours Docker `published-upgrade-survivor` valide une référence de paquet publié par exécution dans le chemin bloquant de publication. Dans Package Acceptance, l’archive tar `package-under-test` résolue est toujours le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée de repli, avec `openclaw@latest` par défaut ; les commandes de réexécution des parcours ayant échoué conservent cette référence. Full Release Validation avec `run_release_soak=true` ou `release_profile=full` définit `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` et `published_upgrade_survivor_scenarios=reported-issues` afin d’étendre les tests aux quatre dernières versions npm stables, ainsi qu’aux versions limites épinglées pour la compatibilité des plugins et aux scénarios de test inspirés des problèmes signalés concernant la configuration Feishu, les fichiers d’amorçage et de persona préservés, les installations de plugins OpenClaw configurés, les chemins de journaux contenant un tilde et les racines obsolètes de dépendances de plugins hérités. Les sélections de survivants de mise à niveau publiés comportant plusieurs références sont fragmentées par référence dans des tâches Docker ciblées distinctes. Le workflow `Update Migration` distinct utilise le parcours Docker `update-migration` avec les références `all-since-2026.4.23` et les scénarios `plugin-deps-cleanup` lorsque la question porte sur le nettoyage exhaustif des mises à jour publiées, et non sur l’étendue normale de la CI Full Release. Les exécutions agrégées locales peuvent transmettre des spécifications de paquet exactes avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conserver un seul parcours avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, par exemple `openclaw@2026.4.15`, ou définir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` pour la matrice de scénarios. Le parcours publié configure la référence avec une recette de commandes `openclaw config set` intégrée, enregistre les étapes de la recette dans `summary.json` et sonde `/healthz`, `/readyz` ainsi que l’état RPC après le démarrage du Gateway. Les parcours d’installation et de paquet Windows à partir d’un environnement vierge vérifient également qu’un paquet installé peut importer un remplacement de contrôle du navigateur depuis un chemin Windows absolu brut. Le test rapide multiplateforme d’un tour d’agent OpenAI utilise par défaut `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsqu’il est défini, sinon `openai/gpt-5.6-luna`, afin que la vérification de l’installation et du Gateway utilise le niveau de test GPT-5.6 moins coûteux.

### Fenêtres de compatibilité héritée

Package Acceptance comporte des fenêtres bornées de compatibilité héritée pour les paquets déjà publiés. Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent utiliser le chemin de compatibilité :

- les entrées QA privées connues dans `dist/postinstall-inventory.json` peuvent pointer vers des fichiers omis de l’archive tar ;
- `doctor-switch` peut ignorer le sous-cas de persistance `gateway install --wrapper` lorsque le paquet n’expose pas cette option ;
- `update-channel-switch` peut supprimer les `patchedDependencies` pnpm manquantes du faux scénario de test Git dérivé de l’archive tar et peut consigner l’absence de `update.channel` persistant ;
- les tests rapides de plugins peuvent lire les emplacements hérités des enregistrements d’installation ou accepter l’absence de persistance des enregistrements d’installation de la place de marché ;
- `plugin-update` peut autoriser la migration des métadonnées de configuration tout en exigeant que l’enregistrement d’installation et le comportement sans réinstallation restent inchangés.

Le paquet `2026.4.26` publié peut également émettre un avertissement pour les fichiers d’horodatage des métadonnées de compilation locale qui ont déjà été publiés, et les paquets jusqu’à `2026.5.20` peuvent émettre un avertissement au lieu d’échouer lorsque `npm-shrinkwrap.json` est absent. Les paquets ultérieurs doivent respecter les contrats modernes ; dans les mêmes conditions, ils échouent au lieu d’émettre un avertissement ou d’ignorer le contrôle.

### Exemples

```bash
# Valider le paquet bêta actuel avec une couverture au niveau du produit.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Valider le paquet stable étendu publié avec une couverture du paquet.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empaqueter et valider une branche de version avec le banc de test actuel.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Valider l’URL d’une archive tar. SHA-256 est obligatoire pour source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Valider une archive tar provenant d’une politique de miroir privé approuvé nommée.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Réutiliser une archive tar téléversée par une autre exécution d’Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Lors du débogage d’une exécution de Package Acceptance ayant échoué, commencez par le récapitulatif `resolve_package` afin de confirmer la source, la version et le SHA-256 du paquet. Examinez ensuite l’exécution enfant `docker_acceptance` et ses artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, les journaux des parcours, la durée des phases et les commandes de réexécution. Préférez réexécuter le profil de paquet ayant échoué ou les parcours Docker exacts plutôt que de relancer la validation complète de la version.

## Test rapide d’installation

Le workflow `Install Smoke` ne s’exécute plus sur les demandes d’extraction ni sur les envois vers `main`. Son enveloppe nocturne/manuelle et la validation de version appellent toutes deux le cœur en lecture seule `install-smoke-reusable.yml`, et chaque exécution suit le chemin complet du test rapide d’installation sur des exécuteurs hébergés par GitHub :

- L’image de test rapide du Dockerfile racine est construite une fois par SHA cible, liée à la révision du workflow et à la tentative du producteur dans un artefact immuable, puis chargée par le test rapide de la CLI, le test rapide de la CLI pour la suppression d’agents dans un espace de travail partagé, le test E2E du réseau du Gateway en conteneur et le test rapide de l’argument de compilation du plugin `matrix` intégré. Le test rapide du plugin vérifie la mise en miroir de l’installation des dépendances d’exécution et le chargement du plugin sans diagnostic d’échappement du point d’entrée.
- L’installation du paquet QR et les tests rapides Docker du programme d’installation et de la mise à jour, notamment les parcours du programme d’installation Rocky Linux et un parcours de mise à jour utilisant une référence npm configurable `update_baseline_version`, s’exécutent comme des tâches distinctes afin que le travail du programme d’installation n’attende pas derrière les tests rapides de l’image racine.

Le test rapide, plus lent, du fournisseur d’images lors de l’installation globale de Bun est contrôlé séparément par `run_bun_global_install_smoke`. Il s’exécute selon la planification nocturne, est activé par défaut pour les appels de workflow provenant des vérifications de version, et les déclenchements manuels de `Install Smoke` peuvent choisir de l’activer. La CI normale des demandes d’extraction exécute toujours le parcours rapide de régression du lanceur Bun pour les modifications concernant Node. Les tests Docker QR et du programme d’installation conservent leurs propres Dockerfiles axés sur l’installation.

## E2E Docker local

`pnpm test:docker:all` préconstruit une image de test en direct partagée, empaquette OpenClaw une seule fois sous forme d’archive tar npm et construit deux images `scripts/e2e/Dockerfile` partagées :

- un exécuteur Node/Git minimal pour les parcours du programme d’installation, de mise à jour et de dépendances de plugins ;
- une image fonctionnelle qui installe la même archive tar dans `/app` pour les parcours fonctionnels normaux.

Les définitions des parcours Docker se trouvent dans `scripts/lib/docker-e2e-scenarios.mjs`, la logique de planification dans `scripts/lib/docker-e2e-plan.mjs`, et l’exécuteur exécute uniquement le plan sélectionné. L’ordonnanceur sélectionne l’image de chaque parcours avec `OPENCLAW_DOCKER_E2E_BARE_IMAGE` et `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, puis exécute les parcours avec `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Paramètres réglables

| Variable                               | Valeur par défaut | Objectif                                                                                                   |
| -------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                | Nombre d’emplacements du pool principal pour les parcours normaux.                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                | Nombre d’emplacements du pool final sensible aux fournisseurs.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                 | Limite de parcours en direct simultanés afin que les fournisseurs ne réduisent pas le débit.               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                 | Limite de parcours simultanés d’installation npm.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                 | Limite de parcours multiservices simultanés.                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000              | Décalage entre les démarrages de parcours pour éviter les pics de création du démon Docker ; définissez `0` pour aucun décalage. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000           | Délai d’expiration de repli par parcours (120 minutes) ; certains parcours en direct/finaux utilisent des limites plus strictes. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | non défini        | `1` affiche le plan de l’ordonnanceur sans exécuter les parcours.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | non défini        | Liste exacte de parcours séparés par des virgules ; ignore le test rapide de nettoyage afin que les agents puissent reproduire un parcours ayant échoué. |

Un parcours plus exigeant que sa limite effective peut néanmoins démarrer depuis un pool vide, puis s’exécute seul jusqu’à ce qu’il libère de la capacité. L’agrégat local effectue les vérifications préalables de Docker, supprime les conteneurs E2E OpenClaw obsolètes, affiche l’état des parcours actifs, conserve la durée des parcours pour les ordonner du plus long au plus court et cesse par défaut de planifier de nouveaux parcours mutualisés après le premier échec.

### Workflow réutilisable en direct/E2E

Le workflow live/E2E réutilisable demande à `scripts/test-docker-all.mjs --plan-json` quelle couverture de package, de type d'image, d'image live, de lane et d'identifiants est requise. `scripts/docker-e2e.mjs` convertit ensuite ce plan en sorties et résumés GitHub. Il crée un package OpenClaw au moyen de `scripts/package-openclaw-for-docker.mjs`, télécharge un artefact de package de l'exécution en cours ou télécharge un artefact de package depuis `package_artifact_run_id`, puis valide l'inventaire de l'archive tar. Le chemin par défaut `no-push-artifact` construit des images minimales/fonctionnelles étiquetées avec le condensat du package au moyen du cache de couches Docker de Blacksmith, empaquette les octets exacts des images dans un artefact de workflow immuable et fait vérifier et charger cet artefact par chaque consommateur. À l'inverse, `existing-only` exige des références GHCR explicites dans `docker_e2e_bare_image`/`docker_e2e_functional_image` et ne construit ni ne pousse jamais d'image. Ces extractions depuis le registre utilisent un délai d'expiration limité à 180 secondes par tentative afin qu'un flux bloqué soit rapidement retenté au lieu de consommer l'essentiel du chemin critique de la CI. Après une validation planifiée réussie, `openclaw-scheduled-live-checks.yml` transmet le manifeste immuable des images testées à l'éditeur distinct disposant des droits d'écriture sur les packages ; les appelants en lecture seule des versions et préversions ne passent jamais par cet éditeur.

### Segments du chemin de publication

La couverture Docker de publication exécute des tâches segmentées plus petites avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, afin que chaque segment vérifie et charge uniquement le type d'image fondé sur un artefact dont il a besoin (ou l'extrait dans le cadre d'une réutilisation explicite avec `existing-only`) et exécute plusieurs lanes au moyen du même planificateur pondéré :

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Les segments Docker de publication actuels sont `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` à `plugins-runtime-install-h`, ainsi que `openwebui`. `package-update-openai` inclut la lane live du package du Plugin Codex, qui installe le package OpenClaw candidat, installe le Plugin Codex depuis `codex_plugin_spec` ou une archive tar de la même référence avec une approbation explicite de l'installation de la CLI Codex, exécute le contrôle préalable de la CLI Codex, puis exécute plusieurs tours d'agent OpenClaw dans la même session avec OpenAI. `plugins-runtime-core`, `plugins-runtime` et `plugins-integrations` restent des alias agrégés de plugins/runtime. L'alias de lane `install-e2e` reste l'alias agrégé de réexécution manuelle pour les deux lanes d'installation de fournisseurs.

OpenWebUI s'exécute comme un segment `openwebui` autonome sur un exécuteur Blacksmith dédié disposant d'un disque de grande capacité chaque fois que la couverture stable ou complète du chemin de publication le demande, même lorsque le workflow réutilisable achemine les tâches prises en charge vers des exécuteurs hébergés par GitHub. Le fait de séparer l'extraction de l'image externe empêche la grande image d'entrer en concurrence avec les images partagées de package et de plugins dans `plugins-runtime-services` ; les anciens segments agrégés de plugins/runtime incluent toujours OpenWebUI pour permettre des réexécutions manuelles compatibles. Les lanes de mise à jour des canaux intégrés effectuent une nouvelle tentative en cas d'échecs réseau npm transitoires.

Chaque segment téléverse `.artifacts/docker-tests/` avec les journaux des lanes, les durées, `summary.json`, `failures.json`, les durées des phases, le JSON du plan du planificateur, les tableaux des lanes lentes et les commandes de réexécution propres à chaque lane. L'entrée `docker_lanes` du workflow exécute les lanes sélectionnées avec les images préparées pour cette exécution plutôt qu'avec les tâches segmentées, ce qui limite le débogage d'une lane en échec à une seule tâche Docker ciblée ; si une lane sélectionnée est une lane Docker live, la tâche ciblée construit localement l'image de test live pour cette réexécution. L'assistant de réexécution valide le SHA cible exact sélectionné dans l'artefact d'échec et le déclenchement manuel recrée le package de cette référence, car le tuple de package interne du workflow réutilisable ne fait pas partie du schéma `workflow_dispatch`. Les commandes générées incluent les entrées d'images préparées et `shared_image_policy=existing-only` uniquement lorsque ces entrées reposent sur GHCR ; les étiquettes d'artefacts locales à l'exécuteur sont omises afin qu'un nouvel exécuteur les reconstruise. Une substitution explicite de la cible supprime les références d'images GHCR récupérées, sauf si l'artefact prouve qu'elles correspondent à la substitution. Les références de définition du workflow générées depuis les artefacts sont également omises, car les branches temporaires de publication complète sont supprimées ; le déclenchement utilise la branche par défaut du dépôt, sauf si l'opérateur la remplace explicitement.

```bash
pnpm test:docker:rerun <run-id>      # télécharger les artefacts Docker et afficher les commandes de réexécution ciblées combinées/par lane
pnpm test:docker:timings <summary>   # résumés des lanes lentes et du chemin critique des phases
```

Le workflow live/E2E planifié exécute quotidiennement la suite Docker complète du chemin de publication et, après sa réussite, appelle l'éditeur explicite pour les artefacts d'images exacts ayant été testés.

## Préversion des plugins

`Plugin Prerelease` offre une couverture produit/package plus coûteuse ; il s'agit donc d'un workflow distinct déclenché par `Full Release Validation` ou explicitement par un opérateur. Les demandes d'extraction normales, les poussées vers `main` et les déclenchements manuels autonomes de la CI n'exécutent pas cette suite. Il répartit les tests des plugins intégrés entre huit workers d'extensions ; ces tâches de partitionnement des extensions exécutent simultanément jusqu'à deux groupes de configuration de plugins, avec un worker Vitest par groupe et un tas Node plus grand, afin que les lots de plugins nécessitant de nombreuses importations ne créent pas de tâches de CI supplémentaires. Le chemin Docker de préversion réservé aux publications (activé par l'entrée `full_release_validation`) regroupe les lanes Docker ciblées par quatre pour éviter de réserver des dizaines d'exécuteurs à des tâches d'une à trois minutes. Le workflow téléverse également un artefact informatif `plugin-inspector-advisory` provenant de `@openclaw/plugin-inspector` ; les constats de l'inspecteur servent d'éléments de triage et ne modifient pas le contrôle bloquant Plugin Prerelease.

## Laboratoire d'assurance qualité

Le laboratoire d'assurance qualité dispose de lanes de CI dédiées en dehors du workflow principal à portée intelligente. La parité agentique est imbriquée dans les vastes harnais d'assurance qualité et de publication, et ne constitue pas un workflow autonome pour les demandes d'extraction. Utilisez `Full Release Validation` avec `rerun_group=qa-parity` lorsque la parité doit accompagner une exécution de validation étendue.

- Le workflow `QA-Lab - All Lanes` s'exécute chaque nuit sur `main` et lors d'un déclenchement manuel ; il répartit la lane de parité simulée, la lane Matrix live ainsi que les lanes Telegram et Discord live en tâches parallèles. Les tâches live utilisent l'environnement `qa-live-shared`, tandis que Telegram/Discord utilisent des baux Convex.

Les vérifications de publication exécutent les lanes de transport live Matrix et Telegram avec le fournisseur simulé déterministe et des modèles qualifiés de simulés (`mock-openai/gpt-5.6-luna` et `mock-openai/gpt-5.6-luna-alt`), afin d'isoler le contrat du canal de la latence des modèles live et du démarrage normal des plugins de fournisseurs. Le Gateway de transport live désactive la recherche en mémoire, car la parité d'assurance qualité couvre séparément le comportement de la mémoire ; la connectivité des fournisseurs est couverte par les suites distinctes de modèles live, de fournisseurs natifs et de fournisseurs Docker.

Matrix utilise `--profile fast` pour les contrôles planifiés et de publication, en ajoutant `--fail-fast` uniquement lorsque la CLI extraite le prend en charge. La valeur par défaut de la CLI et l’entrée du workflow manuel restent `all` ; un déclenchement manuel avec `matrix_profile=all` répartit toujours la couverture Matrix complète entre les tâches `transport`, `media`, `e2ee-smoke`, `e2ee-deep` et `e2ee-cli`.

`OpenClaw Release Checks` exécute également les voies QA Lab critiques pour la publication avant son approbation ; son contrôle de parité QA exécute les ensembles candidat et de référence sous forme de tâches de voies parallèles, puis télécharge les deux artefacts dans une petite tâche de rapport pour la comparaison de parité finale.

Pour les PR normales, suivez les preuves ciblées des contrôles et de la CI au lieu de considérer la parité comme un statut obligatoire.

## CodeQL

Le workflow `CodeQL` est volontairement un analyseur de sécurité initial à périmètre restreint, et non une analyse complète du dépôt. Chaque jour, ainsi que lors des exécutions manuelles, des poussées vers `main` et des contrôles de demandes de tirage qui ne sont pas des brouillons, il analyse le code des workflows Actions ainsi que les surfaces JavaScript/TypeScript présentant les risques les plus élevés, au moyen de requêtes de sécurité à haut niveau de confiance filtrées sur une `security-severity` élevée ou critique.

Le contrôle des demandes de tirage reste léger : il ne démarre que pour les modifications sous `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` ou dans les chemins d’exécution des plugins intégrés qui gèrent des processus, et il exécute la même matrice de sécurité à haut niveau de confiance que le workflow planifié. CodeQL pour Android et macOS reste exclu des contrôles par défaut des PR.

### Catégories de sécurité

| Catégorie                                         | Surface                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentification, secrets, bac à sable, cron et référence du Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contrats d’implémentation des canaux du cœur, ainsi que leur environnement d’exécution de Plugin, le Gateway, le SDK de Plugin, les secrets et les points de contact d’audit |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF du cœur, analyse des adresses IP, protection réseau, récupération web et surfaces de politique SSRF du SDK de Plugin                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serveurs MCP, assistants d’exécution de processus, livraison sortante et contrôles d’exécution des outils des agents                              |
| `/codeql-security-high/process-exec-boundary`     | Shell local, assistants de création de processus, environnements d’exécution de plugins intégrés gérant des sous-processus et code de liaison des scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Surfaces de confiance pour l’installation, le chargeur, le manifeste et le registre des Plugins, l’installation par le gestionnaire de paquets, le chargement des sources et le contrat de paquet du SDK de Plugin |

### Segments de sécurité propres aux plateformes

- `CodeQL Android Critical Security` — segment de sécurité Android planifié. Compile manuellement l’application Android pour CodeQL sur le plus petit exécuteur Linux Blacksmith accepté par la validation du workflow. Téléverse les résultats sous `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — segment de sécurité macOS hebdomadaire/manuel. Compile manuellement l’application macOS pour CodeQL sur Blacksmith macOS, exclut des fichiers SARIF téléversés les résultats de compilation des dépendances et les téléverse sous `/codeql-critical-security/macos`. Il reste exclu des exécutions quotidiennes par défaut, car la compilation macOS domine la durée d’exécution même en l’absence de problème.

### Catégories de qualité critiques

`CodeQL Critical Quality` est le segment hors sécurité correspondant. Il exécute uniquement des requêtes de qualité JavaScript/TypeScript hors sécurité et de niveau d’erreur sur des surfaces restreintes à forte valeur ajoutée, au moyen d’exécuteurs Linux hébergés par GitHub, afin que les analyses de qualité ne consomment pas le budget d’enregistrement des exécuteurs Blacksmith. Son contrôle des demandes de tirage est volontairement plus réduit que le profil planifié : les PR qui ne sont pas des brouillons exécutent uniquement les segments correspondant aux surfaces qu’elles touchent, parmi treize segments pouvant être sélectionnés pour les PR — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` et `session-diagnostics-boundary`. `ui-control-plane` et `web-media-runtime-boundary` restent exclus des exécutions de PR. Les modifications apportées à la configuration CodeQL et au workflow de qualité exécutent l’ensemble complet des segments de PR (le segment d’exécution réseau est déclenché par ses propres fichiers de configuration CodeQL et les chemins sources gérant le réseau).

Le déclenchement manuel accepte :

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Les profils restreints servent de points d’entrée pédagogiques et d’itération pour exécuter un seul segment de qualité de manière isolée.

| Catégorie                                               | Surface                                                                                                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code de la frontière de sécurité pour l’authentification, les secrets, le bac à sable, Cron et le Gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Contrats de schéma de configuration, de migration, de normalisation et d’E/S                                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schémas du protocole Gateway et contrats des méthodes du serveur                                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contrats d’implémentation des canaux du cœur et des plugins de canal intégrés                                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contrats d’exécution des commandes, de distribution des modèles/fournisseurs, de distribution et des files d’attente des réponses automatiques, ainsi que du plan de contrôle ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serveurs MCP et passerelles d’outils, assistants de supervision des processus et contrats de distribution sortante                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de l’hôte de mémoire, façades d’exécution de la mémoire, alias du Plugin SDK pour la mémoire, logique de liaison pour l’activation de l’exécution de la mémoire et commandes de diagnostic de mémoire |
| `/codeql-critical-quality/network-runtime-boundary`     | Paquet de politiques réseau, exécution des sockets bruts et de la capture de proxy, tunnel SSH, verrou du Gateway, socket JSONL et surfaces de transport push                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Composants internes des files de réponses, files de distribution de session, assistants de liaison/distribution des sessions sortantes, surfaces des lots d’événements/journaux de diagnostic et contrats de la CLI de diagnostic des sessions |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribution des réponses entrantes du Plugin SDK, assistants pour les charges utiles, le découpage et l’exécution des réponses, options de réponse des canaux, files de distribution et assistants de liaison des sessions/fils |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisation du catalogue de modèles, authentification et découverte des fournisseurs, enregistrement de l’exécution des fournisseurs, valeurs par défaut/catalogues des fournisseurs et registres web/recherche/récupération/plongements |
| `/codeql-critical-quality/ui-control-plane`             | Amorçage de l’interface de contrôle, persistance locale, flux de contrôle du Gateway et contrats d’exécution du plan de contrôle des tâches                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contrats d’exécution pour la récupération/recherche web du cœur, les E/S multimédias, la compréhension des médias, la génération d’images et la génération de médias                                   |
| `/codeql-critical-quality/plugin-boundary`              | Contrats du chargeur, du registre, de la surface publique et des points d’entrée du Plugin SDK                                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Source publiée du Plugin SDK côté paquet et assistants de contrat des paquets de plugins                                                                                                                |

La qualité reste séparée de la sécurité afin que les résultats relatifs à la qualité puissent être planifiés, mesurés, désactivés ou étendus sans masquer le signal de sécurité. L’extension de CodeQL à Swift, Python et aux plugins intégrés ne doit être réintroduite sous forme de travaux de suivi ciblés ou fragmentés qu’une fois que les profils restreints disposent d’une exécution et d’un signal stables.

## Flux de maintenance

### Agent de documentation

Le flux de travail `Docs Agent` est une voie de maintenance Codex pilotée par les événements qui maintient la documentation existante en phase avec les modifications récemment intégrées. Il n’a pas de planification propre : une exécution CI réussie, déclenchée par un push non automatisé sur `main`, peut le lancer, tout comme un déclenchement manuel direct. Les invocations par exécution de flux de travail sont ignorées si `main` a progressé ou si une autre exécution non ignorée de Docs Agent a été créée au cours de la dernière heure. Lorsqu’il s’exécute, il examine la plage de commits comprise entre le SHA source de la précédente exécution non ignorée de Docs Agent et l’état actuel de `main`, de sorte qu’une exécution horaire peut couvrir toutes les modifications de la branche principale accumulées depuis le dernier passage sur la documentation.

### Agent de performance des tests

Le flux de travail `Test Performance Agent` est une voie de maintenance Codex pilotée par les événements pour les tests lents. Il n’a pas de planification propre : une exécution CI réussie, déclenchée par un push non automatisé sur `main`, peut le lancer, mais il est ignoré si une autre invocation par exécution de flux de travail a déjà été exécutée ou est en cours ce même jour UTC. Le déclenchement manuel contourne cette limite d’activité quotidienne. Cette voie génère un rapport groupé de performance Vitest pour la suite complète, autorise Codex à n’apporter que de petites corrections de performance des tests préservant la couverture plutôt que de vastes refactorisations, puis exécute à nouveau le rapport de la suite complète et rejette les modifications qui réduisent le nombre de tests réussis de référence. Le rapport groupé enregistre le temps écoulé et le RSS maximal par configuration sous Linux et macOS, afin que la comparaison avant/après expose les écarts de mémoire des tests à côté des écarts de durée. Si la référence comporte des tests en échec, Codex ne peut corriger que les échecs évidents, et le rapport de la suite complète après intervention de l’agent doit réussir avant tout commit. Lorsque `main` progresse avant que le push du bot ne soit intégré, cette voie rebase le correctif validé, réexécute `pnpm check:changed` et retente le push ; les correctifs obsolètes présentant des conflits sont ignorés. Elle utilise Ubuntu hébergé par GitHub afin que l’action Codex conserve la même posture de sécurité avec suppression de sudo que l’agent de documentation.

### PR en double après fusion

Le flux de travail `Duplicate PRs After Merge` est un flux manuel destiné aux mainteneurs pour nettoyer les doublons après intégration. Par défaut, il effectue une simulation et ne ferme que les PR explicitement répertoriées lorsque `apply=true`. Avant de modifier GitHub, il vérifie que la PR intégrée a été fusionnée et que chaque doublon présente soit un ticket référencé en commun, soit des blocs de modifications qui se chevauchent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barrières de vérification locales et routage des modifications

La logique locale des voies modifiées se trouve dans `scripts/changed-lanes.mjs` et est exécutée par `scripts/check-changed.mjs`. Cette barrière de vérification locale est plus stricte concernant les frontières architecturales que la vaste portée de la plateforme CI :

- les modifications du code de production du cœur exécutent la vérification des types de la production et des tests du cœur, ainsi que le lint et les garde-fous du cœur ;
- les modifications limitées aux tests du cœur exécutent uniquement la vérification des types des tests du cœur et le lint du cœur ;
- les modifications du code de production des extensions exécutent la vérification des types de la production et des tests des extensions, ainsi que leur lint ;
- les modifications limitées aux tests des extensions exécutent la vérification des types des tests des extensions et leur lint ;
- les modifications du Plugin SDK public ou des contrats de plugins étendent la vérification des types aux extensions, car celles-ci dépendent de ces contrats du cœur (les balayages Vitest des extensions restent des travaux de test explicites) ;
- les incréments de version limités aux métadonnées de publication exécutent des vérifications ciblées des versions, de la configuration et des dépendances racine ;
- les modifications inconnues de la racine ou de la configuration échouent de manière sûre vers toutes les voies de vérification.

Le routage local des tests modifiés se trouve dans `scripts/test-projects.test-support.mjs` et est volontairement moins coûteux que `check:changed` : les modifications directes de tests exécutent ces tests, tandis que les modifications des sources privilégient les correspondances explicites, puis les tests voisins et les dépendants du graphe d’importation. La configuration partagée de distribution des salons de groupe fait partie des correspondances explicites : les modifications de la configuration des réponses visibles du groupe, du mode de distribution des réponses sources ou de l’invite système de l’outil de messagerie sont routées vers les tests de réponse du cœur ainsi que vers les régressions de distribution Discord et Slack, afin qu’une modification d’une valeur par défaut partagée échoue avant le premier push de la PR. Utilisez `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` uniquement lorsque la modification affecte suffisamment l’ensemble de l’infrastructure de test pour que l’ensemble mappé économique ne constitue pas un indicateur fiable.

## Validation Testbox

Crabbox est l’enveloppe de boîtes distantes propre au dépôt pour les preuves Linux des mainteneurs. Les sessions
d’agent l’utilisent par défaut pour les tests et les travaux nécessitant beaucoup de calcul,
notamment les builds, les vérifications de types, la distribution du lint, Docker, les voies de
paquets, les E2E, les preuves en conditions réelles et la parité avec la CI. Le code de mainteneur
fiable utilise par défaut `blacksmith-testbox`, qui est désormais également la valeur par défaut
de `.crabbox.yaml`. Son flux de travail configuré hydrate les identifiants des fournisseurs et
des agents ; le code non fiable issu d’un contributeur ou d’un fork doit donc utiliser la CI sans
secret du fork ou un Crabbox AWS direct assaini. Les exécutions AWS assainies définissent
`CRABBOX_ENV_ALLOW=CI`, transmettent `--no-hydrate` et utilisent un `HOME` distant temporaire
et neuf ; cela empêche la liste d’autorisation `OPENCLAW_*` du dépôt et les profils
d’authentification existants d’atteindre le code non fiable. Elles utilisent un bail nouvellement
préparé, dédié à cette source non fiable, jamais un bail fiable ou précédemment hydraté. Lancez
un binaire Crabbox fiable installé depuis un checkout propre et fiable de `main`, puis récupérez
uniquement la PR distante avec `--fresh-pr` ; n’exécutez jamais localement l’enveloppe ou la
configuration du checkout non fiable. Désactivez `CRABBOX_AWS_INSTANCE_PROFILE` et échouez
de manière sûre sauf si la valeur résolue de `aws.instanceProfile` est vide. Avant toute
installation ou tout test, utilisez des outils fiables à chemin absolu pour exiger un jeton
IMDSv2, prouver que le point de terminaison des identifiants IAM renvoie 404 et comparer la
sortie distante de `git rev-parse HEAD` au SHA complet de la tête de PR examinée. Liez le bail
à ce SHA, puis arrêtez-le et préparez-en un nouveau si la tête change. Téléversez le script
fiable `scripts/crabbox-untrusted-bootstrap.sh` depuis un `main` propre avec `--fresh-pr` ;
il installe les versions épinglées de Node/pnpm, vérifie le SHA et l’épinglage du gestionnaire
de paquets, isole `HOME`, installe les dépendances, puis exécute le test demandé.
Désactivez toutes les substitutions `CRABBOX_TAILSCALE*`, imposez `--network public
--tailscale=false`, effacez les options de nœud de sortie/LAN et exigez que `crabbox inspect`
indique un réseau public sans état Tailscale avant de téléverser un quelconque script.
La capacité AWS/Hetzner détenue reste également la solution de repli en cas de panne de
Blacksmith, de problème de quota ou de test explicite sur une capacité détenue.

Au début d’une tâche de code fiable susceptible de nécessiter des tests ou des preuves
lourdes, les agents doivent lancer immédiatement la préparation dans une session de commande
en arrière-plan, poursuivre l’inspection et les modifications pendant l’hydratation, réutiliser
l’identifiant `tbx_...` renvoyé, synchroniser le checkout actuel à chaque exécution et arrêter
la boîte avant le transfert :

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Les exécutions Blacksmith basées sur Crabbox préparent, revendiquent, synchronisent, exécutent,
génèrent un rapport et nettoient des Testboxes à usage unique. La vérification d’intégrité de
synchronisation intégrée échoue rapidement lorsque `git status --short` sur la boîte synchronisée
affiche au moins 200 suppressions de fichiers suivis, ce qui permet de détecter la disparition de
fichiers racine tels que `pnpm-lock.yaml`. Pour les PR qui suppriment volontairement un grand
nombre de fichiers, définissez `CRABBOX_ALLOW_MASS_DELETIONS=1` pour la commande distante.

Crabbox met également fin à une invocation locale de la CLI Blacksmith qui reste dans la phase
de synchronisation pendant plus de cinq minutes sans sortie postérieure à la synchronisation.
Définissez `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` pour désactiver ce garde-fou, ou utilisez une
valeur en millisecondes plus élevée pour les différences locales inhabituellement volumineuses.

Avant une première exécution, vérifiez l’enveloppe depuis la racine du dépôt :

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

L’enveloppe du dépôt refuse un binaire Crabbox obsolète qui n’annonce pas le fournisseur sélectionné, et les exécutions reposant sur Blacksmith nécessitent Crabbox 0.22.0 ou une version ultérieure afin que l’enveloppe bénéficie du comportement actuel de synchronisation, de mise en file d’attente et de nettoyage de Testbox. Dans les worktrees Codex ou les checkouts liés/partiels, évitez le script local `pnpm crabbox:run`, car pnpm peut réconcilier les dépendances avant le démarrage de Crabbox ; invoquez plutôt directement l’enveloppe Node :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Lorsque vous utilisez le checkout voisin, reconstruisez le binaire local ignoré avant tout travail de mesure ou de preuve :

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Le bloc `blacksmith:` dans `.crabbox.yaml` fixe déjà les valeurs par défaut de l’organisation, du workflow, de la tâche et de la référence ; les options explicites ci-dessous sont donc facultatives. Contrôle des modifications :

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
  "corepack pnpm check:changed"
```

Réexécution d’un test ciblé :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite complète :

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lisez le récapitulatif JSON final. Les champs utiles sont `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` et `totalMs`. Pour les exécutions
Blacksmith Testbox déléguées, le code de sortie du wrapper Crabbox et le
récapitulatif JSON constituent le résultat de la commande. L’exécution GitHub
Actions associée gère l’hydratation et le maintien en vie ; elle peut se terminer
avec l’état `cancelled` lorsque la Testbox est arrêtée de l’extérieur après que
la commande SSH a déjà renvoyé son résultat. Considérez cela comme un artefact
de nettoyage ou d’état, sauf si la valeur `exitCode` du wrapper est différente
de zéro ou si la sortie de la commande indique l’échec d’un test. Les exécutions
Crabbox ponctuelles reposant sur Blacksmith doivent arrêter automatiquement la
Testbox ; si une exécution est interrompue ou si le nettoyage n’est pas clair,
inspectez les machines actives et arrêtez uniquement celles que vous avez créées :

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

N’utilisez la réutilisation que lorsque vous avez délibérément besoin d’exécuter plusieurs commandes sur la même machine hydratée :

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Réutilisez le bail, pas un code source obsolète. Omettez `--no-sync` afin que
chaque exécution téléverse l’arborescence de travail actuelle ; utilisez cette
option uniquement pour réexécuter intentionnellement une arborescence inchangée
et déjà synchronisée. Le code non fiable provenant d’un contributeur ou d’un
fork doit utiliser `CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` et un
`HOME` distant temporaire neuf pour chaque commande ; installez les dépendances
dans cette commande assainie avant d’effectuer les tests. Réutilisez uniquement
un bail nouvellement préparé et dédié à la même source non fiable, jamais un
bail fiable ou précédemment hydraté. N’exécutez jamais localement le wrapper ou
la configuration de l’arborescence non fiable : lancez le binaire Crabbox fiable
installé depuis une branche `main` fiable et propre, puis transmettez
`--fresh-pr` à chaque exécution. Laissez `CRABBOX_AWS_INSTANCE_PROFILE` non
défini, refusez tout profil d’instance résolu non vide, exigez sur l’hôte distant
fiable une preuve IMDS de l’absence de rôle et vérifiez le SHA de tête examiné
avant l’installation et les tests. Liez le bail à ce SHA ; arrêtez-le et
préparez-en un nouveau après toute modification de la tête. S’il n’existe aucune
PR distante, utilisez la CI du fork sans secrets. Ne sélectionnez jamais
`hydrate-github` ni le workflow Blacksmith hydraté avec des identifiants pour
une source non fiable.

Si Crabbox constitue la couche défaillante alors que Blacksmith fonctionne,
utilisez directement Blacksmith uniquement pour des diagnostics tels que
`list`, `status` et le nettoyage. Corrigez le chemin Crabbox avant de considérer
une exécution directe de Blacksmith comme une preuve de mainteneur.

Si `blacksmith testbox list --all` et `blacksmith testbox status` fonctionnent,
mais que les nouvelles préparations restent dans l’état `queued` sans adresse
IP ni URL d’exécution Actions après quelques minutes, considérez qu’il s’agit
d’une pression liée au fournisseur Blacksmith, à la file d’attente, à la
facturation ou aux limites de l’organisation. Arrêtez les identifiants en attente
que vous avez créés, évitez de démarrer d’autres Testbox et transférez la
validation vers le chemin de capacité Crabbox détenu ci-dessous pendant qu’une
personne vérifie le tableau de bord Blacksmith, la facturation et les limites de
l’organisation.

Ne passez à la capacité Crabbox détenue que lorsque Blacksmith est indisponible, limité par les quotas, dépourvu de l’environnement nécessaire ou lorsque l’utilisation de la capacité détenue constitue explicitement l’objectif :

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

En cas de pression sur AWS, évitez `class=beast` sauf si la tâche nécessite
réellement un processeur de classe 48xlarge. Une demande `beast` démarre à
192 vCPU et constitue le moyen le plus simple d’atteindre le quota régional
EC2 Spot ou On-Demand Standard. Le fichier `.crabbox.yaml` détenu par le dépôt
utilise par défaut `class: standard`, le marché à la demande et
`capacity.hints: true`, afin que les baux AWS négociés affichent la région et le
marché sélectionnés, la pression sur les quotas, le repli sur Spot et les
avertissements relatifs aux classes soumises à une forte pression. Utilisez
`fast` pour les contrôles généraux plus lourds, `large` uniquement lorsque
standard ou fast ne suffisent pas, et `beast` uniquement pour des voies
exceptionnelles limitées par le processeur, telles que la suite complète ou les
matrices Docker de tous les plugins, une validation explicite de version ou de
blocage, ou un profilage des performances nécessitant beaucoup de cœurs.
N’utilisez pas `beast` pour `pnpm check:changed`, les tests ciblés, les travaux
portant uniquement sur la documentation, les vérifications ordinaires de lint
ou de types, les petites reproductions E2E ou le diagnostic d’une panne de
Blacksmith. Utilisez `--market on-demand` pour diagnostiquer la capacité afin de
ne pas mélanger les fluctuations du marché Spot avec le signal.

`.crabbox.yaml` définit les valeurs par défaut du fournisseur, de la
synchronisation et de l’hydratation GitHub Actions. La synchronisation Crabbox
ne transfère jamais `.git` ; l’arborescence Actions hydratée conserve donc ses
propres métadonnées Git distantes au lieu de synchroniser les dépôts distants et
les magasins d’objets locaux du mainteneur. La configuration du dépôt exclut en
outre les artefacts locaux d’exécution et de compilation, tels que `.artifacts`
et les rapports de test, qui ne doivent jamais être transférés.
`.github/workflows/crabbox-hydrate.yml` gère l’extraction, la configuration de
Node/pnpm, la récupération de `origin/main` et la transmission de
l’environnement sans secrets pour les commandes de cloud détenu
`crabbox run --id <cbx_id>`.

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Canaux de développement](/fr/install/development-channels)

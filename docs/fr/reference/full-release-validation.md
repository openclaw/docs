---
read_when:
    - Exécution ou réexécution de la validation complète de la version publiée
    - Comparaison des profils de validation des versions stables et complètes
    - Débogage des échecs lors de l’étape de validation de la version publiée
summary: Étapes de validation complète de la version, workflows enfants, profils de version, mécanismes de réexécution et éléments de preuve
title: Validation complète de la version publiée
x-i18n:
    generated_at: "2026-07-12T03:03:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le processus global de validation de version : le point d’entrée manuel unique
pour les preuves avant publication. La majeure partie du travail s’effectue dans des workflows enfants afin qu’un environnement en échec puisse
être réexécuté sans relancer toute la publication.

Exécutez-le depuis une référence de workflow approuvée, généralement `main`, et transmettez la branche de publication,
le tag ou le SHA complet du commit via `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` accepte également `anthropic` ou `minimax` pour l’intégration multiplateforme et le
tour d’agent de bout en bout. Les tâches enfants réutilisables résolvent le harnais du workflow appelé
à partir de `job.workflow_repository` et `job.workflow_sha`, tandis que l’entrée `ref`
sélectionne le candidat testé. Cela permet de conserver la logique actuelle de validation approuvée
lors de la validation d’une branche de publication ou d’un tag plus ancien.

Chaque enfant lancé doit signaler le même SHA de workflow que l’exécution parente
`Full Release Validation`. Si `main` évolue entre les lancements du parent et des enfants,
le processus global échoue de manière sécurisée, même si l’enfant lui-même réussit. Pour
une preuve immuable portant sur un commit exact, utilisez
`pnpm ci:full-release --sha <target-sha>`. L’utilitaire crée une référence temporaire
`release-ci/*` épinglée sur la version approuvée actuelle de `origin/main`, transmet le SHA cible
uniquement comme `ref` du candidat, réutilise les preuves strictes correspondant exactement à la cible lorsqu’elles sont
disponibles, puis supprime la référence après la validation. Transmettez
`-f reuse_evidence=false` pour forcer une nouvelle exécution ou
`--workflow-sha <trusted-main-sha>` pour sélectionner un commit de workflow plus ancien encore
accessible depuis la version actuelle de `origin/main`. Le workflow ne crée ni ne met à jour
lui-même les références du dépôt.

`release_profile=stable` et `release_profile=full` exécutent toujours le test prolongé exhaustif
en conditions réelles/Docker. Transmettez `run_release_soak=true` pour inclure les mêmes couloirs de test prolongé
avec le profil `beta`. La publication stable rejette tout manifeste de validation
dépourvu de ce test prolongé et de preuves bloquantes sur les performances du produit.

Package Acceptance construit normalement l’archive tar du candidat à partir de la
`ref` résolue, y compris pour les exécutions portant sur un SHA complet lancées avec `pnpm ci:full-release`. Après une
publication bêta, transmettez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` afin de réutiliser
le paquet npm publié pour les vérifications de publication, Package Acceptance, les tests multiplateformes,
le parcours de publication Docker et Telegram avec le paquet. Utilisez `package_acceptance_package_spec`
uniquement lorsque Package Acceptance doit intentionnellement valider un autre paquet.
Le couloir du paquet actif du Plugin Codex suit le même état : les valeurs publiées de
`release_package_spec` produisent `codex_plugin_spec=npm:@openclaw/codex@<version>` ;
les exécutions basées sur un SHA ou un artefact empaquettent `extensions/codex` depuis la référence sélectionnée ; et les opérateurs
peuvent définir directement `codex_plugin_spec` pour des sources de Plugin
`npm:`, `npm-pack:` ou `git:`. Le couloir accorde l’autorisation explicite d’installation de la CLI Codex requise par
ce Plugin, puis exécute les contrôles préalables de la CLI Codex et les tours d’agent OpenAI dans la même session.

## Étapes de premier niveau

Pour `rerun_group=all`, une tâche `Check for reusable validation evidence` s’exécute
en premier : elle recherche la validation complète réussie antérieure la plus récente pour exactement le même
SHA cible, profil de publication, réglage effectif du test prolongé et mêmes entrées de validation.
Lorsque de telles preuves existent, chaque couloir est ignoré et le vérificateur global
revérifie l’artefact parent immuable, les exécutions enfants et les journaux de lancement. Cela sert
uniquement à reprendre une réexécution du même candidat ; cela n’autorise pas la réutilisation entre différents SHA. Pour
un candidat modifié, réexécutez chaque contrôle de paquet, d’artefact, d’installation, de Docker ou de fournisseur
affecté par cette différence. Transmettez `reuse_evidence=false` pour forcer une nouvelle exécution complète.
La réutilisation des preuves ne s’effectue que depuis `main` ou une référence canonique
`release-ci/*` épinglée sur un SHA dont le commit de workflow appartient toujours à la lignée approuvée de `main` ;
les autres références de workflow exécutent à nouveau les couloirs sélectionnés.

Également pour `rerun_group=all`, une tâche `Verify Docker runtime image assets` construit
la cible Docker `runtime-assets` avec
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Elle s’exécute en parallèle avec les
autres étapes et son résultat est imposé par le vérificateur global ; les couloirs n’attendent plus
sa fin avant d’être lancés. Un `rerun_group` plus restreint ignore ce contrôle préalable.

| Étape                         | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible        | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de publication, le tag ou le SHA complet du commit et consigne les entrées sélectionnées.<br />**Réexécution :** réexécutez le processus global en cas d’échec.                                                                                                                                                                                                                                                                                                |
| Contrôle préalable des ressources Docker | **Tâche :** `Verify Docker runtime image assets`<br />**Workflow enfant :** aucun<br />**Prouve :** la construction de la cible Docker `runtime-assets` réussit toujours avant le lancement de toute autre étape. S’exécute uniquement avec `rerun_group=all`.<br />**Réexécution :** réexécutez le processus global avec `rerun_group=all`.                                                                                                                                                                                                                        |
| Vitest et CI normale          | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** le graphe complet de CI lancé manuellement sur la référence cible, y compris les couloirs Linux Node, les fragments de Plugins intégrés, les fragments de contrats de Plugins et de canaux, la compatibilité avec Node 22, `check-*`, `check-additional-*`, les tests rapides des artefacts construits, les vérifications de documentation, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le processus global.<br />**Réexécution :** `rerun_group=ci`. |
| Prépublication des Plugins    | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** les vérifications statiques de Plugins propres à la publication, la couverture agentique des Plugins, l’intégralité des fragments de lots de Plugins, les couloirs Docker de prépublication des Plugins et un artefact non bloquant `plugin-inspector-advisory` pour le triage de compatibilité.<br />**Réexécution :** `rerun_group=plugin-prerelease`.                                                                                                           |
| Vérifications de publication  | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** le test rapide d’installation, les vérifications multiplateformes du paquet, Package Acceptance, la parité de QA Lab, Matrix en conditions réelles et Telegram en conditions réelles. Les profils stable et complet exécutent également les suites exhaustives en conditions réelles/de bout en bout et les segments du parcours de publication Docker ; la bêta peut les activer avec `run_release_soak=true`.<br />**Réexécution :** `rerun_group=release-checks` ou un identifiant de vérification de publication plus restreint. |
| Telegram avec le paquet       | **Tâche :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** un test Telegram de bout en bout ciblé sur le paquet publié lorsque `release_package_spec` ou `npm_telegram_package_spec` est défini. La validation complète du candidat utilise plutôt le test Telegram de bout en bout canonique de Package Acceptance.<br />**Réexécution :** `rerun_group=npm-telegram` avec `release_package_spec` ou `npm_telegram_package_spec`.                                                                 |
| Performances du produit       | **Tâche :** `Run product performance evidence`<br />**Workflow enfant :** `OpenClaw Performance`<br />**Prouve :** une exécution des performances selon le profil de publication (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) sur le SHA cible. La sortie Kova reste dans les artefacts du workflow et l’enfant doit prouver que la publication de son rapport a été ignorée. Requis et bloquant uniquement pour `rerun_group=all` ou `rerun_group=performance` ; non requis pour les groupes de réexécution plus restreints.<br />**Réexécution :** `rerun_group=performance`. |
| Vérificateur global           | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions consignées des exécutions enfants et ajoute les tableaux des tâches les plus lentes issus des workflows enfants.<br />**Réexécution :** réexécutez uniquement cette tâche après avoir réexécuté avec succès un enfant en échec.                                                                                                                                                                                                                                                              |

Le processus global lance toujours les performances du produit en mode artefact uniquement.
`OpenClaw Performance` n’autorise la publication des rapports que pour les exécutions planifiées ou un
lancement manuel définissant explicitement `publish_reports=true`. Le contrôle du mode artefact uniquement
doit réussir, prouvant que la tâche de publication est restée ignorée.
Les preuves nouvelles et réutilisées enregistrent
`controls.performanceReportPublication=artifact-only` ; le vérificateur et le sélecteur de réutilisation
rejettent les preuves qui ne contiennent pas la preuve normalisée correspondante de l’enfant chargé des performances.

Le vérificateur téléverse le manifeste canonique sous le nom
`full-release-validation-<run-id>-<run-attempt>`. Les outils de gestion des preuves valident
l’identifiant de son artefact, son condensat, l’exécution productrice et la tentative avant de télécharger cet
identifiant d’artefact exact. Ils plafonnent la taille du ZIP téléchargé, vérifient ses octets à l’aide du condensat REST
`sha256:` et diffusent en continu la seule entrée de manifeste bornée autorisée sans
extraire l’archive. Un alias au nom stable est temporairement conservé pour les anciens
consommateurs de publication. Le vérificateur privilégie toujours l’artefact qualifié par la tentative ;
pendant la transition, il n’accepte le nom stable que pour un producteur de manifeste v2 à la tentative 1.
Il rejette cet ancien nom pour les tentatives ultérieures et pour le manifeste v3.

Pour `ref=main` avec `rerun_group=all`, pour les références `release/*`
et pour les références alpha de Tideclaw, une nouvelle exécution globale remplace une exécution plus ancienne
ayant la même référence et le même groupe de réexécution. Lorsque le parent est annulé, son moniteur annule tous les
workflows enfants qu’il a déjà lancés. Les exécutions de validation épinglées sur un tag ou un SHA
ne s’annulent pas entre elles.

## Étapes des vérifications de publication

`OpenClaw Release Checks` est le workflow enfant le plus volumineux. Il résout la cible
une seule fois et prépare un artefact partagé `release-package-under-test` lorsque les étapes
liées au paquet ou à Docker en ont besoin.

| Étape                    | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de publication     | **Tâche :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de réexécution et filtre ciblé de suite en conditions réelles.<br />**Réexécution :** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                |
| Artefact de paquet       | **Tâche :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** crée ou résout une archive tar candidate et téléverse `release-package-under-test` pour les vérifications ultérieures portant sur le paquet.<br />**Réexécution :** groupe concerné du paquet, multiplateforme ou en conditions réelles/E2E.                                                                                                                                                                                                                                      |
| Test rapide d’installation | **Tâche :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** parcours d’installation complet avec réutilisation de l’image de test rapide du Dockerfile racine, installation du paquet QR, tests rapides Docker de la racine et du Gateway, tests Docker du programme d’installation et test rapide du fournisseur d’images avec installation globale par Bun.<br />**Réexécution :** `rerun_group=install-smoke`.                                                                 |
| Multiplateforme          | **Tâche :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** parcours d’installation propre et de mise à niveau sous Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec l’archive tar candidate et un paquet de référence.<br />**Réexécution :** `rerun_group=cross-os`.                                                                                                                                                                                                                  |
| E2E du dépôt et en conditions réelles | **Tâche :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache en conditions réelles, diffusion en continu OpenAI par WebSocket, partitions du fournisseur natif et des Plugins en conditions réelles, ainsi que bancs d’essai de modèle, backend et Gateway en conditions réelles reposant sur Docker, sélectionnés par `release_profile`.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Parcours de publication Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** segments Docker du parcours de publication utilisant l’artefact de paquet partagé.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`.                                                                                                                                                                                    |
| Acceptation du paquet    | **Tâche :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** fixtures hors ligne de paquets de Plugins, mise à jour de Plugin, E2E canonique du paquet Telegram avec simulation d’OpenAI et vérifications de survie à la mise à niveau publiée avec la même archive tar. Les vérifications bloquantes de publication utilisent par défaut la dernière version de référence publiée ; les vérifications prolongées (`run_release_soak=true`) s’étendent aux 4 dernières versions npm stables ainsi qu’à 3 versions historiques épinglées (`2026.4.23`, `2026.5.2`, `2026.4.15`), exécutées avec des fixtures de mise à niveau issues de problèmes signalés.<br />**Réexécution :** `rerun_group=package`. |
| Tableau de maturité      | **Tâche :** `Render maturity scorecard release docs`<br />**Workflow sous-jacent :** `maturity-scorecard.yml`<br />**Tests :** génère la documentation indicative du tableau de maturité pour la référence cible. Ne s’exécute que lorsque `run_maturity_scorecard=true` est transmis.<br />**Réexécution :** `rerun_group=qa` avec `run_maturity_scorecard=true`.                                                                                                                                                                                                                       |
| Parité d’assurance qualité | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** tâches directes<br />**Tests :** lots de parité agentique du candidat et de la référence, puis rapport de parité.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                |
| Parité d’exécution d’assurance qualité | **Tâche :** `Run QA Lab runtime parity lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** parcours de parité agentique d’une paire d’environnements d’exécution `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), comprenant un niveau standard et, avec `run_release_soak=true`, un niveau prolongé. À titre indicatif : les échecs individuels ne bloquent pas le vérificateur des contrôles de publication.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`. |
| Couverture des outils d’exécution d’assurance qualité | **Tâche :** `Enforce QA Lab runtime tool coverage`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** dérive dynamique des outils entre `openclaw` et `codex` au niveau standard de parité d’exécution (`pnpm openclaw qa coverage --tools`), à partir de la sortie du parcours de parité d’exécution d’assurance qualité. Bloquant : le caractère bloquant de cette tâche ne peut pas être remplacé par un statut indicatif.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`. |
| Matrix en conditions réelles d’assurance qualité | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** profil rapide d’assurance qualité Matrix en conditions réelles dans l’environnement `qa-live-shared`.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Telegram en conditions réelles d’assurance qualité | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** assurance qualité Telegram en conditions réelles avec des locations temporaires d’identifiants Convex CI.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                         |
| Vérificateur de publication | **Tâche :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** tâches requises de contrôle de publication pour le groupe de réexécution sélectionné.<br />**Réexécution :** relancer après la réussite des tâches enfants ciblées.                                                                                                                                                                                                                                                                                                                      |

## Segments du parcours de publication Docker

L’étape Docker du parcours de publication exécute les segments suivants lorsque `live_suite_filter` est
vide :

| Segment                                                         | Couverture                                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Parcours rapides principaux du parcours de publication Docker.                                                               |
| `package-update-openai`                                         | Comportement d’installation et de mise à jour du paquet OpenAI, installation à la demande de Codex, interactions en conditions réelles du Plugin Codex et appels d’outils Chat Completions. |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du paquet Anthropic.                                                           |
| `package-update-core`                                           | Comportement de paquet et de mise à jour indépendant du fournisseur.                                                         |
| `plugins-runtime-plugins`                                       | Parcours d’exécution de Plugins qui exercent leur comportement.                                                              |
| `plugins-runtime-services`                                      | Parcours d’exécution de Plugins reposant sur des services et en conditions réelles.                                          |
| `plugins-runtime-install-a` à `plugins-runtime-install-h`       | Lots d’installation et d’exécution de Plugins répartis pour la validation parallèle de la publication.                       |
| `openwebui`                                                     | Test rapide de compatibilité OpenWebUI isolé sur un exécuteur dédié doté d’un disque de grande capacité lorsqu’il est demandé. |

Utilisez `docker_lanes=<lane[,lane]>` de manière ciblée dans le workflow réutilisable en conditions réelles/E2E lorsqu’un seul parcours Docker a échoué. Les artefacts de publication incluent des commandes de réexécution propres à chaque parcours, avec des paramètres de réutilisation de l’artefact de paquet et de l’image lorsqu’ils sont disponibles.

## Profils de publication

`release_profile` contrôle principalement l’étendue des tests en direct et des fournisseurs dans les vérifications de version.
Il ne supprime ni la CI complète normale, ni la préversion des Plugins, ni le test rapide d’installation, ni
la validation des paquets, ni QA Lab. Les profils stable et complet exécutent toujours une couverture exhaustive
des tests E2E du dépôt/en direct et des tests prolongés du chemin de publication Docker. Le profil bêta peut l’activer avec
`run_release_soak=true`. La validation des paquets fournit le test E2E Telegram canonique du paquet
pour chaque candidat complet, de sorte que le workflow global ne duplique pas ce scrutateur
en direct.

| Profil   | Utilisation prévue                         | Couverture en direct/des fournisseurs incluse                                                                                                                                                                      |
| -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `beta`   | Test rapide critique de publication.       | Parcours en direct OpenAI/cœur, modèles Docker en direct pour OpenAI, cœur du Gateway natif, profil OpenAI du Gateway natif, Plugin OpenAI natif et Gateway Docker en direct pour OpenAI.                           |
| `stable` | Profil d’approbation de version par défaut. | `beta` plus test rapide Anthropic, Google, MiniMax, backend, banc de test natif en direct, backend CLI Docker en direct, liaison ACP Docker, banc Codex Docker, annonce des sous-agents Docker et fragment de test rapide OpenCode Go. |
| `full`   | Vérification consultative étendue.          | `stable` plus fournisseurs consultatifs, fragments de Plugins en direct et fragments multimédias en direct.                                                                                                        |

## Ajouts réservés au profil complet

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                            | Couverture réservée au profil complet                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèles Docker en direct           | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                                                                             |
| Gateway Docker en direct           | Fournisseurs consultatifs répartis entre les fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter et xAI/Z.ai.                               |
| Profils de fournisseurs du Gateway natif | Fragments Anthropic Opus complet et Sonnet/Haiku, Fireworks, DeepSeek, fragments complets des modèles OpenCode Go, OpenRouter, xAI et Z.ai. |
| Fragments de Plugins natifs en direct | Plugins A-K, L-N, autres O-Z, Moonshot et xAI.                                                                                             |
| Fragments multimédias natifs en direct | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                                                                              |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise à la place les fragments
plus étendus des modèles Anthropic et OpenCode Go. Les réexécutions ciblées peuvent toujours utiliser les
identifiants agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Réexécutions ciblées

Utilisez `rerun_group` pour éviter de répéter des environnements de publication sans rapport :

| Identifiant           | Portée                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `all`                 | Toutes les étapes de validation complète de la version.                                                                 |
| `ci`                  | Uniquement le workflow enfant de CI complète manuelle.                                                                  |
| `plugin-prerelease`   | Uniquement le workflow enfant de préversion des Plugins.                                                                |
| `release-checks`      | Toutes les étapes des vérifications de version d’OpenClaw.                                                              |
| `install-smoke`       | Du test rapide d’installation aux vérifications de version.                                                             |
| `cross-os`            | Vérifications de version multiplateformes.                                                                              |
| `live-e2e`            | Validation E2E du dépôt/en direct et du chemin de publication Docker.                                                    |
| `package`             | Validation des paquets.                                                                                                 |
| `qa`                  | Parité QA et parcours QA en direct.                                                                                     |
| `qa-parity`           | Uniquement les parcours et le rapport de parité QA.                                                                     |
| `qa-live`             | Matrix/Telegram QA en direct, ainsi que les parcours Discord, WhatsApp et Slack soumis à activation lorsqu’ils sont activés. |
| `npm-telegram`        | Test E2E Telegram du paquet publié ; nécessite `release_package_spec` ou `npm_telegram_package_spec`.                   |
| `performance`         | Uniquement les preuves de performances du produit.                                                                      |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une seule suite en direct a échoué.
Les identifiants de filtre valides sont définis dans le workflow réutilisable en direct/E2E, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de réexécution agrégé pour ses
trois fragments de fournisseurs ; il continue donc à se déployer sur toutes les tâches consultatives du Gateway Docker.

Utilisez `cross_os_suite_filter` avec `rerun_group=cross-os` lorsqu’un parcours
multiplateforme a échoué. Le filtre accepte un identifiant de système d’exploitation, un identifiant de suite ou une paire système d’exploitation/suite, par
exemple `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Les résumés
multiplateformes incluent les durées par phase pour les parcours de mise à niveau empaquetée, et les commandes
de longue durée affichent des lignes de Heartbeat afin qu’une mise à jour bloquée soit visible avant l’expiration
de la tâche.

Les échecs des vérifications QA de version bloquent la validation normale de la version. La vérification de
couverture des outils d’exécution QA (dérive dynamique des outils entre `openclaw` et `codex` dans le
niveau standard) bloque également le vérificateur des contrôles de version, même si le
parcours sous-jacent de parité d’exécution QA est consultatif. Les exécutions alpha de Tideclaw peuvent toujours
traiter comme consultatifs les parcours de vérification de version sans incidence sur la sûreté des paquets. Avec
`release_profile=beta`, les suites de fournisseurs en direct de `Run repo/live E2E validation`
sont consultatives : les déploiements de modèles tiers évoluent indépendamment d’une version, si bien que
le profil bêta signale leurs échecs sous forme d’avertissements, tandis que les profils stable et complet les
conservent comme bloquants. Lorsque
`live_suite_filter` demande explicitement un parcours QA en direct soumis à activation, tel que Discord,
WhatsApp ou Slack, la variable de dépôt `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondante doit être activée ; sinon, la saisie des paramètres échoue au lieu d’ignorer silencieusement le parcours.
Réexécutez `rerun_group=qa`, `qa-parity` ou `qa-live` lorsque vous
avez besoin de nouvelles preuves QA.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la version. Il fournit des liens vers
les identifiants d’exécution des workflows enfants et inclut des tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le workflow
enfant, puis réexécutez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` provenant de `OpenClaw Release Checks`
- Artefacts du chemin de publication Docker sous `.artifacts/docker-tests/`
- Artefacts `package-under-test` et de validation Docker de la validation des paquets
- Artefacts de vérification de version multiplateforme pour chaque système d’exploitation et chaque suite
- Artefacts de parité QA, de parité d’exécution, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`

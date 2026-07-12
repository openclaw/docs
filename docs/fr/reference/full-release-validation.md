---
read_when:
    - Exécution ou réexécution de la validation complète de la version
    - Comparaison des profils de validation des versions stable et complète
    - Débogage des échecs des étapes de validation des versions
summary: Étapes de validation complète de la version, workflows enfants, profils de version, identifiants de réexécution et preuves
title: Validation complète de la version publiée
x-i18n:
    generated_at: "2026-07-12T15:57:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le dispositif global de publication : le point d’entrée manuel unique
pour les preuves préalables à la publication. La majeure partie du travail s’effectue dans des workflows enfants afin qu’une machine en échec puisse
être réexécutée sans redémarrer toute la publication.

Exécutez-le depuis une référence de workflow approuvée, normalement `main`, et transmettez la branche de publication,
le tag ou le SHA complet du commit comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` accepte également `anthropic` ou `minimax` pour l’intégration multiplateforme et le
tour d’agent de bout en bout. Les tâches enfants réutilisables déterminent le harnais du workflow appelé
à partir de `job.workflow_repository` et `job.workflow_sha`, tandis que l’entrée `ref`
sélectionne le candidat testé. Cela permet de conserver la logique de validation approuvée actuelle
lors de la validation d’une ancienne branche ou d’un ancien tag de publication.

Chaque enfant déclenché doit signaler le même SHA de workflow que l’exécution parente
`Full Release Validation`. Si `main` évolue entre les déclenchements du parent et des enfants,
le dispositif global échoue de manière fermée, même si l’enfant lui-même réussit. Pour
une preuve immuable portant sur un commit exact, utilisez
`pnpm ci:full-release --sha <target-sha>`. L’utilitaire crée une référence temporaire
`release-ci/*` épinglée sur la version approuvée actuelle de `origin/main`, transmet le SHA cible
uniquement comme `ref` du candidat, réutilise les preuves strictes de cible exacte lorsqu’elles sont
disponibles et supprime la référence après la validation. Transmettez
`-f reuse_evidence=false` pour forcer une nouvelle exécution ou
`--workflow-sha <trusted-main-sha>` pour sélectionner un ancien commit de workflow toujours
accessible depuis la version actuelle de `origin/main`. Le workflow ne crée ni ne met à jour
lui-même les références du dépôt.

`release_profile=stable` et `release_profile=full` exécutent toujours le test prolongé
exhaustif en conditions réelles/Docker. Transmettez `run_release_soak=true` pour inclure les mêmes voies de test prolongé
avec le profil `beta`. La publication stable rejette un manifeste de validation
dépourvu de ce test prolongé et de preuves bloquantes de performances du produit.

Package Acceptance construit normalement l’archive tar du candidat à partir de la
`ref` résolue, y compris pour les exécutions avec SHA complet déclenchées via `pnpm ci:full-release`. Après une
publication bêta, transmettez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` pour réutiliser
le paquet npm publié dans les contrôles de publication, Package Acceptance, les tests multiplateformes,
le parcours de publication Docker et les tests Telegram du paquet. Utilisez `package_acceptance_package_spec`
uniquement lorsque Package Acceptance doit intentionnellement valider un autre paquet.
La voie du paquet actif du Plugin Codex suit le même état : les valeurs publiées de
`release_package_spec` produisent `codex_plugin_spec=npm:@openclaw/codex@<version>` ;
les exécutions par SHA/artefact empaquettent `extensions/codex` depuis la référence sélectionnée ; et les opérateurs
peuvent définir directement `codex_plugin_spec` pour des sources de Plugin
`npm:`, `npm-pack:` ou `git:`. La voie accorde l’autorisation explicite d’installation de la CLI Codex requise par
ce Plugin, puis exécute la vérification préalable de la CLI Codex et des tours d’agent OpenAI dans la même session.

## Étapes de premier niveau

Pour `rerun_group=all`, une tâche `Check for reusable validation evidence` s’exécute
d’abord : elle recherche la validation complète réussie antérieure la plus récente pour exactement le même
SHA cible, le même profil de publication, le même paramètre effectif de test prolongé et les mêmes entrées de validation.
Lorsque de telles preuves existent, toutes les voies sont ignorées et le vérificateur global
revérifie l’artefact parent immuable, les exécutions enfants et les journaux de déclenchement. Il s’agit
uniquement d’une récupération de réexécution du même candidat ; elle n’autorise pas la réutilisation entre différents SHA. Pour
un candidat modifié, réexécutez chaque contrôle de paquet, d’artefact, d’installation, Docker ou de fournisseur
affecté par cette différence. Transmettez `reuse_evidence=false` pour forcer une nouvelle exécution
complète. La réutilisation des preuves ne s’exécute que depuis `main` ou une référence canonique
`release-ci/*` épinglée sur un SHA, dont le commit de workflow reste dans la lignée approuvée de `main` ;
les autres références de workflow exécutent à nouveau les voies sélectionnées.

Également pour `rerun_group=all`, une tâche `Verify Docker runtime image assets` construit
la cible Docker `runtime-assets` avec
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Elle s’exécute en parallèle avec les
autres étapes et son résultat est imposé par le vérificateur global ; les voies n’attendent plus
sa fin avant de se déclencher. Un `rerun_group` plus restreint ignore cette vérification préalable.

| Étape                   | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible       | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Valide :** résout la branche de publication, le tag ou le SHA complet du commit et enregistre les entrées sélectionnées.<br />**Réexécution :** réexécutez le dispositif global en cas d’échec.                                                                                                                                                                                                                                                                                                            |
| Vérification préalable des ressources Docker | **Tâche :** `Verify Docker runtime image assets`<br />**Workflow enfant :** aucun<br />**Valide :** la construction de la cible Docker `runtime-assets` réussit toujours avant le déclenchement de toute autre étape. S’exécute uniquement avec `rerun_group=all`.<br />**Réexécution :** réexécutez le dispositif global avec `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest et CI normale    | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Valide :** le graphe manuel complet de CI sur la référence cible, notamment les voies Linux Node, les partitions de Plugins intégrés, les partitions de contrats de Plugins et de canaux, la compatibilité avec Node 22, `check-*`, `check-additional-*`, les tests de bon fonctionnement des artefacts construits, les contrôles de documentation, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le dispositif global.<br />**Réexécution :** `rerun_group=ci`.                                                                                          |
| Prépublication des Plugins       | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Valide :** les contrôles statiques de Plugins propres à la publication, la couverture agentique des Plugins, les partitions complètes de lots de Plugins, les voies Docker de prépublication des Plugins et un artefact non bloquant `plugin-inspector-advisory` pour le triage de compatibilité.<br />**Réexécution :** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Contrôles de publication          | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Valide :** le test de bon fonctionnement de l’installation, les contrôles multiplateformes des paquets, Package Acceptance, la parité de QA Lab, Matrix en conditions réelles et Telegram en conditions réelles. Les profils stable et complet exécutent également des suites exhaustives en conditions réelles/E2E et des segments du parcours de publication Docker ; la bêta peut les inclure avec `run_release_soak=true`.<br />**Réexécution :** `rerun_group=release-checks` ou un identifiant plus restreint des contrôles de publication.                                                                |
| Telegram du paquet        | **Tâche :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Valide :** un test E2E Telegram ciblé du paquet publié lorsque `release_package_spec` ou `npm_telegram_package_spec` est défini. La validation complète du candidat utilise plutôt le test E2E Telegram canonique de Package Acceptance.<br />**Réexécution :** `rerun_group=npm-telegram` avec `release_package_spec` ou `npm_telegram_package_spec`.                                                                                                              |
| Performances du produit     | **Tâche :** `Run product performance evidence`<br />**Workflow enfant :** `OpenClaw Performance`<br />**Valide :** l’exécution des performances correspondant au profil de publication (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) sur le SHA cible. La sortie Kova reste dans les artefacts du workflow et l’enfant doit prouver que son éditeur de rapports a été ignoré. Requis (bloquant) uniquement pour `rerun_group=all` ou `rerun_group=performance` ; non requis pour les groupes de réexécution plus restreints.<br />**Réexécution :** `rerun_group=performance`. |
| Vérificateur global       | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Valide :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes des workflows enfants.<br />**Réexécution :** réexécutez uniquement cette tâche après avoir réexécuté avec succès un enfant en échec.                                                                                                                                                                                                                                                                 |

Le dispositif global déclenche toujours les performances du produit en mode artefact uniquement.
`OpenClaw Performance` n’autorise la publication de rapports que pour les exécutions planifiées ou un
déclenchement manuel définissant explicitement `publish_reports=true`. Le contrôle du mode artefact uniquement
doit réussir, prouvant que la tâche de publication est restée ignorée.
Les preuves nouvelles et réutilisées enregistrent
`controls.performanceReportPublication=artifact-only` ; le vérificateur et le sélecteur de réutilisation
rejettent les preuves dépourvues de la preuve normalisée correspondante de l’enfant chargé des performances.

Le vérificateur téléverse le manifeste canonique sous le nom
`full-release-validation-<run-id>-<run-attempt>`. Les outils de preuve valident
son ID d’artefact, son condensat, l’exécution qui l’a produit et sa tentative avant de télécharger cet
ID d’artefact exact. Ils limitent la taille du ZIP téléchargé, vérifient ses octets par rapport au condensat REST
`sha256:` et diffusent l’unique entrée de manifeste bornée autorisée sans
extraire l’archive. Un alias au nom stable reste temporairement disponible pour les anciens
consommateurs de publication. Le vérificateur privilégie toujours l’artefact qualifié par la tentative ;
pendant la transition, il n’accepte le nom stable que pour un producteur de manifeste v2 à la tentative 1.
Il rejette cet ancien nom pour les tentatives ultérieures et le manifeste v3.

Pour `ref=main` avec `rerun_group=all`, pour les références `release/*`
et pour les références alpha de Tideclaw, une exécution globale plus récente remplace une ancienne exécution ayant
la même référence et le même groupe de réexécution. Lorsque le parent est annulé, son moniteur annule tout
workflow enfant qu’il a déjà déclenché. Les exécutions de validation portant sur un tag ou un SHA épinglé ne
s’annulent pas mutuellement.

## Étapes des contrôles de publication

`OpenClaw Release Checks` est le workflow enfant le plus volumineux. Il résout la cible
une seule fois et prépare un artefact partagé `release-package-under-test` lorsque les étapes
concernant les paquets ou Docker en ont besoin.

| Étape                    | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de publication     | **Tâche :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de réexécution et filtre ciblé de suite en conditions réelles.<br />**Réexécution :** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                               |
| Artefact du paquet       | **Tâche :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** crée ou résout une archive tar candidate unique et téléverse `release-package-under-test` pour les vérifications en aval portant sur le paquet.<br />**Réexécution :** groupe concerné relatif au paquet, aux différents systèmes d’exploitation ou aux tests en conditions réelles/E2E.                                                                                                                                                                                         |
| Test rapide d’installation | **Tâche :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** parcours d’installation complet avec réutilisation de l’image de test rapide du Dockerfile racine, installation du paquet QR, tests rapides Docker racine et Gateway, tests Docker du programme d’installation et test rapide du fournisseur d’images avec installation globale Bun.<br />**Réexécution :** `rerun_group=install-smoke`.                                                                                                                                              |
| Multiplateforme          | **Tâche :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** parcours d’installation propre et de mise à niveau sous Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, à l’aide de l’archive tar candidate et d’un paquet de référence.<br />**Réexécution :** `rerun_group=cross-os`.                                                                                                                                                                                                            |
| E2E du dépôt et en conditions réelles | **Tâche :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache en conditions réelles, diffusion en continu OpenAI par WebSocket, fragments du fournisseur natif en conditions réelles et des plugins, ainsi que bancs d’essai Docker de modèle, backend et Gateway en conditions réelles sélectionnés par `release_profile`.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Parcours de publication Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** segments Docker du parcours de publication exécutés avec l’artefact de paquet partagé.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`.                                                                                                                                                                                               |
| Validation du paquet     | **Tâche :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** jeux de données de paquets de plugins hors ligne, mise à jour de plugin, E2E canonique du paquet Telegram avec simulation OpenAI et vérifications de survie après mise à niveau depuis une version publiée avec la même archive tar. Les vérifications bloquantes de publication utilisent par défaut la dernière version de référence publiée ; les vérifications prolongées (`run_release_soak=true`) s’étendent aux 4 dernières versions npm stables ainsi qu’à 3 versions historiques épinglées (`2026.4.23`, `2026.5.2`, `2026.4.15`), exécutées avec des jeux de données de mise à niveau correspondant à des problèmes signalés.<br />**Réexécution :** `rerun_group=package`. |
| Tableau de maturité      | **Tâche :** `Render maturity scorecard release docs`<br />**Workflow sous-jacent :** `maturity-scorecard.yml`<br />**Tests :** génère la documentation indicative du tableau de maturité à partir de la référence cible. S’exécute uniquement lorsque `run_maturity_scorecard=true` est transmis.<br />**Réexécution :** `rerun_group=qa` avec `run_maturity_scorecard=true`.                                                                                                                                                                                                             |
| Parité de l’assurance qualité | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** tâches directes<br />**Tests :** ensembles de parité agentique du candidat et de la référence, puis rapport de parité.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                             |
| Parité d’exécution de l’assurance qualité | **Tâche :** `Run QA Lab runtime parity lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** parcours de parité agentique d’une paire d’environnements d’exécution `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), comprenant un niveau standard et, avec `run_release_soak=true`, un niveau prolongé. Indication : les échecs individuels ne bloquent pas le vérificateur des contrôles de publication.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`. |
| Couverture des outils d’exécution de l’assurance qualité | **Tâche :** `Enforce QA Lab runtime tool coverage`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** dérive dynamique des outils entre `openclaw` et `codex` dans le niveau standard de parité des environnements d’exécution (`pnpm openclaw qa coverage --tools`), à l’aide de la sortie du parcours de parité d’exécution de l’assurance qualité. Bloquant : cette tâche ne peut pas être rendue facultative à titre indicatif.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`. |
| QA Matrix en conditions réelles | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** profil QA rapide de Matrix en conditions réelles dans l’environnement `qa-live-shared`.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                        |
| QA Telegram en conditions réelles | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** QA de Telegram en conditions réelles avec des locations d’identifiants Convex CI.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                       |
| Vérificateur de publication | **Tâche :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** tâches de contrôle de publication requises pour le groupe de réexécution sélectionné.<br />**Réexécution :** réexécuter après la réussite des tâches enfants ciblées.                                                                                                                                                                                                                                                                                                                    |

## Segments du parcours de publication Docker

L’étape du parcours de publication Docker exécute les segments suivants lorsque `live_suite_filter` est
vide :

| Segment                                                         | Couverture                                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Parcours de tests rapides Docker du parcours de publication du cœur.                                                         |
| `package-update-openai`                                         | Comportement d’installation et de mise à jour du paquet OpenAI, installation à la demande de Codex, interactions en conditions réelles du plugin Codex et appels d’outils Chat Completions. |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du paquet Anthropic.                                                           |
| `package-update-core`                                           | Comportement d’installation et de mise à jour du paquet indépendant du fournisseur.                                         |
| `plugins-runtime-plugins`                                       | Parcours d’exécution des plugins qui exercent leur comportement.                                                             |
| `plugins-runtime-services`                                      | Parcours d’exécution des plugins adossés à des services et en conditions réelles.                                            |
| `plugins-runtime-install-a` à `plugins-runtime-install-h`       | Lots d’installation et d’exécution de plugins répartis pour la validation parallèle de la publication.                      |
| `openwebui`                                                     | Test rapide de compatibilité OpenWebUI isolé sur un exécuteur dédié doté d’un disque de grande capacité lorsqu’il est demandé. |

Utilisez `docker_lanes=<lane[,lane]>` de façon ciblée dans le workflow réutilisable en conditions réelles/E2E lorsque
seul un parcours Docker a échoué. Les artefacts de publication incluent, pour chaque parcours, des commandes de réexécution
avec des entrées permettant de réutiliser l’artefact du paquet et l’image lorsqu’elles sont disponibles.

## Profils de publication

`release_profile` contrôle principalement l’étendue des tests en conditions réelles et des fournisseurs dans les vérifications de version.
Il ne supprime ni la CI complète normale, ni la préversion des Plugins, ni le test rapide
d’installation, ni l’acceptation du paquet, ni QA Lab. Les profils stable et complet exécutent toujours une couverture exhaustive
E2E du dépôt/en conditions réelles et de tests prolongés du chemin de publication Docker. Le profil bêta peut l’activer avec
`run_release_soak=true`. L’acceptation du paquet fournit le test E2E Telegram canonique du paquet
pour chaque candidat complet, afin que le workflow global ne duplique pas cette
interrogation en conditions réelles.

| Profil   | Utilisation prévue                         | Couverture en conditions réelles/des fournisseurs incluse                                                                                                                                                            |
| -------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Test rapide critique pour la publication.  | Chemin OpenAI/cœur en conditions réelles, modèles Docker en conditions réelles pour OpenAI, cœur du Gateway natif, profil Gateway OpenAI natif, Plugin OpenAI natif et Gateway Docker OpenAI en conditions réelles.    |
| `stable` | Profil d’approbation de version par défaut. | `beta` plus test rapide Anthropic, Google, MiniMax, backend, banc de test natif en conditions réelles, backend CLI Docker en conditions réelles, liaison ACP Docker, banc Codex Docker, annonce de sous-agent Docker et un fragment de test rapide OpenCode Go. |
| `full`   | Vérification consultative étendue.          | `stable` plus fournisseurs consultatifs, fragments de Plugins en conditions réelles et fragments multimédias en conditions réelles.                                                                                  |

## Ajouts réservés au profil complet

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                              | Couverture réservée au profil complet                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèles Docker en conditions réelles | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                                                                                    |
| Gateway Docker en conditions réelles | Fournisseurs consultatifs répartis entre les fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter et xAI/Z.ai.                                      |
| Profils de fournisseurs Gateway natifs | Fragments Anthropic Opus complets et Sonnet/Haiku, Fireworks, DeepSeek, fragments de modèles OpenCode Go complets, OpenRouter, xAI et Z.ai.         |
| Fragments de Plugins natifs en conditions réelles | Plugins A-K, L-N, autres O-Z, Moonshot et xAI.                                                                                           |
| Fragments multimédias natifs en conditions réelles | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                                                                              |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise à la place les fragments de modèles
Anthropic et OpenCode Go plus étendus. Les réexécutions ciblées peuvent toujours utiliser les
identifiants agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Réexécutions ciblées

Utilisez `rerun_group` pour éviter de répéter des environnements de publication sans rapport :

| Identifiant          | Portée                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `all`                | Toutes les étapes de validation complète de version.                                                        |
| `ci`                 | Uniquement le workflow enfant manuel de CI complète.                                                        |
| `plugin-prerelease`  | Uniquement le workflow enfant de préversion des Plugins.                                                    |
| `release-checks`     | Toutes les étapes des vérifications de version OpenClaw.                                                    |
| `install-smoke`      | Test rapide d’installation jusqu’aux vérifications de version.                                             |
| `cross-os`           | Vérifications de version multiplateformes.                                                                 |
| `live-e2e`           | Validation E2E du dépôt/en conditions réelles et du chemin de publication Docker.                          |
| `package`            | Acceptation du paquet.                                                                                      |
| `qa`                 | Parité QA ainsi que voies QA en conditions réelles.                                                        |
| `qa-parity`          | Uniquement les voies et le rapport de parité QA.                                                           |
| `qa-live`            | Matrix/Telegram QA en conditions réelles, plus les voies Discord, WhatsApp et Slack conditionnelles lorsqu’elles sont activées. |
| `npm-telegram`       | E2E Telegram du paquet publié ; nécessite `release_package_spec` ou `npm_telegram_package_spec`.            |
| `performance`        | Uniquement les preuves de performances du produit.                                                         |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une seule suite en conditions réelles a échoué.
Les identifiants de filtre valides sont définis dans le workflow réutilisable de tests en conditions réelles/E2E, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de réexécution agrégé pour ses
trois fragments de fournisseurs ; il continue donc à se déployer sur toutes les tâches de Gateway Docker consultatives.

Utilisez `cross_os_suite_filter` avec `rerun_group=cross-os` lorsqu’une voie multiplateforme
a échoué. Le filtre accepte un identifiant de système d’exploitation, un identifiant de suite ou une paire système d’exploitation/suite, par
exemple `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Les résumés multiplateformes
incluent les durées de chaque phase pour les voies de mise à niveau empaquetées, et les commandes de longue durée
affichent des lignes Heartbeat afin qu’une mise à jour bloquée soit visible avant l’expiration du délai
de la tâche.

Les échecs des vérifications de version QA bloquent la validation normale de version. La vérification de
couverture des outils d’exécution QA (dérive dynamique des outils entre `openclaw` et `codex` dans le
niveau standard) bloque également le vérificateur des vérifications de version, même si la
voie de parité d’exécution QA sous-jacente est consultative. Les exécutions alpha Tideclaw peuvent toujours
traiter comme consultatives les voies de vérification de version qui ne concernent pas la sécurité des paquets. Avec
`release_profile=beta`, les suites de fournisseurs en conditions réelles de `Run repo/live E2E validation`
sont consultatives : les déploiements de modèles tiers changent indépendamment d’une publication, de sorte que
le profil bêta présente leurs échecs comme des avertissements, tandis que les profils stable et complet
continuent de les considérer comme bloquants. Lorsque
`live_suite_filter` demande explicitement une voie QA conditionnelle en conditions réelles telle que Discord,
WhatsApp ou Slack, la variable de dépôt `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
correspondante doit être activée ; sinon, la capture des entrées échoue au lieu d’ignorer silencieusement la voie.
Réexécutez `rerun_group=qa`, `qa-parity` ou `qa-live` lorsque vous
avez besoin de nouvelles preuves QA.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la publication. Il contient des liens vers
les identifiants des exécutions enfants et inclut les tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le
workflow enfant, puis réexécutez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` provenant de `OpenClaw Release Checks`
- Artefacts du chemin de publication Docker sous `.artifacts/docker-tests/`
- Artefacts `package-under-test` et d’acceptation Docker de l’acceptation du paquet
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

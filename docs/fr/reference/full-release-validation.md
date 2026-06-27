---
read_when:
    - Exécution ou réexécution de la validation complète de la version
    - Comparaison des profils de validation des versions stable et complète
    - Débogage des échecs d’étapes de validation de release
summary: Étapes de validation de version complète, workflows enfants, profils de version, identifiants de réexécution et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-06-27T18:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le cadre global de publication. C’est le point
d’entrée manuel unique pour les preuves de prépublication, mais l’essentiel du
travail s’exécute dans des workflows enfants afin qu’une machine en échec puisse
être relancée sans redémarrer toute la publication.

Exécutez-le depuis une référence de workflow fiable, normalement `main`, et passez
la branche de publication, le tag ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow fiable pour le harnais
et l’entrée `ref` pour le candidat testé. Cela rend la nouvelle logique de
validation disponible lors de la validation d’une ancienne branche ou d’un ancien
tag de publication.

`release_profile=stable` et `release_profile=full` exécutent toujours le test
d’endurance live/Docker exhaustif. Passez `run_release_soak=true` pour inclure
les mêmes voies d’endurance avec le profil bêta. La publication stable rejette
un manifeste de validation sans ce test d’endurance et sans preuves bloquantes de
performance produit.

L’acceptation du paquet construit normalement l’archive tar candidate depuis la
référence `ref` résolue, y compris les exécutions sur SHA complet déclenchées
avec `pnpm ci:full-release`. Après une publication bêta, passez
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` pour réutiliser le paquet npm
publié dans les vérifications de publication, l’acceptation du paquet, le
cross-OS, Docker du chemin de publication et Telegram du paquet. Utilisez
`package_acceptance_package_spec` uniquement lorsque l’acceptation du paquet doit
intentionnellement prouver un paquet différent. La voie du paquet live du Plugin
Codex suit le même état : les valeurs publiées de `release_package_spec`
dérivent `codex_plugin_spec=npm:@openclaw/codex@<version>` ; les exécutions sur
SHA/artefact empaquettent `extensions/codex` depuis la référence sélectionnée ;
et les opérateurs peuvent définir directement `codex_plugin_spec` pour les
sources de Plugin `npm:`, `npm-pack:` ou `git:`. La voie accorde l’approbation
explicite d’installation du CLI Codex requise par ce Plugin, puis exécute la
prévalidation du CLI Codex et des tours d’agent OpenAI dans la même session.

## Étapes de premier niveau

| Étape                | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Résolution de la cible    | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de publication, le tag ou le SHA de commit complet et enregistre les entrées sélectionnées.<br />**Relance :** relancez le cadre global si cela échoue.                                                                                                                                                                                                                                             |
| Vitest et CI normal | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** le graphe CI complet manuel sur la référence cible, y compris les voies Linux Node, les fragments de Plugin intégré, les fragments de contrat Plugin et canal, la compatibilité Node 22, `check-*`, `check-additional-*`, les contrôles smoke d’artefacts construits, les contrôles de documentation, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le cadre global.<br />**Relance :** `rerun_group=ci`.                           |
| Prépublication des Plugins    | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** les contrôles statiques de Plugin réservés à la publication, la couverture agentique des Plugins, les fragments de lots d’extensions complets, les voies Docker de prépublication de Plugin et un artefact non bloquant `plugin-inspector-advisory` pour le triage de compatibilité.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                                        |
| Vérifications de publication       | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** le smoke test d’installation, les contrôles de paquet cross-OS, l’acceptation du paquet, la parité QA Lab, la matrice live et Telegram live. Les profils stable et complet exécutent aussi des suites live/E2E exhaustives et des blocs Docker du chemin de publication ; la bêta peut les inclure avec `run_release_soak=true`.<br />**Relance :** `rerun_group=release-checks` ou un identifiant release-checks plus restreint. |
| Telegram du paquet     | **Tâche :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** un E2E Telegram ciblé sur paquet publié lorsque `release_package_spec` ou `npm_telegram_package_spec` est défini. La validation complète du candidat utilise à la place l’E2E Telegram canonique de l’acceptation du paquet.<br />**Relance :** `rerun_group=npm-telegram` avec `release_package_spec` ou `npm_telegram_package_spec`.                                               |
| Vérificateur global    | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes depuis les workflows enfants.<br />**Relance :** relancez uniquement cette tâche après avoir relancé avec succès un enfant en échec.                                                                                                                                                                                                  |

Pour `ref=main` et `rerun_group=all`, un cadre global plus récent remplace un
plus ancien. Lorsque le parent est annulé, son moniteur annule tout workflow
enfant qu’il a déjà déclenché. Les exécutions de validation de branche et de tag
de publication ne s’annulent pas entre elles par défaut.

## Étapes des vérifications de publication

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible
une fois et prépare un artefact partagé `release-package-under-test` lorsque les
étapes orientées paquet ou Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de publication | **Tâche :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de relance et filtre ciblé de suite live.<br />**Relance :** `rerun_group=release-checks`.                                                                                                                                                                                                                                                |
| Artefact de package | **Tâche :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** empaquette ou résout une archive tar candidate, puis téléverse `release-package-under-test` pour les vérifications en aval orientées package.<br />**Relance :** le package concerné, le groupe multi-OS ou le groupe live/E2E.                                                                                                                                                              |
| Smoke d’installation | **Tâche :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** chemin d’installation complet avec réutilisation de l’image smoke Dockerfile racine, installation du package QR, smokes Docker racine et Gateway, tests Docker de l’installateur, smoke du fournisseur d’images avec installation globale Bun, et E2E rapide d’installation/désinstallation de Plugin groupé.<br />**Relance :** `rerun_group=install-smoke`. |
| Multi-OS            | **Tâche :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** voies fraîche et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec l’archive tar candidate plus un package de référence.<br />**Relance :** `rerun_group=cross-os`.                                                                                                                                              |
| Dépôt et E2E live   | **Tâche :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache live, streaming websocket OpenAI, fragments de fournisseur live natif et de Plugin, et harnais Docker live de modèle/backend/Gateway sélectionnés par `release_profile`.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full`, ou `rerun_group=live-e2e` ciblé.<br />**Relance :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Chemin de publication Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** fragments Docker du chemin de publication avec l’artefact de package partagé.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full`, ou `rerun_group=live-e2e` ciblé.<br />**Relance :** `rerun_group=live-e2e`.                                                                                                                       |
| Acceptation du package | **Tâche :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** fixtures de package de Plugin hors ligne, mise à jour de Plugin, E2E canonique du package Telegram mock-OpenAI, et vérifications de survie de mise à niveau publiée avec la même archive tar. Les vérifications bloquantes de publication utilisent la dernière référence publiée par défaut ; les vérifications soak s’étendent à chaque version npm stable à partir de `2026.4.23` inclus, plus les fixtures de problèmes signalés.<br />**Relance :** `rerun_group=package`. |
| Parité QA           | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** tâches directes<br />**Tests :** packs de parité agentique candidat et de référence, puis rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                  |
| Matrix live QA      | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                       |
| Telegram live QA    | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** QA Telegram live avec locations d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                               |
| Vérificateur de publication | **Tâche :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** tâches de vérification de publication requises pour le groupe de relance sélectionné.<br />**Relance :** relancer après la réussite des tâches enfants ciblées.                                                                                                                                                                                                                         |

## Fragments du chemin de publication Docker

L’étape du chemin de publication Docker exécute ces fragments lorsque `live_suite_filter` est
vide :

| Fragment                                                        | Couverture                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Voies smoke principales du chemin de publication Docker.                                                                    |
| `package-update-openai`                                         | Comportement d’installation/mise à jour du package OpenAI, installation à la demande de Codex, tours live du Plugin Codex et appels d’outils Chat Completions. |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du package Anthropic.                                                         |
| `package-update-core`                                           | Comportement de package et de mise à jour indépendant du fournisseur.                                                       |
| `plugins-runtime-plugins`                                       | Voies d’exécution de Plugin qui exercent le comportement des Plugins.                                                       |
| `plugins-runtime-services`                                      | Voies d’exécution de Plugin adossées à un service et live ; inclut OpenWebUI sur demande.                                  |
| `plugins-runtime-install-a` à `plugins-runtime-install-h`       | Lots d’installation/exécution de Plugin répartis pour la validation parallèle de publication.                              |

Utilisez `docker_lanes=<lane[,lane]>` ciblé sur le workflow live/E2E réutilisable lorsque
une seule voie Docker a échoué. Les artefacts de publication incluent des commandes de
relance par voie avec les entrées d’artefact de package et de réutilisation d’image lorsqu’elles sont disponibles.

## Profils de publication

`release_profile` contrôle principalement l’étendue live/fournisseur dans les vérifications de publication.
Il ne supprime pas la CI complète normale, Plugin Prerelease, le smoke d’installation, l’acceptation du package
ou QA Lab. Les profils stable et complet exécutent toujours une couverture exhaustive
E2E dépôt/live et soak du chemin de publication Docker. Le profil bêta peut l’activer avec
`run_release_soak=true`. Package Acceptance fournit l’E2E Telegram de package canonique
pour chaque candidat complet, afin que le workflow global ne duplique pas ce poller live.

| Profil    | Utilisation prévue              | Couverture live/fournisseur incluse                                                                                                                                                 |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke critique de publication le plus rapide. | Chemin live OpenAI/core, modèles Docker live pour OpenAI, core Gateway natif, profil Gateway OpenAI natif, Plugin OpenAI natif et Gateway Docker live OpenAI.                     |
| `stable`  | Profil d’approbation de publication par défaut. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI Docker live, liaison ACP Docker, harnais Codex Docker et fragment smoke OpenCode Go. |
| `full`    | Balayage consultatif large.      | `stable` plus fournisseurs consultatifs, fragments live de Plugin et fragments live multimédias.                                                                                    |

## Ajouts propres à full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                          | Couverture propre à full                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modèles Docker live              | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                                                            |
| Gateway Docker live              | Fournisseurs consultatifs répartis en fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter et xAI/Z.ai.                    |
| Profils de fournisseur Gateway natif | Fragments Anthropic Opus et Sonnet/Haiku complets, Fireworks, DeepSeek, fragments complets de modèles OpenCode Go, OpenRouter, xAI et Z.ai. |
| Fragments live de Plugin natif   | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                                                              |
| Fragments live multimédias natifs | Groupes audio, musique Google, musique MiniMax et vidéo A-D.                                                               |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise à la place les fragments
de modèles Anthropic et OpenCode Go plus larges. Les relances ciblées peuvent toujours utiliser les
identifiants agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Relances ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de version sans rapport :

| Identifiant         | Portée                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `all`               | Toutes les étapes de validation complète de la version.                                                          |
| `ci`                | Enfant CI complète manuelle uniquement.                                                                          |
| `plugin-prerelease` | Enfant de prépublication Plugin uniquement.                                                                      |
| `release-checks`    | Toutes les étapes des vérifications de version OpenClaw.                                                         |
| `install-smoke`     | Smoke d’installation via les vérifications de version.                                                           |
| `cross-os`          | Vérifications de version multi-OS.                                                                               |
| `live-e2e`          | Validation E2E repo/live et du chemin de version Docker.                                                         |
| `package`           | Acceptation du paquet.                                                                                          |
| `qa`                | Parité QA plus lanes QA live.                                                                                    |
| `qa-parity`         | Lanes de parité QA et rapport uniquement.                                                                        |
| `qa-live`           | Matrix/Telegram QA live plus lanes Discord, WhatsApp et Slack protégées lorsqu’elles sont activées.              |
| `npm-telegram`      | E2E Telegram du paquet publié ; nécessite `release_package_spec` ou `npm_telegram_package_spec`.                 |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une seule suite live a échoué.
Les ids de filtre valides sont définis dans le workflow live/E2E réutilisable, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de relance agrégé pour ses
trois shards de fournisseurs ; il se déploie donc toujours vers tous les jobs Gateway Docker consultatifs.

Utilisez `cross_os_suite_filter` avec `rerun_group=cross-os` lorsqu’une seule lane multi-OS
a échoué. Le filtre accepte un id d’OS, un id de suite ou une paire OS/suite, par
exemple `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Les résumés
multi-OS incluent les minutages par phase pour les lanes de mise à niveau empaquetée, et les commandes
longues affichent des lignes Heartbeat afin qu’une mise à jour Windows bloquée soit visible avant le
délai d’expiration du job.

Les échecs de vérification de version QA bloquent la validation normale de la version. La dérive requise des
outils dynamiques OpenClaw dans le niveau standard bloque aussi le vérificateur des vérifications de version.
Les exécutions alpha Tideclaw peuvent tout de même traiter les lanes de vérification de version sans risque
pour le paquet comme consultatives. Lorsque `live_suite_filter` demande explicitement une lane QA live protégée
comme Discord, WhatsApp ou Slack, la variable de dépôt
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon
la capture de l’entrée échoue au lieu d’ignorer silencieusement la lane. Relancez `rerun_group=qa`,
`qa-parity` ou `qa-live` lorsque vous avez besoin de nouvelles preuves QA.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la version. Il lie les
ids d’exécution enfants et inclut les tableaux des jobs les plus lents. En cas d’échec, inspectez d’abord le workflow
enfant, puis relancez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis `OpenClaw Release Checks`
- Artefacts du chemin de version Docker sous `.artifacts/docker-tests/`
- `package-under-test` d’acceptation du paquet et artefacts d’acceptation Docker
- Artefacts de vérification de version multi-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

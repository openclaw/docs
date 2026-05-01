---
read_when:
    - Exécution ou relance de la validation complète de version
    - Comparaison des profils de validation de publication stable et complète
    - Débogage des échecs de l’étape de validation de version
summary: Étapes de validation complète de la publication, flux de travail enfants, profils de publication, identifiants de relance et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-05-01T07:17:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le cadre global de publication. C’est le point
d’entrée manuel unique pour les preuves de prépublication, mais la plupart du
travail se déroule dans des workflows enfants afin qu’un environnement en échec
puisse être relancé sans redémarrer toute la publication.

Exécutez-le depuis une référence de workflow de confiance, normalement `main`, et
passez la branche de publication, le tag ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow de confiance pour le
harnais et l’entrée `ref` pour le candidat testé. Cela permet de disposer de la
nouvelle logique de validation lors de la validation d’une ancienne branche ou
d’un ancien tag de publication.

## Étapes de premier niveau

| Étape                 | Détails                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de publication, le tag ou le SHA de commit complet et enregistre les entrées sélectionnées.<br />**Relance :** relancez le workflow global si cela échoue.                                                                                                                                                        |
| Vitest et CI normale  | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** graphe CI complet manuel sur la référence cible, incluant les voies Linux Node, les shards de Plugins intégrés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke test de build, les vérifications de documentation, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le workflow global.<br />**Relance :** `rerun_group=ci`. |
| Prépublication des Plugins | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** vérifications statiques des Plugins propres à la publication, couverture agentique des Plugins, shards de lots complets d’extensions et voies Docker de prépublication des Plugins.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                 |
| Vérifications de publication | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke test d’installation, vérifications de packages multi-OS, suites live/E2E, segments Docker du chemin de publication, Package Acceptance, parité QA Lab, Matrix live et Telegram live.<br />**Relance :** `rerun_group=release-checks` ou un handle release-checks plus ciblé. |
| Telegram après publication | **Tâche :** `Run post-publish Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve Telegram facultative avec package publié lorsque `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram`.                                                                                                                                              |
| Vérificateur global   | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes depuis les workflows enfants.<br />**Relance :** relancez uniquement cette tâche après avoir relancé un enfant en échec jusqu’au vert.                                                                 |

Pour `ref=main` et `rerun_group=all`, un workflow global plus récent remplace un
plus ancien. Lorsque le parent est annulé, son moniteur annule tout workflow
enfant qu’il a déjà déclenché. Les exécutions de validation de branches et de
tags de publication ne s’annulent pas mutuellement par défaut.

## Étapes des vérifications de publication

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible
une seule fois et prépare un artefact partagé `release-package-under-test`
lorsque les étapes orientées package ou Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de publication | **Tâche :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Teste :** référence sélectionnée, SHA attendu facultatif, profil, groupe de relance et filtre de suite live ciblée.<br />**Relance :** `rerun_group=release-checks`.                                                                                                                                                              |
| Artefact de package | **Tâche :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Teste :** empaquette ou résout une archive tar candidate et téléverse `release-package-under-test` pour les vérifications aval orientées package.<br />**Relance :** le groupe package, multi-OS ou live/E2E concerné.                                                                                              |
| Smoke test d’installation | **Tâche :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Teste :** chemin d’installation complet avec réutilisation de l’image smoke du Dockerfile racine, installation de package QR, smokes Docker racine et Gateway, tests Docker de l’installeur, smoke du fournisseur d’images avec installation globale Bun et E2E Docker rapide des Plugins intégrés.<br />**Relance :** `rerun_group=install-smoke`. |
| Multi-OS            | **Tâche :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Teste :** voies fraîches et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec l’archive tar candidate plus un package de référence.<br />**Relance :** `rerun_group=cross-os`.                                                           |
| E2E dépôt et live   | **Tâche :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Teste :** E2E du dépôt, cache live, streaming websocket OpenAI, fournisseur live natif et shards de Plugins, ainsi que harnais live adossés à Docker pour modèle/backend/Gateway sélectionnés par `release_profile`.<br />**Relance :** `rerun_group=live-e2e`, facultativement avec `live_suite_filter`. |
| Chemin de publication Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Teste :** segments Docker du chemin de publication sur l’artefact de package partagé.<br />**Relance :** `rerun_group=live-e2e`.                                                                                                                                      |
| Package Acceptance  | **Tâche :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Teste :** compatibilité des dépendances de canaux intégrés native à l’artefact, fixtures de packages de Plugins hors ligne et acceptation de package Telegram mock-OpenAI sur la même archive tar.<br />**Relance :** `rerun_group=package`.                                                                    |
| Parité QA           | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** tâches directes<br />**Teste :** packs de parité agentique candidat et de référence, puis le rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                               |
| Matrix live QA      | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** tâche directe<br />**Teste :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                    |
| Telegram live QA    | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** tâche directe<br />**Teste :** QA Telegram live avec baux d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                  |
| Vérificateur de publication | **Tâche :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Teste :** tâches release-check requises pour le groupe de relance sélectionné.<br />**Relance :** relancez après le passage au vert des tâches enfants ciblées.                                                                                                                                                   |

## Segments du chemin de publication Docker

L’étape du chemin de publication Docker exécute ces segments lorsque
`live_suite_filter` est vide :

| Segment                                                                                     | Couverture                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Voies smoke du chemin de publication Docker du cœur.                    |
| `package-update-openai`                                                                     | Comportement d’installation et de mise à jour du package OpenAI.        |
| `package-update-anthropic`                                                                  | Comportement d’installation et de mise à jour du package Anthropic.     |
| `package-update-core`                                                                       | Comportement de package et de mise à jour indépendant du fournisseur.   |
| `plugins-runtime-plugins`                                                                   | Voies d’exécution des Plugins qui exercent le comportement des Plugins. |
| `plugins-runtime-services`                                                                  | Voies d’exécution de Plugins adossées à des services ; inclut OpenWebUI lorsque demandé. |
| `plugins-runtime-install-a` à `plugins-runtime-install-h`                                   | Lots d’installation/exécution de Plugins répartis pour la validation parallèle de publication. |
| `bundled-channels-core`                                                                     | Comportement Docker des canaux intégrés.                                |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Comportement de mise à jour des canaux intégrés.                        |
| `bundled-channels-contracts`                                                                | Vérifications de contrats des canaux intégrés dans le chemin de publication Docker. |

Utilisez `docker_lanes=<lane[,lane]>` de manière ciblée sur le flux de travail live/E2E réutilisable lorsque
une seule voie Docker a échoué. Les artefacts de publication incluent des
commandes de relance par voie avec des entrées de réutilisation d’artefact de paquet et d’image lorsqu’elles sont disponibles.

## Profils de publication

`release_profile` contrôle uniquement l’étendue live/fournisseur dans les contrôles de publication. Il
ne supprime pas les segments normaux de CI complète, Plugin Prerelease, install smoke, acceptation
de paquet, QA Lab, ni le chemin de publication Docker.

| Profil    | Utilisation prévue                 | Couverture live/fournisseur incluse                                                                                                                                           |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke le plus rapide critique pour la publication. | Chemin live OpenAI/core, modèles live Docker pour OpenAI, cœur du gateway natif, profil gateway OpenAI natif, plugin OpenAI natif, et gateway live Docker OpenAI.             |
| `stable`  | Profil d’approbation de publication par défaut. | `minimum` plus Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI live Docker, liaison Docker ACP, harnais Docker Codex, et un shard de smoke OpenCode Go. |
| `full`    | Balayage consultatif large.        | `stable` plus fournisseurs consultatifs, shards live de plugins et shards live média.                                                                                         |

## Ajouts uniquement pour full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                          | Couverture uniquement pour full                                                  |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modèles live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                |
| Gateway live Docker              | Shard consultatif pour DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI et Z.ai. |
| Profils de fournisseur gateway natif | Fireworks, DeepSeek, shards complets de modèles OpenCode Go, OpenRouter, xAI et Z.ai. |
| Shards live de plugins natifs    | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                  |
| Shards live média natifs         | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                    |

`stable` inclut `native-live-src-gateway-profiles-opencode-go-smoke` ; `full`
utilise à la place les shards de modèles OpenCode Go plus larges.

## Relances ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de publication sans rapport :

| Handle              | Périmètre                                         |
| ------------------- | ------------------------------------------------- |
| `all`               | Toutes les étapes de Full Release Validation.     |
| `ci`                | Enfant CI complet manuel uniquement.              |
| `plugin-prerelease` | Enfant Plugin Prerelease uniquement.              |
| `release-checks`    | Toutes les étapes OpenClaw Release Checks.        |
| `install-smoke`     | Install Smoke jusqu’aux contrôles de publication. |
| `cross-os`          | Contrôles de publication Cross-OS.                |
| `live-e2e`          | Validation E2E repo/live et chemin de publication Docker. |
| `package`           | Package Acceptance.                               |
| `qa`                | Parité QA plus voies live QA.                     |
| `qa-parity`         | Voies de parité QA et rapport uniquement.         |
| `qa-live`           | Matrice QA live et Telegram uniquement.           |
| `npm-telegram`      | E2E Telegram post-publication facultatif uniquement. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une suite live a échoué.
Les identifiants de filtre valides sont définis dans le flux de travail live/E2E réutilisable, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la publication. Il renvoie vers
les identifiants d’exécution enfants et inclut les tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le flux de travail enfant,
puis relancez le plus petit handle correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis `OpenClaw Release Checks`
- Artefacts de chemin de publication Docker sous `.artifacts/docker-tests/`
- Artefacts `package-under-test` de Package Acceptance et artefacts d’acceptation Docker
- Artefacts de contrôles de publication Cross-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

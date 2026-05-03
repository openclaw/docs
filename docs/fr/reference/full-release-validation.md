---
read_when:
    - Exécuter ou réexécuter la validation complète de publication
    - Comparaison des profils de validation des versions stable et complète
    - Débogage des échecs de l’étape de validation de version
summary: Étapes de validation complète de version, flux de travail enfants, profils de version, identifiants de relance et preuves
title: Validation complète de la publication
x-i18n:
    generated_at: "2026-05-03T21:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le cadre de release global. C’est le point d’entrée manuel unique pour les preuves avant release, mais l’essentiel du travail se déroule dans des workflows enfants afin qu’une instance échouée puisse être relancée sans redémarrer toute la release.

Exécutez-le depuis une référence de workflow fiable, normalement `main`, et passez la branche de release, le tag ou le SHA complet de commit comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow fiable pour le harness et l’entrée `ref` pour le candidat testé. Cela permet de garder la nouvelle logique de validation disponible lors de la validation d’une ancienne branche de release ou d’un ancien tag.

Package Acceptance construit normalement le tarball candidat à partir de la `ref` résolue, y compris les exécutions avec SHA complet déclenchées avec `pnpm ci:full-release`. Après publication, passez `package_acceptance_package_spec=openclaw@YYYY.M.D` (ou `openclaw@beta`/`openclaw@latest`) pour exécuter la même matrice de paquet/mise à jour contre le paquet npm livré à la place.

## Étapes de haut niveau

| Étape | Détails |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible | **Job :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de release, le tag ou le SHA complet de commit et enregistre les entrées sélectionnées.<br />**Relance :** relancez le cadre global si cela échoue. |
| Vitest et CI normale | **Job :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** graphe complet de CI manuel contre la ref cible, y compris les voies Linux Node, les shards de Plugin intégrés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke test de build, les checks docs, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le cadre global.<br />**Relance :** `rerun_group=ci`. |
| Prerelease des Plugins | **Job :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** checks statiques de Plugin réservés à la release, couverture agentique des Plugins, shards de lots complets d’extensions et voies Docker de prerelease des Plugins.<br />**Relance :** `rerun_group=plugin-prerelease`. |
| Checks de release | **Job :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke test d’installation, checks de paquets inter-OS, suites live/E2E, segments du chemin de release Docker, Package Acceptance, parité QA Lab, Matrix live et Telegram live.<br />**Relance :** `rerun_group=release-checks` ou un handle release-checks plus précis. |
| Artefact de paquet | **Job :** `Prepare release package artifact`<br />**Workflow enfant :** aucun<br />**Prouve :** crée le tarball parent `release-package-under-test` suffisamment tôt pour les checks orientés paquet qui n’ont pas besoin d’attendre `OpenClaw Release Checks`.<br />**Relance :** relancez le cadre global ou fournissez `npm_telegram_package_spec` pour `rerun_group=npm-telegram`. |
| Paquet Telegram | **Job :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve de paquet Telegram adossée à l’artefact parent pour `rerun_group=all` avec `release_profile=full`, ou preuve Telegram sur paquet publié lorsque `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram` avec `npm_telegram_package_spec`. |
| Vérificateur global | **Job :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des jobs les plus lents issus des workflows enfants.<br />**Relance :** relancez uniquement ce job après avoir relancé un enfant échoué jusqu’au vert. |

Pour `ref=main` et `rerun_group=all`, un cadre global plus récent remplace un plus ancien. Lorsque le parent est annulé, son moniteur annule tout workflow enfant qu’il a déjà déclenché. Les exécutions de validation de branche de release et de tag ne s’annulent pas mutuellement par défaut.

## Étapes des checks de release

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible une seule fois et prépare un artefact partagé `release-package-under-test` lorsque les étapes orientées paquet ou Docker en ont besoin.

| Étape | Détails |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de release | **Job :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Teste :** ref sélectionnée, SHA attendu optionnel, profil, groupe de relance et filtre ciblé de suite live.<br />**Relance :** `rerun_group=release-checks`. |
| Artefact de paquet | **Job :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Teste :** empaquette ou résout un tarball candidat et téléverse `release-package-under-test` pour les checks en aval orientés paquet.<br />**Relance :** le groupe de paquet, inter-OS ou live/E2E affecté. |
| Smoke test d’installation | **Job :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Teste :** chemin d’installation complet avec réutilisation de l’image de smoke test Dockerfile racine, installation de paquet QR, smoke tests Docker racine et Gateway, tests Docker d’installateur, smoke test de fournisseur d’images avec installation globale Bun, et E2E rapide d’installation/désinstallation de Plugin intégré.<br />**Relance :** `rerun_group=install-smoke`. |
| Inter-OS | **Job :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Teste :** voies fraîches et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, en utilisant le tarball candidat plus un paquet de référence.<br />**Relance :** `rerun_group=cross-os`. |
| Dépôt et E2E live | **Job :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Teste :** E2E du dépôt, cache live, streaming websocket OpenAI, fournisseur live natif et shards de Plugin, et harnesses de modèle/backend/Gateway live adossés à Docker sélectionnés par `release_profile`.<br />**Relance :** `rerun_group=live-e2e`, optionnellement avec `live_suite_filter`. |
| Chemin de release Docker | **Job :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Teste :** segments Docker du chemin de release contre l’artefact de paquet partagé.<br />**Relance :** `rerun_group=live-e2e`. |
| Package Acceptance | **Job :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Teste :** fixtures hors ligne de paquets de Plugin, mise à jour de Plugin, acceptation de paquet Telegram avec mock OpenAI, et checks de survie de mise à niveau publiée depuis chaque release npm stable à partir de `2026.4.23` contre le même tarball.<br />**Relance :** `rerun_group=package`. |
| Parité QA | **Job :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** jobs directs<br />**Teste :** packs de parité agentique du candidat et de référence, puis le rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`. |
| Matrix live QA | **Job :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** job direct<br />**Teste :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`. |
| Telegram live QA | **Job :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** job direct<br />**Teste :** QA Telegram live avec baux d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`. |
| Vérificateur de release | **Job :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Teste :** jobs release-check requis pour le groupe de relance sélectionné.<br />**Relance :** relancez après la réussite des jobs enfants ciblés. |

## Segments du chemin de release Docker

L’étape du chemin de release Docker exécute ces segments lorsque `live_suite_filter` est vide :

| Segment | Couverture |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core` | Voies de smoke test du chemin de release Docker cœur. |
| `package-update-openai` | Installation du paquet OpenAI et comportement de mise à jour. |
| `package-update-anthropic` | Installation du paquet Anthropic et comportement de mise à jour. |
| `package-update-core` | Comportement de paquet et de mise à jour indépendant du fournisseur. |
| `plugins-runtime-plugins` | Voies d’exécution de Plugin qui exercent le comportement des Plugins. |
| `plugins-runtime-services` | Voies d’exécution de Plugin adossées à des services ; inclut OpenWebUI lorsque demandé. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lots d’installation/exécution de Plugins divisés pour la validation de release en parallèle. |

Utilisez `docker_lanes=<lane[,lane]>` de manière ciblée sur le workflow live/E2E réutilisable lorsque
une seule voie Docker a échoué. Les artefacts de publication incluent des
commandes de relance par voie avec des entrées de réutilisation d’artefact de package et d’image lorsque disponibles.

## Profils de publication

`release_profile` contrôle principalement l’étendue live/fournisseur dans les vérifications de publication.
Il ne supprime pas la CI complète normale, la prépublication Plugin, la vérification d’installation, l’acceptation de package, QA Lab, ni les segments de chemin de publication Docker. `full` fait aussi exécuter par
l’exécution ombrelle le Telegram E2E de package contre l’artefact de package de publication parent lorsque
`rerun_group=all`, afin qu’un candidat complet de prépublication ne saute pas silencieusement cette
voie de package Telegram.

| Profil    | Utilisation prévue                     | Couverture live/fournisseur incluse                                                                                                                                                 |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Vérification critique de publication la plus rapide. | Chemin live OpenAI/cœur, modèles live Docker pour OpenAI, cœur de gateway natif, profil de Gateway OpenAI natif, Plugin OpenAI natif, et Gateway OpenAI live Docker.               |
| `stable`  | Profil d’approbation de publication par défaut. | `minimum` plus vérification Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI live Docker, liaison ACP Docker, harnais Codex Docker, et un fragment de vérification OpenCode Go. |
| `full`    | Passage consultatif large.             | `stable` plus fournisseurs consultatifs, fragments live de Plugins, et fragments live média.                                                                                        |

## Ajouts propres à full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                          | Couverture propre à full                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Modèles live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai, et Fireworks.                                                                         |
| Gateway live Docker              | Fournisseurs consultatifs répartis en fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter, et xAI/Z.ai.                 |
| Profils de fournisseur Gateway natifs | Fragments Anthropic Opus et Sonnet/Haiku complets, Fireworks, DeepSeek, fragments de modèles OpenCode Go complets, OpenRouter, xAI, et Z.ai. |
| Fragments live de Plugins natifs | Plugins A-K, L-N, O-Z autres, Moonshot, et xAI.                                                                           |
| Fragments live média natifs      | Audio, musique Google, musique MiniMax, et groupes vidéo A-D.                                                             |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise plutôt les fragments de modèles
Anthropic et OpenCode Go plus larges. Les relances ciblées peuvent toujours utiliser les
identifiants agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Relances ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de publication sans rapport :

| Identifiant         | Portée                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Toutes les étapes de validation complète de publication.              |
| `ci`                | Enfant CI complète manuelle uniquement.                               |
| `plugin-prerelease` | Enfant de prépublication Plugin uniquement.                           |
| `release-checks`    | Toutes les étapes OpenClaw Release Checks.                            |
| `install-smoke`     | Vérification d’installation via les vérifications de publication.     |
| `cross-os`          | Vérifications de publication multi-OS.                                |
| `live-e2e`          | Validation E2E dépôt/live et chemin de publication Docker.            |
| `package`           | Acceptation de package.                                               |
| `qa`                | Parité QA plus voies live QA.                                         |
| `qa-parity`         | Voies de parité QA et rapport uniquement.                             |
| `qa-live`           | Matrice live QA et Telegram uniquement.                               |
| `npm-telegram`      | Telegram E2E du package publié ; nécessite `npm_telegram_package_spec`. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une suite live a échoué.
Les identifiants de filtre valides sont définis dans le workflow live/E2E réutilisable, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de relance agrégé pour ses
trois fragments de fournisseurs, il se déploie donc toujours vers toutes les tâches Gateway Docker consultatives.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la publication. Il référence
les identifiants d’exécutions enfants et inclut les tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le
workflow enfant, puis relancez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis le parent Full Release Validation et `OpenClaw Release Checks`
- Artefacts de chemin de publication Docker sous `.artifacts/docker-tests/`
- Artefacts `package-under-test` d’acceptation de package et artefacts d’acceptation Docker
- Artefacts de vérification de publication multi-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

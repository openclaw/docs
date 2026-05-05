---
read_when:
    - Exécution ou réexécution de la validation complète de la version
    - Comparaison des profils de validation des versions stable et complète
    - Débogage des échecs des étapes de validation de version
summary: Étapes de validation complète de la release, workflows enfants, profils de release, identifiants de réexécution et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-05-05T01:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est l’ombrelle de publication. C’est le point
d’entrée manuel unique pour la preuve de prépublication, mais la majeure partie
du travail se fait dans des workflows enfants afin qu’une boîte en échec puisse
être relancée sans redémarrer toute la publication.

Exécutez-le depuis une référence de workflow de confiance, normalement `main`, et transmettez la branche de publication,
le tag ou le SHA complet du commit comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow de confiance pour le harnais et l’entrée
`ref` pour le candidat testé. Cela garde la nouvelle logique de validation disponible
lors de la validation d’une ancienne branche de publication ou d’un ancien tag.

Par défaut, `release_profile=stable` exécute les voies bloquantes pour la publication et ignore
le soak exhaustif live/Docker. Passez `run_release_soak=true` pour inclure les
voies de soak lors d’une exécution stable. `release_profile=full` active toujours les voies de soak afin
que le large profil consultatif ne perde jamais de couverture silencieusement.

Package Acceptance construit normalement le tarball candidat depuis le
`ref` résolu, y compris les exécutions avec SHA complet déclenchées avec `pnpm ci:full-release`. Après
publication, passez `package_acceptance_package_spec=openclaw@YYYY.M.D` (ou
`openclaw@beta`/`openclaw@latest`) pour exécuter à la place la même matrice package/mise à jour contre
le package npm publié.

## Étapes de premier niveau

| Étape                | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible    | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de publication, le tag ou le SHA complet du commit et enregistre les entrées sélectionnées.<br />**Relance :** relancez l’ombrelle si cela échoue.                                                                                                                                                                                                                               |
| Vitest et CI normale | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** graphe CI complet manuel contre la référence cible, y compris les voies Linux Node, les segments Plugin groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les vérifications de documentation, les Skills Python, Windows, macOS, l’i18n de l’interface de contrôle et Android via l’ombrelle.<br />**Relance :** `rerun_group=ci`.                                                  |
| Prépublication Plugin    | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** vérifications statiques Plugin propres à la publication, couverture Plugin agentique, segments de lot d’extensions complets et voies Docker de prépublication Plugin.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Vérifications de publication       | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke d’installation, vérifications de package multi-OS, Package Acceptance, parité QA Lab, Matrix live et Telegram live. Avec `run_release_soak=true` ou `release_profile=full`, exécute également les suites live/E2E exhaustives et les morceaux du chemin de publication Docker.<br />**Relance :** `rerun_group=release-checks` ou un handle release-checks plus restreint. |
| Artefact de package     | **Tâche :** `Prepare release package artifact`<br />**Workflow enfant :** aucun<br />**Prouve :** crée le tarball parent `release-package-under-test` assez tôt pour les vérifications orientées package qui n’ont pas besoin d’attendre `OpenClaw Release Checks`.<br />**Relance :** relancez l’ombrelle ou fournissez `npm_telegram_package_spec` pour `rerun_group=npm-telegram`.                                                                                    |
| Package Telegram     | **Tâche :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve du package Telegram adossée à l’artefact parent pour `rerun_group=all` avec `release_profile=full`, ou preuve Telegram du package publié quand `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram` avec `npm_telegram_package_spec`.                                                                               |
| Vérificateur d’ombrelle    | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes depuis les workflows enfants.<br />**Relance :** relancez uniquement cette tâche après avoir relancé un enfant en échec jusqu’au vert.                                                                                                                                                                                    |

Pour `ref=main` et `rerun_group=all`, une ombrelle plus récente remplace une ancienne.
Quand le parent est annulé, son moniteur annule tout workflow enfant qu’il a déjà
déclenché. Les exécutions de validation de branche de publication et de tag ne s’annulent pas entre elles par
défaut.

## Étapes des vérifications de publication

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible
une fois et prépare un artefact partagé `release-package-under-test` quand les étapes
orientées package ou Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de release      | **Job :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** ref sélectionnée, SHA attendu facultatif, profil, groupe de relance et filtre de suite live ciblée.<br />**Relance :** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefact de package    | **Job :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** package ou résout une archive tarball candidate et téléverse `release-package-under-test` pour les vérifications aval orientées package.<br />**Relance :** le package, le groupe cross-OS ou live/E2E affecté.                                                                                                                                                                                                              |
| Smoke d’installation       | **Job :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** chemin d’installation complet avec réutilisation de l’image smoke Dockerfile racine, installation du package QR, smokes Docker racine et Gateway, tests Docker de l’installateur, smoke de fournisseur d’images pour installation globale Bun et E2E rapide d’installation/désinstallation de Plugin groupé.<br />**Relance :** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **Job :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** voies d’installation fraîche et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec l’archive tarball candidate et un package de référence.<br />**Relance :** `rerun_group=cross-os`.                                                                                                                                                                                  |
| E2E repo et live   | **Job :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache live, streaming websocket OpenAI, fragments de fournisseur live natif et de Plugin, et harnais live adossés à Docker pour modèle/backend/Gateway sélectionnés par `release_profile`.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Relance :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Chemin de release Docker | **Job :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** morceaux Docker de chemin de release avec l’artefact de package partagé.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full` ou `rerun_group=live-e2e` ciblé.<br />**Relance :** `rerun_group=live-e2e`.                                                                                                                                                      |
| Acceptation de package  | **Job :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** fixtures de package Plugin hors ligne, mise à jour de Plugin, acceptation de package Telegram avec OpenAI simulé et vérifications de survivance après mise à niveau publiée avec la même archive tarball. Les vérifications de release bloquantes utilisent la référence publiée la plus récente par défaut ; les vérifications de soak s’étendent à chaque release npm stable à partir de `2026.4.23`, ainsi qu’aux fixtures de problèmes signalés.<br />**Relance :** `rerun_group=package`.                          |
| Parité QA           | **Job :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** jobs directs<br />**Tests :** packs de parité agentique candidat et de référence, puis le rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix live QA      | **Job :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** job direct<br />**Tests :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram live QA    | **Job :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** job direct<br />**Tests :** QA Telegram live avec baux d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Vérificateur de release    | **Job :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** jobs de vérification de release requis pour le groupe de relance sélectionné.<br />**Relance :** relancer après la réussite des jobs enfants ciblés.                                                                                                                                                                                                                                                                                                    |

## Morceaux du chemin de release Docker

L’étape du chemin de release Docker exécute ces morceaux lorsque `live_suite_filter` est
vide :

| Morceau                                                           | Couverture                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Voies smoke du chemin de release Docker core.                                   |
| `package-update-openai`                                         | Comportement d’installation et de mise à jour du package OpenAI.                             |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du package Anthropic.                          |
| `package-update-core`                                           | Comportement de package et de mise à jour indépendant du fournisseur.                           |
| `plugins-runtime-plugins`                                       | Voies d’exécution Plugin qui exercent le comportement des Plugins.                     |
| `plugins-runtime-services`                                      | Voies d’exécution Plugin adossées à un service ; inclut OpenWebUI lorsque demandé. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lots d’installation/exécution de Plugins répartis pour la validation de release parallèle.   |

Utilisez `docker_lanes=<lane[,lane]>` ciblé sur le workflow live/E2E réutilisable lorsque
une seule voie Docker a échoué. Les artefacts de release incluent des commandes de relance
par voie avec les entrées d’artefact de package et de réutilisation d’image lorsqu’elles sont disponibles.

## Profils de release

`release_profile` contrôle principalement l’étendue live/fournisseur dans les vérifications de release.
Il ne supprime pas la CI complète normale, la prérelease de Plugin, le smoke d’installation, l’acceptation
de package ni le QA Lab. Pour `stable`, les E2E repo/live exhaustifs et les morceaux
du chemin de release Docker relèvent de la couverture de soak et s’exécutent lorsque `run_release_soak=true`.
`full` force aussi la couverture de soak et fait également exécuter par le workflow ombrelle l’E2E Telegram
de package avec l’artefact de package de release parent lorsque `rerun_group=all`, afin qu’un candidat complet
avant publication n’ignore pas silencieusement cette voie de package Telegram.

| Profil   | Usage prévu                      | Couverture live/fournisseur incluse                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke le plus rapide critique pour la release.   | Chemin live OpenAI/core, modèles live Docker pour OpenAI, core Gateway natif, profil Gateway OpenAI natif, Plugin OpenAI natif et Gateway live Docker OpenAI.                     |
| `stable`  | Profil d’approbation de release par défaut. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI live Docker, liaison ACP Docker, harnais Codex Docker et un fragment smoke OpenCode Go. |
| `full`    | Balayage consultatif étendu.             | `stable` plus fournisseurs consultatifs, fragments live de Plugins et fragments live média.                                                                                                        |

## Ajouts propres à full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Zone                             | Couverture propre à full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modèles live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                                                          |
| Gateway live Docker              | Fournisseurs consultatifs répartis en fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter et xAI/Z.ai.                              |
| Profils de fournisseur Gateway natifs | Fragments Anthropic Opus et Sonnet/Haiku complets, Fireworks, DeepSeek, fragments de modèles OpenCode Go complets, OpenRouter, xAI et Z.ai. |
| Fragments live Plugin natifs        | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                                                             |
| Fragments live média natifs         | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                                                                   |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise à la place les fragments de modèles
Anthropic et OpenCode Go plus étendus. Les relances ciblées peuvent toujours utiliser les identifiants
agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Relances ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de release sans rapport :

| Identifiant         | Portée                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Toutes les étapes de Full Release Validation.                         |
| `ci`                | Enfant CI complet manuel uniquement.                                  |
| `plugin-prerelease` | Enfant Plugin Prerelease uniquement.                                  |
| `release-checks`    | Toutes les étapes d’OpenClaw Release Checks.                          |
| `install-smoke`     | Install Smoke jusqu’aux vérifications de publication.                 |
| `cross-os`          | Vérifications de publication inter-OS.                                |
| `live-e2e`          | Validation E2E dépôt/live et chemin de publication Docker.            |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parité QA plus voies live QA.                                         |
| `qa-parity`         | Voies de parité QA et rapport uniquement.                             |
| `qa-live`           | Matrice live QA et Telegram uniquement.                               |
| `npm-telegram`      | E2E Telegram du package publié ; nécessite `npm_telegram_package_spec`. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une suite live a échoué.
Les identifiants de filtre valides sont définis dans le workflow live/E2E réutilisable, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de relance agrégé pour ses
trois fragments de fournisseur ; il se déploie donc toujours vers toutes les tâches Gateway Docker d’avis.

Utilisez `cross_os_suite_filter` avec `rerun_group=cross-os` lorsqu’une voie inter-OS
a échoué. Le filtre accepte un identifiant d’OS, un identifiant de suite ou une paire OS/suite, par
exemple `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Les résumés inter-OS
incluent les minutages par phase pour les voies de mise à niveau empaquetée, et les commandes
longues affichent des lignes de Heartbeat afin qu’une mise à jour Windows bloquée soit visible avant le
délai d’expiration de la tâche.

Les voies QA des vérifications de publication sont consultatives. Un échec limité à la QA est signalé comme un avertissement
et ne bloque pas le vérificateur de publication ; relancez `rerun_group=qa`,
`qa-parity` ou `qa-live` lorsque vous avez besoin de preuves QA récentes.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index de niveau publication. Il lie les
identifiants des exécutions enfants et inclut les tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le workflow
enfant, puis relancez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis le parent Full Release Validation et `OpenClaw Release Checks`
- Artefacts du chemin de publication Docker sous `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance et artefacts d’acceptation Docker
- Artefacts de vérification de publication inter-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

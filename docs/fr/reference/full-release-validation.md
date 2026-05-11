---
read_when:
    - Exécution ou relance de la validation complète de publication
    - Comparaison des profils de validation de publication stable et complète
    - Débogage des échecs de l’étape de validation de version
summary: Étapes de validation complète de version, flux de travail enfants, profils de version, identifiants de réexécution et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-05-11T20:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est l’ombrelle de validation de publication. C’est le point d’entrée manuel unique pour la preuve avant publication, mais la majeure partie du travail se déroule dans des flux de travail enfants afin qu’une machine en échec puisse être relancée sans redémarrer toute la publication.

Exécutez-le depuis une référence de flux de travail fiable, normalement `main`, et transmettez la branche de publication, le tag ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les flux de travail enfants utilisent la référence de flux de travail fiable pour le harnais et l’entrée `ref` pour le candidat testé. Cela garde la nouvelle logique de validation disponible lors de la validation d’une ancienne branche ou d’un ancien tag de publication.

Par défaut, `release_profile=stable` exécute les voies bloquantes pour la publication et ignore le soak live/Docker exhaustif. Passez `run_release_soak=true` pour inclure les voies de soak dans une exécution stable. `release_profile=full` active toujours les voies de soak afin que le profil consultatif large ne perde jamais de couverture silencieusement.

Package Acceptance construit normalement l’archive candidate depuis la référence `ref` résolue, y compris les exécutions sur SHA complet déclenchées avec `pnpm ci:full-release`. Après une publication bêta, passez `release_package_spec=openclaw@YYYY.M.D-beta.N` pour réutiliser le paquet npm publié dans les vérifications de publication, Package Acceptance, le cross-OS, Docker de chemin de publication et Telegram de paquet. Utilisez `package_acceptance_package_spec` uniquement lorsque Package Acceptance doit intentionnellement prouver un paquet différent.

## Étapes de haut niveau

| Étape                | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible    | **Tâche :** `Resolve target ref`<br />**Flux de travail enfant :** aucun<br />**Prouve :** résout la branche de publication, le tag ou le SHA de commit complet et enregistre les entrées sélectionnées.<br />**Relance :** relancez l’ombrelle si cela échoue.                                                                                                                                                                                                                               |
| Vitest et CI normale | **Tâche :** `Run normal full CI`<br />**Flux de travail enfant :** `CI`<br />**Prouve :** graphe de CI complète manuelle sur la référence cible, incluant les voies Linux Node, les shards de Plugin groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les vérifications de docs, les Skills Python, Windows, macOS, l’i18n de l’interface Control et Android via l’ombrelle.<br />**Relance :** `rerun_group=ci`.                                                  |
| Prépublication de Plugin    | **Tâche :** `Run plugin prerelease validation`<br />**Flux de travail enfant :** `Plugin Prerelease`<br />**Prouve :** vérifications statiques de Plugin propres à la publication, couverture de Plugin agentique, shards de lot d’extensions complet, voies Docker de prépublication de Plugin et artefact `plugin-inspector-advisory` non bloquant pour le tri de compatibilité.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                          |
| Vérifications de publication       | **Tâche :** `Run release/live/Docker/QA validation`<br />**Flux de travail enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke d’installation, vérifications de paquet cross-OS, Package Acceptance, parité QA Lab, Matrix live et Telegram live. Avec `run_release_soak=true` ou `release_profile=full`, exécute aussi les suites live/E2E exhaustives et les segments Docker de chemin de publication.<br />**Relance :** `rerun_group=release-checks` ou un identifiant release-checks plus étroit. |
| Artefact de paquet     | **Tâche :** `Prepare release package artifact`<br />**Flux de travail enfant :** aucun<br />**Prouve :** crée l’archive parente `release-package-under-test` assez tôt pour les vérifications orientées paquet qui n’ont pas besoin d’attendre `OpenClaw Release Checks`.<br />**Relance :** relancez l’ombrelle ou fournissez `release_package_spec` pour les relances sur paquet publié.                                                                                           |
| Telegram de paquet     | **Tâche :** `Run package Telegram E2E`<br />**Flux de travail enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve Telegram de paquet adossée à l’artefact parent pour `rerun_group=all` avec `release_profile=full`, ou preuve Telegram de paquet publié lorsque `release_package_spec` ou `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram` avec `release_package_spec` ou `npm_telegram_package_spec`.                           |
| Vérificateur de l’ombrelle    | **Tâche :** `Verify full validation`<br />**Flux de travail enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes issus des flux de travail enfants.<br />**Relance :** relancez uniquement cette tâche après avoir relancé un enfant en échec jusqu’au vert.                                                                                                                                                                                    |

Pour `ref=main` et `rerun_group=all`, une ombrelle plus récente remplace une plus ancienne. Lorsque le parent est annulé, son moniteur annule tout flux de travail enfant qu’il a déjà déclenché. Les exécutions de validation de branches et de tags de publication ne s’annulent pas mutuellement par défaut.

## Étapes des vérifications de publication

`OpenClaw Release Checks` est le plus grand flux de travail enfant. Il résout la cible une seule fois et prépare un artefact partagé `release-package-under-test` lorsque les étapes orientées paquet ou Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de publication      | **Tâche :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de réexécution et filtre ciblé de suite live.<br />**Réexécution :** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artefact de paquet    | **Tâche :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** empaquette ou résout un tarball candidat et téléverse `release-package-under-test` pour les vérifications aval orientées paquet.<br />**Réexécution :** le groupe de paquet, inter-OS ou live/E2E concerné.                                                                                                                                                                                                              |
| Smoke d’installation       | **Tâche :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** chemin d’installation complet avec réutilisation de l’image smoke du Dockerfile racine, installation du paquet QR, smokes Docker racine et Gateway, tests Docker de l’installateur, smoke du fournisseur d’images d’installation globale Bun, et E2E rapide d’installation/désinstallation de plugins groupés.<br />**Réexécution :** `rerun_group=install-smoke`.                                                                                                                                 |
| Inter-OS            | **Tâche :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** voies d’installation fraîche et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec le tarball candidat plus un paquet de référence.<br />**Réexécution :** `rerun_group=cross-os`.                                                                                                                                                                                  |
| E2E dépôt et live   | **Tâche :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache live, streaming websocket OpenAI, fournisseurs live natifs et fragments de plugins, et harnais live de modèle/backend/Gateway adossés à Docker sélectionnés par `release_profile`.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full`, ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Chemin de publication Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** morceaux Docker du chemin de publication contre l’artefact de paquet partagé.<br />**Exécutions :** `run_release_soak=true`, `release_profile=full`, ou `rerun_group=live-e2e` ciblé.<br />**Réexécution :** `rerun_group=live-e2e`.                                                                                                                                                      |
| Acceptation du paquet  | **Tâche :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** fixtures hors ligne de paquet de plugins, mise à jour de plugin, acceptation de paquet Telegram avec OpenAI simulé, et vérifications de survivance à une mise à niveau depuis une version publiée contre le même tarball. Les vérifications de publication bloquantes utilisent la dernière référence publiée par défaut ; les vérifications soak s’étendent à chaque version npm stable à partir de `2026.4.23` incluse, plus les fixtures de problèmes signalés.<br />**Réexécution :** `rerun_group=package`.                          |
| Parité QA           | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** tâches directes<br />**Tests :** packs de parité agentique candidat et de référence, puis rapport de parité.<br />**Réexécution :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA live Matrix      | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** tâche directe<br />**Tests :** QA Telegram live avec baux d’identifiants Convex CI.<br />**Réexécution :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Vérificateur de publication    | **Tâche :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** tâches de vérification de publication requises pour le groupe de réexécution sélectionné.<br />**Réexécution :** relancer après la réussite des tâches enfants ciblées.                                                                                                                                                                                                                                                                                                    |

## Morceaux du chemin de publication Docker

L’étape du chemin de publication Docker exécute ces morceaux lorsque `live_suite_filter` est
vide :

| Morceau                                                           | Couverture                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Voies smoke Docker du chemin de publication du cœur.                                                             |
| `package-update-openai`                                         | Comportement d’installation/mise à jour du paquet OpenAI, installation de Codex à la demande et appels d’outils Chat Completions. |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du paquet Anthropic.                                                    |
| `package-update-core`                                           | Comportement de paquet et de mise à jour neutre vis-à-vis du fournisseur.                                                     |
| `plugins-runtime-plugins`                                       | Voies d’exécution des plugins qui exercent le comportement des plugins.                                               |
| `plugins-runtime-services`                                      | Voies d’exécution des plugins live et adossées à des services ; inclut OpenWebUI sur demande.                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lots d’installation/exécution de plugins séparés pour la validation de publication en parallèle.                             |

Utilisez `docker_lanes=<lane[,lane]>` ciblé sur le workflow live/E2E réutilisable lorsque
une seule voie Docker a échoué. Les artefacts de publication incluent des commandes de
réexécution par voie avec les entrées de réutilisation d’artefact de paquet et d’image lorsqu’elles sont disponibles.

## Profils de publication

`release_profile` contrôle principalement l’étendue live/fournisseur dans les vérifications de publication.
Il ne supprime pas la CI complète normale, Plugin Prerelease, le smoke d’installation, l’acceptation de paquet
ni QA Lab. Pour `stable`, les E2E dépôt/live exhaustifs et les morceaux du
chemin de publication Docker sont une couverture soak et s’exécutent lorsque `run_release_soak=true`.
`full` force l’activation de la couverture soak et fait aussi exécuter par le run parapluie les E2E Telegram
du paquet contre l’artefact de paquet de publication parent lorsque `rerun_group=all`, afin qu’un candidat
complet avant publication ne saute pas silencieusement cette voie de paquet Telegram.

| Profil   | Utilisation prévue                      | Couverture live/fournisseur incluse                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke critique de publication le plus rapide.   | Chemin live OpenAI/cœur, modèles live Docker pour OpenAI, cœur Gateway natif, profil Gateway OpenAI natif, plugin OpenAI natif et Gateway live Docker OpenAI.                     |
| `stable`  | Profil d’approbation de publication par défaut. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI live Docker, liaison Docker ACP, harnais Docker Codex et fragment smoke OpenCode Go. |
| `full`    | Balayage consultatif étendu.             | `stable` plus fournisseurs consultatifs, fragments live de plugins et fragments live de médias.                                                                                                        |

## Ajouts uniquement en full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Zone                             | Couverture uniquement en full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modèles live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                                                                          |
| Gateway live Docker              | Fournisseurs consultatifs répartis en fragments DeepSeek/Fireworks, OpenCode Go/OpenRouter et xAI/Z.ai.                              |
| Profils de fournisseurs Gateway natifs | Fragments Anthropic Opus et Sonnet/Haiku complets, Fireworks, DeepSeek, fragments de modèles OpenCode Go complets, OpenRouter, xAI et Z.ai. |
| Fragments live de plugins natifs        | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                                                             |
| Fragments live de médias natifs         | Groupes audio, musique Google, musique MiniMax et vidéo A-D.                                                                   |

`stable` inclut `native-live-src-gateway-profiles-anthropic-smoke` et
`native-live-src-gateway-profiles-opencode-go-smoke` ; `full` utilise plutôt les fragments de modèles
Anthropic et OpenCode Go plus larges. Les réexécutions ciblées peuvent toujours utiliser les
identifiants agrégés `native-live-src-gateway-profiles-anthropic` ou
`native-live-src-gateway-profiles-opencode-go`.

## Réexécutions ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de publication sans rapport :

| Identifiant         | Portée                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Toutes les étapes de validation de version complète.                                             |
| `ci`                | Enfant CI complet manuel uniquement.                                                            |
| `plugin-prerelease` | Enfant de prépublication de Plugin uniquement.                                                   |
| `release-checks`    | Toutes les étapes des vérifications de version OpenClaw.                                         |
| `install-smoke`     | Vérification rapide d’installation jusqu’aux vérifications de version.                           |
| `cross-os`          | Vérifications de version inter-OS.                                                              |
| `live-e2e`          | Validation E2E repo/live et du chemin de version Docker.                                         |
| `package`           | Acceptation du paquet.                                                                          |
| `qa`                | Parité QA plus voies QA live.                                                                   |
| `qa-parity`         | Voies de parité QA et rapport uniquement.                                                        |
| `qa-live`           | Matrice QA live et Telegram uniquement.                                                          |
| `npm-telegram`      | E2E Telegram du paquet publié ; nécessite `release_package_spec` ou `npm_telegram_package_spec`. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une seule suite live a échoué.
Les identifiants de filtre valides sont définis dans le workflow réutilisable live/E2E, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

L’identifiant `live-gateway-advisory-docker` est un identifiant de relance agrégé pour ses
trois fragments de fournisseurs ; il se déploie donc toujours vers toutes les tâches Gateway Docker d’avis.

Utilisez `cross_os_suite_filter` avec `rerun_group=cross-os` lorsqu’une seule voie inter-OS
a échoué. Le filtre accepte un identifiant d’OS, un identifiant de suite ou une paire OS/suite, par
exemple `windows/packaged-upgrade`, `windows` ou `packaged-fresh`. Les résumés inter-OS
incluent les temps par phase pour les voies de mise à niveau packagée, et les commandes
longues impriment des lignes Heartbeat afin qu’une mise à jour Windows bloquée soit visible avant le
délai d’expiration de la tâche.

Les voies QA des vérifications de version sont consultatives. Un échec limité à la QA est signalé comme un avertissement
et ne bloque pas le vérificateur des vérifications de version ; relancez `rerun_group=qa`,
`qa-parity` ou `qa-live` lorsque vous avez besoin de nouvelles preuves QA.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la version. Il contient des liens vers
les identifiants d’exécution enfants et inclut les tableaux des tâches les plus lentes. En cas d’échec, inspectez d’abord le
workflow enfant, puis relancez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis le parent Full Release Validation et `OpenClaw Release Checks`
- Artefacts du chemin de version Docker sous `.artifacts/docker-tests/`
- Acceptation du paquet `package-under-test` et artefacts d’acceptation Docker
- Artefacts de vérification de version inter-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

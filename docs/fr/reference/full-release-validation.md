---
read_when:
    - Exécuter ou relancer la validation complète de la version
    - Comparaison des profils de validation de version stable et complète
    - Débogage des échecs de l’étape de validation de version
summary: Étapes de validation complète de publication, workflows enfants, profils de publication, identifiants de relance et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-05-02T21:01:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le workflow global de release. C’est l’unique
point d’entrée manuel pour les preuves de pré-release, mais l’essentiel du
travail se déroule dans des workflows enfants afin qu’une machine en échec
puisse être relancée sans redémarrer toute la release.

Exécutez-le depuis une référence de workflow de confiance, normalement `main`, et
passez la branche de release, le tag ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow de confiance pour le
harnais et l’entrée `ref` pour le candidat testé. Cela garde la nouvelle logique
de validation disponible lors de la validation d’une ancienne branche ou d’un
ancien tag de release.

Package Acceptance construit normalement l’archive tar candidate depuis la
référence `ref` résolue, y compris les exécutions à SHA complet déclenchées avec
`pnpm ci:full-release`. Après publication, passez
`package_acceptance_package_spec=openclaw@YYYY.M.D` (ou `openclaw@beta`/
`openclaw@latest`) pour exécuter à la place la même matrice de paquet/mise à jour
contre le paquet npm livré.

## Étapes de premier niveau

| Étape                | Détails                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de cible  | **Tâche :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de release, le tag ou le SHA de commit complet et enregistre les entrées sélectionnées.<br />**Relance :** relancez le workflow global si cela échoue.                                                                                                                                                       |
| Vitest et CI normale | **Tâche :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** graphe CI complet manuel contre la référence cible, incluant les voies Linux Node, les fragments de Plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les vérifications docs, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le workflow global.<br />**Relance :** `rerun_group=ci`. |
| Pré-release Plugin  | **Tâche :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** vérifications statiques de Plugins propres à la release, couverture de Plugins agentique, fragments de lots complets d’extensions et voies Docker de pré-release Plugin.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                  |
| Vérifications de release | **Tâche :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke d’installation, vérifications de paquets inter-OS, suites live/E2E, morceaux du chemin de release Docker, Package Acceptance, parité QA Lab, Matrix live et Telegram live.<br />**Relance :** `rerun_group=release-checks` ou un identifiant release-checks plus étroit. |
| Paquet Telegram     | **Tâche :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve de paquet Telegram adossée à un artefact pour `rerun_group=all` avec `release_profile=full`, ou preuve Telegram de paquet publié lorsque `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram` avec `npm_telegram_package_spec`.                    |
| Vérificateur global | **Tâche :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des tâches les plus lentes depuis les workflows enfants.<br />**Relance :** relancez uniquement cette tâche après avoir relancé un enfant en échec jusqu’au vert.                                                                 |

Pour `ref=main` et `rerun_group=all`, un workflow global plus récent remplace un
plus ancien. Lorsque le parent est annulé, son moniteur annule tout workflow
enfant qu’il a déjà déclenché. Les exécutions de validation de branches et de tags
de release ne s’annulent pas entre elles par défaut.

## Étapes des vérifications de release

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible
une seule fois et prépare un artefact partagé `release-package-under-test` lorsque
les étapes liées aux paquets ou à Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de release    | **Tâche :** `Resolve target ref`<br />**Workflow support :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de relance et filtre de suite live ciblé.<br />**Relance :** `rerun_group=release-checks`.                                                                                                                                                     |
| Artefact de paquet  | **Tâche :** `Prepare release package artifact`<br />**Workflow support :** aucun<br />**Tests :** emballe ou résout une archive tar candidate et téléverse `release-package-under-test` pour les vérifications aval liées aux paquets.<br />**Relance :** le groupe paquet, inter-OS ou live/E2E affecté.                                                                                       |
| Smoke d’installation | **Tâche :** `Run install smoke`<br />**Workflow support :** `Install Smoke`<br />**Tests :** chemin d’installation complet avec réutilisation de l’image smoke Dockerfile racine, installation de paquet QR, smokes Docker racine et Gateway, tests Docker d’installeur, smoke du fournisseur d’images pour l’installation globale Bun et E2E rapide d’installation/désinstallation de Plugins groupés.<br />**Relance :** `rerun_group=install-smoke`. |
| Inter-OS            | **Tâche :** `cross_os_release_checks`<br />**Workflow support :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** voies fraîches et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, avec l’archive tar candidate plus un paquet de référence.<br />**Relance :** `rerun_group=cross-os`.                                                  |
| Dépôt et E2E live   | **Tâche :** `Run repo/live E2E validation`<br />**Workflow support :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache live, streaming websocket OpenAI, fournisseur live natif et fragments de Plugins, ainsi que harnais live adossés à Docker pour modèle/backend/Gateway sélectionnés par `release_profile`.<br />**Relance :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Chemin de release Docker | **Tâche :** `Run Docker release-path validation`<br />**Workflow support :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** morceaux Docker du chemin de release contre l’artefact de paquet partagé.<br />**Relance :** `rerun_group=live-e2e`.                                                                                                                               |
| Package Acceptance  | **Tâche :** `Run package acceptance`<br />**Workflow support :** `Package Acceptance`<br />**Tests :** fixtures de paquets Plugin hors ligne, mise à jour de Plugins, acceptation de paquet Telegram mock-OpenAI et vérifications de survivance de mise à niveau publiée depuis chaque release npm stable à partir de `2026.4.23` contre la même archive tar.<br />**Relance :** `rerun_group=package`. |
| Parité QA           | **Tâche :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow support :** tâches directes<br />**Tests :** packs de parité agentique candidat et de référence, puis le rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                     |
| Matrix live QA      | **Tâche :** `Run QA Lab live Matrix lane`<br />**Workflow support :** tâche directe<br />**Tests :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                           |
| Telegram live QA    | **Tâche :** `Run QA Lab live Telegram lane`<br />**Workflow support :** tâche directe<br />**Tests :** QA Telegram live avec baux d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                          |
| Vérificateur de release | **Tâche :** `Verify release checks`<br />**Workflow support :** aucun<br />**Tests :** tâches release-check requises pour le groupe de relance sélectionné.<br />**Relance :** relancez après la réussite des tâches enfants ciblées.                                                                                                                                                      |

## Morceaux du chemin de release Docker

L’étape du chemin de release Docker exécute ces morceaux lorsque
`live_suite_filter` est vide :

| Morceau                                                         | Couverture                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Voies smoke du chemin de release Docker du cœur.                        |
| `package-update-openai`                                         | Comportement d’installation et de mise à jour du paquet OpenAI.         |
| `package-update-anthropic`                                      | Comportement d’installation et de mise à jour du paquet Anthropic.      |
| `package-update-core`                                           | Comportement de paquet et de mise à jour indépendant du fournisseur.    |
| `plugins-runtime-plugins`                                       | Voies d’exécution Plugin qui exercent le comportement des Plugins.      |
| `plugins-runtime-services`                                      | Voies d’exécution Plugin adossées à des services ; inclut OpenWebUI lorsqu’il est demandé. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Lots d’installation/exécution Plugin divisés pour la validation de release parallèle. |

Utilisez `docker_lanes=<lane[,lane]>` ciblé sur le workflow live/E2E réutilisable
lorsqu’une seule voie Docker a échoué. Les artefacts de release incluent des
commandes de relance par voie avec artefact de paquet et entrées de réutilisation
d’image lorsqu’ils sont disponibles.

## Profils de release

`release_profile` contrôle surtout l’étendue en direct/fournisseur dans les vérifications de publication.
Il ne retire pas la CI complète normale, la prépublication Plugin, le smoke d’installation, l’acceptation de package, le QA Lab, ni les parties du chemin de publication Docker. `full` fait aussi exécuter par le workflow global l’E2E Telegram de package contre l’artefact de package de publication lorsque `rerun_group=all`, afin qu’un candidat de prépublication complet ne saute pas silencieusement cette voie de package Telegram.

| Profil    | Utilisation prévue                   | Couverture en direct/fournisseur incluse                                                                                                                                             |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Smoke de publication critique le plus rapide. | Chemin en direct OpenAI/core, modèles Docker en direct pour OpenAI, cœur du Gateway natif, profil Gateway OpenAI natif, Plugin OpenAI natif et Gateway Docker en direct OpenAI.       |
| `stable`  | Profil d’approbation de publication par défaut. | `minimum` plus Anthropic, Google, MiniMax, backend, harnais de test natif en direct, backend CLI Docker en direct, liaison ACP Docker, harnais Codex Docker et un shard de smoke OpenCode Go. |
| `full`    | Balayage consultatif large.          | `stable` plus fournisseurs consultatifs, shards Plugin en direct et shards média en direct.                                                                                          |

## Ajouts réservés à full

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                          | Couverture réservée à full                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Modèles Docker en direct         | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                              |
| Gateway Docker en direct         | Shard consultatif pour DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI et Z.ai. |
| Profils de fournisseurs du Gateway natif | Fireworks, DeepSeek, shards complets de modèles OpenCode Go, OpenRouter, xAI et Z.ai. |
| Shards Plugin natifs en direct   | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                |
| Shards média natifs en direct    | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                  |

`stable` inclut `native-live-src-gateway-profiles-opencode-go-smoke` ; `full`
utilise plutôt les shards de modèles OpenCode Go plus larges.

## Réexécutions ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de publication non liées :

| Identifiant         | Portée                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Toutes les étapes de validation complète de publication.             |
| `ci`                | Enfant CI complète manuelle uniquement.                              |
| `plugin-prerelease` | Enfant prépublication Plugin uniquement.                             |
| `release-checks`    | Toutes les étapes des vérifications de publication OpenClaw.         |
| `install-smoke`     | Smoke d’installation via les vérifications de publication.           |
| `cross-os`          | Vérifications de publication inter-OS.                               |
| `live-e2e`          | Validation E2E repo/en direct et chemin de publication Docker.        |
| `package`           | Acceptation de package.                                              |
| `qa`                | Parité QA plus voies QA en direct.                                   |
| `qa-parity`         | Voies de parité QA et rapport uniquement.                            |
| `qa-live`           | Matrice QA en direct et Telegram uniquement.                         |
| `npm-telegram`      | E2E Telegram du package publié ; nécessite `npm_telegram_package_spec`. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une seule suite en direct a échoué.
Les identifiants de filtre valides sont définis dans le workflow réutilisable en direct/E2E, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

## Preuves à conserver

Conservez le récapitulatif `Full Release Validation` comme index au niveau de la publication. Il lie
les identifiants des exécutions enfants et inclut les tableaux des jobs les plus lents. En cas d’échec, inspectez d’abord le workflow enfant, puis réexécutez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis `OpenClaw Release Checks`
- Artefacts du chemin de publication Docker sous `.artifacts/docker-tests/`
- Artefacts `package-under-test` de l’acceptation de package et artefacts d’acceptation Docker
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

---
read_when:
    - Exécuter ou relancer la validation complète de version
    - Comparaison des profils stable et complet de validation de version
    - Débogage des échecs des étapes de validation de version
summary: Étapes de validation complète de la publication, flux de travail enfants, profils de publication, identifiants de réexécution et preuves
title: Validation complète de la version
x-i18n:
    generated_at: "2026-05-02T07:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` est le processus englobant de release. C’est le point d’entrée manuel unique pour la preuve de pré-release, mais la majeure partie du travail se déroule dans des workflows enfants afin qu’une box échouée puisse être relancée sans redémarrer toute la release.

Exécutez-le depuis une référence de workflow de confiance, normalement `main`, et transmettez la branche de release, le tag ou le SHA complet de commit comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Les workflows enfants utilisent la référence de workflow de confiance pour le harnais et l’entrée `ref` pour le candidat testé. Cela permet de garder la nouvelle logique de validation disponible lors de la validation d’une ancienne branche ou d’un ancien tag de release.

## Étapes de premier niveau

| Étape                | Détails                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Résolution de la cible    | **Job :** `Resolve target ref`<br />**Workflow enfant :** aucun<br />**Prouve :** résout la branche de release, le tag ou le SHA complet de commit et enregistre les entrées sélectionnées.<br />**Relance :** relancez le processus englobant si cela échoue.                                                                                                                                                                              |
| Vitest et CI normale | **Job :** `Run normal full CI`<br />**Workflow enfant :** `CI`<br />**Prouve :** graphe CI complet manuel sur la référence cible, y compris les lanes Linux Node, les shards de Plugins groupés, les contrats de canal, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les vérifications de docs, les Skills Python, Windows, macOS, l’i18n de Control UI et Android via le processus englobant.<br />**Relance :** `rerun_group=ci`. |
| Pré-release de Plugin    | **Job :** `Run plugin prerelease validation`<br />**Workflow enfant :** `Plugin Prerelease`<br />**Prouve :** vérifications statiques réservées à la release pour les Plugins, couverture agentique des Plugins, shards complets de lots d’extensions et lanes Docker de pré-release de Plugins.<br />**Relance :** `rerun_group=plugin-prerelease`.                                                                                                       |
| Vérifications de release       | **Job :** `Run release/live/Docker/QA validation`<br />**Workflow enfant :** `OpenClaw Release Checks`<br />**Prouve :** smoke d’installation, vérifications de paquet multiplateforme, suites live/E2E, morceaux du chemin de release Docker, Package Acceptance, parité QA Lab, Matrix live et Telegram live.<br />**Relance :** `rerun_group=release-checks` ou un handle release-checks plus restreint.                                |
| Package Telegram     | **Job :** `Run package Telegram E2E`<br />**Workflow enfant :** `NPM Telegram Beta E2E`<br />**Prouve :** preuve du paquet Telegram basée sur artefact pour `rerun_group=all` avec `release_profile=full`, ou preuve Telegram du paquet publié lorsque `npm_telegram_package_spec` est défini.<br />**Relance :** `rerun_group=npm-telegram` avec `npm_telegram_package_spec`.                                     |
| Vérificateur englobant    | **Job :** `Verify full validation`<br />**Workflow enfant :** aucun<br />**Prouve :** revérifie les conclusions enregistrées des exécutions enfants et ajoute les tableaux des jobs les plus lents depuis les workflows enfants.<br />**Relance :** relancez uniquement ce job après avoir relancé un enfant échoué jusqu’au vert.                                                                                                                                   |

Pour `ref=main` et `rerun_group=all`, un processus englobant plus récent en remplace un plus ancien. Lorsque le parent est annulé, son moniteur annule tout workflow enfant qu’il a déjà déclenché. Les exécutions de validation de branches et de tags de release ne s’annulent pas mutuellement par défaut.

## Étapes des vérifications de release

`OpenClaw Release Checks` est le plus grand workflow enfant. Il résout la cible une seule fois et prépare un artefact partagé `release-package-under-test` lorsque les étapes orientées paquet ou Docker en ont besoin.

| Étape               | Détails                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cible de release      | **Job :** `Resolve target ref`<br />**Workflow sous-jacent :** aucun<br />**Tests :** référence sélectionnée, SHA attendu facultatif, profil, groupe de relance et filtre ciblé de suite live.<br />**Relance :** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artefact de paquet    | **Job :** `Prepare release package artifact`<br />**Workflow sous-jacent :** aucun<br />**Tests :** emballe ou résout un tarball candidat et téléverse `release-package-under-test` pour les vérifications aval orientées paquet.<br />**Relance :** le groupe de paquet, multiplateforme ou live/E2E affecté.                                                                                                           |
| Smoke d’installation       | **Job :** `Run install smoke`<br />**Workflow sous-jacent :** `Install Smoke`<br />**Tests :** chemin d’installation complet avec réutilisation de l’image de smoke du Dockerfile racine, installation de paquet QR, smokes Docker racine et Gateway, tests Docker d’installateur, smoke de fournisseur d’images en installation globale Bun, et E2E rapide d’installation/désinstallation de Plugins groupés.<br />**Relance :** `rerun_group=install-smoke`.                              |
| Multiplateforme            | **Job :** `cross_os_release_checks`<br />**Workflow sous-jacent :** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests :** lanes fraîches et de mise à niveau sur Linux, Windows et macOS pour le fournisseur et le mode sélectionnés, en utilisant le tarball candidat plus un paquet de référence.<br />**Relance :** `rerun_group=cross-os`.                                                                               |
| Repo et E2E live   | **Job :** `Run repo/live E2E validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** E2E du dépôt, cache live, streaming websocket OpenAI, shards natifs de fournisseur live et de Plugin, et harnais live avec Docker pour modèle/backend/Gateway sélectionnés par `release_profile`.<br />**Relance :** `rerun_group=live-e2e`, éventuellement avec `live_suite_filter`. |
| Chemin de release Docker | **Job :** `Run Docker release-path validation`<br />**Workflow sous-jacent :** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests :** morceaux Docker du chemin de release sur l’artefact de paquet partagé.<br />**Relance :** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job :** `Run package acceptance`<br />**Workflow sous-jacent :** `Package Acceptance`<br />**Tests :** fixtures hors ligne de paquets de Plugins, mise à jour de Plugin et acceptation du paquet Telegram mock-OpenAI sur le même tarball.<br />**Relance :** `rerun_group=package`.                                                                                                                                  |
| Parité QA           | **Job :** `Run QA Lab parity lane` et `Run QA Lab parity report`<br />**Workflow sous-jacent :** jobs directs<br />**Tests :** packs de parité agentique candidat et de référence, puis le rapport de parité.<br />**Relance :** `rerun_group=qa-parity` ou `rerun_group=qa`.                                                                                                                                       |
| Matrix live QA      | **Job :** `Run QA Lab live Matrix lane`<br />**Workflow sous-jacent :** job direct<br />**Tests :** profil QA Matrix live rapide dans l’environnement `qa-live-shared`.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                        |
| Telegram live QA    | **Job :** `Run QA Lab live Telegram lane`<br />**Workflow sous-jacent :** job direct<br />**Tests :** QA Telegram live avec leases d’identifiants Convex CI.<br />**Relance :** `rerun_group=qa-live` ou `rerun_group=qa`.                                                                                                                                                                                    |
| Vérificateur de release    | **Job :** `Verify release checks`<br />**Workflow sous-jacent :** aucun<br />**Tests :** jobs release-check requis pour le groupe de relance sélectionné.<br />**Relance :** relancez après la réussite des jobs enfants ciblés.                                                                                                                                                                                                 |

## Morceaux du chemin de release Docker

L’étape du chemin de release Docker exécute ces morceaux lorsque `live_suite_filter` est vide :

| Morceau                                                           | Couverture                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Lanes de smoke du chemin de release Docker du cœur.                                   |
| `package-update-openai`                                         | Installation du paquet OpenAI et comportement de mise à jour.                             |
| `package-update-anthropic`                                      | Installation du paquet Anthropic et comportement de mise à jour.                          |
| `package-update-core`                                           | Comportement de paquet et de mise à jour neutre vis-à-vis du fournisseur.                           |
| `plugins-runtime-plugins`                                       | Lanes d’exécution de Plugins qui exercent le comportement des Plugins.                     |
| `plugins-runtime-services`                                      | Lanes d’exécution de Plugins adossées à des services ; inclut OpenWebUI lorsque demandé. |
| `plugins-runtime-install-a` à `plugins-runtime-install-h` | Lots d’installation/exécution de Plugins divisés pour la validation de release parallèle.   |

Utilisez `docker_lanes=<lane[,lane]>` ciblé sur le workflow live/E2E réutilisable lorsqu’une seule lane Docker a échoué. Les artefacts de release incluent des commandes de relance par lane avec les entrées d’artefact de paquet et de réutilisation d’image lorsqu’elles sont disponibles.

## Profils de release

`release_profile` contrôle principalement l’étendue live/fournisseur dans les vérifications de release. Il ne supprime pas la CI complète normale, Plugin Prerelease, le smoke d’installation, l’acceptation de paquet, QA Lab ni les morceaux du chemin de release Docker. `full` fait aussi exécuter au processus englobant l’E2E Telegram de paquet sur l’artefact de paquet de release lorsque `rerun_group=all`, afin qu’un candidat complet avant publication ne saute pas silencieusement cette lane de paquet Telegram.

| Profil   | Utilisation prévue                      | Couverture live/fournisseur incluse                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke le plus rapide critique pour la release.   | Chemin live OpenAI/cœur, modèles Docker live pour OpenAI, cœur du gateway natif, profil de gateway OpenAI natif, plugin OpenAI natif et gateway Docker live OpenAI.               |
| `stable`  | Profil d’approbation de release par défaut. | `minimum` plus Anthropic, Google, MiniMax, backend, harnais de test live natif, backend CLI Docker live, liaison Docker ACP, harnais Docker Codex et un shard de smoke OpenCode Go. |
| `full`    | Balayage consultatif étendu.             | `stable` plus fournisseurs consultatifs, shards live de plugins et shards live multimédias.                                                                                                  |

## Ajouts full uniquement

Ces suites sont ignorées par `stable` et incluses par `full` :

| Domaine                             | Couverture full uniquement                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modèles Docker live               | OpenCode Go, OpenRouter, xAI, Z.ai et Fireworks.                              |
| Gateway Docker live              | Shard consultatif pour DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI et Z.ai. |
| Profils de fournisseur du gateway natif | Fireworks, DeepSeek, shards complets de modèles OpenCode Go, OpenRouter, xAI et Z.ai.  |
| Shards live de plugins natifs        | Plugins A-K, L-N, O-Z autres, Moonshot et xAI.                                 |
| Shards live multimédias natifs         | Audio, musique Google, musique MiniMax et groupes vidéo A-D.                       |

`stable` inclut `native-live-src-gateway-profiles-opencode-go-smoke` ; `full`
utilise plutôt les shards plus larges de modèles OpenCode Go.

## Réexécutions ciblées

Utilisez `rerun_group` pour éviter de répéter des boîtes de release sans rapport :

| Identifiant              | Portée                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Toutes les étapes Full Release Validation.                                   |
| `ci`                | Enfant CI complet manuel uniquement.                                            |
| `plugin-prerelease` | Enfant Plugin Prerelease uniquement.                                         |
| `release-checks`    | Toutes les étapes OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke jusqu’aux vérifications de release.                                 |
| `cross-os`          | Vérifications de release cross-OS.                                              |
| `live-e2e`          | Validation E2E repo/live et chemin de release Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parité QA plus voies QA live.                                         |
| `qa-parity`         | Voies de parité QA et rapport uniquement.                                      |
| `qa-live`           | Matrice QA live et Telegram uniquement.                                     |
| `npm-telegram`      | E2E Telegram de package publié ; nécessite `npm_telegram_package_spec`. |

Utilisez `live_suite_filter` avec `rerun_group=live-e2e` lorsqu’une suite live a échoué.
Les identifiants de filtre valides sont définis dans le workflow live/E2E réutilisable, notamment
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` et
`live-codex-harness-docker`.

## Preuves à conserver

Conservez le résumé `Full Release Validation` comme index au niveau de la release. Il lie
les identifiants d’exécution enfants et inclut les tableaux des jobs les plus lents. En cas d’échec, inspectez d’abord le
workflow enfant, puis réexécutez le plus petit identifiant correspondant ci-dessus.

Artefacts utiles :

- `release-package-under-test` depuis `OpenClaw Release Checks`
- Artefacts de chemin de release Docker sous `.artifacts/docker-tests/`
- `package-under-test` de Package Acceptance et artefacts d’acceptation Docker
- Artefacts de vérification de release cross-OS pour chaque OS et suite
- Artefacts de parité QA, Matrix et Telegram

## Fichiers de workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`

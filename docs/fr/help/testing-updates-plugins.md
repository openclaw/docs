---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation des packages ou d’installation de Plugin d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage de la mise à jour de paquet, du nettoyage des dépendances de Plugin ou des régressions d’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de packages et le comportement d’installation/de mise à jour des Plugins
title: 'Tests : mises à jour et plugins'
x-i18n:
    generated_at: "2026-05-02T20:47:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Voici la checklist dédiée à la validation des mises à jour et des Plugin. L’objectif est simple : prouver que le package installable peut mettre à jour l’état réel des utilisateurs, réparer l’état hérité obsolète via `doctor`, et toujours installer, charger, mettre à jour et désinstaller des plugins depuis les sources prises en charge.

Pour la carte plus large de l’exécuteur de tests, consultez [Tests](/fr/help/testing). Pour les clés de fournisseurs en direct et les suites qui touchent au réseau, consultez [Tests en direct](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de Plugin protègent ces contrats :

- Une archive tarball de package est complète, possède un `dist/postinstall-inventory.json` valide, et ne dépend pas de fichiers du dépôt non empaquetés.
- Un utilisateur peut passer d’un ancien package publié au package candidat sans perdre sa configuration, ses agents, ses sessions, ses espaces de travail, ses listes d’autorisation de plugins ou sa configuration de canal.
- `openclaw doctor --fix --non-interactive` possède les chemins de nettoyage et de réparation hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour l’état obsolète des plugins.
- Les installations de Plugin fonctionnent depuis des répertoires locaux, des dépôts git, des packages npm et le chemin de registre ClawHub.
- Les dépendances npm des plugins sont installées dans la racine npm gérée, analysées avant l’approbation, et supprimées via npm pendant la désinstallation afin que les dépendances hissées ne persistent pas.
- La mise à jour des plugins est stable lorsque rien n’a changé : les enregistrements d’installation, la source résolue, la disposition des dépendances installées et l’état activé restent intacts.

## Preuve locale pendant le développement

Commencez de manière ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements d’installation, de désinstallation, de dépendances ou d’inventaire de package de Plugin, exécutez aussi les tests ciblés qui couvrent le point de jonction modifié :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’une voie Docker de package ne consomme une archive tarball, prouvez l’artefact de package :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive config/docs/API, écrit l’inventaire de distribution du package, exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe l’archive tarball dans un préfixe temporaire, exécute postinstall et effectue un smoke test des points d’entrée des canaux groupés.

## Voies Docker

Les voies Docker constituent la preuve au niveau produit. Elles installent ou mettent à jour un package réel dans des conteneurs Linux et vérifient le comportement au moyen de commandes CLI, du démarrage du Gateway, de sondes HTTP, de l’état RPC et de l’état du système de fichiers.

Utilisez des voies ciblées pendant l’itération :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Voies importantes :

- `test:docker:plugins` valide le smoke test d’installation des plugins, les installations de dossiers locaux, le comportement d’évitement de mise à jour des dossiers locaux, les dossiers locaux avec dépendances préinstallées, les installations de packages `file:`, les installations git avec exécution CLI, les mises à jour de références git mobiles, les installations depuis le registre npm avec dépendances transitives hissées, les no-ops de mise à jour npm, les installations depuis un fixture ClawHub local et les no-ops de mise à jour, le comportement de mise à jour de la marketplace, ainsi que l’activation/l’inspection du bundle Claude. Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-update` valide qu’un plugin installé inchangé ne se réinstalle pas et ne perd pas ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe l’archive tarball candidate par-dessus un fixture d’ancien utilisateur sale, exécute la mise à jour du package plus doctor non interactif, puis démarre un Gateway en loopback et vérifie la préservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une base publiée, la configure au moyen d’une recette `openclaw config set` intégrée, la met à jour vers l’archive tarball candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway et sonde `/healthz`, `/readyz` et l’état RPC.
- `test:docker:update-migration` est la voie de mise à jour publiée axée sur le nettoyage. Elle part d’un état utilisateur configuré de style Discord/Telegram, exécute le doctor de base afin que les dépendances des plugins configurés aient une chance de se matérialiser, ensemence des débris de dépendances de plugins hérités pour un plugin empaqueté configuré, met à jour vers l’archive tarball candidate, et exige que le doctor post-mise à jour supprime les racines de dépendances héritées.

Variantes utiles de published-upgrade survivor :

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Les scénarios disponibles sont `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` et `versioned-runtime-deps`. Dans les exécutions agrégées, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` s’étend à tous les scénarios de forme issue signalée, y compris la migration d’installation de plugin configuré.

La migration complète de mise à jour est volontairement séparée de la CI Full Release. Utilisez le workflow manuel `Update Migration` lorsque la question de release est « chaque release stable publiée depuis 2026.4.23 peut-elle être mise à jour vers ce candidat et nettoyer les débris de dépendances de plugins ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Acceptation du package

Package Acceptance est la gate de package native GitHub. Elle résout un package candidat en une archive tarball `package-under-test`, enregistre la version et le SHA-256, puis exécute des voies Docker E2E réutilisables contre cette archive tarball exacte. La réf du harnais de workflow est séparée de la réf source du package, afin que la logique de test actuelle puisse valider d’anciennes releases approuvées.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest` ou une version publiée exacte.
- `source=ref` : empaqueter une branche, une balise ou un commit approuvé avec le harnais actuel sélectionné.
- `source=url` : valider une archive tarball HTTPS avec `package_sha256` obligatoire.
- `source=artifact` : réutiliser une archive tarball téléversée par une autre exécution Actions.

Full Release Validation utilise `source=artifact` par défaut, construit depuis le SHA de release résolu. Pour une preuve post-publication, passez `package_acceptance_package_spec=openclaw@YYYY.M.D` afin que la même matrice de mise à niveau cible plutôt le package npm livré.

Les contrôles de release appellent Package Acceptance avec l’ensemble package/mise à jour/Plugin :

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ils passent aussi :

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela maintient la migration de package, la commutation de canal de mise à jour, le nettoyage des dépendances de plugins obsolètes, la couverture de plugins hors ligne, le comportement de mise à jour des plugins et la QA du package Telegram sur le même artefact résolu.

`all-since-2026.4.23` est l’échantillon de mise à niveau de la CI Full Release : chaque release stable publiée sur npm depuis `2026.4.23` jusqu’à `latest`. Pour une couverture exhaustive de migration de mise à jour publiée, utilisez `all-since-2026.4.23` dans le workflow Update Migration séparé au lieu de la CI Full Release. `release-history` reste disponible pour un échantillonnage manuel plus large lorsque vous voulez aussi l’ancre héritée antérieure à cette date.

Exécutez manuellement un profil de package lors de la validation d’un candidat avant release :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Utilisez `suite_profile=product` lorsque la question de release inclut les canaux MCP, le nettoyage cron/sous-agent, la recherche web OpenAI ou OpenWebUI. Utilisez `suite_profile=full` uniquement lorsque vous avez besoin d’une couverture Docker complète du chemin de release.

## Valeur par défaut de release

Pour les release candidates, la pile de preuves par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau source.
2. `pnpm release:check` pour l’intégrité de l’artefact de package.
3. Le profil Package Acceptance `package` ou les voies de package personnalisées release-check pour les contrats d’installation/mise à jour/Plugin.
4. Les contrôles de release inter-OS pour l’installateur, l’onboarding et le comportement de plateforme propres à l’OS.
5. Les suites live uniquement lorsque la surface modifiée touche le comportement d’un fournisseur ou d’un service hébergé.

Sur les machines de mainteneur, les gates larges et les preuves produit Docker/package doivent s’exécuter dans Testbox sauf preuve locale explicitement demandée.

## Compatibilité héritée

La tolérance de compatibilité est étroite et limitée dans le temps :

- Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer les lacunes de métadonnées de package déjà livrées dans Package Acceptance.
- Le package publié `2026.4.26` peut avertir pour les fichiers d’horodatage de métadonnées de build local déjà livrés.
- Les packages ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu de générer un avertissement ou d’être ignorées.

N’ajoutez pas de nouvelles migrations au démarrage pour ces anciens formats. Ajoutez ou étendez une réparation doctor, puis prouvez-la avec `upgrade-survivor` ou `published-upgrade-survivor`.

## Ajouter une couverture

Lorsque vous modifiez le comportement de mise à jour ou de Plugin, ajoutez une couverture à la couche la plus basse qui peut échouer pour la bonne raison :

- Logique pure de chemin ou de métadonnées : test unitaire à côté de la source.
- Inventaire de package ou comportement de fichier empaqueté : test `package-dist-inventory` ou de vérificateur d’archive tarball.
- Comportement d’installation/mise à jour CLI : assertion ou fixture de voie Docker.
- Comportement de migration de release publiée : scénario `published-upgrade-survivor`.
- Comportement de source registre/package : fixture `test:docker:plugins` ou serveur fixture ClawHub.
- Disposition ou comportement de nettoyage des dépendances : vérifiez à la fois l’exécution runtime et la frontière du système de fichiers. Les dépendances npm peuvent être hissées sous la racine npm gérée, donc les tests doivent prouver que la racine est analysée/nettoyée au lieu de supposer une arborescence `node_modules` locale au package.

Gardez les nouveaux fixtures Docker hermétiques par défaut. Utilisez des registres de fixtures locaux et de faux packages sauf si le but du test est le comportement d’un registre live.

## Triage des échecs

Commencez par l’identité de l’artefact :

- Résumé `resolve_package` de Package Acceptance : source, version, SHA-256 et nom d’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`, `failures.json`, journaux de voie et commandes de réexécution.
- Résumé upgrade survivor : `.artifacts/upgrade-survivor/summary.json`, incluant la version de base, la version candidate, le scénario, les timings de phase et les étapes de recette.

Préférez réexécuter la voie exacte échouée avec le même artefact de package plutôt que de relancer toute l’ombrelle de release.

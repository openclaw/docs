---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation des packages ou d’installation de Plugin d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage de la mise à jour de packages, du nettoyage des dépendances de Plugin ou des régressions d’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de paquets et le comportement d’installation/mise à jour du Plugin
title: 'Tests : mises à jour et plugins'
x-i18n:
    generated_at: "2026-05-05T06:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Voici la checklist dédiée à la validation des mises à jour et des plugins. L’objectif est
simple : prouver que le package installable peut mettre à jour un état utilisateur réel,
réparer un état hérité obsolète via `doctor`, et toujours installer, charger, mettre à jour
et désinstaller des plugins depuis les sources prises en charge.

Pour la carte plus large du lanceur de tests, consultez [Tests](/fr/help/testing). Pour les
clés de fournisseurs en direct et les suites qui touchent au réseau, consultez [Tests en direct](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de plugins protègent ces contrats :

- Une archive tarball de package est complète, possède un `dist/postinstall-inventory.json` valide,
  et ne dépend pas de fichiers de dépôt non empaquetés.
- Un utilisateur peut passer d’un package publié plus ancien au package candidat
  sans perdre la configuration, les agents, les sessions, les espaces de travail, les listes d’autorisation de plugins ou
  la configuration des canaux.
- `openclaw doctor --fix --non-interactive` possède les chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour l’état
  obsolète des plugins.
- Les installations de plugins fonctionnent depuis des répertoires locaux, des dépôts git, des packages npm et le
  chemin de registre ClawHub.
- Les dépendances npm de plugins sont installées dans la racine npm gérée, analysées avant
  la confiance, et supprimées via npm pendant la désinstallation afin que les dépendances hissées ne
  persistent pas.
- La mise à jour des plugins est stable lorsque rien n’a changé : les enregistrements d’installation, la source
  résolue, l’organisation des dépendances installées et l’état activé restent intacts.

## Preuve locale pendant le développement

Commencez de façon ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements d’installation, de désinstallation, de dépendances ou d’inventaire de package de plugins, exécutez aussi
les tests ciblés qui couvrent la jonction modifiée :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’une lane Docker de package ne consomme une tarball, prouvez l’artefact de package :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive config/docs/API, écrit l’inventaire dist du package,
exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe
la tarball dans un préfixe temporaire, exécute postinstall et teste rapidement les points d’entrée
des canaux intégrés.

## Lanes Docker

Les lanes Docker sont la preuve au niveau produit. Elles installent ou mettent à jour un vrai
package dans des conteneurs Linux et vérifient le comportement via des commandes CLI,
le démarrage du Gateway, des sondes HTTP, l’état RPC et l’état du système de fichiers.

Utilisez les lanes ciblées pendant l’itération :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lanes importantes :

- `test:docker:plugins` valide le smoke test d’installation de plugin, les installations de dossiers locaux,
  le comportement d’omission des mises à jour de dossiers locaux, les dossiers locaux avec dépendances
  préinstallées, les installations de packages `file:`, les installations git avec exécution CLI, les mises à jour
  de refs git mobiles, les installations depuis le registre npm avec dépendances transitives
  hissées, les no-op de mise à jour npm, les installations depuis fixture ClawHub locale et les no-op
  de mise à jour, le comportement de mise à jour de marketplace, et l’activation/inspection du bundle Claude. Définissez
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-lifecycle-matrix` installe le package candidat dans un conteneur nu,
  fait passer un plugin npm par installation, inspection, désactivation, activation,
  mise à niveau explicite, rétrogradation explicite et désinstallation après suppression du code
  du plugin. Il journalise les métriques RSS et CPU pour chaque phase.
- `test:docker:plugin-update` vérifie qu’un plugin installé inchangé ne se
  réinstalle pas et ne perd pas ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe la tarball candidate par-dessus une fixture
  d’ancien utilisateur sale, exécute la mise à jour du package plus doctor non interactif, puis démarre
  un Gateway loopback et vérifie la préservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une base publiée,
  la configure via une recette `openclaw config set` intégrée, la met à jour vers la
  tarball candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway et
  sonde `/healthz`, `/readyz` et l’état RPC.
- `test:docker:update-restart-auth` installe le package candidat, démarre un
  Gateway géré avec auth par jeton, supprime l’env d’auth gateway de l’appelant pour
  `openclaw update --yes --json`, et exige que la commande de mise à jour candidate
  redémarre le Gateway avant les sondes normales.
- `test:docker:update-migration` est la lane de mise à jour publiée axée sur le nettoyage. Elle
  part d’un état utilisateur configuré de style Discord/Telegram, exécute le doctor de base
  afin que les dépendances de plugins configurées aient une chance de se matérialiser, ensemence
  des débris hérités de dépendances de plugins pour un plugin packagé configuré, met à jour vers
  la tarball candidate, et exige que le doctor post-mise à jour supprime les racines de dépendances
  héritées.

Variantes utiles de published-upgrade survivor :

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Les scénarios disponibles sont `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` et `versioned-runtime-deps`. Dans les exécutions agrégées,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` s’étend à tous les scénarios
en forme de problèmes signalés, y compris la migration d’installation de plugins configurés.

La migration complète de mise à jour est intentionnellement séparée de la CI Full Release. Utilisez le
workflow manuel `Update Migration` lorsque la question de release est « chaque
release stable publiée depuis 2026.4.23 peut-elle être mise à jour vers ce candidat et
nettoyer les débris de dépendances de plugins ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance est la gate de package native GitHub. Elle résout un package
candidat en une tarball `package-under-test`, enregistre la version et le SHA-256, puis
exécute des lanes Docker E2E réutilisables contre cette tarball exacte. La ref du harnais de workflow
est séparée de la ref source du package, afin que la logique de test actuelle puisse valider
des releases de confiance plus anciennes.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest` ou une version
  publiée exacte.
- `source=ref` : empaqueter une branche, un tag ou un commit de confiance avec le harnais actuel
  sélectionné.
- `source=url` : valider une tarball HTTPS avec `package_sha256` requis.
- `source=artifact` : réutiliser une tarball téléversée par une autre exécution Actions.

Full Release Validation utilise `source=artifact` par défaut, construit depuis le
SHA de release résolu. Pour une preuve post-publication, passez
`package_acceptance_package_spec=openclaw@YYYY.M.D` afin que la même matrice de mise à niveau
cible plutôt le package npm livré.

Les contrôles de release appellent Package Acceptance avec l’ensemble package/update/restart/plugin :

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Lorsque le soak de release est activé, ils passent aussi :

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela garde la migration de package, le changement de canal de mise à jour, le nettoyage des dépendances
de plugins obsolètes, la couverture de plugins hors ligne, le comportement de mise à jour de plugins et la QA du package
Telegram sur le même artefact résolu, sans faire parcourir chaque release publiée
à la gate de package de release par défaut.

`last-stable-4` se résout aux quatre dernières releases OpenClaw stables publiées sur npm.
L’acceptation du package de release épingle `2026.4.23` comme première limite de compatibilité
de mise à jour des plugins, `2026.5.2` comme limite de turbulence d’architecture de plugins, et
`2026.4.15` comme base de mise à jour publiée 2026.4.1x plus ancienne ; le résolveur
déduplique les épingles déjà présentes dans les quatre dernières. Pour une couverture exhaustive de migration de
mise à jour publiée, utilisez `all-since-2026.4.23` dans le workflow Update Migration
séparé au lieu de la CI Full Release. `release-history` reste
disponible pour un échantillonnage manuel plus large lorsque vous voulez aussi l’ancre héritée
antérieure à la date.

Lorsque plusieurs bases published-upgrade survivor sont sélectionnées, le workflow Docker
réutilisable répartit chaque base dans son propre job de runner ciblé. Chaque
fragment de base exécute toujours l’ensemble de scénarios sélectionné, mais les journaux et artefacts restent
par base et le temps total est borné par le fragment le plus lent au lieu d’un gros
job sériel.

Exécutez manuellement un profil de package lors de la validation d’un candidat avant release :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Utilisez `suite_profile=product` lorsque la question de release inclut les canaux MCP,
le nettoyage cron/sous-agent, la recherche web OpenAI ou OpenWebUI. Utilisez `suite_profile=full`
uniquement lorsque vous avez besoin d’une couverture Docker complète du chemin de release.

## Valeur par défaut de release

Pour les candidats de release, la pile de preuve par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau source.
2. `pnpm release:check` pour l’intégrité de l’artefact de package.
3. Le profil `package` de Package Acceptance ou les lanes de package personnalisées des contrôles de release
   pour les contrats d’installation/mise à jour/redémarrage/plugin.
4. Les contrôles de release inter-OS pour le comportement spécifique à l’OS de l’installateur,
   de l’onboarding et de la plateforme.
5. Les suites live uniquement lorsque la surface modifiée touche au comportement d’un fournisseur ou d’un service
   hébergé.

Sur les machines de mainteneurs, les gates larges et la preuve produit Docker/package doivent s’exécuter
dans Testbox sauf en cas de preuve locale explicite.

## Compatibilité héritée

La tolérance de compatibilité est étroite et limitée dans le temps :

- Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  les lacunes de métadonnées de package déjà livrées dans Package Acceptance.
- Le package publié `2026.4.26` peut avertir pour les fichiers d’horodatage de métadonnées
  de build local déjà livrés.
- Les packages ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu
  d’avertir ou de passer.

N’ajoutez pas de nouvelles migrations au démarrage pour ces anciennes formes. Ajoutez ou étendez une réparation
doctor, puis prouvez-la avec `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` lorsque la commande de mise à jour possède le redémarrage.

## Ajouter de la couverture

Lorsque vous changez le comportement de mise à jour ou de plugins, ajoutez de la couverture à la couche la plus basse qui
peut échouer pour la bonne raison :

- Logique pure de chemin ou de métadonnées : test unitaire à côté de la source.
- Comportement d’inventaire de package ou de fichiers empaquetés : `package-dist-inventory` ou test de vérificateur
  de tarball.
- Comportement CLI d’installation/mise à jour : assertion ou fixture de lane Docker.
- Comportement de migration de release publiée : scénario `published-upgrade-survivor`.
- Comportement de redémarrage possédé par la mise à jour : `update-restart-auth`.
- Comportement de source registre/package : fixture `test:docker:plugins` ou serveur de fixture ClawHub.
- Comportement d’organisation ou de nettoyage des dépendances : vérifiez à la fois l’exécution runtime et la
  limite du système de fichiers. Les dépendances npm peuvent être hissées sous la racine npm
  gérée, les tests doivent donc prouver que la racine est analysée/nettoyée au lieu de supposer une
  arborescence `node_modules` locale au package.

Gardez les nouvelles fixtures Docker hermétiques par défaut. Utilisez des registres de fixtures locaux et
de faux packages, sauf si l’objectif du test est le comportement d’un registre live.

## Triage des échecs

Commencez par l’identité de l’artefact :

- Résumé `resolve_package` de l’acceptation du paquet : source, version, SHA-256 et
  nom de l’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux de voie d’exécution et commandes de relance.
- Résumé des éléments survivants à la mise à niveau : `.artifacts/upgrade-survivor/summary.json`,
  comprenant la version de référence, la version candidate, le scénario, les durées
  des phases et les étapes de la recette.

Préférez relancer la voie d’exécution exacte qui a échoué avec le même artefact
de paquet plutôt que relancer toute l’ombrelle de publication.

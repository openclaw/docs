---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation de package ou d’installation de Plugin d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage des régressions liées à la mise à jour des packages, au nettoyage des dépendances de Plugin ou à l’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de paquets et le comportement d’installation/mise à jour des plugins
title: 'Tests : mises à jour et plugins'
x-i18n:
    generated_at: "2026-06-27T17:36:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Cette checklist est dédiée à la validation des mises à jour et des Plugins. L’objectif est
simple : prouver que le package installable peut mettre à jour un état utilisateur réel, réparer
l’ancien état obsolète via `doctor`, et toujours installer, charger, mettre à jour et désinstaller
des Plugins depuis les sources prises en charge.

Pour la cartographie plus générale du lanceur de tests, consultez [Tests](/fr/help/testing). Pour les clés de fournisseurs live
et les suites qui touchent au réseau, consultez [Tests live](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de Plugins protègent ces contrats :

- Une archive tarball de package est complète, possède un `dist/postinstall-inventory.json`
  valide, et ne dépend pas de fichiers du dépôt non empaquetés.
- Un utilisateur peut passer d’un ancien package publié au package candidat
  sans perdre sa configuration, ses agents, sessions, espaces de travail, listes d’autorisation de Plugins ou
  configuration de canaux.
- `openclaw doctor --fix --non-interactive` possède les chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour un état
  de Plugin obsolète.
- Les installations de Plugins fonctionnent depuis des répertoires locaux, des dépôts git, des packages npm et le
  chemin du registre ClawHub.
- Les dépendances npm des Plugins sont installées dans un projet npm géré par Plugin,
  analysées avant la confiance, et supprimées via npm pendant la désinstallation afin que les dépendances
  hissées ne persistent pas.
- La mise à jour de Plugin est stable quand rien n’a changé : les enregistrements d’installation, la source
  résolue, l’agencement des dépendances installées et l’état activé restent intacts.

## Preuve locale pendant le développement

Commencez de manière ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements d’installation, de désinstallation, de dépendances de Plugins ou d’inventaire de package, exécutez aussi
les tests ciblés qui couvrent la jointure modifiée :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’une voie Docker de package ne consomme une tarball, prouvez l’artefact du package :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive config/docs/API, écrit l’inventaire de distribution du package,
exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe
la tarball dans un préfixe temporaire, exécute postinstall, et teste sommairement les points d’entrée
des canaux groupés.

## Voies Docker

Les voies Docker sont la preuve au niveau produit. Elles installent ou mettent à jour un vrai
package dans des conteneurs Linux et vérifient le comportement via des commandes CLI,
le démarrage du Gateway, des sondes HTTP, le statut RPC et l’état du système de fichiers.

Utilisez des voies ciblées pendant l’itération :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Voies importantes :

- `test:docker:plugins` valide le test sommaire d’installation de Plugin, les installations depuis un dossier local,
  le comportement de saut de mise à jour pour les dossiers locaux, les dossiers locaux avec dépendances
  préinstallées, les installations de packages `file:`, les installations git avec exécution CLI, les mises à jour
  de références mobiles git, les installations depuis le registre npm avec dépendances transitives
  hissées, les no-op de mise à jour npm, le rejet des métadonnées de package npm malformées,
  les installations depuis une fixture ClawHub locale et les no-op de mise à jour, le comportement de mise à jour de marketplace,
  et l’activation/inspection du bundle Claude. Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour
  garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-lifecycle-matrix` installe le package candidat dans un conteneur nu,
  fait passer un Plugin npm par l’installation, l’inspection, la désactivation, l’activation,
  la mise à niveau explicite, la rétrogradation explicite et la désinstallation après suppression du code du Plugin.
  Il journalise les métriques RSS et CPU pour chaque phase.
- `test:docker:plugin-update` valide qu’un Plugin installé inchangé ne se
  réinstalle pas et ne perd pas ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe la tarball candidate par-dessus une fixture sale
  d’ancien utilisateur, exécute la mise à jour du package plus le doctor non interactif, puis démarre
  un Gateway en loopback et vérifie la préservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une base publiée,
  la configure via une recette `openclaw config set` intégrée, la met à jour vers la
  tarball candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway et
  sonde `/healthz`, `/readyz` et le statut RPC.
- `test:docker:update-restart-auth` installe le package candidat, démarre un
  Gateway géré avec authentification par jeton, désactive les variables d’environnement d’authentification Gateway de l’appelant pour
  `openclaw update --yes --json`, et exige que la commande de mise à jour candidate
  redémarre le Gateway avant les sondes normales.
- `test:docker:update-migration` est la voie de mise à jour publiée axée sur le nettoyage. Elle
  démarre depuis un état utilisateur configuré de style Discord/Telegram, exécute le
  doctor de base afin que les dépendances de Plugins configurés aient une chance de se matérialiser, sème
  des débris hérités de dépendances de Plugin pour un Plugin packagé configuré, met à jour vers
  la tarball candidate, et exige que le doctor post-mise à jour supprime les racines de dépendances
  héritées.

Variantes utiles de survivor de mise à niveau publiée :

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
modelés sur des problèmes signalés, y compris la migration d’installation de Plugin configuré.

La migration complète de mise à jour est intentionnellement séparée de la CI de version complète. Utilisez le
workflow manuel `Update Migration` lorsque la question de version est « chaque
version stable publiée depuis 2026.4.23 peut-elle être mise à jour vers ce candidat et
nettoyer les débris de dépendances de Plugins ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Acceptation des packages

L’acceptation des packages est la barrière de package native GitHub. Elle résout un package
candidat en tarball `package-under-test`, enregistre la version et le SHA-256, puis
exécute des voies Docker E2E réutilisables contre cette tarball exacte. La référence du harnais de workflow
est séparée de la référence source du package, afin que la logique de test actuelle puisse valider
d’anciennes versions de confiance.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest` ou une version
  publiée exacte.
- `source=ref` : empaqueter une branche, une balise ou un commit de confiance avec le harnais courant
  sélectionné.
- `source=url` : valider une tarball HTTPS publique avec `package_sha256` requis.
  Ce chemin rejette les identifiants dans les URL, les ports HTTPS non par défaut, les noms d’hôtes ou résultats DNS/IP
  privés/internes, l’espace IP à usage spécial et les redirections non sûres.
- `source=trusted-url` : valider une tarball HTTPS avec
  `package_sha256` et `trusted_source_id` requis par rapport à la politique détenue par les mainteneurs
  dans `.github/package-trusted-sources.json`. Utilisez ceci pour les miroirs d’entreprise/privés
  au lieu d’affaiblir `source=url` avec un interrupteur d’entrée autorisant le privé.
  L’authentification Bearer, lorsqu’elle est configurée par la politique, utilise le secret fixe
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact` : réutiliser une tarball téléversée par une autre exécution Actions.

La validation complète de version utilise `source=artifact` par défaut, construit depuis le
SHA de version résolu. Pour une preuve post-publication, passez
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` afin que la même matrice de mise à niveau
cible plutôt le package npm livré.

Les contrôles de version appellent l’acceptation des packages avec l’ensemble package/update/restart/plugin :

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quand le soak de version est activé, ils passent aussi :

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela garde la migration de package, le basculement de canal de mise à jour, la tolérance aux Plugins gérés
corrompus, le nettoyage des dépendances de Plugins obsolètes, la couverture de Plugins hors ligne, le comportement de
mise à jour de Plugins et la QA du package Telegram sur le même artefact résolu sans
obliger la barrière de package de version par défaut à parcourir chaque version publiée.

`last-stable-4` se résout aux quatre dernières versions stables d’OpenClaw publiées sur npm.
L’acceptation de package de version épingle `2026.4.23` comme première frontière de compatibilité
de mise à jour de Plugins, `2026.5.2` comme frontière de remaniement de l’architecture des Plugins, et
`2026.4.15` comme base plus ancienne de mise à jour publiée 2026.4.1x ; le résolveur
déduplique les épingles déjà présentes dans les quatre dernières. Pour une couverture exhaustive de migration
de mise à jour publiée, utilisez `all-since-2026.4.23` dans le workflow séparé Update
Migration au lieu de la CI de version complète. `release-history` reste
disponible pour un échantillonnage manuel plus large lorsque vous voulez aussi l’ancre héritée antérieure.

Quand plusieurs bases de survivor de mise à niveau publiée sont sélectionnées, le workflow Docker
réutilisable partitionne chaque base dans sa propre tâche de runner ciblée. Chaque
partition de base exécute toujours l’ensemble de scénarios sélectionné, mais les journaux et artefacts restent
par base et le temps total est borné par la partition la plus lente plutôt que par une grande
tâche série.

Exécutez manuellement un profil de package lors de la validation d’un candidat avant publication :

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

Utilisez `suite_profile=product` lorsque la question de version inclut les canaux MCP,
le nettoyage cron/sous-agent, la recherche web OpenAI ou OpenWebUI. Utilisez `suite_profile=full`
uniquement lorsque vous avez besoin de la couverture Docker complète du chemin de version.

## Valeur par défaut de version

Pour les candidats de version, la pile de preuves par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau source.
2. `pnpm release:check` pour l’intégrité des artefacts de package.
3. Le profil `package` d’acceptation des packages ou les voies de package personnalisées des contrôles de version
   pour les contrats d’installation/mise à jour/redémarrage/Plugin.
4. Les contrôles de version inter-OS pour l’installateur, l’onboarding et le comportement de plateforme
   propres à chaque OS.
5. Les suites live uniquement lorsque la surface modifiée touche au comportement de fournisseur ou de service hébergé.

Sur les machines des mainteneurs, les barrières larges et la preuve produit Docker/package doivent s’exécuter
dans Testbox sauf preuve locale explicite.

## Compatibilité héritée

La tolérance de compatibilité est étroite et limitée dans le temps :

- Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  les lacunes de métadonnées de package déjà livrées dans l’acceptation des packages.
- Le package publié `2026.4.26` peut avertir pour les fichiers de tampon de métadonnées de build local
  déjà livrés.
- Les packages ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu
  d’avertir ou de sauter.

N’ajoutez pas de nouvelles migrations de démarrage pour ces anciennes formes. Ajoutez ou étendez une réparation
doctor, puis prouvez-la avec `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` lorsque la commande de mise à jour possède le redémarrage.

## Ajouter une couverture

Lorsque vous modifiez le comportement de mise à jour ou de Plugin, ajoutez une couverture à la couche la plus basse qui
peut échouer pour la bonne raison :

- Logique de chemin ou de métadonnées pure : test unitaire à côté de la source.
- Comportement d’inventaire de package ou de fichiers empaquetés : test
  `package-dist-inventory` ou vérificateur de tarball.
- Comportement d’installation/mise à jour de la CLI : assertion de voie Docker ou fixture.
- Comportement de migration de version publiée : scénario `published-upgrade-survivor`.
- Comportement de redémarrage géré par la mise à jour : `update-restart-auth`.
- Comportement de source de registre/package : fixture `test:docker:plugins` ou
  serveur de fixture ClawHub.
- Comportement de disposition ou de nettoyage des dépendances : vérifier à la fois
  l’exécution au runtime et la limite du système de fichiers. Les dépendances npm
  peuvent être hissées à l’intérieur du projet npm géré du plugin ; les tests doivent
  donc prouver que ce projet est analysé/nettoyé au lieu de supposer uniquement
  l’arborescence `node_modules` locale au package du plugin.

Gardez les nouvelles fixtures Docker hermétiques par défaut. Utilisez des registres
de fixtures locaux et de faux packages, sauf si l’objectif du test est le
comportement d’un registre réel.

## Triage des échecs

Commencez par l’identité de l’artéfact :

- Résumé Package Acceptance `resolve_package` : source, version, SHA-256 et
  nom de l’artéfact.
- Artéfacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux de voie et commandes de réexécution.
- Résumé Upgrade survivor : `.artifacts/upgrade-survivor/summary.json`,
  incluant la version de référence, la version candidate, le scénario, les temps
  de phase et les étapes de recette.

Préférez réexécuter la voie exacte en échec avec le même artéfact de package
plutôt que de relancer tout le périmètre de release.

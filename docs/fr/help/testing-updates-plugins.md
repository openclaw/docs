---
read_when:
    - Modification du comportement de mise à jour, de diagnostic, d’acceptation de paquet ou d’installation de Plugin d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage des régressions liées à la mise à jour des packages, au nettoyage des dépendances de Plugin ou à l’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de paquets et le comportement d’installation et de mise à jour des plugins
title: 'Tests : mises à jour et plugins'
x-i18n:
    generated_at: "2026-05-02T07:10:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Voici la checklist dédiée à la validation des mises à jour et des plugins. L’objectif est
simple : prouver que le package installable peut mettre à jour un état utilisateur réel,
réparer un état hérité obsolète via `doctor`, et continuer à installer, charger,
mettre à jour et désinstaller des plugins depuis les sources prises en charge.

Pour la carte plus large du lanceur de tests, voir [Tests](/fr/help/testing). Pour les clés
des fournisseurs en direct et les suites qui touchent au réseau, voir [Tests en direct](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de plugins protègent ces contrats :

- Une archive tarball de package est complète, possède un `dist/postinstall-inventory.json` valide,
  et ne dépend pas de fichiers de dépôt non empaquetés.
- Un utilisateur peut passer d’un ancien package publié au package candidat
  sans perdre la configuration, les agents, les sessions, les espaces de travail, les allowlists de plugins ni
  la configuration des canaux.
- `openclaw doctor --fix --non-interactive` possède les chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour l’état
  obsolète des plugins.
- Les installations de plugins fonctionnent depuis des répertoires locaux, des dépôts git, des packages npm et le
  chemin de registre ClawHub.
- Les dépendances npm des plugins sont installées dans la racine npm gérée, analysées avant
  la confiance, et supprimées via npm pendant la désinstallation afin que les dépendances remontées ne
  persistent pas.
- La mise à jour des plugins est stable lorsque rien n’a changé : les enregistrements d’installation, la
  source résolue, l’agencement des dépendances installées et l’état activé restent intacts.

## Preuve locale pendant le développement

Commencez de manière ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements d’installation, de désinstallation, de dépendance ou d’inventaire de package des plugins, exécutez aussi
les tests ciblés qui couvrent la jonction modifiée :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’une lane Docker de package consomme une tarball, prouvez l’artefact de package :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive config/docs/API, écrit l’inventaire de distribution
du package, exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe
la tarball dans un préfixe temporaire, exécute postinstall, et effectue un smoke test des points d’entrée
des canaux groupés.

## Lanes Docker

Les lanes Docker sont la preuve au niveau produit. Elles installent ou mettent à jour un
package réel dans des conteneurs Linux et vérifient le comportement via des commandes CLI,
le démarrage du Gateway, des sondes HTTP, l’état RPC et l’état du système de fichiers.

Utilisez des lanes ciblées pendant l’itération :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lanes importantes :

- `test:docker:plugins` valide le smoke test d’installation de plugins, les installations de dossiers locaux,
  le comportement de saut de mise à jour des dossiers locaux, les dossiers locaux avec dépendances
  préinstallées, les installations de packages `file:`, les installations git avec exécution CLI, les mises à jour
  de références mobiles git, les installations depuis un registre npm avec dépendances transitives
  remontées, les no-ops de mise à jour npm, les installations depuis fixture ClawHub locale et les no-ops
  de mise à jour, le comportement de mise à jour du marketplace, ainsi que l’activation/l’inspection du bundle Claude. Définissez
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-update` valide qu’un plugin installé inchangé ne
  se réinstalle pas et ne perd pas ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe la tarball candidate par-dessus une fixture
  d’ancien utilisateur sale, exécute la mise à jour du package plus doctor non interactif, puis démarre
  un Gateway loopback et vérifie la préservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une référence publiée,
  la configure via une recette intégrée `openclaw config set`, la met à jour vers la
  tarball candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway, et
  sonde `/healthz`, `/readyz` et l’état RPC.
- `test:docker:update-migration` est la lane de mise à jour publiée intensive en nettoyage. Elle
  part d’un état utilisateur configuré de style Discord/Telegram, exécute le doctor de référence
  afin que les dépendances de plugins configurées aient une chance de se matérialiser, amorce
  des débris hérités de dépendances de plugin pour un plugin empaqueté configuré, met à jour vers
  la tarball candidate, et exige que le doctor post-mise à jour supprime les racines de dépendances
  héritées.

Variantes utiles de survivor de mise à jour publiée :

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Les scénarios disponibles sont `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `tilde-log-path` et `versioned-runtime-deps`. Dans les exécutions agrégées,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` s’étend à tous les scénarios
en forme de problèmes signalés.

La migration complète de mise à jour est volontairement séparée de la CI Full Release. Utilisez le
workflow manuel `Update Migration` lorsque la question de release est « chaque
release stable publiée depuis 2026.4.23 peut-elle se mettre à jour vers ce candidat et
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

Package Acceptance est la gate de package native de GitHub. Elle résout un package
candidat en une tarball `package-under-test`, enregistre la version et le SHA-256, puis
exécute des lanes Docker E2E réutilisables contre cette tarball exacte. La référence du harnais
de workflow est séparée de la référence source du package, de sorte que la logique de test actuelle peut valider
d’anciennes releases de confiance.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest`, ou une version
  publiée exacte.
- `source=ref` : empaqueter une branche, une balise ou un commit de confiance avec le harnais actuel
  sélectionné.
- `source=url` : valider une tarball HTTPS avec `package_sha256` requis.
- `source=artifact` : réutiliser une tarball téléversée par une autre exécution Actions.

Les contrôles de release appellent Package Acceptance avec l’ensemble package/update/plugin :

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ils transmettent aussi :

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela garde la migration de package, le changement de canal de mise à jour, le nettoyage des dépendances
de plugins obsolètes, la couverture hors ligne des plugins, le comportement de mise à jour des plugins et la QA de package Telegram
sur le même artefact résolu.

`release-history` est un échantillon borné de contrôle de release : les six dernières releases stables,
`2026.4.23`, et une ancre plus ancienne antérieure à cette date. Pour une couverture exhaustive de migration de mise à jour
publiée, utilisez `all-since-2026.4.23` dans le workflow Update Migration séparé
au lieu de la CI Full Release.

Exécutez manuellement un profil de package lors de la validation d’un candidat avant la release :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Utilisez `suite_profile=product` lorsque la question de release inclut les canaux MCP,
le nettoyage cron/subagent, la recherche web OpenAI, ou OpenWebUI. Utilisez `suite_profile=full`
uniquement lorsque vous avez besoin d’une couverture Docker complète du chemin de release.

## Par défaut pour les releases

Pour les candidats de release, la pile de preuve par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau source.
2. `pnpm release:check` pour l’intégrité de l’artefact de package.
3. Le profil Package Acceptance `package` ou les lanes de package personnalisées des contrôles de release
   pour les contrats d’installation/mise à jour/plugins.
4. Les contrôles de release inter-OS pour le comportement spécifique à l’OS de l’installeur, de l’onboarding et de la plateforme.
5. Les suites en direct uniquement lorsque la surface modifiée touche le comportement des fournisseurs ou de services hébergés.

Sur les machines des mainteneurs, les gates larges et les preuves produit Docker/package doivent s’exécuter
dans Testbox sauf si une preuve locale est explicitement effectuée.

## Compatibilité héritée

La tolérance de compatibilité est étroite et limitée dans le temps :

- Les packages jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  dans Package Acceptance les lacunes de métadonnées de package déjà livrées.
- Le package publié `2026.4.26` peut avertir pour les fichiers d’horodatage de métadonnées de build local
  déjà livrés.
- Les packages ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu de
  produire un avertissement ou d’être ignorées.

N’ajoutez pas de nouvelles migrations au démarrage pour ces anciennes formes. Ajoutez ou étendez une réparation
doctor, puis prouvez-la avec `upgrade-survivor` ou `published-upgrade-survivor`.

## Ajouter de la couverture

Lors de la modification du comportement de mise à jour ou de plugins, ajoutez une couverture à la couche la plus basse qui
peut échouer pour la bonne raison :

- Logique pure de chemin ou de métadonnées : test unitaire à côté de la source.
- Inventaire de package ou comportement des fichiers empaquetés : test `package-dist-inventory` ou test de vérificateur
  de tarball.
- Comportement CLI d’installation/mise à jour : assertion ou fixture de lane Docker.
- Comportement de migration de release publiée : scénario `published-upgrade-survivor`.
- Comportement de source registre/package : fixture `test:docker:plugins` ou serveur de fixture ClawHub.
- Comportement d’agencement ou de nettoyage des dépendances : vérifiez à la fois l’exécution au runtime et la
  frontière du système de fichiers. Les dépendances npm peuvent être remontées sous la racine npm
  gérée, donc les tests doivent prouver que la racine est analysée/nettoyée au lieu de supposer une
  arborescence `node_modules` locale au package.

Gardez les nouvelles fixtures Docker hermétiques par défaut. Utilisez des registres de fixtures locaux et
de faux packages sauf si l’objectif du test est le comportement d’un registre en direct.

## Triage des échecs

Commencez par l’identité de l’artefact :

- Résumé `resolve_package` de Package Acceptance : source, version, SHA-256, et
  nom de l’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux de lanes, et commandes de réexécution.
- Résumé upgrade survivor : `.artifacts/upgrade-survivor/summary.json`,
  incluant la version de référence, la version candidate, le scénario, les timings de phases et
  les étapes de recette.

Préférez réexécuter la lane exacte en échec avec le même artefact de package plutôt que
réexécuter tout le parapluie de release.

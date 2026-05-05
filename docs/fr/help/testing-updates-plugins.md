---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation des packages ou d’installation de Plugin d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage des régressions de mise à jour de package, de nettoyage des dépendances de Plugin ou d’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de paquets et le comportement d’installation/mise à jour des Plugins
title: 'Tests : mises à jour et Plugins'
x-i18n:
    generated_at: "2026-05-05T01:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Ceci est la checklist dédiée à la validation des mises à jour et des Plugins. L’objectif est
simple : prouver que le paquet installable peut mettre à jour un état utilisateur réel, réparer
l’état hérité obsolète via `doctor`, et continuer à installer, charger, mettre à jour et désinstaller
des Plugins depuis les sources prises en charge.

Pour la cartographie plus large de l’exécuteur de tests, consultez [Tests](/fr/help/testing). Pour les clés
des fournisseurs live et les suites qui touchent au réseau, consultez [Tests live](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de Plugins protègent ces contrats :

- Une archive tarball de paquet est complète, possède un `dist/postinstall-inventory.json`
  valide, et ne dépend pas de fichiers de dépôt non empaquetés.
- Un utilisateur peut passer d’un paquet publié plus ancien au paquet candidat
  sans perdre la configuration, les agents, les sessions, les espaces de travail, les listes d’autorisation de Plugins, ni
  la configuration de canal.
- `openclaw doctor --fix --non-interactive` possède les chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour l’état
  obsolète des Plugins.
- Les installations de Plugins fonctionnent depuis des répertoires locaux, des dépôts git, des paquets npm et le
  chemin du registre ClawHub.
- Les dépendances npm des Plugins sont installées dans la racine npm gérée, analysées avant
  confiance, et supprimées via npm pendant la désinstallation afin que les dépendances hissées ne
  persistent pas.
- La mise à jour des Plugins est stable quand rien n’a changé : les enregistrements d’installation, la source
  résolue, l’agencement des dépendances installées et l’état activé restent intacts.

## Preuve locale pendant le développement

Commencez de façon ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements d’installation, de désinstallation, de dépendances ou d’inventaire de paquet de Plugins, exécutez aussi
les tests ciblés qui couvrent la jonction modifiée :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’une voie Docker de paquet ne consomme une tarball, prouvez l’artefact de paquet :

```bash
pnpm release:check
```

`release:check` exécute les vérifications de dérive configuration/docs/API, écrit l’inventaire de distribution
du paquet, exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe
la tarball dans un préfixe temporaire, exécute postinstall, et effectue un smoke test des points d’entrée
des canaux groupés.

## Voies Docker

Les voies Docker constituent la preuve au niveau produit. Elles installent ou mettent à jour un vrai
paquet dans des conteneurs Linux et valident le comportement via des commandes CLI,
le démarrage du Gateway, des sondes HTTP, l’état RPC et l’état du système de fichiers.

Utilisez les voies ciblées pendant l’itération :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Voies importantes :

- `test:docker:plugins` valide le smoke test d’installation de Plugins, les installations de dossiers locaux,
  le comportement de saut de mise à jour des dossiers locaux, les dossiers locaux avec des
  dépendances préinstallées, les installations de paquets `file:`, les installations git avec exécution CLI, les mises à jour
  de références mobiles git, les installations de registre npm avec dépendances transitives
  hissées, les no-ops de mise à jour npm, les installations de fixtures ClawHub locales et les
  no-ops de mise à jour, le comportement de mise à jour de la marketplace, ainsi que l’activation/inspection du bundle Claude. Définissez
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-lifecycle-matrix` installe le paquet candidat dans un conteneur
  nu, fait passer un Plugin npm par l’installation, l’inspection, la désactivation, l’activation,
  la mise à niveau explicite, le retour à une version antérieure explicite et la désinstallation après suppression du code du Plugin.
  Il journalise les métriques RSS et CPU pour chaque phase.
- `test:docker:plugin-update` valide qu’un Plugin installé inchangé ne
  se réinstalle pas et ne perd pas ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe la tarball candidate par-dessus une fixture
  d’ancien utilisateur sale, exécute la mise à jour du paquet plus un doctor non interactif, puis démarre
  un Gateway local loopback et vérifie la préservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une base publiée,
  la configure via une recette `openclaw config set` intégrée, la met à jour vers la
  tarball candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway, et
  sonde `/healthz`, `/readyz` et l’état RPC.
- `test:docker:update-migration` est la voie de mise à jour publiée centrée sur le nettoyage. Elle
  part d’un état utilisateur configuré de style Discord/Telegram, exécute le doctor
  de base afin que les dépendances de Plugins configurées aient une chance de se matérialiser, injecte
  des débris de dépendances de Plugins hérités pour un Plugin empaqueté configuré, met à jour vers
  la tarball candidate, et exige que le doctor post-mise à jour supprime les racines
  de dépendances héritées.

Variantes utiles du survivor de mise à niveau publiée :

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` s’étend à tous les scénarios ayant la forme
d’incidents signalés, y compris la migration d’installation de Plugins configurés.

La migration complète de mise à jour est intentionnellement séparée de Full Release CI. Utilisez le
workflow manuel `Update Migration` quand la question de release est « chaque
release stable publiée à partir de 2026.4.23 peut-elle se mettre à jour vers ce candidat et
nettoyer les débris de dépendances de Plugins ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Acceptation du paquet

Package Acceptance est le garde-fou de paquet natif GitHub. Il résout un paquet
candidat en tarball `package-under-test`, enregistre la version et le SHA-256, puis
exécute des voies Docker E2E réutilisables contre cette tarball exacte. La référence du harnais
de workflow est séparée de la référence source du paquet, afin que la logique de test actuelle puisse valider
d’anciennes releases fiables.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest` ou une version
  publiée exacte.
- `source=ref` : empaqueter une branche, une balise ou un commit fiable avec le harnais actuel
  sélectionné.
- `source=url` : valider une tarball HTTPS avec `package_sha256` obligatoire.
- `source=artifact` : réutiliser une tarball téléversée par une autre exécution Actions.

Full Release Validation utilise `source=artifact` par défaut, construite depuis le
SHA de release résolu. Pour une preuve post-publication, passez
`package_acceptance_package_spec=openclaw@YYYY.M.D` afin que la même matrice de mise à niveau
cible plutôt le paquet npm livré.

Les vérifications de release appellent Package Acceptance avec l’ensemble paquet/mise à jour/Plugin :

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Elles passent aussi :

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela garde la migration de paquet, le changement de canal de mise à jour, le nettoyage des dépendances
obsolètes de Plugins, la couverture hors ligne des Plugins, le comportement de mise à jour des Plugins et la QA de paquet
Telegram sur le même artefact résolu.

`all-since-2026.4.23` est l’échantillon de mise à niveau Full Release CI : chaque release stable publiée sur npm de `2026.4.23` jusqu’à `latest`. Pour une couverture exhaustive de migration
de mise à jour publiée, utilisez `all-since-2026.4.23` dans le workflow Update
Migration séparé au lieu de Full Release CI. `release-history` reste
disponible pour un échantillonnage manuel plus large quand vous voulez aussi l’ancre héritée
antérieure à la date.

Exécutez manuellement un profil de paquet lors de la validation d’un candidat avant release :

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

Utilisez `suite_profile=product` quand la question de release inclut les canaux MCP,
le nettoyage cron/sous-agent, la recherche web OpenAI ou OpenWebUI. Utilisez `suite_profile=full`
uniquement quand vous avez besoin d’une couverture Docker complète du chemin de release.

## Valeur par défaut de release

Pour les candidats de release, la pile de preuves par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau source.
2. `pnpm release:check` pour l’intégrité de l’artefact de paquet.
3. Le profil `package` de Package Acceptance ou les voies de paquet personnalisées de release-check
   pour les contrats d’installation/mise à jour/Plugin.
4. Les vérifications de release multi-OS pour le comportement propre aux installateurs, à l’onboarding et à la plateforme.
5. Les suites live uniquement lorsque la surface modifiée touche au comportement d’un fournisseur ou d’un service hébergé.

Sur les machines des mainteneurs, les grands garde-fous et les preuves produit Docker/paquet doivent s’exécuter
dans Testbox, sauf en cas de preuve locale explicite.

## Compatibilité héritée

La tolérance de compatibilité est étroite et limitée dans le temps :

- Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  les lacunes de métadonnées de paquet déjà livrées dans Package Acceptance.
- Le paquet publié `2026.4.26` peut avertir pour les fichiers d’estampille de métadonnées de build local
  déjà livrés.
- Les paquets ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu
  d’avertir ou de sauter.

N’ajoutez pas de nouvelles migrations au démarrage pour ces anciennes formes. Ajoutez ou étendez une réparation
doctor, puis prouvez-la avec `upgrade-survivor` ou `published-upgrade-survivor`.

## Ajouter de la couverture

Lorsque vous modifiez le comportement de mise à jour ou de Plugin, ajoutez une couverture à la couche la plus basse qui
peut échouer pour la bonne raison :

- Logique pure de chemin ou de métadonnées : test unitaire à côté de la source.
- Inventaire de paquet ou comportement de fichiers empaquetés : test `package-dist-inventory` ou
  vérificateur de tarball.
- Comportement CLI d’installation/mise à jour : assertion ou fixture de voie Docker.
- Comportement de migration de release publiée : scénario `published-upgrade-survivor`.
- Comportement de registre/source de paquet : fixture `test:docker:plugins` ou serveur de fixture ClawHub.
- Comportement d’agencement ou de nettoyage des dépendances : affirmer à la fois l’exécution runtime et la
  frontière du système de fichiers. Les dépendances npm peuvent être hissées sous la racine npm
  gérée ; les tests doivent donc prouver que la racine est analysée/nettoyée au lieu de supposer une
  arborescence `node_modules` locale au paquet.

Gardez les nouvelles fixtures Docker hermétiques par défaut. Utilisez des registres de fixtures locaux et
de faux paquets, sauf si le but du test est le comportement du registre live.

## Triage des échecs

Commencez par l’identité de l’artefact :

- Résumé `resolve_package` de Package Acceptance : source, version, SHA-256 et
  nom de l’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux de voie et commandes de réexécution.
- Résumé upgrade survivor : `.artifacts/upgrade-survivor/summary.json`,
  incluant la version de base, la version candidate, le scénario, les timings de phase et
  les étapes de recette.

Préférez relancer la voie exacte échouée avec le même artefact de paquet plutôt que
relancer tout le parapluie de release.

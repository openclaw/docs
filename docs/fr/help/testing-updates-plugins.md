---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation des packages ou d’installation des plugins d’OpenClaw
    - Préparer ou approuver une version candidate
    - Débogage des régressions de mise à jour de package, de nettoyage des dépendances de Plugin ou d’installation de Plugin
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les chemins de mise à jour, les migrations de paquets et le comportement d’installation/mise à jour des plugins
title: 'Tests : mises à jour et Plugins'
x-i18n:
    generated_at: "2026-05-06T07:26:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Voici la liste de contrôle dédiée à la validation des mises à jour et des plugins. L'objectif est
simple : prouver que le paquet installable peut mettre à jour un état utilisateur réel, réparer
un état hérité obsolète via `doctor`, et toujours installer, charger, mettre à jour et désinstaller
des plugins depuis les sources prises en charge.

Pour la cartographie plus large de l'exécuteur de tests, consultez [Tests](/fr/help/testing). Pour les
clés de fournisseurs en conditions réelles et les suites qui accèdent au réseau, consultez [Tests en conditions réelles](/fr/help/testing-live).

## Ce que nous protégeons

Les tests de mise à jour et de plugins protègent ces contrats :

- Une archive de paquet est complète, possède un `dist/postinstall-inventory.json` valide,
  et ne dépend pas de fichiers du dépôt non empaquetés.
- Un utilisateur peut passer d'un paquet publié plus ancien au paquet candidat
  sans perdre sa configuration, ses agents, ses sessions, ses espaces de travail, ses listes d'autorisation de plugins ni
  sa configuration de canaux.
- `openclaw doctor --fix --non-interactive` est responsable des chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour les états de plugins
  obsolètes.
- Les installations de plugins fonctionnent depuis des répertoires locaux, des dépôts git, des paquets npm et le
  chemin du registre ClawHub.
- Les dépendances npm des plugins sont installées dans la racine npm gérée, analysées avant
  que la confiance soit accordée, et supprimées via npm pendant la désinstallation afin que les dépendances remontées ne
  persistent pas.
- La mise à jour des plugins est stable quand rien n'a changé : les enregistrements d'installation, la source
  résolue, la disposition des dépendances installées et l'état d'activation restent intacts.

## Preuve locale pendant le développement

Commencez de façon ciblée :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les changements touchant l'installation, la désinstallation, les dépendances ou l'inventaire de paquet des plugins, exécutez aussi
les tests ciblés qui couvrent le point modifié :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu'une voie Docker de paquet ne consomme une archive, prouvez l'artefact de paquet :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive configuration/docs/API, écrit l'inventaire dist du paquet,
exécute `npm pack --dry-run`, rejette les fichiers empaquetés interdits, installe
l'archive dans un préfixe temporaire, exécute postinstall et effectue des tests de fumée sur les points d'entrée de canaux
embarqués.

## Voies Docker

Les voies Docker constituent la preuve au niveau produit. Elles installent ou mettent à jour un vrai
paquet dans des conteneurs Linux et vérifient le comportement via des commandes CLI,
le démarrage du Gateway, des sondes HTTP, l'état RPC et l'état du système de fichiers.

Utilisez des voies ciblées pendant l'itération :

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

- `test:docker:plugins` valide le test de fumée d'installation de plugin, les installations depuis un dossier local,
  le comportement de saut de mise à jour des dossiers locaux, les dossiers locaux avec dépendances
  préinstallées, les installations de paquets `file:`, les installations git avec exécution CLI, les mises à jour de références git
  mouvantes, les installations depuis le registre npm avec dépendances transitives
  remontées, les opérations sans effet de mise à jour npm, les installations depuis le jeu de test ClawHub local et les opérations
  sans effet de mise à jour, le comportement de mise à jour de la place de marché, et l'activation/inspection du lot Claude. Définissez
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour garder le bloc ClawHub hermétique/hors ligne.
- `test:docker:plugin-lifecycle-matrix` installe le paquet candidat dans un conteneur nu,
  fait passer un plugin npm par l'installation, l'inspection, la désactivation, l'activation,
  la mise à niveau explicite, la rétrogradation explicite et la désinstallation après suppression du code du plugin.
  Il journalise les métriques RSS et CPU pour chaque phase.
- `test:docker:plugin-update` valide qu'un plugin installé inchangé ne se
  réinstalle pas et ne perd pas ses métadonnées d'installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe l'archive candidate par-dessus un jeu de test
  d'ancien utilisateur avec état résiduel, exécute la mise à jour du paquet ainsi que doctor non interactif, puis démarre
  un Gateway en boucle locale et vérifie la préservation de l'état.
- `test:docker:published-upgrade-survivor` installe d'abord une référence publiée,
  la configure via une recette `openclaw config set` intégrée, la met à jour vers
  l'archive candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway et
  sonde `/healthz`, `/readyz` et l'état RPC.
- `test:docker:update-restart-auth` installe le paquet candidat, démarre un
  Gateway géré à authentification par jeton, désactive les variables d'environnement d'authentification du Gateway appelant pour
  `openclaw update --yes --json`, et exige que la commande de mise à jour candidate
  redémarre le Gateway avant les sondes normales.
- `test:docker:update-migration` est la voie de mise à jour publiée fortement axée sur le nettoyage. Elle
  part d'un état utilisateur configuré de type Discord/Telegram, exécute doctor sur la référence
  afin que les dépendances des plugins configurés aient une chance de se matérialiser, sème
  des résidus de dépendances héritées de plugin pour un plugin empaqueté configuré, met à jour vers
  l'archive candidate, et exige que doctor après mise à jour supprime les racines de
  dépendances héritées.

Variantes utiles de survie à la mise à niveau depuis une version publiée :

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` s'étend à tous les scénarios
calqués sur des problèmes signalés, y compris la migration d'installation de plugins configurés.

La migration complète des mises à jour est intentionnellement séparée de la CI de version complète. Utilisez le
flux de travail manuel `Update Migration` quand la question de publication est « chaque
version stable publiée depuis 2026.4.23 peut-elle se mettre à jour vers ce candidat et
nettoyer les résidus de dépendances de plugin ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Acceptation du paquet

L'Acceptation du paquet est le contrôle de paquet natif de GitHub. Elle résout un paquet
candidat en une archive `package-under-test`, enregistre la version et le SHA-256, puis
exécute des voies Docker E2E réutilisables sur cette archive exacte. La référence du cadre d'exécution
du flux de travail est distincte de la référence source du paquet, afin que la logique de test actuelle puisse valider
des versions fiables plus anciennes.

Sources candidates :

- `source=npm` : valider `openclaw@beta`, `openclaw@latest` ou une version
  publiée exacte.
- `source=ref` : empaqueter une branche, une étiquette ou un commit fiable avec le cadre d'exécution actuel
  sélectionné.
- `source=url` : valider une archive HTTPS avec `package_sha256` obligatoire.
- `source=artifact` : réutiliser une archive téléversée par une autre exécution Actions.

La validation complète de version utilise `source=artifact` par défaut, construit depuis le
SHA de version résolu. Pour une preuve après publication, passez
`package_acceptance_package_spec=openclaw@YYYY.M.D` afin que la même matrice de mise à niveau
cible plutôt le paquet npm livré.

Les contrôles de version appellent l'Acceptation du paquet avec l'ensemble paquet/mise à jour/redémarrage/plugin :

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quand la validation d'endurance de version est activée, ils passent aussi :

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela garde la migration de paquet, le changement de canal de mise à jour, la tolérance aux plugins gérés
corrompus, le nettoyage des dépendances de plugin obsolètes, la couverture hors ligne des plugins, le
comportement de mise à jour des plugins et la QA du paquet Telegram sur le même artefact résolu sans
obliger le contrôle de paquet de publication par défaut à parcourir chaque version publiée.

`last-stable-4` correspond aux quatre dernières versions stables d'OpenClaw
publiées sur npm. L'acceptation du paquet de version épingle `2026.4.23` comme première frontière de compatibilité
de mise à jour de plugins, `2026.5.2` comme frontière de remaniement de l'architecture des plugins, et
`2026.4.15` comme référence de mise à jour publiée 2026.4.1x plus ancienne ; le résolveur
déduplique les versions épinglées qui sont déjà dans les quatre dernières. Pour une couverture exhaustive de
migration de mise à jour publiée, utilisez `all-since-2026.4.23` dans le flux de travail Update
Migration séparé au lieu de la CI de version complète. `release-history` reste
disponible pour un échantillonnage manuel plus large quand vous voulez aussi l'ancre héritée
antérieure à la date.

Quand plusieurs références de survie à la mise à niveau depuis une version publiée sont sélectionnées, le flux de travail
Docker réutilisable répartit chaque référence dans sa propre tâche d'exécuteur ciblée. Chaque
fragment de référence exécute toujours l'ensemble de scénarios sélectionné, mais les journaux et les artefacts restent
par référence, et la durée totale est limitée par le fragment le plus lent au lieu d'une seule grande
tâche série.

Exécutez manuellement un profil de paquet lors de la validation d'un candidat avant publication :

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

Utilisez `suite_profile=product` quand la question de publication inclut des canaux MCP,
le nettoyage Cron/sous-agent, la recherche web OpenAI ou OpenWebUI. Utilisez `suite_profile=full`
uniquement quand vous avez besoin d'une couverture Docker complète du parcours de publication.

## Preuve par défaut de publication

Pour les candidats de version, la pile de preuves par défaut est :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau du code source.
2. `pnpm release:check` pour l'intégrité de l'artefact de paquet.
3. Le profil `package` d'Acceptation du paquet ou les voies de paquet personnalisées des contrôles de version
   pour les contrats d'installation/mise à jour/redémarrage/plugin.
4. Les contrôles de version multi-OS pour le comportement spécifique à l'OS de l'installateur, du parcours
   d'intégration et de la plateforme.
5. Les suites en conditions réelles uniquement quand la surface modifiée touche le comportement des fournisseurs ou des services
   hébergés.

Sur les machines des mainteneurs, les contrôles larges et les preuves produit Docker/paquet devraient s'exécuter
dans Testbox sauf en cas de preuve locale explicite.

## Compatibilité héritée

La tolérance de compatibilité est limitée et bornée dans le temps :

- Les paquets jusqu'à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  les lacunes de métadonnées de paquet déjà livrées dans l'Acceptation du paquet.
- Le paquet publié `2026.4.26` peut émettre un avertissement pour les fichiers d'horodatage de métadonnées
  de build local déjà livrés.
- Les paquets ultérieurs doivent satisfaire les contrats modernes. Les mêmes lacunes échouent au lieu
  d'avertir ou d'être ignorées.

N'ajoutez pas de nouvelles migrations au démarrage pour ces anciens formats. Ajoutez ou étendez une réparation
doctor, puis prouvez-la avec `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` quand la commande de mise à jour est responsable du redémarrage.

## Ajout de couverture

Quand vous modifiez le comportement de mise à jour ou de plugin, ajoutez de la couverture au niveau le plus bas qui
peut échouer pour la bonne raison :

- Logique pure de chemins ou de métadonnées : test unitaire à côté du code source.
- Inventaire du paquet ou comportement des fichiers empaquetés : test `package-dist-inventory` ou test de
  vérificateur d'archive.
- Comportement d'installation/mise à jour de la CLI : assertion ou jeu de test de voie Docker.
- Comportement de migration depuis une version publiée : scénario `published-upgrade-survivor`.
- Comportement de redémarrage pris en charge par la mise à jour : `update-restart-auth`.
- Comportement de source registre/paquet : jeu de test `test:docker:plugins` ou serveur de jeu de test ClawHub.
- Comportement de disposition ou de nettoyage des dépendances : affirmez à la fois l'exécution à l'exécution et la
  frontière du système de fichiers. Les dépendances npm peuvent être remontées sous la racine npm
  gérée ; les tests doivent donc prouver que la racine est analysée/nettoyée au lieu de supposer une
  arborescence `node_modules` locale au paquet.

Gardez les nouveaux jeux de test Docker hermétiques par défaut. Utilisez des registres de test locaux et
de faux paquets, sauf si l'objectif du test est le comportement d'un registre réel.

## Triage des échecs

Commencez par l'identité de l'artefact :

- Résumé `resolve_package` de l’acceptation du package : source, version, SHA-256 et
  nom de l’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux de voie et commandes de réexécution.
- Résumé des survivants de mise à niveau : `.artifacts/upgrade-survivor/summary.json`,
  incluant la version de référence, la version candidate, le scénario, les durées des phases et
  les étapes de la recette.

Privilégiez la réexécution de la voie exacte en échec avec le même artefact de package plutôt que
la réexécution de l’ensemble de l’umbrella de publication.

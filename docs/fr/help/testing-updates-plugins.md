---
read_when:
    - Modification du comportement de mise à jour, de doctor, d’acceptation des paquets ou d’installation des plugins d’OpenClaw
    - Préparation ou approbation d’une version candidate
    - Débogage des mises à jour de paquets, du nettoyage des dépendances de plugins ou des régressions d’installation de plugins
sidebarTitle: Update and plugin tests
summary: Comment OpenClaw valide les parcours de mise à jour, les migrations de paquets et le comportement d’installation et de mise à jour des plugins
title: 'Tests : mises à jour et plugins'
x-i18n:
    generated_at: "2026-07-12T15:33:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Liste de contrôle pour la validation des mises à jour et des plugins : prouver que le paquet installable peut
mettre à jour l’état réel des utilisateurs, réparer l’état hérité obsolète via `doctor`, et toujours
installer, charger, mettre à jour et désinstaller des plugins depuis toutes les sources prises en charge.

Pour la vue d’ensemble de l’exécuteur de tests, consultez [Tests](/fr/help/testing). Pour les clés des fournisseurs
en direct et les suites qui accèdent au réseau, consultez [Tests en direct](/fr/help/testing-live).

## Ce que nous protégeons

- Une archive de paquet est complète, possède un fichier `dist/postinstall-inventory.json` valide
  et ne dépend pas de fichiers du dépôt non empaquetés.
- Un utilisateur peut passer d’un ancien paquet publié au paquet candidat
  sans perdre sa configuration, ses agents, ses sessions, ses espaces de travail, ses listes d’autorisation de plugins ni
  sa configuration de canaux.
- `openclaw doctor --fix --non-interactive` prend en charge les chemins de nettoyage et de réparation
  hérités. Le démarrage ne doit pas accumuler de migrations de compatibilité cachées pour l’état
  obsolète des plugins.
- L’installation des plugins fonctionne depuis des répertoires locaux, des dépôts git, des paquets npm et le
  chemin du registre ClawHub.
- Les dépendances npm des plugins s’installent dans un projet npm géré par plugin,
  sont analysées avant l’établissement de la confiance et sont supprimées via `npm uninstall` lors de
  la désinstallation du plugin afin que les dépendances remontées ne persistent pas.
- La mise à jour d’un plugin ne fait rien lorsqu’aucun changement n’est détecté : les enregistrements d’installation, la source
  résolue, la disposition des dépendances installées et l’état d’activation restent intacts.

## Validation locale pendant le développement

Commencez par un périmètre restreint :

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Pour les modifications concernant l’installation, la désinstallation, les dépendances ou l’inventaire des paquets
des plugins, exécutez également les tests ciblés qui couvrent l’interface modifiée :

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Avant qu’un parcours Docker de paquet ne consomme une archive, validez l’artefact du paquet :

```bash
pnpm release:check
```

`release:check` exécute les contrôles de dérive de la configuration, de la documentation et de l’API (schéma de configuration, référence
de la documentation de configuration, référence et exportations de l’API du SDK de plugins, versions et inventaire des plugins),
écrit l’inventaire de distribution du paquet, exécute `npm pack --dry-run`, rejette les
fichiers empaquetés interdits, installe l’archive dans un préfixe temporaire, exécute l’étape de postinstallation et
effectue des tests rapides sur les points d’entrée des canaux intégrés.

## Parcours Docker

Les parcours Docker constituent la validation au niveau du produit. Ils installent ou mettent à jour un véritable
paquet dans des conteneurs Linux et vérifient le comportement au moyen de commandes CLI,
du démarrage du Gateway, de sondes HTTP, de l’état RPC et de l’état du système de fichiers.

Utilisez des parcours ciblés pendant les itérations :

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Parcours importants :

- `test:docker:plugins` couvre les tests rapides d’installation de plugins, les installations depuis des dossiers locaux,
  le comportement d’omission des mises à jour des dossiers locaux, les dossiers locaux avec des
  dépendances préinstallées, les installations de paquets `file:`, les installations git avec exécution de la CLI, les mises à jour
  de références git mobiles, les installations depuis le registre npm avec des dépendances transitives remontées,
  les mises à jour npm sans effet, le rejet des métadonnées de paquet npm mal formées,
  les installations depuis un environnement de test ClawHub local et les mises à jour sans effet, le comportement de mise à jour de la place de marché,
  ainsi que l’activation et l’inspection du bundle Claude. Définissez `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` pour
  conserver le bloc ClawHub hermétique et hors ligne.
- `test:docker:plugin-lifecycle-matrix` installe le paquet candidat dans un conteneur
  minimal, fait passer un plugin npm par l’installation, l’inspection, la désactivation, l’activation,
  la mise à niveau explicite, la rétrogradation explicite et la désinstallation après la suppression du code du plugin.
  Il journalise les métriques RSS et CPU pour chaque phase.
- `test:docker:plugin-update` vérifie qu’un plugin installé inchangé n’est
  ni réinstallé ni privé de ses métadonnées d’installation pendant `openclaw plugins update`.
- `test:docker:upgrade-survivor` installe l’archive candidate par-dessus un environnement de test
  d’ancien utilisateur contenant des données résiduelles, exécute la mise à jour du paquet ainsi que doctor en mode non interactif, puis démarre
  un Gateway en boucle locale et vérifie la conservation de l’état.
- `test:docker:published-upgrade-survivor` installe d’abord une version de référence publiée,
  la configure au moyen d’une recette intégrée `openclaw config set`, la met à jour avec
  l’archive candidate, exécute doctor, vérifie le nettoyage hérité, démarre le Gateway et
  sonde `/healthz`, `/readyz` et l’état RPC.
- `test:docker:update-restart-auth` installe le paquet candidat, démarre un
  Gateway géré avec authentification par jeton, désactive la variable d’environnement d’authentification du Gateway de l’appelant pour
  `openclaw update --yes --json` et exige que la commande de mise à jour du candidat
  redémarre le Gateway avant les sondes normales.
- `test:docker:update-migration` est le parcours de mise à jour publiée axé sur le nettoyage. Il
  part d’un état utilisateur configuré de type Discord/Telegram, exécute doctor sur la version de référence
  afin de permettre la matérialisation des dépendances des plugins configurés, injecte
  des résidus de dépendances de plugin héritées pour un plugin empaqueté configuré, effectue la mise à jour vers
  l’archive candidate et exige que doctor après la mise à jour supprime les racines de dépendances
  héritées.

Variantes utiles du scénario de survie à une mise à jour publiée :

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Scénarios disponibles : `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
et `versioned-runtime-deps`. Dans les exécutions agrégées, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) s’étend à tous les scénarios, y compris la migration
d’installation des plugins configurés.

La migration complète des mises à jour est intentionnellement séparée de l’intégration continue complète de publication. Utilisez le
workflow manuel `Update Migration` lorsque la question de publication est « toutes les
versions stables publiées depuis 2026.4.23 peuvent-elles être mises à jour vers ce candidat et
nettoyer les résidus de dépendances de plugins ? » :

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Acceptation des paquets

L’acceptation des paquets est la porte de validation des paquets native de GitHub. Elle résout un paquet
candidat en une archive `package-under-test`, enregistre sa version et son SHA-256, puis
exécute des parcours E2E Docker réutilisables sur cette archive exacte. La référence du harnais de workflow
est distincte de la référence source du paquet, afin que la logique de test actuelle puisse valider
d’anciennes versions de confiance.

Sources des candidats :

- `source=npm` : validez `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` ou une version publiée précise.
- `source=ref` : empaquetez une branche, une étiquette ou un commit de confiance avec le harnais actuel
  sélectionné.
- `source=url` : validez une archive HTTPS publique avec le paramètre `package_sha256` requis.
  Ce chemin rejette les identifiants dans les URL, les ports HTTPS non standard, les noms d’hôte
  privés/internes ou les résultats DNS/IP correspondants, les espaces d’adresses IP à usage spécial et les redirections non sûres.
- `source=trusted-url` : validez une archive HTTPS avec les paramètres obligatoires
  `package_sha256` et `trusted_source_id` conformément à la politique gérée par les responsables
  dans `.github/package-trusted-sources.json`. Utilisez cette option pour les miroirs d’entreprise/privés
  plutôt que d’affaiblir `source=url` avec un commutateur d’entrée autorisant les accès privés.
  Lorsqu’elle est configurée par la politique, l’authentification par jeton porteur utilise le secret fixe
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact` : réutilisez une archive téléversée par une autre exécution d’Actions.

La validation complète de publication utilise `source=artifact` par défaut, construit à partir du
SHA de publication résolu. Pour la validation après publication, transmettez
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` afin que la même matrice de mise à niveau
cible plutôt le paquet npm publié.

Les contrôles de publication appellent l’acceptation des paquets avec l’ensemble paquet/mise à jour/redémarrage/plugin :

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Lorsque la phase d’observation de la publication est activée (forcée pour `release_profile=stable` et
`full`), ils transmettent également :

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Cela maintient la migration des paquets, le changement de canal de mise à jour, la tolérance aux plugins gérés
corrompus, le nettoyage des dépendances obsolètes de plugins, la couverture hors ligne des plugins, le comportement
de mise à jour des plugins et l’assurance qualité du paquet Telegram sur le même artefact résolu, sans
obliger la porte de validation des paquets de publication par défaut à parcourir toutes les versions publiées.

`last-stable-4` correspond aux quatre dernières versions stables d’OpenClaw publiées sur npm.
L’acceptation des paquets de publication fixe `2026.4.23` comme première limite de compatibilité des mises à jour
de plugins, `2026.5.2` comme limite marquant un changement important de l’architecture des plugins, et
`2026.4.15` comme ancienne version de référence publiée de la série 2026.4.1x pour les mises à jour ; le résolveur
déduplique les versions épinglées déjà présentes parmi les quatre dernières. Pour une couverture exhaustive des migrations
de mises à jour publiées, utilisez `all-since-2026.4.23` dans le workflow Update Migration distinct
plutôt que dans l’intégration continue complète de publication. `release-history` reste
disponible pour un échantillonnage manuel plus large lorsque vous souhaitez également inclure le point de référence hérité
antérieur à cette date.

Lorsque plusieurs versions de référence du scénario de survie à une mise à jour publiée sont sélectionnées, le workflow Docker
réutilisable répartit chaque version de référence dans sa propre tâche d’exécution ciblée. Chaque
partition de version de référence exécute toujours l’ensemble de scénarios sélectionné, mais les journaux et les artefacts restent
propres à chaque version de référence, et le temps total est limité par la partition la plus lente plutôt que par une grande
tâche séquentielle.

Exécutez manuellement un profil de paquet lors de la validation d’un candidat avant la publication :

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

Pour une version canari extended-stable publiée, définissez
`package_spec=openclaw@extended-stable`. L’acceptation des paquets résout ce
sélecteur en une archive exacte avant l’exécution des parcours Docker.

Utilisez `suite_profile=product` lorsque la question de publication inclut les canaux MCP,
le nettoyage de cron/sous-agents, la recherche Web OpenAI ou OpenWebUI. Utilisez `suite_profile=full`
uniquement lorsque vous avez besoin d’une couverture Docker complète du chemin de publication.

## Valeurs par défaut de publication

Pour les versions candidates, la pile de validation par défaut est la suivante :

1. `pnpm check:changed` et `pnpm test:changed` pour les régressions au niveau du code source.
2. `pnpm release:check` pour l’intégrité de l’artefact du paquet.
3. Le profil `package` de l’acceptation des paquets ou les parcours de paquets personnalisés des contrôles de publication
   pour les contrats d’installation, de mise à jour, de redémarrage et de plugins.
4. Les contrôles de publication multi-OS pour le programme d’installation, l’intégration initiale et les comportements
   propres à chaque plateforme.
5. Les suites en direct uniquement lorsque la surface modifiée touche le comportement d’un fournisseur ou d’un service
   hébergé.

Sur les machines des responsables, les validations générales et la validation du produit via Docker/paquets doivent s’exécuter
dans Testbox, sauf lors d’une validation locale explicite.

## Compatibilité héritée

La tolérance de compatibilité est limitée et bornée dans le temps :

- Les paquets jusqu’à `2026.4.25`, y compris `2026.4.25-beta.*`, peuvent tolérer
  les lacunes déjà publiées dans les métadonnées de paquet lors de l’acceptation des paquets.
- Le paquet `2026.4.26` publié peut émettre un avertissement concernant les fichiers d’horodatage des métadonnées
  de compilation locale déjà publiés.
- Les paquets ultérieurs doivent respecter les contrats modernes. Les mêmes lacunes provoquent un échec au lieu
  d’un avertissement ou d’une omission.

N’ajoutez pas de nouvelles migrations au démarrage pour ces anciennes structures. Ajoutez ou étendez une réparation via doctor,
puis validez-la avec `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` lorsque la commande de mise à jour prend en charge le redémarrage.

## Ajout de couverture

Lorsque vous modifiez le comportement de mise à jour ou des plugins, ajoutez une couverture au niveau le plus bas qui
peut échouer pour la bonne raison :

- Logique pure de chemin ou de métadonnées : test unitaire à côté de la source.
- Inventaire du paquet ou comportement des fichiers empaquetés : test de vérification
  `package-dist-inventory` ou de l’archive tar.
- Comportement d’installation/de mise à jour de la CLI : assertion ou fixture de la voie Docker.
- Comportement de migration d’une version publiée : scénario `published-upgrade-survivor`.
- Comportement de redémarrage géré par la mise à jour : `update-restart-auth`.
- Comportement de la source du registre/paquet : fixture `test:docker:plugins` ou serveur
  de fixtures ClawHub.
- Organisation des dépendances ou comportement de nettoyage : vérifiez à la fois l’exécution
  à l’exécution et la limite du système de fichiers. Les dépendances npm peuvent être remontées
  dans le projet npm géré du Plugin ; les tests doivent donc prouver que ce projet est analysé/nettoyé,
  au lieu de supposer que seule l’arborescence `node_modules` locale au paquet du Plugin l’est.

Gardez les nouvelles fixtures Docker hermétiques par défaut. Utilisez des registres de fixtures locaux et
des paquets factices, sauf si le test porte précisément sur le comportement d’un registre réel.

## Triage des échecs

Commencez par l’identité de l’artefact :

- Résumé `resolve_package` de l’acceptation du paquet : source, version, SHA-256 et
  nom de l’artefact.
- Artefacts Docker : `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, journaux des voies et commandes de réexécution.
- Résumé de la survie à la mise à niveau : `.artifacts/upgrade-survivor/summary.json`,
  comprenant la version de référence, la version candidate, le scénario, les durées des phases et
  la couverture des recettes de configuration.

Préférez réexécuter exactement la voie ayant échoué avec le même artefact de paquet plutôt que
de réexécuter l’ensemble de la version.

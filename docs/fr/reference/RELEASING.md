---
read_when:
    - Recherche de définitions publiques des canaux de publication
    - Exécution de la validation de la version ou de l’acceptation du paquet
    - À la recherche des conventions de nommage des versions et du rythme de publication
summary: Canaux de publication, liste de contrôle de l’opérateur, environnements de validation, nomenclature des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-07-16T13:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expose actuellement trois canaux de mise à jour destinés aux utilisateurs :

- stable : le canal de version promue existant, qui est encore résolu via npm `latest` jusqu’à la réalisation du jalon distinct relatif à la CLI et aux canaux
- beta : balises de préversion publiées sur npm `beta`
- dev : la tête mobile de `main`

Séparément, les opérateurs de publication peuvent publier le paquet principal du dernier mois achevé sur npm `extended-stable`, à partir du correctif `33`. La ligne finale normale du mois en cours reste sur npm `latest` ; cette séparation des publications du côté opérateur ne modifie pas à elle seule la résolution des canaux de mise à jour de la CLI.

Les builds alpha de Tideclaw constituent une piste de préversion interne distincte (dist-tag npm `alpha`), décrite dans [Entrées du workflow NPM](#npm-workflow-inputs) et [Environnements de test des versions](#release-test-boxes).

## Nommage des versions

- Version mensuelle étendue stable publiée sur npm : `YYYY.M.PATCH`, avec `PATCH >= 33`, balise git `vYYYY.M.PATCH`
- Version finale quotidienne/normale : `YYYY.M.PATCH`, avec `PATCH < 33`, balise git `vYYYY.M.PATCH`
- Version corrective de secours normale : `YYYY.M.PATCH-N`, balise git `vYYYY.M.PATCH-N`
- Version bêta de préversion : `YYYY.M.PATCH-beta.N`, balise git `vYYYY.M.PATCH-beta.N`
- Version alpha de préversion : `YYYY.M.PATCH-alpha.N`, balise git `vYYYY.M.PATCH-alpha.N`
- Ne jamais compléter le mois ou le correctif avec des zéros
- `PATCH` est un numéro séquentiel de train de publication mensuel, et non un jour du calendrier. Les versions finales normales et bêta font progresser le train actuel ; les balises exclusivement alpha ne consomment ni ne font progresser le numéro de correctif bêta/normal. Il faut donc ignorer les anciennes balises exclusivement alpha ayant des numéros de correctif supérieurs lors de la sélection d’un train bêta ou normal.
- Les builds alpha/nocturnes utilisent le prochain train de correctifs non publié et n’incrémentent que `alpha.N` pour les builds répétés. Dès que ce correctif possède une bêta, les nouveaux builds alpha passent au correctif suivant.
- Les versions npm sont immuables : ne jamais supprimer, republier ni réutiliser une balise publiée. Créez plutôt le numéro de préversion suivant ou le correctif mensuel suivant.
- `latest` continue de suivre la ligne npm normale/quotidienne actuelle ; `beta` est la cible d’installation bêta actuelle
- `extended-stable` désigne le paquet npm pris en charge pour le dernier mois, à partir du correctif `33` ; le correctif `34` et les suivants sont des versions de maintenance de cette ligne mensuelle
- Les versions finales normales et les versions correctives normales sont publiées par défaut sur npm `beta` ; les opérateurs de publication peuvent cibler explicitement `latest` ou promouvoir ultérieurement un build bêta validé
- Le parcours mensuel dédié de stabilité étendue publie le paquet npm principal et chaque plugin officiel publiable sur npm à la même version exacte. Il ne publie pas les plugins sur ClawHub, ni les artefacts macOS ou Windows, ni une version GitHub, ni les dist-tags des dépôts privés, ni les images Docker, ni les artefacts mobiles, ni les téléchargements du site web.
- Chaque version finale normale publie ensemble le paquet npm, l’application macOS, l’APK Android autonome signé et les programmes d’installation signés de Windows Hub. Les versions bêta valident et publient normalement d’abord le parcours npm/paquet ; le build, la signature, la notarisation et la promotion des applications natives sont réservés aux versions finales normales, sauf demande explicite.

## Cadence des publications

- Les publications commencent par une bêta ; stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les versions depuis une branche `release/YYYY.M.PATCH` issue de la version actuelle de `main`, afin que la validation et les correctifs de publication ne bloquent pas les nouveaux développements sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont réservés aux mainteneurs

## Publication mensuelle étendue stable limitée à npm

Il s’agit d’une exception dédiée à la procédure normale de publication ci-dessous. Pour un mois achevé `YYYY.M`, créez `extended-stable/YYYY.M.33` ; publiez `vYYYY.M.33` et les correctifs de maintenance ultérieurs depuis cette même branche. La balise de publication, la tête de branche, le checkout, la version du paquet, la prévérification npm et l’exécution de la validation complète de la version doivent tous désigner le même commit. La branche protégée `main` doit déjà contenir la version finale d’un mois calendaire strictement ultérieur avec un correctif inférieur à `33` ; les correctifs de maintenance restent admissibles après que `main` a progressé de plus d’un mois.

Sur la branche étendue stable exacte, passez le paquet racine à `YYYY.M.P`, exécutez `pnpm release:prep` et vérifiez que chaque paquet d’extension publiable possède la même version. Commitez et poussez toutes les modifications générées, créez et poussez la balise immuable `vYYYY.M.P` sur ce commit, puis consignez le SHA complet obtenu. Les workflows utilisent cette arborescence préparée ; ils n’incrémentent ni ne synchronisent les versions à votre place.

Exécutez la prévérification npm et la validation complète de la version depuis cette tête exacte de branche préparée, puis enregistrez les deux identifiants d’exécution ainsi que la tentative réussie d’exécution de la validation complète de la version :

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` est le profil existant de profondeur de validation ; il est distinct du dist-tag npm `extended-stable` et reste volontairement inchangé.

Après la réussite des deux exécutions, publiez chaque plugin officiel publiable sur npm depuis la même tête exacte de branche. Le correctif `P` doit être `33` ou supérieur. Transmettez le SHA complet de publication comme `ref`, attendez la fin de la matrice complète et de la relecture du registre, puis enregistrez l’identifiant de l’exécution réussie de la publication NPM des plugins :

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Le workflow utilise l’inventaire normal préparé des paquets `all-publishable`, y compris les paquets dont la source n’a pas changé. Avant de réussir, il vérifie chaque paquet exact et chaque balise de plugin `extended-stable`. Si une exécution partielle échoue, relancez la même commande : les paquets déjà publiés sont réutilisés, les balises de plugins manquantes ou obsolètes sont réconciliées dans l’environnement de publication npm, et la relecture finale couvre toujours l’ensemble complet des paquets.

Une fois le workflow des plugins terminé avec succès et l’environnement de publication npm prêt, publiez l’archive tar principale exacte issue de la prévérification. La publication principale vérifie que l’exécution de plugins référencée est `completed/success` sur la même branche canonique et le même SHA source exact :

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Pour une répétition sur un fork ou hors production qui ne peut intentionnellement pas respecter la politique mensuelle `.33` ou la politique de mois de la branche protégée `main`, ajoutez `-f bypass_extended_stable_guard=true` aux déclenchements de prévérification et de publication npm. La valeur par défaut est `false`. Le contournement n’est accepté qu’avec `npm_dist_tag=extended-stable` et est consigné dans le résumé du workflow. Il ne contourne pas la référence canonique du workflow `extended-stable/YYYY.M.33`, l’égalité entre la tête de branche, la balise et le checkout, la syntaxe de la balise finale, l’égalité des versions du paquet et de la balise, l’identité des exécutions et du manifeste référencés, la provenance de l’archive tar, l’approbation de l’environnement, la relecture du registre ni les preuves de réparation des sélecteurs.

Le workflow de publication vérifie l’identité des exécutions référencées de prévérification, de validation et des plugins, le condensat de l’archive tar préparée ainsi que les sélecteurs du registre principal. Confirmez indépendamment le résultat après la réussite du workflow :

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Les deux commandes doivent renvoyer `YYYY.M.P`. Si la publication réussit mais que la relecture du sélecteur échoue, ne republiez pas la version immuable du paquet. Utilisez l’unique commande de réparation `npm dist-tag add openclaw@YYYY.M.P extended-stable` affichée dans le résumé systématiquement exécuté du workflow ayant échoué, puis répétez les deux relectures indépendantes. Le retour au sélecteur précédent constitue une décision distincte de l’opérateur, et non le parcours de réparation de la relecture.

La documentation publique d’assistance désigne initialement Slack, Discord et Codex comme surfaces de plugins couvertes par la stabilité étendue. Cette liste exprime une prise en charge et ne constitue pas une liste d’autorisation du code de publication : chaque plugin officiel publiable sur npm suit le même parcours de publication à version exacte.

La liste de contrôle normale ci-dessous continue de régir les publications bêta, `latest`, les versions GitHub, les plugins, macOS, Windows et les autres plateformes. N’exécutez pas ces étapes pour ce parcours étendu stable limité à npm.

## Liste de contrôle de l’opérateur pour une publication normale

Cette liste de contrôle représente la forme publique du processus de publication. Les identifiants privés, la signature, la notarisation, la récupération des dist-tags et les détails du retour arrière d’urgence restent dans le guide de publication réservé aux mainteneurs.

1. Partez de la version actuelle de `main` : récupérez les dernières modifications, confirmez que le commit cible a été poussé et que la CI de `main` est suffisamment verte pour créer une branche.
2. Créez `release/YYYY.M.PATCH` depuis ce commit. Les rétroportages sont facultatifs ; appliquez uniquement l’ensemble sélectionné par l’opérateur. Incrémentez chaque emplacement de version requis, exécutez `pnpm release:prep`, terminez les correctifs de publication et les portages en avant requis, puis examinez `src/plugins/compat/registry.ts` ainsi que `src/commands/doctor/shared/deprecation-compat.ts`.
3. Figez le commit complet du produit antérieur au journal des modifications comme **SHA du code**. Exécutez la prévérification déterministe de la source, puis utilisez `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Cela épingle les outils de workflow fiables pendant que la matrice complète Vitest, Docker, QA, des paquets et des performances cible le SHA du code exact.
4. Classez les échecs avant toute modification. Un échec du produit ou du code crée un nouveau SHA du code et exige une validation complète réussie pour ce SHA. Un échec du workflow, du harnais, des identifiants, d’une approbation ou de l’infrastructure est corrigé dans la surface qui en est propriétaire, puis réexécuté avec le même SHA du code.
5. Une fois seulement le SHA du code validé, générez la section supérieure de `CHANGELOG.md` à partir des PR fusionnées et des commits directs depuis la dernière balise publiée accessible. Conservez des entrées destinées aux utilisateurs et sans doublons. Lorsqu’une balise publiée divergente ou un portage en avant ultérieur réassocie des PR déjà publiées, transmettez-la explicitement comme `--shipped-ref`.
6. Commitez uniquement `CHANGELOG.md`. Ce commit constitue le **SHA de publication**. Le diff complet entre le SHA du code et le SHA de publication doit correspondre exactement à `CHANGELOG.md` ; tout autre chemin modifié renvoie la publication à l’étape 2.
7. Exécutez la validation complète de la version épinglée au SHA pour le SHA de publication, avec la réutilisation des preuves activée. Le parent léger doit enregistrer `changelog-only-release-v1`, pointer vers le SHA du code validé et ne déclencher aucune voie enfant du produit. Cela réutilise les preuves du produit, mais pas les octets des paquets.
8. Exécutez `OpenClaw NPM Release` avec `preflight_only=true` sur le SHA et la balise de publication. Enregistrez le `preflight_run_id` réussi. Cela construit et vérifie les octets exacts des paquets qui comprennent le journal des modifications final.
9. Balisiez le SHA de publication, puis exécutez l’assistant de création de candidat avec le parent de validation réussi du SHA de publication et la prévérification npm, au lieu de déclencher à nouveau l’un ou l’autre :

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Pour une version stable, transmettez également `--windows-node-tag vX.Y.Z`. L’utilitaire vérifie la provenance des notes de version, les octets de prévalidation npm, les preuves d’installation et de mise à jour Parallels, la preuve du paquet Telegram et les plans de publication des plugins, puis affiche la commande de publication.

   `OpenClaw Release Publish` distribue les paquets de plugins sélectionnés ou tous ceux qui sont publiables vers npm et le même ensemble vers ClawHub en parallèle, puis promeut l’artefact de prévalidation npm OpenClaw préparé avec le dist-tag correspondant dès que la publication npm des plugins réussit. Le checkout de version reste la racine du produit et des données, tandis que la planification et la vérification finale s’exécutent depuis le checkout exact et fiable de la source du workflow, afin qu’un ancien commit de version ne puisse pas utiliser silencieusement des outils de publication obsolètes. Avant le démarrage de tout processus enfant de publication, il génère et met en cache le corps exact de la publication GitHub. Lorsque la section `CHANGELOG.md` correspondante complète respecte la limite de 125 000 caractères de GitHub et le plafond de sécurité correspondant de 125 000 octets du moteur de rendu, la page contient exactement cette section `## YYYY.M.PATCH`, y compris son titre. Lorsque la section source dépasse ces limites, la page conserve exactement les notes éditoriales regroupées et remplace le registre des contributions surdimensionné par un lien stable vers le registre complet dans le fichier `CHANGELOG.md` épinglé au tag ; aucun registre partiel ni aucune puce tronquée n’est jamais publié. Le workflow choisit ce corps complet ou compact avant d’ajouter `### Release verification` ; si la fin des preuves devait dépasser la limite, il conserve le corps canonique et s’appuie plutôt sur les preuves immuables jointes. Les versions stables publiées sur npm `latest` deviennent la dernière version GitHub, tandis que les versions stables de maintenance conservées sur npm `beta` sont créées avec l’option GitHub `latest=false`. Le workflow téléverse également dans la publication GitHub les preuves de dépendances issues de la prévalidation, le manifeste de validation complète et les preuves de vérification du registre après publication, afin de faciliter la réponse aux incidents postérieurs à la publication. Il affiche immédiatement les identifiants des exécutions enfants, approuve automatiquement les contrôles des environnements de publication que le jeton du workflow est autorisé à approuver, résume les tâches enfants en échec avec la fin de leurs journaux, crée dès le départ la page brouillon de la publication GitHub et promeut simultanément les artefacts Windows et Android lors de la publication npm d’OpenClaw, finalise la page de publication et les preuves de dépendances une fois ces étapes réussies, attend ClawHub chaque fois qu’OpenClaw est publié sur npm, puis exécute le vérificateur bêta de la branche principale fiable et téléverse les preuves postérieures à la publication concernant la publication GitHub, le paquet npm, les paquets npm de plugins sélectionnés, les paquets ClawHub sélectionnés, les identifiants des exécutions enfants et l’identifiant facultatif de l’exécution NPM Telegram. Le vérificateur d’amorçage ClawHub exige le chemin et le SHA exacts du workflow de la branche principale fiable, les tentatives d’exécution du producteur et du terminal, le SHA de version, l’ensemble de paquets demandé, le tuple immuable de l’artefact de paquet et l’artefact terminal de relecture du registre ; une ancienne exécution réussie depuis une référence de version n’est pas acceptée.

   Exécutez ensuite l’acceptation du paquet après publication sur le paquet `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta` publié. Si une préversion poussée ou publiée nécessite une correction, créez le numéro de préversion correspondant suivant ; ne supprimez et ne réécrivez jamais l’ancien.

10. Après l’échec d’une tentative de publication, conservez le SHA de version inchangé, sauf si l’échec révèle un défaut du produit ou du journal des modifications. Reprenez les processus enfants et artefacts immuables ayant réussi ; ne reconstruisez et ne republiez jamais une version de paquet déjà publiée avec succès.
11. Pour une version stable, ne continuez que lorsque la bêta ou la version candidate validée dispose des preuves de validation requises. La publication npm stable passe également par `OpenClaw Release Publish`, en réutilisant l’artefact de prévalidation réussi via `preflight_run_id`. La préparation de la version macOS stable exige également les fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip` et le fichier `appcast.xml` mis à jour sur `main` ; le workflow de publication macOS publie automatiquement le flux de mises à jour signé dans le dépôt public `main` après vérification des artefacts de version, ou ouvre/met à jour une PR pour ce flux si la protection de branche bloque le push direct. La préparation stable de Windows Hub exige les artefacts signés `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` et `OpenClawCompanion-SHA256SUMS.txt` dans la publication GitHub d’OpenClaw. Transmettez le tag de version signé exact `openclaw/openclaw-windows-node` en tant que `windows_node_tag`, ainsi que sa table d’empreintes des programmes d’installation approuvée pour la version candidate en tant que `windows_node_installer_digests` ; `OpenClaw Release Publish` conserve le brouillon de la publication, distribue `Windows Node Release` et vérifie les trois artefacts avant la publication.
12. Après la publication, exécutez le vérificateur npm postérieur à la publication, éventuellement le test E2E Telegram autonome sur le paquet npm publié lorsqu’une preuve du canal après publication est nécessaire, la promotion du dist-tag si nécessaire, la vérification de la page de publication GitHub générée et les étapes d’annonce de la version, puis terminez la [finalisation stable de la branche principale](#stable-main-closeout) avant de considérer qu’une version stable est terminée.

## Finalisation stable de la branche principale

La publication stable n’est pas terminée tant que `main` ne reflète pas l’état réellement publié de la version.

1. Partez de la dernière version actualisée de `main`. Auditez `release/YYYY.M.PATCH` par rapport à celle-ci et reportez les véritables corrections absentes de `main`. Ne fusionnez pas aveuglément dans la version plus récente de `main` les adaptateurs de compatibilité, de test ou de validation propres à la branche de version.
2. Pour le parcours normal, définissez `main` sur la version stable publiée. Une finalisation tardive peut utiliser `main` après son passage à une version CalVer stable ultérieure d’OpenClaw ; ne rétrogradez pas un cycle de publication déjà commencé uniquement pour finaliser la version précédente. Le validateur exige toujours la section exacte du journal des modifications publié et l’entrée du flux de mises à jour, et enregistre la version et le SHA réels de `main`. Exécutez `pnpm release:prep` après toute modification de la version racine, puis `pnpm deps:shrinkwrap:generate`.
3. Faites correspondre exactement la section `## YYYY.M.PATCH` de `CHANGELOG.md` sur `main` à la branche de version étiquetée. Incluez la mise à jour stable de `appcast.xml` lorsque la publication Mac en a produit une.
4. N’ajoutez pas `YYYY.M.PATCH+1`, une version bêta ou une section vide de futur journal des modifications à `main` avant que l’opérateur ne démarre explicitement ce cycle de publication.
5. Exécutez `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` et `OPENCLAW_TESTBOX=1 pnpm check:changed`. Effectuez le push, puis vérifiez que `origin/main` contient la version publiée et le journal des modifications avant de considérer la version stable comme terminée.
6. Maintenez à jour les variables de dépôt `RELEASE_ROLLBACK_DRILL_ID` et `RELEASE_ROLLBACK_DRILL_DATE` après chaque exercice privé de restauration.

`OpenClaw Stable Main Closeout` démarre à partir du push `main` qui contient la version publiée, le journal des modifications et le flux de mises à jour après la publication stable. Il lit les preuves immuables postérieures à la publication pour lier le tag publié à ses exécutions de validation complète de la version et de publication, puis vérifie l’état stable de la branche principale, la publication, la période d’observation stable obligatoire et les preuves de performances bloquantes. Il joint un manifeste de finalisation immuable et sa somme de contrôle à la publication GitHub. Le déclencheur automatique par push ignore les anciennes versions antérieures aux preuves immuables postérieures à la publication et ne considère jamais cette omission comme une finalisation terminée.

Une finalisation complète exige les deux artefacts et une somme de contrôle correspondante. Un manifeste partiel rejoue le SHA `main` et l’exercice de restauration qu’il a enregistrés afin de régénérer des octets identiques, puis joint la somme de contrôle manquante ; une paire non valide, ou une somme de contrôle sans manifeste, reste bloquante. Une exécution déclenchée par push sans variables de dépôt pour l’exercice de restauration est ignorée sans terminer la finalisation ; l’absence d’enregistrement de l’exercice, ou un enregistrement datant de plus de 90 jours, bloque toujours la finalisation manuelle fondée sur des preuves. Les commandes privées de récupération restent dans le guide réservé aux responsables de maintenance. N’utilisez le déclenchement manuel que pour réparer ou rejouer une finalisation stable fondée sur des preuves.

Si le parent de publication de la version n’a échoué qu’après la jonction des preuves immuables npm/plugins, réparez et publiez d’abord tous les artefacts stables des plateformes. Un responsable de maintenance peut ensuite déclencher manuellement la finalisation avec `allow_failed_publish_recovery=true` ; ce mode n’accepte qu’un parent terminé en échec et exige en outre les contrats exacts des artefacts Android et Windows, les empreintes SHA-256 GitHub, la vérification des sommes de contrôle, la provenance Android et une promotion Windows réussie distribuée par le parent, dont les vérifications Authenticode et les empreintes approuvées pour la version candidate correspondent aux programmes d’installation publiés, en plus des vérifications macOS et du flux de mises à jour habituelles. La finalisation automatique déclenchée par push n’active jamais ce mode de récupération.

Un tag correctif de secours pour une ancienne version peut réutiliser les preuves du paquet de base uniquement lorsque le tag correctif pointe vers le même commit source que le tag stable de base. Sa publication Android réutilise l’APK vérifié du tag de base et ajoute la provenance du tag correctif. Une correction dont la source diffère doit publier et vérifier ses propres preuves de paquet et utiliser un `versionCode` Android supérieur.

## Prévalidation de la version

- Exécutez `pnpm check:test-types` avant la prévalidation de la version afin que le TypeScript des tests reste couvert en dehors du contrôle local plus rapide `pnpm check`.
- Exécutez `pnpm check:architecture` avant la prévalidation de la version afin que les contrôles plus larges des cycles d’importation et des limites architecturales réussissent en dehors du contrôle local plus rapide.
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de version `dist/*` attendus et le bundle de Control UI existent pour l’étape de validation du paquet.
- Exécutez `pnpm release:prep` après l’incrémentation de la version racine et avant l’étiquetage. Cette commande exécute tous les générateurs de version déterministes qui divergent couramment après une modification de version, de configuration ou d’API : versions des plugins, fichiers shrinkwrap npm, inventaire des plugins, schéma de configuration de base, métadonnées de configuration des canaux intégrés, référence de la documentation de configuration, exportations du SDK de plugins et référence de l’API du SDK de plugins. `pnpm release:check` réexécute ces contrôles en mode vérification (ainsi qu’un contrôle du budget de surface du SDK de plugins) et signale en un seul passage chaque échec dû à une divergence générée avant d’exécuter les contrôles de publication des paquets.
- La synchronisation des versions des plugins met par défaut à jour le paquet d’exécution publiable `@openclaw/ai`, les versions des paquets de plugins officiels et les seuils `openclaw.compat.pluginApi` existants vers la version publiée d’OpenClaw. Considérez ce champ comme le seuil de l’API du SDK/de l’environnement d’exécution des plugins, et pas seulement comme une copie de la version du paquet : pour les publications réservées aux plugins qui restent volontairement compatibles avec des hôtes OpenClaw plus anciens, conservez le seuil à la plus ancienne API d’hôte prise en charge et documentez ce choix dans les preuves de publication du plugin.
- Exécutez manuellement le workflow `Full Release Validation` avant l’approbation de la version afin de lancer tous les environnements de test de préversion depuis un point d’entrée unique. Il accepte une branche, un tag ou un SHA de commit complet, distribue manuellement `CI` et distribue `OpenClaw Release Checks` pour les parcours de test d’installation, d’acceptation des paquets, de vérification multiplateforme des paquets, de parité de QA Lab, de Matrix et de Telegram. Les exécutions stables et complètes incluent toujours les tests exhaustifs en conditions réelles/E2E et la période d’observation du parcours de publication Docker ; `run_release_soak=true` est conservé pour une période d’observation bêta explicite. L’acceptation des paquets fournit le test E2E Telegram canonique du paquet pendant la validation de la version candidate, évitant ainsi un second processus d’interrogation en conditions réelles exécuté simultanément.

  Fournissez `release_package_spec` après la publication d’une bêta afin de réutiliser le paquet npm publié dans les contrôles de version, l’acceptation des paquets et le test E2E Telegram du paquet sans reconstruire l’archive tar de la version. Fournissez `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un paquet publié différent de celui du reste de la validation de la version. Fournissez `package_acceptance_package_spec` lorsque l’acceptation des paquets doit utiliser un paquet publié différent de celui spécifié pour la version. Fournissez `evidence_package_spec` lorsque le rapport des preuves de version doit démontrer que la validation correspond à un paquet npm publié sans imposer le test E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Exécutez le workflow manuel `Package Acceptance` lorsque vous souhaitez obtenir une preuve par canal auxiliaire pour un paquet candidat pendant que le travail de publication se poursuit. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche, une étiquette ou un SHA `package_ref` de confiance avec le banc d’essai `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS publique avec un SHA-256 obligatoire et une politique stricte d’URL publiques ; `source=trusted-url` pour une politique de source de confiance nommée utilisant obligatoirement `trusted_source_id` et SHA-256 ; ou `source=artifact` pour une archive tar téléversée par une autre exécution de GitHub Actions.

  Le workflow résout le candidat en `package-under-test`, réutilise le planificateur de publication E2E Docker avec cette archive tar et peut exécuter l’assurance qualité Telegram sur la même archive avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact du paquet est le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée. `update-restart-auth` utilise le paquet candidat à la fois comme CLI installée et comme paquet testé afin d’exercer le chemin de redémarrage géré de la commande de mise à jour du candidat.

  Exemple :

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau du Gateway et rechargement de la configuration
  - `package` : voies natives de l’artefact pour le paquet, la mise à jour, le redémarrage et les plugins, sans OpenWebUI ni ClawHub en direct
  - `product` : profil de paquet avec, en plus, les canaux MCP, le nettoyage Cron/des sous-agents, la recherche web OpenAI et OpenWebUI
  - `full` : segments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée

- Exécutez directement le workflow manuel `CI` lorsque vous avez uniquement besoin d’une couverture CI normale et déterministe pour le candidat à la publication. Les déclenchements manuels de CI ignorent le filtrage selon les modifications et imposent les partitions Linux Node, les partitions des plugins intégrés, les partitions des contrats de plugins et de canaux, la compatibilité avec Node 22, `check-*`, `check-additional-*`, les contrôles rapides de l’artefact compilé, les contrôles de la documentation, les Skills Python, Windows, macOS et les voies d’internationalisation de l’interface Control UI. Les exécutions CI manuelles autonomes n’exécutent Android que lorsqu’elles sont déclenchées avec `include_android=true` ; `Full Release Validation` transmet cette entrée à son processus CI enfant.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cette opération exerce le laboratoire d’assurance qualité par l’intermédiaire d’un récepteur OTLP/HTTP local et vérifie l’exportation des traces, des métriques et des journaux, ainsi que le bornage des attributs de trace et la rédaction du contenu et des identifiants, sans nécessiter Opik, Langfuse ni aucun autre collecteur externe.
- Exécutez `pnpm qa:otel:collector-smoke` lors de la validation de la compatibilité du collecteur. Cette opération achemine la même exportation OTLP du laboratoire d’assurance qualité par un véritable conteneur Docker OpenTelemetry Collector avant les assertions du récepteur local.
- Exécutez `pnpm qa:prometheus:smoke` lors de la validation de la collecte Prometheus protégée. Cette opération exerce le laboratoire d’assurance qualité, rejette les collectes non authentifiées et vérifie que les familles de métriques essentielles à la publication ne contiennent ni contenu d’invite, ni identifiants bruts, ni jetons d’authentification, ni chemins locaux.
- Exécutez `pnpm qa:observability:smoke` pour enchaîner les voies de contrôle rapide OpenTelemetry et Prometheus depuis l’arborescence des sources.
- Exécutez `pnpm release:check` avant chaque publication étiquetée.
- La vérification préalable `OpenClaw NPM Release` génère les preuves de publication relatives aux dépendances avant d’empaqueter l’archive tar npm. Le contrôle des vulnérabilités signalées par les avis npm bloque la publication. Les rapports sur les risques du manifeste transitif, la propriété et la surface d’installation des dépendances, ainsi que les modifications des dépendances, constituent uniquement des preuves de publication. Le rapport sur les modifications des dépendances compare le candidat à la publication à la précédente étiquette de publication accessible. La vérification préalable téléverse les preuves relatives aux dépendances sous le nom `openclaw-release-dependency-evidence-<tag>` et les intègre également sous `dependency-evidence/` dans l’artefact de vérification préalable npm préparé. Le véritable chemin de publication réutilise cet artefact de vérification préalable, puis joint les mêmes preuves à la publication GitHub sous le nom `openclaw-<version>-dependency-evidence.zip`.
- Exécutez `OpenClaw Release Publish` pour la séquence de publication avec mutations une fois l’étiquette créée. Déclenchez les publications bêta et stables ordinaires depuis `main` de confiance ; l’étiquette de publication sélectionne toujours le commit cible exact et peut pointer dans `release/YYYY.M.PATCH`. Les publications alpha de Tideclaw restent sur leur branche alpha correspondante. Transmettez l’exécution npm OpenClaw `preflight_run_id` réussie, l’exécution `full_release_validation_run_id` réussie et la valeur exacte de `full_release_validation_run_attempt`, puis conservez la portée de publication des plugins par défaut `all-publishable`, sauf si vous effectuez délibérément une réparation ciblée. Le workflow exécute en série la publication npm des plugins, la publication ClawHub des plugins et la publication npm d’OpenClaw afin que le paquet principal ne soit pas publié avant ses plugins externalisés ; la promotion Windows et Android s’exécute en parallèle de la publication npm principale sur la page de publication à l’état de brouillon. Les réexécutions de publication peuvent reprendre : si une version npm principale est déjà publiée, le déclenchement principal est ignoré après que le workflow a vérifié que l’archive tar du registre correspond à l’artefact de vérification préalable de l’étiquette ; la promotion Windows/Android est également ignorée lorsque la publication contient déjà le contrat d’artefacts vérifié, de sorte qu’une nouvelle tentative ne répète que les étapes ayant échoué. Les réparations ciblées portant uniquement sur des plugins nécessitent `plugin_publish_scope=selected` et une liste de plugins non vide. Les exécutions `all-publishable` portant uniquement sur des plugins nécessitent des preuves complètes et immuables de la vérification préalable et de la validation intégrale de la publication ; les preuves partielles sont rejetées.
- La version stable `OpenClaw Release Publish` nécessite une valeur exacte de `windows_node_tag` après la création de la publication `openclaw/openclaw-windows-node` correspondante qui n’est pas une préversion, ainsi que la table `windows_node_installer_digests` approuvée pour le candidat. Avant de déclencher tout workflow enfant de publication, le système vérifie que cette publication source est publiée, qu’elle n’est pas une préversion, qu’elle contient les programmes d’installation x64/ARM64 requis et qu’elle correspond toujours à cette table approuvée. Il déclenche ensuite `Windows Node Release` alors que la publication OpenClaw est encore à l’état de brouillon, en transmettant sans modification la table figée des condensats des programmes d’installation. Le workflow enfant télécharge depuis cette étiquette exacte les programmes d’installation signés de Windows Hub, vérifie leur correspondance avec les condensats figés, contrôle sur un exécuteur Windows que leurs signatures Authenticode utilisent le signataire OpenClaw Foundation attendu, écrit un manifeste SHA-256, puis téléverse les programmes d’installation et le manifeste dans la publication GitHub OpenClaw canonique. Il télécharge ensuite à nouveau les artefacts promus et vérifie leur présence dans le manifeste ainsi que leurs condensats. Le workflow parent vérifie le contrat actuel des artefacts x64, ARM64 et de somme de contrôle avant la publication. La récupération directe rejette les noms d’artefacts `OpenClawCompanion-*` inattendus avant de remplacer les artefacts attendus du contrat par les octets figés de la source.

  Ne déclenchez manuellement `Windows Node Release` que pour une récupération et transmettez toujours une étiquette exacte, jamais `latest`, ainsi que la table JSON `expected_installer_digests` explicite provenant de la publication source approuvée. Les liens de téléchargement du site web doivent cibler les URL exactes des artefacts de la publication OpenClaw stable actuelle, ou `releases/latest/download/...` uniquement après avoir vérifié que la redirection GitHub vers la dernière version pointe vers cette même publication ; ne créez pas uniquement un lien vers la page de publication du dépôt compagnon.

- Les vérifications de version s’exécutent désormais dans un workflow manuel distinct : `OpenClaw Release Checks`. Il exécute également le parcours de parité simulée du QA Lab ainsi que le profil de version Matrix et le parcours QA Telegram avant l’approbation de la version. Les parcours en conditions réelles utilisent l’environnement `qa-live-shared` ; Telegram utilise également des locations d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` lorsque vous souhaitez tous les scénarios Matrix maintenus ; le workflow répartit cette sélection entre les profils de transport, de médias et E2EE afin de conserver une validation complète dans les délais d’expiration de chaque tâche.
- La validation de l’installation et de la mise à niveau de l’environnement d’exécution sur plusieurs systèmes d’exploitation fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Cette séparation est intentionnelle : elle permet de garder le véritable parcours de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications en conditions réelles plus lentes restent dans leur propre parcours afin de ne pas retarder ni bloquer la publication.
- Les vérifications de version utilisant des secrets doivent être déclenchées via `Full Release Validation` ou depuis la référence du workflow `main`/release afin que la logique du workflow et les secrets restent contrôlés.
- `OpenClaw Release Checks` accepte une branche, une étiquette ou le SHA complet d’un commit, à condition que le commit résolu soit accessible depuis une branche ou une étiquette de version OpenClaw.
- Le contrôle préalable de validation uniquement `OpenClaw NPM Release` accepte également le SHA complet de 40 caractères du commit actuel de la branche du workflow, sans exiger d’étiquette poussée. Ce parcours par SHA est réservé à la validation et ne peut pas être promu en publication réelle. En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées du paquet ; une publication réelle exige toujours une véritable étiquette de version.
- Les deux workflows conservent le véritable parcours de publication et de promotion sur les exécuteurs hébergés par GitHub, tandis que le parcours de validation non modificateur peut utiliser les exécuteurs Linux Blacksmith plus puissants.
- Ce workflow exécute `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`.
- Le contrôle préalable de la version npm n’attend plus le parcours distinct de vérification de version.
- Avant d’étiqueter localement une version candidate, exécutez `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L’utilitaire exécute les garde-fous rapides de version, les vérifications de publication npm/ClawHub des plugins, la compilation, la compilation de l’interface utilisateur et `release:openclaw:npm:check`, dans l’ordre permettant de détecter les erreurs courantes qui bloquent l’approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou l’étiquette de préversion/correction correspondante) avant l’approbation.
- Après la publication npm, exécutez `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou la version bêta/correction correspondante) pour vérifier le parcours d’installation depuis le registre publié dans un nouveau préfixe temporaire.
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` pour vérifier l’intégration initiale du paquet installé, la configuration de Telegram et le véritable E2E Telegram sur le paquet npm publié en utilisant le pool partagé d’identifiants Telegram loués. Pour des exécutions locales ponctuelles, les mainteneurs peuvent omettre les variables Convex et transmettre directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le test de fumée bêta complet après publication depuis la machine d’un mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’utilitaire exécute la validation de la mise à jour npm et de la nouvelle cible dans Parallels, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification après publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement exclusivement manuel et ne s’exécute pas après chaque fusion.
- L’automatisation des versions pour les mainteneurs utilise un contrôle préalable suivi d’une promotion :
  - Une véritable publication npm doit réussir un contrôle npm `preflight_run_id`.
  - L’orchestration et le contrôle préalable des publications bêta et stables ordinaires utilisent le workflow approuvé `main` avec l’étiquette cible exacte. La publication alpha Tideclaw et son contrôle préalable utilisent la branche alpha correspondante.
  - Les versions npm stables utilisent `beta` par défaut ; une publication npm stable peut cibler explicitement `latest` via une entrée du workflow.
  - La modification des balises de distribution npm fondée sur un jeton réside dans `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, car `npm dist-tag add` nécessite encore `NPM_TOKEN`, tandis que le dépôt source conserve une publication exclusivement fondée sur OIDC.
  - Le workflow public `macOS Release` est réservé à la validation ; lorsqu’une étiquette existe uniquement sur une branche de version mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.PATCH`.
  - Une véritable publication macOS doit réussir les contrôles macOS `preflight_run_id` et `validate_run_id`.
  - Les véritables parcours de publication promeuvent les artefacts préparés au lieu de les recompiler.
- Pour les versions correctives stables telles que `YYYY.M.PATCH-N`, le vérificateur après publication contrôle également le même parcours de mise à niveau avec préfixe temporaire de `YYYY.M.PATCH` vers `YYYY.M.PATCH-N`, afin que les corrections de version ne puissent pas laisser silencieusement d’anciennes installations globales sur la charge utile stable de base.
- Le contrôle préalable de version npm échoue de manière fermée, sauf si l’archive contient à la fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide, afin d’éviter de publier de nouveau un tableau de bord de navigateur vide.
- La vérification après publication contrôle également que les points d’entrée des plugins publiés et les métadonnées du paquet sont présents dans l’organisation du registre installé. Une version dont les charges utiles d’exécution des plugins sont absentes échoue au vérificateur après publication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` impose également le budget npm pack `unpackedSize` à l’archive de mise à jour candidate, afin que l’E2E du programme d’installation détecte tout gonflement accidentel du paquet avant le parcours de publication de la version.
- Si les travaux de version ont modifié la planification CI, les manifestes de durée des extensions ou les matrices de test des extensions, régénérez et examinez avant approbation les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur à partir de `.github/workflows/plugin-prerelease.yml`, afin que les notes de version ne décrivent pas une organisation CI obsolète.
- La préparation d’une version macOS stable comprend également les surfaces de mise à jour : la version GitHub doit finalement contenir les éléments empaquetés `.zip`, `.dmg` et `.dSYM.zip` ; `appcast.xml` sur `main` doit pointer vers la nouvelle archive zip stable après publication (le workflow de publication macOS la valide automatiquement, ou ouvre une PR d’appcast si l’envoi direct est bloqué) ; l’application empaquetée doit conserver un identifiant de bundle hors débogage, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher de compilation Sparkle canonique pour cette version.

## Environnements de test de version

`Full Release Validation` permet aux opérateurs de lancer la matrice complète du produit depuis un point d’entrée unique. Utilisez l’utilitaire afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée à un SHA de workflow `main` approuvé, tandis que le commit demandé reste le candidat testé :

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

L’utilitaire récupère la version actuelle de `origin/main`, pousse `release-ci/<workflow-sha>-...` sur ce commit de workflow approuvé, déduit `beta` pour les versions de paquet alpha/bêta et `stable` dans les autres cas, déclenche `Full Release Validation` depuis la branche temporaire avec `ref=<target-sha>`, vérifie que chaque `headSha` de workflow enfant correspond au SHA du workflow parent épinglé, puis supprime la branche temporaire. Transmettez `-f reuse_evidence=false` pour forcer une nouvelle exécution, `-f release_profile=full` pour le vaste balayage consultatif, ou `--workflow-sha <trusted-main-sha>` pour épingler un commit antérieur encore accessible depuis la version actuelle de `origin/main`. Le workflow lui-même n’écrit jamais de références de dépôt. Cela maintient disponibles les outils de version réservés à la branche principale sans ajouter de commits d’outillage au candidat et évite de valider par erreur une exécution enfant `main` plus récente.

Une fois le SHA du code validé, ne validez que `CHANGELOG.md` et exécutez le même utilitaire avec le SHA de version :

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Le second parent ne réutilise les preuves du produit que lorsque GitHub établit que le SHA de version descend du SHA du code et que l’ensemble complet des chemins modifiés correspond exactement à `CHANGELOG.md`. Il enregistre `changelog-only-release-v1` et ne déclenche aucun enfant du produit. Le contrôle préalable npm ainsi que l’acceptation du paquet et de l’installation s’exécutent toujours sur le SHA de version, car les octets de son archive ont changé.

Pour un nouveau SHA du code, le workflow résout la cible, déclenche le workflow manuel `CI`, puis déclenche `OpenClaw Release Checks`. `OpenClaw Release Checks` répartit le test de fumée d’installation, les vérifications de version sur plusieurs systèmes d’exploitation, la couverture en conditions réelles/E2E Docker du parcours de version lorsque le test prolongé est activé, l’acceptation du paquet avec l’E2E canonique du paquet Telegram, la parité QA Lab, Matrix en conditions réelles et Telegram en conditions réelles. Une exécution complète/totale n’est acceptable que si le récapitulatif `Full Release Validation` indique que `normal_ci`, `plugin_prerelease` et `release_checks` ont réussi, sauf si une réexécution ciblée a intentionnellement ignoré l’enfant `Plugin Prerelease` distinct. Utilisez l’enfant autonome `npm-telegram` uniquement pour une réexécution ciblée du paquet publié avec `release_package_spec` ou `npm_telegram_package_spec`. Le récapitulatif final du vérificateur comprend des tableaux des tâches les plus lentes pour chaque exécution enfant, afin que le responsable de version puisse voir le chemin critique actuel sans télécharger les journaux.

L’enfant consacré aux performances du produit produit uniquement des artefacts dans ce parcours de version. Le
workflow général le déclenche avec `publish_reports=false`, et la validation est refusée
si son garde-fou réservé aux artefacts ne prouve pas que le diffuseur de rapports Clawgrit est resté
ignoré.

Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour connaître la matrice complète des étapes, les noms exacts des tâches du workflow, les différences entre les profils stable et complet, les artefacts et les identifiants de réexécution ciblée.

Les workflows enfants sont déclenchés depuis la référence approuvée épinglée par SHA qui exécute `Full Release Validation`. Chaque exécution enfant doit utiliser le SHA exact du workflow parent. N’utilisez pas de déclenchements `--ref main -f ref=<sha>` bruts comme preuve de version ; utilisez `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Utilisez `release_profile` pour sélectionner l’étendue des fournisseurs et des vérifications en conditions réelles :

- `beta` : parcours OpenAI/principal en conditions réelles et Docker le plus rapide parmi ceux essentiels à la version
- `stable` : couverture bêta et stable des fournisseurs et systèmes principaux pour l’approbation de la version
- `full` : couverture stable complétée par une large couverture consultative des fournisseurs et médias

Les validations stable et complète exécutent toujours, avant la promotion, le balayage exhaustif en conditions réelles/E2E, le parcours de version Docker et le balayage borné de survie aux mises à niveau publiées. Utilisez `run_release_soak=true` pour demander ce même balayage pour une version bêta. Ce balayage couvre les quatre derniers paquets stables, ainsi que les références épinglées `2026.4.23` et `2026.5.2`, plus la couverture plus ancienne `2026.4.15`, en supprimant les références en double et en répartissant chaque référence dans sa propre tâche d’exécution Docker.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence cible en tant que `release-package-under-test`, puis réutilise cet artefact dans les vérifications sur plusieurs systèmes d’exploitation, l’acceptation du paquet et les vérifications Docker du parcours de version lors d’un test prolongé. Cela maintient tous les environnements concernés par le paquet sur les mêmes octets et évite de recompiler plusieurs fois le paquet. Lorsqu’une version bêta est déjà disponible sur npm, définissez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` afin que les vérifications de version téléchargent une seule fois le paquet publié, extraient son SHA source de compilation depuis `dist/build-info.json`, puis réutilisent cet artefact pour les parcours sur plusieurs systèmes d’exploitation, l’acceptation du paquet, le parcours de version Docker et Telegram du paquet.

Le test de fumée d’installation OpenAI sur plusieurs systèmes d’exploitation utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable du dépôt/de l’organisation est définie, sinon `openai/gpt-5.6-luna`, car ce parcours valide l’installation du paquet, l’intégration initiale, le démarrage du Gateway et un tour d’agent en conditions réelles plutôt que d’évaluer les performances du modèle le plus performant. La matrice plus large des fournisseurs en conditions réelles reste l’emplacement dédié à la couverture propre aux modèles.

Utilisez ces variantes selon l’étape de la version :

```bash
# Valider le SHA de code du produit complet.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Valider le SHA de publication contenant uniquement le journal des modifications en réutilisant les preuves produit du SHA de code.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Après la publication d’une version bêta, ajouter le test E2E Telegram du paquet publié.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ensemble complet comme première réexécution après une correction ciblée. Si une boîte échoue, utilisez le workflow enfant, la tâche, le scénario Docker, le profil de paquet, le fournisseur de modèle ou le scénario d’AQ en échec pour la preuve suivante. Réexécutez l’ensemble complet uniquement si la correction a modifié l’orchestration partagée de la publication ou rendu obsolètes les preuves antérieures de toutes les boîtes. Le vérificateur final de l’ensemble revérifie les identifiants d’exécution enregistrés des workflows enfants ; après la réexécution réussie d’un workflow enfant, réexécutez uniquement la tâche parente `Verify full validation` ayant échoué.

`rerun_group=all` peut réutiliser une exécution antérieure réussie de l’ensemble lorsque le profil de publication,
le paramètre de soak effectif et les entrées de validation correspondent, et que le SHA cible
est identique ou que la nouvelle cible est un descendant dont l’ensemble complet des chemins modifiés
est exactement `CHANGELOG.md`. La réutilisation de la cible exacte enregistre
`exact-target-full-validation-v1` ; le SHA de publication après validation enregistre
`changelog-only-release-v1`. Ce dernier ne réutilise que la validation du produit. La vérification préalable npm,
les octets du paquet, la provenance des notes de publication et la validation de l’installation/mise à jour
doivent toujours s’exécuter sur le SHA de publication. Toute modification de version, de source, de contenu généré,
de dépendance, de paquet ou de cible appartenant au workflow nécessite un nouveau SHA de code
et une nouvelle validation complète. Les exécutions plus récentes de l’ensemble pour la même référence `release/*` et
le même groupe de réexécution remplacent automatiquement celles en cours. Transmettez
`reuse_evidence=false` pour forcer une nouvelle exécution complète.

Pour une récupération limitée, transmettez `rerun_group` à l’ensemble. `all` est la véritable exécution de la version candidate, `ci` exécute uniquement l’enfant de CI normal, `plugin-prerelease` exécute uniquement l’enfant de Plugin réservé à la publication, `release-checks` exécute toutes les boîtes de publication, et les groupes de publication plus restreints sont `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`. Les réexécutions ciblées `npm-telegram` nécessitent `release_package_spec` ou `npm_telegram_package_spec` ; les exécutions complètes/totales utilisent le test E2E Telegram canonique du paquet dans Package Acceptance. Les réexécutions ciblées multi-OS peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou un autre filtre d’OS/de suite. Les échecs des contrôles de publication d’AQ bloquent la validation normale de la publication, y compris la dérive requise des outils dynamiques OpenClaw dans le niveau standard. Les exécutions alpha de Tideclaw peuvent néanmoins traiter comme indicatifs les scénarios de contrôle de publication sans rapport avec la sécurité des paquets. Avec `release_profile=beta`, les suites de fournisseurs en direct `Run repo/live E2E validation` sont indicatives (avertissements, sans blocage) ; les profils stables et complets les conservent comme bloquantes. Lorsque `live_suite_filter` demande explicitement un scénario d’AQ en direct soumis à une barrière, tel que Discord, WhatsApp ou Slack, la variable de dépôt `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon, la capture des entrées échoue au lieu d’ignorer silencieusement le scénario.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement la limitation au périmètre modifié et impose le graphe de tests normal pour la version candidate : partitions Linux Node, partitions de plugins intégrés, partitions de contrats de plugins et de canaux, compatibilité Node 22, `check-*`, `check-additional-*`, contrôles rapides des artefacts compilés, contrôles de la documentation, Skills Python, Windows, macOS et i18n de Control UI. Android est inclus lorsque `Full Release Validation` exécute la boîte, car l’ensemble transmet `include_android=true` ; la CI manuelle autonome nécessite `include_android=true` pour couvrir Android.

Utilisez cette boîte pour répondre à la question « l’arborescence des sources a-t-elle réussi l’intégralité de la suite de tests normale ? ». Elle ne correspond pas à la validation du produit sur le chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` réussie sur le SHA cible exact
- noms des partitions lentes ou en échec dans les tâches de CI lors de l’analyse des régressions
- artefacts de mesure des durées Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse des performances

Exécutez directement la CI manuelle uniquement lorsque la publication nécessite une CI normale déterministe, mais pas les boîtes Docker, QA Lab, de fournisseurs en direct, multi-OS ou de paquets. Utilisez la première commande pour une CI directe sans Android. Ajoutez `include_android=true` lorsque la CI directe de la version candidate doit couvrir Android :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` à `openclaw-live-and-e2e-checks-reusable.yml`, ainsi que dans le workflow `install-smoke` en mode publication. Elle valide la version candidate au moyen d’environnements Docker empaquetés plutôt que par les seuls tests au niveau des sources.

La couverture Docker de la publication comprend :

- test rapide d’installation complète avec activation du test lent d’installation globale de Bun
- préparation/réutilisation de l’image de test rapide du Dockerfile racine selon le SHA cible, les tâches QR, racine/Gateway et programme d’installation/Bun s’exécutant comme partitions distinctes de tests rapides d’installation
- scénarios E2E du dépôt
- segments Docker du chemin de publication : `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` à `plugins-runtime-install-h`, et `openwebui`
- couverture OpenWebUI sur un exécuteur dédié disposant d’un disque de grande capacité lorsqu’elle est demandée
- scénarios distincts d’installation/désinstallation des plugins intégrés, de `bundled-plugin-install-uninstall-0` à `bundled-plugin-install-uninstall-23`
- suites de fournisseurs en direct/E2E et couverture des modèles en direct dans Docker lorsque les contrôles de publication incluent des suites en direct

Utilisez les artefacts Docker avant toute réexécution. Le planificateur du chemin de publication téléverse `.artifacts/docker-tests/` avec les journaux des scénarios, `summary.json`, `failures.json`, les durées des phases, le plan JSON du planificateur et les commandes de réexécution. Pour une récupération ciblée, utilisez `docker_lanes=<lane[,lane]>` sur le workflow en direct/E2E réutilisable au lieu de réexécuter tous les segments de publication. Les commandes de réexécution générées incluent les entrées antérieures `package_artifact_run_id` et les images Docker préparées lorsqu’elles sont disponibles, afin qu’un scénario en échec puisse réutiliser la même archive tar et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. Elle constitue la barrière de publication relative au comportement agentique et aux canaux, distincte de Vitest et des mécanismes de paquet Docker.

La couverture QA Lab de la publication comprend :

- scénario de parité simulée comparant le scénario candidat OpenAI à la référence `anthropic/claude-opus-4-8` à l’aide du pack de parité agentique
- profil de publication de l’adaptateur en direct Matrix utilisant l’environnement `qa-live-shared`
- scénario d’AQ Telegram en direct utilisant des locations d’identifiants Convex pour la CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à la question « la publication se comporte-t-elle correctement dans les scénarios d’AQ et les flux de canaux en direct ? ». Conservez les URL des artefacts pour les scénarios de parité, Matrix et Telegram lors de l’approbation de la publication. La couverture Matrix complète reste disponible sous forme d’une exécution QA Lab manuelle et partitionnée plutôt que comme scénario critique par défaut pour la publication.

### Paquet

La boîte Paquet constitue la barrière du produit installable. Elle repose sur `Package Acceptance` et le résolveur `scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un candidat en archive tar `package-under-test` consommée par les tests E2E Docker, valide l’inventaire du paquet, enregistre la version et le SHA-256 du paquet, et conserve la référence du harnais de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
- `source=ref` : empaqueter une branche, une étiquette ou un SHA de commit complet `package_ref` approuvé avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS public avec le `package_sha256` requis ; les identifiants dans l’URL, les ports HTTPS non standard, les noms d’hôte ou adresses résolues privées/internes/à usage spécial et les redirections non sûres sont rejetés
- `source=trusted-url` : télécharger un `.tgz` HTTPS avec les `package_sha256` et `trusted_source_id` requis depuis une politique nommée dans `.github/package-trusted-sources.json` ; utilisez cette option pour les miroirs d’entreprise ou dépôts de paquets privés appartenant aux responsables de maintenance, au lieu d’ajouter à `source=url` un contournement du réseau privé au niveau des entrées
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact du paquet de publication préparé, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance conserve la migration, la mise à jour, la mise à niveau d’un VPS géré à la racine, le redémarrage après mise à jour avec authentification configurée, l’installation en direct de Skills ClawHub, le nettoyage des dépendances obsolètes de plugins, les fixtures de plugins hors ligne, la mise à jour des plugins, le renforcement contre l’échappement des liaisons de commandes de plugins et l’AQ du paquet Telegram sur la même archive tar résolue. Les contrôles de publication bloquants utilisent par défaut le dernier paquet publié comme référence ; le profil bêta avec `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` étend la vérification des versions publiées survivant à la mise à niveau à `last-stable-4`, ainsi qu’aux références épinglées `2026.4.23`, `2026.5.2` et `2026.4.15`, avec les scénarios `reported-issues`. Utilisez Package Acceptance avec `source=npm` pour un candidat déjà publié, `source=ref` pour une archive tar npm locale fondée sur un SHA avant publication, `source=trusted-url` pour un miroir d’entreprise/privé appartenant aux responsables de maintenance ou `source=artifact` pour une archive tar préparée et téléversée par une autre exécution GitHub Actions.

Il s’agit du remplacement natif GitHub de la majeure partie de la couverture des paquets/mises à jour qui nécessitait auparavant Parallels. Les contrôles de publication multi-OS restent importants pour l’intégration initiale, le programme d’installation et les comportements propres aux systèmes d’exploitation, mais la validation produit des paquets/mises à jour doit privilégier Package Acceptance.

La liste de contrôle canonique pour la validation des mises à jour et des plugins est [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour déterminer quel scénario local, Docker, Package Acceptance ou de contrôle de publication prouve une installation/mise à jour de Plugin, un nettoyage par doctor ou une modification de migration d’un paquet publié. La migration exhaustive des mises à jour publiées depuis chaque paquet stable `2026.4.23+` constitue un workflow manuel `Update Migration` distinct et ne fait pas partie de la CI de publication complète.

La tolérance de l’ancienne validation des paquets est intentionnellement limitée dans le temps. Les paquets jusqu’à `2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées privées de l’inventaire d’AQ absentes de l’archive tar, `gateway install --wrapper` manquant, fichiers de correctifs absents de la fixture Git dérivée de l’archive tar, `update.channel` persisté manquant, anciens emplacements des enregistrements d’installation des plugins, persistance manquante des enregistrements d’installation de la place de marché et migration des métadonnées de configuration pendant `plugins update`. Le paquet `2026.4.26` publié peut émettre un avertissement pour les fichiers d’horodatage des métadonnées de compilation locale déjà livrés. Les paquets ultérieurs doivent respecter les contrats modernes des paquets ; ces mêmes lacunes font échouer la validation de la publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication concerne un véritable paquet installable :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profils de paquets courants :

- `smoke` : parcours rapides d’installation de paquet/canal/agent, de réseau du Gateway et de rechargement de la configuration
- `package` : contrats d’installation/mise à jour/redémarrage/paquet de Plugin, ainsi que preuve en direct de l’installation d’une Skill ClawHub ; il s’agit de la valeur par défaut des vérifications de version
- `product` : `package` plus les canaux MCP, le nettoyage des tâches Cron/sous-agents, la recherche Web OpenAI et OpenWebUI
- `full` : segments du parcours de publication Docker avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour les réexécutions ciblées

Pour la preuve Telegram du paquet candidat, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tar `package-under-test` résolue au parcours Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les vérifications après publication.

## Automatisation de la publication régulière des versions

Pour la publication de la bêta, de `latest`, des plugins, de la GitHub Release et des plateformes,
`OpenClaw Release Publish` est le point d’entrée normal qui effectue les modifications. Le parcours mensuel
`.33+` étendu stable, limité à npm, n’utilise pas cet orchestrateur. Le
workflow régulier orchestre les workflows d’éditeur de confiance dans l’ordre requis
par la version :

1. Extraire le tag de version et résoudre le SHA de son commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*` (ou depuis une branche alpha Tideclaw pour les préversions alpha).
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de version, le dist-tag npm et la valeur `preflight_run_id` enregistrée, après avoir vérifié la valeur `full_release_validation_run_id` enregistrée et la tentative d’exécution exacte.
7. Pour les versions stables, créer ou mettre à jour la version GitHub en tant que brouillon, déclencher `Windows Node Release` avec la valeur `windows_node_tag` explicite et la valeur `windows_node_installer_digests` approuvée pour le candidat, puis vérifier les ressources canoniques du programme d’installation Windows et de sa somme de contrôle. Déclencher également `Android Release` pour générer l’APK signé correspondant exactement au tag, avec sa somme de contrôle et sa provenance. Vérifier les deux contrats de ressources natives avant de publier le brouillon.

Exemple de publication bêta :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Publication stable vers le dist-tag bêta par défaut :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

La promotion stable directement vers `latest` est explicite :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Utilisez les workflows de plus bas niveau `Plugin NPM Release` et `Plugin ClawHub Release` uniquement pour des réparations ou republications ciblées. `OpenClaw Release Publish` rejette `plugin_publish_scope=selected` lorsque `publish_openclaw_npm=true`, afin que le paquet principal ne puisse pas être publié sans chaque plugin officiel publiable, notamment `@openclaw/diffs-language-pack`. Pour réparer un plugin sélectionné, définissez `publish_openclaw_npm=false` avec `plugin_publish_scope=selected` et `plugins=@openclaw/name`, ou déclenchez directement le workflow enfant.

L’amorçage ClawHub lors de la première publication constitue l’exception : déclenchez `Plugin ClawHub New`
depuis la branche `main` de confiance et transmettez le SHA complet de la version cible au moyen de `ref`.
N’exécutez jamais le workflow d’amorçage lui-même depuis le tag ou la branche de version :

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validation préalable au tag exige `dry_run=true`, rejette les entrées de tag de version
et d’exécution parente, et n’accepte qu’une cible exacte accessible depuis `main` ou `release/*`.
Elle ne charge pas les identifiants ClawHub, ne publie pas les octets du paquet et ne modifie pas la
configuration de l’éditeur de confiance. Le workflow résout néanmoins le plan actif du registre,
extrait et empaquette la cible uniquement dans une tâche sans secrets, matérialise la
chaîne d’outils ClawHub verrouillée, puis valide l’artefact immuable ainsi que le
slug et l’identité du paquet avant que le tag de version n’existe. N’approuvez l’environnement
`clawhub-plugin-bootstrap` qu’après la fin des tâches d’empaquetage sans secrets ;
cette tâche de validation protégée ne dispose d’aucun identifiant ni d’aucune commande de modification.

Une simulation approuvée ou un véritable amorçage après l’ajout du tag doit inclure le tag de
version exact, ainsi que l’identifiant d’exécution, la tentative et la branche de l’exécution parente
`OpenClaw Release Publish`. Le parent atteste le SHA de son propre workflow et un SHA de confiance exact
`main` distinct pour `Plugin ClawHub New` ; l’exécution enfant et chaque approbation
d’environnement protégé doivent correspondre à ce SHA enfant approuvé. Le tag de version est
revérifié avant chaque tentative de publication et chaque modification de l’éditeur de confiance.

La tâche d’empaquetage
téléverse un artefact immuable unique dont le nom, l’identifiant et le condensat d’artefact Actions,
l’exécution et la tentative de production, le SHA cible, ainsi que le SHA-256 et la taille de l’archive
tar de chaque paquet sont transmis aux tâches de validation et aux tâches protégées. La tâche protégée
extrait uniquement les outils `main` de confiance, valide le tuple de l’artefact via
l’API GitHub, le télécharge au moyen de son identifiant exact, recalcule le hachage de chaque archive
tar et valide les chemins TAR locaux ainsi que l’identité du paquet selon les règles de canonicalisation
USTAR de la CLI épinglée. Chaque candidat passe ensuite la simulation de publication de la CLI épinglée,
qui revient avant toute consultation du registre ou authentification. Le préfiltre de la tâche disposant
des identifiants limite les ClawPacks compressés à 120 MiB, la charge utile totale des fichiers à 50 MiB,
les données TAR décompressées à 64 MiB et le nombre d’entrées TAR à 10,000. La réparation de l’éditeur
de confiance d’un paquet existant reste limitée à la configuration, mais elle empaquette toujours la cible
et exige que le tag demandé, les octets exacts du registre et les métadonnées soient identiques avant de
modifier la configuration de l’éditeur de confiance. La vérification après publication télécharge l’artefact
ClawHub et exige le même SHA-256 et la même taille. Une récupération par réexécution des tâches ayant échoué
ne peut réutiliser l’artefact de paquet d’une tentative antérieure que si la tâche de production exacte s’est
terminée avec succès. Les preuves finales associent également la version ClawHub verrouillée, le SHA-256 du
verrou et l’intégrité npm. Toute divergence exige une nouvelle version du paquet.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de version requis, tel que `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1` ; lorsque `preflight_only=true`, il peut également s’agir du SHA de commit complet à 40 caractères de la branche actuelle du workflow pour une validation préalable uniquement
- `preflight_only` : `true` pour la validation/génération/création de paquet uniquement, `false` pour le véritable parcours de publication
- `preflight_run_id` : identifiant d’une exécution préalable existante réussie, requis pour le véritable parcours de publication afin que le workflow réutilise l’archive tar préparée au lieu de la reconstruire
- `full_release_validation_run_id` : identifiant d’une exécution `Full Release Validation` réussie pour ce tag/SHA, requis pour une véritable publication. Les publications bêta peuvent se poursuivre uniquement avec la validation préalable en affichant un avertissement, mais la promotion stable/`latest` l’exige toujours.
- `full_release_validation_run_attempt` : tentative d’exécution positive exacte associée à `full_release_validation_run_id` ; requise chaque fois que l’identifiant d’exécution est fourni afin que les réexécutions ne puissent pas modifier les preuves d’autorisation pendant la publication.
- `release_publish_run_id` : identifiant d’exécution `OpenClaw Release Publish` approuvé ; requis lorsque ce workflow est déclenché par ce parent (appels de véritable publication effectués par un acteur bot)
- `plugin_npm_run_id` : identifiant d’une exécution `Plugin NPM Release` réussie correspondant exactement à la révision de tête ; requis pour une véritable publication du paquet principal `extended-stable`
- `npm_dist_tag` : tag cible npm du parcours de publication ; accepte `alpha`, `beta`, `latest` ou `extended-stable` et utilise `beta` par défaut. Le correctif final `33` et les suivants doivent utiliser `extended-stable` ; par défaut, `extended-stable` rejette les correctifs antérieurs et rejette toujours les tags non finaux.
- `bypass_extended_stable_guard` : booléen réservé aux tests, `false` par défaut ; avec `npm_dist_tag=extended-stable`, contourne l’éligibilité mensuelle au parcours stable étendu tout en préservant les vérifications d’identité de version, d’artefact, d’approbation et de relecture.

`Plugin NPM Release` accepte `npm_dist_tag=default` pour le comportement de version
existant ou `npm_dist_tag=extended-stable` pour le parcours mensuel protégé. L’option
stable étendue exige `publish_scope=all-publishable`, une entrée `plugins`
vide, un correctif final égal ou supérieur à `33`, ainsi que la branche
canonique `extended-stable/YYYY.M.33` à son extrémité exacte. Elle ne déplace jamais les
valeurs `latest` ou `beta` des plugins. Les nouvelles versions de paquets
reçoivent `extended-stable` de manière atomique par publication OIDC de confiance
(`npm publish --tag extended-stable`) ; ce workflow source n’utilise pas `npm dist-tag add`
authentifié par jeton. Les nouvelles tentatives ignorent les versions exactes déjà
présentes dans npm, puis échouent de manière fermée sauf si une relecture complète
confirme que chaque paquet exact et le tag `extended-stable` ont convergé.

`OpenClaw Release Publish` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de version requis ; doit déjà exister
- `preflight_run_id` : identifiant d’une exécution préalable `OpenClaw NPM Release` réussie ; requis lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id` : identifiant d’une exécution `Full Release Validation` réussie ; requis lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt` : tentative positive exacte associée à `full_release_validation_run_id` ; requise chaque fois que l’identifiant d’exécution est fourni
- `windows_node_tag` : tag de version `openclaw/openclaw-windows-node` exact ne correspondant pas à une préversion ; requis pour la publication stable d’OpenClaw
- `windows_node_installer_digests` : mappage JSON compact, approuvé pour le candidat, des noms actuels des programmes d’installation Windows vers leurs condensats `sha256:` épinglés ; requis pour la publication stable d’OpenClaw
- `npm_telegram_run_id` : identifiant facultatif d’une exécution `NPM Telegram Beta E2E` réussie à inclure dans les preuves finales de la version
- `npm_dist_tag` : tag cible npm du paquet OpenClaw, parmi `alpha`, `beta` ou `latest`
- `plugin_publish_scope` : utilise `all-publishable` par défaut ; utilisez `selected` uniquement pour des réparations ciblées concernant exclusivement les plugins avec `publish_openclaw_npm=false`
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque `plugin_publish_scope=selected`
- `publish_openclaw_npm` : utilise `true` par défaut ; définissez `false` uniquement lorsque le workflow sert d’orchestrateur de réparation concernant exclusivement les plugins
- `release_profile` : profil de couverture de version utilisé pour les résumés des preuves de publication ; utilise `from-validation` par défaut, qui le lit dans le manifeste de validation, ou remplacez-le par `beta`, `stable` ou `full`
- `wait_for_clawhub` : utilise `false` par défaut afin que la disponibilité npm ne soit pas bloquée par le processus auxiliaire ClawHub ; définissez `true` uniquement lorsque l’achèvement du workflow doit inclure celui de ClawHub

`OpenClaw Release Checks` accepte les entrées contrôlées par l’opérateur suivantes :

- `ref` : branche, tag ou SHA complet du commit à valider. Les vérifications nécessitant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un tag de version.
- `run_release_soak` : active les tests exhaustifs en conditions réelles/E2E, le parcours de publication Docker et le test d’endurance de toutes les versions survivantes aux mises à niveau pour les vérifications des versions bêta. Cette option est activée de force par `release_profile=stable` et `release_profile=full`.

Règles :

- Les versions finales standard et les versions correctives inférieures au correctif `33` peuvent être publiées vers `beta` ou `latest`. Les versions finales au correctif `33` ou supérieur doivent être publiées vers `extended-stable`, et les versions comportant un suffixe correctif à cette limite sont rejetées.
- Les tags de préversion bêta peuvent être publiés uniquement vers `beta` ; les tags de préversion alpha peuvent être publiés uniquement vers `alpha`
- Pour `OpenClaw NPM Release`, la saisie du SHA complet du commit est autorisée uniquement lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` servent toujours uniquement à la validation
- Le véritable parcours de publication doit utiliser le même `npm_dist_tag` que celui utilisé lors de la vérification préalable ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence standard de publication bêta/stable la plus récente

Cette ancienne séquence concerne la publication orchestrée standard, qui gère également les plugins, la GitHub Release, Windows et les autres plateformes. Il ne s’agit pas du parcours mensuel étendu stable `.33+`, limité à npm et documenté en haut de cette page.

Lors de la préparation d’une publication stable orchestrée standard :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant la création d’un tag, vous pouvez utiliser le SHA du commit actuel complet de la branche du workflow pour une exécution à blanc du workflow de vérification préalable, destinée uniquement à la validation.
2. Choisissez `npm_dist_tag=beta` pour le parcours normal commençant par une bêta, ou `latest` uniquement si vous souhaitez délibérément publier directement une version stable.
3. Exécutez `Full Release Validation` sur la branche de publication, le tag de version ou le SHA complet du commit lorsque vous souhaitez regrouper dans un workflow manuel la CI normale ainsi que la couverture du cache des prompts en conditions réelles, de Docker, de QA Lab, de Matrix et de Telegram. Si vous n’avez délibérément besoin que du graphe déterministe des tests normaux, exécutez plutôt le workflow manuel `CI` sur la référence de publication.
4. Sélectionnez précisément le tag de version `openclaw/openclaw-windows-node`, hors préversion, dont les programmes d’installation signés x64 et ARM64 doivent être distribués. Enregistrez-le sous `windows_node_tag`, puis enregistrez leur table de condensats validée sous `windows_node_installer_digests`. L’outil de préparation de la version candidate enregistre les deux et les inclut dans la commande de publication qu’il génère.
5. Enregistrez les valeurs validées de `preflight_run_id`, `full_release_validation_run_id` et la valeur exacte de `full_release_validation_run_attempt`.
6. Exécutez `OpenClaw Release Publish` depuis la référence de confiance `main`, avec le même `tag`, le même `npm_dist_tag`, la valeur sélectionnée de `windows_node_tag`, la valeur enregistrée de `windows_node_installer_digests` qui lui correspond, ainsi que les valeurs enregistrées de `preflight_run_id`, `full_release_validation_run_id` et `full_release_validation_run_attempt`. Cette opération publie les plugins externalisés sur npm et ClawHub avant de promouvoir le paquet npm OpenClaw.
7. Si la publication a été effectuée sur `beta`, utilisez le workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`.
8. Si la version a été délibérément publiée directement vers `latest` et que `beta` doit immédiatement désigner la même version stable, utilisez ce même workflow de publication pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée d’autoréparation déplacer `beta` ultérieurement.

La modification des dist-tags se trouve dans le dépôt du registre des publications, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt source conserve une publication reposant uniquement sur OIDC. Ainsi, le parcours de publication directe et celui de promotion commençant par une bêta restent tous deux documentés et visibles par les opérateurs.

Si une personne chargée de la maintenance doit revenir à une authentification npm locale, exécutez toutes les commandes de la CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas directement `op` depuis le shell principal de l’agent ; son exécution dans tmux rend les invites, les alertes et la gestion des OTP observables, et évite les alertes répétées de l’hôte.

## Références publiques

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les personnes chargées de la maintenance utilisent la documentation privée de publication dans [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) comme procédure opérationnelle réelle.

## Contenu connexe

- [Canaux de publication](/fr/install/development-channels)

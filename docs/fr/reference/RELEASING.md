---
read_when:
    - Recherche des définitions publiques des canaux de publication
    - Exécution de la validation de la version ou de l’acceptation du paquet
    - À la recherche des conventions de nommage des versions et de leur cadence
summary: Canaux de publication, liste de contrôle de l’opérateur, environnements de validation, dénomination des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-07-12T15:45:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expose actuellement trois canaux de mise à jour destinés aux utilisateurs :

- stable : le canal de publication promu existant, qui continue d’être résolu via npm `latest` jusqu’à la mise en place de l’étape distincte pour la CLI et les canaux
- beta : les balises de préversion publiées sur npm `beta`
- dev : la tête mobile de `main`

Séparément, les opérateurs de publication peuvent publier le paquet principal du dernier mois
achevé sur npm `extended-stable`, à partir du correctif `33`. La ligne finale
standard du mois en cours reste sur npm `latest` ; cette séparation des publications
du côté des opérateurs ne modifie pas à elle seule la résolution des canaux de mise à jour de la CLI.

Les builds alpha Tideclaw constituent une piste de préversion interne distincte (dist-tag npm `alpha`), décrite dans [Entrées du workflow NPM](#npm-workflow-inputs) et [Boîtes de test de publication](#release-test-boxes).

## Nommage des versions

- Version mensuelle étendue stable sur npm : `YYYY.M.PATCH`, avec `PATCH >= 33`, balise git `vYYYY.M.PATCH`
- Version finale quotidienne/standard : `YYYY.M.PATCH`, avec `PATCH < 33`, balise git `vYYYY.M.PATCH`
- Version corrective standard de repli : `YYYY.M.PATCH-N`, balise git `vYYYY.M.PATCH-N`
- Version de préversion bêta : `YYYY.M.PATCH-beta.N`, balise git `vYYYY.M.PATCH-beta.N`
- Version de préversion alpha : `YYYY.M.PATCH-alpha.N`, balise git `vYYYY.M.PATCH-alpha.N`
- Ne jamais compléter le mois ou le correctif avec des zéros
- `PATCH` est un numéro séquentiel du train de publication mensuel, et non un jour calendaire. Les versions finales standard et bêta font avancer le train actuel ; les balises exclusivement alpha ne consomment ni ne font avancer le numéro de correctif bêta/standard. Ignorez donc les anciennes balises exclusivement alpha dont les numéros de correctif sont plus élevés lors de la sélection d’un train bêta ou standard.
- Les builds alpha/nocturnes utilisent le prochain train de correctif non publié et incrémentent uniquement `alpha.N` pour les builds répétés. Dès que ce correctif possède une bêta, les nouveaux builds alpha passent au correctif suivant.
- Les versions npm sont immuables : ne supprimez, ne republiez et ne réutilisez jamais une balise publiée. Créez plutôt le numéro de préversion suivant ou le correctif mensuel suivant.
- `latest` continue de suivre la ligne npm standard/quotidienne actuelle ; `beta` est la cible d’installation bêta actuelle
- `extended-stable` désigne le paquet npm pris en charge du mois précédent, à partir du correctif `33` ; les correctifs `34` et ultérieurs sont des versions de maintenance de cette ligne mensuelle
- Les versions finales standard et correctives standard sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest` ou promouvoir ultérieurement un build bêta validé
- Le processus mensuel dédié étendu stable publie le paquet npm principal et chaque plugin officiel publiable sur npm avec exactement la même version. Il ne publie pas les plugins sur ClawHub, ni les artefacts macOS ou Windows, ni une publication GitHub, ni les dist-tags de dépôts privés, ni les images Docker, ni les artefacts mobiles, ni les téléchargements du site web.
- Chaque version finale standard distribue simultanément le paquet npm, l’application macOS, l’APK Android autonome signé et les programmes d’installation signés de Windows Hub. Les versions bêta valident et publient normalement d’abord le chemin npm/paquet, tandis que la compilation, la signature, la notarisation et la promotion des applications natives sont réservées aux versions finales standard, sauf demande explicite.

## Cadence de publication

- Les publications passent d’abord par la bêta ; la version stable ne suit qu’après validation de la dernière bêta
- Les responsables créent normalement les publications depuis une branche `release/YYYY.M.PATCH` issue de la version actuelle de `main`, afin que la validation et les correctifs de publication ne bloquent pas les nouveaux développements sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les responsables créent la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne
- La procédure détaillée de publication ainsi que les approbations, les identifiants et les notes de récupération sont réservés aux responsables

## Publication mensuelle étendue stable uniquement sur npm

Il s’agit d’une exception dédiée à la procédure de publication standard ci-dessous. Pour un
mois achevé `YYYY.M`, créez `extended-stable/YYYY.M.33` ; publiez
`vYYYY.M.33` et les correctifs de maintenance ultérieurs depuis cette même branche. La
balise de publication, la tête de branche, le checkout, la version du paquet, le contrôle préalable npm et l’exécution de la Validation complète de publication
doivent tous désigner le même commit. La branche protégée `main` doit
déjà contenir une version finale d’un mois calendaire strictement ultérieur avec un correctif
inférieur à `33` ; les correctifs de maintenance restent admissibles après que `main` a avancé de plus d’un
mois.

Sur la branche étendue stable exacte, passez le paquet racine à `YYYY.M.P`, exécutez
`pnpm release:prep` et vérifiez que chaque paquet d’extension publiable possède la
même version. Commitez et poussez toutes les modifications générées, créez et poussez la
balise immuable `vYYYY.M.P` sur ce commit, puis consignez le SHA complet obtenu.
Les workflows consomment cet arbre préparé ; ils n’incrémentent ni ne synchronisent
les versions à votre place.

Exécutez le contrôle préalable npm et la Validation complète de publication depuis la tête exacte de cette branche
préparée, puis enregistrez les deux identifiants d’exécution et la tentative réussie de la Validation complète de publication :

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

`release_profile=stable` est le profil existant de profondeur de validation ; il est
distinct du dist-tag npm `extended-stable` et reste intentionnellement
inchangé.

Après la réussite des deux exécutions, publiez chaque plugin officiel publiable sur npm depuis la
même tête de branche exacte. Le correctif `P` doit être égal ou supérieur à `33`. Transmettez le SHA complet de publication
comme `ref`, attendez la fin de la matrice complète et de la relecture du registre, puis enregistrez
l’identifiant de l’exécution réussie de la Publication NPM des plugins :

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Le workflow utilise l’inventaire standard préparé des paquets `all-publishable`,
y compris les paquets dont la source n’a pas changé. Il vérifie chaque paquet exact
et chaque balise de plugin `extended-stable` avant de réussir. Si une exécution partielle
échoue, réexécutez la même commande : les paquets déjà publiés sont réutilisés, les
balises de plugins manquantes ou obsolètes sont réconciliées dans l’environnement de publication npm, et la
relecture finale couvre toujours l’ensemble complet des paquets.

Après la réussite du workflow des plugins et lorsque l’environnement de publication npm est prêt,
publiez l’archive tar principale exacte issue du contrôle préalable. La publication principale vérifie que
l’exécution de plugin référencée est `completed/success` sur la même branche canonique et
le même SHA source exact :

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

Pour une répétition sur un fork ou hors production qui ne peut intentionnellement pas satisfaire la
politique mensuelle `.33` ou la politique de mois de la branche protégée `main`, ajoutez
`-f bypass_extended_stable_guard=true` aux déclenchements du contrôle préalable et de la publication
npm. La valeur par défaut est `false`. Le contournement n’est accepté qu’avec
`npm_dist_tag=extended-stable` et est consigné dans le résumé du workflow. Il
ne contourne pas la référence canonique de workflow `extended-stable/YYYY.M.33`,
l’égalité entre la tête de branche, la balise et le checkout, la syntaxe de la balise finale, l’égalité entre les versions
du paquet et de la balise, l’identité de l’exécution référencée et du manifeste, la provenance de l’archive tar,
l’approbation de l’environnement, la relecture du registre ni les preuves de réparation du sélecteur.

Le workflow de publication vérifie l’identité des exécutions référencées du contrôle préalable, de la validation et des plugins,
le condensat de l’archive tar préparée et les sélecteurs du registre principal.
Confirmez indépendamment le résultat après la réussite du workflow :

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Les deux commandes doivent renvoyer `YYYY.M.P`. Si la publication réussit mais que la relecture
du sélecteur échoue, ne republiez pas la version immuable du paquet. Utilisez l’unique
commande de réparation `npm dist-tag add openclaw@YYYY.M.P extended-stable`
affichée dans le résumé toujours exécuté du workflow ayant échoué, puis répétez les deux
relectures indépendantes. Le retour au sélecteur précédent constitue une décision distincte de l’opérateur,
et non le processus de réparation de la relecture.

La documentation publique d’assistance désigne initialement Slack, Discord et Codex comme
surfaces de plugins étendues stables couvertes. Cette liste constitue une déclaration de prise en charge, et non
une liste d’autorisation du code de publication : chaque plugin officiel publiable sur npm suit le
même processus de publication à version exacte.

La liste de contrôle standard ci-dessous continue de régir la bêta, `latest`, la publication GitHub,
les plugins, macOS, Windows et la publication sur les autres plateformes. N’exécutez pas ces
étapes pour ce processus étendu stable uniquement sur npm.

## Liste de contrôle des opérateurs de publication standard

Cette liste de contrôle présente la forme publique du processus de publication. Les identifiants privés, la signature, la notarisation, la récupération des dist-tags et les détails des retours en arrière d’urgence restent dans le guide de publication réservé aux responsables.

1. Partez de la branche `main` actuelle : récupérez les dernières modifications, confirmez que le commit cible est poussé et que la CI de `main` est suffisamment au vert pour créer une branche à partir de celle-ci.
2. Générez la section supérieure de `CHANGELOG.md` à partir des PR fusionnées et de tous les commits directs depuis le dernier tag de version accessible. Rédigez les entrées à l’intention des utilisateurs, dédupliquez les entrées redondantes issues des PR et des commits directs, créez un commit, poussez-le, puis effectuez une nouvelle fois un rebasage ou une récupération avant de créer la branche. Lorsqu’un tag publié divergent ou qu’un portage ultérieur réassocie des PR déjà publiées, transmettez explicitement ce tag avec `--shipped-ref` ; l’outil de vérification utilise les lignes de PR explicites provenant des enregistrements complets de contributions dans les sections numérotées de l’instantané du tag, ignore `Unreleased` et consigne l’inventaire exact ainsi que le nombre de PR exclues.
3. Examinez les enregistrements de compatibilité des versions dans `src/plugins/compat/registry.ts` et `src/commands/doctor/shared/deprecation-compat.ts`. Ne supprimez les éléments de compatibilité expirés que si le chemin de mise à niveau reste couvert, ou consignez la raison pour laquelle ils sont intentionnellement conservés.
4. Créez `release/YYYY.M.PATCH` à partir de la branche `main` actuelle. N’effectuez pas les tâches normales de publication directement sur `main`.
5. Mettez à jour chaque emplacement de version requis pour le tag, puis exécutez `pnpm release:prep`. Cette commande actualise, dans l’ordre, les versions des plugins, les fichiers shrinkwrap npm, l’inventaire des plugins, le schéma de configuration de base, les métadonnées de configuration des canaux intégrés, la référence de base de la documentation de configuration, les exportations du SDK de plugins et la référence de base de l’API du SDK de plugins. Créez un commit pour toute dérive générée avant de créer le tag, puis exécutez la vérification préalable locale déterministe : `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` et `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag n’existe, un SHA complet de 40 caractères de la branche de publication est autorisé uniquement pour la vérification préalable. Celle-ci génère les preuves de publication des dépendances pour le graphe exact des dépendances extrait et les stocke dans l’artefact de vérification préalable npm. Enregistrez le `preflight_run_id` de l’exécution réussie.
7. Lancez tous les tests préalables à la publication avec `Full Release Validation` pour la branche de publication, le tag ou le SHA complet du commit. Il s’agit du point d’entrée manuel unique pour les quatre grands ensembles de tests de publication : Vitest, Docker, QA Lab et Package. Enregistrez le `full_release_validation_run_id` et la valeur exacte de `full_release_validation_run_attempt` ; les deux sont des paramètres obligatoires pour `OpenClaw NPM Release` et `OpenClaw Release Publish`.
8. Si la validation échoue, apportez le correctif sur la branche de publication et réexécutez le plus petit fichier, couloir, job de workflow, profil de paquet, fournisseur ou liste d’autorisation de modèles en échec permettant de prouver le correctif. Ne réexécutez l’ensemble complet que lorsque la surface modifiée rend les preuves antérieures obsolètes.
9. Pour une version bêta candidate étiquetée, exécutez `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` depuis la branche `release/YYYY.M.PATCH` correspondante. Pour une version stable, transmettez également la version source Windows requise : `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. L’assistant utilise la branche `main` de confiance comme source du workflow, tandis que chaque workflow cible le tag exact. Il enregistre l’identité immuable du candidat et de l’outillage, ainsi que les identifiants des exécutions lancées, dans `.artifacts/release-candidate/<tag>/release-candidate-state.json` ; la réexécution de la même commande reprend exactement ces exécutions, tandis que toute divergence concernant le candidat, l’outillage, le profil ou les options provoque un échec sécurisé. Avant de lancer la matrice complète de validation, l’assistant génère de façon déterministe le corps exact de la version GitHub du tag et rejette l’absence d’un titre de version, un corps dépassant la limite qui ne peut pas utiliser la forme compacte canonique, ou une provenance de base et de cible des enregistrements de contributions qui n’est pas accessible depuis le tag. Il valide également toute métadonnée explicite d’exclusion de la référence de base publiée par rapport aux enregistrements cumulatifs des tags référencés. Il exécute ensuite les vérifications locales des éléments de publication générés, lance ou vérifie les preuves de validation complète de la publication et de vérification préalable npm, exécute les preuves Parallels d’installation initiale et de mise à jour sur l’archive tar préparée exacte ainsi que la preuve du paquet Telegram, enregistre les plans npm et ClawHub des plugins, puis affiche la commande `OpenClaw Release Publish` exacte uniquement lorsque l’ensemble des preuves est au vert.

   `OpenClaw Release Publish` distribue en parallèle vers npm les packages de Plugin sélectionnés ou tous ceux qui sont publiables, ainsi que le même ensemble vers ClawHub, puis promeut l’artefact de contrôle préalable npm OpenClaw préparé avec le dist-tag correspondant une fois la publication npm des Plugins réussie. Le checkout de la version reste la racine du produit et des données, tandis que la planification et la vérification finale s’exécutent depuis le checkout exact et fiable de la source du workflow, afin qu’un commit de version plus ancien ne puisse pas utiliser silencieusement un outillage de publication obsolète. Avant le démarrage de tout processus enfant de publication, il génère et met en cache le corps exact de la version GitHub. Lorsque la section complète correspondante `CHANGELOG.md` respecte la limite de 125 000 caractères de GitHub et le plafond de sécurité correspondant de 125 000 octets du moteur de rendu, la page contient cette section `## YYYY.M.PATCH` exacte, titre compris. Lorsque la section source dépasse ces limites, la page conserve les notes éditoriales regroupées exactes et remplace le relevé de contributions surdimensionné par un lien stable vers le relevé complet dans le fichier `CHANGELOG.md` épinglé au tag ; les relevés partiels et les puces tronquées ne sont jamais publiés. Le workflow choisit ce corps complet ou compact avant d’ajouter `### Release verification` ; si la section finale des preuves devait dépasser la limite, il conserve le corps canonique et s’appuie à la place sur les preuves immuables jointes. Les versions stables publiées sur npm `latest` deviennent la dernière version GitHub, tandis que les versions stables de maintenance conservées sur npm `beta` sont créées avec l’option GitHub `latest=false`. Le workflow téléverse également dans la version GitHub les preuves de dépendances du contrôle préalable, le manifeste de validation complète et les preuves de vérification du registre après publication, afin de faciliter la gestion des incidents après publication. Il affiche immédiatement les identifiants des exécutions enfants, approuve automatiquement les contrôles des environnements de publication que le jeton du workflow est autorisé à approuver, résume les tâches enfants ayant échoué avec la fin de leurs journaux, crée dès le départ la page de brouillon de la version GitHub et promeut les ressources Windows et Android en parallèle de la publication npm d’OpenClaw, finalise la page de version et les preuves de dépendances une fois ces étapes réussies, attend ClawHub chaque fois qu’OpenClaw est publié sur npm, puis exécute le vérificateur bêta de la branche principale fiable et téléverse les preuves après publication pour la version GitHub, le package npm, les packages npm de Plugin sélectionnés, les packages ClawHub sélectionnés, les identifiants des exécutions de workflows enfants et l’identifiant facultatif de l’exécution NPM Telegram. Le vérificateur d’amorçage de ClawHub exige le chemin et le SHA exacts du workflow de la branche principale fiable, les tentatives d’exécution de production et finale, le SHA de la version, l’ensemble de packages demandé, le tuple immuable de l’artefact du package et l’artefact final de relecture du registre ; une exécution réussie fondée sur une ancienne référence de version n’est pas acceptée.

   Exécutez ensuite la validation du paquet après publication sur le paquet publié `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta`. Si une préversion poussée ou publiée nécessite une correction, créez le numéro de préversion correspondant suivant ; ne supprimez ni ne réécrivez jamais l’ancienne.

10. Pour la version stable, ne poursuivez qu’une fois que la version bêta ou la version candidate validée dispose des preuves de validation requises. La publication npm stable passe également par `OpenClaw Release Publish`, en réutilisant l’artefact de vérification préalable réussi au moyen de `preflight_run_id`. La préparation de la publication macOS stable nécessite également que les fichiers `.zip`, `.dmg`, `.dSYM.zip` empaquetés et le fichier `appcast.xml` mis à jour soient présents sur `main` ; le workflow de publication macOS publie automatiquement l’appcast signé sur la branche publique `main` après vérification des artefacts de la version, ou ouvre/met à jour une PR d’appcast si la protection de branche bloque le push direct. La préparation du Hub Windows stable nécessite que les artefacts signés `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` et `OpenClawCompanion-SHA256SUMS.txt` soient présents dans la version GitHub d’OpenClaw. Transmettez le tag exact de la version signée `openclaw/openclaw-windows-node` comme `windows_node_tag` et sa table de correspondance des condensats d’installateurs approuvée pour la version candidate comme `windows_node_installer_digests` ; `OpenClaw Release Publish` conserve le brouillon de la version, déclenche `Windows Node Release` et vérifie les trois artefacts avant la publication.
11. Après la publication, exécutez le vérificateur npm après publication, le test E2E Telegram autonome facultatif sur le paquet npm publié lorsque vous avez besoin d’une preuve du canal après publication, la promotion du dist-tag si nécessaire, vérifiez la page de version GitHub générée, exécutez les étapes d’annonce de la version, puis terminez la [clôture de la branche principale pour la version stable](#stable-main-closeout) avant de considérer une version stable comme terminée.

## Clôture de la branche principale pour la version stable

La publication stable n’est pas terminée tant que `main` ne contient pas l’état réel de la version publiée.

1. Partez de la toute dernière version de `main`. Auditez `release/YYYY.M.PATCH` par rapport à celle-ci et reportez dans `main` les correctifs réels qui en sont absents. Ne fusionnez pas aveuglément dans une version plus récente de `main` les adaptateurs de compatibilité, de test ou de validation propres à la branche de publication.
2. Définissez `main` sur la version stable publiée, et non sur une hypothétique prochaine série de versions. Exécutez `pnpm release:prep` après la modification de la version racine, puis `pnpm deps:shrinkwrap:generate`.
3. Faites en sorte que la section `## YYYY.M.PATCH` de `CHANGELOG.md` sur `main` corresponde exactement à celle de la branche de publication étiquetée. Incluez la mise à jour stable de `appcast.xml` si la version mac en a publié une.
4. N’ajoutez pas `YYYY.M.PATCH+1`, une version bêta ou une section de journal des modifications vide pour une future version dans `main` tant que l’opérateur n’a pas explicitement lancé cette série de versions.
5. Exécutez `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` et `OPENCLAW_TESTBOX=1 pnpm check:changed`. Poussez les modifications, puis vérifiez que `origin/main` contient la version publiée et le journal des modifications avant de déclarer la publication stable terminée.
6. Maintenez à jour les variables de dépôt `RELEASE_ROLLBACK_DRILL_ID` et `RELEASE_ROLLBACK_DRILL_DATE` après chaque exercice privé de restauration.

`OpenClaw Stable Main Closeout` démarre à partir de la poussée vers `main` qui contient la version publiée, le journal des modifications et l’appcast après la publication stable. Il consulte les preuves postpublication immuables afin d’associer l’étiquette publiée à ses exécutions de validation complète de la publication et de publication, puis vérifie l’état stable de la branche principale, la publication, la période d’observation stable obligatoire et les preuves de performances bloquantes. Il joint à la version GitHub un manifeste de clôture immuable et sa somme de contrôle. Le déclencheur automatique lors d’une poussée ignore les anciennes versions antérieures aux preuves postpublication immuables et ne considère jamais cette omission comme une clôture terminée.

Une clôture complète nécessite les deux ressources et une somme de contrôle correspondante. Un manifeste partiel réutilise le SHA de `main` et l’exercice de restauration qu’il a enregistrés afin de régénérer des octets identiques, puis joint la somme de contrôle manquante ; une paire non valide, ou une somme de contrôle sans manifeste, reste bloquante. Une exécution déclenchée par une poussée sans les variables de dépôt relatives à l’exercice de restauration est ignorée sans terminer la clôture ; l’absence d’un enregistrement d’exercice, ou un enregistrement datant de plus de 90 jours, continue de bloquer la clôture manuelle fondée sur des preuves. Les commandes privées de récupération restent dans le guide opérationnel réservé aux responsables de maintenance. N’utilisez le déclenchement manuel que pour réparer ou rejouer une clôture stable fondée sur des preuves.

Une étiquette corrective de secours pour une ancienne version peut réutiliser les preuves du paquet de base uniquement lorsque l’étiquette corrective correspond au même commit source que l’étiquette stable de base. Sa version Android réutilise l’APK vérifié de l’étiquette de base et ajoute la provenance de l’étiquette corrective. Une correction dont la source est différente doit publier et vérifier ses propres preuves de paquet et utiliser un `versionCode` Android supérieur.

## Vérifications préalables à la publication

- Exécutez `pnpm check:test-types` avant les vérifications préalables à la publication afin que le TypeScript des tests reste couvert en dehors de la vérification locale plus rapide `pnpm check`.
- Exécutez `pnpm check:architecture` avant les vérifications préalables à la publication afin que les contrôles plus étendus des cycles d’importation et des limites architecturales réussissent en dehors de la vérification locale plus rapide.
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le bundle de l’interface de contrôle existent pour l’étape de validation du paquet.
- Exécutez `pnpm release:prep` après l’incrémentation de la version racine et avant la création du tag. Cette commande exécute tous les générateurs déterministes de publication qui divergent fréquemment après une modification de version, de configuration ou d’API : versions des plugins, fichiers shrinkwrap npm, inventaire des plugins, schéma de configuration de base, métadonnées de configuration des canaux intégrés, référence de la documentation de configuration, exportations du SDK de plugin et référence de l’API du SDK de plugin. `pnpm release:check` réexécute ces contrôles en mode vérification (ainsi qu’un contrôle du budget de surface du SDK de plugin) et signale en une seule passe tous les échecs dus à des divergences générées avant d’exécuter les contrôles de publication des paquets.
- Par défaut, la synchronisation des versions des plugins met à jour le paquet d’exécution publiable `@openclaw/ai`, les versions des paquets de plugins officiels et les versions minimales `openclaw.compat.pluginApi` existantes vers la version de publication d’OpenClaw. Considérez ce champ comme la version minimale de l’API du SDK de plugin et de l’environnement d’exécution, et non comme une simple copie de la version du paquet : pour les publications limitées aux plugins qui restent intentionnellement compatibles avec d’anciens hôtes OpenClaw, conservez comme version minimale la plus ancienne API d’hôte prise en charge et documentez ce choix dans les preuves de publication du plugin.
- Exécutez manuellement le workflow `Full Release Validation` avant l’approbation de la publication afin de lancer tous les environnements de test préalables à la publication depuis un point d’entrée unique. Il accepte une branche, un tag ou un SHA de commit complet, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour les tests rapides d’installation, la validation des paquets, les contrôles de paquets sur plusieurs systèmes d’exploitation, la parité du laboratoire d’assurance qualité, ainsi que les parcours Matrix et Telegram. Les exécutions stables et complètes incluent toujours des tests live/E2E exhaustifs et des tests prolongés du parcours de publication Docker ; `run_release_soak=true` est conservé pour lancer explicitement un test prolongé de version bêta. La validation des paquets fournit le test E2E Telegram de référence pour les paquets lors de la validation des versions candidates, ce qui évite d’exécuter simultanément un second processus d’interrogation en conditions réelles.

  Fournissez `release_package_spec` après la publication d’une version bêta afin de réutiliser le paquet npm publié dans les contrôles de publication, la validation des paquets et le test E2E Telegram du paquet sans reconstruire l’archive tar de publication. Fournissez `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un paquet publié différent de celui employé par le reste de la validation de publication. Fournissez `package_acceptance_package_spec` lorsque la validation des paquets doit utiliser un paquet publié différent de celui défini par la spécification du paquet de publication. Fournissez `evidence_package_spec` lorsque le rapport de preuves de publication doit démontrer que la validation correspond à un paquet npm publié sans imposer le test E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Exécutez manuellement le workflow `Package Acceptance` lorsque vous souhaitez obtenir une preuve parallèle pour un paquet candidat pendant que le travail de publication se poursuit. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche, un tag ou un SHA `package_ref` fiable avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS publique avec un SHA-256 obligatoire et une politique stricte relative aux URL publiques ; `source=trusted-url` pour une politique de source fiable nommée utilisant un `trusted_source_id` et un SHA-256 obligatoires ; ou `source=artifact` pour une archive tar téléversée par une autre exécution de GitHub Actions.

  Le workflow résout le candidat en `package-under-test`, réutilise l’ordonnanceur de publication E2E Docker avec cette archive tar et peut exécuter l’assurance qualité Telegram avec la même archive tar en utilisant `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les parcours Docker sélectionnés incluent `published-upgrade-survivor`, l’artefact de paquet est le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée. `update-restart-auth` utilise le paquet candidat à la fois comme CLI installée et comme paquet testé afin d’exercer le parcours de redémarrage géré de la commande de mise à jour du candidat.

  Exemple :

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profils courants :
  - `smoke` : parcours d’installation/canal/agent, réseau du Gateway et rechargement de la configuration
  - `package` : parcours natifs des artefacts pour le paquet/la mise à jour/le redémarrage/les plugins, sans OpenWebUI ni ClawHub en direct
  - `product` : profil de paquet avec, en plus, les canaux MCP, le nettoyage des tâches cron/sous-agents, la recherche web OpenAI et OpenWebUI
  - `full` : segments Docker du parcours de publication avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée

- Exécutez directement le workflow manuel `CI` lorsque vous avez uniquement besoin d’une couverture CI normale et déterministe pour la version candidate. Les déclenchements manuels de CI ignorent la limitation aux éléments modifiés et imposent les fragments Linux Node, les fragments des plugins intégrés, les fragments de contrats des plugins et des canaux, la compatibilité avec Node 22, `check-*`, `check-additional-*`, les vérifications rapides des artefacts générés, les vérifications de la documentation, les Skills Python, Windows, macOS et les parcours d’internationalisation de Control UI. Les exécutions manuelles autonomes de CI n’exécutent Android que lorsqu’elles sont déclenchées avec `include_android=true` ; `Full Release Validation` transmet cette entrée à son workflow CI enfant.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cette commande fait passer QA-lab par un récepteur OTLP/HTTP local et vérifie l’exportation des traces, des métriques et des journaux, ainsi que la limitation des attributs de trace et la rédaction du contenu et des identifiants, sans nécessiter Opik, Langfuse ni aucun autre collecteur externe.
- Exécutez `pnpm qa:otel:collector-smoke` lors de la validation de la compatibilité avec le collecteur. Cette commande achemine la même exportation OTLP de QA-lab par un véritable conteneur Docker OpenTelemetry Collector avant les assertions du récepteur local.
- Exécutez `pnpm qa:prometheus:smoke` lors de la validation de la collecte Prometheus protégée. Cette commande fait fonctionner QA-lab, rejette les collectes non authentifiées et vérifie que les familles de métriques essentielles à la publication restent exemptes de contenu d’invite, d’identifiants bruts, de jetons d’authentification et de chemins locaux.
- Exécutez `pnpm qa:observability:smoke` pour lancer successivement les parcours de test rapide OpenTelemetry et Prometheus depuis le code source extrait.
- Exécutez `pnpm release:check` avant chaque publication étiquetée.
- La vérification préalable `OpenClaw NPM Release` génère des preuves sur les dépendances de la publication avant de créer l’archive npm. Le contrôle des vulnérabilités signalées par les avis de sécurité npm bloque la publication. Les rapports sur les risques du manifeste transitif, la propriété des dépendances et leur surface d’installation, ainsi que les modifications des dépendances, constituent uniquement des preuves de publication. Le rapport sur les modifications des dépendances compare la version candidate avec l’étiquette de publication accessible précédente. La vérification préalable téléverse les preuves relatives aux dépendances sous le nom `openclaw-release-dependency-evidence-<tag>` et les intègre également dans `dependency-evidence/` au sein de l’artefact préparé de vérification préalable npm. Le véritable processus de publication réutilise cet artefact de vérification préalable, puis joint les mêmes preuves à la publication GitHub sous le nom `openclaw-<version>-dependency-evidence.zip`.
- Exécutez `OpenClaw Release Publish` pour la séquence de publication avec mutations une fois l’étiquette créée. Lancez les publications bêta et stables ordinaires depuis la branche `main` de confiance ; l’étiquette de publication sélectionne toujours le commit cible exact et peut pointer vers `release/YYYY.M.PATCH`. Les publications alpha de Tideclaw restent sur leur branche alpha correspondante. Transmettez les valeurs `preflight_run_id` de la vérification npm OpenClaw réussie, `full_release_validation_run_id` de la validation complète de la publication réussie et la valeur exacte de `full_release_validation_run_attempt`, et conservez la portée de publication des plugins par défaut `all-publishable`, sauf si vous effectuez délibérément une réparation ciblée. Le workflow exécute en série la publication npm des plugins, leur publication sur ClawHub et la publication npm d’OpenClaw afin que le paquet principal ne soit pas publié avant ses plugins externalisés ; la promotion Windows et Android s’exécute en parallèle de la publication npm principale sur la page de publication à l’état de brouillon. Les nouvelles exécutions de publication peuvent reprendre : si une version npm principale est déjà publiée, l’envoi principal est ignoré après que le workflow a démontré que l’archive du registre correspond à l’artefact de vérification préalable de l’étiquette ; la promotion Windows/Android est également ignorée lorsque la publication contient déjà le contrat d’artefacts vérifié. Une nouvelle tentative ne réexécute donc que les étapes ayant échoué. Les réparations ciblées limitées aux plugins nécessitent `plugin_publish_scope=selected` et une liste de plugins non vide. Les exécutions `all-publishable` limitées aux plugins nécessitent des preuves complètes et immuables de vérification préalable et de validation complète de la publication ; les preuves partielles sont rejetées.
- Une exécution stable de `OpenClaw Release Publish` nécessite une valeur exacte de `windows_node_tag` après la création de la publication non préliminaire correspondante dans `openclaw/openclaw-windows-node`, ainsi que la table `windows_node_installer_digests` approuvée pour la version candidate. Avant de lancer tout processus enfant de publication, elle vérifie que cette publication source est publiée, qu’elle n’est pas préliminaire, qu’elle contient les programmes d’installation x64/ARM64 requis et qu’elle correspond toujours à cette table approuvée. Elle lance ensuite `Windows Node Release` pendant que la publication OpenClaw est encore à l’état de brouillon, en transmettant sans modification la table figée des condensats des programmes d’installation. Le workflow enfant télécharge les programmes d’installation Windows Hub signés depuis cette étiquette exacte, vérifie leur correspondance avec les condensats figés, confirme sur un exécuteur Windows que leurs signatures Authenticode utilisent le signataire OpenClaw Foundation attendu, crée un manifeste SHA-256 et téléverse les programmes d’installation ainsi que le manifeste dans la publication GitHub canonique d’OpenClaw, puis télécharge à nouveau les artefacts promus et vérifie leur présence dans le manifeste ainsi que leurs hachages. Le parent vérifie le contrat d’artefacts x64, ARM64 et de somme de contrôle actuel avant la publication. La récupération directe rejette les noms d’artefacts `OpenClawCompanion-*` inattendus avant de remplacer les artefacts attendus du contrat par les octets sources figés.

  Lancez manuellement `Windows Node Release` uniquement pour une récupération et transmettez toujours une étiquette exacte, jamais `latest`, ainsi que la table JSON explicite `expected_installer_digests` provenant de la publication source approuvée. Les liens de téléchargement du site Web doivent cibler les URL exactes des artefacts de la publication OpenClaw stable actuelle, ou `releases/latest/download/...` uniquement après avoir vérifié que la redirection vers la dernière publication de GitHub pointe vers cette même publication ; ne créez pas de lien uniquement vers la page de publication du dépôt complémentaire.

- Les contrôles de version s’exécutent désormais dans un workflow manuel distinct : `OpenClaw Release Checks`. Il exécute également la voie de parité des simulations du QA Lab, ainsi que le profil Matrix live rapide et la voie QA Telegram avant l’approbation de la version. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous souhaitez inventorier en parallèle l’ensemble du transport, des médias et du chiffrement E2EE de Matrix.
- La validation d’exécution de l’installation et de la mise à niveau sur plusieurs systèmes d’exploitation fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Cette séparation est intentionnelle : elle permet de garder le véritable processus de publication npm court, déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur propre voie afin de ne pas retarder ni bloquer la publication.
- Les contrôles de version nécessitant des secrets doivent être lancés via `Full Release Validation` ou depuis la référence de workflow `main`/de version, afin que la logique du workflow et les secrets restent contrôlés.
- `OpenClaw Release Checks` accepte une branche, une étiquette ou le SHA complet d’un commit, à condition que le commit résolu soit accessible depuis une branche OpenClaw ou une étiquette de version.
- La vérification préalable en mode validation uniquement de `OpenClaw NPM Release` accepte également le SHA complet de 40 caractères du commit actuel de la branche du workflow, sans exiger d’étiquette poussée. Ce chemin par SHA sert uniquement à la validation et ne peut pas être promu en véritable publication. En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour le contrôle des métadonnées du paquet ; une véritable publication exige toujours une véritable étiquette de version.
- Les deux workflows conservent le véritable processus de publication et de promotion sur les exécuteurs hébergés par GitHub, tandis que le processus de validation sans mutation peut utiliser les exécuteurs Linux Blacksmith plus puissants.
- Ce workflow exécute `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`.
- La vérification préalable de la version npm n’attend plus la voie distincte des contrôles de version.
- Avant d’étiqueter localement une version candidate, exécutez `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L’utilitaire exécute les garde-fous rapides de publication, les contrôles de publication npm/ClawHub des plugins, la compilation, la compilation de l’interface utilisateur et `release:openclaw:npm:check`, dans l’ordre permettant de détecter les erreurs courantes susceptibles de bloquer l’approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou l’étiquette de préversion/correction correspondante) avant l’approbation.
- Après la publication npm, exécutez `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou la version bêta/de correction correspondante) pour vérifier le chemin d’installation depuis le registre publié dans un nouveau préfixe temporaire.
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` pour vérifier l’intégration initiale du paquet installé, la configuration de Telegram et un test E2E Telegram réel sur le paquet npm publié, à l’aide du pool partagé d’identifiants Telegram loués. Pour des exécutions locales ponctuelles, les mainteneurs peuvent omettre les variables Convex et transmettre directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le test de fumée bêta complet après publication depuis la machine d’un mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’utilitaire exécute la validation de la mise à jour npm et d’une cible neuve dans Parallels, lance `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter le même contrôle après publication depuis GitHub Actions au moyen du workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement exclusivement manuel et ne s’exécute pas à chaque fusion.
- L’automatisation des versions destinée aux mainteneurs applique une vérification préalable suivie d’une promotion :
  - La véritable publication npm doit disposer d’un `preflight_run_id` npm réussi.
  - L’orchestration et la vérification préalable des publications bêta et stables ordinaires utilisent la branche `main` de confiance avec l’étiquette cible exacte. La publication et la vérification préalable des versions alpha Tideclaw utilisent la branche alpha correspondante.
  - Les versions npm stables ciblent `beta` par défaut ; la publication npm stable peut cibler explicitement `latest` au moyen d’une entrée du workflow.
  - La modification des étiquettes de distribution npm fondée sur un jeton réside dans `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, car `npm dist-tag add` nécessite toujours `NPM_TOKEN`, tandis que le dépôt source conserve une publication exclusivement via OIDC.
  - Le workflow public `macOS Release` sert uniquement à la validation ; lorsqu’une étiquette existe uniquement sur une branche de version, mais que le workflow est lancé depuis `main`, définissez `public_release_branch=release/YYYY.M.PATCH`.
  - La véritable publication macOS doit disposer de `preflight_run_id` et `validate_run_id` macOS réussis.
  - Les véritables processus de publication promeuvent les artefacts préparés au lieu de les reconstruire.
- Pour les versions correctives stables telles que `YYYY.M.PATCH-N`, l’outil de vérification après publication contrôle également le même chemin de mise à niveau dans un préfixe temporaire, de `YYYY.M.PATCH` vers `YYYY.M.PATCH-N`, afin que les corrections de version ne puissent pas laisser silencieusement d’anciennes installations globales sur la charge utile stable de base.
- La vérification préalable de la version npm échoue de manière fermée, sauf si l’archive contient à la fois `dist/control-ui/index.html` et une charge utile non vide dans `dist/control-ui/assets/`, afin que nous ne publiions plus jamais un tableau de bord web vide.
- La vérification après publication contrôle également la présence des points d’entrée des plugins publiés et des métadonnées du paquet dans l’arborescence installée depuis le registre. Une version dépourvue des charges utiles d’exécution des plugins échoue à la vérification après publication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique également le budget npm pack `unpackedSize` à l’archive candidate de mise à jour, afin que le test E2E du programme d’installation détecte tout gonflement accidentel du paquet avant le processus de publication.
- Si le travail de publication a modifié la planification CI, les manifestes de durée des plugins ou les matrices de tests des plugins, régénérez et examinez avant l’approbation les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml`, afin que les notes de version ne décrivent pas une structure CI obsolète.
- La préparation d’une version macOS stable inclut également les surfaces de mise à jour : la version GitHub doit finalement contenir les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip` ; le fichier `appcast.xml` sur `main` doit pointer vers la nouvelle archive zip stable après la publication (le workflow de publication macOS le valide automatiquement, ou ouvre une PR appcast si le push direct est bloqué) ; l’application empaquetée doit conserver un identifiant de bundle non destiné au débogage, une URL de flux Sparkle non vide et une valeur `CFBundleVersion` supérieure ou égale au seuil canonique de compilation Sparkle pour cette version.

## Machines de test des versions

`Full Release Validation` permet aux opérateurs de lancer tous les tests de prépublication depuis un point d’entrée unique. Pour obtenir la preuve d’un commit épinglé sur une branche évoluant rapidement, utilisez l’utilitaire afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée sur un seul SHA de workflow `main` de confiance, tandis que le commit demandé reste le candidat testé :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’outil récupère la version actuelle de `origin/main`, pousse `release-ci/<workflow-sha>-...` au niveau de ce commit de workflow approuvé, déclenche `Full Release Validation` depuis la branche temporaire avec `ref=<target-sha>`, réutilise les preuves strictes correspondant exactement à la cible lorsqu’elles sont disponibles, vérifie que chaque `headSha` de workflow enfant correspond au SHA épinglé du workflow parent, puis supprime la branche temporaire. Transmettez `-f reuse_evidence=false` pour forcer une nouvelle exécution ou `--workflow-sha <trusted-main-sha>` pour épingler un commit plus ancien qui reste accessible depuis la version actuelle de `origin/main`. Le workflow lui-même n’écrit jamais de références dans le dépôt. Cela permet de conserver les outils de publication réservés à main sans ajouter de commits d’outillage au candidat et évite de valider accidentellement une exécution enfant provenant d’une version plus récente de `main`.

Pour valider une branche ou une étiquette de publication, exécutez-le depuis la référence de workflow approuvée de `main` et transmettez la branche ou l’étiquette de publication comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Le workflow résout la référence cible, déclenche manuellement `CI` avec `target_ref=<release-ref>`, puis déclenche `OpenClaw Release Checks`. `OpenClaw Release Checks` répartit l’exécution entre les tests de bon fonctionnement de l’installation, les vérifications de publication sur plusieurs systèmes d’exploitation, la couverture en direct/E2E du parcours de publication Docker lorsque le test prolongé est activé, Package Acceptance avec le test E2E canonique du paquet Telegram, la parité de QA Lab, Matrix en direct et Telegram en direct. Une exécution complète/totale n’est acceptable que lorsque le récapitulatif de `Full Release Validation` indique que `normal_ci`, `plugin_prerelease` et `release_checks` ont réussi, sauf si une réexécution ciblée a intentionnellement ignoré l’enfant `Plugin Prerelease` distinct. Utilisez l’enfant autonome `npm-telegram` uniquement pour une réexécution ciblée d’un paquet publié avec `release_package_spec` ou `npm_telegram_package_spec`. Le récapitulatif final du vérificateur comprend des tableaux des tâches les plus lentes pour chaque exécution enfant, afin que le responsable de la publication puisse voir le chemin critique actuel sans télécharger les journaux.

Le sous-workflow product-performance produit uniquement un artefact dans ce parcours de publication. Le
workflow englobant le déclenche avec `publish_reports=false`, et la validation est rejetée
sauf si sa protection de production d’artefact uniquement prouve que l’outil de publication du rapport Clawgrit est resté
ignoré.

Consultez [Validation complète de la publication](/fr/reference/full-release-validation) pour connaître la matrice complète des étapes, les noms exacts des tâches de workflow, les différences entre les profils stable et complet, les artefacts et les commandes de réexécution ciblée.

Les workflows enfants sont déclenchés depuis la référence approuvée qui exécute `Full Release Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une branche ou une étiquette de publication antérieure. Chaque exécution enfant doit utiliser le SHA exact du workflow parent ; si `main` avance avant la résolution du déclenchement d’un workflow enfant, le workflow englobant échoue de manière fermée. Il n’existe pas d’entrée distincte pour la référence du workflow Full Release Validation ; choisissez le banc d’essai approuvé en sélectionnant la référence d’exécution du workflow. N’utilisez pas `--ref main -f ref=<sha>` pour prouver un commit exact sur une branche `main` mouvante ; les SHA de commit bruts ne peuvent pas servir de références de déclenchement de workflow. Utilisez donc `pnpm ci:full-release --sha <target-sha>` pour créer une branche temporaire depuis la référence approuvée `origin/main`, tout en conservant le SHA cible comme entrée candidate.

Utilisez `release_profile` pour sélectionner l’étendue des tests en conditions réelles et des fournisseurs :

- `minimum` : parcours OpenAI/cœur en conditions réelles et Docker critique pour la publication, le plus rapide
- `stable` : profil minimum, plus couverture stable des fournisseurs et des backends pour l’approbation de la publication
- `full` : profil stable, plus large couverture consultative des fournisseurs et des médias

Les validations stable et complète exécutent toujours, avant la promotion, les tests exhaustifs en conditions réelles/E2E, le parcours de publication Docker et la campagne délimitée de vérification de la persistance après mise à niveau des versions publiées. Utilisez `run_release_soak=true` pour demander cette même campagne pour une version bêta. Cette campagne couvre les quatre derniers paquets stables, ainsi que les versions de référence épinglées `2026.4.23` et `2026.5.2`, plus la couverture de l’ancienne version `2026.4.15`, en supprimant les versions de référence en double et en répartissant chaque version de référence dans sa propre tâche d’exécution Docker.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence cible sous la forme `release-package-under-test`, puis réutilise cet artefact dans les vérifications multiplateformes, Package Acceptance et Docker du parcours de publication lorsque la campagne s’exécute. Ainsi, tous les environnements qui utilisent le paquet emploient exactement les mêmes octets, sans reconstruire le paquet plusieurs fois. Une fois qu’une version bêta est déjà disponible sur npm, définissez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` afin que les vérifications de publication téléchargent une seule fois le paquet publié, extraient le SHA du code source de compilation depuis `dist/build-info.json`, puis réutilisent cet artefact pour les parcours multiplateformes, Package Acceptance, Docker du parcours de publication et Telegram du paquet.

Le test rapide multiplateforme d’installation OpenAI utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable du dépôt ou de l’organisation est définie, sinon `openai/gpt-5.6-luna`, car ce parcours vérifie l’installation du paquet, la configuration initiale, le démarrage du Gateway et une interaction réelle avec un agent, plutôt que d’évaluer les performances du modèle le plus puissant. La matrice plus large des fournisseurs en conditions réelles reste l’emplacement destiné à la couverture propre à chaque modèle.

Utilisez ces variantes selon l’étape de publication :

```bash
# Valider une branche candidate à la publication non publiée.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Valider un commit poussé précis.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Après la publication d'une version bêta, ajouter l'E2E Telegram du paquet publié.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N'utilisez pas l'orchestrateur global complet pour la première réexécution après un correctif ciblé. Si une machine échoue, utilisez le workflow enfant, la tâche, la voie Docker, le profil de paquet, le fournisseur de modèles ou la voie d'assurance qualité ayant échoué pour la preuve suivante. Réexécutez l'orchestrateur global complet uniquement lorsque le correctif a modifié l'orchestration partagée de la publication ou rendu obsolètes les preuves antérieures de toutes les machines. Le vérificateur final de l'orchestrateur global revérifie les identifiants d'exécution enregistrés des workflows enfants ; après la réexécution réussie d'un workflow enfant, réexécutez uniquement la tâche parente `Verify full validation` ayant échoué.

`rerun_group=all` peut réutiliser une exécution antérieure réussie de l'orchestrateur global uniquement si elle a validé
exactement le même SHA cible, le même profil de publication, le même réglage effectif de test prolongé et les
mêmes entrées de validation. Il s'agit d'une récupération limitée permettant de réexécuter le même candidat,
et non de réutiliser des preuves entre différents SHA. Pour un candidat modifié, y compris un commit modifiant uniquement le journal des modifications ou
la version, réexécutez chaque contrôle de paquet, d'artefact, d'installation, Docker ou de fournisseur
affecté par les chemins modifiés ou les hachages d'artefacts. Les exécutions plus récentes de l'orchestrateur global pour
la même référence `release/*`
et le même groupe de réexécution remplacent automatiquement celles en cours. Transmettez
`reuse_evidence=false` pour imposer une nouvelle exécution complète.

Pour une reprise limitée, transmettez `rerun_group` au workflow englobant. `all` correspond à la véritable exécution de la version candidate, `ci` exécute uniquement la tâche enfant de CI normale, `plugin-prerelease` exécute uniquement la tâche enfant de Plugin réservée à la publication, `release-checks` exécute tous les environnements de publication, et les groupes de publication plus restreints sont `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`. Les réexécutions ciblées de `npm-telegram` nécessitent `release_package_spec` ou `npm_telegram_package_spec` ; les exécutions complètes/totales utilisent le test E2E Telegram canonique du paquet dans Package Acceptance. Les réexécutions ciblées multiplateformes peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou un autre filtre de système d’exploitation ou de suite. Les échecs des contrôles de publication de QA bloquent la validation normale de la publication, y compris la dérive obligatoire des outils dynamiques OpenClaw dans le niveau standard. Les exécutions alpha de Tideclaw peuvent néanmoins considérer comme indicatifs les parcours de contrôle de publication qui ne concernent pas la sécurité des paquets. Avec `release_profile=beta`, les suites de fournisseurs en direct `Run repo/live E2E validation` sont indicatives (avertissements, et non blocages) ; les profils stable et complet continuent de les rendre bloquantes. Lorsque `live_suite_filter` demande explicitement un parcours QA en direct soumis à activation, tel que Discord, WhatsApp ou Slack, la variable de dépôt `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon, la capture des entrées échoue au lieu d’ignorer silencieusement le parcours.

### Vitest

La case Vitest correspond au workflow enfant `CI` manuel. La CI manuelle contourne intentionnellement la limitation aux modifications et force l’exécution du graphe de tests normal pour la version candidate : partitions Linux Node, partitions des plugins intégrés, partitions des contrats des plugins et des canaux, compatibilité avec Node 22, `check-*`, `check-additional-*`, tests de bon fonctionnement des artefacts générés, vérifications de la documentation, Skills Python, Windows, macOS et internationalisation de l’interface de contrôle. Android est inclus lorsque `Full Release Validation` exécute cette case, car le workflow général transmet `include_android=true` ; la CI manuelle autonome nécessite `include_android=true` pour couvrir Android.

Utilisez cette case pour répondre à la question « l’arborescence des sources a-t-elle réussi l’intégralité de la suite de tests normale ? ». Elle ne correspond pas à la validation du produit sur le parcours de publication. Éléments de preuve à conserver :

- résumé de `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` réussie sur le SHA cible exact
- noms des shards en échec ou lents dans les tâches CI lors de l’analyse des régressions
- artefacts de mesure des temps Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse des performances

Exécutez manuellement la CI directement uniquement lorsque la version nécessite une CI normale déterministe, mais pas les environnements Docker, QA Lab, en direct, multiplateformes ou de packages. Utilisez la première commande pour une CI directe hors Android. Ajoutez `include_android=true` lorsque la CI directe de la version candidate doit couvrir Android :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` via `openclaw-live-and-e2e-checks-reusable.yml`, ainsi que dans le workflow `install-smoke` en mode publication. Elle valide la version candidate dans des environnements Docker empaquetés plutôt que de se limiter à des tests au niveau du code source.

La couverture Docker de la publication comprend :

- un test de bon fonctionnement de l’installation complète avec activation du test lent d’installation globale de Bun
- la préparation/réutilisation de l’image de test du Dockerfile racine selon le SHA cible, avec les tâches de test QR, racine/Gateway et programme d’installation/Bun exécutées sous forme de segments install-smoke distincts
- les voies E2E du dépôt
- les segments Docker du parcours de publication : `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` à `plugins-runtime-install-h`, et `openwebui`
- la couverture OpenWebUI sur un exécuteur dédié disposant d’un disque de grande capacité lorsqu’elle est demandée
- les voies fractionnées d’installation/désinstallation des plugins intégrés, de `bundled-plugin-install-uninstall-0` à `bundled-plugin-install-uninstall-23`
- les suites de fournisseurs en direct/E2E et la couverture des modèles en direct dans Docker lorsque les vérifications de publication incluent les suites en direct

Utilisez les artefacts Docker avant toute nouvelle exécution. L’ordonnanceur du parcours de publication téléverse `.artifacts/docker-tests/` avec les journaux des voies, `summary.json`, `failures.json`, les durées des phases, le plan de l’ordonnanceur au format JSON et les commandes de nouvelle exécution. Pour une reprise ciblée, utilisez `docker_lanes=<lane[,lane]>` dans le workflow réutilisable en direct/E2E au lieu de réexécuter tous les segments de publication. Les commandes de nouvelle exécution générées incluent le précédent `package_artifact_run_id` et les entrées des images Docker préparées lorsqu’elles sont disponibles, afin qu’une voie ayant échoué puisse réutiliser la même archive tar et les mêmes images GHCR.

### QA Lab

La section QA Lab fait également partie de `OpenClaw Release Checks`. Elle constitue le jalon de validation de publication pour le comportement agentique et les canaux, indépendamment de Vitest et des mécanismes de paquet Docker.

La couverture de publication de QA Lab comprend :

- un parcours de parité simulé comparant le parcours candidat OpenAI à la référence `anthropic/claude-opus-4-8` à l’aide de la suite de parité agentique
- un profil QA Matrix réel et rapide utilisant l’environnement `qa-live-shared`
- un parcours QA Telegram réel utilisant des locations d’identifiants Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cette section pour répondre à la question « la publication se comporte-t-elle correctement dans les scénarios QA et les flux de canaux réels ? ». Conservez les URL des artefacts des parcours de parité, Matrix et Telegram lors de l’approbation de la publication. La couverture Matrix complète reste disponible sous la forme d’une exécution QA Lab partitionnée manuelle, plutôt que comme parcours critique de publication par défaut.

### Paquet

La section Paquet est le jalon de validation du produit installable. Elle s’appuie sur `Package Acceptance` et le résolveur `scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un candidat en une archive tar `package-under-test` utilisée par les tests E2E Docker, valide l’inventaire du paquet, enregistre la version du paquet et son SHA-256, et maintient la référence du dispositif de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte d’OpenClaw
- `source=ref` : empaqueter une branche, une étiquette ou le SHA complet d’un commit `package_ref` de confiance avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger une archive `.tgz` HTTPS publique avec le `package_sha256` requis ; les identifiants dans l’URL, les ports HTTPS non standard, les noms d’hôte ou adresses résolues privés, internes ou à usage spécial, ainsi que les redirections non sécurisées sont rejetés
- `source=trusted-url` : télécharger une archive `.tgz` HTTPS avec les champs requis `package_sha256` et `trusted_source_id` depuis une politique nommée dans `.github/package-trusted-sources.json` ; utilisez cette option pour les miroirs d’entreprise ou les dépôts de paquets privés gérés par les mainteneurs, au lieu d’ajouter à `source=url` un contournement du réseau privé au niveau des entrées
- `source=artifact` : réutiliser une archive `.tgz` téléversée par une autre exécution de GitHub Actions

`OpenClaw Release Checks` exécute l’acceptation des paquets avec `source=artifact`, l’artefact du paquet de version préparé, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. L’acceptation des paquets conserve la migration, la mise à jour, la mise à niveau des VPS gérés par le compte root, le redémarrage après mise à jour avec une authentification configurée, l’installation réelle de Skills ClawHub, le nettoyage des dépendances obsolètes des Plugins, les jeux de données de test de Plugins hors ligne, la mise à jour des Plugins, le renforcement contre l’échappement des liaisons de commandes des Plugins et le contrôle qualité du paquet Telegram sur la même archive tar résolue. Les vérifications bloquantes de version utilisent par défaut comme référence le dernier paquet publié ; le profil bêta avec `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` étend la campagne de survivance aux mises à niveau publiées à `last-stable-4`, ainsi qu’aux références épinglées `2026.4.23`, `2026.5.2` et `2026.4.15`, avec les scénarios `reported-issues`. Utilisez l’acceptation des paquets avec `source=npm` pour un candidat déjà publié, `source=ref` pour une archive tar npm locale adossée à un SHA avant publication, `source=trusted-url` pour un miroir d’entreprise ou privé géré par les mainteneurs, ou `source=artifact` pour une archive tar préparée et téléversée par une autre exécution de GitHub Actions.

Il s’agit du remplacement natif de GitHub pour la majeure partie de la couverture des paquets et des mises à jour qui nécessitait auparavant Parallels. Les vérifications de version multiplateformes restent importantes pour l’intégration initiale, le programme d’installation et les comportements propres aux systèmes d’exploitation, mais la validation fonctionnelle des paquets et des mises à jour doit privilégier l’acceptation des paquets.

La liste de contrôle canonique pour la validation des mises à jour et des Plugins est [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la pour déterminer quel parcours local, Docker, d’acceptation des paquets ou de vérification de version valide une installation ou une mise à jour de Plugin, un nettoyage par le diagnostic ou une modification de migration d’un paquet publié. La migration exhaustive des mises à jour publiées depuis chaque paquet stable `2026.4.23+` est un workflow manuel `Update Migration` distinct et ne fait pas partie de l’intégration continue complète des versions.

La tolérance héritée de l’acceptation des paquets est volontairement limitée dans le temps. Les paquets jusqu’à `2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de `gateway install --wrapper`, fichiers de correctif absents du fixture git dérivé de l’archive tar, absence de `update.channel` persisté, emplacements hérités des enregistrements d’installation des plugins, absence de persistance des enregistrements d’installation de la place de marché et migration des métadonnées de configuration lors de `plugins update`. Le paquet `2026.4.26` publié peut émettre un avertissement concernant les fichiers locaux d’horodatage des métadonnées de compilation qui ont déjà été livrés. Les paquets ultérieurs doivent respecter les contrats de paquet modernes ; ces mêmes lacunes font échouer la validation de la version.

Utilisez des profils d’acceptation des paquets plus larges lorsque la question relative à la version concerne un paquet réellement installable :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profils de paquet courants :

- `smoke` : parcours rapides d’installation du paquet/du canal/de l’agent, de réseau du Gateway et de rechargement de la configuration
- `package` : contrats d’installation/de mise à jour/de redémarrage/de paquet de Plugin, avec preuve réelle d’installation d’une Skill ClawHub ; il s’agit de la valeur par défaut des vérifications de version
- `product` : `package`, plus les canaux MCP, le nettoyage de Cron/des sous-agents, la recherche web OpenAI et OpenWebUI
- `full` : segments du chemin de publication Docker avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour des réexécutions ciblées

Pour la preuve Telegram d’un paquet candidat, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tar `package-under-test` résolue au parcours Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les vérifications après publication.

## Automatisation de la publication des versions régulières

Pour les publications bêta, `latest`, de Plugin, de GitHub Release et de plateformes,
`OpenClaw Release Publish` est le point d’entrée normal qui effectue les modifications. Le chemin mensuel
étendu stable `.33+`, limité à npm, n’utilise pas cet orchestrateur. Le
workflow régulier orchestre les workflows d’éditeur de confiance dans l’ordre requis par la
version :

1. Extraire le tag de version et résoudre le SHA de son commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*` (ou depuis une branche alpha Tideclaw pour les préversions alpha).
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de version, le dist-tag npm et le `preflight_run_id` enregistré, après avoir vérifié le `full_release_validation_run_id` enregistré et la tentative d’exécution exacte.
7. Pour les versions stables, créer ou mettre à jour la version GitHub en tant que brouillon, déclencher `Windows Node Release` avec le `windows_node_tag` explicite et les `windows_node_installer_digests` approuvés pour le candidat, puis vérifier les ressources canoniques du programme d’installation Windows et de ses sommes de contrôle. Déclencher également `Android Release` afin de générer l’APK signé correspondant au tag exact, ainsi que sa somme de contrôle et sa provenance. Vérifier les deux contrats de ressources natives avant de publier le brouillon.

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

La promotion directe d’une version stable vers `latest` est explicite :

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

Utilisez les workflows de niveau inférieur `Plugin NPM Release` et `Plugin ClawHub Release` uniquement pour des opérations ciblées de réparation ou de republication. `OpenClaw Release Publish` rejette `plugin_publish_scope=selected` lorsque `publish_openclaw_npm=true`, afin que le paquet principal ne puisse pas être publié sans tous les Plugins officiels publiables, notamment `@openclaw/diffs-language-pack`. Pour réparer un Plugin sélectionné, définissez `publish_openclaw_npm=false` avec `plugin_publish_scope=selected` et `plugins=@openclaw/name`, ou déclenchez directement le workflow enfant.

L’amorçage de la première publication sur ClawHub constitue l’exception : déclenchez `Plugin ClawHub New`
depuis la branche `main` de confiance et transmettez le SHA complet de la version cible via `ref`.
N’exécutez jamais le workflow d’amorçage lui-même depuis le tag ou la branche de version :

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validation avant création du tag exige `dry_run=true`, rejette les entrées de tag de version et
d’exécution parente, et accepte uniquement une cible exacte accessible depuis `main` ou `release/*`.
Elle ne charge pas les identifiants ClawHub, ne publie pas les octets des paquets et ne modifie pas la
configuration de l’éditeur de confiance. Le workflow résout néanmoins le plan réel du registre,
extrait et empaquette la cible uniquement dans une tâche sans secrets, matérialise la
chaîne d’outils ClawHub verrouillée et valide l’artefact immuable ainsi que le
slug et l’identité du paquet avant que le tag de version n’existe. N’approuvez l’environnement
`clawhub-plugin-bootstrap` qu’après la fin des tâches d’empaquetage sans secrets ;
cette tâche de validation protégée ne dispose d’aucun identifiant ni d’aucune commande de modification.

Une simulation approuvée ou un véritable amorçage après la création du tag doit inclure le
tag de version exact ainsi que l’identifiant, la tentative et la branche de l’exécution parente
`OpenClaw Release Publish`. Le parent atteste le SHA de son propre workflow et un SHA exact distinct de la branche
`main` de confiance pour `Plugin ClawHub New` ; l’exécution enfant et chaque approbation
d’environnement protégé doivent correspondre à ce SHA enfant approuvé. Le tag de version est
revérifié avant chaque tentative de publication et chaque modification de l’éditeur de confiance.

La tâche d’empaquetage
téléverse un artefact immuable unique dont le nom, l’identifiant/le condensat de l’artefact Actions,
l’exécution/la tentative productrice, le SHA cible ainsi que le SHA-256/la taille de l’archive tar de chaque paquet sont
transmis aux tâches de validation et aux tâches protégées. La tâche protégée extrait uniquement les outils de la branche `main`
de confiance, valide le tuple de l’artefact via l’API GitHub, le télécharge
à l’aide de son identifiant exact, recalcule le hachage de chaque archive tar et valide les chemins TAR locaux ainsi que
l’identité du paquet conformément aux règles de canonicalisation USTAR de la CLI épinglée. Chaque
candidat passe ensuite la simulation de publication de la CLI épinglée, qui s’arrête avant
la consultation du registre ou l’authentification. Le préfiltre de la tâche avec identifiants limite les ClawPacks compressés
à 120 MiB, la charge utile totale des fichiers à 50 MiB, les données TAR décompressées à 64 MiB et
le nombre d’entrées TAR à 10,000. La réparation de l’éditeur de confiance pour un paquet existant reste
limitée à la configuration, mais elle empaquette toujours la cible et exige que le tag demandé
ainsi que les octets et les métadonnées exacts du registre soient identiques avant de modifier la configuration
de l’éditeur de confiance. La vérification après publication télécharge l’artefact ClawHub et
exige les mêmes SHA-256 et taille. Une récupération par réexécution des tâches ayant échoué peut réutiliser l’artefact de paquet
d’une tentative antérieure uniquement lorsque la tâche productrice exacte s’est terminée
avec succès. La preuve finale lie également la version ClawHub verrouillée, le
SHA-256 du verrou et l’intégrité npm. Toute non-concordance exige une nouvelle version du paquet.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de version requis, tel que `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1` ; lorsque `preflight_only=true`, il peut également s’agir du SHA complet de 40 caractères du commit actuel de la branche du workflow pour une prévalidation uniquement
- `preflight_only` : `true` pour la validation/la compilation/l’empaquetage uniquement, `false` pour le véritable chemin de publication
- `preflight_run_id` : identifiant d’une prévalidation existante réussie, requis sur le véritable chemin de publication afin que le workflow réutilise l’archive tar préparée au lieu de la reconstruire
- `full_release_validation_run_id` : identifiant d’une exécution `Full Release Validation` réussie pour ce tag/SHA, requis pour une véritable publication. Les publications bêta peuvent continuer avec la seule prévalidation, avec un avertissement, mais la promotion stable/`latest` l’exige toujours.
- `full_release_validation_run_attempt` : tentative d’exécution positive exacte associée à `full_release_validation_run_id` ; requise chaque fois que l’identifiant d’exécution est fourni afin que les réexécutions ne puissent pas modifier la preuve d’autorisation pendant la publication.
- `release_publish_run_id` : identifiant d’exécution `OpenClaw Release Publish` approuvé ; requis lorsque ce workflow est déclenché par ce parent (appels de véritable publication effectués par l’acteur bot)
- `plugin_npm_run_id` : identifiant d’une exécution `Plugin NPM Release` réussie sur le commit de tête exact ; requis pour une véritable publication principale `extended-stable`
- `npm_dist_tag` : tag npm cible du chemin de publication ; accepte `alpha`, `beta`, `latest` ou `extended-stable` et vaut `beta` par défaut. Le correctif final `33` et les suivants doivent utiliser `extended-stable` ; par défaut, `extended-stable` rejette les correctifs antérieurs et rejette toujours les tags non finaux.
- `bypass_extended_stable_guard` : booléen réservé aux tests, valeur par défaut `false` ; avec `npm_dist_tag=extended-stable`, contourne l’éligibilité mensuelle à la version étendue stable tout en préservant les vérifications d’identité de version, d’artefact, d’approbation et de relecture.

`Plugin NPM Release` accepte `npm_dist_tag=default` pour le comportement de publication
existant ou `npm_dist_tag=extended-stable` pour le chemin mensuel protégé. L’option
étendue stable exige `publish_scope=all-publishable`, une entrée `plugins`
vide, un correctif final supérieur ou égal à `33` et la branche canonique
`extended-stable/YYYY.M.33` à sa pointe exacte. Elle ne déplace jamais les tags de Plugin
`latest` ou `beta`. Les nouvelles versions de paquet reçoivent `extended-stable` de manière atomique
par publication OIDC de confiance (`npm publish --tag extended-stable`) ; ce
workflow source n’utilise pas `npm dist-tag add` authentifié par jeton. Les nouvelles tentatives
ignorent les versions exactes déjà présentes dans npm, puis échouent de manière fermée sauf si une
relecture complète confirme que chaque paquet exact et le tag `extended-stable` ont convergé.

`OpenClaw Release Publish` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de version requis ; doit déjà exister
- `preflight_run_id` : identifiant d’une prévalidation `OpenClaw NPM Release` réussie ; requis lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id` : identifiant d’une exécution `Full Release Validation` réussie ; requis lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt` : tentative positive exacte associée à `full_release_validation_run_id` ; requise chaque fois que l’identifiant d’exécution est fourni
- `windows_node_tag` : tag de version exact, hors préversion, de `openclaw/openclaw-windows-node` ; requis pour la publication stable d’OpenClaw
- `windows_node_installer_digests` : carte JSON compacte, approuvée pour le candidat, associant les noms actuels des programmes d’installation Windows à leurs condensats `sha256:` épinglés ; requise pour la publication stable d’OpenClaw
- `npm_telegram_run_id` : identifiant facultatif d’une exécution `NPM Telegram Beta E2E` réussie à inclure dans la preuve finale de publication
- `npm_dist_tag` : tag npm cible du paquet OpenClaw, parmi `alpha`, `beta` ou `latest`
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez `selected` uniquement pour une réparation ciblée limitée aux Plugins avec `publish_openclaw_npm=false`
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez-le sur `false` uniquement lorsque vous utilisez le workflow comme orchestrateur de réparation limitée aux Plugins
- `release_profile` : profil de couverture de version utilisé pour les résumés des preuves de publication ; vaut `from-validation` par défaut, qui le lit depuis le manifeste de validation, ou remplacez-le par `beta`, `stable` ou `full`
- `wait_for_clawhub` : vaut `false` par défaut afin que la disponibilité npm ne soit pas bloquée par le processus auxiliaire ClawHub ; définissez-le sur `true` uniquement lorsque l’achèvement du workflow doit inclure celui de ClawHub

`OpenClaw Release Checks` accepte les entrées contrôlées par l’opérateur suivantes :

- `ref` : branche, tag ou SHA complet du commit à valider. Les vérifications utilisant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un tag de version.
- `run_release_soak` : active les tests prolongés exhaustifs en conditions réelles/E2E, du chemin de publication Docker et de survie aux mises à niveau depuis toutes les versions pour les vérifications de version bêta. Cette option est forcée par `release_profile=stable` et `release_profile=full`.

Règles :

- Les versions finales ordinaires et les versions correctives inférieures au correctif `33` peuvent être publiées sous `beta` ou `latest`. Les versions finales au correctif `33` ou supérieur doivent être publiées sous `extended-stable`, et les versions dotées d’un suffixe correctif à cette limite sont rejetées.
- Les balises de préversion bêta ne peuvent être publiées que sous `beta` ; les balises de préversion alpha ne peuvent être publiées que sous `alpha`
- Pour `OpenClaw NPM Release`, une entrée contenant le SHA complet du commit n’est autorisée que lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` servent toujours uniquement à la validation
- Le véritable chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé lors de la vérification préalable ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence ordinaire de publication stable bêta/latest

Cette séquence historique concerne la publication orchestrée ordinaire, qui gère également les plugins, la publication GitHub, Windows et les travaux sur les autres plateformes. Il ne s’agit pas du processus mensuel `.33+` étendu stable, réservé à npm et documenté en haut de cette page.

Lors de la préparation d’une publication stable orchestrée ordinaire :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise n’existe, vous pouvez utiliser le SHA complet du commit actuel de la branche du workflow pour une simulation de validation uniquement du workflow de vérification préalable.
2. Choisissez `npm_dist_tag=beta` pour le processus normal commençant par la bêta, ou `latest` uniquement si vous souhaitez intentionnellement publier directement une version stable.
3. Exécutez `Full Release Validation` sur la branche de publication, la balise de publication ou le SHA complet du commit lorsque vous souhaitez obtenir, depuis un seul workflow manuel, la CI normale ainsi que la couverture du cache de prompts en conditions réelles, de Docker, de QA Lab, de Matrix et de Telegram. Si vous n’avez intentionnellement besoin que du graphe déterministe des tests normaux, exécutez plutôt le workflow manuel `CI` sur la référence de publication.
4. Sélectionnez la balise de publication exacte, hors préversion, de `openclaw/openclaw-windows-node` dont les programmes d’installation signés x64 et ARM64 doivent être livrés. Enregistrez-la comme `windows_node_tag`, puis enregistrez la table validée de leurs condensats comme `windows_node_installer_digests`. L’assistant de préparation de la version candidate enregistre les deux et les inclut dans la commande de publication qu’il génère.
5. Enregistrez les valeurs `preflight_run_id`, `full_release_validation_run_id` et la valeur exacte de `full_release_validation_run_attempt` correspondant aux exécutions réussies.
6. Exécutez `OpenClaw Release Publish` depuis la branche `main` de confiance avec les mêmes `tag` et `npm_dist_tag`, la valeur `windows_node_tag` sélectionnée, la valeur `windows_node_installer_digests` enregistrée, ainsi que les valeurs enregistrées de `preflight_run_id`, `full_release_validation_run_id` et `full_release_validation_run_attempt`. Ce workflow publie les plugins externalisés sur npm et ClawHub avant de promouvoir le paquet npm OpenClaw.
7. Si la publication a été effectuée sous `beta`, utilisez le workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`.
8. Si la publication a intentionnellement été effectuée directement sous `latest` et que `beta` doit immédiatement désigner la même version stable, utilisez ce même workflow de publication pour faire pointer les deux balises de distribution vers la version stable, ou laissez sa synchronisation corrective planifiée déplacer `beta` ultérieurement.

La modification des balises de distribution réside dans le dépôt du registre des publications, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt source conserve une publication exclusivement basée sur OIDC. Ainsi, le chemin de publication directe et le chemin de promotion commençant par la bêta restent tous deux documentés et visibles par les opérateurs.

Si un responsable de maintenance doit recourir à l’authentification npm locale, exécutez toutes les commandes de la CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op` directement depuis le shell principal de l’agent ; son maintien dans tmux rend observables les invites, les alertes et la gestion des mots de passe à usage unique, tout en évitant les alertes répétées de l’hôte.

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

Les responsables de maintenance utilisent la documentation privée relative aux publications dans [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) comme procédure opérationnelle réelle.

## Pages connexes

- [Canaux de publication](/fr/install/development-channels)

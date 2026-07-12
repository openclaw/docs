---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation du paquet
    - À la recherche des conventions de nommage des versions et du rythme de publication
summary: Canaux de publication, liste de contrôle de l’opérateur, environnements de validation, dénomination des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-07-12T03:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expose actuellement trois canaux de mise à jour destinés aux utilisateurs :

- stable : le canal existant des versions promues, qui continue d’être résolu via npm `latest` jusqu’à la mise en place du jalon distinct pour la CLI et les canaux
- beta : les balises de préversion publiées sur npm `beta`
- dev : la tête mouvante de `main`

Par ailleurs, les opérateurs de publication peuvent publier sur npm `extended-stable` le
paquet principal du dernier mois achevé, à partir du correctif `33`. La branche
finale régulière du mois en cours reste sur npm `latest` ; cette séparation des
publications côté opérateur ne modifie pas à elle seule la résolution des canaux
de mise à jour par la CLI.

Les builds alpha Tideclaw constituent une piste de préversion interne distincte (dist-tag npm `alpha`), décrite dans [Entrées du workflow NPM](#npm-workflow-inputs) et [Environnements de test des versions](#release-test-boxes).

## Nommage des versions

- Version mensuelle étendue stable sur npm : `YYYY.M.PATCH`, avec `PATCH >= 33`, balise git `vYYYY.M.PATCH`
- Version finale quotidienne/régulière : `YYYY.M.PATCH`, avec `PATCH < 33`, balise git `vYYYY.M.PATCH`
- Version corrective régulière de secours : `YYYY.M.PATCH-N`, balise git `vYYYY.M.PATCH-N`
- Version de préversion bêta : `YYYY.M.PATCH-beta.N`, balise git `vYYYY.M.PATCH-beta.N`
- Version de préversion alpha : `YYYY.M.PATCH-alpha.N`, balise git `vYYYY.M.PATCH-alpha.N`
- Ne jamais compléter le mois ou le correctif avec des zéros initiaux
- `PATCH` est un numéro séquentiel dans le cycle de publication mensuel, et non un jour du calendrier. Les versions finales régulières et bêta font avancer le cycle en cours ; les balises exclusivement alpha ne consomment ni ne font jamais avancer le numéro de correctif bêta/régulier. Il faut donc ignorer les anciennes balises exclusivement alpha dont les numéros de correctif sont supérieurs lors du choix d’un cycle bêta ou régulier.
- Les builds alpha/nocturnes utilisent le prochain cycle de correctif non publié et n’incrémentent que `alpha.N` pour les builds successifs. Dès qu’une version bêta existe pour ce correctif, les nouveaux builds alpha passent au correctif suivant.
- Les versions npm sont immuables : ne jamais supprimer, republier ou réutiliser une balise publiée. Créez plutôt le numéro de préversion suivant ou le correctif mensuel suivant.
- `latest` continue de suivre la branche npm régulière/quotidienne actuelle ; `beta` est la cible d’installation bêta actuelle
- `extended-stable` désigne le paquet npm pris en charge pour le dernier mois achevé, à partir du correctif `33` ; les correctifs `34` et ultérieurs sont des versions de maintenance de cette branche mensuelle
- Les versions finales régulières et les versions correctives régulières sont publiées par défaut sur npm `beta` ; les opérateurs de publication peuvent cibler explicitement `latest` ou promouvoir ultérieurement un build bêta validé
- Le processus mensuel dédié aux versions étendues stables publie le paquet npm principal et chaque Plugin officiel publiable sur npm avec exactement la même version. Il ne publie pas les Plugins sur ClawHub, ni les artefacts macOS ou Windows, ni une version GitHub, ni les dist-tags des dépôts privés, ni les images Docker, ni les artefacts mobiles, ni les téléchargements du site web.
- Chaque version finale régulière livre conjointement le paquet npm, l’application macOS, l’APK Android autonome signé et les programmes d’installation signés du Hub Windows. Les versions bêta valident et publient normalement en premier le chemin npm/paquet ; la compilation, la signature, la notarisation et la promotion des applications natives sont réservées aux versions finales régulières, sauf demande explicite.

## Cadence de publication

- Les publications passent d’abord par la bêta ; la version stable ne suit qu’après validation de la dernière bêta
- Les responsables créent normalement les versions depuis une branche `release/YYYY.M.PATCH` issue de la version actuelle de `main`, afin que la validation et les corrections de la version ne bloquent pas les nouveaux développements sur `main`
- Si une balise bêta a été envoyée ou publiée et nécessite une correction, les responsables créent la balise `-beta.N` suivante au lieu de supprimer ou de recréer l’ancienne
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont réservés aux responsables

## Publication mensuelle étendue stable limitée à npm

Il s’agit d’une exception dédiée à la procédure de publication régulière
ci-dessous. Pour un mois achevé `YYYY.M`, créez `extended-stable/YYYY.M.33` ;
publiez `vYYYY.M.33` et les correctifs de maintenance ultérieurs depuis cette
même branche. La balise de publication, la tête de branche, le checkout, la
version du paquet, la prévérification npm et l’exécution de la validation
complète de la version doivent tous désigner le même commit. La branche
protégée `main` doit déjà contenir une version finale d’un mois calendaire
strictement ultérieur avec un correctif inférieur à `33` ; les correctifs de
maintenance restent admissibles lorsque `main` a avancé de plus d’un mois.

Sur la branche étendue stable exacte, faites passer le paquet racine à
`YYYY.M.P`, exécutez `pnpm release:prep` et vérifiez que chaque paquet
d’extension publiable possède la même version. Validez et envoyez toutes les
modifications générées, créez et envoyez la balise immuable `vYYYY.M.P` sur ce
commit, puis consignez le SHA complet obtenu. Les workflows utilisent cette
arborescence préparée ; ils ne mettent pas à niveau et ne synchronisent pas les
versions à votre place.

Exécutez la prévérification npm et la validation complète de la version depuis
la tête exacte de cette branche préparée, puis enregistrez les deux identifiants
d’exécution et le numéro de tentative de l’exécution réussie de la validation
complète de la version :

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

`release_profile=stable` est le profil existant de profondeur de validation ; il
est distinct du dist-tag npm `extended-stable` et reste volontairement
inchangé.

Une fois les deux exécutions réussies, publiez chaque Plugin officiel publiable
sur npm depuis la même tête de branche exacte. Le correctif `P` doit être égal
ou supérieur à `33`. Transmettez le SHA complet de la version comme `ref`,
attendez l’achèvement de la matrice complète et de la relecture du registre,
puis enregistrez l’identifiant de l’exécution réussie de la publication NPM des
Plugins :

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Le workflow utilise l’inventaire régulier préparé des paquets `all-publishable`,
y compris les paquets dont le code source n’a pas changé. Il vérifie chaque
paquet exact et chaque balise `extended-stable` de Plugin avant de réussir. Si
une exécution partielle échoue, relancez la même commande : les paquets déjà
publiés sont réutilisés, les balises de Plugin manquantes ou obsolètes sont
réconciliées dans l’environnement de publication npm, et la relecture finale
couvre toujours l’ensemble complet des paquets.

Une fois le workflow des Plugins réussi et l’environnement de publication npm
prêt, publiez l’archive tar exacte issue de la prévérification du paquet
principal. La publication du paquet principal vérifie que l’exécution de Plugin
référencée est `completed/success` sur la même branche canonique et le même SHA
source exact :

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

Pour un fork ou une répétition hors production qui ne peut volontairement pas
respecter la politique mensuelle `.33` ou celle du mois de la branche `main`
protégée, ajoutez `-f bypass_extended_stable_guard=true` aux déclenchements de
prévérification et de publication npm. La valeur par défaut est `false`. Le
contournement n’est accepté qu’avec `npm_dist_tag=extended-stable` et est
consigné dans le résumé du workflow. Il ne contourne pas la référence canonique
de workflow `extended-stable/YYYY.M.33`, l’égalité entre la tête de branche, la
balise et le checkout, la syntaxe de balise finale, l’égalité entre les versions
du paquet et de la balise, l’identité de l’exécution et du manifeste référencés,
la provenance de l’archive tar, l’approbation de l’environnement, la relecture
du registre ou les preuves de réparation du sélecteur.

Le workflow de publication vérifie l’identité des exécutions référencées de
prévérification, de validation et des Plugins, le condensat de l’archive tar
préparée ainsi que les sélecteurs du registre principal. Confirmez le résultat
de manière indépendante après la réussite du workflow :

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Les deux commandes doivent renvoyer `YYYY.M.P`. Si la publication réussit mais
que la relecture du sélecteur échoue, ne republiez pas la version immuable du
paquet. Utilisez l’unique commande de réparation
`npm dist-tag add openclaw@YYYY.M.P extended-stable` affichée dans le résumé
toujours exécuté du workflow en échec, puis répétez les deux relectures
indépendantes. Le retour au sélecteur précédent constitue une décision
distincte de l’opérateur, et non le processus de réparation de la relecture.

La documentation d’assistance publique désigne initialement Slack, Discord et
Codex comme surfaces de Plugin couvertes par la version étendue stable. Cette
liste constitue une déclaration d’assistance et non une liste d’autorisation
dans le code de publication : chaque Plugin officiel publiable sur npm suit le
même processus de publication à version exacte.

La liste de contrôle régulière ci-dessous continue de couvrir la bêta,
`latest`, les versions GitHub, les Plugins, macOS, Windows et les publications
sur les autres plateformes. N’exécutez pas ces étapes pour ce processus de
version étendue stable limité à npm.

## Liste de contrôle de l’opérateur pour une publication régulière

Cette liste de contrôle présente la forme publique du processus de publication. Les identifiants privés, la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans le manuel de publication réservé aux responsables.

1. Partez de la version actuelle de `main` : récupérez les dernières modifications, confirmez que le commit cible a été poussé et que la CI de `main` est suffisamment au vert pour créer une branche à partir de celle-ci.
2. Générez la section supérieure de `CHANGELOG.md` à partir des PR fusionnées et de tous les commits directs depuis la dernière balise de version accessible. Rédigez les entrées pour les utilisateurs, dédupliquez les entrées qui se chevauchent entre PR et commits directs, créez un commit, poussez-le, puis effectuez une nouvelle fois un rebasage ou une récupération avant de créer la branche. Lorsqu'une balise publiée divergente ou un portage ultérieur réassocie des PR déjà publiées, transmettez explicitement cette balise avec `--shipped-ref` ; le vérificateur utilise les lignes de PR explicites provenant des enregistrements complets de contributions dans les sections numérotées de l'instantané de la balise, ignore `Unreleased` et consigne l'inventaire exact ainsi que le nombre de PR exclues.
3. Examinez les enregistrements de compatibilité des versions dans `src/plugins/compat/registry.ts` et `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez uniquement la compatibilité expirée lorsque le parcours de mise à niveau reste couvert, ou consignez pourquoi elle est intentionnellement conservée.
4. Créez `release/YYYY.M.PATCH` à partir de la version actuelle de `main`. N'effectuez pas le travail normal de publication directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour la balise, puis exécutez `pnpm release:prep`. Cette commande actualise, dans l'ordre, les versions des plugins, les fichiers de verrouillage npm, l'inventaire des plugins, le schéma de configuration de base, les métadonnées de configuration des canaux intégrés, la référence de la documentation de configuration, les exportations du SDK de plugins et la référence de l'API du SDK de plugins. Validez dans un commit toute dérive générée avant de créer la balise, puis exécutez les contrôles préalables locaux déterministes : `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` et `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu'une balise n'existe, un SHA complet de 40 caractères de la branche de publication est autorisé uniquement pour les contrôles préalables de validation. Le contrôle préalable génère les preuves de publication des dépendances pour le graphe exact des dépendances extrait et les stocke dans l'artefact du contrôle préalable npm. Enregistrez le `preflight_run_id` de l'exécution réussie.
7. Lancez tous les tests préalables à la publication avec `Full Release Validation` pour la branche de publication, la balise ou le SHA complet du commit. Il s'agit du point d'entrée manuel unique pour les quatre grands environnements de test de publication : Vitest, Docker, QA Lab et Package. Enregistrez le `full_release_validation_run_id` et le `full_release_validation_run_attempt` exact ; ces deux valeurs sont des entrées obligatoires pour `OpenClaw NPM Release` et `OpenClaw Release Publish`.
8. Si la validation échoue, corrigez le problème sur la branche de publication et réexécutez le plus petit fichier, couloir, job de workflow, profil de paquet ou la plus petite liste d'autorisation de fournisseurs ou de modèles permettant de démontrer la correction. Ne réexécutez l'ensemble complet que lorsque la surface modifiée rend les preuves antérieures obsolètes.
9. Pour une version bêta candidate balisée, exécutez `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` depuis la branche `release/YYYY.M.PATCH` correspondante. Pour une version stable, transmettez également la version source Windows requise : `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. L'utilitaire utilise la version fiable de `main` comme source du workflow, tandis que chaque workflow cible la balise exacte. Il enregistre l'identité immuable du candidat et des outils, ainsi que les identifiants des exécutions lancées, dans `.artifacts/release-candidate/<tag>/release-candidate-state.json` ; la réexécution de la même commande reprend exactement ces exécutions, tandis que toute divergence concernant le candidat, les outils, le profil ou les options provoque un échec sécurisé. Avant de lancer la matrice complète de validation, l'utilitaire génère de manière déterministe le corps exact de la version GitHub correspondant à la balise et refuse un titre de version manquant, un corps dépassant la limite qui ne peut pas utiliser la forme compacte canonique, ou une provenance de base/cible des enregistrements de contributions qui n'est pas accessible depuis la balise. Il valide également toute métadonnée explicite d'exclusion de la référence publiée par rapport aux enregistrements cumulatifs des balises référencées. Il exécute ensuite les contrôles locaux de la version générée, lance ou vérifie les preuves de validation complète de la version et du contrôle préalable npm, exécute les preuves Parallels d'installation neuve et de mise à jour sur l'archive préparée exacte ainsi que la preuve du paquet Telegram, consigne les plans npm et ClawHub des plugins, puis affiche la commande `OpenClaw Release Publish` exacte uniquement lorsque l'ensemble des preuves est au vert.

   `OpenClaw Release Publish` publie en parallèle sur npm les paquets de plugins sélectionnés ou tous ceux pouvant être publiés, ainsi que le même ensemble sur ClawHub, puis promeut l'artefact préparé du contrôle préalable npm d'OpenClaw avec la balise de distribution correspondante dès que la publication npm des plugins réussit. L'extraction de la version reste la racine du produit et des données, tandis que la planification et la vérification finale s'exécutent depuis l'extraction exacte et fiable servant de source au workflow, afin qu'un ancien commit de publication ne puisse pas utiliser silencieusement des outils de publication obsolètes. Avant le démarrage de tout processus enfant de publication, le workflow génère et met en cache le corps exact de la version GitHub. Lorsque la section complète correspondante de `CHANGELOG.md` respecte la limite GitHub de 125 000 caractères et le plafond de sécurité correspondant de 125 000 octets du moteur de rendu, la page contient exactement cette section `## YYYY.M.PATCH`, titre compris. Lorsque la section source ne tient pas, la page conserve les notes éditoriales groupées exactes et remplace l'enregistrement de contributions trop volumineux par un lien stable vers l'enregistrement complet dans le fichier `CHANGELOG.md` épinglé à la balise ; les enregistrements partiels et les puces tronquées ne sont jamais publiés. Le workflow choisit ce corps complet ou compact avant d'ajouter `### Vérification de la version` ; si l'ajout des preuves dépassait la limite, il conserve le corps canonique et s'appuie sur les preuves immuables jointes. Les versions stables publiées sur npm sous `latest` deviennent la dernière version GitHub, tandis que les versions stables de maintenance conservées sous `beta` sur npm sont créées avec GitHub `latest=false`. Le workflow téléverse également dans la version GitHub les preuves du contrôle préalable des dépendances, le manifeste de validation complète et les preuves de vérification du registre après publication afin de faciliter la réponse aux incidents postérieurs à la publication. Il affiche immédiatement les identifiants des exécutions enfants, approuve automatiquement les validations des environnements de publication que le jeton du workflow est autorisé à approuver, résume les jobs enfants ayant échoué avec la fin de leurs journaux, crée d'emblée la page de brouillon de la version GitHub et promeut les ressources Windows et Android parallèlement à la publication npm d'OpenClaw, finalise la page de la version et les preuves relatives aux dépendances dès que ces étapes réussissent, attend ClawHub chaque fois qu'OpenClaw est publié sur npm, puis exécute le vérificateur bêta depuis la version fiable de `main` et téléverse les preuves postérieures à la publication concernant la version GitHub, le paquet npm, les paquets npm de plugins sélectionnés, les paquets ClawHub sélectionnés, les identifiants des exécutions de workflows enfants et l'éventuel identifiant d'exécution NPM Telegram. Le vérificateur d'amorçage de ClawHub exige le chemin et le SHA exacts du workflow provenant de la version fiable de `main`, les tentatives d'exécution du producteur et de l'exécution terminale, le SHA de la version, l'ensemble de paquets demandé, le tuple immuable de l'artefact du paquet et l'artefact de relecture terminale du registre ; une exécution réussie fondée sur une ancienne référence de version n'est pas acceptée.

   Exécutez ensuite l'acceptation du paquet après publication sur le paquet publié `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta`. Si une préversion poussée ou publiée nécessite une correction, créez le numéro de préversion correspondant suivant ; ne supprimez ni ne réécrivez jamais l'ancienne préversion.

10. Pour une version stable, ne continuez qu'une fois que la version bêta ou la version candidate validée dispose des preuves de validation requises. La publication npm stable passe également par `OpenClaw Release Publish`, en réutilisant l'artefact du contrôle préalable réussi au moyen de `preflight_run_id`. La préparation de la version macOS stable exige également la présence sur `main` des fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip` et du fichier `appcast.xml` mis à jour ; le workflow de publication macOS publie automatiquement le flux d'actualisation signé sur la branche publique `main` après vérification des ressources de la version, ou ouvre ou met à jour une PR pour ce flux si la protection de branche bloque le poussage direct. La préparation stable de Windows Hub exige la présence des ressources signées `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` et `OpenClawCompanion-SHA256SUMS.txt` dans la version GitHub d'OpenClaw. Transmettez la balise de version signée exacte de `openclaw/openclaw-windows-node` sous la forme `windows_node_tag` et sa table d'empreintes des programmes d'installation approuvée pour le candidat sous la forme `windows_node_installer_digests` ; `OpenClaw Release Publish` conserve le brouillon de la version, lance `Windows Node Release` et vérifie les trois ressources avant la publication.
11. Après la publication, exécutez le vérificateur npm postérieur à la publication, éventuellement le test E2E Telegram autonome sur la version npm publiée lorsque vous avez besoin d'une preuve du canal après publication, effectuez si nécessaire la promotion de la balise de distribution, vérifiez la page GitHub générée de la version, exécutez les étapes d'annonce de la version, puis terminez la [finalisation stable de `main`](#stable-main-closeout) avant de considérer qu'une version stable est terminée.

## Finalisation stable de `main`

La publication stable n'est pas terminée tant que `main` ne contient pas l'état réel de la version publiée.

1. Partez de la toute dernière version actualisée de `main`. Comparez `release/YYYY.M.PATCH` avec celle-ci et reportez vers l'avant les véritables corrections absentes de `main`. Ne fusionnez pas aveuglément dans une version plus récente de `main` des adaptateurs de compatibilité, de test ou de validation propres à la publication.
2. Définissez `main` sur la version stable publiée, et non sur une hypothétique prochaine série. Exécutez `pnpm release:prep` après la modification de la version racine, puis `pnpm deps:shrinkwrap:generate`.
3. Faites en sorte que la section `## YYYY.M.PATCH` de `CHANGELOG.md` sur `main` corresponde exactement à celle de la branche de publication balisée. Incluez la mise à jour stable de `appcast.xml` lorsque la version macOS en a publié une.
4. N'ajoutez pas `YYYY.M.PATCH+1`, une version bêta ou une section vide de journal des modifications futur à `main` avant que l'opérateur ne démarre explicitement cette série de publication.
5. Exécutez `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` et `OPENCLAW_TESTBOX=1 pnpm check:changed`. Poussez les modifications, puis vérifiez que `origin/main` contient la version publiée et le journal des modifications avant de considérer la version stable comme terminée.
6. Maintenez à jour les variables de dépôt `RELEASE_ROLLBACK_DRILL_ID` et `RELEASE_ROLLBACK_DRILL_DATE` après chaque exercice privé de restauration.

`OpenClaw Stable Main Closeout` démarre à partir du poussage vers `main` qui contient la version publiée, le journal des modifications et le flux d'actualisation après la publication stable. Il lit les preuves immuables postérieures à la publication afin de lier la balise publiée à ses exécutions `Full Release Validation` et `OpenClaw Release Publish`, puis vérifie l'état stable de `main`, la version, la période obligatoire d'observation de la version stable et les preuves bloquantes de performances. Il joint un manifeste de finalisation immuable et sa somme de contrôle à la version GitHub. Le déclenchement automatique lors du poussage ignore les anciennes versions antérieures aux preuves immuables postérieures à la publication et ne considère jamais cet abandon comme une finalisation terminée.

Une finalisation complète exige les deux ressources ainsi qu'une somme de contrôle correspondante. Un manifeste partiel réutilise le SHA de `main` et l'exercice de restauration qu'il a consignés afin de régénérer des octets identiques, puis joint la somme de contrôle manquante ; une paire non valide, ou une somme de contrôle sans manifeste, reste bloquante. Une exécution déclenchée par un poussage sans les variables de dépôt de l'exercice de restauration est ignorée sans terminer la finalisation ; un enregistrement d'exercice manquant ou datant de plus de 90 jours bloque toujours la finalisation manuelle fondée sur des preuves. Les commandes privées de récupération restent dans le guide réservé aux mainteneurs. Utilisez le lancement manuel uniquement pour réparer ou rejouer une finalisation stable fondée sur des preuves.

Une balise corrective d'ancienne version peut réutiliser les preuves du paquet de base uniquement lorsque la balise corrective correspond au même commit source que la balise stable de base. Sa version Android réutilise l'APK vérifié de la balise de base et ajoute la provenance de la balise corrective. Une correction provenant d'une source différente doit publier et vérifier ses propres preuves de paquet et utiliser un `versionCode` Android supérieur.

## Contrôle préalable de la version

- Exécutez `pnpm check:test-types` avant les vérifications préliminaires de publication afin que le code TypeScript des tests reste couvert en dehors du contrôle local plus rapide `pnpm check`.
- Exécutez `pnpm check:architecture` avant les vérifications préliminaires de publication afin que les contrôles plus larges des cycles d’importation et des limites architecturales soient validés en dehors du contrôle local plus rapide.
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le bundle de l’interface de contrôle existent pour l’étape de validation du paquet.
- Exécutez `pnpm release:prep` après l’incrémentation de la version racine et avant la création du tag. Cette commande exécute tous les générateurs déterministes de publication qui divergent couramment après une modification de version, de configuration ou d’API : versions des plugins, fichiers shrinkwrap npm, inventaire des plugins, schéma de configuration de base, métadonnées de configuration des canaux intégrés, référence de la documentation de configuration, exportations du SDK de plugins et référence de l’API du SDK de plugins. `pnpm release:check` réexécute ces contrôles en mode vérification (ainsi qu’un contrôle du budget de surface du SDK de plugins) et signale en une seule passe chaque échec dû à une divergence des fichiers générés avant d’exécuter les contrôles de publication des paquets.
- Par défaut, la synchronisation des versions des plugins met à jour le paquet d’exécution publiable `@openclaw/ai`, les versions des paquets de plugins officiels et les seuils `openclaw.compat.pluginApi` existants vers la version publiée d’OpenClaw. Considérez ce champ comme le seuil minimal de l’API du SDK de plugins et de l’environnement d’exécution, et non comme une simple copie de la version du paquet : pour les publications limitées aux plugins qui restent volontairement compatibles avec d’anciens hôtes OpenClaw, conservez comme seuil la plus ancienne API d’hôte prise en charge et documentez ce choix dans les preuves de publication du plugin.
- Exécutez manuellement le workflow `Full Release Validation` avant d’approuver la publication afin de lancer toutes les plateformes de test de prépublication depuis un point d’entrée unique. Il accepte une branche, un tag ou un SHA de commit complet, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour les tests rapides d’installation, la validation des paquets, les contrôles de paquets sur plusieurs systèmes d’exploitation, la parité du laboratoire d’assurance qualité, ainsi que les parcours Matrix et Telegram. Les exécutions stables et complètes incluent toujours les tests live/E2E exhaustifs et les tests prolongés du parcours de publication Docker ; `run_release_soak=true` est conservé pour demander explicitement un test prolongé de version bêta. La validation des paquets fournit le test E2E Telegram canonique du paquet pendant la validation du candidat, ce qui évite un second processus d’interrogation live simultané.

  Fournissez `release_package_spec` après la publication d’une version bêta pour réutiliser le paquet npm publié dans les contrôles de publication, la validation des paquets et le test E2E Telegram du paquet sans reconstruire l’archive tar de publication. Fournissez `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un paquet publié différent de celui du reste de la validation de publication. Fournissez `package_acceptance_package_spec` lorsque la validation des paquets doit utiliser un paquet publié différent de celui indiqué par la spécification du paquet de publication. Fournissez `evidence_package_spec` lorsque le rapport de preuves de publication doit démontrer que la validation correspond à un paquet npm publié sans imposer le test E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Exécutez manuellement le workflow `Package Acceptance` lorsque vous souhaitez obtenir des preuves parallèles pour un paquet candidat pendant la poursuite des travaux de publication. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche, un tag ou un SHA `package_ref` de confiance avec le banc de test `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS publique accompagnée d’un SHA-256 obligatoire et soumise à une politique stricte d’URL publiques ; `source=trusted-url` pour une politique de source fiable nommée utilisant un `trusted_source_id` et un SHA-256 obligatoires ; ou `source=artifact` pour une archive tar téléversée par une autre exécution de GitHub Actions.

  Le workflow résout le candidat sous la forme `package-under-test`, réutilise l’ordonnanceur de publication E2E Docker avec cette archive tar et peut exécuter l’assurance qualité Telegram avec la même archive tar en utilisant `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les parcours Docker sélectionnés incluent `published-upgrade-survivor`, l’artefact de paquet constitue le candidat et `published_upgrade_survivor_baseline` sélectionne la version de référence publiée. `update-restart-auth` utilise le paquet candidat à la fois comme CLI installée et comme paquet testé, afin d’exercer le parcours de redémarrage géré de la commande de mise à jour du candidat.

  Exemple :

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Profils courants :
  - `smoke` : parcours d’installation, de canal et d’agent, réseau du Gateway et rechargement de la configuration
  - `package` : parcours natifs des artefacts pour les paquets, les mises à jour, les redémarrages et les plugins, sans OpenWebUI ni ClawHub live
  - `product` : profil de paquet complété par les canaux MCP, le nettoyage de Cron et des sous-agents, la recherche web OpenAI et OpenWebUI
  - `full` : segments du parcours de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée

- Exécutez directement et manuellement le workflow `CI` lorsque vous avez uniquement besoin d’une couverture déterministe de l’intégration continue normale pour le candidat à la publication. Les déclenchements manuels de CI ignorent la limitation aux modifications et imposent les fragments Linux Node, les fragments de plugins intégrés, les fragments de contrats de plugins et de canaux, la compatibilité avec Node 22, les contrôles `check-*` et `check-additional-*`, les tests rapides des artefacts compilés, les contrôles de documentation, les Skills Python, Windows, macOS et les parcours d’internationalisation de l’interface de contrôle. Les exécutions manuelles autonomes de CI n’exécutent Android que lorsqu’elles sont déclenchées avec `include_android=true` ; `Full Release Validation` transmet cette entrée à son workflow CI enfant.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cette commande exerce le laboratoire d’assurance qualité à l’aide d’un récepteur OTLP/HTTP local et vérifie l’exportation des traces, des métriques et des journaux, ainsi que la limitation des attributs de trace et la rédaction du contenu et des identifiants, sans nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm qa:otel:collector-smoke` lors de la validation de la compatibilité avec le collecteur. Cette commande achemine la même exportation OTLP du laboratoire d’assurance qualité par un véritable conteneur Docker OpenTelemetry Collector avant les assertions du récepteur local.
- Exécutez `pnpm qa:prometheus:smoke` lors de la validation de la collecte Prometheus protégée. Cette commande exerce le laboratoire d’assurance qualité, rejette les collectes non authentifiées et vérifie que les familles de métriques essentielles à la publication ne contiennent ni contenu des invites, ni identifiants bruts, ni jetons d’authentification, ni chemins locaux.
- Exécutez `pnpm qa:observability:smoke` pour enchaîner les parcours de test rapide OpenTelemetry et Prometheus depuis l’arborescence des sources.
- Exécutez `pnpm release:check` avant chaque publication étiquetée.
- Les vérifications préliminaires de `OpenClaw NPM Release` génèrent les preuves de publication relatives aux dépendances avant l’empaquetage de l’archive tar npm. Le contrôle des vulnérabilités signalées par les avis npm bloque la publication. Les rapports sur les risques du manifeste transitif, la propriété et la surface d’installation des dépendances, ainsi que les modifications des dépendances, servent uniquement de preuves de publication. Le rapport sur les modifications des dépendances compare le candidat à la publication avec le précédent tag de publication accessible. Les vérifications préliminaires téléversent les preuves relatives aux dépendances sous le nom `openclaw-release-dependency-evidence-<tag>` et les incorporent également dans `dependency-evidence/` au sein de l’artefact npm préparé par les vérifications préliminaires. Le parcours de publication réel réutilise cet artefact, puis joint les mêmes preuves à la publication GitHub sous le nom `openclaw-<version>-dependency-evidence.zip`.
- Exécutez `OpenClaw Release Publish` pour la séquence de publication avec modifications une fois le tag créé. Déclenchez les publications bêta et stables ordinaires depuis la branche `main` de confiance ; le tag de publication sélectionne toujours le commit cible exact et peut pointer vers `release/YYYY.M.PATCH`. Les publications alpha de Tideclaw restent sur leur branche alpha correspondante. Transmettez le `preflight_run_id` de l’exécution npm OpenClaw réussie, le `full_release_validation_run_id` réussi et le `full_release_validation_run_attempt` exact, et conservez la portée de publication des plugins par défaut `all-publishable`, sauf si vous effectuez volontairement une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm d’OpenClaw afin que le paquet principal ne soit pas publié avant ses plugins externalisés ; la promotion Windows et Android s’exécute en parallèle de la publication npm principale sur la page de publication à l’état de brouillon. Les réexécutions de publication peuvent reprendre : une version npm principale déjà publiée ignore le déclenchement principal après que le workflow a vérifié que l’archive tar du registre correspond à l’artefact des vérifications préliminaires du tag, et la promotion Windows/Android est ignorée lorsque la publication possède déjà le contrat d’artefacts vérifié ; une nouvelle tentative ne réexécute donc que les étapes ayant échoué. Les réparations ciblées limitées aux plugins nécessitent `plugin_publish_scope=selected` et une liste de plugins non vide. Les exécutions `all-publishable` limitées aux plugins nécessitent des preuves complètes et immuables des vérifications préliminaires et de `Full Release Validation` ; les preuves partielles sont rejetées.
- La version stable de `OpenClaw Release Publish` exige un `windows_node_tag` exact après la création de la publication non préliminaire correspondante de `openclaw/openclaw-windows-node`, ainsi que la table `windows_node_installer_digests` approuvée pour le candidat. Avant de déclencher tout workflow enfant de publication, elle vérifie que la publication source est publiée, qu’elle n’est pas préliminaire, qu’elle contient les programmes d’installation x64/ARM64 requis et qu’elle correspond toujours à cette table approuvée. Elle déclenche ensuite `Windows Node Release` alors que la publication OpenClaw est encore à l’état de brouillon, en transmettant la table figée des condensats des programmes d’installation sans modification. Le workflow enfant télécharge les programmes d’installation signés de Windows Hub depuis ce tag exact, les compare aux condensats figés, vérifie sur un exécuteur Windows que leurs signatures Authenticode utilisent le signataire OpenClaw Foundation attendu, produit un manifeste SHA-256 et téléverse les programmes d’installation ainsi que le manifeste vers la publication GitHub OpenClaw canonique ; il retélécharge ensuite les artefacts promus et vérifie leur présence dans le manifeste ainsi que leurs hachages. Le workflow parent vérifie le contrat actuel des artefacts x64, ARM64 et de sommes de contrôle avant la publication. La récupération directe rejette les noms d’artefacts `OpenClawCompanion-*` inattendus avant de remplacer les artefacts attendus du contrat par les octets figés de la source.

  Ne déclenchez manuellement `Windows Node Release` que pour une récupération, et transmettez toujours un tag exact, jamais `latest`, ainsi que la table JSON explicite `expected_installer_digests` issue de la publication source approuvée. Les liens de téléchargement du site web doivent cibler les URL exactes des artefacts de la publication OpenClaw stable actuelle, ou `releases/latest/download/...` uniquement après avoir vérifié que la redirection GitHub vers la dernière version pointe vers cette même publication ; ne créez pas de lien uniquement vers la page de publication du dépôt compagnon.

- Les vérifications de version s’exécutent désormais dans un workflow manuel distinct : `OpenClaw Release Checks`. Celui-ci exécute également la voie de parité simulée du laboratoire d’assurance qualité, ainsi que le profil Matrix actif rapide et la voie d’assurance qualité Telegram avant l’approbation de la version. Les voies actives utilisent l’environnement `qa-live-shared` ; Telegram utilise également des locations d’identifiants Convex pour l’intégration continue. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` pour obtenir en parallèle l’inventaire complet du transport Matrix, des médias et du chiffrement de bout en bout.
- La validation d’exécution de l’installation et de la mise à niveau sur plusieurs systèmes d’exploitation fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Cette séparation est intentionnelle : elle permet de garder le véritable chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications actives plus lentes restent dans leur propre voie afin de ne pas retarder ni bloquer la publication.
- Les vérifications de version nécessitant des secrets doivent être lancées via `Full Release Validation` ou depuis la référence de workflow `main`/de version, afin que la logique du workflow et les secrets restent contrôlés.
- `OpenClaw Release Checks` accepte une branche, une étiquette ou le SHA complet d’un commit, à condition que le commit résolu soit accessible depuis une branche OpenClaw ou une étiquette de version.
- La prévalidation en mode validation uniquement de `OpenClaw NPM Release` accepte également le SHA complet de 40 caractères du commit actuel de la branche du workflow, sans exiger d’étiquette poussée. Ce chemin par SHA est réservé à la validation et ne peut pas être promu en véritable publication. En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées du paquet ; une véritable publication exige toujours une véritable étiquette de version.
- Les deux workflows conservent le véritable chemin de publication et de promotion sur des exécuteurs hébergés par GitHub, tandis que le chemin de validation non modifiant peut utiliser les exécuteurs Linux Blacksmith de plus grande capacité.
- Ce workflow exécute `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`.
- La prévalidation de publication npm n’attend plus la voie distincte des vérifications de version.
- Avant de créer localement l’étiquette d’une version candidate, exécutez `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L’assistant exécute les garde-fous rapides de version, les vérifications de publication npm/ClawHub des plugins, la compilation, la compilation de l’interface utilisateur et `release:openclaw:npm:check`, dans l’ordre permettant de détecter les erreurs courantes qui bloqueraient l’approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou l’étiquette de préversion/correction correspondante) avant l’approbation.
- Après la publication npm, exécutez `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou la version bêta/de correction correspondante) afin de vérifier le chemin d’installation depuis le registre publié dans un nouveau préfixe temporaire.
- Après la publication d’une version bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` afin de vérifier l’intégration initiale du paquet installé, la configuration de Telegram et un véritable test de bout en bout Telegram sur le paquet npm publié, à l’aide du pool partagé d’identifiants Telegram loués. Pour des exécutions ponctuelles locales, les mainteneurs peuvent omettre les variables Convex et fournir directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter l’intégralité du test rapide post-publication d’une version bêta depuis la machine d’un mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation de mise à jour npm et de cible vierge dans Parallels, lance `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Celui-ci est intentionnellement exclusivement manuel et ne s’exécute pas après chaque fusion.
- L’automatisation des versions pour les mainteneurs utilise une prévalidation suivie d’une promotion :
  - La véritable publication npm doit avoir réussi avec un `preflight_run_id` npm valide.
  - L’orchestration et la prévalidation des publications bêta et stables ordinaires utilisent la branche `main` approuvée avec l’étiquette cible exacte. La publication et la prévalidation alpha de Tideclaw utilisent la branche alpha correspondante.
  - Les versions npm stables ciblent `beta` par défaut ; la publication npm stable peut cibler explicitement `latest` au moyen d’une entrée du workflow.
  - La modification des étiquettes de distribution npm fondée sur un jeton se trouve dans `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, car `npm dist-tag add` exige toujours `NPM_TOKEN`, tandis que le dépôt source conserve une publication reposant exclusivement sur OIDC.
  - Le workflow public `macOS Release` est réservé à la validation ; lorsqu’une étiquette n’existe que sur une branche de version mais que le workflow est lancé depuis `main`, définissez `public_release_branch=release/YYYY.M.PATCH`.
  - La véritable publication macOS doit avoir réussi avec un `preflight_run_id` et un `validate_run_id` macOS valides.
  - Les véritables chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire.
- Pour les versions correctives stables telles que `YYYY.M.PATCH-N`, le vérificateur post-publication contrôle également le même chemin de mise à niveau dans un préfixe temporaire, de `YYYY.M.PATCH` vers `YYYY.M.PATCH-N`, afin qu’une correction de version ne puisse pas laisser silencieusement d’anciennes installations globales sur le contenu stable de base.
- La prévalidation de publication npm échoue de manière sûre si l’archive ne contient pas à la fois `dist/control-ui/index.html` et un contenu non vide dans `dist/control-ui/assets/`, afin d’éviter de distribuer à nouveau un tableau de bord web vide.
- La vérification post-publication contrôle également que les points d’entrée des plugins publiés et les métadonnées du paquet sont présents dans l’arborescence installée depuis le registre. Une version dépourvue de contenus d’exécution de plugin échoue dans le vérificateur post-publication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique également la limite `unpackedSize` de l’archive npm au paquet candidat à la mise à jour, afin que le test de bout en bout du programme d’installation détecte tout gonflement accidentel du paquet avant le chemin de publication de la version.
- Si le travail de version a modifié la planification de l’intégration continue, les manifestes de durée des extensions ou les matrices de tests des extensions, régénérez et examinez avant approbation les sorties de matrice `plugin-prerelease-extension-shard`, gérées par le planificateur, depuis `.github/workflows/plugin-prerelease.yml`, afin que les notes de version ne décrivent pas une organisation obsolète de l’intégration continue.
- La préparation d’une version stable de macOS inclut également les surfaces de mise à jour : la version GitHub doit finalement contenir les paquets `.zip`, `.dmg` et `.dSYM.zip` ; après la publication, `appcast.xml` sur `main` doit pointer vers la nouvelle archive zip stable (le workflow de publication macOS la valide automatiquement ou ouvre une demande d’intégration pour l’appcast si la poussée directe est bloquée) ; l’application empaquetée doit conserver un identifiant de paquet hors débogage, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au seuil canonique de compilation Sparkle pour cette version.

## Environnements de test de version

`Full Release Validation` permet aux opérateurs de lancer tous les tests préalables à une version depuis un point d’entrée unique. Pour fournir une preuve liée à un commit précis sur une branche évoluant rapidement, utilisez l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée à un SHA de workflow `main` approuvé, tandis que le commit demandé reste le candidat testé :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant récupère la version actuelle de `origin/main`, pousse `release-ci/<workflow-sha>-...` sur ce commit de workflow approuvé, lance `Full Release Validation` depuis la branche temporaire avec `ref=<target-sha>`, réutilise les preuves strictes correspondant exactement à la cible lorsqu’elles sont disponibles, vérifie que le `headSha` de chaque workflow enfant correspond au SHA du workflow parent fixé, puis supprime la branche temporaire. Fournissez `-f reuse_evidence=false` pour imposer une nouvelle exécution ou `--workflow-sha <trusted-main-sha>` pour fixer un commit plus ancien encore accessible depuis la version actuelle de `origin/main`. Le workflow lui-même n’écrit jamais de références dans le dépôt. Cela permet de conserver les outils de version réservés à `main` sans ajouter de commits d’outillage au candidat et évite de valider accidentellement une exécution enfant provenant d’une version plus récente de `main`.

Pour valider une branche ou une étiquette de version, exécutez le workflow depuis la référence de workflow `main` approuvée et transmettez la branche ou l’étiquette de version dans `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Le workflow résout la référence cible, lance manuellement `CI` avec `target_ref=<release-ref>`, puis lance `OpenClaw Release Checks`. `OpenClaw Release Checks` répartit les tests rapides d’installation, les vérifications de version sur plusieurs systèmes d’exploitation, la couverture active/de bout en bout avec Docker du chemin de version lorsque l’endurance est activée, l’acceptation du paquet avec le test de bout en bout canonique du paquet Telegram, la parité du laboratoire d’assurance qualité, Matrix en conditions réelles et Telegram en conditions réelles. Une exécution complète/totale n’est acceptable que lorsque le résumé de `Full Release Validation` indique la réussite de `normal_ci`, `plugin_prerelease` et `release_checks`, sauf si une réexécution ciblée a intentionnellement ignoré l’enfant distinct `Plugin Prerelease`. Utilisez l’enfant autonome `npm-telegram` uniquement pour une réexécution ciblée du paquet publié avec `release_package_spec` ou `npm_telegram_package_spec`. Le résumé final du vérificateur inclut des tableaux des tâches les plus lentes pour chaque exécution enfant, afin que le responsable de version puisse identifier le chemin critique actuel sans télécharger les journaux.

Dans ce chemin de version, l’enfant consacré aux performances du produit produit uniquement des artefacts. Le
workflow englobant le lance avec `publish_reports=false`, et la validation est refusée
si son garde-fou propre au mode artefact ne prouve pas que l’outil de publication des rapports Clawgrit est resté
ignoré.

Consultez [Validation complète d’une version](/fr/reference/full-release-validation) pour connaître la matrice complète des étapes, les noms exacts des tâches de workflow, les différences entre les profils stable et complet, les artefacts et les paramètres de réexécution ciblée.

Les workflows enfants sont lancés depuis la référence approuvée qui exécute `Full Release Validation`, normalement `--ref main`, même lorsque la référence cible `ref` pointe vers une branche ou une étiquette de version plus ancienne. Chaque exécution enfant doit utiliser le SHA exact du workflow parent ; si `main` avance avant la résolution du lancement d’un enfant, le workflow englobant échoue de manière sûre. Il n’existe aucune entrée distincte de référence de workflow pour Full Release Validation ; sélectionnez le dispositif approuvé en choisissant la référence d’exécution du workflow. N’utilisez pas `--ref main -f ref=<sha>` pour fournir une preuve exacte d’un commit sur une branche `main` évolutive ; les SHA de commit bruts ne peuvent pas servir de références de lancement de workflow. Utilisez donc `pnpm ci:full-release --sha <target-sha>` afin de créer une branche temporaire sur la version approuvée de `origin/main`, tout en conservant le SHA cible comme entrée candidate.

Utilisez `release_profile` pour sélectionner l’étendue des vérifications actives et des fournisseurs :

- `minimum` : chemin actif et Docker OpenAI/cœur le plus rapide, essentiel à la version
- `stable` : profil minimal complété par la couverture stable des fournisseurs et systèmes dorsaux nécessaire à l’approbation de la version
- `full` : profil stable complété par une large couverture consultative des fournisseurs et médias

Les validations stable et complète exécutent toujours, avant la promotion, la série exhaustive de vérifications actives/de bout en bout, du chemin de version Docker et des mises à niveau publiées survivantes dans des limites définies. Utilisez `run_release_soak=true` pour demander cette même série pour une version bêta. Cette série couvre les quatre derniers paquets stables, ainsi que les références fixes `2026.4.23` et `2026.5.2` et l’ancienne couverture `2026.4.15`, en supprimant les références en double et en répartissant chaque référence dans sa propre tâche d’exécution Docker.

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre une seule fois la référence cible sous forme de `release-package-under-test`, puis réutilise cet artefact pour les vérifications sur plusieurs systèmes d’exploitation, l’acceptation du paquet et les vérifications Docker du chemin de version lorsque l’endurance est exécutée. Tous les environnements traitant le paquet utilisent ainsi exactement les mêmes octets et les compilations répétées du paquet sont évitées. Lorsqu’une version bêta est déjà disponible sur npm, définissez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` afin que les vérifications de version téléchargent une seule fois le paquet distribué, extraient son SHA de source de compilation depuis `dist/build-info.json`, puis réutilisent cet artefact pour les voies sur plusieurs systèmes d’exploitation, d’acceptation du paquet, du chemin de version Docker et du paquet Telegram.

Le test rapide d’installation OpenAI sur plusieurs systèmes d’exploitation utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable du dépôt ou de l’organisation est définie, sinon `openai/gpt-5.6-luna`, car cette voie vise à prouver l’installation du paquet, l’intégration initiale, le démarrage du Gateway et l’exécution d’un tour d’agent en conditions réelles, plutôt qu’à évaluer le modèle le plus performant. La matrice plus large des fournisseurs en conditions réelles reste l’emplacement destiné à la couverture propre aux modèles.

Utilisez les variantes suivantes selon l’étape de la version :

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

# Après la publication d'une bêta, ajouter l'E2E Telegram du paquet publié.
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

N'utilisez pas l'ensemble complet comme première réexécution après une correction ciblée. Si une boîte échoue, utilisez le workflow enfant, la tâche, le parcours Docker, le profil de paquet, le fournisseur de modèle ou le parcours d'assurance qualité en échec pour la preuve suivante. Ne réexécutez l'ensemble complet que si la correction a modifié l'orchestration partagée de la publication ou rendu obsolètes les preuves antérieures de toutes les boîtes. Le vérificateur final de l'ensemble revérifie les identifiants d'exécution enregistrés des workflows enfants ; après la réexécution réussie d'un workflow enfant, ne réexécutez donc que la tâche parente `Verify full validation` qui avait échoué.

`rerun_group=all` ne peut réutiliser une exécution antérieure réussie de l'ensemble que si elle a validé exactement le même SHA cible, le même profil de publication, le même réglage effectif de test prolongé et les mêmes entrées de validation. Il s'agit d'une récupération limitée pour réexécuter le même candidat, et non d'une réutilisation de preuves entre différents SHA. Pour un candidat modifié, y compris par un commit limité au journal des modifications ou à la version, réexécutez chaque contrôle de paquet, d'artefact, d'installation, Docker ou de fournisseur affecté par les chemins modifiés ou les hachages d'artefacts. Les nouvelles exécutions de l'ensemble pour la même référence `release/*` et le même groupe de réexécution remplacent automatiquement celles qui sont en cours. Passez `reuse_evidence=false` pour forcer une nouvelle exécution complète.

Pour une récupération limitée, passez `rerun_group` à l'ensemble. `all` correspond à la véritable exécution du candidat à la publication, `ci` exécute uniquement l'enfant CI normal, `plugin-prerelease` exécute uniquement l'enfant Plugin réservé à la publication, `release-checks` exécute toutes les boîtes de publication, et les groupes de publication plus restreints sont `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`. Les réexécutions ciblées de `npm-telegram` nécessitent `release_package_spec` ou `npm_telegram_package_spec` ; les exécutions complètes ou `all` utilisent l'E2E Telegram canonique du paquet dans Package Acceptance. Les réexécutions ciblées multiplateformes peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou un autre filtre de système d'exploitation ou de suite. Les échecs des contrôles de publication d'assurance qualité bloquent la validation normale de la publication, notamment la dérive requise des outils dynamiques OpenClaw dans le niveau standard. Les exécutions alpha de Tideclaw peuvent néanmoins considérer comme indicatifs les parcours de contrôle de publication sans rapport avec la sûreté des paquets. Avec `release_profile=beta`, les suites de fournisseurs réels de `Run repo/live E2E validation` sont indicatives : elles produisent des avertissements sans bloquer. Les profils stable et complet restent bloquants. Lorsque `live_suite_filter` demande explicitement un parcours d'assurance qualité en conditions réelles soumis à activation, tel que Discord, WhatsApp ou Slack, la variable de dépôt `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon, la capture des entrées échoue au lieu d'ignorer silencieusement le parcours.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne volontairement le filtrage selon les modifications et force le graphe de tests normal pour le candidat à la publication : fragments Linux Node, fragments des Plugins intégrés, fragments de contrats des Plugins et des canaux, compatibilité Node 22, `check-*`, `check-additional-*`, vérifications rapides des artefacts compilés, vérifications de la documentation, Skills Python, Windows, macOS et internationalisation de l'interface de contrôle. Android est inclus lorsque `Full Release Validation` exécute la boîte, car l'ensemble passe `include_android=true` ; la CI manuelle autonome nécessite `include_android=true` pour couvrir Android.

Utilisez cette boîte pour répondre à la question « l'arborescence des sources a-t-elle réussi l'intégralité de la suite de tests normale ? ». Elle ne remplace pas la validation du produit sur le parcours de publication. Preuves à conserver :

- le récapitulatif de `Full Release Validation` affichant l'URL de l'exécution `CI` lancée ;
- l'exécution `CI` réussie sur le SHA cible exact ;
- les noms des fragments en échec ou lents dans les tâches CI lors de l'analyse des régressions ;
- les artefacts de durée Vitest, tels que `.artifacts/vitest-shard-timings.json`, lorsqu'une exécution nécessite une analyse des performances.

Exécutez directement la CI manuelle uniquement lorsque la publication nécessite une CI normale déterministe, mais pas les boîtes Docker, QA Lab, en conditions réelles, multiplateformes ou de paquet. Utilisez la première commande pour une CI directe sans Android. Ajoutez `include_android=true` lorsque la CI directe du candidat à la publication doit couvrir Android :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` via `openclaw-live-and-e2e-checks-reusable.yml`, en plus du workflow `install-smoke` en mode publication. Elle valide le candidat à la publication dans des environnements Docker empaquetés, plutôt qu'uniquement au moyen de tests au niveau des sources.

La couverture Docker de la publication comprend :

- une vérification rapide d'installation complète avec activation de la vérification lente de l'installation globale avec Bun ;
- la préparation ou la réutilisation de l'image de vérification rapide du Dockerfile racine selon le SHA cible, avec les tâches QR, racine/Gateway et programme d'installation/Bun exécutées comme fragments distincts d'`install-smoke` ;
- les parcours E2E du dépôt ;
- les segments Docker du parcours de publication : `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` à `plugins-runtime-install-h` et `openwebui` ;
- la couverture OpenWebUI sur un exécuteur dédié disposant d'un disque de grande capacité lorsqu'elle est demandée ;
- les parcours fractionnés d'installation et de désinstallation des Plugins intégrés, de `bundled-plugin-install-uninstall-0` à `bundled-plugin-install-uninstall-23` ;
- les suites de fournisseurs en conditions réelles/E2E et la couverture Docker des modèles réels lorsque les contrôles de publication incluent les suites en conditions réelles.

Utilisez les artefacts Docker avant toute réexécution. Le planificateur du parcours de publication téléverse `.artifacts/docker-tests/`, qui contient les journaux des parcours, `summary.json`, `failures.json`, les durées des phases, le plan JSON du planificateur et les commandes de réexécution. Pour une récupération ciblée, utilisez `docker_lanes=<lane[,lane]>` dans le workflow réutilisable en conditions réelles/E2E au lieu de réexécuter tous les segments de publication. Les commandes de réexécution générées incluent le précédent `package_artifact_run_id` et les entrées des images Docker préparées lorsqu'elles sont disponibles, afin qu'un parcours en échec puisse réutiliser la même archive et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. Il s'agit du contrôle de publication portant sur le comportement agentique et les canaux, distinct de Vitest et des mécanismes de paquet Docker.

La couverture QA Lab de la publication comprend :

- un parcours de parité simulé comparant le parcours candidat OpenAI à la référence `anthropic/claude-opus-4-8` à l'aide du jeu de tests de parité agentique ;
- un profil rapide d'assurance qualité Matrix en conditions réelles utilisant l'environnement `qa-live-shared` ;
- un parcours d'assurance qualité Telegram en conditions réelles utilisant des locations d'identifiants CI Convex ;
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite.

Utilisez cette boîte pour répondre à la question « la publication se comporte-t-elle correctement dans les scénarios d'assurance qualité et les flux de canaux en conditions réelles ? ». Conservez les URL des artefacts des parcours de parité, Matrix et Telegram lors de l'approbation de la publication. La couverture Matrix complète reste disponible sous forme d'une exécution QA Lab manuelle et fragmentée, plutôt que comme parcours critique par défaut pour la publication.

### Paquet

La boîte Paquet constitue le contrôle du produit installable. Elle repose sur `Package Acceptance` et le résolveur `scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un candidat sous forme d'archive `package-under-test` consommée par l'E2E Docker, valide l'inventaire du paquet, enregistre sa version et son SHA-256, et maintient la référence du banc d'essai du workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw précise ;
- `source=ref` : empaqueter une branche, une étiquette ou un SHA de commit complet fiable défini par `package_ref`, avec le banc d'essai `workflow_ref` sélectionné ;
- `source=url` : télécharger une archive `.tgz` HTTPS publique avec le `package_sha256` obligatoire ; les identifiants dans l'URL, les ports HTTPS non standard, les noms d'hôtes ou adresses résolues privés, internes ou réservés à un usage spécial, ainsi que les redirections non sûres, sont refusés ;
- `source=trusted-url` : télécharger une archive `.tgz` HTTPS avec les champs obligatoires `package_sha256` et `trusted_source_id` depuis une politique nommée dans `.github/package-trusted-sources.json` ; utilisez cette option pour les miroirs d'entreprise gérés par les mainteneurs ou les dépôts de paquets privés, au lieu d'ajouter à `source=url` un contournement des réseaux privés au niveau des entrées ;
- `source=artifact` : réutiliser une archive `.tgz` téléversée par une autre exécution GitHub Actions.

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l'artefact du paquet de publication préparé, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance conserve, sur la même archive résolue, la migration, la mise à jour, la mise à niveau des VPS gérés par le compte racine, le redémarrage après mise à jour avec authentification configurée, l'installation en conditions réelles de Skills ClawHub, le nettoyage des dépendances obsolètes des Plugins, les données de test des Plugins hors ligne, la mise à jour des Plugins, le renforcement contre l'échappement des liaisons de commandes des Plugins et l'assurance qualité Telegram du paquet. Les contrôles de publication bloquants utilisent par défaut le dernier paquet publié comme référence ; le profil bêta avec `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` étend le balayage de survie aux mises à niveau depuis les versions publiées à `last-stable-4`, ainsi qu'aux références épinglées `2026.4.23`, `2026.5.2` et `2026.4.15`, avec des scénarios `reported-issues`. Utilisez Package Acceptance avec `source=npm` pour un candidat déjà publié, `source=ref` pour une archive npm locale adossée à un SHA avant publication, `source=trusted-url` pour un miroir d'entreprise ou privé géré par les mainteneurs, ou `source=artifact` pour une archive préparée téléversée par une autre exécution GitHub Actions.

Il remplace nativement dans GitHub la plupart des validations de paquet et de mise à jour qui nécessitaient auparavant Parallels. Les contrôles de publication multiplateformes restent importants pour l'intégration initiale, le programme d'installation et les comportements propres aux plateformes, mais la validation du produit pour les paquets et les mises à jour doit privilégier Package Acceptance.

La liste de contrôle canonique pour la validation des mises à jour et des Plugins est [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la pour déterminer quel parcours local, Docker, Package Acceptance ou de contrôle de publication prouve une installation ou une mise à jour de Plugin, un nettoyage par doctor ou une modification de migration d'un paquet publié. La migration exhaustive des mises à jour publiées depuis chaque paquet stable `2026.4.23+` relève d'un workflow manuel `Update Migration` distinct et ne fait pas partie de la CI complète de publication.

La tolérance historique de Package Acceptance est volontairement limitée dans le temps. Les paquets jusqu'à `2026.4.25` peuvent utiliser le parcours de compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées privées de l'inventaire d'assurance qualité absentes de l'archive, absence de `gateway install --wrapper`, fichiers de correctifs absents de l'environnement de test Git dérivé de l'archive, absence de persistance de `update.channel`, anciens emplacements des enregistrements d'installation des Plugins, absence de persistance des enregistrements d'installation de la place de marché et migration des métadonnées de configuration pendant `plugins update`. Le paquet publié `2026.4.26` peut émettre un avertissement pour les fichiers d'empreinte des métadonnées de compilation locale qui ont déjà été publiés. Les paquets ultérieurs doivent respecter les contrats modernes des paquets ; ces mêmes lacunes font échouer la validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication porte sur un véritable paquet installable :

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

- `smoke` : parcours rapides d’installation du paquet, des canaux et de l’agent, du réseau du Gateway et du rechargement de la configuration
- `package` : contrats d’installation, de mise à jour et de redémarrage des paquets de Plugins, avec preuve en conditions réelles de l’installation d’une Skill ClawHub ; il s’agit de la valeur par défaut des vérifications de publication
- `product` : `package`, plus les canaux MCP, le nettoyage des tâches cron et des sous-agents, la recherche web OpenAI et OpenWebUI
- `full` : blocs du chemin de publication Docker avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour des réexécutions ciblées

Pour la preuve Telegram d’un paquet candidat, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tar `package-under-test` résolue au parcours Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les vérifications postérieures à la publication.

## Automatisation de la publication régulière

Pour la publication bêta, `latest`, des Plugins, de la GitHub Release et des plateformes,
`OpenClaw Release Publish` est le point d’entrée normal qui effectue les modifications. Le chemin
mensuel `.33+`, réservé à npm et à la version stable étendue, n’utilise pas cet orchestrateur. Le
workflow régulier orchestre les workflows de publication de confiance dans l’ordre requis par la
publication :

1. Extraire le tag de publication et résoudre le SHA de son commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*` (ou depuis une branche alpha Tideclaw pour les préversions alpha).
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de publication, le dist-tag npm et le `preflight_run_id` enregistré, après avoir vérifié le `full_release_validation_run_id` enregistré et la tentative d’exécution exacte.
7. Pour les versions stables, créer ou mettre à jour la publication GitHub comme brouillon, déclencher `Windows Node Release` avec le `windows_node_tag` explicite et les `windows_node_installer_digests` approuvés pour le candidat, puis vérifier les ressources canoniques de l’installateur Windows et de ses sommes de contrôle. Déclencher également `Android Release` afin de compiler l’APK signé correspondant exactement au tag, avec sa somme de contrôle et sa provenance. Vérifier les deux contrats de ressources natives avant de publier le brouillon.

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

N’utilisez les workflows de plus bas niveau `Plugin NPM Release` et `Plugin ClawHub Release` que pour des réparations ou republications ciblées. `OpenClaw Release Publish` rejette `plugin_publish_scope=selected` lorsque `publish_openclaw_npm=true`, afin que le paquet principal ne puisse pas être publié sans tous les Plugins officiels publiables, y compris `@openclaw/diffs-language-pack`. Pour réparer un Plugin sélectionné, définissez `publish_openclaw_npm=false` avec `plugin_publish_scope=selected` et `plugins=@openclaw/name`, ou déclenchez directement le workflow enfant.

L’amorçage ClawHub lors d’une première publication constitue l’exception : déclenchez `Plugin ClawHub New`
depuis la branche `main` de confiance et transmettez le SHA complet de la publication cible au moyen de `ref`.
N’exécutez jamais le workflow d’amorçage lui-même depuis le tag ou la branche de publication :

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validation préalable au tag exige `dry_run=true`, rejette les entrées correspondant à un tag de publication
ou à une exécution parente, et accepte uniquement une cible exacte accessible depuis `main` ou `release/*`.
Elle ne charge pas les identifiants ClawHub, ne publie aucun octet de paquet et ne modifie pas la configuration
de publication de confiance. Le workflow résout néanmoins le plan du registre en conditions réelles,
extrait et empaquette la cible uniquement dans une tâche sans secrets, matérialise la chaîne d’outils
ClawHub verrouillée, puis valide l’artefact immuable ainsi que le slug et l’identité du paquet avant
l’existence du tag de publication. N’approuvez l’environnement
`clawhub-plugin-bootstrap` qu’après la fin des tâches d’empaquetage sans secrets ;
cette tâche de validation protégée ne possède aucun identifiant ni aucune commande de modification.

Une simulation approuvée ou un amorçage réel après la création du tag doit inclure le tag de publication
exact ainsi que l’identifiant, la tentative et la branche de l’exécution parente `OpenClaw Release Publish`.
Le parent atteste le SHA de son propre workflow et un SHA exact distinct de la branche `main` de confiance
pour `Plugin ClawHub New` ; l’exécution enfant et chaque approbation d’environnement protégé doivent
correspondre à ce SHA enfant approuvé. Le tag de publication est revérifié avant chaque tentative
de publication et chaque modification de la configuration de publication de confiance.

La tâche d’empaquetage
téléverse un artefact immuable unique dont le nom, l’identifiant et le condensat de l’artefact Actions,
l’exécution et la tentative de production, le SHA cible, ainsi que le SHA-256 et la taille de l’archive tar de
chaque paquet sont transmis aux tâches de validation et aux tâches protégées. La tâche protégée extrait
uniquement les outils de la branche `main` de confiance, valide le tuple de l’artefact au moyen de l’API GitHub,
le télécharge à partir de son identifiant d’artefact exact, recalcule le hachage de chaque archive tar et valide
les chemins TAR locaux ainsi que l’identité du paquet selon les règles de canonicalisation USTAR de la CLI
épinglée. Chaque candidat passe ensuite la simulation de publication de la CLI épinglée, qui retourne avant
toute recherche dans le registre ou toute authentification. Le préfiltre de la tâche disposant d’identifiants
limite les ClawPacks compressés à 120 Mio, la charge utile totale des fichiers à 50 Mio, les données TAR
décompressées à 64 Mio et le nombre d’entrées TAR à 10 000. La réparation de la publication de confiance
d’un paquet existant reste limitée à la configuration, mais elle empaquette néanmoins la cible et exige
l’égalité exacte du tag demandé, des octets du registre et des métadonnées avant de modifier la configuration
de publication de confiance. La vérification postérieure à la publication télécharge l’artefact ClawHub et
exige les mêmes SHA-256 et taille. Une récupération par réexécution des seules tâches ayant échoué peut
réutiliser l’artefact de paquet d’une tentative antérieure uniquement si la tâche de production exacte s’est
terminée avec succès. Les preuves finales lient également la version ClawHub verrouillée, le SHA-256 du
verrou et l’intégrité npm. Toute différence exige une nouvelle version du paquet.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de publication obligatoire, par exemple `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1` ; lorsque `preflight_only=true`, il peut également s’agir du SHA complet à 40 caractères du commit actuel de la branche du workflow, uniquement pour la prévalidation
- `preflight_only` : `true` pour la validation, la compilation et l’empaquetage uniquement, `false` pour le chemin de publication réel
- `preflight_run_id` : identifiant d’une prévalidation existante réussie, obligatoire sur le chemin de publication réel afin que le workflow réutilise l’archive tar préparée au lieu de la reconstruire
- `full_release_validation_run_id` : identifiant d’une exécution réussie de `Full Release Validation` pour ce tag ou SHA, obligatoire pour une publication réelle. Les publications bêta peuvent se poursuivre avec la seule prévalidation, accompagnée d’un avertissement, mais la promotion stable ou vers `latest` l’exige toujours.
- `full_release_validation_run_attempt` : tentative d’exécution positive exacte associée à `full_release_validation_run_id` ; obligatoire chaque fois que l’identifiant d’exécution est fourni, afin que les réexécutions ne puissent pas modifier les preuves d’autorisation pendant la publication.
- `release_publish_run_id` : identifiant d’une exécution approuvée de `OpenClaw Release Publish` ; obligatoire lorsque ce workflow est déclenché par ce parent, pour les appels de publication réelle effectués par un acteur automatisé
- `plugin_npm_run_id` : identifiant d’une exécution réussie de `Plugin NPM Release` correspondant exactement à la révision de tête ; obligatoire pour une publication réelle du paquet principal `extended-stable`
- `npm_dist_tag` : tag npm cible du chemin de publication ; accepte `alpha`, `beta`, `latest` ou `extended-stable` et utilise `beta` par défaut. Le correctif final `33` et les suivants doivent utiliser `extended-stable` ; par défaut, `extended-stable` rejette les correctifs antérieurs et rejette toujours les tags non finaux.
- `bypass_extended_stable_guard` : booléen réservé aux tests, `false` par défaut ; avec `npm_dist_tag=extended-stable`, contourne les critères mensuels d’admissibilité à la version stable étendue tout en conservant les vérifications d’identité de publication, d’artefact, d’approbation et de relecture.

`Plugin NPM Release` accepte `npm_dist_tag=default` pour le comportement de publication
existant ou `npm_dist_tag=extended-stable` pour le chemin mensuel protégé. L’option
de version stable étendue exige `publish_scope=all-publishable`, une entrée
`plugins` vide, un correctif final supérieur ou égal à `33`, et la branche canonique
`extended-stable/YYYY.M.33` exactement à son extrémité. Elle ne déplace jamais les tags
`latest` ou `beta` des Plugins. Les nouvelles versions des paquets reçoivent
`extended-stable` de manière atomique au moyen de la publication de confiance OIDC
(`npm publish --tag extended-stable`) ; ce workflow source n’utilise pas
`npm dist-tag add` avec une authentification par jeton. Les nouvelles tentatives
ignorent les versions exactes déjà présentes dans npm, puis échouent de manière sûre
si une relecture complète ne confirme pas que chaque paquet exact et le tag
`extended-stable` ont convergé.

`OpenClaw Release Publish` accepte les entrées contrôlées par l’opérateur suivantes :

- `tag` : tag de publication obligatoire ; il doit déjà exister
- `preflight_run_id` : identifiant d’une prévalidation réussie de `OpenClaw NPM Release` ; obligatoire lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id` : identifiant d’une exécution réussie de `Full Release Validation` ; obligatoire lorsque `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt` : tentative positive exacte associée à `full_release_validation_run_id` ; obligatoire chaque fois que l’identifiant d’exécution est fourni
- `windows_node_tag` : tag de publication exact, hors préversion, de `openclaw/openclaw-windows-node` ; obligatoire pour une publication stable d’OpenClaw
- `windows_node_installer_digests` : objet JSON compact, approuvé pour le candidat, associant les noms actuels des installateurs Windows à leurs condensats `sha256:` épinglés ; obligatoire pour une publication stable d’OpenClaw
- `npm_telegram_run_id` : identifiant facultatif d’une exécution réussie de `NPM Telegram Beta E2E` à inclure dans les preuves finales de publication
- `npm_dist_tag` : tag npm cible du paquet OpenClaw, parmi `alpha`, `beta` ou `latest`
- `plugin_publish_scope` : utilise `all-publishable` par défaut ; utilisez `selected` uniquement pour une réparation ciblée limitée aux Plugins avec `publish_openclaw_npm=false`
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque `plugin_publish_scope=selected`
- `publish_openclaw_npm` : utilise `true` par défaut ; définissez-le sur `false` uniquement lorsque le workflow sert d’orchestrateur de réparation limitée aux Plugins
- `release_profile` : profil de couverture de publication utilisé pour les résumés des preuves de publication ; utilise `from-validation` par défaut, qui le lit depuis le manifeste de validation, ou peut être remplacé par `beta`, `stable` ou `full`
- `wait_for_clawhub` : utilise `false` par défaut afin que la disponibilité npm ne soit pas bloquée par le processus auxiliaire ClawHub ; définissez-le sur `true` uniquement lorsque l’achèvement du workflow doit inclure celui de ClawHub

`OpenClaw Release Checks` accepte les entrées contrôlées par l’opérateur suivantes :

- `ref` : branche, tag ou SHA complet de commit à valider. Les vérifications utilisant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un tag de publication.
- `run_release_soak` : active les tests prolongés exhaustifs en conditions réelles et E2E, du chemin de publication Docker et de la survie aux mises à niveau depuis toutes les versions pour les vérifications de publication bêta. Cette option est activée de force par `release_profile=stable` et `release_profile=full`.

Règles :

- Les versions finales et correctives ordinaires dont le numéro de correctif est inférieur à `33` peuvent être publiées sous `beta` ou `latest`. Les versions finales dont le numéro de correctif est supérieur ou égal à `33` doivent être publiées sous `extended-stable`, et les versions dotées d’un suffixe correctif à cette limite sont rejetées.
- Les balises de préversion bêta peuvent être publiées uniquement sous `beta` ; les balises de préversion alpha peuvent être publiées uniquement sous `alpha`
- Pour `OpenClaw NPM Release`, la saisie du SHA complet du commit est autorisée uniquement lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` servent toujours uniquement à la validation
- Le véritable processus de publication doit utiliser le même `npm_dist_tag` que lors de la vérification préalable ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence ordinaire de publication stable bêta/latest

Cette séquence historique concerne la publication orchestrée ordinaire, qui gère également les plugins, la publication GitHub, Windows et les autres plateformes. Il ne s’agit pas du processus mensuel `.33+` de publication `extended-stable` réservé à npm, documenté en haut de cette page.

Lors de la préparation d’une publication stable orchestrée ordinaire :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant la création d’une balise, vous pouvez utiliser le SHA complet du commit actuel de la branche du workflow pour une simulation de validation du workflow de vérification préalable, sans publication.
2. Choisissez `npm_dist_tag=beta` pour le processus normal commençant par la bêta, ou `latest` uniquement si vous souhaitez intentionnellement publier directement une version stable.
3. Exécutez `Full Release Validation` sur la branche de publication, la balise de publication ou le SHA complet du commit lorsque vous souhaitez bénéficier, à partir d’un seul workflow manuel, de la CI normale ainsi que de la couverture du cache d’invites en conditions réelles, de Docker, du laboratoire d’assurance qualité, de Matrix et de Telegram. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt manuellement le workflow `CI` sur la référence de publication.
4. Sélectionnez la balise de publication `openclaw/openclaw-windows-node` exacte, hors préversion, dont les programmes d’installation signés x64 et ARM64 doivent être distribués. Enregistrez-la sous `windows_node_tag`, puis enregistrez la table validée de leurs condensats sous `windows_node_installer_digests`. L’outil de préparation de la version candidate enregistre les deux et les inclut dans la commande de publication qu’il génère.
5. Enregistrez les valeurs `preflight_run_id`, `full_release_validation_run_id` et la valeur exacte de `full_release_validation_run_attempt` correspondant à l’exécution réussie.
6. Exécutez `OpenClaw Release Publish` depuis une branche `main` de confiance avec le même `tag`, le même `npm_dist_tag`, le `windows_node_tag` sélectionné, la valeur enregistrée de `windows_node_installer_digests`, ainsi que les valeurs enregistrées de `preflight_run_id`, `full_release_validation_run_id` et `full_release_validation_run_attempt`. Ce workflow publie les plugins externalisés sur npm et ClawHub avant de promouvoir le paquet npm OpenClaw.
7. Si la publication a été effectuée sous `beta`, utilisez le workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`.
8. Si la publication a été intentionnellement effectuée directement sous `latest` et que `beta` doit immédiatement pointer vers la même version stable, utilisez ce même workflow de publication pour faire pointer les deux balises de distribution vers la version stable, ou laissez sa synchronisation d’autoréparation planifiée déplacer `beta` ultérieurement.

La modification des balises de distribution réside dans le dépôt du registre des publications, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt source utilise exclusivement OIDC pour la publication. Ainsi, le processus de publication directe et celui de promotion commençant par la bêta restent tous deux documentés et visibles pour les opérateurs.

Si une personne chargée de la maintenance doit se rabattre sur une authentification npm locale, exécutez toutes les commandes de la CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas directement `op` depuis le shell principal de l’agent ; son exécution dans tmux rend les invites, les alertes et la gestion des mots de passe à usage unique observables, et évite les alertes répétées de l’hôte.

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

Les personnes chargées de la maintenance utilisent la documentation privée relative aux publications dans [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) comme procédure opérationnelle réelle.

## Contenu associé

- [Canaux de publication](/fr/install/development-channels)

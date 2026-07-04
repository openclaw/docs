---
read_when:
    - Recherche de définitions publiques des canaux de publication
    - Exécution de la validation de version ou de l’acceptation des packages
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle opérateur, encadrés de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-07-04T17:59:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expose actuellement trois canaux de mise à jour destinés aux utilisateurs :

- stable : le canal de publication promue existant, qui se résout encore via
  npm `latest` jusqu’à l’arrivée du jalon CLI/canal séparé
- beta : balises de prépublication publiées sur npm `beta`
- dev : la tête mouvante de `main`

Séparément, les opérateurs de publication peuvent publier le package principal
du mois terminé précédent sur npm `extended-stable`, à partir du patch `33`. La ligne
finale régulière du mois courant continue sur npm `latest` ; cette séparation de
publication côté opérateur ne modifie pas à elle seule la résolution des canaux
de mise à jour de la CLI.

## Nommage des versions

- Version de publication mensuelle npm extended-stable : `YYYY.M.PATCH`, avec `PATCH >= 33`
  - Balise Git : `vYYYY.M.PATCH`
- Version de publication finale quotidienne/régulière : `YYYY.M.PATCH`, avec `PATCH < 33`
  - Balise Git : `vYYYY.M.PATCH`
- Version de publication corrective de repli régulière : `YYYY.M.PATCH-N`
  - Balise Git : `vYYYY.M.PATCH-N`
- Version de prépublication beta : `YYYY.M.PATCH-beta.N`
  - Balise Git : `vYYYY.M.PATCH-beta.N`
- Ne pas ajouter de zéro initial au mois ni au patch
- À partir de la mise à jour du processus de publication de juin 2026, le
  troisième composant est un numéro séquentiel mensuel de train de publication,
  et non un jour calendaire. Les publications stable et beta déterminent le
  train courant ; les balises alpha seules ne consomment pas et ne font pas
  avancer le numéro de patch beta/stable. Les balises et versions npm antérieures
  à la mise à jour conservent leurs noms existants et restent valides ;
  l’automatisation de publication continue de les comparer par année, mois,
  patch, canal, et numéro de prépublication ou de correction.
- Les builds alpha/nightly utilisent le prochain train de patch non publié et
  incrémentent uniquement `alpha.N` pour les builds répétés. Dès que ce patch a
  une beta, les nouveaux builds alpha passent au patch suivant. Ignorer les
  anciennes balises alpha seules avec des numéros de patch plus élevés lors de
  la sélection d’un train beta ou stable.
- Les versions npm sont immuables. Si une balise beta a déjà été publiée, ne pas
  la supprimer, la republier ni la réutiliser ; créer le numéro beta suivant ou
  le patch mensuel suivant à la place. Comme `2026.6.5-beta.1` a déjà été publié
  pendant la transition, les trains de publication de juin 2026 doivent utiliser
  le patch `5` ou supérieur. Ne pas publier de nouveaux trains stable ou beta de
  juin 2026 sous `2026.6.2`, `2026.6.3` ou `2026.6.4`.
- Après la finale régulière `2026.6.5`, le prochain nouveau train beta est
  `2026.6.6-beta.1`, même
  si des balises automatisées alpha seules avec des numéros de patch plus élevés
  existent déjà.
- `latest` continue de suivre la ligne npm régulière/quotidienne courante
- `beta` désigne la cible d’installation beta courante
- `extended-stable` désigne le package npm du mois précédent pris en charge, à
  partir du patch `33` ; le patch `34` et les suivants sont des publications de
  maintenance sur cette ligne mensuelle
- Le chemin mensuel dédié extended-stable ne publie que le package npm principal.
  Il ne publie pas de plugins, d’artifacts macOS ou Windows, de GitHub Release,
  de dist-tags de dépôt privé, d’images Docker, d’artifacts mobiles ni de
  téléchargements de site web.

## Cadence de publication

- Les publications passent d’abord par beta
- Stable suit seulement après validation de la dernière beta
- Les mainteneurs créent normalement les publications depuis une branche
  `release/YYYY.M.PATCH` créée à partir du `main` courant, afin que la validation
  de publication et les correctifs ne bloquent pas le nouveau développement sur
  `main`
- Si une balise beta a été poussée ou publiée et nécessite un correctif, les
  mainteneurs créent la balise `-beta.N` suivante au lieu de supprimer ou
  recréer l’ancienne balise beta
- La procédure détaillée de publication, les approbations, les identifiants et
  les notes de récupération sont réservés aux mainteneurs

## Publication mensuelle extended-stable npm uniquement

Ceci est une exception dédiée à la procédure de publication régulière ci-dessous.
Pour un mois terminé `YYYY.M`, créer `extended-stable/YYYY.M.33` ; publier
`vYYYY.M.33` et les patchs de maintenance suivants depuis cette même branche.
La balise de publication, la pointe de branche, le checkout, la version du
package, le précontrôle npm et l’exécution Full Release Validation doivent tous
identifier le même commit. Le `main` protégé doit déjà contenir une version
finale d’un mois calendaire strictement ultérieur sous le patch `33` ; les
patchs de maintenance restent éligibles après que `main` a avancé de plus d’un
mois.

Exécuter le précontrôle npm et Full Release Validation depuis la branche
extended-stable exacte, puis enregistrer les deux identifiants d’exécution :

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
est distinct du dist-tag npm `extended-stable` et reste volontairement inchangé.

Après la réussite des deux exécutions et lorsque l’environnement de publication
npm est prêt, promouvoir le tarball exact du précontrôle. Le patch `P` doit être
`33` ou supérieur :

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Pour un fork ou une répétition hors production qui ne peut volontairement pas
satisfaire la politique mensuelle `.33` ou celle du mois de `main` protégé,
ajouter `-f bypass_extended_stable_guard=true` aux dispatches de précontrôle npm
et de publication. La valeur par défaut est `false`. Le contournement n’est
accepté qu’avec `npm_dist_tag=extended-stable` et est enregistré dans le résumé
du workflow. Il ne contourne pas la référence canonique de workflow
`extended-stable/YYYY.M.33`, l’égalité pointe de branche/balise/checkout, la
syntaxe de balise finale, l’égalité version du package/balise, l’identité de
l’exécution référencée et du manifeste, la provenance du tarball, l’approbation
d’environnement, la relecture du registre ni la preuve de réparation du
sélecteur.

Le workflow de publication vérifie les identités d’exécution référencées, le
condensat du tarball préparé et les deux sélecteurs du registre npm. Confirmer
indépendamment le résultat après la réussite du workflow :

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Les deux commandes doivent retourner `YYYY.M.P`. Si la publication réussit mais
que la relecture du sélecteur échoue, ne pas republier la version immuable du
package. Utiliser l’unique commande de réparation
`npm dist-tag add openclaw@YYYY.M.P extended-stable` imprimée dans le résumé
toujours exécuté du workflow échoué, puis répéter les deux relectures
indépendantes. Le retour arrière vers le sélecteur précédent est une décision
opérateur séparée, et non le chemin de réparation de la relecture.

La checklist régulière ci-dessous continue de régir beta, `latest`, GitHub
Release, les plugins, macOS, Windows et les autres publications de plateformes.
Ne pas exécuter ces étapes pour ce chemin extended-stable npm uniquement.

## Checklist opérateur de publication régulière

Cette checklist est la forme publique du flux de publication. Les identifiants
privés, la signature, la notarisation, la récupération de dist-tag et les
détails de retour arrière d’urgence restent dans le runbook de publication
réservé aux mainteneurs.

1. Démarrez depuis le `main` actuel : tirez la dernière version, confirmez que le commit cible est poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de lui.
2. Générez la section supérieure de `CHANGELOG.md` à partir des PR fusionnées et de tous les commits
   directs depuis le dernier tag de release accessible. Gardez des entrées orientées utilisateur,
   dédupliquez les entrées qui se chevauchent entre PR et commits directs, commitez la réécriture, poussez-la,
   puis rebasez/tirez encore une fois avant de créer la branche.
3. Examinez les enregistrements de compatibilité de release dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la
   compatibilité expirée uniquement lorsque le chemin de mise à niveau reste couvert, ou consignez pourquoi elle est
   intentionnellement conservée.
4. Créez `release/YYYY.M.PATCH` depuis le `main` actuel ; ne faites pas le travail de release normal
   directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour le tag prévu, puis exécutez
   `pnpm release:prep`. Cette commande actualise les versions des plugins, l’inventaire des plugins, le schéma de
   configuration, les métadonnées de configuration des canaux inclus, la baseline de documentation de configuration,
   les exports du SDK Plugin, et la baseline d’API du SDK Plugin dans le bon ordre. Commitez toute
   dérive générée avant de taguer. Exécutez ensuite le preflight local déterministe :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de branche de release à 40 caractères est autorisé pour un preflight
   de validation uniquement. Le preflight génère une preuve de release des dépendances pour le
   graphe de dépendances exact extrait et la stocke dans l’artefact de preflight npm. Enregistrez le `preflight_run_id` réussi.
7. Lancez tous les tests de pré-release avec `Full Release Validation` pour la
   branche de release, le tag, ou le SHA complet du commit. C’est l’unique point d’entrée manuel
   pour les quatre grands bancs de test de release : Vitest, Docker, QA Lab, et Package.
8. Si la validation échoue, corrigez sur la branche de release et relancez le plus petit
   fichier, lane, job de workflow, profil de package, fournisseur, ou allowlist de modèles en échec qui
   prouve la correction. Ne relancez l’umbrella complet que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour un candidat beta tagué, exécutez
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` depuis la branche
   `release/YYYY.M.PATCH` correspondante. Pour stable, transmettez aussi la release source Windows
   requise :
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   L’assistant exécute les vérifications locales de release générée, déclenche ou vérifie
   les preuves de validation complète de release et de preflight npm, exécute la preuve Parallels
   fraîche/mise à jour contre le tarball préparé exact plus la preuve du package Telegram,
   enregistre les plans npm des plugins et ClawHub, puis affiche la commande exacte
   `OpenClaw Release Publish` uniquement lorsque le bundle de preuves est vert.
   `OpenClaw Release Publish` publie les packages de plugins sélectionnés ou tous ceux publiables
   vers npm et le même ensemble vers ClawHub en parallèle, puis promeut l’artefact de preflight npm
   OpenClaw préparé avec le dist-tag correspondant dès que la publication npm des plugins réussit.
   Après la réussite de l’enfant de publication npm OpenClaw, le workflow crée ou met à jour la
   page GitHub release/prerelease correspondante à partir de la section complète correspondante de
   `CHANGELOG.md`. Les releases stable publiées sur npm `latest` deviennent la dernière release
   GitHub ; les releases stable de maintenance conservées sur npm `beta` sont créées avec
   GitHub `latest=false`. Le workflow téléverse aussi la preuve de dépendances du preflight,
   le manifeste de validation complète, et la preuve de vérification du registre post-publication
   vers la release GitHub pour la réponse aux incidents post-release. Le workflow de publication
   affiche immédiatement les ID des exécutions enfants, approuve automatiquement les portes de l’environnement
   de release que le token du workflow est autorisé à approuver, résume les jobs enfants en échec avec
   des fins de journaux, finalise la release GitHub et la preuve de dépendances dès que la publication npm
   OpenClaw réussit, attend ClawHub lorsque OpenClaw npm est publié, puis exécute
   `pnpm release:verify-beta` et téléverse les preuves post-publication pour la release GitHub,
   le package npm, les packages npm de plugins sélectionnés, les packages ClawHub sélectionnés,
   les ID d’exécution des workflows enfants, et l’ID d’exécution NPM Telegram facultatif. Le chemin
   ClawHub réessaie les échecs transitoires d’installation des dépendances CLI, publie les plugins
   dont la prévisualisation réussit même lorsqu’une cellule de prévisualisation est flaky, et se termine
   par une vérification de registre pour chaque version de plugin attendue afin que les publications partielles
   restent visibles et réessayables. Exécutez ensuite l’acceptation de package post-publication
   contre le package publié
   `openclaw@YYYY.M.PATCH-beta.N` ou
   `openclaw@beta`. Si une prerelease poussée ou publiée nécessite une correction,
   coupez le numéro de prerelease correspondant suivant ; ne supprimez pas et ne réécrivez pas l’ancienne
   prerelease.
10. Pour stable, continuez uniquement après que la beta ou le release candidate validé dispose des
    preuves de validation requises. La publication npm stable passe aussi par
    `OpenClaw Release Publish`, en réutilisant l’artefact de preflight réussi via
    `preflight_run_id` ; la préparation de la release macOS stable exige aussi les
    `.zip`, `.dmg`, `.dSYM.zip` packagés, et le `appcast.xml` mis à jour sur `main`.
    Le workflow de publication macOS publie automatiquement l’appcast signé vers le `main` public
    après vérification des assets de release ; si la protection de branche bloque le push direct,
    il ouvre ou met à jour une PR d’appcast. La préparation du Hub Windows stable exige les assets signés
    `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, et
    `OpenClawCompanion-SHA256SUMS.txt` sur la release GitHub OpenClaw.
    Transmettez le tag exact de release signé `openclaw/openclaw-windows-node` comme
    `windows_node_tag` et sa carte de digests d’installateurs approuvée par candidat comme
    `windows_node_installer_digests` ; `OpenClaw Release Publish` conserve le brouillon de
    release, déclenche `Windows Node Release`, et vérifie les trois
    assets avant publication.
11. Après publication, exécutez le vérificateur npm post-publication, l’E2E Telegram autonome
    facultatif du npm publié lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion du dist-tag si nécessaire, vérifiez la page de release GitHub générée,
    exécutez les étapes d’annonce de release, puis terminez [Clôture stable de
    main](#stable-main-closeout) avant de considérer une release stable comme terminée.

## Clôture stable de main

La publication stable n’est pas complète tant que `main` ne porte pas l’état de release
réellement livré.

1. Démarrez depuis le tout dernier `main` frais. Auditez `release/YYYY.M.PATCH` par rapport à lui et
   forward-portez les vraies corrections absentes de `main`. Ne fusionnez pas aveuglément
   dans le `main` plus récent les adaptateurs de compatibilité, de test ou de validation propres à la release.
2. Réglez `main` sur la version stable livrée, pas sur un prochain train spéculatif. Exécutez
   `pnpm release:prep` après le changement de version racine, puis
   `pnpm deps:shrinkwrap:generate`.
3. Faites correspondre exactement la section `## YYYY.M.PATCH` de `CHANGELOG.md` sur `main` à la
   branche de release taguée. Incluez la mise à jour stable de `appcast.xml` lorsque la release mac
   en a publié une.
4. N’ajoutez pas `YYYY.M.PATCH+1`, une version beta, ni une section de changelog future vide
   à `main` tant que l’opérateur n’a pas explicitement démarré ce train de release.
5. Exécutez `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, et
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Poussez, puis vérifiez que `origin/main`
   contient la version livrée et le changelog avant de considérer la release stable
   comme terminée.
6. Gardez les variables de dépôt `RELEASE_ROLLBACK_DRILL_ID` et
   `RELEASE_ROLLBACK_DRILL_DATE` à jour après chaque exercice privé de rollback.
   `OpenClaw Stable Main Closeout` démarre depuis le push `main` qui porte la
   version livrée, le changelog, et l’appcast après la publication stable. Il lit
   les preuves post-publication immuables pour lier le tag livré à ses exécutions Full Release
   Validation et Publish, puis vérifie l’état stable de main, la release,
   le soak stable obligatoire, et les preuves de performance bloquantes. Il attache un
   manifeste de clôture immuable et une somme de contrôle à la release GitHub. Le déclencheur de push
   automatique ignore les releases héritées antérieures aux preuves post-publication immuables ;
   il ne traite jamais cet ignore comme une clôture terminée. Une clôture complète
   exige les deux assets et une somme de contrôle correspondante. Un manifeste partiel
   rejoue son SHA `main` enregistré et l’exercice de rollback pour régénérer des octets
   identiques, puis attache la somme de contrôle manquante ; une paire invalide, ou une somme de contrôle
   sans manifeste, reste bloquante. Une exécution déclenchée par push sans variables de dépôt
   d’exercice de rollback est ignorée sans terminer la clôture ; un enregistrement d’exercice manquant ou
   vieux de plus de 90 jours bloque encore la clôture manuelle appuyée par preuves.
   Les commandes de récupération privées restent dans le runbook réservé aux maintainers.
   Utilisez le déclenchement manuel uniquement pour réparer ou rejouer une clôture stable appuyée par preuves.
   Un tag de correction de fallback hérité peut réutiliser la preuve du package de base uniquement lorsque
   le tag de correction se résout vers le même commit source que le tag stable de base.
   Une correction avec une source différente doit publier et vérifier ses propres preuves de package.

## Preflight de release

- Exécutez `pnpm check:test-types` avant le contrôle préalable de publication afin que le TypeScript des tests reste
  couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le contrôle préalable de publication afin que les vérifications plus larges des
  cycles d’importation et des limites d’architecture soient au vert en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication
  `dist/*` attendus et le bundle Control UI existent pour l’étape de validation
  du pack
- Exécutez `pnpm release:prep` après l’incrément de version racine et avant le tag. Il
  exécute tous les générateurs déterministes de publication qui dérivent couramment après un
  changement de version/configuration/API : versions des plugins, inventaire des plugins, schéma de configuration
  de base, métadonnées de configuration des canaux groupés, base de référence de la documentation de configuration, exports du plugin SDK
  et base de référence de l’API du plugin SDK. `pnpm release:check` réexécute ces
  garde-fous en mode vérification et signale en une seule passe chaque échec de dérive générée qu’il trouve
  avant d’exécuter les vérifications de publication du package.
- La synchronisation des versions de plugin met à jour par défaut les versions des packages de plugins officiels et les planchers
  `openclaw.compat.pluginApi` existants vers la version de publication d’OpenClaw.
  Traitez ce champ comme le plancher de l’API plugin SDK/runtime, et non comme une simple copie
  de la version du package : pour les publications propres à un plugin qui restent volontairement
  compatibles avec d’anciens hôtes OpenClaw, conservez le plancher à la plus ancienne API d’hôte prise en charge
  et documentez ce choix dans la preuve de publication du plugin.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de la publication pour
  lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche le `CI` manuel et déclenche
  `OpenClaw Release Checks` pour le smoke d’installation, l’acceptation de package, les vérifications de package
  multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables et complètes
  incluent toujours les parcours live/E2E exhaustifs et le soak du chemin de publication Docker ;
  `run_release_soak=true` est conservé pour un soak bêta explicite. Package
  Acceptance fournit l’E2E Telegram canonique du package pendant la validation du candidat,
  évitant un second poller live concurrent.
  Fournissez `release_package_spec` après la publication d’une bêta pour réutiliser le package npm
  publié dans les vérifications de publication, Package Acceptance et l’E2E Telegram
  du package sans reconstruire le tarball de publication. Fournissez
  `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un autre package
  publié que le reste de la validation de publication. Fournissez
  `package_acceptance_package_spec` lorsque Package Acceptance doit utiliser un
  autre package publié que la spécification de package de publication. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve de publication doit prouver que la
  validation correspond à un package npm publié sans imposer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal secondaire
  pour un candidat package pendant que le travail de publication continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref`
  pour empaqueter une branche/un tag/un SHA `package_ref` fiable avec le harnais
  `workflow_ref` actuel ; `source=url` pour un tarball HTTPS public avec un
  SHA-256 requis et une politique stricte d’URL publique ; `source=trusted-url` pour une
  politique de source fiable nommée utilisant `trusted_source_id` et SHA-256 obligatoires ; ou
  `source=artifact` pour un tarball téléversé par une autre exécution GitHub Actions. Le
  workflow résout le candidat vers
  `package-under-test`, réutilise le planificateur de publication Docker E2E contre ce
  tarball et peut exécuter la QA Telegram contre le même tarball avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la base publiée. `update-restart-auth` utilise le package candidat comme
  CLI installé et comme package-under-test afin d’exercer le chemin de redémarrage
  géré de la commande de mise à jour du candidat.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies package/mise à jour/redémarrage/plugin natives de l’artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : segments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous n’avez besoin que d’une couverture CI normale
  déterministe pour le candidat de publication. Les déclenchements CI manuels contournent le périmètre
  des changements et forcent les shards Linux Node, les shards des plugins groupés, les shards de contrats de plugins et
  de canaux, la compatibilité Node 22, `check-*`, `check-additional-*`,
  les smoke checks des artefacts construits, les vérifications de documentation, les Skills Python, Windows, macOS et
  les voies i18n de Control UI. Les exécutions CI manuelles autonomes n’exécutent Android que lorsqu’elles sont déclenchées
  avec `include_android=true` ; `Full Release Validation` transmet cette entrée à
  son enfant CI.
  Exemple avec Android : `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cela exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie l’export des traces, métriques et journaux
  ainsi que les attributs de trace bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm qa:otel:collector-smoke` lors de la validation de la compatibilité du collecteur.
  Cela fait passer le même export OTLP QA-lab par un véritable conteneur Docker OpenTelemetry Collector
  avant les assertions du récepteur local.
- Exécutez `pnpm qa:prometheus:smoke` lors de la validation du scraping Prometheus protégé.
  Cela exerce QA-lab, rejette les scrapes non authentifiés et vérifie que les familles de métriques
  critiques pour la publication restent exemptes de contenu de prompt, d’identifiants bruts,
  de jetons d’authentification et de chemins locaux.
- Exécutez `pnpm qa:observability:smoke` lorsque vous voulez enchaîner les voies smoke
  OpenTelemetry et Prometheus depuis le checkout source.
- Exécutez `pnpm release:check` avant chaque publication taguée
- Le contrôle préalable `OpenClaw NPM Release` génère les preuves de publication des dépendances avant
  d’empaqueter le tarball npm. La porte des vulnérabilités de l’avis npm est
  bloquante pour la publication. Le risque du manifeste transitif, la surface de propriété/installation
  des dépendances et les rapports de changement de dépendances sont uniquement des preuves de publication. Le
  rapport de changement de dépendances compare le candidat de publication avec le tag de publication atteignable
  précédent.
- Le contrôle préalable téléverse les preuves de dépendances sous le nom
  `openclaw-release-dependency-evidence-<tag>` et les intègre aussi sous
  `dependency-evidence/` dans l’artefact de contrôle préalable npm préparé. Le vrai
  chemin de publication réutilise cet artefact de contrôle préalable, puis attache les mêmes preuves
  à la publication GitHub sous le nom `openclaw-<version>-dependency-evidence.zip`.
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après l’existence du
  tag. Déclenchez-le depuis `release/YYYY.M.PATCH` (ou `main` lors de la publication d’un
  tag atteignable depuis main), transmettez le tag de publication, le
  `preflight_run_id` npm OpenClaw réussi et le `full_release_validation_run_id` réussi, et conservez
  la portée de publication de plugin par défaut `all-publishable`, sauf si vous exécutez délibérément
  une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication
  ClawHub des plugins et la publication npm OpenClaw afin que le package principal ne soit pas publié
  avant ses plugins externalisés.
- Le `OpenClaw Release Publish` stable exige un `windows_node_tag` exact après
  l’existence de la publication non-prérelease correspondante `openclaw/openclaw-windows-node`.
  Il exige aussi la carte `windows_node_installer_digests` approuvée pour le candidat.
  Avant de déclencher tout enfant de publication, il vérifie que la publication source est
  publiée, non-prérelease, contient les installateurs x64/ARM64 requis et
  correspond toujours à cette carte approuvée. Il déclenche ensuite `Windows Node Release`
  pendant que la publication OpenClaw est encore un brouillon, en transmettant inchangée la carte figée
  des condensats d’installateurs. Le workflow enfant
  télécharge les installateurs Windows Hub signés depuis ce tag exact,
  les compare aux condensats figés, vérifie sur un runner Windows que leurs signatures Authenticode
  utilisent le signataire OpenClaw Foundation attendu,
  écrit un manifeste SHA-256 et téléverse les installateurs ainsi que le manifeste sur la
  publication GitHub canonique d’OpenClaw, puis retélécharge les ressources promues et
  vérifie l’appartenance au manifeste et les hachages. Le parent vérifie le contrat actuel
  des ressources x64, ARM64 et checksum avant publication. La récupération directe
  rejette les noms de ressources `OpenClawCompanion-*` inattendus avant de remplacer les
  ressources de contrat attendues par les octets source figés. Déclenchez manuellement
  `Windows Node Release` uniquement pour la récupération, et transmettez toujours un tag exact, jamais
  `latest`, ainsi que la carte JSON explicite `expected_installer_digests` issue de la
  publication source approuvée. Les liens de téléchargement du site web doivent cibler les URL exactes des ressources de publication OpenClaw
  pour la publication stable actuelle, ou
  `releases/latest/download/...` uniquement après avoir vérifié que la redirection latest de GitHub
  pointe vers cette même publication ; ne créez pas de lien uniquement vers la page de publication
  du dépôt compagnon.
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil Matrix live rapide
  et la voie QA Telegram avant l’approbation de la publication. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants CI
  Convex. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport
  Matrix, des médias et de l’E2EE en parallèle.
- La validation runtime d’installation et de mise à niveau multi-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement
  le workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin qu’elles ne ralentissent ni ne bloquent la publication
- Les vérifications de publication portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique du workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de publication
- Le contrôle préalable de validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication exige toujours un vrai tag de publication
- Les deux workflows conservent le vrai chemin de publication et de promotion sur les runners hébergés par GitHub,
  tandis que le chemin de validation non mutant peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le contrôle préalable de publication npm n’attend plus la voie séparée des vérifications de publication
- Avant de taguer localement un candidat de publication, exécutez
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L’aide
  exécute les garde-fous rapides de publication, les vérifications de publication npm/ClawHub des plugins, le build,
  le build UI et `release:openclaw:npm:check` dans l’ordre qui détecte les erreurs courantes
  bloquant l’approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (ou la version bêta/correction correspondante) pour vérifier le chemin
  d’installation du registre publié dans un préfixe temporaire neuf
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’intégration du package installé, la configuration de Telegram
  et l’E2E Telegram réel avec le package npm publié en utilisant le pool partagé
  d’identifiants Telegram loués. Les exécutions ponctuelles locales des
  mainteneurs peuvent omettre les variables Convex et transmettre directement les
  trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke bêta complet après publication depuis la machine d’un mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm et de cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artéfact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification après publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est volontairement manuel
  uniquement et ne s’exécute pas à chaque fusion.
- L’automatisation de release des mainteneurs utilise désormais prévol-puis-promotion :
  - la publication npm réelle doit réussir avec un npm `preflight_run_id`
  - la publication npm réelle doit être déclenchée depuis la même branche `main`
    ou `release/YYYY.M.PATCH` que l’exécution de prévol réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de npm dist-tag basée sur un jeton vit désormais dans
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, car
    `npm dist-tag add` a toujours besoin de `NPM_TOKEN`, tandis que le dépôt
    source conserve une publication OIDC uniquement
  - `macOS Release` public est uniquement destiné à la validation ; lorsqu’un tag
    n’existe que sur une branche de release mais que le workflow est déclenché
    depuis `main`, définissez `public_release_branch=release/YYYY.M.PATCH`
  - la publication macOS réelle doit réussir avec un `preflight_run_id` macOS
    et un `validate_run_id`
  - les chemins de publication réelle promeuvent les artéfacts préparés au lieu
    de les reconstruire à nouveau
- Pour les releases de correction stables comme `YYYY.M.PATCH-N`, le vérificateur
  après publication vérifie aussi le même chemin de mise à niveau avec préfixe
  temporaire de `YYYY.M.PATCH` vers `YYYY.M.PATCH-N`, afin que les corrections de
  release ne puissent pas laisser silencieusement les anciennes installations
  globales sur la charge utile stable de base
- Le prévol de release npm échoue en mode fermé sauf si le tarball inclut à la
  fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/`
  non vide, afin de ne pas réexpédier un tableau de bord navigateur vide
- La vérification après publication vérifie aussi que les points d’entrée des
  Plugins publiés et les métadonnées de package sont présents dans la disposition
  installée du registre. Une release qui expédie des charges utiles d’exécution
  de Plugin manquantes échoue au vérificateur après publication et ne peut pas
  être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur
  le tarball candidat de mise à jour, afin que l’e2e de l’installateur détecte
  les gonflements accidentels de package avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing
  des extensions ou les matrices de test des extensions, régénérez et révisez les
  sorties de matrice `plugin-prerelease-extension-shard` détenues par le
  planificateur depuis `.github/workflows/plugin-prerelease.yml` avant
  approbation, afin que les notes de release ne décrivent pas une disposition CI
  obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les fichiers packagés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après
    publication ; le workflow de publication macOS le valide automatiquement, ou
    ouvre une PR appcast lorsque le push direct est bloqué
  - l’application packagée doit conserver un identifiant de bundle non-debug, une
    URL de flux Sparkle non vide et un `CFBundleVersion` égal ou supérieur au
    plancher canonique de build Sparkle pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez
l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque workflow enfant `headSha`
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver
accidentellement une exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’un tag de release, exécutez-la depuis la ref de workflow
`main` approuvée et passez la branche ou le tag de release comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Le workflow résout la ref cible, déclenche manuellement `CI` avec
`target_ref=<release-ref>`, puis déclenche `OpenClaw Release Checks`.
`OpenClaw Release Checks` déploie en éventail le smoke test d’installation, les vérifications de release cross-OS,
la couverture live/E2E du chemin de release Docker lorsque le soak est activé, Package Acceptance
avec l’E2E canonique du package Telegram, la parité QA Lab, la Matrix live et Telegram live.
Une exécution full/all n’est acceptable que lorsque le résumé de `Full Release Validation`
indique `normal_ci`, `plugin_prerelease` et `release_checks` comme
réussis, sauf si une relance ciblée a intentionnellement ignoré l’enfant `Plugin
Prerelease` séparé. Utilisez l’enfant autonome `npm-telegram` uniquement pour une relance ciblée
du package publié avec `release_package_spec` ou
`npm_telegram_package_spec`. Le résumé final du vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et full,
les artefacts et les identifiants de relance ciblée.
Les workflows enfants sont déclenchés depuis la ref approuvée qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou un tag de release plus ancien. Il n’existe pas d’entrée séparée de ref de workflow Full Release Validation ;
choisissez le harnais approuvé en choisissant la ref d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve exacte de commit sur `main` en mouvement ;
les SHA de commits bruts ne peuvent pas être des refs de dispatch de workflow, donc utilisez
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/provider :

- `minimum` : chemin live et Docker OpenAI/core critique pour la release le plus rapide
- `stable` : minimum plus couverture stable provider/backend pour l’approbation de release
- `full` : stable plus large couverture consultative provider/médias

Les validations stable et full exécutent toujours le balayage exhaustif live/E2E, du chemin de release Docker
et bounded published upgrade-survivor avant la promotion.
Utilisez `run_release_soak=true` pour demander le même balayage pour une bêta. Ce balayage couvre
les quatre derniers packages stables plus les références épinglées `2026.4.23` et `2026.5.2`
plus la couverture plus ancienne `2026.4.15`, avec les références dupliquées supprimées et
chaque référence fragmentée dans son propre job runner Docker.

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre la ref cible
une seule fois comme `release-package-under-test` et réutilise cet artefact dans les vérifications cross-OS,
Package Acceptance et Docker du chemin de release lorsque le soak s’exécute. Cela maintient
toutes les boîtes orientées package sur les mêmes octets et évite les builds de package répétés.
Après qu’une bêta est déjà sur npm, définissez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
afin que les vérifications de release téléchargent une seule fois le package expédié, extraient son SHA source de build
depuis `dist/build-info.json`, et réutilisent cet artefact pour les voies cross-OS,
Package Acceptance, Docker du chemin de release et package Telegram.
Le smoke test d’installation cross-OS OpenAI utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable repo/org est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du package, l’onboarding, le démarrage du gateway et un tour d’agent live
plutôt que de mesurer le modèle par défaut le plus lent. La matrice live provider plus large
reste l’endroit dédié à la couverture propre aux modèles.

Utilisez ces variantes selon l’étape de release :

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
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

N’utilisez pas le parapluie complet comme première relance après un correctif ciblé. Si une boîte
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de package, le provider de modèle
ou la voie QA échoué pour la preuve suivante. Réexécutez le parapluie complet uniquement lorsque
le correctif a modifié l’orchestration de release partagée ou a rendu obsolète la preuve all-box précédente.
Le vérificateur final du parapluie revérifie les identifiants enregistrés d’exécution des workflows enfants ;
ainsi, après la réussite de la relance d’un workflow enfant, relancez uniquement le job parent échoué
`Verify full validation`.

Pour une récupération bornée, passez `rerun_group` au parapluie. `all` est la véritable
exécution de release-candidate, `ci` exécute uniquement l’enfant CI normal, `plugin-prerelease`
exécute uniquement l’enfant Plugin réservé à la release, `release-checks` exécute toutes les boîtes de release,
et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `release_package_spec` ou
`npm_telegram_package_spec` ; les exécutions full/all utilisent l’E2E canonique package Telegram
dans Package Acceptance. Les relances ciblées
cross-OS peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA release-check bloquent la validation de release normale,
y compris la dérive requise des outils dynamiques OpenClaw au niveau standard.
Les exécutions alpha Tideclaw peuvent encore traiter les voies release-check non liées à la sûreté du package comme
consultatives. Lorsque `live_suite_filter` demande explicitement une voie QA live gated telle que
Discord, WhatsApp ou Slack, la variable repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon
la capture d’entrée échoue au lieu d’ignorer silencieusement la voie.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement
le scoping des changements et force le graphe de tests normal pour le release candidate :
fragments Linux Node, fragments de bundled-plugin, fragments de contrats de Plugin et de canal,
compatibilité Node 22, `check-*`, `check-additional-*`,
smoke checks d’artefacts construits, vérifications docs, Skills Python, Windows, macOS,
et i18n Control UI. Android est inclus lorsque `Full Release Validation` exécute la
boîte, car le parapluie passe `include_android=true` ; la CI manuelle autonome
requiert `include_android=true` pour la couverture Android.

Utilisez cette boîte pour répondre à « l’arbre source a-t-il réussi toute la suite de tests normale ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` montrant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments échoués ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez la CI manuelle directement uniquement lorsque la release nécessite une CI normale déterministe mais
pas les boîtes Docker, QA Lab, live, cross-OS ou package. Utilisez la première commande
pour une CI directe non Android. Ajoutez `include_android=true` lorsque la CI directe
du release-candidate doit couvrir Android :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La boîte Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, ainsi que dans le workflow
`install-smoke` en mode release. Elle valide le release candidate au moyen d’environnements Docker packagés
au lieu de tests uniquement au niveau source.

La couverture Docker de release inclut :

- smoke test d’installation complet avec le smoke test lent d’installation globale Bun activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec des jobs QR,
  root/gateway et installer/Bun exécutés comme fragments install-smoke séparés
- voies E2E du dépôt
- blocs Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le bloc `plugins-runtime-services` lorsqu’elle est demandée
- voies scindées d’installation/désinstallation de Plugins groupés
  `bundled-plugin-install-uninstall-0` jusqu’à
  `bundled-plugin-install-uninstall-23`
- suites provider live/E2E et couverture de modèles live Docker lorsque les vérifications de release
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les chronométrages de phase, le JSON de plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
relancer tous les blocs de release. Les commandes de relance générées incluent le
`package_artifact_run_id` précédent et les entrées d’image Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. C’est le gate de release
pour le comportement agentique et au niveau canal, distinct de Vitest et des mécaniques de package Docker.

La couverture QA Lab de release inclut :

- voie de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6
  à l’aide du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` ou
  `pnpm qa:observability:smoke` lorsque la télémétrie de release nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les voies de parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab
manuelle fragmentée plutôt que comme voie critique par défaut de release.

### Package

La boîte Package est le gate du produit installable. Elle est soutenue par
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
ref du harnais de workflow séparée de la ref source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte
  de publication OpenClaw
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet
  `package_ref` fiable avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS public avec le `package_sha256`
  requis ; les identifiants dans l’URL, les ports HTTPS non par défaut, les
  noms d’hôte ou adresses résolues privés/internes/à usage spécial, ainsi que
  les redirections non sûres sont rejetés
- `source=trusted-url` : télécharger un `.tgz` HTTPS avec le
  `package_sha256` requis et le `trusted_source_id` depuis une stratégie nommée
  dans `.github/package-trusted-sources.json` ; utilisez ceci pour les miroirs
  d’entreprise ou les dépôts de paquets privés détenus par les mainteneurs au
  lieu d’ajouter un contournement de réseau privé au niveau de l’entrée à
  `source=url`
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution
  GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`,
l’artefact de paquet de publication préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve l’AQ des migrations,
mises à jour, redémarrage de mise à jour avec authentification configurée,
installation de Skills ClawHub en direct, nettoyage des dépendances de Plugins
obsolètes, fixtures de Plugins hors ligne, mise à jour de Plugins et paquet
Telegram contre le même tarball résolu. Les contrôles de publication bloquants
utilisent la référence par défaut du dernier paquet publié ; le profil bêta avec
`run_release_soak=true`, `release_profile=stable` ou `release_profile=full`
s’étend à chaque référence stable publiée sur npm de `2026.4.23` à `latest`,
ainsi qu’aux fixtures de problèmes signalés. Utilisez Package Acceptance avec
`source=npm` pour un candidat déjà livré, `source=ref` pour un tarball npm local
adossé à un SHA avant publication, `source=trusted-url` pour un miroir
d’entreprise/privé détenu par les mainteneurs, ou `source=artifact` pour un
tarball préparé téléversé par une autre exécution GitHub Actions. C’est le
remplacement natif GitHub de la majeure partie de la couverture paquet/mise à
jour qui nécessitait auparavant Parallels. Les contrôles de publication
multi-OS restent importants pour l’intégration initiale propre à l’OS,
l’installateur et le comportement de plateforme, mais la validation produit des
paquets/mises à jour doit privilégier Package Acceptance.

La liste de contrôle canonique pour la validation des mises à jour et des
Plugins est [Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).
Utilisez-la pour décider quelle piste locale, Docker, Package Acceptance ou de
contrôle de publication prouve une installation/mise à jour de Plugin, un
nettoyage par doctor ou un changement de migration de paquet publié. La
migration exhaustive de mise à jour publiée depuis chaque paquet stable
`2026.4.23+` est un workflow manuel distinct `Update Migration`, et ne fait pas
partie de Full Release CI.

La tolérance héritée de package-acceptance est volontairement limitée dans le
temps. Les paquets jusqu’à `2026.4.25` peuvent utiliser le chemin de
compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées
d’inventaire AQ privées absentes du tarball, `gateway install --wrapper`
manquant, fichiers de correctif manquants dans la fixture git dérivée du
tarball, `update.channel` persistant manquant, emplacements hérités
d’enregistrements d’installation de Plugins, persistance manquante
d’enregistrements d’installation de marketplace, et migration des métadonnées
de configuration pendant `plugins update`. Le paquet publié `2026.4.26` peut
émettre un avertissement pour les fichiers d’empreinte de métadonnées de build
local qui ont déjà été livrés. Les paquets ultérieurs doivent satisfaire les
contrats de paquet modernes ; ces mêmes lacunes font échouer la validation de
publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de
publication porte sur un paquet réellement installable :

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

- `smoke` : pistes rapides d’installation de paquet/canal/agent, réseau Gateway
  et rechargement de configuration
- `package` : contrats d’installation/mise à jour/redémarrage/paquet Plugin,
  plus preuve d’installation de Skills ClawHub en direct ; c’est la valeur par
  défaut des contrôles de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche
  web OpenAI et OpenWebUI
- `full` : blocs de chemin de publication Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour les réexécutions ciblées

Pour la preuve Telegram d’un candidat de paquet, activez
`telegram_mode=mock-openai` ou `telegram_mode=live-frontier` sur Package
Acceptance. Le workflow transmet le tarball résolu `package-under-test` à la
piste Telegram ; le workflow Telegram autonome accepte toujours une
spécification npm publiée pour les contrôles post-publication.

## Automatisation de publication des versions régulières

Pour la publication bêta, `latest`, Plugin, GitHub Release et plateforme,
`OpenClaw Release Publish` est le point d’entrée mutant normal. Le chemin
mensuel `.33+` extended-stable uniquement npm n’utilise pas cet orchestrateur.
Le workflow régulier orchestre les workflows de publication fiable dans l’ordre
requis par la publication :

1. Extraire la balise de publication et résoudre son SHA de commit.
2. Vérifier que la balise est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec le même périmètre et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec la balise de publication, la dist-tag
   npm et le `preflight_run_id` enregistré après vérification du
   `full_release_validation_run_id` enregistré.
7. Pour les versions stables, créer ou mettre à jour la publication GitHub en
   brouillon, déclencher `Windows Node Release` avec le `windows_node_tag`
   explicite et les `windows_node_installer_digests` approuvés pour le candidat,
   puis vérifier les artefacts canoniques d’installateur/somme de contrôle avant
   de publier le brouillon.

Exemple de publication bêta :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publication stable vers la dist-tag bêta par défaut :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

La promotion stable directement vers `latest` est explicite :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Utilisez les workflows de niveau inférieur `Plugin NPM Release` et
`Plugin ClawHub Release` uniquement pour des travaux ciblés de réparation ou de
republication. `OpenClaw Release Publish` rejette
`plugin_publish_scope=selected` lorsque `publish_openclaw_npm=true`, afin que le
paquet principal ne puisse pas être livré sans tous les Plugins officiels
publiables, y compris `@openclaw/diffs-language-pack`. Pour une réparation de
Plugin sélectionné, définissez `publish_openclaw_npm=false` avec
`plugin_publish_scope=selected` et `plugins=@openclaw/name`, ou déclenchez
directement le workflow enfant.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise, comme `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, elle peut aussi être le
  SHA de commit complet à 40 caractères de la branche de workflow actuelle pour
  une prévalidation limitée à la validation
- `preflight_only` : `true` pour validation/build/paquet uniquement, `false`
  pour le chemin de publication réel
- `preflight_run_id` : requis sur le chemin de publication réel afin que le
  workflow réutilise le tarball préparé depuis l’exécution de prévalidation
  réussie
- `full_release_validation_run_id` : requis pour la vraie publication mensuelle
  extended-stable et la publication régulière non bêta, afin que le workflow
  authentifie l’exécution de validation exacte
- `npm_dist_tag` : balise npm cible pour le chemin de publication ; accepte
  `alpha`, `beta`, `latest` ou `extended-stable` et vaut `beta` par défaut. Le
  correctif final `33` et les suivants doivent utiliser `extended-stable` ; par
  défaut, `extended-stable` rejette les correctifs antérieurs, et rejette
  toujours les balises non finales.
- `bypass_extended_stable_guard` : booléen réservé aux tests, valeur par défaut
  `false` ; avec `npm_dist_tag=extended-stable`, contourne l’éligibilité
  mensuelle extended-stable tout en préservant les contrôles d’identité de
  publication, d’artefact, d’approbation et de relecture.

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise ; elle doit déjà exister
- `preflight_run_id` : identifiant d’exécution de prévalidation
  `OpenClaw NPM Release` réussie ; requis lorsque `publish_openclaw_npm=true`
- `full_release_validation_run_id` : identifiant d’exécution
  `Full Release Validation` réussie ; requis lorsque `publish_openclaw_npm=true`
- `windows_node_tag` : balise de publication exacte non préversion
  `openclaw/openclaw-windows-node` ; requise pour une publication stable
  OpenClaw
- `windows_node_installer_digests` : carte JSON compacte approuvée pour le
  candidat, des noms actuels d’installateurs Windows vers leurs condensats
  `sha256:` épinglés ; requise pour une publication stable OpenClaw
- `npm_dist_tag` : balise npm cible pour le paquet OpenClaw
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez
  `selected` uniquement pour un travail ciblé de réparation de Plugin seul avec
  `publish_openclaw_npm=false`
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez `false` uniquement
  lorsque vous utilisez le workflow comme orchestrateur de réparation de Plugin
  seul
- `wait_for_clawhub` : vaut `false` par défaut afin que la disponibilité npm ne
  soit pas bloquée par le sidecar ClawHub ; définissez `true` uniquement lorsque
  l’achèvement du workflow doit inclure l’achèvement ClawHub

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, balise ou SHA de commit complet à valider. Les contrôles avec
  secrets exigent que le commit résolu soit accessible depuis une branche
  OpenClaw ou une balise de publication.
- `run_release_soak` : active le soak exhaustif live/E2E, le chemin de
  publication Docker et l’upgrade-survivor depuis toutes les versions pour les
  contrôles de publication bêta. Il est forcé par `release_profile=stable` et
  `release_profile=full`.

Règles :

- Les versions finales régulières et de correction sous le correctif `33`
  peuvent être publiées vers `beta` ou `latest`. Les versions finales au
  correctif `33` ou supérieur doivent être publiées vers `extended-stable`, et
  les versions avec suffixe de correction à cette frontière sont rejetées.
- Les balises de préversion bêta ne peuvent être publiées que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée
  que lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le chemin de publication réel doit utiliser le même `npm_dist_tag` que celui
  utilisé pendant la prévalidation ; le workflow vérifie que les métadonnées
  avant publication continuent de correspondre

## Séquence de publication stable bêta/latest régulière

Cette séquence héritée concerne la publication régulière orchestrée qui possède
aussi les Plugins, GitHub Release, Windows et les autres travaux de plateforme.
Ce n’est pas le chemin mensuel `.33+` extended-stable uniquement npm documenté
en haut de cette page.

Lors de la préparation d’une publication stable orchestrée régulière :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’une balise existe, vous pouvez utiliser le SHA du commit actuel complet
     de la branche de workflow pour un essai à blanc de validation uniquement du workflow de prévérification
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de publication, la balise de publication ou le SHA complet
   du commit lorsque vous voulez la CI normale plus la couverture live prompt cache, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous avez intentionnellement seulement besoin du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de publication
5. Sélectionnez la balise de publication exacte non préliminaire `openclaw/openclaw-windows-node`
   dont les installateurs signés x64 et ARM64 doivent être livrés. Enregistrez-la sous
   `windows_node_tag`, et enregistrez leur carte d’empreintes validées sous
   `windows_node_installer_digests`. L’assistant de version candidate enregistre les deux
   et les inclut dans sa commande de publication générée.
6. Enregistrez les `preflight_run_id` et `full_release_validation_run_id` réussis
7. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   le `windows_node_tag` sélectionné, son `windows_node_installer_digests` enregistré,
   le `preflight_run_id` enregistré et le `full_release_validation_run_id` enregistré ;
   il publie les plugins externalisés vers npm et ClawHub avant de promouvoir le
   paquet npm OpenClaw
8. Si la publication a atterri sur `beta`, utilisez le workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
9. Si la publication a intentionnellement été publiée directement vers `latest` et que `beta`
   doit suivre immédiatement la même build stable, utilisez le même workflow de publication
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   planifiée d’auto-réparation déplacer `beta` plus tard

La mutation dist-tag vit dans le dépôt du registre de publication parce qu’elle nécessite encore
`NPM_TOKEN`, tandis que le dépôt source conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion beta-first à la fois
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez les commandes
CLI (`op`) 1Password uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes et la gestion OTP observables et empêche les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation de publication privée dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Associé

- [Canaux de publication](/fr/install/development-channels)

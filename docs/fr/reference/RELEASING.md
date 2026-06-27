---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation de package
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, cases de validation, dénomination des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-06-27T18:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw dispose de trois canaux de publication publics :

- stable : versions balisées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : balises de préversion qui publient vers npm `beta`
- dev : la tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.PATCH`
  - Balise Git : `vYYYY.M.PATCH`
- Version de correction stable : `YYYY.M.PATCH-N`
  - Balise Git : `vYYYY.M.PATCH-N`
- Version de préversion beta : `YYYY.M.PATCH-beta.N`
  - Balise Git : `vYYYY.M.PATCH-beta.N`
- Ne remplissez pas le mois ni le patch avec des zéros initiaux
- À partir de la mise à jour du processus de publication de juin 2026, le troisième composant est un
  numéro séquentiel de train de publication mensuel, et non un jour calendaire. Les versions stable et beta
  déterminent le train actuel ; les balises uniquement alpha ne consomment pas et
  ne font pas avancer le numéro de patch beta/stable. Les balises et versions npm antérieures à la mise à jour conservent
  leurs noms existants et restent valides ; l’automatisation de publication continue à
  les comparer par année, mois, patch, canal, et numéro de préversion ou de correction.
- Les builds alpha/nocturnes utilisent le prochain train de patch non publié et incrémentent uniquement
  `alpha.N` pour les builds répétés. Une fois que ce patch a une beta, les nouveaux builds alpha
  passent au patch suivant. Ignorez les anciennes balises uniquement alpha avec des numéros de patch
  plus élevés lors de la sélection d’un train beta ou stable.
- Les versions npm sont immuables. Si une balise beta a déjà été publiée, ne la
  supprimez pas, ne la republiez pas et ne la réutilisez pas ; créez le numéro beta suivant ou le patch
  mensuel suivant à la place. Comme `2026.6.5-beta.1` a déjà été publié pendant la
  transition, les trains de publication de juin 2026 doivent utiliser le patch `5` ou supérieur. Ne
  publiez pas de nouveaux trains stable ou beta de juin 2026 sous `2026.6.2`, `2026.6.3` ou
  `2026.6.4`.
- Après la stable `2026.6.5`, le prochain nouveau train beta est `2026.6.6-beta.1`, même
  si des balises automatisées uniquement alpha avec des numéros de patch plus élevés existent déjà.
- `latest` désigne la version npm stable actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les versions stable et les corrections stable publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler `latest` explicitement, ou promouvoir ultérieurement un build beta validé
- Chaque publication stable d’OpenClaw livre ensemble le package npm, l’application macOS et les installateurs Windows Hub signés ; les publications beta valident et publient normalement d’abord le chemin npm/package, la compilation/signature/notarisation/promotion des applications natives étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications avancent d’abord par beta
- La stable ne suit qu’après validation de la dernière beta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.PATCH` créée
  à partir du `main` actuel, afin que la validation et les corrections de publication ne bloquent pas le nouveau
  développement sur `main`
- Si une balise beta a été poussée ou publiée et nécessite une correction, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise beta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partez du `main` actuel : récupérez les dernières modifications, confirmez que le commit cible a été poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Générez la section supérieure de `CHANGELOG.md` à partir des PR fusionnées et de tous les commits
   directs depuis la dernière balise de publication atteignable. Gardez les entrées orientées utilisateur,
   dédupliquez les entrées PR/commits directs qui se chevauchent, commitez la réécriture, poussez-la,
   puis faites un rebase/pull une fois de plus avant de créer la branche.
3. Passez en revue les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la
   compatibilité expirée uniquement lorsque le chemin de mise à niveau reste couvert, ou indiquez pourquoi elle est
   conservée intentionnellement.
4. Créez `release/YYYY.M.PATCH` à partir du `main` actuel ; n’effectuez pas le travail de publication normal
   directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour la balise prévue, puis exécutez
   `pnpm release:prep`. Cela actualise les versions de plugins, l’inventaire des plugins, le schéma de
   configuration, les métadonnées de configuration des canaux groupés, la référence des docs de configuration, les exports du SDK de plugin
   et la référence d’API du SDK de plugin dans le bon ordre. Commitez toute dérive générée
   avant de baliser. Exécutez ensuite le précontrôle déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de 40 caractères de branche de publication est autorisé pour le précontrôle
   de validation uniquement. Le précontrôle génère des preuves de publication des dépendances pour le
   graphe exact des dépendances extraites et les stocke dans l’artefact de précontrôle npm.
   Enregistrez le `preflight_run_id` réussi.
7. Lancez tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA de commit complet. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corrigez sur la branche de publication et relancez le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou liste d’autorisation de modèles en échec qui
   prouve la correction. Ne relancez l’ombrelle complète que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour un candidat beta balisé, exécutez
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` depuis la branche
   `release/YYYY.M.PATCH` correspondante. Pour une stable, fournissez aussi la version source Windows
   requise :
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   L’assistant exécute les vérifications locales de publication générée, déclenche ou vérifie
   les preuves de validation complète et de précontrôle npm, exécute la preuve Parallels
   fraîche/mise à jour contre le tarball préparé exact plus la preuve du package Telegram,
   enregistre les plans npm des plugins et ClawHub, et imprime la commande exacte
   `OpenClaw Release Publish` uniquement une fois le paquet de preuves vert.
   `OpenClaw Release Publish` déclenche la publication des packages de plugins sélectionnés ou tous publiables
   vers npm et du même ensemble vers ClawHub en parallèle, puis promeut l’artefact
   de précontrôle npm OpenClaw préparé avec le dist-tag correspondant dès que
   la publication npm des plugins réussit.
   Après la réussite de l’enfant de publication npm OpenClaw, il crée ou met à jour la
   page GitHub release/préversion correspondante à partir de la section complète correspondante de
   `CHANGELOG.md`. Les publications stables publiées vers npm `latest` deviennent la
   dernière version GitHub ; les versions de maintenance stables conservées sur npm `beta` sont
   créées avec GitHub `latest=false`. Le workflow téléverse également les preuves de dépendances
   du précontrôle, le manifeste de validation complète et les preuves de vérification du registre
   après publication vers la publication GitHub pour la réponse aux incidents après publication.
   Le workflow de publication imprime immédiatement les ID d’exécution enfants, approuve automatiquement
   les barrières d’environnement de publication que le jeton de workflow est autorisé à approuver, résume
   les jobs enfants en échec avec les fins de journaux, finalise la publication GitHub et les preuves de dépendances
   dès que la publication npm d’OpenClaw réussit, attend ClawHub chaque fois
   qu’OpenClaw npm est publié, puis exécute `pnpm release:verify-beta` et
   téléverse les preuves après publication pour la publication GitHub, le package npm, les packages npm de plugins
   sélectionnés, les packages ClawHub sélectionnés, les ID d’exécution des workflows enfants et
   l’ID d’exécution NPM Telegram optionnel. Le chemin ClawHub réessaie les échecs transitoires
   d’installation des dépendances CLI, publie les plugins dont l’aperçu réussit même lorsqu’une
   cellule d’aperçu est intermittente, et se termine par une vérification du registre pour chaque version
   de plugin attendue afin que les publications partielles restent visibles et réessayables. Exécutez ensuite l’acceptation
   de package après publication contre le package publié
   `openclaw@YYYY.M.PATCH-beta.N` ou
   `openclaw@beta`. Si une préversion poussée ou publiée nécessite une correction,
   créez le numéro de préversion correspondant suivant ; ne supprimez pas et ne réécrivez pas l’ancienne
   préversion.
10. Pour une stable, continuez uniquement après que la beta ou le candidat de publication validé dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de précontrôle réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable exige aussi les
    fichiers `.zip`, `.dmg`, `.dSYM.zip` empaquetés et le `appcast.xml` mis à jour sur `main`.
    Le workflow de publication macOS publie automatiquement l’appcast signé vers le `main`
    public après vérification des ressources de publication ; si la protection de branche bloque le
    push direct, il ouvre ou met à jour une PR d’appcast. La préparation de Windows Hub stable
    exige les ressources signées `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` et
    `OpenClawCompanion-SHA256SUMS.txt` sur la publication GitHub d’OpenClaw.
    Fournissez la balise de publication exacte signée `openclaw/openclaw-windows-node` comme
    `windows_node_tag` et sa carte de condensés d’installateurs approuvée par le candidat comme
    `windows_node_installer_digests` ; `OpenClaw Release Publish` conserve le
    brouillon de publication, déclenche `Windows Node Release` et vérifie les trois
    ressources avant publication.
11. Après publication, exécutez le vérificateur npm après publication, l’E2E Telegram npm publié autonome optionnel lorsque vous avez besoin d’une preuve de canal après publication,
    la promotion de dist-tag si nécessaire, vérifiez la page de publication GitHub générée,
    exécutez les étapes d’annonce de publication, puis terminez [Clôture stable de main](#stable-main-closeout) avant de considérer une publication stable comme terminée.

## Clôture stable de main

La publication stable n’est pas terminée tant que `main` ne contient pas l’état réel de la
publication livrée.

1. Partez du dernier `main` frais. Auditez `release/YYYY.M.PATCH` par rapport à celui-ci et
   portez en avant les vrais correctifs absents de `main`. Ne fusionnez pas aveuglément
   les adaptateurs de compatibilité, de test ou de validation propres à la release dans un `main` plus récent.
2. Définissez `main` sur la version stable publiée, pas sur un train suivant spéculatif. Exécutez
   `pnpm release:prep` après le changement de version racine, puis
   `pnpm deps:shrinkwrap:generate`.
3. Faites en sorte que la section `## YYYY.M.PATCH` de `CHANGELOG.md` sur `main` corresponde exactement à la
   branche de release taguée. Incluez la mise à jour stable de `appcast.xml` lorsque la release mac
   en a publié une.
4. N’ajoutez pas `YYYY.M.PATCH+1`, une version bêta ni une section de changelog future vide
   à `main` tant que l’opérateur n’a pas explicitement démarré ce train de release.
5. Exécutez `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` et
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Poussez, puis vérifiez que `origin/main`
   contient la version publiée et le changelog avant de considérer la release stable
   comme terminée.
6. Maintenez à jour les variables de dépôt `RELEASE_ROLLBACK_DRILL_ID` et
   `RELEASE_ROLLBACK_DRILL_DATE` après chaque exercice de rollback privé.
   `OpenClaw Stable Main Closeout` part du push sur `main` qui contient la
   version publiée, le changelog et l’appcast après la publication stable. Il lit
   les preuves postpublication immuables pour lier le tag publié à ses exécutions de validation de release complète et de publication, puis vérifie l’état stable de main, la release,
   la période d’observation stable obligatoire et les preuves de performance bloquantes. Il joint un
   manifeste de clôture immuable et une somme de contrôle à la release GitHub. Le déclencheur de
   push automatique ignore les releases héritées antérieures aux preuves postpublication
   immuables ; il ne considère jamais cet ignore comme une clôture terminée. Une clôture complète
   exige à la fois les assets et une somme de contrôle correspondante. Un manifeste partiel
   rejoue le SHA `main` et l’exercice de rollback qu’il a enregistrés pour régénérer des octets
   identiques, puis joint la somme de contrôle manquante ; une paire invalide, ou une somme de contrôle
   sans manifeste, reste bloquante. Une exécution déclenchée par push sans variables de dépôt
   d’exercice de rollback est ignorée sans terminer la clôture ; un enregistrement d’exercice manquant ou
   vieux de plus de 90 jours bloque toujours la clôture manuelle appuyée par des preuves.
   Les commandes de récupération privées restent dans le runbook réservé aux mainteneurs.
   Utilisez le dispatch manuel uniquement pour réparer ou rejouer une clôture stable appuyée par des preuves.
   Un tag de correction de secours hérité peut réutiliser les preuves du package de base uniquement lorsque
   le tag de correction se résout vers le même commit source que le tag stable de base.
   Une correction avec une source différente doit publier et vérifier ses propres preuves de package.

## Précontrôle de release

- Exécutez `pnpm check:test-types` avant la vérification préalable de release afin que le TypeScript de test reste
  couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la vérification préalable de release afin que les vérifications plus larges
  des cycles d'importation et des limites d'architecture soient vertes en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release
  `dist/*` attendus et le bundle Control UI existent pour l'étape de validation
  du package
- Exécutez `pnpm release:prep` après l'incrément de version racine et avant le balisage. Il
  exécute chaque générateur de release déterministe qui dérive couramment après un
  changement de version/configuration/API : versions des plugins, inventaire des plugins, schéma de configuration
  de base, métadonnées de configuration des canaux groupés, référence de documentation de configuration, exports du plugin SDK
  et référence d'API du plugin SDK. `pnpm release:check` réexécute ces
  garde-fous en mode vérification et signale en une seule passe chaque échec de dérive générée qu'il trouve
  avant d'exécuter les vérifications de release des packages.
- La synchronisation des versions de plugins met à jour par défaut les versions des packages de plugins officiels et les planchers
  `openclaw.compat.pluginApi` existants vers la version de release d'OpenClaw.
  Traitez ce champ comme le plancher de l'API plugin SDK/runtime, pas seulement comme une copie
  de la version du package : pour les releases propres aux plugins qui restent intentionnellement
  compatibles avec des hôtes OpenClaw plus anciens, conservez le plancher à la plus ancienne API d'hôte prise en charge
  et documentez ce choix dans la preuve de release du plugin.
- Exécutez le workflow manuel `Full Release Validation` avant l'approbation de release afin de
  lancer toutes les boîtes de test pré-release depuis un seul point d'entrée. Il accepte une branche,
  une balise ou un SHA de commit complet, déclenche manuellement `CI`, et déclenche
  `OpenClaw Release Checks` pour le smoke test d'installation, l'acceptation de package, les vérifications de packages
  inter-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables et complètes
  incluent toujours des tests live/E2E exhaustifs et un soak Docker du chemin de release ;
  `run_release_soak=true` est conservé pour un soak bêta explicite. Package
  Acceptance fournit l'E2E Telegram de package canonique pendant la validation du candidat,
  évitant un second poller live concurrent.
  Fournissez `release_package_spec` après la publication d'une bêta pour réutiliser le package npm livré
  dans les vérifications de release, Package Acceptance et l'E2E Telegram de package
  sans reconstruire l'archive tar de release. Fournissez
  `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un package publié
  différent du reste de la validation de release. Fournissez
  `package_acceptance_package_spec` lorsque Package Acceptance doit utiliser un package publié
  différent de la spécification de package de release. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve de release doit prouver que la
  validation correspond à un package npm publié sans forcer l'E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal latéral
  pour un candidat de package pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest`, ou une version de release exacte ; `source=ref`
  pour empaqueter une branche/balise/SHA `package_ref` fiable avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS publique avec un
  SHA-256 requis et une politique stricte d'URL publique ; `source=trusted-url` pour une
  politique de source fiable nommée utilisant `trusted_source_id` et SHA-256 requis ; ou
  `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le
  workflow résout le candidat vers
  `package-under-test`, réutilise le planificateur de release Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l'artefact de package
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée. `update-restart-auth` utilise le package candidat comme
  CLI installée et comme package-under-test afin d'exercer le chemin de redémarrage
  géré de la commande de mise à jour du candidat.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies package/mise à jour/redémarrage/plugin natives de l'artefact sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : blocs du chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin d'une couverture CI normale
  déterministe pour le candidat de release. Les déclenchements manuels de CI contournent la
  portée des changements et forcent les shards Linux Node, les shards de plugins groupés, les shards de contrats de plugins et
  de canaux, la compatibilité Node 22, `check-*`, `check-additional-*`,
  les smoke checks d'artefacts construits, les vérifications docs, les Skills Python, Windows, macOS et
  les voies i18n de Control UI. Les exécutions CI manuelles autonomes n'exécutent Android que lorsqu'elles sont déclenchées
  avec `include_android=true` ; `Full Release Validation` transmet cette entrée à
  son enfant CI.
  Exemple avec Android : `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie l'export des traces, métriques et journaux,
  ainsi que des attributs de trace bornés et la rédaction du contenu/des identifiants
  sans nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm qa:otel:collector-smoke` lors de la validation de la compatibilité du collecteur.
  Il route le même export OTLP de QA-lab via un vrai conteneur Docker OpenTelemetry Collector
  avant les assertions du récepteur local.
- Exécutez `pnpm qa:prometheus:smoke` lors de la validation du scraping Prometheus protégé.
  Il exerce QA-lab, rejette les scrapes non authentifiés et vérifie que
  les familles de métriques critiques pour la release restent exemptes de contenu de prompt, d'identifiants bruts,
  de jetons d'authentification et de chemins locaux.
- Exécutez `pnpm qa:observability:smoke` lorsque vous voulez enchaîner les voies smoke
  OpenTelemetry et Prometheus du checkout source.
- Exécutez `pnpm release:check` avant chaque release balisée
- La vérification préalable `OpenClaw NPM Release` génère des preuves de release des dépendances avant
  d'empaqueter l'archive tar npm. La barrière des vulnérabilités d'avis npm est
  bloquante pour la release. Les rapports de risque de manifeste transitif, de surface propriété/installation
  des dépendances et de changement des dépendances sont uniquement des preuves de release. Le
  rapport de changement des dépendances compare le candidat de release à la balise de release atteignable
  précédente.
- La vérification préalable téléverse les preuves de dépendances sous
  `openclaw-release-dependency-evidence-<tag>` et les intègre aussi sous
  `dependency-evidence/` dans l'artefact npm préparé de vérification préalable. Le vrai
  chemin de publication réutilise cet artefact de vérification préalable, puis joint les mêmes preuves
  à la release GitHub sous `openclaw-<version>-dependency-evidence.zip`.
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après que la
  balise existe. Déclenchez-le depuis `release/YYYY.M.PATCH` (ou `main` lors de la publication d'une
  balise atteignable depuis main), transmettez la balise de release, le
  `preflight_run_id` npm OpenClaw réussi et le `full_release_validation_run_id` réussi, et conservez
  la portée de publication des plugins par défaut `all-publishable` sauf si vous exécutez délibérément
  une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication
  ClawHub des plugins et la publication npm d'OpenClaw afin que le package cœur ne soit pas publié
  avant ses plugins externalisés.
- La publication stable `OpenClaw Release Publish` exige un `windows_node_tag` exact après
  l'existence de la release non pré-release correspondante `openclaw/openclaw-windows-node`.
  Elle exige aussi la carte `windows_node_installer_digests` approuvée pour le candidat.
  Avant de déclencher un enfant de publication, elle vérifie que la release source est
  publiée, non pré-release, contient les installateurs x64/ARM64 requis et
  correspond toujours à cette carte approuvée. Elle déclenche ensuite `Windows Node Release`
  pendant que la release OpenClaw est encore un brouillon, en transportant sans modification la carte épinglée
  des condensats d'installateurs. Le workflow enfant
  télécharge les installateurs Windows Hub signés depuis cette balise exacte,
  les compare aux condensats épinglés, vérifie que leurs signatures Authenticode
  utilisent le signataire OpenClaw Foundation attendu sur un runner Windows,
  écrit un manifeste SHA-256 et téléverse les installateurs plus le manifeste sur la
  release GitHub OpenClaw canonique, puis retélécharge les actifs promus et
  vérifie l'appartenance au manifeste et les hachages. Le parent vérifie le contrat actuel
  des actifs x64, ARM64 et de somme de contrôle avant la publication. La récupération directe
  rejette les noms d'actifs `OpenClawCompanion-*` inattendus avant de remplacer les
  actifs de contrat attendus par les octets source épinglés. Déclenchez manuellement
  `Windows Node Release` uniquement pour la récupération, et transmettez toujours une balise exacte, jamais
  `latest`, plus la carte JSON explicite `expected_installer_digests` depuis la
  release source approuvée. Les liens de téléchargement du site web doivent cibler les URL exactes d'actifs
  de release OpenClaw pour la release stable actuelle, ou
  `releases/latest/download/...` uniquement après avoir vérifié que la redirection latest de GitHub
  pointe vers cette même release ; ne liez pas uniquement vers la page de release du dépôt companion.
- Les vérifications de release s'exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil Matrix
  live rapide et la voie QA Telegram avant l'approbation de release. Les voies live
  utilisent l'environnement `qa-live-shared` ; Telegram utilise aussi des baux d'identifiants
  Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l'inventaire Matrix complet
  du transport, des médias et de l'E2EE en parallèle.
- La validation d'installation et de mise à niveau runtime inter-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement
  le workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et axé sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de release portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une balise ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche ou une balise de release OpenClaw
- La vérification préalable en validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  actuel de 40 caractères de la branche de workflow sans exiger de balise poussée
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication exige toujours une vraie balise de release
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners
  hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les runners Linux
  Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préalable de release npm n'attend plus la voie séparée des vérifications de release
- Avant de baliser localement un candidat de release, exécutez
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. L'assistant
  exécute les garde-fous de release rapides, les vérifications de release npm/ClawHub des plugins, la construction,
  la construction UI et `release:openclaw:npm:check` dans l'ordre qui détecte les erreurs courantes
  bloquant l'approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou la balise bêta/correction correspondante) avant l'approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin
  d’installation du registre publié dans un nouveau préfixe temporaire
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et
  l’E2E Telegram réel par rapport au paquet npm publié en utilisant le pool
  partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales des
  mainteneurs peuvent omettre les variables Convex et fournir directement les
  trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke bêta complet après publication depuis une machine de
  mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant
  exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche
  `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge
  l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification après publication depuis
  GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est
  volontairement uniquement manuel et ne s’exécute pas à chaque fusion.
- L’automatisation de publication des mainteneurs utilise désormais
  préflight-puis-promotion :
  - la vraie publication npm doit avoir une exécution npm `preflight_run_id`
    réussie
  - la vraie publication npm doit être déclenchée depuis la même branche `main`
    ou `release/YYYY.M.PATCH` que l’exécution de préflight réussie
  - les versions npm stables utilisent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du
    workflow
  - la mutation du dist-tag npm basée sur un jeton vit désormais dans
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, car
    `npm dist-tag add` nécessite toujours `NPM_TOKEN`, tandis que le dépôt
    source conserve une publication uniquement OIDC
  - le workflow public `macOS Release` sert uniquement à la validation ; lorsqu’une
    balise n’existe que sur une branche de publication mais que le workflow est
    déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.PATCH`
  - la vraie publication macOS doit avoir un `preflight_run_id` macOS réussi et
    un `validate_run_id`
  - les chemins de vraie publication promeuvent les artefacts préparés au lieu
    de les reconstruire à nouveau
- Pour les versions correctives stables comme `YYYY.M.PATCH-N`, le vérificateur
  après publication vérifie également le même chemin de mise à niveau avec
  préfixe temporaire de `YYYY.M.PATCH` vers `YYYY.M.PATCH-N`, afin que les
  corrections de publication ne puissent pas laisser silencieusement les
  anciennes installations globales sur la charge utile stable de base
- Le préflight de publication npm échoue de manière fermée sauf si l’archive
  tar inclut à la fois `dist/control-ui/index.html` et une charge utile
  `dist/control-ui/assets/` non vide, afin que nous ne livrions plus un tableau
  de bord navigateur vide
- La vérification après publication contrôle aussi que les points d’entrée des
  plugins publiés et les métadonnées du paquet sont présents dans l’agencement
  installé depuis le registre. Une publication qui livre des charges utiles
  d’exécution de Plugin manquantes échoue au vérificateur postpublish et ne peut
  pas être promue vers `latest`.
- `pnpm test:install:smoke` applique également le budget npm pack `unpackedSize`
  sur l’archive tar candidate de mise à jour, afin que l’e2e d’installation
  détecte l’augmentation accidentelle de taille du pack avant le chemin de
  publication de la version
- Si le travail de publication a touché la planification CI, les manifestes de
  minutage des extensions ou les matrices de tests d’extensions, régénérez et
  révisez les sorties de matrice `plugin-prerelease-extension-shard` détenues
  par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant
  approbation, afin que les notes de publication ne décrivent pas une
  disposition CI obsolète
- La préparation d’une publication macOS stable inclut également les surfaces de
  mise à jour :
  - la publication GitHub doit finir par contenir les paquets `.zip`, `.dmg` et
    `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après
    publication ; le workflow de publication macOS le commit automatiquement ou
    ouvre une PR appcast lorsque le push direct est bloqué
  - l’application empaquetée doit conserver un identifiant de bundle non debug,
    une URL de flux Sparkle non vide et une `CFBundleVersion` supérieure ou
    égale au plancher canonique de build Sparkle pour cette version de
    publication

## Boîtes de test de release

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez le
helper afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

Le helper pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque workflow enfant `headSha`
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident
une exécution enfant d’un `main` plus récent.

Pour valider une branche ou une étiquette de release, exécutez-le depuis la référence de workflow `main`
fiable et passez la branche ou l’étiquette de release comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Le workflow résout la référence cible, déclenche manuellement `CI` avec
`target_ref=<release-ref>`, puis déclenche `OpenClaw Release Checks`.
`OpenClaw Release Checks` répartit les vérifications d’installation, les checks de release multi-OS,
la couverture live/E2E Docker du chemin de release quand le soak est activé, Package Acceptance
avec l’E2E canonique du package Telegram, la parité QA Lab, Matrix live et
Telegram live. Une exécution complète/all n’est acceptable que lorsque le résumé de `Full Release Validation`
affiche `normal_ci`, `plugin_prerelease` et `release_checks` comme
réussis, sauf si une réexécution ciblée a intentionnellement ignoré l’enfant distinct `Plugin
Prerelease`. Utilisez l’enfant autonome `npm-telegram` uniquement pour une réexécution ciblée
de package publié avec `release_package_spec` ou
`npm_telegram_package_spec`. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release
puisse voir le chemin critique actuel sans télécharger les journaux.
Voir [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et complet,
les artefacts et les identifiants de réexécution ciblée.
Les workflows enfants sont déclenchés depuis la référence fiable qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
ancienne branche ou étiquette de release. Il n’existe pas d’entrée séparée de référence de workflow Full Release Validation ;
choisissez le harness fiable en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve exacte de commit sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des références de déclenchement de workflow, donc utilisez
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/provider :

- `minimum` : chemin OpenAI/core live et Docker critique pour la release le plus rapide
- `stable` : minimum plus couverture stable provider/backend pour l’approbation de release
- `full` : stable plus large couverture consultative provider/médias

Les validations stable et complètes exécutent toujours le balayage exhaustif live/E2E, du
chemin de release Docker et des survivants de mise à niveau publiés bornés avant promotion.
Utilisez `run_release_soak=true` pour demander le même balayage pour une bêta. Ce balayage couvre
les quatre derniers packages stables plus les baselines épinglées `2026.4.23` et `2026.5.2`
ainsi qu’une couverture plus ancienne `2026.4.15`, avec les baselines en double supprimées et
chaque baseline fragmentée dans son propre job Docker runner.

`OpenClaw Release Checks` utilise la référence de workflow fiable pour résoudre la référence cible
une seule fois comme `release-package-under-test` et réutilise cet artefact dans les checks multi-OS,
Package Acceptance et Docker de chemin de release quand le soak s’exécute. Cela garde
toutes les boîtes orientées package sur les mêmes octets et évite les builds de package répétés.
Après qu’une bêta est déjà sur npm, définissez `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
afin que les checks de release téléchargent une seule fois le package publié, extraient son SHA de source de build
depuis `dist/build-info.json` et réutilisent cet artefact pour les voies multi-OS,
Package Acceptance, Docker de chemin de release et Telegram package.
Le smoke d’installation OpenAI multi-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable repo/org est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que d’évaluer le modèle par défaut le plus lent. La matrice provider live plus large
reste l’endroit pour la couverture propre aux modèles.

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

N’utilisez pas l’umbrella complet comme première réexécution après un correctif ciblé. Si une boîte
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de package, le provider
de modèle ou la voie QA en échec pour la preuve suivante. Réexécutez l’umbrella complet uniquement lorsque
le correctif a modifié l’orchestration de release partagée ou a rendu obsolète la preuve antérieure
sur toutes les boîtes. Le vérificateur final de l’umbrella revérifie les identifiants d’exécution des workflows enfants
enregistrés ; donc, après qu’un workflow enfant a été réexécuté avec succès, réexécutez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’umbrella. `all` est la vraie
exécution release-candidate, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant plugin réservé aux releases, `release-checks` exécute chaque boîte de release,
et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les réexécutions ciblées `npm-telegram` nécessitent `release_package_spec` ou
`npm_telegram_package_spec` ; les exécutions complètes/all utilisent l’E2E Telegram canonique du package
dans Package Acceptance. Les réexécutions ciblées
multi-OS peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs de checks de release QA bloquent la validation de release
normale, y compris la dérive requise des outils dynamiques OpenClaw dans le niveau standard.
Les exécutions alpha Tideclaw peuvent encore traiter les voies de checks de release non liées à la sécurité des packages comme
consultatives. Lorsque `live_suite_filter` demande explicitement une voie live QA avec gate telle
que Discord, WhatsApp ou Slack, la variable de repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondante doit être activée ; sinon
la capture d’entrée échoue au lieu d’ignorer silencieusement la voie.

### Vitest

La boîte Vitest est le workflow enfant `CI` manuel. La CI manuelle contourne intentionnellement
le périmètre des changements et force le graphe de tests normal pour le candidat de release :
fragments Linux Node, fragments de plugins groupés, fragments de contrats de plugins et de canaux,
compatibilité Node 22, `check-*`, `check-additional-*`,
smoke checks d’artefacts construits, checks de docs, Python skills, Windows, macOS
et i18n Control UI. Android est inclus lorsque `Full Release Validation` exécute la
boîte, car l’umbrella passe `include_android=true` ; une CI manuelle autonome
nécessite `include_android=true` pour la couverture Android.

Utilisez cette boîte pour répondre à « l’arborescence source a-t-elle réussi toute la suite de tests normale ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments en échec ou lents dans les jobs CI lors de l’investigation de régressions
- artefacts de timing Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse des performances

Exécutez directement la CI manuelle uniquement lorsque la release nécessite une CI normale déterministe mais
pas les boîtes Docker, QA Lab, live, multi-OS ou package. Utilisez la première commande
pour une CI directe sans Android. Ajoutez `include_android=true` lorsque la CI directe
du release-candidate doit couvrir Android :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La boîte Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke`
en mode release. Elle valide le candidat de release dans des environnements Docker packagés
au lieu de se limiter aux tests au niveau source.

La couverture Docker de release inclut :

- smoke d’installation complet avec le smoke d’installation globale Bun lent activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec les jobs de smoke QR,
  racine/Gateway et installeur/Bun exécutés comme fragments install-smoke séparés
- voies E2E du dépôt
- fragments Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsque demandée
- voies divisées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites provider live/E2E et couverture de modèles live Docker lorsque les checks de release
  incluent les suites live

Utilisez les artefacts Docker avant de réexécuter. Le planificateur du chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les timings de phases, le JSON du plan du planificateur et les commandes de réexécution. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au lieu de
réexécuter tous les fragments de release. Les commandes de réexécution générées incluent les entrées antérieures
`package_artifact_run_id` et les images Docker préparées lorsque disponibles, afin qu’une
voie en échec puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. C’est le gate de release
du comportement agentique et du niveau canal, distinct de Vitest et des mécaniques de package
Docker.

La couverture QA Lab de release inclut :

- voie de parité mock comparant la voie candidate OpenAI à la baseline Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant des baux d’identifiants CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` ou
  `pnpm qa:observability:smoke` lorsque la télémétrie de release nécessite une preuve locale
  explicite

Utilisez cette boîte pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les voies de parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible comme
exécution QA-Lab fragmentée manuelle plutôt que comme voie critique de release par défaut.

### Package

La boîte Package est le gate du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat dans le tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
référence du harness de workflow séparée de la référence source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
  version
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS public avec le `package_sha256` requis ;
  les identifiants dans l’URL, les ports HTTPS non par défaut, les noms d’hôte ou adresses résolues privés/internes/à usage spécial,
  ainsi que les redirections non sûres sont rejetés
- `source=trusted-url` : télécharger un `.tgz` HTTPS avec le
  `package_sha256` requis et `trusted_source_id` depuis une politique nommée dans
  `.github/package-trusted-sources.json` ; utilisez cette option pour les miroirs d’entreprise ou dépôts de packages privés
  appartenant aux mainteneurs, au lieu d’ajouter un contournement de réseau privé au niveau de l’entrée à `source=url`
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artifact
de package de publication préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve les migrations, les mises à jour,
le redémarrage de mise à jour avec authentification configurée, l’installation de Skills ClawHub en direct, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin hors ligne, la mise à jour de Plugin et la QA du package Telegram sur la même archive tar résolue. Les vérifications de publication bloquantes utilisent la référence par défaut du dernier package publié ;
le profil bêta avec `run_release_soak=true`, `release_profile=stable` ou
`release_profile=full` s’étend à chaque référence stable publiée sur npm depuis
`2026.4.23` jusqu’à `latest`, plus les fixtures de problèmes signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà publié,
`source=ref` pour une archive tar npm locale adossée à un SHA avant publication,
`source=trusted-url` pour un miroir d’entreprise/privé appartenant aux mainteneurs, ou
`source=artifact` pour une archive tar préparée téléversée par une autre exécution GitHub Actions.
C’est le remplacement natif GitHub
de la plupart de la couverture package/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de publication multi-OS restent importantes pour les comportements
d’intégration initiale, d’installateur et de plateforme propres à chaque OS, mais la validation produit package/mise à jour doit
privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des Plugins est
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle voie locale, Docker, Package Acceptance ou de vérification de publication prouve un
changement d’installation/mise à jour de Plugin, de nettoyage doctor ou de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` séparé, qui ne fait pas partie de Full Release CI.

La tolérance héritée de package-acceptance est volontairement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de
`gateway install --wrapper`, fichiers de correctif absents de la fixture git dérivée de l’archive tar,
absence de `update.channel` persisté, anciens emplacements d’enregistrements d’installation de Plugin,
absence de persistance des enregistrements d’installation du marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le package `2026.4.26` publié peut avertir
pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font échouer la
validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication porte sur un
package réellement installable :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Profils de package courants :

- `smoke` : voies rapides d’installation de package/canal/agent, réseau Gateway et rechargement de configuration
- `package` : contrats package d’installation/mise à jour/redémarrage/Plugin, plus preuve d’installation de Skills ClawHub en direct ; c’est la valeur par défaut des vérifications de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : segments Docker du chemin de publication avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des réexécutions ciblées

Pour une preuve Telegram de candidat package, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet l’archive tar
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication des versions

`OpenClaw Release Publish` est le point d’entrée normal de publication mutatrice. Il
orchestre les workflows d’éditeur de confiance dans l’ordre requis par la publication :

1. Extraire la balise de publication et résoudre son SHA de commit.
2. Vérifier que la balise est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec le même périmètre et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec la balise de publication, la dist-tag npm et
   le `preflight_run_id` enregistré après vérification du
   `full_release_validation_run_id` enregistré.
7. Pour les publications stables, créer ou mettre à jour la publication GitHub en brouillon, déclencher
   `Windows Node Release` avec le `windows_node_tag` explicite et les
   `windows_node_installer_digests` approuvés pour le candidat, puis vérifier les assets
   canoniques d’installateur/somme de contrôle avant de publier le brouillon.

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

Utilisez les workflows de niveau inférieur `Plugin NPM Release` et `Plugin ClawHub Release`
uniquement pour des travaux ciblés de réparation ou de republication. `OpenClaw Release Publish` rejette
`plugin_publish_scope=selected` lorsque `publish_openclaw_npm=true`, afin que le package
cœur ne puisse pas être livré sans chaque Plugin officiel publiable, y compris
`@openclaw/diffs-language-pack`. Pour une réparation de Plugin sélectionné, définissez
`publish_openclaw_npm=false` avec `plugin_publish_scope=selected` et
`plugins=@openclaw/name`, ou déclenchez directement le workflow enfant.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise telle que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, elle peut aussi être le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle pour une pré-vérification uniquement de validation
- `preflight_only` : `true` pour validation/build/package seulement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication pour que le workflow réutilise
  l’archive tar préparée depuis l’exécution de pré-vérification réussie
- `npm_dist_tag` : balise npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise ; elle doit déjà exister
- `preflight_run_id` : id d’exécution de pré-vérification `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `full_release_validation_run_id` : id d’exécution `Full Release Validation` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `windows_node_tag` : balise de publication exacte non préversion de `openclaw/openclaw-windows-node` ;
  requise pour une publication stable d’OpenClaw
- `windows_node_installer_digests` : carte JSON compacte approuvée pour le candidat des
  noms actuels des installateurs Windows vers leurs condensats `sha256:` épinglés ; requise
  pour une publication stable d’OpenClaw
- `npm_dist_tag` : balise npm cible pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux ciblés de réparation de Plugins seuls avec `publish_openclaw_npm=false`
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation de Plugins seuls
- `wait_for_clawhub` : valeur par défaut `false`, afin que la disponibilité npm ne soit pas bloquée par
  le sidecar ClawHub ; définissez `true` uniquement lorsque l’achèvement du workflow doit inclure
  l’achèvement de ClawHub

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, balise ou SHA de commit complet à valider. Les vérifications porteuses de secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou une
  balise de publication.
- `run_release_soak` : active le soak exhaustif live/E2E, chemin de publication Docker et
  upgrade-survivor depuis toutes les versions pour les vérifications de publication bêta. Il est forcé par
  `release_profile=stable` et `release_profile=full`.

Règles :

- Les balises stables et de correction peuvent publier vers `beta` ou `latest`
- Les balises de préversion bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la pré-vérification ;
  le workflow vérifie que les métadonnées avant publication restent cohérentes

## Séquence de publication npm stable

Lors de la préparation d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’une balise existe, vous pouvez utiliser le SHA complet actuel du commit
     de la branche du workflow pour une répétition générale de validation uniquement du workflow de prévol
2. Choisissez `npm_dist_tag=beta` pour le flux bêta d’abord normal, ou `latest` seulement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de publication, la balise de publication ou le SHA complet
   du commit lorsque vous voulez la CI normale plus la couverture du cache de prompts en direct, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de publication
5. Sélectionnez la balise de publication `openclaw/openclaw-windows-node` exacte, non préversion,
   dont les installateurs signés x64 et ARM64 doivent être publiés. Enregistrez-la sous
   `windows_node_tag`, et enregistrez leur carte de condensés validée sous
   `windows_node_installer_digests`. L’assistant de version candidate enregistre les deux
   et les inclut dans sa commande de publication générée.
6. Enregistrez les `preflight_run_id` et `full_release_validation_run_id` réussis
7. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   le `windows_node_tag` sélectionné, son `windows_node_installer_digests` enregistré,
   le `preflight_run_id` enregistré et le `full_release_validation_run_id` enregistré ;
   cela publie les plugins externalisés sur npm et ClawHub avant de promouvoir le
   package npm OpenClaw
8. Si la publication a atterri sur `beta`, utilisez le
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
9. Si la publication a intentionnellement été publiée directement vers `latest` et que `beta`
   doit suivre immédiatement la même build stable, utilisez ce même workflow de publication
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   d’auto-réparation planifiée déplacer `beta` plus tard

La mutation de dist-tag se trouve dans le dépôt du registre des publications, car elle nécessite encore
`NPM_TOKEN`, tandis que le dépôt source conserve une publication uniquement OIDC.

Cela garde à la fois le chemin de publication directe et le chemin de promotion bêta d’abord
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur une authentification npm locale, exécutez toutes les commandes
CLI (`op`) 1Password uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes et la gestion OTP observables, et empêche les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de publication](/fr/install/development-channels)

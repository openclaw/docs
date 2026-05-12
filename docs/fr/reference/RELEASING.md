---
read_when:
    - Recherche des définitions publiques des canaux de publication
    - Exécution de la validation de version ou de l’acceptation de package
    - Recherche du nommage et de la cadence des versions
summary: Voies de publication, liste de contrôle de l’opérateur, encadrés de validation, nomenclature des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-12T08:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw propose trois canaux de publication publics :

- stable : versions taguées publiées sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- bêta : tags de préversion publiés sur npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la version npm stable actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les versions stables et les versions de correction stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build bêta validée
- Chaque version stable d’OpenClaw livre ensemble le package npm et l’app macOS ;
  les versions bêta valident et publient normalement d’abord le chemin npm/package,
  la build/signature/notarisation de l’app mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications avancent d’abord en bêta
- La version stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D`
  créée à partir du `main` actuel, afin que la validation et les corrections de publication ne bloquent pas le nouveau
  développement sur `main`
- Si un tag bêta a été poussé ou publié et nécessite une correction, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle présente la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées orientées utilisateur, la committer, la pousser, puis rebase/pull
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Incrémenter chaque emplacement de version requis pour le tag prévu, puis exécuter
   `pnpm release:prep`. Cela actualise les versions de plugins, l’inventaire des plugins, le schéma de
   configuration, les métadonnées de configuration des canaux groupés, la base de référence de la documentation
   de configuration, les exports du SDK de plugin et la base de référence de l’API du SDK de plugin dans le bon ordre. Committer toute dérive générée
   avant de taguer. Exécuter ensuite le preflight déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de branche de publication à 40 caractères est autorisé pour le preflight
   de validation uniquement. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA de commit complet. C’est l’unique point d’entrée manuel
   pour les quatre grands bancs de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou allowlist de modèles échoué qui
   prouve la correction. Ne relancer l’umbrella complet que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, taguer `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Cela vérifie `pnpm plugins:sync:check`,
   déclenche la publication de tous les packages de plugins publiables vers npm et le même ensemble vers
   ClawHub en parallèle, puis promeut l’artefact preflight npm OpenClaw préparé
   avec le dist-tag correspondant dès que la publication npm des plugins réussit.
   Après la réussite de l’enfant de publication npm OpenClaw, cela crée ou met à jour la
   page GitHub release/prerelease correspondante à partir de la section complète correspondante de
   `CHANGELOG.md`. Les publications stables publiées sur npm `latest` deviennent la dernière
   release GitHub ; les publications de maintenance stables conservées sur npm `beta` sont
   créées avec GitHub `latest=false`.
   La publication ClawHub peut encore être en cours lorsque la publication npm d’OpenClaw s’exécute, mais le
   workflow de publication affiche immédiatement les ID des exécutions enfants. Par défaut, il
   n’attend pas ClawHub après l’avoir déclenché, afin que la disponibilité npm d’OpenClaw
   ne soit pas bloquée par des approbations ClawHub ou du travail de registre plus lents ; définir
   `wait_for_clawhub=true` lorsque ClawHub doit bloquer la fin du workflow. Le
   chemin ClawHub réessaie les échecs transitoires d’installation de dépendances CLI, publie
   les plugins dont l’aperçu réussit même lorsqu’une cellule d’aperçu est instable, et se termine par
   une vérification du registre pour chaque version de plugin attendue afin que les publications partielles
   restent visibles et relançables. Après publication, exécuter
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   pour vérifier en une seule commande la préversion GitHub, les dist-tags npm `beta`,
   l’intégrité npm, le chemin d’installation publié, les versions exactes ClawHub, les artefacts ClawHub et les conclusions
   des workflows enfants. Ajouter `--rerun-failed-clawhub` lorsque le sidecar
   ClawHub a échoué uniquement dans des jobs relançables et doit être relancé sur place.
   Exécuter ensuite l’acceptation post-publication du package contre le package publié
   `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une préversion poussée ou publiée nécessite une correction,
   créer le numéro de préversion correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   préversion.
10. Pour la version stable, continuer uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact preflight réussi via
    `preflight_run_id` ; la préparation de la publication stable macOS exige aussi les
    `.zip`, `.dmg`, `.dSYM.zip` empaquetés et le `appcast.xml` mis à jour sur `main`.
    Le workflow privé de publication macOS publie automatiquement l’appcast signé vers le
    `main` public après vérification des artefacts de publication ; si la protection de branche bloque
    le push direct, il ouvre ou met à jour une PR d’appcast.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram npm publié
    autonome optionnel lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion du dist-tag si nécessaire, vérifier la page de publication GitHub générée,
    et exécuter les étapes d’annonce de publication.

## Preflight de publication

- Exécutez `pnpm check:test-types` avant le précontrôle de publication afin que le TypeScript des tests reste
  couvert en dehors du garde-fou local plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le précontrôle de publication afin que les vérifications plus larges des
  cycles d’importation et des frontières d’architecture soient vertes en dehors du garde-fou local plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication attendus
  `dist/*` et le bundle Control UI existent pour l’étape de validation du paquet
- Exécutez `pnpm release:prep` après l’incrément de version racine et avant le tag. Cette commande
  exécute tous les générateurs de publication déterministes qui dérivent couramment après un
  changement de version, de configuration ou d’API : versions des plugins, inventaire des plugins, schéma de configuration
  de base, métadonnées de configuration des canaux groupés, référence de documentation de configuration, exports du SDK
  de plugin et référence d’API du SDK de plugin. `pnpm release:check` réexécute ces
  garde-fous en mode vérification et signale en une seule passe toutes les dérives générées qu’il trouve
  avant d’exécuter les vérifications de publication de paquet.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de publication pour
  lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche manuellement `CI` et déclenche
  `OpenClaw Release Checks` pour les lanes d’essai d’installation, d’acceptation de paquet, de
  vérifications de paquet inter-OS, de parité QA Lab, Matrix et Telegram. Les exécutions stables/par défaut
  gardent les tests exhaustifs live/E2E et le soak du chemin de publication Docker derrière
  `run_release_soak=true` ; `release_profile=full` force l’activation du soak. Avec
  `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de paquet
  contre l’artefact `release-package-under-test` provenant des vérifications de publication.
  Fournissez `release_package_spec` après la publication d’une bêta pour réutiliser le paquet npm livré
  dans les vérifications de publication, Package Acceptance et l’E2E Telegram de paquet sans
  reconstruire le tarball de publication. Fournissez
  `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un paquet publié différent
  du reste de la validation de publication. Fournissez
  `package_acceptance_package_spec` lorsque Package Acceptance doit utiliser un paquet publié différent
  de la spécification de paquet de publication. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la
  validation correspond à un paquet npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal secondaire
  pour un candidat de paquet pendant que le travail de publication continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref`
  pour empaqueter une branche, un tag ou un SHA `package_ref` fiable avec le harnais
  `workflow_ref` actuel ; `source=url` pour un tarball HTTPS avec un SHA-256 requis ;
  ou `source=artifact` pour un tarball téléversé par une autre exécution GitHub
  Actions. Le workflow résout le candidat vers
  `package-under-test`, réutilise l’ordonnanceur de publication Docker E2E contre ce
  tarball et peut exécuter la QA Telegram contre le même tarball avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  lanes Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de paquet
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée. `update-restart-auth` utilise le paquet candidat comme
  CLI installé et comme package-under-test afin d’exercer le chemin de redémarrage
  géré de la commande de mise à jour candidate.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : lanes d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : lanes natives à l’artefact pour paquet/mise à jour/redémarrage/plugin sans OpenWebUI ni ClawHub live
  - `product` : profil paquet plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : segments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez le workflow manuel `CI` directement lorsque vous avez seulement besoin d’une couverture CI normale complète
  pour le candidat de publication. Les déclenchements CI manuels contournent le
  périmètre des changements et forcent les shards Linux Node, les shards de plugins groupés, les
  contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, l’essai de build,
  les vérifications de documentation, les Skills Python, Windows, macOS, Android et les lanes i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cette commande exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés,
  les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après que le
  tag existe. Déclenchez-la depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un
  tag accessible depuis main), passez le tag de publication et le `preflight_run_id` npm OpenClaw
  réussi, et conservez la portée de publication de plugins par défaut
  `all-publishable`, sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le paquet cœur ne soit pas publié avant ses plugins externalisés.
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la lane de parité mock QA Lab ainsi que le profil Matrix
  live rapide et la lane QA Telegram avant l’approbation de publication. Les lanes live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants CI
  Convex. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet Matrix
  transport, média et E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau inter-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre lane afin de ne pas ralentir ni bloquer la publication
- Les vérifications de publication portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique du workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est accessible depuis une branche OpenClaw ou un tag de publication
- Le précontrôle en validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de paquet ; la véritable publication exige toujours un vrai tag de publication
- Les deux workflows gardent le vrai chemin de publication et de promotion sur les runners hébergés par GitHub,
  tandis que le chemin de validation non mutant peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  avec les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le précontrôle de publication npm n’attend plus la lane séparée des vérifications de publication
- Avant de taguer localement un candidat de publication, exécutez
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. L’assistant
  exécute les garde-fous rapides de publication, les vérifications de publication npm/ClawHub des plugins, le build,
  le build UI et `release:openclaw:npm:check` dans l’ordre qui détecte les erreurs courantes
  bloquant l’approbation avant le démarrage du workflow de publication GitHub.
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation depuis le registre publié
  dans un préfixe temporaire frais
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et l’E2E Telegram réel
  contre le paquet npm publié à l’aide du pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke bêta complet après publication depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, sonde l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification après publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et
  ne s’exécute pas à chaque merge.
- L’automatisation de publication des mainteneurs utilise désormais précontrôle puis promotion :
  - la véritable publication npm doit passer un `preflight_run_id` npm réussi
  - la véritable publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de précontrôle réussie
  - les publications npm stables ciblent `beta` par défaut
  - une publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de dist-tag npm basée sur token réside désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve une publication uniquement OIDC
  - la publication publique `macOS Release` est uniquement une validation ; lorsqu’un tag n’existe que sur une
    branche de publication mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la véritable publication mac privée doit passer un `preflight_run_id` et un `validate_run_id`
    mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur après publication
  vérifie aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la
  charge utile stable de base
- Le précontrôle de publication npm échoue en mode fermé sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin que nous ne livrions plus un tableau de bord de navigateur vide
- La vérification après publication vérifie aussi que les points d’entrée des plugins publiés et
  les métadonnées de paquet sont présents dans la disposition installée du registre. Une publication qui
  livre des charges utiles d’exécution de plugins manquantes échoue au vérificateur après publication et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` impose aussi le budget npm pack `unpackedSize` sur
  le tarball de mise à jour candidat, de sorte que l’e2e de l’installateur détecte le gonflement accidentel du paquet
  avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de timing d’extensions ou
  les matrices de tests d’extensions, régénérez et examinez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l’approbation afin que les notes de publication ne
  décrivent pas une disposition CI obsolète
- La préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication ; le
    workflow privé de publication macOS le commit automatiquement ou ouvre une PR appcast
    lorsque le push direct est bloqué
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et une `CFBundleVersion` au moins égale au plancher de build Sparkle canonique
    pour cette version de publication

## Boîtes de test de version

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de préversion depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez le
helper afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

Le helper pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque workflow enfant `headSha`
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une exécution enfant
de `main` plus récente.

Pour la validation d’une branche ou d’un tag de version, exécutez-la depuis la réf de workflow `main` de confiance
et passez la branche ou le tag de version comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la réf cible, déclenche le `CI` manuel avec
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les vérifications orientées package, et
déclenche l’E2E Telegram de package autonome lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `release_package_spec` ou
`npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite l’installation smoke, les vérifications de version cross-OS, la couverture live/E2E Docker
du chemin de version lorsque le soak est activé, Package Acceptance avec la QA du package Telegram,
la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
affiche `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit également réussir ; hors full/all, il est ignoré
sauf si un `release_package_spec` ou `npm_telegram_package_spec` publié a été
fourni. Le résumé final du vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de version puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de version](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre les profils stable et full,
les artefacts et les points de reprise ciblée.
Les workflows enfants sont déclenchés depuis la réf de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou un tag de version plus ancien. Il n’existe pas d’entrée de réf de workflow Full Release Validation
séparée ; choisissez le harnais de confiance en choisissant la réf d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur `main` en mouvement ;
les SHA de commit bruts ne peuvent pas être des réfs de dispatch de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour choisir l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/cœur live et Docker critique de version le plus rapide
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de version
- `full` : stable plus large couverture consultative fournisseur/média

Utilisez `run_release_soak=true` avec `stable` lorsque les lignes bloquantes de version sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de version Docker, et
borné de survivance aux mises à niveau publiées avant la promotion. Ce balayage couvre
les quatre derniers packages stables plus les baselines épinglées `2026.4.23` et `2026.5.2`
ainsi qu’une couverture plus ancienne `2026.4.15`, avec les baselines dupliquées supprimées et
chaque baseline fragmentée dans son propre job de runner Docker. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la réf de workflow de confiance pour résoudre la réf cible
une seule fois sous forme de `release-package-under-test` et réutilise cet artefact dans les vérifications cross-OS,
Package Acceptance et Docker du chemin de version lorsque le soak s’exécute. Cela garde
toutes les boîtes orientées package sur les mêmes octets et évite les builds de package répétés.
Après qu’une bêta est déjà sur npm, définissez `release_package_spec=openclaw@YYYY.M.D-beta.N`
afin que les vérifications de version téléchargent une seule fois le package livré, extraient son SHA source de build
depuis `dist/build-info.json`, puis réutilisent cet artefact pour les lignes cross-OS,
Package Acceptance, Docker du chemin de version et package Telegram.
L’installation smoke OpenAI cross-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable repo/org est définie, sinon `openai/gpt-5.4`, car cette ligne
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de mesurer le modèle par défaut le plus lent. La matrice live fournisseur plus large
reste l’endroit destiné à la couverture propre aux modèles.

Utilisez ces variantes selon l’étape de version :

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ombrelle complète comme première reprise après un correctif ciblé. Si une boîte
échoue, utilisez le workflow enfant, le job, la ligne Docker, le profil de package, le fournisseur de modèle
ou la ligne QA en échec pour la preuve suivante. Réexécutez l’ombrelle complète uniquement lorsque
le correctif a modifié l’orchestration de version partagée ou rendu obsolètes les preuves antérieures de toutes les boîtes.
Le vérificateur final de l’ombrelle revérifie les ids d’exécution de workflow enfant enregistrés,
donc après la réussite de la reprise d’un workflow enfant, relancez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la vraie
exécution de candidat de version, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin réservé à la version, `release-checks` exécute toutes les boîtes de version,
et les groupes de version plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les reprises `npm-telegram` ciblées exigent `release_package_spec` ou
`npm_telegram_package_spec` ; les exécutions full/all avec `release_profile=full` utilisent
l’artefact de package de release-checks. Les reprises
cross-OS ciblées peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA de release-checks sont consultatifs ; un échec QA seul
ne bloque pas la validation de version.

### Vitest

La boîte Vitest est le workflow enfant `CI` manuel. Le CI manuel contourne intentionnellement
le scoping des changements et force le graphe de tests normal pour le candidat de version :
fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de build, vérifications de docs, Skills Python,
Windows, macOS, Android et i18n de l’interface Control.

Utilisez cette boîte pour répondre à « l’arborescence source a-t-elle réussi la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de version. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments en échec ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez le CI manuel directement uniquement lorsque la version a besoin d’un CI normal déterministe mais
pas des boîtes Docker, QA Lab, live, cross-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La boîte Docker réside dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode version. Elle valide le candidat de version via des
environnements Docker packagés plutôt qu’uniquement avec des tests au niveau source.

La couverture Docker de version inclut :

- installation smoke complète avec le smoke d’installation globale Bun lent activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec les jobs smoke QR,
  root/gateway et installer/Bun exécutés comme fragments install-smoke séparés
- lignes E2E du dépôt
- fragments Docker du chemin de version : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsqu’elle est demandée
- lignes divisées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèle live Docker lorsque les vérifications de version
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. L’ordonnanceur du chemin de version téléverse
`.artifacts/docker-tests/` avec les journaux de ligne, `summary.json`, `failures.json`,
les chronométrages de phase, le JSON du plan d’ordonnancement et les commandes de reprise. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E plutôt que de
relancer tous les fragments de version. Les commandes de reprise générées incluent les entrées précédentes
`package_artifact_run_id` et d’image Docker préparée lorsqu’elles sont disponibles, afin qu’une
ligne en échec puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. C’est la porte de version
du comportement agentique et au niveau des canaux, distincte de Vitest et de la
mécanique de package Docker.

La couverture QA Lab de version inclut :

- ligne de parité mock comparant la ligne candidate OpenAI à la baseline Opus 4.6
  au moyen du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- ligne QA Telegram live utilisant des baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de version nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à « la version se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les lignes de parité, Matrix et Telegram
lors de l’approbation de la version. La couverture Matrix complète reste disponible sous forme
d’exécution QA-Lab fragmentée manuelle plutôt que comme ligne critique de version par défaut.

### Package

La boîte Package est la porte du produit installable. Elle est soutenue par
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
réf du harnais de workflow séparée de la réf source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de version OpenClaw
- `source=ref` : packager une branche, un tag ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artifact du package de publication préparé, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Package Acceptance maintient la migration, la mise à jour, le redémarrage après mise à jour avec authentification configurée, l’installation de Skills ClawHub en direct, le nettoyage des dépendances de plugins obsolètes, les fixtures de plugins hors ligne, la mise à jour de plugins et la QA du package Telegram sur la même archive tar résolue. Les vérifications de publication bloquantes utilisent la référence par défaut du dernier package publié ; `run_release_soak=true` ou `release_profile=full` étend la couverture à chaque référence stable publiée sur npm de `2026.4.23` à `latest`, plus les fixtures des problèmes signalés. Utilisez Package Acceptance avec `source=npm` pour un candidat déjà livré, ou `source=ref`/`source=artifact` pour une archive tar npm locale adossée à un SHA avant publication. C’est le remplacement natif GitHub de la majeure partie de la couverture package/mise à jour qui nécessitait auparavant Parallels. Les vérifications de publication inter-OS restent importantes pour l’onboarding, l’installateur et le comportement de plateforme spécifiques à l’OS, mais la validation produit package/mise à jour doit préférer Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour décider quelle voie locale, Docker, Package Acceptance ou de vérification de publication prouve une installation/mise à jour de plugin, un nettoyage doctor ou un changement de migration de package publié. La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est un workflow manuel `Update Migration` séparé, et ne fait pas partie de Full Release CI.

La tolérance héritée de package-acceptance est volontairement limitée dans le temps. Les packages jusqu’à `2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de `gateway install --wrapper`, fichiers de correctif absents de la fixture git dérivée de l’archive tar, absence de `update.channel` persisté, anciens emplacements d’enregistrements d’installation de plugins, absence de persistance des enregistrements d’installation marketplace, et migration des métadonnées de configuration pendant `plugins update`. Le package publié `2026.4.26` peut avertir pour les fichiers d’estampillage de métadonnées de build local déjà livrés. Les packages ultérieurs doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font échouer la validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication concerne un package réellement installable :

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
- `package` : contrats d’installation/mise à jour/redémarrage/package de plugin, plus preuve d’installation de Skills ClawHub en direct ; c’est la valeur par défaut des vérifications de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : fragments Docker du chemin de publication avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour des relances ciblées

Pour la preuve Telegram d’un candidat package, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet l’archive tar résolue `package-under-test` à la voie Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication des versions

`OpenClaw Release Publish` est le point d’entrée de publication mutable normal. Il orchestre les workflows de publication approuvée dans l’ordre requis par la version :

1. Extraire le tag de publication et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec le même scope et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de publication, le dist-tag npm et le `preflight_run_id` enregistré.

Exemple de publication bêta :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publication stable vers le dist-tag bêta par défaut :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

La promotion stable directement vers `latest` est explicite :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Utilisez les workflows de plus bas niveau `Plugin NPM Release` et `Plugin ClawHub Release` uniquement pour des travaux ciblés de réparation ou de republication. Pour une réparation de plugin sélectionné, passez `plugin_publish_scope=selected` et `plugins=@openclaw/name` à `OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis tel que `v2026.4.2`, `v2026.4.2-1` ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit complet de 40 caractères de la branche de workflow actuelle pour un preflight de validation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise l’archive tar préparée par l’exécution preflight réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis ; il doit déjà exister
- `preflight_run_id` : id d’exécution preflight réussi de `OpenClaw NPM Release` ; requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement pour un travail de réparation ciblé
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le workflow comme orchestrateur de réparation limitée aux plugins
- `wait_for_clawhub` : valeur par défaut `false` afin que la disponibilité npm ne soit pas bloquée par le sidecar ClawHub ; définissez `true` uniquement lorsque l’achèvement du workflow doit inclure l’achèvement ClawHub

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications portant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un tag de publication.
- `run_release_soak` : opter pour un soak exhaustif live/E2E, chemin de publication Docker et upgrade-survivor depuis toutes les versions sur les vérifications de publication stables/par défaut. Il est forcé par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent être publiés vers `beta` ou `latest`
- Les tags de prépublication bêta ne peuvent être publiés que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours uniquement de validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de publication npm stable

Lors de la préparation d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle pour une exécution à blanc, uniquement de validation, du workflow preflight
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de publication, le tag de publication ou le SHA de commit complet lorsque vous voulez la CI normale plus la couverture live du cache de prompts, Docker, QA Lab, Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le workflow manuel `CI` sur la ref de publication
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré ; il publie les plugins externalisés vers npm et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la publication a atterri sur `beta`, utilisez le workflow privé `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`
8. Si la publication a intentionnellement été faite directement vers `latest` et que `beta` doit suivre immédiatement le même build stable, utilisez ce même workflow privé pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation d’auto-réparation planifiée déplacer `beta` plus tard

La mutation des dist-tags vit dans le dépôt privé pour des raisons de sécurité, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela maintient à la fois le chemin de publication directe et le chemin de promotion bêta d’abord documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez les commandes CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op` directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites, alertes et la gestion OTP observables, et évite les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation de publication privée dans [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) pour le runbook réel.

## Associé

- [Canaux de publication](/fr/install/development-channels)

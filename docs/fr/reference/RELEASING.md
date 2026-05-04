---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de version ou l’acceptation de package
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, boîtes de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-04T07:06:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw propose trois canaux de publication publics :

- stable : versions étiquetées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : balises de préversion qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas compléter le mois ou le jour avec un zéro initial
- `latest` désigne la version stable npm actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les publications stables et correctives stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build beta validée
- Chaque publication stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les publications beta valident et publient normalement d’abord le chemin npm/paquet, la
  compilation/signature/notarisation de l’application Mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par beta
- Stable suit seulement après validation de la dernière beta
- Les mainteneurs créent normalement les publications à partir d’une branche `release/YYYY.M.D` créée
  depuis le `main` actuel, afin que la validation et les correctifs de publication ne bloquent pas le nouveau
  développement sur `main`
- Si une balise beta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise beta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle présente la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans
le guide de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI du `main` actuel est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder les entrées orientées utilisateur, la commiter, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Mettre à jour chaque emplacement de version requis pour la balise prévue, exécuter
   `pnpm plugins:sync` afin que les paquets Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter la prévalidation déterministe locale :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour une prévalidation
   uniquement destinée à la validation. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, canal, job de workflow, profil de paquet, fournisseur ou allowlist de modèle en échec qui
   prouve le correctif. Relancer l’umbrella complète uniquement lorsque la surface modifiée rend
   les preuves antérieures obsolètes.
9. Pour beta, étiqueter `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les paquets Plugin publiables vers npm, publie ensuite le même
   ensemble vers ClawHub sous forme de tarballs npm-pack ClawPack, puis promeut
   l’artefact de prévalidation npm OpenClaw préparé avec le dist-tag correspondant. Après
   publication, exécuter l’acceptation du paquet post-publication
   contre le paquet publié `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une prépublication poussée ou publiée nécessite un correctif,
   créer le numéro de prépublication correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   prépublication.
10. Pour stable, continuer uniquement après que la beta validée ou la version candidate dispose des
    preuves de validation requises. La publication npm stable passe aussi par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévalidation réussi via
    `preflight_run_id` ; l’état prêt pour la publication macOS stable exige également le
    `.zip`, le `.dmg`, le `.dSYM.zip` empaquetés, ainsi que le `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram npm publié
    autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub depuis la
    section complète correspondante de `CHANGELOG.md`, et les étapes d’annonce de publication.

## Prévalidation de publication

- Exécutez `pnpm check:test-types` avant la prévalidation de release afin que le TypeScript des tests reste
  couvert en dehors de la gate locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de release afin que les vérifications plus larges des
  cycles d’importation et des limites d’architecture soient vertes en dehors de la gate locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release attendus
  `dist/*` et le bundle Control UI existent pour l’étape de validation du pack
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le marquage. Cette commande
  met à jour les versions des packages Plugin publiables, les métadonnées de compatibilité pair/API OpenClaw,
  les métadonnées de build et les ébauches de changelog Plugin pour qu’elles correspondent à la version de
  release du cœur. `pnpm plugins:sync:check` est la garde de release non mutante ;
  le workflow de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de release pour
  lancer toutes les boîtes de test de pré-release depuis un seul point d’entrée. Il accepte une branche,
  une balise ou un SHA de commit complet, déclenche manuellement `CI` et déclenche
  `OpenClaw Release Checks` pour la fumée d’installation, l’acceptation de package, les suites de chemin de release Docker,
  le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les
  voies Telegram. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de package
  contre l’artefact `release-package-under-test` issu des vérifications de release. Fournissez `npm_telegram_package_spec` après publication lorsque le même
  E2E Telegram doit aussi prouver le package npm publié. Fournissez
  `package_acceptance_package_spec` après publication lorsque Package Acceptance
  doit exécuter sa matrice package/mise à jour contre le package npm livré au lieu
  de l’artefact construit depuis le SHA. Fournissez
  `evidence_package_spec` lorsque le rapport privé de preuves doit démontrer que la
  validation correspond à un package npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal latéral
  pour un candidat package pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref`
  pour empaqueter une branche/balise/SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par un autre run GitHub
  Actions. Le workflow résout le candidat en
  `package-under-test`, réutilise le planificateur de release Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact package
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la base publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies installation/canal/agent, réseau Gateway et rechargement de config
  - `package` : voies package/mise à jour/Plugin natives de l’artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : fragments de chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin de la couverture CI normale complète
  pour le candidat de release. Les déclenchements CI manuels contournent la portée par changements
  et forcent les shards Linux Node, les shards de Plugin groupé, les contrats de canal,
  la compatibilité Node 22, `check`, `check-additional`, la fumée de build,
  les vérifications docs, les Skills Python, Windows, macOS, Android et les voies i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Cette commande exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés,
  les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release balisée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après que la
  balise existe. Déclenchez-la depuis `release/YYYY.M.D` (ou `main` lors de la publication d’une
  balise accessible depuis main), transmettez la balise de release et le
  `preflight_run_id` npm OpenClaw réussi, et gardez la portée de publication Plugin par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm Plugin, la publication ClawHub Plugin et la publication npm OpenClaw,
  afin que le package cœur ne soit pas publié avant ses
  plugins externalisés.
- Les vérifications de release s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil Matrix live rapide
  et la voie QA Telegram avant l’approbation de release. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI.
  Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet Matrix
  transport, média et E2EE en parallèle.
- La validation runtime d’installation et de mise à niveau multi-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ou bloquer la publication
- Les vérifications de release portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la réf de workflow `main`/release afin que la logique de workflow et les
  secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une balise ou un SHA de commit complet tant que
  le commit résolu est accessible depuis une branche OpenClaw ou une balise de release
- La prévalidation en validation seule `OpenClaw NPM Release` accepte aussi le SHA complet actuel
  de 40 caractères du commit de branche de workflow sans exiger de balise poussée
- Ce chemin SHA sert uniquement à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication exige toujours une vraie balise de release
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub,
  tandis que le chemin de validation non mutant peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les deux secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de release npm n’attend plus la voie séparée des vérifications de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou la balise beta/correction correspondante) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/correction correspondante) pour vérifier le chemin d’installation du registre publié
  dans un préfixe temporaire frais
- Après une publication beta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et l’E2E Telegram réel
  contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales par les mainteneurs peuvent omettre les vars Convex et transmettre directement les trois
  identifiants d’env `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter la fumée beta post-publication complète depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge le run de workflow exact, télécharge l’artefact et imprime le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et
  ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise désormais prévalidation puis promotion :
  - la vraie publication npm doit passer un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que le run de prévalidation réussi
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée de workflow
  - la mutation de dist-tag npm basée sur jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour la sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` alors que le
    dépôt public garde une publication uniquement OIDC
  - le `macOS Release` public est uniquement de la validation ; lorsqu’une balise vit seulement sur une
    branche de release mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication privée mac doit passer un
    `preflight_run_id` et un `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` à `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas laisser silencieusement d’anciennes installations globales sur le
  payload stable de base
- La prévalidation de release npm échoue fermée sauf si l’archive tar inclut à la fois
  `dist/control-ui/index.html` et un payload `dist/control-ui/assets/` non vide
  afin de ne pas livrer à nouveau un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée Plugin publiés et
  les métadonnées de package sont présents dans l’agencement du registre installé. Une release qui
  livre des payloads runtime Plugin manquants échoue au vérificateur post-publication et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` impose aussi le budget `unpackedSize` du pack npm sur
  l’archive tar de mise à jour candidate, afin que l’e2e d’installation détecte le gonflement accidentel du pack
  avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing d’extension ou
  les matrices de tests d’extension, régénérez et examinez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l’approbation afin que les notes de release ne
  décrivent pas une disposition CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les fichiers `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un bundle id non debug, une URL de flux Sparkle
    non vide et une `CFBundleVersion` au moins égale au plancher de build Sparkle canonique
    pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui avance vite, utilisez
l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au
SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver accidentellement un run enfant
`main` plus récent.

Pour la validation d’une branche ou d’une balise de release, exécutez-la depuis la réf de workflow
`main` de confiance et transmettez la branche ou la balise de release comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la ref cible, déclenche manuellement `CI` avec
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les vérifications côté paquet,
et déclenche l’E2E Telegram de paquet autonome lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite en éventail le smoke test d’installation, les vérifications
de release multiplateformes, la couverture live/E2E Docker du chemin de release,
Package Acceptance avec la QA du paquet Telegram, la parité QA Lab, Matrix en
direct et Telegram en direct. Une exécution complète n’est acceptable que lorsque
le résumé `Full Release Validation` indique que `normal_ci` et `release_checks`
ont réussi. En mode full/all, l’enfant `npm_telegram` doit aussi réussir ; hors
full/all, il est ignoré sauf si un `npm_telegram_package_spec` publié a été
fourni. Le résumé final du vérificateur inclut les tableaux des tâches les plus
lentes pour chaque exécution enfant, afin que le responsable de release puisse
voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de release](/fr/reference/full-release-validation) pour
la matrice complète des étapes, les noms exacts des tâches de workflow, les
différences entre les profils stable et full, les artefacts et les identifiants
de relance ciblée.
Les workflows enfants sont déclenchés depuis la ref approuvée qui exécute
`Full Release Validation`, normalement `--ref main`, même lorsque la `ref` cible
pointe vers une branche ou une balise de release plus ancienne. Il n’existe pas
d’entrée workflow-ref séparée pour Full Release Validation ; choisissez le
harnais approuvé en choisissant la ref d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve exacte de commit sur
`main` mouvant ; les SHA de commit bruts ne peuvent pas être des refs de
déclenchement de workflow, utilisez donc `pnpm ci:full-release --sha <sha>` pour
créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/provider :

- `minimum` : chemin OpenAI/core live et Docker le plus rapide et critique pour la release
- `stable` : minimum plus couverture stable provider/backend pour l’approbation de release
- `full` : stable plus large couverture provider/médias consultative

`OpenClaw Release Checks` utilise la ref de workflow approuvée pour résoudre une
seule fois la ref cible en tant que `release-package-under-test` et réutilise cet
artefact dans les vérifications Docker du chemin de release et Package
Acceptance. Cela maintient toutes les machines côté paquet sur les mêmes octets
et évite les builds de paquet répétés.
Le smoke test d’installation OpenAI multiplateforme utilise
`OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable repo/org est définie, sinon
`openai/gpt-5.4`, car cette voie prouve l’installation du paquet, l’onboarding,
le démarrage du Gateway et un tour d’agent live, plutôt que de mesurer le modèle
par défaut le plus lent. La matrice plus large de providers live reste l’endroit
pour la couverture propre aux modèles.

Utilisez ces variantes selon l’étape de release :

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ombrelle complète comme première relance après un correctif
ciblé. Si une machine échoue, utilisez le workflow enfant, la tâche, la voie
Docker, le profil de paquet, le provider de modèle ou la voie QA en échec pour
la preuve suivante. Relancez l’ombrelle complète uniquement lorsque le correctif
a modifié l’orchestration partagée de release ou a rendu obsolètes les preuves
toutes machines précédentes. Le vérificateur final de l’ombrelle revérifie les
identifiants enregistrés des exécutions de workflows enfants ; après la relance
réussie d’un workflow enfant, relancez uniquement la tâche parente
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la
véritable exécution de release candidate, `ci` exécute uniquement l’enfant CI
normal, `plugin-prerelease` exécute uniquement l’enfant Plugin réservé à la
release, `release-checks` exécute toutes les machines de release, et les groupes
de release plus étroits sont `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les
exécutions full/all avec `release_profile=full` utilisent l’artefact de paquet
release-checks.

### Vitest

La machine Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne
intentionnellement le périmétrage des changements et force le graphe de tests
normal pour la release candidate : shards Linux Node, shards de plugins groupés,
contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke
test de build, vérifications de docs, Skills Python, Windows, macOS, Android et
i18n Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle réussi
la suite de tests normale complète ? ». Ce n’est pas la même chose que la
validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des shards en échec ou lents des tâches CI lors de l’analyse de régressions
- artefacts de chronométrage Vitest comme `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse de performance

Exécutez la CI manuelle directement uniquement lorsque la release a besoin d’une
CI normale déterministe, mais pas des machines Docker, QA Lab, live,
multiplateformes ou de paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker se trouve dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke` en
mode release. Elle valide la release candidate via des environnements Docker
empaquetés au lieu de se limiter aux tests au niveau source.

La couverture Docker de release inclut :

- smoke test d’installation complet avec le smoke test lent d’installation globale Bun activé
- préparation/réutilisation de l’image de smoke test du Dockerfile racine par SHA cible, avec les tâches de smoke test QR, root/gateway et installer/Bun exécutées comme shards install-smoke séparés
- voies E2E du dépôt
- fragments Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsque demandé
- voies d’installation/désinstallation de plugins groupés séparées
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites providers live/E2E et couverture de modèles live Docker lorsque les vérifications de release incluent les suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de
release téléverse `.artifacts/docker-tests/` avec les journaux de voies,
`summary.json`, `failures.json`, les chronométrages de phases, le JSON du plan
du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au
lieu de relancer tous les fragments de release. Les commandes de relance
générées incluent l’ancien `package_artifact_run_id` et les entrées d’image
Docker préparées lorsqu’elles sont disponibles, afin qu’une voie en échec puisse
réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte
de release pour le comportement agentique et le niveau canal, séparée de Vitest
et des mécaniques de paquet Docker.

La couverture QA Lab de release inclut :

- voie de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6 avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant des baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de release nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la release se comporte-t-elle
correctement dans les scénarios QA et les flux de canaux live ? ». Conservez les
URL d’artefacts pour les voies parité, Matrix et Telegram lors de l’approbation
de la release. La couverture Matrix complète reste disponible comme exécution
QA-Lab manuelle shardée, plutôt que comme voie critique par défaut pour la
release.

### Paquet

La machine Paquet est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat dans le tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde
la ref du harnais de workflow séparée de la ref source du paquet.

Sources candidates prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw
- `source=ref` : empaqueter une branche, balise ou SHA de commit complet `package_ref` approuvé avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`,
l’artefact de paquet de release préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` et
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à
jour, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin
hors ligne, la mise à jour de Plugin et la QA du paquet Telegram sur le même
tarball résolu. La matrice de mise à niveau couvre chaque référence stable
publiée sur npm de `2026.4.23` à `latest` ; utilisez Package Acceptance avec
`source=npm` pour un candidat déjà livré, ou `source=ref`/`source=artifact` pour
un tarball npm local adossé à un SHA avant publication. C’est le remplacement
natif GitHub de la majeure partie de la couverture paquet/mise à jour qui
nécessitait auparavant Parallels. Les vérifications de release multiplateformes
restent importantes pour l’onboarding, l’installateur et le comportement propres
aux OS, mais la validation produit de paquet/mise à jour devrait préférer
Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).
Utilisez-la pour décider quelle voie locale, Docker, Package Acceptance ou
release-check prouve un changement d’installation/mise à jour de Plugin, de
nettoyage doctor ou de migration de paquet publié. La migration exhaustive de
mise à jour publiée depuis chaque paquet stable `2026.4.23+` est un workflow
manuel `Update Migration` séparé, qui ne fait pas partie de Full Release CI.

La tolérance historique de package-acceptance est intentionnellement limitée
dans le temps. Les paquets jusqu’à `2026.4.25` peuvent utiliser le chemin de
compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées
d’inventaire QA privées absentes du tarball, `gateway install --wrapper` absent,
fichiers de correctif absents de la fixture git dérivée du tarball,
`update.channel` persisté absent, anciens emplacements d’enregistrement
d’installation de Plugin, persistance d’enregistrement d’installation de
marketplace absente, et migration de métadonnées de configuration pendant
`plugins update`. Le paquet publié `2026.4.26` peut avertir pour les fichiers
d’horodatage de métadonnées de build local qui ont déjà été livrés. Les paquets
ultérieurs doivent satisfaire les contrats modernes de paquet ; ces mêmes
lacunes font échouer la validation de release.

Utilisez des profils Package Acceptance plus larges lorsque la question de
release porte sur un véritable paquet installable :

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

- `smoke` : installation rapide du package/canal/agent, réseau Gateway et voies de
  rechargement de configuration
- `package` : contrats d’installation/mise à jour/package de plugin sans ClawHub en direct ; c’est la valeur par défaut
  de la vérification de release
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web
  OpenAI et OpenWebUI
- `full` : segments du chemin de release Docker avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour des relances ciblées

Pour la preuve Telegram d’un package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet le tarball
`package-under-test` résolu à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée normal de publication mutante. Il
orchestre les workflows d’éditeur approuvé dans l’ordre requis par la release :

1. Extraire le tag de release et résoudre son SHA de commit.
2. Vérifier que le tag est atteignable depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec le même périmètre et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de release, le dist-tag npm et
   le `preflight_run_id` enregistré.

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

Utilisez les workflows de plus bas niveau `Plugin NPM Release` et `Plugin ClawHub Release`
uniquement pour une réparation ciblée ou une republication. Pour une réparation de plugin
sélectionné, transmettez `plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis, comme `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit complet
  de 40 caractères de la branche de workflow actuelle pour un preflight uniquement
  de validation
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  véritable chemin de publication
- `preflight_run_id` : requis sur le véritable chemin de publication afin que le workflow réutilise
  le tarball préparé par l’exécution de preflight réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut `beta` par défaut

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; doit déjà exister
- `preflight_run_id` : identifiant d’exécution de preflight `OpenClaw NPM Release` réussi ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez `selected` uniquement
  pour une réparation ciblée
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation limitée aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications portant des secrets
  exigent que le commit résolu soit atteignable depuis une branche OpenClaw ou un
  tag de release.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prérelease bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le véritable chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow
     actuelle pour un essai à blanc uniquement de validation du workflow de preflight
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de
   commit complet lorsque vous voulez la CI normale plus la couverture cache de prompt en direct,
   Docker, QA Lab, Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés vers npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a intentionnellement été publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   auto-réparatrice planifiée déplacer `beta` plus tard

La mutation du dist-tag réside dans le dépôt privé pour des raisons de sécurité, car elle
requiert toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord tous deux
documentés et visibles par l’opérateur.

Si un mainteneur doit revenir à l’authentification npm locale, exécutez toute commande CLI
1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le conserver dans tmux rend les invites,
alertes et la gestion OTP observables et évite les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation de release privée dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de release](/fr/install/development-channels)

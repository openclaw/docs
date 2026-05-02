---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de version ou l’acceptation de paquet
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, environnements de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-02T23:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw dispose de trois voies de publication publiques :

- stable : versions taguées publiées sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- bêta : tags de préversion publiés sur npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication bêta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la version npm stable actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les versions stables et de correction stable sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build bêta validée
- Chaque version stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les versions bêta valident et publient normalement d’abord le chemin npm/paquet, la
  construction/signature/notarisation de l’application Mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La version stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si un tag bêta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de vérification de l’opérateur de publication

Cette liste de vérification décrit publiquement le flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération de dist-tag et les détails de restauration d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de lui.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées destinées aux utilisateurs, la committer, la pousser, puis rebaser/récupérer
   encore une fois avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail normal de publication
   directement sur `main`.
5. Mettre à jour chaque emplacement de version requis pour le tag prévu, exécuter
   `pnpm plugins:sync` afin que les paquets Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter le prévol local déterministe :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour un prévol
   uniquement destiné à la validation. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, la plus petite voie, la tâche de workflow, le profil de paquet, le fournisseur ou la liste d’autorisation de modèles en échec qui
   prouve le correctif. Relancer l’ombrelle complète uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, taguer `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Cela vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les paquets Plugin publiables sur npm, publie ensuite le même
   ensemble sur ClawHub, puis promeut l’artefact de prévol npm OpenClaw préparé
   avec le dist-tag correspondant. Après la publication, exécuter l’acceptation de paquet
   post-publication contre le paquet `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publié. Si une prépublication poussée ou publiée nécessite un correctif,
   créer le numéro de prépublication correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   prépublication.
10. Pour la version stable, continuer uniquement après que la bêta validée ou la version candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévol réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable exige aussi le
    `.zip`, le `.dmg`, le `.dSYM.zip` empaquetés et le fichier `appcast.xml` mis à jour sur `main`.
11. Après la publication, exécuter le vérificateur npm post-publication, l’E2E Telegram
    publié-npm autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub issues de la
    section `CHANGELOG.md` complète correspondante, et les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant la prévalidation de release afin que le TypeScript des tests reste
  couvert en dehors de la gate locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de release afin que les vérifications plus larges des
  cycles d’import et des frontières d’architecture soient vertes en dehors de la gate locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release
  `dist/*` attendus et le bundle de Control UI existent pour l’étape de validation
  du paquet
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le tag. Cela
  met à jour les versions des packages de plugins publiables, les métadonnées de compatibilité
  peer/API OpenClaw, les métadonnées de build et les ébauches de changelog des plugins pour correspondre à la
  version de release du cœur. `pnpm plugins:sync:check` est la garde de release non mutante ;
  le workflow de publication échoue avant toute mutation de registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de release pour
  lancer toutes les boîtes de test de pré-release depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche le workflow manuel `CI`, et déclenche
  `OpenClaw Release Checks` pour les lanes install smoke, package acceptance, suites de chemin de release Docker,
  live/E2E, OpenWebUI, parité QA Lab, Matrix et Telegram. Avec `release_profile=full`
  et `rerun_group=all`, il exécute aussi le package Telegram E2E contre l’artefact
  `release-package-under-test` issu des vérifications de release. Fournissez `npm_telegram_package_spec`
  après publication quand le même Telegram E2E doit aussi prouver le package npm publié. Fournissez
  `package_acceptance_package_spec` après publication quand Package Acceptance
  doit exécuter sa matrice package/update contre le package npm livré plutôt
  que l’artefact construit depuis le SHA. Fournissez
  `evidence_package_spec` quand le rapport de preuve privé doit prouver que la
  validation correspond à un package npm publié sans forcer Telegram E2E.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal secondaire
  pour un candidat de package pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref`
  pour empaqueter une branche/un tag/un SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat en
  `package-under-test`, réutilise le planificateur de release Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quand les
  lanes Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : lanes install/channel/agent, réseau Gateway et rechargement de config
  - `package` : lanes package/update/plugin natives de l’artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/subagent,
    recherche web OpenAI et OpenWebUI
  - `full` : morceaux du chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous n’avez besoin que d’une couverture CI normale complète
  pour le candidat de release. Les déclenchements CI manuels contournent le périmètre
  des changements et forcent les shards Linux Node, les shards des plugins groupés, les contrats
  de canaux, la compatibilité Node 22, `check`, `check-additional`, build smoke,
  les vérifications de docs, les Skills Python, Windows, macOS, Android et les lanes d’i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Cela exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace
  exportés, les attributs bornés, ainsi que la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après que le
  tag existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un
  tag atteignable depuis main), passez le tag de release et le `preflight_run_id`
  npm OpenClaw réussi, et conservez la portée de publication des plugins par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le package cœur ne soit pas publié avant ses plugins externalisés.
- Les vérifications de release s’exécutent maintenant dans un workflow manuel distinct :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la lane de parité mock QA Lab plus le profil
  Matrix live rapide et la lane QA Telegram avant l’approbation de release. Les lanes live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants
  Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport
  Matrix, des médias et de l’E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau cross-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : gardez le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre lane afin de ne pas retarder ni bloquer la publication
- Les vérifications de release portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la ref de workflow `main`/release afin que la logique de workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de release
- La prévalidation validation-only `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle sans exiger un tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication exige toujours un vrai tag de release
- Les deux workflows conservent le vrai chemin de publication et de promotion sur les runners
  hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les runners Linux
  Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de release npm n’attend plus la lane séparée des vérifications de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correction correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/correction correspondante) pour vérifier le chemin d’installation du registre publié
  dans un préfixe temporaire neuf
- Après une publication beta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai Telegram E2E
  contre le package npm publié en utilisant le pool partagé loué d’identifiants Telegram.
  Les exécutions ponctuelles locales de mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement manuel uniquement et
  ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise maintenant preflight-then-promote :
  - la vraie publication npm doit avoir un npm `preflight_run_id` réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via une entrée de workflow
  - la mutation du dist-tag npm basée sur un jeton vit maintenant dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour la sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve une publication OIDC-only
  - le workflow public `macOS Release` est validation-only ; lorsqu’un tag n’existe que sur une
    branche de release mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit avoir un `preflight_run_id` mac privé
    et un `validate_run_id` réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas silencieusement laisser les installations globales plus anciennes sur la
  charge utile stable de base
- La prévalidation de release npm échoue fermée sauf si l’archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin de ne plus livrer un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée de plugins publiés et
  les métadonnées de package sont présents dans l’agencement du registre installé. Une release qui
  livre des charges utiles d’exécution de plugins manquantes échoue au vérificateur postpublish et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur
  l’archive tar de mise à jour candidate, afin que l’e2e d’installation détecte le gonflement accidentel du paquet
  avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifests de timing d’extensions ou
  les matrices de tests d’extensions, régénérez et révisez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de release ne
  décrivent pas un agencement CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un bundle id non debug, une URL de flux Sparkle
    non vide, et un `CFBundleVersion` supérieur ou égal au plancher de build Sparkle canonique
    pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche à évolution rapide, utilisez
l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée sur le SHA
cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par
accident une exécution enfant de `main` plus récente.

Pour la validation d’une branche ou d’un tag de release, exécutez-la depuis la ref de workflow `main`
de confiance et passez la branche ou le tag de release comme `ref` :

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
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks` et déclenche
l’E2E Telegram de package autonome lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite l’installation smoke, les vérifications de publication multi-OS, la couverture live/E2E Docker
du chemin de publication, Package Acceptance avec l’AQ du package Telegram, la parité QA Lab,
Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
indique que `normal_ci` et `release_checks` ont réussi. En mode full/all,
l’enfant `npm_telegram` doit aussi avoir réussi ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des tâches les plus lentes pour chaque exécution enfant, afin que le responsable de publication
voie le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des tâches de workflow, les différences entre profils stable et full,
les artefacts et les poignées de réexécution ciblée.
Les workflows enfants sont déclenchés depuis la ref de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou une balise de publication plus ancienne. Il n’y a pas d’entrée de ref de workflow distincte pour Full Release Validation ;
choisissez le harnais de confiance en choisissant la ref d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des refs de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la publication le plus rapide
- `stable` : minimum plus couverture stable des fournisseurs/backends pour l’approbation de publication
- `full` : stable plus large couverture consultative des fournisseurs/médias

`OpenClaw Release Checks` utilise la ref de workflow de confiance pour résoudre la ref cible
une fois comme `release-package-under-test` et réutilise cet artefact à la fois dans les
vérifications Docker du chemin de publication et Package Acceptance. Cela garde toutes les
boxes orientées package sur les mêmes octets et évite les reconstructions répétées de packages.
L’installation smoke OpenAI multi-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable de dépôt/organisation est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live,
plutôt que d’évaluer le modèle par défaut le plus lent. La matrice live plus large des fournisseurs
reste l’endroit destiné à la couverture propre aux modèles.

Utilisez ces variantes selon l’étape de publication :

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

N’utilisez pas l’ombrelle complète comme première réexécution après un correctif ciblé. Si une box
échoue, utilisez le workflow enfant, la tâche, la voie Docker, le profil de package, le fournisseur de modèle
ou la voie QA échoué pour la preuve suivante. Réexécutez l’ombrelle complète uniquement lorsque
le correctif a modifié l’orchestration de publication partagée ou rendu obsolètes les preuves antérieures
de toutes les boxes. Le vérificateur final de l’ombrelle revérifie les ids enregistrés des exécutions de workflows enfants ;
donc après la réexécution réussie d’un workflow enfant, réexécutez uniquement la tâche parente échouée
`Verify full validation`.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la véritable
exécution de candidat à la publication, `ci` exécute uniquement l’enfant CI normal, `plugin-prerelease`
exécute uniquement l’enfant Plugin réservé à la publication, `release-checks` exécute chaque
box de publication, et les groupes de publication plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les réexécutions ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package de release-checks.

### Vitest

La box Vitest est le workflow enfant manuel `CI`. CI manuel contourne intentionnellement
la portée par changements et force le graphe de tests normal pour le candidat à la publication :
fragments Linux Node, fragments de Plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de build, vérifications docs, Skills Python, Windows, macOS,
Android et i18n de Control UI.

Utilisez cette box pour répondre à « l’arbre source a-t-il réussi la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms de fragments échoués ou lents issus des tâches CI lors de l’investigation de régressions
- artefacts de temps Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez CI manuel directement uniquement lorsque la publication a besoin d’une CI normale déterministe mais
pas des boxes Docker, QA Lab, live, multi-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La box Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode publication. Elle valide le candidat à la publication via des
environnements Docker empaquetés au lieu de se limiter à des tests au niveau source.

La couverture Docker de publication inclut :

- installation smoke complète avec le smoke d’installation globale Bun lente activé
- préparation/réutilisation de l’image smoke Dockerfile racine par SHA cible, avec les tâches smoke QR,
  root/gateway et installer/Bun exécutées comme fragments install-smoke séparés
- voies E2E du dépôt
- fragments Docker du chemin de publication : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsqu’elle est demandée
- voies séparées d’installation/désinstallation des Plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites de fournisseurs live/E2E et couverture de modèles live Docker lorsque les vérifications de publication
  incluent les suites live

Utilisez les artefacts Docker avant de réexécuter. Le planificateur du chemin de publication téléverse
`.artifacts/docker-tests/` avec les journaux des voies, `summary.json`, `failures.json`,
les temps de phases, le JSON du plan du planificateur et les commandes de réexécution. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
réexécuter tous les fragments de publication. Les commandes de réexécution générées incluent le
`package_artifact_run_id` précédent et les entrées d’images Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser la même archive et les mêmes images GHCR.

### QA Lab

La box QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte de publication
du comportement agentique et au niveau des canaux, distincte de Vitest et des mécanismes de package Docker.

La couverture QA Lab de publication inclut :

- voie de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant des baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cette box pour répondre à « la publication se comporte-t-elle correctement dans les scénarios QA et les flux de canaux live ? »
Conservez les URL d’artefacts pour les voies parité, Matrix et Telegram lors de l’approbation de la publication.
La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab fragmentée manuelle, plutôt que comme voie critique de publication par défaut.

### Package

La box Package est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en archive `package-under-test` consommée par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
ref du harnais de workflow séparée de la ref source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger une archive HTTPS `.tgz` avec `package_sha256` requis
- `source=artifact` : réutiliser une archive `.tgz` téléversée par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact de package de publication
préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` et
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à jour, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin hors ligne, la mise à jour de Plugin et l’AQ du package Telegram sur la même archive résolue. La matrice de mise à niveau couvre chaque référence stable publiée sur npm de `2026.4.23` à `latest` ; utilisez
Package Acceptance avec `source=npm` pour un candidat déjà expédié, ou
`source=ref`/`source=artifact` pour une archive npm locale adossée à un SHA avant
publication. C’est le remplacement natif GitHub
pour la majeure partie de la couverture package/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de publication multi-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres à l’OS, mais la validation produit package/mise à jour devrait
préférer Package Acceptance.

La checklist canonique pour la validation des mises à jour et des Plugins est
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle voie locale, Docker, Package Acceptance ou release-check prouve une
installation/mise à jour de Plugin, un nettoyage doctor ou une modification de migration de package publié.
La migration exhaustive de mise à jour publiée depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` séparé, qui ne fait pas partie de Full Release CI.

La tolérance historique de package-acceptance est volontairement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées privées d’inventaire QA absentes de l’archive, absence de
`gateway install --wrapper`, absence de fichiers de correctif dans la fixture git dérivée de l’archive,
absence de `update.channel` persistant, emplacements historiques d’enregistrements d’installation de Plugin,
absence de persistance des enregistrements d’installation marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le package publié `2026.4.26` peut avertir
pour des fichiers d’horodatage de métadonnées de build locales qui ont déjà été expédiés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes échouent à la validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication concerne un
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

- `smoke` : voies rapides d’installation package/canal/agent, réseau Gateway et rechargement de configuration
- `package` : contrats d’installation/mise à jour/package de Plugin sans ClawHub live ; c’est la valeur par défaut des release-checks
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : fragments Docker du chemin de publication avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour les réexécutions ciblées

Pour la preuve Telegram d’un candidat de package, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet le tarball
`package-under-test` résolu au lane Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée normal de publication mutative. Il
orchestre les workflows d’éditeur de confiance dans l’ordre requis par la release :

1. Extraire le tag de release et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
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
uniquement pour un travail de réparation ou de republication ciblé. Pour une réparation de plugin sélectionné, passez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis, tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le SHA
  de commit complet à 40 caractères de la branche de workflow courante pour un preflight de validation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  chemin réel de publication
- `preflight_run_id` : requis sur le chemin réel de publication afin que le workflow réutilise
  le tarball préparé depuis l’exécution de preflight réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; valeur par défaut : `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; doit déjà exister
- `preflight_run_id` : identifiant d’exécution de preflight `OpenClaw NPM Release` réussi ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag cible npm pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour un travail de réparation ciblé
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lors de l’utilisation du
  workflow comme orchestrateur de réparation réservée aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications portant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou
  un tag de release.

Règles :

- Les tags stables et de correction peuvent publier soit vers `beta`, soit vers `latest`
- Les tags de prérelease bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  réservés à la validation
- Le chemin réel de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie ces métadonnées avant la poursuite de la publication

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant l’existence d’un tag, vous pouvez utiliser le SHA de commit complet de la branche de workflow courante
     pour un essai à blanc, réservé à la validation, du workflow de preflight
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA
   de commit complet lorsque vous voulez, depuis un seul workflow manuel, la CI normale ainsi que la couverture live du cache d’invite, Docker, QA Lab,
   Matrix et Telegram
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la ref de release
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
   d’autoréparation planifiée déplacer `beta` plus tard

La mutation du dist-tag réside dans le dépôt privé pour des raisons de sécurité, car elle exige encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela permet aux chemins de publication directe et de promotion bêta d’abord d’être tous deux
documentés et visibles par les opérateurs.

Si un mainteneur doit revenir à une authentification npm locale, exécutez toutes les commandes
CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes et la gestion OTP observables, et évite les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation privée de release dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de release](/fr/install/development-channels)

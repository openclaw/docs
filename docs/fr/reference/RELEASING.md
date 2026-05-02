---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de publication ou l’acceptation du paquet
    - Recherche de la nomenclature et de la cadence des versions
summary: Canaux de publication, liste de contrôle de l’opérateur, environnements de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-02T07:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw a trois canaux de publication publics :

- stable : versions taguées qui sont publiées sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- beta : tags de préversion publiés sur npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne mettez pas de zéro initial au mois ni au jour
- `latest` désigne la version stable npm actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les publications stables et les publications de correction stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build beta validée
- Chaque publication stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les publications beta valident et publient normalement d’abord le chemin npm/paquet, la
  compilation/signature/notarisation de l’application Mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications avancent d’abord en beta
- La version stable ne suit qu’une fois la dernière beta validée
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si un tag beta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Checklist de l’opérateur de publication

Cette checklist décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération de dist-tag et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partez du `main` actuel : récupérez la dernière version, confirmez que le commit cible est poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de lui.
2. Réécrivez la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, gardez les entrées orientées utilisateur, commitez-la, poussez-la, puis refaites un rebase/pull
   avant de créer la branche.
3. Passez en revue les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consignez pourquoi elle est
   intentionnellement conservée.
4. Créez `release/YYYY.M.D` depuis le `main` actuel ; n’effectuez pas le travail de publication normal
   directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour le tag prévu, exécutez
   `pnpm plugins:sync` afin que les paquets Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécutez le prévol local déterministe :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` et
   `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour le prévol
   de validation uniquement. Enregistrez le `preflight_run_id` réussi.
7. Lancez tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corrigez sur la branche de publication et relancez le plus petit
   fichier, canal, job de workflow, profil de paquet, fournisseur ou allowlist de modèles en échec qui
   prouve le correctif. Relancez l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour beta, taguez `vYYYY.M.D-beta.N`, puis exécutez `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les paquets Plugin publiables sur npm, publie ensuite le même
   ensemble sur ClawHub, puis promeut l’artefact de prévol npm OpenClaw préparé
   avec le dist-tag `beta`. Après la publication, exécutez l’acceptation de paquet post-publication
   contre le paquet publié `openclaw@YYYY.M.D-beta.N` ou `openclaw@beta`.
   Si une beta poussée ou publiée nécessite un correctif, créez le `-beta.N` suivant ;
   ne supprimez pas et ne réécrivez pas l’ancienne beta.
10. Pour stable, continuez uniquement après que la beta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévol réussi via
    `preflight_run_id` ; la préparation de publication stable macOS requiert aussi les
    `.zip`, `.dmg`, `.dSYM.zip` empaquetés, ainsi que `appcast.xml` mis à jour sur `main`.
11. Après la publication, exécutez le vérificateur npm post-publication, l’E2E Telegram
    publié-npm autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion du dist-tag si nécessaire, les notes de publication/prépublication GitHub issues de la
    section complète correspondante de `CHANGELOG.md`, ainsi que les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant le prévol de publication afin que le TypeScript de test reste
  couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le prévol de publication afin que les vérifications plus larges des cycles d’import
  et des limites d’architecture soient vertes en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication
  `dist/*` attendus et le bundle de l’interface utilisateur de contrôle existent pour l’étape de validation
  du pack
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le tag. Il
  met à jour les versions des packages de plugins publiables, les métadonnées de compatibilité
  pair/API OpenClaw, les métadonnées de build et les ébauches de changelog des plugins pour correspondre à la version de publication
  du cœur. `pnpm plugins:sync:check` est la garde de publication non mutante ;
  le workflow de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de publication pour
  lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche manuellement `CI`, et déclenche
  `OpenClaw Release Checks` pour les smoke tests d’installation, l’acceptation de package, les suites
  de chemin de publication Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram.
  Avec `release_profile=full` et `rerun_group=all`, il exécute aussi le E2E Telegram de package
  contre l’artefact `release-package-under-test` des vérifications de publication. Fournissez
  `npm_telegram_package_spec` après publication quand le même E2E Telegram doit aussi prouver le package npm publié.
  Fournissez
  `evidence_package_spec` quand le rapport de preuve privé doit prouver que la
  validation correspond à un package npm publié sans forcer le E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` quand vous voulez une preuve de canal parallèle
  pour un package candidat pendant que le travail de publication continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref`
  pour packager une branche/un tag/un SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat en
  `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quand les voies Docker
  sélectionnées incluent `published-upgrade-survivor`, l’artefact de package est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la base de référence publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies de package/mise à jour/plugin natives à l’artefact sans OpenWebUI ni ClawHub live
  - `product` : profil de package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une relance ciblée
- Exécutez directement le workflow manuel `CI` quand vous avez seulement besoin d’une couverture CI normale complète
  pour le candidat de publication. Les déclenchements CI manuels contournent le périmètre des changements
  et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canaux,
  la compatibilité Node 22, `check`, `check-additional`, le smoke test de build,
  les vérifications de docs, les compétences Python, Windows, macOS, Android et les voies i18n
  de l’interface utilisateur de contrôle.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace
  exportés, les attributs bornés et la suppression des contenus/identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après l’existence du
  tag. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un
  tag accessible depuis main), transmettez le tag de publication et le `preflight_run_id` npm
  OpenClaw réussi, et conservez la portée de publication des plugins par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le package cœur ne soit pas publié avant ses plugins
  externalisés.
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la porte de parité simulée QA Lab plus le profil Matrix
  live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI.
  Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` quand vous voulez l’inventaire complet Matrix
  de transport, média et E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau multi-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas ralentir ni bloquer la publication
- Les vérifications de publication contenant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est accessible depuis une branche OpenClaw ou un tag de publication
- Le prévol validation uniquement `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle sans nécessiter de tag poussé
- Ce chemin SHA est destiné uniquement à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication nécessite toujours un vrai tag de publication
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des runners
  hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les runners Linux
  Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  avec les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le prévol de publication npm n’attend plus la voie séparée des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation du registre publié
  dans un nouveau préfixe temporaire
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram
  contre le package npm publié avec le pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et
  ne s’exécute pas à chaque merge.
- L’automatisation de publication des mainteneurs utilise désormais prévol puis promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de prévol réussie
  - les publications npm stables utilisent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de dist-tag npm basée sur un jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour la sécurité, car `npm dist-tag add` nécessite encore `NPM_TOKEN` tandis que le
    dépôt public conserve une publication uniquement OIDC
  - la `macOS Release` publique est uniquement une validation ; quand un tag n’existe que sur une
    branche de publication mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir avec des `preflight_run_id` et
    `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de publication ne puissent pas laisser silencieusement des installations globales plus anciennes sur la
  charge utile stable de base
- Le prévol de publication npm échoue fermé sauf si l’archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide
  afin que nous n’expédiions plus un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée de plugins publiés et
  les métadonnées de package sont présents dans l’agencement de registre installé. Une publication qui
  expédie des charges utiles d’exécution de plugins manquantes échoue au vérificateur post-publication et
  ne peut pas être promue en `latest`.
- `pnpm test:install:smoke` impose aussi le budget npm pack `unpackedSize` sur
  l’archive tar de mise à jour candidate, afin que l’e2e d’installation détecte l’inflation accidentelle du pack
  avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de chronométrage d’extensions ou
  les matrices de tests d’extensions, régénérez et relisez les sorties de matrice
  `plugin-prerelease-extension-shard` appartenant au planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l’approbation afin que les notes de publication ne
  décrivent pas une disposition CI obsolète
- La préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` packagés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’application packagée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et un `CFBundleVersion` au moins égal au plancher de build Sparkle canonique
    pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de prépublication depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’
assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une
exécution enfant `main` plus récente.

Pour la validation d’une branche ou d’un tag de publication, exécutez-la depuis la référence de workflow `main`
de confiance et transmettez la branche ou le tag de publication comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la référence cible, déclenche manuellement `CI` avec
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks` et déclenche
l’E2E autonome du package Telegram lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite l’installation smoke, les vérifications de version
multi-OS, la couverture live/E2E Docker du chemin de version, Package Acceptance
avec QA du package Telegram, la parité QA Lab, Matrix en direct et Telegram en
direct. Une exécution complète n’est acceptable que lorsque le résumé
`Full Release Validation`
indique `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit également réussir ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des tâches les plus lentes pour chaque
exécution enfant, afin que le responsable de version puisse voir le chemin
critique actuel sans télécharger les journaux.
Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des tâches de workflow, les
différences entre les profils stable et complet, les artefacts et les poignées
de relance ciblées.
Les workflows enfants sont déclenchés depuis la référence de confiance qui
exécute `Full Release Validation`, normalement `--ref main`, même lorsque la
référence cible `ref` pointe vers une branche ou une étiquette de version plus
ancienne. Il n’existe pas d’entrée workflow-ref distincte pour Full Release
Validation ; choisissez le harnais de confiance en choisissant la référence
d’exécution du workflow. N’utilisez pas `--ref main -f ref=<sha>` pour une preuve
de commit exacte sur `main` mouvant ; les SHA de commit bruts ne peuvent pas
être des références de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker le plus rapide et critique pour la version
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de la version
- `full` : stable plus large couverture consultative fournisseur/média

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour
résoudre une seule fois la référence cible en tant que `release-package-under-test`
et réutilise cet artefact à la fois dans les vérifications Docker du chemin de
version et dans Package Acceptance. Cela garde toutes les boîtes orientées
package sur les mêmes octets et évite les builds de package répétés. Le smoke
d’installation OpenAI multi-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque
la variable repo/org est définie, sinon `openai/gpt-5.5`, car cette voie prouve
l’installation du package, l’onboarding, le démarrage du Gateway et un tour
d’agent live, plutôt que de mesurer le modèle par défaut le plus lent. La matrice
plus large des fournisseurs live reste l’endroit prévu pour la couverture propre
aux modèles.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ombrelle complète comme première relance après un correctif
ciblé. Si une boîte échoue, utilisez le workflow enfant échoué, la tâche, la
voie Docker, le profil de package, le fournisseur de modèle ou la voie QA pour
la preuve suivante. Relancez l’ombrelle complète uniquement lorsque le correctif
a modifié l’orchestration partagée de la version ou a rendu obsolètes les
preuves antérieures couvrant toutes les boîtes. Le vérificateur final de
l’ombrelle revérifie les identifiants enregistrés des exécutions de workflows
enfants ; après la relance réussie d’un workflow enfant, relancez uniquement la
tâche parente `Verify full validation` échouée.

Pour une récupération bornée, transmettez `rerun_group` à l’ombrelle. `all` est
la véritable exécution de candidat de version, `ci` exécute uniquement l’enfant
CI normal, `plugin-prerelease` exécute uniquement l’enfant Plugin réservé à la
version, `release-checks` exécute chaque boîte de version, et les groupes de
version plus étroits sont `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` et `npm-telegram`. Les relances ciblées
`npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package release-checks.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. Le CI manuel contourne
intentionnellement le périmétrage des changements et force le graphe de tests
normal pour le candidat de version : shards Linux Node, shards de Plugins
groupés, contrats de canaux, compatibilité Node 22, `check`,
`check-additional`, smoke de build, vérifications de docs, Skills Python,
Windows, macOS, Android et i18n de Control UI.

Utilisez cette boîte pour répondre à « l’arbre source a-t-il réussi toute la
suite de tests normale ? » Ce n’est pas la même chose que la validation produit
du chemin de version. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` au vert sur le SHA cible exact
- noms des shards échoués ou lents provenant des tâches CI lors de l’investigation des régressions
- artefacts de temps Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez le CI manuel directement uniquement lorsque la version a besoin d’un CI
normal déterministe, mais pas des boîtes Docker, QA Lab, live, multi-OS ou
package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode version. Elle valide le candidat de version via des
environnements Docker packagés, plutôt que seulement par des tests au niveau
source.

La couverture Docker de version inclut :

- smoke d’installation complet avec le smoke d’installation globale Bun lent activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec des tâches smoke QR,
  racine/gateway et installateur/Bun exécutées comme shards install-smoke séparés
- voies E2E du dépôt
- chunks Docker du chemin de version : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le chunk `plugins-runtime-services` lorsqu’elle est demandée
- voies fractionnées d’installation/désinstallation de Plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèles live Docker lorsque les
  vérifications de version incluent les suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de
version téléverse `.artifacts/docker-tests/` avec les journaux de voies,
`summary.json`, `failures.json`, les temps de phase, le JSON du plan du
planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au
lieu de relancer tous les chunks de version. Les commandes de relance générées
incluent les entrées précédentes `package_artifact_run_id` et les images Docker
préparées lorsqu’elles sont disponibles, afin qu’une voie échouée puisse
réutiliser la même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. C’est la
porte de version du comportement agentique et du niveau canal, séparée de
Vitest et de la mécanique des packages Docker.

La couverture QA Lab de version inclut :

- porte de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de version nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à « la version se comporte-t-elle correctement
dans les scénarios QA et les flux de canaux live ? » Conservez les URL
d’artefacts pour les voies de parité, Matrix et Telegram lors de l’approbation
de la version. La couverture Matrix complète reste disponible comme exécution
QA-Lab shardée manuelle, plutôt que comme voie critique de version par défaut.

### Package

La boîte Package est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et sur le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommée par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et
garde la référence du harnais de workflow séparée de la référence source du
package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
- `source=ref` : packager une branche, une étiquette ou un SHA de commit complet `package_ref`
  de confiance avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` obligatoire
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`,
l’artefact de package de version préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` et
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à
jour, le nettoyage des dépendances de Plugins obsolètes, les fixtures de Plugins
hors ligne, la mise à jour de Plugins et la QA de package Telegram contre la
même tarball résolue. C’est le remplacement natif GitHub de la majeure partie de
la couverture package/mise à jour qui nécessitait auparavant Parallels. Les
vérifications de version multi-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres à l’OS, mais la validation produit
package/mise à jour devrait privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des Plugins est
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle voie locale, Docker, Package Acceptance ou release-check prouve
un changement d’installation/mise à jour de Plugin, de nettoyage doctor ou de
migration de package publié. La migration exhaustive de mise à jour publiée
depuis chaque package stable `2026.4.23+` est un workflow manuel
`Update Migration` distinct, qui ne fait pas partie du CI Full Release.

La souplesse héritée de package-acceptance est intentionnellement limitée dans
le temps. Les packages jusqu’à `2026.4.25` peuvent utiliser le chemin de
compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées
d’inventaire QA privées absentes de la tarball, `gateway install --wrapper`
manquant, fichiers de patch manquants dans la fixture git dérivée de la tarball,
`update.channel` persisté manquant, emplacements hérités d’enregistrements
d’installation de Plugins, persistance d’enregistrement d’installation
marketplace manquante et migration des métadonnées de configuration pendant
`plugins update`. Le package publié `2026.4.26` peut avertir pour les fichiers
d’horodatage de métadonnées de build local déjà livrés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font
échouer la validation de version.

Utilisez des profils Package Acceptance plus larges lorsque la question de
version concerne un véritable package installable :

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

- `smoke` : voies rapides d’installation package/canal/agent, réseau Gateway et
  rechargement de configuration
- `package` : contrats d’installation/mise à jour/package de Plugins sans ClawHub live ; c’est la valeur
  par défaut release-check
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web
  OpenAI et OpenWebUI
- `full` : chunks Docker du chemin de version avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour les relances ciblées

Pour la preuve Telegram du package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet
l’archive tar `package-under-test` résolue à la voie Telegram ; le workflow
Telegram autonome accepte toujours une spécification npm publiée pour les
vérifications post-publication.

## Automatisation de publication de version

`OpenClaw Release Publish` est le point d’entrée normal de publication mutante. Il
orchestre les workflows d’éditeur approuvé dans l’ordre requis par la version :

1. Extraire le tag de version et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec le même périmètre et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de version, le dist-tag npm et
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
uniquement pour un travail de réparation ou de republication ciblé. Pour une réparation
d’un Plugin sélectionné, transmettez `plugin_publish_scope=selected` et
`plugins=@openclaw/name` à `OpenClaw Release Publish`, ou déclenchez directement le
workflow enfant lorsque le package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis, par exemple `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA
  de commit complet de 40 caractères de la branche de workflow actuelle pour une
  prévalidation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  chemin de publication réel
- `preflight_run_id` : requis sur le chemin de publication réel afin que le workflow réutilise
  l’archive tar préparée par l’exécution de prévalidation réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis ; il doit déjà exister
- `preflight_run_id` : identifiant d’exécution de prévalidation `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag cible npm pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour un travail de réparation ciblé
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation limitée aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications utilisant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de version.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de préversion bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le chemin de publication réel doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de version npm stable

Lors de la préparation d’une version npm stable :

1. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow
     actuelle pour une répétition générale de validation uniquement du workflow de prévalidation
2. Choisir `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécuter `Full Release Validation` sur la branche de version, le tag de version ou le SHA de
   commit complet lorsque vous voulez CI normal plus la couverture live du cache de prompt, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous avez intentionnellement besoin uniquement du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la ref de version
5. Enregistrer le `preflight_run_id` réussi
6. Exécuter `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés sur npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la version a été publiée sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la version a intentionnellement été publiée directement sur `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa
   synchronisation planifiée d’auto-réparation déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle exige encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord à la fois
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez toute commande de
CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
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

Les mainteneurs utilisent la documentation de version privée dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le guide d’exécution réel.

## Connexe

- [Canaux de version](/fr/install/development-channels)

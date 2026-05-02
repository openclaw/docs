---
read_when:
    - Recherche des définitions publiques des canaux de publication
    - Exécution de la validation de release ou de l’acceptation de package
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, boîtes de validation, nomenclature des versions et cadence
title: Politique de publication des versions
x-i18n:
    generated_at: "2026-05-02T21:01:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw a quatre canaux de publication publics :

- stable : versions taguées publiées sur npm `beta` par défaut, ou sur npm `latest` sur demande explicite
- alpha : tags de préversion publiés sur npm `alpha`
- beta : tags de préversion publiés sur npm `beta`
- dev : la pointe mobile de `main`

## Nommage des versions

- Version stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de préversion alpha : `YYYY.M.D-alpha.N`
  - Tag Git : `vYYYY.M.D-alpha.N`
- Version de préversion beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne remplissez pas le mois ni le jour avec des zéros
- `latest` désigne la version stable npm actuellement promue
- `alpha` désigne la cible d’installation alpha actuelle
- `beta` désigne la cible d’installation beta actuelle
- Les versions stables et les versions de correction stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build beta validée
- Chaque version stable d’OpenClaw livre le package npm et l’app macOS ensemble ;
  les versions beta valident et publient normalement d’abord le chemin npm/package, avec
  la compilation/signature/notarisation de l’app mac réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par beta
- La version stable suit seulement après validation de la dernière beta
- Les mainteneurs créent normalement les versions depuis une branche `release/YYYY.M.D` créée
  à partir de `main` actuel, afin que la validation de publication et les corrections ne bloquent pas le nouveau
  développement sur `main`
- Si un tag beta a été poussé ou publié et nécessite une correction, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans
le guide d’exploitation de publication réservé aux mainteneurs.

1. Partez de `main` actuel : récupérez la dernière version, confirmez que le commit cible est poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrivez la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, gardez les entrées orientées utilisateur, validez-la, poussez-la, puis rebase/pull
   une fois de plus avant de créer la branche.
3. Vérifiez les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consignez pourquoi elle est
   intentionnellement conservée.
4. Créez `release/YYYY.M.D` depuis `main` actuel ; n’effectuez pas le travail de publication normal
   directement sur `main`.
5. Mettez à jour chaque emplacement de version requis pour le tag prévu, exécutez
   `pnpm plugins:sync` afin que les packages Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécutez le précontrôle déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, et
   `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de branche de publication sur 40 caractères est autorisé pour le précontrôle
   de validation uniquement. Conservez le `preflight_run_id` réussi.
7. Lancez tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA complet du commit. C’est l’unique point d’entrée manuel
   pour les quatre grands environnements de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corrigez sur la branche de publication et réexécutez le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou liste d’autorisation de modèles ayant échoué
   qui prouve la correction. Réexécutez l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour alpha ou beta, taguez `vYYYY.M.D-alpha.N` ou `vYYYY.M.D-beta.N`, puis exécutez `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les packages Plugin publiables sur npm, publie ensuite le même
   ensemble sur ClawHub, puis promeut l’artefact de précontrôle npm OpenClaw préparé
   avec le dist-tag correspondant. Après la publication, exécutez l’acceptation de package
   post-publication contre le package publié `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` ou `openclaw@beta`. Si une préversion poussée ou
   publiée nécessite une correction, créez le numéro de préversion correspondant suivant ;
   ne supprimez pas et ne réécrivez pas l’ancienne préversion.
10. Pour stable, continuez uniquement après que la beta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de précontrôle réussi via
    `preflight_run_id` ; l’état de préparation de la publication macOS stable nécessite également le
    `.zip`, `.dmg`, `.dSYM.zip` packagés et l’`appcast.xml` mis à jour sur `main`.
11. Après la publication, exécutez le vérificateur npm post-publication, l’E2E Telegram autonome
    optionnel sur npm publié lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion du dist-tag si nécessaire, les notes de publication/préversion GitHub issues de la
    section `CHANGELOG.md` complète correspondante, ainsi que les étapes d’annonce de publication.

## Précontrôle de publication

- Exécutez `pnpm check:test-types` avant la prévalidation de version afin que le TypeScript des tests reste
  couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de version afin que les contrôles plus larges de
  cycles d’importation et de frontières d’architecture soient au vert en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de version
  `dist/*` attendus et le bundle Control UI existent pour l’étape de validation
  du paquet
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le balisage. Il
  met à jour les versions des packages plugin publiables, les métadonnées de compatibilité
  pair/API OpenClaw, les métadonnées de build et les ébauches de journaux des modifications des plugins pour correspondre à la version de
  publication du cœur. `pnpm plugins:sync:check` est le garde-fou de publication non mutatif ;
  le flux de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez manuellement le flux de travail `Full Release Validation` avant l’approbation de la version afin de
  lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche,
  une balise ou un SHA de commit complet, déclenche manuellement `CI` et déclenche
  `OpenClaw Release Checks` pour les tests d’installation, l’acceptation de package, les suites de chemin de publication Docker,
  live/E2E, OpenWebUI, la parité QA Lab, Matrix et les
  voies Telegram. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de package
  sur l’artefact `release-package-under-test` issu des contrôles de version.
  Fournissez `npm_telegram_package_spec` après la publication lorsque le même
  E2E Telegram doit aussi valider le package npm publié. Fournissez
  `package_acceptance_package_spec` après la publication lorsque Package Acceptance
  doit exécuter sa matrice package/mise à jour sur le package npm livré au lieu
  de l’artefact construit depuis le SHA. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la
  validation correspond à un package npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez manuellement le flux de travail `Package Acceptance` lorsque vous voulez une preuve par canal secondaire
  pour un candidat de package pendant que le travail de publication continue. Utilisez `source=npm` pour
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref`
  pour empaqueter une branche/balise/SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le flux de travail résout le candidat en
  `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de
  package est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies package/mise à jour/plugin natives de l’artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : segments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une relance ciblée
- Exécutez manuellement le flux de travail `CI` directement lorsque vous n’avez besoin que d’une couverture CI normale complète
  pour le candidat de publication. Les déclenchements manuels de CI contournent la portée des changements
  et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canaux,
  la compatibilité Node 22, `check`, `check-additional`, le test de build,
  les contrôles de documentation, les Skills Python, Windows, macOS, Android et les voies i18n de Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms des spans de trace exportés,
  les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque version balisée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutative après que la
  balise existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’une
  balise atteignable depuis main), transmettez la balise de version et le
  `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  flux de travail sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le package cœur ne soit pas publié avant ses plugins
  externalisés.
- Les contrôles de version s’exécutent désormais dans un flux de travail manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil Matrix live rapide
  et la voie QA Telegram avant l’approbation de la version. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI.
  Exécutez manuellement le flux de travail `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport Matrix,
  des médias et d’E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau entre OS fait partie des
  `OpenClaw Release Checks` publics et de `Full Release Validation`, qui appellent directement le
  flux de travail réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur
  propre voie afin de ne pas ralentir ni bloquer la publication
- Les contrôles de version portant des secrets doivent être déclenchés via `Full Release
Validation` ou depuis la référence de flux de travail `main`/release afin que la logique de flux de travail et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une balise ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou une balise de version
- La prévalidation en mode validation seulement de `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de flux de travail actuelle sans exiger de balise poussée
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le flux de travail synthétise `v<package.json version>` uniquement pour le
  contrôle des métadonnées de package ; la vraie publication exige toujours une vraie balise de version
- Les deux flux de travail gardent le vrai chemin de publication et de promotion sur des exécuteurs hébergés par GitHub,
  tandis que le chemin de validation non mutatif peut utiliser les plus grands
  exécuteurs Linux Blacksmith
- Ce flux de travail exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de flux de travail `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de publication npm n’attend plus la voie séparée des contrôles de version
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou la balise bêta/corrective correspondante) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation du registre publié
  dans un préfixe temporaire frais
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram
  contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les essais ponctuels locaux des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter le même contrôle post-publication depuis GitHub Actions via le
  flux de travail manuel `NPM Telegram Beta E2E`. Il est volontairement manuel uniquement et
  ne s’exécute pas à chaque fusion.
- L’automatisation de publication des mainteneurs utilise désormais prévalidation puis promotion :
  - la vraie publication npm doit avoir un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les versions npm stables utilisent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via une entrée de flux de travail
  - la mutation de dist-tag npm à base de jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le
    dépôt public conserve la publication OIDC uniquement
  - `macOS Release` public est uniquement destiné à la validation ; lorsqu’une balise existe seulement sur une
    branche de publication mais que le flux de travail est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit avoir réussi les
    `preflight_run_id` et `validate_run_id` mac privés
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les versions correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication
  contrôle aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de version ne puissent pas laisser silencieusement d’anciennes installations globales sur la
  charge utile stable de base
- La prévalidation de publication npm échoue de façon fermée sauf si l’archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide
  afin que nous ne livrions plus un tableau de bord navigateur vide
- La vérification post-publication contrôle aussi que les points d’entrée de plugins publiés et
  les métadonnées de package sont présents dans l’agencement du registre installé. Une version qui
  livre des charges utiles d’exécution de plugin manquantes échoue au vérificateur post-publication et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur
  l’archive tar de mise à jour candidate, afin que l’e2e d’installation détecte le gonflement accidentel du paquet
  avant le chemin de publication de version
- Si le travail de publication a touché la planification CI, les manifestes de minutage des extensions ou
  les matrices de tests d’extensions, régénérez et examinez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l’approbation afin que les notes de version ne
  décrivent pas une disposition CI obsolète
- La préparation d’une version stable macOS inclut aussi les surfaces de mise à jour :
  - la version GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et un `CFBundleVersion` égal ou supérieur au plancher de build Sparkle canonique
    pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de prépublication depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche à évolution rapide, utilisez l’
assistant afin que chaque flux de travail enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de flux de travail enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une
exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’une balise de publication, exécutez-la depuis la référence de flux de travail `main`
de confiance et transmettez la branche ou la balise de publication comme `ref` :

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
l’E2E Telegram autonome du package lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` lance ensuite en éventail la smoke d’installation, les vérifications de publication inter-OS, la couverture live/E2E Docker
du chemin de publication, Package Acceptance avec l’assurance qualité du package Telegram, la parité QA Lab,
Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
affiche `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit aussi réussir ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de publication puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et complet,
les artefacts et les points de relance ciblés.
Les workflows enfants sont déclenchés depuis la référence de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
ancienne branche ou étiquette de publication. Il n’existe pas d’entrée séparée de référence de workflow pour Full Release Validation ; choisissez le harnais de confiance en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour fournir une preuve exacte de commit sur un `main` mobile ;
les SHA de commit bruts ne peuvent pas être des références de dispatch de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin live et Docker OpenAI/cœur le plus rapide et critique pour la publication
- `stable` : minimum plus couverture stable fournisseur/backend pour l’approbation de publication
- `full` : stable plus large couverture consultative fournisseur/média

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre une seule fois la référence cible
en tant que `release-package-under-test` et réutilise cet artefact dans les deux
vérifications Docker du chemin de publication et Package Acceptance. Cela garde toutes les
boîtes orientées package sur les mêmes octets et évite les reconstructions répétées de package.
La smoke d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable du dépôt/de l’organisation est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de comparer le modèle par défaut le plus lent. La matrice plus large des fournisseurs live
reste l’endroit dédié à la couverture propre aux modèles.

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

N’utilisez pas l’ombrelle complète comme première relance après un correctif ciblé. Si une boîte
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de package, le fournisseur de modèle
ou la voie QA en échec pour la preuve suivante. Relancez l’ombrelle complète uniquement lorsque
le correctif a modifié l’orchestration partagée de publication ou a rendu obsolète la preuve précédente sur toutes les boîtes. Le vérificateur final de l’ombrelle revérifie les identifiants enregistrés des exécutions de workflows enfants ; ainsi, après la réussite d’une relance d’un workflow enfant, relancez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la vraie
exécution de candidat de publication, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin propre à la publication, `release-checks` exécute chaque
boîte de publication, et les groupes de publication plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package de release-checks.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement
la portée par changements et force le graphe de tests normal pour le candidat de publication :
shards Linux Node, shards des plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de build, vérifications de docs, Skills Python, Windows, macOS, Android et i18n de Control UI.

Utilisez cette boîte pour répondre à « l’arborescence source a-t-elle réussi la suite complète normale de tests ? »
Ce n’est pas la même chose que la validation produit du chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des shards échoués ou lents depuis les jobs CI lors de l’analyse des régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse de performance

Exécutez directement la CI manuelle uniquement lorsque la publication exige une CI normale déterministe mais
pas les boîtes Docker, QA Lab, live, inter-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode publication. Elle valide le candidat de publication à travers des
environnements Docker packagés plutôt que seulement des tests au niveau source.

La couverture Docker de publication inclut :

- smoke complète d’installation avec la smoke lente d’installation globale Bun activée
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec les jobs de smoke QR,
  racine/Gateway et installateur/Bun exécutés comme shards install-smoke séparés
- voies E2E du dépôt
- morceaux Docker du chemin de publication : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le morceau `plugins-runtime-services` sur demande
- voies séparées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèle Docker live lorsque les vérifications de publication
  incluent les suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de publication téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les chronométrages de phases, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
relancer tous les morceaux de publication. Les commandes de relance générées incluent les entrées précédentes
`package_artifact_run_id` et les images Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte de publication
du comportement agentique et du niveau canal, séparée de Vitest et des mécanismes de package Docker.

La couverture QA Lab de publication inclut :

- voie de parité simulée comparant la voie candidate OpenAI à la baseline Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant des baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à « la publication se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts des voies de parité, Matrix et Telegram
lors de l’approbation de la publication. La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab manuelle en shards plutôt que comme voie critique par défaut pour la publication.

### Package

La boîte Package est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
référence du harnais de workflow séparée de la référence source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw
- `source=ref` : packager une branche, une étiquette ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact de package de publication
préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` et
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à jour, le nettoyage des dépendances de plugins obsolètes, les fixtures de plugins hors ligne, la mise à jour de plugins et l’assurance qualité du package Telegram contre le même tarball résolu. La matrice de mise à niveau couvre chaque baseline stable publiée sur npm de `2026.4.23` à `latest` ; utilisez
Package Acceptance avec `source=npm` pour un candidat déjà publié, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le remplacement natif GitHub de l’essentiel de la couverture package/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de publication inter-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres à l’OS, mais la validation produit package/mise à jour doit
préférer Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle voie locale, Docker, Package Acceptance ou de vérifications de publication prouve une
installation/mise à jour de plugin, un nettoyage doctor ou un changement de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` distinct, hors Full Release CI.

La tolérance historique de package-acceptance est intentionnellement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées privées d’inventaire QA absentes du tarball, absence de
`gateway install --wrapper`, fichiers de patch absents de la fixture git dérivée du tarball,
absence de `update.channel` persisté, emplacements historiques d’enregistrement d’installation de plugins,
absence de persistance d’enregistrement d’installation de marketplace, et migration de métadonnées de configuration
pendant `plugins update`. Le package publié `2026.4.26` peut avertir
pour les fichiers de tampon de métadonnées de build local déjà livrés. Les packages ultérieurs
doivent satisfaire les contrats modernes de package ; ces mêmes lacunes font échouer la validation de publication.

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

- `smoke` : voies rapides d’installation package/canal/agent, réseau Gateway et rechargement de configuration
- `package` : contrats de package installation/mise à jour/plugin sans ClawHub live ; c’est la valeur par défaut des vérifications de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : morceaux Docker du chemin de publication avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour les relances ciblées

Pour la preuve Telegram de package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet
l’archive tar `package-under-test` résolue à la voie Telegram ; le workflow
Telegram autonome accepte toujours une spécification npm publiée pour les
vérifications après publication.

## Automatisation de publication de version

`OpenClaw Release Publish` est le point d’entrée normal de publication mutatrice. Il
orchestre les workflows d’éditeur de confiance dans l’ordre requis par la version :

1. Extraire le tag de version et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
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

Exemple de publication alpha :

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
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
uniquement pour des travaux ciblés de réparation ou de republication. Pour réparer un plugin sélectionné, transmettez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis, tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-alpha.1` ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le SHA de commit complet actuel de 40 caractères de la branche de workflow pour une prévalidation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  l’archive tar préparée lors de l’exécution de prévalidation réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis ; il doit déjà exister
- `preflight_run_id` : id d’exécution de prévalidation `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux ciblés de réparation
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation réservé aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications utilisant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de version.

Règles :

- Les tags stables et de correction peuvent être publiés vers `beta` ou `latest`
- Les tags de préversion alpha ne peuvent être publiés que vers `alpha`
- Les tags de préversion bêta ne peuvent être publiés que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement des validations
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de publication npm stable

Lors de la préparation d’une version npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA de commit complet actuel de la branche de workflow
     pour une simulation à blanc uniquement de validation du workflow de prévalidation
2. Choisissez `npm_dist_tag=beta` pour le flux normal qui publie d’abord en bêta, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de version, le tag de version ou le SHA de
   commit complet lorsque vous voulez une CI normale plus la couverture live prompt cache, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la ref de version
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés vers npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la version a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la version a été publiée intentionnellement directement vers `latest` et que `beta`
   doit pointer immédiatement vers le même build stable, utilisez ce même workflow privé
   pour pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   d’autoréparation planifiée déplacer `beta` plus tard

La mutation de dist-tag se trouve dans le dépôt privé pour des raisons de sécurité, car elle
requiert toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela permet de garder à la fois le chemin de publication directe et le chemin de promotion bêta d’abord
documentés et visibles pour les opérateurs.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez toutes les commandes de la CLI 1Password
(`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes et traitements OTP observables et empêche les alertes hôte répétées.

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
pour le vrai runbook.

## Connexe

- [Canaux de version](/fr/install/development-channels)

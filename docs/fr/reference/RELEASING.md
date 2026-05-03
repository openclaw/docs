---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation du package
    - Recherche de la nomenclature et de la cadence des versions
summary: Voies de publication, liste de contrôle opérateur, boîtes de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-03T21:37:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw comporte trois canaux de publication publics :

- stable : versions balisées publiées sur npm `beta` par défaut, ou sur npm `latest` sur demande explicite
- beta : balises de préversion publiées sur npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version corrective stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la version stable npm actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les publications stables et correctives stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build bêta validée
- Chaque publication stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les publications bêta valident et publient normalement d’abord le chemin npm/paquet, la
  build/signature/notarisation de l’application mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir de `main` courant, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise bêta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit publiquement la structure du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir de `main` courant : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI de `main` courant est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées destinées aux utilisateurs, la commiter, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis `main` courant ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Mettre à jour chaque emplacement de version requis pour la balise prévue, exécuter
   `pnpm plugins:sync` afin que les paquets de Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter le prévol déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant l’existence d’une balise,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour le prévol
   de validation uniquement. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de tests de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et réexécuter le plus petit
   fichier, canal, job de workflow, profil de paquet, fournisseur ou allowlist de modèles en échec qui
   prouve le correctif. Réexécuter l’enveloppe complète uniquement lorsque la surface modifiée rend
   les preuves antérieures obsolètes.
9. Pour la bêta, baliser `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les paquets de Plugin publiables sur npm, publie ensuite le même
   ensemble sur ClawHub sous forme de tarballs npm-pack ClawPack, puis promeut l’artefact
   de prévol npm OpenClaw préparé avec le dist-tag correspondant. Après publication, exécuter l’acceptation
   post-publication du paquet contre le paquet publié `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une préversion poussée ou publiée nécessite un correctif,
   créer le numéro de préversion correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   préversion.
10. Pour la stable, continuer uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe aussi par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévol réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable nécessite également les
    fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip`, ainsi que le fichier `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram
    publié-npm autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/préversion GitHub depuis la
    section `CHANGELOG.md` correspondante complète, ainsi que les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant la préparation de release afin que le TypeScript des tests reste couvert en dehors du gate local plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la préparation de release afin que les vérifications plus larges des cycles d’import et des limites d’architecture soient vertes en dehors du gate local plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release `dist/*` attendus et le bundle de Control UI existent pour l’étape de validation du pack
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le tag. Il met à jour les versions des paquets Plugin publiables, les métadonnées de compatibilité peer/API d’OpenClaw, les métadonnées de build et les ébauches de journaux de modifications des plugins pour correspondre à la version de release du cœur. `pnpm plugins:sync:check` est le garde-fou de release non modifiant ; le workflow de publication échoue avant toute mutation du registre si cette étape a été oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de release pour lancer toutes les boîtes de test pré-release depuis un point d’entrée unique. Il accepte une branche, un tag ou un SHA de commit complet, déclenche le `CI` manuel et déclenche `OpenClaw Release Checks` pour les suites de smoke d’installation, d’acceptation de paquet, de chemins de release Docker, live/E2E, OpenWebUI, parité QA Lab, Matrix et Telegram. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de paquet contre l’artefact `release-package-under-test` provenant des contrôles de release. Fournissez `npm_telegram_package_spec` après la publication lorsque le même E2E Telegram doit aussi valider le paquet npm publié. Fournissez `package_acceptance_package_spec` après la publication lorsque Package Acceptance doit exécuter sa matrice paquet/mise à jour contre le paquet npm livré au lieu de l’artefact construit depuis le SHA. Fournissez `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la validation correspond à un paquet npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve latérale pour un candidat de paquet pendant que le travail de release continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref` pour empaqueter une branche/un tag/un SHA `package_ref` fiable avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat en `package-under-test`, réutilise le planificateur de release Docker E2E contre cette archive tar, et peut exécuter la QA Telegram contre la même archive tar avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les lanes Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de paquet est le candidat et `published_upgrade_survivor_baseline` sélectionne la base publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : lanes d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : lanes paquet/mise à jour/Plugin natives de l’artefact sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin d’une couverture CI normale complète pour le candidat de release. Les déclenchements CI manuels contournent la portée basée sur les changements et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canal, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les contrôles docs, les skills Python, Windows, macOS, Android et les lanes i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Il exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms des spans de trace exportés, les attributs bornés et la rédaction du contenu/des identifiants sans nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication modifiante après l’existence du tag. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un tag atteignable depuis main), transmettez le tag de release et le `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication Plugin par défaut `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm d’OpenClaw afin que le paquet cœur ne soit pas publié avant ses plugins externalisés.
- Les contrôles de release s’exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la lane de parité mock QA Lab ainsi que le profil Matrix live rapide et la lane QA Telegram avant l’approbation de release. Les lanes live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport Matrix, des médias et de l’E2EE en parallèle.
- La validation d’installation et de mise à niveau cross-OS fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court, déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur propre lane pour ne pas retarder ni bloquer la publication
- Les contrôles de release contenant des secrets doivent être déclenchés via `Full Release Validation` ou depuis la référence de workflow `main`/release afin que la logique du workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de release
- La préparation de validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit complet de 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour le contrôle des métadonnées de paquet ; la vraie publication exige toujours un vrai tag de release
- Les deux workflows conservent le vrai chemin de publication et de promotion sur les runners hébergés par GitHub, tandis que le chemin de validation non modifiant peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La préparation de release npm n’attend plus la lane séparée des contrôles de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correction correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/correction correspondante) pour vérifier le chemin d’installation du registre publié dans un nouveau préfixe temporaire
- Après une publication beta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et le vrai E2E Telegram contre le paquet npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter le même contrôle post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise maintenant préparation puis promotion :
  - la vraie publication npm doit passer un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de préparation réussie
  - les releases npm stables ciblent par défaut `beta`
  - la publication npm stable peut cibler explicitement `latest` via l’entrée de workflow
  - la mutation de dist-tag npm basée sur un token vit désormais dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour des raisons de sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le dépôt public conserve une publication uniquement OIDC
  - la release publique `macOS Release` est uniquement de validation ; lorsqu’un tag n’existe que sur une branche de release mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit passer un `preflight_run_id` mac privé et un `validate_run_id` réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication contrôle aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`, afin que les corrections de release ne puissent pas laisser silencieusement d’anciennes installations globales sur la charge utile stable de base
- La préparation de release npm échoue fermée sauf si l’archive tar contient à la fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide, afin d’éviter de livrer à nouveau un tableau de bord navigateur vide
- La vérification post-publication contrôle aussi que les points d’entrée Plugin publiés et les métadonnées de paquet sont présents dans l’agencement du registre installé. Une release qui livre des charges utiles d’exécution Plugin manquantes échoue au vérificateur postpublish et ne peut pas être promue en `latest`.
- `pnpm test:install:smoke` impose aussi le budget npm pack `unpackedSize` sur l’archive tar candidate de mise à jour, afin que l’e2e d’installation détecte les gonflements accidentels de pack avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing des extensions ou les matrices de test des extensions, régénérez et relisez les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant l’approbation, afin que les notes de release ne décrivent pas une disposition CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les paquets `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher canonique de build Sparkle pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests pré-release depuis un point d’entrée unique. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée sur le SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation` depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’un tag de release, exécutez-la depuis la référence de workflow fiable `main` et transmettez la branche ou le tag de release comme `ref` :

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
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les vérifications côté package,
et déclenche l’E2E Telegram autonome du package lorsque `release_profile=full`
avec `rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini.
`OpenClaw Release Checks` lance ensuite en éventail le smoke test d’installation,
les vérifications de version cross-OS, la couverture live/E2E Docker du chemin de
version, Package Acceptance avec QA du package Telegram, la parité QA Lab, Matrix
live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation` indique que `normal_ci` et `release_checks` ont
réussi. En mode full/all, l’enfant `npm_telegram` doit également réussir ; hors
full/all, il est ignoré sauf si un `npm_telegram_package_spec` publié a été
fourni. Le résumé final du vérificateur inclut les tableaux des jobs les plus
lents pour chaque exécution enfant, afin que le responsable de version puisse
voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de version](/fr/reference/full-release-validation)
pour la matrice complète des étapes, les noms exacts des jobs de workflow, les
différences entre profils stable et full, les artefacts et les poignées de
réexécution ciblée.
Les workflows enfants sont déclenchés depuis la référence de confiance qui
exécute `Full Release Validation`, normalement `--ref main`, même lorsque la
référence cible `ref` pointe vers une branche ou une balise de version plus
ancienne. Il n’existe pas d’entrée séparée de référence de workflow pour Full
Release Validation ; choisissez le harnais de confiance en choisissant la
référence d’exécution du workflow. N’utilisez pas `--ref main -f ref=<sha>` pour
prouver un commit exact sur une branche `main` mouvante ; les SHA de commits
bruts ne peuvent pas être des références de déclenchement de workflow, utilisez
donc `pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker le plus rapide et critique pour la version
- `stable` : minimum plus couverture stable des fournisseurs/backends pour l’approbation de version
- `full` : stable plus couverture large des fournisseurs/médias consultatifs

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour
résoudre une seule fois la référence cible en tant que
`release-package-under-test` et réutilise cet artefact dans les vérifications
Docker du chemin de version comme dans Package Acceptance. Cela garde toutes les
machines côté package sur les mêmes octets et évite les builds répétés de
package. Le smoke test d’installation OpenAI cross-OS utilise
`OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable de dépôt/organisation est
définie, sinon `openai/gpt-5.4`, car cette voie prouve l’installation du
package, l’onboarding, le démarrage du Gateway et un tour d’agent live, plutôt
que de mesurer le modèle par défaut le plus lent. La matrice plus large des
fournisseurs live reste l’endroit prévu pour la couverture propre aux modèles.

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

N’utilisez pas l’ombrelle complète comme première réexécution après un correctif
ciblé. Si une machine échoue, utilisez le workflow enfant, le job, la voie Docker,
le profil de package, le fournisseur de modèle ou la voie QA en échec pour la
preuve suivante. Réexécutez l’ombrelle complète seulement lorsque le correctif a
modifié l’orchestration partagée de la version ou a rendu obsolètes les preuves
précédentes de toutes les machines. Le vérificateur final de l’ombrelle revérifie
les identifiants enregistrés des exécutions de workflows enfants ; ainsi, après
la réexécution réussie d’un workflow enfant, ne réexécutez que le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la
vraie exécution de candidat de version, `ci` exécute seulement l’enfant CI normal,
`plugin-prerelease` exécute seulement l’enfant Plugin propre à la version,
`release-checks` exécute toutes les machines de version, et les groupes de
version plus étroits sont `install-smoke`, `cross-os`, `live-e2e`, `package`,
`qa`, `qa-parity`, `qa-live` et `npm-telegram`. Les réexécutions ciblées
`npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package de release-checks.

### Vitest

La machine Vitest est le workflow enfant manuel `CI`. Le CI manuel contourne
intentionnellement le périmètre des changements et force le graphe de tests
normal pour le candidat de version : shards Linux Node, shards de plugins
intégrés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`,
smoke test de build, vérifications de documentation, Skills Python, Windows,
macOS, Android et i18n de Control UI.

Utilisez cette machine pour répondre à « l’arbre source a-t-il passé toute la
suite de tests normale ? ». Ce n’est pas la même chose que la validation produit
du chemin de version. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des shards échoués ou lents des jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest comme `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse de performance

Exécutez le CI manuel directement seulement lorsque la version nécessite un CI
normal déterministe, mais pas les machines Docker, QA Lab, live, cross-OS ou
package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker se trouve dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke` en
mode version. Elle valide le candidat de version au moyen d’environnements Docker
packagés, et pas seulement de tests au niveau source.

La couverture Docker de version inclut :

- smoke test d’installation complet avec le smoke test lent d’installation globale Bun activé
- préparation/réutilisation de l’image de smoke test du Dockerfile racine par SHA cible, avec les jobs QR, racine/Gateway et smoke installer/Bun exécutés comme shards install-smoke séparés
- voies E2E du dépôt
- morceaux Docker du chemin de version : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le morceau `plugins-runtime-services` lorsqu’elle est demandée
- voies séparées d’installation/désinstallation des plugins intégrés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseurs live/E2E et couverture des modèles live Docker lorsque les vérifications de version incluent les suites live

Utilisez les artefacts Docker avant de réexécuter. Le planificateur du chemin de
version téléverse `.artifacts/docker-tests/` avec les journaux de voies,
`summary.json`, `failures.json`, les chronométrages de phase, le JSON du plan du
planificateur et les commandes de réexécution. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au
lieu de réexécuter tous les morceaux de version. Les commandes de réexécution
générées incluent le `package_artifact_run_id` précédent et les entrées d’image
Docker préparée lorsqu’elles sont disponibles, afin qu’une voie en échec puisse
réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait également partie de `OpenClaw Release Checks`. C’est la
barrière de version pour le comportement agentique et le niveau canal, séparée
de Vitest et de la mécanique de package Docker.

La couverture QA Lab de version inclut :

- voie de parité simulée comparant la voie candidate OpenAI à la référence Opus 4.6 avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les locations d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de version nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la version se comporte-t-elle
correctement dans les scénarios QA et les flux de canaux live ? ». Conservez les
URL d’artefacts des voies de parité, Matrix et Telegram lors de l’approbation de
la version. La couverture Matrix complète reste disponible comme exécution QA-Lab
manuelle shardée, plutôt que comme voie critique par défaut pour la version.

### Package

La machine Package est la barrière du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et son SHA-256, et
garde la référence du harnais de workflow séparée de la référence source du
package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet `package_ref` de confiance avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` obligatoire
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`,
l’artefact de package de version préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` et
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à
jour, le nettoyage des dépendances obsolètes de Plugin, les fixtures de Plugin
hors ligne, la mise à jour de Plugin et la QA du package Telegram contre le même
tarball résolu. La matrice de mise à niveau couvre chaque référence stable
publiée sur npm de `2026.4.23` à `latest` ; utilisez Package Acceptance avec
`source=npm` pour un candidat déjà livré, ou `source=ref`/`source=artifact` pour
un tarball npm local adossé à un SHA avant publication. C’est le remplacement
natif GitHub de la majeure partie de la couverture package/mise à jour qui
nécessitait auparavant Parallels. Les vérifications de version cross-OS restent
importantes pour l’onboarding, l’installateur et le comportement de plateforme
propres à l’OS, mais la validation produit package/mise à jour devrait préférer
Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins).
Utilisez-la pour décider quelle voie locale, Docker, Package Acceptance ou de
vérification de version prouve une installation/mise à jour de Plugin, un
nettoyage doctor ou un changement de migration de package publié. La migration
exhaustive de mise à jour publiée depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` séparé, et ne fait pas partie du CI complet
de version.

L’indulgence héritée de package-acceptance est intentionnellement limitée dans
le temps. Les packages jusqu’à `2026.4.25` peuvent utiliser le chemin de
compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées
privées d’inventaire QA absentes du tarball, `gateway install --wrapper`
manquant, fichiers de patch manquants dans la fixture git dérivée du tarball,
`update.channel` persistant manquant, anciens emplacements d’enregistrements
d’installation de Plugin, persistance manquante des enregistrements
d’installation de marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le package `2026.4.26` publié peut émettre des
avertissements pour les fichiers d’empreinte de métadonnées de build local déjà
livrés. Les packages ultérieurs doivent satisfaire les contrats de package
modernes ; ces mêmes lacunes font échouer la validation de version.

Utilisez des profils Package Acceptance plus larges lorsque la question de
version porte sur un package réellement installable :

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

- `smoke` : voies rapides d’installation de package/canal/agent, de réseau Gateway et de rechargement de configuration
- `package` : contrats d’installation/mise à jour/package Plugin sans ClawHub en direct ; c’est la valeur par défaut du contrôle de version
- `product` : `package` plus les canaux MCP, le nettoyage cron/sous-agent, la recherche web OpenAI et OpenWebUI
- `full` : fragments de chemin de publication Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des réexécutions ciblées

Pour la preuve Telegram du package candidat, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tarball `package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les contrôles après publication.

## Automatisation de publication de version

`OpenClaw Release Publish` est le point d’entrée normal de publication avec mutation. Il orchestre les workflows de publication fiable dans l’ordre requis par la version :

1. Extraire le tag de version et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
6. Déclencher `OpenClaw NPM Release` avec le tag de version, le dist-tag npm et le `preflight_run_id` enregistré.

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

Utilisez les workflows de plus bas niveau `Plugin NPM Release` et `Plugin ClawHub Release` uniquement pour une réparation ciblée ou un travail de republication. Pour une réparation de Plugin sélectionné, transmettez `plugin_publish_scope=selected` et `plugins=@openclaw/name` à `OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis tel que `v2026.4.2`, `v2026.4.2-1` ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit complet à 40 caractères de la branche de workflow actuelle pour un précontrôle uniquement de validation
- `preflight_only` : `true` pour la validation/construction/package uniquement, `false` pour le vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise l’archive tarball préparée depuis l’exécution de précontrôle réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de version requis ; il doit déjà exister
- `preflight_run_id` : identifiant d’exécution de précontrôle `OpenClaw NPM Release` réussi ; requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement pour un travail de réparation ciblé
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le workflow comme orchestrateur de réparation limité aux Plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les contrôles contenant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un tag de version.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de préversion bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours uniquement de validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le précontrôle ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de version npm stable

Lors de la préparation d’une version npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle pour une répétition à blanc du workflow de précontrôle, uniquement de validation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de version, le tag de version ou le SHA de commit complet lorsque vous voulez la CI normale plus la couverture du cache d’invites en direct, de Docker, de QA Lab, de Matrix et de Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le workflow manuel `CI` sur la ref de version
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré ; il publie les Plugins externalisés vers npm et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la version a atterri sur `beta`, utilisez le workflow privé `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`
8. Si la version a été intentionnellement publiée directement vers `latest` et que `beta` doit suivre immédiatement la même construction stable, utilisez ce même workflow privé pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée d’auto-réparation déplacer `beta` plus tard

La mutation du dist-tag réside dans le dépôt privé pour des raisons de sécurité, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela permet de garder le chemin de publication directe et le chemin de promotion bêta d’abord tous deux documentés et visibles pour l’opérateur.

Si un mainteneur doit revenir à l’authentification npm locale, exécutez les commandes de la CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op` directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites, alertes et traitements OTP observables et évite les alertes hôte répétées.

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

Les mainteneurs utilisent la documentation de version privée dans [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) pour le runbook réel.

## Connexe

- [Canaux de publication](/fr/install/development-channels)

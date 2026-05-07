---
read_when:
    - Recherche de définitions de canaux de publication publics
    - Exécuter la validation de version ou l’acceptation de package
    - Recherche du nommage et de la cadence des versions
summary: Canaux de publication, liste de contrôle des opérateurs, machines de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-07T15:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw dispose de trois canaux de publication publics :

- stable : versions étiquetées publiées sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- beta : balises de préversion publiées sur npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version corrective stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne complétez pas le mois ou le jour avec des zéros
- `latest` désigne la version npm stable actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les versions stables et correctives stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build bêta validée
- Chaque version stable d’OpenClaw livre ensemble le package npm et l’application macOS ;
  les versions bêta valident et publient normalement d’abord le chemin npm/package, avec
  la build/signature/notarisation de l’application Mac réservée aux versions stables, sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La version stable suit uniquement après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas les nouveaux
  développements sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise bêta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit publiquement la forme du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partez du `main` actuel : récupérez la dernière version, confirmez que le commit cible est poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrivez la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, conservez des entrées orientées utilisateur, commitez-la, poussez-la, puis faites un rebase/pull
   une fois de plus avant de créer la branche.
3. Examinez les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consignez pourquoi elle est
   intentionnellement conservée.
4. Créez `release/YYYY.M.D` depuis le `main` actuel ; n’effectuez pas le travail normal de publication
   directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour la balise prévue, puis exécutez
   `pnpm release:prep`. Cette commande actualise les versions des plugins, l’inventaire des plugins, le schéma de
   configuration, les métadonnées de configuration des canaux groupés, la base de référence de la documentation de configuration, les exports du SDK de plugin,
   et la base de référence de l’API du SDK de plugin dans le bon ordre. Commitez toute dérive générée
   avant de baliser. Exécutez ensuite le prévol déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé uniquement pour la validation
   de prévol. Enregistrez le `preflight_run_id` réussi.
7. Lancez tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet de commit. C’est le seul point d’entrée manuel
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corrigez sur la branche de publication et relancez le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou allowlist de modèles en échec qui
   prouve le correctif. Relancez l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, balisez `vYYYY.M.D-beta.N`, puis exécutez `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Ce workflow vérifie `pnpm plugins:sync:check`,
   distribue tous les packages de plugins publiables vers npm et le même ensemble vers
   ClawHub en parallèle, puis promeut l’artefact de prévol npm OpenClaw préparé
   avec le dist-tag correspondant dès que la publication npm des plugins réussit.
   La publication ClawHub peut encore être en cours pendant la publication npm d’OpenClaw, mais le
   workflow de publication affiche immédiatement les ID des exécutions enfants. Par défaut, il
   n’attend pas ClawHub après son déclenchement ; la disponibilité npm d’OpenClaw
   n’est donc pas bloquée par des approbations ClawHub ou un travail de registre plus lents ; définissez
   `wait_for_clawhub=true` lorsque ClawHub doit bloquer la fin du workflow. Le
   chemin ClawHub réessaie les échecs transitoires d’installation de dépendances CLI, publie
   les plugins dont la prévisualisation réussit même lorsqu’une cellule de prévisualisation échoue de façon intermittente, et se termine par
   une vérification du registre pour chaque version de plugin attendue afin que les publications partielles
   restent visibles et réessayables. Après publication, exécutez
   l’acceptation de package post-publication
   sur le package publié `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une préversion poussée ou publiée nécessite un correctif,
   créez le numéro de préversion correspondant suivant ; ne supprimez pas et ne réécrivez pas l’ancienne
   préversion.
10. Pour la version stable, continuez uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe aussi par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévol réussi via
    `preflight_run_id` ; la préparation de la publication stable macOS exige aussi les
    fichiers `.zip`, `.dmg`, `.dSYM.zip` empaquetés et le fichier `appcast.xml` mis à jour sur `main`.
11. Après publication, exécutez le vérificateur npm post-publication, le test E2E Telegram autonome
    optionnel sur npm publié lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub à partir de la
    section `CHANGELOG.md` complète correspondante, et les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant la prévalidation de release afin que le TypeScript de test reste couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de release afin que les vérifications plus larges des cycles d’import et des frontières d’architecture soient vertes en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release attendus `dist/*` et le bundle Control UI existent pour l’étape de validation du pack
- Exécutez `pnpm release:prep` après l’incrément de version racine et avant le tag. Il exécute chaque générateur de release déterministe qui dérive couramment après un changement de version/config/API : versions des plugins, inventaire des plugins, schéma de configuration de base, métadonnées de configuration des canaux groupés, référence de docs de configuration, exports du SDK Plugin et référence d’API du SDK Plugin. `pnpm release:check` réexécute ces gardes en mode vérification et signale tous les échecs de dérive générée qu’il trouve en un seul passage avant d’exécuter les vérifications de release de package.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de release pour lancer toutes les boîtes de test de pré-release depuis un point d’entrée unique. Il accepte une branche, un tag ou un SHA complet de commit, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour la smoke d’installation, l’acceptation de package, les vérifications de package inter-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent la soak exhaustive live/E2E et du chemin de release Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation de la soak. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de package contre l’artefact `release-package-under-test` des vérifications de release. Fournissez `npm_telegram_package_spec` après publication lorsque le même E2E Telegram doit aussi prouver le package npm publié. Fournissez `package_acceptance_package_spec` après publication lorsque Package Acceptance doit exécuter sa matrice package/mise à jour contre le package npm expédié au lieu de l’artefact construit depuis le SHA. Fournissez `evidence_package_spec` lorsque le rapport de preuves privé doit prouver que la validation correspond à un package npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal secondaire pour un candidat package pendant que le travail de release continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref` pour empaqueter une branche/un tag/un SHA `package_ref` de confiance avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat vers `package-under-test`, réutilise l’ordonnanceur de release Docker E2E contre cette archive tar, et peut exécuter la QA Telegram contre la même archive tar avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package est le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée. `update-restart-auth` utilise le package candidat à la fois comme CLI installée et comme package-under-test afin d’exercer le chemin de redémarrage géré de la commande de mise à jour candidate.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies natives d’artefact package/mise à jour/redémarrage/plugin sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : fragments du chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin de la couverture CI normale complète pour le candidat release. Les déclenchements manuels de CI contournent le scoping des changements et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, la smoke de build, les vérifications de docs, les Skills Python, Windows, macOS, Android et les voies i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Cela exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés, les attributs bornés et la rédaction du contenu/des identifiants sans nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutatrice après que le tag existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un tag accessible depuis main), passez le tag de release et le `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw afin que le package cœur ne soit pas publié avant ses plugins externalisés.
- Les vérifications de release s’exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil live Matrix rapide et la voie QA Telegram avant l’approbation de release. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport Matrix, des médias et de l’E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau inter-OS fait partie de `OpenClaw Release Checks` et `Full Release Validation` publics, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court, déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de release portant des secrets doivent être déclenchées via `Full Release Validation` ou depuis la ref de workflow `main`/release afin que la logique de workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA complet de commit tant que le commit résolu est accessible depuis une branche OpenClaw ou un tag de release
- La prévalidation en mode validation seule de `OpenClaw NPM Release` accepte aussi le SHA complet de 40 caractères du commit actuel de la branche de workflow sans nécessiter de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées de package ; la vraie publication nécessite toujours un vrai tag de release
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutateur peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de release npm n’attend plus la voie séparée des vérifications de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correction correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d’installation du registre publié dans un préfixe temporaire frais
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter la smoke bêta post-publication complète depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’aide exécute la validation Parallels npm update/fresh-target, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise maintenant prévalidation puis promotion :
  - la vraie publication npm doit passer un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée de workflow
  - la mutation tokenisée de dist-tag npm vit maintenant dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour la sécurité, parce que `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le dépôt public conserve une publication uniquement OIDC
  - `macOS Release` public est réservé à la validation ; lorsqu’un tag existe uniquement sur une branche de release mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit passer un `preflight_run_id` et un `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire à nouveau
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N` afin que les corrections de release ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La prévalidation de release npm échoue de manière fermée sauf si l’archive tar inclut à la fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide afin que nous n’expédiions pas à nouveau un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée de plugins publiés et les métadonnées de package sont présents dans l’agencement du registre installé. Une release qui expédie des charges utiles d’exécution de plugin manquantes échoue au vérificateur postpublish et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm sur l’archive tar de mise à jour candidate, afin que l’e2e d’installateur détecte le gonflement accidentel du pack avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing d’extensions ou les matrices de test d’extensions, régénérez et examinez les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de release ne décrivent pas une disposition CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` égal ou supérieur au plancher de build Sparkle canonique pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-release depuis un point d’entrée unique. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’aide afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’aide pousse `release-ci/<sha>-...`, déclenche `Full Release Validation` depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une exécution enfant d’un `main` plus récent.

Pour la validation d’une branche ou d’une étiquette de version, exécutez-la depuis la référence de workflow `main` de confiance
et passez la branche ou l’étiquette de version comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la référence cible, déclenche le `CI` manuel avec
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les contrôles côté paquet, et
déclenche l’E2E Telegram autonome du paquet lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` répartit ensuite les tests d’installation, les contrôles de version inter-OS, la couverture live/E2E Docker
du chemin de version lorsque le soak est activé, Package Acceptance avec l’AQ du paquet Telegram,
la parité QA Lab, Matrix en direct et Telegram en direct. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
indique que `normal_ci` et `release_checks` ont réussi. En mode full/all,
l’enfant `npm_telegram` doit également avoir réussi ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut les tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de version
puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de version](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et complet,
les artefacts et les points de reprise ciblés.
Les workflows enfants sont déclenchés depuis la référence de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
ancienne branche ou étiquette de version. Il n’existe pas d’entrée séparée de référence de workflow pour Full Release Validation ;
choisissez le harnais de confiance en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur `main` mouvant ;
les SHA bruts de commit ne peuvent pas être des références de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour choisir l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la version le plus rapide
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de version
- `full` : stable plus large couverture fournisseur/média consultative

Utilisez `run_release_soak=true` avec `stable` lorsque les voies bloquantes pour la version sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de version Docker et
borné de survivance de mise à niveau publiée avant promotion. Ce balayage couvre
les quatre derniers paquets stables plus les baselines épinglées `2026.4.23` et `2026.5.2`
plus l’ancienne couverture `2026.4.15`, avec les baselines en double supprimées et
chaque baseline fragmentée dans son propre job d’exécution Docker. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre la référence cible
une seule fois comme `release-package-under-test` et réutilise cet artefact dans les contrôles inter-OS,
Package Acceptance et Docker du chemin de version lorsque le soak s’exécute. Cela garde
toutes les machines côté paquet sur les mêmes octets et évite les constructions répétées de paquet.
Le test d’installation inter-OS OpenAI utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable de dépôt/organisation est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du paquet, l’onboarding, le démarrage du Gateway et un tour d’agent en direct
plutôt que de mesurer le modèle par défaut le plus lent. La matrice plus large de fournisseurs en direct
reste l’endroit dédié à la couverture spécifique aux modèles.

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

N’utilisez pas l’ombrelle complète comme première relance après un correctif ciblé. Si une machine
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de paquet, le fournisseur de modèle
ou la voie QA en échec pour la preuve suivante. Relancez l’ombrelle complète uniquement lorsque
le correctif a modifié l’orchestration de version partagée ou a rendu obsolètes les preuves
précédentes sur toutes les machines. Le vérificateur final de l’ombrelle revérifie les identifiants enregistrés des exécutions de workflow enfants ;
ainsi, après la relance réussie d’un workflow enfant, relancez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la véritable
exécution de candidat de version, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin réservé à la version, `release-checks` exécute toutes les
machines de version, et les groupes de version plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de paquet des release-checks. Les relances
inter-OS ciblées peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA des release-checks sont consultatifs ; un échec uniquement QA
ne bloque pas la validation de version.

### Vitest

La machine Vitest est le workflow enfant `CI` manuel. Le CI manuel contourne intentionnellement
le cadrage des changements et force le graphe de tests normal pour le candidat de version :
fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, test de build, contrôles de documentation, Skills Python,
Windows, macOS, Android et i18n de Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle réussi la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de version. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments échoués ou lents issus des jobs CI lors de l’analyse de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez le CI manuel directement seulement lorsque la version nécessite un CI normal déterministe mais
pas les machines Docker, QA Lab, live, inter-OS ou paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode version. Elle valide le candidat de version via des
environnements Docker empaquetés plutôt que seulement des tests au niveau source.

La couverture Docker de version inclut :

- test d’installation complet avec le lent test d’installation globale Bun activé
- préparation/réutilisation de l’image de test du Dockerfile racine par SHA cible, avec les jobs de test QR,
  racine/Gateway et installateur/Bun exécutés comme fragments install-smoke séparés
- voies E2E du dépôt
- fragments Docker du chemin de version : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsque demandée
- voies séparées d’installation/désinstallation des plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèles Docker en direct lorsque les contrôles de version
  incluent des suites en direct

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de version téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les chronométrages de phases, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable plutôt que de
relancer tous les fragments de version. Les commandes de relance générées incluent les précédents
`package_artifact_run_id` et les entrées d’images Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait également partie de `OpenClaw Release Checks`. C’est la porte de version
du comportement agentique et du niveau canal, distincte de Vitest et des mécaniques
de paquet Docker.

La couverture QA Lab de version inclut :

- voie de parité simulée comparant la voie candidate OpenAI à la baseline Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram en direct utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de version nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la version se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux en direct ? » Conservez les URL d’artefacts des voies de parité, Matrix et Telegram
lors de l’approbation de la version. La couverture Matrix complète reste disponible comme exécution QA-Lab
manuelle fragmentée plutôt que comme voie critique de version par défaut.

### Paquet

La machine Paquet est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde la
référence du harnais de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
- `source=ref` : empaqueter une branche, une étiquette ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` obligatoire
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’
artefact de paquet de version préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve la migration, la mise à jour,
le redémarrage de mise à jour avec authentification configurée, le nettoyage de dépendances de plugins obsolètes, les
fixtures de plugins hors ligne, la mise à jour de Plugin et l’AQ du paquet Telegram contre le même tarball
résolu. Les contrôles de version bloquants utilisent la baseline du dernier paquet publié par défaut ;
`run_release_soak=true` ou
`release_profile=full` élargit à chaque baseline stable publiée sur npm de
`2026.4.23` à `latest` plus les fixtures de problèmes signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le
remplacement natif GitHub de la majeure partie de la couverture paquet/mise à jour qui nécessitait auparavant
Parallels. Les contrôles de version inter-OS restent importants pour l’onboarding, l’
installateur et le comportement de plateforme propres à l’OS, mais la validation produit de paquet/mise à jour doit
privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
déterminer quelle voie locale, Docker, Package Acceptance ou release-check prouve un
changement d’installation/mise à jour de Plugin, de nettoyage doctor ou de migration de paquet publié.
La migration exhaustive de mise à jour publiée depuis chaque paquet stable `2026.4.23+` est
un workflow manuel `Update Migration` séparé, qui ne fait pas partie de Full Release CI.

La tolérance historique de l’acceptation des packages est intentionnellement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tarball, absence de
`gateway install --wrapper`, fichiers de correctif absents de la fixture git dérivée de l’archive tarball, absence de
`update.channel` persisté, emplacements historiques des enregistrements d’installation de plugins,
absence de persistance des enregistrements d’installation du marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le package publié `2026.4.26` peut émettre un avertissement
pour les fichiers locaux d’horodatage de métadonnées de build qui avaient déjà été livrés. Les packages ultérieurs
doivent satisfaire aux contrats de package modernes ; ces mêmes lacunes font échouer la validation
de publication.

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

- `smoke` : voies rapides d’installation de package/canal/agent, réseau Gateway et rechargement
  de configuration
- `package` : contrats d’installation/mise à jour/redémarrage/package de plugin sans ClawHub
  live ; c’est la valeur par défaut du contrôle de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : segments Docker du chemin de publication avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des relances ciblées

Pour la preuve Telegram d’un package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet l’archive tarball
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les contrôles après publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée de publication mutateur normal. Il
orchestre les workflows d’éditeur approuvé dans l’ordre requis par la release :

1. Extraire le tag de release et résoudre son SHA de commit.
2. Vérifier que le tag est joignable depuis `main` ou `release/*`.
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
uniquement pour des travaux ciblés de réparation ou de republication. Pour une réparation de plugin sélectionné, transmettez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit
  complet de 40 caractères de la branche de workflow actuelle pour un prévol de validation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  chemin de publication réel
- `preflight_run_id` : requis sur le chemin de publication réel afin que le workflow réutilise
  l’archive tarball préparée lors de l’exécution de prévol réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; il doit déjà exister
- `preflight_run_id` : identifiant d’exécution de prévol `OpenClaw NPM Release` réussi ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation réservé aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les contrôles contenant des secrets
  exigent que le commit résolu soit joignable depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : opter pour un trempage exhaustif live/E2E, chemin de publication Docker et
  survivant de mise à niveau depuis toutes les versions sur les contrôles de release stable/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prépublication bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  réservés à la validation
- Le chemin de publication réel doit utiliser le même `npm_dist_tag` que celui utilisé pendant le prévol ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de release npm stable

Lors de la création d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour une répétition à blanc de validation uniquement du workflow de prévol
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de commit complet
   lorsque vous voulez la CI normale plus la couverture du cache de prompts live, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés sur npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a intentionnellement été publiée directement vers `latest` et que `beta`
   doit immédiatement suivre le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée
   d’autoréparation déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle exige encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde à la fois le chemin de publication directe et le chemin de promotion bêta d’abord
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur une authentification npm locale, exécutez toutes les commandes
CLI 1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
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

Les mainteneurs utilisent la documentation privée de release dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de publication](/fr/install/development-channels)

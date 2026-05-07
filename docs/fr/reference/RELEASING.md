---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation de paquet
    - Recherche de la nomenclature et de la cadence des versions
    - Planifier les lignes de versions de support mensuel ou LTS
summary: Voies de publication, liste de vérification opérateur, boîtes de validation, nommage des versions, lignes de support mensuel prévues et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-07T01:54:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw a trois canaux de release publics :

- stable : releases taguées qui publient sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- beta : tags de prérelease qui publient sur npm `beta`
- dev : la tête mouvante de `main`

## Nommage des versions

- Version de release stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de release corrective stable historique : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prérelease beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas remplir le mois ou le jour avec des zéros
- `latest` désigne la release stable npm actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les releases stables et correctives historiques publient sur npm `beta` par défaut ; les opérateurs de release peuvent cibler explicitement `latest`, ou promouvoir ultérieurement un build beta validé
- Chaque release stable d’OpenClaw livre ensemble le package npm et l’application macOS ;
  les releases beta valident et publient normalement d’abord le chemin npm/package, avec
  le build/la signature/la notarisation de l’app mac réservés aux releases stables sauf demande explicite

### Versionnement prévu pour le support mensuel

OpenClaw ne dispose pas encore d’un canal LTS ou de support mensuel. Les mainteneurs
travaillent à des lignes de support mensuel compatibles avec SemVer, mais les canaux
de mise à jour livrés aujourd’hui restent `stable`, `beta` et `dev`.

La forme de version prévue est `YYYY.M.PATCH` :

- `YYYY` est l’année.
- `M` est la ligne de release mensuelle, sans zéro initial.
- `PATCH` s’incrémente au sein de cette ligne mensuelle et peut augmenter autant que nécessaire.

Par exemple, `2026.6.0`, `2026.6.1` et `2026.6.2` seraient tous sur la ligne de juin
2026. Un futur dist-tag de support mensuel tel que `stable-2026-6` ou
`lts-2026-6` pourra pointer vers cette ligne, tandis que `latest` continuera d’avancer rapidement.

Ce futur modèle remplace le besoin de nouvelles releases correctives `YYYY.M.D-N`.
Les versions correctives historiques existantes restent reconnues afin que les anciens packages et
chemins de mise à niveau continuent de fonctionner.

## Cadence des releases

- Les releases avancent d’abord en beta
- La version stable ne suit qu’après validation de la dernière beta
- Les mainteneurs créent normalement les releases depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation et les corrections de release ne bloquent pas les nouveaux
  développements sur `main`
- Si un tag beta a été poussé ou publié et nécessite une correction, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure de release détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Checklist de l’opérateur de release

Cette checklist présente la forme publique du flux de release. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de release réservé aux mainteneurs.

1. Partir du `main` actuel : tirer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées orientées utilisateur, la committer, la pousser, puis rebase/pull
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de release dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou indiquer pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` à partir du `main` actuel ; ne pas effectuer le travail de release normal
   directement sur `main`.
5. Incrémenter chaque emplacement de version requis pour le tag prévu, exécuter
   `pnpm plugins:sync` afin que les packages de Plugin publiables partagent la version de release
   et les métadonnées de compatibilité, puis exécuter le preflight déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA de branche de release complet de 40 caractères est autorisé pour un preflight
   uniquement de validation. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prérelease avec `Full Release Validation` pour la
   branche de release, le tag ou le SHA de commit complet. C’est l’unique point d’entrée manuel
   pour les quatre grands boîtiers de test de release : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de release et relancer le plus petit
   fichier, canal, job de workflow, profil de package, provider ou liste d’autorisation de modèle en échec qui
   prouve la correction. Relancer l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour beta, taguer `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   distribue en parallèle tous les packages de Plugin publiables vers npm et le même ensemble vers
   ClawHub, puis promeut l’artefact de preflight OpenClaw npm préparé
   avec le dist-tag correspondant dès que la publication npm des Plugins réussit.
   La publication ClawHub peut encore être en cours pendant la publication npm d’OpenClaw, mais le
   workflow de publication de release ne se termine pas avant que les deux chemins de publication des Plugins et
   le chemin de publication npm d’OpenClaw aient abouti. Après publication, exécuter
   l’acceptation de package post-publication contre le package publié
   `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une prérelease poussée ou publiée nécessite une correction,
   créer le numéro de prérelease correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   prérelease.
10. Pour stable, continuer uniquement après que la beta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de preflight réussi via
    `preflight_run_id` ; la préparation de la release macOS stable nécessite également le
    `.zip`, le `.dmg`, le `.dSYM.zip` packagés, ainsi que `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram publié-npm autonome optionnel lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de release/prérelease GitHub issues de la
    section `CHANGELOG.md` complète correspondante, ainsi que les étapes d’annonce de release.

## Preflight de release

- Exécutez `pnpm check:test-types` avant la prévalidation de publication afin que le TypeScript de test reste couvert hors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de publication afin que les contrôles plus larges des cycles d’importation et des limites d’architecture soient verts hors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le paquet de la Control UI existent pour l’étape de validation du paquet
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le balisage. Il met à jour les versions des packages de plugin publiables, les métadonnées de compatibilité pair/API OpenClaw, les métadonnées de build et les ébauches de journaux des modifications des plugins pour correspondre à la version de publication du noyau. `pnpm plugins:sync:check` est le garde-fou de publication non mutateur ; le workflow de publication échoue avant toute mutation du registre si cette étape a été oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de publication pour lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche, une balise ou un SHA de commit complet, déclenche `CI` manuellement et déclenche `OpenClaw Release Checks` pour la fumée d’installation, l’acceptation de package, les contrôles de package multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent les tests live/E2E exhaustifs et le trempage du chemin de publication Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation du trempage. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de package contre l’artefact `release-package-under-test` issu des contrôles de publication. Fournissez `npm_telegram_package_spec` après publication lorsque le même E2E Telegram doit aussi valider le package npm publié. Fournissez `package_acceptance_package_spec` après publication lorsque Package Acceptance doit exécuter sa matrice package/mise à jour contre le package npm livré plutôt que contre l’artefact construit depuis le SHA. Fournissez `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la validation correspond à un package npm publié sans forcer l’E2E Telegram. Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal latéral pour un candidat de package pendant que le travail de publication continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche/balise/SHA `package_ref` de confiance avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat vers `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette archive tar et peut exécuter la QA Telegram contre la même archive tar avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package est le candidat et `published_upgrade_survivor_baseline` sélectionne la ligne de base publiée. `update-restart-auth` utilise le package candidat à la fois comme CLI installée et comme package-under-test afin d’exercer le chemin de redémarrage géré de la commande de mise à jour du candidat.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies natives de l’artefact pour package/mise à jour/redémarrage/plugin sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin de la couverture CI normale complète pour le candidat de publication. Les déclenchements CI manuels contournent le périmètre des changements et forcent les fragments Linux Node, les fragments de plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, la fumée de build, les contrôles de documentation, les Skills Python, Windows, macOS, Android et les voies i18n de la Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Il exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés, les attributs bornés et la rédaction du contenu/des identifiants sans nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication balisée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutatrice après l’existence de la balise. Déclenchez-la depuis `release/YYYY.M.D` (ou `main` lors de la publication d’une balise accessible depuis main), passez la balise de publication et le `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw afin que le package noyau ne soit pas publié avant ses plugins externalisés.
- Les contrôles de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité simulée QA Lab ainsi que le profil Matrix live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport Matrix, des médias et de l’E2EE en parallèle.
- La validation d’exécution multi-OS d’installation et de mise à niveau fait partie des `OpenClaw Release Checks` publics et de `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur propre voie afin de ne pas retarder ni bloquer la publication
- Les contrôles de publication contenant des secrets doivent être déclenchés via `Full Release Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une balise ou un SHA de commit complet tant que le commit résolu est accessible depuis une branche OpenClaw ou une balise de publication
- La prévalidation en mode validation seule de `OpenClaw NPM Release` accepte aussi le SHA de commit complet à 40 caractères de la branche de workflow actuelle sans nécessiter de balise poussée
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` seulement pour le contrôle des métadonnées de package ; la vraie publication nécessite toujours une vraie balise de publication
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutateur peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` en utilisant les deux secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de publication npm n’attend plus la voie séparée des contrôles de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (ou la balise beta/correction correspondante) avant approbation
- Après la publication npm, exécutez `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (ou la version beta/correction correspondante) pour vérifier le chemin d’installation du registre publié dans un nouveau préfixe temporaire
- Après une publication beta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales de mainteneurs peuvent omettre les variables Convex et passer directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter la fumée beta complète après publication depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et imprime le rapport Telegram.
- Les mainteneurs peuvent exécuter le même contrôle après publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et ne s’exécute pas à chaque fusion.
- L’automatisation de publication des mainteneurs utilise désormais prévalidation puis promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée de workflow
  - la mutation de dist-tag npm basée sur jeton vit désormais dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour la sécurité, parce que `npm dist-tag add` nécessite encore `NPM_TOKEN` tandis que le dépôt public garde une publication uniquement OIDC
  - `macOS Release` public est réservé à la validation ; lorsqu’une balise n’existe que sur une branche de publication mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir avec des `preflight_run_id` et `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire à nouveau
- Pour les publications de correction stables héritées comme `YYYY.M.D-N`, le vérificateur après publication contrôle aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N` afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La prévalidation de publication npm échoue de manière fermée sauf si l’archive tar inclut à la fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide, afin que nous n’expédiions pas à nouveau un tableau de bord navigateur vide
- La vérification après publication contrôle aussi que les points d’entrée de plugins publiés et les métadonnées de package sont présents dans la disposition du registre installé. Une publication qui expédie des charges utiles d’exécution de plugins manquantes échoue au vérificateur postpublication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du paquet npm à l’archive tar de mise à jour candidate, afin que l’e2e de l’installateur détecte les gonflements accidentels de paquet avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de minutage des plugins ou les matrices de test des plugins, régénérez et relisez les sorties de matrice `plugin-prerelease-extension-shard` appartenant au planificateur depuis `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de publication ne décrivent pas une disposition CI périmée
- La préparation de la publication macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’application empaquetée doit conserver un identifiant de paquet non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher de build Sparkle canonique pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de prépublication depuis un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation` depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire. Cela évite de valider par accident une exécution enfant `main` plus récente.

Pour la validation d’une branche ou d’une balise de publication, exécutez-la depuis la référence de workflow `main` de confiance et passez la branche ou la balise de publication comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la ref cible, déclenche le `CI` manuel avec
`target_ref=<release-ref>`, déclenche `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les vérifications orientées
package, et déclenche l’E2E Telegram de package autonome lorsque
`release_profile=full` avec `rerun_group=all` ou lorsque
`npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` lance ensuite en éventail la smoke d’installation, les vérifications de
publication cross-OS, la couverture live/E2E Docker du chemin de publication
lorsque le soak est activé, Package Acceptance avec la QA du package Telegram,
la parité QA Lab, Matrix en live et Telegram en live. Une exécution complète
n’est acceptable que lorsque le résumé `Full Release Validation`
affiche `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit également réussir ; en dehors de full/all, il est
ignoré sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé
final du vérificateur inclut les tableaux des jobs les plus lents pour chaque
exécution enfant, afin que le responsable de publication puisse voir le chemin
critique actuel sans télécharger les journaux.
Consultez [Validation de publication complète](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les
différences entre les profils stable et full, les artefacts et les poignées de
relance ciblées.
Les workflows enfants sont déclenchés depuis la ref de confiance qui exécute
`Full Release Validation`, normalement `--ref main`, même lorsque la `ref` cible
pointe vers une branche ou une balise de publication plus ancienne. Il n’existe
pas d’entrée workflow-ref séparée pour Full Release Validation ; choisissez le
harnais de confiance en choisissant la ref d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur un
`main` mobile ; les SHA de commit bruts ne peuvent pas être des refs de
déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker le plus rapide et critique pour la publication
- `stable` : minimum plus couverture stable des fournisseurs/backends pour l’approbation de publication
- `full` : stable plus large couverture consultative des fournisseurs/médias

Utilisez `run_release_soak=true` avec `stable` lorsque les lanes bloquantes pour
la publication sont vertes et que vous voulez le balayage exhaustif live/E2E,
du chemin de publication Docker et des survivants de mise à niveau publiés
bornés avant la promotion. Ce balayage couvre les quatre derniers packages
stables plus les références de base épinglées `2026.4.23` et `2026.5.2`
ainsi qu’une couverture plus ancienne `2026.4.15`, avec suppression des
références de base en double et chaque référence de base shardée dans son propre
job d’exécuteur Docker. `full` implique `run_release_soak=true`.

`OpenClaw Release Checks` utilise la ref de workflow de confiance pour résoudre
la ref cible une seule fois en tant que `release-package-under-test` et réutilise
cet artefact dans les vérifications cross-OS, Package Acceptance et Docker du
chemin de publication lorsque le soak s’exécute. Cela garde toutes les boîtes
orientées package sur les mêmes octets et évite les builds de package répétés.
La smoke d’installation OpenAI cross-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL`
lorsque la variable repo/org est définie, sinon `openai/gpt-5.4`, car cette lane
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un
tour d’agent live plutôt que de benchmarker le modèle par défaut le plus lent.
La matrice plus large des fournisseurs live reste l’endroit dédié à la
couverture spécifique aux modèles.

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

N’utilisez pas l’ombrelle complète comme première relance après une correction
ciblée. Si une boîte échoue, utilisez le workflow enfant, le job, la lane Docker,
le profil de package, le fournisseur de modèle ou la lane QA en échec pour la
preuve suivante. Relancez l’ombrelle complète uniquement lorsque la correction a
modifié l’orchestration de publication partagée ou a rendu obsolète la preuve
précédente toutes boîtes. Le vérificateur final de l’ombrelle revérifie les ids
d’exécution de workflow enfant enregistrés ; ainsi, après la réussite de la
relance d’un workflow enfant, relancez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la
véritable exécution de release candidate, `ci` exécute uniquement l’enfant CI
normal, `plugin-prerelease` exécute uniquement l’enfant Plugin propre à la
publication, `release-checks` exécute chaque boîte de publication, et les groupes
de publication plus étroits sont `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` exigent `npm_telegram_package_spec` ; les
exécutions full/all avec `release_profile=full` utilisent l’artefact de package
des release-checks. Les relances cross-OS ciblées peuvent ajouter
`cross_os_suite_filter=windows/packaged-upgrade` ou un autre filtre OS/suite.
Les échecs QA des release-checks sont consultatifs ; un échec uniquement QA ne
bloque pas la validation de publication.

### Vitest

La boîte Vitest est le workflow enfant `CI` manuel. Le CI manuel contourne
intentionnellement le scoping par changements et force le graphe de tests normal
pour la release candidate : shards Linux Node, shards de Plugins groupés,
contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke de
build, vérifications docs, Skills Python, Windows, macOS, Android et i18n de
Control UI.

Utilisez cette boîte pour répondre à « l’arbre source a-t-il réussi la suite de
tests normale complète ? » Elle n’est pas identique à la validation produit du
chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL d’exécution du `CI` déclenché
- exécution `CI` verte sur le SHA cible exact
- noms de shards échoués ou lents provenant des jobs CI lors de l’investigation de régressions
- artefacts de timings Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse des performances

Exécutez le CI manuel directement uniquement lorsque la publication a besoin
d’un CI normal déterministe mais pas des boîtes Docker, QA Lab, live, cross-OS
ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La boîte Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke` en
mode publication. Elle valide la release candidate au moyen d’environnements
Docker packagés au lieu de seuls tests au niveau source.

La couverture Docker de publication inclut :

- smoke d’installation complète avec la smoke lente d’installation globale Bun activée
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec des jobs smoke QR, root/gateway et installer/Bun exécutés comme shards install-smoke séparés
- lanes E2E du dépôt
- chunks Docker du chemin de publication : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le chunk `plugins-runtime-services` lorsque demandée
- lanes d’installation/désinstallation de Plugins groupés fractionnées
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites de fournisseurs live/E2E et couverture des modèles live Docker lorsque les release checks incluent les suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de
publication téléverse `.artifacts/docker-tests/` avec les journaux de lane,
`summary.json`, `failures.json`, les timings de phase, le JSON du plan du
planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au
lieu de relancer tous les chunks de publication. Les commandes de relance
générées incluent les précédents `package_artifact_run_id` et les entrées
d’image Docker préparée lorsqu’elles sont disponibles, afin qu’une lane échouée
puisse réutiliser la même tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait également partie de `OpenClaw Release Checks`. C’est la
gate de publication du comportement agentique et du niveau canal, distincte de
Vitest et des mécaniques de package Docker.

La couverture QA Lab de publication inclut :

- lane de parité mock comparant la lane candidate OpenAI à la référence de base Opus 4.6 à l’aide du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- lane QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de publication a besoin d’une preuve locale explicite

Utilisez cette boîte pour répondre à « la publication se comporte-t-elle
correctement dans les scénarios QA et les flux de canaux live ? » Conservez les
URL d’artefacts des lanes parité, Matrix et Telegram lors de l’approbation de la
publication. La couverture Matrix complète reste disponible sous forme
d’exécution QA-Lab shardée manuelle plutôt que comme lane critique de publication
par défaut.

### Package

La boîte Package est la gate du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommée par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde
la ref du harnais de workflow séparée de la ref source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw
- `source=ref` : packager une branche, balise ou SHA de commit complet `package_ref` de confiance avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`,
l’artefact de package de publication préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve la migration, la mise à
jour, le redémarrage après mise à jour avec auth configurée, le nettoyage des
dépendances de Plugin obsolètes, les fixtures de Plugins hors ligne, la mise à
jour de Plugin et la QA du package Telegram sur la même tarball résolue. Les
release checks bloquants utilisent la référence de base du dernier package
publié par défaut ; `run_release_soak=true` ou
`release_profile=full` s’étend à chaque référence de base stable publiée sur npm
de `2026.4.23` à `latest`, plus les fixtures d’incidents signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour une tarball npm locale adossée à un SHA avant
publication. C’est le remplacement natif GitHub de la plupart de la couverture
package/mise à jour qui nécessitait auparavant Parallels. Les release checks
cross-OS restent importants pour l’onboarding, l’installateur et le comportement
plateforme spécifiques à l’OS, mais la validation produit package/mise à jour
doit privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des Plugins est
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins).
Utilisez-la pour décider quelle lane locale, Docker, Package Acceptance ou
release-check prouve une installation/mise à jour de Plugin, un nettoyage doctor
ou un changement de migration de package publié. La migration exhaustive des
mises à jour publiées depuis chaque package stable `2026.4.23+` est un workflow
manuel `Update Migration` séparé, et ne fait pas partie de Full Release CI.

La tolérance héritée de l’acceptation de packages est intentionnellement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de
`gateway install --wrapper`, fichiers de correctif absents de la fixture git dérivée
de l’archive tar, absence de `update.channel` persisté, anciens emplacements
d’enregistrement d’installation de plugin, absence de persistance des enregistrements
d’installation de marketplace, et migration des métadonnées de configuration pendant
`plugins update`. Le package `2026.4.26` publié peut émettre un avertissement
pour les fichiers d’empreinte de métadonnées de build local qui avaient déjà été livrés. Les packages ultérieurs
doivent satisfaire aux contrats modernes de package ; ces mêmes lacunes font échouer la
validation de release.

Utilisez des profils Package Acceptance plus larges lorsque la question de release porte sur un
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

- `smoke` : voies rapides d’installation package/canal/agent, réseau Gateway et
  rechargement de configuration
- `package` : contrats install/update/restart/plugin package sans ClawHub
  en direct ; c’est la valeur par défaut du contrôle de release
- `product` : `package` plus les canaux MCP, le nettoyage cron/subagent, la recherche web OpenAI
  et OpenWebUI
- `full` : segments de chemin de release Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des réexécutions ciblées

Pour une preuve Telegram de package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tar
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les contrôles post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée normal de publication mutative. Il
orchestre les workflows trusted-publisher dans l’ordre nécessaire à la release :

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

Utilisez les workflows de niveau inférieur `Plugin NPM Release` et `Plugin ClawHub Release`
uniquement pour des travaux de réparation ou de republication ciblés. Pour une réparation de plugin sélectionné, passez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release obligatoire tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit complet
  de 40 caractères de la branche de workflow actuelle pour un preflight
  uniquement de validation
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : obligatoire sur le vrai chemin de publication afin que le workflow réutilise
  l’archive tar préparée lors de l’exécution preflight réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release obligatoire ; doit déjà exister
- `preflight_run_id` : id d’exécution preflight `OpenClaw NPM Release` réussi ;
  obligatoire lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag cible npm pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation réservé aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les contrôles contenant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : active le soak exhaustif live/E2E, le chemin de release Docker et
  le soak all-since upgrade-survivor sur les contrôles de release stables/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent être publiés vers `beta` ou `latest`
- Les tags de prérelease bêta ne peuvent être publiés que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie ces métadonnées avant que la publication continue

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour une simulation preflight uniquement de validation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de commit complet
   lorsque vous voulez la CI normale plus la couverture live prompt cache, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez le
   workflow manuel `CI` sur la ref de release à la place
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés vers npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a intentionnellement été publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   auto-réparatrice planifiée déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle
requiert toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde à la fois le chemin de publication directe et le chemin de promotion bêta d’abord
documentés et visibles par les opérateurs.

Si un mainteneur doit se rabattre sur une authentification npm locale, exécutez toute commande CLI 1Password
(`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le conserver dans tmux rend les prompts,
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

Les mainteneurs utilisent la documentation de release privée dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Associé

- [Canaux de release](/fr/install/development-channels)

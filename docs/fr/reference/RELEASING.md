---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de publication ou de l’acceptation de paquet
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, boîtes de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-05T01:49:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw comporte trois canaux de publication publics :

- stable : publications étiquetées publiées sur npm `beta` par défaut, ou sur npm `latest` lorsqu’elles sont explicitement demandées
- beta : étiquettes de prépublication publiées sur npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Étiquette Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Étiquette Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Étiquette Git : `vYYYY.M.D-beta.N`
- Ne mettez pas de zéro initial au mois ni au jour
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les publications stables et correctives stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build beta validée
- Chaque publication stable d’OpenClaw livre ensemble le package npm et l’application macOS ;
  les publications beta valident et publient normalement d’abord le chemin npm/package, avec
  la build/signature/notarisation de l’app Mac réservée au stable sauf demande explicite

## Cadence de publication

- Les publications avancent d’abord par la beta
- Le stable ne suit qu’après validation de la dernière beta
- Les mainteneurs découpent normalement les publications depuis une branche `release/YYYY.M.D` créée
  depuis le `main` courant, afin que la validation et les correctifs de publication ne bloquent pas le nouveau
  développement sur `main`
- Si une étiquette beta a été poussée ou publiée et nécessite un correctif, les mainteneurs découpent
  l’étiquette `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne étiquette beta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partez du `main` courant : récupérez les dernières modifications, confirmez que le commit cible est poussé,
   et confirmez que la CI actuelle de `main` est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrivez la section supérieure de `CHANGELOG.md` depuis l’historique réel des commits avec
   `/changelog`, gardez des entrées orientées utilisateur, commitez-la, poussez-la, puis rebasez/récupérez
   une fois de plus avant de créer la branche.
3. Passez en revue les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimez la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consignez pourquoi elle est
   intentionnellement conservée.
4. Créez `release/YYYY.M.D` depuis le `main` courant ; n’effectuez pas le travail normal de publication
   directement sur `main`.
5. Incrémentez chaque emplacement de version requis pour l’étiquette prévue, exécutez
   `pnpm plugins:sync` afin que les packages Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécutez le prévol déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, et
   `pnpm release:check`.
6. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une étiquette existe,
   un SHA complet de branche de publication à 40 caractères est autorisé pour un prévol
   de validation uniquement. Enregistrez le `preflight_run_id` réussi.
7. Lancez tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, l’étiquette ou le SHA complet du commit. C’est le seul point d’entrée manuel
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corrigez sur la branche de publication et relancez le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou allowlist de modèles ayant échoué qui
   prouve le correctif. Ne relancez l’ensemble complet que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour beta, étiquetez `vYYYY.M.D-beta.N`, puis exécutez `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les packages Plugin publiables sur npm, publie ensuite le même
   ensemble sur ClawHub sous forme de tarballs npm-pack ClawPack, puis promeut l’artefact
   de prévol npm OpenClaw préparé avec le dist-tag correspondant. Après la publication,
   exécutez l’acceptation de package post-publication
   contre le package publié `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une prépublication poussée ou publiée nécessite un correctif,
   découpez le numéro de prépublication correspondant suivant ; ne supprimez pas et ne réécrivez pas l’ancienne
   prépublication.
10. Pour stable, continuez uniquement après que la beta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe aussi par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévol réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable exige aussi les
    `.zip`, `.dmg`, `.dSYM.zip` packagés, ainsi que `appcast.xml` mis à jour sur `main`.
11. Après la publication, exécutez le vérificateur npm post-publication, l’E2E Telegram npm publié
    autonome optionnel lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub depuis la
    section `CHANGELOG.md` correspondante complète, et les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant le contrôle préliminaire de publication afin que le TypeScript des tests reste couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le contrôle préliminaire de publication afin que les vérifications plus larges des cycles d’importation et des limites d’architecture soient au vert en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication attendus `dist/*` et le bundle de l’interface utilisateur de contrôle existent pour l’étape de validation du paquet
- Exécutez `pnpm plugins:sync` après l’augmentation de version racine et avant le marquage. Il met à jour les versions des packages de plugins publiables, les métadonnées de compatibilité pair/API OpenClaw, les métadonnées de build et les ébauches de journaux des modifications des plugins afin qu’ils correspondent à la version de publication du cœur. `pnpm plugins:sync:check` est la garde de publication non mutante ; le workflow de publication échoue avant toute mutation du registre si cette étape a été oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de la publication pour lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche, une étiquette ou un SHA de commit complet, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour la fumée d’installation, l’acceptation de package, les vérifications de package multiplateformes, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut gardent les tests live/E2E exhaustifs et l’endurance du chemin de publication Docker derrière `run_release_soak=true` ; `release_profile=full` force l’activation de l’endurance. Avec `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de package contre l’artefact `release-package-under-test` issu des vérifications de publication. Fournissez `npm_telegram_package_spec` après publication lorsque le même E2E Telegram doit aussi valider le package npm publié. Fournissez `package_acceptance_package_spec` après publication lorsque Package Acceptance doit exécuter sa matrice package/mise à jour contre le package npm livré au lieu de l’artefact construit depuis le SHA. Fournissez `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la validation correspond à un package npm publié sans forcer l’E2E Telegram. Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal auxiliaire pour un candidat package pendant que le travail de publication continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche/étiquette/SHA `package_ref` de confiance avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat vers `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette archive tar et peut exécuter la QA Telegram contre la même archive tar avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package est le candidat et `published_upgrade_survivor_baseline` sélectionne la base publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies natives d’artefact pour package/mise à jour/plugin sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : segments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin d’une couverture CI normale complète pour le candidat de publication. Les déclenchements manuels de CI contournent le périmétrage des changements et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, la fumée de build, les vérifications de docs, les Skills Python, Windows, macOS, Android et les voies d’internationalisation de l’interface utilisateur de contrôle.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Il exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés, les attributs bornés et la rédaction du contenu/des identifiants sans nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication étiquetée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après l’existence de l’étiquette. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’une étiquette accessible depuis main), passez l’étiquette de publication et le `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw afin que le package cœur ne soit pas publié avant ses plugins externalisés.
- Les vérifications de publication s’exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité fictive QA Lab ainsi que le profil Matrix live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet des transports Matrix, des médias et de l’E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau multiplateforme fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le véritable chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de publication porteuses de secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique du workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une étiquette ou un SHA de commit complet tant que le commit résolu est accessible depuis une branche OpenClaw ou une étiquette de publication
- Le contrôle préliminaire de validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit complet de 40 caractères de la branche de workflow actuelle sans exiger d’étiquette poussée
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées du package ; une véritable publication exige toujours une véritable étiquette de publication
- Les deux workflows gardent le véritable chemin de publication et de promotion sur les exécuteurs hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les exécuteurs Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le contrôle préliminaire de publication npm n’attend plus la voie séparée des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou l’étiquette bêta/correction correspondante) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d’installation du registre publié dans un préfixe temporaire neuf
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’intégration du package installé, la configuration Telegram et le véritable E2E Telegram contre le package npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter la fumée bêta complète après publication depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est volontairement uniquement manuel et ne s’exécute pas à chaque fusion.
- L’automatisation de publication des mainteneurs utilise maintenant le modèle contrôle préliminaire puis promotion :
  - la véritable publication npm doit réussir un `preflight_run_id` npm réussi
  - la véritable publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de contrôle préliminaire réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée de workflow
  - la mutation de dist-tag npm basée sur jeton vit maintenant dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour la sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le dépôt public conserve une publication OIDC seule
  - la publication publique `macOS Release` est uniquement de validation ; lorsqu’une étiquette n’existe que sur une branche de publication mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.D`
  - la véritable publication mac privée doit réussir le `preflight_run_id` mac privé et `validate_run_id`
  - les véritables chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire à nouveau
- Pour les publications de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication vérifie aussi le même chemin de mise à niveau à préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N` afin que les corrections de publication ne puissent pas laisser silencieusement d’anciennes installations globales sur la charge utile stable de base
- Le contrôle préliminaire de publication npm échoue fermé sauf si l’archive tar inclut à la fois `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/` afin de ne pas livrer à nouveau un tableau de bord de navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée des plugins publiés et les métadonnées de package sont présents dans l’agencement de registre installé. Une publication qui livre des charges utiles d’exécution de plugins manquantes échoue au vérificateur postpublication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur l’archive tar de mise à jour candidate, afin que l’e2e d’installation détecte le gonflement accidentel du paquet avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de minutage des extensions ou les matrices de tests d’extensions, régénérez et révisez les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- La préparation d’une publication stable macOS inclut aussi les surfaces du système de mise à jour :
  - la publication GitHub doit finir avec les fichiers packagés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’application packagée doit conserver un identifiant de bundle non débogage, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher de build Sparkle canonique pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de prépublication depuis un seul point d’entrée. Pour une preuve sur commit épinglé sur une branche évoluant rapidement, utilisez l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation` depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver accidentellement une exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’une étiquette de publication, exécutez-le depuis la référence de workflow `main` de confiance et passez la branche ou l’étiquette de publication comme `ref` :

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
artefact parent `release-package-under-test` pour les vérifications orientées
package, et déclenche l’E2E Telegram package autonome lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite les smokes d’installation, les vérifications de release inter-OS, la
couverture live/E2E du chemin de release Docker lorsque le soak est activé, Package Acceptance avec l’AQ du package Telegram, la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
indique que `normal_ci` et `release_checks` ont réussi. En mode full/all,
l’enfant `npm_telegram` doit aussi réussir ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et full,
les artefacts et les identifiants de relance ciblée.
Les workflows enfants sont déclenchés depuis la ref de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou une balise de release plus ancienne. Il n’existe pas d’entrée workflow-ref séparée pour Full Release Validation ; choisissez le harnais de confiance en choisissant la ref d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des refs de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la release, le plus rapide
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de release
- `full` : stable plus large couverture consultative fournisseur/média

Utilisez `run_release_soak=true` avec `stable` lorsque les lanes bloquantes pour la release sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de release Docker et
des survivants de mise à niveau all-since-2026.4.23 avant promotion. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la ref de workflow de confiance pour résoudre une seule fois la ref cible
comme `release-package-under-test` et réutilise cet artefact dans les vérifications inter-OS,
Package Acceptance et Docker du chemin de release lorsque le soak s’exécute. Cela garde
toutes les machines orientées package sur les mêmes octets et évite les builds de package répétés.
Le smoke d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable repo/org est définie, sinon `openai/gpt-5.4`, car cette lane
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de benchmarker le modèle par défaut le plus lent. La matrice live plus large des fournisseurs
reste l’endroit pour la couverture propre à chaque modèle.

Utilisez ces variantes selon l’étape de release :

```bash
# Valider une branche candidate de release non publiée.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Valider un commit poussé exact.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Après la publication d’une bêta, ajouter l’E2E Telegram du package publié.
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

N’utilisez pas le parapluie complet comme première relance après un correctif ciblé. Si une machine
échoue, utilisez le workflow enfant échoué, le job, la lane Docker, le profil de package, le fournisseur
de modèle ou la lane QA pour la preuve suivante. Relancez le parapluie complet uniquement lorsque
le correctif a modifié l’orchestration de release partagée ou a rendu obsolètes les preuves antérieures de toutes les machines.
Le vérificateur final du parapluie revérifie les identifiants d’exécution de workflow enfant enregistrés ;
ainsi, après la relance réussie d’un workflow enfant, relancez uniquement le job parent échoué
`Verify full validation`.

Pour une récupération bornée, passez `rerun_group` au parapluie. `all` est la véritable
exécution candidate de release, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin propre à la release, `release-checks` exécute chaque machine de release,
et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package release-checks. Les relances
inter-OS ciblées peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA de release-checks sont consultatifs ; un échec uniquement QA
ne bloque pas la validation de release.

### Vitest

La machine Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne
intentionnellement le scoping des changements et force le graphe de tests normal pour le candidat de release :
shards Linux Node, shards de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de build, vérifications docs, Skills Python, Windows, macOS, Android et i18n Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle réussi la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des shards échoués ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une exécution nécessite une analyse des performances

Exécutez la CI manuelle directement uniquement lorsque la release nécessite une CI normale déterministe mais
pas les machines Docker, QA Lab, live, inter-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke`
en mode release. Elle valide le candidat de release via des environnements Docker
packagés au lieu de se limiter aux tests au niveau source.

La couverture Docker de release inclut :

- smoke d’installation complet avec le smoke d’installation globale Bun lent activé
- préparation/réutilisation de l’image de smoke du Dockerfile racine par SHA cible, avec les jobs smoke QR,
  root/gateway et installer/Bun exécutés comme shards install-smoke séparés
- lanes E2E du dépôt
- morceaux Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le morceau `plugins-runtime-services` lorsque demandée
- lanes divisées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèle Docker live lorsque les vérifications de release
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux de lane, `summary.json`, `failures.json`,
les timings de phases, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
relancer tous les morceaux de release. Les commandes de relance générées incluent les entrées
`package_artifact_run_id` précédentes et les images Docker préparées lorsqu’elles sont disponibles, afin qu’une
lane échouée puisse réutiliser la même archive tar et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est le gate de release
du comportement agentique et au niveau des canaux, séparé de Vitest et de la mécanique des packages Docker.

La couverture QA Lab de release inclut :

- lane de parité mock comparant la lane candidate OpenAI à la référence Opus 4.6
  à l’aide du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- lane QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de release nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les lanes parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab
fragmentée manuelle plutôt que comme lane critique de release par défaut.

### Package

La machine Package est le gate de produit installable. Elle est appuyée par
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en archive tar `package-under-test` consommée par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
ref du harnais de workflow séparée de la ref source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw
- `source=ref` : empaqueter une branche, balise ou SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` obligatoire
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact de package release préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à jour, le nettoyage des dépendances de plugins obsolètes, les fixtures de plugins hors ligne, la mise à jour de plugins et l’AQ du package Telegram sur la même archive tar résolue. Les vérifications de release bloquantes utilisent la référence de package publié latest par défaut ; `run_release_soak=true` ou
`release_profile=full` étend à chaque référence stable publiée sur npm depuis
`2026.4.23` jusqu’à `latest`, plus les fixtures d’issues signalées. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour une archive tar npm locale adossée à un SHA avant
publication. C’est le remplacement natif GitHub
pour la majeure partie de la couverture package/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de release inter-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres aux OS, mais la validation produit package/mise à jour devrait
privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle lane locale, Docker, Package Acceptance ou release-check prouve un
changement d’installation/mise à jour de plugin, de nettoyage doctor ou de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` séparé, qui ne fait pas partie de Full Release CI.

La tolérance historique de package-acceptance est volontairement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de
`gateway install --wrapper`, fichiers de patch absents de la fixture git dérivée de l’archive tar,
absence de `update.channel` persisté, emplacements historiques des enregistrements d’installation de plugins,
absence de persistance des enregistrements d’installation de marketplace et migration des métadonnées de configuration
pendant `plugins update`. Le package publié `2026.4.26` peut avertir
pour les fichiers d’empreinte de métadonnées de build local déjà livrés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font échouer la validation de release.

Utilisez des profils Package Acceptance plus larges lorsque la question de release concerne un
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

- `smoke` : voies rapides d'installation de package/canal/agent, réseau Gateway et
  rechargement de configuration
- `package` : contrats d'installation/mise à jour/package de Plugin sans ClawHub en direct ; c'est la valeur par défaut
  du contrôle de release
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : segments de chemin de release Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des relances ciblées

Pour une preuve Telegram de package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet l'archive tar
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les contrôles après publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d'entrée de publication modifiant normal. Il
orchestre les workflows d'éditeur de confiance dans l'ordre requis par la release :

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
uniquement pour des travaux de réparation ou de republication ciblés. Pour une réparation de Plugin sélectionné, transmettez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l'opérateur :

- `tag` : tag de release requis tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le SHA de commit
  complet de 40 caractères de la branche de workflow actuelle pour une pré-vérification
  de validation uniquement
- `preflight_only` : `true` pour validation/build/package seulement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  l'archive tar préparée par l'exécution de pré-vérification réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut `beta` par défaut

`OpenClaw Release Publish` accepte ces entrées contrôlées par l'opérateur :

- `tag` : tag de release requis ; il doit déjà exister
- `preflight_run_id` : identifiant d'exécution de pré-vérification `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation limitée aux Plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l'opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les contrôles avec secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou
  un tag de release.
- `run_release_soak` : active le soak exhaustif en direct/E2E, chemin de release Docker et
  survivor de mise à niveau all-since sur les contrôles de release stables/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prérelease bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l'entrée SHA de commit complet n'est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  en validation uniquement
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la pré-vérification ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de release npm stable

Lors de la création d'une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu'un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour une répétition de validation uniquement du workflow de pré-vérification
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d'abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de commit complet
   lorsque vous voulez la CI normale plus la couverture du cache de prompts en direct, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n'avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la ref de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   et le `preflight_run_id` enregistré ; il publie les Plugins externalisés vers npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a été intentionnellement publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   d'auto-réparation planifiée déplacer `beta` plus tard

La mutation de dist-tag se trouve dans le dépôt privé pour des raisons de sécurité, car elle
requiert toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde à la fois le chemin de publication directe et le chemin de promotion bêta d'abord
documentés et visibles par l'opérateur.

Si un mainteneur doit revenir à l'authentification npm locale, exécutez toutes les commandes
CLI 1Password (`op`) uniquement dans une session tmux dédiée. N'appelez pas `op`
directement depuis le shell principal de l'agent ; le garder dans tmux rend les invites,
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

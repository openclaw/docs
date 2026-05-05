---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation de package
    - Recherche des conventions de nommage des versions et de la cadence
summary: Voies de publication, liste de contrôle opérateur, boîtes de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-05T06:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw comporte trois canaux publics de publication :

- stable : publications étiquetées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : tags de préversion qui publient vers npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible actuelle d’installation bêta
- Les publications stables et les publications de correction stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une version bêta validée
- Chaque publication stable d’OpenClaw livre ensemble le package npm et l’application macOS ;
  les publications bêta valident et publient normalement d’abord le chemin npm/package, la
  compilation/signature/notarisation de l’application Mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La version stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si un tag bêta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag bêta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder les entrées orientées utilisateur, la committer, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   volontairement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail normal de publication
   directement sur `main`.
5. Incrémenter chaque emplacement de version requis pour le tag prévu, exécuter
   `pnpm plugins:sync` afin que les packages Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter le prévol déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour le prévol de validation uniquement.
   Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA complet du commit. C’est le seul point d’entrée manuel
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou liste d’autorisation de modèles en échec qui
   prouve le correctif. Relancer l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, taguer `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   publie d’abord tous les packages Plugin publiables vers npm, publie ensuite le même
   ensemble vers ClawHub sous forme de tarballs ClawPack npm-pack, puis promeut
   l’artifact de prévol npm OpenClaw préparé avec le dist-tag correspondant. Après
   publication, exécuter l’acceptation de package post-publication
   contre le package publié `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta`. Si une préversion poussée ou publiée nécessite un correctif,
   créer le numéro de préversion correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   préversion.
10. Pour la version stable, continuer uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artifact de prévol réussi via
    `preflight_run_id` ; l’état prêt pour la publication macOS stable exige également les
    fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip`, et le fichier `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram npm publié autonome facultatif
    lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion des dist-tags si nécessaire, les notes de publication/préversion GitHub à partir de la
    section complète correspondante de `CHANGELOG.md`, et les étapes d’annonce de publication.

## Prévol de publication

- Exécutez `pnpm check:test-types` avant la vérification préliminaire de publication afin que le TypeScript des tests reste
  couvert en dehors du garde-fou local plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la vérification préliminaire de publication afin que les vérifications plus larges des
  cycles d’importation et des frontières d’architecture soient au vert en dehors du garde-fou local plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication
  `dist/*` attendus et le bundle de l’interface utilisateur de contrôle existent pour l’étape de validation
  du paquet
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le taggage. Il
  met à jour les versions des packages de plugins publiables, les métadonnées de compatibilité
  pair/API OpenClaw, les métadonnées de build et les ébauches de changelog des plugins pour correspondre à la version de publication
  du cœur. `pnpm plugins:sync:check` est le garde-fou de publication non mutant ;
  le workflow de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de la publication pour
  lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche manuellement `CI`, et déclenche
  `OpenClaw Release Checks` pour le smoke test d’installation, l’acceptation de package, les vérifications de package
  inter-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut
  gardent les live/E2E exhaustifs et le soak du chemin de publication Docker derrière
  `run_release_soak=true` ; `release_profile=full` force l’activation du soak. Avec
  `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram du package
  contre l’artefact `release-package-under-test` issu des vérifications de publication.
  Fournissez `npm_telegram_package_spec` après publication lorsque le même
  E2E Telegram doit aussi valider le package npm publié. Fournissez
  `package_acceptance_package_spec` après publication lorsque Package Acceptance
  doit exécuter sa matrice package/mise à jour contre le package npm livré au lieu
  de l’artefact construit à partir du SHA. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la
  validation correspond à un package npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal auxiliaire
  pour un candidat de package pendant que le travail de publication continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref`
  pour empaqueter une branche/un tag/un SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tarball HTTPS avec un
  SHA-256 obligatoire ; ou `source=artifact` pour une archive tarball téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat vers
  `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette
  archive tarball, et peut exécuter la QA Telegram contre la même archive avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de package
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée. `update-restart-auth` utilise le package candidat comme
  CLI installé et comme package-under-test afin d’exercer le chemin de redémarrage géré
  de la commande de mise à jour du candidat.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies package/mise à jour/redémarrage/plugin natives de l’artefact sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : fragments du chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une relance ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous n’avez besoin que d’une couverture CI normale complète
  pour le candidat de publication. Les déclenchements manuels de CI contournent la portée par changements
  et forcent les shards Linux Node, les shards de plugins groupés, les contrats de canaux,
  la compatibilité Node 22, `check`, `check-additional`, le smoke test de build,
  les vérifications de docs, les Skills Python, Windows, macOS, Android et les voies i18n de l’interface utilisateur de contrôle.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cela exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms des spans de trace exportés,
  les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication taggée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après l’existence du
  tag. Déclenchez-la depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un
  tag atteignable depuis main), transmettez le tag de publication et le `preflight_run_id`
  npm OpenClaw réussi, et conservez la portée de publication des plugins par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le package cœur ne soit pas publié avant ses plugins externalisés.
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab plus le profil Matrix
  live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants
  Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet Matrix
  du transport, des médias et de l’E2EE en parallèle.
- La validation d’exécution d’installation et de mise à niveau inter-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le véritable chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de publication portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de publication
- La vérification préliminaire en mode validation seule de `OpenClaw NPM Release` accepte aussi le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle sans nécessiter de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la
  vérification des métadonnées de package ; la vraie publication nécessite toujours un vrai tag de publication
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des runners
  hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les runners
  Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préliminaire de publication npm n’attend plus la voie de vérifications de publication séparée
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correctif correspondante) pour vérifier le chemin d’installation du registre publié
  dans un préfixe temporaire frais
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram
  contre le package npm publié en utilisant le pool partagé loué d’identifiants Telegram.
  Les exécutions ponctuelles locales de mainteneurs peuvent omettre les variables Convex et transmettre directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke test bêta complet après publication depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification après publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement manuel uniquement et
  ne s’exécute pas à chaque merge.
- L’automatisation de publication des mainteneurs utilise désormais préflight-puis-promotion :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution préliminaire réussie
  - les publications npm stables ciblent par défaut `beta`
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de dist-tag npm basée sur jeton réside désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le
    dépôt public conserve une publication OIDC uniquement
  - le workflow public `macOS Release` est uniquement destiné à la validation ; lorsqu’un tag n’existe que sur une
    branche de publication mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir les `preflight_run_id` et
    `validate_run_id` mac privés
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur après publication
  vérifie aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la
  charge utile stable de base
- La vérification préliminaire de publication npm échoue de manière fermée sauf si l’archive tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin que nous ne livrions plus de tableau de bord navigateur vide
- La vérification après publication vérifie aussi que les points d’entrée des plugins publiés et
  les métadonnées de package sont présents dans l’agencement de registre installé. Une publication qui
  livre des charges utiles d’exécution de plugins manquantes échoue au vérificateur postpublish et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` impose aussi le budget npm pack `unpackedSize` sur
  l’archive tarball de mise à jour candidate, afin que l’e2e de l’installateur détecte le gonflement accidentel du pack
  avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de timing des plugins ou
  les matrices de tests de plugins, régénérez et révisez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l’approbation afin que les notes de publication ne
  décrivent pas une disposition CI obsolète
- La préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les packages `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app packagée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et un `CFBundleVersion` égal ou supérieur au seuil de build Sparkle canonique
    pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de prépublication depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez
l’assistant afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de valider
par accident une exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’un tag de publication, exécutez-le depuis la référence de workflow `main`
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

Le workflow résout la réf cible, déclenche le `CI` manuel avec
`target_ref=<release-ref>`, déclenche les `OpenClaw Release Checks`, prépare un
artefact parent `release-package-under-test` pour les vérifications orientées
package, et déclenche le package Telegram E2E autonome quand `release_profile=full` avec
`rerun_group=all` ou quand `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` distribue ensuite la fumée d’installation, les vérifications de release
multi-OS, la couverture live/E2E Docker du chemin de release quand le soak est activé, Package Acceptance avec la QA du package Telegram, la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
affiche `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit aussi réussir ; en dehors de full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release puisse voir le chemin critique actuel sans télécharger les journaux.
Voir [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les
différences entre profils stable et full, les artefacts et les poignées de relance ciblées.
Les workflows enfants sont déclenchés depuis la réf de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même quand la `ref` cible pointe vers une
branche ou une balise de release plus ancienne. Il n’existe pas d’entrée workflow-ref
distincte pour Full Release Validation ; choisissez le harnais de confiance en choisissant la réf d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exact sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des refs de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/provider :

- `minimum` : chemin OpenAI/core live et Docker critique pour la release le plus rapide
- `stable` : minimum plus couverture provider/backend stable pour l’approbation de release
- `full` : stable plus large couverture consultative provider/médias

Utilisez `run_release_soak=true` avec `stable` quand les lanes bloquantes pour la release sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de release Docker et
borné de survie aux mises à niveau publiées avant la promotion. Ce balayage couvre
les quatre derniers packages stables plus les baselines épinglées `2026.4.23` et `2026.5.2`
plus une couverture plus ancienne `2026.4.15`, avec suppression des baselines dupliquées et
chaque baseline fragmentée dans son propre job de runner Docker. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la réf de workflow de confiance pour résoudre une fois la réf
cible sous forme de `release-package-under-test` et réutilise cet artefact dans les vérifications multi-OS,
Package Acceptance et Docker de chemin de release quand le soak s’exécute. Cela garde
toutes les machines orientées package sur les mêmes octets et évite les builds de package répétés.
La fumée d’installation OpenAI multi-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` quand la
variable repo/org est définie, sinon `openai/gpt-5.4`, parce que cette lane
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de mesurer le modèle par défaut le plus lent. La matrice live provider
plus large reste l’endroit prévu pour la couverture propre aux modèles.

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

N’utilisez pas le parapluie complet comme première relance après une correction ciblée. Si une machine
échoue, utilisez le workflow enfant, le job, la lane Docker, le profil de package, le provider
de modèle ou la lane QA en échec pour la preuve suivante. Relancez le parapluie complet seulement quand
la correction a modifié l’orchestration de release partagée ou a rendu obsolète la preuve
précédente de toutes les machines. Le vérificateur final du parapluie revérifie les identifiants
enregistrés des exécutions de workflow enfants ; ainsi, après la relance réussie d’un workflow enfant,
relancez uniquement le job parent `Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` au parapluie. `all` est la vraie
exécution de release candidate, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin propre à la release, `release-checks` exécute chaque machine
de release, et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package des release-checks. Les relances
multi-OS ciblées peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA des release-checks sont consultatifs ; un échec uniquement
QA ne bloque pas la validation de release.

### Vitest

La machine Vitest est le workflow enfant `CI` manuel. Le CI manuel contourne
intentionnellement le périmètre des changements et force le graphe de tests normal pour la release
candidate : fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, fumée de build, vérifications docs, Skills Python, Windows, macOS, Android et i18n Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle passé la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments en échec ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de temps Vitest comme `.artifacts/vitest-shard-timings.json` quand
  une exécution nécessite une analyse de performance

Exécutez le CI manuel directement uniquement quand la release nécessite un CI normal déterministe mais
pas les machines Docker, QA Lab, live, multi-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke`
en mode release. Elle valide la release candidate via des environnements Docker
packagés plutôt que seulement des tests au niveau source.

La couverture Docker de release inclut :

- fumée d’installation complète avec la fumée d’installation globale Bun lente activée
- préparation/réutilisation de l’image de fumée Dockerfile racine par SHA cible, avec les jobs de fumée QR,
  root/gateway et installer/Bun s’exécutant comme fragments install-smoke séparés
- lanes E2E du dépôt
- morceaux Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le morceau `plugins-runtime-services` quand elle est demandée
- lanes d’installation/désinstallation de plugins groupés séparées
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites provider live/E2E et couverture de modèles live Docker quand les vérifications de release
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux de lane, `summary.json`, `failures.json`,
les durées de phase, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable plutôt que
de relancer tous les morceaux de release. Les commandes de relance générées incluent le
`package_artifact_run_id` précédent et les entrées d’image Docker préparée quand elles sont disponibles, afin qu’une
lane en échec puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte de release
du comportement agentique et au niveau des canaux, séparée de Vitest et de la mécanique
des packages Docker.

La couverture QA Lab de release inclut :

- lane de parité simulée comparant la lane candidate OpenAI à la baseline Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- lane QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` quand la télémétrie de release nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les lanes de parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible sous forme
d’exécution QA-Lab fragmentée manuelle plutôt que comme lane critique par défaut pour la release.

### Package

La machine Package est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat dans le tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
réf du harnais de workflow séparée de la réf source du package.

Sources de candidat prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de release OpenClaw exacte
- `source=ref` : packager une branche, une balise ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact
de package de release préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve la migration, la mise à jour,
le redémarrage de mise à jour avec auth configurée, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin hors ligne, la mise à jour de Plugin et la QA du package Telegram contre le même tarball
résolu. Les vérifications de release bloquantes utilisent la baseline du dernier package publié par défaut ;
`run_release_soak=true` ou
`release_profile=full` s’étend à chaque baseline stable publiée sur npm depuis
`2026.4.23` jusqu’à `latest` plus les fixtures d’incidents signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le remplacement natif GitHub de la majeure partie de la
couverture package/mise à jour qui nécessitait auparavant Parallels. Les vérifications de release multi-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres aux OS, mais la validation produit package/mise à jour doit
privilégier Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Test des mises à jour et des plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle lane locale, Docker, Package Acceptance ou release-check prouve une
installation/mise à jour de Plugin, un nettoyage doctor ou un changement de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` distinct, et non une partie de Full Release CI.

La tolérance historique de l’acceptation de packages est volontairement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes du tarball, absence de
`gateway install --wrapper`, fichiers de correctif absents du fixture git dérivé du tarball, absence de
`update.channel` persisté, emplacements historiques des enregistrements d’installation de Plugin,
absence de persistance des enregistrements d’installation de marketplace, et migration des métadonnées de
configuration pendant `plugins update`. Le package publié `2026.4.26` peut émettre un avertissement
pour les fichiers d’horodatage de métadonnées de build local qui avaient déjà été livrés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font échouer la validation de
publication.

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

- `smoke` : voies rapides d’installation de package/canal/agent, réseau Gateway et rechargement de
  configuration
- `package` : contrats d’installation/mise à jour/redémarrage/package de Plugin sans
  ClawHub en direct ; c’est la valeur par défaut de la vérification de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : segments du chemin de publication Docker avec OpenWebUI
- `custom` : liste exacte de `docker_lanes` pour des relances ciblées

Pour une preuve Telegram de package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet le tarball
`package-under-test` résolu dans la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée normal de publication mutante. Il
orchestre les workflows d’éditeur de confiance dans l’ordre requis par la release :

1. Extraire le tag de release et résoudre son commit SHA.
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
uniquement pour des travaux ciblés de réparation ou de republication. Pour une réparation de Plugin sélectionné, transmettez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
package OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis, comme `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit
  complet de 40 caractères de la branche de workflow actuelle pour une prévalidation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  véritable chemin de publication
- `preflight_run_id` : requis sur le véritable chemin de publication afin que le workflow réutilise
  le tarball préparé depuis l’exécution de prévalidation réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut `beta` par défaut

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; il doit déjà exister
- `preflight_run_id` : id d’exécution de prévalidation `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le package OpenClaw
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation limité aux Plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications portant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : activer le test d’endurance exhaustif en direct/E2E, chemin de publication Docker et
  survivant de mise à niveau depuis toutes les versions sur les vérifications de release stable/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de préversion bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le véritable chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour une simulation à blanc de validation uniquement du workflow de prévalidation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de
   commit complet lorsque vous voulez une CI normale plus une couverture cache de prompts en direct, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez le
   workflow manuel `CI` sur la ref de release à la place
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   et le `preflight_run_id` enregistré ; il publie les Plugins externalisés vers npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a été intentionnellement publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez le même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée
   d’auto-réparation déplacer `beta` plus tard

La mutation du dist-tag réside dans le dépôt privé pour des raisons de sécurité, car elle nécessite encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord à la fois
documentés et visibles pour l’opérateur.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez toutes les commandes de la CLI
1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les prompts,
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

## Associé

- [Canaux de publication](/fr/install/development-channels)

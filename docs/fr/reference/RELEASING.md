---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de version ou l’acceptation des paquets
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de vérification de l’opérateur, environnements de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-06T18:00:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw comporte trois canaux de publication publics :

- stable : versions taguées qui publient vers npm `beta` par défaut, ou vers npm `latest` sur demande explicite
- beta : tags de préversion qui publient vers npm `beta`
- dev : la tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version corrective stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication bêta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible actuelle d’installation bêta
- Les publications stables et les publications correctives stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build bêta validée
- Chaque publication stable d’OpenClaw livre ensemble le package npm et l’application macOS ;
  les publications bêta valident et publient normalement d’abord le chemin npm/package, avec
  la build/signature/notarisation de l’application Mac réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La version stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir de l’état courant de `main`, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si un tag bêta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou de recréer l’ancien tag bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de retour arrière d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir de l’état courant de `main` : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI courante de `main` est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder les entrées orientées utilisateur, la committer, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis l’état courant de `main` ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Incrémenter chaque emplacement de version requis pour le tag prévu, exécuter
   `pnpm plugins:sync` afin que les packages de plugins publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter le précontrôle déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’un tag existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour un précontrôle
   de validation uniquement. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, le tag ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de tests de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, canal, job de workflow, profil de package, fournisseur ou liste d’autorisation de modèles en échec qui
   prouve le correctif. Ne relancer l’ensemble complet que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, taguer `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   distribue tous les packages de plugins publiables vers npm et le même ensemble vers
   ClawHub en parallèle, puis promeut l’artefact de précontrôle npm OpenClaw préparé
   avec le dist-tag correspondant dès que la publication npm des plugins réussit.
   La publication ClawHub peut encore être en cours pendant la publication npm d’OpenClaw, mais le
   workflow de publication ne se termine pas tant que les deux chemins de publication des plugins et
   le chemin de publication npm d’OpenClaw ne se sont pas terminés avec succès. Après la publication, exécuter
   l’acceptation du package post-publication
   contre le package `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publié. Si une prépublication poussée ou publiée nécessite un correctif,
   créer le numéro de prépublication correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   prépublication.
10. Pour la version stable, continuer uniquement après que la bêta validée ou la candidate de publication dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de précontrôle réussi via
    `preflight_run_id` ; la préparation de la publication stable macOS exige aussi le
    `.zip`, le `.dmg`, le `.dSYM.zip` empaquetés et le `appcast.xml` mis à jour sur `main`.
11. Après la publication, exécuter le vérificateur npm post-publication, le E2E Telegram npm publié autonome optionnel lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub depuis la
    section `CHANGELOG.md` complète correspondante, ainsi que les étapes d’annonce de publication.

## Précontrôle de publication

- Exécutez `pnpm check:test-types` avant la prévalidation de release afin que le TypeScript des tests reste
  couvert en dehors de la porte locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la prévalidation de release afin que les vérifications plus larges des
  cycles d’import et des limites d’architecture soient vertes en dehors de la porte locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release
  attendus dans `dist/*` et le bundle de la Control UI existent pour l’étape de
  validation du pack
- Exécutez `pnpm plugins:sync` après l’incrément de version racine et avant le tag. Il
  met à jour les versions des paquets de plugins publiables, les métadonnées de compatibilité
  pair/API OpenClaw, les métadonnées de build et les ébauches de journaux de modifications des plugins pour correspondre à la version
  de release du cœur. `pnpm plugins:sync:check` est la garde de release non mutante ;
  le workflow de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de la release pour
  lancer toutes les boîtes de test de pré-release depuis un seul point d’entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche manuellement `CI`, et déclenche
  `OpenClaw Release Checks` pour la fumée d’installation, l’acceptation de paquet, les vérifications de paquet
  multi-OS, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut
  gardent le soak exhaustif live/E2E et du chemin de release Docker derrière
  `run_release_soak=true`; `release_profile=full` force le soak. Avec
  `release_profile=full` et `rerun_group=all`, il exécute aussi l’E2E Telegram de paquet
  contre l’artefact `release-package-under-test` des vérifications de release.
  Fournissez `npm_telegram_package_spec` après publication lorsque le même
  E2E Telegram doit aussi prouver le paquet npm publié. Fournissez
  `package_acceptance_package_spec` après publication lorsque Package Acceptance
  doit exécuter sa matrice paquet/mise à jour contre le paquet npm livré plutôt
  que l’artefact construit depuis le SHA. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la
  validation correspond à un paquet npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal latéral
  pour un candidat de paquet pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref`
  pour empaqueter une branche/un tag/un SHA `package_ref` fiable avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat en
  `package-under-test`, réutilise le planificateur de release Docker E2E contre cette
  archive tar, et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact de paquet
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée. `update-restart-auth` utilise le paquet candidat comme
  CLI installée et comme package-under-test afin d’exercer le chemin de redémarrage
  géré de la commande de mise à jour candidate.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies natives d’artefact pour paquet/mise à jour/redémarrage/plugin sans OpenWebUI ni ClawHub live
  - `product` : profil de paquet plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez le workflow manuel `CI` directement lorsque vous n’avez besoin que d’une couverture CI normale complète
  pour le candidat de release. Les déclenchements CI manuels contournent le
  périmètre des changements et forcent les shards Linux Node, les shards de plugins
  intégrés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, la fumée de build,
  les vérifications docs, les Skills Python, Windows, macOS, Android et les voies d’i18n
  Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace
  exportés, les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutante après que le
  tag existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d’un
  tag atteignable depuis main), transmettez le tag de release et le
  `preflight_run_id` npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut
  `all-publishable` sauf si vous lancez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm
  OpenClaw afin que le paquet cœur ne soit pas publié avant ses plugins
  externalisés.
- Les vérifications de release s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité factice QA Lab ainsi que le profil Matrix
  live rapide et la voie QA Telegram avant l’approbation de release. Les voies live
  utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi des baux
  d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet Matrix
  transport, média et E2EE en parallèle.
- La validation d’installation et de mise à niveau d’exécution multi-OS fait partie des workflows publics
  `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de release portant des secrets doivent être déclenchées via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et les
  secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de release
- La prévalidation validation-only `OpenClaw NPM Release` accepte aussi le SHA complet
  de 40 caractères du commit de la branche de workflow actuelle sans nécessiter de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` seulement pour la
  vérification des métadonnées de paquet ; une vraie publication nécessite toujours un vrai tag de release
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des runners
  hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les runners Linux
  Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La prévalidation de release npm n’attend plus la voie séparée de vérifications de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correction correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d’installation
  du registre publié dans un préfixe temporaire frais
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et le vrai E2E Telegram
  contre le paquet npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter la fumée bêta complète post-publication depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L’aide exécute la validation Parallels npm update/fresh-target, déclenche `NPM Telegram Beta E2E`, interroge l’exécution exacte du workflow, télécharge l’artefact et imprime le rapport Telegram.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement manuel uniquement et
  ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise maintenant prévalidation-puis-promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de prévalidation réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de dist-tag npm basée sur token vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour la sécurité, parce que `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve la publication uniquement OIDC
  - le workflow public `macOS Release` est validation-only ; lorsqu’un tag existe seulement sur une
    branche de release mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir avec des
    `preflight_run_id` et `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    encore
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas laisser silencieusement d’anciennes installations globales sur la
  charge utile stable de base
- La prévalidation de release npm échoue fermée sauf si l’archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin de ne pas livrer à nouveau un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que les points d’entrée des plugins publiés et les
  métadonnées de paquet sont présents dans la disposition du registre installé. Une release qui
  livre des charges utiles d’exécution de plugins manquantes échoue au vérificateur postpublish et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur
  l’archive tar de mise à jour candidate, afin que l’E2E d’installation détecte le gonflement accidentel du pack
  avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing des extensions ou
  les matrices de tests d’extensions, régénérez et révisez les sorties de matrice
  `plugin-prerelease-extension-shard` possédées par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de release ne
  décrivent pas une disposition CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide, et une `CFBundleVersion` supérieure ou égale au plancher canonique de build Sparkle
    pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue vite, utilisez
l’aide afin que chaque workflow enfant s’exécute depuis une branche temporaire fixée au SHA cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L’aide pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident
une exécution enfant d’un `main` plus récent.

Pour la validation d’une branche ou d’un tag de release, exécutez-la depuis la référence de workflow `main`
fiable et transmettez la branche ou le tag de release comme `ref` :

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
artefact parent `release-package-under-test` pour les vérifications orientées
paquet, et déclenche l’E2E Telegram de paquet autonome quand `release_profile=full` avec
`rerun_group=all` ou quand `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` distribue ensuite les smokes d’installation, les vérifications de version inter-OS, la couverture live/E2E Docker
du chemin de version quand le soak est activé, Package Acceptance avec la QA du paquet Telegram,
la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
affiche `normal_ci` et `release_checks` comme réussis. En mode full/all,
l’enfant `npm_telegram` doit aussi réussir ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final
du vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de version
puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de la version](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs du workflow, les différences entre profils stable et full,
les artefacts et les poignées de relance ciblée.
Les workflows enfants sont déclenchés depuis la référence de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou une étiquette de version plus ancienne. Il n’y a pas d’entrée distincte de référence de workflow pour Full Release Validation ;
choisissez le harnais de confiance en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour prouver un commit exact sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas servir de références de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la version le plus rapide
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de version
- `full` : stable plus large couverture consultative fournisseur/média

Utilisez `run_release_soak=true` avec `stable` quand les voies bloquantes pour la version sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de version Docker et
borné de survivants de mise à niveau publiés avant la promotion. Ce balayage couvre
les quatre derniers paquets stables plus les références épinglées `2026.4.23` et `2026.5.2`,
ainsi que la couverture plus ancienne `2026.4.15`, avec les références dupliquées supprimées et
chaque référence répartie dans son propre job de runner Docker. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre la référence cible
une seule fois comme `release-package-under-test` et réutilise cet artefact dans les vérifications inter-OS,
Package Acceptance et Docker du chemin de version quand le soak s’exécute. Cela garde
toutes les machines orientées paquet sur les mêmes octets et évite les constructions répétées de paquet.
Le smoke d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` quand la
variable repo/org est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du paquet, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de mesurer le modèle par défaut le plus lent. La matrice live plus large de fournisseurs
reste l’endroit dédié à la couverture propre aux modèles.

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

N’utilisez pas le parapluie complet comme première relance après un correctif ciblé. Si une machine
échoue, utilisez le workflow enfant échoué, le job, la voie Docker, le profil de paquet, le fournisseur
de modèle ou la voie QA pour la preuve suivante. Relancez le parapluie complet seulement quand
le correctif a modifié l’orchestration de version partagée ou rendu obsolètes les preuves antérieures
toutes machines. Le vérificateur final du parapluie revérifie les ids d’exécution de workflow enfant
enregistrés, donc après la relance réussie d’un workflow enfant, relancez uniquement le job parent
`Verify full validation` échoué.

Pour une récupération bornée, passez `rerun_group` au parapluie. `all` est la vraie
exécution de candidat de version, `ci` n’exécute que l’enfant CI normal, `plugin-prerelease`
n’exécute que l’enfant Plugin réservé à la version, `release-checks` exécute toutes les
machines de version, et les groupes de version plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` exigent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de paquet release-checks. Les relances ciblées
inter-OS peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA de release-checks sont consultatifs ; un échec uniquement QA
ne bloque pas la validation de version.

### Vitest

La machine Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne volontairement
le périmètre des changements et force le graphe de tests normal pour le candidat de version :
éclats Linux Node, éclats de Plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de construction, vérifications docs, Skills Python,
Windows, macOS, Android et i18n de Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle réussi la suite complète de tests normale ? »
Ce n’est pas la même chose que la validation produit du chemin de version. Preuves à conserver :

- résumé `Full Release Validation` montrant l’URL d’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms d’éclats échoués ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` quand
  une exécution nécessite une analyse de performance

Exécutez directement la CI manuelle seulement quand la version exige une CI normale déterministe mais
pas les machines Docker, QA Lab, live, inter-OS ou paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow en mode version
`install-smoke`. Elle valide le candidat de version via des environnements Docker
packagés plutôt qu’uniquement des tests au niveau source.

La couverture Docker de version inclut :

- smoke d’installation complet avec le smoke lent d’installation globale Bun activé
- préparation/réutilisation de l’image smoke Dockerfile racine par SHA cible, avec les jobs QR,
  racine/gateway et smoke installateur/Bun exécutés comme éclats install-smoke séparés
- voies E2E du dépôt
- morceaux Docker du chemin de version : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le morceau `plugins-runtime-services` quand elle est demandée
- voies divisées d’installation/désinstallation de Plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites fournisseurs live/E2E et couverture de modèles live Docker quand les vérifications de version
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de version téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les chronométrages de phases, le JSON de plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
relancer tous les morceaux de version. Les commandes de relance générées incluent le
`package_artifact_run_id` précédent et les entrées d’images Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les images GHCR.

### QA Lab

La machine QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte de version
du comportement agentique et au niveau des canaux, distincte de Vitest et de la mécanique
de paquet Docker.

La couverture QA Lab de version inclut :

- voie de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6
  avec le paquet de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant des baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` quand la télémétrie de version exige une preuve locale explicite

Utilisez cette machine pour répondre à « la version se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les voies parité, Matrix et Telegram
lors de l’approbation de la version. La couverture Matrix complète reste disponible comme
exécution QA-Lab éclatée manuelle plutôt que comme voie critique de version par défaut.

### Paquet

La machine Paquet est la porte du produit installable. Elle est soutenue par
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde la
référence du harnais de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw
- `source=ref` : empaqueter une branche `package_ref`, une étiquette ou un SHA de commit complet de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact
de paquet de version préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à jour,
le redémarrage de mise à jour avec authentification configurée, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin hors ligne,
la mise à jour de Plugin et la QA du paquet Telegram contre le même tarball résolu. Les vérifications de version bloquantes utilisent la référence par défaut du dernier paquet publié ;
`run_release_soak=true` ou
`release_profile=full` étend à chaque référence stable publiée sur npm de
`2026.4.23` à `latest`, plus les fixtures d’incidents signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le remplacement natif GitHub
de la majeure partie de la couverture paquet/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de version inter-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres aux OS, mais la validation produit paquet/mise à jour doit
préférer Package Acceptance.

La liste de vérification canonique pour la validation des mises à jour et des Plugins est
[Tester les mises à jour et les Plugins](/fr/help/testing-updates-plugins). Utilisez-la quand vous
décidez quelle voie locale, Docker, Package Acceptance ou release-check prouve un
changement d’installation/mise à jour de Plugin, de nettoyage doctor ou de migration de paquet publié.
La migration exhaustive de mise à jour publiée depuis chaque paquet stable `2026.4.23+` est
un workflow manuel `Update Migration` distinct, et ne fait pas partie de Full Release CI.

La tolérance héritée pour l'acceptation des paquets est volontairement limitée dans le temps. Les paquets jusqu'à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées privées d'inventaire QA absentes de l'archive tar, absence de
`gateway install --wrapper`, fichiers de correctif absents du fixture git dérivé de l'archive tar,
absence de `update.channel` persistant, anciens emplacements d'enregistrement d'installation de plugin,
absence de persistance de l'enregistrement d'installation marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le paquet `2026.4.26` publié peut avertir
pour les fichiers d'horodatage des métadonnées de build local déjà livrés. Les paquets ultérieurs
doivent satisfaire les contrats modernes des paquets ; ces mêmes lacunes font échouer la validation
de release.

Utilisez des profils Package Acceptance plus larges lorsque la question de release porte sur un
paquet réellement installable :

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

- `smoke` : voies rapides d'installation paquet/canal/agent, réseau Gateway et rechargement
  de configuration
- `package` : contrats de paquet install/update/restart/plugin sans ClawHub
  en direct ; c'est la valeur par défaut du contrôle de release
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : segments de chemin de release Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des relances ciblées

Pour une preuve Telegram de paquet candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l'archive tar
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome accepte toujours
une spécification npm publiée pour les contrôles post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d'entrée normal de publication mutante. Il
orchestre les workflows d'éditeur de confiance dans l'ordre requis par la release :

1. Extraire le tag de release et résoudre son SHA de commit.
2. Vérifier que le tag est accessible depuis `main` ou `release/*`.
3. Exécuter `pnpm plugins:sync:check`.
4. Déclencher `Plugin NPM Release` avec `publish_scope=all-publishable` et
   `ref=<release-sha>`.
5. Déclencher `Plugin ClawHub Release` avec la même portée et le même SHA.
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
uniquement pour des travaux ciblés de réparation ou de republication. Pour une réparation de plugin sélectionné, passez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
paquet OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l'opérateur :

- `tag` : tag de release requis, tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s'agir du SHA de commit
  complet de 40 caractères de la branche de workflow actuelle pour une prévalidation uniquement
- `preflight_only` : `true` pour validation/build/paquet uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  l'archive tar préparée par l'exécution de prévalidation réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut `beta` par défaut

`OpenClaw Release Publish` accepte ces entrées contrôlées par l'opérateur :

- `tag` : tag de release requis ; il doit déjà exister
- `preflight_run_id` : identifiant d'exécution de prévalidation `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag npm cible pour le paquet OpenClaw
- `plugin_publish_scope` : vaut `all-publishable` par défaut ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : vaut `true` par défaut ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation limitée aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l'opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les contrôles portant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : active le test prolongé exhaustif live/E2E, le chemin de release Docker et
  le test prolongé de survivant de mise à niveau depuis toutes les versions sur les contrôles de release stable/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prérelease bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l'entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  réservés à la validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie que les métadonnées avant publication restent cohérentes

## Séquence de release npm stable

Lors de la préparation d'une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu'un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle
     pour un essai à blanc réservé à la validation du workflow de prévalidation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d'abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA de commit complet
   lorsque vous voulez la CI normale plus la couverture cache de prompt en direct, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n'avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés vers npm
   et ClawHub avant de promouvoir le paquet npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a été intentionnellement publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée
   d'autoréparation déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle exige encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC uniquement.

Cela maintient le chemin de publication directe et le chemin de promotion bêta d'abord à la fois
documentés et visibles par l'opérateur.

Si un mainteneur doit revenir à une authentification npm locale, exécutez toute commande CLI 1Password
(`op`) uniquement dans une session tmux dédiée. N'appelez pas `op`
directement depuis le shell principal de l'agent ; le garder dans tmux rend les invites,
alertes et traitements OTP observables et évite les alertes hôte répétées.

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

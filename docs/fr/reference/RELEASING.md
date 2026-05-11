---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de publication ou l’acceptation des paquets
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de contrôle de l’opérateur, cases de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-11T20:54:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw a trois voies de publication publiques :

- stable : versions étiquetées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : balises de préversion qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de préversion beta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas compléter le mois ou le jour par des zéros
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible d’installation beta actuelle
- Les publications stables et les publications de correction stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une version beta validée
- Chaque publication stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les publications beta valident et publient normalement d’abord le chemin npm/paquet, la
  compilation/signature/notarisation de l’application Mac étant réservée aux versions stables sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par beta
- La version stable ne suit qu’après validation de la dernière beta
- Les mainteneurs créent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir de `main` actuel, afin que la validation de publication et les correctifs ne bloquent pas le nouveau
  développement sur `main`
- Si une balise beta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise beta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir de `main` actuel : récupérer les dernières modifications, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées destinées aux utilisateurs, la committer, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis `main` actuel ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Incrémenter chaque emplacement de version requis pour la balise prévue, puis exécuter
   `pnpm release:prep`. Cette commande actualise les versions de Plugin, l’inventaire des Plugin, le schéma de
   configuration, les métadonnées de configuration des canaux groupés, la base de référence de la documentation de
   configuration, les exports du SDK Plugin et la base de référence de l’API du SDK Plugin dans le bon ordre. Committer toute dérive générée
   avant l’étiquetage. Exécuter ensuite la prévalidation déterministe locale :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise n’existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour une prévalidation
   uniquement destinée à la validation. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est l’unique point d’entrée manuel
   pour les quatre grands environnements de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, voie, job de workflow, profil de paquet, fournisseur ou liste d’autorisation de modèles en échec qui
   prouve le correctif. Ne relancer l’ensemble complet que lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour beta, étiqueter `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Ce workflow vérifie `pnpm plugins:sync:check`,
   déclenche la publication de tous les paquets Plugin publiables vers npm et du même ensemble vers
   ClawHub en parallèle, puis promeut l’artefact de prévalidation npm OpenClaw préparé
   avec le dist-tag correspondant dès que la publication npm des Plugin réussit.
   Une fois que l’enfant de publication npm OpenClaw réussit, il crée ou met à jour la
   page GitHub release/prerelease correspondante à partir de la section complète correspondante de
   `CHANGELOG.md`. Les publications stables publiées vers npm `latest` deviennent la
   dernière publication GitHub ; les publications de maintenance stables conservées sur npm `beta` sont
   créées avec GitHub `latest=false`.
   La publication ClawHub peut encore être en cours pendant qu’OpenClaw publie vers npm, mais le
   workflow de publication imprime immédiatement les identifiants d’exécution enfants. Par défaut, il
   n’attend pas ClawHub après son déclenchement, de sorte que la disponibilité npm d’OpenClaw
   n’est pas bloquée par des approbations ClawHub ou des travaux de registre plus lents ; définir
   `wait_for_clawhub=true` lorsque ClawHub doit bloquer l’achèvement du workflow. Le
   chemin ClawHub réessaie les échecs transitoires d’installation des dépendances de la CLI, publie
   les Plugin qui réussissent la prévisualisation même lorsqu’une cellule de prévisualisation est instable, et se termine par
   une vérification du registre pour chaque version de Plugin attendue afin que les publications partielles
   restent visibles et réessayables. Après publication, exécuter
   l’acceptation de paquet post-publication
   contre le paquet `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publié. Si une préversion poussée ou publiée nécessite un correctif,
   créer le numéro de préversion correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   préversion.
10. Pour stable, ne continuer qu’après que la beta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévalidation réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable exige aussi le
    `.zip`, le `.dmg`, le `.dSYM.zip` empaquetés, ainsi que le fichier `appcast.xml` mis à jour sur `main`.
    Le workflow privé de publication macOS publie automatiquement l’appcast signé vers le `main`
    public après vérification des assets de publication ; si la protection de branche bloque
    le push direct, il ouvre ou met à jour une PR appcast.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram npm publié
    autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag lorsque nécessaire, vérifier la page GitHub release générée,
    et exécuter les étapes d’annonce de publication.

## Prévalidation de publication

- Exécutez `pnpm check:test-types` avant la vérification préalable de release afin que le TypeScript des tests reste
  couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la vérification préalable de release afin que les contrôles plus larges des
  cycles d'import et des limites d'architecture soient au vert en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release attendus
  `dist/*` et le bundle Control UI existent pour l'étape de validation du paquet
- Exécutez `pnpm release:prep` après l'incrément de version racine et avant le tag. Il
  exécute tous les générateurs de release déterministes qui dérivent couramment après un
  changement de version/configuration/API : versions des plugins, inventaire des plugins, schéma de configuration de base,
  métadonnées de configuration des canaux groupés, référence de documentation de configuration, exports du SDK de plugin
  et référence d'API du SDK de plugin. `pnpm release:check` réexécute ces
  gardes en mode contrôle et signale en une seule passe chaque échec de dérive générée qu'il trouve
  avant d'exécuter les contrôles de release du paquet.
- Exécutez le workflow manuel `Full Release Validation` avant l'approbation de release pour
  lancer toutes les boîtes de test de pré-release depuis un seul point d'entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche manuellement `CI` et déclenche
  `OpenClaw Release Checks` pour les lanes install smoke, package acceptance, contrôles de paquet cross-OS,
  parité QA Lab, Matrix et Telegram. Les exécutions stables/par défaut
  gardent le soak live/E2E exhaustif et le chemin de release Docker derrière
  `run_release_soak=true` ; `release_profile=full` force l'activation du soak. Avec
  `release_profile=full` et `rerun_group=all`, il exécute aussi l'E2E Telegram du paquet
  contre l'artefact `release-package-under-test` issu des contrôles de release.
  Fournissez `release_package_spec` après la publication d'une bêta pour réutiliser le paquet npm publié
  dans les contrôles de release, Package Acceptance et l'E2E Telegram du paquet
  sans reconstruire l'archive tar de release. Fournissez
  `npm_telegram_package_spec` uniquement lorsque Telegram doit utiliser un autre paquet
  publié que le reste de la validation de release. Fournissez
  `package_acceptance_package_spec` lorsque Package Acceptance doit utiliser un
  autre paquet publié que la spécification du paquet de release. Fournissez
  `evidence_package_spec` lorsque le rapport de preuve privé doit prouver que la
  validation correspond à un paquet npm publié sans forcer l'E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal secondaire
  pour un candidat de paquet pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref`
  pour empaqueter une branche/un tag/un SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat en
  `package-under-test`, réutilise le planificateur de release Docker E2E contre cette
  archive tar et peut exécuter la QA Telegram contre la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les
  lanes Docker sélectionnées incluent `published-upgrade-survivor`, l'artefact de paquet
  est le candidat et `published_upgrade_survivor_baseline` sélectionne la référence publiée.
  `update-restart-auth` utilise le paquet candidat à la fois comme CLI installé et comme package-under-test,
  afin d'exercer le chemin de redémarrage géré de la commande de mise à jour du candidat.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : lanes installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : lanes package/update/restart/plugin natives de l'artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : fragments du chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin de la couverture CI normale complète
  pour le candidat de release. Les déclenchements CI manuels contournent le périmètre des changements
  et forcent les fragments Linux Node, les fragments de plugins groupés, les contrats de canaux,
  la compatibilité Node 22, `check`, `check-additional`, le smoke de build,
  les contrôles de documentation, les Skills Python, Windows, macOS, Android et les lanes d'i18n
  Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés,
  les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutatrice après que le
  tag existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d'un
  tag atteignable depuis main), transmettez le tag de release et le
  `preflight_run_id` npm OpenClaw réussi, et conservez le périmètre de publication des plugins par défaut
  `all-publishable` sauf si vous exécutez délibérément une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm OpenClaw
  afin que le paquet central ne soit pas publié avant ses plugins externalisés.
- Les contrôles de release s'exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la lane de parité mock QA Lab ainsi que le profil Matrix live rapide
  et la lane QA Telegram avant l'approbation de release. Les lanes live
  utilisent l'environnement `qa-live-shared` ; Telegram utilise aussi les baux d'identifiants Convex CI.
  Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l'inventaire complet Matrix
  transport, média et E2EE en parallèle.
- La validation runtime d'installation et de mise à niveau cross-OS fait partie de
  `OpenClaw Release Checks` et `Full Release Validation` publics, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur
  propre lane afin de ne pas ralentir ni bloquer la publication
- Les contrôles de release portant des secrets doivent être déclenchés via `Full Release
Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et
  les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de release
- La vérification préalable uniquement de validation `OpenClaw NPM Release` accepte aussi le
  SHA de commit complet à 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour le
  contrôle des métadonnées du paquet ; la vraie publication exige toujours un vrai tag de release
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des
  runners hébergés par GitHub, tandis que le chemin de validation non mutateur peut utiliser les plus grands
  runners Linux Blacksmith
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préalable de release npm n'attend plus la lane séparée des contrôles de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correction correspondant) avant l'approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d'installation du registre publié
  dans un préfixe temporaire neuf
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l'onboarding du paquet installé, la configuration Telegram et le vrai E2E Telegram
  contre le paquet npm publié en utilisant le pool partagé d'identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois
  identifiants d'environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke bêta post-publication complet depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L'assistant exécute la validation Parallels de mise à jour npm/cible fraîche, déclenche `NPM Telegram Beta E2E`, interroge l'exécution exacte du workflow, télécharge l'artefact et affiche le rapport Telegram.
- Les mainteneurs peuvent exécuter le même contrôle post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement uniquement manuel et
  ne s'exécute pas à chaque fusion.
- L'automatisation de release des mainteneurs utilise maintenant la séquence preflight puis promotion :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l'exécution preflight réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l'entrée de workflow
  - la mutation des dist-tags npm basée sur un jeton vit maintenant dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve une publication uniquement OIDC
  - `macOS Release` public est uniquement destiné à la validation ; lorsqu'un tag vit seulement sur une
    branche de release mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir les `preflight_run_id` et
    `validate_run_id` mac privés
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    à nouveau
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication
  contrôle aussi le même chemin de mise à niveau avec préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas laisser silencieusement les anciennes installations globales sur la
  charge utile stable de base
- La vérification préalable de release npm échoue fermement sauf si l'archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide
  afin d'éviter d'expédier à nouveau un tableau de bord navigateur vide
- La vérification post-publication contrôle aussi que les points d'entrée des plugins publiés et
  les métadonnées de paquet sont présents dans l'agencement installé depuis le registre. Une release qui
  expédie des charges utiles runtime de plugins manquantes échoue au vérificateur postpublish et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm sur
  l'archive tar de mise à jour candidate, afin que l'e2e de l'installateur détecte l'embonpoint accidentel du pack
  avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing des extensions ou
  les matrices de tests d'extension, régénérez et examinez les sorties de matrice
  `plugin-prerelease-extension-shard` appartenant au planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant l'approbation afin que les notes de release ne
  décrivent pas un agencement CI obsolète
- La préparation de la release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les fichiers `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication ; le
    workflow privé de publication macOS le commite automatiquement, ou ouvre une PR appcast
    lorsque le push direct est bloqué
  - l'application empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et une `CFBundleVersion` supérieure ou égale au plancher canonique de build Sparkle
    pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de préversion depuis
un seul point d’entrée. Pour une preuve de commit épinglé sur une branche qui évolue rapidement, utilisez le
script d’assistance afin que chaque workflow enfant s’exécute depuis une branche temporaire figée sur le SHA cible:

```bash
pnpm ci:full-release --sha <full-sha>
```

L’assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque workflow enfant
`headSha` correspond à la cible, puis supprime la branche temporaire. Cela évite de valider
accidentellement une exécution enfant plus récente de `main`.

Pour la validation d’une branche ou d’une balise de release, exécutez-la depuis la référence de workflow
`main` de confiance et passez la branche ou la balise de release comme `ref` :

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
artefact parent `release-package-under-test` pour les vérifications orientées paquet, et
déclenche l’E2E Telegram de paquet autonome lorsque `release_profile=full` avec
`rerun_group=all` ou lorsque `release_package_spec` ou
`npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` lance ensuite en parallèle le smoke test d’installation, les vérifications de release inter-OS, la couverture live/E2E Docker
du chemin de release lorsque le soak est activé, Package Acceptance avec l’assurance qualité du paquet Telegram,
la parité QA Lab, la Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le
résumé de `Full Release Validation`
indique que `normal_ci` et `release_checks` ont réussi. En mode full/all,
l’enfant `npm_telegram` doit également réussir ; hors full/all, il est ignoré
sauf si un `release_package_spec` ou `npm_telegram_package_spec` publié a été
fourni. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release
puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs de workflow, les différences entre profils stable et full,
les artefacts et les points d’entrée de relance ciblée.
Les workflows enfants sont déclenchés depuis la référence de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la `ref` cible pointe vers une
branche ou une balise de release plus ancienne. Il n’existe pas d’entrée séparée de référence de workflow
Full Release Validation ; choisissez le harnais de confiance en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve de commit exacte sur un `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des références de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la release le plus rapide
- `stable` : minimum plus couverture stable des fournisseurs/backends pour l’approbation de release
- `full` : stable plus large couverture consultative des fournisseurs/médias

Utilisez `run_release_soak=true` avec `stable` lorsque les voies bloquantes pour la release sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de release Docker et
borné des survivants de mise à niveau publiés avant la promotion. Ce balayage couvre
les quatre derniers paquets stables plus les baselines épinglées `2026.4.23` et `2026.5.2`
plus une couverture plus ancienne `2026.4.15`, avec suppression des baselines en double et
chaque baseline fragmentée dans son propre job Docker runner. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre la référence cible
une seule fois comme `release-package-under-test` et réutilise cet artefact dans les vérifications inter-OS,
Package Acceptance et Docker de chemin de release lorsque le soak s’exécute. Cela garde
toutes les machines orientées paquet sur les mêmes octets et évite les builds de paquet répétés.
Après qu’une bêta est déjà sur npm, définissez `release_package_spec=openclaw@YYYY.M.D-beta.N`
afin que les vérifications de release téléchargent une seule fois le paquet livré, extraient le SHA de source de build
depuis `dist/build-info.json`, et réutilisent cet artefact pour les voies inter-OS,
Package Acceptance, Docker de chemin de release et Telegram de paquet.
Le smoke test d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable du dépôt/de l’organisation est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du paquet, l’onboarding, le démarrage du Gateway et un tour d’agent live,
plutôt que de mesurer le modèle par défaut le plus lent. La matrice plus large des fournisseurs live
reste l’endroit pour la couverture spécifique aux modèles.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ombrelle complète comme première relance après un correctif ciblé. Si une machine
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de paquet, le
fournisseur de modèle ou la voie QA en échec pour la preuve suivante. Relancez l’ombrelle complète uniquement lorsque
le correctif a modifié l’orchestration de release partagée ou rendu obsolètes les preuves précédentes sur toutes les machines.
Le vérificateur final de l’ombrelle revérifie les identifiants d’exécution des workflows enfants enregistrés ;
ainsi, après qu’un workflow enfant a été relancé avec succès, relancez uniquement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la vraie
exécution de candidat de release, `ci` exécute uniquement l’enfant CI normal, `plugin-prerelease`
exécute uniquement l’enfant plugin réservé à la release, `release-checks` exécute toutes les machines de release,
et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les relances ciblées `npm-telegram` nécessitent `release_package_spec` ou
`npm_telegram_package_spec` ; les exécutions full/all avec `release_profile=full` utilisent
l’artefact de paquet de release-checks. Les relances ciblées
inter-OS peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA de release-check sont consultatifs ; un échec limité à QA
ne bloque pas la validation de release.

### Vitest

La machine Vitest est le workflow enfant `CI` manuel. Le CI manuel contourne intentionnellement
le scoping par changements et force le graphe de tests normal pour le candidat de release :
fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke test de build, vérifications de docs, Skills Python,
Windows, macOS, Android et i18n de l’interface Control UI.

Utilisez cette machine pour répondre à « l’arborescence source a-t-elle réussi toute la suite de tests normale ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` indiquant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments échoués ou lents depuis les jobs CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez le CI manuel directement uniquement lorsque la release a besoin d’un CI normal déterministe, mais
pas des machines Docker, QA Lab, live, inter-OS ou paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker se trouve dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow
`install-smoke` en mode release. Elle valide le candidat de release via des
environnements Docker empaquetés au lieu de seuls tests au niveau source.

La couverture Docker de release inclut :

- smoke test d’installation complet avec le smoke test d’installation globale Bun lent activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec les jobs QR,
  racine/Gateway et smoke installer/Bun exécutés comme fragments install-smoke séparés
- voies E2E du dépôt
- fragments Docker de chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` lorsque demandée
- voies séparées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites de fournisseurs live/E2E et couverture de modèles Docker live lorsque les vérifications de release
  incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur de chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les chronométrages de phases, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de
relancer tous les fragments de release. Les commandes de relance générées incluent le
`package_artifact_run_id` précédent et les entrées d’images Docker préparées lorsqu’elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait également partie de `OpenClaw Release Checks`. C’est le point de contrôle de release
du comportement agentique et au niveau canal, distinct de Vitest et des mécaniques de paquet
Docker.

La couverture QA Lab de release inclut :

- voie de parité mock comparant la voie candidate OpenAI à la baseline Opus 4.6
  avec le pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de release nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les voies de parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible comme
exécution QA-Lab fragmentée manuelle plutôt que comme voie critique de release par défaut.

### Paquet

La machine Package est le point de contrôle du produit installable. Elle est adossée à
`Package Acceptance` et au résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par l’E2E Docker, valide
l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde la
référence de harnais de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw
- `source=ref` : empaqueter une branche, balise ou SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’
artefact de paquet de release préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance garde la migration, la mise à jour,
le redémarrage de mise à jour avec authentification configurée, l’installation de Skills ClawHub live, le nettoyage des dépendances de plugins obsolètes, les fixtures de plugin hors ligne,
la mise à jour de plugin et la QA de paquet Telegram contre le même
tarball résolu. Les vérifications de release bloquantes utilisent la dernière baseline de paquet publié par défaut ;
`run_release_soak=true` ou
`release_profile=full` s’étend à chaque baseline stable publiée sur npm de
`2026.4.23` à `latest` plus les fixtures de problèmes signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le
remplacement natif GitHub de la majeure partie de la couverture paquet/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de release inter-OS restent importantes pour l’onboarding,
l’installateur et le comportement spécifiques aux OS, mais la validation produit paquet/mise à jour doit
préférer Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
décider quelle voie locale, Docker, Package Acceptance ou release-check prouve une
installation/mise à jour de plugin, un nettoyage doctor ou un changement de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` distinct, qui ne fait pas partie de Full Release CI.

La tolérance héritée de package-acceptance est volontairement limitée dans le temps. Les packages jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de la tarball, absence de
`gateway install --wrapper`, fichiers de correctif manquants dans le fixture git dérivé de la tarball,
absence de `update.channel` persistant, anciens emplacements d’enregistrement d’installation de plugin,
absence de persistance de l’enregistrement d’installation marketplace, et migration des métadonnées de
configuration pendant `plugins update`. Le package publié `2026.4.26` peut émettre un avertissement
pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les packages ultérieurs
doivent satisfaire les contrats de package modernes ; ces mêmes lacunes font échouer la validation de
release.

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

- `smoke` : voies rapides d’installation de package/canal/agent, réseau Gateway et
  rechargement de configuration
- `package` : contrats d’installation/mise à jour/redémarrage/package de plugin plus preuve
  d’installation de skill ClawHub en direct ; c’est la valeur par défaut de release-check
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : morceaux du chemin de release Docker avec OpenWebUI
- `custom` : liste exacte de `docker_lanes` pour des relances ciblées

Pour la preuve Telegram d’un package candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet la tarball
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome accepte toujours
une spécification npm publiée pour les vérifications post-publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée de publication mutante normal. Il
orchestre les workflows trusted-publisher dans l’ordre requis par la release :

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

Utilisez les workflows de niveau inférieur `Plugin NPM Release` et `Plugin ClawHub Release`
uniquement pour des travaux de réparation ou de republication ciblés. Pour une réparation de plugin
sélectionné, transmettez `plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le package
OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis, par exemple `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le SHA
  de commit complet de 40 caractères de la branche de workflow actuelle pour un preflight
  uniquement de validation
- `preflight_only` : `true` pour validation/build/package seulement, `false` pour le
  véritable chemin de publication
- `preflight_run_id` : requis sur le véritable chemin de publication afin que le workflow réutilise
  la tarball préparée depuis l’exécution preflight réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; doit déjà exister
- `preflight_run_id` : identifiant d’exécution preflight `OpenClaw NPM Release` réussi ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag cible npm pour le package OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de packages `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lorsque vous utilisez le
  workflow comme orchestrateur de réparation réservé aux plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA de commit complet à valider. Les vérifications nécessitant des secrets
  exigent que le commit résolu soit joignable depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : active le soak exhaustif live/E2E, du chemin de release Docker et
  all-since upgrade-survivor sur les vérifications de release stable/par défaut. Il est forcé
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prérelease bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement de validation
- Le véritable chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie ces métadonnées avant que la publication continue

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow
     actuelle pour un essai à blanc uniquement de validation du workflow preflight
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA
   de commit complet lorsque vous voulez une CI normale plus la couverture live prompt cache, Docker, QA Lab,
   Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la ref de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`
   et le `preflight_run_id` enregistré ; il publie les plugins externalisés sur npm
   et ClawHub avant de promouvoir le package npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a été publiée intentionnellement directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation auto-réparatrice
   planifiée déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle requiert encore
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord tous deux
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur l’authentification npm locale, exécutez toute commande CLI
1Password (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
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

Les mainteneurs utilisent la documentation privée de release dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de release](/fr/install/development-channels)

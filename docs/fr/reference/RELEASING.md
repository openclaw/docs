---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécuter la validation de version ou l’acceptation de paquet
    - Recherche de la nomenclature et de la cadence des versions
summary: Canaux de publication, liste de contrôle de l’opérateur, environnements de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-07T13:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw propose trois voies de publication publiques :

- stable : versions balisées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsque cela est explicitement demandé
- beta : balises de préversion qui publient vers npm `beta`
- dev : la tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas compléter le mois ou le jour avec un zéro
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les publications stables et correctives stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build bêta validée
- Chaque publication stable d’OpenClaw livre ensemble le paquet npm et l’application macOS ;
  les publications bêta valident et publient normalement d’abord le chemin npm/paquet, la
  build/signature/notarisation de l’application mac étant réservée aux versions stables sauf demande explicite

## Cadence des publications

- Les publications passent d’abord par la bêta
- La stable suit uniquement après validation de la dernière bêta
- Les mainteneurs créent normalement les publications à partir d’une branche `release/YYYY.M.D` créée
  depuis le `main` actuel, afin que la validation et les correctifs de publication ne bloquent pas le nouveau
  développement sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou de recréer l’ancienne balise bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de vérification de l’opérateur de publication

Cette liste de vérification est la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI du `main` actuel est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, conserver des entrées orientées utilisateur, la committer, la pousser, puis effectuer un rebase/pull
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Mettre à jour chaque emplacement de version requis pour la balise prévue, exécuter
   `pnpm plugins:sync` afin que les paquets Plugin publiables partagent la version de publication
   et les métadonnées de compatibilité, puis exécuter la prévalidation déterministe locale :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` et
   `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de 40 caractères de la branche de publication est autorisé pour une prévalidation
   réservée à la validation. Conserver le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, voie, tâche de flux de travail, profil de paquet, fournisseur ou liste d’autorisation de modèles ayant échoué qui
   prouve le correctif. Relancer l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour une bêta, baliser `vYYYY.M.D-beta.N`, puis exécuter `OpenClaw Release Publish` depuis
   la branche `release/YYYY.M.D` correspondante. Il vérifie `pnpm plugins:sync:check`,
   déclenche la publication de tous les paquets Plugin publiables vers npm et du même ensemble vers
   ClawHub en parallèle, puis promeut l’artefact de prévalidation npm OpenClaw préparé
   avec le dist-tag correspondant dès que la publication npm des Plugin réussit.
   La publication ClawHub peut encore être en cours pendant la publication npm d’OpenClaw, mais le
   flux de travail de publication ne se termine pas avant que les deux chemins de publication des Plugin et
   le chemin de publication npm d’OpenClaw aient abouti. Après publication, exécuter
   l’acceptation de paquet après publication
   contre le paquet `openclaw@YYYY.M.D-beta.N` ou
   `openclaw@beta` publié. Si une préversion poussée ou publiée nécessite un correctif,
   créer le numéro de préversion correspondant suivant ; ne pas supprimer ni réécrire l’ancienne
   préversion.
10. Pour une stable, continuer uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable passe également par
    `OpenClaw Release Publish`, en réutilisant l’artefact de prévalidation réussi via
    `preflight_run_id` ; la préparation de la publication macOS stable exige également les
    fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip` et le fichier `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm après publication, le E2E Telegram autonome
    npm publié facultatif lorsque vous avez besoin d’une preuve de canal après publication,
    la promotion du dist-tag si nécessaire, les notes de publication/préversion GitHub à partir de la
    section `CHANGELOG.md` correspondante complète, et les étapes d’annonce de publication.

## Prévalidation de publication

- Exécutez `pnpm check:test-types` avant le preflight de release afin que le TypeScript des tests reste
  couvert en dehors du gate local plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le preflight de release afin que les contrôles plus larges des cycles
  d'importation et des limites d'architecture soient verts en dehors du gate local plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de release
  `dist/*` attendus et le bundle Control UI existent pour l'étape de validation
  du pack
- Exécutez `pnpm plugins:sync` après l'incrément de version racine et avant le tag. Il
  met à jour les versions des paquets de plugins publiables, les métadonnées de compatibilité
  pair/API OpenClaw, les métadonnées de build et les stubs de changelog des plugins pour correspondre à la version
  de release du cœur. `pnpm plugins:sync:check` est le garde de release non mutateur ;
  le workflow de publication échoue avant toute mutation du registre si cette étape a été
  oubliée.
- Exécutez le workflow manuel `Full Release Validation` avant l'approbation de release pour
  lancer toutes les boîtes de test de pré-release depuis un seul point d'entrée. Il accepte une branche,
  un tag ou un SHA de commit complet, déclenche le `CI` manuel et déclenche
  `OpenClaw Release Checks` pour le smoke d'installation, l'acceptation de paquet, les contrôles
  de paquet multiplateformes, la parité QA Lab, Matrix et les voies Telegram. Les exécutions stables/par défaut
  gardent le soak exhaustif live/E2E et du chemin de release Docker derrière
  `run_release_soak=true`; `release_profile=full` force l'activation du soak. Avec
  `release_profile=full` et `rerun_group=all`, il exécute aussi l'E2E Telegram de paquet
  avec l'artefact `release-package-under-test` des contrôles de release.
  Fournissez `npm_telegram_package_spec` après publication quand le même
  E2E Telegram doit aussi prouver le paquet npm publié. Fournissez
  `package_acceptance_package_spec` après publication quand Package Acceptance
  doit exécuter sa matrice paquet/mise à jour avec le paquet npm livré plutôt
  qu'avec l'artefact construit depuis le SHA. Fournissez
  `evidence_package_spec` quand le rapport de preuve privé doit prouver que la
  validation correspond à un paquet npm publié sans forcer l'E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` quand vous voulez une preuve par canal latéral
  pour un paquet candidat pendant que le travail de release continue. Utilisez `source=npm` pour
  `openclaw@beta`, `openclaw@latest` ou une version de release exacte ; `source=ref`
  pour packager une branche/un tag/un SHA `package_ref` de confiance avec le harnais
  `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un
  SHA-256 requis ; ou `source=artifact` pour une archive tar téléversée par une autre exécution
  GitHub Actions. Le workflow résout le candidat vers
  `package-under-test`, réutilise le planificateur de release Docker E2E avec cette
  archive tar et peut exécuter la QA Telegram avec la même archive tar avec
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quand les
  voies Docker sélectionnées incluent `published-upgrade-survivor`, l'artefact de paquet
  est le candidat et `published_upgrade_survivor_baseline` sélectionne
  la référence publiée. `update-restart-auth` utilise le paquet candidat comme
  CLI installée et comme package-under-test afin d'exercer le chemin de
  redémarrage géré de la commande de mise à jour candidate.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d'installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies de paquet/mise à jour/redémarrage/plugin natives de l'artefact, sans OpenWebUI ni ClawHub live
  - `product` : profil package plus canaux MCP, nettoyage cron/sous-agent,
    recherche web OpenAI et OpenWebUI
  - `full` : fragments de chemin de release Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` quand vous avez seulement besoin d'une couverture CI normale complète
  pour le candidat de release. Les déclenchements CI manuels contournent le
  découpage par changements et forcent les shards Linux Node, les shards de plugins
  groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke de build,
  les contrôles docs, les Skills Python, Windows, macOS, Android et les voies i18n
  de Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Il exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms des spans de trace
  exportés, les attributs bornés et la rédaction du contenu/des identifiants sans
  nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Exécutez `OpenClaw Release Publish` pour la séquence de publication mutatrice après que le
  tag existe. Déclenchez-le depuis `release/YYYY.M.D` (ou `main` lors de la publication d'un
  tag atteignable depuis main), passez le tag de release et le `preflight_run_id`
  npm OpenClaw réussi, et conservez la portée de publication de plugins par défaut
  `all-publishable`, sauf si vous exécutez volontairement une réparation ciblée. Le
  workflow sérialise la publication npm des plugins, la publication ClawHub des plugins et la publication npm
  OpenClaw afin que le paquet cœur ne soit pas publié avant ses plugins
  externalisés.
- Les contrôles de release s'exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la voie de parité mock QA Lab ainsi que le profil
  live Matrix rapide et la voie QA Telegram avant l'approbation de release. Les voies live
  utilisent l'environnement `qa-live-shared` ; Telegram utilise aussi des baux d'identifiants
  Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec
  `matrix_profile=all` et `matrix_shards=true` quand vous voulez l'inventaire complet
  du transport Matrix, des médias et de l'E2EE en parallèle.
- La validation d'exécution d'installation et de mise à niveau multiplateforme fait partie des
  `OpenClaw Release Checks` publics et de `Full Release Validation`, qui appellent directement le
  workflow réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur
  propre voie afin de ne pas ralentir ni bloquer la publication
- Les contrôles de release portant des secrets doivent être déclenchés via `Full Release
Validation` ou depuis la ref de workflow `main`/release afin que la logique de workflow et les
  secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant
  que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de release
- Le preflight de validation seule `OpenClaw NPM Release` accepte aussi le SHA de commit
  complet de 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour le
  contrôle des métadonnées de paquet ; la vraie publication exige toujours un vrai tag de release
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners
  hébergés par GitHub, tandis que le chemin de validation non mutateur peut utiliser les runners Linux
  Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le preflight de release npm n'attend plus la voie séparée des contrôles de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correction correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d'installation du registre publié
  dans un préfixe temporaire neuf
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l'onboarding du paquet installé, la configuration Telegram et l'E2E Telegram réel
  avec le paquet npm publié en utilisant le pool partagé d'identifiants Telegram sous bail.
  Les exécutions ponctuelles locales de mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants d'environnement `OPENCLAW_QA_TELEGRAM_*`.
- Pour exécuter le smoke bêta post-publication complet depuis une machine de mainteneur, utilisez `pnpm release:beta-smoke -- --beta betaN`. L'assistant exécute la validation Parallels npm update/fresh-target, déclenche `NPM Telegram Beta E2E`, interroge l'exécution exacte du workflow, télécharge l'artefact et imprime le rapport Telegram.
- Les mainteneurs peuvent exécuter le même contrôle post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est volontairement manuel uniquement et
  ne s'exécute pas à chaque merge.
- L'automatisation de release des mainteneurs utilise désormais preflight-puis-promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l'exécution de preflight réussie
  - les releases npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l'entrée de workflow
  - la mutation de dist-tag npm basée sur un jeton vit désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour la sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le
    dépôt public conserve une publication uniquement OIDC
  - `macOS Release` public est réservé à la validation ; quand un tag n'existe que sur une
    branche de release mais que le workflow est déclenché depuis `main`, définissez
    `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir avec des `preflight_run_id` et
    `validate_run_id` mac privés réussis
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
    de nouveau
- Pour les releases de correction stables comme `YYYY.M.D-N`, le vérificateur post-publication
  contrôle aussi le même chemin de mise à niveau à préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas laisser silencieusement les anciennes installations globales sur la
  charge utile stable de base
- Le preflight de release npm échoue fermé sauf si l'archive tar inclut à la fois
  `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide
  afin d'éviter d'expédier de nouveau un tableau de bord navigateur vide
- La vérification post-publication contrôle aussi que les points d'entrée de plugins publiés et
  les métadonnées de paquet sont présents dans la disposition de registre installée. Une release qui
  expédie des charges utiles d'exécution de plugins manquantes échoue au vérificateur postpublish et
  ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm à
  l'archive tar candidate de mise à jour, afin que l'e2e de l'installateur détecte l'inflation accidentelle du pack
  avant le chemin de publication de release
- Si le travail de release a touché à la planification CI, aux manifestes de timing d'extensions ou
  aux matrices de tests d'extensions, régénérez et révisez les sorties de matrice
  `plugin-prerelease-extension-shard` détenues par le planificateur depuis
  `.github/workflows/plugin-prerelease.yml` avant approbation afin que les notes de release ne
  décrivent pas une disposition CI obsolète
- La préparation d'une release macOS stable inclut aussi les surfaces de mise à jour :
  - la release GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l'app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle
    non vide et un `CFBundleVersion` supérieur ou égal au plancher canonique de build Sparkle
    pour cette version de release

## Boîtes de test de release

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de pré-release depuis
un seul point d'entrée. Pour une preuve de commit épinglé sur une branche qui évolue vite, utilisez
l'assistant afin que chaque workflow enfant s'exécute depuis une branche temporaire fixée au SHA
cible :

```bash
pnpm ci:full-release --sha <full-sha>
```

L'assistant pousse `release-ci/<sha>-...`, déclenche `Full Release Validation`
depuis cette branche avec `ref=<sha>`, vérifie que chaque `headSha` de workflow enfant
correspond à la cible, puis supprime la branche temporaire. Cela évite de prouver par accident une
exécution enfant `main` plus récente.

Pour la validation d'une branche ou d'un tag de release, exécutez-la depuis la ref de workflow
`main` de confiance et passez la branche ou le tag de release comme `ref` :

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
package, et déclenche l’E2E Telegram de package autonome quand `release_profile=full` avec
`rerun_group=all` ou quand `npm_telegram_package_spec` est défini. `OpenClaw Release
Checks` déploie ensuite en éventail le smoke test d’installation, les vérifications de release multiplateformes, la
couverture live/E2E Docker du chemin de release quand le soak est activé, Package Acceptance avec l’AQ du package Telegram, la parité QA Lab, Matrix en live et Telegram en live. Une exécution complète n’est acceptable que lorsque le
résumé `Full Release Validation`
indique que `normal_ci` et `release_checks` ont réussi. En mode full/all,
l’enfant `npm_telegram` doit également réussir ; hors full/all, il est ignoré
sauf si un `npm_telegram_package_spec` publié a été fourni. Le résumé final du
vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de release
puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de release](/fr/reference/full-release-validation) pour la
matrice complète des étapes, les noms exacts des jobs du workflow, les
différences entre les profils stable et full, les artefacts et les poignées de réexécution ciblée.
Les workflows enfants sont déclenchés depuis la référence de confiance qui exécute `Full Release
Validation`, normalement `--ref main`, même lorsque la référence cible `ref` pointe vers une
branche ou une balise de release plus ancienne. Il n’existe pas d’entrée distincte de référence de workflow pour Full Release Validation ; choisissez le harnais de confiance en choisissant la référence d’exécution du workflow.
N’utilisez pas `--ref main -f ref=<sha>` pour une preuve exacte de commit sur `main` mouvant ;
les SHA de commit bruts ne peuvent pas être des références de déclenchement de workflow, utilisez donc
`pnpm ci:full-release --sha <sha>` pour créer la branche temporaire épinglée.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker le plus rapide critique pour la release
- `stable` : minimum plus couverture stable des fournisseurs/backends pour l’approbation de release
- `full` : stable plus large couverture consultative des fournisseurs/médias

Utilisez `run_release_soak=true` avec `stable` lorsque les voies bloquantes pour la release sont
vertes et que vous voulez le balayage exhaustif live/E2E, du chemin de release Docker et
borné des survivants de mise à niveau publiés avant la promotion. Ce balayage couvre
les quatre derniers packages stables ainsi que les bases de référence épinglées `2026.4.23` et `2026.5.2`,
plus la couverture plus ancienne `2026.4.15`, avec les bases de référence en double supprimées et
chaque base de référence segmentée dans son propre job d’exécution Docker. `full` implique
`run_release_soak=true`.

`OpenClaw Release Checks` utilise la référence de workflow de confiance pour résoudre la référence cible
une fois sous forme de `release-package-under-test` et réutilise cet artefact dans les vérifications cross-OS,
Package Acceptance et Docker du chemin de release quand le soak s’exécute. Cela garde
toutes les machines orientées package sur les mêmes octets et évite les builds répétés de package.
Le smoke test d’installation OpenAI cross-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` quand la
variable du dépôt/de l’organisation est définie, sinon `openai/gpt-5.4`, car cette voie
prouve l’installation du package, l’onboarding, le démarrage du Gateway et un tour d’agent live
plutôt que de mesurer le modèle par défaut le plus lent. La matrice plus large des fournisseurs live
reste l’endroit pour la couverture propre aux modèles.

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

# Après la publication d’une bêta, ajouter l’E2E Telegram de package publié.
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

N’utilisez pas l’ombrelle complète comme première réexécution après un correctif ciblé. Si une machine
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de package, le
fournisseur de modèle ou la voie d’AQ en échec pour la preuve suivante. Réexécutez l’ombrelle complète
uniquement lorsque le correctif a modifié l’orchestration partagée de release ou rendu obsolète
la preuve toutes-machines précédente. Le vérificateur final de l’ombrelle revérifie les identifiants
d’exécution des workflows enfants enregistrés ; donc, après la réexécution réussie d’un workflow enfant,
réexécutez uniquement le job parent `Verify full validation` échoué.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la vraie
exécution de candidat de release, `ci` exécute uniquement l’enfant CI normal, `plugin-prerelease`
exécute uniquement l’enfant Plugin réservé à la release, `release-checks` exécute toutes les machines
de release, et les groupes de release plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram`.
Les réexécutions ciblées `npm-telegram` nécessitent `npm_telegram_package_spec` ; les exécutions full/all
avec `release_profile=full` utilisent l’artefact de package de release-checks. Les réexécutions
cross-OS ciblées peuvent ajouter `cross_os_suite_filter=windows/packaged-upgrade` ou
un autre filtre OS/suite. Les échecs QA release-checks sont consultatifs ; un échec QA uniquement
ne bloque pas la validation de release.

### Vitest

La machine Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement
le périmétrage par changements et force le graphe de tests normal pour le candidat
de release : shards Linux Node, shards de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, smoke de build, vérifications de docs, Skills Python, Windows, macOS, Android et i18n Control UI.

Utilisez cette machine pour répondre à « l’arbre source a-t-il réussi la suite complète de tests normale ? »
Ce n’est pas la même chose que la validation produit du chemin de release. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des shards en échec ou lents dans les jobs CI lors de l’analyse des régressions
- artefacts de chronométrage Vitest tels que `.artifacts/vitest-shard-timings.json` quand
  une exécution nécessite une analyse de performance

Exécutez la CI manuelle directement uniquement quand la release nécessite une CI normale déterministe mais
pas les machines Docker, QA Lab, live, cross-OS ou package :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La machine Docker vit dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke`
en mode release. Elle valide le candidat de release au moyen d’environnements Docker packagés
au lieu de se limiter aux tests au niveau source.

La couverture Docker de release inclut :

- smoke test d’installation complet avec le smoke test lent d’installation globale Bun activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec les jobs smoke QR,
  racine/Gateway et installateur/Bun exécutés comme shards install-smoke séparés
- voies E2E du dépôt
- fragments Docker du chemin de release : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` et `plugins-runtime-install-h`
- couverture OpenWebUI dans le fragment `plugins-runtime-services` sur demande
- voies séparées d’installation/désinstallation des plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites de fournisseurs live/E2E et couverture de modèles live Docker quand les vérifications de release
  incluent les suites live

Utilisez les artefacts Docker avant de réexécuter. Le planificateur du chemin de release téléverse
`.artifacts/docker-tests/` avec les journaux des voies, `summary.json`, `failures.json`,
les chronométrages de phases, le JSON du plan du planificateur et les commandes de réexécution. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au lieu de
réexécuter tous les fragments de release. Les commandes de réexécution générées incluent le
`package_artifact_run_id` précédent et les entrées d’image Docker préparée quand elles sont disponibles, afin qu’une
voie échouée puisse réutiliser le même tarball et les mêmes images GHCR.

### QA Lab

La machine QA Lab fait également partie de `OpenClaw Release Checks`. C’est la porte de release
du comportement agentique et au niveau des canaux, distincte de Vitest et des mécaniques
de package Docker.

La couverture QA Lab de release inclut :

- voie de parité simulée comparant la voie candidate OpenAI à la base Opus 4.6
  au moyen du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` quand la télémétrie de release nécessite une preuve locale explicite

Utilisez cette machine pour répondre à « la release se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux live ? » Conservez les URL d’artefacts pour les voies parité, Matrix et Telegram
lors de l’approbation de la release. La couverture Matrix complète reste disponible sous forme
d’exécution QA-Lab segmentée manuelle plutôt que comme voie critique de release par défaut.

### Package

La machine Package est la porte du produit installable. Elle s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en tarball `package-under-test` consommé par Docker E2E, valide
l’inventaire du package, enregistre la version du package et le SHA-256, et garde la
référence du harnais de workflow séparée de la référence source du package.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de release OpenClaw
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet `package_ref` de confiance
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=artifact`, l’artefact
de package de release préparé, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance conserve la migration, la mise à jour,
le redémarrage après mise à jour avec authentification configurée, le nettoyage des dépendances de Plugin obsolètes, les fixtures de Plugin hors ligne, la mise à jour de Plugin et l’AQ du package Telegram contre le même
tarball résolu. Les vérifications bloquantes de release utilisent la dernière base de package publiée
par défaut ; `run_release_soak=true` ou
`release_profile=full` étend à toutes les bases stables publiées sur npm depuis
`2026.4.23` jusqu’à `latest`, plus les fixtures d’incidents signalés. Utilisez
Package Acceptance avec `source=npm` pour un candidat déjà livré, ou
`source=ref`/`source=artifact` pour un tarball npm local adossé à un SHA avant
publication. C’est le remplacement natif GitHub
de la majeure partie de la couverture package/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de release cross-OS restent importantes pour l’onboarding,
l’installateur et le comportement propres aux OS, mais la validation produit package/mise à jour doit
préférer Package Acceptance.

La checklist canonique pour la validation des mises à jour et des plugins est
[Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins). Utilisez-la pour
déterminer quelle voie locale, Docker, Package Acceptance ou release-check prouve une
installation/mise à jour de Plugin, un nettoyage doctor ou un changement de migration de package publié.
La migration exhaustive des mises à jour publiées depuis chaque package stable `2026.4.23+` est
un workflow manuel `Update Migration` distinct, et ne fait pas partie de la CI complète de release.

La tolérance historique de l’acceptation de paquets est volontairement limitée dans le temps. Les paquets jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tarball, absence de
`gateway install --wrapper`, fichiers de correctif absents du fixture git dérivé de l’archive tarball, absence de
`update.channel` persistant, anciens emplacements d’enregistrements d’installation de Plugin,
absence de persistance des enregistrements d’installation de marketplace, et migration des métadonnées de configuration
pendant `plugins update`. Le paquet publié `2026.4.26` peut émettre un avertissement
pour les fichiers d’empreinte de métadonnées de build local qui ont déjà été livrés. Les paquets ultérieurs
doivent satisfaire aux contrats modernes de paquet ; ces mêmes lacunes font échouer la validation de
release.

Utilisez des profils Package Acceptance plus larges lorsque la question de release concerne un
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

- `smoke` : voies rapides d’installation de paquet/canal/agent, réseau Gateway et rechargement de configuration
- `package` : contrats d’installation/mise à jour/redémarrage/paquet de Plugin sans ClawHub en direct ; c’est la valeur par défaut des vérifications de release
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : segments de chemin de release Docker avec OpenWebUI
- `custom` : liste exacte `docker_lanes` pour des relances ciblées

Pour la preuve Telegram d’un paquet candidat, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` dans Package Acceptance. Le workflow transmet l’archive tarball
résolue `package-under-test` à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications après publication.

## Automatisation de publication de release

`OpenClaw Release Publish` est le point d’entrée normal de publication mutante. Il
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
uniquement pour des travaux de réparation ou de republication ciblés. Pour une réparation de Plugin sélectionné, transmettez
`plugin_publish_scope=selected` et `plugins=@openclaw/name` à
`OpenClaw Release Publish`, ou déclenchez directement le workflow enfant lorsque le
paquet OpenClaw ne doit pas être publié.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis tel que `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA
  complet de commit de 40 caractères de la branche de workflow actuelle pour une prévalidation uniquement
- `preflight_only` : `true` pour validation/build/paquet uniquement, `false` pour le
  chemin de publication réel
- `preflight_run_id` : requis sur le chemin de publication réel afin que le workflow réutilise
  l’archive tarball préparée depuis l’exécution de prévalidation réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; valeur par défaut : `beta`

`OpenClaw Release Publish` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis ; il doit déjà exister
- `preflight_run_id` : identifiant d’exécution de prévalidation `OpenClaw NPM Release` réussie ;
  requis lorsque `publish_openclaw_npm=true`
- `npm_dist_tag` : tag cible npm pour le paquet OpenClaw
- `plugin_publish_scope` : valeur par défaut `all-publishable` ; utilisez `selected` uniquement
  pour des travaux de réparation ciblés
- `plugins` : noms de paquets `@openclaw/*` séparés par des virgules lorsque
  `plugin_publish_scope=selected`
- `publish_openclaw_npm` : valeur par défaut `true` ; définissez `false` uniquement lors de l’utilisation du
  workflow comme orchestrateur de réparation réservé aux Plugins

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, tag ou SHA complet de commit à valider. Les vérifications portant des secrets
  exigent que le commit résolu soit accessible depuis une branche OpenClaw ou un
  tag de release.
- `run_release_soak` : active la campagne exhaustive live/E2E, le chemin de release Docker et
  la campagne de survivance de mise à niveau depuis toutes les versions sur les vérifications de release stables/par défaut. Elle est forcée
  par `release_profile=full`.

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de prérelease bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA complet de commit n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  uniquement des validations
- Le chemin de publication réel doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant que la publication continue

## Séquence de release npm stable

Lors de la préparation d’une release npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA complet de commit de la branche de workflow actuelle
     pour un essai à blanc de validation uniquement du workflow de prévalidation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de release, le tag de release ou le SHA complet
   de commit lorsque vous voulez la CI normale plus la couverture live du cache de prompt, Docker, QA Lab,
   Matrix et Telegram depuis un workflow manuel unique
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le
   workflow manuel `CI` sur la référence de release
5. Enregistrez le `preflight_run_id` réussi
6. Exécutez `OpenClaw Release Publish` avec le même `tag`, le même `npm_dist_tag`,
   et le `preflight_run_id` enregistré ; il publie les Plugins externalisés vers npm
   et ClawHub avant de promouvoir le paquet npm OpenClaw
7. Si la release a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
8. Si la release a été intentionnellement publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée
   d’auto-réparation déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité, car elle nécessite toujours
`NPM_TOKEN`, tandis que le dépôt public conserve une publication uniquement OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord tous deux
documentés et visibles par l’opérateur.

Si un mainteneur doit se rabattre sur une authentification npm locale, exécutez toute commande CLI 1Password
(`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
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

Les mainteneurs utilisent les docs de release privées dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le runbook réel.

## Connexe

- [Canaux de release](/fr/install/development-channels)

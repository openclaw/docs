---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation de package
    - Recherche de la nomenclature des versions et de la cadence
summary: Voies de publication, liste de vérification de l’opérateur, environnements de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-30T07:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw propose trois voies de publication publiques :

- stable : publications balisées qui sont publiées sur npm `beta` par défaut, ou sur npm `latest` lorsque cela est explicitement demandé
- bêta : balises de prépublication publiées sur npm `beta`
- dev : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de publication corrective stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de prépublication bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` signifie la publication npm stable actuellement promue
- `beta` signifie la cible d’installation bêta actuelle
- Les publications stables et les publications correctives stables sont publiées sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir ultérieurement une build bêta validée
- Chaque publication stable d’OpenClaw livre le package npm et l’application macOS ensemble ;
  les publications bêta valident et publient normalement d’abord le chemin npm/package, la
  compilation/signature/notarisation de l’application Mac étant réservée aux versions stables, sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par la bêta
- La version stable ne suit qu’après validation de la dernière bêta
- Les mainteneurs préparent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation et les correctifs de publication ne bloquent pas le nouveau
  développement sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit publiquement la structure du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de rollback d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI du `main` actuel est suffisamment verte pour créer une branche à partir de celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder des entrées orientées utilisateur, la committer, la pousser, puis faire un rebase/pull
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail normal de publication
   directement sur `main`.
5. Mettre à jour chaque emplacement de version requis pour la balise prévue, puis exécuter le
   précontrôle déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de branche de publication de 40 caractères est autorisé pour un précontrôle
   uniquement destiné à la validation. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grands environnements de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, voie, job de workflow, profil de package, fournisseur ou allowlist de modèles en échec qui
   prouve le correctif. Relancer l’ensemble complet uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, baliser `vYYYY.M.D-beta.N`, publier avec le dist-tag npm `beta`, puis exécuter
   l’acceptation package post-publication contre le package publié `openclaw@YYYY.M.D-beta.N`
   ou `openclaw@beta`. Si une bêta poussée ou publiée nécessite un correctif, créer
   le `-beta.N` suivant ; ne pas supprimer ni réécrire l’ancienne bêta.
10. Pour la version stable, continuer uniquement après que la bêta validée ou la release candidate dispose des
    preuves de validation requises. La publication npm stable réutilise l’artefact de précontrôle réussi
    via `preflight_run_id` ; la préparation de la publication stable macOS exige aussi
    les fichiers packagés `.zip`, `.dmg`, `.dSYM.zip` et le fichier
    `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram
    publié-npm autonome optionnel lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion du dist-tag si nécessaire, les notes de publication/prépublication GitHub issues de la
    section complète correspondante de `CHANGELOG.md`, ainsi que les étapes d’annonce
    de publication.

## Précontrôle de publication

- Exécutez `pnpm check:test-types` avant le pré-vol de publication afin que le TypeScript des tests reste couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le pré-vol de publication afin que les contrôles plus larges des cycles d’importation et des limites d’architecture soient verts en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le bundle Control UI existent pour l’étape de validation du paquet
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de publication pour lancer toutes les boîtes de test de pré-publication depuis un seul point d’entrée. Il accepte une branche, une balise ou un SHA de commit complet, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour les voies de smoke d’installation, d’acceptation de paquet, de suites de chemin de publication Docker, live/E2E, OpenWebUI, parité QA Lab, Matrix et Telegram. Fournissez `npm_telegram_package_spec` uniquement après la publication d’un paquet et lorsque l’E2E Telegram post-publication doit également s’exécuter. Fournissez `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la validation correspond à un paquet npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal latéral pour un candidat de paquet pendant que le travail de publication continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche/balise/SHA `package_ref` fiable avec le harnais `workflow_ref` actuel ; `source=url` pour une archive HTTPS avec un SHA-256 requis ; ou `source=artifact` pour une archive téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat en `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette archive, et peut exécuter la QA Telegram contre la même archive avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies paquet/mise à jour/Plugin natives de l’artefact sans OpenWebUI ni ClawHub live
  - `product` : profil paquet plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin d’une couverture CI normale complète pour le candidat de publication. Les déclenchements manuels de CI contournent le périmètre des changements et forcent les shards Linux Node, les shards de Plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le smoke de build, les contrôles de docs, les Skills Python, Windows, macOS, Android et les voies i18n de Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cela exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés, les attributs bornés et la censure du contenu/des identifiants sans nécessiter Opik, Langfuse ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication balisée
- Les contrôles de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la barrière de parité mock QA Lab ainsi que le profil Matrix live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet du transport Matrix, des médias et de l’E2EE en parallèle.
- La validation d’installation inter-OS et d’exécution de mise à niveau fait partie des workflows publics `OpenClaw Release Checks` et `Full Release Validation`, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les contrôles live plus lents restent dans leur propre voie afin de ne pas ralentir ni bloquer la publication
- Les contrôles de publication portant des secrets doivent être déclenchés via `Full Release Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, une balise ou un SHA de commit complet tant que le commit résolu est joignable depuis une branche OpenClaw ou une balise de publication
- Le pré-vol en mode validation uniquement de `OpenClaw NPM Release` accepte aussi le SHA complet de 40 caractères du commit actuel de la branche de workflow sans exiger de balise poussée
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour le contrôle des métadonnées de paquet ; la vraie publication exige toujours une vraie balise de publication
- Les deux workflows gardent la vraie publication et le chemin de promotion sur des exécuteurs hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les exécuteurs Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le pré-vol de publication npm n’attend plus la voie séparée des contrôles de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou la balise bêta/corrective correspondante) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation du registre publié dans un nouveau préfixe temporaire
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et le vrai E2E Telegram contre le paquet npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les essais locaux ponctuels de mainteneurs peuvent omettre les variables Convex et transmettre directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter le même contrôle post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est volontairement uniquement manuel et ne s’exécute pas à chaque fusion.
- L’automatisation de publication des mainteneurs utilise désormais pré-vol puis promotion :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de pré-vol réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via l’entrée du workflow
  - la mutation de dist-tag npm basée sur un jeton vit désormais dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour la sécurité, car `npm dist-tag add` a toujours besoin de `NPM_TOKEN` tandis que le dépôt public conserve une publication uniquement OIDC
  - le `macOS Release` public est uniquement une validation
  - la vraie publication mac privée doit réussir les `preflight_run_id` et `validate_run_id` mac privés
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication contrôle aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`, afin que les corrections de publication ne puissent pas laisser silencieusement les installations globales plus anciennes sur la charge utile stable de base
- Le pré-vol de publication npm échoue fermé sauf si l’archive contient à la fois `dist/control-ui/index.html` et une charge utile `dist/control-ui/assets/` non vide, afin que nous ne livrions plus un tableau de bord navigateur vide
- La vérification post-publication contrôle aussi que l’installation du registre publié contient des dépendances d’exécution de Plugins groupés non vides sous la disposition racine `dist/*`. Une publication livrée avec des charges utiles de dépendances de Plugins groupés manquantes ou vides échoue au vérificateur post-publication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du paquet npm à l’archive de mise à jour candidate, afin que l’e2e de l’installateur détecte les gonflements accidentels du paquet avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de timing d’extensions ou les matrices de tests d’extensions, régénérez et relisez les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant l’approbation, afin que les notes de publication ne décrivent pas une disposition CI obsolète
- La préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` empaquetés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` au moins égal au plancher de build Sparkle canonique pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la façon dont les opérateurs lancent tous les tests de pré-publication depuis un seul point d’entrée. Exécutez-le depuis la référence de workflow fiable `main` et transmettez la branche de publication, la balise ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la référence cible, déclenche manuellement `CI` avec `target_ref=<release-ref>`, déclenche `OpenClaw Release Checks` et déclenche éventuellement l’E2E Telegram autonome post-publication lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release Checks` déploie ensuite en éventail le smoke d’installation, les contrôles de publication inter-OS, la couverture live/E2E Docker du chemin de publication, Package Acceptance avec QA de paquet Telegram, la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le résumé `Full Release Validation` indique que `normal_ci` et `release_checks` ont réussi, et que tout enfant optionnel `npm_telegram` a réussi ou a été intentionnellement ignoré. Le résumé final du vérificateur inclut des tableaux des jobs les plus lents pour chaque exécution enfant, afin que le responsable de publication puisse voir le chemin critique actuel sans télécharger les journaux.
Les workflows enfants sont déclenchés depuis la référence fiable qui exécute `Full Release Validation`, normalement `--ref main`, même lorsque la cible `ref` pointe vers une ancienne branche ou balise de publication. Il n’y a pas d’entrée séparée de référence de workflow Full Release Validation ; choisissez le harnais fiable en choisissant la référence d’exécution du workflow.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin OpenAI/core live et Docker critique pour la publication le plus rapide
- `stable` : minimum plus couverture stable fournisseur/backend pour l’approbation de publication
- `full` : stable plus large couverture consultative fournisseur/médias

`OpenClaw Release Checks` utilise la référence de workflow fiable pour résoudre une fois la référence cible en `release-package-under-test` et réutilise cet artefact à la fois dans les contrôles Docker de chemin de publication et dans Package Acceptance. Cela garde toutes les boîtes orientées paquet sur les mêmes octets et évite les builds de paquet répétés.
Le smoke d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la variable repo/org est définie, sinon `openai/gpt-5.4-mini`, parce que cette voie démontre l’installation du paquet, l’onboarding, le démarrage du Gateway et un tour d’agent live, plutôt que de mesurer le modèle par défaut le plus lent. La matrice plus large de fournisseurs live reste l’endroit pour la couverture spécifique aux modèles.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

N’utilisez pas l’ombrelle complète comme première relance après un correctif ciblé. Si une boîte échoue, utilisez le workflow enfant en échec, la tâche, la voie Docker, le profil de paquet, le fournisseur de modèle ou la voie QA pour la preuve suivante. Relancez l’ombrelle complète uniquement lorsque le correctif a modifié l’orchestration de publication partagée ou a rendu obsolètes les preuves précédentes couvrant toutes les boîtes. Le vérificateur final de l’ombrelle revérifie les identifiants enregistrés des exécutions de workflows enfants ; ainsi, après la relance réussie d’un workflow enfant, relancez uniquement la tâche parente `Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` à l’ombrelle. `all` est la vraie exécution de release candidate, `ci` exécute uniquement l’enfant CI normal, `plugin-prerelease` exécute uniquement l’enfant Plugin réservé à la publication, `release-checks` exécute chaque boîte de publication, et les groupes de publication plus étroits sont `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram` lorsque la voie Telegram de paquet autonome est fournie.

### Vitest

La boîte Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement la portée des changements et force le graphe de tests normal pour la release candidate : fragments Linux Node, fragments de Plugins groupés, contrats de canaux, compatibilité Node 22, `check`, `check-additional`, smoke test de build, vérifications de documentation, Skills Python, Windows, macOS, Android et i18n de Control UI.

Utilisez cette boîte pour répondre à « l’arborescence source a-t-elle réussi toute la suite de tests normale ? ». Elle n’est pas identique à la validation produit du chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments en échec ou lents dans les tâches CI lors de l’investigation de régressions
- artefacts de chronométrage Vitest, comme `.artifacts/vitest-shard-timings.json`, lorsqu’une exécution nécessite une analyse de performance

Exécutez la CI manuelle directement uniquement lorsque la publication nécessite une CI normale déterministe, mais pas les boîtes Docker, QA Lab, live, cross-OS ou paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

La boîte Docker se trouve dans `OpenClaw Release Checks` via `openclaw-live-and-e2e-checks-reusable.yml`, ainsi que dans le workflow `install-smoke` en mode publication. Elle valide la release candidate dans des environnements Docker empaquetés, et non seulement au moyen de tests au niveau source.

La couverture Docker de publication inclut :

- smoke test d’installation complet avec le smoke test lent d’installation globale Bun activé
- préparation/réutilisation de l’image smoke du Dockerfile racine par SHA cible, avec QR, racine/Gateway et tâches smoke installateur/Bun exécutés comme fragments install-smoke distincts
- voies E2E du dépôt
- blocs Docker du chemin de publication : `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` et `bundled-channels-contracts`
- couverture OpenWebUI dans le bloc `plugins-runtime-services` lorsqu’elle est demandée
- voies de dépendances de canaux groupés réparties entre channel-smoke, update-target et blocs de contrats setup/runtime au lieu d’une seule grande tâche de canal groupé
- voies d’installation/désinstallation de Plugin groupé `bundled-plugin-install-uninstall-0` à `bundled-plugin-install-uninstall-23`
- suites fournisseur live/E2E et couverture de modèles live Docker lorsque les vérifications de publication incluent des suites live

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de publication téléverse `.artifacts/docker-tests/` avec les journaux des voies, `summary.json`, `failures.json`, les durées des phases, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée, utilisez `docker_lanes=<lane[,lane]>` sur le workflow réutilisable live/E2E au lieu de relancer tous les blocs de publication. Les commandes de relance générées incluent le `package_artifact_run_id` précédent et les entrées d’image Docker préparée lorsqu’elles sont disponibles, afin qu’une voie en échec puisse réutiliser la même archive tarball et les mêmes images GHCR.

### QA Lab

La boîte QA Lab fait aussi partie de `OpenClaw Release Checks`. C’est la porte de validation de publication pour le comportement agentique et le niveau canal, distincte de Vitest et de la mécanique des paquets Docker.

La couverture QA Lab de publication inclut :

- porte de parité mock comparant la voie candidate OpenAI à la référence Opus 4.6 à l’aide du pack de parité agentique
- profil QA Matrix live rapide utilisant l’environnement `qa-live-shared`
- voie QA Telegram live utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cette boîte pour répondre à « la publication se comporte-t-elle correctement dans les scénarios QA et les flux de canaux live ? ». Conservez les URL d’artefacts pour les voies parité, Matrix et Telegram lors de l’approbation de la publication. La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab manuelle fragmentée plutôt que comme voie critique par défaut pour la publication.

### Paquet

La boîte Paquet est la porte du produit installable. Elle s’appuie sur `Package Acceptance` et le résolveur `scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un candidat en archive tarball `package-under-test` consommée par Docker E2E, valide l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde la réf du harnais de workflow séparée de la réf source du paquet.

Sources candidates prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version de publication OpenClaw exacte
- `source=ref` : empaqueter une branche, une balise ou un SHA de commit complet `package_ref` fiable avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` et `telegram_mode=mock-openai`. Les blocs Docker du chemin de publication couvrent les voies d’installation, de mise à jour et de mise à jour de Plugins qui se recoupent ; Package Acceptance conserve la compatibilité des canaux groupés native aux artefacts, les fixtures de Plugins hors ligne et la QA du paquet Telegram sur la même archive tarball résolue. C’est le remplacement natif GitHub de la majeure partie de la couverture paquet/mise à jour qui nécessitait auparavant Parallels. Les vérifications de publication cross-OS restent importantes pour l’onboarding, l’installateur et le comportement de plateforme propres aux OS, mais la validation produit paquet/mise à jour doit privilégier Package Acceptance.

La tolérance héritée de package-acceptance est intentionnellement limitée dans le temps. Les paquets jusqu’à `2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées sur npm : entrées privées d’inventaire QA absentes de l’archive tarball, `gateway install --wrapper` manquant, fichiers de correctif manquants dans la fixture git dérivée de l’archive tarball, `update.channel` persisté manquant, anciens emplacements d’enregistrements d’installation de Plugins, persistance d’enregistrement d’installation marketplace manquante et migration des métadonnées de configuration pendant `plugins update`. Le paquet publié `2026.4.26` peut avertir pour les fichiers d’empreinte de métadonnées de build local déjà livrés. Les paquets ultérieurs doivent satisfaire les contrats de paquet modernes ; ces mêmes lacunes font échouer la validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication concerne un paquet réellement installable :

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Profils de paquet courants :

- `smoke` : voies rapides d’installation de paquet/canal/agent, réseau Gateway et rechargement de configuration
- `package` : contrats d’installation/mise à jour/paquet de Plugins sans ClawHub live ; c’est la valeur par défaut des vérifications de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
- `full` : blocs Docker du chemin de publication avec OpenWebUI
- `custom` : liste exacte de `docker_lanes` pour les relances ciblées

Pour la preuve Telegram d’un candidat paquet, activez `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` sur Package Acceptance. Le workflow passe l’archive tarball `package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise, par exemple `v2026.4.2`, `v2026.4.2-1` ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, elle peut aussi être le SHA de commit complet à 40 caractères de la branche de workflow actuelle pour une prévalidation destinée uniquement à la validation
- `preflight_only` : `true` pour validation/build/paquet uniquement, `false` pour le vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise l’archive tarball préparée par l’exécution de prévalidation réussie
- `npm_dist_tag` : balise npm cible pour le chemin de publication ; la valeur par défaut est `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, balise ou SHA de commit complet à valider. Les vérifications portant des secrets exigent que le commit résolu soit accessible depuis une branche OpenClaw ou une balise de publication.

Règles :

- Les balises stables et de correction peuvent publier vers `beta` ou `latest`
- Les balises de prépublication bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet est autorisée uniquement lorsque `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours uniquement des validations
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la prévalidation ; le workflow vérifie que les métadonnées avant publication continuent de le confirmer

## Séquence de publication npm stable

Lors de la préparation d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’une balise existe, vous pouvez utiliser le SHA de commit complet de la branche de workflow actuelle pour une simulation de prévalidation uniquement destinée à la validation
2. Choisissez `npm_dist_tag=beta` pour le flux normal bêta d’abord, ou `latest` uniquement lorsque vous voulez intentionnellement une publication stable directe
3. Exécutez `Full Release Validation` sur la branche de publication, la balise de publication ou le SHA de commit complet lorsque vous voulez la CI normale plus la couverture live prompt cache, Docker, QA Lab, Matrix et Telegram depuis un seul workflow manuel
4. Si vous n’avez intentionnellement besoin que du graphe de tests normal déterministe, exécutez plutôt le workflow manuel `CI` sur la réf de publication
5. Enregistrez le `preflight_run_id` réussi
6. Réexécutez `OpenClaw NPM Release` avec `preflight_only=false`, le même `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré
7. Si la publication a atterri sur `beta`, utilisez le workflow privé `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour promouvoir cette version stable de `beta` vers `latest`
8. Si la publication a intentionnellement été publiée directement vers `latest` et que `beta` doit suivre immédiatement le même build stable, utilisez ce même workflow privé pour pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation planifiée d’auto-réparation déplacer `beta` plus tard

La mutation de dist-tag réside dans le dépôt privé pour des raisons de sécurité, car elle nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve uniquement la publication OIDC.

Cela garde le chemin de publication directe et le chemin de promotion bêta d’abord à la fois documentés et visibles par l’opérateur.

Si un responsable de maintenance doit se rabattre sur l’authentification npm locale, exécutez toute commande CLI (`op`) de 1Password uniquement dans une session tmux dédiée. N’appelez pas `op` directement depuis l’interpréteur de commandes principal de l’agent ; le garder dans tmux rend les invites, les alertes et la gestion des OTP observables, et évite les alertes hôte répétées.

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

Les responsables de maintenance utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour la procédure opérationnelle réelle.

## Articles connexes

- [Canaux de publication](/fr/install/development-channels)

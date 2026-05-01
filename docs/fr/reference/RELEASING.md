---
read_when:
    - Recherche des définitions des canaux de publication publics
    - Exécution de la validation de version ou de l’acceptation de paquet
    - Recherche de la nomenclature et de la cadence des versions
summary: Canaux de publication, liste de contrôle de l’opérateur, boîtes de validation, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-05-01T07:16:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw propose trois canaux de publication publics :

- stable : versions balisées qui publient vers npm `beta` par défaut, ou vers npm `latest` sur demande explicite
- bêta : balises de préversion qui publient vers npm `beta`
- développement : tête mouvante de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de correction stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de prépublication bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéro initial au mois ni au jour
- `latest` désigne la publication npm stable actuellement promue
- `beta` désigne la cible d’installation bêta actuelle
- Les publications stables et les publications de correction stables publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build bêta validée
- Chaque publication stable d’OpenClaw livre le paquet npm et l’application macOS ensemble ;
  les publications bêta valident et publient normalement d’abord le chemin npm/paquet, avec
  la build/signature/notarisation de l’application Mac réservées aux versions stables sauf demande explicite

## Cadence des publications

- Les publications passent d’abord par la bêta
- La stable suit uniquement après validation de la dernière bêta
- Les mainteneurs préparent normalement les publications depuis une branche `release/YYYY.M.D` créée
  depuis le `main` actuel, afin que la validation et les correctifs de publication ne bloquent pas les nouveaux
  développements sur `main`
- Si une balise bêta a été poussée ou publiée et nécessite un correctif, les mainteneurs créent
  la balise `-beta.N` suivante au lieu de supprimer ou recréer l’ancienne balise bêta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont
  réservés aux mainteneurs

## Liste de contrôle de l’opérateur de publication

Cette liste de contrôle décrit la forme publique du flux de publication. Les identifiants privés,
la signature, la notarisation, la récupération des dist-tags et les détails de restauration d’urgence restent dans
le runbook de publication réservé aux mainteneurs.

1. Partir du `main` actuel : récupérer la dernière version, confirmer que le commit cible est poussé,
   et confirmer que la CI actuelle de `main` est suffisamment verte pour créer une branche depuis celui-ci.
2. Réécrire la section supérieure de `CHANGELOG.md` à partir de l’historique réel des commits avec
   `/changelog`, garder les entrées orientées utilisateur, la committer, la pousser, puis rebaser/récupérer
   une fois de plus avant de créer la branche.
3. Examiner les enregistrements de compatibilité de publication dans
   `src/plugins/compat/registry.ts` et
   `src/commands/doctor/shared/deprecation-compat.ts`. Supprimer la compatibilité expirée
   uniquement lorsque le chemin de mise à niveau reste couvert, ou consigner pourquoi elle est
   intentionnellement conservée.
4. Créer `release/YYYY.M.D` depuis le `main` actuel ; ne pas effectuer le travail de publication normal
   directement sur `main`.
5. Incrémenter tous les emplacements de version requis pour la balise prévue, puis exécuter le
   précontrôle déterministe local :
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, et `pnpm release:check`.
6. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`. Avant qu’une balise existe,
   un SHA complet de branche de publication à 40 caractères est autorisé pour le précontrôle
   de validation uniquement. Enregistrer le `preflight_run_id` réussi.
7. Lancer tous les tests de prépublication avec `Full Release Validation` pour la
   branche de publication, la balise ou le SHA complet du commit. C’est le point d’entrée manuel unique
   pour les quatre grandes boîtes de test de publication : Vitest, Docker, QA Lab et Package.
8. Si la validation échoue, corriger sur la branche de publication et relancer le plus petit
   fichier, canal, job de workflow, profil de paquet, fournisseur ou allowlist de modèles échoué qui
   prouve le correctif. Relancer l’ombrelle complète uniquement lorsque la surface modifiée rend
   les preuves précédentes obsolètes.
9. Pour la bêta, baliser `vYYYY.M.D-beta.N`, publier avec le dist-tag npm `beta`, puis exécuter
   l’acceptation de paquet post-publication contre le paquet publié `openclaw@YYYY.M.D-beta.N`
   ou `openclaw@beta`. Si une bêta poussée ou publiée nécessite un correctif, créer
   la balise `-beta.N` suivante ; ne pas supprimer ni réécrire l’ancienne bêta.
10. Pour la stable, continuer uniquement après que la bêta validée ou le candidat à la publication dispose des
    preuves de validation requises. La publication npm stable réutilise l’artefact de précontrôle
    réussi via `preflight_run_id` ; la préparation de la publication macOS stable exige également
    les fichiers empaquetés `.zip`, `.dmg`, `.dSYM.zip`, et un
    `appcast.xml` mis à jour sur `main`.
11. Après publication, exécuter le vérificateur npm post-publication, l’E2E Telegram publié-npm
    autonome facultatif lorsque vous avez besoin d’une preuve de canal post-publication,
    la promotion de dist-tag si nécessaire, les notes de publication/prépublication GitHub à partir de la
    section complète correspondante de `CHANGELOG.md`, et les étapes d’annonce de publication.

## Précontrôle de publication

- Exécutez `pnpm check:test-types` avant la vérification préliminaire de publication afin que le TypeScript de test reste couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant la vérification préliminaire de publication afin que les vérifications plus larges des cycles d’import et des limites d’architecture soient au vert en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le bundle Control UI existent pour l’étape de validation du paquet
- Exécutez le workflow manuel `Full Release Validation` avant l’approbation de publication pour lancer toutes les boîtes de test de prépublication depuis un seul point d’entrée. Il accepte une branche, un tag ou un SHA de commit complet, déclenche manuellement `CI` et déclenche `OpenClaw Release Checks` pour les tests rapides d’installation, l’acceptation des paquets, les suites de chemin de publication Docker, le live/E2E, OpenWebUI, la parité QA Lab, Matrix et les voies Telegram. Fournissez `npm_telegram_package_spec` uniquement après la publication d’un paquet et lorsque l’E2E Telegram post-publication doit aussi s’exécuter. Fournissez `evidence_package_spec` lorsque le rapport de preuve privé doit démontrer que la validation correspond à un paquet npm publié sans forcer l’E2E Telegram.
  Exemple :
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Exécutez le workflow manuel `Package Acceptance` lorsque vous voulez une preuve par canal parallèle pour un paquet candidat pendant que le travail de publication continue. Utilisez `source=npm` pour `openclaw@beta`, `openclaw@latest` ou une version de publication exacte ; `source=ref` pour empaqueter une branche, un tag ou un SHA `package_ref` approuvé avec le harnais `workflow_ref` actuel ; `source=url` pour une archive tar HTTPS avec un SHA-256 obligatoire ; ou `source=artifact` pour une archive tar téléversée par une autre exécution GitHub Actions. Le workflow résout le candidat vers `package-under-test`, réutilise le planificateur de publication Docker E2E contre cette archive tar et peut exécuter la QA Telegram contre la même archive tar avec `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Lorsque les voies Docker sélectionnées incluent `published-upgrade-survivor`, l’artefact du paquet est le candidat et `published_upgrade_survivor_baseline` sélectionne la base publiée.
  Exemple : `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Profils courants :
  - `smoke` : voies d’installation/canal/agent, réseau Gateway et rechargement de configuration
  - `package` : voies de paquet/mise à jour/Plugin natives de l’artefact sans OpenWebUI ni ClawHub live
  - `product` : profil de paquet plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI et OpenWebUI
  - `full` : segments de chemin de publication Docker avec OpenWebUI
  - `custom` : sélection exacte de `docker_lanes` pour une réexécution ciblée
- Exécutez directement le workflow manuel `CI` lorsque vous avez seulement besoin d’une couverture CI normale complète pour le candidat de publication. Les déclenchements CI manuels contournent le périmètre des changements et forcent les shards Linux Node, les shards de Plugins groupés, les contrats de canaux, la compatibilité Node 22, `check`, `check-additional`, le test rapide de build, les vérifications docs, les Skills Python, Windows, macOS, Android et les voies i18n Control UI.
  Exemple : `gh workflow run ci.yml --ref release/YYYY.M.D`
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de publication. Cela exerce QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés, les attributs bornés et la rédaction du contenu/des identifiants sans nécessiter Opik, Langfuse ni un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque publication taguée
- Les vérifications de publication s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la barrière de parité simulée QA Lab ainsi que le profil Matrix live rapide et la voie QA Telegram avant l’approbation de publication. Les voies live utilisent l’environnement `qa-live-shared` ; Telegram utilise aussi les baux d’identifiants Convex CI. Exécutez le workflow manuel `QA-Lab - All Lanes` avec `matrix_profile=all` et `matrix_shards=true` lorsque vous voulez l’inventaire complet en parallèle du transport Matrix, des médias et d’E2EE.
- La validation d’exécution d’installation et de mise à niveau multi-OS fait partie de `OpenClaw Release Checks` et de `Full Release Validation` publics, qui appellent directement le workflow réutilisable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de publication contenant des secrets doivent être déclenchées via `Full Release Validation` ou depuis la référence de workflow `main`/release afin que la logique de workflow et les secrets restent contrôlés
- `OpenClaw Release Checks` accepte une branche, un tag ou un SHA de commit complet tant que le commit résolu est atteignable depuis une branche OpenClaw ou un tag de publication
- La vérification préliminaire en mode validation uniquement de `OpenClaw NPM Release` accepte aussi le SHA complet de 40 caractères du commit de la branche de workflow actuelle sans nécessiter de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées de paquet ; la vraie publication nécessite toujours un vrai tag de publication
- Les deux workflows gardent la vraie voie de publication et de promotion sur des runners hébergés par GitHub, tandis que la voie de validation non mutante peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préliminaire de publication npm n’attend plus la voie séparée des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation du registre publié dans un nouveau préfixe temporaire
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du paquet installé, la configuration Telegram et le vrai E2E Telegram contre le paquet npm publié en utilisant le pool partagé d’identifiants Telegram loués. Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et transmettre directement les trois identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le workflow manuel `NPM Telegram Beta E2E`. Il est volontairement uniquement manuel et ne s’exécute pas à chaque merge.
- L’automatisation de publication des mainteneurs utilise désormais une approche vérification préliminaire puis promotion :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou `release/YYYY.M.D` que l’exécution de vérification préliminaire réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via une entrée de workflow
  - la mutation de dist-tag npm basée sur jeton vit désormais dans `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` pour la sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le dépôt public conserve une publication OIDC uniquement
  - `macOS Release` public est réservé à la validation ; lorsqu’un tag n’existe que sur une branche de publication mais que le workflow est déclenché depuis `main`, définissez `public_release_branch=release/YYYY.M.D`
  - la vraie publication mac privée doit réussir les `preflight_run_id` et `validate_run_id` mac privés
  - les vrais chemins de publication promeuvent les artefacts préparés au lieu de les reconstruire
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication vérifie aussi le même chemin de mise à niveau à préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`, afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La vérification préliminaire de publication npm échoue fermement sauf si l’archive tar inclut à la fois `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`, afin de ne pas livrer de nouveau un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que l’installation du registre publié contient des dépendances d’exécution de Plugins groupés non vides sous l’agencement racine `dist/*`. Une publication livrée avec des charges utiles de dépendances de Plugins groupés manquantes ou vides échoue au vérificateur postpublication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget npm pack `unpackedSize` sur l’archive tar de mise à jour candidate, afin que l’e2e de l’installateur détecte les gonflements accidentels du paquet avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de timing des extensions ou les matrices de test des extensions, régénérez et révisez les sorties de matrice `plugin-prerelease-extension-shard` détenues par le planificateur depuis `.github/workflows/plugin-prerelease.yml` avant l’approbation, afin que les notes de publication ne décrivent pas un agencement CI obsolète
- La préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les paquets `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’application empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher canonique de build Sparkle pour cette version de publication

## Boîtes de test de publication

`Full Release Validation` est la manière dont les opérateurs lancent tous les tests de prépublication depuis un seul point d’entrée. Exécutez-le depuis la référence de workflow approuvée `main` et transmettez la branche de publication, le tag ou le SHA de commit complet comme `ref` :

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Le workflow résout la référence cible, déclenche manuellement `CI` avec `target_ref=<release-ref>`, déclenche `OpenClaw Release Checks` et déclenche éventuellement l’E2E Telegram post-publication autonome lorsque `npm_telegram_package_spec` est défini. `OpenClaw Release Checks` déploie ensuite le test rapide d’installation, les vérifications de publication multi-OS, la couverture live/E2E Docker du chemin de publication, Package Acceptance avec QA de paquet Telegram, la parité QA Lab, Matrix live et Telegram live. Une exécution complète n’est acceptable que lorsque le résumé de `Full Release Validation` indique `normal_ci` et `release_checks` comme réussis, et que tout enfant facultatif `npm_telegram` est soit réussi, soit intentionnellement ignoré. Le résumé final du vérificateur inclut des tableaux des tâches les plus lentes pour chaque exécution enfant, afin que le responsable de publication puisse voir le chemin critique actuel sans télécharger les journaux.
Consultez [Validation complète de publication](/fr/reference/full-release-validation) pour la matrice d’étapes complète, les noms exacts des tâches de workflow, les différences entre profils stable et complet, les artefacts et les poignées de réexécution ciblée.
Les workflows enfants sont déclenchés depuis la référence approuvée qui exécute `Full Release Validation`, normalement `--ref main`, même lorsque le `ref` cible pointe vers une branche de publication ou un tag plus ancien. Il n’existe pas d’entrée de référence de workflow Full Release Validation séparée ; choisissez le harnais approuvé en choisissant la référence d’exécution du workflow.

Utilisez `release_profile` pour sélectionner l’étendue live/fournisseur :

- `minimum` : chemin live et Docker OpenAI/core le plus rapide et critique pour la publication
- `stable` : minimum plus couverture fournisseur/backend stable pour l’approbation de publication
- `full` : stable plus couverture large des fournisseurs/médias consultatifs

`OpenClaw Release Checks` utilise la référence de workflow approuvée pour résoudre la
référence cible une seule fois comme `release-package-under-test` et réutilise cet
artefact à la fois dans les vérifications Docker du chemin de publication et dans
Package Acceptance. Cela garde tous les environnements orientés paquet sur les mêmes
octets et évite les reconstructions répétées de paquet.
Le test d’installation OpenAI inter-OS utilise `OPENCLAW_CROSS_OS_OPENAI_MODEL` lorsque la
variable du dépôt ou de l’organisation est définie, sinon `openai/gpt-5.4-mini`, car cette voie
prouve l’installation du paquet, l’intégration initiale, le démarrage du Gateway et un tour d’agent réel
plutôt que de mesurer le modèle par défaut le plus lent. La matrice plus large des fournisseurs en direct
reste l’endroit prévu pour la couverture propre à chaque modèle.

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

N’utilisez pas le parapluie complet comme première relance après un correctif ciblé. Si un environnement
échoue, utilisez le workflow enfant, le job, la voie Docker, le profil de paquet, le fournisseur de modèle
ou la voie QA en échec pour la prochaine preuve. Relancez le parapluie complet uniquement lorsque
le correctif a modifié l’orchestration de publication partagée ou a rendu obsolètes les preuves
tous-environnements précédentes. Le vérificateur final du parapluie revérifie les identifiants d’exécution
des workflows enfants enregistrés ; ainsi, après la relance réussie d’un workflow enfant, relancez seulement le job parent
`Verify full validation` en échec.

Pour une récupération bornée, passez `rerun_group` au parapluie. `all` est la vraie
exécution candidate à la publication, `ci` exécute seulement l’enfant CI normal, `plugin-prerelease`
exécute seulement l’enfant Plugin réservé aux publications, `release-checks` exécute chaque environnement de publication,
et les groupes de publication plus étroits sont `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` et `npm-telegram` lorsque la
voie Telegram autonome de paquet est fournie.

### Vitest

L’environnement Vitest est le workflow enfant manuel `CI`. La CI manuelle contourne intentionnellement
le périmétrage par changements et force le graphe de tests normal pour le candidat à la publication :
fragments Linux Node, fragments de plugins groupés, contrats de canaux, compatibilité Node 22,
`check`, `check-additional`, test de fumée de build, vérifications de docs, Skills Python,
Windows, macOS, Android et i18n de Control UI.

Utilisez cet environnement pour répondre à « l’arborescence source a-t-elle réussi la suite de tests normale complète ? »
Ce n’est pas la même chose que la validation produit du chemin de publication. Preuves à conserver :

- résumé `Full Release Validation` affichant l’URL de l’exécution `CI` déclenchée
- exécution `CI` verte sur le SHA cible exact
- noms des fragments en échec ou lents dans les jobs CI lors de l’analyse des régressions
- artefacts de chronométrage Vitest comme `.artifacts/vitest-shard-timings.json` lorsqu’une
  exécution nécessite une analyse de performance

Exécutez directement la CI manuelle uniquement lorsque la publication nécessite une CI normale déterministe, mais
pas les environnements Docker, QA Lab, direct, inter-OS ou paquet :

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

L’environnement Docker réside dans `OpenClaw Release Checks` via
`openclaw-live-and-e2e-checks-reusable.yml`, plus le workflow `install-smoke`
en mode publication. Il valide le candidat à la publication dans des environnements Docker empaquetés
au lieu de s’appuyer uniquement sur des tests au niveau source.

La couverture Docker de publication inclut :

- test de fumée d’installation complet avec le test de fumée lent d’installation globale Bun activé
- préparation/réutilisation de l’image de fumée du Dockerfile racine par SHA cible, avec les jobs QR,
  racine/Gateway et fumée installateur/Bun exécutés comme fragments install-smoke séparés
- voies E2E du dépôt
- segments Docker du chemin de publication : `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` et
  `bundled-channels-contracts`
- couverture OpenWebUI dans le segment `plugins-runtime-services` lorsqu’elle est demandée
- voies de dépendances des canaux groupés divisées entre les segments channel-smoke, update-target
  et contrats setup/runtime au lieu d’un grand job de canal groupé unique
- voies divisées d’installation/désinstallation de plugins groupés
  `bundled-plugin-install-uninstall-0` à
  `bundled-plugin-install-uninstall-23`
- suites de fournisseurs live/E2E et couverture de modèles Docker en direct lorsque les vérifications de publication
  incluent des suites en direct

Utilisez les artefacts Docker avant de relancer. Le planificateur du chemin de publication téléverse
`.artifacts/docker-tests/` avec les journaux de voies, `summary.json`, `failures.json`,
les temps de phase, le JSON du plan du planificateur et les commandes de relance. Pour une récupération ciblée,
utilisez `docker_lanes=<lane[,lane]>` sur le workflow live/E2E réutilisable au lieu de
relancer tous les segments de publication. Les commandes de relance générées incluent le
`package_artifact_run_id` précédent et les entrées d’image Docker préparée lorsqu’elles sont disponibles, afin qu’une
voie en échec puisse réutiliser la même archive tar et les images GHCR.

### Labo QA

L’environnement QA Lab fait également partie de `OpenClaw Release Checks`. C’est la porte de publication
du comportement agentique et du niveau canal, distincte de Vitest et des mécanismes de paquet Docker.

La couverture QA Lab de publication inclut :

- porte de parité simulée comparant la voie candidate OpenAI à la référence Opus 4.6
  à l’aide du paquet de parité agentique
- profil QA Matrix rapide en direct utilisant l’environnement `qa-live-shared`
- voie QA Telegram en direct utilisant les baux d’identifiants Convex CI
- `pnpm qa:otel:smoke` lorsque la télémétrie de publication nécessite une preuve locale explicite

Utilisez cet environnement pour répondre à « la publication se comporte-t-elle correctement dans les scénarios QA et
les flux de canaux en direct ? » Conservez les URL d’artefacts pour les voies de parité, Matrix et Telegram
lors de l’approbation de la publication. La couverture Matrix complète reste disponible sous forme d’exécution QA-Lab
manuelle fragmentée plutôt que comme voie critique de publication par défaut.

### Paquet

L’environnement Paquet est la porte du produit installable. Il s’appuie sur
`Package Acceptance` et le résolveur
`scripts/resolve-openclaw-package-candidate.mjs`. Le résolveur normalise un
candidat en archive tar `package-under-test` consommée par Docker E2E, valide
l’inventaire du paquet, enregistre la version du paquet et le SHA-256, et garde la
référence du harnais de workflow séparée de la référence source du paquet.

Sources de candidats prises en charge :

- `source=npm` : `openclaw@beta`, `openclaw@latest` ou une version exacte de publication OpenClaw
- `source=ref` : empaqueter une branche, une étiquette ou un SHA de commit complet `package_ref` approuvé
  avec le harnais `workflow_ref` sélectionné
- `source=url` : télécharger un `.tgz` HTTPS avec `package_sha256` requis
- `source=artifact` : réutiliser un `.tgz` téléversé par une autre exécution GitHub Actions

`OpenClaw Release Checks` exécute Package Acceptance avec `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` et
`telegram_mode=mock-openai`. Les segments Docker du chemin de publication couvrent les
voies d’installation, de mise à jour et de mise à jour de Plugin qui se recoupent ; Package Acceptance conserve
la compatibilité des canaux groupés native aux artefacts, les fixtures de plugins hors ligne et la QA de paquet
Telegram sur la même archive tar résolue. C’est le remplacement natif GitHub
de la majeure partie de la couverture paquet/mise à jour qui nécessitait auparavant
Parallels. Les vérifications de publication inter-OS restent importantes pour l’intégration initiale,
l’installateur et le comportement spécifiques à l’OS, mais la validation produit paquet/mise à jour doit
préférer Package Acceptance.

La tolérance héritée de package-acceptance est volontairement limitée dans le temps. Les paquets jusqu’à
`2026.4.25` peuvent utiliser le chemin de compatibilité pour les lacunes de métadonnées déjà publiées
sur npm : entrées d’inventaire QA privées absentes de l’archive tar, absence de
`gateway install --wrapper`, fichiers de correctif absents de la fixture git dérivée de l’archive tar,
absence de `update.channel` persisté, anciens emplacements d’enregistrements d’installation de plugins,
absence de persistance des enregistrements d’installation de marketplace et migration des métadonnées de configuration
pendant `plugins update`. Le paquet publié `2026.4.26` peut avertir
pour les fichiers d’horodatage de métadonnées de build local déjà livrés. Les paquets ultérieurs
doivent satisfaire les contrats de paquet modernes ; ces mêmes lacunes font échouer la
validation de publication.

Utilisez des profils Package Acceptance plus larges lorsque la question de publication porte sur un
vrai paquet installable :

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

- `smoke` : voies rapides d’installation de paquet/canal/agent, réseau du Gateway et rechargement
  de configuration
- `package` : contrats d’installation/mise à jour/paquet de Plugin sans ClawHub en direct ; c’est la valeur par défaut
  des vérifications de publication
- `product` : `package` plus canaux MCP, nettoyage cron/sous-agent, recherche web OpenAI
  et OpenWebUI
- `full` : segments Docker du chemin de publication avec OpenWebUI
- `custom` : liste `docker_lanes` exacte pour les relances ciblées

Pour une preuve Telegram de candidat paquet, activez `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` sur Package Acceptance. Le workflow transmet l’archive tar
`package-under-test` résolue à la voie Telegram ; le workflow Telegram autonome
accepte toujours une spécification npm publiée pour les vérifications post-publication.

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : étiquette de publication requise comme `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, elle peut aussi être le SHA de commit complet
  de 40 caractères de la branche de workflow actuelle pour une prévalidation seule
- `preflight_only` : `true` pour validation/build/paquet uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  l’archive tar préparée par l’exécution de prévalidation réussie
- `npm_dist_tag` : étiquette cible npm pour le chemin de publication ; par défaut `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : branche, étiquette ou SHA de commit complet à valider. Les vérifications portant des secrets
  exigent que le commit résolu soit joignable depuis une branche OpenClaw ou une
  étiquette de publication.

Règles :

- Les étiquettes stables et de correction peuvent publier vers `beta` ou `latest`
- Les étiquettes de prépublication bêta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` et `Full Release Validation` sont toujours
  seulement de validation
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que pendant la prévalidation ;
  le workflow vérifie ces métadonnées avant que la publication continue

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`

---
read_when:
    - Vous cherchez les définitions des canaux de publication publics
    - Vous cherchez la nomenclature des versions et la cadence
summary: Canaux de publication publics, nomenclature des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-25T13:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw a trois canaux de publication publics :

- stable : versions taguées qui publient sur npm `beta` par défaut, ou sur npm `latest` sur demande explicite
- beta : tags de préversion qui publient sur npm `beta`
- dev : la tête mobile de `main`

## Nomenclature des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de publication stable corrective : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de préversion bêta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- N’ajoutez pas de zéro initial au mois ou au jour
- `latest` désigne la publication npm stable promue actuelle
- `beta` désigne la cible d’installation bêta actuelle
- Les publications stables et correctives stables publient sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une version bêta validée
- Chaque publication stable d’OpenClaw livre ensemble le package npm et l’app macOS ;
  les publications bêta valident et publient normalement d’abord le chemin npm/package, avec
  la compilation/signature/notarisation de l’app Mac réservée aux versions stables sauf demande explicite

## Cadence des publications

- Les publications passent d’abord par bêta
- La version stable ne suit qu’une fois la dernière bêta validée
- Les mainteneurs créent normalement les publications à partir d’une branche `release/YYYY.M.D` créée
  depuis le `main` actuel, afin que la validation des publications et les correctifs ne bloquent pas les nouveaux
  développements sur `main`
- Si un tag bêta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag bêta
- La procédure détaillée de publication, les approbations, les identifiants et les notes de récupération sont
  réservées aux mainteneurs

## Vérifications préalables à la publication

- Exécutez `pnpm check:test-types` avant les vérifications préalables de publication afin que TypeScript de test reste
  couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant les vérifications préalables de publication afin que les vérifications plus larges
  des cycles d’import et des limites d’architecture soient vertes en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les
  artefacts de publication attendus `dist/*` et le bundle de l’interface Control UI existent pour l’étape
  de validation du pack
- Exécutez `pnpm release:check` avant chaque publication taguée
- Les vérifications de publication s’exécutent désormais dans un workflow manuel distinct :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute également la barrière de parité simulée QA Lab ainsi que les canaux QA
  en direct Matrix et Telegram avant l’approbation de la publication. Les canaux en direct utilisent l’environnement
  `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants Convex CI.
- La validation d’exécution d’installation et de mise à niveau multi-OS est déclenchée depuis le
  workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications en direct plus lentes restent sur leur
  propre voie afin qu’elles ne ralentissent ni ne bloquent la publication
- Les vérifications de publication doivent être déclenchées depuis la référence de workflow `main` ou depuis une
  référence de workflow `release/YYYY.M.D` afin que la logique de workflow et les secrets restent
  contrôlés
- Ce workflow accepte soit un tag de publication existant, soit le SHA de commit complet à 40 caractères
  actuel de la branche de workflow
- En mode SHA de commit, il n’accepte que le HEAD actuel de la branche de workflow ; utilisez un
  tag de publication pour les anciens commits de publication
- La vérification préalable en mode validation seule de `OpenClaw NPM Release` accepte également le
  SHA de commit complet à 40 caractères actuel de la branche de workflow sans exiger de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées
  du package ; la vraie publication nécessite toujours un vrai tag de publication
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des
  runners GitHub hébergés, tandis que le chemin de validation non modifiant peut utiliser les
  runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La vérification préalable de publication npm n’attend plus le canal distinct des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag bêta/correctif correspondant) avant approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/corrective correspondante) pour vérifier le chemin d’installation
  du registre publié dans un nouveau préfixe temporaire
- Après une publication bêta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’onboarding du package installé, la configuration Telegram et le vrai E2E Telegram
  sur le package npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les opérations ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants d’environnement `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter la même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est volontairement manuel uniquement et
  ne s’exécute pas sur chaque fusion.
- L’automatisation des publications des mainteneurs utilise désormais le mode preflight-then-promote :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de vérification préalable réussie
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler explicitement `latest` via une entrée du workflow
  - la mutation des dist-tags npm basée sur jeton se trouve désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le
    dépôt public conserve une publication OIDC uniquement
  - la `macOS Release` publique est réservée à la validation
  - la vraie publication Mac privée doit réussir les exécutions privées Mac
    `preflight_run_id` et `validate_run_id`
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    une nouvelle fois
- Pour les publications correctives stables comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie également le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les correctifs de publication ne puissent pas silencieusement laisser d’anciennes installations globales sur la
  charge utile stable de base
- La vérification préalable de publication npm échoue par défaut sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin que nous ne publiions plus un tableau de bord navigateur vide
- La vérification post-publication vérifie également que l’installation du registre publiée
  contient des dépendances d’exécution de Plugin intégrées non vides sous la structure racine `dist/*`.
  Une publication livrée avec des charges utiles de dépendances de Plugin intégrées manquantes ou vides
  échoue à la vérification post-publication et ne peut pas être promue
  vers `latest`.
- `pnpm test:install:smoke` applique également le budget `unpackedSize` du pack npm sur
  le tarball candidat à la mise à jour, afin que l’e2e de l’installateur détecte l’augmentation accidentelle de taille
  avant le chemin de publication
- Si le travail de publication a touché à la planification CI, aux manifestes de temporisation d’extension ou
  aux matrices de test d’extension, régénérez et examinez les sorties de matrice du workflow
  `checks-node-extensions` gérées par le planificateur depuis `.github/workflows/ci.yml`
  avant approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- L’état de préparation des publications macOS stables inclut également les surfaces de mise à jour :
  - la publication GitHub doit finir avec les fichiers packagés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après la publication
  - l’application packagée doit conserver un bundle id non debug, une URL de flux Sparkle non vide
    et un `CFBundleVersion` au moins égal au seuil canonique de build Sparkle
    pour cette version de publication

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, cela peut aussi être le
  SHA de commit complet à 40 caractères actuel de la branche de workflow pour une vérification préalable
  en validation seule
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  le tarball préparé depuis l’exécution de vérification préalable réussie
- `npm_dist_tag` : dist-tag npm cible pour le chemin de publication ; valeur par défaut `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de publication existant ou SHA de commit `main` complet à 40 caractères
  actuel à valider lorsqu’il est déclenché depuis `main` ; depuis une branche de publication, utilisez un
  tag de publication existant ou le SHA de commit complet à 40 caractères actuel de la branche de publication

Règles :

- Les tags stables et correctifs peuvent publier vers `beta` ou `latest`
- Les tags de préversion bêta peuvent publier uniquement vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` est toujours réservé à la validation et accepte également le
  SHA de commit actuel de la branche de workflow
- Le mode SHA de commit des vérifications de publication exige également le HEAD actuel de la branche de workflow
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la vérification préalable ;
  le workflow vérifie ces métadonnées avant que la publication continue

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet actuel de la branche de workflow
     pour une exécution à blanc en validation seule du workflow de vérification préalable
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement
   lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez séparément `OpenClaw Release Checks` avec le même tag ou le
   SHA complet actuel de la branche de workflow lorsque vous voulez la couverture en direct de mise en cache des prompts,
   de parité QA Lab, Matrix et Telegram
   - Cette séparation est intentionnelle afin que la couverture en direct reste disponible sans
     recoupler des vérifications longues ou instables au workflow de publication
4. Enregistrez le `preflight_run_id` réussi
5. Exécutez de nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag`, et le `preflight_run_id` enregistré
6. Si la publication a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la publication a été intentionnellement publiée directement sur `latest` et que `beta`
   doit immédiatement suivre la même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation
   auto-réparatrice planifiée déplacer `beta` plus tard

La mutation des dist-tags se trouve dans le dépôt privé pour des raisons de sécurité car elle
nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC uniquement.

Cela permet de documenter et de rendre visible pour les opérateurs à la fois le chemin de publication directe et le chemin de promotion beta-first.

Si un mainteneur doit revenir à une authentification npm locale, exécutez toute commande 1Password
CLI (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes et la gestion OTP observables et empêche les alertes répétées de l’hôte.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable procédure opérationnelle.

## Liens connexes

- [Canaux de publication](/fr/install/development-channels)

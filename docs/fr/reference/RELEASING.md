---
read_when:
    - Vous recherchez les définitions des canaux de publication publics
    - Vous recherchez la dénomination des versions et la cadence
summary: Canaux de publication publics, dénomination des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-23T07:10:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politique de publication

OpenClaw a trois canaux publics de publication :

- stable : versions taguées qui publient sur npm `beta` par défaut, ou sur npm `latest` lorsqu’on le demande explicitement
- beta : tags de prépublication qui publient sur npm `beta`
- dev : la tête mouvante de `main`

## Dénomination des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de publication stable corrective : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prépublication beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne mettez pas de zéro de remplissage pour le mois ou le jour
- `latest` signifie la version stable npm promue actuelle
- `beta` signifie la cible d’installation beta actuelle
- Les publications stables et stables correctives publient sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler explicitement `latest`, ou promouvoir plus tard une build beta validée
- Chaque publication stable d’OpenClaw livre ensemble le package npm et l’app macOS ;
  les publications beta valident et publient normalement d’abord le chemin npm/package, la
  build/signature/notarisation de l’app mac étant réservée au stable sauf demande explicite

## Cadence de publication

- Les publications passent d’abord par beta
- Stable ne suit qu’après validation de la dernière beta
- Les mainteneurs coupent normalement les publications depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation et les correctifs de publication ne bloquent pas le
  nouveau développement sur `main`
- Si un tag beta a été poussé ou publié et nécessite un correctif, les mainteneurs coupent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure détaillée de publication, les approbations, identifiants et notes de récupération sont
  réservés aux mainteneurs

## Preflight de publication

- Exécutez `pnpm check:test-types` avant le preflight de publication pour que le TypeScript de test reste
  couvert en dehors de la barrière locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le preflight de publication afin que les vérifications plus larges
  de cycles d’import et de limites d’architecture soient vertes en dehors de la barrière locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les
  artefacts de publication attendus `dist/*` et le bundle de l’interface de contrôle existent pour l’étape
  de validation du pack
- Exécutez `pnpm release:check` avant chaque publication taguée
- Les vérifications de publication s’exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la barrière de parité mock QA Lab ainsi que les
  canaux QA live Matrix et Telegram avant l’approbation de publication. Les canaux live utilisent l’environnement
  `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants Convex CI.
- La validation d’exécution d’installation et de mise à niveau inter-OS est lancée depuis le
  workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de publication npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans
  leur propre canal afin de ne pas retarder ou bloquer la publication
- Les vérifications de publication doivent être déclenchées depuis la référence de workflow `main` ou depuis une
  référence de workflow `release/YYYY.M.D` afin que la logique du workflow et les secrets restent
  contrôlés
- Ce workflow accepte soit un tag de publication existant, soit le SHA de commit complet à 40 caractères de la branche de workflow actuelle
- En mode SHA de commit, il n’accepte que le HEAD actuel de la branche de workflow ; utilisez un
  tag de publication pour des commits de publication plus anciens
- Le preflight de validation seule `OpenClaw NPM Release` accepte également le SHA complet à 40 caractères de la branche de workflow actuelle sans exiger de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en publication réelle
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées de package ; la vraie publication exige toujours un vrai tag de publication
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutant peut utiliser les
  runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le preflight de publication npm n’attend plus le canal séparé de vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correctif correspondant) avant l’approbation
- Après publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/corrective correspondante) pour vérifier le chemin d’installation du registre publié dans un préfixe temporaire neuf
- L’automatisation de publication mainteneur utilise maintenant preflight-then-promote :
  - la vraie publication npm doit réussir un `preflight_run_id` npm
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que celle du preflight réussi
  - les publications stables npm ciblent `beta` par défaut
  - une publication stable npm peut cibler explicitement `latest` via une entrée de workflow
  - la mutation de dist-tag npm basée sur token vit maintenant dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, parce que `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le dépôt
    public conserve une publication OIDC-only
  - la `macOS Release` publique est réservée à la validation
  - la vraie publication mac privée doit réussir les étapes privées mac
    `preflight_run_id` et `validate_run_id`
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    encore une fois
- Pour les publications stables correctives comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les correctifs de publication ne puissent pas silencieusement laisser les anciennes installations globales sur la charge utile stable de base
- Le preflight de publication npm échoue en mode fail-closed sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin d’éviter de republier un tableau de bord navigateur vide
- La vérification post-publication vérifie aussi que l’installation du registre publié
  contient des dépendances d’exécution non vides des plugins intégrés sous la disposition racine `dist/*`.
  Une publication livrée avec des charges utiles de dépendances de plugins intégrés manquantes ou vides échoue au vérificateur post-publication et ne peut pas être promue vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm sur
  le tarball candidat à la mise à jour, afin que l’e2e d’installation détecte un gonflement accidentel du pack
  avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifests de timing d’extensions ou
  les matrices de test d’extensions, régénérez et examinez les sorties de matrice de workflow
  `checks-node-extensions` possédées par le planificateur depuis `.github/workflows/ci.yml`
  avant approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- La préparation stable de publication macOS inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les `.zip`, `.dmg` et `.dSYM.zip` packagés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app packagée doit conserver un bundle id non debug, une URL de flux Sparkle
    non vide et un `CFBundleVersion` au moins égal au plancher de build Sparkle canonique
    pour cette version de publication

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi être le
  SHA de commit complet à 40 caractères de la branche de workflow actuelle pour un preflight de validation seule
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  le tarball préparé du preflight réussi
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; la valeur par défaut est `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de publication existant ou SHA complet à 40 caractères du commit
  `main` actuel à valider lorsqu’il est déclenché depuis `main` ; depuis une branche de publication, utilisez un
  tag de publication existant ou le SHA complet à 40 caractères du commit actuel de la branche de publication

Règles :

- Les tags stables et correctifs peuvent publier vers `beta` ou `latest`
- Les tags de prépublication beta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` est toujours réservé à la validation et accepte aussi le
  SHA de commit actuel de la branche de workflow
- Le mode SHA de commit des vérifications de publication exige aussi le HEAD actuel de la branche de workflow
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie ces métadonnées avant de continuer la publication

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA complet du commit
     de la branche de workflow actuelle pour un test à blanc de validation seule du workflow preflight
2. Choisissez `npm_dist_tag=beta` pour le flux beta-first normal, ou `latest` uniquement
   lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez `OpenClaw Release Checks` séparément avec le même tag ou le
   SHA complet actuel de la branche de workflow lorsque vous voulez la couverture live du cache de prompt,
   de la parité QA Lab, de Matrix et de Telegram
   - C’est séparé exprès afin que la couverture live reste disponible sans
     recoupler les vérifications longues ou instables au workflow de publication
4. Enregistrez le `preflight_run_id` réussi
5. Exécutez à nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré
6. Si la publication est arrivée sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la publication a été intentionnellement publiée directement sur `latest` et que `beta`
   doit suivre immédiatement la même build stable, utilisez ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation auto-réparatrice planifiée déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité parce qu’elle
nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC-only.

Cela maintient à la fois le chemin de publication directe et le chemin de promotion beta-first
documentés et visibles pour l’opérateur.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable runbook.

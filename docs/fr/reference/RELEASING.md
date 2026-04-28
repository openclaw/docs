---
read_when:
- Vous cherchez les définitions des canaux de release publics
- Running release validation or package acceptance
summary: Canaux de release publics, dénomination des versions, et cadence
title: Politique de release
x-i18n:
  generated_at: '2026-04-26T11:38:04Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
  source_path: reference/RELEASING.md
  workflow: 15
---

OpenClaw dispose de trois voies de release publiques :

- stable : releases taguées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsqu’une demande explicite est faite
- beta : tags de prérelease qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Dénomination des versions

- Version de release stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de release de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de prérelease beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- Ne pas ajouter de zéros en tête au mois ou au jour
- `latest` signifie la release npm stable promue actuelle
- `beta` signifie la cible d’installation beta actuelle
- Les releases stables et les releases de correction stable publient vers npm `beta` par défaut ; les opérateurs de release peuvent cibler explicitement `latest`, ou promouvoir plus tard un build beta validé
- Chaque release stable d’OpenClaw livre ensemble le package npm et l’app macOS ;
  les releases beta valident et publient normalement d’abord le chemin npm/package, avec
  la construction/signature/notarisation de l’app Mac réservée au stable sauf demande explicite

## Cadence des releases

- Les releases passent d’abord par beta
- Stable ne suit qu’après validation de la dernière beta
- Les mainteneurs créent normalement les releases depuis une branche `release/YYYY.M.D` créée
  à partir du `main` actuel, afin que la validation et les correctifs de release ne bloquent pas le nouveau
  développement sur `main`
- Si un tag beta a été poussé ou publié et nécessite un correctif, les mainteneurs créent
  le tag `-beta.N` suivant au lieu de supprimer ou recréer l’ancien tag beta
- La procédure détaillée de release, les approbations, les identifiants et les notes de récupération sont
  réservées aux mainteneurs

## Preflight de release

- Exécutez `pnpm check:test-types` avant le preflight de release afin que TypeScript de test reste
  couvert en dehors de la gate locale plus rapide `pnpm check`
- Exécutez `pnpm check:architecture` avant le preflight de release afin que les vérifications plus larges de
  cycles d’import et de frontières d’architecture soient au vert en dehors de la gate locale plus rapide
- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les
  artefacts de release attendus `dist/*` et le bundle Control UI existent pour l’étape de
  validation du pack
- Exécutez `pnpm qa:otel:smoke` lors de la validation de la télémétrie de release. Cela exerce
  QA-lab via un récepteur OTLP/HTTP local et vérifie les noms de spans de trace exportés,
  les attributs bornés, et l’expurgation du contenu/des identifiants sans
  nécessiter Opik, Langfuse, ou un autre collecteur externe.
- Exécutez `pnpm release:check` avant chaque release taguée
- Les vérifications de release s’exécutent désormais dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` exécute aussi la parity gate mock QA Lab ainsi que les lanes QA live
  Matrix et Telegram avant l’approbation de release. Les lanes live utilisent l’environnement
  `qa-live-shared` ; Telegram utilise aussi des baux d’identifiants CI Convex.
- La validation d’exécution d’installation et de mise à niveau cross-OS est déclenchée depuis le
  workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : garder le vrai chemin de release npm court,
  déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur
  propre voie afin de ne pas retarder ni bloquer la publication
- Les vérifications de release doivent être déclenchées depuis la ref de workflow `main` ou depuis une
  ref de workflow `release/YYYY.M.D` afin que la logique de workflow et les secrets restent
  contrôlés
- Ce workflow accepte soit un tag de release existant, soit le SHA de commit complet à
  40 caractères de la branche de workflow actuelle
- En mode SHA de commit, il n’accepte que le HEAD actuel de la branche de workflow ; utilisez un
  tag de release pour des commits de release plus anciens
- Le preflight de validation uniquement `OpenClaw NPM Release` accepte aussi le SHA complet à
  40 caractères actuel de la branche de workflow sans nécessiter de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en vraie publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées
  du package ; la vraie publication exige toujours un vrai tag de release
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des
  runners hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les
  runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le preflight de release npm n’attend plus la voie séparée de vérifications de release
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correction correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/correction correspondante) pour vérifier le chemin d’installation
  du registre publié dans un nouveau préfixe temporaire
- Après une publication beta, exécutez `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  pour vérifier l’intégration guidée du package installé, la configuration Telegram, et le vrai E2E Telegram
  sur le package npm publié en utilisant le pool partagé d’identifiants Telegram loués.
  Les exécutions ponctuelles locales des mainteneurs peuvent omettre les variables Convex et passer directement les trois
  identifiants env `OPENCLAW_QA_TELEGRAM_*`.
- Les mainteneurs peuvent exécuter cette même vérification post-publication depuis GitHub Actions via le
  workflow manuel `NPM Telegram Beta E2E`. Il est intentionnellement manuel uniquement et
  ne s’exécute pas à chaque merge.
- L’automatisation de release des mainteneurs utilise désormais preflight-then-promote :
  - la vraie publication npm doit réussir avec un `preflight_run_id` réussi
  - la vraie publication npm doit être déclenchée depuis la même branche `main` ou
    `release/YYYY.M.D` que l’exécution de preflight réussie
  - les releases npm stables utilisent par défaut `beta`
  - la publication npm stable peut cibler explicitement `latest` via une entrée de workflow
  - la mutation token-based du dist-tag npm se trouve désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, parce que `npm dist-tag add` nécessite toujours `NPM_TOKEN` tandis que le
    dépôt public conserve une publication OIDC uniquement
  - `macOS Release` public est réservé à la validation
  - la vraie publication privée mac doit réussir avec les exécutions privée mac
    `preflight_run_id` et `validate_run_id`
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire
    encore une fois
- Pour les releases de correction stable comme `YYYY.M.D-N`, le vérificateur post-publication
  vérifie aussi le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`
  afin que les corrections de release ne puissent pas laisser silencieusement des installations globales plus anciennes sur la charge utile stable de base
- Le preflight de release npm échoue en mode fermé sauf si le tarball inclut à la fois
  `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`
  afin que nous ne livrions plus un dashboard navigateur vide
- La vérification post-publication vérifie aussi que l’installation du registre publié
  contient des dépendances d’exécution non vides de Plugins intégrés sous la disposition racine `dist/*`.
  Une release livrée avec des charges utiles de dépendances de Plugin
  manquantes ou vides échoue au vérificateur post-publication et ne peut pas être promue
  vers `latest`.
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` de npm pack sur
  le tarball candidat à la mise à jour, afin que l’e2e de l’installateur détecte tout gonflement
  accidentel du pack avant le chemin de publication de release
- Si le travail de release a touché la planification CI, les manifestes de timing d’extension, ou
  les matrices de test d’extension, régénérez et examinez les sorties de matrice du workflow
  `checks-node-extensions` possédées par le planificateur depuis `.github/workflows/ci.yml`
  avant l’approbation afin que les notes de release ne décrivent pas une disposition CI obsolète
- La préparation d’une release macOS stable inclut aussi les surfaces de mise à jour :
  - la GitHub release doit se retrouver avec le `.zip`, `.dmg`, et `.dSYM.zip` packagés
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app packagée doit conserver un bundle id non-debug, une URL de flux Sparkle non vide,
    et un `CFBundleVersion` au moins égal au plancher canonique de build Sparkle
    pour cette version de release

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de release requis tel que `v2026.4.2`, `v2026.4.2-1`, ou
  `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, cela peut aussi être le
  SHA de commit complet à 40 caractères actuel de la branche de workflow pour un preflight de validation uniquement
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le
  vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise
  le tarball préparé de l’exécution de preflight réussie
- `npm_dist_tag` : tag npm cible pour le chemin de publication ; vaut par défaut `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de release existant ou SHA de commit complet actuel à 40 caractères de `main`
  à valider lorsqu’il est déclenché depuis `main` ; depuis une branche de release, utilisez un
  tag de release existant ou le SHA de commit complet actuel à 40 caractères de la branche de release

Règles :

- Les tags stables et de correction peuvent publier soit vers `beta` soit vers `latest`
- Les tags de prérelease beta ne peuvent publier que vers `beta`
- Pour `OpenClaw NPM Release`, l’entrée SHA de commit complet n’est autorisée que lorsque
  `preflight_only=true`
- `OpenClaw Release Checks` est toujours réservé à la validation et accepte aussi le
  SHA de commit actuel de la branche de workflow
- Le mode SHA de commit des vérifications de release exige aussi le HEAD actuel de la branche de workflow
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le preflight ;
  le workflow vérifie que ces métadonnées restent inchangées avant la publication

## Séquence de release npm stable

Lors de la création d’une release npm stable :

1. Exécuter `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag existe, vous pouvez utiliser le SHA de commit complet actuel de la branche de workflow
     pour une exécution à blanc de validation uniquement du workflow de preflight
2. Choisir `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement
   lorsque vous voulez intentionnellement une publication stable directe
3. Exécuter `OpenClaw Release Checks` séparément avec le même tag ou le
   SHA complet actuel de la branche de workflow lorsque vous voulez une couverture live du cache de prompt,
   de parité QA Lab, Matrix, et Telegram
   - Cela est séparé volontairement afin que la couverture live reste disponible sans
     recoupler des vérifications longues ou instables au workflow de publication
4. Conserver le `preflight_run_id` réussi
5. Exécuter de nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même
   `tag`, le même `npm_dist_tag`, et le `preflight_run_id` conservé
6. Si la release a été publiée sur `beta`, utiliser le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la release a intentionnellement été publiée directement vers `latest` et que `beta`
   doit suivre immédiatement le même build stable, utiliser ce même workflow privé
   pour faire pointer les deux dist-tags vers la version stable, ou laisser sa
   synchronisation auto-réparatrice planifiée déplacer `beta` plus tard

La mutation de dist-tag vit dans le dépôt privé pour des raisons de sécurité parce qu’elle
nécessite toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC uniquement.

Cela permet de documenter et de rendre visible pour les opérateurs à la fois le chemin de publication direct et le chemin de promotion beta-first.

Si un mainteneur doit revenir à une authentification npm locale, exécutez toutes les commandes 1Password
CLI (`op`) uniquement dans une session tmux dédiée. N’appelez pas `op`
directement depuis le shell principal de l’agent ; le garder dans tmux rend les invites,
alertes, et la gestion OTP observables et évite des alertes répétées sur l’hôte.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de release dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
pour le vrai guide opérationnel.

## Associé

- [Canaux de release](/fr/install/development-channels)

---
read_when:
    - À la recherche des définitions des canaux de publication publics
    - À la recherche du nommage des versions et de la cadence
summary: Canaux de publication publics, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-14T06:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3eaf9f1786b8c9fd4f5a9c657b623cb69d1a485958e1a9b8f108511839b63587
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politique de publication

OpenClaw a trois canaux de publication publics :

- stable : versions taguées qui publient sur npm `beta` par défaut, ou sur npm `latest` lorsqu’elles sont explicitement demandées
- beta : tags de préversion qui publient sur npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Tag Git : `vYYYY.M.D`
- Version de publication de correction stable : `YYYY.M.D-N`
  - Tag Git : `vYYYY.M.D-N`
- Version de préversion beta : `YYYY.M.D-beta.N`
  - Tag Git : `vYYYY.M.D-beta.N`
- N’ajoutez pas de zéro de remplissage au mois ou au jour
- `latest` signifie la version npm stable promue actuelle
- `beta` signifie la cible d’installation beta actuelle
- Les versions stables et les versions de correction stable publient sur npm `beta` par défaut ; les opérateurs de publication peuvent cibler `latest` explicitement, ou promouvoir plus tard une build beta validée
- Chaque version d’OpenClaw livre le package npm et l’app macOS ensemble

## Cadence de publication

- Les publications passent d’abord par beta
- Stable ne suit qu’une fois la dernière beta validée
- La procédure de publication détaillée, les approbations, les identifiants et les notes de récupération sont réservés aux mainteneurs

## Vérifications préalables à la publication

- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication `dist/*` attendus et le bundle de l’UI de contrôle existent pour l’étape de validation du pack
- Exécutez `pnpm release:check` avant chaque publication taguée
- Les vérifications de publication s’exécutent maintenant dans un workflow manuel séparé :
  `OpenClaw Release Checks`
- Cette séparation est intentionnelle : elle garde le vrai chemin de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur propre canal pour ne pas retarder ou bloquer la publication
- Les vérifications de publication doivent être déclenchées depuis la ref de workflow `main` afin que la logique du workflow et les secrets restent canoniques
- Ce workflow accepte soit un tag de publication existant, soit le SHA de commit `main` complet actuel à 40 caractères
- En mode SHA de commit, il n’accepte que le HEAD actuel de `origin/main` ; utilisez un tag de publication pour les anciens commits de publication
- La pré-vérification en validation seule de `OpenClaw NPM Release` accepte également le SHA de commit `main` complet actuel à 40 caractères sans nécessiter de tag poussé
- Ce chemin SHA est réservé à la validation et ne peut pas être promu en véritable publication
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées du package ; la vraie publication exige toujours un vrai tag de publication
- Les deux workflows gardent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant à la fois les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- La pré-vérification de publication npm n’attend plus le canal séparé des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou le tag beta/correction correspondant) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version beta/correction correspondante) pour vérifier le chemin d’installation du registre publié dans un préfixe temporaire frais
- L’automatisation de publication des mainteneurs utilise désormais le modèle pré-vérification puis promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` de pré-vérification réussi
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler `latest` explicitement via une entrée du workflow
  - la promotion npm stable de `beta` vers `latest` reste disponible en mode manuel explicite dans le workflow de confiance `OpenClaw NPM Release`
  - les publications stables directes peuvent également exécuter un mode explicite de synchronisation des dist-tags qui fait pointer `latest` et `beta` vers la version stable déjà publiée
  - ces modes de dist-tag nécessitent toujours un `NPM_TOKEN` valide dans l’environnement `npm-release`, car la gestion des `dist-tag` npm est distincte de la publication de confiance
  - la publication publique `macOS Release` est réservée à la validation
  - la vraie publication privée mac doit réussir avec des `preflight_run_id` et `validate_run_id` privés mac réussis
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire une nouvelle fois
- Pour les versions de correction stable comme `YYYY.M.D-N`, le vérificateur post-publication vérifie également le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N`, afin que les corrections de publication ne puissent pas laisser silencieusement les anciennes installations globales sur la charge utile stable de base
- La pré-vérification de publication npm échoue en mode fermé sauf si le tarball inclut à la fois `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/`, afin d’éviter de livrer à nouveau un tableau de bord navigateur vide
- `pnpm test:install:smoke` applique également le budget `unpackedSize` du `npm pack` sur le tarball candidat à la mise à jour, afin que l’e2e de l’installateur détecte toute augmentation accidentelle de taille du pack avant le chemin de publication
- Si le travail de publication a touché la planification CI, les manifestes de timing des extensions ou les matrices de test des extensions, régénérez et examinez les sorties de matrice du workflow `checks-node-extensions` gérées par le planificateur depuis `.github/workflows/ci.yml` avant l’approbation, afin que les notes de publication ne décrivent pas une disposition CI obsolète
- La préparation d’une version macOS stable inclut également les surfaces de mise à jour :
  - la publication GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` au moins égal au plancher canonique de build Sparkle pour cette version

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : tag de publication requis tel que `v2026.4.2`, `v2026.4.2-1` ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, il peut aussi s’agir du SHA de commit `main` complet actuel à 40 caractères pour une pré-vérification en validation seule
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le vrai chemin de publication
- `preflight_run_id` : requis sur le vrai chemin de publication afin que le workflow réutilise le tarball préparé depuis l’exécution de pré-vérification réussie
- `npm_dist_tag` : tag cible npm pour le chemin de publication ; vaut `beta` par défaut
- `promote_beta_to_latest` : `true` pour ignorer la publication et déplacer une build stable `beta` déjà publiée vers `latest`
- `sync_stable_dist_tags` : `true` pour ignorer la publication et faire pointer `latest` et `beta` vers une version stable déjà publiée

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : tag de publication existant ou SHA de commit `main` complet actuel à 40 caractères à valider

Règles :

- Les tags stables et de correction peuvent publier vers `beta` ou `latest`
- Les tags de préversion beta ne peuvent publier que vers `beta`
- L’entrée SHA de commit complet n’est autorisée que lorsque `preflight_only=true`
- Le mode SHA de commit des vérifications de publication exige également le HEAD actuel de `origin/main`
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant la pré-vérification ; le workflow vérifie ces métadonnées avant de poursuivre la publication
- Le mode promotion doit utiliser un tag stable ou de correction, `preflight_only=false`, un `preflight_run_id` vide et `npm_dist_tag=beta`
- Le mode de synchronisation des dist-tags doit utiliser un tag stable ou de correction, `preflight_only=false`, un `preflight_run_id` vide, `npm_dist_tag=latest` et `promote_beta_to_latest=false`
- Les modes promotion et synchronisation des dist-tags exigent également un `NPM_TOKEN` valide, car `npm dist-tag add` nécessite toujours une authentification npm classique ; la publication de confiance couvre uniquement le chemin de publication du package

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’un tag n’existe, vous pouvez utiliser le SHA de commit `main` complet actuel pour un essai à sec en validation seule du workflow de pré-vérification
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez `OpenClaw Release Checks` séparément avec le même tag ou le SHA complet actuel de `main` lorsque vous voulez une couverture live du cache de prompt
   - Cette séparation est intentionnelle afin que la couverture live reste disponible sans recoupler des vérifications longues ou instables au workflow de publication
4. Enregistrez le `preflight_run_id` réussi
5. Exécutez à nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré
6. Si la publication est arrivée sur `beta`, exécutez plus tard `OpenClaw NPM Release` avec le même `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`, un `preflight_run_id` vide et `npm_dist_tag=beta` lorsque vous souhaitez déplacer cette build publiée vers `latest`
7. Si la publication a été intentionnellement publiée directement sur `latest` et que `beta` doit suivre la même build stable, exécutez `OpenClaw NPM Release` avec le même `tag` stable, `sync_stable_dist_tags=true`, `promote_beta_to_latest=false`, `preflight_only=false`, un `preflight_run_id` vide et `npm_dist_tag=latest`

Les modes promotion et synchronisation des dist-tags nécessitent toujours l’approbation de l’environnement `npm-release` et un `NPM_TOKEN` valide accessible à cette exécution du workflow.

Cela permet de garder à la fois le chemin de publication directe et le chemin de promotion beta-first documentés et visibles pour l’opérateur.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation privée de publication dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable runbook.

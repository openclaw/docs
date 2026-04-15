---
read_when:
    - À la recherche des définitions des canaux de publication publics
    - À la recherche du nommage des versions et de la cadence
summary: Canaux de publication publics, nommage des versions et cadence
title: Politique de publication
x-i18n:
    generated_at: "2026-04-15T06:56:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politique de publication

OpenClaw a trois canaux de publication publics :

- stable : des publications balisées qui publient vers npm `beta` par défaut, ou vers npm `latest` lorsqu’elles sont demandées explicitement
- beta : des balises de prépublication qui publient vers npm `beta`
- dev : la tête mobile de `main`

## Nommage des versions

- Version de publication stable : `YYYY.M.D`
  - Balise Git : `vYYYY.M.D`
- Version de publication de correction stable : `YYYY.M.D-N`
  - Balise Git : `vYYYY.M.D-N`
- Version de prépublication bêta : `YYYY.M.D-beta.N`
  - Balise Git : `vYYYY.M.D-beta.N`
- Ne mettez pas de zéro non significatif pour le mois ou le jour
- `latest` signifie la publication npm stable promue actuelle
- `beta` signifie la cible d’installation bêta actuelle
- Les publications stables et les publications de correction stable publient vers npm `beta` par défaut ; les opérateurs de publication peuvent cibler `latest` explicitement, ou promouvoir plus tard une build bêta validée
- Chaque publication OpenClaw livre le package npm et l’app macOS ensemble

## Cadence de publication

- Les publications passent d’abord par beta
- stable ne suit qu’après validation de la dernière bêta
- La procédure de publication détaillée, les approbations, les identifiants et les notes de reprise sont réservés aux mainteneurs

## Vérifications préalables à la publication

- Exécutez `pnpm build && pnpm ui:build` avant `pnpm release:check` afin que les artefacts de publication attendus `dist/*` et le bundle de l’interface Control UI existent pour l’étape de validation du pack
- Exécutez `pnpm release:check` avant chaque publication balisée
- Les vérifications de publication s’exécutent désormais dans un workflow manuel distinct :
  `OpenClaw Release Checks`
- La validation d’exécution d’installation et de mise à niveau multi-OS est déclenchée depuis le workflow appelant privé
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  qui invoque le workflow public réutilisable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Cette séparation est intentionnelle : elle permet de garder le chemin réel de publication npm court, déterministe et centré sur les artefacts, tandis que les vérifications live plus lentes restent dans leur propre canal afin de ne pas ralentir ni bloquer la publication
- Les vérifications de publication doivent être déclenchées depuis la référence de workflow `main` afin que la logique du workflow et les secrets restent canoniques
- Ce workflow accepte soit une balise de publication existante, soit le SHA de commit complet actuel de `main` sur 40 caractères
- En mode SHA de commit, il n’accepte que la HEAD actuelle de `origin/main` ; utilisez une balise de publication pour les anciens commits de publication
- Le contrôle préalable en validation seule de `OpenClaw NPM Release` accepte également le SHA de commit complet actuel de `main` sur 40 caractères sans exiger de balise déjà poussée
- Ce chemin SHA est uniquement destiné à la validation et ne peut pas être promu en publication réelle
- En mode SHA, le workflow synthétise `v<package.json version>` uniquement pour la vérification des métadonnées du package ; la publication réelle exige toujours une véritable balise de publication
- Les deux workflows conservent le vrai chemin de publication et de promotion sur des runners hébergés par GitHub, tandis que le chemin de validation non mutatif peut utiliser les runners Linux Blacksmith plus grands
- Ce workflow exécute
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  en utilisant les secrets de workflow `OPENAI_API_KEY` et `ANTHROPIC_API_KEY`
- Le contrôle préalable de publication npm n’attend plus le canal distinct des vérifications de publication
- Exécutez `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou la balise bêta/correction correspondante) avant l’approbation
- Après la publication npm, exécutez
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou la version bêta/correction correspondante) pour vérifier le chemin d’installation publié depuis le registre dans un préfixe temporaire propre
- L’automatisation de publication des mainteneurs utilise désormais le flux contrôle préalable puis promotion :
  - la vraie publication npm doit réussir avec un `preflight_run_id` npm valide
  - les publications npm stables ciblent `beta` par défaut
  - la publication npm stable peut cibler `latest` explicitement via une entrée de workflow
  - la mutation par jeton des dist-tags npm se trouve désormais dans
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    pour des raisons de sécurité, car `npm dist-tag add` exige toujours `NPM_TOKEN` alors que le dépôt public conserve une publication OIDC uniquement
  - la `macOS Release` publique est uniquement destinée à la validation
  - la véritable publication privée mac doit réussir avec des `preflight_run_id` et `validate_run_id` privés valides
  - les vrais chemins de publication promeuvent des artefacts préparés au lieu de les reconstruire une nouvelle fois
- Pour les publications de correction stable comme `YYYY.M.D-N`, le vérificateur post-publication contrôle également le même chemin de mise à niveau en préfixe temporaire de `YYYY.M.D` vers `YYYY.M.D-N` afin que les corrections de publication ne puissent pas laisser silencieusement d’anciennes installations globales sur la charge utile stable de base
- Le contrôle préalable de publication npm échoue par défaut sauf si le tarball inclut à la fois `dist/control-ui/index.html` et une charge utile non vide `dist/control-ui/assets/` afin d’éviter d’expédier à nouveau un tableau de bord navigateur vide
- `pnpm test:install:smoke` applique aussi le budget `unpackedSize` du pack npm au tarball de mise à jour candidat, afin que l’E2E de l’installateur détecte toute augmentation accidentelle de taille du pack avant le chemin de publication
- Si le travail de publication a touché à la planification CI, aux manifestes de timing des extensions ou aux matrices de test des extensions, régénérez et examinez les sorties de matrice de workflow `checks-node-extensions` gérées par le planificateur à partir de `.github/workflows/ci.yml` avant l’approbation afin que les notes de publication ne décrivent pas une disposition CI obsolète
- L’état de préparation d’une publication macOS stable inclut aussi les surfaces de mise à jour :
  - la publication GitHub doit finir avec les fichiers empaquetés `.zip`, `.dmg` et `.dSYM.zip`
  - `appcast.xml` sur `main` doit pointer vers le nouveau zip stable après la publication
  - l’app empaquetée doit conserver un identifiant de bundle non debug, une URL de flux Sparkle non vide et un `CFBundleVersion` supérieur ou égal au plancher canonique de build Sparkle pour cette version de publication

## Entrées du workflow NPM

`OpenClaw NPM Release` accepte ces entrées contrôlées par l’opérateur :

- `tag` : balise de publication requise telle que `v2026.4.2`, `v2026.4.2-1`, ou `v2026.4.2-beta.1` ; lorsque `preflight_only=true`, cela peut aussi être le SHA de commit complet actuel de `main` sur 40 caractères pour un contrôle préalable de validation seule
- `preflight_only` : `true` pour validation/build/package uniquement, `false` pour le vrai chemin de publication
- `preflight_run_id` : requis pour le vrai chemin de publication afin que le workflow réutilise le tarball préparé depuis l’exécution de contrôle préalable réussie
- `npm_dist_tag` : dist-tag npm cible pour le chemin de publication ; la valeur par défaut est `beta`

`OpenClaw Release Checks` accepte ces entrées contrôlées par l’opérateur :

- `ref` : balise de publication existante ou SHA de commit complet actuel de `main` sur 40 caractères à valider

Règles :

- Les balises stables et de correction peuvent publier vers `beta` ou `latest`
- Les balises de prépublication bêta ne peuvent publier que vers `beta`
- L’entrée SHA de commit complet n’est autorisée que lorsque `preflight_only=true`
- Le mode SHA de commit des vérifications de publication exige également la HEAD actuelle de `origin/main`
- Le vrai chemin de publication doit utiliser le même `npm_dist_tag` que celui utilisé pendant le contrôle préalable ; le workflow vérifie ces métadonnées avant de poursuivre la publication

## Séquence de publication npm stable

Lors de la création d’une publication npm stable :

1. Exécutez `OpenClaw NPM Release` avec `preflight_only=true`
   - Avant qu’une balise n’existe, vous pouvez utiliser le SHA de commit complet actuel de `main` pour une exécution à blanc de validation seule du workflow de contrôle préalable
2. Choisissez `npm_dist_tag=beta` pour le flux normal beta-first, ou `latest` uniquement lorsque vous souhaitez intentionnellement une publication stable directe
3. Exécutez `OpenClaw Release Checks` séparément avec la même balise ou le SHA complet actuel de `main` lorsque vous voulez une couverture live du cache de prompt
   - Cette séparation est intentionnelle afin que la couverture live reste disponible sans recoupler des vérifications longues ou instables au workflow de publication
4. Enregistrez le `preflight_run_id` réussi
5. Exécutez à nouveau `OpenClaw NPM Release` avec `preflight_only=false`, le même `tag`, le même `npm_dist_tag` et le `preflight_run_id` enregistré
6. Si la publication a atterri sur `beta`, utilisez le workflow privé
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   pour promouvoir cette version stable de `beta` vers `latest`
7. Si la publication a été intentionnellement publiée directement vers `latest` et que `beta` doit suivre immédiatement avec la même build stable, utilisez ce même workflow privé pour faire pointer les deux dist-tags vers la version stable, ou laissez sa synchronisation d’autoréparation planifiée déplacer `beta` plus tard

La mutation des dist-tags se trouve dans le dépôt privé pour des raisons de sécurité, car elle exige toujours `NPM_TOKEN`, tandis que le dépôt public conserve une publication OIDC uniquement.

Cela permet de documenter et de rendre visible aux opérateurs à la fois le chemin de publication directe et le chemin de promotion beta-first.

## Références publiques

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Les mainteneurs utilisent la documentation de publication privée dans
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
comme véritable runbook.

---
read_when:
    - Vous voulez basculer entre stable/bêta/dev
    - Vous souhaitez épingler une version, une étiquette ou un SHA spécifique
    - Vous créez des tags ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et de développement : sémantique, basculement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-05-06T07:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw propose trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est actuel ; si beta est absent ou plus ancien que
  la dernière version stable, le flux de mise à jour se rabat sur `latest`.
- **dev** : tête mobile de `main` (git). dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements incompatibles. Ne l’utilisez pas pour des Gateway de production.

Nous publions généralement d’abord les builds stables sur **beta**, les testons à cet endroit, puis exécutons une
étape de promotion explicite qui déplace le build validé vers `latest` sans
changer le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement vers `latest` si nécessaire. Les dist-tags sont la source de vérité pour les installations npm.

## Changer de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserve votre choix dans la configuration (`update.channel`) et aligne la
méthode d’installation :

- **`stable`** (installations de paquet) : mises à jour via le dist-tag npm `latest`.
- **`beta`** (installations de paquet) : privilégie le dist-tag npm `beta`, mais se rabat sur
  `latest` lorsque `beta` est absent ou plus ancien que l’étiquette stable actuelle.
- **`stable`** (installations git) : extrait la dernière étiquette git stable.
- **`beta`** (installations git) : privilégie la dernière étiquette git beta, mais se rabat sur
  la dernière étiquette git stable lorsque beta est absent ou plus ancien.
- **`dev`** : garantit un checkout git (`~/openclaw` par défaut, remplaçable avec
  `OPENCLAW_GIT_DIR`), bascule vers `main`, rebase sur l’amont, construit et
  installe la CLI globale depuis ce checkout.

<Tip>
Si vous voulez utiliser stable et dev en parallèle, conservez deux clones et faites pointer votre Gateway vers le clone stable.
</Tip>

## Cibler ponctuellement une version ou une étiquette

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de paquet précis pour une seule
mise à jour **sans** modifier votre canal conservé :

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Remarques :

- `--tag` s’applique **uniquement aux installations de paquet (npm)**. Les installations git l’ignorent.
- L’étiquette n’est pas conservée. Votre prochain `openclaw update` utilise votre canal configuré
  comme d’habitude.
- Protection contre le retour à une version antérieure : si la version cible est plus ancienne que votre version actuelle,
  OpenClaw demande une confirmation (à ignorer avec `--yes`).
- `--channel beta` est différent de `--tag beta` : le flux de canal peut se rabattre
  sur stable/latest lorsque beta est absent ou plus ancien, tandis que `--tag beta` cible le
  dist-tag `beta` brut pour cette seule exécution.

## Simulation

Prévisualisez ce que `openclaw update` ferait sans effectuer de changements :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulation affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de retour à une version antérieure serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise également les sources des plugins :

- `dev` privilégie les plugins inclus dans le checkout git.
- `stable` et `beta` restaurent les paquets de plugins installés via npm.
- Les plugins installés via npm sont mis à jour une fois la mise à jour du cœur terminée.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou paquet), la version actuelle et
la source (configuration, étiquette git, branche git ou valeur par défaut).

## Bonnes pratiques d’étiquetage

- Étiquetez les versions sur lesquelles vous voulez que les checkouts git arrivent (`vYYYY.M.D` pour stable,
  `vYYYY.M.D-beta.N` pour beta).
- `vYYYY.M.D.beta.N` est également reconnu pour compatibilité, mais préférez `-beta.N`.
- Les anciennes étiquettes `vYYYY.M.D-<patch>` sont toujours reconnues comme stables (non beta).
- Gardez les étiquettes immuables : ne déplacez ou ne réutilisez jamais une étiquette.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidat ou build stable publié d’abord sur beta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’app macOS

Les builds beta et dev peuvent **ne pas** inclure de publication d’app macOS. C’est acceptable :

- L’étiquette git et le dist-tag npm peuvent quand même être publiés.
- Indiquez « pas de build macOS pour cette beta » dans les notes de publication ou le changelog.

## Connexe

- [Mise à jour](/fr/install/updating)
- [Fonctionnement interne de l’installateur](/fr/install/installer)

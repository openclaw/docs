---
read_when:
    - Vous voulez basculer entre stable/beta/dev
    - Vous voulez épingler une version, un tag ou un SHA spécifique
    - Vous créez des tags ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et dev : sémantique, basculement, épinglage et balisage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-05-07T01:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw propose trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est à jour ; si beta est absent ou antérieur à
  la dernière version stable, le flux de mise à jour se rabat sur `latest`.
- **dev** : tête mouvante de `main` (git). dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements incompatibles. Ne l’utilisez pas pour des gateways de production.

Nous publions généralement les builds stables d’abord sur **beta**, nous les testons là,
puis nous exécutons une étape de promotion explicite qui déplace le build validé vers `latest` sans
modifier le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement sur `latest` si nécessaire. Les dist-tags sont la source de vérité pour les installations npm.

## Lignes de support mensuelles prévues

OpenClaw ne propose pas encore de canal LTS ni de support mensuel. Nous travaillons
à des lignes de support mensuelles compatibles avec SemVer afin que les utilisateurs puissent rester sur une ligne plus calme
pendant que `latest` continue d’avancer rapidement.

La forme de version prévue est `YYYY.M.PATCH` :

- `YYYY` est l’année.
- `M` est la ligne de publication mensuelle, sans zéro initial.
- `PATCH` s’incrémente dans cette ligne mensuelle et peut dépasser 100 si nécessaire.

Exemples de futurs tags :

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` pour la ligne de juin.
- `v2026.6.3-beta.1` pour une préversion sur le train rapide/latest.
- Un futur dist-tag de ligne de support tel que `stable-2026-6` ou `lts-2026-6` pourrait
  pointer vers une ligne mensuelle, mais aucun canal de ce type n’est disponible aujourd’hui.

Jusqu’à ce que cette migration soit disponible, les canaux de mise à jour publics restent `stable`, `beta`
et `dev`.

## Changer de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserve votre choix dans la configuration (`update.channel`) et aligne la
méthode d’installation :

- **`stable`** (installations par package) : met à jour via le dist-tag npm `latest`.
- **`beta`** (installations par package) : privilégie le dist-tag npm `beta`, mais se rabat sur
  `latest` lorsque `beta` est absent ou antérieur au tag stable actuel.
- **`stable`** (installations git) : extrait le dernier tag git stable.
- **`beta`** (installations git) : privilégie le dernier tag git beta, mais se rabat sur
  le dernier tag git stable lorsque beta est absent ou antérieur.
- **`dev`** : garantit une copie de travail git (par défaut `~/openclaw`, remplaçable avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, rebase sur l’amont, build, puis
  installe la CLI globale depuis cette copie de travail.

<Tip>
Si vous voulez stable et dev en parallèle, conservez deux clones et faites pointer votre gateway vers celui en stable.
</Tip>

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de package spécifique pour une seule
mise à jour **sans** modifier votre canal conservé :

```bash
# Installer une version spécifique
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag beta (ponctuel, non conservé)
openclaw update --tag beta

# Installer depuis la branche GitHub main (tarball npm)
openclaw update --tag main

# Installer une spécification de package npm spécifique
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notes :

- `--tag` s’applique uniquement aux **installations par package (npm)**. Les installations git l’ignorent.
- Le tag n’est pas conservé. Votre prochain `openclaw update` utilise votre canal configuré
  comme d’habitude.
- Protection contre les rétrogradations : si la version cible est antérieure à votre version actuelle,
  OpenClaw demande une confirmation (à ignorer avec `--yes`).
- `--channel beta` diffère de `--tag beta` : le flux de canal peut se rabattre
  sur stable/latest lorsque beta est absent ou antérieur, tandis que `--tag beta` cible le
  dist-tag `beta` brut pour cette exécution unique.

## Simulation

Prévisualisez ce que ferait `openclaw update` sans apporter de modifications :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulation affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de rétrogradation serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise aussi les sources des plugins :

- `dev` privilégie les plugins groupés depuis la copie de travail git.
- `stable` et `beta` restaurent les packages de plugins installés via npm.
- Les plugins installés via npm sont mis à jour une fois la mise à jour du cœur terminée.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou package), la version actuelle et
la source (configuration, tag git, branche git ou valeur par défaut).

## Bonnes pratiques de tagging

- Taguez les versions sur lesquelles vous voulez que les copies de travail git arrivent (`vYYYY.M.D` pour les versions
  stables actuelles, `vYYYY.M.D-beta.N` pour les versions beta actuelles).
- `vYYYY.M.D.beta.N` est également reconnu pour la compatibilité, mais préférez `-beta.N`.
- Les tags hérités `vYYYY.M.D-<patch>` sont encore reconnus comme stables (non-beta),
  mais le modèle de support mensuel prévu utilisera des numéros de patch normaux
  (`vYYYY.M.PATCH`) au lieu d’un suffixe de correction avec trait d’union.
- Gardez les tags immuables : ne déplacez ni ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidat ou build stable d’abord publié sur beta
  - `dev` -> instantané main (facultatif)

## Disponibilité de l’application macOS

Les builds beta et dev peuvent **ne pas** inclure de version de l’application macOS. Ce n’est pas un problème :

- Le tag git et le dist-tag npm peuvent toujours être publiés.
- Mentionnez « pas de build macOS pour cette beta » dans les notes de version ou le changelog.

## Connexe

- [Mise à jour](/fr/install/updating)
- [Internes de l’installateur](/fr/install/installer)

---
read_when:
    - Vous souhaitez basculer entre stable/bêta/dev
    - Vous voulez épingler une version, une balise ou un SHA spécifique
    - Vous créez des tags ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et dev : sémantique, changement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-04-30T07:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Canaux de développement

OpenClaw fournit trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est actuel ; si beta est absent ou antérieur à
  la dernière version stable, le flux de mise à jour se rabat sur `latest`.
- **dev** : pointe mobile de `main` (git). dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements incompatibles. Ne l’utilisez pas pour des Gateway de production.

Nous publions généralement d’abord les builds stables sur **beta**, les y testons, puis exécutons une
étape explicite de promotion qui déplace le build validé vers `latest` sans
modifier le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement sur `latest` si nécessaire. Les dist-tags sont la source de vérité pour les
installations npm.

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
  `latest` lorsque `beta` est absent ou antérieur au tag stable actuel.
- **`stable`** (installations git) : extrait le dernier tag git stable.
- **`beta`** (installations git) : privilégie le dernier tag git beta, mais se rabat sur
  le dernier tag git stable lorsque beta est absent ou antérieur.
- **`dev`** : garantit un checkout git (`~/openclaw` par défaut, remplaçable avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, rebase sur l’amont, construit et
  installe la CLI globale depuis ce checkout.

<Tip>
Si vous voulez utiliser stable et dev en parallèle, conservez deux clones et pointez votre Gateway vers le clone stable.
</Tip>

## Cibler une version ou un tag ponctuellement

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de paquet précise pour une seule
mise à jour **sans** modifier votre canal conservé :

```bash
# Installer une version précise
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag beta (ponctuel, non conservé)
openclaw update --tag beta

# Installer depuis la branche main de GitHub (tarball npm)
openclaw update --tag main

# Installer une spécification de paquet npm précise
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notes :

- `--tag` s’applique uniquement aux **installations de paquet (npm)**. Les installations git l’ignorent.
- Le tag n’est pas conservé. Votre prochain `openclaw update` utilisera votre canal
  configuré comme d’habitude.
- Protection contre le retour à une version antérieure : si la version cible est antérieure à votre version actuelle,
  OpenClaw demande une confirmation (à ignorer avec `--yes`).
- `--channel beta` diffère de `--tag beta` : le flux de canal peut se rabattre
  sur stable/latest lorsque beta est absent ou antérieur, tandis que `--tag beta` cible le
  dist-tag brut `beta` pour cette exécution unique.

## Simulation

Prévisualisez ce que ferait `openclaw update` sans appliquer de changements :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulation affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de retour à une version antérieure serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise aussi les sources des plugins :

- `dev` privilégie les plugins inclus depuis le checkout git.
- `stable` et `beta` restaurent les paquets de plugins installés via npm.
- Les plugins installés via npm sont mis à jour après la fin de la mise à jour du cœur.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou paquet), la version actuelle et
la source (configuration, tag git, branche git ou valeur par défaut).

## Bonnes pratiques de taggage

- Taguez les versions sur lesquelles les checkouts git doivent atterrir (`vYYYY.M.D` pour stable,
  `vYYYY.M.D-beta.N` pour beta).
- `vYYYY.M.D.beta.N` est également reconnu pour la compatibilité, mais préférez `-beta.N`.
- Les tags hérités `vYYYY.M.D-<patch>` sont toujours reconnus comme stables (non-beta).
- Gardez les tags immuables : ne déplacez ni ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidat ou build stable d’abord publié sur beta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’application macOS

Les builds beta et dev peuvent **ne pas** inclure de version de l’application macOS. C’est acceptable :

- Le tag git et le dist-tag npm peuvent toujours être publiés.
- Mentionnez « pas de build macOS pour cette beta » dans les notes de version ou le changelog.

## Connexe

- [Mise à jour](/fr/install/updating)
- [Internes de l’installateur](/fr/install/installer)

---
read_when:
    - Vous voulez basculer entre stable/bêta/dev
    - Vous souhaitez épingler une version, un tag ou un SHA spécifique
    - Vous taguez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et dev : sémantique, basculement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-05-07T13:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw fournit trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est actuel ; si beta est absent ou plus ancien que
  la dernière version stable, le flux de mise à jour se rabat sur `latest`.
- **dev** : tête mobile de `main` (git). dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements incompatibles. Ne l’utilisez pas pour des gateways de production.

Nous publions généralement les builds stables d’abord sur **beta**, nous les y testons, puis nous exécutons une
étape de promotion explicite qui déplace le build validé vers `latest` sans
changer le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement vers `latest` si nécessaire. Les dist-tags sont la source de vérité pour les installations npm.

## Changement de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserve votre choix dans la configuration (`update.channel`) et aligne la
méthode d’installation :

- **`stable`** (installations par paquet) : mises à jour via le dist-tag npm `latest`.
- **`beta`** (installations par paquet) : préfère le dist-tag npm `beta`, mais se rabat sur
  `latest` lorsque `beta` est absent ou plus ancien que le tag stable actuel.
- **`stable`** (installations git) : extrait le dernier tag git stable.
- **`beta`** (installations git) : préfère le dernier tag git beta, mais se rabat sur
  le dernier tag git stable lorsque beta est absent ou plus ancien.
- **`dev`** : garantit un checkout git (par défaut `~/openclaw`, remplaçable avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, rebase sur l’amont, construit et
  installe la CLI globale depuis ce checkout.

<Tip>
Si vous voulez utiliser stable et dev en parallèle, conservez deux clones et pointez votre gateway vers le clone stable.
</Tip>

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de paquet spécifique pour une seule
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

Notes :

- `--tag` s’applique **uniquement aux installations par paquet (npm)**. Les installations git l’ignorent.
- Le tag n’est pas conservé. Votre prochain `openclaw update` utilise votre canal configuré
  comme d’habitude.
- Protection contre les retours en arrière : si la version cible est plus ancienne que votre version actuelle,
  OpenClaw demande une confirmation (ignorez-la avec `--yes`).
- `--channel beta` est différent de `--tag beta` : le flux de canal peut se rabattre
  sur stable/latest lorsque beta est absent ou plus ancien, tandis que `--tag beta` cible le
  dist-tag brut `beta` pour cette seule exécution.

## Exécution à blanc

Prévisualisez ce que ferait `openclaw update` sans apporter de modifications :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

L’exécution à blanc affiche le canal effectif, la version cible, les actions prévues et
si une confirmation de retour en arrière serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise aussi les sources de plugins :

- `dev` préfère les plugins inclus depuis le checkout git.
- `stable` et `beta` restaurent les paquets de plugins installés via npm.
- Les plugins installés via npm sont mis à jour une fois la mise à jour du cœur terminée.

## Vérification de l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou paquet), la version actuelle et
la source (configuration, tag git, branche git ou valeur par défaut).

## Bonnes pratiques de balisage

- Balisez les versions sur lesquelles vous voulez que les checkouts git arrivent (`vYYYY.M.D` pour stable,
  `vYYYY.M.D-beta.N` pour beta).
- `vYYYY.M.D.beta.N` est aussi reconnu pour compatibilité, mais préférez `-beta.N`.
- Les anciens tags `vYYYY.M.D-<patch>` sont toujours reconnus comme stables (non-beta).
- Gardez les tags immuables : ne déplacez ni ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidat ou build stable publié d’abord en beta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’application macOS

Les builds beta et dev peuvent **ne pas** inclure de version d’application macOS. C’est acceptable :

- Le tag git et le dist-tag npm peuvent tout de même être publiés.
- Mentionnez « pas de build macOS pour cette beta » dans les notes de version ou le changelog.

## Associé

- [Mise à jour](/fr/install/updating)
- [Internes de l’installateur](/fr/install/installer)

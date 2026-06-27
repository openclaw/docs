---
read_when:
    - Vous voulez basculer entre stable/beta/dev
    - Vous souhaitez épingler une version, une balise ou un SHA spécifique
    - Vous étiquetez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, bêta et dev : sémantique, changement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-06-27T17:38:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw propose trois canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **beta** : dist-tag npm `beta` lorsqu’il est actuel ; si beta est absent ou plus ancien que
  la dernière version stable, le flux de mise à jour se rabat sur `latest`.
- **dev** : tête mobile de `main` (git). dist-tag npm : `dev` (lorsqu’il est publié).
  La branche `main` est destinée à l’expérimentation et au développement actif. Elle peut contenir
  des fonctionnalités incomplètes ou des changements incompatibles. Ne l’utilisez pas pour des gateways de production.

Nous publions généralement d’abord les builds stables sur **beta**, nous les y testons, puis nous exécutons une
étape de promotion explicite qui déplace le build validé vers `latest` sans
modifier le numéro de version. Les mainteneurs peuvent aussi publier une version stable
directement sur `latest` si nécessaire. Les dist-tags sont la source de vérité pour les installations npm.

## Changer de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserve votre choix dans la configuration (`update.channel`) et aligne la
méthode d’installation :

- **`stable`** (installations par paquet) : mises à jour via le dist-tag npm `latest`.
- **`beta`** (installations par paquet) : privilégie le dist-tag npm `beta`, mais se rabat sur
  `latest` lorsque `beta` est absent ou plus ancien que le tag stable actuel.
- **`stable`** (installations git) : extrait le dernier tag git stable, en excluant
  les tags de préversion semver comme `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N`, et les autres suffixes de
  préversion.
- **`beta`** (installations git) : privilégie le dernier tag git beta, mais se rabat sur
  le dernier tag git stable lorsque beta est absent ou plus ancien.
- **`dev`** : garantit un checkout git (`~/openclaw` par défaut, ou
  `$OPENCLAW_HOME/openclaw` lorsque `OPENCLAW_HOME` est défini ; surcharge possible avec
  `OPENCLAW_GIT_DIR`), bascule sur `main`, effectue un rebase sur l’amont, construit et
  installe la CLI globale depuis ce checkout.

<Tip>
Si vous voulez utiliser stable et dev en parallèle, conservez deux clones et faites pointer votre gateway vers le clone stable.
</Tip>

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de paquet spécifique pour une seule
mise à jour **sans** modifier votre canal conservé :

```bash
# Installer une version spécifique
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag beta (ponctuel, non conservé)
openclaw update --tag beta

# Basculer vers le checkout GitHub main mobile
openclaw update --channel dev

# Installer une spécification de paquet npm spécifique
openclaw update --tag openclaw@2026.4.1-beta.1

# Installer depuis GitHub main une seule fois sans conserver le canal
openclaw update --tag main
```

Notes :

- `--tag` s’applique **uniquement aux installations par paquet (npm)**. Les installations git l’ignorent.
- Le tag n’est pas conservé. Votre prochain `openclaw update` utilise votre canal configuré
  comme d’habitude.
- Pour les installations par paquet, OpenClaw pré-emballe les spécifications de source GitHub/git dans une
  archive tarball temporaire avant l’installation npm par étapes. Utilisez `--channel dev` ou
  `--install-method git --version main` si vous voulez le checkout `main` mobile
  comme installation persistante.
- Protection contre les rétrogradations : si la version cible est plus ancienne que votre version actuelle,
  OpenClaw demande une confirmation (à ignorer avec `--yes`).
- `--channel beta` est différent de `--tag beta` : le flux de canal peut se rabattre
  sur stable/latest lorsque beta est absent ou plus ancien, tandis que `--tag beta` cible le
  dist-tag brut `beta` pour cette exécution unique.

## Simulation

Prévisualisez ce que `openclaw update` ferait sans appliquer de changements :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulation affiche le canal effectif, la version cible, les actions prévues et
indique si une confirmation de rétrogradation serait requise.

## Plugins et canaux

Lorsque vous changez de canal avec `openclaw update`, OpenClaw synchronise aussi les
sources des plugins :

- `dev` privilégie les plugins groupés depuis le checkout git.
- `stable` et `beta` restaurent les paquets de plugins installés via npm.
- Les plugins installés via npm sont mis à jour une fois la mise à jour du cœur terminée.

## Vérifier l’état actuel

```bash
openclaw update status
```

Affiche le canal actif, le type d’installation (git ou paquet), la version actuelle et
la source (configuration, tag git, branche git ou valeur par défaut).

## Bonnes pratiques de tagging

- Taguez les versions sur lesquelles vous voulez que les checkouts git arrivent (`vYYYY.M.PATCH` pour stable,
  `vYYYY.M.PATCH-beta.N` pour beta ; les suffixes de préversion semver nommés comme
  `-alpha.N`, `-rc.N` et `-next.N` ne sont pas des cibles stables).
- Les anciens tags stables numériques comme `vYYYY.M.PATCH-1` et `v1.0.1-1` sont toujours
  reconnus comme tags git stables pour des raisons de compatibilité.
- `vYYYY.M.PATCH.beta.N` est aussi reconnu pour des raisons de compatibilité, mais privilégiez `-beta.N`.
- Gardez les tags immuables : ne déplacez jamais un tag et ne le réutilisez jamais.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `beta` -> build candidat ou build stable d’abord publié en beta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’application macOS

Les builds beta et dev peuvent **ne pas** inclure de version de l’application macOS. C’est acceptable :

- Le tag git et le dist-tag npm peuvent quand même être publiés.
- Indiquez « aucune build macOS pour cette beta » dans les notes de version ou le changelog.

## Connexe

- [Mise à jour](/fr/install/updating)
- [Internes de l’installateur](/fr/install/installer)

---
read_when:
    - Vous souhaitez passer de la version stable à la version stable étendue, bêta ou de développement.
    - Vous souhaitez épingler une version, une balise ou un SHA spécifique
    - Vous étiquetez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, stable à support étendu, bêta et de développement : sémantique, changement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-07-12T02:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw propose quatre canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **extended-stable** : dist-tag npm `extended-stable`. Nouveau canal de
  paquets pour un mois antérieur encore pris en charge. Il concerne uniquement
  les paquets et l’installation s’effectue uniquement au premier plan. Une
  sélection enregistrée reçoit des indications de mise à jour en lecture seule
  lorsque `update.checkOnStart` est activé, mais celles-ci ne sont jamais
  appliquées automatiquement.
- **beta** : dist-tag npm `beta`. Se rabat sur `latest` lorsque `beta` est absent
  ou antérieur à la version stable actuelle.
- **dev** : tête mobile de `main` (git). Dist-tag npm `dev` lorsqu’il est publié.
  `main` est destiné à l’expérimentation et au développement actif ; il peut
  contenir des fonctionnalités incomplètes ou des changements incompatibles.
  Ne l’utilisez pas pour des Gateway de production.

Les versions stables sont généralement d’abord publiées sur **beta**, y sont
validées, puis sont promues vers **latest** sans changement de version. Les
mainteneurs peuvent également publier directement sur `latest`. Les dist-tags
constituent la source de vérité pour les installations npm.

## Changement de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` enregistre le choix dans `update.channel` dans la configuration et
pilote les deux modes d’installation :

| Canal             | Installations npm/paquet                                                                                                                                                                              | Installations git                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                     | dernier tag git stable (exclut `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` et les autres suffixes de préversion nommés)                     |
| `extended-stable` | résout le sélecteur npm public `extended-stable`, vérifie le paquet exact sélectionné et installe cette version précise. Échoue de manière fermée, sans repli vers `latest`, `beta` ou `dev`.           | non pris en charge : OpenClaw laisse la copie de travail inchangée et vous demande d’utiliser une installation par paquet                                                                   |
| `beta`            | dist-tag `beta`, avec repli vers `latest` lorsque `beta` est absent ou antérieur                                                                                                                       | dernier tag git bêta, avec repli vers le dernier tag git stable lorsque la bêta est absente ou antérieure                                                                                   |
| `dev`             | dist-tag `dev` (rare ; la plupart des utilisateurs de développement utilisent des installations git)                                                                                                 | récupère les modifications, rebase la copie de travail sur la branche `main` en amont, effectue la compilation et réinstalle la CLI globale                                                 |

Pour les installations git `dev`, la copie de travail par défaut est
`~/openclaw` (ou `$OPENCLAW_HOME/openclaw` lorsque `OPENCLAW_HOME` est défini) ;
utilisez `OPENCLAW_GIT_DIR` pour la remplacer.

<Tip>
Pour conserver stable et dev en parallèle, utilisez deux copies de travail distinctes et faites pointer chaque Gateway vers la sienne.
</Tip>

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de
paquet précis lors d’une seule mise à jour, **sans** modifier le canal
enregistré :

```bash
# Installer une version précise
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag beta (ponctuel, non enregistré)
openclaw update --tag beta

# Passer à la copie de travail mobile de main sur GitHub (persistant)
openclaw update --channel dev

# Installer une spécification de paquet npm précise
openclaw update --tag openclaw@2026.4.1-beta.1

# Installer une fois depuis main sur GitHub sans enregistrer le canal
openclaw update --tag main
```

Remarques :

- `--tag` s’applique **uniquement aux installations par paquet (npm)** ; les
  installations git l’ignorent.
- Le tag n’est pas enregistré ; la prochaine commande `openclaw update` utilise
  le canal configuré.
- `--tag main` correspond à la spécification compatible npm
  `github:openclaw/openclaw#main` pour cette seule exécution. Pour une
  installation persistante suivant la branche mobile `main`, utilisez
  `openclaw update --channel dev` (les installations par paquet passent à une
  copie de travail git) ou réinstallez avec la méthode git du programme
  d’installation :
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Le mode d’installation npm rejette explicitement les cibles provenant de
  GitHub/git et vous oriente à la place vers la méthode git.
- Protection contre les rétrogradations : si la version cible est antérieure à
  la version actuelle, OpenClaw demande une confirmation (ignorez-la avec
  `--yes`).
- Extended-stable utilise toujours sa cible de paquet exacte vérifiée. Il ne
  s’agit pas d’un alias ponctuel de `--tag extended-stable`, et `--tag` ne peut
  pas être combiné avec un canal extended-stable effectif.
- `--channel beta` diffère de `--tag beta` : le flux du canal peut se rabattre
  sur stable/latest lorsque la bêta est absente ou antérieure, tandis que
  `--tag beta` cible toujours le dist-tag `beta` brut pour cette seule
  exécution.

## Simulation

Prévisualisez les actions qu’effectuerait `openclaw update` sans apporter de
modifications :

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulation indique le canal effectif, la version cible, les actions prévues
et si une confirmation de rétrogradation serait requise.

## Plugins et canaux

Le changement de canal avec `openclaw update` synchronise également les sources
des Plugins :

- `dev` fait repasser les Plugins installés qui disposent d’un équivalent
  intégré vers leur source intégrée (copie de travail git).
- `stable` et `beta` restaurent les paquets de Plugins installés via npm ou
  ClawHub.
- `extended-stable` associe les Plugins npm officiels admissibles ayant une
  intention nue/par défaut ou `latest` à la version exacte du cœur installée.
  Il n’interroge pas les tags `@extended-stable` des Plugins lors de
  l’exécution.
- Les Plugins installés via npm sont mis à jour après la fin de la mise à jour
  du cœur.

## Vérification de l’état actuel

```bash
openclaw update status
```

Affiche le canal actif (avec la source qui l’a déterminé : configuration, tag
git, branche git, version installée ou valeur par défaut), le type
d’installation (git ou paquet), la version actuelle et la disponibilité d’une
mise à jour.

## Bonnes pratiques de balisage

- Balisage des versions sur lesquelles les copies de travail git doivent
  aboutir : `vYYYY.M.PATCH` pour stable, `vYYYY.M.PATCH-beta.N` pour beta. Les
  suffixes de préversion nommés comme `-alpha.N`, `-rc.N` et `-next.N` ne sont
  pas des cibles stables ou bêta.
- Les anciens tags stables numériques comme `vYYYY.M.PATCH-1` et `v1.0.1-1`
  restent reconnus comme tags git stables à des fins de compatibilité.
- `vYYYY.M.PATCH.beta.N` (séparé par des points) est également reconnu à des
  fins de compatibilité ; privilégiez `-beta.N`.
- Conservez les tags immuables : ne déplacez et ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `extended-stable` -> version de paquet du mois antérieur encore pris en charge
  - `beta` -> version candidate ou version stable publiée d’abord en bêta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’application macOS

Les versions bêta et dev peuvent **ne pas** inclure de version de l’application
macOS. Ce n’est pas un problème :

- Le tag git et le dist-tag npm peuvent tout de même être publiés séparément.
- Indiquez « aucune version macOS pour cette bêta » dans les notes de version
  ou le journal des modifications.

## Voir aussi

- [Mise à jour](/fr/install/updating)
- [Fonctionnement interne du programme d’installation](/fr/install/installer)

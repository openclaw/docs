---
read_when:
    - Vous souhaitez basculer entre stable/extended-stable/beta/dev
    - Vous souhaitez épingler une version, une étiquette ou un SHA spécifique
    - Vous étiquetez ou publiez des préversions
sidebarTitle: Release Channels
summary: 'Canaux stable, stable à long terme, bêta et développement : sémantique, changement, épinglage et étiquetage'
title: Canaux de publication
x-i18n:
    generated_at: "2026-07-12T15:31:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw propose quatre canaux de mise à jour :

- **stable** : dist-tag npm `latest`. Recommandé pour la plupart des utilisateurs.
- **extended-stable** : dist-tag npm `extended-stable`. Un nouveau canal de
  paquets correspondant à un mois de support antérieur. Il est réservé aux
  paquets et l’installation ne s’effectue qu’au premier plan. Une sélection
  enregistrée reçoit des indications de mise à jour en lecture seule lorsque
  `update.checkOnStart` est activé, mais celles-ci ne sont jamais appliquées
  automatiquement.
- **beta** : dist-tag npm `beta`. Se rabat sur `latest` lorsque `beta` est absent
  ou antérieur à la version stable actuelle.
- **dev** : tête mobile de `main` (git). Dist-tag npm `dev` lorsqu’il est publié.
  `main` est destiné à l’expérimentation et au développement actif ; il peut
  contenir des fonctionnalités incomplètes ou des changements incompatibles.
  Ne l’utilisez pas pour des Gateway de production.

Les versions stables sont généralement d’abord publiées sur **beta**, y sont
validées, puis sont promues vers **latest** sans changement de version. Les
responsables de maintenance peuvent également publier directement sur
`latest`. Les dist-tags sont la source de vérité pour les installations npm.

## Changement de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` enregistre le choix dans `update.channel` dans la configuration et
pilote les deux méthodes d’installation :

| Canal             | Installations npm/par paquet                                                                                                                                                                              | Installations git                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                         | dernier tag git stable (exclut `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` et les autres suffixes nommés de préversion)                                               |
| `extended-stable` | résout le sélecteur npm public `extended-stable`, vérifie le paquet exact sélectionné et installe cette version précise. Échoue de manière fermée sans repli vers `latest`, `beta` ou `dev`.                | non pris en charge : OpenClaw laisse la copie de travail inchangée et vous demande d’utiliser une installation par paquet                                                                                              |
| `beta`            | dist-tag `beta`, avec repli vers `latest` lorsque `beta` est absent ou antérieur                                                                                                                          | dernier tag git bêta, avec repli vers le dernier tag git stable lorsque la version bêta est absente ou antérieure                                                                                                      |
| `dev`             | dist-tag `dev` (rare ; la plupart des utilisateurs de dev utilisent des installations git)                                                                                                               | récupère les changements, rebase la copie de travail sur la branche `main` en amont, effectue la compilation et réinstalle la CLI globale                                                                              |

Pour les installations git `dev`, la copie de travail par défaut est
`~/openclaw` (ou `$OPENCLAW_HOME/openclaw` lorsque `OPENCLAW_HOME` est défini) ;
remplacez-la avec `OPENCLAW_GIT_DIR`.

<Tip>
Pour conserver les versions stable et dev en parallèle, utilisez deux copies de travail distinctes et faites pointer chaque Gateway vers la sienne.
</Tip>

## Ciblage ponctuel d’une version ou d’un tag

Utilisez `--tag` pour cibler un dist-tag, une version ou une spécification de
paquet précise pour une seule mise à jour, **sans** modifier le canal enregistré :

```bash
# Installer une version précise
openclaw update --tag 2026.4.1-beta.1

# Installer depuis le dist-tag bêta (ponctuel, non enregistré)
openclaw update --tag beta

# Basculer vers la copie de travail mobile de la branche GitHub main (persistant)
openclaw update --channel dev

# Installer une spécification de paquet npm précise
openclaw update --tag openclaw@2026.4.1-beta.1

# Installer une fois depuis GitHub main sans enregistrer le canal
openclaw update --tag main
```

Remarques :

- `--tag` s’applique **uniquement aux installations par paquet (npm)** ; les
  installations git l’ignorent.
- Le tag n’est pas enregistré ; la prochaine commande `openclaw update` utilise
  le canal configuré.
- `--tag main` correspond à la spécification compatible avec npm
  `github:openclaw/openclaw#main` pour cette seule exécution. Pour une
  installation persistante suivant la branche mobile `main`, utilisez
  `openclaw update --channel dev` (les installations par paquet basculent vers
  une copie de travail git) ou réinstallez avec la méthode git du programme
  d’installation :
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  La méthode d’installation npm refuse catégoriquement les cibles provenant de
  GitHub/git et vous oriente plutôt vers la méthode git.
- Protection contre les rétrogradations : si la version cible est antérieure à
  la version actuelle, OpenClaw demande confirmation (utilisez `--yes` pour
  l’ignorer).
- Extended-stable utilise toujours sa cible de paquet exacte et vérifiée. Il ne
  s’agit pas d’un alias ponctuel de `--tag extended-stable`, et `--tag` ne peut
  pas être combiné avec un canal extended-stable effectif.
- `--channel beta` diffère de `--tag beta` : le flux du canal peut se rabattre
  sur stable/latest lorsque beta est absent ou antérieur, tandis que
  `--tag beta` cible toujours le dist-tag brut `beta` pour cette seule
  exécution.

## Simulation

Prévisualisez ce que ferait `openclaw update` sans apporter de modifications :

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

- `dev` rebascule les Plugins installés qui ont un équivalent intégré vers
  leur source intégrée (copie de travail git).
- `stable` et `beta` restaurent les paquets de Plugins installés depuis npm ou
  ClawHub.
- `extended-stable` résout les Plugins npm officiels éligibles ayant une
  intention nue/par défaut ou `latest` vers la version exacte du cœur
  installée. Il n’interroge pas les tags de Plugins `@extended-stable` lors de
  l’exécution.
- Les Plugins installés depuis npm sont mis à jour une fois la mise à jour du
  cœur terminée.

## Vérification de l’état actuel

```bash
openclaw update status
```

Affiche le canal actif (avec la source qui l’a déterminé : configuration, tag
git, branche git, version installée ou valeur par défaut), le type
d’installation (git ou paquet), la version actuelle et la disponibilité d’une
mise à jour.

## Bonnes pratiques de balisage

- Ajoutez un tag aux versions sur lesquelles les copies de travail git doivent
  se positionner : `vYYYY.M.PATCH` pour stable, `vYYYY.M.PATCH-beta.N` pour
  beta. Les suffixes nommés de préversion tels que `-alpha.N`, `-rc.N` et
  `-next.N` ne sont pas des cibles stable ou beta.
- Les anciens tags stables numériques tels que `vYYYY.M.PATCH-1` et `v1.0.1-1`
  sont toujours reconnus comme des tags git stables à des fins de
  compatibilité.
- `vYYYY.M.PATCH.beta.N` (séparé par des points) est également reconnu à des
  fins de compatibilité ; préférez `-beta.N`.
- Gardez les tags immuables : ne déplacez et ne réutilisez jamais un tag.
- Les dist-tags npm restent la source de vérité pour les installations npm :
  - `latest` -> stable
  - `extended-stable` -> version de paquet correspondant à un mois de support antérieur
  - `beta` -> version candidate ou version stable publiée d’abord en bêta
  - `dev` -> instantané de main (facultatif)

## Disponibilité de l’application macOS

Les versions beta et dev peuvent **ne pas** inclure de version de l’application
macOS. Ce n’est pas un problème :

- Le tag git et le dist-tag npm peuvent tout de même être publiés séparément.
- Indiquez « aucune version macOS pour cette bêta » dans les notes de version
  ou le journal des modifications.

## Liens connexes

- [Mise à jour](/fr/install/updating)
- [Fonctionnement interne du programme d’installation](/fr/install/installer)

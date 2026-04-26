---
read_when:
    - Vous voulez mettre à jour une extraction source en toute sécurité
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour des sources relativement sûre + redémarrage automatique de la gateway)
title: Mise à jour
x-i18n:
    generated_at: "2026-04-26T11:26:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Mettre à jour OpenClaw en toute sécurité et basculer entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets décrit dans [Updating](/fr/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Options

- `--no-restart` : ne redémarre pas le service Gateway après une mise à jour réussie. Les mises à jour via gestionnaire de paquets qui redémarrent la Gateway vérifient que le service redémarré signale bien la version mise à jour attendue avant que la commande réussisse.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du paquet pour cette mise à jour uniquement. Pour les installations par paquet, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire dans la configuration, installer, synchroniser les Plugins ni redémarrer.
- `--json` : affiche un JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’artefact de Plugin npm
  est détectée pendant la synchronisation des Plugins après mise à jour.
- `--timeout <seconds>` : délai d’attente par étape (par défaut : 1800 s).
- `--yes` : ignore les invites de confirmation (par exemple confirmation de rétrogradation)

Remarque : les rétrogradations nécessitent une confirmation car les anciennes versions peuvent casser la configuration.

## `update status`

Affiche le canal de mise à jour actif ainsi que le tag/la branche/le SHA git (pour les extractions source), ainsi que la disponibilité d’une mise à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche un JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’attente pour les vérifications (par défaut : 3 s).

## `update wizard`

Flux interactif permettant de choisir un canal de mise à jour et de confirmer s’il faut redémarrer la Gateway
après la mise à jour (le redémarrage est activé par défaut). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’attente pour chaque étape de mise à jour (par défaut `1800`)

## Ce que fait la commande

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi
la méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour, puis installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le système de mise à jour automatique du cœur Gateway (lorsqu’il est activé via la configuration) réutilise ce même chemin de mise à jour.

Pour les installations via gestionnaire de paquets, `openclaw update` résout la version
cible du paquet avant d’invoquer le gestionnaire de paquets. Même lorsque la version installée
correspond déjà à la cible, la commande rafraîchit l’installation globale du paquet,
puis exécute la synchronisation des Plugins, l’actualisation des complétions et le travail de redémarrage. Cela permet de garder les sidecars empaquetés et les enregistrements de Plugins appartenant à un canal alignés avec la build OpenClaw installée.

## Flux d’extraction git

Canaux :

- `stable` : extrait le dernier tag non-beta, puis build + doctor.
- `beta` : préfère le dernier tag `-beta`, mais revient au dernier tag stable
  lorsque beta est absent ou plus ancien.
- `dev` : extrait `main`, puis exécute fetch + rebase.

Vue d’ensemble :

1. Nécessite un worktree propre (aucune modification non commitée).
2. Bascule vers le canal sélectionné (tag ou branche).
3. Exécute un fetch depuis l’amont (dev uniquement).
4. Dev uniquement : exécute un lint de prévalidation + une build TypeScript dans un worktree temporaire ; si la pointe échoue, remonte jusqu’à 10 commits pour trouver la build propre la plus récente.
5. Rebase sur le commit sélectionné (dev uniquement).
6. Installe les dépendances avec le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour initialise `pnpm` à la demande (via `corepack` d’abord, puis avec une solution de repli temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
7. Exécute la build + la build de Control UI.
8. Exécute `openclaw doctor` comme vérification finale de « mise à jour sûre ».
9. Synchronise les Plugins avec le canal actif (dev utilise les Plugins intégrés ; stable/beta utilise npm) et met à jour les Plugins installés via npm.

Si une mise à jour exacte d’un Plugin npm épinglé se résout vers un artefact dont l’intégrité
diffère de l’enregistrement d’installation stocké, `openclaw update` interrompt cette mise à jour
d’artefact de Plugin au lieu de l’installer. Réinstallez ou mettez à jour le Plugin explicitement
uniquement après avoir vérifié que vous faites confiance au nouvel artefact.

Les échecs de synchronisation des Plugins après mise à jour font échouer le résultat de la mise à jour et arrêtent les actions de redémarrage suivantes. Corrigez l’erreur d’installation/de mise à jour du Plugin, puis relancez
`openclaw update`.

Si l’initialisation de pnpm échoue encore, le programme de mise à jour s’arrête désormais plus tôt avec une erreur spécifique au gestionnaire de paquets au lieu de tenter `npm run build` dans l’extraction.

## Abréviation `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et scripts de lancement).

## Associé

- `openclaw doctor` (propose d’exécuter d’abord update sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Updating](/fr/install/updating)
- [Référence CLI](/fr/cli)

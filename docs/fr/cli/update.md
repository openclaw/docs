---
read_when:
    - Vous souhaitez mettre à jour une extraction de code source en toute sécurité
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de la source relativement sûre + redémarrage automatique du Gateway)
title: update
x-i18n:
    generated_at: "2026-04-23T07:02:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Met à jour OpenClaw en toute sécurité et permet de basculer entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets dans [Updating](/fr/install/updating).

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

- `--no-restart` : n’effectue pas le redémarrage du service Gateway après une mise à jour réussie.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : surcharge la cible du paquet pour cette mise à jour uniquement. Pour les installations via gestionnaire de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : affiche un aperçu des actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche un JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’intégrité des
  artefacts de plugin npm est détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (la valeur par défaut est 1200 s).
- `--yes` : ignore les invites de confirmation (par exemple la confirmation de rétrogradation)

Remarque : les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.

## `update status`

Affiche le canal de mise à jour actif ainsi que le tag/la branche/le SHA git (pour les extractions de code source), plus la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche un JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration pour les vérifications (par défaut 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (par défaut, il est redémarré). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (par défaut `1200`)

## Ce que fait la commande

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw garde aussi
la méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, surcharge avec `OPENCLAW_GIT_DIR`),
  la met à jour, puis installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais revient à `latest` si beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur Gateway (lorsqu’il est activé via la configuration) réutilise ce même chemin de mise à jour.

Pour les installations via gestionnaire de paquets, `openclaw update` résout la
version cible du paquet avant d’invoquer le gestionnaire de paquets. Si la version installée
correspond exactement à la cible et qu’aucun changement de canal de mise à jour n’a besoin d’être conservé,
la commande se termine comme ignorée avant l’installation du paquet, la synchronisation des plugins, l’actualisation des complétions
ou le redémarrage du Gateway.

## Flux d’extraction git

Canaux :

- `stable` : extrait le dernier tag non beta, puis build + doctor.
- `beta` : préfère le dernier tag `-beta`, mais revient au dernier tag stable
  si beta est absent ou plus ancien.
- `dev` : extrait `main`, puis fetch + rebase.

Vue d’ensemble :

1. Nécessite un worktree propre (aucune modification non commitée).
2. Bascule vers le canal sélectionné (tag ou branche).
3. Récupère l’amont (dev uniquement).
4. Dev uniquement : exécute un lint preflight + un build TypeScript dans un worktree temporaire ; si le tip échoue, remonte jusqu’à 10 commits pour trouver le build propre le plus récent.
5. Rebase sur le commit sélectionné (dev uniquement).
6. Installe les dépendances avec le gestionnaire de paquets du dépôt. Pour les extractions pnpm, l’updater initialise `pnpm` à la demande (via `corepack` d’abord, puis avec un repli temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm.
7. Build + build de l’interface de contrôle.
8. Exécute `openclaw doctor` comme vérification finale de « mise à jour sûre ».
9. Synchronise les plugins avec le canal actif (dev utilise les plugins intégrés ; stable/beta utilise npm) et met à jour les plugins installés via npm.

Si une mise à jour exacte d’un plugin npm épinglé se résout vers un artefact dont l’intégrité
diffère de l’enregistrement d’installation stocké, `openclaw update` annule cette mise à jour
d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin
uniquement après avoir vérifié que vous faites confiance au nouvel artefact.

Si l’initialisation pnpm échoue toujours, l’updater s’arrête maintenant plus tôt avec une erreur spécifique au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.

## Abréviation `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Voir aussi

- `openclaw doctor` (propose d’exécuter d’abord update sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Updating](/fr/install/updating)
- [Référence CLI](/fr/cli)

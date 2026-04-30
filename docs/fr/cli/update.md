---
read_when:
    - Vous souhaitez mettre à jour une copie de travail source en toute sécurité
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour des sources relativement sûre + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-04-30T07:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et basculez entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets dans [Mise à jour](/fr/install/updating).

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

- `--no-restart` : ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent bien le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande réussisse.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du paquet pour cette mise à jour uniquement. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche un JSON `UpdateRunResult` lisible par machine, incluant
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’intégrité d’artefact de plugin npm est
  détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (la valeur par défaut est 1800 s).
- `--yes` : ignore les invites de confirmation (par exemple la confirmation de rétrogradation).

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Affiche le canal de mise à jour actif + le tag/la branche/le SHA git (pour les extractions de source), ainsi que la disponibilité d’une mise à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche un JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration pour les vérifications (la valeur par défaut est 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (la valeur par défaut est le redémarrage). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (par défaut `1800`)

## Ce que cela fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi la
méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour, puis installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais se rabat sur `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur du Gateway (lorsqu’il est activé via la configuration) réutilise ce même chemin de mise à jour.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation préparée
en amont : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l’inventaire `dist` empaqueté à cet endroit, puis échange cette arborescence de paquet propre avec le
vrai préfixe global. Si la vérification échoue, le doctor après mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation de complétion des commandes du cœur et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins propres au canal alignés avec la
version OpenClaw installée, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway local géré est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours d’exécution avant de remplacer l’arborescence du paquet,
puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue. Avec
`--no-restart`, le remplacement du paquet s’exécute tout de même, mais le service géré n’est pas
arrêté ni redémarré ; le Gateway en cours d’exécution peut donc conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux d’extraction git

### Sélection du canal

- `stable` : extrait le dernier tag non beta, puis construit et exécute doctor.
- `beta` : préfère le dernier tag `-beta`, mais se rabat sur le dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : extrait `main`, puis récupère et rebase.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que l’arborescence de travail est propre">
    Nécessite l’absence de modifications non commitées.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Construction de prévalidation (dev uniquement)">
    Exécute lint et la construction TypeScript dans une arborescence de travail temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver la construction propre la plus récente.
  </Step>
  <Step title="Rebase">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour initialise `pnpm` à la demande (via `corepack` d’abord, puis un repli temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm.
  </Step>
  <Step title="Construire la Control UI">
    Construit le Gateway et la Control UI.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les plugins installés par npm.
  </Step>
</Steps>

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation des plugins après mise à jour font échouer le résultat de mise à jour et arrêtent le travail de redémarrage qui suit. Corrigez l’erreur d’installation ou de mise à jour du plugin, puis relancez `openclaw update`.

Lorsque le Gateway mis à jour démarre, les dépendances d’exécution des plugins groupés activés sont préparées avant l’activation des plugins. Les redémarrages déclenchés par une mise à jour vident toute préparation active de dépendances d’exécution avant de fermer le Gateway, de sorte que les redémarrages du gestionnaire de services n’interrompent pas une installation npm en cours.

Si l’initialisation de pnpm échoue tout de même, le programme de mise à jour s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

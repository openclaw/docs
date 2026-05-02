---
read_when:
    - Vous voulez mettre à jour une copie de travail des sources en toute sécurité
    - Vous devez comprendre le comportement du raccourci `--update`
summary: Référence de la CLI pour `openclaw update` (mise à jour plutôt sûre de la source + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-05-02T07:03:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et basculez entre les canaux stable/beta/dev.

Si vous l'avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
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

- `--no-restart` : ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande réussisse.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du paquet pour cette mise à jour uniquement. Pour les installations par paquet, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu'une dérive d'artefact de plugin npm est
  détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d'expiration par étape (valeur par défaut : 1800 s).
- `--yes` : ignore les invites de confirmation (par exemple la confirmation de rétrogradation).

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Affiche le canal de mise à jour actif + l'étiquette/branche/SHA git (pour les checkouts source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche le JSON d'état lisible par machine.
- `--timeout <seconds>` : délai d'expiration des vérifications (valeur par défaut : 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s'il faut redémarrer le Gateway
après la mise à jour (le redémarrage est le comportement par défaut). Si vous sélectionnez `dev` sans checkout git, il
propose d'en créer un.

Options :

- `--timeout <seconds>` : délai d'expiration de chaque étape de mise à jour (valeur par défaut : `1800`)

## Ce qu'elle fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw conserve aussi la
méthode d'installation alignée :

- `dev` → garantit un checkout git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  le met à jour et installe la CLI globale depuis ce checkout.
- `stable` → installe depuis npm en utilisant `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais se rabat sur `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

L'outil de mise à jour automatique du cœur du Gateway (lorsqu'il est activé via la configuration) lance le chemin de mise à jour de la CLI
en dehors du gestionnaire de requêtes du Gateway actif. Les mises à jour par gestionnaire de paquets `update.run`
du plan de contrôle forcent un redémarrage de mise à jour non différé et sans délai de récupération après le remplacement du paquet,
car l'ancien processus Gateway peut encore avoir en mémoire des fragments pointant vers
des fichiers supprimés par le nouveau paquet.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d'appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation par étapes :
OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l'inventaire `dist` empaqueté à cet endroit, puis remplace l'arborescence propre du paquet dans le
vrai préfixe global. Si la vérification échoue, le doctor après mise à jour, la synchronisation des plugins et
le redémarrage ne s'exécutent pas depuis l'arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l'installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation de complétion des commandes du cœur et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins appartenant au canal alignés avec le
build OpenClaw installé, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu'un service Gateway local géré est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours d'exécution avant de remplacer l'arborescence
du paquet, puis actualisent les métadonnées du service depuis l'installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue. Avec
`--no-restart`, le remplacement du paquet s'exécute quand même, mais le service géré n'est pas
arrêté ni redémarré ; le Gateway en cours d'exécution peut donc conserver l'ancien code jusqu'à ce que vous le redémarriez
manuellement.

## Flux de checkout git

### Sélection du canal

- `stable` : checkout de la dernière étiquette non beta, puis build et doctor.
- `beta` : privilégie la dernière étiquette `-beta`, mais se rabat sur la dernière étiquette stable lorsque beta est absent ou plus ancien.
- `dev` : checkout de `main`, puis récupération et rebasage.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que le worktree est propre">
    Nécessite l'absence de modifications non validées.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (étiquette ou branche).
  </Step>
  <Step title="Récupérer l'amont">
    Dev uniquement.
  </Step>
  <Step title="Build de prévol (dev uniquement)">
    Exécute le lint et le build TypeScript dans un worktree temporaire. Si la pointe échoue, remonte jusqu'à 10 commits pour trouver le build propre le plus récent.
  </Step>
  <Step title="Rebaser">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, l'outil de mise à jour amorce `pnpm` à la demande (d'abord via `corepack`, puis avec un repli temporaire `npm install pnpm@10`) au lieu d'exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Builder la Control UI">
    Builde le gateway et la Control UI.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s'exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les plugins installés via npm.
  </Step>
</Steps>

<Warning>
Si une mise à jour de plugin npm épinglée exactement résout vers un artefact dont l'intégrité diffère de l'enregistrement d'installation stocké, `openclaw update` abandonne cette mise à jour d'artefact de plugin au lieu de l'installer. Réinstallez ou mettez à jour le plugin explicitement uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation des plugins après mise à jour font échouer le résultat de la mise à jour et arrêtent les travaux de redémarrage qui suivent. Corrigez l'erreur d'installation ou de mise à jour du plugin, puis relancez `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement vérificatif : le démarrage n'exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` du gestionnaire de paquets contournent le report normal en période d'inactivité et le délai de récupération du redémarrage après le remplacement de l'arborescence du paquet, afin que l'ancien processus ne puisse pas continuer à charger paresseusement des fragments supprimés.

Si l'amorçage de pnpm échoue toujours, l'outil de mise à jour s'arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d'essayer `npm run build` dans le checkout.
</Note>

## Raccourci `--update`

`openclaw --update` se réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d'exécuter d'abord la mise à jour sur les checkouts git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

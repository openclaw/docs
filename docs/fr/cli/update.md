---
read_when:
    - Vous voulez mettre à jour une copie de travail source en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement de la notation abrégée `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de la source plutôt sûre + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-05-05T01:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez OpenClaw à jour en toute sécurité et basculez entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets décrit dans [Mise à jour](/fr/install/updating).

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

- `--no-restart` : ignorer le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande ne réussisse.
- `--channel <stable|beta|dev>` : définir le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplacer la cible du paquet uniquement pour cette mise à jour. Pour les installations de paquet, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualiser les actions de mise à jour prévues (flux canal/tag/cible/redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : afficher le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’artefact de plugin npm est
  détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (la valeur par défaut est 1800 s).
- `--yes` : ignorer les invites de confirmation (par exemple la confirmation de rétrogradation).

`openclaw update` n’a pas d’option `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions canal/tag/installation/redémarrage prévues, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement
besoin des détails de canal et de disponibilité. Si vous déboguez les journaux du Gateway
autour d’une mise à jour, la verbosité de la console et le niveau des journaux fichier
sont distincts : Gateway `--verbose` affecte la sortie terminal/WebSocket, tandis que
les journaux fichier nécessitent `logging.level: "debug"` ou `"trace"` dans la configuration.
Voir [Journalisation du Gateway](/fr/gateway/logging).

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Afficher le canal de mise à jour actif + le tag/la branche/le SHA git (pour les extractions source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : afficher le JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration des vérifications (la valeur par défaut est 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (le redémarrage est la valeur par défaut). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (valeur par défaut `1800`)

## Ce qu’il fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi
la méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour, puis installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais revient à `latest` lorsque la beta est
  absente ou plus ancienne que la version stable actuelle.

Le programme de mise à jour automatique du cœur Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour par gestionnaire de paquets `update.run` du plan de contrôle
forcent un redémarrage de mise à jour non différé, sans délai de récupération, après le remplacement du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des morceaux qui pointent vers
des fichiers supprimés par le nouveau paquet.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation
intermédiaire : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l’inventaire `dist` empaqueté à cet endroit, puis échange cette arborescence de paquet propre avec
le préfixe global réel. Si la vérification échoue, le doctor après mise à jour, la synchronisation des plugins et
le travail de redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation de complétion des commandes du cœur et le travail de redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins appartenant au canal alignés avec la
version d’OpenClaw installée, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours d’exécution avant de remplacer l’arborescence
du paquet, puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue avant
d’indiquer la réussite. Sur macOS, la vérification après mise à jour vérifie aussi que le LaunchAgent
est chargé/en cours d’exécution pour le profil actif et que le port local loopback configuré est
sain. Si le plist est installé mais que launchd ne le supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent, puis relance les
vérifications de disponibilité santé/version/canal. Un nouvel amorçage charge directement la tâche RunAtLoad,
donc la récupération de mise à jour n’exécute pas immédiatement `kickstart -k` sur le Gateway
nouvellement lancé. Si le Gateway ne devient toujours pas sain, la commande se termine
avec un code non nul et affiche le chemin du journal de redémarrage ainsi que des instructions explicites de redémarrage, de réinstallation et
de restauration du paquet. Avec `--no-restart`,
le remplacement du paquet s’exécute toujours, mais le service géré n’est pas arrêté ni
redémarré, de sorte que le Gateway en cours d’exécution peut conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux d’extraction git

### Sélection du canal

- `stable` : extraire le dernier tag non beta, puis compiler et exécuter doctor.
- `beta` : privilégier le dernier tag `-beta`, mais revenir au dernier tag stable lorsque la beta est absente ou plus ancienne.
- `dev` : extraire `main`, puis récupérer et rebaser.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que l’arborescence de travail est propre">
    Exige l’absence de changements non validés.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Compilation préliminaire (dev uniquement)">
    Exécute lint et la compilation TypeScript dans une arborescence de travail temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver la compilation propre la plus récente.
  </Step>
  <Step title="Rebaser">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis avec un repli temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Compiler Control UI">
    Compile le gateway et la Control UI.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne par défaut/latest essaient d’abord une version `@beta` du plugin. Si le plugin n’a pas de
version beta, OpenClaw revient à la spec par défaut/latest enregistrée. Pour les plugins npm,
OpenClaw revient aussi en arrière lorsque le paquet beta existe mais échoue à la validation
d’installation. Les versions exactes et les tags explicites ne sont pas réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation des plugins après mise à jour font échouer le résultat de la mise à jour et arrêtent le travail de redémarrage de suivi. Corrigez l’installation du plugin ou l’erreur de mise à jour, puis relancez `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement vérificatif : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` par gestionnaire de paquets contournent le différé d’inactivité normal et le délai de récupération de redémarrage après l’échange de l’arborescence du paquet, de sorte que l’ancien processus ne peut pas continuer à charger paresseusement des morceaux supprimés.

Si l’amorçage de pnpm échoue encore, le programme de mise à jour s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)

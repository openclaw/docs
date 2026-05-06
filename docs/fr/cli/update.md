---
read_when:
    - Vous souhaitez mettre à jour une copie locale des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de source relativement sûre + redémarrage automatique du Gateway)
title: Mise à jour
x-i18n:
    generated_at: "2026-05-06T07:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et basculez entre les canaux stable/beta/dev.

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

- `--no-restart` : ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour via gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande réussisse.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du paquet pour cette mise à jour uniquement. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (flux canal/tag/cible/redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.warnings` lorsque des plugins gérés corrompus ou impossibles à charger doivent être
  réparés après la réussite de la mise à jour du noyau, et `postUpdate.plugins.integrityDrifts`
  lorsqu’une dérive d’artefact de plugin npm est détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (valeur par défaut : 1800 s).
- `--yes` : ignore les demandes de confirmation (par exemple la confirmation de rétrogradation).

`openclaw update` n’a pas d’option `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions prévues de canal/tag/installation/redémarrage, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement besoin des détails
de canal et de disponibilité. Si vous déboguez les journaux du Gateway autour d’une mise à jour,
la verbosité de la console et le niveau de journalisation des fichiers sont séparés : `--verbose` du Gateway affecte
la sortie terminal/WebSocket, tandis que les journaux fichier nécessitent `logging.level: "debug"` ou
`"trace"` dans la configuration. Consultez [Journalisation du Gateway](/fr/gateway/logging).

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Affiche le canal de mise à jour actif + le tag/la branche/le SHA git (pour les checkouts source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche un JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration des vérifications (valeur par défaut : 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (par défaut, il est redémarré). Si vous sélectionnez `dev` sans checkout git, il
propose d’en créer un.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (valeur par défaut : `1800`)

## Ce qu’elle fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw garde aussi la
méthode d’installation alignée :

- `dev` → garantit un checkout git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  le met à jour et installe la CLI globale depuis ce checkout.
- `stable` → installe depuis npm avec `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du noyau du Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour de la CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour via gestionnaire de paquets `update.run` du plan de contrôle
forcent un redémarrage de mise à jour non différé et sans délai de refroidissement après le remplacement du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des morceaux pointant vers
des fichiers supprimés par le nouveau paquet.

Pour les installations via gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation
intermédiaire : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, y vérifie
l’inventaire `dist` empaqueté, puis remplace l’arborescence propre du paquet dans le
vrai préfixe global. Si la vérification échoue, doctor après mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande rafraîchit l’installation globale du paquet,
puis exécute la synchronisation des plugins, un rafraîchissement de complétion des commandes du noyau et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins appartenant au canal alignés avec la
version installée d’OpenClaw, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est activé,
les mises à jour via gestionnaire de paquets arrêtent le service en cours avant de remplacer l’arborescence
du paquet, puis rafraîchissent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue avant de
signaler la réussite. Sur macOS, la vérification après mise à jour confirme aussi que le LaunchAgent
est chargé/en cours d’exécution pour le profil actif et que le port de bouclage configuré est
sain. Si le plist est installé mais que launchd ne le supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent, puis relance les
vérifications de santé/version/disponibilité du canal. Un amorçage frais charge directement la tâche RunAtLoad,
donc la récupération de mise à jour ne lance pas immédiatement `kickstart -k` sur le Gateway
tout juste démarré. Si le Gateway ne devient toujours pas sain, la commande se termine
avec un code non nul et affiche le chemin du journal de redémarrage ainsi que des instructions explicites de redémarrage, de réinstallation et
de restauration du paquet. Avec `--no-restart`,
le remplacement du paquet s’exécute quand même, mais le service géré n’est ni arrêté ni
redémarré ; le Gateway en cours d’exécution peut donc conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux de checkout git

### Sélection du canal

- `stable` : checkout du dernier tag non beta, puis build et doctor.
- `beta` : privilégie le dernier tag `-beta`, mais revient au dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : checkout de `main`, puis fetch et rebase.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que le worktree est propre">
    Nécessite l’absence de modifications non commitées.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Build de prévalidation (dev uniquement)">
    Exécute le build TypeScript dans un worktree temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver le commit constructible le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour exécuter aussi lint pendant cette prévalidation ; lint s’exécute en mode série contraint, car les hôtes de mise à jour utilisateur sont souvent plus petits que les runners CI.
  </Step>
  <Step title="Rebase">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis avec une solution de secours temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Builder l’interface utilisateur de contrôle">
    Builde le Gateway et l’interface utilisateur de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sécurisée.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne par défaut/latest essaient d’abord une version `@beta` du plugin. Si le plugin n’a pas de
version beta, OpenClaw revient à la spécification default/latest enregistrée. Pour les plugins npm,
OpenClaw revient aussi en arrière lorsque le paquet beta existe mais échoue à la validation
d’installation. Les versions exactes et les tags explicites ne sont pas réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins après mise à jour qui sont limités à un plugin géré sont signalés comme avertissements après la réussite de la mise à jour du noyau. Le résultat JSON conserve le `status: "ok"` de mise à jour au niveau supérieur et signale `postUpdate.plugins.status: "warning"` avec les indications `openclaw doctor --fix` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation font toujours échouer le résultat de mise à jour. Corrigez l’erreur d’installation ou de mise à jour du plugin, puis relancez `openclaw doctor --fix` ou `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement une vérification : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` via gestionnaire de paquets contournent le report d’inactivité normal et le délai de refroidissement du redémarrage après le remplacement de l’arborescence du paquet, afin que l’ancien processus ne puisse pas continuer à charger paresseusement des morceaux supprimés.

Si l’amorçage de pnpm échoue encore, le programme de mise à jour s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans le checkout.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d’exécuter d’abord update sur les checkouts git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

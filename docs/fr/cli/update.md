---
read_when:
    - Vous souhaitez mettre à jour une copie de travail des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de source relativement sûre + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-05-11T20:30:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et basculez entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour se font via le flux du gestionnaire de paquets dans [Mise à jour](/fr/install/updating).

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
- `--tag <dist-tag|version|spec>` : remplace la cible de paquet uniquement pour cette mise à jour. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.warnings` lorsque des plugins gérés corrompus ou non chargeables nécessitent
  une réparation après la réussite de la mise à jour du cœur, les détails de repli des plugins du canal beta
  lorsqu’un plugin n’a pas de version beta, et `postUpdate.plugins.integrityDrifts`
  lorsqu’une dérive d’artefact de plugin npm est détectée pendant la synchronisation des plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (valeur par défaut : 1800 s).
- `--yes` : ignore les invites de confirmation (par exemple la confirmation de rétrogradation).

`openclaw update` n’a pas de drapeau `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions prévues de canal/tag/installation/redémarrage, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement besoin des détails de canal et
de disponibilité. Si vous déboguez les journaux du Gateway autour d’une mise à jour,
la verbosité de la console et le niveau de journalisation de fichier sont distincts : `--verbose` du Gateway affecte
la sortie terminal/WebSocket, tandis que les journaux de fichier nécessitent `logging.level: "debug"` ou
`"trace"` dans la configuration. Voir [Journalisation du Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions mutantes de `openclaw update` sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake pour cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Affiche le canal de mise à jour actif + le tag/la branche/le SHA git (pour les extractions de source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche le JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration pour les vérifications (valeur par défaut : 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (par défaut, il redémarre). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (valeur par défaut : `1800`)

## Ce qu’elle fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi
la méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour et installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais se rabat sur `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur du Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour de la CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour par gestionnaire de paquets `update.run` du plan de contrôle
forcent un redémarrage de mise à jour non différé et sans période de temporisation après le remplacement du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des fragments qui pointent vers
des fichiers supprimés par le nouveau paquet.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version du paquet cible
avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation préparée :
OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, y vérifie
l’inventaire `dist` empaqueté, puis remplace l’arborescence de paquet propre dans le
préfixe global réel. Si la vérification échoue, le doctor après mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation de complétion des commandes du cœur et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins détenus par le canal alignés avec la
version installée d’OpenClaw, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré localement est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours avant de remplacer l’arborescence
du paquet, puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue avant de
signaler la réussite. Sur macOS, la vérification après mise à jour vérifie également que le LaunchAgent
est chargé/en cours d’exécution pour le profil actif et que le port de bouclage configuré est
sain. Si le plist est installé mais que launchd ne le supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent, puis réexécute les
vérifications de préparation de santé/version/canal. Un nouvel amorçage charge directement le job RunAtLoad,
donc la récupération de mise à jour ne lance pas immédiatement `kickstart -k` sur le Gateway
nouvellement démarré. Si le Gateway ne devient toujours pas sain, la commande se termine
avec un code non nul et affiche le chemin du journal de redémarrage ainsi que des instructions explicites de redémarrage, de réinstallation et
de restauration de paquet. Avec `--no-restart`,
le remplacement du paquet s’exécute toujours, mais le service géré n’est ni arrêté ni
redémarré, donc le Gateway en cours peut conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux d’extraction git

### Sélection du canal

- `stable` : extrait le dernier tag non beta, puis compile et exécute doctor.
- `beta` : privilégie le dernier tag `-beta`, mais se rabat sur le dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : extrait `main`, puis récupère et rebase.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier un arbre de travail propre">
    Nécessite l’absence de modifications non commit.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Compilation de prévol (dev uniquement)">
    Exécute la compilation TypeScript dans un arbre de travail temporaire. Si le sommet échoue, remonte jusqu’à 10 commits pour trouver le commit compilable le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour exécuter aussi le lint pendant ce prévol ; le lint s’exécute en mode série contraint, car les hôtes de mise à jour utilisateur sont souvent plus petits que les exécuteurs CI.
  </Step>
  <Step title="Rebase">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour amorce `pnpm` à la demande (via `corepack` d’abord, puis avec un repli temporaire `npm install pnpm@11`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Compiler l’interface de contrôle">
    Compile le Gateway et l’interface de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme dernière vérification de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne default/latest essaient d’abord une version `@beta` du plugin. Si le plugin n’a pas de
version beta, OpenClaw se rabat sur la spécification default/latest enregistrée et le signale
comme avertissement. Pour les plugins npm, OpenClaw se rabat aussi lorsque le paquet beta
existe mais échoue à la validation d’installation. Ces avertissements de repli de plugin ne
font pas échouer la mise à jour du cœur. Les versions exactes et les tags explicites ne sont pas
réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout en un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugin après mise à jour qui sont limités à un plugin géré sont signalés comme avertissements après la réussite de la mise à jour du cœur. Le résultat JSON conserve le `status: "ok"` de premier niveau et signale `postUpdate.plugins.status: "warning"` avec des indications `openclaw doctor --fix` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation font toujours échouer le résultat de mise à jour. Corrigez l’installation du plugin ou l’erreur de mise à jour, puis réexécutez `openclaw doctor --fix` ou `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement de vérification : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arbres de dépendances. Les redémarrages `update.run` du gestionnaire de paquets contournent le report d’inactivité normal et la période de temporisation de redémarrage après le remplacement de l’arborescence du paquet, afin que l’ancien processus ne puisse pas continuer à charger paresseusement des fragments supprimés.

Si l’amorçage pnpm échoue toujours, le programme de mise à jour s’arrête tôt avec une erreur spécifique au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d’exécuter d’abord update sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

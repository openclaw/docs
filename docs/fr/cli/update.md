---
read_when:
    - Vous souhaitez mettre à jour une copie locale des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement de raccourci `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de source relativement sûre + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-05-07T01:51:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
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

- `--no-restart` : ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande ne réussisse.
- `--channel <stable|beta|dev>` : définit le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du paquet uniquement pour cette mise à jour. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualise les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : affiche le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.warnings` lorsque des plugins gérés corrompus ou non chargeables nécessitent
  une réparation après la réussite de la mise à jour du cœur, et `postUpdate.plugins.integrityDrifts`
  lorsqu’une dérive d’artefact de plugin npm est détectée pendant la synchronisation de plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (la valeur par défaut est 1800 s).
- `--yes` : ignore les invites de confirmation (par exemple la confirmation de rétrogradation).

`openclaw update` n’a pas de drapeau `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions prévues de canal/tag/installation/redémarrage, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement besoin
des détails de canal et de disponibilité. Si vous déboguez les journaux du Gateway autour
d’une mise à jour, la verbosité de la console et le niveau de journalisation fichier sont
séparés : Gateway `--verbose` affecte la sortie terminal/WebSocket, tandis que les journaux
fichier nécessitent `logging.level: "debug"` ou
`"trace"` dans la configuration. Consultez [Journalisation du Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions mutantes de `openclaw update` sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake pour cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

<Warning>
Les rétrogradations nécessitent une confirmation, car les versions plus anciennes peuvent casser la configuration.
</Warning>

## `update status`

Affiche le canal de mise à jour actif + le tag/la branche/le SHA git (pour les checkouts source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : affiche le JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration pour les vérifications (la valeur par défaut est 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (la valeur par défaut est de redémarrer). Si vous sélectionnez `dev` sans checkout git, il
propose d’en créer un.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (par défaut `1800`)

## Ce que cela fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient également
la méthode d’installation alignée :

- `dev` → garantit un checkout git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  le met à jour et installe la CLI globale depuis ce checkout.
- `stable` → installe depuis npm avec `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

OpenClaw ne dispose pas encore d’un canal LTS ou de support mensuel. Nous travaillons
vers des lignes de support mensuelles, mais `--channel` accepte actuellement uniquement
`stable`, `beta` et `dev`. Utilisez `--tag <version-or-dist-tag>` pour une cible
ponctuelle lorsque vous avez besoin d’un artefact de paquet spécifique.

L’outil de mise à jour automatique du cœur du Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour `update.run` par gestionnaire de paquets du plan de contrôle
forcent un redémarrage de mise à jour non différé, sans délai de récupération, après l’échange du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des fragments qui pointent vers
des fichiers supprimés par le nouveau paquet.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d’invoquer le gestionnaire de paquets. Les installations globales npm utilisent une installation par étapes :
OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l’inventaire `dist` empaqueté à cet endroit, puis remplace l’arborescence de paquet propre dans le
vrai préfixe global. Si la vérification échoue, le doctor après mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, l’actualisation de complétion des commandes du cœur et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins possédés par le canal alignés avec la
version installée d’OpenClaw, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours d’exécution avant de remplacer l’arborescence
du paquet, puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue avant
de signaler la réussite. Sur macOS, la vérification après mise à jour vérifie également que le LaunchAgent
est chargé/en cours d’exécution pour le profil actif et que le port loopback configuré est
sain. Si le plist est installé mais que launchd ne le supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent, puis réexécute les
vérifications de disponibilité santé/version/canal. Un amorçage frais charge directement le job RunAtLoad,
donc la récupération de mise à jour ne lance pas immédiatement `kickstart -k` sur le Gateway
nouvellement démarré. Si le Gateway ne devient toujours pas sain, la commande se termine
avec un code non nul et affiche le chemin du journal de redémarrage ainsi que des instructions explicites de redémarrage, réinstallation et
retour arrière du paquet. Avec `--no-restart`,
le remplacement du paquet s’exécute toujours, mais le service géré n’est pas arrêté ni
redémarré, donc le Gateway en cours d’exécution peut conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux de checkout git

### Sélection du canal

- `stable` : checkout le dernier tag non beta, puis construit et exécute doctor.
- `beta` : privilégie le dernier tag `-beta`, mais revient au dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : checkout `main`, puis récupère et rebase.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier un worktree propre">
    Nécessite l’absence de modifications non commit.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Build préliminaire (dev uniquement)">
    Exécute le build TypeScript dans un worktree temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver le commit constructible le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour exécuter également le lint pendant cette vérification préliminaire ; le lint s’exécute en mode série contraint, car les hôtes de mise à jour utilisateur sont souvent plus petits que les runners CI.
  </Step>
  <Step title="Rebase">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, l’outil de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis avec un fallback temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Construire l’UI de contrôle">
    Construit le gateway et l’UI de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne par défaut/latest essaient d’abord une version de plugin `@beta`. Si le plugin n’a pas de
version beta, OpenClaw revient à la spec default/latest enregistrée. Pour les plugins npm,
OpenClaw revient également en arrière lorsque le paquet beta existe mais échoue à la validation
d’installation. Les versions exactes et les tags explicites ne sont pas réécrits.

<Warning>
Si une mise à jour de plugin npm avec épinglage exact se résout en un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour le plugin explicitement seulement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins après mise à jour qui sont limités à un plugin géré sont signalés comme avertissements après la réussite de la mise à jour du cœur. Le résultat JSON conserve le `status: "ok"` de mise à jour au niveau supérieur et signale `postUpdate.plugins.status: "warning"` avec les recommandations `openclaw doctor --fix` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues de l’outil de mise à jour ou de synchronisation font toujours échouer le résultat de mise à jour. Corrigez l’installation du plugin ou l’erreur de mise à jour, puis réexécutez `openclaw doctor --fix` ou `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement une vérification : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` par gestionnaire de paquets contournent la temporisation d’inactivité normale et le délai de récupération de redémarrage après l’échange de l’arborescence du paquet, afin que l’ancien processus ne puisse pas continuer à charger paresseusement des fragments supprimés.

Si l’amorçage de pnpm échoue encore, l’outil de mise à jour s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans le checkout.
</Note>

## Raccourci `--update`

`openclaw --update` se réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Associé

- `openclaw doctor` (propose d’exécuter d’abord update sur les checkouts git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)

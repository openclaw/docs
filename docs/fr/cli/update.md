---
read_when:
    - Vous voulez mettre à jour une copie de travail des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement du raccourci `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de source relativement sûre + redémarrage automatique du Gateway)
title: Mise à jour
x-i18n:
    generated_at: "2026-05-07T13:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
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

- `--no-restart` : ignorer le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande ne réussisse.
- `--channel <stable|beta|dev>` : définir le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplacer la cible de paquet pour cette mise à jour uniquement. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualiser les actions de mise à jour prévues (flux canal/tag/cible/redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : afficher le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.warnings` lorsque des plugins gérés corrompus ou impossibles à charger nécessitent
  une réparation après la réussite de la mise à jour du noyau, et `postUpdate.plugins.integrityDrifts`
  lorsque des dérives d’artefacts de plugins npm sont détectées pendant la synchronisation de plugins post-mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (1800 s par défaut).
- `--yes` : ignorer les invites de confirmation (par exemple la confirmation de rétrogradation).

`openclaw update` n’a pas d’option `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions canal/tag/installation/redémarrage prévues, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement besoin des détails
de canal et de disponibilité. Si vous déboguez les journaux du Gateway autour d’une mise à jour,
la verbosité de la console et le niveau des journaux de fichier sont séparés : `--verbose` du Gateway affecte
la sortie terminal/WebSocket, tandis que les journaux de fichier nécessitent `logging.level: "debug"` ou
`"trace"` dans la configuration. Voir [Journalisation du Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions mutantes de `openclaw update` sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake pour cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

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
- `--timeout <seconds>` : délai d’expiration pour les vérifications (3 s par défaut).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (le redémarrage est le comportement par défaut). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (`1800` par défaut)

## Ce qu’elle fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi la
méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour et installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm avec `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du noyau Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour par gestionnaire de paquets `update.run` du plan de contrôle
forcent un redémarrage de mise à jour non différé et sans période de refroidissement après l’échange du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des fragments pointant vers
des fichiers supprimés par le nouveau paquet.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version
du paquet cible avant d’appeler le gestionnaire de paquets. Les installations npm globales utilisent une installation
intermédiaire : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l’inventaire `dist` empaqueté à cet emplacement, puis échange cette arborescence de paquet propre dans le
vrai préfixe global. Si la vérification échoue, le doctor post-mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation de complétion des commandes du noyau et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins appartenant au canal alignés avec la
version installée d’OpenClaw, tout en laissant les reconstructions complètes de complétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets arrêtent le service en cours d’exécution avant de remplacer l’arborescence
du paquet, puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré signale la version attendue avant de
signaler la réussite. Sur macOS, la vérification post-mise à jour vérifie aussi que le LaunchAgent
est chargé/en cours d’exécution pour le profil actif et que le port de bouclage configuré est
sain. Si la plist est installée mais que launchd ne la supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent, puis réexécute les
vérifications de disponibilité santé/version/canal. Un amorçage frais charge directement la tâche RunAtLoad,
si bien que la récupération de mise à jour ne lance pas immédiatement `kickstart -k` sur le Gateway
nouvellement créé. Si le Gateway ne devient toujours pas sain, la commande se termine
avec un code non nul et affiche le chemin du journal de redémarrage ainsi que des instructions explicites de redémarrage, réinstallation et
retour arrière du paquet. Avec `--no-restart`,
le remplacement du paquet s’exécute quand même, mais le service géré n’est pas arrêté ni
redémarré ; le Gateway en cours d’exécution peut donc conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux d’extraction git

### Sélection du canal

- `stable` : extraire le dernier tag non beta, puis compiler et exécuter le doctor.
- `beta` : préférer le dernier tag `-beta`, mais revenir au dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : extraire `main`, puis récupérer et rebaser.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier l’arbre de travail propre">
    Nécessite l’absence de changements non commités.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Compilation préalable (dev uniquement)">
    Exécute la compilation TypeScript dans un arbre de travail temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver le commit compilable le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour exécuter aussi le lint pendant cette vérification préalable ; le lint s’exécute en mode série contraint, car les hôtes de mise à jour utilisateur sont souvent plus petits que les runners CI.
  </Step>
  <Step title="Rebaser">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis avec un recours temporaire à `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm.
  </Step>
  <Step title="Compiler la Control UI">
    Compile le Gateway et la Control UI.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne default/latest essaient d’abord une version de plugin `@beta`. Si le plugin n’a pas de
version beta, OpenClaw revient à la spec default/latest enregistrée. Pour les plugins npm,
OpenClaw revient aussi en arrière lorsque le paquet beta existe mais échoue à la validation
d’installation. Les versions exactes et les tags explicites ne sont pas réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` interrompt cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour le plugin explicitement seulement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins post-mise à jour qui sont limités à un plugin géré sont signalés comme avertissements après la réussite de la mise à jour du noyau. Le résultat JSON conserve le `status: "ok"` de mise à jour de premier niveau et signale `postUpdate.plugins.status: "warning"` avec des indications `openclaw doctor --fix` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation font toujours échouer le résultat de mise à jour. Corrigez l’installation du plugin ou l’erreur de mise à jour, puis réexécutez `openclaw doctor --fix` ou `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est uniquement vérificatif : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` du gestionnaire de paquets contournent la temporisation d’inactivité normale et la période de refroidissement du redémarrage après l’échange de l’arborescence du paquet, afin que l’ancien processus ne puisse pas continuer à charger paresseusement des fragments supprimés.

Si l’amorçage pnpm échoue encore, le programme de mise à jour s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Associés

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)

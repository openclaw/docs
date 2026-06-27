---
read_when:
    - Vous voulez mettre à jour un checkout source en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement du raccourci `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de la source relativement sûre + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-06-27T17:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez OpenClaw à jour en toute sécurité et basculez entre les canaux stable/bêta/dev.

Si vous l’avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour se font via le flux du gestionnaire de paquets dans [Mise à jour](/fr/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Options

- `--no-restart` : ignorer le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour par gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré signale la version mise à jour attendue avant que la commande ne réussisse.
- `--channel <stable|beta|dev>` : définir le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplacer la cible du paquet pour cette mise à jour uniquement. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main` ; les spécifications de source GitHub/git sont empaquetées dans une archive tar temporaire avant l’installation npm globale préparée.
- `--dry-run` : prévisualiser les actions de mise à jour prévues (flux canal/tag/cible/redémarrage) sans écrire la configuration, installer, synchroniser les Plugins ni redémarrer.
- `--json` : afficher le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.warnings` lorsque des Plugins gérés corrompus ou impossibles à charger nécessitent
  une réparation après la réussite de la mise à jour du cœur, les détails de repli des Plugins du canal bêta
  lorsqu’un Plugin n’a pas de version bêta, et `postUpdate.plugins.integrityDrifts`
  lorsque des dérives d’artefacts de Plugins npm sont détectées pendant la synchronisation des Plugins après mise à jour.
- `--timeout <seconds>` : délai d’expiration par étape (par défaut 1800 s).
- `--yes` : ignorer les invites de confirmation (par exemple la confirmation de rétrogradation).
- `--acknowledge-clawhub-risk` : après examen des avertissements de confiance de la communauté ClawHub,
  autoriser la synchronisation des Plugins après mise à jour à continuer sans invite interactive.
  Sans cette option, les versions risquées de Plugins ClawHub communautaires sont ignorées et
  laissées inchangées lorsqu’OpenClaw ne peut pas afficher d’invite. Les paquets ClawHub officiels et
  les sources de Plugins OpenClaw intégrés contournent cette invite de confiance de version.

`openclaw update` n’a pas de flag `--verbose`. Utilisez `--dry-run` pour prévisualiser
les actions prévues de canal/tag/installation/redémarrage, `--json` pour des résultats
lisibles par machine, et `openclaw update status --json` lorsque vous avez seulement besoin des détails de canal et
de disponibilité. Si vous déboguez les journaux Gateway autour d’une mise à jour,
la verbosité de la console et le niveau de journalisation des fichiers sont séparés : Gateway `--verbose` affecte
la sortie terminal/WebSocket, tandis que les journaux de fichiers exigent `logging.level: "debug"` ou
`"trace"` dans la configuration. Voir [Journalisation Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions mutantes de `openclaw update` sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake pour cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) orienté agent. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

<Warning>
Les rétrogradations exigent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Afficher le canal de mise à jour actif + le tag/la branche/le SHA git (pour les extractions de source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : afficher le JSON d’état lisible par machine.
- `--timeout <seconds>` : délai d’expiration des vérifications (par défaut 3 s).

## `update repair`

Réexécuter la finalisation de mise à jour après que le paquet cœur a déjà changé, mais que le travail
de réparation ultérieur ne s’est pas terminé proprement. C’est le chemin de récupération pris en charge lorsque
`openclaw update` a installé le nouveau paquet cœur mais que la synchronisation des Plugins post-cœur,
les métadonnées de Plugins npm gérés, l’actualisation du registre ou la réparation doctor doivent encore
converger.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Options :

- `--channel <stable|beta|dev>` : conserver le canal de mise à jour avant réparation et
  exécuter la convergence des Plugins sur ce canal.
- `--json` : afficher le JSON de finalisation lisible par machine.
- `--timeout <seconds>` : délai d’expiration des étapes de réparation (par défaut `1800`).
- `--yes` : ignorer les invites de confirmation.
- `--acknowledge-clawhub-risk` : après examen des avertissements de confiance de la communauté ClawHub,
  autoriser la convergence des Plugins au moment de la réparation à continuer sans
  invite interactive. Les paquets ClawHub officiels et les sources de Plugins OpenClaw intégrés
  contournent cette invite de confiance de version.
- `--no-restart` : accepté pour la parité avec la commande de mise à jour ; la réparation ne redémarre jamais le
  Gateway.

`openclaw update repair` exécute `openclaw doctor --fix`, recharge la configuration réparée
et les enregistrements d’installation, synchronise les Plugins suivis pour le canal de mise à jour actif,
met à jour les installations de Plugins npm gérés, répare les charges utiles de Plugins configurés manquantes,
actualise le registre des Plugins et écrit les métadonnées d’enregistrements d’installation convergées.
Il n’installe pas de nouveau paquet cœur et ne redémarre pas le Gateway.

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (par défaut, il redémarre). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (par défaut `1800`)

## Ce qu’elle fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw garde aussi la
méthode d’installation alignée :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, ou `$OPENCLAW_HOME/openclaw` lorsque
  `OPENCLAW_HOME` est défini ; remplacez avec `OPENCLAW_GIT_DIR`),
  la met à jour et installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm en utilisant `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais se rabat sur `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour par gestionnaire de paquets `update.run`
du plan de contrôle et les mises à jour d’extraction git supervisées utilisent aussi un
transfert de service géré au lieu de remplacer l’arborescence du paquet ou de reconstruire
`dist/` dans le processus Gateway actif. Le Gateway démarre un assistant détaché,
quitte, puis l’assistant exécute le chemin CLI normal `openclaw update --yes --json`
depuis l’extérieur de l’arborescence de processus Gateway. Si ce transfert n’est pas disponible,
`update.run` renvoie une réponse structurée avec la commande shell sûre à exécuter
manuellement.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la version du paquet cible
avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation préparée :
OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, y vérifie
l’inventaire `dist` empaqueté, puis échange cette arborescence de paquet propre avec le
vrai préfixe global. Si la vérification échoue, les travaux doctor, synchronisation des Plugins et
redémarrage après mise à jour ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des Plugins, une actualisation de complétion des commandes cœur et les travaux de redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de Plugins détenus par le canal alignés avec la
version OpenClaw installée, tout en laissant les reconstructions complètes de complétion des commandes de Plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway local géré est installé et que le redémarrage est activé,
les mises à jour par gestionnaire de paquets et par extraction git arrêtent le service en cours d’exécution avant
de remplacer l’arborescence du paquet ou de modifier l’extraction/la sortie de build. Le programme de mise à jour
actualise ensuite les métadonnées du service depuis l’installation mise à jour, redémarre le
service et vérifie le Gateway redémarré avant de signaler
`Gateway: restarted and verified.`. Les mises à jour par gestionnaire de paquets vérifient en plus que
le Gateway redémarré signale la version de paquet attendue ; les mises à jour par extraction git
vérifient la santé du Gateway et la disponibilité du service après la reconstruction. Sur macOS, la
vérification après mise à jour vérifie aussi que le LaunchAgent est chargé/en cours d’exécution pour le profil
actif et que le port loopback configuré est sain. Si le plist est installé
mais que launchd ne le supervise pas, OpenClaw réinitialise automatiquement le LaunchAgent,
puis relance les vérifications de disponibilité santé/version/canal. Une initialisation fraîche
charge directement la tâche RunAtLoad, de sorte que la récupération de mise à jour ne
`kickstart -k` pas immédiatement le Gateway nouvellement lancé. Si le Gateway ne devient toujours pas
sain, la commande se termine avec un code non nul et affiche le chemin du journal de redémarrage
ainsi que des instructions explicites de redémarrage, réinstallation et restauration du paquet. Si le redémarrage
ne peut pas s’exécuter, la commande affiche `Gateway: restart skipped (...)` ou
`Gateway: restart failed: ...` avec une indication manuelle `openclaw gateway restart`.
Avec `--no-restart`, le remplacement du paquet ou la reconstruction git s’exécute quand même, mais le
service géré n’est pas arrêté ni redémarré ; le Gateway en cours d’exécution peut donc conserver l’ancien
code jusqu’à ce que vous le redémarriez manuellement.

### Forme de la réponse du plan de contrôle

Lorsque `update.run` est invoqué via le plan de contrôle Gateway sur une
installation par gestionnaire de paquets ou une extraction git supervisée, le gestionnaire signale
l’initiation du transfert séparément de la mise à jour CLI qui continue après la sortie du
Gateway :

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` et
  `handoff.status: "started"` signifient que le Gateway a créé le transfert de service géré
  et planifié son propre redémarrage afin que l’assistant détaché puisse exécuter
  `openclaw update --yes --json` en dehors du processus du service actif.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` et
  `handoff.status: "unavailable"` signifient qu’OpenClaw n’a pas pu trouver une frontière de service supervisant
  et une identité de service durable pour un transfert sûr. Par
  exemple, le transfert systemd exige l’identité de l’unité OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), pas seulement des marqueurs ambiants de processus systemd. La
  réponse inclut `handoff.command`, la commande shell à exécuter depuis l’extérieur du
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` signifie que le
  Gateway a essayé de créer le transfert, mais n’a pas pu lancer l’assistant détaché.

La charge utile `sentinel` est toujours écrite avant la sortie du Gateway, et le transfert CLI
met à jour le même sentinelle de redémarrage après la fin des vérifications de santé du redémarrage de service géré.
Pendant le transfert, le sentinelle peut porter
`stats.reason: "restart-health-pending"` sans continuation de réussite ; le
Gateway redémarré continue de l’interroger et ne déclenche la continuation qu’après que la CLI
a vérifié la santé du service et réécrit le sentinelle avec le résultat final `ok`.
`openclaw status` et `openclaw status --all` affichent une ligne `Update restart`
tant que ce sentinelle est en attente ou en échec, et `update.status` actualise et
renvoie le dernier sentinelle.

## Flux d’extraction git

### Sélection du canal

- `stable` : extraire le dernier tag non bêta, puis build et doctor.
- `beta` : préférer le dernier tag `-beta`, mais se rabattre sur le dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : extraire `main`, puis récupérer et rebaser.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que l’arbre de travail est propre">
    Nécessite l’absence de modifications non commités.
  </Step>
  <Step title="Changer de canal">
    Passe au canal sélectionné (étiquette ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Build de prévol (dev uniquement)">
    Exécute le build TypeScript dans un arbre de travail temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver le commit le plus récent pouvant être buildé. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour exécuter aussi le lint pendant ce prévol ; le lint s’exécute en mode série contraint, car les hôtes de mise à jour utilisateur sont souvent plus petits que les exécuteurs CI.
  </Step>
  <Step title="Rebaser">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis via un repli temporaire `npm install pnpm@11`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm.
  </Step>
  <Step title="Builder Control UI">
    Builde le gateway et la Control UI.
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
version beta, OpenClaw se rabat sur la spécification par défaut/latest enregistrée et le signale
comme avertissement. Pour les plugins npm, OpenClaw se rabat aussi lorsque le paquet beta
existe mais échoue à la validation d’installation. Ces avertissements de repli de plugin ne
font pas échouer la mise à jour du cœur. Les versions exactes et les étiquettes explicites ne sont pas
réécrites.

<Warning>
Si une mise à jour de plugin npm épinglée exactement se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour le plugin explicitement seulement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins postérieurs à la mise à jour qui sont limités à un plugin géré et que le chemin de synchronisation peut contourner (par exemple un registre npm inaccessible pour un plugin non essentiel) sont signalés comme avertissements après la réussite de la mise à jour du cœur. Le résultat JSON conserve le `status: "ok"` de mise à jour de premier niveau et signale `postUpdate.plugins.status: "warning"` avec des consignes `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation font toujours échouer le résultat de mise à jour. Corrigez l’installation du plugin ou l’erreur de mise à jour, puis réexécutez `openclaw update repair`.

Après l’étape de synchronisation par plugin, `openclaw update` exécute une passe obligatoire de **convergence post-cœur** avant le redémarrage du gateway : elle répare les payloads de plugins configurés manquants, valide sur disque chaque enregistrement d’installation suivi _actif_, et vérifie statiquement que son `package.json` est analysable (et que tout `main` déclaré explicitement existe). Les échecs de cette passe — ainsi qu’un instantané de configuration OpenClaw invalide — renvoient `postUpdate.plugins.status: "error"` et font basculer le `status` de mise à jour de premier niveau vers `"error"`, si bien que `openclaw update` se termine avec un code non nul et que le gateway n’est _pas_ redémarré avec un ensemble de plugins non vérifié. L’erreur inclut des lignes structurées `postUpdate.plugins.warnings[].guidance` pointant vers `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json` pour le suivi. Les entrées de plugins désactivées et les enregistrements qui ne sont pas des cibles de synchronisation officielles liées à une source de confiance sont ignorés ici, reflétant la politique `skipDisabledPlugins` utilisée par la vérification des payloads manquants, de sorte qu’un enregistrement de plugin désactivé obsolète ne peut pas bloquer une mise à jour par ailleurs valide.

Lorsque le Gateway mis à jour démarre, le chargement des plugins se fait uniquement en vérification : le démarrage n’exécute pas
de gestionnaires de paquets et ne modifie pas les arbres de dépendances. Les redémarrages `update.run`
du gestionnaire de paquets sont transmis au chemin de service géré par la CLI, de sorte que l’échange de paquet se produit
en dehors de l’ancien processus Gateway et que les vérifications de santé du service décident si la
mise à jour peut être signalée comme terminée.

Si l’amorçage pnpm échoue toujours, le programme de mise à jour s’arrête tôt avec une erreur spécifique au gestionnaire de paquets au lieu d’essayer `npm run build` dans le checkout.
</Note>

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Connexe

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les checkouts git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)

---
read_when:
    - Vous souhaitez mettre à jour une copie de travail des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement de la notation abrégée `--update`
summary: Référence CLI pour `openclaw update` (mise à jour raisonnablement sûre des sources + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-07-16T13:10:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw et basculez entre les canaux stable/extended-stable/beta/dev.

Si vous avez effectué l’installation via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour suivent le processus du gestionnaire de paquets décrit dans
[Mise à jour](/fr/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les
scripts de lancement).

## Options

| Indicateur                                       | Description                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour du gestionnaire de paquets qui effectuent un redémarrage vérifient que le service redémarré indique la version attendue avant la réussite de la commande.                                                                                              |
| `--channel <stable\|extended-stable\|beta\|dev>` | Définit le canal de mise à jour et le conserve après la réussite de la mise à jour du cœur. Extended-stable est disponible uniquement sous forme de paquet.                                                                                                                                                                                  |
| `--tag <dist-tag\|version\|spec>`                | Remplace la cible du paquet uniquement pour cette mise à jour. Cette option ne peut pas être combinée avec un canal `extended-stable` effectif, dont la cible exacte vérifiée est obligatoire. Pour les autres installations par paquet, `main` correspond à `github:openclaw/openclaw#main` ; les spécifications de source GitHub/git sont empaquetées dans une archive tar temporaire avant l’installation globale intermédiaire par npm. |
| `--dry-run`                                      | Affiche un aperçu des actions prévues (canal/tag/cible/processus de redémarrage) sans écrire la configuration, effectuer d’installation, synchroniser les plugins ni redémarrer.                                                                                                                                                              |
| `--json`                                         | Affiche un JSON `UpdateRunResult` lisible par une machine. Inclut `postUpdate.plugins.warnings` lorsqu’un plugin géré doit être réparé, les détails du repli des plugins du canal beta et `postUpdate.plugins.integrityDrifts` lorsqu’une dérive de l’artefact npm d’un plugin est détectée pendant la synchronisation après mise à jour.                                |
| `--timeout <seconds>`                            | Délai d’expiration par étape. Valeur par défaut : `1800`.                                                                                                                                                                                                                                                                          |
| `--yes`                                          | Ignore les demandes de confirmation (par exemple, la confirmation d’une rétrogradation).                                                                                                                                                                                                                                                      |
| `--acknowledge-clawhub-risk`                     | Permet à la synchronisation des plugins après la mise à jour de continuer malgré les avertissements de confiance concernant la communauté ClawHub, sans demande interactive. Sans cette option, les versions communautaires risquées sont ignorées et laissées inchangées lorsqu’OpenClaw ne peut pas demander de confirmation. Les paquets ClawHub officiels et les sources de plugins intégrées contournent cette demande. |

Il n’existe aucun indicateur `--verbose`. Utilisez `--dry-run` pour afficher un aperçu des actions prévues,
`--json` pour obtenir des résultats lisibles par une machine et `openclaw update status --json`
uniquement pour le canal et la disponibilité. Le niveau de détail de la console du Gateway (`--verbose`) et
le niveau de journalisation des fichiers (`logging.level: "debug"`/`"trace"`) sont des réglages indépendants ; consultez
[Journalisation du Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions de `openclaw update` qui effectuent des modifications sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake de cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

<Warning>
Les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent rendre la configuration inutilisable.
Si l’installation a déjà migré les sessions vers SQLite, restaurez les artefacts de transcription hérités archivés
avant de démarrer une ancienne version utilisant un stockage par fichiers. Consultez
[Doctor : rétrogradation après la migration des sessions vers SQLite](/fr/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Affichez le canal de mise à jour actif, le tag/la branche/le SHA git (uniquement pour les extractions du code source)
et la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Indicateur            | Valeur par défaut | Description                                  |
| --------------------- | ----------------- | -------------------------------------------- |
| `--json`              | `false` | Affiche le JSON d’état lisible par une machine. |
| `--timeout <seconds>` | `3`     | Délai d’expiration des vérifications.        |

Pour les installations du paquet extended-stable, l’état applique le même sélecteur public
et la même vérification exacte du paquet que la mise à jour au premier plan. Il peut indiquer
`ahead of extended-stable` lorsque la version installée est plus récente. Les échecs JSON
incluent `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` ou `unsupported_git_channel`).

## `update repair`

Relancez la finalisation de la mise à jour lorsque le paquet principal a déjà été modifié, mais que les travaux de
réparation ultérieurs ne se sont pas achevés correctement. Il s’agit du processus de récupération pris en charge lorsque
`openclaw update` a installé le nouveau paquet principal, mais que la synchronisation des plugins après la mise à jour du cœur,
les métadonnées des plugins npm gérés, l’actualisation du registre ou la réparation par Doctor n’ont pas
convergé.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Indicateur                                       | Description                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Conserve le canal de mise à jour du cœur avant la réparation. Pour extended-stable, les plugins npm officiels admissibles qui suivent une intention nue/par défaut ou `latest` ciblent la version exacte du cœur installée. La réparation extended-stable est refusée dans les extractions Git sans modifier la configuration. |
| `--json`                                         | Affiche le JSON de finalisation lisible par une machine.                                                                                                                                                                                                             |
| `--timeout <seconds>`                            | Délai d’expiration des étapes de réparation. Valeur par défaut : `1800`.                                                                                                                                                                                 |
| `--yes`                                          | Ignore les demandes de confirmation.                                                                                                                                                                                                                                 |
| `--acknowledge-clawhub-risk`                     | Même comportement que pour `openclaw update`.                                                                                                                                                                                                                       |
| `--no-restart`                                   | Accepté par souci de parité ; la réparation ne redémarre jamais le Gateway.                                                                                                                                                                                          |

`update repair` exécute `openclaw doctor --fix`, recharge la configuration réparée et
les enregistrements d’installation, synchronise les plugins suivis pour le canal de mise à jour actif, met à jour
les installations gérées de plugins npm, répare les charges utiles manquantes des plugins configurés,
actualise le registre des plugins et écrit les métadonnées convergées des enregistrements d’installation.
Cette commande n’installe pas de nouveau paquet principal et ne redémarre pas le Gateway.

## `update wizard`

Processus interactif permettant de choisir un canal de mise à jour et de confirmer s’il faut ensuite redémarrer le
Gateway (le redémarrage est le choix par défaut). La sélection de `dev` sans extraction git
propose d’en créer une.

| Indicateur            | Valeur par défaut | Description                                  |
| --------------------- | ----------------- | -------------------------------------------- |
| `--timeout <seconds>` | `1800`  | Délai d’expiration de chaque étape de mise à jour. |

## Fonctionnement

Le changement explicite de canal (`--channel ...`) maintient également la méthode d’installation
alignée :

- `dev` -> garantit la présence d’une extraction git (`~/openclaw` par défaut, ou
  `$OPENCLAW_HOME/openclaw` lorsque `OPENCLAW_HOME` est défini ; remplacez-la avec
  `OPENCLAW_GIT_DIR`), la met à jour et installe la CLI globale à partir de cette
  extraction.
- `stable` -> effectue l’installation depuis npm à l’aide de `latest`.
- `extended-stable` -> résout le sélecteur npm public `extended-stable`,
  vérifie le paquet exact sélectionné et installe cette version précise. Il
  ne se replie pas vers un autre sélecteur et est refusé pour les extractions Git.
- `beta` -> privilégie le dist-tag npm `beta`, avec un repli vers `latest` lorsque la version beta est
  absente ou antérieure à la version stable actuelle.

### Transfert du redémarrage

Le programme de mise à jour automatique du cœur du Gateway (lorsqu’il est activé dans la configuration) lance le processus de
mise à jour de la CLI en dehors du gestionnaire de requêtes actif du Gateway. Les mises à jour du gestionnaire de paquets
`update.run` du plan de contrôle et les mises à jour supervisées des extractions git utilisent
le même transfert vers le service géré, au lieu de remplacer l’arborescence des paquets ou de
reconstruire `dist/` dans le processus actif du Gateway : le Gateway lance un
assistant détaché et s’arrête, puis cet assistant exécute `openclaw update --yes --json`
en dehors de l’arborescence des processus du Gateway. Si le transfert n’est pas disponible,
`update.run` renvoie une réponse structurée contenant la commande shell sûre à exécuter
manuellement.

Les sélections extended-stable enregistrées reçoivent au démarrage des indications en lecture seule et des
indications de mise à jour toutes les 24 heures lorsque `update.checkOnStart` est activé. Ces vérifications n’appliquent jamais de mise à jour,
ne lancent pas de transfert, ne redémarrent pas le Gateway, n’utilisent pas le délai ni la gigue du canal stable, et n’utilisent pas
la cadence d’interrogation du canal bêta. Les mises à jour explicites au premier plan, les mises à jour simples au premier plan avec
`update.channel: "extended-stable"` enregistré, l’état à la demande et leur transfert géré
du Gateway restent pris en charge.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est activé,
les mises à jour via le gestionnaire de paquets et celles des checkouts Git arrêtent le service en cours d’exécution avant de
remplacer l’arborescence du paquet ou de modifier la sortie du checkout/de la compilation. Le programme de mise à jour
actualise ensuite les métadonnées du service, redémarre le service et vérifie le
Gateway redémarré avant de signaler `Gateway: restarted and verified.`.
Les mises à jour via le gestionnaire de paquets vérifient en outre que le Gateway redémarré indique la
version attendue du paquet ; les mises à jour des checkouts Git vérifient l’intégrité du Gateway et
la disponibilité du service après la recompilation.

Les mises à jour via le gestionnaire de paquets continuent normalement d’utiliser le binaire Node enregistré dans le
service géré. Si ce Node ne peut pas exécuter la version cible, mais que le Node
actuel de la CLI le peut et qu’il est établi que le service appartient au paquet en cours de mise à jour,
une mise à jour avec redémarrage utilise le Node actuel pour la finalisation et réécrit
les métadonnées du service pour cet environnement d’exécution. `--no-restart` ne peut pas réparer les métadonnées
du service ; la même incompatibilité d’environnement d’exécution provoque donc l’arrêt avant toute modification du paquet.

Sous macOS, la vérification après mise à jour confirme également que le LaunchAgent est
chargé/en cours d’exécution pour le profil actif et que le port de bouclage configuré est
opérationnel. Si le plist est installé mais que launchd ne le supervise pas, OpenClaw
réamorce automatiquement le LaunchAgent et relance les vérifications d’intégrité/de version/
de disponibilité du canal (un nouvel amorçage charge directement la tâche `RunAtLoad`,
de sorte que la récupération ne `kickstart -k` pas immédiatement le Gateway nouvellement lancé). Si
le Gateway ne devient toujours pas opérationnel, la commande se termine avec un code différent de zéro et
affiche le chemin du journal de redémarrage ainsi que des instructions de redémarrage, de réinstallation et de restauration
du paquet.

Si le redémarrage ne peut pas s’exécuter, la commande affiche `Gateway: restart skipped (...)` ou
`Gateway: restart failed: ...` avec une indication manuelle `openclaw gateway restart`.
Avec `--no-restart`, le remplacement du paquet ou la recompilation Git s’exécute tout de même, mais le
service géré n’est ni arrêté ni redémarré ; le Gateway en cours d’exécution conserve donc l’ancien
code jusqu’à ce que vous le redémarriez manuellement.

### Format de réponse du plan de contrôle

Lorsque `update.run` s’exécute par l’intermédiaire du plan de contrôle du Gateway sur une installation via le gestionnaire de paquets
ou un checkout Git supervisé, le gestionnaire signale le lancement du transfert
séparément de la mise à jour de la CLI qui se poursuit après l’arrêt du Gateway :

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` et
  `handoff.status: "started"` : le Gateway a créé le transfert du service géré
  et planifié son propre redémarrage afin que l’assistant détaché puisse exécuter
  `openclaw update --yes --json` en dehors du processus du service actif.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` et
  `handoff.status: "unavailable"` : OpenClaw n’a pas pu trouver de limite de service de supervision
  ni d’identité de service durable permettant un transfert sûr (par
  exemple, le transfert systemd exige l’identité d’unité `OPENCLAW_SYSTEMD_UNIT`,
  et non de simples marqueurs ambiants de processus systemd). La réponse inclut
  `handoff.command`, la commande shell à exécuter depuis l’extérieur du Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` : le Gateway
  a tenté de créer le transfert, mais n’a pas pu lancer l’assistant détaché.

La charge utile `sentinel` est écrite avant l’arrêt du Gateway, et le transfert de la CLI
met à jour cette même sentinelle de redémarrage une fois les vérifications d’intégrité du redémarrage
du service géré terminées. Pendant le transfert, la sentinelle peut contenir
`stats.reason: "restart-health-pending"` sans continuation en cas de réussite ; le
Gateway redémarré l’interroge et ne déclenche la continuation qu’après que la CLI a
vérifié l’intégrité du service et réécrit la sentinelle avec le résultat final `ok`.
`openclaw status` et `openclaw status --all` affichent une ligne `Update restart`
tant que cette sentinelle est en attente ou en échec, et `update.status` actualise et
renvoie la sentinelle la plus récente.

## Flux de checkout Git

### Sélection du canal

- `stable` : extraire le dernier tag non bêta, puis compiler et exécuter doctor.
- `beta` : privilégier le dernier tag `-beta`, avec repli sur le dernier tag stable
  si la version bêta est absente ou plus ancienne.
- `dev` : extraire `main`, puis récupérer et rebaser.
- `extended-stable` : non pris en charge pour les checkouts Git ; aucune modification du checkout
  n’est effectuée.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier la propreté de l’arborescence de travail">
    Exige l’absence de modifications non validées.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer depuis le dépôt amont">
    Développement uniquement.
  </Step>
  <Step title="Compilation préalable (développement uniquement)">
    Exécute la compilation TypeScript dans une arborescence de travail temporaire. Si la révision de tête échoue, remonte jusqu’à 10 commits pour trouver le commit compilable le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour également exécuter le lint pendant cette vérification préalable ; le lint s’exécute en mode série contraint, car les hôtes de mise à jour des utilisateurs sont souvent moins puissants que les exécuteurs de CI.
  </Step>
  <Step title="Rebaser">
    Rebase sur le commit sélectionné (développement uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord via `corepack`, puis au moyen d’un repli temporaire `npm install pnpm@11`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm. Si l’amorçage de pnpm échoue encore, le programme de mise à jour s’arrête rapidement avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans le checkout.
  </Step>
  <Step title="Compiler l’interface de contrôle">
    Compile le Gateway et l’interface de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Le développement utilise les plugins intégrés ; les canaux stable et bêta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

### Détails de la synchronisation des plugins

Sur le canal bêta, les installations de plugins npm et ClawHub suivies qui suivent la
ligne par défaut/la plus récente essaient d’abord une version `@beta` du plugin. Si le plugin ne dispose d’aucune
version bêta, OpenClaw se replie sur la spécification par défaut/la plus récente enregistrée et
signale un avertissement. Pour les plugins npm, OpenClaw se replie également lorsque le paquet
bêta existe, mais échoue à la validation de l’installation. Ces avertissements de repli ne font pas
échouer la mise à jour du cœur. Les versions exactes et les tags explicites ne sont jamais réécrits.

<Warning>
Si la mise à jour d’un plugin npm épinglé à une version exacte se résout en un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne la mise à jour de cet artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins après la mise à jour qui sont limités à un plugin géré et que le chemin de synchronisation peut contourner (par exemple, un registre npm inaccessible pour un plugin non essentiel) sont signalés sous forme d’avertissements après la réussite de la mise à jour du cœur. Le résultat JSON conserve `status: "ok"` pour la mise à jour de premier niveau et indique `postUpdate.plugins.status: "warning"` avec les recommandations `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation font toujours échouer le résultat de la mise à jour. Corrigez l’erreur d’installation ou de mise à jour du plugin, puis relancez `openclaw update repair`. Lorsqu’une mise à jour échouée rend un plugin géré inutilisable, OpenClaw désactive son entrée d’environnement d’exécution et réinitialise les emplacements actifs sans modifier la stratégie `plugins.allow` ou `plugins.deny` définie par l’opérateur.

Après l’étape de synchronisation de chaque plugin, `openclaw update` exécute une passe obligatoire de **convergence après mise à jour du cœur** avant le redémarrage du Gateway : elle répare les charges utiles manquantes des plugins configurés, valide sur disque chaque enregistrement d’installation suivi _actif_ et vérifie statiquement que son `package.json` peut être analysé (et que tout `main` explicitement déclaré existe). Les échecs de cette passe, ainsi qu’un instantané de configuration non valide, renvoient `postUpdate.plugins.status: "error"` et font passer la mise à jour de premier niveau `status` à `"error"`, de sorte que `openclaw update` se termine avec un code différent de zéro et que le Gateway ne soit _pas_ redémarré avec un ensemble de plugins non vérifié. L’erreur inclut des lignes structurées `postUpdate.plugins.warnings[].guidance` pointant vers `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json`. Les entrées de plugins désactivées et les enregistrements qui ne sont pas des cibles officielles de synchronisation liées à une source approuvée sont ignorés ici (conformément à la stratégie `skipDisabledPlugins` utilisée par la vérification des charges utiles manquantes), afin qu’un enregistrement obsolète de plugin désactivé ne puisse pas bloquer une mise à jour par ailleurs valide.

Au démarrage du Gateway mis à jour, le chargement des plugins se limite à la vérification : le démarrage n’exécute pas de gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` du gestionnaire de paquets sont confiés au chemin de service géré de la CLI, de sorte que l’échange de paquets s’effectue en dehors de l’ancien processus du Gateway et que les vérifications d’intégrité du service déterminent si la mise à jour peut être signalée comme terminée.
</Note>

Après la réussite d’une mise à jour du cœur extended-stable, l’intégrité et la
convergence des plugins après mise à jour du cœur ciblent les plugins npm officiels admissibles à la version exacte
du cœur installé. Pour l’intention par défaut/`latest`, OpenClaw n’interroge pas le
`@extended-stable` du plugin et ne se replie pas sur le `latest` de npm ; il déduit la version du paquet
à partir du cœur installé. Les épinglages explicites de version, les tags explicites autres que `latest`,
les paquets tiers et les sources autres que npm conservent leur intention existante.

Pour les installations via le gestionnaire de paquets, `openclaw update` résout la version cible du paquet
avant d’appeler le gestionnaire de paquets. Les installations globales npm utilisent une installation
intermédiaire : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire,
permet au paquet candidat de valider la version de Node de l’hôte pendant `preinstall`,
et y vérifie l’inventaire `dist` du paquet. Un garde d’achèvement empaqueté
reste en dehors de cet inventaire jusqu’à la réussite de `preinstall`, afin que les gestionnaires de paquets
qui ignorent les scripts de cycle de vie s’arrêtent également avant l’activation. Sous npm 12 et versions ultérieures,
le programme de mise à jour n’autorise que le cycle de vie du candidat OpenClaw ; les scripts des
dépendances transitives restent bloqués. OpenClaw échange ensuite l’arborescence propre du paquet
dans le véritable préfixe global. Si la vérification échoue, les opérations doctor après mise à jour, de synchronisation des plugins
et de redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la
version installée correspond déjà à la cible, la commande actualise
l’installation globale du paquet, puis exécute la synchronisation des plugins, une actualisation de l’autocomplétion
des commandes du cœur et les opérations de redémarrage. Cela maintient les composants annexes du paquet et les enregistrements de
plugins appartenant au canal alignés sur la version installée d’OpenClaw, tout en réservant les reconstructions complètes
de l’autocomplétion des commandes de plugins aux exécutions explicites de
`openclaw completion --write-state`.

## Voir aussi

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les checkouts Git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

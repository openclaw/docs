---
read_when:
    - Vous souhaitez mettre à jour une copie de travail des sources en toute sécurité
    - Vous déboguez la sortie ou les options de `openclaw update`
    - Vous devez comprendre le comportement du raccourci `--update`
summary: Référence CLI pour `openclaw update` (mise à jour relativement sûre des sources + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-07-12T15:17:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
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

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et
les scripts de lancement).

## Options

| Indicateur                                       | Description                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Ignore le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour effectuées par le gestionnaire de paquets qui redémarrent le service vérifient que celui-ci signale la version attendue avant que la commande ne réussisse.                                                                                           |
| `--channel <stable\|extended-stable\|beta\|dev>` | Définit le canal de mise à jour et le conserve après la réussite de la mise à jour du cœur. Extended-stable est réservé aux paquets.                                                                                                                                                                                                          |
| `--tag <dist-tag\|version\|spec>`                | Remplace la cible du paquet pour cette mise à jour uniquement. Cette option ne peut pas être combinée avec un canal `extended-stable` effectif, dont la cible exacte vérifiée est obligatoire. Pour les autres installations par paquet, `main` correspond à `github:openclaw/openclaw#main` ; les spécifications de source GitHub/git sont regroupées dans une archive tar temporaire avant l’installation globale intermédiaire par npm. |
| `--dry-run`                                      | Prévisualise les actions prévues (canal/tag/cible/processus de redémarrage) sans écrire la configuration, effectuer l’installation, synchroniser les plugins ni redémarrer.                                                                                                                                                                    |
| `--json`                                         | Affiche un JSON `UpdateRunResult` lisible par une machine. Inclut `postUpdate.plugins.warnings` lorsqu’un plugin géré doit être réparé, les détails du repli des plugins du canal beta et `postUpdate.plugins.integrityDrifts` lorsqu’une dérive des artefacts de plugin npm est détectée pendant la synchronisation après la mise à jour.     |
| `--timeout <seconds>`                            | Délai d’expiration par étape. Valeur par défaut : `1800`.                                                                                                                                                                                                                                                                                     |
| `--yes`                                          | Ignore les demandes de confirmation (par exemple, la confirmation d’une rétrogradation).                                                                                                                                                                                                                                                     |
| `--acknowledge-clawhub-risk`                     | Autorise la synchronisation des plugins après la mise à jour à poursuivre malgré les avertissements de confiance concernant la communauté ClawHub, sans invite interactive. Sans cette option, les versions communautaires risquées sont ignorées et laissées inchangées lorsqu’OpenClaw ne peut pas afficher d’invite. Les paquets ClawHub officiels et les sources de plugins intégrées ne déclenchent pas cette invite. |

Il n’existe aucun indicateur `--verbose`. Utilisez `--dry-run` pour prévisualiser les actions prévues,
`--json` pour obtenir des résultats lisibles par une machine et `openclaw update status --json`
pour connaître uniquement le canal et la disponibilité. La verbosité de la console du Gateway (`--verbose`) et
le niveau de journalisation dans les fichiers (`logging.level: "debug"`/`"trace"`) sont des réglages indépendants ; consultez
[Journalisation du Gateway](/fr/gateway/logging).

<Note>
En mode Nix (`OPENCLAW_NIX_MODE=1`), les exécutions de `openclaw update` qui effectuent des modifications sont désactivées. Mettez plutôt à jour la source Nix ou l’entrée flake de cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) privilégiant l’agent. `openclaw update status` et `openclaw update --dry-run` restent en lecture seule.
</Note>

<Warning>
Les rétrogradations nécessitent une confirmation, car les versions antérieures peuvent rendre la configuration inutilisable.
Si l’installation a déjà migré les sessions vers SQLite, restaurez les artefacts archivés des anciennes
transcriptions avant de démarrer une version antérieure reposant sur des fichiers. Consultez
[Doctor : rétrogradation après la migration des sessions vers SQLite](/fr/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Affichez le canal de mise à jour actif, le tag/la branche/le SHA git (uniquement pour les copies de travail des sources)
et la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Indicateur            | Valeur par défaut | Description                                    |
| --------------------- | ----------------- | ---------------------------------------------- |
| `--json`              | `false`           | Affiche un JSON d’état lisible par une machine. |
| `--timeout <seconds>` | `3`               | Délai d’expiration des vérifications.          |

Pour les installations de paquets extended-stable, l’état applique le même sélecteur public
et la même vérification du paquet exact que la mise à jour au premier plan. Il peut signaler
`ahead of extended-stable` lorsque la version installée est plus récente. Les échecs JSON
incluent `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` ou `unsupported_git_channel`).

## `update repair`

Relancez la finalisation de la mise à jour lorsque le paquet principal a déjà été modifié, mais que les travaux
de réparation ultérieurs ne se sont pas terminés correctement. Il s’agit du processus de récupération pris en charge lorsque
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
| `--channel <stable\|extended-stable\|beta\|dev>` | Conserve le canal de mise à jour du cœur avant la réparation. Pour extended-stable, les plugins npm officiels admissibles qui suivent une intention nue/par défaut ou `latest` ciblent la version exacte du cœur installée. La réparation extended-stable est refusée dans les copies de travail Git sans modifier la configuration. |
| `--json`                                         | Affiche un JSON de finalisation lisible par une machine.                                                                                                                                                                                                             |
| `--timeout <seconds>`                            | Délai d’expiration des étapes de réparation. Valeur par défaut : `1800`.                                                                                                                                                                                             |
| `--yes`                                          | Ignore les demandes de confirmation.                                                                                                                                                                                                                                 |
| `--acknowledge-clawhub-risk`                     | Même comportement que pour `openclaw update`.                                                                                                                                                                                                                        |
| `--no-restart`                                   | Accepté à des fins de cohérence ; la réparation ne redémarre jamais le Gateway.                                                                                                                                                                                      |

`update repair` exécute `openclaw doctor --fix`, recharge la configuration réparée et
les enregistrements d’installation, synchronise les plugins suivis pour le canal de mise à jour actif, met à jour
les installations de plugins npm gérées, répare les charges utiles manquantes des plugins configurés,
actualise le registre des plugins et écrit les métadonnées convergées des enregistrements d’installation.
Cette commande n’installe pas de nouveau paquet principal et ne redémarre pas le Gateway.

## `update wizard`

Processus interactif permettant de choisir un canal de mise à jour et de confirmer s’il faut ensuite redémarrer le
Gateway (redémarrage par défaut). La sélection de `dev` sans copie de travail git
propose d’en créer une.

| Indicateur            | Valeur par défaut | Description                                  |
| --------------------- | ----------------- | -------------------------------------------- |
| `--timeout <seconds>` | `1800`            | Délai d’expiration de chaque étape de mise à jour. |

## Fonctionnement

Le changement explicite de canal (`--channel ...`) maintient également la méthode d’installation
alignée :

- `dev` -> garantit l’existence d’une copie de travail git (par défaut `~/openclaw`, ou
  `$OPENCLAW_HOME/openclaw` lorsque `OPENCLAW_HOME` est défini ; remplacez ce chemin avec
  `OPENCLAW_GIT_DIR`), la met à jour et installe la CLI globale à partir de cette
  copie de travail.
- `stable` -> effectue l’installation depuis npm avec `latest`.
- `extended-stable` -> résout le sélecteur npm public `extended-stable`,
  vérifie le paquet exact sélectionné et installe cette version exacte. Il
  ne se replie pas sur un autre sélecteur et est refusé pour les copies de travail Git.
- `beta` -> privilégie le dist-tag npm `beta`, avec un repli sur `latest` lorsque la version beta est
  absente ou antérieure à la version stable actuelle.

### Transfert du redémarrage

Le programme de mise à jour automatique du cœur du Gateway (lorsqu’il est activé par la configuration) lance le processus de
mise à jour de la CLI en dehors du gestionnaire de requêtes actif du Gateway. Les mises à jour par gestionnaire de paquets
`update.run` du plan de contrôle et les mises à jour supervisées des copies de travail git utilisent
le même transfert vers le service géré au lieu de remplacer l’arborescence des paquets ou de
reconstruire `dist/` au sein du processus actif du Gateway : le Gateway démarre un
assistant détaché et s’arrête, puis cet assistant exécute `openclaw update --yes --json`
depuis l’extérieur de l’arborescence des processus du Gateway. Si le transfert est indisponible,
`update.run` renvoie une réponse structurée contenant la commande shell sûre à exécuter
manuellement.

Les sélections extended-stable enregistrées reçoivent au démarrage des
indications en lecture seule et des indications de mise à jour toutes les
24 heures lorsque `update.checkOnStart` est activé. Ces vérifications
n’appliquent jamais de mise à jour, ne démarrent aucun transfert, ne
redémarrent pas le Gateway, n’utilisent ni le délai ni la gigue de stable, et
n’utilisent pas la cadence d’interrogation de beta. Les mises à jour explicites
au premier plan, les mises à jour sans argument au premier plan avec
`update.channel: "extended-stable"` enregistré, l’état à la demande et leur
transfert du Gateway géré restent pris en charge.

Lorsqu’un service Gateway géré local est installé et que le redémarrage est
activé, les mises à jour par gestionnaire de paquets et par copie de travail
Git arrêtent le service en cours d’exécution avant de remplacer l’arborescence
du paquet ou de modifier la copie de travail ou la sortie de compilation. Le
programme de mise à jour actualise ensuite les métadonnées du service,
redémarre le service et vérifie le Gateway redémarré avant d’afficher
`Gateway: restarted and verified.`. Les mises à jour par gestionnaire de
paquets vérifient également que le Gateway redémarré indique la version de
paquet attendue ; les mises à jour par copie de travail Git vérifient
l’intégrité du gateway et la disponibilité du service après la recompilation.

Sous macOS, la vérification après mise à jour confirme également que le
LaunchAgent est chargé et en cours d’exécution pour le profil actif, et que le
port de bouclage configuré fonctionne correctement. Si le plist est installé,
mais que launchd ne le supervise pas, OpenClaw réamorce automatiquement le
LaunchAgent et relance les vérifications d’intégrité, de version et de
disponibilité du canal (un nouvel amorçage charge directement la tâche
`RunAtLoad` ; la récupération n’exécute donc pas immédiatement
`kickstart -k` sur le Gateway nouvellement lancé). Si le Gateway ne devient
toujours pas opérationnel, la commande se termine avec un code différent de
zéro et affiche le chemin du journal de redémarrage ainsi que des instructions
pour redémarrer, réinstaller et revenir à une version antérieure du paquet.

Si le redémarrage ne peut pas être effectué, la commande affiche
`Gateway: restart skipped (...)` ou `Gateway: restart failed: ...`, avec une
indication invitant à exécuter manuellement `openclaw gateway restart`. Avec
`--no-restart`, le remplacement du paquet ou la recompilation Git s’effectue
toujours, mais le service géré n’est ni arrêté ni redémarré ; le Gateway en
cours d’exécution conserve donc l’ancien code jusqu’à ce que vous le
redémarriez manuellement.

### Format de la réponse du plan de contrôle

Lorsque `update.run` s’exécute par l’intermédiaire du plan de contrôle du
Gateway sur une installation par gestionnaire de paquets ou une copie de
travail Git supervisée, le gestionnaire signale le lancement du transfert
séparément de la mise à jour CLI qui se poursuit après l’arrêt du Gateway :

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` et
  `handoff.status: "started"` : le Gateway a créé le transfert du service géré
  et planifié son propre redémarrage afin que l’assistant détaché puisse
  exécuter `openclaw update --yes --json` en dehors du processus de service en
  cours d’exécution.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` et
  `handoff.status: "unavailable"` : OpenClaw n’a pas pu trouver de frontière de
  service supervisé ni d’identité de service persistante permettant un
  transfert sûr (par exemple, le transfert systemd nécessite l’identité
  d’unité `OPENCLAW_SYSTEMD_UNIT`, et pas seulement des marqueurs ambiants de
  processus systemd). La réponse inclut `handoff.command`, la commande shell à
  exécuter depuis l’extérieur du Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` : le Gateway a
  tenté de créer le transfert, mais n’a pas pu lancer l’assistant détaché.

La charge utile `sentinel` est écrite avant l’arrêt du Gateway, et le transfert
CLI met à jour cette même sentinelle de redémarrage une fois les vérifications
d’intégrité consécutives au redémarrage du service géré terminées. Pendant le
transfert, la sentinelle peut contenir
`stats.reason: "restart-health-pending"` sans continuation en cas de réussite ;
le Gateway redémarré l’interroge et ne déclenche la continuation qu’après que
la CLI a vérifié l’intégrité du service et réécrit la sentinelle avec le
résultat `ok` final. `openclaw status` et `openclaw status --all` affichent une
ligne `Update restart` tant que cette sentinelle est en attente ou en échec,
et `update.status` actualise et renvoie la sentinelle la plus récente.

## Flux de copie de travail Git

### Sélection du canal

- `stable` : extrait le dernier tag non beta, puis compile et exécute doctor.
- `beta` : privilégie le dernier tag `-beta`, avec repli sur le dernier tag
  stable lorsque la version beta est absente ou plus ancienne.
- `dev` : extrait `main`, puis récupère les modifications et effectue un
  rebasage.
- `extended-stable` : non pris en charge pour les copies de travail Git ;
  aucune modification de la copie de travail n’est effectuée.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier la propreté de l’arborescence de travail">
    Exige l’absence de modifications non validées.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer les modifications en amont">
    Dev uniquement.
  </Step>
  <Step title="Compilation préliminaire (dev uniquement)">
    Exécute la compilation TypeScript dans une arborescence de travail temporaire. Si la révision de tête échoue, remonte jusqu’à 10 commits pour trouver le commit compilable le plus récent. Définissez `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` pour également exécuter l’analyse lint pendant cette vérification préliminaire ; l’analyse lint s’exécute en mode série restreint, car les hôtes de mise à jour des utilisateurs sont souvent moins puissants que les exécuteurs de CI.
  </Step>
  <Step title="Rebaser">
    Effectue un rebasage sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les copies de travail pnpm, le programme de mise à jour amorce `pnpm` à la demande (d’abord par `corepack`, puis avec un repli temporaire sur `npm install pnpm@11`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm. Si l’amorçage de pnpm échoue encore, le programme de mise à jour s’arrête rapidement avec une erreur propre au gestionnaire de paquets au lieu de tenter d’exécuter `npm run build` dans la copie de travail.
  </Step>
  <Step title="Compiler l’interface de contrôle">
    Compile le gateway et l’interface de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins intégrés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

### Détails de la synchronisation des plugins

Sur le canal beta, les installations suivies de plugins npm et ClawHub qui
suivent la ligne par défaut/latest essaient d’abord une version `@beta` du
plugin. Si le plugin ne possède aucune version beta, OpenClaw se replie sur la
spécification par défaut/latest enregistrée et signale un avertissement. Pour
les plugins npm, OpenClaw se replie également lorsque le paquet beta existe,
mais échoue à la validation de l’installation. Ces avertissements de repli
n’entraînent pas l’échec de la mise à jour du cœur. Les versions exactes et les
tags explicites ne sont jamais réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée à une version exacte se résout en un artefact dont l’intégrité diffère de celle enregistrée dans l’enregistrement d’installation, `openclaw update` abandonne la mise à jour de cet artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le plugin uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation de plugins après la mise à jour qui se limitent à un plugin géré et que le chemin de synchronisation peut contourner (par exemple, un registre npm inaccessible pour un plugin non essentiel) sont signalés comme des avertissements après la réussite de la mise à jour du cœur. Le résultat JSON conserve le `status: "ok"` de la mise à jour au niveau supérieur et indique `postUpdate.plugins.status: "warning"`, accompagné d’instructions concernant `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json`. Les exceptions inattendues du programme de mise à jour ou de synchronisation entraînent toujours l’échec du résultat de mise à jour. Corrigez l’erreur d’installation ou de mise à jour du plugin, puis réexécutez `openclaw update repair`.

Après l’étape de synchronisation de chaque plugin, `openclaw update` exécute une passe obligatoire de **convergence après mise à jour du cœur** avant le redémarrage du gateway : elle répare les charges utiles manquantes des plugins configurés, valide sur disque chaque enregistrement d’installation suivi _actif_ et vérifie statiquement que son `package.json` peut être analysé (et que tout `main` explicitement déclaré existe). Les échecs de cette passe ainsi qu’un instantané de configuration non valide renvoient `postUpdate.plugins.status: "error"` et font passer le `status` de la mise à jour au niveau supérieur à `"error"` ; `openclaw update` se termine donc avec un code différent de zéro et le gateway n’est _pas_ redémarré avec un ensemble de plugins non vérifié. L’erreur inclut des lignes structurées `postUpdate.plugins.warnings[].guidance` qui renvoient vers `openclaw update repair` et `openclaw plugins inspect <id> --runtime --json`. Les entrées de plugins désactivées et les enregistrements qui ne sont pas des cibles officielles de synchronisation liées à une source approuvée sont ignorés ici (conformément à la politique `skipDisabledPlugins` utilisée par la vérification des charges utiles manquantes) ; un enregistrement obsolète de plugin désactivé ne peut donc pas bloquer une mise à jour par ailleurs valide.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est limité à la vérification : le démarrage n’exécute aucun gestionnaire de paquets et ne modifie aucune arborescence de dépendances. Les redémarrages `update.run` du gestionnaire de paquets sont transférés au chemin CLI du service géré ; le remplacement du paquet s’effectue donc en dehors de l’ancien processus Gateway, et les vérifications d’intégrité du service déterminent si la mise à jour peut être déclarée terminée.
</Note>

Après la réussite d’une mise à jour du cœur extended-stable, l’intégrité et la
convergence des plugins après mise à jour du cœur ciblent les plugins npm
officiels admissibles à la version exacte du cœur installée. Pour une intention
par défaut/`latest`, OpenClaw n’interroge pas la version
`@extended-stable` du plugin et ne se replie pas sur la version npm `latest` ;
il déduit la version du paquet de celle du cœur installé. Les épinglages de
version explicites, les tags explicites autres que `latest`, les paquets tiers
et les sources autres que npm conservent leur intention existante.

Pour les installations par gestionnaire de paquets, `openclaw update` résout la
version cible du paquet avant d’appeler le gestionnaire de paquets. Les
installations npm globales utilisent une installation intermédiaire :
OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, y vérifie
l’inventaire `dist` du paquet, puis remplace par cette arborescence propre du
paquet celle du préfixe global réel. Si la vérification échoue, doctor après
mise à jour, la synchronisation des plugins et le redémarrage ne sont pas
exécutés depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du
paquet, puis exécute la synchronisation des plugins, l’actualisation de
l’autocomplétion des commandes du cœur et le redémarrage. Cela maintient les
composants auxiliaires du paquet et les enregistrements de plugins appartenant
au canal alignés sur la version installée d’OpenClaw, tout en réservant les
reconstructions complètes de l’autocomplétion des commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

## Voir aussi

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les copies de travail Git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence de la CLI](/fr/cli)

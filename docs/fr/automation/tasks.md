---
read_when:
    - Inspection des tâches d’arrière-plan en cours ou récemment terminées
    - Débogage des échecs de livraison des exécutions d’agent détachées
    - Comprendre comment les exécutions en arrière-plan s’articulent avec les sessions, Cron et Heartbeat
sidebarTitle: Background tasks
summary: Suivi des tâches en arrière-plan pour les exécutions ACP, les sous-agents, les tâches Cron isolées et les opérations CLI
title: Tâches en arrière-plan
x-i18n:
    generated_at: "2026-05-12T00:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31cbf09df48bab0686a1350f91aefffffef899c86704bb97b68320fc47e78021
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Vous cherchez la planification ? Consultez [Automatisation](/fr/automation) pour choisir le mécanisme approprié. Cette page est le registre d’activité du travail en arrière-plan, pas le planificateur.
</Note>

Les tâches en arrière-plan suivent le travail qui s’exécute **en dehors de votre session de conversation principale** : exécutions ACP, lancements de sous-agents, exécutions isolées de tâches cron et opérations lancées depuis la CLI.

Les tâches ne remplacent **pas** les sessions, les tâches cron ni les heartbeats : elles constituent le **registre d’activité** qui enregistre quel travail détaché a eu lieu, quand, et s’il a réussi.

<Note>
Toutes les exécutions d’agent ne créent pas une tâche. Les tours de Heartbeat et les échanges interactifs normaux ne le font pas. Toutes les exécutions cron, les lancements ACP, les lancements de sous-agents et les commandes d’agent CLI le font.
</Note>

## TL;DR

- Les tâches sont des **enregistrements**, pas des planificateurs : cron et Heartbeat décident _quand_ le travail s’exécute, les tâches suivent _ce qui s’est passé_.
- ACP, les sous-agents, toutes les tâches cron et les opérations CLI créent des tâches. Les tours de Heartbeat n’en créent pas.
- Chaque tâche passe par `queued → running → terminal` (succeeded, failed, timed_out, cancelled ou lost).
- Les tâches cron restent actives tant que l’environnement d’exécution cron possède encore la tâche ; si l’état d’exécution en mémoire a disparu, la maintenance des tâches vérifie d’abord l’historique durable des exécutions cron avant de marquer une tâche comme perdue.
- La complétion est pilotée par notification push : le travail détaché peut notifier directement ou réveiller la session/le Heartbeat du demandeur lorsqu’il se termine, donc les boucles d’interrogation de statut ont généralement une mauvaise forme.
- Les exécutions cron isolées et les complétions de sous-agents nettoient au mieux les onglets/processus de navigateur suivis pour leur session enfant avant la comptabilité de nettoyage finale.
- La livraison cron isolée supprime les réponses parent intermédiaires obsolètes tant que le travail de sous-agent descendant est encore en cours de vidage, et elle privilégie la sortie finale du descendant lorsqu’elle arrive avant la livraison.
- Les notifications de complétion sont livrées directement à un canal ou mises en file d’attente pour le prochain Heartbeat.
- `openclaw tasks list` affiche toutes les tâches ; `openclaw tasks audit` fait remonter les problèmes.
- Les enregistrements terminaux sont conservés pendant 7 jours, puis automatiquement supprimés.

## Démarrage rapide

<Tabs>
  <Tab title="Lister et filtrer">
    ```bash
    # Lister toutes les tâches (les plus récentes d’abord)
    openclaw tasks list

    # Filtrer par environnement d’exécution ou statut
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Inspecter">
    ```bash
    # Afficher les détails d’une tâche précise (par ID, ID d’exécution ou clé de session)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Annuler et notifier">
    ```bash
    # Annuler une tâche en cours d’exécution (tue la session enfant)
    openclaw tasks cancel <lookup>

    # Modifier la politique de notification d’une tâche
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Audit et maintenance">
    ```bash
    # Exécuter un audit de santé
    openclaw tasks audit

    # Prévisualiser ou appliquer la maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Flux de tâches">
    ```bash
    # Inspecter l’état TaskFlow
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## Ce qui crée une tâche

| Source                 | Type d’exécution | Moment où un enregistrement de tâche est créé            | Politique de notification par défaut |
| ---------------------- | ---------------- | -------------------------------------------------------- | ------------------------------------ |
| Exécutions ACP en arrière-plan | `acp`        | Lancement d’une session ACP enfant                       | `done_only`                          |
| Orchestration de sous-agents | `subagent`   | Lancement d’un sous-agent via `sessions_spawn`           | `done_only`                          |
| Tâches cron (tous types) | `cron`       | Chaque exécution cron (session principale et isolée)     | `silent`                             |
| Opérations CLI         | `cli`        | Commandes `openclaw agent` exécutées via le Gateway      | `silent`                             |
| Tâches média d’agent   | `cli`        | Exécutions `music_generate`/`video_generate` adossées à une session | `silent`              |

<AccordionGroup>
  <Accordion title="Valeurs par défaut de notification pour cron et les médias">
    Les tâches cron de session principale utilisent par défaut la politique de notification `silent` : elles créent des enregistrements pour le suivi mais ne génèrent pas de notifications. Les tâches cron isolées utilisent aussi `silent` par défaut, mais elles sont plus visibles parce qu’elles s’exécutent dans leur propre session.

    Les exécutions `music_generate` et `video_generate` adossées à une session utilisent aussi la politique de notification `silent`. Elles créent tout de même des enregistrements de tâche, mais la complétion est renvoyée à la session d’agent d’origine sous forme de réveil interne, afin que l’agent puisse écrire le message de suivi et joindre lui-même le média terminé. Les complétions de groupe/canal suivent la politique normale de réponse visible, donc l’agent utilise l’outil de message lorsque la livraison source l’exige. Si l’agent de complétion ne produit pas de preuve de livraison par outil de message dans une route uniquement par outil, OpenClaw envoie directement la solution de repli de complétion au canal d’origine au lieu de laisser le média privé.

  </Accordion>
  <Accordion title="Garde-fou video_generate concurrent">
    Tant qu’une tâche `video_generate` adossée à une session est encore active, l’outil agit aussi comme garde-fou : les appels `video_generate` répétés dans cette même session renvoient le statut de la tâche active au lieu de lancer une deuxième génération concurrente. Utilisez `action: "status"` lorsque vous voulez une recherche explicite de progression/statut côté agent.
  </Accordion>
  <Accordion title="Ce qui ne crée pas de tâches">
    - Tours de Heartbeat : session principale ; voir [Heartbeat](/fr/gateway/heartbeat)
    - Tours de chat interactif normaux
    - Réponses directes `/command`

  </Accordion>
</AccordionGroup>

## Cycle de vie des tâches

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Statut      | Signification                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Créée, en attente du démarrage de l’agent                                  |
| `running`   | Le tour d’agent est en cours d’exécution active                            |
| `succeeded` | Terminée avec succès                                                       |
| `failed`    | Terminée avec une erreur                                                   |
| `timed_out` | A dépassé le délai d’expiration configuré                                  |
| `cancelled` | Arrêtée par l’opérateur via `openclaw tasks cancel`                        |
| `lost`      | L’environnement d’exécution a perdu l’état de référence après un délai de grâce de 5 minutes |

Les transitions se produisent automatiquement : lorsque l’exécution d’agent associée se termine, le statut de la tâche est mis à jour pour correspondre.

La complétion d’exécution d’agent fait autorité pour les enregistrements de tâches actifs. Une exécution détachée réussie se finalise en `succeeded`, les erreurs d’exécution ordinaires se finalisent en `failed`, et les résultats de délai expiré ou d’abandon se finalisent en `timed_out`. Si un opérateur a déjà annulé la tâche, ou si l’environnement d’exécution a déjà enregistré un état terminal plus fort comme `failed`, `timed_out` ou `lost`, un signal de réussite ultérieur ne rétrograde pas ce statut terminal.

`lost` tient compte de l’environnement d’exécution :

- Tâches ACP : les métadonnées de session ACP enfant sous-jacentes ont disparu.
- Tâches de sous-agent : la session enfant sous-jacente a disparu du stockage de l’agent cible.
- Tâches cron : l’environnement d’exécution cron ne suit plus la tâche comme active et l’historique durable des exécutions cron n’affiche pas de résultat terminal pour cette exécution. L’audit CLI hors ligne ne traite pas son propre état d’exécution cron vide en cours de processus comme une autorité.
- Tâches CLI : les tâches avec un ID d’exécution/ID source utilisent le contexte d’exécution actif, donc les lignes persistantes de session enfant ou de session de chat ne les maintiennent pas en vie après la disparition de l’exécution possédée par le Gateway. Les anciennes tâches CLI sans identité d’exécution se rabattent encore sur la session enfant. Les exécutions `openclaw agent` adossées au Gateway se finalisent aussi à partir de leur résultat d’exécution, donc les exécutions terminées ne restent pas actives jusqu’à ce que le balayeur les marque `lost`.

## Livraison et notifications

Lorsqu’une tâche atteint un état terminal, OpenClaw vous notifie. Il existe deux chemins de livraison :

**Livraison directe** : si la tâche possède une cible de canal (le `requesterOrigin`), le message de complétion va directement vers ce canal (Telegram, Discord, Slack, etc.). Les complétions de tâches de groupe et de canal sont plutôt routées via la session du demandeur afin que l’agent parent puisse écrire la réponse visible. Pour les complétions de sous-agents, OpenClaw préserve aussi le routage de fil/sujet lié lorsqu’il est disponible et peut renseigner un `to` / compte manquant à partir de la route stockée de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) avant de renoncer à la livraison directe.

**Livraison mise en file d’attente de session** : si la livraison directe échoue ou qu’aucune origine n’est définie, la mise à jour est mise en file d’attente comme événement système dans la session du demandeur et apparaît au prochain Heartbeat.

<Tip>
La complétion de tâche déclenche un réveil Heartbeat immédiat afin que vous voyiez le résultat rapidement : vous n’avez pas à attendre le prochain tick Heartbeat planifié.
</Tip>

Cela signifie que le flux de travail habituel est basé sur le push : démarrez le travail détaché une fois, puis laissez l’environnement d’exécution vous réveiller ou vous notifier à la complétion. Interrogez l’état des tâches uniquement lorsque vous avez besoin de débogage, d’intervention ou d’un audit explicite.

### Politiques de notification

Contrôlez ce que vous recevez pour chaque tâche :

| Politique             | Ce qui est livré                                                        |
| --------------------- | ---------------------------------------------------------------------- |
| `done_only` (par défaut) | Seulement l’état terminal (succeeded, failed, etc.) : **c’est la valeur par défaut** |
| `state_changes`       | Chaque transition d’état et mise à jour de progression                 |
| `silent`              | Rien du tout                                                           |

Modifier la politique pendant l’exécution d’une tâche :

```bash
openclaw tasks notify <lookup> state_changes
```

## Référence CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Colonnes de sortie : ID de tâche, type, statut, livraison, ID d’exécution, session enfant, résumé.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    Le jeton de recherche accepte un ID de tâche, un ID d’exécution ou une clé de session. Affiche l’enregistrement complet, y compris les informations de temps, l’état de livraison, l’erreur et le résumé terminal.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Pour les tâches ACP et de sous-agent, cela tue la session enfant. Pour les tâches suivies par la CLI, l’annulation est enregistrée dans le registre des tâches (il n’existe pas de handle d’exécution enfant séparé). Le statut passe à `cancelled` et une notification de livraison est envoyée lorsque cela s’applique.

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--json]
    ```

    Fait remonter les problèmes opérationnels. Les constats apparaissent aussi dans `openclaw status` lorsque des problèmes sont détectés.

    | Conclusion               | Gravité   | Déclencheur                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | En file d’attente depuis plus de 10 minutes                                                                              |
    | `stale_running`           | error      | En cours d’exécution depuis plus de 30 minutes                                                                             |
    | `lost`                    | warn/error | La propriété de la tâche adossée au runtime a disparu ; les tâches perdues conservées signalent un avertissement jusqu’à `cleanupAfter`, puis deviennent des erreurs |
    | `delivery_failed`         | warn       | La livraison a échoué et la politique de notification n’est pas `silent`                                                            |
    | `missing_cleanup`         | warn       | Tâche terminale sans horodatage de nettoyage                                                                      |
    | `inconsistent_timestamps` | warn       | Violation de la chronologie (par exemple, terminée avant d’avoir commencé)                                                        |

  </Accordion>
  <Accordion title="maintenance des tâches">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Utilisez cette commande pour prévisualiser ou appliquer la réconciliation, l’horodatage de nettoyage et l’élagage pour les tâches, l’état de Task Flow et les lignes obsolètes du registre de sessions d’exécution cron.

    La réconciliation tient compte du runtime :

    - Les tâches ACP/sous-agent vérifient leur session enfant sous-jacente.
    - Les tâches de sous-agent dont la session enfant possède une pierre tombale de récupération au redémarrage sont marquées comme perdues au lieu d’être traitées comme des sessions sous-jacentes récupérables.
    - Les tâches Cron vérifient si le runtime cron possède toujours la tâche, puis récupèrent l’état terminal à partir des journaux d’exécution cron persistés/de l’état de la tâche avant de revenir à `lost`. Seul le processus Gateway fait autorité pour l’ensemble en mémoire des tâches cron actives ; l’audit CLI hors ligne utilise l’historique durable, mais ne marque pas une tâche cron comme perdue uniquement parce que ce Set local est vide.
    - Les tâches CLI avec identité d’exécution vérifient le contexte d’exécution actif propriétaire, pas seulement les lignes de session enfant ou de session de chat.

    Le nettoyage de fin tient également compte du runtime :

    - La fin d’un sous-agent ferme au mieux les onglets/processus de navigateur suivis pour la session enfant avant que le nettoyage d’annonce continue.
    - La fin d’un cron isolé ferme au mieux les onglets/processus de navigateur suivis pour la session cron avant que l’exécution ne soit entièrement arrêtée.
    - La livraison d’un cron isolé attend, si nécessaire, la suite du sous-agent descendant et supprime le texte obsolète d’accusé de réception du parent au lieu de l’annoncer.
    - La livraison de fin d’un sous-agent préfère le dernier texte d’assistant visible ; s’il est vide, elle se rabat sur le dernier texte tool/toolResult assaini, et les exécutions d’appels d’outils expirées uniquement par délai peuvent être réduites à un court résumé de progression partielle. Les exécutions terminales en échec annoncent l’état d’échec sans rejouer le texte de réponse capturé.
    - Les échecs de nettoyage ne masquent pas le résultat réel de la tâche.

    Lors de l’application de la maintenance, OpenClaw supprime aussi les lignes obsolètes du registre de sessions `cron:<jobId>:run:<uuid>` âgées de plus de 7 jours, tout en préservant les lignes des tâches cron actuellement en cours d’exécution et en laissant intactes les lignes de sessions non cron.

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Utilisez ces commandes lorsque le Task Flow d’orchestration est l’élément qui vous intéresse, plutôt qu’un enregistrement individuel de tâche en arrière-plan.

  </Accordion>
</AccordionGroup>

## Tableau des tâches du chat (`/tasks`)

Utilisez `/tasks` dans n’importe quelle session de chat pour voir les tâches en arrière-plan liées à cette session. Le tableau affiche les tâches actives et récemment terminées avec le runtime, l’état, le minutage et les détails de progression ou d’erreur.

Lorsque la session actuelle n’a aucune tâche liée visible, `/tasks` se rabat sur les compteurs de tâches locaux à l’agent afin de fournir tout de même une vue d’ensemble sans divulguer les détails d’autres sessions.

Pour le registre opérateur complet, utilisez la CLI : `openclaw tasks list`.

## Intégration de l’état (pression des tâches)

`openclaw status` inclut un résumé rapide des tâches :

```
Tasks: 3 queued · 2 running · 1 issues
```

Le résumé indique :

- **active** - nombre de `queued` + `running`
- **failures** - nombre de `failed` + `timed_out` + `lost`
- **byRuntime** - répartition par `acp`, `subagent`, `cron`, `cli`

`/status` comme l’outil `session_status` utilisent un instantané des tâches tenant compte du nettoyage : les tâches actives sont privilégiées, les lignes terminées obsolètes sont masquées et les échecs récents ne remontent que lorsqu’il ne reste aucun travail actif. Cela garde la carte d’état centrée sur ce qui compte maintenant.

## Stockage et maintenance

### Où vivent les tâches

Les enregistrements de tâches persistent dans SQLite à l’emplacement suivant :

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

Le registre est chargé en mémoire au démarrage du Gateway et synchronise les écritures vers SQLite pour garantir la durabilité entre redémarrages.
Le Gateway garde le journal d’écriture anticipée de SQLite borné en utilisant le seuil
d’autocheckpoint par défaut de SQLite, ainsi que des checkpoints `TRUNCATE` périodiques et à l’arrêt.

### Maintenance automatique

Un balayeur s’exécute toutes les **60 secondes** et gère quatre éléments :

<Steps>
  <Step title="Réconciliation">
    Vérifie si les tâches actives disposent encore d’un support de runtime faisant autorité. Les tâches ACP/sous-agent utilisent l’état de session enfant, les tâches cron utilisent la propriété des tâches actives, et les tâches CLI avec identité d’exécution utilisent le contexte d’exécution propriétaire. Si cet état sous-jacent a disparu depuis plus de 5 minutes, la tâche est marquée `lost`.
  </Step>
  <Step title="Réparation de session ACP">
    Ferme les sessions ACP ponctuelles terminales ou orphelines appartenant au parent, et ferme les sessions ACP persistantes obsolètes, terminales ou orphelines uniquement lorsqu’il ne reste aucune liaison de conversation active.
  </Step>
  <Step title="Horodatage de nettoyage">
    Définit un horodatage `cleanupAfter` sur les tâches terminales (endedAt + 7 jours). Pendant la rétention, les tâches perdues apparaissent encore dans l’audit comme avertissements ; après l’expiration de `cleanupAfter`, ou lorsque les métadonnées de nettoyage sont manquantes, elles deviennent des erreurs.
  </Step>
  <Step title="Élagage">
    Supprime les enregistrements ayant dépassé leur date `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Rétention :** les enregistrements de tâches terminales sont conservés pendant **7 jours**, puis automatiquement élagués. Aucune configuration requise.
</Note>

## Relation entre les tâches et les autres systèmes

<AccordionGroup>
  <Accordion title="Tâches et Task Flow">
    [Task Flow](/fr/automation/taskflow) est la couche d’orchestration des flux au-dessus des tâches en arrière-plan. Un même flux peut coordonner plusieurs tâches au cours de sa durée de vie à l’aide de modes de synchronisation gérés ou mis en miroir. Utilisez `openclaw tasks` pour inspecter les enregistrements de tâches individuels et `openclaw tasks flow` pour inspecter le flux d’orchestration.

    Consultez [Task Flow](/fr/automation/taskflow) pour plus de détails.

  </Accordion>
  <Accordion title="Tâches et cron">
    Une **définition** de tâche cron vit dans `~/.openclaw/cron/jobs.json` ; l’état d’exécution du runtime vit à côté, dans `~/.openclaw/cron/jobs-state.json`. **Chaque** exécution cron crée un enregistrement de tâche, qu’elle soit en session principale ou isolée. Les tâches cron de session principale utilisent par défaut la politique de notification `silent`, afin d’être suivies sans générer de notifications.

    Consultez [Cron Jobs](/fr/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tâches et Heartbeat">
    Les exécutions Heartbeat sont des tours de session principale ; elles ne créent pas d’enregistrements de tâches. Lorsqu’une tâche se termine, elle peut déclencher un réveil Heartbeat afin que vous voyiez rapidement le résultat.

    Consultez [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tâches et sessions">
    Une tâche peut référencer un `childSessionKey` (où le travail s’exécute) et un `requesterSessionKey` (qui l’a démarrée). Les sessions sont le contexte de conversation ; les tâches ajoutent le suivi d’activité par-dessus.
  </Accordion>
  <Accordion title="Tâches et exécutions d’agent">
    Le `runId` d’une tâche pointe vers l’exécution d’agent qui effectue le travail. Les événements de cycle de vie de l’agent (début, fin, erreur) mettent automatiquement à jour l’état de la tâche ; vous n’avez pas besoin de gérer le cycle de vie manuellement.
  </Accordion>
</AccordionGroup>

## Connexe

- [Automatisation](/fr/automation) - tous les mécanismes d’automatisation en un coup d’œil
- [CLI : tâches](/fr/cli/tasks) - référence des commandes CLI
- [Heartbeat](/fr/gateway/heartbeat) - tours périodiques de session principale
- [Tâches planifiées](/fr/automation/cron-jobs) - planification du travail en arrière-plan
- [Task Flow](/fr/automation/taskflow) - orchestration des flux au-dessus des tâches

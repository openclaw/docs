---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils programmé
    - Vous déboguez l’exécution et les journaux Cron
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gérez les tâches Cron pour le planificateur Gateway.

Associé :

- Tâches Cron : [Tâches Cron](/fr/automation/cron-jobs)

Astuce : exécutez `openclaw cron --help` pour la surface de commande complète.

Remarque : `openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la
route de livraison résolue. Pour `channel: "last"`, la prévisualisation indique si la
route a été résolue à partir de la session principale/actuelle ou échouera en mode fermé.

Remarque : les tâches isolées `cron add` utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver
la sortie en interne. `--deliver` reste disponible comme alias obsolète de `--announce`.

Remarque : la livraison de chat Cron isolée est partagée. `--announce` est la livraison
de repli du runner pour la réponse finale ; `--no-deliver` désactive ce repli mais ne
supprime pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Remarque : les tâches à exécution unique (`--at`) sont supprimées après succès par défaut. Utilisez `--keep-after-run` pour les conserver.

Remarque : `--session` prend en charge `main`, `isolated`, `current` et `session:<id>`.
Utilisez `current` pour lier à la session active au moment de la création, ou `session:<id>` pour
une clé de session persistante explicite.

Remarque : `--session isolated` crée un nouvel ID de transcription/session pour chaque exécution.
Les préférences sûres et les remplacements explicites de modèle/authentification choisis par l’utilisateur peuvent être conservés, mais
le contexte ambiant de conversation ne l’est pas : le routage canal/groupe, la politique d’envoi/file d’attente,
l’élévation, l’origine et la liaison du runtime ACP sont réinitialisés pour la nouvelle exécution isolée.

Remarque : pour les tâches CLI à exécution unique, les dates/heures `--at` sans décalage sont traitées comme UTC sauf si vous passez aussi
`--tz <iana>`, qui interprète cette heure murale locale dans le fuseau horaire donné.

Remarque : les tâches récurrentes utilisent désormais un backoff exponentiel après des erreurs consécutives (30s → 1m → 5m → 15m → 60m), puis reviennent à la planification normale après la prochaine exécution réussie.

Remarque : `openclaw cron run` retourne désormais dès que l’exécution manuelle est mise en file d’attente pour exécution. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }` ; utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

Remarque : `openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver
l’ancien comportement « exécuter seulement si l’échéance est atteinte ».

Remarque : les tours Cron isolés suppriment les réponses obsolètes de simple accusé de réception. Si le
premier résultat n’est qu’une mise à jour de statut intermédiaire et qu’aucune exécution descendante de sous-agent n’est
responsable de la réponse finale, Cron reformule une fois pour obtenir le vrai résultat
avant livraison.

Remarque : si une exécution Cron isolée ne renvoie que le jeton silencieux (`NO_REPLY` /
`no_reply`), Cron supprime à la fois la livraison sortante directe et la voie de résumé en file d’attente de repli,
de sorte que rien n’est renvoyé dans le chat.

Remarque : `cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche.
Si le modèle n’est pas autorisé, Cron affiche un avertissement et revient à la sélection de
modèle de l’agent/par défaut pour la tâche. Les chaînes de repli configurées s’appliquent toujours, mais un simple
remplacement de modèle sans liste de repli explicite par tâche n’ajoute plus le modèle principal de l’agent comme cible de nouvelle tentative cachée.

Remarque : la priorité des modèles pour Cron isolé est la suivante : remplacement du hook Gmail d’abord, puis
`--model` par tâche, puis tout remplacement de modèle de session Cron stocké choisi par l’utilisateur, puis la
sélection normale de l’agent/par défaut.

Remarque : le mode rapide de Cron isolé suit la sélection de modèle live résolue. La configuration du modèle
`params.fastMode` s’applique par défaut, mais un remplacement `fastMode` de session stocké conserve
toujours la priorité sur la configuration.

Remarque : si une exécution isolée lance `LiveSessionModelSwitchError`, Cron persiste le
fournisseur/modèle basculé (et le remplacement du profil d’authentification basculé le cas échéant) pour
l’exécution active avant de réessayer. La boucle de nouvelle tentative externe est limitée à 2 nouvelles tentatives
de bascule après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

Remarque : les notifications d’échec utilisent d’abord `delivery.failureDestination`, puis
`cron.failureDestination` global, et enfin reviennent à la cible principale
d’annonce de la tâche lorsqu’aucune destination d’échec explicite n’est configurée.

Remarque : la rétention/l’élagage est contrôlée dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élague `~/.openclaw/cron/runs/<jobId>.jsonl`.

Remarque de mise à niveau : si vous avez d’anciennes tâches Cron datant d’avant le format actuel de livraison/stockage, exécutez
`openclaw doctor --fix`. Doctor normalise désormais les champs Cron hérités (`jobId`, `schedule.cron`,
les champs de livraison de niveau supérieur, y compris l’ancien `threadId`, les alias de livraison `provider` de la charge utile) et migre les tâches simples
de repli Webhook `notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est
configuré.

## Modifications courantes

Mettez à jour les paramètres de livraison sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactivez la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activez un contexte bootstrap léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncez sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Créez une tâche isolée avec un contexte bootstrap léger :

```bash
openclaw cron add \
  --name "Brief matinal léger" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Résumez les mises à jour de la nuit." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches isolées de tour d’agent. Pour les exécutions Cron, le mode léger garde le contexte bootstrap vide au lieu d’injecter l’ensemble complet de bootstrap de l’espace de travail.

Remarque sur la propriété de la livraison :

- La livraison de chat Cron isolée est partagée. L’agent peut envoyer directement avec
  l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre la réponse finale en repli uniquement lorsque l’agent n’a pas envoyé
  directement à la cible résolue. `webhook` envoie la charge utile terminée à une URL.
  `none` désactive la livraison de repli du runner.

## Commandes d’administration courantes

Exécution manuelle :

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible Cron prévue,
la cible résolue, les envois de l’outil message, l’utilisation du repli et l’état livré.

Retargeting agent/session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Remarque sur la livraison des échecs :

- `delivery.failureDestination` est pris en charge pour les tâches isolées.
- Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de
  livraison principal est `webhook`.
- Si vous ne définissez aucune destination d’échec et que la tâche annonce déjà sur un
  canal, les notifications d’échec réutilisent cette même cible d’annonce.

## Associé

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

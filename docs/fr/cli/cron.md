---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gérez les tâches Cron pour le planificateur de la Gateway.

Lié :

- Tâches Cron : [Tâches Cron](/fr/automation/cron-jobs)

Conseil : exécutez `openclaw cron --help` pour obtenir la surface de commande complète.

Remarque : `openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la route a été résolue à partir de la session principale/actuelle ou si elle échouera en mode fermé.

Remarque : les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste pris en charge comme alias obsolète de `--announce`.

Remarque : la livraison de chat Cron isolée est partagée. `--announce` est la livraison de secours du runner pour la réponse finale ; `--no-deliver` désactive ce secours mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Remarque : les tâches one-shot (`--at`) sont supprimées après succès par défaut. Utilisez `--keep-after-run` pour les conserver.

Remarque : `--session` prend en charge `main`, `isolated`, `current` et `session:<id>`.
Utilisez `current` pour lier à la session active au moment de la création, ou `session:<id>` pour une clé de session persistante explicite.

Remarque : `--session isolated` crée un nouvel identifiant de transcription/session pour chaque exécution.
Les préférences sûres et les remplacements explicites de modèle/authentification sélectionnés par l’utilisateur peuvent être conservés, mais le contexte ambiant de la conversation ne l’est pas : le routage de canal/groupe, la politique d’envoi/de mise en file d’attente, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution isolée.

Remarque : pour les tâches CLI one-shot, les dates/heures `--at` sans décalage sont traitées comme UTC sauf si vous passez aussi `--tz <iana>`, qui interprète cette heure locale dans le fuseau horaire indiqué.

Remarque : les tâches récurrentes utilisent désormais un backoff exponentiel de nouvelle tentative après des erreurs consécutives (30s → 1m → 5m → 15m → 60m), puis reviennent au calendrier normal après la prochaine exécution réussie.

Remarque : `openclaw cron run` revient désormais dès que l’exécution manuelle est mise en file pour exécution. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }` ; utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

Remarque : `openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien comportement « n’exécuter que si dû ».

Remarque : les tours Cron isolés suppriment les réponses obsolètes qui ne sont que des accusés de réception. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire et qu’aucune exécution descendante de sous-agent n’est responsable de la réponse finale, Cron relance une fois pour obtenir le vrai résultat avant livraison.

Remarque : si une exécution isolée Cron ne renvoie que le token silencieux (`NO_REPLY` /
`no_reply`), Cron supprime la livraison sortante directe ainsi que le chemin de résumé de secours mis en file, afin que rien ne soit renvoyé dans le chat.

Remarque : `cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche.
Si le modèle n’est pas autorisé, Cron émet un avertissement et revient à la sélection de modèle de l’agent/par défaut pour la tâche. Les chaînes de secours configurées s’appliquent toujours, mais un simple remplacement de modèle sans liste de secours explicite par tâche n’ajoute plus le modèle principal de l’agent comme cible de nouvelle tentative supplémentaire cachée.

Remarque : la priorité du modèle Cron isolé est la suivante : remplacement Gmail-hook en premier, puis `--model` par tâche, puis tout remplacement de modèle de session Cron stocké et sélectionné par l’utilisateur, puis la sélection normale agent/par défaut.

Remarque : le mode rapide Cron isolé suit la sélection de modèle live résolue. La configuration du modèle `params.fastMode` s’applique par défaut, mais un remplacement `fastMode` de session stocké garde la priorité sur la configuration.

Remarque : si une exécution isolée lève `LiveSessionModelSwitchError`, Cron persiste le fournisseur/modèle basculé (et le remplacement de profil d’authentification basculé lorsqu’il est présent) pour l’exécution active avant de réessayer. La boucle externe de nouvelle tentative est limitée à 2 nouvelles tentatives de bascule après la tentative initiale, puis s’interrompt au lieu de boucler indéfiniment.

Remarque : les notifications d’échec utilisent `delivery.failureDestination` en premier, puis `cron.failureDestination` global, puis reviennent à la cible d’annonce principale de la tâche lorsqu’aucune destination d’échec explicite n’est configurée.

Remarque : la rétention/l’élagage est contrôlé dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) supprime les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

Note de mise à niveau : si vous avez d’anciennes tâches Cron d’avant le format actuel de livraison/stockage, exécutez
`openclaw doctor --fix`. Doctor normalise désormais les champs Cron hérités (`jobId`, `schedule.cron`,
champs de livraison de niveau supérieur, y compris l’ancien `threadId`, alias de livraison `provider` dans la charge utile) et migre les tâches de secours Webhook simples `notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est configuré.

## Modifications courantes

Mettre à jour les paramètres de livraison sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer un contexte bootstrap léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Créer une tâche isolée avec un contexte bootstrap léger :

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tours d’agent isolés. Pour les exécutions Cron, le mode léger garde le contexte bootstrap vide au lieu d’injecter l’ensemble bootstrap complet de l’espace de travail.

Remarque sur la propriété de la livraison :

- La livraison de chat Cron isolée est partagée. L’agent peut envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre en secours la réponse finale uniquement lorsque l’agent n’a pas envoyé directement vers la cible résolue. `webhook` publie la charge utile terminée vers une URL.
  `none` désactive la livraison de secours du runner.
- Les rappels créés à partir d’un chat actif conservent la cible de livraison du chat live pour la livraison d’annonce de secours. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseurs sensibles à la casse tels que les identifiants de salon Matrix.

## Commandes d’administration courantes

Exécution manuelle :

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible Cron prévue,
la cible résolue, les envois de l’outil message, l’utilisation du secours et l’état livré.

Redirection agent/session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Remarque sur la livraison des échecs :

- `delivery.failureDestination` est pris en charge pour les tâches isolées.
- Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`.
- Si vous ne définissez aucune destination d’échec et que la tâche annonce déjà sur un canal, les notifications d’échec réutilisent cette même cible d’annonce.

## Lié

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

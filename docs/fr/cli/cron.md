---
read_when:
    - Vous voulez des tâches planifiées et des réveils
    - Vous déboguez l’exécution et les journaux Cron
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-04-23T07:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gérez les tâches Cron du planificateur de la Gateway.

Voir aussi :

- Tâches Cron : [Tâches Cron](/fr/automation/cron-jobs)

Astuce : exécutez `openclaw cron --help` pour afficher toute la surface de commande.

Remarque : `openclaw cron list` et `openclaw cron show <job-id>` affichent un aperçu de la
route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la
route a été résolue depuis la session principale/actuelle ou si elle échouera
de manière fermée.

Remarque : les tâches isolées `cron add` utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour garder
la sortie interne. `--deliver` reste un alias obsolète pour `--announce`.

Remarque : la livraison dans la discussion pour les tâches Cron isolées est partagée. `--announce` correspond à la livraison de repli du lanceur
pour la réponse finale ; `--no-deliver` désactive ce repli mais ne
supprime pas l’outil `message` de l’agent lorsqu’une route de discussion est disponible.

Remarque : les tâches à exécution unique (`--at`) sont supprimées après succès par défaut. Utilisez `--keep-after-run` pour les conserver.

Remarque : `--session` prend en charge `main`, `isolated`, `current` et `session:<id>`.
Utilisez `current` pour vous lier à la session active au moment de la création, ou `session:<id>` pour
une clé de session persistante explicite.

Remarque : pour les tâches CLI à exécution unique, les dates/heures `--at` sans décalage sont traitées comme UTC sauf si vous passez aussi
`--tz <iana>`, qui interprète cette heure murale locale dans le fuseau horaire indiqué.

Remarque : les tâches récurrentes utilisent désormais une stratégie exponentielle de nouvelle tentative après des erreurs consécutives (30 s → 1 min → 5 min → 15 min → 60 min), puis reviennent à la planification normale après la prochaine exécution réussie.

Remarque : `openclaw cron run` renvoie désormais dès que l’exécution manuelle est mise en file pour exécution. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }` ; utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

Remarque : `openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien
comportement « exécuter uniquement si due ».

Remarque : les tours Cron isolés suppriment les réponses obsolètes limitées à un accusé de réception. Si le
premier résultat n’est qu’une mise à jour d’état intermédiaire et qu’aucune exécution descendante de sous-agent n’est
responsable de la réponse finale, Cron relance une invite une fois pour obtenir le vrai résultat
avant la livraison.

Remarque : si une exécution Cron isolée renvoie uniquement le jeton silencieux (`NO_REPLY` /
`no_reply`), Cron supprime à la fois la livraison sortante directe et le chemin de résumé en file de repli,
de sorte que rien n’est renvoyé dans la discussion.

Remarque : `cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche.
Si le modèle n’est pas autorisé, Cron affiche un avertissement et revient à la sélection de
modèle de l’agent/par défaut de la tâche. Les chaînes de repli configurées s’appliquent toujours, mais un simple
remplacement de modèle sans liste explicite de repli par tâche n’ajoute plus le modèle principal de l’agent comme cible supplémentaire de nouvelle tentative cachée.

Remarque : pour les tâches Cron isolées, l’ordre de priorité des modèles est : remplacement Gmail-hook d’abord, puis
`--model` par tâche, puis tout remplacement de modèle stocké dans la session Cron, puis la sélection normale
de l’agent/par défaut.

Remarque : le mode rapide des tâches Cron isolées suit la sélection de modèle live résolue. La configuration de modèle
`params.fastMode` s’applique par défaut, mais un remplacement `fastMode` stocké dans la session garde la priorité sur la configuration.

Remarque : si une exécution isolée lève `LiveSessionModelSwitchError`, Cron conserve le
fournisseur/modèle basculé (et le remplacement de profil d’authentification basculé lorsqu’il est présent) avant
de réessayer. La boucle externe de nouvelle tentative est limitée à 2 nouvelles tentatives de bascule après la tentative
initiale, puis abandonne au lieu de boucler indéfiniment.

Remarque : les notifications d’échec utilisent d’abord `delivery.failureDestination`, puis
`cron.failureDestination` global, et reviennent enfin à la cible principale
d’annonce de la tâche lorsqu’aucune destination d’échec explicite n’est configurée.

Remarque : la rétention/l’élagage est contrôlée dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

Remarque de mise à niveau : si vous avez d’anciennes tâches Cron datant d’avant le format actuel de livraison/stockage, exécutez
`openclaw doctor --fix`. Doctor normalise désormais les champs Cron hérités (`jobId`, `schedule.cron`,
champs de livraison de niveau supérieur, y compris l’ancien `threadId`, alias de livraison `provider` dans la charge utile) et migre les tâches simples
de repli Webhook `notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est
configuré.

## Modifications courantes

Mettre à jour les paramètres de livraison sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer un contexte d’amorçage léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Créer une tâche isolée avec contexte d’amorçage léger :

```bash
openclaw cron add \
  --name "Brief matinal léger" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Résumez les mises à jour de la nuit." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches isolées de type tour agent. Pour les exécutions Cron, le mode léger garde le contexte d’amorçage vide au lieu d’injecter l’ensemble complet d’amorçage de l’espace de travail.

Remarque sur la propriété de la livraison :

- La livraison dans la discussion pour les tâches Cron isolées est partagée. L’agent peut envoyer directement avec
  l’outil `message` lorsqu’une route de discussion est disponible.
- `announce` livre la réponse finale en repli uniquement lorsque l’agent n’a pas envoyé
  directement vers la cible résolue. `webhook` publie la charge utile terminée vers une URL.
  `none` désactive la livraison de repli du lanceur.

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
la cible résolue, les envois via l’outil de message, l’utilisation du repli et l’état de livraison.

Redirection d’agent/session :

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
- Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le
  mode de livraison principal est `webhook`.
- Si vous ne définissez aucune destination d’échec et que la tâche annonce déjà sur un
  canal, les notifications d’échec réutilisent cette même cible d’annonce.

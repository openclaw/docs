---
read_when:
    - Vous voulez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-04-30T07:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches Cron pour le planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour voir toute la surface de commande. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l'agent.
    - `isolated` crée une nouvelle transcription et un nouvel identifiant de session pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` épingle une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage de canal et de groupe, la politique d'envoi/de mise en file d'attente, l'élévation, l'origine et la liaison d'exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites de modèle ou d'authentification sélectionnés par l'utilisateur peuvent être conservés entre les exécutions.
  </Accordion>
</AccordionGroup>

## Distribution

`openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la route de distribution résolue. Pour `channel: "last"`, la prévisualisation indique si la route a été résolue depuis la session principale ou courante, ou si elle échouera de manière fermée.

<Note>
Les tâches `cron add` isolées utilisent par défaut la distribution `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Propriété de la distribution

La distribution des discussions Cron isolées est partagée entre l'agent et l'exécuteur :

- L'agent peut envoyer directement avec l'outil `message` lorsqu'une route de discussion est disponible.
- `announce` distribue en secours la réponse finale uniquement lorsque l'agent n'a pas envoyé directement à la cible résolue.
- `webhook` publie la charge utile terminée vers une URL.
- `none` désactive la distribution de secours par l'exécuteur.

`--announce` est la distribution de secours par l'exécuteur pour la réponse finale. `--no-deliver` désactive ce secours, mais ne supprime pas l'outil `message` de l'agent lorsqu'une route de discussion est disponible.

Les rappels créés depuis une discussion active conservent la cible de distribution de discussion active pour la distribution d'annonce de secours. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les identifiants de fournisseurs sensibles à la casse, comme les identifiants de salon Matrix.

### Distribution des échecs

Les notifications d'échec se résolvent dans cet ordre :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d'annonce principale de la tâche (lorsqu'aucune destination d'échec explicite n'est définie).

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de distribution principal est `webhook`. Les tâches isolées l'acceptent dans tous les modes.
</Note>

Remarque : les exécutions Cron isolées traitent les échecs d'agent au niveau de l'exécution comme des erreurs de tâche, même lorsqu'aucune charge utile de réponse n'est produite ; les échecs de modèle/fournisseur incrémentent donc tout de même les compteurs d'erreurs et déclenchent les notifications d'échec.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates et heures sans décalage sont traitées comme UTC, sauf si vous passez aussi `--tz <iana>`, qui interprète l'heure civile dans le fuseau horaire donné.

<Note>
Les tâches ponctuelles sont supprimées après réussite par défaut. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un délai de nouvelle tentative exponentiel après des erreurs consécutives : 30s, 1m, 5m, 15m, 60m. La planification revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d'exécution. Elles n'affectent pas le délai de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` peut inclure les notifications répétées d'exécutions ignorées dans les alertes d'échec.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré, Cron exécute un précontrôle léger du fournisseur avant de lancer le tour de l'agent. Les fournisseurs `api: "ollama"` en loopback, réseau privé et `.local` sont sondés sur `/api/tags` ; les fournisseurs locaux compatibles OpenAI comme vLLM, SGLang et LM Studio sont sondés sur `/models`. Si le point de terminaison est injoignable, l'exécution est enregistrée comme `skipped` et retentée lors d'une planification ultérieure ; les points de terminaison indisponibles correspondants sont mis en cache pendant 5 minutes pour éviter que de nombreuses tâches ne martèlent le même serveur local.

Remarque : les définitions de tâches Cron résident dans `jobs.json`, tandis que l'état d'exécution en attente réside dans `jobs-state.json`. Si `jobs.json` est modifié en externe, le Gateway recharge les planifications modifiées et efface les créneaux en attente obsolètes ; les réécritures de formatage uniquement n'effacent pas le créneau en attente.

### Exécutions manuelles

`openclaw cron run` retourne dès que l'exécution manuelle est mise en file d'attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

<Note>
`openclaw cron run <job-id>` force l'exécution par défaut. Utilisez `--due` pour conserver l'ancien comportement « exécuter uniquement si l'échéance est atteinte ».
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche.

<Warning>
Si le modèle n'est pas autorisé ou ne peut pas être résolu, Cron fait échouer l'exécution avec une erreur de validation explicite au lieu de revenir au modèle de l'agent de la tâche ou à la sélection de modèle par défaut.
</Warning>

Cron `--model` est un **modèle principal de tâche**, pas un remplacement `/model` de session de discussion. Cela signifie que :

- Les modèles de secours configurés s'appliquent toujours lorsque le modèle de tâche sélectionné échoue.
- La charge utile par tâche `fallbacks` remplace la liste de secours configurée lorsqu'elle est présente.
- Une liste de secours par tâche vide (`fallbacks: []` dans la charge utile/l'API de la tâche) rend l'exécution Cron stricte.
- Lorsqu'une tâche a `--model` mais qu'aucune liste de secours n'est configurée, OpenClaw transmet un remplacement de secours vide explicite afin que le modèle principal de l'agent ne soit pas ajouté comme cible de nouvelle tentative cachée.

### Priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans cet ordre :

1. Remplacement du hook Gmail.
2. `--model` par tâche.
3. Remplacement de modèle de session Cron stocké (lorsque l'utilisateur en a sélectionné un).
4. Sélection du modèle de l'agent ou du modèle par défaut.

### Mode rapide

Le mode rapide de Cron isolé suit la sélection de modèle active résolue. La configuration de modèle `params.fastMode` s'applique par défaut, mais un remplacement de session stocké `fastMode` prévaut toujours sur la configuration.

### Nouvelles tentatives de changement de modèle actif

Si une exécution isolée lève `LiveSessionModelSwitchError`, Cron persiste le fournisseur et le modèle changés (ainsi que le remplacement de profil d'authentification changé lorsqu'il est présent) pour l'exécution active avant de réessayer. La boucle externe de nouvelle tentative est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

## Sortie d'exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne sont que des accusés de réception. Si le premier résultat n'est qu'une mise à jour d'état intermédiaire et qu'aucune exécution de sous-agent descendant n'est responsable de la réponse finale, Cron relance une fois la demande pour obtenir le vrai résultat avant la distribution.

### Suppression des jetons silencieux

Si une exécution Cron isolée retourne uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois la distribution sortante directe et le chemin de résumé mis en file d'attente de secours, de sorte que rien n'est republié dans la discussion.

### Refus structurés

Les exécutions Cron isolées privilégient les métadonnées structurées de refus d'exécution issues de l'exécution intégrée, puis reviennent aux marqueurs de refus connus dans la sortie finale, comme `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` et les formulations de refus liées à l'approbation.

`cron list` et l'historique des exécutions affichent la raison du refus au lieu de signaler une commande bloquée comme `ok`.

## Rétention

La rétention et l'élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d'exécution isolées terminées.
- `cron.runLog.maxBytes` et `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration d'anciennes tâches

<Note>
Si vous avez des tâches Cron antérieures au format actuel de distribution et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, les champs de distribution de premier niveau, y compris l'ancien `threadId`, les alias de distribution `provider` de charge utile) et migre les tâches simples `notify: true` de secours Webhook vers une distribution Webhook explicite lorsque `cron.webhook` est configuré.
</Note>

## Modifications courantes

Mettre à jour les paramètres de distribution sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la distribution pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer le contexte de bootstrap léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annoncer sur un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créer une tâche isolée avec un contexte de bootstrap léger :

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` s'applique uniquement aux tâches de tour d'agent isolé. Pour les exécutions Cron, le mode léger garde le contexte de bootstrap vide au lieu d'injecter l'ensemble complet de bootstrap de l'espace de travail.

## Commandes d'administration courantes

Exécution manuelle et inspection :

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Les entrées `cron runs` incluent des diagnostics de distribution avec la cible Cron prévue, la cible résolue, les envois par l'outil de message, l'utilisation du secours et l'état de livraison.

Reciblage de l'agent et de la session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustements de distribution :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Connexe

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

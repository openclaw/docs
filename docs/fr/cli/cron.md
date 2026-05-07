---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches Cron pour le planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour consulter toute la surface de commande. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une transcription et un id de session frais pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` épingle une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage de canal et de groupe, la politique d’envoi/file d’attente, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites de modèle ou d’authentification sélectionnés par l’utilisateur peuvent être conservés entre les exécutions.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la route de livraison résolue. Pour `channel: "last"`, la prévisualisation indique si la route a été résolue depuis la session principale ou actuelle, ou si elle échouera fermée.

Les cibles préfixées par un fournisseur peuvent lever l’ambiguïté des canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service tels que `imessage:` et `sms:` restent une syntaxe de cible appartenant au canal.

<Note>
Les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Propriété de la livraison

La livraison de chat Cron isolée est partagée entre l’agent et le lanceur :

- L’agent peut envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre en solution de repli la réponse finale uniquement lorsque l’agent n’a pas envoyé directement à la cible résolue.
- `webhook` publie la charge utile terminée vers une URL.
- `none` désactive la livraison de repli du lanceur.

`--announce` est la livraison de repli du lanceur pour la réponse finale. `--no-deliver` désactive ce repli, mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Les rappels créés depuis un chat actif conservent la cible de livraison du chat en direct pour la livraison d’annonce de repli. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour les ID de fournisseur sensibles à la casse, tels que les ID de salons Matrix.

### Livraison des échecs

Les notifications d’échec sont résolues dans cet ordre :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d’annonce principale de la tâche (lorsqu’aucune destination d’échec explicite n’est définie).

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Remarque : les exécutions Cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite ; ainsi, les échecs de modèle/fournisseur incrémentent toujours les compteurs d’erreurs et déclenchent les notifications d’échec.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates-heures sans décalage sont traitées comme UTC, sauf si vous passez aussi `--tz <iana>`, qui interprète l’heure murale dans le fuseau horaire donné.

<Note>
Les tâches ponctuelles sont supprimées après réussite par défaut. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un délai de nouvelle tentative exponentiel après des erreurs consécutives : 30s, 1m, 5m, 15m, 60m. La planification revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le délai de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` peut inclure les notifications répétées d’exécutions ignorées dans les alertes d’échec.

Pour les tâches isolées qui ciblent un fournisseur de modèles local configuré, Cron exécute une vérification préalable légère du fournisseur avant de démarrer le tour de l’agent. Les fournisseurs `api: "ollama"` en loopback, réseau privé et `.local` sont sondés sur `/api/tags` ; les fournisseurs locaux compatibles OpenAI tels que vLLM, SGLang et LM Studio sont sondés sur `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et relancée selon une planification ultérieure ; les points de terminaison morts correspondants sont mis en cache pendant 5 minutes afin d’éviter que de nombreuses tâches ne martèlent le même serveur local.

Remarque : les définitions de tâches Cron vivent dans `jobs.json`, tandis que l’état d’exécution en attente vit dans `jobs-state.json`. Si `jobs.json` est modifié de l’extérieur, le Gateway recharge les planifications modifiées et efface les créneaux en attente obsolètes ; les réécritures qui ne changent que le formatage n’effacent pas le créneau en attente.

### Exécutions manuelles

`openclaw cron run` retourne dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

<Note>
`openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien comportement « exécuter seulement si l’échéance est atteinte ».
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir à l’agent de la tâche ou à la sélection de modèle par défaut.
</Warning>

Le `--model` de Cron est un **principal de tâche**, et non un remplacement `/model` de session de chat. Cela signifie :

- Les replis de modèle configurés s’appliquent toujours lorsque le modèle de tâche sélectionné échoue.
- La charge utile `fallbacks` par tâche remplace la liste de replis configurée lorsqu’elle est présente.
- Une liste de replis par tâche vide (`fallbacks: []` dans la charge utile/API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche a `--model` mais qu’aucune liste de replis n’est configurée, OpenClaw transmet un remplacement de repli vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative cachée.

### Priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans cet ordre :

1. Remplacement par hook Gmail.
2. `--model` par tâche.
3. Remplacement de modèle stocké dans la session Cron (lorsque l’utilisateur en a sélectionné un).
4. Sélection de modèle de l’agent ou par défaut.

### Mode rapide

Le mode rapide de Cron isolé suit la sélection de modèle en direct résolue. La configuration de modèle `params.fastMode` s’applique par défaut, mais un remplacement `fastMode` de session stockée garde la priorité sur la configuration.

### Nouvelles tentatives de changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, Cron persiste le fournisseur et le modèle basculés (ainsi que le remplacement de profil d’authentification basculé lorsqu’il est présent) pour l’exécution active avant de réessayer. La boucle externe de nouvelles tentatives est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes qui ne sont que des accusés de réception. Si le premier résultat n’est qu’une mise à jour de statut intermédiaire et qu’aucune exécution de sous-agent descendant n’est responsable de la réponse finale, Cron relance une fois la demande pour obtenir le résultat réel avant la livraison.

### Suppression des jetons silencieux

Si une exécution Cron isolée renvoie uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois la livraison sortante directe et le chemin de résumé de repli mis en file d’attente, de sorte que rien n’est publié dans le chat.

### Refus structurés

Les exécutions Cron isolées préfèrent les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée, puis se rabattent sur les marqueurs de refus connus dans la sortie finale, tels que `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` et les formulations de refus liées à l’approbation.

`cron list` et l’historique des exécutions exposent le motif du refus au lieu de signaler une commande bloquée comme `ok`.

## Rétention

La rétention et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` et `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migrer d’anciennes tâches

<Note>
Si vous avez des tâches Cron antérieures au format de livraison et de stockage actuel, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, champs de livraison de premier niveau, y compris l’ancien `threadId`, alias de livraison `provider` dans la charge utile) et migre les tâches de repli Webhook simples `notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est configuré.

Doctor supprime aussi les sentinelles Cron persistées `payload.model` telles que `"default"`, `"null"`, les chaînes vides et le `null` JSON. L’exécution Cron traite encore toute chaîne `payload.model` non vide comme un remplacement de modèle explicite et la valide par rapport à `agents.defaults.models` ; omettez la clé de modèle lorsqu’une tâche doit utiliser la sélection de modèle de l’agent/par défaut.
</Note>

## Modifications courantes

Mettre à jour les paramètres de livraison sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer le contexte de démarrage léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer vers un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Annoncer vers un sujet de forum Telegram :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Créer une tâche isolée avec un contexte de démarrage léger :

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches Cron de tour d’agent isolé. Pour les exécutions Cron, le mode léger garde le contexte de démarrage vide au lieu d’injecter l’ensemble complet de démarrage de l’espace de travail.

## Commandes d’administration courantes

Exécution manuelle et inspection :

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` affiche par défaut toutes les tâches correspondantes. Passez `--agent <id>` pour afficher uniquement les tâches dont l’id d’agent normalisé effectif correspond ; les tâches sans id d’agent stocké comptent comme l’agent par défaut configuré.

Les entrées `cron runs` incluent les diagnostics de livraison avec la cible Cron prévue, la cible résolue, les envois par l’outil message, l’utilisation du repli et l’état de livraison.

Reciblage d’agent et de session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avertit lorsque `--agent` est omis sur les tâches de tour d’agent et se rabat sur l’agent par défaut (`main`). Passez `--agent <id>` à la création pour épingler un agent spécifique.

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Associé

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

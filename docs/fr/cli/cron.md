---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches cron pour le planificateur du Gateway.

<Tip>
Exécutez `openclaw cron --help` pour voir toute la surface de commande. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une transcription et un identifiant de session neufs pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` épingle une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage des canaux et des groupes, la politique d’envoi/mise en file d’attente, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les remplacements explicites de modèle ou d’authentification sélectionnés par l’utilisateur peuvent être conservés entre les exécutions.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la route de livraison résolue. Pour `channel: "last"`, la prévisualisation indique si la route a été résolue depuis la session principale ou actuelle, ou si elle échouera en mode fermé.

Les cibles préfixées par fournisseur peuvent lever l’ambiguïté des canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram quand `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service comme `imessage:` et `sms:` restent une syntaxe de cible détenue par le canal.

<Note>
Les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour garder la sortie interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Propriété de la livraison

La livraison de discussion cron isolée est partagée entre l’agent et le lanceur :

- L’agent peut envoyer directement avec l’outil `message` lorsqu’une route de discussion est disponible.
- `announce` livre en secours la réponse finale uniquement lorsque l’agent n’a pas envoyé directement à la cible résolue.
- `webhook` publie la charge utile terminée vers une URL.
- `none` désactive la livraison de secours par le lanceur.

`--announce` correspond à la livraison de secours par le lanceur pour la réponse finale. `--no-deliver` désactive ce secours mais ne retire pas l’outil `message` de l’agent lorsqu’une route de discussion est disponible.

Les rappels créés depuis une discussion active conservent la cible de livraison de discussion en direct pour la livraison d’annonce de secours. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour des identifiants de fournisseurs sensibles à la casse, comme les identifiants de salles Matrix.

### Livraison des échecs

Les notifications d’échec sont résolues dans cet ordre :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d’annonce principale de la tâche (lorsqu’aucune destination d’échec explicite n’est définie).

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Remarque : les exécutions cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même quand aucune charge utile de réponse n’est produite ; les échecs de modèle/fournisseur incrémentent donc quand même les compteurs d’erreurs et déclenchent les notifications d’échec.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates et heures sans décalage sont traitées comme UTC, sauf si vous passez aussi `--tz <iana>`, qui interprète l’heure murale dans le fuseau horaire donné.

<Note>
Les tâches ponctuelles sont supprimées après réussite par défaut. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un délai de nouvelle tentative exponentiel après des erreurs consécutives : 30s, 1m, 5m, 15m, 60m. La planification revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le délai de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` peut inclure les notifications répétées d’exécutions ignorées dans les alertes d’échec.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré, cron exécute une prévérification légère du fournisseur avant de démarrer le tour de l’agent. Les fournisseurs `api: "ollama"` en local loopback, réseau privé et `.local` sont sondés sur `/api/tags` ; les fournisseurs locaux compatibles OpenAI comme vLLM, SGLang et LM Studio sont sondés sur `/models`. Si le point de terminaison est inaccessible, l’exécution est enregistrée comme `skipped` et réessayée lors d’une planification ultérieure ; les points de terminaison morts correspondants sont mis en cache pendant 5 minutes afin d’éviter que de nombreuses tâches ne martèlent le même serveur local.

Remarque : les définitions de tâches cron résident dans `jobs.json`, tandis que l’état d’exécution en attente réside dans `jobs-state.json`. Si `jobs.json` est modifié en externe, le Gateway recharge les planifications modifiées et efface les emplacements en attente obsolètes ; les réécritures de formatage uniquement n’effacent pas l’emplacement en attente.

### Exécutions manuelles

`openclaw cron run` retourne dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

<Note>
`openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien comportement « exécuter uniquement si dû ».
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir à l’agent de la tâche ou à la sélection de modèle par défaut.
</Warning>

Cron `--model` est un **principal de tâche**, pas un remplacement `/model` de session de discussion. Cela signifie que :

- Les modèles de secours configurés s’appliquent toujours lorsque le modèle de tâche sélectionné échoue.
- Le champ `fallbacks` par tâche remplace la liste de secours configurée lorsqu’il est présent.
- Une liste de secours par tâche vide (`fallbacks: []` dans la charge utile/API de la tâche) rend l’exécution cron stricte.
- Lorsqu’une tâche a `--model` mais qu’aucune liste de secours n’est configurée, OpenClaw transmet un remplacement de secours explicitement vide afin que le principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative cachée.

### Priorité du modèle cron isolé

Cron isolé résout le modèle actif dans cet ordre :

1. Remplacement du hook Gmail.
2. `--model` par tâche.
3. Remplacement de modèle de session cron stocké (lorsque l’utilisateur en a sélectionné un).
4. Sélection de modèle de l’agent ou par défaut.

### Mode rapide

Le mode rapide de cron isolé suit la sélection de modèle en direct résolue. La configuration de modèle `params.fastMode` s’applique par défaut, mais un remplacement `fastMode` de session stockée prime toujours sur la configuration.

### Nouvelles tentatives après changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, cron persiste le fournisseur et le modèle changés (ainsi que le remplacement de profil d’authentification changé, le cas échéant) pour l’exécution active avant de réessayer. La boucle externe de nouvelle tentative est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis elle abandonne au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours cron isolés suppriment les réponses obsolètes qui ne sont que des accusés de réception. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire et qu’aucune exécution de sous-agent descendant n’est responsable de la réponse finale, cron relance une fois l’invite pour obtenir le vrai résultat avant la livraison.

### Suppression des jetons silencieux

Si une exécution cron isolée retourne uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), cron supprime à la fois la livraison sortante directe et le chemin de résumé mis en file d’attente de secours, de sorte que rien n’est publié dans la discussion.

### Refus structurés

Les exécutions cron isolées privilégient les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée, puis se rabattent sur les marqueurs de refus connus dans la sortie finale, comme `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` et les formulations de refus liées à l’approbation.

`cron list` et l’historique des exécutions affichent la raison du refus au lieu de signaler une commande bloquée comme `ok`.

## Rétention

La rétention et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécutions isolées terminées.
- `cron.runLog.maxBytes` et `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration d’anciennes tâches

<Note>
Si vous avez des tâches cron antérieures au format actuel de livraison et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les champs cron historiques (`jobId`, `schedule.cron`, les champs de livraison de premier niveau, y compris l’ancien `threadId`, et les alias de livraison `provider` de charge utile) et migre les tâches de secours webhook simples `notify: true` vers une livraison webhook explicite lorsque `cron.webhook` est configuré.
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

Activer un contexte d’amorçage léger pour une tâche isolée :

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

Créer une tâche isolée avec un contexte d’amorçage léger :

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches de tours d’agent isolées. Pour les exécutions cron, le mode léger garde le contexte d’amorçage vide au lieu d’injecter l’ensemble complet d’amorçage de l’espace de travail.

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

`openclaw cron list` affiche par défaut toutes les tâches correspondantes. Passez `--agent <id>` pour afficher uniquement les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent stocké comptent comme l’agent par défaut configuré.

`cron list --json` et `cron show <job-id> --json` incluent un champ `status` de premier niveau sur chaque tâche, calculé à partir de `enabled`, `state.runningAtMs` et `state.lastRunStatus`. Valeurs : `disabled`, `running`, `ok`, `error`, `skipped` ou `idle`. Cela reflète la colonne d’état lisible par l’humain afin que les outils externes puissent lire l’état des tâches sans le recalculer.

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible cron prévue, la cible résolue, les envois par l’outil de message, l’utilisation du secours et l’état livré.

Reciblage de l’agent et de la session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` avertit lorsque `--agent` est omis sur les tâches de tours d’agent et revient à l’agent par défaut (`main`). Passez `--agent <id>` au moment de la création pour épingler un agent spécifique.

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Liens connexes

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

---
read_when:
    - Vous voulez des tâches planifiées et des réveils
    - Vous déboguez l’exécution de Cron et les journaux
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gérez les tâches Cron du planificateur Gateway.

<Tip>
Exécutez `openclaw cron --help` pour voir toute la surface de commande. Consultez [Tâches Cron](/fr/automation/cron-jobs) pour le guide conceptuel.
</Tip>

## Sessions

`--session` accepte `main`, `isolated`, `current` ou `session:<id>`.

<AccordionGroup>
  <Accordion title="Clés de session">
    - `main` se lie à la session principale de l’agent.
    - `isolated` crée une nouvelle transcription et un nouvel identifiant de session pour chaque exécution.
    - `current` se lie à la session active au moment de la création.
    - `session:<id>` épingle une clé de session persistante explicite.

  </Accordion>
  <Accordion title="Sémantique des sessions isolées">
    Les exécutions isolées réinitialisent le contexte de conversation ambiant. Le routage des canaux et des groupes, la politique d’envoi/de mise en file, l’élévation, l’origine et la liaison d’exécution ACP sont réinitialisés pour la nouvelle exécution. Les préférences sûres et les substitutions explicites de modèle ou d’authentification sélectionnées par l’utilisateur peuvent être conservées entre les exécutions.
  </Accordion>
</AccordionGroup>

## Livraison

`openclaw cron list` et `openclaw cron show <job-id>` affichent un aperçu de la route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la route a été résolue depuis la session principale ou actuelle, ou si elle échouera de manière fermée.

Les cibles préfixées par un fournisseur peuvent lever l’ambiguïté des canaux d’annonce non résolus. Par exemple, `to: "telegram:123"` sélectionne Telegram lorsque `delivery.channel` est omis ou vaut `last`. Seuls les préfixes annoncés par le Plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe doit correspondre à ce canal ; `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté. Les préfixes de service comme `imessage:` et `sms:` restent une syntaxe de cible propre au canal.

<Note>
Les tâches `cron add` isolées utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour garder la sortie interne. `--deliver` reste un alias obsolète de `--announce`.
</Note>

### Propriété de la livraison

La livraison de chat Cron isolée est partagée entre l’agent et le lanceur :

- L’agent peut envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre la réponse finale en secours uniquement lorsque l’agent n’a pas envoyé directement vers la cible résolue.
- `webhook` publie la charge utile terminée vers une URL.
- `none` désactive la livraison de secours par le lanceur.

`--announce` est la livraison de secours par le lanceur pour la réponse finale. `--no-deliver` désactive ce secours, mais ne retire pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Les rappels créés depuis un chat actif conservent la cible de livraison du chat en direct pour la livraison d’annonce de secours. Les clés de session internes peuvent être en minuscules ; ne les utilisez pas comme source de vérité pour des identifiants de fournisseur sensibles à la casse, comme les identifiants de salle Matrix.

### Livraison des échecs

Les notifications d’échec sont résolues dans cet ordre :

1. `delivery.failureDestination` sur la tâche.
2. `cron.failureDestination` global.
3. La cible d’annonce principale de la tâche, lorsqu’aucune destination d’échec explicite n’est définie.

<Note>
Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode de livraison principal est `webhook`. Les tâches isolées l’acceptent dans tous les modes.
</Note>

Remarque : les exécutions Cron isolées traitent les échecs d’agent au niveau de l’exécution comme des erreurs de tâche même quand aucune charge utile de réponse n’est produite, afin que les échecs de modèle/fournisseur incrémentent quand même les compteurs d’erreurs et déclenchent les notifications d’échec.

## Planification

### Tâches ponctuelles

`--at <datetime>` planifie une exécution ponctuelle. Les dates-heures sans décalage sont traitées comme UTC, sauf si vous passez aussi `--tz <iana>`, qui interprète l’heure murale dans le fuseau horaire donné.

<Note>
Les tâches ponctuelles sont supprimées après réussite par défaut. Utilisez `--keep-after-run` pour les conserver.
</Note>

### Tâches récurrentes

Les tâches récurrentes utilisent un délai de nouvelle tentative exponentiel après des erreurs consécutives : 30 s, 1 min, 5 min, 15 min, 60 min. La planification revient à la normale après la prochaine exécution réussie.

Les exécutions ignorées sont suivies séparément des erreurs d’exécution. Elles n’affectent pas le délai de nouvelle tentative, mais `openclaw cron edit <job-id> --failure-alert-include-skipped` permet d’inclure les notifications répétées d’exécutions ignorées dans les alertes d’échec.

Pour les tâches isolées qui ciblent un fournisseur de modèle local configuré, Cron exécute un précontrôle léger du fournisseur avant de démarrer le tour d’agent. Les fournisseurs `api: "ollama"` en local loopback, sur réseau privé et `.local` sont sondés sur `/api/tags` ; les fournisseurs locaux compatibles OpenAI comme vLLM, SGLang et LM Studio sont sondés sur `/models`. Si le point de terminaison est injoignable, l’exécution est enregistrée comme `skipped` et réessayée lors d’une planification ultérieure ; les points de terminaison morts correspondants sont mis en cache pendant 5 minutes pour éviter que de nombreuses tâches ne martèlent le même serveur local.

Remarque : les définitions de tâches Cron vivent dans `jobs.json`, tandis que l’état d’exécution en attente vit dans `jobs-state.json`. Si `jobs.json` est modifié extérieurement, le Gateway recharge les planifications modifiées et efface les créneaux en attente obsolètes ; les réécritures limitées au formatage n’effacent pas le créneau en attente.

### Exécutions manuelles

`openclaw cron run` retourne dès que l’exécution manuelle est mise en file. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }`. Utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

<Note>
`openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien comportement « exécuter uniquement si l’échéance est atteinte ».
</Note>

## Modèles

`cron add|edit --model <ref>` sélectionne un modèle autorisé pour la tâche.

<Warning>
Si le modèle n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite au lieu de se rabattre sur l’agent de la tâche ou sur la sélection de modèle par défaut.
</Warning>

Cron `--model` est un **principal de tâche**, pas une substitution `/model` de session de chat. Cela signifie que :

- Les modèles de secours configurés s’appliquent toujours lorsque le modèle de tâche sélectionné échoue.
- Le champ `fallbacks` de la charge utile par tâche remplace la liste de secours configurée lorsqu’il est présent.
- Une liste de secours par tâche vide (`fallbacks: []` dans la charge utile/API de la tâche) rend l’exécution Cron stricte.
- Lorsqu’une tâche a `--model` mais qu’aucune liste de secours n’est configurée, OpenClaw transmet une substitution de secours vide explicite afin que le principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative masquée.

### Priorité des modèles Cron isolés

Cron isolé résout le modèle actif dans cet ordre :

1. Substitution du hook Gmail.
2. `--model` par tâche.
3. Substitution de modèle de session Cron stockée, lorsque l’utilisateur en a sélectionné une.
4. Sélection du modèle de l’agent ou par défaut.

### Mode rapide

Le mode rapide Cron isolé suit la sélection de modèle en direct résolue. La configuration de modèle `params.fastMode` s’applique par défaut, mais une substitution `fastMode` de session stockée prime toujours sur la configuration.

### Nouvelles tentatives après changement de modèle en direct

Si une exécution isolée lève `LiveSessionModelSwitchError`, Cron persiste le fournisseur et le modèle changés, ainsi que la substitution de profil d’authentification changée lorsqu’elle est présente, pour l’exécution active avant de réessayer. La boucle externe de nouvelle tentative est limitée à deux nouvelles tentatives de changement après la tentative initiale, puis abandonne au lieu de boucler indéfiniment.

## Sortie d’exécution et refus

### Suppression des accusés de réception obsolètes

Les tours Cron isolés suppriment les réponses obsolètes ne contenant qu’un accusé de réception. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire et qu’aucune exécution de sous-agent descendant n’est responsable de la réponse finale, Cron relance une fois la demande pour obtenir le vrai résultat avant livraison.

### Suppression des jetons silencieux

Si une exécution Cron isolée retourne uniquement le jeton silencieux (`NO_REPLY` ou `no_reply`), Cron supprime à la fois la livraison sortante directe et le chemin de résumé mis en file de secours ; rien n’est donc publié en retour dans le chat.

### Refus structurés

Les exécutions Cron isolées privilégient les métadonnées structurées de refus d’exécution depuis l’exécution intégrée, puis se rabattent sur les marqueurs de refus connus dans la sortie finale, comme `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` et les formulations de refus liées aux approbations.

`cron list` et l’historique des exécutions affichent la raison du refus au lieu de signaler une commande bloquée comme `ok`.

## Rétention

La rétention et l’élagage sont contrôlés dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolée terminées.
- `cron.runLog.maxBytes` et `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migration des anciennes tâches

<Note>
Si vous avez des tâches Cron créées avant le format actuel de livraison et de stockage, exécutez `openclaw doctor --fix`. Doctor normalise les anciens champs Cron (`jobId`, `schedule.cron`, champs de livraison de premier niveau dont l’ancien `threadId`, alias de livraison `provider` dans la charge utile) et migre les tâches de secours Webhook simples `notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est configuré.
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

Activer un contexte de bootstrap léger pour une tâche isolée :

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

`--light-context` s’applique uniquement aux tâches de tour d’agent isolées. Pour les exécutions Cron, le mode léger garde le contexte de bootstrap vide au lieu d’injecter l’ensemble complet de bootstrap de l’espace de travail.

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

`openclaw cron list` affiche toutes les tâches correspondantes par défaut. Passez `--agent <id>` pour afficher uniquement les tâches dont l’identifiant d’agent normalisé effectif correspond ; les tâches sans identifiant d’agent stocké comptent comme l’agent par défaut configuré.

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible Cron prévue, la cible résolue, les envois par l’outil de message, l’utilisation du secours et l’état livré.

Reciblage de l’agent et de la session :

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

## Connexe

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)

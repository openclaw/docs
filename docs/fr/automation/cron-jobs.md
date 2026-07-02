---
read_when:
    - Planification de tâches en arrière-plan ou de réveils
    - Intégrer des déclencheurs externes (webhooks, Gmail) à OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, webhooks et déclencheurs Gmail PubSub pour le planificateur du Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-07-02T00:51:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron est le planificateur intégré du Gateway. Il persiste les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de discussion ou un point de terminaison Webhook.

## Démarrage rapide

<Steps>
  <Step title="Ajouter un rappel ponctuel">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Vérifier vos tâches">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Voir l’historique des exécutions">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Fonctionnement de cron

- Cron s’exécute **dans le processus Gateway** (pas dans le modèle).
- Les définitions de tâches, l’état d’exécution et l’historique des exécutions persistent dans la base de données d’état SQLite partagée d’OpenClaw, afin que les redémarrages ne perdent pas les planifications.
- Lors d’une mise à niveau, exécutez `openclaw doctor --fix` pour importer les anciens fichiers `~/.openclaw/cron/jobs.json`, `jobs-state.json` et `runs/*.jsonl` dans SQLite, puis les renommer avec un suffixe `.migrated`. Les lignes de tâches mal formées sont ignorées à l’exécution et copiées dans `jobs-quarantine.json` pour réparation ou examen ultérieur.
- `cron.store` continue de nommer la clé logique du stockage cron et le chemin d’importation de doctor. Après l’importation, modifier ce fichier JSON ne change plus les tâches cron actives ; utilisez plutôt `openclaw cron add|edit|remove` ou les méthodes RPC cron du Gateway.
- Toutes les exécutions cron créent des enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
- Au démarrage du Gateway, les tâches de tour d’agent isolé en retard sont replanifiées hors de la fenêtre de connexion au canal au lieu d’être rejouées immédiatement, afin que le démarrage de Discord/Telegram et la configuration des commandes natives restent réactifs après les redémarrages.
- Les tâches ponctuelles (`--at`) sont supprimées automatiquement après succès par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l’exécution se termine, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées qui reçoivent l’autorisation étroite d’auto-nettoyage cron peuvent toujours lire l’état du planificateur, une liste auto-filtrée de leur tâche actuelle et l’historique d’exécution de cette tâche, afin que les vérifications d’état/Heartbeat puissent inspecter leur propre planification sans obtenir un accès plus large aux mutations cron.
- Les exécutions cron isolées se protègent aussi contre les réponses d’accusé de réception obsolètes. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire (`on it`, `pulling everything together` et indices similaires) et qu’aucune exécution de sous-agent descendante n’est encore responsable de la réponse finale, OpenClaw relance une seule fois la demande pour obtenir le résultat réel avant livraison.
- Les exécutions cron isolées utilisent les métadonnées structurées de refus d’exécution de l’exécution intégrée, y compris les enveloppes node-host `UNAVAILABLE` dont le message d’erreur imbriqué commence par `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`, afin qu’une commande bloquée ne soit pas signalée comme une exécution réussie, tandis que la prose ordinaire de l’assistant n’est pas traitée comme un refus.
- Les exécutions cron isolées traitent aussi les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite, afin que les échecs de modèle/fournisseur incrémentent les compteurs d’erreurs et déclenchent les notifications d’échec au lieu de valider la tâche comme réussie.
- Lorsqu’une tâche de tour d’agent isolé atteint `timeoutSeconds`, cron interrompt l’exécution d’agent sous-jacente et lui accorde une courte fenêtre de nettoyage. Si l’exécution ne se vide pas, le nettoyage détenu par le Gateway force la libération de la propriété de session de cette exécution avant que cron enregistre l’expiration du délai, afin que le travail de discussion en file d’attente ne reste pas bloqué derrière une session de traitement obsolète.
- Si un tour d’agent isolé se bloque avant le démarrage du lanceur ou avant le premier appel au modèle, cron enregistre un délai d’expiration propre à la phase, comme `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Ces chiens de garde couvrent les fournisseurs intégrés et les fournisseurs adossés à la CLI avant que leur processus CLI externe ne soit réellement démarré, et ils sont plafonnés indépendamment des longues valeurs `timeoutSeconds`, afin que les échecs de démarrage à froid, d’authentification ou de contexte remontent rapidement au lieu d’attendre tout le budget de la tâche.
- Si vous utilisez le cron système ou un autre planificateur externe pour exécuter `openclaw agent`, enveloppez-le avec une escalade d’arrêt forcé même si la CLI gère `SIGTERM`/`SIGINT`. Les exécutions adossées au Gateway demandent au Gateway d’interrompre les exécutions acceptées ; les exécutions locales et de secours intégrées reçoivent le même signal d’interruption. Pour GNU `timeout`, préférez `timeout -k 60 600 openclaw agent ...` à un simple `timeout 600 ...` ; la valeur `-k` est le filet de sécurité du superviseur si le processus ne peut pas se vider. Pour les unités systemd, conservez la même forme en utilisant un signal d’arrêt `SIGTERM` plus une fenêtre de grâce comme `TimeoutStopSec` avant tout arrêt final. Si une nouvelle tentative réutilise un `--run-id` alors que l’exécution Gateway d’origine est encore active, le doublon est signalé comme en cours au lieu de démarrer une deuxième exécution.

<a id="maintenance"></a>

<Note>
La réconciliation des tâches pour cron appartient d’abord à l’exécution, puis s’appuie sur l’historique durable : une tâche cron active reste vivante tant que l’exécution cron suit encore cette tâche comme en cours, même si une ancienne ligne de session enfant existe encore. Une fois que l’exécution cesse de posséder la tâche et que la fenêtre de grâce de 5 minutes expire, la maintenance vérifie les journaux d’exécution persistés et l’état de la tâche pour l’exécution correspondante `cron:<jobId>:<startedAt>`. Si cet historique durable montre un résultat terminal, le registre des tâches est finalisé à partir de celui-ci ; sinon, la maintenance détenue par le Gateway peut marquer la tâche comme `lost`. L’audit CLI hors ligne peut récupérer depuis l’historique durable, mais il ne traite pas son propre ensemble vide de tâches actives en processus comme preuve qu’une exécution cron détenue par le Gateway a disparu.
</Note>

## Types de planification

| Type    | Option CLI | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Horodatage ponctuel (ISO 8601 ou relatif comme `20m`)    |
| `every` | `--every` | Intervalle fixe                                          |
| `cron`  | `--cron`  | Expression cron à 5 ou 6 champs avec `--tz` facultatif |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification à l’heure locale.

Les expressions récurrentes en début d’heure sont automatiquement décalées jusqu’à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour forcer un minutage précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine ne sont pas des jokers, croner correspond quand **l’un ou l’autre** champ correspond, pas les deux. C’est le comportement standard de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur de jour de la semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un champ et vérifiez l’autre dans l’invite ou la commande de votre tâche.

## Styles d’exécution

| Style              | Valeur de `--session` | S’exécute dans              | Idéal pour                         |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Session principale | `main`              | Voie de réveil cron dédiée | Rappels, événements système       |
| Isolé              | `isolated`          | `cron:<jobId>` dédié       | Rapports, tâches de fond          |
| Session actuelle   | `current`           | Exécution cron détachée    | Travail récurrent sensible au contexte |
| Session personnalisée | `session:custom-id` | Exécution cron détachée | Cibler une discussion/session connue |

<AccordionGroup>
  <Accordion title="Session principale, isolée ou personnalisée">
    Les tâches de **session principale** mettent en file un événement système dans une voie d’exécution détenue par cron et réveillent facultativement le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Elles peuvent utiliser le dernier contexte de livraison de la session principale cible pour les réponses, mais elles n’ajoutent pas les tours cron routiniers à la voie de discussion humaine et n’étendent pas la fraîcheur de réinitialisation quotidienne/inactive de la session cible. Les tâches **isolées** exécutent un tour d’agent dédié avec une nouvelle session. Les tâches de session **actuelle** et **personnalisée** (`current`, `session:xxx`) peuvent utiliser la discussion/session sélectionnée pour le contexte de livraison et l’amorçage sûr des préférences, mais chaque exécution se déroule tout de même dans une session cron détachée afin que le travail planifié ne bloque pas et ne pollue pas la transcription de la conversation active.

    Les événements cron de session principale sont des rappels d’événement système autonomes. Ils n’incluent
    pas automatiquement l’instruction "Read
    HEARTBEAT.md" de l’invite Heartbeat par défaut. Si un rappel récurrent doit consulter
    `HEARTBEAT.md`, indiquez-le explicitement dans le texte de l’événement cron ou dans les
    propres instructions de l’agent.

  </Accordion>
  <Accordion title="Ce que signifie « nouvelle session » pour les tâches détachées">
    Pour les tâches isolées, de session actuelle et de session personnalisée, « nouvelle session » signifie un nouvel identifiant de transcription/session pour chaque exécution. OpenClaw peut transporter des préférences sûres comme les paramètres de réflexion/rapidité/verbosité, les libellés et les remplacements explicites de modèle/auth sélectionnés par l’utilisateur. Les exécutions détachées n’héritent pas du contexte ambiant de conversation d’une ancienne ligne cron : routage canal/groupe, politique d’envoi ou de mise en file, élévation, origine ou liaison d’exécution ACP. Placez l’état durable du travail récurrent dans l’invite, les fichiers de l’espace de travail, les outils ou le système sur lequel la tâche opère, plutôt que de dépendre d’une transcription de discussion active comme mémoire cron.
  </Accordion>
  <Accordion title="Nettoyage à l’exécution">
    Pour les tâches isolées, le démontage à l’exécution inclut maintenant un nettoyage au mieux du navigateur pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat cron réel prévale toujours.

    Les exécutions cron isolées disposent aussi de toutes les instances d’exécution MCP groupées créées pour la tâche via le chemin partagé de nettoyage d’exécution. Cela correspond à la manière dont les clients MCP de session principale et de session personnalisée sont démontés, afin que les tâches cron isolées ne fuient pas de processus enfants stdio ni de connexions MCP longues d’une exécution à l’autre.

  </Accordion>
  <Accordion title="Livraison par sous-agent et Discord">
    Lorsque les exécutions cron isolées orchestrent des sous-agents, la livraison préfère aussi la sortie finale descendante au texte intermédiaire obsolète du parent. Si des descendants sont encore en cours, OpenClaw supprime cette mise à jour parentielle partielle au lieu de l’annoncer.

    Pour les cibles d’annonce Discord en texte seul, OpenClaw envoie une seule fois le texte final canonique de l’assistant au lieu de rejouer à la fois les charges utiles de texte diffusées/intermédiaires et la réponse finale. Les médias et les charges utiles Discord structurées sont toujours livrés comme charges utiles séparées afin que les pièces jointes et les composants ne soient pas abandonnés.

  </Accordion>
</AccordionGroup>

### Charges utiles de commande

Utilisez les charges utiles de commande pour les scripts déterministes qui doivent s’exécuter dans le planificateur du Gateway sans démarrer un tour d’agent isolé adossé à un modèle. Les tâches de commande s’exécutent sur l’hôte du Gateway, capturent stdout/stderr, enregistrent l’exécution dans l’historique cron et réutilisent les mêmes modes de livraison `announce`, `webhook` et `none` que les tâches isolées.

<Note>
Le cron de commande est une surface d’automatisation Gateway administrateur-opérateur, pas un appel agent
`tools.exec`. Créer, mettre à jour, supprimer ou exécuter manuellement des tâches cron
nécessite `operator.admin` ; les exécutions de commande planifiées s’exécutent ensuite dans le
processus Gateway comme cette automatisation écrite par l’administrateur. La politique d’exécution agent comme
`tools.exec.mode`, les invites d’approbation et les listes d’autorisation d’outils par agent régissent
les outils d’exécution visibles par le modèle, pas les charges utiles cron de commande.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` lorsque vous voulez une exécution argv exacte sans analyse par le shell. Les champs facultatifs `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` et `--output-max-bytes` contrôlent l’environnement du processus, stdin et les limites de sortie.

Si stdout n’est pas vide, ce texte est le résultat remis. Si stdout est vide et stderr n’est pas vide, stderr est remis. Si les deux flux sont présents, cron remet un petit bloc `stdout:` / `stderr:`. Un code de sortie zéro enregistre l’exécution comme `ok`; une sortie non nulle, un signal, un timeout ou un timeout sans sortie enregistre `error` et peut déclencher des alertes d’échec. Une commande qui affiche uniquement `NO_REPLY` utilise la suppression normale du jeton silencieux cron et ne publie rien dans la discussion.

### Options de charge utile pour les tâches isolées

<ParamField path="--message" type="string" required>
  Texte de prompt (requis pour isolated).
</ParamField>
<ParamField path="--model" type="string">
  Remplacement du modèle ; utilise le modèle autorisé sélectionné pour la tâche.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste de modèles de repli par tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passez `--fallbacks ""` pour une exécution stricte sans replis.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Sur `cron edit`, supprime le remplacement de repli par tâche afin que la tâche suive la précédence de repli configurée. Ne peut pas être combiné avec `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Sur `cron edit`, supprime le remplacement de modèle par tâche afin que la tâche suive la précédence normale de sélection de modèle cron (un remplacement stocké de session cron s’il est défini, sinon le modèle de l’agent/par défaut). Ne peut pas être combiné avec `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Remplacement du niveau de réflexion.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Sur `cron edit`, supprime le remplacement de réflexion par tâche afin que la tâche suive la précédence normale de réflexion cron. Ne peut pas être combiné avec `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignorer l’injection des fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Limiter les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` utilise le modèle autorisé sélectionné comme modèle principal de cette tâche. Ce n’est pas identique à un remplacement `/model` de session de discussion : les chaînes de repli configurées s’appliquent toujours lorsque le modèle principal de la tâche échoue. Si le modèle demandé n’est pas autorisé ou ne peut pas être résolu, cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir silencieusement à la sélection de modèle de l’agent/par défaut de la tâche.

Les tâches cron peuvent aussi porter des `fallbacks` au niveau de la charge utile. Lorsqu’elle est présente, cette liste remplace la chaîne de repli configurée pour la tâche. Utilisez `fallbacks: []` dans la charge utile/API de la tâche lorsque vous voulez une exécution cron stricte qui tente uniquement le modèle sélectionné. Si une tâche a `--model` mais aucun repli dans la charge utile ni dans la configuration, OpenClaw transmet un remplacement de repli vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative supplémentaire cachée.

Les vérifications préalables des fournisseurs locaux parcourent les replis configurés avant de marquer une exécution cron comme `skipped` ; `fallbacks: []` garde ce chemin de vérification préalable strict.

La précédence de sélection de modèle pour les tâches isolées est :

1. Remplacement de modèle du hook Gmail (lorsque l’exécution provient de Gmail et que ce remplacement est autorisé)
2. `model` de charge utile par tâche
3. Remplacement de modèle de session cron stocké sélectionné par l’utilisateur
4. Sélection de modèle de l’agent/par défaut

Le mode rapide suit aussi la sélection active résolue. Si la configuration du modèle sélectionné a `params.fastMode`, le cron isolé l’utilise par défaut. Un remplacement `fastMode` de session stocké l’emporte toujours sur la configuration dans les deux sens. Le mode automatique utilise le seuil `params.fastAutoOnSeconds` du modèle sélectionné lorsqu’il est présent, avec 60 secondes par défaut.

Si une exécution isolée rencontre un transfert de changement de modèle actif, cron réessaie avec le fournisseur/modèle basculé et conserve cette sélection active pour l’exécution en cours avant de réessayer. Lorsque le changement porte aussi un nouveau profil d’authentification, cron conserve également ce remplacement de profil d’authentification pour l’exécution en cours. Les nouvelles tentatives sont limitées : après la tentative initiale plus 2 nouvelles tentatives de changement, cron abandonne au lieu de boucler indéfiniment.

Avant qu’une exécution cron isolée n’entre dans le runner d’agent, OpenClaw vérifie les points de terminaison de fournisseurs locaux joignables pour les fournisseurs configurés `api: "ollama"` et `api: "openai-completions"` dont `baseUrl` est local loopback, réseau privé ou `.local`. Si ce point de terminaison est indisponible, l’exécution est enregistrée comme `skipped` avec une erreur fournisseur/modèle claire au lieu de démarrer un appel de modèle. Le résultat du point de terminaison est mis en cache pendant 5 minutes, de sorte que de nombreuses tâches arrivées à échéance utilisant le même serveur local Ollama, vLLM, SGLang ou LM Studio indisponible partagent une petite sonde au lieu de créer une tempête de requêtes. Les exécutions ignorées par vérification préalable du fournisseur n’incrémentent pas le délai de repli des erreurs d’exécution ; activez `failureAlert.includeSkipped` lorsque vous voulez des notifications répétées d’exécutions ignorées.

## Livraison et sortie

| Mode       | Ce qui se passe                                                    |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Remet le texte final à la cible par repli si l’agent ne l’a pas envoyé |
| `webhook`  | Publie la charge utile d’événement terminé vers une URL            |
| `none`     | Aucune livraison de repli du runner                                |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour la livraison au canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123` ; OpenClaw accepte aussi le raccourci appartenant à Telegram `-1001234567890:123`. Les appelants RPC/config directs peuvent passer `delivery.threadId` sous forme de chaîne ou de nombre. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`). Les ID de salons Matrix sont sensibles à la casse ; utilisez l’ID exact du salon ou la forme `room:!room:server` de Matrix.

Lorsque la livraison announce utilise `channel: "last"` ou omet `channel`, une cible préfixée par un fournisseur comme `telegram:123` peut sélectionner le canal avant que cron revienne à l’historique de session ou à un seul canal configuré. Seuls les préfixes annoncés par le Plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe de cible doit nommer le même fournisseur ; par exemple, `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté au lieu de laisser WhatsApp interpréter l’ID Telegram comme un numéro de téléphone. Les préfixes de type de cible et de service comme `channel:<id>`, `user:<id>`, `imessage:<handle>` et `sms:<number>` restent une syntaxe de cible propre au canal, pas des sélecteurs de fournisseur.

Pour les tâches isolées, la livraison à la discussion est partagée. Si une route de discussion est disponible, l’agent peut utiliser l’outil `message` même lorsque la tâche utilise `--no-deliver`. Si l’agent envoie à la cible configurée/actuelle, OpenClaw ignore l’annonce de repli. Sinon, `announce`, `webhook` et `none` contrôlent uniquement ce que le runner fait de la réponse finale après le tour de l’agent.

Lorsqu’un agent crée un rappel isolé depuis une discussion active, OpenClaw stocke la cible de livraison active préservée pour la route d’annonce de repli. Les clés de session internes peuvent être en minuscules ; les cibles de livraison fournisseur ne sont pas reconstruites à partir de ces clés lorsque le contexte de discussion actuel est disponible.

La livraison announce implicite utilise les listes d’autorisation de canaux configurées pour valider et réacheminer les cibles obsolètes. Les approbations du magasin d’association de DM ne sont pas des destinataires d’automatisation de repli ; définissez `delivery.to` ou configurez l’entrée `allowFrom` du canal lorsqu’une tâche planifiée doit envoyer proactivement vers un DM.

## Langue de sortie

Les tâches cron ne déduisent pas la langue de réponse à partir du canal, des paramètres régionaux ou des messages précédents. Placez la règle de langue dans le message ou le modèle planifié :

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Pour les fichiers de modèle, conservez l’instruction de langue dans le prompt rendu et vérifiez que les placeholders comme `{{language}}` sont remplis avant l’exécution de la tâche. Si la sortie mélange les langues, rendez la règle explicite, par exemple : « Utilisez le chinois pour le texte narratif et gardez les termes techniques en anglais. »

Les notifications d’échec suivent un chemin de destination séparé :

- `cron.failureDestination` définit une valeur globale par défaut pour les notifications d’échec.
- `job.delivery.failureDestination` la remplace par tâche.
- Si aucun des deux n’est défini et que la tâche livre déjà via `announce`, les notifications d’échec reviennent maintenant à cette cible announce principale.
- `delivery.failureDestination` n’est pris en charge que sur les tâches `sessionTarget="isolated"` sauf si le mode de livraison principal est `webhook`.
- `failureAlert.includeSkipped: true` inscrit une tâche ou une politique globale d’alerte cron aux alertes répétées d’exécutions ignorées. Les exécutions ignorées conservent un compteur séparé d’ignorations consécutives, elles n’affectent donc pas le délai de repli des erreurs d’exécution.

## Exemples CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway peut exposer des points de terminaison Webhook HTTP pour les déclencheurs externes. Activez-les dans la configuration :

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentification

Chaque requête doit inclure le jeton de hook via l’en-tête :

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Mettre en file d’attente un événement système pour la session principale :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Description de l’événement.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Exécuter un tour d’agent isolé :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Champs : `message` (requis), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Les noms de hooks personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappages peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` avec des modèles ou des transformations de code.
  </Accordion>
</AccordionGroup>

<Warning>
Gardez les points de terminaison de hook derrière local loopback, tailnet ou un proxy inverse de confiance.

- Utilisez un jeton de hook dédié ; ne réutilisez pas les jetons d’authentification du Gateway.
- Conservez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter l’agent effectif qu’un hook peut cibler, y compris l’agent par défaut lorsque `agentId` est omis.
- Gardez `hooks.allowRequestSessionKey=false`, sauf si vous avez besoin de sessions choisies par l’appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clé de session autorisées.
- Les charges utiles de hook sont enveloppées par défaut avec des limites de sécurité.

</Warning>

## Intégration Gmail PubSub

Connectez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis :** CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour le point de terminaison HTTPS public.
</Note>

### Configuration par assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cette commande écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise Tailscale Funnel pour le point de terminaison push.

### Démarrage automatique du Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, le Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour vous en exclure.

### Configuration manuelle ponctuelle

<Steps>
  <Step title="Select the GCP project">
    Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog` :

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Remplacement du modèle Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestion des tâches

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` retourne après la mise en file d’attente de l’exécution manuelle. Utilisez `--wait` pour les hooks d’arrêt, les scripts de maintenance ou toute autre automatisation qui doit bloquer jusqu’à la fin de l’exécution mise en file d’attente. Le mode d’attente interroge le `runId` exact retourné ; il se termine avec `0` pour l’état `ok` et avec un code non nul pour `error`, `skipped` ou un délai d’attente dépassé.

L’outil d’agent `cron` retourne des résumés compacts de tâches (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) depuis `cron(action: "list")` ; utilisez `cron(action: "get", jobId: "...")` pour une définition complète d’une tâche. Les appelants directs du Gateway peuvent passer `compact: true` à `cron.list` ; l’omettre conserve la réponse complète existante avec les aperçus de livraison.

`openclaw cron create` est un alias de `openclaw cron add`, et les nouvelles tâches peuvent utiliser une planification positionnelle (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou un horodatage ISO) suivie d’une invite d’agent positionnelle. Utilisez `--webhook <url>` sur `cron add|create` ou `cron edit` pour envoyer par POST la charge utile de l’exécution terminée à un point de terminaison HTTP. La livraison Webhook ne peut pas être combinée avec des indicateurs de livraison par chat tels que `--announce`, `--channel`, `--to`, `--thread-id` ou `--account`. Sur `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` retirent individuellement ces champs de routage (chacun étant rejeté avec son indicateur de définition correspondant), ce qui est distinct de `--no-deliver`, qui désactive la livraison de repli du lanceur.

<Note>
Remarque sur le remplacement de modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné pour la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact atteint l’exécution d’agent isolée.
- S’il n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite.
- Les correctifs de charge utile de l’API `cron.update` peuvent définir `model: null` pour effacer un remplacement de modèle stocké pour une tâche.
- `openclaw cron edit <job-id> --clear-model` efface ce remplacement depuis la CLI (même effet que le correctif `model: null`) et ne peut pas être combiné avec `--model`.
- Les chaînes de repli configurées s’appliquent toujours, car le `--model` de Cron est un modèle principal de tâche, pas un remplacement `/model` de session.
- `openclaw cron add|edit --fallbacks ...` définit la charge utile `fallbacks`, remplaçant les replis configurés pour cette tâche ; `--fallbacks ""` désactive le repli et rend l’exécution stricte. `openclaw cron edit <job-id> --clear-fallbacks` efface le remplacement par tâche.
- Un simple `--model` sans liste de replis explicite ou configurée ne se rabat pas sur le modèle principal de l’agent comme cible de nouvelle tentative supplémentaire silencieuse.

</Note>

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` limite à la fois la distribution Cron planifiée et l’exécution de tours d’agent isolés, avec une valeur par défaut de 8. Les tours d’agent Cron isolés utilisent en interne la voie d’exécution dédiée `cron-nested` de la file d’attente, donc augmenter cette valeur permet à des exécutions LLM Cron indépendantes de progresser en parallèle au lieu de seulement démarrer leurs enveloppes Cron externes. La voie partagée non-Cron `nested` n’est pas élargie par ce paramètre.

`cron.store` est une clé de stockage logique et un chemin d’importation doctor hérité. Exécutez `openclaw doctor --fix` pour importer les stockages JSON existants dans SQLite et les archiver ; les futures modifications Cron doivent passer par la CLI ou l’API Gateway.

Désactiver Cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Nouvelle tentative unique** : les erreurs transitoires (limite de débit, surcharge, réseau, erreur serveur) sont réessayées jusqu’à 3 fois avec un backoff exponentiel. Les erreurs permanentes désactivent immédiatement.

    **Nouvelle tentative récurrente** : backoff exponentiel (30 s à 60 min) entre les tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (`24h` par défaut) purge les entrées de session d’exécution isolée. `cron.runLog.keepLines` limite les lignes d’historique d’exécution SQLite conservées par tâche ; `maxBytes` est conservé pour la compatibilité de configuration avec les anciens journaux d’exécution adossés à des fichiers.
  </Accordion>
</AccordionGroup>

## Dépannage

### Échelle de commandes

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron not firing">
    - Vérifiez `cron.enabled` et la variable d’environnement `OPENCLAW_SKIP_CRON`.
    - Confirmez que le Gateway fonctionne en continu.
    - Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l’hôte.
    - `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore due.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Le mode de livraison `none` signifie qu’aucun envoi de repli du lanceur n’est attendu. L’agent peut toujours envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
    - Une cible de livraison manquante/invalide (`channel`/`to`) signifie que la sortie a été ignorée.
    - Pour Matrix, les tâches copiées ou héritées avec des ID de salle `delivery.to` en minuscules peuvent échouer, car les ID de salle Matrix sont sensibles à la casse. Modifiez la tâche avec la valeur exacte `!room:server` ou `room:!room:server` provenant de Matrix.
    - Les erreurs d’authentification de canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
    - Si l’exécution isolée ne retourne que le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe et supprime aussi le chemin de résumé mis en file d’attente de repli, donc rien n’est publié dans le chat.
    - Si l’agent doit envoyer lui-même un message à l’utilisateur, vérifiez que la tâche dispose d’une route utilisable (`channel: "last"` avec un chat précédent, ou un canal/une cible explicite).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - La fraîcheur des réinitialisations quotidiennes et d’inactivité n’est pas basée sur `updatedAt` ; consultez [Gestion des sessions](/fr/concepts/session#session-lifecycle).
    - Les réveils Cron, les exécutions Heartbeat, les notifications exec et la tenue de registre du Gateway peuvent mettre à jour la ligne de session pour le routage/l’état, mais ils n’étendent pas `sessionStartedAt` ni `lastInteractionAt`.
    - Pour les lignes héritées créées avant l’existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` depuis l’en-tête de session JSONL de la transcription lorsque le fichier est encore disponible. Les lignes d’inactivité héritées sans `lastInteractionAt` utilisent cette heure de début récupérée comme référence d’inactivité.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron sans `--tz` utilise le fuseau horaire de l’hôte du Gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme UTC.
    - `activeHours` de Heartbeat utilise la résolution de fuseau horaire configurée.

  </Accordion>
</AccordionGroup>

## Connexe

- [Automatisation](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions Cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

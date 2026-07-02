---
read_when:
    - Planification des tâches en arrière-plan ou des réveils
    - Connecter des déclencheurs externes (Webhooks, Gmail) à OpenClaw
    - Choisir entre heartbeat et cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-07-02T08:14:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron est le planificateur intégré du Gateway. Il conserve les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de chat ou un endpoint webhook.

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
- Les définitions de tâches, l’état d’exécution et l’historique des exécutions sont conservés dans la base de données d’état SQLite partagée d’OpenClaw, afin que les redémarrages ne perdent pas les planifications.
- Lors d’une mise à niveau, exécutez `openclaw doctor --fix` pour importer les anciens fichiers `~/.openclaw/cron/jobs.json`, `jobs-state.json` et `runs/*.jsonl` dans SQLite et les renommer avec un suffixe `.migrated`. Les lignes de tâches mal formées sont ignorées par l’exécution et copiées dans `jobs-quarantine.json` pour réparation ou examen ultérieur.
- `cron.store` nomme toujours la clé logique du magasin cron et le chemin d’importation de doctor. Après l’importation, modifier ce fichier JSON ne change plus les tâches cron actives ; utilisez plutôt `openclaw cron add|edit|remove` ou les méthodes RPC cron du Gateway.
- Toutes les exécutions cron créent des enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
- Au démarrage du Gateway, les tâches isolées de tour d’agent en retard sont replanifiées en dehors de la fenêtre de connexion au canal au lieu d’être rejouées immédiatement, afin que le démarrage de Discord/Telegram et la configuration des commandes natives restent réactifs après les redémarrages.
- Les tâches ponctuelles (`--at`) sont automatiquement supprimées après une réussite par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l’exécution se termine, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées qui reçoivent l’octroi étroit d’auto-nettoyage cron peuvent toujours lire l’état du planificateur, une liste auto-filtrée de leur tâche actuelle et l’historique d’exécution de cette tâche, afin que les vérifications d’état/Heartbeat puissent inspecter leur propre planification sans obtenir un accès plus large à la mutation de cron.
- Les exécutions cron isolées se protègent aussi contre les réponses d’accusé de réception obsolètes. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire (`on it`, `pulling everything together` et indices similaires) et qu’aucune exécution de sous-agent descendante n’est encore responsable de la réponse finale, OpenClaw relance une seule fois la demande pour obtenir le résultat réel avant livraison.
- Les exécutions cron isolées utilisent les métadonnées structurées de refus d’exécution issues de l’exécution embarquée, y compris les enveloppes `UNAVAILABLE` de node-host dont le message d’erreur imbriqué commence par `SYSTEM_RUN_DENIED` ou `INVALID_REQUEST`, afin qu’une commande bloquée ne soit pas signalée comme une exécution réussie tandis qu’une prose ordinaire de l’assistant n’est pas traitée comme un refus.
- Les exécutions cron isolées traitent aussi les échecs d’agent au niveau de l’exécution comme des erreurs de tâche même lorsqu’aucune charge utile de réponse n’est produite, afin que les échecs de modèle/fournisseur incrémentent les compteurs d’erreurs et déclenchent les notifications d’échec au lieu de marquer la tâche comme réussie.
- Lorsqu’une tâche isolée de tour d’agent atteint `timeoutSeconds`, cron abandonne l’exécution d’agent sous-jacente et lui accorde une courte fenêtre de nettoyage. Si l’exécution ne se vide pas, le nettoyage détenu par le Gateway force la libération de la propriété de session de cette exécution avant que cron enregistre le dépassement de délai, afin que le travail de chat en file d’attente ne reste pas bloqué derrière une session de traitement obsolète.
- Si un tour d’agent isolé se bloque avant le démarrage du runner ou avant le premier appel au modèle, cron enregistre un dépassement de délai propre à la phase, comme `setup timed out before runner start` ou `stalled before first model call (last phase: context-engine)`. Ces watchdogs couvrent les fournisseurs embarqués et les fournisseurs adossés à la CLI avant que leur processus CLI externe ne soit réellement démarré, et sont plafonnés indépendamment des valeurs `timeoutSeconds` longues afin que les échecs de démarrage à froid/d’authentification/de contexte apparaissent rapidement au lieu d’attendre tout le budget de la tâche.
- Si vous utilisez le cron système ou un autre planificateur externe pour exécuter `openclaw agent`, enveloppez-le avec une escalade de terminaison forcée même si la CLI gère `SIGTERM`/`SIGINT`. Les exécutions adossées au Gateway demandent au Gateway d’abandonner les exécutions acceptées ; les exécutions locales et les exécutions de repli embarquées reçoivent le même signal d’abandon. Pour GNU `timeout`, préférez `timeout -k 60 600 openclaw agent ...` à un simple `timeout 600 ...` ; la valeur `-k` est le filet de sécurité du superviseur si le processus ne peut pas se vider. Pour les unités systemd, conservez la même forme en utilisant un signal d’arrêt `SIGTERM` plus une fenêtre de grâce telle que `TimeoutStopSec` avant toute terminaison finale. Si une nouvelle tentative réutilise un `--run-id` alors que l’exécution Gateway d’origine est toujours active, le doublon est signalé comme en cours au lieu de démarrer une seconde exécution.

<a id="maintenance"></a>

<Note>
La réconciliation des tâches pour cron appartient d’abord à l’exécution, puis à l’historique durable : une tâche cron active reste vivante tant que l’exécution cron suit encore cette tâche comme en cours, même si une ancienne ligne de session enfant existe toujours. Une fois que l’exécution cesse de posséder la tâche et que la fenêtre de grâce de 5 minutes expire, la maintenance vérifie les journaux d’exécution persistés et l’état de la tâche pour l’exécution `cron:<jobId>:<startedAt>` correspondante. Si cet historique durable montre un résultat terminal, le registre des tâches est finalisé à partir de celui-ci ; sinon, la maintenance détenue par le Gateway peut marquer la tâche comme `lost`. L’audit CLI hors ligne peut récupérer à partir de l’historique durable, mais il ne considère pas son propre ensemble vide de tâches actives en cours de processus comme la preuve qu’une exécution cron détenue par le Gateway a disparu.
</Note>

## Types de planification

| Type    | Option CLI | Description                                                   |
| ------- | ---------- | ------------------------------------------------------------- |
| `at`    | `--at`     | Horodatage ponctuel (ISO 8601 ou relatif comme `20m`)         |
| `every` | `--every`  | Intervalle fixe                                               |
| `cron`  | `--cron`   | Expression cron à 5 ou 6 champs avec `--tz` optionnel         |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification en heure locale.

Les expressions récurrentes en début d’heure sont automatiquement décalées jusqu’à 5 minutes afin de réduire les pics de charge. Utilisez `--exact` pour forcer un timing précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions Cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine sont tous deux non génériques, croner correspond lorsque **l’un ou l’autre** champ correspond, et non les deux. Il s’agit du comportement standard de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur de jour de la semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un champ et vérifiez l’autre dans le prompt ou la commande de votre tâche.

## Styles d’exécution

| Style           | Valeur `--session` | S’exécute dans         | Idéal pour                                      |
| --------------- | ------------------ | ---------------------- | ---------------------------------------------- |
| Session main    | `main`             | Voie dédiée de réveil cron | Rappels, événements système                 |
| Isolé           | `isolated`         | `cron:<jobId>` dédiée  | Rapports, tâches de fond                       |
| Session actuelle | `current`         | Liée au moment de la création | Travail récurrent sensible au contexte |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Workflows qui s’appuient sur l’historique |

<AccordionGroup>
  <Accordion title="Session main vs isolée vs personnalisée">
    Les tâches de **session main** placent un événement système dans une voie d’exécution détenue par cron et réveillent éventuellement le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Elles peuvent utiliser le dernier contexte de livraison de la session main cible pour les réponses, mais elles n’ajoutent pas les tours cron de routine à la voie de chat humaine et ne prolongent pas la fraîcheur de réinitialisation quotidienne/idle pour la session cible. Les tâches **isolées** exécutent un tour d’agent dédié avec une session fraîche. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des workflows comme des points quotidiens qui s’appuient sur les résumés précédents.

    Les événements cron de session main sont des rappels d’événement système autonomes. Ils
    n’incluent pas automatiquement l’instruction "Read
    HEARTBEAT.md" du prompt Heartbeat par défaut. Si un rappel récurrent doit consulter
    `HEARTBEAT.md`, dites-le explicitement dans le texte de l’événement cron ou dans les
    instructions propres à l’agent.

  </Accordion>
  <Accordion title="Ce que signifie « session fraîche » pour les tâches isolées">
    Pour les tâches isolées, « session fraîche » signifie un nouvel identifiant de transcript/session pour chaque exécution. OpenClaw peut conserver des préférences sûres telles que les paramètres thinking/fast/verbose, les libellés et les remplacements explicites de modèle/auth sélectionnés par l’utilisateur, mais il n’hérite pas du contexte de conversation ambiant d’une ancienne ligne cron : routage canal/groupe, politique d’envoi ou de file d’attente, élévation, origine ou liaison d’exécution ACP. Utilisez `current` ou `session:<id>` lorsqu’une tâche récurrente doit délibérément s’appuyer sur le même contexte de conversation.
  </Accordion>
  <Accordion title="Nettoyage de l’exécution">
    Pour les tâches isolées, le démontage de l’exécution inclut désormais un nettoyage au mieux du navigateur pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat cron réel reste prioritaire.

    Les exécutions cron isolées disposent aussi toutes les instances d’exécution MCP groupées créées pour la tâche via le chemin de nettoyage d’exécution partagé. Cela correspond à la manière dont les clients MCP de session main et de session personnalisée sont démontés, afin que les tâches cron isolées ne laissent pas fuir de processus enfants stdio ni de connexions MCP de longue durée entre les exécutions.

  </Accordion>
  <Accordion title="Livraison sous-agent et Discord">
    Lorsque les exécutions cron isolées orchestrent des sous-agents, la livraison préfère aussi la sortie finale descendante au texte intermédiaire parent obsolète. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour parent partielle au lieu de l’annoncer.

    Pour les cibles d’annonce Discord en texte seul, OpenClaw envoie une seule fois le texte final canonique de l’assistant au lieu de rejouer à la fois les charges utiles de texte diffusées/intermédiaires et la réponse finale. Les médias et les charges utiles Discord structurées sont toujours livrés comme charges utiles séparées afin que les pièces jointes et les composants ne soient pas supprimés.

  </Accordion>
</AccordionGroup>

### Charges utiles de commande

Utilisez les charges utiles de commande pour les scripts déterministes qui doivent s’exécuter dans le planificateur Gateway sans démarrer un tour d’agent isolé adossé à un modèle. Les tâches de commande s’exécutent sur l’hôte Gateway, capturent stdout/stderr, enregistrent l’exécution dans l’historique cron et réutilisent les mêmes modes de livraison `announce`, `webhook` et `none` que les tâches isolées.

<Note>
Le cron de commande est une surface d’automatisation Gateway pour administrateur opérateur, pas un appel
`tools.exec` d’agent. La création, la mise à jour, la suppression ou l’exécution manuelle de tâches cron
nécessite `operator.admin` ; les exécutions de commande planifiées ultérieures s’exécutent dans le
processus Gateway comme cette automatisation rédigée par l’administrateur. La politique exec d’agent comme
`tools.exec.mode`, les demandes d’approbation et les listes d’autorisation d’outils par agent régissent
les outils exec visibles par le modèle, pas les charges utiles cron de commande.
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

`--command <shell>` stocke `argv: ["sh", "-lc", <shell>]`. Utilisez `--command-argv '["node","scripts/report.mjs"]'` lorsque vous voulez une exécution argv exacte sans analyse par le shell. Les champs optionnels `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` et `--output-max-bytes` contrôlent l’environnement du processus, stdin et les limites de sortie.

Si stdout n’est pas vide, ce texte est le résultat livré. Si stdout est vide et stderr n’est pas vide, stderr est livré. Si les deux flux sont présents, cron livre un petit bloc `stdout:` / `stderr:`. Un code de sortie zéro enregistre l’exécution comme `ok`; une sortie non nulle, un signal, un délai d’expiration ou un délai d’expiration sans sortie enregistre `error` et peut déclencher des alertes d’échec. Une commande qui imprime uniquement `NO_REPLY` utilise la suppression normale du jeton silencieux cron et ne renvoie rien dans le chat.

### Options de charge utile pour les tâches isolées

<ParamField path="--message" type="string" required>
  Texte du prompt (requis pour isolated).
</ParamField>
<ParamField path="--model" type="string">
  Remplacement du modèle; utilise le modèle autorisé sélectionné pour la tâche.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste de modèles de secours par tâche, par exemple `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passez `--fallbacks ""` pour une exécution stricte sans modèles de secours.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Sur `cron edit`, supprime le remplacement des modèles de secours par tâche afin que la tâche suive la priorité de secours configurée. Ne peut pas être combiné avec `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Sur `cron edit`, supprime le remplacement du modèle par tâche afin que la tâche suive la priorité normale de sélection du modèle cron (un remplacement stocké de session cron s’il est défini, sinon le modèle de l’agent/par défaut). Ne peut pas être combiné avec `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Remplacement du niveau de réflexion.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Sur `cron edit`, supprime le remplacement de réflexion par tâche afin que la tâche suive la priorité normale de réflexion cron. Ne peut pas être combiné avec `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignore l’injection des fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Restreint les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` utilise le modèle autorisé sélectionné comme modèle principal de cette tâche. Ce n’est pas la même chose qu’un remplacement `/model` de session de chat: les chaînes de secours configurées s’appliquent toujours lorsque le modèle principal de la tâche échoue. Si le modèle demandé n’est pas autorisé ou ne peut pas être résolu, cron fait échouer l’exécution avec une erreur de validation explicite au lieu de revenir silencieusement à la sélection de modèle de l’agent/par défaut de la tâche.

Les tâches Cron peuvent aussi porter des `fallbacks` au niveau de la charge utile. Lorsqu’elle est présente, cette liste remplace la chaîne de secours configurée pour la tâche. Utilisez `fallbacks: []` dans la charge utile/l’API de la tâche lorsque vous voulez une exécution cron stricte qui essaie uniquement le modèle sélectionné. Si une tâche a `--model` mais aucun modèle de secours dans la charge utile ni dans la configuration, OpenClaw transmet un remplacement de secours vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative supplémentaire masquée.

Les vérifications préalables du fournisseur local parcourent les modèles de secours configurés avant de marquer une exécution cron comme `skipped`; `fallbacks: []` garde ce chemin de vérification préalable strict.

La priorité de sélection du modèle pour les tâches isolées est:

1. Remplacement du modèle du hook Gmail (lorsque l’exécution vient de Gmail et que ce remplacement est autorisé)
2. `model` de la charge utile par tâche
3. Remplacement stocké du modèle de session cron sélectionné par l’utilisateur
4. Sélection du modèle de l’agent/par défaut

Le mode rapide suit aussi la sélection active résolue. Si la configuration du modèle sélectionné a `params.fastMode`, cron isolé l’utilise par défaut. Un remplacement `fastMode` de session stockée reste prioritaire sur la configuration dans les deux sens. Le mode auto utilise le seuil `params.fastAutoOnSeconds` du modèle sélectionné lorsqu’il est présent, avec une valeur par défaut de 60 secondes.

Si une exécution isolée rencontre un transfert de changement de modèle actif, cron réessaie avec le fournisseur/modèle changé et persiste cette sélection active pour l’exécution active avant de réessayer. Lorsque le changement porte aussi un nouveau profil d’authentification, cron persiste aussi ce remplacement de profil d’authentification pour l’exécution active. Les nouvelles tentatives sont bornées: après la tentative initiale plus 2 nouvelles tentatives de changement, cron abandonne au lieu de boucler indéfiniment.

Avant qu’une exécution cron isolée n’entre dans le lanceur d’agent, OpenClaw vérifie les points de terminaison de fournisseurs locaux joignables pour les fournisseurs `api: "ollama"` et `api: "openai-completions"` configurés dont `baseUrl` est local loopback, réseau privé ou `.local`. Si ce point de terminaison est indisponible, l’exécution est enregistrée comme `skipped` avec une erreur fournisseur/modèle claire au lieu de démarrer un appel de modèle. Le résultat du point de terminaison est mis en cache pendant 5 minutes, de sorte que de nombreuses tâches arrivées à échéance utilisant le même serveur local Ollama, vLLM, SGLang ou LM Studio indisponible partagent une petite sonde au lieu de créer une tempête de requêtes. Les exécutions ignorées par vérification préalable de fournisseur n’incrémentent pas le backoff d’erreur d’exécution; activez `failureAlert.includeSkipped` lorsque vous voulez des notifications répétées d’exécutions ignorées.

## Livraison et sortie

| Mode       | Ce qui se passe                                                    |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Livre le texte final à la cible en secours si l’agent ne l’a pas envoyé |
| `webhook`  | Envoie par POST la charge utile d’événement terminé à une URL      |
| `none`     | Aucune livraison de secours par le lanceur                         |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour une livraison de canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123`; OpenClaw accepte aussi le raccourci détenu par Telegram `-1001234567890:123`. Les appelants RPC/config directs peuvent passer `delivery.threadId` comme chaîne ou nombre. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`). Les ID de salons Matrix sont sensibles à la casse; utilisez l’ID exact du salon ou la forme `room:!room:server` de Matrix.

Lorsque la livraison announce utilise `channel: "last"` ou omet `channel`, une cible préfixée par fournisseur telle que `telegram:123` peut sélectionner le canal avant que cron ne revienne à l’historique de session ou à un seul canal configuré. Seuls les préfixes annoncés par le Plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe de cible doit nommer le même fournisseur; par exemple, `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté au lieu de laisser WhatsApp interpréter l’ID Telegram comme un numéro de téléphone. Les préfixes de type de cible et de service tels que `channel:<id>`, `user:<id>`, `imessage:<handle>` et `sms:<number>` restent une syntaxe de cible détenue par le canal, pas des sélecteurs de fournisseur.

Pour les tâches isolées, la livraison de chat est partagée. Si une route de chat est disponible, l’agent peut utiliser l’outil `message` même lorsque la tâche utilise `--no-deliver`. Si l’agent envoie vers la cible configurée/actuelle, OpenClaw ignore l’annonce de secours. Sinon, `announce`, `webhook` et `none` contrôlent uniquement ce que le lanceur fait de la réponse finale après le tour d’agent.

Lorsqu’un agent crée un rappel isolé depuis un chat actif, OpenClaw stocke la cible de livraison active préservée pour la route d’annonce de secours. Les clés de session internes peuvent être en minuscules; les cibles de livraison fournisseur ne sont pas reconstruites à partir de ces clés lorsque le contexte de chat actuel est disponible.

La livraison announce implicite utilise les listes d’autorisation de canaux configurées pour valider et rediriger les cibles obsolètes. Les approbations du magasin d’appariement DM ne sont pas des destinataires d’automatisation de secours; définissez `delivery.to` ou configurez l’entrée `allowFrom` du canal lorsqu’une tâche planifiée doit envoyer proactivement vers un DM.

## Langue de sortie

Les tâches Cron n’infèrent pas une langue de réponse depuis le canal, la locale ou les messages précédents. Mettez la règle de langue dans le message ou modèle planifié:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Pour les fichiers de modèle, gardez l’instruction de langue dans le prompt rendu et vérifiez que les placeholders tels que `{{language}}` sont remplis avant l’exécution de la tâche. Si la sortie mélange les langues, rendez la règle explicite, par exemple: « Utilisez le chinois pour le texte narratif et gardez les termes techniques en anglais. »

Les notifications d’échec suivent un chemin de destination séparé:

- `cron.failureDestination` définit une valeur globale par défaut pour les notifications d’échec.
- `job.delivery.failureDestination` remplace cela par tâche.
- Si aucun des deux n’est défini et que la tâche livre déjà via `announce`, les notifications d’échec reviennent maintenant à cette cible announce principale.
- `delivery.failureDestination` n’est pris en charge que sur les tâches `sessionTarget="isolated"`, sauf si le mode de livraison principal est `webhook`.
- `failureAlert.includeSkipped: true` inscrit une tâche ou une politique globale d’alerte cron aux alertes répétées d’exécutions ignorées. Les exécutions ignorées conservent un compteur consécutif d’ignorés séparé, elles n’affectent donc pas le backoff des erreurs d’exécution.

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

Gateway peut exposer des points de terminaison Webhook HTTP pour les déclencheurs externes. Activez-les dans la configuration:

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

Chaque requête doit inclure le jeton du hook via un en-tête:

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Mettre en file un événement système pour la session principale:

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
    Exécuter un tour d’agent isolé:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Champs: `message` (requis), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Les noms de hooks personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappages peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` avec des modèles ou des transformations de code.
  </Accordion>
</AccordionGroup>

<Warning>
Gardez les points de terminaison de hook derrière local loopback, tailnet ou un proxy inverse de confiance.

- Utilisez un jeton de point d'accroche dédié ; ne réutilisez pas les jetons d'authentification du Gateway.
- Gardez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter l'agent effectif qu'un point d'accroche peut cibler, y compris l'agent par défaut lorsque `agentId` est omis.
- Gardez `hooks.allowRequestSessionKey=false` sauf si vous avez besoin de sessions sélectionnées par l'appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clés de session autorisées.
- Les charges utiles de point d'accroche sont enveloppées par défaut dans des limites de sécurité.

</Warning>

## Intégration Gmail PubSub

Reliez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis :** CLI `gcloud`, `gog` (gogcli), points d'accroche OpenClaw activés, Tailscale pour le point de terminaison HTTPS public.
</Note>

### Configuration par assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise Tailscale Funnel pour le point de terminaison push.

### Démarrage automatique du Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, le Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour vous en désinscrire.

### Configuration manuelle unique

<Steps>
  <Step title="Sélectionner le projet GCP">
    Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog` :

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Créer un sujet et accorder l'accès push Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Démarrer la surveillance">
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

## Gérer les tâches

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

`openclaw cron run <jobId>` retourne après la mise en file d'attente de l'exécution manuelle. Utilisez `--wait` pour les points d'accroche d'arrêt, les scripts de maintenance ou toute autre automatisation qui doit bloquer jusqu'à la fin de l'exécution en file d'attente. Le mode d'attente interroge le `runId` exact retourné ; il se termine avec `0` pour l'état `ok` et avec une valeur non nulle pour `error`, `skipped` ou un délai d'attente dépassé.

L'outil `cron` de l'agent renvoie des résumés compacts de tâches (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) depuis `cron(action: "list")` ; utilisez `cron(action: "get", jobId: "...")` pour obtenir la définition complète d'une tâche. Les appelants directs du Gateway peuvent passer `compact: true` à `cron.list` ; l'omettre préserve la réponse complète existante avec les aperçus de livraison.

`openclaw cron create` est un alias de `openclaw cron add`, et les nouvelles tâches peuvent utiliser une planification positionnelle (`"0 9 * * 1"`, `"every 1h"`, `"20m"` ou un horodatage ISO) suivie d'une invite d'agent positionnelle. Utilisez `--webhook <url>` sur `cron add|create` ou `cron edit` pour envoyer par POST la charge utile de l'exécution terminée à un point de terminaison HTTP. La livraison Webhook ne peut pas être combinée avec des indicateurs de livraison de discussion tels que `--announce`, `--channel`, `--to`, `--thread-id` ou `--account`. Sur `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` et `--clear-account` annulent individuellement ces champs de routage (chacun étant rejeté avec son indicateur de définition correspondant), ce qui est distinct de `--no-deliver`, qui désactive la livraison de repli du runner.

<Note>
Remarque sur le remplacement de modèle :

- `openclaw cron add|edit --model ...` change le modèle sélectionné pour la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact atteint l'exécution d'agent isolée.
- S'il n'est pas autorisé ou ne peut pas être résolu, cron fait échouer l'exécution avec une erreur de validation explicite.
- Les correctifs de charge utile de l'API `cron.update` peuvent définir `model: null` pour effacer un remplacement de modèle stocké pour une tâche.
- `openclaw cron edit <job-id> --clear-model` efface ce remplacement depuis la CLI (même effet que le correctif `model: null`) et ne peut pas être combiné avec `--model`.
- Les chaînes de repli configurées s'appliquent toujours, car `--model` de cron est un modèle principal de tâche, et non un remplacement `/model` de session.
- `openclaw cron add|edit --fallbacks ...` définit la charge utile `fallbacks`, en remplaçant les replis configurés pour cette tâche ; `--fallbacks ""` désactive le repli et rend l'exécution stricte. `openclaw cron edit <job-id> --clear-fallbacks` efface le remplacement par tâche.
- Un simple `--model` sans liste de replis explicite ou configurée ne retombe pas sur le modèle principal de l'agent comme cible de nouvelle tentative supplémentaire silencieuse.

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

`maxConcurrentRuns` limite à la fois le dispatch Cron planifié et l'exécution de tours d'agent isolés, et vaut 8 par défaut. Les tours d'agent Cron isolés utilisent en interne la voie d'exécution dédiée `cron-nested` de la file d'attente ; augmenter cette valeur permet donc à des exécutions LLM Cron indépendantes de progresser en parallèle au lieu de ne démarrer que leurs enveloppes Cron externes. La voie partagée non Cron `nested` n'est pas élargie par ce réglage.

`cron.store` est une clé de magasin logique et un chemin d'import hérité pour doctor. Exécutez `openclaw doctor --fix` pour importer les magasins JSON existants dans SQLite et les archiver ; les futurs changements Cron doivent passer par la CLI ou l'API Gateway.

Désactiver Cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportement des nouvelles tentatives">
    **Nouvelle tentative ponctuelle** : les erreurs transitoires (limite de débit, surcharge, réseau, erreur serveur) sont retentées jusqu'à 3 fois avec un backoff exponentiel. Les erreurs permanentes désactivent immédiatement la tâche.

    **Nouvelle tentative récurrente** : backoff exponentiel (30 s à 60 min) entre les tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (`24h` par défaut) élague les entrées de session d'exécution isolée. `cron.runLog.keepLines` limite les lignes d'historique d'exécution SQLite conservées par tâche ; `maxBytes` est conservé pour la compatibilité de configuration avec les anciens journaux d'exécution basés sur des fichiers.
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
  <Accordion title="Cron ne se déclenche pas">
    - Vérifiez `cron.enabled` et la variable d'environnement `OPENCLAW_SKIP_CRON`.
    - Confirmez que le Gateway fonctionne en continu.
    - Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l'hôte.
    - `reason: not-due` dans la sortie d'exécution signifie que l'exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n'était pas encore due.

  </Accordion>
  <Accordion title="Cron s'est déclenché, mais aucune livraison">
    - Le mode de livraison `none` signifie qu'aucun envoi de repli du runner n'est attendu. L'agent peut toujours envoyer directement avec l'outil `message` lorsqu'une route de discussion est disponible.
    - Une cible de livraison manquante/invalide (`channel`/`to`) signifie que l'envoi sortant a été ignoré.
    - Pour Matrix, les tâches copiées ou héritées avec des ID de salon `delivery.to` en minuscules peuvent échouer, car les ID de salon Matrix sont sensibles à la casse. Modifiez la tâche avec la valeur exacte `!room:server` ou `room:!room:server` provenant de Matrix.
    - Les erreurs d'authentification de canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
    - Si l'exécution isolée ne renvoie que le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe et supprime aussi le chemin de résumé de repli mis en file d'attente ; rien n'est donc publié dans la discussion.
    - Si l'agent doit envoyer lui-même un message à l'utilisateur, vérifiez que la tâche dispose d'une route utilisable (`channel: "last"` avec une discussion précédente, ou un canal/une cible explicite).

  </Accordion>
  <Accordion title="Cron ou Heartbeat semble empêcher le basculement de style /new">
    - La fraîcheur des réinitialisations quotidiennes et d'inactivité n'est pas basée sur `updatedAt` ; consultez [Gestion des sessions](/fr/concepts/session#session-lifecycle).
    - Les réveils Cron, les exécutions Heartbeat, les notifications exec et la comptabilité du Gateway peuvent mettre à jour la ligne de session pour le routage/l'état, mais ils ne prolongent pas `sessionStartedAt` ni `lastInteractionAt`.
    - Pour les lignes héritées créées avant l'existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` depuis l'en-tête de session JSONL de la transcription lorsque le fichier est encore disponible. Les lignes d'inactivité héritées sans `lastInteractionAt` utilisent cette heure de début récupérée comme base d'inactivité.

  </Accordion>
  <Accordion title="Pièges liés aux fuseaux horaires">
    - Cron sans `--tz` utilise le fuseau horaire de l'hôte du Gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme UTC.
    - `activeHours` de Heartbeat utilise la résolution de fuseau horaire configurée.

  </Accordion>
</AccordionGroup>

## Connexe

- [Automatisation](/fr/automation) — tous les mécanismes d'automatisation en un coup d'œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions Cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

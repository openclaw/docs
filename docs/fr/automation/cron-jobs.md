---
read_when:
    - Planification des tâches en arrière-plan ou des réveils
    - Connecter des déclencheurs externes (webhooks, Gmail) à OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-05-07T13:13:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron est le planificateur intégré du Gateway. Il conserve les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de discussion ou un point de terminaison Webhook.

## Démarrage rapide

<Steps>
  <Step title="Ajouter un rappel ponctuel">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Vérifier vos tâches">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Voir l’historique d’exécution">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Fonctionnement de cron

- Cron s’exécute **dans le processus Gateway** (pas dans le modèle).
- Les définitions de tâches sont conservées dans `~/.openclaw/cron/jobs.json`, de sorte que les redémarrages ne font pas perdre les planifications.
- L’état d’exécution runtime est conservé à côté, dans `~/.openclaw/cron/jobs-state.json`. Si vous suivez les définitions cron dans git, suivez `jobs.json` et ajoutez `jobs-state.json` au gitignore.
- Après la séparation, les anciennes versions d’OpenClaw peuvent lire `jobs.json`, mais peuvent traiter les tâches comme nouvelles, car les champs runtime résident désormais dans `jobs-state.json`.
- Lorsque `jobs.json` est modifié alors que le Gateway est en cours d’exécution ou arrêté, OpenClaw compare les champs de planification modifiés avec les métadonnées de créneau runtime en attente et efface les valeurs `nextRunAtMs` obsolètes. Les réécritures qui ne changent que la mise en forme ou l’ordre des clés conservent le créneau en attente.
- Toutes les exécutions cron créent des enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
- Au démarrage du Gateway, les tâches isolées de tour d’agent en retard sont replanifiées hors de la fenêtre de connexion au canal au lieu d’être rejouées immédiatement, afin que le démarrage de Discord/Telegram et la configuration des commandes natives restent réactifs après les redémarrages.
- Les tâches ponctuelles (`--at`) sont supprimées automatiquement après réussite par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l’exécution se termine, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées qui reçoivent l’autorisation étroite d’autonettoyage cron peuvent toujours lire l’état du planificateur et une liste autofiltrée de leur tâche actuelle, afin que les vérifications d’état/Heartbeat puissent inspecter leur propre planification sans obtenir un accès plus large aux mutations cron.
- Les exécutions cron isolées se protègent aussi contre les réponses d’accusé de réception obsolètes. Si le premier résultat n’est qu’une mise à jour de statut intermédiaire (`on it`, `pulling everything together` et indices similaires) et qu’aucune exécution de sous-agent descendante n’est encore responsable de la réponse finale, OpenClaw relance une fois la demande pour obtenir le résultat réel avant livraison.
- Les exécutions cron isolées privilégient les métadonnées structurées de refus d’exécution issues de l’exécution intégrée, puis se rabattent sur les marqueurs connus de résumé/sortie finale tels que `SYSTEM_RUN_DENIED` et `INVALID_REQUEST`, afin qu’une commande bloquée ne soit pas signalée comme une exécution réussie.
- Les exécutions cron isolées traitent aussi les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite, afin que les échecs de modèle/fournisseur incrémentent les compteurs d’erreurs et déclenchent les notifications d’échec au lieu de valider la tâche comme réussie.
- Lorsqu’une tâche isolée de tour d’agent atteint `timeoutSeconds`, cron annule l’exécution d’agent sous-jacente et lui accorde une courte fenêtre de nettoyage. Si l’exécution ne se vide pas, le nettoyage contrôlé par le Gateway force l’effacement de la propriété de session de cette exécution avant que cron n’enregistre l’expiration du délai, afin que le travail de discussion en file d’attente ne reste pas bloqué derrière une session de traitement obsolète.

<a id="maintenance"></a>

<Note>
La réconciliation des tâches pour cron appartient d’abord au runtime, puis s’appuie sur l’historique durable : une tâche cron active reste vivante tant que le runtime cron suit encore cette tâche comme en cours d’exécution, même si une ancienne ligne de session enfant existe encore. Une fois que le runtime ne possède plus la tâche et que la fenêtre de grâce de 5 minutes expire, la maintenance vérifie les journaux d’exécution persistés et l’état de la tâche pour l’exécution `cron:<jobId>:<startedAt>` correspondante. Si cet historique durable montre un résultat terminal, le registre des tâches est finalisé à partir de celui-ci ; sinon, la maintenance contrôlée par le Gateway peut marquer la tâche comme `lost`. L’audit CLI hors ligne peut récupérer à partir de l’historique durable, mais il ne traite pas son propre ensemble vide de tâches actives en processus comme preuve qu’une exécution cron contrôlée par le Gateway a disparu.
</Note>

## Types de planification

| Type    | Option CLI | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Horodatage ponctuel (ISO 8601 ou relatif comme `20m`)   |
| `every` | `--every` | Intervalle fixe                                         |
| `cron`  | `--cron`  | Expression cron à 5 ou 6 champs avec `--tz` facultatif  |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification selon l’heure locale.

Les expressions récurrentes en début d’heure sont automatiquement étalées jusqu’à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour forcer une synchronisation précise ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OU

Les expressions Cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine sont tous deux non génériques, croner correspond lorsque **l’un ou l’autre** champ correspond, pas les deux. C’est le comportement standard de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OU par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur de jour de la semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un champ et vérifiez l’autre dans le prompt ou la commande de votre tâche.

## Styles d’exécution

| Style            | Valeur `--session` | S’exécute dans          | Idéal pour                              |
| ---------------- | ------------------ | ----------------------- | --------------------------------------- |
| Session main     | `main`             | Prochain tour Heartbeat | Rappels, événements système             |
| Isolé            | `isolated`         | `cron:<jobId>` dédié    | Rapports, tâches de fond                |
| Session actuelle | `current`          | Lié à la création       | Travail récurrent sensible au contexte |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Workflows qui s’appuient sur l’historique |

<AccordionGroup>
  <Accordion title="Session main, isolée ou personnalisée">
    Les tâches de **session main** mettent en file un événement système et réveillent éventuellement le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Ces événements système ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactive pour la session cible. Les tâches **isolées** exécutent un tour d’agent dédié avec une session fraîche. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des workflows comme des standups quotidiens qui s’appuient sur les résumés précédents.
  </Accordion>
  <Accordion title="Ce que signifie « session fraîche » pour les tâches isolées">
    Pour les tâches isolées, « session fraîche » signifie un nouvel identifiant de transcription/session pour chaque exécution. OpenClaw peut transporter des préférences sûres comme les paramètres de réflexion/rapide/verbeux, les étiquettes et les remplacements explicites de modèle/auth sélectionnés par l’utilisateur, mais il n’hérite pas du contexte ambiant de conversation d’une ancienne ligne cron : routage canal/groupe, politique d’envoi ou de file d’attente, élévation, origine ou liaison runtime ACP. Utilisez `current` ou `session:<id>` lorsqu’une tâche récurrente doit délibérément s’appuyer sur le même contexte de conversation.
  </Accordion>
  <Accordion title="Nettoyage runtime">
    Pour les tâches isolées, le démontage runtime inclut désormais un nettoyage au mieux du navigateur pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat cron réel reste prioritaire.

    Les exécutions cron isolées éliminent aussi toutes les instances runtime MCP groupées créées pour la tâche via le chemin de nettoyage runtime partagé. Cela correspond à la manière dont les clients MCP des sessions main et personnalisées sont démontés, afin que les tâches cron isolées ne fuient pas de processus enfants stdio ni de connexions MCP persistantes entre les exécutions.

  </Accordion>
  <Accordion title="Livraison par sous-agent et Discord">
    Lorsque des exécutions cron isolées orchestrent des sous-agents, la livraison privilégie aussi la sortie finale descendante plutôt qu’un texte intermédiaire parent obsolète. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour parent partielle au lieu de l’annoncer.

    Pour les cibles d’annonce Discord en texte seul, OpenClaw envoie une seule fois le texte final canonique de l’assistant au lieu de rejouer à la fois les charges utiles textuelles diffusées/intermédiaires et la réponse finale. Les médias et les charges utiles Discord structurées sont toujours livrés comme charges utiles distinctes afin que les pièces jointes et les composants ne soient pas supprimés.

  </Accordion>
</AccordionGroup>

### Options de charge utile pour les tâches isolées

<ParamField path="--message" type="string" required>
  Texte du prompt (requis pour isolé).
</ParamField>
<ParamField path="--model" type="string">
  Remplacement du modèle ; utilise le modèle autorisé sélectionné pour la tâche.
</ParamField>
<ParamField path="--thinking" type="string">
  Remplacement du niveau de réflexion.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignore l’injection des fichiers d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Restreint les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` utilise le modèle autorisé sélectionné comme modèle principal de cette tâche. Ce n’est pas la même chose qu’un remplacement `/model` de session de discussion : les chaînes de fallback configurées s’appliquent toujours lorsque le modèle principal de la tâche échoue. Si le modèle demandé n’est pas autorisé ou ne peut pas être résolu, cron échoue l’exécution avec une erreur de validation explicite au lieu de revenir silencieusement à la sélection de modèle de l’agent/par défaut de la tâche.

Les tâches Cron peuvent aussi porter des `fallbacks` au niveau de la charge utile. Lorsqu’elle est présente, cette liste remplace la chaîne de fallback configurée pour la tâche. Utilisez `fallbacks: []` dans la charge utile/API de la tâche lorsque vous voulez une exécution cron stricte qui essaie uniquement le modèle sélectionné. Si une tâche a `--model` mais aucun fallback de charge utile ni configuré, OpenClaw transmet un remplacement de fallback vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative supplémentaire cachée.

La précédence de sélection du modèle pour les tâches isolées est :

1. Remplacement de modèle du hook Gmail (lorsque l’exécution provient de Gmail et que ce remplacement est autorisé)
2. `model` de charge utile par tâche
3. Remplacement de modèle stocké pour la session cron sélectionné par l’utilisateur
4. Sélection de modèle agent/par défaut

Le mode rapide suit aussi la sélection live résolue. Si la configuration du modèle sélectionné a `params.fastMode`, cron isolé l’utilise par défaut. Un remplacement `fastMode` de session stocké reste prioritaire sur la configuration dans les deux sens.

Si une exécution isolée rencontre un transfert live de changement de modèle, cron réessaie avec le fournisseur/modèle remplacé et conserve cette sélection live pour l’exécution active avant de réessayer. Lorsque le changement transporte aussi un nouveau profil d’authentification, cron conserve également ce remplacement de profil d’authentification pour l’exécution active. Les nouvelles tentatives sont bornées : après la tentative initiale plus 2 nouvelles tentatives de changement, cron abandonne au lieu de boucler indéfiniment.

Avant qu’une exécution cron isolée entre dans le lanceur d’agent, OpenClaw vérifie les points de terminaison de fournisseurs locaux joignables pour les fournisseurs configurés `api: "ollama"` et `api: "openai-completions"` dont le `baseUrl` est local loopback, réseau privé ou `.local`. Si ce point de terminaison est indisponible, l’exécution est enregistrée comme `skipped` avec une erreur claire de fournisseur/modèle au lieu de démarrer un appel de modèle. Le résultat du point de terminaison est mis en cache pendant 5 minutes, afin que de nombreuses tâches arrivées à échéance utilisant le même serveur local Ollama, vLLM, SGLang ou LM Studio indisponible partagent une petite sonde au lieu de créer une tempête de requêtes. Les exécutions ignorées par la pré-vérification du fournisseur n’incrémentent pas le repli d’erreur d’exécution ; activez `failureAlert.includeSkipped` lorsque vous voulez des notifications répétées d’ignorance.

## Livraison et sortie

| Mode       | Ce qui se passe                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Livre le texte final par fallback à la cible si l’agent ne l’a pas envoyé |
| `webhook`  | Envoie par POST la charge utile d’événement terminé à une URL       |
| `none`     | Aucune livraison fallback par le lanceur                            |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour la livraison au canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123`; les appelants RPC/config directs peuvent aussi transmettre `delivery.threadId` sous forme de chaîne ou de nombre. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`). Les ID de salons Matrix sont sensibles à la casse; utilisez l’ID exact du salon ou la forme `room:!room:server` de Matrix.

Quand la livraison d’annonce utilise `channel: "last"` ou omet `channel`, une cible préfixée par le fournisseur comme `telegram:123` peut sélectionner le canal avant que cron ne se rabatte sur l’historique de session ou sur un seul canal configuré. Seuls les préfixes annoncés par le plugin chargé sont des sélecteurs de fournisseur. Si `delivery.channel` est explicite, le préfixe de cible doit nommer le même fournisseur; par exemple, `channel: "whatsapp"` avec `to: "telegram:123"` est rejeté au lieu de laisser WhatsApp interpréter l’ID Telegram comme un numéro de téléphone. Les préfixes de type de cible et de service comme `channel:<id>`, `user:<id>`, `imessage:<handle>` et `sms:<number>` restent une syntaxe de cible propre au canal, pas des sélecteurs de fournisseur.

Pour les tâches isolées, la livraison au chat est partagée. Si une route de chat est disponible, l’agent peut utiliser l’outil `message` même lorsque la tâche utilise `--no-deliver`. Si l’agent envoie vers la cible configurée/actuelle, OpenClaw ignore l’annonce de secours. Sinon, `announce`, `webhook` et `none` ne contrôlent que ce que le runner fait de la réponse finale après le tour de l’agent.

Quand un agent crée un rappel isolé depuis un chat actif, OpenClaw stocke la cible de livraison en direct préservée pour la route d’annonce de secours. Les clés de session internes peuvent être en minuscules; les cibles de livraison fournisseur ne sont pas reconstruites à partir de ces clés quand le contexte de chat actuel est disponible.

La livraison d’annonce implicite utilise les listes d’autorisation de canaux configurées pour valider et rediriger les cibles obsolètes. Les approbations du magasin d’association DM ne sont pas des destinataires d’automatisation de secours; définissez `delivery.to` ou configurez l’entrée `allowFrom` du canal quand une tâche planifiée doit envoyer proactivement à un DM.

Les notifications d’échec suivent un chemin de destination distinct:

- `cron.failureDestination` définit une valeur globale par défaut pour les notifications d’échec.
- `job.delivery.failureDestination` la remplace par tâche.
- Si aucun des deux n’est défini et que la tâche livre déjà via `announce`, les notifications d’échec se rabattent désormais sur cette cible d’annonce principale.
- `delivery.failureDestination` n’est pris en charge que sur les tâches `sessionTarget="isolated"`, sauf si le mode de livraison principal est `webhook`.
- `failureAlert.includeSkipped: true` inscrit une tâche ou une politique d’alerte cron globale aux alertes répétées d’exécutions ignorées. Les exécutions ignorées conservent un compteur de sauts consécutifs distinct, elles n’affectent donc pas le backoff des erreurs d’exécution.

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
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
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

Chaque requête doit inclure le jeton du hook via l’en-tête:

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Mettre en file d’attente un événement système pour la session principale:

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

    Champs: `message` (obligatoire), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Les noms de hooks personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappages peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` avec des modèles ou des transformations de code.
  </Accordion>
</AccordionGroup>

<Warning>
Gardez les points de terminaison des hooks derrière loopback, un tailnet ou un proxy inverse de confiance.

- Utilisez un jeton de hook dédié; ne réutilisez pas les jetons d’authentification du Gateway.
- Gardez `hooks.path` sur un sous-chemin dédié; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter le routage explicite par `agentId`.
- Gardez `hooks.allowRequestSessionKey=false`, sauf si vous avez besoin de sessions sélectionnées par l’appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clés de session autorisées.
- Les charges utiles des hooks sont enveloppées par défaut avec des limites de sécurité.

</Warning>

## Intégration Gmail PubSub

Connectez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis:** CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour le point de terminaison HTTPS public.
</Note>

### Configuration avec assistant (recommandé)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise Tailscale Funnel pour le point de terminaison push.

### Démarrage automatique du Gateway

Quand `hooks.enabled=true` et que `hooks.gmail.account` est défini, le Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour vous désinscrire.

### Configuration manuelle unique

<Steps>
  <Step title="Select the GCP project">
    Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog`:

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

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Note de remplacement du modèle:

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné de la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact atteint l’exécution d’agent isolé.
- S’il n’est pas autorisé ou ne peut pas être résolu, cron échoue l’exécution avec une erreur de validation explicite.
- Les chaînes de secours configurées s’appliquent toujours, car le `--model` de cron est un modèle principal de tâche, pas un remplacement de session `/model`.
- La charge utile `fallbacks` remplace les solutions de secours configurées pour cette tâche; `fallbacks: []` désactive le secours et rend l’exécution stricte.
- Un simple `--model` sans liste de secours explicite ou configurée ne se rabat pas sur le modèle principal de l’agent comme cible de nouvelle tentative supplémentaire silencieuse.

</Note>

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
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

`maxConcurrentRuns` limite à la fois la distribution cron planifiée et l’exécution des tours d’agent isolés. Les tours d’agent cron isolés utilisent en interne la file d’exécution dédiée `cron-nested`; augmenter cette valeur permet donc aux exécutions LLM cron indépendantes de progresser en parallèle au lieu de seulement démarrer leurs wrappers cron externes. La lane partagée non cron `nested` n’est pas élargie par ce réglage.

Le sidecar d’état d’exécution est dérivé de `cron.store`: un magasin `.json` comme `~/clawd/cron/jobs.json` utilise `~/clawd/cron/jobs-state.json`, tandis qu’un chemin de magasin sans suffixe `.json` ajoute `-state.json`.

Si vous modifiez `jobs.json` à la main, laissez `jobs-state.json` hors du contrôle de source. OpenClaw utilise ce sidecar pour les emplacements en attente, les marqueurs actifs, les métadonnées de dernière exécution et l’identité de planification qui indique au planificateur quand une tâche modifiée de l’extérieur a besoin d’un nouveau `nextRunAtMs`.

Désactiver cron: `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Nouvelle tentative unique**: les erreurs transitoires (limite de débit, surcharge, réseau, erreur serveur) réessaient jusqu’à 3 fois avec backoff exponentiel. Les erreurs permanentes désactivent immédiatement.

    **Nouvelle tentative récurrente**: backoff exponentiel (30 s à 60 min) entre les nouvelles tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (`24h` par défaut) purge les entrées de sessions d’exécution isolées. `cron.runLog.maxBytes` / `cron.runLog.keepLines` purgent automatiquement les fichiers de journaux d’exécution.
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
    - `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore arrivée à échéance.

  </Accordion>
  <Accordion title="Cron déclenché mais aucun envoi">
    - Le mode de livraison `none` signifie qu’aucun envoi de secours du runner n’est attendu. L’agent peut toujours envoyer directement avec l’outil `message` lorsqu’une route de discussion est disponible.
    - Une cible de livraison manquante/invalide (`channel`/`to`) signifie que l’envoi sortant a été ignoré.
    - Pour Matrix, les tâches copiées ou héritées avec des ID de salon `delivery.to` en minuscules peuvent échouer, car les ID de salon Matrix sont sensibles à la casse. Modifiez la tâche pour utiliser la valeur exacte `!room:server` ou `room:!room:server` provenant de Matrix.
    - Les erreurs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
    - Si l’exécution isolée renvoie uniquement le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe et supprime aussi le chemin de résumé de secours mis en file d’attente, donc rien n’est publié en retour dans la discussion.
    - Si l’agent doit envoyer lui-même un message à l’utilisateur, vérifiez que la tâche dispose d’une route utilisable (`channel: "last"` avec une discussion précédente, ou un canal/une cible explicite).

  </Accordion>
  <Accordion title="Cron ou Heartbeat semble empêcher le basculement /new-style">
    - La fraîcheur des réinitialisations quotidiennes et d’inactivité n’est pas basée sur `updatedAt` ; consultez [Gestion des sessions](/fr/concepts/session#session-lifecycle).
    - Les réveils Cron, les exécutions Heartbeat, les notifications exec et la tenue à jour du Gateway peuvent mettre à jour la ligne de session pour le routage/l’état, mais ils ne prolongent pas `sessionStartedAt` ni `lastInteractionAt`.
    - Pour les lignes héritées créées avant l’existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` depuis l’en-tête de session JSONL de la transcription lorsque le fichier est encore disponible. Les lignes d’inactivité héritées sans `lastInteractionAt` utilisent cette heure de début récupérée comme référence d’inactivité.

  </Accordion>
  <Accordion title="Pièges liés aux fuseaux horaires">
    - Cron sans `--tz` utilise le fuseau horaire de l’hôte Gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme UTC.
    - Les `activeHours` de Heartbeat utilisent la résolution du fuseau horaire configuré.

  </Accordion>
</AccordionGroup>

## Connexe

- [Automatisation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions Cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

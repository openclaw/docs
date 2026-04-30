---
read_when:
    - Planification des tâches en arrière-plan ou des réveils
    - Intégrer des déclencheurs externes (Webhooks, Gmail) à OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-04-30T07:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron est le planificateur intégré du Gateway. Il conserve les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de discussion ou un endpoint Webhook.

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
  <Step title="Voir l’historique des exécutions">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Fonctionnement de cron

- Cron s’exécute **dans le processus Gateway** (pas dans le modèle).
- Les définitions de tâches sont conservées dans `~/.openclaw/cron/jobs.json`, afin que les redémarrages ne perdent pas les planifications.
- L’état d’exécution runtime est conservé à côté, dans `~/.openclaw/cron/jobs-state.json`. Si vous suivez les définitions cron dans git, suivez `jobs.json` et ignorez `jobs-state.json` dans git.
- Après la séparation, les anciennes versions d’OpenClaw peuvent lire `jobs.json`, mais peuvent traiter les tâches comme nouvelles, car les champs runtime résident maintenant dans `jobs-state.json`.
- Lorsque `jobs.json` est modifié pendant que le Gateway est en cours d’exécution ou arrêté, OpenClaw compare les champs de planification modifiés avec les métadonnées de créneau runtime en attente et efface les valeurs `nextRunAtMs` obsolètes. Les réécritures qui ne changent que la mise en forme ou l’ordre des clés préservent le créneau en attente.
- Toutes les exécutions cron créent des enregistrements de [tâche d’arrière-plan](/fr/automation/tasks).
- Au démarrage du Gateway, les tâches isolées de tour d’agent en retard sont replanifiées en dehors de la fenêtre de connexion au canal au lieu d’être rejouées immédiatement, afin que le démarrage de Discord/Telegram et la configuration des commandes natives restent réactifs après les redémarrages.
- Les tâches ponctuelles (`--at`) sont supprimées automatiquement après succès par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l’exécution se termine, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées se protègent aussi contre les réponses d’accusé de réception obsolètes. Si le premier résultat est seulement une mise à jour d’état intermédiaire (`on it`, `pulling everything together` et indications similaires) et qu’aucune exécution de sous-agent descendante n’est encore responsable de la réponse finale, OpenClaw relance une fois la demande pour obtenir le résultat réel avant livraison.
- Les exécutions cron isolées privilégient les métadonnées structurées de refus d’exécution provenant de l’exécution intégrée, puis se rabattent sur des marqueurs connus de résumé/sortie finale tels que `SYSTEM_RUN_DENIED` et `INVALID_REQUEST`, afin qu’une commande bloquée ne soit pas signalée comme une exécution réussie.
- Les exécutions cron isolées traitent aussi les échecs d’agent au niveau de l’exécution comme des erreurs de tâche, même lorsqu’aucune charge utile de réponse n’est produite, afin que les échecs de modèle/fournisseur incrémentent les compteurs d’erreurs et déclenchent les notifications d’échec au lieu de marquer la tâche comme réussie.
- Lorsqu’une tâche isolée de tour d’agent atteint `timeoutSeconds`, cron interrompt l’exécution d’agent sous-jacente et lui donne une courte fenêtre de nettoyage. Si l’exécution ne se vide pas, le nettoyage détenu par le Gateway efface de force la propriété de session de cette exécution avant que cron n’enregistre le délai d’expiration, afin que le travail de discussion en file d’attente ne reste pas bloqué derrière une session de traitement obsolète.

<a id="maintenance"></a>

<Note>
La réconciliation des tâches pour cron appartient d’abord au runtime, puis s’appuie sur l’historique durable : une tâche cron active reste vivante tant que le runtime cron suit encore cette tâche comme en cours d’exécution, même si une ancienne ligne de session enfant existe encore. Une fois que le runtime cesse de posséder la tâche et que la fenêtre de grâce de 5 minutes expire, la maintenance vérifie les journaux d’exécution persistés et l’état de la tâche pour l’exécution `cron:<jobId>:<startedAt>` correspondante. Si cet historique durable montre un résultat terminal, le registre des tâches est finalisé à partir de celui-ci ; sinon, la maintenance détenue par le Gateway peut marquer la tâche comme `lost`. L’audit CLI hors ligne peut récupérer à partir de l’historique durable, mais il ne traite pas son propre ensemble vide de tâches actives en cours de processus comme preuve qu’une exécution cron détenue par le Gateway a disparu.
</Note>

## Types de planification

| Type    | Indicateur CLI | Description                                                       |
| ------- | -------------- | ----------------------------------------------------------------- |
| `at`    | `--at`         | Horodatage ponctuel (ISO 8601 ou relatif comme `20m`)             |
| `every` | `--every`      | Intervalle fixe                                                   |
| `cron`  | `--cron`       | Expression cron à 5 ou 6 champs avec `--tz` facultatif            |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification selon l’heure locale.

Les expressions récurrentes en début d’heure sont automatiquement échelonnées jusqu’à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour forcer un horaire précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine ne sont pas des jokers, croner correspond lorsque **l’un ou l’autre** champ correspond, pas les deux. C’est le comportement cron Vixie standard.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur de jour de la semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un champ et contrôlez l’autre dans le prompt ou la commande de votre tâche.

## Styles d’exécution

| Style             | Valeur de `--session` | S’exécute dans          | Idéal pour                                      |
| ----------------- | --------------------- | ----------------------- | ----------------------------------------------- |
| Session principale | `main`               | Prochain tour Heartbeat | Rappels, événements système                     |
| Isolé             | `isolated`            | `cron:<jobId>` dédié    | Rapports, tâches d’arrière-plan                 |
| Session courante  | `current`             | Liée au moment de création | Travail récurrent sensible au contexte       |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Workflows qui s’appuient sur l’historique   |

<AccordionGroup>
  <Accordion title="Session principale, isolée ou personnalisée">
    Les tâches de **session principale** mettent en file d’attente un événement système et réveillent éventuellement le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Ces événements système n’étendent pas la fraîcheur de réinitialisation quotidienne/inactive pour la session cible. Les tâches **isolées** exécutent un tour d’agent dédié avec une nouvelle session. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des workflows comme les points quotidiens qui s’appuient sur les résumés précédents.
  </Accordion>
  <Accordion title="Ce que signifie « nouvelle session » pour les tâches isolées">
    Pour les tâches isolées, « nouvelle session » signifie un nouvel identifiant de transcription/session à chaque exécution. OpenClaw peut transporter des préférences sûres comme les paramètres de réflexion/rapide/verbeux, les libellés et les remplacements explicites de modèle/auth sélectionnés par l’utilisateur, mais il n’hérite pas du contexte de conversation ambiant d’une ancienne ligne cron : routage de canal/groupe, stratégie d’envoi ou de mise en file d’attente, élévation, origine ou liaison runtime ACP. Utilisez `current` ou `session:<id>` lorsqu’une tâche récurrente doit délibérément s’appuyer sur le même contexte de conversation.
  </Accordion>
  <Accordion title="Nettoyage runtime">
    Pour les tâches isolées, le démontage runtime inclut désormais le nettoyage au mieux du navigateur pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat cron réel prévale toujours.

    Les exécutions cron isolées suppriment aussi toutes les instances runtime MCP groupées créées pour la tâche via le chemin de nettoyage runtime partagé. Cela correspond à la façon dont les clients MCP de session principale et de session personnalisée sont démontés, de sorte que les tâches cron isolées ne laissent pas fuir de processus enfants stdio ni de connexions MCP de longue durée entre les exécutions.

  </Accordion>
  <Accordion title="Livraison sous-agent et Discord">
    Lorsque les exécutions cron isolées orchestrent des sous-agents, la livraison privilégie aussi la sortie descendante finale plutôt que le texte intermédiaire parent obsolète. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour parent partielle au lieu de l’annoncer.

    Pour les cibles d’annonce Discord en texte seul, OpenClaw envoie une seule fois le texte final canonique de l’assistant au lieu de rejouer à la fois les charges utiles de texte diffusées/intermédiaires et la réponse finale. Les médias et les charges utiles Discord structurées sont toujours livrés comme charges utiles distinctes afin que les pièces jointes et les composants ne soient pas supprimés.

  </Accordion>
</AccordionGroup>

### Options de charge utile pour les tâches isolées

<ParamField path="--message" type="string" required>
  Texte du prompt (requis pour les tâches isolées).
</ParamField>
<ParamField path="--model" type="string">
  Remplacement de modèle ; utilise le modèle autorisé sélectionné pour la tâche.
</ParamField>
<ParamField path="--thinking" type="string">
  Remplacement du niveau de réflexion.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignorer l’injection du fichier d’amorçage de l’espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Restreindre les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` utilise le modèle autorisé sélectionné comme modèle principal de cette tâche. Ce n’est pas identique à un remplacement `/model` de session de discussion : les chaînes de repli configurées s’appliquent toujours lorsque le modèle principal de la tâche échoue. Si le modèle demandé n’est pas autorisé ou ne peut pas être résolu, cron fait échouer l’exécution avec une erreur de validation explicite au lieu de se rabattre silencieusement sur la sélection de modèle de l’agent/par défaut de la tâche.

Les tâches cron peuvent aussi porter des `fallbacks` au niveau de la charge utile. Lorsqu’elle est présente, cette liste remplace la chaîne de repli configurée pour la tâche. Utilisez `fallbacks: []` dans la charge utile/API de la tâche lorsque vous voulez une exécution cron stricte qui essaie uniquement le modèle sélectionné. Si une tâche a `--model` mais aucun repli de charge utile ni configuré, OpenClaw transmet un remplacement de repli vide explicite afin que le modèle principal de l’agent ne soit pas ajouté comme cible de nouvelle tentative cachée.

La priorité de sélection de modèle pour les tâches isolées est :

1. Remplacement de modèle du hook Gmail (lorsque l’exécution vient de Gmail et que ce remplacement est autorisé)
2. `model` de la charge utile par tâche
3. Remplacement de modèle de session cron stocké sélectionné par l’utilisateur
4. Sélection de modèle de l’agent/par défaut

Le mode rapide suit aussi la sélection active résolue. Si la configuration du modèle sélectionné contient `params.fastMode`, cron isolé l’utilise par défaut. Un remplacement `fastMode` de session stockée l’emporte toujours sur la configuration dans les deux sens.

Si une exécution isolée rencontre un transfert de changement de modèle en direct, cron réessaie avec le fournisseur/modèle basculé et conserve cette sélection en direct pour l’exécution active avant de réessayer. Lorsque le changement transporte aussi un nouveau profil d’authentification, cron conserve aussi ce remplacement de profil d’authentification pour l’exécution active. Les nouvelles tentatives sont limitées : après la tentative initiale plus 2 nouvelles tentatives de changement, cron abandonne au lieu de boucler indéfiniment.

Avant qu’une exécution cron isolée n’entre dans le runner d’agent, OpenClaw vérifie les endpoints de fournisseurs locaux accessibles pour les fournisseurs configurés avec `api: "ollama"` et `api: "openai-completions"` dont `baseUrl` est local loopback, réseau privé ou `.local`. Si cet endpoint est indisponible, l’exécution est enregistrée comme `skipped` avec une erreur fournisseur/modèle claire au lieu de démarrer un appel de modèle. Le résultat de l’endpoint est mis en cache pendant 5 minutes, de sorte que de nombreuses tâches arrivées à échéance utilisant le même serveur local Ollama, vLLM, SGLang ou LM Studio indisponible partagent une petite sonde au lieu de créer une tempête de requêtes. Les exécutions ignorées par pré-vérification fournisseur n’incrémentent pas le backoff d’erreur d’exécution ; activez `failureAlert.includeSkipped` lorsque vous voulez des notifications répétées d’ignorance.

## Livraison et sortie

| Mode       | Ce qui se passe                                                                    |
| ---------- | ----------------------------------------------------------------------------------- |
| `announce` | Livre le texte final à la cible en repli si l’agent ne l’a pas envoyé              |
| `webhook`  | Publie par POST la charge utile d’événement terminé vers une URL                   |
| `none`     | Aucune livraison de repli par le runner                                            |

Use `--announce --channel telegram --to "-1001234567890"` pour l’envoi vers un canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123` ; les appelants RPC/config directs peuvent aussi passer `delivery.threadId` sous forme de chaîne ou de nombre. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`). Les ID de salons Matrix sont sensibles à la casse ; utilisez l’ID exact du salon ou la forme `room:!room:server` fournie par Matrix.

Pour les tâches isolées, l’envoi de chat est partagé. Si une route de chat est disponible, l’agent peut utiliser l’outil `message` même lorsque la tâche utilise `--no-deliver`. Si l’agent envoie vers la cible configurée/actuelle, OpenClaw ignore l’annonce de secours. Sinon, `announce`, `webhook` et `none` contrôlent uniquement ce que le runner fait de la réponse finale après le tour de l’agent.

Lorsqu’un agent crée un rappel isolé depuis un chat actif, OpenClaw stocke la cible d’envoi live préservée pour la route d’annonce de secours. Les clés de session internes peuvent être en minuscules ; les cibles d’envoi des fournisseurs ne sont pas reconstruites à partir de ces clés lorsque le contexte de chat actuel est disponible.

Les notifications d’échec suivent un chemin de destination distinct :

- `cron.failureDestination` définit une valeur par défaut globale pour les notifications d’échec.
- `job.delivery.failureDestination` la remplace par tâche.
- Si aucun des deux n’est défini et que la tâche envoie déjà via `announce`, les notifications d’échec se rabattent désormais sur cette cible d’annonce principale.
- `delivery.failureDestination` est pris en charge uniquement sur les tâches `sessionTarget="isolated"`, sauf si le mode d’envoi principal est `webhook`.
- `failureAlert.includeSkipped: true` inscrit une tâche ou une politique d’alerte Cron globale aux alertes répétées d’exécutions ignorées. Les exécutions ignorées conservent un compteur consécutif distinct, elles n’affectent donc pas le backoff des erreurs d’exécution.

## Exemples CLI

<Tabs>
  <Tab title="Rappel ponctuel">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Tâche isolée récurrente">
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
  <Tab title="Remplacement du modèle et du raisonnement">
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

Chaque requête doit inclure le jeton du hook via un en-tête :

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ajoute un événement système à la file pour la session principale :

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
    Exécute un tour d’agent isolé :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Champs : `message` (obligatoire), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mappés (POST /hooks/<name>)">
    Les noms de hooks personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappings peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` avec des modèles ou des transformations de code.
  </Accordion>
</AccordionGroup>

<Warning>
Gardez les points de terminaison de hooks derrière local loopback, un tailnet ou un proxy inverse de confiance.

- Utilisez un jeton de hook dédié ; ne réutilisez pas les jetons d’authentification du Gateway.
- Gardez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter le routage explicite par `agentId`.
- Gardez `hooks.allowRequestSessionKey=false`, sauf si vous avez besoin de sessions sélectionnées par l’appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clés de session autorisées.
- Les charges utiles de hook sont enveloppées par défaut avec des limites de sécurité.

</Warning>

## Intégration Gmail PubSub

Connectez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis :** CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour le point de terminaison HTTPS public.
</Note>

### Configuration avec assistant (recommandé)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise Tailscale Funnel pour le point de terminaison push.

### Démarrage automatique du Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, le Gateway démarre `gog gmail watch serve` au lancement et renouvelle automatiquement la veille. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour vous désinscrire.

### Configuration manuelle ponctuelle

<Steps>
  <Step title="Sélectionner le projet GCP">
    Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog` :

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Créer le topic et accorder l’accès push Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Démarrer la veille">
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
Note sur le remplacement du modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné pour la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact atteint l’exécution de l’agent isolé.
- S’il n’est pas autorisé ou ne peut pas être résolu, Cron fait échouer l’exécution avec une erreur de validation explicite.
- Les chaînes de repli configurées s’appliquent toujours, car le `--model` de Cron est un modèle principal de tâche, pas un remplacement `/model` de session.
- La charge utile `fallbacks` remplace les replis configurés pour cette tâche ; `fallbacks: []` désactive le repli et rend l’exécution stricte.
- Un simple `--model` sans liste de replis explicite ou configurée ne bascule pas vers le modèle principal de l’agent comme cible de nouvelle tentative supplémentaire silencieuse.

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

`maxConcurrentRuns` limite à la fois la distribution Cron planifiée et l’exécution de tours d’agent isolés. Les tours d’agent Cron isolés utilisent en interne la voie d’exécution dédiée `cron-nested` de la file, donc augmenter cette valeur permet aux exécutions LLM Cron indépendantes de progresser en parallèle au lieu de ne démarrer que leurs enveloppes Cron externes. La voie partagée non Cron `nested` n’est pas élargie par ce paramètre.

Le sidecar d’état d’exécution est dérivé de `cron.store` : un store `.json` tel que `~/clawd/cron/jobs.json` utilise `~/clawd/cron/jobs-state.json`, tandis qu’un chemin de store sans suffixe `.json` ajoute `-state.json`.

Si vous modifiez `jobs.json` à la main, gardez `jobs-state.json` hors du contrôle de source. OpenClaw utilise ce sidecar pour les créneaux en attente, les marqueurs actifs, les métadonnées de dernière exécution et l’identité de planification qui indique au planificateur quand une tâche modifiée de l’extérieur a besoin d’un nouveau `nextRunAtMs`.

Désactiver Cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportement de nouvelle tentative">
    **Nouvelle tentative ponctuelle** : les erreurs transitoires (limite de débit, surcharge, réseau, erreur serveur) sont retentées jusqu’à 3 fois avec backoff exponentiel. Les erreurs permanentes désactivent immédiatement.

    **Nouvelle tentative récurrente** : backoff exponentiel (30 s à 60 min) entre les tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (par défaut `24h`) purge les entrées de session d’exécution isolée. `cron.runLog.maxBytes` / `cron.runLog.keepLines` purgent automatiquement les fichiers de journal d’exécution.
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
    - Vérifiez `cron.enabled` et la variable d’environnement `OPENCLAW_SKIP_CRON`.
    - Confirmez que le Gateway fonctionne en continu.
    - Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l’hôte.
    - `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore arrivée à échéance.

  </Accordion>
  <Accordion title="Cron s’est déclenché mais aucun envoi">
    - Le mode d’envoi `none` signifie qu’aucun envoi de secours par le runner n’est attendu. L’agent peut toujours envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
    - Une cible d’envoi manquante/invalide (`channel`/`to`) signifie que le sortant a été ignoré.
    - Pour Matrix, les tâches copiées ou héritées avec des ID de salon `delivery.to` en minuscules peuvent échouer, car les ID de salons Matrix sont sensibles à la casse. Modifiez la tâche pour utiliser la valeur exacte `!room:server` ou `room:!room:server` fournie par Matrix.
    - Les erreurs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que l’envoi a été bloqué par les identifiants.
    - Si l’exécution isolée renvoie uniquement le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime l’envoi sortant direct et supprime aussi le chemin de résumé en file de secours, donc rien n’est republié dans le chat.
    - Si l’agent doit envoyer lui-même un message à l’utilisateur, vérifiez que la tâche dispose d’une route utilisable (`channel: "last"` avec un chat précédent, ou un canal/une cible explicite).

  </Accordion>
  <Accordion title="Cron ou Heartbeat semble empêcher le basculement /new-style">
    - La fraîcheur de la réinitialisation quotidienne et en cas d’inactivité ne repose pas sur `updatedAt` ; consultez [Gestion des sessions](/fr/concepts/session#session-lifecycle).
    - Les réveils Cron, les exécutions Heartbeat, les notifications exec et la comptabilité du gateway peuvent mettre à jour la ligne de session pour le routage/le statut, mais ils ne prolongent pas `sessionStartedAt` ni `lastInteractionAt`.
    - Pour les lignes héritées créées avant l’existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` depuis l’en-tête de session JSONL du transcript lorsque le fichier est encore disponible. Les lignes héritées inactives sans `lastInteractionAt` utilisent cette heure de début récupérée comme référence d’inactivité.

  </Accordion>
  <Accordion title="Pièges liés aux fuseaux horaires">
    - Cron sans `--tz` utilise le fuseau horaire de l’hôte gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme UTC.
    - Les `activeHours` de Heartbeat utilisent la résolution de fuseau horaire configurée.

  </Accordion>
</AccordionGroup>

## Connexe

- [Automatisation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

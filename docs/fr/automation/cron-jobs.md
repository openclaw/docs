---
read_when:
    - Planification de tâches d’arrière-plan ou de réveils
    - Intégration de déclencheurs externes (webhooks, Gmail) dans OpenClaw
    - Choisir entre heartbeat et cron pour les tâches planifiées
summary: Tâches planifiées, webhooks et déclencheurs Gmail PubSub pour le planificateur de Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-04-12T06:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f42bcaeedd0595d025728d7f236a724a0ebc67b6813c57233f4d739b3088317f
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tâches planifiées (Cron)

Cron est le planificateur intégré de la Gateway. Il persiste les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de chat ou un point de terminaison webhook.

## Démarrage rapide

```bash
# Ajouter un rappel à exécution unique
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Vérifier vos tâches
openclaw cron list

# Voir l’historique d’exécution
openclaw cron runs --id <job-id>
```

## Fonctionnement de cron

- Cron s’exécute **dans le processus Gateway** (pas dans le modèle).
- Les tâches sont persistées dans `~/.openclaw/cron/jobs.json`, donc les redémarrages ne font pas perdre les planifications.
- Toutes les exécutions cron créent des enregistrements de [tâche d’arrière-plan](/fr/automation/tasks).
- Les tâches à exécution unique (`--at`) sont supprimées automatiquement après réussite par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l’exécution se termine, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées se protègent aussi contre les réponses d’accusé de réception obsolètes. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire (`on it`, `pulling everything together` et indices similaires) et qu’aucune exécution de sous-agent descendante n’est encore responsable de la réponse finale, OpenClaw relance une invite une fois pour obtenir le résultat réel avant la livraison.

<a id="maintenance"></a>

La réconciliation des tâches pour cron est gérée par le runtime : une tâche cron active reste vivante tant que le runtime cron suit encore cette tâche comme étant en cours d’exécution, même si une ancienne ligne de session enfant existe encore.
Une fois que le runtime ne gère plus la tâche et que la fenêtre de grâce de 5 minutes a expiré, la maintenance peut marquer la tâche comme `lost`.

## Types de planification

| Type    | Option CLI | Description                                                    |
| ------- | ---------- | -------------------------------------------------------------- |
| `at`    | `--at`     | Horodatage à exécution unique (ISO 8601 ou relatif comme `20m`) |
| `every` | `--every`  | Intervalle fixe                                                |
| `cron`  | `--cron`   | Expression cron à 5 ou 6 champs avec `--tz` optionnel         |

Les horodatages sans fuseau horaire sont traités comme étant en UTC. Ajoutez `--tz America/New_York` pour une planification locale à l’heure murale.

Les expressions récurrentes au début de chaque heure sont automatiquement décalées jusqu’à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour imposer un timing précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine ne sont pas des jokers, croner fait correspondre lorsque **l’un ou l’autre** des champs correspond — pas les deux. C’est le comportement standard de Vixie cron.

```
# Intention : "9 h le 15, seulement si c'est un lundi"
# Réalité :   "9 h chaque 15, ET 9 h chaque lundi"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur jour-de-semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un seul champ et vérifiez l’autre dans l’invite ou la commande de votre tâche.

## Styles d’exécution

| Style           | Valeur `--session`   | S’exécute dans            | Idéal pour                        |
| --------------- | -------------------- | ------------------------- | --------------------------------- |
| Session principale | `main`            | Prochain tour heartbeat   | Rappels, événements système       |
| Isolé           | `isolated`           | `cron:<jobId>` dédié      | Rapports, tâches d’arrière-plan   |
| Session actuelle | `current`           | Liée au moment de la création | Travail récurrent sensible au contexte |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Flux de travail qui s’appuient sur l’historique |

Les tâches en **session principale** mettent en file un événement système et peuvent éventuellement réveiller le heartbeat (`--wake now` ou `--wake next-heartbeat`). Les tâches **isolées** exécutent un tour d’agent dédié avec une session fraîche. Les **sessions personnalisées** (`session:xxx`) conservent le contexte d’une exécution à l’autre, ce qui permet des flux de travail comme des points quotidiens qui s’appuient sur les résumés précédents.

Pour les tâches isolées, le démontage du runtime inclut désormais un nettoyage du navigateur au mieux pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat réel de cron reste prioritaire.

Lorsque des exécutions cron isolées orchestrent des sous-agents, la livraison privilégie également la sortie finale descendante plutôt qu’un texte intermédiaire obsolète du parent. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour partielle du parent au lieu de l’annoncer.

### Options de payload pour les tâches isolées

- `--message` : texte de l’invite (obligatoire pour l’isolé)
- `--model` / `--thinking` : remplacements du modèle et du niveau de réflexion
- `--light-context` : ignorer l’injection des fichiers d’initialisation du workspace
- `--tools exec,read` : restreindre les outils que la tâche peut utiliser

`--model` utilise le modèle autorisé sélectionné pour cette tâche. Si le modèle demandé n’est pas autorisé, cron enregistre un avertissement et revient à la sélection du modèle de l’agent/par défaut pour cette tâche. Les chaînes de repli configurées continuent de s’appliquer, mais un simple remplacement de modèle sans liste de repli explicite par tâche n’ajoute plus le primaire de l’agent comme cible de nouvelle tentative cachée supplémentaire.

L’ordre de priorité de sélection du modèle pour les tâches isolées est le suivant :

1. Remplacement de modèle du hook Gmail (lorsque l’exécution provient de Gmail et que ce remplacement est autorisé)
2. `model` du payload par tâche
3. Remplacement de modèle de session cron stocké
4. Sélection du modèle de l’agent/par défaut

Le mode rapide suit aussi la sélection active résolue. Si la configuration du modèle sélectionné a `params.fastMode`, le cron isolé l’utilise par défaut. Un remplacement `fastMode` stocké dans la session reste prioritaire sur la configuration dans les deux sens.

Si une exécution isolée rencontre un basculement actif de modèle en direct, cron réessaie avec le fournisseur/modèle basculé et persiste cette sélection active avant de réessayer. Lorsque le basculement transporte aussi un nouveau profil d’authentification, cron persiste également ce remplacement de profil d’authentification. Les nouvelles tentatives sont limitées : après la tentative initiale plus 2 nouvelles tentatives de basculement, cron abandonne au lieu de boucler indéfiniment.

## Livraison et sortie

| Mode       | Ce qui se passe                                         |
| ---------- | ------------------------------------------------------- |
| `announce` | Livrer le résumé au canal cible (par défaut pour l’isolé) |
| `webhook`  | POST du payload d’événement terminé vers une URL        |
| `none`     | Interne uniquement, pas de livraison                    |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour une livraison vers un canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123`. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`).

Pour les tâches isolées gérées par cron, le runner possède le chemin de livraison final. Une invite est envoyée à l’agent pour qu’il renvoie un résumé en texte brut, puis ce résumé est envoyé via `announce`, `webhook` ou conservé en interne pour `none`. `--no-deliver` ne redonne pas la livraison à l’agent ; cela conserve l’exécution en interne.

Si la tâche d’origine indique explicitement d’envoyer un message à un destinataire externe, l’agent doit indiquer qui/où ce message doit être envoyé dans sa sortie au lieu d’essayer de l’envoyer directement.

Les notifications d’échec suivent un chemin de destination distinct :

- `cron.failureDestination` définit une valeur par défaut globale pour les notifications d’échec.
- `job.delivery.failureDestination` la remplace par tâche.
- Si aucun des deux n’est défini et que la tâche livre déjà via `announce`, les notifications d’échec reviennent désormais à cette cible d’annonce principale.
- `delivery.failureDestination` n’est pris en charge que sur les tâches `sessionTarget="isolated"` sauf si le mode de livraison principal est `webhook`.

## Exemples CLI

Rappel à exécution unique (session principale) :

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Tâche isolée récurrente avec livraison :

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

Tâche isolée avec remplacement du modèle et du niveau de réflexion :

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

## Webhooks

La Gateway peut exposer des points de terminaison HTTP webhook pour des déclencheurs externes. Activez-les dans la configuration :

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

### POST /hooks/wake

Mettre en file un événement système pour la session principale :

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obligatoire) : description de l’événement
- `mode` (optionnel) : `now` (par défaut) ou `next-heartbeat`

### POST /hooks/agent

Exécuter un tour d’agent isolé :

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Champs : `message` (obligatoire), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mappés (POST /hooks/\<name\>)

Les noms de hook personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappings peuvent transformer des payloads arbitraires en actions `wake` ou `agent` avec des modèles ou des transformations par code.

### Sécurité

- Gardez les points de terminaison de hook derrière loopback, tailnet ou un reverse proxy de confiance.
- Utilisez un jeton de hook dédié ; ne réutilisez pas les jetons d’authentification de gateway.
- Gardez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter le routage explicite `agentId`.
- Gardez `hooks.allowRequestSessionKey=false` sauf si vous avez besoin de sessions sélectionnées par l’appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clés de session autorisées.
- Les payloads de hook sont encapsulés avec des limites de sécurité par défaut.

## Intégration Gmail PubSub

Reliez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

**Prérequis** : CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour le point de terminaison HTTPS public.

### Configuration avec assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le preset Gmail et utilise Tailscale Funnel pour le point de terminaison push.

### Démarrage automatique de la Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, la Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement le watch. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour désactiver ce comportement.

### Configuration manuelle ponctuelle

1. Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog` :

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Créez le topic et accordez à Gmail l’accès push :

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Démarrez le watch :

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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
# Lister toutes les tâches
openclaw cron list

# Modifier une tâche
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Forcer l’exécution d’une tâche maintenant
openclaw cron run <jobId>

# Exécuter uniquement si due
openclaw cron run <jobId> --due

# Voir l’historique d’exécution
openclaw cron runs --id <jobId> --limit 50

# Supprimer une tâche
openclaw cron remove <jobId>

# Sélection de l’agent (configurations multi-agents)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Remarque sur le remplacement du modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné de la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact est transmis à l’exécution de l’agent isolé.
- S’il n’est pas autorisé, cron émet un avertissement et revient à la sélection du modèle de l’agent/par défaut de la tâche.
- Les chaînes de repli configurées continuent de s’appliquer, mais un simple remplacement `--model` sans liste de repli explicite par tâche ne bascule plus vers le primaire de l’agent comme cible supplémentaire de nouvelle tentative silencieuse.

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

Désactiver cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

**Nouvelle tentative pour exécution unique** : les erreurs transitoires (limitation de débit, surcharge, réseau, erreur serveur) sont retentées jusqu’à 3 fois avec un backoff exponentiel. Les erreurs permanentes sont désactivées immédiatement.

**Nouvelle tentative récurrente** : backoff exponentiel (de 30 s à 60 min) entre les nouvelles tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

**Maintenance** : `cron.sessionRetention` (par défaut `24h`) purge les entrées de session d’exécution isolée. `cron.runLog.maxBytes` / `cron.runLog.keepLines` purgent automatiquement les fichiers de journal d’exécution.

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

### Cron ne se déclenche pas

- Vérifiez `cron.enabled` et la variable d’environnement `OPENCLAW_SKIP_CRON`.
- Confirmez que la Gateway fonctionne en continu.
- Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l’hôte.
- `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore due.

### Cron s’est déclenché mais aucune livraison

- Le mode de livraison `none` signifie qu’aucun message externe n’est attendu.
- Une cible de livraison manquante/invalide (`channel`/`to`) signifie que l’envoi sortant a été ignoré.
- Des erreurs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
- Si l’exécution isolée ne renvoie que le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe ainsi que le chemin de résumé mis en file de secours, donc rien n’est renvoyé dans le chat.
- Pour les tâches isolées gérées par cron, n’attendez pas que l’agent utilise l’outil de message comme solution de secours. Le runner gère la livraison finale ; `--no-deliver` la conserve en interne au lieu d’autoriser un envoi direct.

### Pièges liés au fuseau horaire

- Cron sans `--tz` utilise le fuseau horaire de l’hôte de gateway.
- Les planifications `at` sans fuseau horaire sont traitées comme UTC.
- `activeHours` de heartbeat utilise la résolution de fuseau horaire configurée.

## Lié

- [Automatisation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches d’arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

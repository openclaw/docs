---
read_when:
    - Planifier des tâches en arrière-plan ou des réveils
    - Connecter des déclencheurs externes (Webhooks, Gmail) à OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
sidebarTitle: Scheduled tasks
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-04-26T11:23:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron est le planificateur intégré de la Gateway. Il conserve les tâches, réveille l'agent au bon moment et peut renvoyer la sortie vers un canal de discussion ou un endpoint Webhook.

## Démarrage rapide

<Steps>
  <Step title="Ajouter un rappel à exécution unique">
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
  <Step title="Voir l'historique des exécutions">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Fonctionnement de Cron

- Cron s'exécute **dans le processus Gateway** (pas dans le modèle).
- Les définitions de tâches sont conservées dans `~/.openclaw/cron/jobs.json`, de sorte que les redémarrages ne font pas perdre les planifications.
- L'état d'exécution au moment de l'exécution est conservé à côté dans `~/.openclaw/cron/jobs-state.json`. Si vous suivez les définitions cron dans git, suivez `jobs.json` et ajoutez `jobs-state.json` au `.gitignore`.
- Après la séparation, les anciennes versions d'OpenClaw peuvent lire `jobs.json` mais peuvent considérer les tâches comme nouvelles, car les champs d'exécution résident maintenant dans `jobs-state.json`.
- Toutes les exécutions cron créent des enregistrements de [tâche en arrière-plan](/fr/automation/tasks).
- Les tâches à exécution unique (`--at`) sont supprimées automatiquement après une réussite par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` lorsque l'exécution se termine, afin que l'automatisation du navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées protègent aussi contre les réponses d'accusé de réception obsolètes. Si le premier résultat n'est qu'une mise à jour de statut intermédiaire (`on it`, `pulling everything together` et autres indications similaires) et qu'aucune exécution descendante de sous-agent n'est encore responsable de la réponse finale, OpenClaw relance une fois pour obtenir le résultat réel avant la livraison.

<a id="maintenance"></a>

<Note>
La réconciliation des tâches pour cron est d'abord gérée par l'exécution, puis soutenue par l'historique durable : une tâche cron active reste en vie tant que l'exécution cron suit encore cette tâche comme étant en cours, même si une ancienne ligne de session enfant existe encore. Une fois que l'exécution ne gère plus la tâche et que la fenêtre de grâce de 5 minutes expire, les vérifications de maintenance consultent les journaux d'exécution conservés et l'état de la tâche pour l'exécution correspondante `cron:<jobId>:<startedAt>`. Si cet historique durable montre un résultat terminal, le registre des tâches est finalisé à partir de celui-ci ; sinon, la maintenance gérée par la Gateway peut marquer la tâche comme `lost`. L'audit CLI hors ligne peut récupérer à partir de l'historique durable, mais il ne considère pas son propre ensemble vide de tâches actives en mémoire comme preuve qu'une exécution cron gérée par la Gateway a disparu.
</Note>

## Types de planification

| Type    | Option CLI | Description                                                  |
| ------- | ---------- | ------------------------------------------------------------ |
| `at`    | `--at`     | Horodatage à exécution unique (ISO 8601 ou relatif comme `20m`) |
| `every` | `--every`  | Intervalle fixe                                              |
| `cron`  | `--cron`   | Expression cron à 5 ou 6 champs avec `--tz` facultatif      |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification à l'heure locale.

Les expressions récurrentes en début d'heure sont automatiquement échelonnées jusqu'à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour imposer un horaire précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine ne sont pas des jokers, croner correspond lorsque **l'un ou l'autre** champ correspond — pas les deux. C'est le comportement cron Vixie standard.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche environ 5 à 6 fois par mois au lieu de 0 à 1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur de jour de semaine `+` de Croner (`0 9 15 * +1`) ou planifiez sur un seul champ et vérifiez l'autre dans l'invite ou la commande de votre tâche.

## Styles d'exécution

| Style           | Valeur de `--session` | S'exécute dans          | Idéal pour                     |
| --------------- | --------------------- | ----------------------- | ------------------------------ |
| Session principale | `main`             | Prochain tour Heartbeat | Rappels, événements système    |
| Isolée          | `isolated`            | `cron:<jobId>` dédié    | Rapports, tâches de fond       |
| Session actuelle | `current`            | Liée au moment de la création | Travail récurrent tenant compte du contexte |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Workflows qui s'appuient sur l'historique |

<AccordionGroup>
  <Accordion title="Session principale vs isolée vs personnalisée">
    Les tâches en **session principale** mettent en file d'attente un événement système et peuvent éventuellement réveiller le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Ces événements système ne prolongent pas la fraîcheur de réinitialisation quotidienne/inactivité pour la session cible. Les tâches **isolées** exécutent un tour d'agent dédié avec une session fraîche. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des workflows comme des points quotidiens qui s'appuient sur les résumés précédents.
  </Accordion>
  <Accordion title="Ce que signifie « fresh session » pour les tâches isolées">
    Pour les tâches isolées, « fresh session » signifie un nouvel identifiant de transcription/session pour chaque exécution. OpenClaw peut conserver des préférences sûres comme les paramètres thinking/fast/verbose, les labels, et les surcharges explicites de modèle/authentification sélectionnées par l'utilisateur, mais il n'hérite pas du contexte ambiant de conversation d'une ancienne ligne cron : routage canal/groupe, politique d'envoi ou de mise en file d'attente, élévation, origine, ou liaison d'exécution ACP. Utilisez `current` ou `session:<id>` lorsqu'une tâche récurrente doit délibérément s'appuyer sur le même contexte de conversation.
  </Accordion>
  <Accordion title="Nettoyage à l'exécution">
    Pour les tâches isolées, le démontage au moment de l'exécution inclut désormais aussi le nettoyage du navigateur au mieux pour cette session cron. Les échecs de nettoyage sont ignorés pour que le résultat cron réel reste prioritaire.

    Les exécutions cron isolées éliminent également toutes les instances d'exécution MCP groupées créées pour la tâche via le chemin partagé de nettoyage d'exécution. Cela correspond à la façon dont les clients MCP des sessions principales et personnalisées sont arrêtés, de sorte que les tâches cron isolées ne laissent pas fuir de processus enfants stdio ni de connexions MCP de longue durée entre les exécutions.

  </Accordion>
  <Accordion title="Livraison des sous-agents et vers Discord">
    Lorsque des exécutions cron isolées orchestrent des sous-agents, la livraison privilégie aussi la sortie finale descendante plutôt qu'un texte intermédiaire parent obsolète. Si des descendants s'exécutent encore, OpenClaw supprime cette mise à jour parent partielle au lieu de l'annoncer.

    Pour les cibles d'annonce Discord en texte seul, OpenClaw envoie une seule fois le texte final canonique de l'assistant au lieu de rejouer à la fois les charges utiles de texte diffusé/intermédiaire et la réponse finale. Les charges utiles Discord multimédias et structurées sont toujours livrées comme des charges utiles séparées afin que les pièces jointes et composants ne soient pas perdus.

  </Accordion>
</AccordionGroup>

### Options de charge utile pour les tâches isolées

<ParamField path="--message" type="string" required>
  Texte d'invite (requis pour les tâches isolées).
</ParamField>
<ParamField path="--model" type="string">
  Surcharge du modèle ; utilise le modèle autorisé sélectionné pour la tâche.
</ParamField>
<ParamField path="--thinking" type="string">
  Surcharge du niveau de réflexion.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Ignore l'injection du fichier d'amorçage de l'espace de travail.
</ParamField>
<ParamField path="--tools" type="string">
  Restreint les outils que la tâche peut utiliser, par exemple `--tools exec,read`.
</ParamField>

`--model` utilise le modèle autorisé sélectionné pour cette tâche. Si le modèle demandé n'est pas autorisé, cron enregistre un avertissement et revient à la sélection du modèle d'agent/par défaut de la tâche à la place. Les chaînes de secours configurées s'appliquent toujours, mais une simple surcharge de modèle sans liste de secours explicite par tâche n'ajoute plus le modèle principal de l'agent comme cible de nouvelle tentative supplémentaire cachée.

L'ordre de priorité de sélection du modèle pour les tâches isolées est le suivant :

1. Surcharge de modèle du hook Gmail (lorsque l'exécution provient de Gmail et que cette surcharge est autorisée)
2. `model` de la charge utile par tâche
3. Surcharge de modèle de session cron stockée sélectionnée par l'utilisateur
4. Sélection du modèle d'agent/par défaut

Le mode rapide suit également la sélection active résolue. Si la configuration du modèle sélectionné a `params.fastMode`, cron isolé l'utilise par défaut. Une surcharge `fastMode` de session stockée reste prioritaire sur la configuration dans les deux sens.

Si une exécution isolée rencontre un transfert en direct de changement de modèle, cron réessaie avec le fournisseur/modèle changé et conserve cette sélection en direct pour l'exécution active avant de réessayer. Lorsque le changement s'accompagne aussi d'un nouveau profil d'authentification, cron conserve également cette surcharge de profil d'authentification pour l'exécution active. Les nouvelles tentatives sont limitées : après la tentative initiale plus 2 nouvelles tentatives de changement, cron abandonne au lieu de boucler indéfiniment.

## Livraison et sortie

| Mode       | Ce qui se passe                                                   |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Livre le texte final à la cible en secours si l'agent n'a pas envoyé |
| `webhook`  | Envoie la charge utile de l'événement terminé en POST vers une URL |
| `none`     | Aucune livraison de secours par l'exécuteur                      |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour une livraison vers un canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123`. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`). Les identifiants de salle Matrix sont sensibles à la casse ; utilisez l'identifiant exact de la salle ou la forme `room:!room:server` provenant de Matrix.

Pour les tâches isolées, la livraison vers le chat est partagée. Si une route de chat est disponible, l'agent peut utiliser l'outil `message` même lorsque la tâche utilise `--no-deliver`. Si l'agent envoie vers la cible configurée/actuelle, OpenClaw ignore l'annonce de secours. Sinon, `announce`, `webhook` et `none` contrôlent seulement ce que l'exécuteur fait avec la réponse finale après le tour de l'agent.

Lorsqu'un agent crée un rappel isolé à partir d'un chat actif, OpenClaw stocke la cible de livraison active préservée pour la route d'annonce de secours. Les clés internes de session peuvent être en minuscules ; les cibles de livraison du fournisseur ne sont pas reconstruites à partir de ces clés lorsque le contexte de chat actuel est disponible.

Les notifications d'échec suivent un chemin de destination distinct :

- `cron.failureDestination` définit une valeur par défaut globale pour les notifications d'échec.
- `job.delivery.failureDestination` remplace cela par tâche.
- Si aucun des deux n'est défini et que la tâche livre déjà via `announce`, les notifications d'échec reviennent désormais par défaut à cette cible d'annonce principale.
- `delivery.failureDestination` n'est pris en charge que sur les tâches `sessionTarget="isolated"`, sauf si le mode de livraison principal est `webhook`.

## Exemples CLI

<Tabs>
  <Tab title="Rappel à exécution unique">
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
  <Tab title="Surcharge de modèle et de thinking">
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

La Gateway peut exposer des endpoints Webhook HTTP pour des déclencheurs externes. Activez-les dans la configuration :

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
    Mettre en file d'attente un événement système pour la session principale :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Description de l'événement.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` ou `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Exécuter un tour d'agent isolé :

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Champs : `message` (requis), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mappés (POST /hooks/<name>)">
    Les noms de hook personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappings peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` à l'aide de modèles ou de transformations par code.
  </Accordion>
</AccordionGroup>

<Warning>
Gardez les endpoints de hook derrière loopback, tailnet ou un proxy inverse de confiance.

- Utilisez un jeton de hook dédié ; ne réutilisez pas les jetons d'authentification de la gateway.
- Conservez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter le routage explicite par `agentId`.
- Conservez `hooks.allowRequestSessionKey=false`, sauf si vous avez besoin de sessions choisies par l'appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes autorisées des clés de session.
- Les charges utiles des hooks sont enveloppées dans des limites de sécurité par défaut.
</Warning>

## Intégration Gmail PubSub

Connectez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

<Note>
**Prérequis :** CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour l'endpoint HTTPS public.
</Note>

### Configuration avec l'assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le preset Gmail et utilise Tailscale Funnel pour l'endpoint push.

### Démarrage automatique de la Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, la Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour ne pas l'activer.

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
  <Step title="Créer le topic et accorder à Gmail l'accès push">
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

### Surcharge de modèle Gmail

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
Remarque sur la surcharge de modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné de la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact est transmis à l'exécution de l'agent isolé.
- S'il n'est pas autorisé, cron émet un avertissement et revient à la sélection du modèle d'agent/par défaut de la tâche.
- Les chaînes de secours configurées s'appliquent toujours, mais une simple surcharge `--model` sans liste de secours explicite par tâche ne bascule plus vers le modèle principal de l'agent comme cible de nouvelle tentative silencieuse supplémentaire.
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

Le sidecar d'état d'exécution est dérivé de `cron.store` : un stockage `.json` comme `~/clawd/cron/jobs.json` utilise `~/clawd/cron/jobs-state.json`, tandis qu'un chemin de stockage sans suffixe `.json` ajoute `-state.json`.

Désactiver cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportement de nouvelle tentative">
    **Nouvelle tentative d'exécution unique** : les erreurs transitoires (limitation de débit, surcharge, réseau, erreur serveur) sont retentées jusqu'à 3 fois avec un backoff exponentiel. Les erreurs permanentes désactivent immédiatement.

    **Nouvelle tentative récurrente** : backoff exponentiel (de 30s à 60m) entre les nouvelles tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (par défaut `24h`) supprime les entrées de session des exécutions isolées. `cron.runLog.maxBytes` / `cron.runLog.keepLines` élaguent automatiquement les fichiers de journal d'exécution.
  </Accordion>
</AccordionGroup>

## Résolution des problèmes

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
    - Confirmez que la Gateway s'exécute en continu.
    - Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l'hôte.
    - `reason: not-due` dans la sortie d'exécution signifie que l'exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n'était pas encore due.
  </Accordion>
  <Accordion title="Cron s'est déclenché mais il n'y a pas eu de livraison">
    - Le mode de livraison `none` signifie qu'aucun envoi de secours par l'exécuteur n'est attendu. L'agent peut toujours envoyer directement avec l'outil `message` lorsqu'une route de chat est disponible.
    - Une cible de livraison absente/invalide (`channel`/`to`) signifie que l'envoi sortant a été ignoré.
    - Pour Matrix, les tâches copiées ou héritées avec des identifiants de salle `delivery.to` en minuscules peuvent échouer, car les identifiants de salle Matrix sont sensibles à la casse. Modifiez la tâche avec la valeur exacte `!room:server` ou `room:!room:server` provenant de Matrix.
    - Les erreurs d'authentification du canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
    - Si l'exécution isolée ne renvoie que le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe ainsi que le chemin de résumé mis en file d'attente de secours ; rien n'est donc renvoyé dans le chat.
    - Si l'agent doit lui-même envoyer un message à l'utilisateur, vérifiez que la tâche a une route utilisable (`channel: "last"` avec un chat précédent, ou un canal/une cible explicite).
  </Accordion>
  <Accordion title="Cron ou Heartbeat semble empêcher le basculement de style /new">
    - La fraîcheur de réinitialisation quotidienne et d'inactivité n'est pas basée sur `updatedAt` ; voir [Gestion de session](/fr/concepts/session#session-lifecycle).
    - Les réveils cron, les exécutions Heartbeat, les notifications exec et la gestion interne de la gateway peuvent mettre à jour la ligne de session pour le routage/statut, mais ils ne prolongent pas `sessionStartedAt` ou `lastInteractionAt`.
    - Pour les anciennes lignes créées avant l'existence de ces champs, OpenClaw peut récupérer `sessionStartedAt` à partir de l'en-tête de session JSONL de la transcription lorsque le fichier est encore disponible. Les anciennes lignes d'inactivité sans `lastInteractionAt` utilisent cette heure de début récupérée comme base d'inactivité.
  </Accordion>
  <Accordion title="Pièges liés au fuseau horaire">
    - Cron sans `--tz` utilise le fuseau horaire de l'hôte de la gateway.
    - Les planifications `at` sans fuseau horaire sont traitées comme UTC.
    - `activeHours` de Heartbeat utilise la résolution du fuseau horaire configuré.
  </Accordion>
</AccordionGroup>

## Liens associés

- [Automatisation & tâches](/fr/automation) — tous les mécanismes d'automatisation en un coup d'œil
- [Tâches en arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire

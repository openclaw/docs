---
read_when:
    - Vous souhaitez déclencher ou piloter des TaskFlows depuis un système externe
    - Vous configurez le Plugin Webhook inclus
summary: 'Plugin Webhooks : point d’entrée TaskFlow authentifié pour les automatisations externes de confiance'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-07-12T03:00:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Le Plugin Webhooks ajoute des routes HTTP authentifiées afin qu’un système externe
de confiance (Zapier, n8n, une tâche de CI, un service interne) puisse créer et piloter
des TaskFlows OpenClaw gérés via HTTP, sans écrire de Plugin personnalisé.

Le Plugin s’exécute dans le processus Gateway. Pour un Gateway distant, installez-le et
configurez-le sur cet hôte, puis redémarrez le Gateway. Il est fourni sans aucune route
configurée ; il ne fait donc rien tant que vous n’ajoutez pas au moins une route.

## Configurer les routes

Définissez la configuration sous `plugins.entries.webhooks.config` :

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Pont TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Champs d’une route :

| Champ          | Obligatoire | Valeur par défaut             | Remarques                                                  |
| -------------- | ----------- | ----------------------------- | ---------------------------------------------------------- |
| `enabled`      | non         | `true`                        |                                                            |
| `path`         | non         | `/plugins/webhooks/<routeId>` | Doit être unique parmi toutes les routes.                  |
| `sessionKey`   | oui         | -                             | Session propriétaire des TaskFlows associés.               |
| `secret`       | oui         | -                             | Chaîne simple ou SecretRef (voir ci-dessous).              |
| `controllerId` | non         | `webhooks/<routeId>`          | Utilisé comme contrôleur `create_flow` par défaut.          |
| `description`  | non         | -                             | Note destinée uniquement à l’opérateur.                    |

`secret` accepte une chaîne simple ou une SecretRef : `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Chaque route configurée est enregistrée au démarrage, que son secret puisse
alors être résolu ou non. Un secret impossible à résoudre ne désactive ni
n’ignore la route : les requêtes qui lui sont adressées échouent à
l’authentification (`401`) jusqu’à ce que le secret puisse être résolu. Les
valeurs SecretRef sont résolues à nouveau à chaque requête ; la rotation du
secret sous-jacent (variable d’environnement, fichier ou sortie d’une commande
exec) prend donc effet sans redémarrer le Gateway.

## Modèle de sécurité

Chaque route agit avec les autorisations TaskFlow de son `sessionKey` configuré :
elle peut consulter et modifier tout TaskFlow appartenant à cette session. L’accès
aux TaskFlows passe toujours par `api.runtime.tasks.managedFlows.bindSession(...)`,
de sorte qu’une route ne peut jamais agir en dehors de la session à laquelle elle
est associée. Pour limiter l’impact potentiel :

- Utilisez un secret robuste et unique pour chaque route.
- Préférez une SecretRef à un secret en texte clair défini directement.
- Associez les routes à la session la plus restreinte compatible avec le workflow.
- N’exposez que le chemin de Webhook précis dont vous avez besoin.

Ordre de traitement des requêtes pour chaque chemin : vérifications de la méthode
HTTP (`POST` uniquement) et de `Content-Type: application/json`, puis limitation
de débit à fenêtre fixe (120 requêtes par fenêtre de 60 secondes pour chaque clé
chemin+adresse IP du client, avec au maximum 4 096 clés suivies), puis limitation
des requêtes en cours (8 requêtes simultanées par clé, avec au maximum 4 096 clés
suivies), puis authentification par secret partagé, puis lecture du corps JSON
limitée à 256 Ko et 15 secondes. Les requêtes qui échouent à une vérification
antérieure n’atteignent jamais les suivantes.

## Format des requêtes

Envoyez des requêtes `POST` avec `Content-Type: application/json` et soit
`Authorization: Bearer <secret>`, soit `x-openclaw-webhook-secret: <secret>` :

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Actions prises en charge

| Action             | Objectif                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| `create_flow`      | Créer un TaskFlow géré pour la session de la route.                      |
| `get_flow`         | Récupérer un TaskFlow par identifiant.                                   |
| `list_flows`       | Répertorier les TaskFlows de la session de la route.                     |
| `find_latest_flow` | Récupérer le TaskFlow mis à jour le plus récemment.                      |
| `resolve_flow`     | Résoudre un TaskFlow à partir d’un jeton opaque.                         |
| `get_task_summary` | Récupérer le résumé des tâches d’un TaskFlow.                            |
| `set_waiting`      | Marquer un TaskFlow comme en attente, avec des données d’état/d’attente facultatives. |
| `resume_flow`      | Reprendre un TaskFlow en attente ou bloqué.                              |
| `finish_flow`      | Marquer un TaskFlow comme terminé.                                       |
| `fail_flow`        | Marquer un TaskFlow comme ayant échoué.                                  |
| `request_cancel`   | Demander une annulation coopérative.                                     |
| `cancel_flow`      | Annuler un TaskFlow (peut renvoyer `202` si des enfants sont encore actifs). |
| `run_task`         | Créer une tâche enfant gérée dans un TaskFlow existant.                  |

Les actions de modification (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) nécessitent `flowId` et `expectedRevision` pour la concurrence
optimiste ; une révision obsolète renvoie `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Valeurs `runtime` autorisées : `subagent`, `acp`. `startedAt`, `lastEventAt` et
`progressSummary` ne sont valides que lorsque `status` vaut `"running"` ; les
envoyer avec tout autre état renvoie `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Structure des réponses

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Les vues des flux et des tâches n’incluent jamais les métadonnées de propriétaire
ou de session ; les réponses ne peuvent donc pas divulguer le `sessionKey` associé
à la route. Les valeurs de `code` comprennent `not_found`, `not_managed`,
`revision_conflict`, `persist_failed`, `cancel_requested`, `cancel_pending`,
`terminal`, `invalid_request`, `request_rejected`, ainsi que des codes de repli
propres aux actions (`mutation_rejected`, `create_rejected`, `task_not_created`,
`cancel_rejected`) lorsqu’une modification est rejetée pour une raison non couverte
par les codes nommés ci-dessus.

## Voir aussi

- [Hooks](/fr/automation/hooks) - hooks internes déclenchés par des événements, par opposition à ce pont TaskFlow fondé sur HTTP
- [Webhooks du Gateway (configuration `hooks.*`)](/fr/automation/cron-jobs#webhooks) - fonctionnalité distincte de point de terminaison HTTP générique du Gateway ; différente des routes de ce Plugin
- [SDK d’exécution des Plugins](/fr/plugins/sdk-runtime)
- [Webhooks de la CLI](/fr/cli/webhooks)

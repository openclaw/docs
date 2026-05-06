---
read_when:
    - Vous voulez déclencher ou piloter des TaskFlows depuis un système externe
    - Vous configurez le Plugin webhooks intégré
summary: 'Plugin Webhooks : point d''entrée TaskFlow authentifié pour l''automatisation externe de confiance'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-05-06T17:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Le Plugin Webhooks ajoute des routes HTTP authentifiées qui relient l’automatisation externe aux TaskFlows OpenClaw.

Utilisez-le lorsque vous voulez qu’un système approuvé, comme Zapier, n8n, une tâche CI ou un service interne, crée et pilote des TaskFlows gérés sans écrire d’abord de Plugin personnalisé.

## Où il s’exécute

Le Plugin Webhooks s’exécute dans le processus Gateway.

Si votre Gateway s’exécute sur une autre machine, installez et configurez le Plugin sur cet hôte Gateway, puis redémarrez le Gateway.

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
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Champs de route :

- `enabled` : facultatif, vaut `true` par défaut
- `path` : facultatif, vaut `/plugins/webhooks/<routeId>` par défaut
- `sessionKey` : session requise qui possède les TaskFlows liés
- `secret` : secret partagé ou SecretRef requis
- `controllerId` : identifiant de contrôleur facultatif pour les flux gérés créés
- `description` : note opérateur facultative

Entrées `secret` prises en charge :

- Chaîne simple
- SecretRef avec `source: "env" | "file" | "exec"`

Si une route adossée à un secret ne peut pas résoudre son secret au démarrage, le Plugin ignore cette route et journalise un avertissement au lieu d’exposer un endpoint défectueux.

## Modèle de sécurité

Chaque route est approuvée pour agir avec l’autorité TaskFlow de son `sessionKey` configuré.

Cela signifie que la route peut inspecter et modifier les TaskFlows appartenant à cette session ; vous devriez donc :

- Utiliser un secret fort et unique par route
- Préférer les références de secrets aux secrets en texte clair intégrés
- Lier les routes à la session la plus restreinte qui convient au workflow
- Exposer uniquement le chemin Webhook précis dont vous avez besoin

Le Plugin applique :

- Authentification par secret partagé
- Protections de taille et de délai d’expiration du corps de requête
- Limitation de débit à fenêtre fixe
- Limitation des requêtes en cours
- Accès aux TaskFlows lié au propriétaire via `api.runtime.tasks.managedFlows.bindSession(...)`

## Format de requête

Envoyez des requêtes `POST` avec :

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` ou `x-openclaw-webhook-secret: <secret>`

Exemple :

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Actions prises en charge

Le Plugin accepte actuellement ces valeurs JSON `action` :

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Crée un TaskFlow géré pour la session liée de la route.

Exemple :

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Crée une tâche enfant gérée dans un TaskFlow géré existant.

Les runtimes autorisés sont :

- `subagent`
- `acp`

Exemple :

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Forme de réponse

Les réponses réussies renvoient :

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Les requêtes rejetées renvoient :

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Le Plugin supprime intentionnellement les métadonnées de propriétaire/session des réponses Webhook.

## Docs connexes

- [SDK d’exécution du Plugin](/fr/plugins/sdk-runtime)
- [Vue d’ensemble des hooks et webhooks](/fr/automation/hooks)
- [Webhooks CLI](/fr/cli/webhooks)

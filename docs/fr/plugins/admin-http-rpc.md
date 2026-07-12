---
read_when:
    - Création d’outils pour l’hôte ne pouvant pas utiliser le client RPC WebSocket du Gateway
    - Exposition de l’automatisation de l’administration du Gateway derrière un point d’entrée privé et fiable
    - Audit du modèle de sécurité pour l’accès HTTP aux méthodes du Gateway
summary: Exposez certaines méthodes du plan de contrôle du Gateway via le Plugin intégré et facultatif admin-http-rpc
title: Plugin RPC HTTP d’administration
x-i18n:
    generated_at: "2026-07-12T02:50:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Le plugin intégré `admin-http-rpc` expose via HTTP un ensemble autorisé de méthodes du plan de contrôle du Gateway, pour les automatisations d’hôte de confiance qui ne peuvent pas maintenir ouverte une connexion WebSocket au Gateway.

Il est fourni avec OpenClaw, mais désactivé par défaut ; lorsqu’il est désactivé, la route n’est pas enregistrée. Lorsqu’il est activé, il ajoute `POST /api/v1/admin/rpc` sur le même point d’écoute que le Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Activez-le uniquement pour des outils privés de l’hôte, des automatisations du tailnet ou un point d’entrée interne de confiance. N’exposez jamais cette route directement à l’Internet public.

## Avant de l’activer

La RPC HTTP d’administration constitue une surface complète du plan de contrôle pour les opérateurs : tout appelant qui réussit l’authentification HTTP du Gateway peut invoquer les méthodes autorisées ci-dessous. Activez-la uniquement si toutes les conditions suivantes sont remplies :

- L’appelant est autorisé à administrer le Gateway.
- L’appelant ne peut pas utiliser le client RPC WebSocket.
- La route est accessible uniquement via local loopback, un tailnet ou un point d’entrée privé authentifié.
- Vous avez vérifié les méthodes autorisées et elles correspondent à l’automatisation que vous prévoyez d’exécuter.

Pour les clients OpenClaw et les outils interactifs capables de maintenir ouverte une connexion WebSocket au Gateway, utilisez plutôt la RPC WebSocket.

## Activation

Activez le plugin intégré :

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Configuration">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

La route est enregistrée au démarrage du plugin ; redémarrez donc le Gateway après avoir modifié la configuration du plugin.

Désactivez-le lorsque vous n’avez plus besoin de la surface HTTP :

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Vérification de la route

Utilisez `health` comme requête sûre minimale :

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Une réponse réussie contient `ok: true` :

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Lorsque le plugin est désactivé, la route renvoie `404`, car elle n’est pas enregistrée.

## Authentification

La route du plugin utilise l’authentification HTTP du Gateway.

Méthodes d’authentification courantes :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance porteuse d’identité (`gateway.auth.mode="trusted-proxy"`) : faites transiter la requête par le proxy configuré tenant compte de l’identité et laissez-le injecter les en-têtes d’identité requis
- authentification ouverte sur un point d’entrée privé (`gateway.auth.mode="none"`) : aucun en-tête d’authentification requis

## Modèle de sécurité

Considérez ce plugin comme une surface opérateur complète du Gateway.

- L’activation du plugin donne intentionnellement accès aux méthodes RPC d’administration autorisées sur `/api/v1/admin/rpc`.
- Le plugin déclare le contrat de manifeste réservé `contracts.gatewayMethodDispatch: ["authenticated-request"]`, qui permet à sa route HTTP authentifiée par le Gateway de distribuer les méthodes du plan de contrôle dans le processus. Il ne s’agit pas d’un bac à sable : le contrat empêche l’utilisation accidentelle des assistants réservés du SDK, mais les plugins de confiance s’exécutent toujours dans le processus du Gateway.
- L’authentification par porteur d’un secret partagé (modes `token`/`password`) prouve la possession du secret de l’opérateur du Gateway ; les en-têtes `x-openclaw-scopes` plus restrictifs sont ignorés sur ce chemin et les autorisations complètes par défaut de l’opérateur sont rétablies.
- L’authentification HTTP de confiance porteuse d’identité (mode `trusted-proxy`) respecte `x-openclaw-scopes` lorsqu’il est présent.
- `gateway.auth.mode="none"` signifie que cette route n’est pas authentifiée si le plugin est activé. Utilisez ce mode uniquement derrière un point d’entrée privé auquel vous faites entièrement confiance.
- Une fois l’authentification de la route du plugin réussie, les requêtes sont distribuées par les mêmes gestionnaires de méthodes et contrôles de portée du Gateway que la RPC WebSocket.
- La route reste accessible pendant un bail de suspension préparé. La validation bornée des requêtes et la réponse locale de découverte `commands.list` restent disponibles. Parmi les méthodes distribuées au Gateway, seules `gateway.suspend.prepare`, `gateway.suspend.status` et `gateway.suspend.resume` peuvent s’exécuter lorsque l’admission est fermée ; les autres méthodes autorisées renvoient la réponse réessayable habituelle `UNAVAILABLE` du Gateway.
- Limitez cette route à local loopback, au tailnet ou à un point d’entrée privé de confiance. Ne l’exposez pas directement à l’Internet public. Utilisez des gateways distincts lorsque les appelants franchissent des limites de confiance.

## Requête

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Champs :

- `id` (chaîne, facultatif) : copié dans la réponse. Un UUID est généré en cas d’omission.
- `method` (chaîne, obligatoire) : nom d’une méthode autorisée du Gateway.
- `params` (type quelconque, facultatif) : paramètres propres à la méthode.

La taille maximale par défaut du corps de la requête est de 1 Mo.

## Réponse

Les réponses réussies utilisent la structure RPC du Gateway :

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Les erreurs de méthode du Gateway utilisent :

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Le statut HTTP dépend du code d’erreur :

| Code d’erreur              | Statut HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| tout autre code            | 500         |

## Méthodes autorisées

- découverte : `commands.list`
  Renvoie les noms des méthodes RPC HTTP autorisées par ce plugin.
- Gateway : `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- configuration : `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canaux : `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- Web : `web.login.start`, `web.login.wait`
- modèles : `models.list`, `models.authStatus`
- agents : `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approbations : `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron : `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- appareils : `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Nodes : `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tâches : `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics : `doctor.memory.status`, `update.status`

Les autres méthodes du Gateway sont bloquées tant qu’elles ne sont pas ajoutées intentionnellement.

## Comparaison avec WebSocket

Le chemin RPC WebSocket normal du Gateway reste l’API de plan de contrôle privilégiée pour les clients OpenClaw. Utilisez la RPC HTTP d’administration uniquement pour les outils de l’hôte nécessitant une surface HTTP de type requête-réponse.

Les clients WebSocket utilisant un jeton partagé et dépourvus d’une identité d’appareil de confiance ne peuvent pas déclarer eux-mêmes des portées d’administration lors de la connexion. La RPC HTTP d’administration suit délibérément le modèle d’opérateur HTTP de confiance existant : lorsque le plugin est activé, l’authentification par porteur d’un secret partagé est considérée comme un accès opérateur complet à cette surface d’administration.

## Dépannage

`404 Not Found`

: Le plugin est désactivé, le Gateway n’a pas été redémarré depuis son activation ou la requête est envoyée à un autre processus du Gateway.

`401 Unauthorized`

: La requête n’a pas satisfait à l’authentification HTTP du Gateway. Vérifiez le jeton porteur ou les en-têtes d’identité du proxy de confiance.

`405 Method Not Allowed`

: La requête a utilisé une méthode autre que `POST`.

`413 Payload Too Large`

: Le corps de la requête a dépassé la limite de 1 Mo.

`400 INVALID_REQUEST`

: Le corps de la requête n’est pas un JSON valide, le champ `method` est absent, la méthode ne figure pas dans la liste autorisée du plugin ou l’identifiant de reprise de suspension ne correspond pas au bail actif.

`503 UNAVAILABLE`

: La méthode du Gateway est en cours de démarrage, limitée en débit, suspendue ou en attente d’une opération concurrente de suspension ou de reprise. Consultez `error.details` lorsqu’il est présent et respectez `error.retryAfterMs` avant de réessayer.

## Voir aussi

- [Portées des opérateurs](/fr/gateway/operator-scopes)
- [Sécurité du Gateway](/fr/gateway/security)
- [Accès à distance](/fr/gateway/remote)
- [Manifeste du plugin](/fr/plugins/manifest#contracts-reference)
- [Sous-chemins du SDK](/fr/plugins/sdk-subpaths)

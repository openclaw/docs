---
read_when:
    - Créer des outils côté hôte qui ne peuvent pas utiliser le client RPC WebSocket du Gateway
    - Exposer l’automatisation d’administration du Gateway derrière une entrée privée de confiance
    - Audit du modèle de sécurité pour l’accès HTTP aux méthodes du Gateway
summary: Exposez certaines méthodes du plan de contrôle du Gateway via le plugin admin-http-rpc intégré et activable sur option
title: Plugin RPC HTTP d’administration
x-i18n:
    generated_at: "2026-06-27T17:44:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Le plugin `admin-http-rpc` inclus expose certaines méthodes du plan de contrôle du Gateway via HTTP pour l’automatisation d’hôtes de confiance qui ne peut pas utiliser le client RPC WebSocket normal du Gateway.

Le plugin est inclus avec OpenClaw, mais il est désactivé par défaut. Lorsqu’il est désactivé, la route n’est pas enregistrée. Lorsqu’il est activé, il ajoute :

- `POST /api/v1/admin/rpc`
- même écouteur que le Gateway : `http://<gateway-host>:<port>/api/v1/admin/rpc`

Activez-le uniquement pour des outils d’hôte privés, l’automatisation tailnet ou une entrée interne de confiance. N’exposez pas cette route directement à l’internet public.

## Avant de l’activer

Admin HTTP RPC est une surface complète de plan de contrôle opérateur. Tout appelant qui passe l’authentification HTTP du Gateway peut invoquer les méthodes autorisées sur cette page.

Utilisez-le lorsque toutes ces conditions sont vraies :

- L’appelant est autorisé à exploiter le Gateway.
- L’appelant ne peut pas utiliser le client RPC WebSocket.
- La route est accessible uniquement sur une boucle locale, un tailnet ou une entrée privée authentifiée.
- Vous avez examiné les méthodes autorisées et elles correspondent à l’automatisation que vous prévoyez d’exécuter.

Utilisez le chemin RPC WebSocket pour les clients OpenClaw et les outils interactifs qui peuvent maintenir une connexion WebSocket au Gateway ouverte.

## Activer

Activez le plugin inclus :

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
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

La route est enregistrée au démarrage du plugin. Redémarrez le Gateway après avoir modifié la configuration du plugin.

Désactivez-le lorsque vous n’avez plus besoin de la surface HTTP :

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Vérifier la route

Utilisez `health` comme plus petite requête sûre :

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

Lorsque le plugin est désactivé, la route renvoie `404` parce qu’elle n’est pas enregistrée.

## Authentification

La route du plugin utilise l’authentification HTTP du Gateway.

Chemins d’authentification courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance avec identité (`gateway.auth.mode="trusted-proxy"`) : routez via le proxy configuré tenant compte de l’identité et laissez-le injecter les en-têtes d’identité requis
- authentification ouverte par entrée privée (`gateway.auth.mode="none"`) : aucun en-tête d’authentification requis

## Modèle de sécurité

Traitez ce plugin comme une surface complète d’opérateur du Gateway.

- L’activation du plugin offre intentionnellement l’accès aux méthodes RPC d’administration autorisées à `/api/v1/admin/rpc`.
- Le plugin déclare le contrat de manifeste réservé `contracts.gatewayMethodDispatch: ["authenticated-request"]` afin que sa route HTTP authentifiée par le Gateway puisse distribuer les méthodes de plan de contrôle dans le processus.
- L’authentification bearer par secret partagé prouve la possession du secret opérateur du gateway.
- Pour l’authentification `token` et `password`, les en-têtes `x-openclaw-scopes` plus restreints sont ignorés et les valeurs par défaut normales d’opérateur complet sont rétablies.
- Les modes HTTP de confiance avec identité respectent `x-openclaw-scopes` lorsqu’il est présent.
- `gateway.auth.mode="none"` signifie que cette route n’est pas authentifiée si le plugin est activé. Utilisez cela uniquement derrière une entrée privée à laquelle vous faites entièrement confiance.
- Les requêtes sont distribuées via les mêmes gestionnaires de méthodes du Gateway et les mêmes contrôles de portée que le RPC WebSocket une fois l’authentification de la route du plugin réussie.
- Gardez cette route sur la boucle locale, le tailnet ou une entrée privée de confiance. Ne l’exposez pas directement à l’internet public.
- Les contrats de manifeste de plugin ne sont pas un bac à sable. Ils empêchent l’utilisation accidentelle d’assistants SDK réservés ; les plugins de confiance s’exécutent toujours dans le processus du Gateway.

Utilisez des gateways séparés lorsque les appelants franchissent des limites de confiance.

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

- `id` (chaîne, facultatif) : copié dans la réponse. Un UUID est généré lorsqu’il est omis.
- `method` (chaîne, obligatoire) : nom de méthode Gateway autorisé.
- `params` (any, facultatif) : paramètres propres à la méthode.

La taille maximale par défaut du corps de requête est de 1 Mo.

## Réponse

Les réponses de réussite utilisent la forme RPC du Gateway :

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

Le statut HTTP suit l’erreur du Gateway lorsque c’est possible. Par exemple, `INVALID_REQUEST` renvoie `400`, et `UNAVAILABLE` renvoie `503`.

## Méthodes autorisées

- découverte : `commands.list`
  Renvoie les noms de méthodes RPC HTTP autorisés par ce plugin.
- gateway : `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- configuration : `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canaux : `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web : `web.login.start`, `web.login.wait`
- modèles : `models.list`, `models.authStatus`
- agents : `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approbations : `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron : `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- appareils : `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nœuds : `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tâches : `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics : `doctor.memory.status`, `update.status`

Les autres méthodes du Gateway sont bloquées jusqu’à ce qu’elles soient ajoutées intentionnellement.

## Comparaison WebSocket

Le chemin RPC WebSocket normal du Gateway reste l’API de plan de contrôle privilégiée pour les clients OpenClaw. Utilisez admin HTTP RPC uniquement pour les outils d’hôte qui ont besoin d’une surface HTTP requête/réponse.

Les clients WebSocket à jeton partagé sans identité d’appareil de confiance ne peuvent pas autodéclarer des portées d’administration pendant la connexion. Admin HTTP RPC suit délibérément le modèle opérateur HTTP de confiance existant : lorsque le plugin est activé, l’authentification bearer par secret partagé est traitée comme un accès opérateur complet pour cette surface d’administration.

## Dépannage

`404 Not Found`

: Le plugin est désactivé, le Gateway n’a pas été redémarré depuis son activation, ou la requête est envoyée à un autre processus Gateway.

`401 Unauthorized`

: La requête n’a pas satisfait l’authentification HTTP du Gateway. Vérifiez le jeton bearer ou les en-têtes d’identité trusted-proxy.

`400 INVALID_REQUEST`

: Le corps de la requête n’est pas du JSON valide, le champ `method` est manquant, ou la méthode n’est pas dans la liste d’autorisation du plugin.

`503 UNAVAILABLE`

: Le gestionnaire de méthode du Gateway n’est pas disponible. Vérifiez les journaux du Gateway et réessayez après la fin du démarrage du Gateway.

## Associé

- [Portées opérateur](/fr/gateway/operator-scopes)
- [Sécurité du Gateway](/fr/gateway/security)
- [Accès à distance](/fr/gateway/remote)
- [Manifeste de plugin](/fr/plugins/manifest#contracts)
- [Sous-chemins du SDK](/fr/plugins/sdk-subpaths)

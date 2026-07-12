---
read_when:
    - Mise à jour des schémas de protocole ou de la génération de code
summary: Schémas TypeBox comme source unique de vérité pour le protocole du Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T02:32:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox est une bibliothèque de schémas conçue en priorité pour TypeScript. OpenClaw l’utilise pour définir le **protocole WebSocket du Gateway** (négociation initiale, requêtes/réponses, événements du serveur). Ces schémas pilotent la **validation à l’exécution** (AJV), l’**export JSON Schema** et la **génération de code Swift** pour l’application macOS. Une seule source de vérité ; tout le reste est généré.

Pour découvrir le contexte général du protocole, commencez par [Architecture du Gateway](/fr/concepts/architecture).

## Modèle mental (30 secondes)

Chaque message WS du Gateway correspond à l’une de ces trois trames :

- **Requête** : `{ type: "req", id, method, params }`
- **Réponse** : `{ type: "res", id, ok, payload | error }`
- **Événement** : `{ type: "event", event, payload, seq?, stateVersion? }`

La première trame **doit** être une requête `connect`. Ensuite, les clients appellent des méthodes (par exemple `health`, `send`, `chat.send`) et s’abonnent à des événements (par exemple `presence`, `tick`, `agent`).

Flux de connexion (minimal) :

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Méthodes et événements courants :

| Catégorie  | Exemples                                                   | Remarques                                              |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Noyau      | `connect`, `health`, `status`                              | `connect` doit être appelé en premier                  |
| Messagerie | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | les méthodes à effets de bord exigent `idempotencyKey` |
| Discussion | `chat.history`, `chat.send`, `chat.abort`                  | WebChat les utilise                                    |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | administration des sessions                            |
| Automatisation | `wake`, `cron.list`, `cron.run`, `cron.runs`           | contrôle du réveil et de Cron                          |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | WS du Gateway et actions des Nodes                     |
| Événements | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | envoi spontané par le serveur                          |

L’inventaire de **découverte** de référence annoncé se trouve dans `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Emplacement des schémas

- Point d’exportation source : `packages/gateway-protocol/src/schema.ts` réexporte les modules de domaine sous `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` pour les enveloppes de premier niveau et la négociation initiale, `agent.ts`, `sessions.ts`, `cron.ts`, etc. selon le domaine fonctionnel). `protocol-schemas.ts` est le registre central `ProtocolSchemas` qui associe les noms de schémas à leurs définitions TypeBox.
- Validateurs à l’exécution (AJV) : `packages/gateway-protocol/src/index.ts`
- Registre des fonctionnalités et de découverte annoncées : `src/gateway/server-methods-list.ts`
- Négociation initiale du serveur et répartition des méthodes : `src/gateway/server.impl.ts`
- Client Node : `src/gateway/client.ts`
- JSON Schema généré : `dist/protocol.schema.json` (sortie de compilation, non suivie dans le dépôt)
- Modèles Swift générés : `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline actuel

- `pnpm protocol:gen` écrit le JSON Schema (draft-07) dans `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` génère les modèles Swift du Gateway.
- `pnpm protocol:check` exécute les deux générateurs et vérifie que la sortie Swift est enregistrée dans le dépôt (la sortie JSON Schema est un artefact de compilation ignoré par Git).

## Utilisation des schémas à l’exécution

- **Côté serveur** : chaque trame entrante est validée avec AJV. La négociation initiale n’accepte qu’une requête `connect` dont les paramètres correspondent à `ConnectParams`.
- **Côté client** : le client JS valide les trames d’événement et de réponse avant de les utiliser.
- **Découverte des fonctionnalités** : le Gateway envoie dans `hello-ok` une liste prudente `features.methods` et `features.events`, issue de `listGatewayMethods()` et de `GATEWAY_EVENTS`.
- Cette liste de découverte n’est pas un inventaire généré de tous les assistants appelables dans `coreGatewayHandlers` ; certains RPC auxiliaires sont implémentés dans `src/gateway/server-methods/*.ts` sans figurer dans la liste des fonctionnalités annoncées.

## Exemples de trames

Connexion (premier message) :

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Réponse Hello-ok :

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Requête et réponse :

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Événement :

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Client minimal (Node.js)

Flux utile le plus simple : connexion + état de santé.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Exemple détaillé : ajouter une méthode de bout en bout

Exemple : ajouter une nouvelle requête `system.echo` qui renvoie `{ ok: true, text }`.

1. **Schéma (source de vérité)**

Ajoutez ceci à `packages/gateway-protocol/src/schema/system.ts` (ou au module fonctionnel correspondant le mieux) :

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Importez les deux dans `packages/gateway-protocol/src/schema/protocol-schemas.ts`, ajoutez-les au registre `ProtocolSchemas` et exportez les types dérivés :

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

Dans `packages/gateway-protocol/src/index.ts`, exportez un validateur AJV :

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportement du serveur**

Ajoutez un gestionnaire dans `src/gateway/server-methods/system.ts` :

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Enregistrez-le dans `src/gateway/server-methods.ts` (qui fusionne déjà `systemHandlers`), puis ajoutez `"system.echo"` à l’entrée de `listGatewayMethods` dans `src/gateway/server-methods-list.ts`.

Si la méthode peut être appelée par des clients opérateur ou Node, classez-la également dans `src/gateway/method-scopes.ts` afin que l’application des portées et l’annonce des fonctionnalités dans `hello-ok` restent cohérentes.

4. **Régénération**

```bash
pnpm protocol:check
```

5. **Tests et documentation**

Ajoutez un test du serveur dans `src/gateway/server.*.test.ts` et mentionnez la méthode dans la documentation.

## Comportement de la génération de code Swift

Le générateur Swift produit :

- une énumération `GatewayFrame` avec les cas `req`, `res`, `event` et `unknown`
- des structures et énumérations de charges utiles fortement typées
- les valeurs `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` et `GATEWAY_MIN_PROTOCOL_VERSION`

Les types de trames inconnus sont conservés sous forme de charges utiles brutes pour assurer la compatibilité ascendante.

## Gestion des versions et compatibilité

- `PROTOCOL_VERSION` se trouve dans `packages/gateway-protocol/src/version.ts` (valeur actuelle : `4`).
- Les clients envoient `minProtocol` et `maxProtocol` ; le serveur rejette les plages qui n’incluent pas son protocole actuel.
- Les modèles Swift conservent les types de trames inconnus afin de ne pas rendre les anciens clients incompatibles.

## Modèles et conventions des schémas

- La plupart des objets utilisent `additionalProperties: false` pour imposer des charges utiles strictes.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) est utilisé par défaut pour les identifiants ainsi que les noms de méthodes et d’événements.
- Le `GatewayFrame` de premier niveau utilise un **discriminateur** sur `type`.
- Les méthodes ayant des effets de bord exigent généralement un `idempotencyKey` dans leurs paramètres (exemple : `send`, `poll`, `agent`, `chat.send`).
- `agent` accepte un paramètre facultatif `internalEvents` pour le contexte d’orchestration généré à l’exécution (par exemple, la transmission de l’achèvement d’une tâche d’un sous-agent ou de Cron) ; considérez-le comme une surface d’API interne.

## JSON du schéma actif

Le JSON Schema généré est un artefact de compilation qui n’est pas enregistré dans le dépôt. Le fichier brut publié est généralement disponible à l’adresse suivante :

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Lorsque vous modifiez les schémas

1. Mettez à jour les schémas TypeBox dans le module propriétaire `packages/gateway-protocol/src/schema/*.ts` et enregistrez-les dans `protocol-schemas.ts`.
2. Enregistrez la méthode ou l’événement dans `src/gateway/server-methods-list.ts`.
3. Mettez à jour `src/gateway/method-scopes.ts` lorsque le nouveau RPC nécessite une classification de portée pour l’opérateur ou le Node.
4. Exécutez `pnpm protocol:check`.
5. Enregistrez les modèles Swift régénérés dans le dépôt.

## Ressources connexes

- [Protocole de sortie enrichie](/fr/reference/rich-output-protocol)
- [Adaptateurs RPC](/fr/reference/rpc)

---
read_when:
    - Mettre à jour les schémas de protocole ou la génération de code
summary: Schémas TypeBox comme source unique de vérité pour le protocole Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T07:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox est une bibliothèque de schémas pensée d’abord pour TypeScript. Nous l’utilisons pour définir le **protocole WebSocket du Gateway** (handshake, requête/réponse, événements serveur). Ces schémas alimentent la **validation à l’exécution**, l’**export JSON Schema** et la **génération de code Swift** pour l’application macOS. Une seule source de vérité ; tout le reste est généré.

Si vous voulez le contexte de protocole de plus haut niveau, commencez par
[Architecture du Gateway](/fr/concepts/architecture).

## Modèle mental (30 secondes)

Chaque message WS du Gateway est l’une de trois trames :

- **Requête** : `{ type: "req", id, method, params }`
- **Réponse** : `{ type: "res", id, ok, payload | error }`
- **Événement** : `{ type: "event", event, payload, seq?, stateVersion? }`

La première trame **doit** être une requête `connect`. Ensuite, les clients peuvent appeler des méthodes (par exemple `health`, `send`, `chat.send`) et s’abonner à des événements (par exemple `presence`, `tick`, `agent`).

Flux de connexion (minimal) :

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Méthodes et événements courants :

| Catégorie  | Exemples                                                  | Notes                                      |
| ---------- | ---------------------------------------------------------- | ------------------------------------------ |
| Noyau      | `connect`, `health`, `status`                              | `connect` doit être en premier             |
| Messagerie | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | les effets de bord nécessitent `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat les utilise                        |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | administration des sessions                |
| Automatisation | `wake`, `cron.list`, `cron.run`, `cron.runs`           | réveil + contrôle cron                     |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | WS du Gateway + actions de node            |
| Événements | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push serveur                               |

L’inventaire de **discovery** annoncé faisant autorité se trouve dans
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Emplacement des schémas

- Source : `src/gateway/protocol/schema.ts`
- Validateurs d’exécution (AJV) : `src/gateway/protocol/index.ts`
- Registre des fonctionnalités/discovery annoncées : `src/gateway/server-methods-list.ts`
- Handshake serveur + distribution des méthodes : `src/gateway/server.impl.ts`
- Client Node : `src/gateway/client.ts`
- JSON Schema généré : `dist/protocol.schema.json`
- Modèles Swift générés : `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline actuel

- `pnpm protocol:gen`
  - écrit le JSON Schema (draft-07) dans `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - génère les modèles Swift du Gateway
- `pnpm protocol:check`
  - exécute les deux générateurs et vérifie que la sortie est commitée

## Utilisation des schémas à l’exécution

- **Côté serveur** : chaque trame entrante est validée avec AJV. Le handshake n’accepte qu’une requête `connect` dont les paramètres correspondent à `ConnectParams`.
- **Côté client** : le client JS valide les trames d’événement et de réponse avant de les utiliser.
- **Discovery des fonctionnalités** : le Gateway envoie une liste prudente `features.methods` et `features.events` dans `hello-ok` depuis `listGatewayMethods()` et `GATEWAY_EVENTS`.
- Cette liste de discovery n’est pas un export généré de chaque helper appelable dans `coreGatewayHandlers` ; certains RPC helpers sont implémentés dans `src/gateway/server-methods/*.ts` sans être énumérés dans la liste des fonctionnalités annoncées.

## Exemples de trames

Connect (premier message) :

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Réponse hello-ok :

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Requête + réponse :

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

Flux utile le plus petit : connexion + health.

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
        minProtocol: 3,
        maxProtocol: 3,
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

## Exemple guidé : ajouter une méthode de bout en bout

Exemple : ajouter une nouvelle requête `system.echo` qui renvoie `{ ok: true, text }`.

1. **Schéma (source de vérité)**

Ajoutez dans `src/gateway/protocol/schema.ts` :

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

Ajoutez les deux à `ProtocolSchemas` et exportez les types :

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

Dans `src/gateway/protocol/index.ts`, exportez un validateur AJV :

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportement serveur**

Ajoutez un handler dans `src/gateway/server-methods/system.ts` :

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Enregistrez-le dans `src/gateway/server-methods.ts` (fusionne déjà `systemHandlers`),
puis ajoutez `"system.echo"` à l’entrée de `listGatewayMethods` dans
`src/gateway/server-methods-list.ts`.

Si la méthode est appelable par des clients opérateur ou node, classez-la aussi dans
`src/gateway/method-scopes.ts` afin que l’application des scopes et l’annonce des fonctionnalités dans `hello-ok` restent alignées.

4. **Régénérer**

```bash
pnpm protocol:check
```

5. **Tests + docs**

Ajoutez un test serveur dans `src/gateway/server.*.test.ts` et mentionnez la méthode dans la documentation.

## Comportement de génération de code Swift

Le générateur Swift émet :

- l’enum `GatewayFrame` avec les cas `req`, `res`, `event` et `unknown`
- des structs/enums de payload fortement typés
- les valeurs `ErrorCode` et `GATEWAY_PROTOCOL_VERSION`

Les types de trames inconnus sont conservés comme payloads bruts pour la compatibilité ascendante.

## Versionnement + compatibilité

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les modèles Swift conservent les types de trames inconnus pour éviter de casser les anciens clients.

## Motifs et conventions de schéma

- La plupart des objets utilisent `additionalProperties: false` pour des payloads stricts.
- `NonEmptyString` est la valeur par défaut pour les ID et les noms de méthodes/événements.
- Le `GatewayFrame` de premier niveau utilise un **discriminator** sur `type`.
- Les méthodes avec effets de bord nécessitent généralement un `idempotencyKey` dans les paramètres
  (exemple : `send`, `poll`, `agent`, `chat.send`).
- `agent` accepte `internalEvents` en option pour le contexte d’orchestration généré à l’exécution
  (par exemple transfert après fin de tâche subagent/cron) ; traitez ceci comme une surface d’API interne.

## JSON de schéma en direct

Le JSON Schema généré se trouve dans le dépôt à `dist/protocol.schema.json`. Le fichier brut publié est généralement disponible à l’adresse :

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quand vous modifiez des schémas

1. Mettez à jour les schémas TypeBox.
2. Enregistrez la méthode/l’événement dans `src/gateway/server-methods-list.ts`.
3. Mettez à jour `src/gateway/method-scopes.ts` lorsque le nouveau RPC nécessite une classification de scope opérateur ou node.
4. Exécutez `pnpm protocol:check`.
5. Commitez le schéma régénéré + les modèles Swift.

## Connexe

- [Protocole de sortie riche](/fr/reference/rich-output-protocol)
- [Adaptateurs RPC](/fr/reference/rpc)

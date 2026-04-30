---
read_when:
    - Vous créez une application externe, un script, un tableau de bord, une tâche CI ou une extension d’IDE qui communique avec OpenClaw
    - Vous choisissez entre l’App SDK et le Plugin SDK
    - Vous intégrez des exécutions d’agents, sessions, événements, approbations, modèles ou outils du Gateway
sidebarTitle: App SDK
summary: SDK public d’application OpenClaw pour les applications externes, les scripts, les tableaux de bord, les tâches CI et les extensions d’IDE
title: SDK d’application OpenClaw
x-i18n:
    generated_at: "2026-04-30T07:22:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Le **SDK d’applications OpenClaw** est l’API client publique pour les applications en dehors du
processus OpenClaw. Utilisez `@openclaw/sdk` lorsqu’un script, un tableau de bord, une tâche CI, une
extension d’IDE ou une autre application externe veut se connecter au Gateway, démarrer des
exécutions d’agents, diffuser des événements, attendre des résultats, annuler du travail ou inspecter les
ressources du Gateway.

<Note>
  Le SDK d’applications est différent du [Plugin SDK](/fr/plugins/sdk-overview).
  `@openclaw/sdk` communique avec le Gateway depuis l’extérieur d’OpenClaw.
  `openclaw/plugin-sdk/*` est réservé aux plugins qui s’exécutent dans OpenClaw et
  enregistrent des fournisseurs, des canaux, des outils, des hooks ou des environnements d’exécution de confiance.
</Note>

## Ce qui est livré aujourd’hui

`@openclaw/sdk` est livré avec :

| Surface                   | État    | Ce qu’elle fait                                                            |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Prêt    | Point d’entrée principal du client. Possède le transport, la connexion, les requêtes et les événements. |
| `GatewayClientTransport`  | Prêt    | Transport WebSocket adossé au client Gateway.                              |
| `oc.agents`               | Prêt    | Liste, crée, met à jour, supprime et obtient des handles d’agent.          |
| `Agent.run()`             | Prêt    | Démarre une exécution Gateway `agent` et renvoie un `Run`.                 |
| `oc.runs`                 | Prêt    | Crée, obtient, attend, annule et diffuse des exécutions.                   |
| `Run.events()`            | Prêt    | Diffuse des événements normalisés par exécution avec relecture pour les exécutions rapides. |
| `Run.wait()`              | Prêt    | Appelle `agent.wait` et renvoie un `RunResult` stable.                     |
| `Run.cancel()`            | Prêt    | Appelle `sessions.abort` par identifiant d’exécution, avec la clé de session lorsqu’elle est disponible. |
| `oc.sessions`             | Prêt    | Crée, résout, envoie vers, corrige, compacte et obtient des handles de session. |
| `Session.send()`          | Prêt    | Appelle `sessions.send` et renvoie un `Run`.                               |
| `oc.models`               | Prêt    | Appelle `models.list` et le RPC d’état `models.authStatus` actuel.         |
| `oc.tools`                | Partiel | Liste le catalogue d’outils et les outils effectifs ; l’invocation directe d’outils n’est pas câblée. |
| `oc.approvals`            | Prêt    | Liste et résout les approbations d’exécution via les RPC d’approbation du Gateway. |
| `oc.rawEvents()`          | Prêt    | Expose les événements Gateway bruts pour les consommateurs avancés.        |
| `normalizeGatewayEvent()` | Prêt    | Convertit les événements Gateway bruts dans la forme d’événement stable du SDK. |

Le SDK exporte aussi les types de base utilisés par ces surfaces :
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` et les types de résultats associés.

## Se connecter à un Gateway

Créez un client avec une URL Gateway explicite, ou injectez un transport personnalisé pour
les tests et les environnements d’exécution d’applications intégrées.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` est équivalent à `url`. L’option
`gateway: "auto"` est acceptée par le constructeur, mais la découverte automatique du Gateway
n’est pas encore une fonctionnalité distincte du SDK ; passez `url` lorsque l’application ne sait pas
déjà comment découvrir le Gateway.

Pour les tests, passez un objet qui implémente `OpenClawTransport` :

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Exécuter un agent

Utilisez `oc.agents.get(id)` lorsque l’application veut un handle d’agent, puis appelez
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Les références de modèles qualifiées par fournisseur comme `openai/gpt-5.5` sont séparées en
remplacements Gateway `provider` et `model`. `timeoutMs` reste en millisecondes dans le SDK et
est converti en secondes de délai Gateway pour le RPC `agent`.

`run.wait()` utilise le RPC Gateway `agent.wait`. Une échéance d’attente qui expire
pendant que l’exécution est encore active renvoie `status: "accepted"` au lieu de faire comme si
l’exécution elle-même avait expiré. Les délais d’exécution, les exécutions interrompues et les exécutions annulées sont
normalisés en `timed_out` ou `cancelled`.

## Créer et réutiliser des sessions

Utilisez des sessions lorsque l’application veut un état de transcription durable.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` appelle `sessions.send` et renvoie un `Run`. Les handles de session prennent aussi
en charge :

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Diffuser des événements

Le SDK normalise les événements Gateway bruts dans une enveloppe `OpenClawEvent` stable :

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

Les types d’événements courants incluent :

| Type d’événement       | Événement Gateway source                    |
| ---------------------- | ------------------------------------------- |
| `run.started`          | Début du cycle de vie `agent`               |
| `run.completed`        | Fin du cycle de vie `agent`                 |
| `run.failed`           | Erreur du cycle de vie `agent`              |
| `run.cancelled`        | Fin de cycle de vie interrompue/annulée     |
| `run.timed_out`        | Fin de cycle de vie par délai expiré        |
| `assistant.delta`      | Delta de diffusion de l’assistant           |
| `assistant.message`    | Message de l’assistant                      |
| `thinking.delta`       | Flux de réflexion ou de plan                |
| `tool.call.started`    | Début d’outil/d’élément/de commande         |
| `tool.call.delta`      | Mise à jour d’outil/d’élément/de commande   |
| `tool.call.completed`  | Achèvement d’outil/d’élément/de commande    |
| `tool.call.failed`     | Échec ou état bloqué d’outil/d’élément/de commande |
| `approval.requested`   | Demande d’approbation d’exécution ou de Plugin |
| `approval.resolved`    | Résolution d’approbation d’exécution ou de Plugin |
| `session.created`      | Création `sessions.changed`                 |
| `session.updated`      | Mise à jour `sessions.changed`              |
| `session.compacted`    | Compaction `sessions.changed`               |
| `task.updated`         | Événements de mise à jour de tâche          |
| `artifact.updated`     | Événements de flux de patch                 |
| `raw`                  | Tout événement sans mappage SDK stable pour l’instant |

`Run.events()` filtre les événements sur un seul identifiant d’exécution et relit les événements déjà vus pour
les exécutions rapides. Cela signifie que le flux documenté est sûr :

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Pour les flux à l’échelle de l’application, utilisez `oc.events()`. Pour les trames Gateway brutes, utilisez
`oc.rawEvents()`.

## Modèles, outils et approbations

Les assistants de modèles correspondent aux méthodes Gateway actuelles :

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Les assistants d’outils exposent le catalogue Gateway et la vue des outils effectifs :

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Les assistants d’approbation utilisent les RPC d’approbation d’exécution :

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Explicitement non pris en charge aujourd’hui

Le SDK inclut des noms pour le modèle produit que nous voulons, mais il ne fait pas semblant silencieusement
que des RPC Gateway existent. Ces appels lèvent actuellement des erreurs explicites de non-prise en charge :

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Les champs par exécution `workspace`, `runtime`, `environment` et `approvals` sont typés
comme forme future, mais le Gateway actuel ne prend pas en charge ces remplacements sur
le RPC `agent`. Si les appelants les passent, le SDK lève une erreur avant de soumettre l’exécution
afin que le travail ne s’exécute pas accidentellement avec le comportement par défaut de l’espace de travail, de l’environnement d’exécution,
de l’environnement ou de l’approbation.

## SDK d’applications ou Plugin SDK

Utilisez le SDK d’applications lorsque le code vit en dehors d’OpenClaw :

- scripts Node qui démarrent ou observent des exécutions d’agents
- tâches CI qui appellent un Gateway
- tableaux de bord et panneaux d’administration
- extensions d’IDE
- ponts externes qui n’ont pas besoin de devenir des Plugins de canaux
- tests d’intégration avec des transports Gateway factices ou réels

Utilisez le Plugin SDK lorsque le code s’exécute dans OpenClaw :

- Plugins de fournisseurs
- Plugins de canaux
- hooks d’outils ou de cycle de vie
- Plugins de harnais d’agent
- assistants d’environnement d’exécution de confiance

Le code du SDK d’applications doit importer depuis `@openclaw/sdk`. Le code de Plugin doit importer depuis
les sous-chemins documentés `openclaw/plugin-sdk/*`. Ne mélangez pas les deux contrats.

## Documentation associée

- [Conception de l’API du SDK d’applications OpenClaw](/fr/reference/openclaw-sdk-api-design)
- [Référence RPC du Gateway](/fr/reference/rpc)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes)
- [Sessions](/fr/concepts/session)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)

---
read_when:
    - Vous développez une application externe, un script, un tableau de bord, une tâche CI ou une extension d’IDE qui communique avec OpenClaw
    - Vous choisissez entre le SDK d’application et le SDK de Plugin
    - Vous intégrez des exécutions d’agent Gateway, des sessions, des événements, des approbations, des modèles ou des outils
sidebarTitle: App SDK
summary: SDK public d’application OpenClaw pour les applications externes, les scripts, les tableaux de bord, les tâches CI et les extensions d’IDE
title: SDK d’application OpenClaw
x-i18n:
    generated_at: "2026-05-01T07:14:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Le **SDK d’application OpenClaw** est l’API cliente publique pour les applications hors du
processus OpenClaw. Utilisez `@openclaw/sdk` lorsqu’un script, un tableau de bord, une tâche CI, une extension IDE
ou une autre application externe veut se connecter au Gateway, démarrer des
exécutions d’agents, diffuser des événements en continu, attendre des résultats, annuler du travail ou inspecter les
ressources du Gateway.

<Note>
  Le SDK d’application est différent du [SDK de Plugin](/fr/plugins/sdk-overview).
  `@openclaw/sdk` communique avec le Gateway depuis l’extérieur d’OpenClaw.
  `openclaw/plugin-sdk/*` est réservé aux plugins qui s’exécutent dans OpenClaw et
  enregistrent des fournisseurs, des canaux, des outils, des hooks ou des runtimes approuvés.
</Note>

## Ce Qui Est Livré Aujourd’hui

`@openclaw/sdk` est livré avec :

| Surface                   | Statut  | Ce qu’elle fait                                                                 |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Prêt   | Point d’entrée principal du client. Possède le transport, la connexion, les requêtes et les événements.   |
| `GatewayClientTransport`  | Prêt   | Transport WebSocket adossé au client Gateway.                            |
| `oc.agents`               | Prêt   | Liste, crée, met à jour, supprime et obtient des handles d’agents.                    |
| `Agent.run()`             | Prêt   | Démarre une exécution Gateway `agent` et renvoie un `Run`.                            |
| `oc.runs`                 | Prêt   | Crée, obtient, attend, annule et diffuse les exécutions.                         |
| `Run.events()`            | Prêt   | Diffuse des événements normalisés par exécution avec relecture pour les exécutions rapides.                 |
| `Run.wait()`              | Prêt   | Appelle `agent.wait` et renvoie un `RunResult` stable.                         |
| `Run.cancel()`            | Prêt   | Appelle `sessions.abort` par identifiant d’exécution, avec la clé de session lorsqu’elle est disponible.           |
| `oc.sessions`             | Prêt   | Crée, résout, envoie vers, corrige, compacte et obtient des handles de session.    |
| `Session.send()`          | Prêt   | Appelle `sessions.send` et renvoie un `Run`.                                   |
| `oc.models`               | Prêt   | Appelle `models.list` et le RPC d’état `models.authStatus` actuel.          |
| `oc.tools`                | Partiel | Liste le catalogue d’outils et les outils effectifs ; l’invocation directe d’outils n’est pas câblée. |
| `oc.artifacts`            | Prêt   | Liste, obtient et télécharge les artefacts de transcription du Gateway.                     |
| `oc.approvals`            | Prêt   | Liste et résout les approbations exec via les RPC d’approbation du Gateway.             |
| `oc.rawEvents()`          | Prêt   | Expose les événements Gateway bruts pour les consommateurs avancés.                           |
| `normalizeGatewayEvent()` | Prêt   | Convertit les événements Gateway bruts en forme d’événement SDK stable.                 |

Le SDK exporte aussi les types principaux utilisés par ces surfaces :
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, ainsi que les types
de résultats associés.

## Se Connecter À Un Gateway

Créez un client avec une URL Gateway explicite, ou injectez un transport personnalisé pour
les tests et les runtimes d’applications embarquées.

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
n’est pas encore une fonctionnalité SDK distincte ; passez `url` lorsque l’application ne sait pas
déjà découvrir le Gateway.

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

## Exécuter Un Agent

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

Les références de modèles qualifiées par fournisseur comme `openai/gpt-5.5` sont divisées en surcharges Gateway
`provider` et `model`. `timeoutMs` reste en millisecondes dans le SDK et
est converti en secondes de délai d’expiration Gateway pour le RPC `agent`.

`run.wait()` utilise le RPC Gateway `agent.wait`. Une échéance d’attente qui expire
alors que l’exécution est encore active renvoie `status: "accepted"` au lieu de prétendre
que l’exécution elle-même a expiré. Les délais d’expiration du runtime, les exécutions interrompues et les exécutions annulées sont
normalisés en `timed_out` ou `cancelled`.

## Créer Et Réutiliser Des Sessions

Utilisez les sessions lorsque l’application veut un état de transcription durable.

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

## Diffuser Les Événements En Continu

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

| Type d’événement            | Événement Gateway source                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | Début du cycle de vie `agent`                     |
| `run.completed`       | Fin du cycle de vie `agent`                       |
| `run.failed`          | Erreur du cycle de vie `agent`                     |
| `run.cancelled`       | Fin du cycle de vie interrompue/annulée             |
| `run.timed_out`       | Fin du cycle de vie par délai d’expiration                       |
| `assistant.delta`     | Delta de diffusion en continu de l’assistant                   |
| `assistant.message`   | Message de l’assistant                           |
| `thinking.delta`      | Flux de raisonnement ou de plan                     |
| `tool.call.started`   | Début d’outil/élément/commande                     |
| `tool.call.delta`     | Mise à jour d’outil/élément/commande                    |
| `tool.call.completed` | Achèvement d’outil/élément/commande                |
| `tool.call.failed`    | Échec d’outil/élément/commande ou statut bloqué |
| `approval.requested`  | Demande d’approbation exec ou de plugin             |
| `approval.resolved`   | Résolution d’approbation exec ou de plugin          |
| `session.created`     | Création `sessions.changed`                   |
| `session.updated`     | Mise à jour `sessions.changed`                   |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Événements de mise à jour de tâche                          |
| `artifact.updated`    | Événements de flux de patch                         |
| `raw`                 | Tout événement sans mappage SDK stable pour le moment  |

`Run.events()` filtre les événements sur un identifiant d’exécution et relit les événements déjà vus pour
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

## Modèles, Outils, Artefacts Et Approbations

Les helpers de modèles correspondent aux méthodes Gateway actuelles :

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Les helpers d’outils exposent le catalogue Gateway et la vue des outils effectifs :

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Les helpers d’artefacts exposent la projection d’artefacts Gateway pour le contexte de session, d’exécution ou
de tâche. Chaque appel exige une portée explicite `sessionKey`, `runId` ou
`taskId` :

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Les helpers d’approbation utilisent les RPC d’approbation exec :

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Explicitement Non Pris En Charge Aujourd’hui

Le SDK inclut des noms pour le modèle produit que nous voulons, mais il ne fait pas semblant silencieusement
que des RPC Gateway existent. Ces appels lèvent actuellement des erreurs explicites
de non-prise en charge :

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Les champs par exécution `workspace`, `runtime`, `environment` et `approvals` sont typés
comme une forme future, mais le Gateway actuel ne prend pas en charge ces surcharges sur
le RPC `agent`. Si les appelants les transmettent, le SDK lève une erreur avant de soumettre l’exécution
afin que le travail ne s’exécute pas accidentellement avec le comportement par défaut de workspace, runtime,
environnement ou approbation.

## SDK D’application Et SDK De Plugin

Utilisez le SDK d’application lorsque le code vit hors d’OpenClaw :

- scripts Node qui démarrent ou observent des exécutions d’agents
- tâches CI qui appellent un Gateway
- tableaux de bord et panneaux d’administration
- extensions IDE
- ponts externes qui n’ont pas besoin de devenir des plugins de canal
- tests d’intégration avec des transports Gateway factices ou réels

Utilisez le SDK de Plugin lorsque le code s’exécute dans OpenClaw :

- plugins de fournisseurs
- plugins de canal
- hooks d’outil ou de cycle de vie
- plugins de harnais d’agent
- helpers de runtime approuvés

Le code du SDK d’application doit importer depuis `@openclaw/sdk`. Le code de Plugin doit importer depuis
les sous-chemins documentés `openclaw/plugin-sdk/*`. Ne mélangez pas les deux contrats.

## Docs Associées

- [Conception de l’API du SDK d’application OpenClaw](/fr/reference/openclaw-sdk-api-design)
- [Référence RPC du Gateway](/fr/reference/rpc)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Sessions](/fr/concepts/session)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)

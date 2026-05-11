---
read_when:
    - Vous créez une application externe, un script, un tableau de bord, une tâche CI ou une extension d’IDE qui communique avec OpenClaw
    - Vous choisissez entre le SDK d’application et le SDK de Plugin
    - Vous intégrez des exécutions d’agent Gateway, des sessions, des événements, des approbations, des modèles ou des outils
sidebarTitle: App SDK
summary: SDK public d’application OpenClaw pour les applications externes, les scripts, les tableaux de bord, les tâches CI et les extensions d’IDE
title: SDK d’application OpenClaw
x-i18n:
    generated_at: "2026-05-11T20:33:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Le **SDK d’application OpenClaw** est l’API cliente publique pour les applications en dehors du
processus OpenClaw. Utilisez `@openclaw/sdk` lorsqu’un script, un tableau de bord, une tâche CI, une extension IDE
ou une autre application externe veut se connecter au Gateway, démarrer des exécutions d’agent,
diffuser des événements en continu, attendre des résultats, annuler du travail ou inspecter les
ressources du Gateway.

<Note>
  Le SDK d’application est différent du [SDK Plugin](/fr/plugins/sdk-overview).
  `@openclaw/sdk` communique avec le Gateway depuis l’extérieur d’OpenClaw.
  `openclaw/plugin-sdk/*` est réservé aux plugins qui s’exécutent dans OpenClaw et
  enregistrent des fournisseurs, des canaux, des outils, des hooks ou des environnements d’exécution de confiance.
</Note>

## Ce qui est livré aujourd’hui

`@openclaw/sdk` est livré avec :

| Surface                   | État    | Ce que cela fait                                                                 |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Prêt    | Point d’entrée principal du client. Gère le transport, la connexion, les requêtes et les événements. |
| `GatewayClientTransport`  | Prêt    | Transport WebSocket adossé au client Gateway.                                    |
| `oc.agents`               | Prêt    | Liste, crée, met à jour, supprime et obtient des handles d’agent.                |
| `Agent.run()`             | Prêt    | Démarre une exécution Gateway `agent` et renvoie un `Run`.                       |
| `oc.runs`                 | Prêt    | Crée, obtient, attend, annule et diffuse des exécutions en continu.              |
| `Run.events()`            | Prêt    | Diffuse des événements normalisés par exécution avec relecture pour les exécutions rapides. |
| `Run.wait()`              | Prêt    | Appelle `agent.wait` et renvoie un `RunResult` stable.                           |
| `Run.cancel()`            | Prêt    | Appelle `sessions.abort` par identifiant d’exécution, avec la clé de session lorsqu’elle est disponible. |
| `oc.sessions`             | Prêt    | Crée, résout, envoie vers, corrige, compacte et obtient des handles de session.  |
| `Session.send()`          | Prêt    | Appelle `sessions.send` et renvoie un `Run`.                                     |
| `oc.tasks`                | Prêt    | Liste, lit et annule les entrées du registre des tâches Gateway.                 |
| `oc.models`               | Prêt    | Appelle `models.list` et le RPC d’état `models.authStatus` actuel.               |
| `oc.tools`                | Prêt    | Liste, définit la portée et invoque les outils Gateway via le pipeline de politique. |
| `oc.artifacts`            | Prêt    | Liste, obtient et télécharge les artefacts de transcription Gateway.             |
| `oc.approvals`            | Prêt    | Liste et résout les approbations d’exécution via les RPC d’approbation Gateway.  |
| `oc.environments`         | Partiel | Liste les candidats d’environnement locaux au Gateway et de nœud ; la création/suppression n’est pas câblée. |
| `oc.rawEvents()`          | Prêt    | Expose les événements Gateway bruts pour les consommateurs avancés.              |
| `normalizeGatewayEvent()` | Prêt    | Convertit les événements Gateway bruts vers la forme d’événement stable du SDK.  |

Le SDK exporte aussi les types principaux utilisés par ces surfaces :
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, ainsi que les types de
résultat associés.

## Se connecter à un Gateway

Créez un client avec une URL Gateway explicite, ou injectez un transport personnalisé pour
les tests et les environnements d’exécution d’applications embarquées.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` est équivalent à `url`. L’option
`gateway: "auto"` est acceptée par le constructeur, mais la découverte automatique du Gateway
n’est pas encore une fonctionnalité SDK distincte ; transmettez `url` lorsque l’application ne
sait pas déjà comment découvrir le Gateway.

Pour les tests, transmettez un objet qui implémente `OpenClawTransport` :

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

Les références de modèle qualifiées par fournisseur, comme `openai/gpt-5.5`, sont séparées en
remplacements Gateway `provider` et `model`. `timeoutMs` reste en millisecondes dans le SDK et
est converti en secondes de délai d’expiration Gateway pour le RPC `agent`.

`run.wait()` utilise le RPC Gateway `agent.wait`. Une échéance d’attente qui expire
alors que l’exécution est toujours active renvoie `status: "accepted"` au lieu de prétendre
que l’exécution elle-même a expiré. Les expirations d’environnement d’exécution, les exécutions abandonnées et les exécutions annulées sont
normalisées en `timed_out` ou `cancelled`.

## Créer et réutiliser des sessions

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

## Diffuser des événements en continu

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

| Type d’événement      | Événement Gateway source                    |
| --------------------- | ------------------------------------------- |
| `run.started`         | Début du cycle de vie `agent`               |
| `run.completed`       | Fin du cycle de vie `agent`                 |
| `run.failed`          | Erreur du cycle de vie `agent`              |
| `run.cancelled`       | Fin de cycle de vie abandonnée/annulée      |
| `run.timed_out`       | Fin de cycle de vie par expiration          |
| `assistant.delta`     | Delta de diffusion en continu de l’assistant |
| `assistant.message`   | Message de l’assistant                      |
| `thinking.delta`      | Flux de réflexion ou de plan                |
| `tool.call.started`   | Début d’outil/élément/commande              |
| `tool.call.delta`     | Mise à jour d’outil/élément/commande        |
| `tool.call.completed` | Achèvement d’outil/élément/commande         |
| `tool.call.failed`    | Échec d’outil/élément/commande ou état bloqué |
| `approval.requested`  | Demande d’approbation d’exécution ou de plugin |
| `approval.resolved`   | Résolution d’approbation d’exécution ou de plugin |
| `session.created`     | Création `sessions.changed`                 |
| `session.updated`     | Mise à jour `sessions.changed`              |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Événements de mise à jour de tâche          |
| `artifact.updated`    | Événements de flux de patch                 |
| `raw`                 | Tout événement sans mappage SDK stable pour l’instant |

`Run.events()` filtre les événements vers un identifiant d’exécution et relit les événements déjà vus pour
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

## Modèles, outils, artefacts et approbations

Les helpers de modèle correspondent aux méthodes Gateway actuelles :

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Les helpers d’outil exposent le catalogue Gateway, la vue effective des outils et l’invocation directe
d’outil Gateway. `oc.tools.invoke()` renvoie une enveloppe typée au lieu de
lever une exception en cas de refus par politique ou approbation.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Les helpers d’artefact exposent la projection d’artefact Gateway pour un contexte de session, d’exécution ou de
tâche. Chaque appel nécessite une portée explicite `sessionKey`, `runId` ou
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

Les helpers d’approbation utilisent les RPC d’approbation d’exécution :

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Les helpers de tâche utilisent le registre durable des tâches qui alimente aussi `openclaw tasks` :

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Les helpers d’environnement exposent la découverte locale au Gateway et de nœud en lecture seule :

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Explicitement non pris en charge aujourd’hui

Le SDK inclut des noms pour le modèle de produit que nous voulons, mais il ne
fait pas semblant silencieusement que les RPC Gateway existent. Ces appels lèvent actuellement des
erreurs explicites de non-prise en charge :

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Les champs par exécution `workspace`, `runtime`, `environment` et `approvals` sont typés
comme forme future, mais le Gateway actuel ne prend pas en charge ces remplacements sur
le RPC `agent`. Si les appelants les transmettent, le SDK lève une exception avant de soumettre l’exécution
afin que le travail ne s’exécute pas accidentellement avec le comportement par défaut d’espace de travail, d’environnement d’exécution,
d’environnement ou d’approbation.

## SDK d’application vs SDK Plugin

Utilisez le SDK d’application lorsque le code vit en dehors d’OpenClaw :

- scripts Node qui démarrent ou observent des exécutions d’agent
- tâches CI qui appellent un Gateway
- tableaux de bord et panneaux d’administration
- extensions IDE
- ponts externes qui n’ont pas besoin de devenir des plugins de canal
- tests d’intégration avec de faux ou vrais transports Gateway

Utilisez le SDK Plugin lorsque le code s’exécute dans OpenClaw :

- plugins de fournisseur
- plugins de canal
- hooks d’outil ou de cycle de vie
- plugins de harnais d’agent
- helpers d’environnement d’exécution de confiance

Le code du SDK d’application doit importer depuis `@openclaw/sdk`. Le code de Plugin doit importer depuis
les sous-chemins documentés `openclaw/plugin-sdk/*`. Ne mélangez pas les deux contrats.

## Associé

- [Conception de l’API du SDK d’application OpenClaw](/fr/reference/openclaw-sdk-api-design)
- [Référence RPC du Gateway](/fr/reference/rpc)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Sessions](/fr/concepts/session)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)

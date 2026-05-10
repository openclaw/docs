---
read_when:
    - Você está criando um aplicativo externo, script, dashboard, job de CI ou extensão de IDE que se comunica com o OpenClaw
    - Você está escolhendo entre o App SDK e o Plugin SDK
    - Você está integrando com execuções de agente, sessões, eventos, aprovações, modelos ou ferramentas do Gateway
sidebarTitle: App SDK
summary: SDK público do OpenClaw App para aplicativos externos, scripts, dashboards, jobs de CI e extensões de IDE
title: SDK de Aplicativo do OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

A **OpenClaw App SDK** é a API pública de cliente para apps fora do
processo do OpenClaw. Use `@openclaw/sdk` quando um script, dashboard, tarefa de CI, extensão de IDE
ou outro app externo quiser se conectar ao Gateway, iniciar execuções de agentes,
transmitir eventos, aguardar resultados, cancelar trabalho ou inspecionar recursos do Gateway.

<Note>
  A App SDK é diferente da [Plugin SDK](/pt-BR/plugins/sdk-overview).
  `@openclaw/sdk` se comunica com o Gateway de fora do OpenClaw.
  `openclaw/plugin-sdk/*` é apenas para plugins que rodam dentro do OpenClaw e
  registram provedores, canais, ferramentas, hooks ou runtimes confiáveis.
</Note>

## O que está disponível hoje

`@openclaw/sdk` inclui:

| Superfície                | Status  | O que ela faz                                                                    |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Pronto  | Ponto de entrada principal do cliente. Gerencia transporte, conexão, requisições e eventos. |
| `GatewayClientTransport`  | Pronto  | Transporte WebSocket apoiado pelo cliente do Gateway.                            |
| `oc.agents`               | Pronto  | Lista, cria, atualiza, exclui e obtém handles de agente.                         |
| `Agent.run()`             | Pronto  | Inicia uma execução `agent` do Gateway e retorna um `Run`.                       |
| `oc.runs`                 | Pronto  | Cria, obtém, aguarda, cancela e transmite execuções.                             |
| `Run.events()`            | Pronto  | Transmite eventos normalizados por execução com replay para execuções rápidas.   |
| `Run.wait()`              | Pronto  | Chama `agent.wait` e retorna um `RunResult` estável.                             |
| `Run.cancel()`            | Pronto  | Chama `sessions.abort` pelo id da execução, com chave de sessão quando disponível. |
| `oc.sessions`             | Pronto  | Cria, resolve, envia para, aplica patches, compacta e obtém handles de sessão.   |
| `Session.send()`          | Pronto  | Chama `sessions.send` e retorna um `Run`.                                        |
| `oc.tasks`                | Pronto  | Lista, lê e cancela entradas do ledger de tarefas do Gateway.                    |
| `oc.models`               | Pronto  | Chama `models.list` e o RPC de status atual `models.authStatus`.                 |
| `oc.tools`                | Pronto  | Lista, escopa e invoca ferramentas do Gateway por meio do pipeline de políticas. |
| `oc.artifacts`            | Pronto  | Lista, obtém e baixa artefatos de transcrição do Gateway.                        |
| `oc.approvals`            | Pronto  | Lista e resolve aprovações de exec por meio de RPCs de aprovação do Gateway.     |
| `oc.environments`         | Parcial | Lista candidatos de ambiente locais ao Gateway e de nó; criação/exclusão não estão conectadas. |
| `oc.rawEvents()`          | Pronto  | Expõe eventos brutos do Gateway para consumidores avançados.                     |
| `normalizeGatewayEvent()` | Pronto  | Converte eventos brutos do Gateway para o formato de evento estável da SDK.      |

A SDK também exporta os tipos principais usados por essas superfícies:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` e tipos de
resultado relacionados.

## Conectar a um Gateway

Crie um cliente com uma URL explícita do Gateway, ou injete um transporte customizado para
testes e runtimes de apps incorporados.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` é equivalente a `url`. A opção
`gateway: "auto"` é aceita pelo construtor, mas a descoberta automática de Gateway
ainda não é um recurso separado da SDK; passe `url` quando o app ainda não souber
como descobrir o Gateway.

Para testes, passe um objeto que implemente `OpenClawTransport`:

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

## Executar um agente

Use `oc.agents.get(id)` quando o app quiser um handle de agente e então chame
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

Referências de modelo qualificadas por provedor, como `openai/gpt-5.5`, são divididas em substituições
`provider` e `model` do Gateway. `timeoutMs` permanece em milissegundos na SDK e
é convertido para segundos de timeout do Gateway para o RPC `agent`.

`run.wait()` usa o RPC `agent.wait` do Gateway. Um prazo de espera que expira
enquanto a execução ainda está ativa retorna `status: "accepted"` em vez de fingir
que a própria execução atingiu timeout. Timeouts de runtime, execuções abortadas e execuções canceladas são
normalizados para `timed_out` ou `cancelled`.

## Criar e reutilizar sessões

Use sessões quando o app quiser estado durável de transcrição.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` chama `sessions.send` e retorna um `Run`. Handles de sessão também
oferecem suporte a:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Transmitir eventos

A SDK normaliza eventos brutos do Gateway em um envelope `OpenClawEvent` estável:

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

Tipos de eventos comuns incluem:

| Tipo de evento        | Evento de origem do Gateway                  |
| --------------------- | ------------------------------------------- |
| `run.started`         | Início do ciclo de vida de `agent`          |
| `run.completed`       | Fim do ciclo de vida de `agent`             |
| `run.failed`          | Erro do ciclo de vida de `agent`            |
| `run.cancelled`       | Fim de ciclo de vida abortado/cancelado     |
| `run.timed_out`       | Fim de ciclo de vida por timeout            |
| `assistant.delta`     | Delta de streaming do assistente            |
| `assistant.message`   | Mensagem do assistente                      |
| `thinking.delta`      | Fluxo de pensamento ou plano                |
| `tool.call.started`   | Início de ferramenta/item/comando           |
| `tool.call.delta`     | Atualização de ferramenta/item/comando      |
| `tool.call.completed` | Conclusão de ferramenta/item/comando        |
| `tool.call.failed`    | Falha ou status bloqueado de ferramenta/item/comando |
| `approval.requested`  | Solicitação de aprovação de exec ou plugin  |
| `approval.resolved`   | Resolução de aprovação de exec ou plugin    |
| `session.created`     | Criação de `sessions.changed`               |
| `session.updated`     | Atualização de `sessions.changed`           |
| `session.compacted`   | Compaction de `sessions.changed`            |
| `task.updated`        | Eventos de atualização de tarefa            |
| `artifact.updated`    | Eventos de fluxo de patch                   |
| `raw`                 | Qualquer evento ainda sem mapeamento estável da SDK |

`Run.events()` filtra eventos para um id de execução e reproduz eventos já vistos para
execuções rápidas. Isso significa que o fluxo documentado é seguro:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Para fluxos de todo o app, use `oc.events()`. Para frames brutos do Gateway, use
`oc.rawEvents()`.

## Modelos, ferramentas, artefatos e aprovações

Os helpers de modelo mapeiam para métodos atuais do Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helpers de ferramentas expõem o catálogo do Gateway, a visualização efetiva de ferramentas e a invocação direta
de ferramentas do Gateway. `oc.tools.invoke()` retorna um envelope tipado em vez
de lançar exceção para recusas por política ou aprovação.

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

Helpers de artefatos expõem a projeção de artefatos do Gateway para contexto de sessão, execução ou
tarefa. Cada chamada exige um escopo explícito `sessionKey`, `runId` ou
`taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Helpers de aprovação usam os RPCs de aprovação de exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Helpers de tarefas usam o ledger durável de tarefas que também sustenta `openclaw tasks`:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Helpers de ambiente expõem descoberta somente leitura local ao Gateway e de nó:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Explicitamente sem suporte hoje

A SDK inclui nomes para o modelo de produto que queremos, mas não finge silenciosamente
que RPCs do Gateway existem. Atualmente, estas chamadas lançam erros explícitos
de não suporte:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Os campos por execução `workspace`, `runtime`, `environment` e `approvals` são tipados
como formato futuro, mas o Gateway atual não oferece suporte a essas substituições no
RPC `agent`. Se os chamadores os passarem, a SDK lança erro antes de enviar a execução
para que o trabalho não seja executado acidentalmente com comportamento padrão de workspace, runtime,
ambiente ou aprovação.

## App SDK vs Plugin SDK

Use a App SDK quando o código estiver fora do OpenClaw:

- scripts Node que iniciam ou observam execuções de agentes
- tarefas de CI que chamam um Gateway
- dashboards e painéis administrativos
- extensões de IDE
- pontes externas que não precisam se tornar plugins de canal
- testes de integração com transportes de Gateway falsos ou reais

Use a Plugin SDK quando o código roda dentro do OpenClaw:

- plugins de provedor
- plugins de canal
- hooks de ferramenta ou ciclo de vida
- plugins de harness de agente
- helpers de runtime confiável

Código da App SDK deve importar de `@openclaw/sdk`. Código de Plugin deve importar de
subcaminhos documentados de `openclaw/plugin-sdk/*`. Não misture os dois contratos.

## Relacionado

- [Design da API do SDK de aplicativos OpenClaw](/pt-BR/reference/openclaw-sdk-api-design)
- [Referência de RPC do Gateway](/pt-BR/reference/rpc)
- [Loop de agentes](/pt-BR/concepts/agent-loop)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Sessões](/pt-BR/concepts/session)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)

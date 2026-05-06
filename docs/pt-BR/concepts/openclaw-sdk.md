---
read_when:
    - Você está criando um aplicativo externo, script, painel, job de CI ou extensão de IDE que se comunica com o OpenClaw
    - Você está escolhendo entre o App SDK e o Plugin SDK
    - Você está integrando com execuções de agentes do Gateway, sessões, eventos, aprovações, modelos ou ferramentas
sidebarTitle: App SDK
summary: SDK público de aplicativos do OpenClaw para aplicativos externos, scripts, painéis, tarefas de CI e extensões de IDE
title: SDK do Aplicativo OpenClaw
x-i18n:
    generated_at: "2026-05-06T05:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

O **OpenClaw App SDK** é a API cliente pública para aplicativos fora do
processo do OpenClaw. Use `@openclaw/sdk` quando um script, dashboard, tarefa de CI, extensão de IDE
ou outro aplicativo externo quiser se conectar ao Gateway, iniciar execuções de agentes,
transmitir eventos, aguardar resultados, cancelar trabalho ou inspecionar recursos do Gateway.

<Note>
  O App SDK é diferente do [Plugin SDK](/pt-BR/plugins/sdk-overview).
  `@openclaw/sdk` se comunica com o Gateway a partir de fora do OpenClaw.
  `openclaw/plugin-sdk/*` é apenas para plugins que rodam dentro do OpenClaw e
  registram provedores, canais, ferramentas, hooks ou runtimes confiáveis.
</Note>

## O que é enviado hoje

`@openclaw/sdk` é enviado com:

| Superfície                | Status  | O que faz                                                                         |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Pronto  | Principal ponto de entrada do cliente. Gerencia transporte, conexão, solicitações e eventos. |
| `GatewayClientTransport`  | Pronto  | Transporte WebSocket baseado no cliente do Gateway.                               |
| `oc.agents`               | Pronto  | Lista, cria, atualiza, exclui e obtém identificadores de agentes.                 |
| `Agent.run()`             | Pronto  | Inicia uma execução `agent` do Gateway e retorna um `Run`.                        |
| `oc.runs`                 | Pronto  | Cria, obtém, aguarda, cancela e transmite execuções.                              |
| `Run.events()`            | Pronto  | Transmite eventos normalizados por execução com replay para execuções rápidas.    |
| `Run.wait()`              | Pronto  | Chama `agent.wait` e retorna um `RunResult` estável.                              |
| `Run.cancel()`            | Pronto  | Chama `sessions.abort` pelo ID da execução, com a chave da sessão quando disponível. |
| `oc.sessions`             | Pronto  | Cria, resolve, envia para, corrige, compacta e obtém identificadores de sessões.  |
| `Session.send()`          | Pronto  | Chama `sessions.send` e retorna um `Run`.                                         |
| `oc.models`               | Pronto  | Chama `models.list` e o RPC de status atual `models.authStatus`.                  |
| `oc.tools`                | Pronto  | Lista, delimita escopo e invoca ferramentas do Gateway pelo pipeline de política. |
| `oc.artifacts`            | Pronto  | Lista, obtém e baixa artefatos de transcrição do Gateway.                         |
| `oc.approvals`            | Pronto  | Lista e resolve aprovações de execução por meio dos RPCs de aprovação do Gateway. |
| `oc.environments`         | Parcial | Lista candidatos de ambiente locais ao Gateway e de Node; criar/excluir não estão conectados. |
| `oc.rawEvents()`          | Pronto  | Expõe eventos brutos do Gateway para consumidores avançados.                      |
| `normalizeGatewayEvent()` | Pronto  | Converte eventos brutos do Gateway no formato estável de evento do SDK.           |

O SDK também exporta os tipos principais usados por essas superfícies:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` e tipos de
resultado relacionados.

## Conectar a um Gateway

Crie um cliente com uma URL explícita do Gateway ou injete um transporte personalizado para
testes e runtimes de aplicativos incorporados.

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
`gateway: "auto"` é aceita pelo construtor, mas a descoberta automática do Gateway
ainda não é um recurso separado do SDK; passe `url` quando o aplicativo ainda não
souber como descobrir o Gateway.

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

Use `oc.agents.get(id)` quando o aplicativo quiser um identificador de agente e, em seguida,
chame `agent.run()`.

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
`provider` e `model` do Gateway. `timeoutMs` permanece em milissegundos no SDK e
é convertido em segundos de timeout do Gateway para o RPC `agent`.

`run.wait()` usa o RPC `agent.wait` do Gateway. Um prazo de espera que expira
enquanto a execução ainda está ativa retorna `status: "accepted"` em vez de fingir
que a própria execução atingiu o timeout. Timeouts de runtime, execuções abortadas e execuções canceladas são
normalizados para `timed_out` ou `cancelled`.

## Criar e reutilizar sessões

Use sessões quando o aplicativo quiser estado durável de transcrição.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` chama `sessions.send` e retorna um `Run`. Identificadores de sessão também
dão suporte a:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Transmitir eventos

O SDK normaliza eventos brutos do Gateway em um envelope `OpenClawEvent` estável:

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

Tipos comuns de evento incluem:

| Tipo de evento       | Evento de origem do Gateway                   |
| -------------------- | --------------------------------------------- |
| `run.started`        | Início do ciclo de vida de `agent`            |
| `run.completed`      | Fim do ciclo de vida de `agent`               |
| `run.failed`         | Erro do ciclo de vida de `agent`              |
| `run.cancelled`      | Fim do ciclo de vida abortado/cancelado       |
| `run.timed_out`      | Fim do ciclo de vida por timeout              |
| `assistant.delta`    | Delta de streaming do assistente              |
| `assistant.message`  | Mensagem do assistente                        |
| `thinking.delta`     | Fluxo de pensamento ou plano                  |
| `tool.call.started`  | Início de ferramenta/item/comando             |
| `tool.call.delta`    | Atualização de ferramenta/item/comando        |
| `tool.call.completed` | Conclusão de ferramenta/item/comando         |
| `tool.call.failed`   | Falha ou status bloqueado de ferramenta/item/comando |
| `approval.requested` | Solicitação de aprovação de exec ou Plugin    |
| `approval.resolved`  | Resolução de aprovação de exec ou Plugin      |
| `session.created`    | Criação de `sessions.changed`                 |
| `session.updated`    | Atualização de `sessions.changed`             |
| `session.compacted`  | Compaction de `sessions.changed`              |
| `task.updated`       | Eventos de atualização de tarefa              |
| `artifact.updated`   | Eventos de fluxo de patch                     |
| `raw`                | Qualquer evento ainda sem mapeamento estável do SDK |

`Run.events()` filtra eventos para um ID de execução e reproduz eventos já vistos para
execuções rápidas. Isso significa que o fluxo documentado é seguro:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Para fluxos em todo o aplicativo, use `oc.events()`. Para frames brutos do Gateway, use
`oc.rawEvents()`.

## Modelos, ferramentas, artefatos e aprovações

Os auxiliares de modelo são mapeados para os métodos atuais do Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Os auxiliares de ferramenta expõem o catálogo do Gateway, a visualização efetiva de ferramentas e a invocação direta
de ferramentas do Gateway. `oc.tools.invoke()` retorna um envelope tipado em vez
de lançar erro por recusas de política ou aprovação.

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

Os auxiliares de artefato expõem a projeção de artefatos do Gateway para contexto de sessão, execução ou
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

Os auxiliares de aprovação usam os RPCs de aprovação de exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Os auxiliares de ambiente expõem descoberta somente leitura local ao Gateway e de Node:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Explicitamente sem suporte hoje

O SDK inclui nomes para o modelo de produto que queremos, mas não finge silenciosamente
que RPCs do Gateway existem. Estas chamadas atualmente lançam erros explícitos
de falta de suporte:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Os campos por execução `workspace`, `runtime`, `environment` e `approvals` são tipados
como formato futuro, mas o Gateway atual não dá suporte a essas substituições no
RPC `agent`. Se os chamadores os passarem, o SDK lança erro antes de enviar a execução
para que o trabalho não seja executado acidentalmente com comportamento padrão de workspace, runtime,
ambiente ou aprovação.

## App SDK vs Plugin SDK

Use o App SDK quando o código vive fora do OpenClaw:

- Scripts Node que iniciam ou observam execuções de agentes
- Tarefas de CI que chamam um Gateway
- dashboards e painéis de administração
- extensões de IDE
- pontes externas que não precisam se tornar plugins de canal
- testes de integração com transportes de Gateway falsos ou reais

Use o Plugin SDK quando o código roda dentro do OpenClaw:

- plugins de provedor
- plugins de canal
- hooks de ferramenta ou ciclo de vida
- plugins de harness de agente
- auxiliares de runtime confiáveis

O código do App SDK deve importar de `@openclaw/sdk`. O código de Plugin deve importar dos
subcaminhos documentados `openclaw/plugin-sdk/*`. Não misture os dois contratos.

## Relacionados

- [Design da API do OpenClaw App SDK](/pt-BR/reference/openclaw-sdk-api-design)
- [Referência de RPC do Gateway](/pt-BR/reference/rpc)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Sessões](/pt-BR/concepts/session)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)

---
read_when:
    - Você está criando um app externo, script, painel, job de CI ou extensão de IDE que se comunica com o OpenClaw
    - Você está escolhendo entre o App SDK e o Plugin SDK
    - Você está fazendo integração com execuções de agentes, sessões, eventos, aprovações, modelos ou ferramentas do Gateway
sidebarTitle: App SDK
summary: SDK público de aplicativos do OpenClaw para aplicativos externos, scripts, painéis, tarefas de CI e extensões de IDE
title: SDK de Aplicativo do OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:45:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

O **SDK de Apps da OpenClaw** é a API cliente pública para apps fora do
processo da OpenClaw. Use `@openclaw/sdk` quando um script, painel, trabalho de CI, extensão de IDE ou outro app externo quiser se conectar ao Gateway, iniciar execuções de agente, transmitir eventos, aguardar resultados, cancelar trabalho ou inspecionar recursos do Gateway.

<Note>
  O SDK de Apps é diferente do [Plugin SDK](/pt-BR/plugins/sdk-overview).
  `@openclaw/sdk` se comunica com o Gateway de fora da OpenClaw.
  `openclaw/plugin-sdk/*` é apenas para plugins que rodam dentro da OpenClaw e registram provedores, canais, ferramentas, hooks ou runtimes confiáveis.
</Note>

## O Que É Disponibilizado Hoje

`@openclaw/sdk` é disponibilizado com:

| Superfície                | Status  | O que faz                                                                     |
| ------------------------- | ------- | ----------------------------------------------------------------------------- |
| `OpenClaw`                | Pronto  | Ponto de entrada principal do cliente. Gerencia transporte, conexão, solicitações e eventos. |
| `GatewayClientTransport`  | Pronto  | Transporte WebSocket apoiado pelo cliente do Gateway.                         |
| `oc.agents`               | Pronto  | Lista, cria, atualiza, exclui e obtém handles de agentes.                     |
| `Agent.run()`             | Pronto  | Inicia uma execução `agent` do Gateway e retorna um `Run`.                    |
| `oc.runs`                 | Pronto  | Cria, obtém, aguarda, cancela e transmite execuções.                          |
| `Run.events()`            | Pronto  | Transmite eventos normalizados por execução com replay para execuções rápidas. |
| `Run.wait()`              | Pronto  | Chama `agent.wait` e retorna um `RunResult` estável.                          |
| `Run.cancel()`            | Pronto  | Chama `sessions.abort` pelo id da execução, com chave de sessão quando disponível. |
| `oc.sessions`             | Pronto  | Cria, resolve, envia para, aplica patches, compacta e obtém handles de sessão. |
| `Session.send()`          | Pronto  | Chama `sessions.send` e retorna um `Run`.                                     |
| `oc.models`               | Pronto  | Chama `models.list` e o RPC de status `models.authStatus` atual.              |
| `oc.tools`                | Parcial | Lista o catálogo de ferramentas e ferramentas efetivas; a invocação direta de ferramentas não está conectada. |
| `oc.approvals`            | Pronto  | Lista e resolve aprovações de execução por meio de RPCs de aprovação do Gateway. |
| `oc.rawEvents()`          | Pronto  | Expõe eventos brutos do Gateway para consumidores avançados.                  |
| `normalizeGatewayEvent()` | Pronto  | Converte eventos brutos do Gateway para o formato de evento estável do SDK.   |

O SDK também exporta os tipos principais usados por essas superfícies:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` e tipos de resultado relacionados.

## Conectar A Um Gateway

Crie um cliente com uma URL explícita do Gateway ou injete um transporte personalizado para testes e runtimes de apps embarcados.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` é equivalente a `url`. A opção
`gateway: "auto"` é aceita pelo construtor, mas a descoberta automática do Gateway ainda não é um recurso separado do SDK; passe `url` quando o app ainda não souber como descobrir o Gateway.

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

## Executar Um Agente

Use `oc.agents.get(id)` quando o app precisar de um handle de agente e, em seguida, chame `agent.run()`.

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

Referências de modelo qualificadas por provedor, como `openai/gpt-5.5`, são divididas em substituições de `provider` e `model` do Gateway. `timeoutMs` permanece em milissegundos no SDK e é convertido para segundos de timeout do Gateway para o RPC `agent`.

`run.wait()` usa o RPC `agent.wait` do Gateway. Um prazo de espera que expira enquanto a execução ainda está ativa retorna `status: "accepted"` em vez de fingir que a própria execução atingiu timeout. Timeouts de runtime, execuções abortadas e execuções canceladas são normalizados para `timed_out` ou `cancelled`.

## Criar E Reutilizar Sessões

Use sessões quando o app precisar de estado durável de transcrição.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` chama `sessions.send` e retorna um `Run`. Handles de sessão também aceitam:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Transmitir Eventos

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

Tipos de evento comuns incluem:

| Tipo de evento       | Evento de origem do Gateway                  |
| -------------------- | -------------------------------------------- |
| `run.started`        | Início do ciclo de vida de `agent`           |
| `run.completed`      | Fim do ciclo de vida de `agent`              |
| `run.failed`         | Erro do ciclo de vida de `agent`             |
| `run.cancelled`      | Fim do ciclo de vida abortado/cancelado      |
| `run.timed_out`      | Fim do ciclo de vida por timeout             |
| `assistant.delta`    | Delta de streaming do assistente             |
| `assistant.message`  | Mensagem do assistente                       |
| `thinking.delta`     | Fluxo de pensamento ou plano                 |
| `tool.call.started`  | Início de ferramenta/item/comando            |
| `tool.call.delta`    | Atualização de ferramenta/item/comando       |
| `tool.call.completed` | Conclusão de ferramenta/item/comando        |
| `tool.call.failed`   | Falha ou status bloqueado de ferramenta/item/comando |
| `approval.requested` | Solicitação de aprovação de execução ou Plugin |
| `approval.resolved`  | Resolução de aprovação de execução ou Plugin |
| `session.created`    | Criação de `sessions.changed`                |
| `session.updated`    | Atualização de `sessions.changed`            |
| `session.compacted`  | Compaction de `sessions.changed`             |
| `task.updated`       | Eventos de atualização de tarefa             |
| `artifact.updated`   | Eventos de fluxo de patch                    |
| `raw`                | Qualquer evento ainda sem um mapeamento estável do SDK |

`Run.events()` filtra eventos para um único id de execução e reproduz eventos já vistos para execuções rápidas. Isso significa que o fluxo documentado é seguro:

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

## Modelos, Ferramentas E Aprovações

Helpers de modelo mapeiam para métodos atuais do Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helpers de ferramenta expõem o catálogo do Gateway e a visualização de ferramentas efetivas:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Helpers de aprovação usam os RPCs de aprovação de execução:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Explicitamente Sem Suporte Hoje

O SDK inclui nomes para o modelo de produto que queremos, mas não finge silenciosamente que RPCs do Gateway existem. Atualmente, estas chamadas lançam erros explícitos de falta de suporte:

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

Campos por execução `workspace`, `runtime`, `environment` e `approvals` são tipados como formato futuro, mas o Gateway atual não oferece suporte a essas substituições no RPC `agent`. Se chamadores os passarem, o SDK lança erro antes de enviar a execução para que o trabalho não seja executado acidentalmente com o comportamento padrão de workspace, runtime, ambiente ou aprovação.

## SDK de Apps Versus Plugin SDK

Use o SDK de Apps quando o código estiver fora da OpenClaw:

- scripts Node que iniciam ou observam execuções de agente
- trabalhos de CI que chamam um Gateway
- painéis e painéis administrativos
- extensões de IDE
- pontes externas que não precisam se tornar plugins de canal
- testes de integração com transportes Gateway falsos ou reais

Use o Plugin SDK quando o código roda dentro da OpenClaw:

- plugins de provedor
- plugins de canal
- hooks de ferramenta ou ciclo de vida
- plugins de harness de agente
- helpers de runtime confiável

Código do SDK de Apps deve importar de `@openclaw/sdk`. Código de Plugin deve importar dos subcaminhos documentados de `openclaw/plugin-sdk/*`. Não misture os dois contratos.

## Documentação Relacionada

- [Design da API do SDK de Apps da OpenClaw](/pt-BR/reference/openclaw-sdk-api-design)
- [Referência de RPC do Gateway](/pt-BR/reference/rpc)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Sessões](/pt-BR/concepts/session)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)

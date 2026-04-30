---
read_when:
    - Você está implementando o SDK público proposto de aplicativos do OpenClaw
    - Você precisa do espaço de nomes, evento, resultado, artefato, aprovação ou contrato de segurança de rascunho para o SDK do aplicativo
    - Você está comparando recursos do protocolo Gateway com o encapsulador de alto nível do OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Design de referência para a API pública do OpenClaw App SDK, a taxonomia de eventos, os artefatos, as aprovações e a estrutura de pacotes
title: Design da API do SDK de aplicativos do OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:07:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Esta página é o design detalhado da referência de API para o
[SDK de Apps do OpenClaw](/pt-BR/concepts/openclaw-sdk) público. Ela é intencionalmente separada do
[SDK de Plugin](/pt-BR/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` é o pacote externo de app/cliente para falar com o
  Gateway. `openclaw/plugin-sdk/*` é o contrato de autoria de plugins em processo.
  Não importe subcaminhos do SDK de Plugin a partir de apps que só precisam executar agents.
</Note>

O SDK público de apps deve ser criado em duas camadas:

1. Um cliente Gateway gerado de baixo nível.
2. Um wrapper ergonômico de alto nível com objetos `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` e `Environment`.

## Design de namespaces

Os namespaces de baixo nível devem seguir de perto os recursos do Gateway:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Wrappers de alto nível devem retornar objetos que tornam fluxos comuns agradáveis:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Contrato de eventos

O SDK público deve expor eventos versionados, reproduzíveis e normalizados.

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
  raw?: unknown;
};
```

`id` é um cursor de reprodução. Consumidores devem conseguir se reconectar com
`events({ after: id })` e receber eventos perdidos quando a retenção permitir.

Famílias recomendadas de eventos normalizados:

| Evento                | Significado                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `run.created`         | Execução aceita.                                                       |
| `run.queued`          | A execução está aguardando uma faixa de sessão, runtime ou ambiente.   |
| `run.started`         | O runtime iniciou a execução.                                          |
| `run.completed`       | A execução terminou com sucesso.                                       |
| `run.failed`          | A execução terminou com um erro.                                       |
| `run.cancelled`       | A execução foi cancelada.                                              |
| `run.timed_out`       | A execução excedeu seu tempo limite.                                   |
| `assistant.delta`     | Delta de texto do assistente.                                          |
| `assistant.message`   | Mensagem completa do assistente ou substituição.                       |
| `thinking.delta`      | Delta de raciocínio ou plano, quando a política permite exposição.     |
| `tool.call.started`   | A chamada da ferramenta começou.                                       |
| `tool.call.delta`     | A chamada da ferramenta transmitiu progresso ou saída parcial.         |
| `tool.call.completed` | A chamada da ferramenta retornou com sucesso.                          |
| `tool.call.failed`    | A chamada da ferramenta falhou.                                        |
| `approval.requested`  | Uma execução ou ferramenta precisa de aprovação.                       |
| `approval.resolved`   | A aprovação foi concedida, negada, expirou ou foi cancelada.           |
| `question.requested`  | O runtime pede entrada ao usuário ou ao app host.                      |
| `question.answered`   | O app host forneceu uma resposta.                                      |
| `artifact.created`    | Novo artefato disponível.                                              |
| `artifact.updated`    | Artefato existente alterado.                                           |
| `session.created`     | Sessão criada.                                                         |
| `session.updated`     | Metadados da sessão alterados.                                         |
| `session.compacted`   | A compactação da sessão aconteceu.                                     |
| `task.updated`        | O estado da tarefa em segundo plano mudou.                             |
| `git.branch`          | O runtime observou ou alterou o estado do branch.                      |
| `git.diff`            | O runtime produziu ou alterou um diff.                                 |
| `git.pr`              | O runtime abriu, atualizou ou vinculou um pull request.                |

Payloads nativos do runtime devem estar disponíveis por meio de `raw`, mas apps não devem
precisar analisar `raw` para UI normal.

## Contrato de resultado

`Run.wait()` deve retornar um envelope de resultado estável:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

O resultado deve ser simples e estável. Valores de timestamp preservam o formato do Gateway,
então execuções atuais respaldadas por ciclo de vida normalmente relatam números em milissegundos
desde a época, enquanto adaptadores ainda podem expor strings ISO. UI rica, traces de ferramentas e
detalhes nativos do runtime pertencem a eventos e artefatos.

`accepted` é um resultado de espera não terminal: significa que o prazo de espera do Gateway
expirou antes que a execução produzisse um fim/erro de ciclo de vida. Ele não deve ser tratado como
`timed_out`; `timed_out` é reservado para uma execução que excedeu seu próprio tempo limite
de runtime.

## Aprovações e perguntas

Aprovações devem ser recursos de primeira classe porque agents de codificação cruzam constantemente
limites de segurança.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Eventos de aprovação devem carregar:

- id da aprovação
- id da execução e id da sessão
- tipo de solicitação
- resumo da ação solicitada
- nome da ferramenta ou ação do ambiente
- nível de risco
- decisões disponíveis
- expiração
- se a decisão pode ser reutilizada

Perguntas são separadas de aprovações. Uma pergunta solicita informações ao usuário ou ao app host. Uma aprovação solicita permissão para executar uma ação.

## Modelo ToolSpace

Apps precisam entender a superfície de ferramentas sem importar internals de plugins.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

O SDK deve expor:

- metadados de ferramentas normalizados
- origem: OpenClaw, MCP, plugin, canal, runtime ou app
- resumo do schema
- política de aprovação
- compatibilidade de runtime
- se uma ferramenta está oculta, é readonly, tem capacidade de escrita ou capacidade de host

A invocação de ferramentas por meio do SDK deve ser explícita e escopada. A maioria dos apps deve
executar agents, não chamar ferramentas arbitrárias diretamente.

## Modelo de artefatos

Artefatos devem cobrir mais do que arquivos.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Exemplos comuns:

- edições de arquivos e arquivos gerados
- pacotes de patch
- diffs de VCS
- capturas de tela e saídas de mídia
- logs e pacotes de trace
- links de pull request
- trajetórias de runtime
- snapshots de workspace de ambiente gerenciado

O acesso a artefatos deve oferecer suporte a redação, retenção e URLs de download sem
presumir que todo artefato é um arquivo local normal.

## Modelo de segurança

O SDK de apps deve ser explícito sobre autoridade.

Escopos de token recomendados:

| Escopo              | Permite                                                 |
| ------------------- | ------------------------------------------------------- |
| `agent.read`        | Listar e inspecionar agents.                            |
| `agent.run`         | Iniciar execuções.                                      |
| `session.read`      | Ler metadados e mensagens da sessão.                    |
| `session.write`     | Criar, enviar para, bifurcar, compactar e abortar sessões. |
| `task.read`         | Ler estado de tarefas em segundo plano.                 |
| `task.write`        | Cancelar ou modificar política de notificação de tarefas. |
| `approval.respond`  | Aprovar ou negar solicitações.                          |
| `tools.invoke`      | Invocar ferramentas expostas diretamente.               |
| `artifacts.read`    | Listar e baixar artefatos.                              |
| `environment.write` | Criar ou destruir ambientes gerenciados.                |
| `admin`             | Operações administrativas.                              |

Padrões:

- nenhum encaminhamento de segredos por padrão
- nenhuma passagem irrestrita de variáveis de ambiente
- referências a segredos em vez de valores de segredos
- política explícita de sandbox e rede
- retenção explícita de ambiente remoto
- aprovações para execução no host, a menos que a política prove o contrário
- eventos brutos de runtime redigidos antes de saírem do Gateway, a menos que o chamador tenha um
  escopo diagnóstico mais forte

## Provedor de ambiente gerenciado

Agents gerenciados devem ser implementados como provedores de ambiente.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

A primeira implementação não precisa ser um SaaS hospedado. Ela pode mirar
hosts Node existentes, workspaces efêmeros, runners no estilo CI ou ambientes no estilo Testbox.
O contrato importante é:

1. preparar workspace
2. vincular ambiente seguro e segredos
3. iniciar execução
4. transmitir eventos
5. coletar artefatos
6. limpar ou reter por política

Quando isso estiver estável, um serviço de nuvem hospedado poderá implementar o mesmo contrato
de provedor.

## Estrutura de pacotes

Pacotes recomendados:

| Pacote                 | Finalidade                                                     |
| ---------------------- | -------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK público de alto nível e cliente Gateway gerado de baixo nível. |
| `@openclaw/sdk-react`   | Hooks React opcionais para dashboards e criadores de apps.     |
| `@openclaw/sdk-testing` | Helpers de teste e servidor Gateway falso para integrações de apps. |

O repositório já tem `openclaw/plugin-sdk/*` para plugins. Mantenha esse namespace
separado para evitar confundir autores de plugins com desenvolvedores de apps.

## Estratégia de cliente gerado

O cliente de baixo nível deve ser gerado a partir de esquemas versionados do protocolo do Gateway, depois envolvido por classes ergonômicas escritas à mão.

Camadas:

1. Fonte da verdade do esquema do Gateway.
2. Cliente TypeScript de baixo nível gerado.
3. Validadores em tempo de execução para entradas externas e payloads de eventos.
4. Wrappers de alto nível `OpenClaw`, `Agent`, `Session`, `Run`, `Task` e `Artifact`.
5. Exemplos de cookbook e testes de integração.

Benefícios:

- desvios de protocolo ficam visíveis
- os testes podem comparar métodos gerados com exports do Gateway
- o SDK de aplicativo permanece independente dos componentes internos do SDK de Plugin
- consumidores de baixo nível ainda têm acesso completo ao protocolo
- consumidores de alto nível recebem a pequena API de produto

## Documentos relacionados

- [SDK de aplicativo do OpenClaw](/pt-BR/concepts/openclaw-sdk)
- [Referência de RPC do Gateway](/pt-BR/reference/rpc)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Tempos de execução de agentes](/pt-BR/concepts/agent-runtimes)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)

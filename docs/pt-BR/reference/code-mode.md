---
read_when:
    - Você quer habilitar o modo de código do OpenClaw para uma execução de agente
    - Você precisa explicar por que o modo de código é diferente do modo Codex Code
    - Você está revisando o contrato exec/wait, a sandbox QuickJS-WASI, a transformação TypeScript ou a ponte oculta do catálogo de ferramentas
    - Você está adicionando ou revisando uma integração interna de registro de namespace do modo de código
sidebarTitle: Code mode
summary: 'Modo de código do OpenClaw: uma superfície de ferramentas exec/wait opcional, respaldada por QuickJS-WASI e por um catálogo de ferramentas oculto com escopo de execução'
title: Modo de código
x-i18n:
    generated_at: "2026-06-27T18:08:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

O modo de código é um recurso experimental do runtime de agentes do OpenClaw. Ele fica desativado por
padrão. Quando você o habilita, o OpenClaw altera o que o modelo vê em uma execução:
em vez de expor diretamente todos os esquemas de ferramentas habilitados, o modelo vê apenas
`exec` e `wait`.

Esta página documenta o modo de código do OpenClaw. Ele não é o modo de código do Codex. Os dois
recursos compartilham um nome, mas são implementados por runtimes diferentes e expõem
contratos `exec` diferentes:

- O Codex Code Mode é habilitado para threads do servidor de aplicativo do Codex, a menos que uma
  política restritiva de ferramentas desative o modo de código nativo. Ele roda no harness de programação do Codex,
  onde o modelo escreve comandos de shell por meio de um contrato `exec.command`.
- O modo de código do OpenClaw fica desabilitado, a menos que `tools.codeMode.enabled: true` esteja
  configurado. Ele roda no runtime genérico de agentes do OpenClaw, onde o modelo
  escreve programas JavaScript ou TypeScript por meio de um contrato `exec.code`.

O Codex Code Mode e a busca dinâmica de ferramentas nativa do Codex são superfícies estáveis do harness do Codex.
O modo de código do OpenClaw é um adaptador experimental de superfície de ferramentas, de propriedade do OpenClaw,
para execuções genéricas do OpenClaw. Ele usa `quickjs-wasi`, um catálogo oculto de ferramentas do OpenClaw
e o executor normal de ferramentas do OpenClaw.

## O que é isto?

O modo de código do OpenClaw permite que o modelo escreva um pequeno programa JavaScript ou TypeScript
em vez de escolher diretamente de uma longa lista de ferramentas.

Quando o modo de código está ativo:

- A lista de ferramentas visível para o modelo é exatamente `exec` e `wait`.
- `exec` avalia JavaScript ou TypeScript gerado pelo modelo em um worker
  QuickJS-WASI restrito.
- As ferramentas normais do OpenClaw ficam ocultas do prompt do modelo e são expostas dentro do
  programa convidado por meio de `ALL_TOOLS` e `tools`.
- O código convidado pode pesquisar o catálogo oculto, descrever uma ferramenta e chamar uma ferramenta
  pelo mesmo caminho de execução do OpenClaw usado por turnos normais de agente.
- Ferramentas MCP são agrupadas sob o namespace `MCP`. No modo de código, esse namespace
  é a única forma compatível de chamar ferramentas MCP.
- `wait` retoma uma execução em modo de código suspensa quando chamadas de ferramentas aninhadas ainda estão
  pendentes.

A distinção importante: o modo de código altera a superfície de orquestração voltada ao modelo.
Ele não substitui ferramentas do OpenClaw, ferramentas de Plugin, ferramentas MCP, autenticação,
política de aprovação, comportamento de canal nem seleção de modelo.

## Por que isso é bom?

O modo de código facilita o uso de grandes catálogos de ferramentas pelos modelos.

- Superfície de prompt menor: provedores recebem duas ferramentas de controle em vez de dezenas
  ou centenas de esquemas completos de ferramentas.
- Orquestração melhor: o modelo pode usar loops, junções, pequenas transformações,
  lógica condicional e chamadas aninhadas paralelas de ferramentas dentro de uma célula de código.
- Neutro em relação ao provedor: funciona para ferramentas do OpenClaw, Plugin, MCP e cliente sem
  depender de execução de código nativa do provedor.
- A política existente permanece em vigor: chamadas aninhadas de ferramentas ainda passam pela
  política, aprovações, hooks, contexto de sessão e caminhos de auditoria do OpenClaw.
- Modo de falha claro: quando o modo de código está explicitamente habilitado e o runtime está
  indisponível, o OpenClaw falha de forma fechada em vez de voltar para uma ampla exposição direta de ferramentas.

O modo de código é especialmente útil para agentes com um grande catálogo de ferramentas habilitado ou
para fluxos de trabalho em que o modelo precisa repetidamente pesquisar, combinar e chamar
ferramentas antes de produzir uma resposta.

## Como habilitá-lo

Adicione `tools.codeMode.enabled: true` à configuração do agente ou do runtime:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

A forma abreviada também é aceita:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

O modo de código permanece desativado quando `tools.codeMode` é omitido, `false` ou um objeto
sem `enabled: true`.

Quando você usa agentes em sandbox com servidores MCP configurados, certifique-se também de que a
política de ferramentas do sandbox permite o Plugin MCP empacotado, por exemplo com
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulte
[Configuração - ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Use limites explícitos quando quiser restrições mais rígidas:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Para confirmar o formato do payload do modelo durante a depuração, execute o Gateway com
logging direcionado:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Com o modo de código ativo, os nomes das ferramentas voltadas ao modelo registrados devem ser `exec` e
`wait`. Se você precisar do payload redigido do provedor, adicione
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` para uma sessão curta de depuração.

## Tour técnico

O restante desta página descreve o contrato do runtime e os detalhes de implementação.
Ela é destinada a mantenedores, autores de Plugin que depuram a exposição de ferramentas e
operadores que validam implantações de alto risco.

## Status do runtime

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Estado padrão: desabilitado.
- Estabilidade: superfície experimental do OpenClaw; o modo de código do Codex é uma superfície estável separada
  do harness do Codex.
- Superfície alvo: execuções genéricas de agentes do OpenClaw.
- Postura de segurança: código do modelo é hostil.
- Promessa voltada ao usuário: habilitar o modo de código nunca volta silenciosamente para uma ampla
  exposição direta de ferramentas.

## Escopo

O modo de código é responsável pelo formato de orquestração voltado ao modelo para uma execução preparada. Ele não
é responsável pela seleção de modelo, comportamento de canal, autenticação, política de ferramentas nem
implementações de ferramentas.

Dentro do escopo:

- definições de ferramentas `exec` e `wait` visíveis para o modelo
- construção do catálogo oculto de ferramentas
- execução convidada de JavaScript e TypeScript
- runtime de worker QuickJS-WASI
- callbacks do host para pesquisa de catálogo, descrição de esquema e chamada de ferramenta
- estado retomável para programas convidados suspensos
- limites de saída, timeout, memória, chamadas pendentes e snapshots
- telemetria e projeção de trajetória para chamadas aninhadas de ferramentas

Fora do escopo:

- execução remota de código nativa do provedor
- semântica de execução de shell
- alteração da autorização existente de ferramentas
- scripts persistentes criados por usuários
- acesso a gerenciador de pacotes, arquivos, rede ou módulos no código convidado
- reutilização direta de componentes internos do Codex Code mode

Ferramentas de propriedade do provedor, como sandboxes remotos de Python, permanecem ferramentas separadas. Consulte
[Execução de código](/pt-BR/tools/code-execution).

## Termos

**Modo de código** é o modo de runtime do OpenClaw que oculta ferramentas normais do modelo e
expõe apenas `exec` e `wait`.

**Runtime convidado** é a VM JavaScript QuickJS-WASI que avalia o código do modelo.

**Ponte do host** é a superfície estreita de callbacks compatível com JSON do código convidado
de volta para o OpenClaw.

**Catálogo** é a lista com escopo da execução de ferramentas efetivas após a política normal de ferramentas,
resolução de Plugin, MCP e ferramentas de cliente.

**Chamada aninhada de ferramenta** é uma chamada de ferramenta feita a partir do código convidado por meio da ponte do host.

**Snapshot** é o estado serializado da VM QuickJS-WASI salvo para que `wait` possa continuar uma
execução suspensa em modo de código.

## Configuração

`tools.codeMode.enabled` é o gate de ativação. Definir outros campos do modo de código
não habilita o recurso.

Campos compatíveis:

- `enabled`: boolean. Padrão `false`. Habilita o modo de código somente quando `true`.
- `runtime`: `"quickjs-wasi"`. Único runtime compatível.
- `mode`: `"only"`. Expõe `exec` e `wait`, oculta ferramentas normais do modelo.
- `languages`: array de `"javascript"` e `"typescript"`. O padrão inclui
  ambos.
- `timeoutMs`: limite de tempo de relógio para um `exec` ou `wait`. Padrão `10000`.
  Restrição do runtime: `100` a `60000`.
- `memoryLimitBytes`: limite de heap do QuickJS. Padrão `67108864`. Restrição do runtime:
  `1048576` a `1073741824`.
- `maxOutputBytes`: limite para texto, JSON e logs retornados. Padrão `65536`.
  Restrição do runtime: `1024` a `10485760`.
- `maxSnapshotBytes`: limite para snapshots serializados da VM. Padrão `10485760`.
  Restrição do runtime: `1024` a `268435456`.
- `maxPendingToolCalls`: limite para chamadas aninhadas simultâneas de ferramentas. Padrão `16`.
  Restrição do runtime: `1` a `128`.
- `snapshotTtlSeconds`: por quanto tempo uma VM suspensa pode ser retomada. Padrão `900`.
  Restrição do runtime: `1` a `86400`.
- `searchDefaultLimit`: contagem padrão de resultados de pesquisa do catálogo oculto. Padrão `8`.
  O runtime restringe isso a `maxSearchLimit`.
- `maxSearchLimit`: contagem máxima de resultados de pesquisa do catálogo oculto. Padrão `50`.
  Restrição do runtime: `1` a `50`.

Se o modo de código estiver habilitado, mas o QuickJS-WASI não puder carregar, o OpenClaw falhará de forma fechada para
essa execução. Ele não expõe silenciosamente ferramentas normais como fallback.

## Ativação

O modo de código é avaliado depois que a política efetiva de ferramentas é conhecida e antes que a
solicitação final ao modelo seja montada.

Ordem de ativação:

1. Resolver o agente, modelo, provedor, sandbox, canal, remetente e política de execução.
2. Construir a lista efetiva de ferramentas do OpenClaw.
3. Adicionar ferramentas elegíveis de Plugin, MCP e cliente.
4. Aplicar políticas de permissão e negação.
5. Se `tools.codeMode.enabled` for falso, continuar com a exposição normal de ferramentas.
6. Se estiver habilitado e ferramentas estiverem ativas para a execução, registrar as ferramentas efetivas no
   catálogo do modo de código.
7. Remover todas as ferramentas normais da lista de ferramentas visível para o modelo.
8. Adicionar `exec` e `wait` do modo de código.

Execuções que intencionalmente não têm ferramentas, como chamadas brutas ao modelo, `disableTools`,
ou uma allowlist vazia, não ativam a superfície do modo de código mesmo se a configuração
contiver `tools.codeMode.enabled: true`.

O catálogo do modo de código tem escopo da execução. Ele não deve vazar ferramentas de outro agente,
sessão, remetente ou execução.

## Ferramentas visíveis para o modelo

Quando o modo de código está ativo, o modelo vê exatamente estas ferramentas de nível superior:

- `exec`
- `wait`

Todas as outras ferramentas habilitadas ficam ocultas da lista de ferramentas voltada ao modelo e registradas
no catálogo do modo de código.

O modelo deve usar `exec` para orquestração de ferramentas, junção de dados, loops,
chamadas aninhadas paralelas e transformações estruturadas. O modelo deve usar
`wait` apenas quando `exec` retornar um resultado `waiting` retomável.

## `exec`

`exec` inicia uma célula de modo de código e retorna um resultado. O código de entrada é gerado pelo modelo
e deve ser tratado como hostil.

Entrada:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Regras de entrada:

- Um de `code` ou `command` deve não estar vazio.
- `code` é o campo documentado voltado ao modelo.
- `command` é aceito como um alias compatível com exec para políticas de hook e
  reescritas confiáveis; quando ambos estão presentes, os valores devem corresponder.
- Eventos de hook externos de `exec` do modo de código incluem `toolKind: "code_mode_exec"` e
  incluem `toolInputKind: "javascript" | "typescript"` quando a linguagem de entrada
  é conhecida, para que políticas possam distinguir células de modo de código de chamadas `exec`
  no estilo shell que compartilham o mesmo nome de ferramenta.
- `language` usa `"javascript"` como padrão.
- Se `language` for `"typescript"`, o OpenClaw transpila antes da avaliação.
- `exec` rejeita `import`, `require`, import dinâmico e padrões de carregador de módulos
  na v1.
- `exec` não expõe recursivamente a implementação normal de `exec` de shell.

Resultado:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` retorna `waiting` quando a VM QuickJS suspende com estado retomável que
ainda precisa de uma continuação visível para o modelo. O resultado inclui um `runId` para
`wait`. Chamadas pela ponte de namespace, incluindo chamadas do namespace MCP, são drenadas automaticamente
dentro da mesma chamada `exec`/`wait` enquanto estão prontas, de modo que um bloco de código compacto
possa inspecionar `$api()` e chamar uma ferramenta MCP sem forçar uma chamada de ferramenta do modelo por
cada await de namespace.

`exec` retorna `completed` somente quando a VM convidada não tem trabalho pendente e o
valor final é compatível com JSON depois que o adaptador de saída do OpenClaw é executado.

## `wait`

`wait` continua uma VM de modo de código suspensa.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

A saída é a mesma união `CodeModeResult` retornada por `exec`.

`wait` existe porque ferramentas OpenClaw aninhadas podem ser lentas,
interativas, bloqueadas por aprovação ou transmitir atualizações parciais. O
modelo não deve precisar manter uma chamada `exec` longa aberta enquanto o host
aguarda trabalho externo.

Snapshot e restauração do QuickJS-WASI são o mecanismo de retomada v1:

1. `exec` avalia o código até a conclusão, falha ou suspensão.
2. Na suspensão, o OpenClaw cria um snapshot da VM QuickJS e registra o trabalho
   de host pendente.
3. Quando o trabalho pendente é resolvido, `wait` restaura o snapshot da VM.
4. O OpenClaw registra novamente callbacks do host por nomes estáveis.
5. O OpenClaw entrega resultados de ferramentas aninhadas à VM restaurada.
6. O OpenClaw drena trabalhos pendentes do QuickJS.
7. `wait` retorna `completed`, `failed` ou outro resultado `waiting`.

Snapshots são estado de runtime, não artefatos de usuário. Eles têm limite de
tamanho, expiram e ficam restritos à execução e à sessão que os criaram.

`wait` falha quando:

- `runId` é desconhecido.
- o snapshot expirou.
- a execução ou sessão pai foi abortada.
- o chamador não está no mesmo escopo de execução/sessão.
- a restauração do QuickJS-WASI falha.
- a restauração excederia os limites configurados.

## API do runtime convidado

O runtime convidado expõe uma pequena API global:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` é um metadado compacto para o catálogo com escopo de execução. Ele não
contém esquemas completos por padrão.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

O esquema completo é carregado somente sob demanda:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Auxiliares de catálogo:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Funções de ferramentas convenientes são instaladas somente para nomes seguros
inequívocos:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Entradas de catálogo MCP não são chamáveis por `tools.call(...)` nem por funções
convenientes no modo de código. Elas são expostas somente pelo namespace `MCP`
gerado. Arquivos de declaração no estilo TypeScript ficam disponíveis pela
superfície de arquivo virtual `API` somente leitura, para que agentes possam
inspecionar assinaturas MCP sem adicionar esquemas MCP ao prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` retorna declarações compactas inferidas dos
metadados de ferramentas MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Os arquivos de declaração são virtuais, não arquivos gravados no workspace ou no
diretório de estado. Para cada chamada `exec` de modo de código, o OpenClaw
constrói o catálogo de ferramentas com escopo de execução, mantém as entradas MCP
visíveis, renderiza `mcp/index.d.ts` mais uma declaração `mcp/<server>.d.ts` por
servidor visível e injeta essa pequena tabela somente leitura no worker QuickJS.
O código convidado vê somente o objeto `API`: `API.list(prefix?)` retorna
metadados de arquivo e `API.read(path)` retorna o conteúdo de declaração
selecionado. Caminhos desconhecidos e segmentos `.` / `..` são rejeitados.

Isso mantém grandes esquemas MCP fora do prompt do modelo. O agente aprende que
a API virtual existe pela descrição da ferramenta `exec`, lê somente o arquivo
de declaração necessário e então chama `MCP.<server>.<tool>()` com um argumento
de objeto. `MCP.<server>.$api()` permanece disponível como fallback inline
quando o agente precisa de uma resposta de esquema de uma única ferramenta
dentro do programa.

O runtime convidado não deve expor objetos do host diretamente. Entradas e
saídas cruzam a ponte como valores compatíveis com JSON com limites de tamanho
explícitos.

## Namespaces internos

Namespaces internos dão ao modo de código uma API de domínio concisa sem
adicionar mais ferramentas visíveis ao modelo. Uma integração pertencente ao
loader pode registrar um namespace como `Issues`, `Fictions` ou `Calendar`; o
código convidado então chama esse namespace dentro do programa QuickJS enquanto
o OpenClaw ainda mostra somente `exec` e `wait` ao modelo.

Namespaces são internos por enquanto. Não há API pública de namespace no SDK de
Plugin: namespaces de plugins externos precisam de um contrato pertencente ao
loader para que a identidade do plugin, manifests instalados, estado de auth e
descritores de catálogo em cache não se desviem das ferramentas de plugin que
sustentam o namespace. O modo de código do core possui apenas o sandbox, a
serialização, o bloqueio de catálogo e o despacho pela ponte.

O código convidado pode então usar o global direto ou o mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida do registro

O registro de namespaces é local ao processo e indexado por id de namespace. Uma
execução típica segue este caminho:

1. Um loader confiável chama `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. O modo de código cria o `ToolSearchRuntime` oculto para a execução e lê seu
   catálogo com escopo de execução.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` mantém somente registros cujos
   `requiredToolNames` estão todos visíveis e pertencem ao mesmo `pluginId`.
4. Cada namespace visível chama `createScope(ctx)` para a execução atual. O
   escopo recebe contexto de execução como `agentId`, `sessionKey`, `sessionId`,
   `runId`, configuração e estado de abort.
5. Os dados de escopo são serializados em um descritor simples e injetados no
   QuickJS como globais diretos e `namespaces.<globalName>`.
6. Chamadas do convidado são suspensas pela ponte do worker, resolvem o caminho
   do namespace no host, mapeiam a chamada para uma ferramenta de catálogo
   declarada e pertencente ao plugin e executam essa ferramenta por
   `ToolSearchRuntime.call`.
7. O OpenClaw drena automaticamente chamadas prontas da ponte de namespace
   dentro da chamada de ferramenta `exec`/`wait` ativa. Se o trabalho de
   namespace ainda estiver pendente no timeout ou o convidado ceder controle
   explicitamente, `wait` retoma o mesmo runtime de namespace depois.
8. Rollback ou desinstalação de plugin chama `clearCodeModeNamespacesForPlugin(pluginId)`
   para que globais obsoletos não sobrevivam a uma falha de carregamento de plugin.

A invariante importante: chamadas de namespace são chamadas de ferramentas de
catálogo. Elas usam os mesmos hooks de política, aprovações, tratamento de abort,
telemetria, projeção de transcrição e comportamento de suspensão/retomada que
`tools.call(...)`.

### Formato do registro

Registre namespaces pela integração que possui as ferramentas de suporte.
Mantenha o escopo pequeno e exponha somente verbos de domínio que mapeiem para
ferramentas de catálogo declaradas.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` marca um membro de escopo
como uma função de namespace chamável. O `inputMapper` opcional recebe os
argumentos do convidado e retorna o objeto de entrada para a ferramenta de
catálogo de suporte. Sem um mapeador de entrada, o primeiro argumento do
convidado é usado, ou `{}` quando omitido.

Funções brutas do host são rejeitadas antes que o código convidado execute:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Propriedade e visibilidade

A propriedade do namespace é vinculada ao `pluginId` do chamador do registro.
`requiredToolNames` é tanto um bloqueio de visibilidade quanto uma verificação
de propriedade:

- toda ferramenta exigida deve existir no catálogo da execução
- toda ferramenta exigida deve ter `sourceName === pluginId`
- o namespace fica oculto quando qualquer ferramenta exigida está ausente ou
  pertence a outro plugin
- cada caminho chamável pode mirar somente uma ferramenta nomeada em
  `requiredToolNames`

Isso impede que outro plugin exponha um namespace registrando uma ferramenta com
o mesmo nome. Também mantém namespaces alinhados à política comum de agentes: se
a execução não consegue ver as ferramentas de suporte, ela não consegue ver o
namespace.

Por exemplo, um namespace do GitHub deve ficar atrás de uma extensão pertencente
ao GitHub que possua auth do GitHub, clientes REST ou GraphQL, limites de taxa,
aprovações de escrita e testes. O modo de código do core não deve incorporar
APIs específicas do GitHub, tratamento de tokens ou política de provedor.

### Regras de serialização de escopo

`createScope(ctx)` pode retornar um objeto simples contendo valores compatíveis
com JSON, arrays, objetos aninhados e marcadores de chamada
`createCodeModeNamespaceTool(...)`. Objetos do host nunca entram diretamente no
QuickJS.

O serializador rejeita:

- funções brutas
- grafos de objetos circulares
- segmentos de caminho inseguros: `__proto__`, `constructor`, `prototype`, chaves
  vazias ou chaves contendo o separador de caminho interno
- valores `globalName` que não são identificadores JavaScript
- colisões de `globalName` com globais integrados do modo de código, como
  `tools`, `namespaces`, `text`, `json`, `yield_control` ou `__openclaw*`

Valores que não podem ser serializados como JSON são convertidos para valores
fallback seguros para JSON antes de cruzar a ponte. Dados binários, handles,
sockets, clientes e instâncias de classe devem permanecer atrás de ferramentas de
catálogo comuns.

### Prompts

A `description` do namespace e o `prompt` opcional são anexados ao esquema
`exec` visível ao modelo somente quando o namespace está visível para essa
execução. Use-os para ensinar a menor superfície útil:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Mantenha prompts sobre o contrato do namespace, não sobre configuração de auth,
histórico de implementação ou comportamento não relacionado de plugin.

### Limpeza

Namespaces são registros locais ao processo. Remova-os quando o plugin proprietário
for desabilitado, desinstalado ou revertido:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

A limpeza do modo de código pertence ao plugin; limpe os registros de namespace
do plugin quando seu ciclo de vida terminar, em vez de manter manipuladores de
desmontagem por namespace. Os testes podem chamar `clearCodeModeNamespacesForTest()`
para evitar vazamento de registros entre casos.

### Lista de verificação de testes

Alterações de namespace devem cobrir o limite de segurança e o comportamento convidado:

- o texto de prompt do namespace aparece somente quando as ferramentas de suporte estão visíveis
- ferramentas com o mesmo nome de outro `sourceName` não expõem o namespace
- funções de escopo brutas são rejeitadas
- ids de namespace forjados e caminhos forjados são rejeitados
- caminhos chamáveis não podem mirar ferramentas não declaradas
- objetos aninhados e referências compartilhadas serializam corretamente
- chamadas de namespace são executadas por ferramentas de catálogo e retornam detalhes seguros para JSON
- falhas podem ser capturadas pelo código convidado
- chamadas de namespace suspensas são retomadas por meio de `wait`
- a reversão do plugin limpa os registros de namespace do proprietário

Namespaces complementam o catálogo genérico `tools.search` / `tools.call`. Use o
catálogo para ferramentas arbitrárias habilitadas do OpenClaw, de plugin e de cliente; use `MCP` para
ferramentas MCP; use outros namespaces para APIs de domínio documentadas e pertencentes a plugins, nas quais
código conciso é mais confiável do que consultas repetidas de esquema.

## API de saída

`text(value)` acrescenta saída legível por humanos ao array `output`.

`json(value)` acrescenta um item de saída estruturado após serialização
compatível com JSON.

O valor retornado final do código convidado se torna `value` em um resultado `completed`.

Item de saída:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Regras de saída:

- a ordem da saída corresponde às chamadas do convidado
- a saída é limitada por `maxOutputBytes`
- valores não serializáveis são convertidos em strings simples ou erros
- valores binários não são compatíveis na v1
- imagens e arquivos trafegam por ferramentas comuns do OpenClaw, não pela
  ponte do modo de código

## Catálogo de ferramentas

O catálogo oculto inclui ferramentas após a filtragem efetiva de política:

1. Ferramentas centrais do OpenClaw.
2. Ferramentas de plugins incluídos.
3. Ferramentas de plugins externos.
4. Ferramentas MCP.
5. Ferramentas fornecidas pelo cliente para a execução atual.

Ids de catálogo são estáveis dentro de uma execução e determinísticos entre
conjuntos equivalentes de ferramentas quando possível.

Formato recomendado de id:

```text
<source>:<owner>:<tool-name>
```

Exemplos:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

O catálogo omite ferramentas de controle do modo de código:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Isso evita recursão e mantém estreito o contrato voltado ao modelo.

Entradas MCP permanecem no catálogo com escopo de execução para que política, aprovações, hooks,
telemetria, projeção de transcrição e ids exatos de ferramentas continuem compartilhados com a
execução normal de ferramentas. As visualizações voltadas ao convidado `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` e `tools.call(...)` omitem entradas MCP. O namespace
gerado `MCP.<server>.<tool>({ ...input })` resolve de volta para o
id exato do catálogo e então despacha pelo mesmo caminho do executor.

## Interação da Busca de Ferramentas

O modo de código substitui a superfície de modelo da Busca de Ferramentas do OpenClaw para execuções em que está
ativo.

Quando `tools.codeMode.enabled` é true e o modo de código é ativado:

- O OpenClaw não expõe `tool_search_code`, `tool_search`, `tool_describe`,
  ou `tool_call` como ferramentas visíveis ao modelo.
- A mesma ideia de catalogação passa para dentro do runtime convidado.
- O runtime convidado recebe metadados compactos de `ALL_TOOLS` e auxiliares de busca, descrição
  e chamada para ferramentas não MCP.
- Chamadas MCP usam o namespace `MCP` gerado e seus cabeçalhos `$api()` em vez
  de `tools.call(...)`.
- Chamadas aninhadas despacham pelo mesmo caminho de executor do OpenClaw que a Busca de Ferramentas
  usa.

A página existente [Busca de Ferramentas](/pt-BR/tools/tool-search) descreve a ponte de catálogo compacta do OpenClaw.
O modo de código é a alternativa genérica do OpenClaw para execuções que podem
usar `exec` e `wait`.

## Nomes de ferramentas e colisões

A ferramenta `exec` visível ao modelo é a ferramenta do modo de código. Se a ferramenta normal de shell
`exec` do OpenClaw estiver habilitada, ela é ocultada do modelo e catalogada como qualquer
outra ferramenta.

Dentro do runtime convidado:

- `tools.call("openclaw:core:exec", input)` pode chamar a ferramenta exec do shell se
  a política permitir.
- `tools.exec(...)` é instalada somente se a entrada de catálogo exec do shell tiver um
  nome seguro inequívoco.
- a ferramenta `exec` do modo de código nunca fica disponível recursivamente por meio de `tools`.

Se duas ferramentas forem normalizadas para o mesmo nome conveniente seguro, o OpenClaw omite a
função de conveniência e exige `tools.call(id, input)`.

## Execução aninhada de ferramentas

Toda chamada aninhada de ferramenta atravessa a ponte do host e reentra no OpenClaw.

A execução aninhada preserva:

- id do agente ativo
- id da sessão e chave da sessão
- contexto do remetente e do canal
- política de sandbox
- política de aprovação
- hooks `before_tool_call` do plugin
- sinal de aborto
- atualizações por streaming quando disponíveis
- eventos de trajetória e auditoria

Chamadas aninhadas são projetadas na transcrição como chamadas reais de ferramenta para que os pacotes de suporte
possam mostrar o que aconteceu. A projeção identifica a chamada de ferramenta em modo de código pai
e o id da ferramenta aninhada.

Chamadas aninhadas paralelas são permitidas até `maxPendingToolCalls`.

## Estado de runtime

Cada execução em modo de código tem uma máquina de estados:

- `running`: a VM está executando ou chamadas aninhadas estão em andamento.
- `waiting`: o snapshot da VM existe e pode ser retomado com `wait`.
- `completed`: valor final retornado; snapshot excluído.
- `failed`: erro retornado; snapshot excluído.
- `expired`: snapshot ou estado pendente excedeu a retenção; não pode retomar.
- `aborted`: execução/sessão pai cancelada; snapshot excluído.

O estado é escopado por execução do agente, sessão e id da chamada de ferramenta. Uma chamada `wait` de uma
execução ou sessão diferente falha.

O armazenamento de snapshots é limitado:

- máximo de bytes de snapshot por execução
- máximo de snapshots ativos por processo
- TTL de snapshot
- limpeza ao fim da execução
- limpeza no encerramento do Gateway quando a persistência não é compatível

## Runtime QuickJS-WASI

O OpenClaw carrega `quickjs-wasi` como dependência direta no pacote proprietário. O
runtime não depende de uma cópia transitiva instalada para proxy, PAC ou outras
dependências não relacionadas.

Responsabilidades do runtime:

- compilar ou carregar o módulo WebAssembly QuickJS-WASI
- criar uma VM isolada por execução ou retomada em modo de código
- registrar callbacks de host por nomes estáveis
- definir limites de memória e interrupção
- avaliar JavaScript
- drenar jobs pendentes
- criar snapshot do estado suspenso da VM
- restaurar snapshots para `wait`
- descartar handles da VM e snapshots após estados terminais

O runtime executa fora do loop de eventos principal do OpenClaw em um worker. Um loop
infinito no convidado não deve bloquear o processo do Gateway indefinidamente.

## TypeScript

O suporte a TypeScript é apenas uma transformação de origem:

- entrada aceita: uma string de código TypeScript
- saída: string JavaScript avaliada pelo QuickJS-WASI
- sem verificação de tipos
- sem resolução de módulos
- sem `import` ou `require` na v1
- diagnósticos são retornados como resultados `failed`

O compilador TypeScript é carregado de forma preguiçosa apenas para células TypeScript. Células
JavaScript simples e modo de código desativado não carregam o compilador.

A transformação deve preservar números de linha úteis quando viável.

## Limite de segurança

Código do modelo é hostil. O runtime usa defesa em profundidade:

- executar QuickJS-WASI fora do loop de eventos principal
- carregar `quickjs-wasi` como dependência direta, não por meio do Codex ou de um pacote
  transitivo
- sem sistema de arquivos, rede, subprocesso, importação de módulos, variáveis de ambiente ou
  objetos globais do host no convidado
- usar limites de memória e interrupção do QuickJS
- aplicar timeout de tempo real do processo pai
- aplicar limites de saída, snapshot, log e chamadas pendentes
- serializar valores da ponte do host por meio de um adaptador JSON restrito
- converter erros do host em erros simples do convidado, nunca objetos do realm do host
- descartar snapshots em timeout, aborto, fim de sessão ou expiração
- rejeitar acesso recursivo a `exec`, `wait` e ferramentas de controle do Tool Search
- impedir que colisões de nomes de conveniência ocultem helpers de catálogo

O sandbox é uma camada de segurança. Operadores ainda podem precisar de endurecimento em nível de SO
para implantações de alto risco.

## Códigos de erro

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Erros retornados ao convidado são dados simples. Instâncias de `Error` do host, objetos
de stack, protótipos e funções do host não atravessam para o QuickJS.

## Telemetria

O modo de código relata:

- nomes de ferramentas visíveis enviados ao modelo
- tamanho do catálogo oculto e detalhamento por origem
- contagens de `exec` e `wait`
- contagens de busca, descrição e chamada aninhadas
- ids de ferramentas aninhadas chamadas
- falhas de timeout, memória, snapshot e limite de saída
- eventos de ciclo de vida de snapshot

A telemetria não deve incluir segredos, valores brutos de ambiente ou entradas de ferramenta não redigidas
além da política de trajetória existente do OpenClaw.

## Depuração

Use registro direcionado de transporte do modelo quando o modo de código se comportar de forma diferente de uma
execução normal de ferramenta:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depuração do formato do payload, use `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Isso registra um snapshot JSON limitado e redigido da requisição do modelo; ele só deve
ser usado durante a depuração porque prompts e texto de mensagens ainda podem aparecer.

Para depuração de stream, use `OPENCLAW_DEBUG_SSE=peek` para registrar os primeiros cinco
eventos SSE redigidos. O modo de código também falha fechado se o payload final do provedor
não contiver exatamente `exec` e `wait` depois que a superfície de modo de código tiver
sido ativada.

## Layout de implementação

Unidades de implementação:

- contrato de configuração: `tools.codeMode`
- construtor de catálogo: ferramentas efetivas para entradas compactas e mapa de ids
- adaptador de superfície do modelo: substituir ferramentas visíveis por `exec` e `wait`
- adaptador de runtime QuickJS-WASI: carregar, avaliar, criar snapshot, restaurar, descartar
- supervisor de worker: timeout, aborto, isolamento contra falhas
- adaptador de ponte: callbacks de host seguros para JSON e entrega de resultados
- adaptador de transformação TypeScript
- armazenamento de snapshots: TTL, limites de tamanho, escopo por execução/sessão
- projeção de trajetória para chamadas de ferramenta aninhadas
- contadores de telemetria e diagnósticos

A implementação reutiliza conceitos de catálogo e executor do Tool Search, mas
não usa o filho `node:vm` como sandbox.

## Checklist de validação

A cobertura do modo de código deve comprovar:

- a configuração desativada deixa a exposição de ferramentas existente inalterada
- a configuração de objeto sem `enabled: true` deixa o modo de código desativado
- a configuração ativada expõe apenas `exec` e `wait` ao modelo quando as ferramentas estão
  ativas para a execução
- execuções brutas sem ferramentas, `disableTools` e listas de permissões vazias não acionam a aplicação
  de payload do modo de código
- todas as ferramentas não MCP efetivas aparecem em `ALL_TOOLS`
- ferramentas negadas não aparecem em `ALL_TOOLS`
- `tools.search`, `tools.describe` e `tools.call` funcionam para ferramentas do OpenClaw
- `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` expõem declarações MCP no estilo TypeScript
  sem uma chamada de ponte/ferramenta
- o namespace MCP `$api()` permanece disponível como fallback inline para esquemas
- chamadas de namespace MCP funcionam para ferramentas MCP visíveis com uma entrada de objeto, enquanto
  entradas diretas do catálogo MCP estão ausentes de `tools.*`
- ferramentas de controle Tool Search ficam ocultas tanto da superfície do modelo quanto do catálogo
  oculto
- chamadas aninhadas preservam o comportamento de aprovação e hook
- o `exec` do shell fica oculto do modelo, mas pode ser chamado pelo ID de catálogo quando permitido
- `exec` e `wait` recursivos em modo de código não podem ser chamados a partir do código convidado
- a entrada TypeScript é transformada e avaliada sem carregar TypeScript em caminhos
  desativados ou somente JavaScript
- `import`, `require`, sistema de arquivos, rede e acesso ao ambiente falham
- loops infinitos expiram e não podem bloquear o Gateway
- falhas no limite de memória encerram a VM convidada
- limites de saída e snapshot são aplicados para chamadas concluídas e suspensas
- `wait` retoma um snapshot suspenso e retorna o valor final
- valores de `runId` expirados, abortados, de sessão errada e desconhecidos falham
- replay e persistência de transcrições preservam chamadas de controle do modo de código
- transcrição e telemetria mostram claramente chamadas de ferramenta aninhadas

## Plano de teste E2E

Execute-os como testes de integração ou de ponta a ponta ao alterar o runtime:

1. Inicie um Gateway com `tools.codeMode.enabled: false`.
2. Envie um turno de agente com um pequeno conjunto direto de ferramentas.
3. Afirme que as ferramentas visíveis ao modelo permanecem inalteradas.
4. Reinicie com `tools.codeMode.enabled: true`.
5. Envie um turno de agente com ferramentas de teste do OpenClaw, de plugin, MCP e de cliente.
6. Afirme que a lista de ferramentas visível ao modelo é exatamente `exec`, `wait`.
7. Em `exec`, leia `ALL_TOOLS` e afirme que as ferramentas de teste efetivas estão presentes.
8. Em `exec`, chame ferramentas do OpenClaw/plugin/cliente por meio de `tools.search`,
   `tools.describe` e `tools.call`.
9. Em `exec`, chame `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` e
   afirme que os arquivos de declaração descrevem ferramentas MCP visíveis.
10. Em `exec`, chame ferramentas MCP por meio de `MCP.<server>.<tool>({ ...input })` e
    afirme que entradas diretas do catálogo MCP estão ausentes de `ALL_TOOLS` e `tools.*`.
11. Afirme que ferramentas negadas estão ausentes e não podem ser chamadas por ID presumido.
12. Inicie uma chamada de ferramenta aninhada que resolva depois que `exec` retornar `waiting`.
13. Chame `wait` e afirme que a VM restaurada recebe o resultado da ferramenta.
14. Afirme que a resposta final contém a saída produzida após a restauração.
15. Afirme que timeout, aborto e expiração de snapshot limpam o estado do runtime.
16. Exporte a trajetória e afirme que chamadas aninhadas estão visíveis sob a chamada
    de modo de código pai.

Alterações apenas de documentação nesta página ainda devem executar `pnpm check:docs`.

## Relacionados

- [Tool Search](/pt-BR/tools/tool-search)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Execução de código](/pt-BR/tools/code-execution)

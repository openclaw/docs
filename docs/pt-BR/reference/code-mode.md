---
read_when:
    - Você quer habilitar o modo de código do OpenClaw para uma execução de agente
    - Você precisa explicar por que o modo de código é diferente do modo de código do Codex
    - Você está revisando o contrato compacto de ferramentas, o sandbox QuickJS-WASI, a transformação TypeScript ou a ponte oculta do catálogo de ferramentas
    - Você está adicionando ou revisando uma integração interna do registro de namespaces do modo de código
sidebarTitle: Code mode
summary: 'Modo de código do OpenClaw: uma superfície compacta de ferramentas opcional, baseada em QuickJS-WASI e em um catálogo oculto de ferramentas com escopo de execução'
title: Modo de código
x-i18n:
    generated_at: "2026-07-12T15:43:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

O modo de código é um recurso experimental e opcional do runtime de agentes do OpenClaw. Quando
ativado, o modelo deixa de ver o esquema de todas as ferramentas habilitadas; em vez disso, ele vê
`exec`, `wait` e qualquer ferramenta exclusivamente direta cujo resultado estruturado não possa atravessar
a ponte do guest, que aceita apenas JSON. O modelo escreve um pequeno programa JavaScript ou TypeScript
que pesquisa, descreve e chama o catálogo oculto de ferramentas.

Esta página documenta o modo de código do OpenClaw, não o Codex Code Mode. Os dois recursos
compartilham um nome e os mesmos nomes de ferramentas de controle (`exec`, `wait`), mas são
implementações separadas:

- O Codex Code Mode é executado dentro do ambiente de programação do Codex. Sua ferramenta `exec` é uma
  ferramenta de gramática livre: o modelo escreve código-fonte JavaScript bruto (opcionalmente
  prefixado por uma linha de pragma `// @exec: {...}` para opções de execução), executado
  em um runtime Deno/V8.
- O modo de código do OpenClaw é executado no runtime genérico de agentes do OpenClaw e fica
  desativado, a menos que `tools.codeMode.enabled: true` esteja configurado. Sua ferramenta `exec`
  recebe um payload JSON `{ code, language }`, executado em um worker QuickJS-WASI.

Ambas são superfícies de execução de JavaScript, não superfícies de comandos do shell. Trate-as
como recursos independentes, implementados de maneiras diferentes, que por acaso expõem
ferramentas `exec`/`wait` com nomes idênticos.

## O que ele faz

- A lista de ferramentas visível ao modelo passa a ser `exec`, `wait` e qualquer ferramenta exclusivamente direta,
  como `computer`, cujo resultado de imagem não possa atravessar a ponte do guest.
- `exec` avalia JavaScript ou TypeScript gerado pelo modelo em uma thread de worker
  QuickJS-WASI isolada.
- Todas as ferramentas habilitadas elegíveis para o catálogo (núcleo do OpenClaw, Plugin, MCP, cliente) são ocultadas do
  prompt do modelo e expostas dentro do programa guest por meio de `ALL_TOOLS`
  e `tools`.
- O código guest pesquisa o catálogo oculto, descreve o esquema de uma ferramenta e chama
  uma ferramenta pelo mesmo caminho de execução usado em turnos normais do agente (políticas,
  aprovações, hooks e telemetria continuam sendo aplicados).
- As ferramentas MCP são agrupadas no namespace `MCP`; no modo de código, essa é a
  única maneira compatível de chamá-las.
- `wait` retoma uma execução suspensa do modo de código quando chamadas de ferramentas aninhadas ainda estão
  pendentes.

O modo de código altera apenas a superfície de orquestração voltada ao modelo. Ele não
substitui ferramentas, ferramentas de Plugin, ferramentas MCP, autenticação, política de aprovação, comportamento
do canal ou seleção do modelo.

## Por que usá-lo

- Superfície de prompt menor: os provedores recebem duas ferramentas de controle e apenas as poucas
  ferramentas diretas necessárias, em vez de dezenas ou centenas de esquemas completos de ferramentas.
- Melhor orquestração: o modelo pode usar loops, junções, pequenas transformações,
  lógica condicional e chamadas paralelas de ferramentas aninhadas dentro de uma única célula de código.
- Neutro em relação ao provedor: funciona com ferramentas do OpenClaw, de Plugins, MCP e de clientes sem
  depender da execução de código nativa do provedor.
- Falha de forma fechada: se o modo de código estiver ativado, mas o runtime QuickJS-WASI estiver
  indisponível, a execução falha em vez de recorrer silenciosamente à exposição direta ampla
  de ferramentas.

É mais útil para agentes com um grande catálogo de ferramentas habilitadas ou para fluxos de trabalho nos quais
o modelo precisa pesquisar, combinar e chamar várias ferramentas antes de responder.

## Ativá-lo

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Forma abreviada:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

O modo de código permanece desativado quando `tools.codeMode` é omitido, definido como `false` ou é um objeto
sem `enabled: true`.

Se você usa agentes em sandbox com servidores MCP configurados, também permita o
Plugin MCP integrado na política de ferramentas da sandbox, por exemplo,
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consulte
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Defina limites explícitos para restrições mais rigorosas:

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
logs direcionados:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Com o modo de código ativo, os nomes das ferramentas voltadas ao modelo registrados no log devem ser `exec` e
`wait`. Para obter o payload completo e censurado do provedor, adicione
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` durante uma breve sessão de depuração.

## Visão geral técnica

O restante desta página aborda o contrato do runtime e os detalhes de implementação
para mantenedores, autores de Plugins que estejam depurando a exposição de ferramentas e operadores
que estejam validando implantações de alto risco.

## Status do runtime

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Estado padrão       | desativado                                                                                  |
| Estabilidade        | superfície experimental do OpenClaw (o Codex Code Mode é uma superfície separada e estável do ambiente Codex) |
| Superfície-alvo     | execuções genéricas de agentes do OpenClaw                                                  |
| Postura de segurança | o código do modelo é hostil                                                                |
| Garantia ao usuário | ativar o modo de código nunca recorre silenciosamente à exposição direta ampla de ferramentas |

## Escopo

O modo de código controla o formato de orquestração voltado ao modelo para uma execução preparada. Ele
não controla a seleção do modelo, o comportamento do canal, a autenticação, a política de ferramentas nem as
implementações de ferramentas.

Dentro do escopo: definições de ferramentas diretas/de controle visíveis ao modelo, construção do catálogo oculto de ferramentas,
execução guest em JavaScript/TypeScript, o runtime do worker QuickJS-WASI,
callbacks do host para pesquisar/descrever/chamar, estado retomável para
programas guest suspensos, limites de saída/tempo limite/memória/chamadas pendentes/snapshot
e projeção de telemetria/trajetória para chamadas de ferramentas aninhadas.

Fora do escopo: execução remota de código nativa do provedor, semântica de execução
de shell, alteração da autorização existente de ferramentas, scripts persistentes criados pelo usuário,
acesso a gerenciador de pacotes/arquivos/rede/módulos no código guest e reutilização direta
dos componentes internos do Codex Code Mode.

Ferramentas controladas pelo provedor, como sandboxes Python remotas, são ferramentas separadas. Consulte
[Execução de código](/pt-BR/tools/code-execution).

## Termos

- **Modo de código**: o modo de runtime do OpenClaw que oculta ferramentas do modelo compatíveis com o catálogo
  e expõe `exec`, `wait` e as ferramentas exclusivamente diretas necessárias.
- **Runtime guest**: a VM JavaScript QuickJS-WASI que avalia o código do modelo.
- **Ponte do host**: a superfície restrita de callbacks compatíveis com JSON, do código guest
  de volta ao OpenClaw.
- **Catálogo**: a lista de ferramentas efetivas no escopo da execução após a resolução normal
  de políticas de ferramentas, Plugins, MCP e ferramentas de clientes.
- **Chamada de ferramenta aninhada**: uma chamada de ferramenta feita pelo código guest por meio da ponte do host.
- **Snapshot**: estado serializado da VM QuickJS-WASI salvo para que `wait` possa continuar
  uma execução suspensa do modo de código.

## Configuração

`tools.codeMode.enabled` é a condição de ativação; definir outros campos não
ativa o recurso por si só.

| Campo                 | Padrão                         | Limite                                          |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | booleano; somente `true` ativa o modo de código |
| `runtime`             | `"quickjs-wasi"`               | único valor compatível                          |
| `mode`                | `"only"`                       | expõe ferramentas diretas/de controle e cataloga as demais |
| `languages`           | `["javascript", "typescript"]` | qualquer subconjunto das duas                   |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | limitado a `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Se o modo de código estiver ativado, mas o QuickJS-WASI não puder ser carregado, o OpenClaw falhará de forma fechada
nessa execução; ele não exporá silenciosamente as ferramentas normais como alternativa.

## Ativação

O modo de código é avaliado depois que a política efetiva de ferramentas é conhecida e antes que a
solicitação final ao modelo seja montada:

1. Resolva o agente, o modelo, o provedor, a sandbox, o canal, o remetente e a política
   da execução.
2. Construa a lista efetiva de ferramentas do OpenClaw, adicionando Plugins, ferramentas MCP e
   ferramentas de clientes elegíveis.
3. Aplique a política de permissão/negação.
4. Se `tools.codeMode.enabled` for falso, prossiga com a exposição normal das ferramentas.
5. Se estiver ativado e as ferramentas estiverem ativas para a execução, mantenha as ferramentas exclusivamente diretas
   necessárias e registre no catálogo do modo de código todas as ferramentas efetivas elegíveis para o catálogo.
6. Remova as ferramentas catalogadas da lista visível ao modelo; adicione `exec` e
   `wait` junto às ferramentas exclusivamente diretas mantidas.

Execuções que intencionalmente não têm ferramentas (chamadas brutas ao modelo, `disableTools: true`
ou uma lista `tools.allow` vazia) não ativam a superfície do modo de código mesmo
quando `tools.codeMode.enabled: true` está configurado. O modo de código e o OpenClaw Tool
Search são mutuamente exclusivos em uma execução; se o modo de código for ativado, a
Compaction do Tool Search não será aplicada.

O catálogo do modo de código é limitado ao escopo da execução e não deve vazar ferramentas de outro
agente, sessão, remetente ou execução.

## Ferramentas visíveis ao modelo

Quando o modo de código está ativo, o modelo vê `exec`, `wait` e qualquer ferramenta exclusivamente
direta necessária. Todas as outras ferramentas habilitadas ficam ocultas da lista de ferramentas voltada ao
modelo e são registradas no catálogo do modo de código.

Use `exec` para orquestração de ferramentas, junção de dados, loops, chamadas aninhadas paralelas
e transformações estruturadas. Use `wait` somente quando `exec` retornar um resultado retomável
`waiting`.

## `exec`

`exec` inicia uma célula do modo de código e retorna um resultado. O código de entrada é gerado pelo modelo
e deve ser tratado como hostil.

Entrada:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Regras:

- Um dos campos `code` ou `command` deve conter um valor não vazio.
- `code` é o campo documentado voltado ao modelo.
- `command` é aceito como um alias compatível com exec para políticas de hooks e
  reescritas confiáveis (a ferramenta normal de execução de shell do OpenClaw também usa um campo `command`);
  quando ambos estão presentes, os valores devem ser iguais.
- O padrão de `language` é `"javascript"`; o esquema o expõe como uma enumeração simples
  de strings (`"javascript" | "typescript"`), não como uma união `oneOf`/`anyOf`,
  pois alguns provedores rejeitam esses formatos.
- Se `language` for `"typescript"`, o OpenClaw transpila o código antes da avaliação.
- `exec` rejeita `import`, `require`, importação dinâmica e padrões de carregadores
  de módulos.
- `exec` nunca expõe recursivamente a implementação normal de `exec` do shell.
- Eventos de hook do `exec` externo do modo de código incluem `toolKind: "code_mode_exec"` e
  `toolInputKind: "javascript" | "typescript"` (quando conhecido), para que as políticas possam
  distinguir células do modo de código de chamadas de `exec` no estilo shell que compartilham o
  mesmo nome de ferramenta.

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

`exec` retorna `waiting` quando a VM QuickJS é suspensa com um estado retomável que
ainda requer uma continuação visível para o modelo; o resultado inclui um `runId` para
`wait`. As chamadas da ponte de namespace, incluindo chamadas de namespace MCP, são processadas automaticamente
na mesma chamada `exec`/`wait` enquanto estiverem prontas, permitindo um código compacto
o bloco pode chamar uma ferramenta MCP sem forçar uma chamada de ferramenta do modelo por namespace
aguardado.

`exec` retorna `completed` somente quando a VM convidada não tem nenhum trabalho pendente e o
valor final é compatível com JSON após a execução do adaptador de saída do OpenClaw.

## `wait`

`wait` retoma uma VM em modo de código suspensa.

Entrada:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

A saída é a mesma união `CodeModeResult` retornada por `exec`.

`wait` existe porque as ferramentas aninhadas do OpenClaw podem ser lentas, interativas, sujeitas a aprovação
ou transmitir atualizações parciais; o modelo não deve precisar manter uma longa
chamada `exec` aberta enquanto o host aguarda trabalho externo.

O snapshot/restauração do QuickJS-WASI é o mecanismo de retomada:

1. `exec` avalia o código até a conclusão, falha ou suspensão.
2. Na suspensão, o OpenClaw cria um snapshot da VM do QuickJS e registra o trabalho
   pendente do host.
3. Quando o trabalho pendente é concluído, `wait` restaura o snapshot da VM e
   registra novamente os callbacks do host usando nomes estáveis.
4. O OpenClaw entrega os resultados das ferramentas aninhadas à VM restaurada e processa
   os trabalhos pendentes do QuickJS.
5. `wait` retorna `completed`, `failed` ou outro resultado `waiting`.

Os snapshots são estados de execução, não artefatos do usuário: eles residem apenas em um
mapa no processo (sem gravação em banco de dados ou disco), têm tamanho limitado, expiram e são
restritos à execução e à sessão que os criaram.

`wait` falha (como um resultado `failed`) quando:

- `runId` é desconhecido ou seu snapshot já expirou.
- o chamador não está no mesmo escopo de execução/sessão que a execução suspensa.
- um `wait` já está em andamento para esse `runId`.
- a restauração do QuickJS-WASI falha.
- a retomada excederia `maxOutputBytes` ou `maxSnapshotBytes`.

## API do runtime convidado

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` contém metadados compactos do catálogo com escopo da execução; por padrão, ele não
contém esquemas completos.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

As ferramentas de Plugin usam `source: "openclaw"` com `sourceName` definido como o id do
Plugin proprietário; não há um valor de origem `"plugin"` separado. `source: "mcp"` é
usado apenas para entradas MCP nos metadados `sourceName`/`mcp` (e é filtrado
de `ALL_TOOLS`/`tools.*`; veja abaixo).

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

As funções de conveniência das ferramentas são instaladas somente para nomes seguros inequívocos:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// Se o catálogo oculto tiver uma entrada `web_search` inequívoca:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

As entradas do catálogo MCP não podem ser chamadas por meio de `tools.call(...)` nem de funções de
conveniência no modo de código; elas são expostas somente por meio do namespace `MCP`
gerado. Arquivos de declaração no estilo TypeScript estão disponíveis por meio da superfície de arquivos virtuais
`API` somente leitura, permitindo que os agentes inspecionem as assinaturas MCP
sem adicionar esquemas MCP ao prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigue os logs do Gateway",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` retorna declarações compactas inferidas dos metadados das ferramentas MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Retorna este cabeçalho de API no estilo TypeScript. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Cria uma issue no GitHub.
   * @param owner Proprietário do repositório
   * @param repo Nome do repositório
   * @param title Título da issue
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Os arquivos de declaração são virtuais e não são gravados no workspace nem no diretório de estado. Para cada chamada `exec` no modo de código, o OpenClaw cria o catálogo de ferramentas com escopo da execução, mantém as entradas MCP visíveis, renderiza `mcp/index.d.ts` e um `mcp/<server>.d.ts` para cada servidor visível e injeta essa pequena tabela somente leitura no worker QuickJS. O código convidado vê apenas o objeto `API`: `API.list(prefix?)` retorna metadados de arquivos, e `API.read(path)` retorna o conteúdo da declaração selecionada. Caminhos desconhecidos e segmentos `.`/`..` são rejeitados.

Isso mantém esquemas MCP grandes fora do prompt do modelo: o agente descobre que a API virtual existe pela descrição da ferramenta `exec`, lê apenas o arquivo de declaração necessário e então chama `MCP.<server>.<tool>()` com um argumento de objeto. `MCP.<server>.$api()` permanece disponível como fallback inline para uma resposta de esquema de uma única ferramenta dentro do programa.

O runtime convidado nunca vê objetos do host diretamente. Entradas e saídas atravessam a ponte como valores compatíveis com JSON, com limites de tamanho explícitos.

## Namespaces internos

Namespaces internos fornecem ao modo de código uma API de domínio concisa sem adicionar mais ferramentas visíveis ao modelo. Uma integração controlada pelo loader registra um namespace como `Issues` ou `Calendar`; o código convidado então chama esse namespace dentro do programa QuickJS, enquanto o modelo continua vendo a superfície compacta de controle/direta.

Por enquanto, os namespaces são internos. Não há uma API pública de namespace no SDK de plugins: namespaces de plugins externos precisam de um contrato controlado pelo loader para que a identidade do plugin, os manifestos instalados, o estado de autenticação e os descritores de catálogo em cache não fiquem dessincronizados das ferramentas do plugin que sustentam o namespace. O modo de código do core controla apenas o sandbox, a serialização, a restrição pelo catálogo e o despacho da ponte.

O código convidado pode usar tanto o global direto quanto o mapa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo de vida do registro

O registro de namespaces é local ao processo e indexado pelo id do namespace:

1. Um loader confiável chama `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. O modo de código cria o `ToolSearchRuntime` oculto para a execução e lê seu catálogo com escopo da execução.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` mantém apenas os registros cujos `requiredToolNames` estão todos visíveis e pertencem ao mesmo `pluginId`.
4. Cada namespace visível chama `createScope(ctx)` para a execução atual, recebendo contexto de execução como `agentId`, `sessionKey`, `sessionId`, `runId`, configuração e estado de cancelamento.
5. Os dados do escopo são serializados em um descritor simples e injetados no QuickJS como globais diretos e `namespaces.<globalName>`.
6. As chamadas do código convidado são suspensas pela ponte do worker, resolvem o caminho do namespace no host, mapeiam a chamada para uma ferramenta declarada do catálogo pertencente ao plugin e executam essa ferramenta por meio de `ToolSearchRuntime.callExactId`.
7. As chamadas prontas da ponte de namespaces são drenadas automaticamente dentro da chamada ativa `exec`/`wait`; se ainda houver trabalho de namespace pendente ao atingir o tempo limite ou se o código convidado ceder explicitamente, `wait` retoma posteriormente o mesmo runtime de namespace.
8. O rollback ou a desinstalação do plugin chama `clearCodeModeNamespacesForPlugin(pluginId)` para que globais obsoletos não sobrevivam a uma falha no carregamento do plugin.

As chamadas de namespace são chamadas de ferramentas do catálogo: elas usam os mesmos hooks de política, aprovações, tratamento de cancelamento, telemetria, projeção da transcrição e comportamento de suspensão/retomada que `tools.call(...)`.

### Formato do registro

Registre namespaces pela integração que controla as ferramentas subjacentes. Mantenha o escopo pequeno e exponha somente verbos de domínio que correspondam a ferramentas declaradas no catálogo.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "Auxiliares de issues do GitHub para o repositório atual.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) e Issues.update(number, patch).",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` marca um membro do escopo como uma função de namespace chamável. O `inputMapper` opcional recebe os argumentos do código convidado e retorna o objeto de entrada para a ferramenta de catálogo subjacente; sem ele, o primeiro argumento do código convidado é usado, ou `{}` quando omitido.

Funções brutas do host são rejeitadas antes da execução do código convidado:

```typescript
createScope: () => ({
  // Incorreto: isso ignora o ciclo de vida da ferramenta de catálogo e será rejeitado.
  list: async () => githubClient.listIssues(),
});
```

### Propriedade e visibilidade

A propriedade do namespace é vinculada ao `pluginId` do chamador do registro. `requiredToolNames` funciona tanto como restrição de visibilidade quanto como verificação de propriedade:

- toda ferramenta obrigatória deve existir no catálogo da execução
- toda ferramenta obrigatória deve ter `sourceName === pluginId`
- o namespace fica oculto quando qualquer ferramenta obrigatória está ausente ou pertence a outro plugin
- cada caminho chamável pode direcionar somente para uma ferramenta mencionada em `requiredToolNames`

Isso impede que outro plugin exponha um namespace registrando uma ferramenta com o mesmo nome e mantém os namespaces alinhados à política comum do agente: se a execução não puder ver as ferramentas subjacentes, ela não poderá ver o namespace.

Por exemplo, um namespace do GitHub deve ficar atrás de um plugin pertencente ao GitHub que controle a autenticação do GitHub, clientes REST/GraphQL, limites de taxa, aprovações de escrita e testes. O modo de código do core não deve incorporar APIs específicas do GitHub, tratamento de tokens ou políticas de provedor.

### Regras de serialização do escopo

`createScope(ctx)` pode retornar um objeto simples contendo valores compatíveis com JSON, arrays, objetos aninhados e marcadores de chamada `createCodeModeNamespaceTool(...)`. Objetos do host nunca entram diretamente no QuickJS.

O serializador rejeita:

- funções brutas
- grafos de objetos circulares
- segmentos de caminho não seguros: `__proto__`, `constructor`, `prototype`, chaves vazias
  ou chaves contendo o separador de caminho interno
- valores de `globalName` que não são identificadores JavaScript
- colisões de `globalName` com globais integradas do modo de código, como `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` ou
  `__openclaw*`

Os valores que não podem ser serializados como JSON são convertidos em valores
alternativos seguros para JSON antes de atravessar a ponte. Dados binários,
identificadores, soquetes, clientes e instâncias de classe devem permanecer
por trás das ferramentas comuns do catálogo.

### Prompts

A `description` e o `prompt` opcional do namespace são anexados ao esquema de
`exec` visível para o modelo somente quando o namespace está visível nessa
execução. Use-os para ensinar a menor superfície útil:

```typescript
{
  description: "Auxiliares do serviço de produção de ficção.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status) e Fictions.unpaidOver(amount).",
}
```

Mantenha os prompts relacionados ao contrato do namespace, não à configuração
de autenticação, ao histórico de implementação ou a comportamentos não
relacionados do plugin.

### Limpeza

Os namespaces são registros locais do processo. Remova-os quando o plugin
proprietário for desabilitado, desinstalado ou revertido:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

A limpeza do modo de código é responsabilidade do plugin; limpe os registros
de namespace do plugin quando seu ciclo de vida terminar, em vez de manter
identificadores de desmontagem por namespace. Os testes podem chamar
`clearCodeModeNamespacesForTest()` para evitar o vazamento de registros entre
casos.

### Lista de verificação de testes

As alterações de namespace devem abranger o limite de segurança e o
comportamento do código convidado:

- o texto do prompt do namespace aparece somente quando as ferramentas
  subjacentes estão visíveis
- ferramentas com o mesmo nome provenientes de outro `sourceName` não expõem
  o namespace
- funções de escopo brutas são rejeitadas
- IDs de namespace forjados e caminhos forjados são rejeitados
- caminhos invocáveis não podem apontar para ferramentas não declaradas
- objetos aninhados e referências compartilhadas são serializados corretamente
- as chamadas de namespace são executadas por meio das ferramentas do catálogo
  e retornam detalhes seguros para JSON
- as falhas podem ser capturadas pelo código convidado
- chamadas de namespace suspensas são retomadas por meio de `wait`
- a reversão do plugin limpa os registros de namespace pertencentes a ele

Os namespaces complementam o catálogo genérico `tools.search`/`tools.call`: use
o catálogo para ferramentas arbitrárias habilitadas do OpenClaw, de plugins e
de clientes; use `MCP` para ferramentas MCP; use outros namespaces para APIs de
domínio documentadas e pertencentes a plugins, nas quais código conciso é mais
confiável do que consultas repetidas ao esquema.

## API de saída

- `text(value)` acrescenta uma saída legível por humanos ao array `output`.
- `json(value)` acrescenta um item de saída estruturado após a serialização
  compatível com JSON.
- O valor final retornado pelo código convidado torna-se `value` em um
  resultado `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Regras: a ordem de saída corresponde à ordem das chamadas do guest; a saída é limitada por
`maxOutputBytes`; valores não serializáveis são convertidos em strings simples ou
erros; valores binários não são compatíveis. Imagens e arquivos são transmitidos por
ferramentas comuns do OpenClaw, não pela ponte do modo de código.

## Catálogo de ferramentas

O catálogo oculto inclui as ferramentas após a filtragem efetiva por políticas, nesta
ordem: ferramentas principais do OpenClaw, ferramentas de plugins incluídos, ferramentas
de plugins externos, ferramentas MCP e, por fim, ferramentas fornecidas pelo cliente para
a execução atual.

Os ids do catálogo são estáveis dentro de uma execução e determinísticos entre conjuntos
de ferramentas equivalentes, quando possível. Formato real:

```text
<source>:<owner>:<tool-name>
```

em que `<source>` é `openclaw`, `mcp` ou `client` (as ferramentas de plugins usam
`openclaw` com o id do plugin como `<owner>`; as ferramentas principais usam `openclaw:core:*`).
Exemplos:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

O catálogo omite as ferramentas de controle do modo de código (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) e as ferramentas somente diretas. Os controles
não devem fazer chamadas recursivas pelo catálogo; as ferramentas somente diretas permanecem
visíveis para o modelo porque seus resultados estruturados não podem atravessar a ponte do QuickJS.

As entradas MCP permanecem no catálogo com escopo de execução para que políticas, aprovações, hooks,
telemetria, projeção da transcrição e ids exatos das ferramentas continuem compartilhados com
a execução normal de ferramentas. As visualizações voltadas ao guest `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` e `tools.call(...)` omitem as entradas MCP. O namespace
gerado `MCP.<server>.<tool>({ ...input })` é resolvido para o id exato do catálogo e despachado
pelo mesmo caminho do executor.

## Interação com a Pesquisa de Ferramentas

O modo de código substitui a superfície de modelo da Pesquisa de Ferramentas do OpenClaw nas execuções
em que está ativo.

Quando `tools.codeMode.enabled` é true e o modo de código é ativado:

- O OpenClaw não expõe `tool_search_code`, `tool_search`, `tool_describe`
  nem `tool_call` como ferramentas visíveis para o modelo.
- O mesmo conceito de catalogação é transferido para o runtime do guest.
- O runtime do guest recebe metadados compactos de `ALL_TOOLS` e auxiliares de pesquisa/descrição/
  chamada para ferramentas que não são MCP.
- As chamadas MCP usam o namespace `MCP` gerado e seus cabeçalhos `$api()` em vez de
  `tools.call(...)`.
- As chamadas aninhadas são despachadas pelo mesmo caminho do executor do OpenClaw usado pela Pesquisa
  de Ferramentas.

Consulte [Pesquisa de Ferramentas](/pt-BR/tools/tool-search) para conhecer a ponte de catálogo compacto do OpenClaw
que o modo de código substitui nas execuções ativas.

## Nomes de ferramentas e colisões

A ferramenta `exec` visível para o modelo é a ferramenta do modo de código. Se a ferramenta normal
de shell `exec` do OpenClaw estiver habilitada, ela ficará oculta para o modelo e será catalogada como
qualquer outra ferramenta.

Dentro do runtime convidado:

- `tools.call("openclaw:core:exec", input)` pode chamar a ferramenta de execução do shell se
  a política permitir.
- `tools.exec(...)` é instalado somente se a entrada do catálogo de execução do shell tiver um
  nome seguro inequívoco.
- a ferramenta `exec` do modo de código nunca fica disponível recursivamente por meio de `tools`.

Se duas ferramentas forem normalizadas para o mesmo nome conveniente seguro, o OpenClaw omitirá a
função conveniente e exigirá `tools.call(id, input)`.

## Execução aninhada de ferramentas

Cada chamada aninhada de ferramenta atravessa a ponte do host e entra novamente no OpenClaw,
preservando: id do agente ativo, id e chave da sessão, contexto do remetente e do canal,
política de sandbox, política de aprovação, hooks `before_tool_call` do plugin, sinal de
interrupção, atualizações por streaming quando disponíveis e eventos de trajetória/auditoria.

As chamadas aninhadas são projetadas na transcrição como chamadas reais de ferramentas para que os
pacotes de suporte mostrem o que aconteceu, com a projeção identificando a chamada da ferramenta
pai do modo de código e o id da ferramenta aninhada.

Chamadas aninhadas paralelas são permitidas até `maxPendingToolCalls`.

## Ciclo de vida da execução e do snapshot

Cada execução do modo de código é rastreada em um mapa em processo indexado por `runId` (não
persistido em disco nem em um banco de dados). `exec`/`wait` retornam um de três estados de
resultado: `completed`, `waiting` ou `failed`.

- Um resultado `waiting` armazena o snapshot do QuickJS, as solicitações pendentes da ponte e
  os metadados de escopo (id da execução do agente, id/chave da sessão) até que `wait` o retome ou
  ele expire.
- Valores de `runId` expirados, de sessão incorreta, de execução incorreta e desconhecidos/já em retomada
  não produzem um estado terminal distinto; eles aparecem como um
  resultado `failed` (`code: "invalid_input"`) com uma mensagem como `code mode
run is unavailable or expired.` ou `code mode run belongs to a different
session.`.
- O snapshot de uma execução é removido do mapa assim que ela termina como
  `completed` ou `failed`, ou é descartado no encerramento do Gateway (nada
  sobrevive a uma reinicialização: este é um estado transitório do runtime).
- Para trabalho somente leitura, `exec` pode definir `restartSafe: true`. O OpenClaw então rejeita
  chamadas de catálogo com efeitos colaterais e namespaces de plugins antes da execução e
  marca resultados suspensos como seguros para reprodução. Se uma reinicialização interromper `wait`,
  a [recuperação após reinicialização](/gateway/restart-recovery) reconstruirá o turno a partir da
  transcrição em vez de restaurar o snapshot local do processo. O próprio turno de recuperação
  permanece limitado a ferramentas principais auditadas somente leitura e ferramentas de plugins
  explicitamente seguras para reprodução.
- O OpenClaw limita o número de execuções suspensas simultaneamente por processo (64) e
  rejeita novas suspensões além desse limite com `too many suspended code mode
runs.`.

O armazenamento de snapshots é limitado por `maxSnapshotBytes` por execução, pelo limite por processo
de execuções suspensas mencionado acima e por `snapshotTtlSeconds`.

## Runtime QuickJS-WASI

O OpenClaw carrega `quickjs-wasi` como uma dependência direta no pacote proprietário; ele
não depende de uma cópia transitiva instalada para uma dependência não relacionada.

Responsabilidades do runtime: compilar/carregar o módulo WebAssembly do QuickJS-WASI;
criar uma VM isolada por execução ou retomada do modo de código; registrar callbacks do host
com nomes estáveis; definir limites de memória e interrupção; avaliar JavaScript; processar
tarefas pendentes; criar snapshots do estado suspenso da VM; restaurar snapshots para `wait`;
liberar identificadores de VM e snapshots após estados terminais.

O runtime é executado em uma thread worker do Node.js, fora do loop principal de
eventos do OpenClaw. Um loop infinito no convidado não deve bloquear o processo do Gateway
indefinidamente; o manipulador de interrupções do worker impõe o tempo limite de relógio
independentemente da cooperação do código convidado.

## TypeScript

O suporte a TypeScript é apenas uma transformação de código-fonte: a entrada aceita é uma única
string de código TypeScript; a saída é uma string JavaScript avaliada pelo
QuickJS-WASI. Não há verificação de tipos, resolução de módulos nem
`import`/`require`. Os diagnósticos são retornados como resultados `failed`.

O compilador TypeScript é carregado de forma preguiçosa apenas para células TypeScript; células
JavaScript simples e o modo de código desativado nunca o carregam.

## Limite de segurança

O código do modelo é hostil. O runtime usa defesa em profundidade:

- executa o QuickJS-WASI fora do loop de eventos principal, em uma thread de trabalho
- carrega `quickjs-wasi` como uma dependência direta, não por meio do Codex nem de um
  pacote transitivo
- não há sistema de arquivos, rede, subprocessos, importação de módulos, variáveis de ambiente
  nem objetos globais do host no ambiente convidado
- usa limites de memória e de interrupção do QuickJS, além de um tempo limite
  de relógio de parede no processo pai
- impõe limites de saída, snapshots, logs e chamadas pendentes
- serializa os valores da ponte do host por meio de um adaptador JSON restrito
- converte erros do host em erros simples no ambiente convidado, nunca em objetos do realm do host
- descarta snapshots em caso de tempo limite, cancelamento, encerramento da sessão ou expiração
- rejeita acesso recursivo a `exec`, `wait` e às ferramentas de controle do Tool Search
- impede que colisões de nomes de conveniência ocultem os auxiliares do catálogo

O sandbox é uma camada de segurança; os operadores ainda podem precisar de
reforço de segurança no nível do sistema operacional para implantações de alto risco.

## Códigos de erro

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` abrange argumentos inválidos de `exec`/`wait`, linguagens desativadas,
acesso rejeitado a módulos, falhas na transformação de TypeScript, valores de `runId`
desconhecidos, expirados ou de escopo incorreto e execuções suspensas em excesso. `runtime_unavailable`
abrange um worker do QuickJS que não consegue iniciar ou encerra com código diferente de zero.

Os erros retornados ao ambiente convidado são dados simples; instâncias de `Error` do host, objetos
de pilha, protótipos e funções do host não atravessam para o QuickJS.

## Telemetria

O campo `telemetry` de cada resultado informa: o tamanho do catálogo oculto e uma
divisão por origem (contagens de `openclaw`/`mcp`/`client`), contagens acumuladas de
pesquisas/descrições/chamadas para o catálogo da execução e os nomes de ferramentas visíveis ao modelo (`exec`,
`wait` e ferramentas retidas somente para acesso direto).

A telemetria não deve incluir segredos, valores brutos de ambiente nem entradas de
ferramentas sem redação além do permitido pela política de trajetória existente do OpenClaw.

## Depuração

Use o registro direcionado do transporte do modelo quando o modo de código se comportar de maneira diferente de
uma execução normal de ferramenta:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Para depurar o formato do payload, use `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Isso registra um snapshot JSON limitado e redigido da solicitação ao modelo; use-o apenas
durante a depuração, pois prompts e texto de mensagens ainda podem aparecer.

Para depuração de stream, use `OPENCLAW_DEBUG_SSE=peek` para registrar os cinco primeiros
eventos SSE com dados sensíveis ocultados. O modo de código também falha de forma segura se o payload final do provedor
não contiver exatamente um `exec`, um `wait` e somente ferramentas
direct-only aprovadas após a ativação da superfície do modo de código.

## Estrutura da implementação

- contrato de configuração: `tools.codeMode`
- construtor de catálogo: ferramentas efetivas convertidas em entradas compactas e mapa de IDs
- adaptador da superfície do modelo: substitui as ferramentas visíveis por ferramentas de controle/direct-only
- adaptador de runtime QuickJS-WASI: carregar, avaliar, criar snapshot, restaurar, descartar
- supervisor de workers: tempo limite, cancelamento, isolamento de falhas
- adaptador da ponte: callbacks do host compatíveis com JSON e entrega de resultados
- adaptador de transformação TypeScript
- armazenamento de snapshots: TTL, limites de tamanho, escopo de execução/sessão
- projeção de trajetória para chamadas de ferramentas aninhadas
- contadores de telemetria e diagnósticos

A implementação reutiliza conceitos de catálogo e executor da Busca de Ferramentas, mas
não usa um processo filho `node:vm` como sandbox.

## Lista de verificação de validação

A cobertura do modo de código deve comprovar:

- a configuração desabilitada mantém inalterada a exposição existente de ferramentas
- a configuração como objeto sem `enabled: true` mantém o modo de código desabilitado
- a configuração habilitada expõe `exec`, `wait` e somente as ferramentas direct-only necessárias ao
  modelo quando as ferramentas estão ativas para a execução
- execuções brutas sem ferramentas, `disableTools` e listas de permissões vazias não acionam
  a imposição do payload do modo de código
- todas as ferramentas efetivas não MCP elegíveis para o catálogo aparecem em `ALL_TOOLS`
- as ferramentas direct-only permanecem visíveis ao modelo e não aparecem em `ALL_TOOLS`
- as ferramentas negadas não aparecem em `ALL_TOOLS`
- `tools.search`, `tools.describe` e `tools.call` funcionam para ferramentas do OpenClaw
- `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` expõem declarações MCP no estilo
  TypeScript sem uma chamada de ponte/ferramenta
- o `$api()` do namespace MCP permanece disponível como fallback inline para esquemas
- as chamadas do namespace MCP funcionam para ferramentas MCP visíveis com uma entrada de objeto, enquanto
  as entradas diretas do catálogo MCP não aparecem em `tools.*`
- as ferramentas de controle da Busca de Ferramentas ficam ocultas tanto da superfície do modelo quanto do
  catálogo oculto
- as chamadas aninhadas preservam o comportamento de aprovação e dos hooks
- o `exec` do shell fica oculto do modelo, mas pode ser chamado pelo ID do catálogo quando
  permitido
- `exec` e `wait` recursivos do modo de código não podem ser chamados pelo código convidado
- a entrada TypeScript é transformada e avaliada sem carregar o TypeScript nos
  caminhos desabilitados ou exclusivos de JavaScript
- o acesso a `import`, `require`, sistema de arquivos, rede e ambiente falha
- loops infinitos atingem o tempo limite e não podem bloquear o Gateway
- falhas no limite de memória encerram a VM convidada
- os limites de saída e snapshot são aplicados a chamadas concluídas e suspensas
- `wait` retoma um snapshot suspenso e retorna o valor final
- valores `runId` expirados, cancelados, de sessão incorreta e desconhecidos falham
- a reprodução e a persistência da transcrição preservam as chamadas de controle do modo de código
- a transcrição e a telemetria mostram claramente as chamadas de ferramentas aninhadas

## Plano de testes E2E

Execute estes testes como testes de integração ou de ponta a ponta ao alterar o runtime:

1. Inicie um Gateway com `tools.codeMode.enabled: false`.
2. Envie um turno do agente com um pequeno conjunto de ferramentas diretas.
3. Verifique se as ferramentas visíveis ao modelo permanecem inalteradas.
4. Reinicie com `tools.codeMode.enabled: true`.
5. Envie um turno do agente com ferramentas de teste do OpenClaw, de plugins, MCP e do cliente.
6. Verifique se a lista de ferramentas visíveis ao modelo é composta por `exec`, `wait` e somente pelas ferramentas
   direct-only configuradas.
7. Em `exec`, leia `ALL_TOOLS` e verifique se as ferramentas de teste efetivas elegíveis para o catálogo
   estão presentes, enquanto as ferramentas direct-only estão ausentes.
8. Em `exec`, chame ferramentas do OpenClaw/de plugins/do cliente por meio de `tools.search`,
   `tools.describe` e `tools.call`.
9. Em `exec`, chame `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` e
   verifique se os arquivos de declaração descrevem as ferramentas MCP visíveis.
10. Em `exec`, chame ferramentas MCP por meio de `MCP.<server>.<tool>({ ...input })` e
    verifique se as entradas diretas do catálogo MCP estão ausentes de `ALL_TOOLS` e
    `tools.*`.
11. Verifique se as ferramentas negadas estão ausentes e não podem ser chamadas por um ID presumido.
12. Inicie uma chamada de ferramenta aninhada que seja resolvida depois que `exec` retornar `waiting`.
13. Chame `wait` e verifique se a VM restaurada recebe o resultado da ferramenta.
14. Verifique se a resposta final contém a saída produzida após a restauração.
15. Verifique se o tempo limite, o cancelamento e a expiração do snapshot limpam o estado do runtime.
16. Exporte a trajetória e verifique se as chamadas aninhadas estão visíveis sob a chamada pai
    do modo de código.

Alterações somente na documentação desta página ainda devem executar `pnpm check:docs`.

## Relacionado

- [Busca de Ferramentas](/pt-BR/tools/tool-search)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Execução de código](/pt-BR/tools/code-execution)

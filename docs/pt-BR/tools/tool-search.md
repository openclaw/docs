---
read_when:
    - Você quer que agentes PI usem um grande catálogo de ferramentas sem adicionar todos os esquemas de ferramentas ao prompt
    - Você quer ferramentas OpenClaw, ferramentas MCP e ferramentas de cliente expostas por meio de uma única superfície PI compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções do Pi
summary: 'Busca de ferramentas: compacte grandes catálogos de ferramentas PI por trás de busca, descrição e chamada'
title: Busca de ferramentas
x-i18n:
    generated_at: "2026-05-11T20:38:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

A Busca de Ferramentas é um recurso experimental de agente PI do OpenClaw. Ela oferece aos agentes PI uma forma
compacta de descobrir e chamar grandes catálogos de ferramentas. É útil quando a execução
tem muitas ferramentas disponíveis, mas o modelo provavelmente precisará de apenas algumas delas.

Esta página documenta a Busca de Ferramentas PI do OpenClaw. Ela não é a busca de ferramentas
nativa do Codex nem a superfície de ferramentas dinâmicas. O modo de código nativo do Codex, a busca de ferramentas,
as ferramentas dinâmicas adiadas e as chamadas de ferramentas aninhadas são superfícies estáveis do harness do Codex e
não dependem de `tools.toolSearch`.

Quando habilitado para PI, o modelo recebe uma ferramenta `tool_search_code` por padrão.
Essa ferramenta executa um corpo JavaScript curto em um subprocesso Node isolado com uma
ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

O catálogo pode incluir ferramentas do OpenClaw, ferramentas de Plugin, ferramentas MCP e
ferramentas fornecidas pelo cliente. O modelo não vê todos os esquemas completos de antemão.
Em vez disso, ele pesquisa descritores compactos, descreve uma ferramenta selecionada quando
precisa do esquema exato e chama essa ferramenta por meio do OpenClaw.

Execuções do harness do Codex não recebem esses controles experimentais da Busca de Ferramentas
do OpenClaw. O OpenClaw passa capacidades do produto para o Codex como ferramentas dinâmicas, e
o Codex é responsável pelo modo de código nativo estável, pela busca de ferramentas nativa, pelas ferramentas dinâmicas
adiadas e pelas chamadas de ferramentas aninhadas.

## Como um turno é executado

No momento do planejamento, o executor PI incorporado cria o catálogo efetivo para a
execução:

1. Resolver a política de ferramentas ativa para o agente, perfil, sandbox e sessão.
2. Listar as ferramentas elegíveis do OpenClaw e de Plugin.
3. Listar as ferramentas MCP elegíveis por meio do runtime MCP da sessão.
4. Adicionar ferramentas de cliente elegíveis fornecidas para a execução atual.
5. Indexar descritores compactos para busca.
6. Expor a ponte de código PI ou as ferramentas estruturadas de fallback ao
   modelo.

No momento da execução, toda chamada real de ferramenta retorna para o OpenClaw. O runtime Node
isolado não mantém implementações de Plugin, objetos de cliente MCP nem segredos.
`openclaw.tools.call(...)` cruza a ponte de volta para o Gateway, onde a
política, a aprovação, o hook, o registro em logs e o tratamento de resultados normais ainda se aplicam.

## Modos

`tools.toolSearch` tem dois modos visíveis ao modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas
  estruturadas simples para provedores que não devem receber código.

Ambos os modos usam o mesmo catálogo e caminho de execução. A única diferença é o
formato que o modelo vê. Se o runtime atual não puder iniciar o processo filho Node
isolado do modo de código, o modo `code` padrão recua para `tools` antes da
compactação do catálogo.

Ambos os modos são experimentais. Prefira exposição direta de ferramentas para catálogos pequenos de ferramentas PI,
e prefira as superfícies estáveis nativas do Codex para execuções do harness do Codex.

Não há uma configuração separada de seleção de fonte. Quando a Busca de Ferramentas está habilitada, o
catálogo inclui ferramentas elegíveis do OpenClaw, MCP e de cliente após a filtragem normal por política.

## Por que isso existe

Catálogos grandes são úteis, mas caros. Enviar todos os esquemas de ferramentas ao modelo
aumenta a requisição, desacelera o planejamento e aumenta a seleção acidental de ferramentas.

A Busca de Ferramentas muda o formato:

- ferramentas diretas: o modelo vê todos os esquemas selecionados antes do primeiro token
- modo de código da Busca de Ferramentas: o modelo vê uma ferramenta de código compacta e um contrato de API curto
- modo de ferramentas da Busca de Ferramentas: o modelo vê três ferramentas estruturadas compactas de fallback
- durante o turno: o modelo carrega apenas os esquemas de ferramentas de que realmente precisa

A exposição direta de ferramentas ainda é o padrão correto para catálogos pequenos. A Busca de Ferramentas
é melhor quando uma execução pode ver muitas ferramentas, especialmente de servidores MCP ou
ferramentas de aplicativos fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo da execução atual. Os resultados são compactos e seguros
para recolocar no contexto do prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carrega os metadados completos de um resultado de busca, incluindo o esquema de entrada exato.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Chama uma ferramenta selecionada por meio do OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

O modo estruturado de fallback expõe as mesmas operações como ferramentas:

- `tool_search`
- `tool_describe`
- `tool_call`

## Limite de runtime

A ponte de código é executada em um subprocesso Node de curta duração. O subprocesso inicia
com o modo de permissão do Node habilitado, um ambiente vazio, sem concessões de sistema de arquivos ou
rede, e sem concessões de processo filho ou worker. O OpenClaw impõe um
timeout de tempo real no processo pai e encerra o subprocesso no timeout, inclusive
após continuações assíncronas.

O runtime expõe apenas:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

O comportamento normal do OpenClaw ainda se aplica às chamadas finais:

- políticas de permissão e negação de ferramentas
- restrições de ferramentas por agente e por sandbox
- bloqueio exclusivo do proprietário
- hooks de aprovação
- hooks `before_tool_call` de Plugin
- identidade da sessão, logs e telemetria

## Configuração

Habilite a Busca de Ferramentas para execuções PI com a ponte de código padrão:

```bash
openclaw config set tools.toolSearch true
```

JSON equivalente:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Use as ferramentas estruturadas de fallback em vez disso para execuções PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Ajuste o timeout do modo de código e os limites de resultados de busca:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Desabilite:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt e telemetria

A Busca de Ferramentas registra telemetria suficiente para compará-la com a exposição direta de ferramentas:

- total de bytes serializados de ferramentas e prompt enviados ao harness
- tamanho do catálogo e detalhamento por fonte
- contagens de busca, descrição e chamada
- chamadas finais de ferramentas executadas por meio do OpenClaw
- ids e fontes das ferramentas selecionadas

Os logs de sessão devem permitir responder:

- quantos esquemas de ferramentas o modelo viu de antemão
- quantas operações de busca e descrição ele executou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, MCP ou de uma ferramenta de cliente

## Validação E2E

O executor E2E do Gateway comprova ambos os caminhos com o harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Ele cria um Plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor
OpenAI simulado, inicia um Gateway uma vez no modo direto e uma vez com a Busca de Ferramentas
habilitada, e então compara os payloads de requisição do provedor e os logs de sessão.

A regressão comprova:

1. O modo direto consegue chamar a ferramenta do Plugin falso.
2. A Busca de Ferramentas consegue chamar a mesma ferramenta do Plugin falso.
3. O modo direto expõe os esquemas de ferramentas do Plugin falso diretamente ao provedor.
4. A Busca de Ferramentas expõe apenas a ponte compacta.
5. O payload de requisição da Busca de Ferramentas é menor para o grande catálogo falso.
6. Os logs de sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria de chamadas em ponte.

## Comportamento de falha

A Busca de Ferramentas deve falhar fechada:

- se uma ferramenta não estiver na política efetiva, a busca não deve retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deve falhar
- se a política ou a aprovação bloquear a execução, o resultado da chamada deve relatar esse
  bloqueio em vez de contorná-lo
- se a ponte de código não puder criar um runtime isolado, use `mode: "tools"` ou
  desabilite a Busca de Ferramentas para essa implantação

## Relacionados

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)

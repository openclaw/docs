---
read_when:
    - Você quer que agentes PI usem um grande catálogo de ferramentas sem adicionar todos os esquemas de ferramenta ao prompt
    - Você quer que as ferramentas do OpenClaw, as ferramentas MCP e as ferramentas de cliente sejam expostas por meio de uma única superfície PI compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções de PI
summary: 'Busca de ferramentas: compacte grandes catálogos de ferramentas de PI por trás de pesquisar, descrever e chamar'
title: Busca de ferramentas
x-i18n:
    generated_at: "2026-05-10T19:54:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

A Busca de Ferramentas oferece aos agentes PI uma maneira compacta de descobrir e chamar grandes catálogos de ferramentas. Ela é útil quando a execução tem muitas ferramentas disponíveis, mas o modelo provavelmente precisará de apenas algumas delas.

Quando habilitada para PI, o modelo recebe uma ferramenta `tool_search_code` por padrão. Essa ferramenta executa um corpo JavaScript curto em um subprocesso Node isolado com uma ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

O catálogo pode incluir ferramentas OpenClaw, ferramentas de plugin, ferramentas MCP e ferramentas fornecidas pelo cliente. O modelo não vê todos os esquemas completos antecipadamente. Em vez disso, ele pesquisa descritores compactos, descreve uma ferramenta selecionada quando precisa do esquema exato e chama essa ferramenta por meio do OpenClaw.

Execuções do harness Codex não recebem esses controles de Busca de Ferramentas do OpenClaw. O OpenClaw passa capacidades do produto para o Codex como ferramentas dinâmicas, e o Codex controla o modo de código nativo, a busca nativa de ferramentas, ferramentas dinâmicas adiadas e chamadas de ferramentas aninhadas.

## Como um turno é executado

No momento do planejamento, o executor incorporado de PI cria o catálogo efetivo para a execução:

1. Resolve a política de ferramentas ativa para o agente, perfil, sandbox e sessão.
2. Lista ferramentas OpenClaw e de plugin elegíveis.
3. Lista ferramentas MCP elegíveis por meio do runtime MCP da sessão.
4. Adiciona ferramentas de cliente elegíveis fornecidas para a execução atual.
5. Indexa descritores compactos para pesquisa.
6. Expõe a ponte de código PI ou as ferramentas estruturadas de fallback ao modelo.

No momento da execução, toda chamada real de ferramenta retorna para o OpenClaw. O runtime Node isolado não mantém implementações de plugin, objetos de cliente MCP nem segredos. `openclaw.tools.call(...)` atravessa a ponte de volta para o Gateway, onde a política, aprovação, hook, registro em log e tratamento de resultados normais ainda se aplicam.

## Modos

`tools.toolSearch` tem dois modos visíveis ao modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas estruturadas simples para provedores que não devem receber código.

Ambos os modos usam o mesmo catálogo e caminho de execução. A única diferença é o formato que o modelo vê. Se o runtime atual não puder iniciar o processo filho Node isolado do modo de código, o modo `code` padrão faz fallback para `tools` antes da compactação do catálogo.

Não há configuração separada de seleção de fonte. Quando a Busca de Ferramentas está habilitada, o catálogo inclui ferramentas OpenClaw, MCP e de cliente elegíveis após a filtragem normal por política.

## Por que isso existe

Catálogos grandes são úteis, mas caros. Enviar todos os esquemas de ferramentas ao modelo torna a solicitação maior, desacelera o planejamento e aumenta a seleção acidental de ferramentas.

A Busca de Ferramentas muda o formato:

- ferramentas diretas: o modelo vê todos os esquemas selecionados antes do primeiro token
- modo de código da Busca de Ferramentas: o modelo vê uma ferramenta de código compacta e um contrato de API curto
- modo de ferramentas da Busca de Ferramentas: o modelo vê três ferramentas estruturadas compactas de fallback
- durante o turno: o modelo carrega apenas os esquemas de ferramentas de que realmente precisa

A exposição direta de ferramentas ainda é o padrão correto para catálogos pequenos. A Busca de Ferramentas é melhor quando uma execução pode ver muitas ferramentas, especialmente de servidores MCP ou ferramentas de aplicativo fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo da execução atual. Os resultados são compactos e seguros para colocar de volta no contexto do prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carrega metadados completos para um resultado de pesquisa, incluindo o esquema de entrada exato.

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

A ponte de código é executada em um subprocesso Node de curta duração. O subprocesso inicia com o modo de permissões do Node habilitado, um ambiente vazio, sem concessões de sistema de arquivos ou rede e sem concessões de processo filho ou worker. O OpenClaw aplica um tempo limite de relógio de parede no processo pai e encerra o subprocesso no timeout, inclusive após continuações assíncronas.

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
- hooks de plugin `before_tool_call`
- identidade de sessão, logs e telemetria

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

Ajuste o timeout do modo de código e os limites de resultados de pesquisa:

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
- contagens de pesquisa, descrição e chamada
- chamadas finais de ferramentas executadas por meio do OpenClaw
- ids e fontes das ferramentas selecionadas

Os logs de sessão devem permitir responder:

- quantos esquemas de ferramentas o modelo viu antecipadamente
- quantas operações de pesquisa e descrição ele realizou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, MCP ou de uma ferramenta de cliente

## Validação E2E

O executor E2E do gateway comprova ambos os caminhos com o harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Ele cria um plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor OpenAI simulado, inicia um Gateway uma vez em modo direto e uma vez com a Busca de Ferramentas habilitada, depois compara os payloads de solicitação do provedor e os logs de sessão.

A regressão comprova:

1. O modo direto pode chamar a ferramenta do plugin falso.
2. A Busca de Ferramentas pode chamar a mesma ferramenta do plugin falso.
3. O modo direto expõe os esquemas das ferramentas do plugin falso diretamente ao provedor.
4. A Busca de Ferramentas expõe apenas a ponte compacta.
5. O payload da solicitação da Busca de Ferramentas é menor para o grande catálogo falso.
6. Os logs de sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria de chamadas por ponte.

## Comportamento de falha

A Busca de Ferramentas deve falhar de forma fechada:

- se uma ferramenta não estiver na política efetiva, a pesquisa não deve retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deve falhar
- se a política ou a aprovação bloquear a execução, o resultado da chamada deve informar esse bloqueio em vez de contorná-lo
- se a ponte de código não puder criar um runtime isolado, use `mode: "tools"` ou desabilite a Busca de Ferramentas para essa implantação

## Relacionado

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)

---
read_when:
    - Você quer que agentes OpenClaw usem um catálogo grande de ferramentas sem adicionar todos os esquemas de ferramentas ao prompt
    - Você quer ferramentas OpenClaw, ferramentas MCP e ferramentas de cliente expostas por meio de uma única superfície de runtime compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções do OpenClaw
summary: 'Pesquisa de ferramentas: compacte grandes catálogos de ferramentas do OpenClaw por trás de pesquisa, descrição e chamada'
title: Pesquisa de ferramentas
x-i18n:
    generated_at: "2026-06-30T13:54:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search é um recurso experimental de runtime de agente do OpenClaw. Ele oferece aos agentes uma forma
compacta de descobrir e chamar grandes catálogos de ferramentas. É útil quando a execução
tem muitas ferramentas disponíveis, mas o modelo provavelmente precisará de apenas algumas delas.

Esta página documenta o OpenClaw Tool Search. Ela não é a busca de ferramentas
nativa do Codex nem a superfície de ferramentas dinâmicas. O modo de código nativo do Codex, a busca de ferramentas,
as ferramentas dinâmicas adiadas e as chamadas de ferramentas aninhadas são superfícies estáveis do harness do Codex e
não dependem de `tools.toolSearch`.

Quando habilitado para execuções do OpenClaw, o modelo recebe uma ferramenta `tool_search_code`
por padrão. Essa ferramenta executa um corpo curto de JavaScript em um subprocesso Node
isolado com uma ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

O catálogo pode incluir ferramentas do OpenClaw, ferramentas de plugins, ferramentas MCP e
ferramentas fornecidas pelo cliente. O modelo não vê todos os esquemas completos antecipadamente.
Em vez disso, ele pesquisa descritores compactos, descreve uma ferramenta selecionada quando
precisa do esquema exato e chama essa ferramenta por meio do OpenClaw.

Execuções do harness do Codex não recebem estes controles experimentais do OpenClaw Tool Search.
O OpenClaw passa capacidades do produto para o Codex como ferramentas dinâmicas, e
o Codex possui o modo de código nativo estável, a busca de ferramentas nativa, as ferramentas dinâmicas
adiadas e as chamadas de ferramentas aninhadas.

## Como um turno é executado

No momento do planejamento, o executor incorporado do OpenClaw cria o catálogo efetivo para a
execução:

1. Resolve a política de ferramentas ativa para o agente, perfil, sandbox e sessão.
2. Lista ferramentas elegíveis do OpenClaw e de plugins.
3. Lista ferramentas MCP elegíveis por meio do runtime MCP da sessão.
4. Adiciona ferramentas elegíveis fornecidas pelo cliente para a execução atual.
5. Indexa descritores compactos para busca.
6. Expõe a ponte de código do OpenClaw, as ferramentas estruturadas de fallback ou a
   superfície de diretório compacta ao modelo.

No momento da execução, toda chamada real de ferramenta retorna ao OpenClaw. O runtime Node
isolado não mantém implementações de plugins, objetos de cliente MCP nem segredos.
`openclaw.tools.call(...)` atravessa a ponte de volta para o Gateway, onde a
política, aprovação, hook, registro em log e tratamento de resultados normais ainda se aplicam.

## Modos

`tools.toolSearch` tem três modos voltados para o modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas
  estruturadas simples para provedores que não devem receber código.
- `directory`: expõe `tool_search`, `tool_describe` e `tool_call`, além de um
  diretório de prompt limitado com nomes e descrições das ferramentas disponíveis para
  provedores que devem ver nomes de ferramentas sem todos os esquemas completos. O OpenClaw também pode
  expor diretamente um pequeno conjunto limitado de esquemas de ferramentas prováveis ou exigidos
  para o turno atual.

Todos os modos usam o mesmo catálogo filtrado por política e o caminho de execução normal do OpenClaw.
Se o runtime atual não conseguir iniciar o processo filho isolado do Node em modo de código,
o modo padrão `code` faz fallback para `tools` antes da
compaction do catálogo. No modo `directory`, as ferramentas fornecidas pelo cliente permanecem diretamente visíveis
para a execução atual, enquanto ferramentas do OpenClaw, ferramentas de plugins e ferramentas MCP podem ser
compactadas atrás do catálogo de diretório. Uma chamada direta a um nome exato oculto
do diretório é hidratada a partir desse mesmo catálogo autorizado antes da execução.

Todos os modos são experimentais. Prefira exposição direta de ferramentas para catálogos pequenos de ferramentas do OpenClaw,
e prefira as superfícies estáveis nativas do Codex para execuções do harness do Codex.

Não há uma configuração separada de seleção de origem. Quando o Tool Search está habilitado, o
catálogo inclui ferramentas elegíveis do OpenClaw, MCP e do cliente após a filtragem normal
por política.

## Por que isso existe

Catálogos grandes são úteis, mas caros. Enviar todos os esquemas de ferramentas ao modelo
aumenta a solicitação, desacelera o planejamento e aumenta a seleção acidental de
ferramentas.

O Tool Search muda o formato:

- ferramentas diretas: o modelo vê todos os esquemas selecionados antes do primeiro token
- modo de código do Tool Search: o modelo vê uma ferramenta de código compacta e um contrato curto de API
- modo de ferramentas do Tool Search: o modelo vê três ferramentas estruturadas compactas de fallback
- modo de diretório do Tool Search: o modelo vê um diretório limitado, além de
  controles de busca/descrever/chamar e um pequeno conjunto limitado de esquemas prováveis ou exigidos
- durante o turno: o modelo pode carregar os esquemas restantes conforme necessário

A exposição direta de ferramentas ainda é o padrão correto para catálogos pequenos. O Tool Search
é melhor quando uma execução pode ver muitas ferramentas, especialmente de servidores MCP ou
ferramentas de aplicativos fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo da execução atual. Os resultados são compactos e seguros
para colocar de volta no contexto do prompt.

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

O modo de diretório expõe:

- `tool_search`
- `tool_describe`
- `tool_call`

Ele também mantém as ferramentas fornecidas pelo cliente diretamente visíveis e pode expor diretamente um pequeno
conjunto limitado de esquemas de ferramentas de catálogo prováveis ou exigidos para o turno atual.
Se o diretório limitado omitir entradas, use `tool_search` para encontrá-las. Se
o modelo solicitar diretamente um nome exato de ferramenta oculta do diretório, o OpenClaw
o hidrata a partir do catálogo autorizado antes da execução normal.
Nomes de ferramentas de cliente no modo de diretório não devem colidir com nomes de ferramentas do OpenClaw,
de plugins ou MCP, porque o despacho adiado exato usa esses nomes.

## Limite de runtime

A ponte de código é executada em um subprocesso Node de curta duração. O subprocesso inicia
com o modo de permissão do Node habilitado, um ambiente vazio, nenhuma concessão de sistema de arquivos ou
rede e nenhuma concessão de processo filho ou worker. O OpenClaw impõe um
timeout de tempo de parede no processo pai e encerra o subprocesso em caso de timeout, inclusive
após continuações assíncronas.

O runtime expõe apenas:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

O comportamento normal do OpenClaw ainda se aplica às chamadas finais:

- políticas de permissão e negação de ferramentas
- restrições de ferramenta por agente e por sandbox
- política de ferramentas de canal/runtime
- hooks de aprovação
- hooks `before_tool_call` de plugins
- identidade da sessão, logs e telemetria

## Configuração

Habilite o Tool Search para execuções do OpenClaw com a ponte de código padrão:

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

Use as ferramentas estruturadas de fallback em vez disso para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Use a superfície de diretório compacta em vez disso para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
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

O Tool Search registra telemetria suficiente para compará-lo com a exposição direta de ferramentas:

- total de bytes serializados de ferramentas e prompt enviados ao harness
- tamanho do catálogo e detalhamento por origem
- contagens de busca, descrição e chamada
- chamadas finais de ferramentas executadas por meio do OpenClaw
- ids e origens das ferramentas selecionadas

Os logs da sessão devem permitir responder:

- quantos esquemas de ferramentas o modelo viu antecipadamente
- quantas operações de busca e descrição ele realizou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, MCP ou de uma ferramenta de cliente

## Validação E2E

O cenário de Gateway do QA Lab comprova ambos os caminhos com o runtime do OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Ele cria um plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor
OpenAI simulado, inicia um Gateway uma vez em modo direto e uma vez com o Tool Search
habilitado, depois compara payloads de solicitação do provedor e logs de sessão.

A regressão comprova:

1. O modo direto consegue chamar a ferramenta do plugin falso.
2. O Tool Search consegue chamar a mesma ferramenta do plugin falso.
3. O modo direto expõe diretamente os esquemas da ferramenta do plugin falso ao provedor.
4. O Tool Search expõe apenas a ponte compacta.
5. O payload de solicitação do Tool Search é menor para o grande catálogo falso.
6. Os logs de sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria de chamadas pela ponte.

## Comportamento de falha

O Tool Search deve falhar fechado:

- se uma ferramenta não estiver na política efetiva, a busca não deve retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deve falhar
- se a política ou a aprovação bloquear a execução, o resultado da chamada deve relatar esse
  bloqueio em vez de contorná-lo
- se a ponte de código não conseguir criar um runtime isolado, use `mode: "tools"` ou
  desabilite o Tool Search para essa implantação

## Relacionado

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)

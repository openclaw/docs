---
read_when:
    - Você quer que agentes do OpenClaw usem um grande catálogo de ferramentas sem adicionar todos os schemas de ferramentas ao prompt
    - Você quer ferramentas OpenClaw, ferramentas MCP e ferramentas de cliente expostas por meio de uma superfície de runtime compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções do OpenClaw
summary: 'Pesquisa de ferramentas: compacte grandes catálogos de ferramentas do OpenClaw por trás de pesquisa, descrição e chamada'
title: Pesquisa de ferramentas
x-i18n:
    generated_at: "2026-06-27T18:19:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

A Busca de Ferramentas é um recurso experimental do runtime de agentes do OpenClaw. Ela dá aos agentes uma forma
compacta de descobrir e chamar grandes catálogos de ferramentas. É útil quando a execução
tem muitas ferramentas disponíveis, mas o modelo provavelmente precisará de apenas algumas delas.

Esta página documenta a Busca de Ferramentas do OpenClaw. Ela não é a superfície de
busca de ferramentas nativa do Codex nem de ferramentas dinâmicas. O modo de código nativo do Codex, a busca de ferramentas, as
ferramentas dinâmicas adiadas e as chamadas de ferramentas aninhadas são superfícies estáveis do harness do Codex e
não dependem de `tools.toolSearch`.

Quando habilitado para execuções do OpenClaw, o modelo recebe uma ferramenta `tool_search_code`
por padrão. Essa ferramenta executa um corpo curto de JavaScript em um subprocesso isolado do Node
com uma ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

O catálogo pode incluir ferramentas do OpenClaw, ferramentas de plugin, ferramentas MCP e
ferramentas fornecidas pelo cliente. O modelo não vê todos os schemas completos de antemão.
Em vez disso, ele pesquisa descritores compactos, descreve uma ferramenta selecionada quando
precisa do schema exato e chama essa ferramenta por meio do OpenClaw.

Execuções do harness do Codex não recebem estes controles experimentais de Busca de Ferramentas do OpenClaw.
O OpenClaw passa capacidades do produto para o Codex como ferramentas dinâmicas, e
o Codex possui o modo de código nativo estável, a busca de ferramentas nativa, as ferramentas dinâmicas
adiadas e as chamadas de ferramentas aninhadas.

## Como um turno é executado

No momento do planejamento, o executor incorporado do OpenClaw cria o catálogo efetivo para a
execução:

1. Resolver a política de ferramentas ativa para o agente, perfil, sandbox e sessão.
2. Listar ferramentas qualificadas do OpenClaw e de plugins.
3. Listar ferramentas MCP qualificadas por meio do runtime MCP da sessão.
4. Adicionar ferramentas qualificadas do cliente fornecidas para a execução atual.
5. Indexar descritores compactos para pesquisa.
6. Expor ao modelo a ponte de código do OpenClaw, as ferramentas estruturadas de fallback ou a
   superfície de diretório compacta.

No momento da execução, toda chamada real de ferramenta retorna ao OpenClaw. O runtime isolado do Node
não mantém implementações de plugins, objetos de cliente MCP nem segredos.
`openclaw.tools.call(...)` cruza a ponte de volta para o Gateway, onde a
política, aprovação, hook, registro em log e tratamento de resultado normais ainda se aplicam.

## Modos

`tools.toolSearch` tem três modos visíveis ao modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas
  estruturadas simples para provedores que não devem receber código.
- `directory`: expõe `tool_search`, `tool_describe` e `tool_call`, além de um
  diretório limitado no prompt com nomes e descrições de ferramentas disponíveis para
  provedores que devem ver nomes de ferramentas sem todos os schemas completos. O OpenClaw também pode
  expor diretamente um pequeno conjunto limitado de schemas de ferramentas prováveis ou obrigatórias
  para o turno atual.

Todos os modos usam o mesmo catálogo filtrado por política e o caminho normal de execução do OpenClaw.
Se o runtime atual não puder iniciar o processo filho isolado do Node do modo de código,
o modo `code` padrão faz fallback para `tools` antes da compactação do catálogo.
No modo `directory`, ferramentas fornecidas pelo cliente permanecem diretamente visíveis
para a execução atual, enquanto ferramentas do OpenClaw, ferramentas de plugins e ferramentas MCP podem ser
compactadas atrás do catálogo de diretório. Uma chamada direta para um nome exato oculto no
diretório é hidratada a partir do mesmo catálogo autorizado antes da execução.

Todos os modos são experimentais. Prefira a exposição direta de ferramentas para catálogos pequenos de ferramentas do OpenClaw
e prefira as superfícies estáveis nativas do Codex para execuções do harness do Codex.

Não há uma configuração separada de seleção de fontes. Quando a Busca de Ferramentas está habilitada, o
catálogo inclui ferramentas qualificadas do OpenClaw, MCP e do cliente após a filtragem normal
de políticas.

## Por que isso existe

Catálogos grandes são úteis, mas caros. Enviar todos os schemas de ferramentas ao modelo
aumenta a requisição, desacelera o planejamento e aumenta a seleção acidental de
ferramentas.

A Busca de Ferramentas muda o formato:

- ferramentas diretas: o modelo vê todos os schemas selecionados antes do primeiro token
- modo de código da Busca de Ferramentas: o modelo vê uma ferramenta de código compacta e um contrato curto de API
- modo de ferramentas da Busca de Ferramentas: o modelo vê três ferramentas estruturadas compactas de fallback
- modo de diretório da Busca de Ferramentas: o modelo vê um diretório limitado mais
  controles de pesquisar/descrever/chamar e um pequeno conjunto limitado de schemas prováveis ou obrigatórios
- durante o turno: o modelo pode carregar os schemas restantes conforme necessário

A exposição direta de ferramentas ainda é o padrão certo para catálogos pequenos. A Busca de Ferramentas
é melhor quando uma execução pode ver muitas ferramentas, especialmente de servidores MCP ou de
ferramentas de aplicativo fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo para a execução atual. Os resultados são compactos e seguros
para serem reinseridos no contexto do prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carrega metadados completos para um resultado de pesquisa, incluindo o schema de entrada exato.

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
conjunto limitado de schemas de ferramentas de catálogo prováveis ou obrigatórias para o turno atual.
Se o diretório limitado omitir entradas, use `tool_search` para encontrá-las. Se
o modelo solicitar diretamente um nome exato de ferramenta oculta no diretório, o OpenClaw
o hidrata a partir do catálogo autorizado antes da execução normal.
Nomes de ferramentas do cliente no modo de diretório não devem colidir com nomes de ferramentas do OpenClaw, de plugins ou MCP,
porque o despacho adiado exato usa esses nomes.

## Limite do runtime

A ponte de código é executada em um subprocesso de curta duração do Node. O subprocesso inicia
com o modo de permissões do Node habilitado, um ambiente vazio, sem concessões de sistema de arquivos ou
rede e sem concessões de processo filho ou worker. O OpenClaw impõe um
tempo limite de relógio de parede no processo pai e encerra o subprocesso ao atingir o tempo limite, inclusive
após continuações assíncronas.

O runtime expõe apenas:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

O comportamento normal do OpenClaw ainda se aplica às chamadas finais:

- políticas de permissão e negação de ferramentas
- restrições de ferramentas por agente e por sandbox
- política de ferramentas de canal/runtime
- hooks de aprovação
- hooks `before_tool_call` de plugins
- identidade da sessão, logs e telemetria

## Configuração

Habilite a Busca de Ferramentas para execuções do OpenClaw com a ponte de código padrão:

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

Ajuste o tempo limite do modo de código e os limites de resultados de pesquisa:

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

Os logs da sessão devem possibilitar responder:

- quantos schemas de ferramentas o modelo viu de antemão
- quantas operações de pesquisa e descrição ele realizou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, MCP ou de uma ferramenta do cliente

## Validação E2E

O executor E2E do gateway comprova ambos os caminhos com o runtime do OpenClaw:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Ele cria um plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor
OpenAI simulado, inicia um Gateway uma vez em modo direto e uma vez com a Busca de Ferramentas
habilitada, depois compara payloads de requisição do provedor e logs da sessão.

A regressão comprova:

1. O modo direto pode chamar a ferramenta do plugin falso.
2. A Busca de Ferramentas pode chamar a mesma ferramenta do plugin falso.
3. O modo direto expõe os schemas da ferramenta do plugin falso diretamente ao provedor.
4. A Busca de Ferramentas expõe apenas a ponte compacta.
5. O payload de requisição da Busca de Ferramentas é menor para o grande catálogo falso.
6. Os logs da sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria de chamadas em ponte.

## Comportamento de falha

A Busca de Ferramentas deve falhar de forma fechada:

- se uma ferramenta não estiver na política efetiva, a pesquisa não deve retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deve falhar
- se a política ou aprovação bloquear a execução, o resultado da chamada deve relatar esse
  bloqueio em vez de contorná-lo
- se a ponte de código não puder criar um runtime isolado, use `mode: "tools"` ou
  desabilite a Busca de Ferramentas para essa implantação

## Relacionado

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)

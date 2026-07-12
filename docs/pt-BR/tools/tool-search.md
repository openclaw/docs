---
read_when:
    - Você quer que os agentes do OpenClaw usem um grande catálogo de ferramentas sem adicionar o esquema de cada ferramenta ao prompt
    - Você quer que as ferramentas do OpenClaw, as ferramentas MCP e as ferramentas do cliente sejam disponibilizadas por meio de uma única interface de runtime compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções do OpenClaw
summary: 'Pesquisa de ferramentas: compacte grandes catálogos de ferramentas do OpenClaw por meio de pesquisa, descrição e chamada'
title: Pesquisa de ferramentas
x-i18n:
    generated_at: "2026-07-12T00:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

A Pesquisa de Ferramentas é um recurso experimental do runtime de agentes do OpenClaw. Ela oferece aos agentes uma maneira compacta de descobrir e chamar grandes catálogos de ferramentas. É útil quando a execução tem muitas ferramentas disponíveis, mas o modelo provavelmente precisará de apenas algumas delas.

Esta página documenta a Pesquisa de Ferramentas do OpenClaw. Ela não é a pesquisa de ferramentas nem a superfície de ferramentas dinâmicas nativas do Codex. O modo de código, a pesquisa de ferramentas, as ferramentas dinâmicas adiadas e as chamadas de ferramentas aninhadas nativas do Codex são superfícies estáveis do harness do Codex e não dependem de `tools.toolSearch`.

Quando habilitada para execuções do OpenClaw, o modelo recebe uma ferramenta `tool_search_code` por padrão, além de quaisquer ferramentas somente diretas cujos resultados estruturados não possam atravessar a ponte compacta. A ferramenta de código executa um pequeno corpo JavaScript em um subprocesso Node isolado com uma ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

O catálogo pode incluir ferramentas do OpenClaw qualificadas para o catálogo, ferramentas de plugins, ferramentas MCP e ferramentas fornecidas pelo cliente. O modelo não vê antecipadamente todos os esquemas catalogados. Em vez disso, ele pesquisa descritores compactos, obtém a descrição de uma ferramenta selecionada quando precisa do esquema exato e chama essa ferramenta por meio do OpenClaw. As ferramentas somente diretas permanecem visíveis para o modelo e não são adicionadas ao catálogo.

As execuções do harness do Codex não recebem esses controles experimentais da Pesquisa de Ferramentas do OpenClaw. O OpenClaw transmite recursos do produto ao Codex como ferramentas dinâmicas, e o Codex controla o modo de código nativo estável, a pesquisa de ferramentas nativa, as ferramentas dinâmicas adiadas e as chamadas de ferramentas aninhadas.

## Como um turno é executado

Durante o planejamento, o executor incorporado do OpenClaw cria o catálogo efetivo para a execução:

1. Resolve a política de ferramentas ativa para o agente, o perfil, o sandbox e a sessão.
2. Lista as ferramentas qualificadas do OpenClaw e dos plugins.
3. Lista as ferramentas MCP qualificadas por meio do runtime MCP da sessão.
4. Adiciona as ferramentas qualificadas do cliente fornecidas para a execução atual.
5. Mantém as ferramentas somente diretas visíveis para o modelo e indexa descritores compactos para as demais ferramentas qualificadas para o catálogo.
6. Expõe a ponte de código do OpenClaw, as ferramentas estruturadas de contingência ou a superfície compacta de diretório junto dessas ferramentas somente diretas.

Durante a execução, todas as chamadas reais de ferramentas retornam ao OpenClaw. O runtime Node isolado não contém implementações de plugins, objetos de clientes MCP nem segredos. `openclaw.tools.call(...)` atravessa a ponte de volta para o Gateway, onde continuam sendo aplicados os procedimentos normais de política, aprovação, hooks, registro em logs e tratamento de resultados.

## Modos

`tools.toolSearch` tem três modos voltados ao modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão, junto das ferramentas somente diretas.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas estruturadas simples para provedores que não devem receber código, junto das ferramentas somente diretas.
- `directory`: expõe `tool_search`, `tool_describe` e `tool_call`, além de um diretório limitado no prompt com os nomes e as descrições das ferramentas disponíveis, para provedores que devem ver os nomes das ferramentas sem receber todos os esquemas completos. O OpenClaw também pode expor diretamente um pequeno conjunto limitado de esquemas de ferramentas prováveis ou obrigatórias para o turno atual. As ferramentas somente diretas também permanecem visíveis nesse modo.

Todos os modos usam o mesmo catálogo filtrado por políticas e o caminho normal de execução do OpenClaw. As ferramentas marcadas como `catalogMode: "direct-only"` permanecem fora desse catálogo e visíveis para o modelo. Se o runtime atual não puder iniciar o processo filho isolado do Node para o modo de código, o modo `code` padrão recorre a `tools` antes da Compaction do catálogo. No modo `directory`, as ferramentas fornecidas pelo cliente permanecem diretamente visíveis para a execução atual, enquanto as ferramentas do OpenClaw, dos plugins e do MCP podem ser compactadas por trás do catálogo do diretório. Uma chamada direta para o nome exato de uma ferramenta oculta do diretório é preenchida a partir desse mesmo catálogo autorizado antes da execução.

Todos os modos são experimentais. Prefira a exposição direta de ferramentas para catálogos pequenos de ferramentas do OpenClaw e as superfícies estáveis nativas do Codex para execuções do harness do Codex.

Não há uma configuração separada para seleção de fontes. Quando a Pesquisa de Ferramentas está habilitada, o catálogo inclui as ferramentas do OpenClaw, do MCP e do cliente qualificadas para o catálogo após a filtragem normal por políticas; as ferramentas somente diretas são mantidas separadamente.

## Por que isso existe

Catálogos grandes são úteis, mas têm um custo elevado. Enviar todos os esquemas de ferramentas ao modelo aumenta o tamanho da solicitação, torna o planejamento mais lento e aumenta a seleção acidental de ferramentas.

A Pesquisa de Ferramentas altera esse formato:

- ferramentas diretas: o modelo vê todos os esquemas selecionados antes do primeiro token
- modo de código da Pesquisa de Ferramentas: o modelo vê uma ferramenta de código compacta, um contrato curto de API e quaisquer ferramentas somente diretas
- modo de ferramentas da Pesquisa de Ferramentas: o modelo vê três ferramentas estruturadas compactas de contingência, além de quaisquer ferramentas somente diretas
- modo de diretório da Pesquisa de Ferramentas: o modelo vê um diretório limitado, controles de pesquisa/descrição/chamada e um pequeno conjunto limitado de esquemas prováveis ou obrigatórios, além de quaisquer ferramentas somente diretas
- durante o turno: o modelo pode carregar os esquemas restantes conforme necessário

A exposição direta de ferramentas ainda é o padrão adequado para catálogos pequenos. A Pesquisa de Ferramentas é mais apropriada quando uma execução pode acessar muitas ferramentas, especialmente de servidores MCP ou de ferramentas de aplicativos fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo da execução atual. Os resultados são compactos e seguros para serem reinseridos no contexto do prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carrega os metadados completos de um resultado de pesquisa, incluindo o esquema de entrada exato.

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

O modo estruturado de contingência expõe as mesmas operações como ferramentas:

- `tool_search`
- `tool_describe`
- `tool_call`

O modo de diretório expõe:

- `tool_search`
- `tool_describe`
- `tool_call`

Ele também mantém diretamente visíveis as ferramentas fornecidas pelo cliente e todas as ferramentas somente diretas, e pode expor diretamente um pequeno conjunto limitado de esquemas de ferramentas do catálogo prováveis ou obrigatórias para o turno atual. Se o diretório limitado omitir entradas, use `tool_search` para encontrá-las. Se o modelo solicitar diretamente o nome exato de uma ferramenta oculta do diretório, o OpenClaw a preenche a partir do catálogo autorizado antes da execução normal.
Os nomes das ferramentas do cliente no modo de diretório não podem entrar em conflito com os nomes de ferramentas do OpenClaw, dos plugins ou do MCP, pois o despacho adiado exato usa esses nomes.

## Limite do runtime

A ponte de código é executada em um subprocesso Node de curta duração. O subprocesso é iniciado com o modo de permissões do Node habilitado, um ambiente vazio, sem permissões de sistema de arquivos ou rede e sem permissões para processos filhos ou workers. O OpenClaw impõe um tempo-limite decorrido no processo pai e encerra o subprocesso quando esse limite é atingido, inclusive após continuações assíncronas.

O runtime expõe apenas:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

O comportamento normal do OpenClaw continua sendo aplicado às chamadas finais:

- políticas de permissão e negação de ferramentas
- restrições de ferramentas por agente e por sandbox
- política de ferramentas do canal/runtime
- hooks de aprovação
- hooks `before_tool_call` de plugins
- identidade da sessão, logs e telemetria

## Configuração

Habilite a Pesquisa de Ferramentas para execuções do OpenClaw com a ponte de código padrão:

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

Use, em vez disso, as ferramentas estruturadas de contingência para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Use, em vez disso, a superfície compacta de diretório para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajuste o tempo-limite do modo de código e os limites de resultados da pesquisa (os valores exibidos são os padrões):

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

O runtime limita `codeTimeoutMs` ao intervalo de 1000 a 60000, `maxSearchLimit` ao intervalo de 1 a 50 e `searchDefaultLimit` ao intervalo de 1 a `maxSearchLimit`.

Desabilite:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt e telemetria

A Pesquisa de Ferramentas registra telemetria suficiente para compará-la à exposição direta de ferramentas:

- total de bytes serializados de ferramentas e do prompt enviados ao harness
- tamanho do catálogo e divisão por fonte
- contagens de pesquisas, descrições e chamadas
- chamadas finais de ferramentas executadas por meio do OpenClaw
- IDs e fontes das ferramentas selecionadas

Os logs da sessão devem permitir responder:

- quantos esquemas de ferramentas o modelo viu antecipadamente
- quantas operações de pesquisa e descrição ele realizou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, do MCP ou de uma ferramenta do cliente

## Validação E2E

O cenário de Gateway do QA Lab comprova os dois caminhos com o runtime do OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Ele cria um plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor simulado da OpenAI, inicia um Gateway uma vez no modo direto e outra vez com a Pesquisa de Ferramentas habilitada e, em seguida, compara os payloads das solicitações ao provedor e os logs da sessão.

A regressão comprova:

1. O modo direto consegue chamar a ferramenta do plugin falso.
2. A Pesquisa de Ferramentas consegue chamar a mesma ferramenta do plugin falso.
3. O modo direto expõe os esquemas das ferramentas do plugin falso diretamente ao provedor.
4. A Pesquisa de Ferramentas expõe apenas a ponte compacta e quaisquer ferramentas somente diretas.
5. O payload da solicitação da Pesquisa de Ferramentas é menor para o grande catálogo falso.
6. Os logs da sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria das chamadas realizadas pela ponte.

## Comportamento em caso de falha

A Pesquisa de Ferramentas deve falhar de forma restritiva:

- se uma ferramenta não estiver na política efetiva, a pesquisa não deverá retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deverá falhar
- se a política ou a aprovação bloquear a execução, o resultado da chamada deverá relatar esse bloqueio em vez de contorná-lo
- se a ponte de código não puder criar um runtime isolado, use `mode: "tools"` ou desabilite a Pesquisa de Ferramentas nessa implantação

## Relacionados

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)

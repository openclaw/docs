---
read_when:
    - Você quer que os agentes do OpenClaw usem um amplo catálogo de ferramentas sem adicionar o esquema de cada ferramenta ao prompt
    - Você quer que as ferramentas do OpenClaw, as ferramentas MCP e as ferramentas do cliente sejam disponibilizadas por meio de uma única interface de runtime compacta
    - Você está implementando ou depurando a descoberta de ferramentas para execuções do OpenClaw
summary: 'Pesquisa de ferramentas: compacte grandes catálogos de ferramentas do OpenClaw por trás de pesquisa, descrição e chamada'
title: Pesquisa de ferramentas
x-i18n:
    generated_at: "2026-07-12T15:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search é um recurso experimental do runtime de agentes do OpenClaw. Ele oferece aos agentes uma
forma compacta de descobrir e chamar grandes catálogos de ferramentas. É útil quando a execução
tem muitas ferramentas disponíveis, mas é provável que o modelo precise de apenas algumas delas.

Esta página documenta o Tool Search do OpenClaw. Ela não trata da pesquisa de ferramentas
nativa do Codex nem da interface de ferramentas dinâmicas. O modo de código nativo do Codex, a pesquisa de ferramentas, as ferramentas
dinâmicas adiadas e as chamadas de ferramentas aninhadas são interfaces estáveis do harness do Codex e não
dependem de `tools.toolSearch`.

Quando habilitado para execuções do OpenClaw, o modelo recebe uma ferramenta `tool_search_code`
por padrão, além de quaisquer ferramentas exclusivamente diretas cujos resultados estruturados não possam atravessar
a ponte compacta. A ferramenta de código executa um pequeno corpo JavaScript em um subprocesso
Node isolado com uma ponte `openclaw.tools`:

```js
const hits = await openclaw.tools.search("criar uma issue no GitHub");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Falha ao iniciar",
  body: "Etapas para reproduzir...",
});
```

O catálogo pode incluir ferramentas do OpenClaw qualificadas para o catálogo, ferramentas de plugins, ferramentas
MCP e ferramentas fornecidas pelo cliente. O modelo não vê antecipadamente todos os esquemas catalogados.
Em vez disso, ele pesquisa descritores compactos, obtém a descrição de uma ferramenta selecionada
quando precisa do esquema exato e chama essa ferramenta por meio do OpenClaw.
As ferramentas exclusivamente diretas permanecem visíveis para o modelo e não são adicionadas ao catálogo.

As execuções do harness do Codex não recebem esses controles experimentais do Tool Search do OpenClaw.
O OpenClaw passa recursos do produto ao Codex como ferramentas dinâmicas, e
o Codex é responsável pelo modo de código nativo estável, pela pesquisa de ferramentas nativa, pelas ferramentas dinâmicas
adiadas e pelas chamadas de ferramentas aninhadas.

## Como um turno é executado

Durante o planejamento, o runner incorporado do OpenClaw cria o catálogo efetivo para a
execução:

1. Resolve a política de ferramentas ativa para o agente, o perfil, o sandbox e a sessão.
2. Lista as ferramentas qualificadas do OpenClaw e dos plugins.
3. Lista as ferramentas MCP qualificadas por meio do runtime MCP da sessão.
4. Adiciona as ferramentas qualificadas do cliente fornecidas para a execução atual.
5. Mantém as ferramentas exclusivamente diretas visíveis para o modelo e indexa descritores compactos para as
   demais ferramentas qualificadas para o catálogo.
6. Expõe a ponte de código do OpenClaw, as ferramentas estruturadas de fallback ou a
   interface compacta de diretório junto com essas ferramentas exclusivamente diretas.

Durante a execução, toda chamada real de ferramenta retorna ao OpenClaw. O runtime Node
isolado não contém implementações de plugins, objetos de clientes MCP nem segredos.
`openclaw.tools.call(...)` atravessa a ponte e retorna ao Gateway, onde continuam sendo aplicados
a política normal, a aprovação, os hooks, o registro em log e o processamento de resultados.

## Modos

`tools.toolSearch` tem três modos voltados ao modelo:

- `code`: expõe `tool_search_code`, a ponte JavaScript compacta padrão,
  junto com as ferramentas exclusivamente diretas.
- `tools`: expõe `tool_search`, `tool_describe` e `tool_call` como ferramentas
  estruturadas simples para provedores que não devem receber código, junto com
  as ferramentas exclusivamente diretas.
- `directory`: expõe `tool_search`, `tool_describe` e `tool_call`, além de um
  diretório limitado no prompt com nomes e descrições das ferramentas disponíveis para
  provedores que devem ver os nomes das ferramentas sem todos os esquemas completos. O OpenClaw também pode
  expor diretamente um pequeno conjunto limitado de esquemas de ferramentas prováveis ou necessárias
  para o turno atual. As ferramentas exclusivamente diretas também permanecem visíveis nesse modo.

Todos os modos usam o mesmo catálogo filtrado por políticas e o caminho normal de execução do
OpenClaw. As ferramentas marcadas como `catalogMode: "direct-only"` ficam fora desse catálogo e
permanecem visíveis para o modelo. Se o runtime atual não puder iniciar o processo filho isolado do Node
para o modo de código, o modo `code` padrão usa `tools` como fallback antes da compactação
do catálogo. No modo `directory`, as ferramentas fornecidas pelo cliente permanecem diretamente visíveis
para a execução atual, enquanto as ferramentas do OpenClaw, dos plugins e do MCP podem ser
compactadas por trás do catálogo de diretório. Uma chamada direta a um nome exato oculto do
diretório é hidratada a partir desse mesmo catálogo autorizado antes da execução.

Todos os modos são experimentais. Prefira a exposição direta de ferramentas para catálogos pequenos de ferramentas do
OpenClaw e prefira as interfaces estáveis nativas do Codex para execuções do harness do Codex.

Não há uma configuração separada para seleção de fontes. Quando o Tool Search está habilitado, o
catálogo inclui as ferramentas do OpenClaw, do MCP e do cliente qualificadas para o catálogo após a filtragem
normal de políticas; as ferramentas exclusivamente diretas são mantidas separadamente.

## Por que isso existe

Catálogos grandes são úteis, mas custosos. Enviar todos os esquemas de ferramentas ao modelo
aumenta a solicitação, torna o planejamento mais lento e aumenta a seleção acidental de
ferramentas.

O Tool Search muda esse formato:

- ferramentas diretas: o modelo vê todos os esquemas selecionados antes do primeiro token
- modo de código do Tool Search: o modelo vê uma ferramenta de código compacta, um contrato curto de API
  e quaisquer ferramentas exclusivamente diretas
- modo de ferramentas do Tool Search: o modelo vê três ferramentas estruturadas compactas de fallback,
  além de quaisquer ferramentas exclusivamente diretas
- modo de diretório do Tool Search: o modelo vê um diretório limitado, além de
  controles de pesquisa/descrição/chamada e um pequeno conjunto limitado de esquemas prováveis ou necessários,
  além de quaisquer ferramentas exclusivamente diretas
- durante o turno: o modelo pode carregar os esquemas restantes conforme necessário

A exposição direta de ferramentas continua sendo o padrão adequado para catálogos pequenos. O Tool Search
é mais indicado quando uma execução pode ver muitas ferramentas, especialmente de servidores MCP ou
de ferramentas de aplicativos fornecidas pelo cliente.

## API

`openclaw.tools.search(query, options?)`

Pesquisa o catálogo efetivo da execução atual. Os resultados são compactos e seguros
para serem reinseridos no contexto do prompt.

```js
const hits = await openclaw.tools.search("evento de calendário", { limit: 5 });
```

`openclaw.tools.describe(id)`

Carrega os metadados completos de um resultado da pesquisa, incluindo o esquema exato de entrada.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Chama uma ferramenta selecionada por meio do OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planejamento",
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

Ele também mantém as ferramentas fornecidas pelo cliente e todas as ferramentas exclusivamente diretas diretamente visíveis,
e pode expor diretamente um pequeno conjunto limitado de esquemas de ferramentas do catálogo prováveis ou necessários
para o turno atual. Se o diretório limitado omitir entradas, use
`tool_search` para encontrá-las. Se o modelo solicitar diretamente o nome exato de uma ferramenta oculta do
diretório, o OpenClaw a hidrata a partir do catálogo autorizado antes da
execução normal.
No modo de diretório, os nomes das ferramentas do cliente não podem entrar em conflito com nomes de ferramentas do OpenClaw, de plugins ou do MCP,
pois o despacho adiado exato usa esses nomes.

## Limite do runtime

A ponte de código é executada em um subprocesso Node de curta duração. O subprocesso é iniciado
com o modo de permissões do Node habilitado, um ambiente vazio, sem permissões de sistema de arquivos ou
rede e sem permissões para processos filhos ou workers. O OpenClaw impõe um
tempo limite de relógio de parede no processo pai e encerra o subprocesso ao atingir esse limite, inclusive
após continuações assíncronas.

O runtime expõe apenas:

- `console.log`, `console.warn` e `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

O comportamento normal do OpenClaw continua sendo aplicado às chamadas finais:

- políticas de permissão e bloqueio de ferramentas
- restrições de ferramentas por agente e por sandbox
- política de ferramentas do canal/runtime
- hooks de aprovação
- hooks `before_tool_call` dos plugins
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

Em vez disso, use as ferramentas estruturadas de fallback para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Em vez disso, use a interface compacta de diretório para execuções do OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Ajuste o tempo limite do modo de código e os limites de resultados da pesquisa (os valores exibidos são os padrões):

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

O runtime limita `codeTimeoutMs` a 1000-60000, `maxSearchLimit` a 1-50 e
`searchDefaultLimit` a 1..`maxSearchLimit`.

Desabilite-o:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt e telemetria

O Tool Search registra telemetria suficiente para compará-lo com a exposição direta de ferramentas:

- total de bytes serializados de ferramentas e prompts enviados ao harness
- tamanho do catálogo e divisão por fonte
- contagens de pesquisas, descrições e chamadas
- chamadas finais de ferramentas executadas por meio do OpenClaw
- ids e fontes das ferramentas selecionadas

Os logs da sessão devem permitir responder:

- quantos esquemas de ferramentas o modelo viu antecipadamente
- quantas operações de pesquisa e descrição ele realizou
- qual ferramenta final foi chamada
- se o resultado veio do OpenClaw, do MCP ou de uma ferramenta do cliente

## Validação E2E

O cenário do Gateway no QA Lab comprova os dois caminhos com o runtime do OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Ele cria um plugin falso temporário com um grande catálogo de ferramentas, inicia o provedor
OpenAI simulado, inicia um Gateway uma vez no modo direto e outra com o Tool Search
habilitado e, em seguida, compara os payloads das solicitações ao provedor e os logs da sessão.

A regressão comprova:

1. O modo direto pode chamar a ferramenta do plugin falso.
2. O Tool Search pode chamar a mesma ferramenta do plugin falso.
3. O modo direto expõe os esquemas das ferramentas do plugin falso diretamente ao provedor.
4. O Tool Search expõe apenas a ponte compacta e quaisquer ferramentas exclusivamente diretas.
5. O payload da solicitação do Tool Search é menor para o grande catálogo falso.
6. Os logs da sessão mostram as contagens esperadas de chamadas de ferramentas e a telemetria das chamadas feitas pela ponte.

## Comportamento em caso de falha

O Tool Search deve falhar de forma restritiva:

- se uma ferramenta não estiver na política efetiva, a pesquisa não deve retorná-la
- se uma ferramenta selecionada ficar indisponível, `tool_call` deve falhar
- se uma política ou aprovação bloquear a execução, o resultado da chamada deve informar esse
  bloqueio em vez de contorná-lo
- se a ponte de código não puder criar um runtime isolado, use `mode: "tools"` ou
  desabilite o Tool Search para essa implantação

## Relacionados

- [Ferramentas e plugins](/pt-BR/tools)
- [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)

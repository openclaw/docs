---
read_when:
    - Você quer reduzir custos de tokens de prompt com retenção em cache
    - Você precisa de comportamento de cache por agente em configurações multiagente
    - Você está ajustando Heartbeat e poda de cache-ttl em conjunto
summary: Controles de cache de prompt, ordem de mesclagem, comportamento de provider e padrões de ajuste
title: Cache de prompt
x-i18n:
    generated_at: "2026-04-24T06:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

Cache de prompt significa que o provider do modelo pode reutilizar prefixos inalterados do prompt (normalmente instruções de sistema/developer e outro contexto estável) entre turnos, em vez de reprocessá-los toda vez. O OpenClaw normaliza o uso do provider em `cacheRead` e `cacheWrite` quando a API upstream expõe esses contadores diretamente.

Superfícies de status também podem recuperar contadores de cache da entrada de uso mais recente da transcrição
quando o snapshot da sessão ao vivo não os contém, então `/status` pode continuar
mostrando uma linha de cache após perda parcial de metadados da sessão. Valores de cache ao vivo existentes e não zero ainda têm precedência sobre valores de fallback da transcrição.

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem cache, prompts repetidos pagam o custo total do prompt em todo turno, mesmo quando a maior parte da entrada não mudou.

Esta página cobre todos os controles relacionados a cache que afetam a reutilização de prompt e o custo de tokens.

Referências de provider:

- Cache de prompt da Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompt da OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Headers de API e IDs de requisição da OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de requisição e erros da Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principais

### `cacheRetention` (padrão global, modelo e por agente)

Defina a retenção de cache como padrão global para todos os modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Substitua por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Substituição por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordem de mesclagem da configuração:

1. `agents.defaults.params` (padrão global — aplica-se a todos os modelos)
2. `agents.defaults.models["provider/model"].params` (substituição por modelo)
3. `agents.list[].params` (ID de agente correspondente; substitui por chave)

### `contextPruning.mode: "cache-ttl"`

Remove contexto antigo de resultado de ferramenta após janelas TTL de cache, para que solicitações após períodos de inatividade não recoloquem em cache um histórico grande demais.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Limpeza de sessões](/pt-BR/concepts/session-pruning) para o comportamento completo.

### Heartbeat keep-warm

O Heartbeat pode manter janelas de cache aquecidas e reduzir gravações repetidas de cache após períodos ociosos.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é compatível em `agents.list[].heartbeat`.

## Comportamento por provider

### Anthropic (API direta)

- `cacheRetention` é compatível.
- Com perfis de autenticação por chave de API Anthropic, o OpenClaw inicializa `cacheRetention: "short"` para refs de modelo Anthropic quando não definido.
- Respostas nativas da Anthropic Messages expõem tanto `cache_read_input_tokens` quanto `cache_creation_input_tokens`, então o OpenClaw pode mostrar `cacheRead` e `cacheWrite`.
- Para solicitações nativas Anthropic, `cacheRetention: "short"` mapeia para o cache efêmero padrão de 5 minutos, e `cacheRetention: "long"` faz upgrade para o TTL de 1 hora somente em hosts diretos `api.anthropic.com`.

### OpenAI (API direta)

- O cache de prompt é automático em modelos recentes compatíveis. O OpenClaw não precisa injetar marcadores de cache em nível de bloco.
- O OpenClaw usa `prompt_cache_key` para manter o roteamento de cache estável entre turnos e usa `prompt_cache_retention: "24h"` somente quando `cacheRetention: "long"` é selecionado em hosts diretos da OpenAI.
- Respostas da OpenAI expõem tokens de prompt em cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` em eventos da Responses API). O OpenClaw mapeia isso para `cacheRead`.
- A OpenAI não expõe um contador separado de tokens de gravação em cache, então `cacheWrite` permanece `0` nos caminhos da OpenAI mesmo quando o provider está aquecendo um cache.
- A OpenAI retorna headers úteis de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, mas a contabilidade de cache-hit deve vir do payload de uso, não dos headers.
- Na prática, a OpenAI costuma se comportar mais como um cache de prefixo inicial do que como reutilização móvel de histórico completo no estilo Anthropic. Turnos de texto estável com prefixo longo podem atingir algo próximo de um platô de `4864` tokens em cache nas probes atuais, enquanto transcrições pesadas em ferramentas ou no estilo MCP costumam estabilizar perto de `4608` tokens em cache mesmo em repetições exatas.

### Anthropic Vertex

- Modelos Anthropic em Vertex AI (`anthropic-vertex/*`) oferecem suporte a `cacheRetention` da mesma forma que Anthropic direta.
- `cacheRetention: "long"` mapeia para o TTL real de 1 hora do cache de prompt em endpoints Vertex AI.
- A retenção de cache padrão para `anthropic-vertex` corresponde aos padrões diretos da Anthropic.
- Solicitações Vertex são roteadas por modelagem de cache consciente de fronteira para que a reutilização de cache permaneça alinhada com o que os providers realmente recebem.

### Amazon Bedrock

- Refs de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) oferecem suporte a pass-through explícito de `cacheRetention`.
- Modelos Bedrock não Anthropic são forçados em runtime a `cacheRetention: "none"`.

### Modelos Anthropic no OpenRouter

Para refs de modelo `openrouter/anthropic/*`, o OpenClaw injeta
`cache_control` da Anthropic em blocos de prompt de sistema/developer para melhorar a reutilização
do cache de prompt somente quando a solicitação ainda estiver direcionada a uma rota OpenRouter verificada
(`openrouter` em seu endpoint padrão, ou qualquer provider/base URL que resolva
para `openrouter.ai`).

Se você redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI, o OpenClaw
para de injetar esses marcadores de cache Anthropic específicos do OpenRouter.

### Outros providers

Se o provider não oferecer suporte a esse modo de cache, `cacheRetention` não terá efeito.

### API direta do Google Gemini

- O transporte Gemini direto (`api: "google-generative-ai"`) informa cache hits
  por `cachedContentTokenCount` upstream; o OpenClaw mapeia isso para `cacheRead`.
- Quando `cacheRetention` é definido em um modelo Gemini direto, o OpenClaw cria,
  reutiliza e atualiza automaticamente recursos `cachedContents` para prompts
  de sistema em execuções do Google AI Studio. Isso significa que você não precisa mais pré-criar
  um identificador de conteúdo em cache manualmente.
- Você ainda pode passar um identificador existente de conteúdo em cache do Gemini
  como `params.cachedContent` (ou o legado `params.cached_content`) no modelo
  configurado.
- Isso é separado do cache de prefixo de prompt da Anthropic/OpenAI. Para Gemini,
  o OpenClaw gerencia um recurso nativo de provider `cachedContents` em vez de
  injetar marcadores de cache na solicitação.

### Uso JSON do Gemini CLI

- A saída JSON do Gemini CLI também pode expor cache hits por `stats.cached`;
  o OpenClaw mapeia isso para `cacheRead`.
- Se a CLI omitir um valor direto `stats.input`, o OpenClaw deriva tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Isso é apenas normalização de uso. Isso não significa que o OpenClaw esteja criando
  marcadores de cache de prompt no estilo Anthropic/OpenAI para Gemini CLI.

## Limite de cache do prompt do sistema

O OpenClaw divide o prompt do sistema em um **prefixo estável** e um **sufixo
volátil**, separados por um limite interno de prefixo de cache. Conteúdo acima do
limite (definições de ferramentas, metadados de Skills, arquivos do workspace e outro
contexto relativamente estático) é ordenado para permanecer byte a byte idêntico entre turnos.
Conteúdo abaixo do limite (por exemplo `HEARTBEAT.md`, timestamps de runtime e
outros metadados por turno) pode mudar sem invalidar o prefixo em cache.

Principais escolhas de design:

- Arquivos estáveis de contexto do projeto no workspace são ordenados antes de `HEARTBEAT.md`, para que mudanças do heartbeat não invalidem o prefixo estável.
- O limite é aplicado em modelagens de transporte da família Anthropic, da família OpenAI, Google e CLI, para que todos os providers compatíveis se beneficiem da mesma estabilidade de prefixo.
- Solicitações de Codex Responses e Anthropic Vertex são roteadas por
  modelagem de cache consciente de fronteira, para que a reutilização de cache permaneça alinhada com o que os providers realmente recebem.
- Fingerprints de prompt do sistema são normalizados (espaço em branco, finais de linha,
  contexto adicionado por hook, ordenação de capacidades de runtime) para que prompts semanticamente inalterados compartilhem KV/cache entre turnos.

Se você vir picos inesperados de `cacheWrite` após uma mudança de configuração ou workspace, verifique se a mudança está acima ou abaixo do limite de cache. Mover
conteúdo volátil para baixo do limite (ou estabilizá-lo) costuma resolver o
problema.

## Proteções de estabilidade de cache do OpenClaw

O OpenClaw também mantém determinísticos vários formatos de payload sensíveis a cache antes
de a solicitação chegar ao provider:

- Catálogos de ferramentas MCP em bundle são ordenados deterministicamente antes do
  registro da ferramenta, para que mudanças na ordem de `listTools()` não alterem o bloco de ferramentas e
  invalidem prefixos de cache de prompt.
- Sessões legadas com blocos de imagem persistidos mantêm os **3 turnos completos mais recentes**
  intactos; blocos de imagem mais antigos já processados podem ser
  substituídos por um marcador para que acompanhamentos pesados em imagem não continuem reenviando
  grandes payloads obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma base de longa duração no seu agente principal e desabilite cache em agentes notificadores com muito pico:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Base orientada a custo

- Defina a base `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha Heartbeat abaixo do seu TTL apenas para agentes que se beneficiam de caches aquecidos.

## Diagnósticos de cache

O OpenClaw expõe diagnósticos dedicados de rastreamento de cache para execuções embutidas de agente.

Para diagnósticos normais voltados ao usuário, `/status` e outros resumos de uso podem usar
a entrada de uso mais recente da transcrição como fonte de fallback para `cacheRead` /
`cacheWrite` quando a entrada da sessão ao vivo não tiver esses contadores.

## Testes de regressão ao vivo

O OpenClaw mantém uma única verificação combinada de regressão de cache ao vivo para prefixos repetidos, turnos de ferramenta, turnos de imagem, transcrições de ferramenta no estilo MCP e um controle sem cache da Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute a verificação ao vivo restrita com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de baseline armazena os números ao vivo observados mais recentes, além dos limites de regressão específicos por provider usados pelo teste.
O executor também usa IDs de sessão novos por execução e namespaces de prompt, para que o estado anterior de cache não polua a amostra atual de regressão.

Esses testes intencionalmente não usam critérios idênticos de sucesso entre providers.

### Expectativas ao vivo da Anthropic

- Espere gravações explícitas de aquecimento por `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, porque o controle de cache da Anthropic avança o ponto de interrupção do cache ao longo da conversa.
- As asserções ao vivo atuais ainda usam limites altos de taxa de acerto para caminhos estáveis, de ferramenta e de imagem.

### Expectativas ao vivo da OpenAI

- Espere apenas `cacheRead`. `cacheWrite` permanece `0`.
- Trate a reutilização de cache em turnos repetidos como um platô específico do provider, não como reutilização móvel de histórico completo no estilo Anthropic.
- As asserções ao vivo atuais usam verificações de limite conservadoras derivadas do comportamento ao vivo observado em `gpt-5.4-mini`:
  - prefixo estável: `cacheRead >= 4608`, taxa de acerto `>= 0.90`
  - transcrição de ferramenta: `cacheRead >= 4096`, taxa de acerto `>= 0.85`
  - transcrição de imagem: `cacheRead >= 3840`, taxa de acerto `>= 0.82`
  - transcrição no estilo MCP: `cacheRead >= 4096`, taxa de acerto `>= 0.85`

A verificação combinada ao vivo mais recente em 2026-04-04 resultou em:

- prefixo estável: `cacheRead=4864`, taxa de acerto `0.966`
- transcrição de ferramenta: `cacheRead=4608`, taxa de acerto `0.896`
- transcrição de imagem: `cacheRead=4864`, taxa de acerto `0.954`
- transcrição no estilo MCP: `cacheRead=4608`, taxa de acerto `0.891`

O tempo recente de relógio local para a verificação combinada foi de cerca de `88s`.

Por que as asserções são diferentes:

- A Anthropic expõe pontos de interrupção explícitos de cache e reutilização móvel do histórico da conversa.
- O cache de prompt da OpenAI ainda é sensível a prefixo exato, mas o prefixo efetivamente reutilizável em tráfego Responses ao vivo pode estabilizar antes do prompt completo.
- Por causa disso, comparar Anthropic e OpenAI por um único limite percentual entre providers cria regressões falsas.

### Configuração `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcional
    includeMessages: false # padrão true
    includePrompt: false # padrão true
    includeSystem: false # padrão true
```

Padrões:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Alternâncias por env (depuração pontual)

- `OPENCLAW_CACHE_TRACE=1` habilita rastreamento de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` substitui o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` alterna a captura da carga útil completa das mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` alterna a captura do texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` alterna a captura do prompt de sistema.

### O que inspecionar

- Eventos de rastreamento de cache são JSONL e incluem snapshots em estágios como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto por turno de tokens em cache é visível em superfícies normais de uso via `cacheRead` e `cacheWrite` (por exemplo `/usage full` e resumos de uso da sessão).
- Para Anthropic, espere `cacheRead` e `cacheWrite` quando o cache estiver ativo.
- Para OpenAI, espere `cacheRead` em cache hits e `cacheWrite` permanecendo `0`; a OpenAI não publica um campo separado de tokens de gravação em cache.
- Se você precisar de rastreamento de requisição, registre IDs de requisição e headers de limite de taxa separadamente das métricas de cache. A saída atual de rastreamento de cache do OpenClaw é focada em formato de prompt/sessão e uso normalizado de tokens, não em headers brutos de resposta do provider.

## Solução rápida de problemas

- `cacheWrite` alto na maioria dos turnos: verifique entradas voláteis no prompt do sistema e confirme se o modelo/provider oferece suporte às suas configurações de cache.
- `cacheWrite` alto na Anthropic: normalmente significa que o ponto de interrupção do cache está recaindo em conteúdo que muda a cada solicitação.
- `cacheRead` baixo na OpenAI: verifique se o prefixo estável está na frente, se o prefixo repetido tem pelo menos 1024 tokens e se a mesma `prompt_cache_key` é reutilizada em turnos que deveriam compartilhar cache.
- Nenhum efeito de `cacheRetention`: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Solicitações Bedrock Nova/Mistral com configurações de cache: esperado forçar em runtime para `none`.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Limpeza de sessões](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso de API e custos](/pt-BR/reference/api-usage-costs)

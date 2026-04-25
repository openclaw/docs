---
read_when:
    - Você quer reduzir os custos de tokens de prompt com retenção de cache
    - Você precisa de comportamento de cache por agente em configurações com vários agentes
    - Você está ajustando juntos o Heartbeat e a limpeza por cache-ttl
summary: Controles de cache de prompt, ordem de mesclagem, comportamento do provider e padrões de ajuste
title: Cache de prompt
x-i18n:
    generated_at: "2026-04-25T13:55:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Cache de prompt significa que o provider do modelo pode reutilizar prefixos de prompt inalterados (normalmente instruções de sistema/desenvolvedor e outro contexto estável) entre turnos, em vez de reprocessá-los todas as vezes. O OpenClaw normaliza o uso do provider em `cacheRead` e `cacheWrite` quando a API upstream expõe esses contadores diretamente.

As superfícies de status também podem recuperar contadores de cache do log de uso da transcrição mais recente quando o snapshot da sessão ao vivo não os inclui, para que `/status` continue mostrando uma linha de cache após perda parcial de metadados da sessão. Valores de cache ao vivo existentes e não nulos ainda têm prioridade sobre valores de fallback da transcrição.

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem cache, prompts repetidos pagam o custo total do prompt em cada turno, mesmo quando a maior parte da entrada não mudou.

As seções abaixo cobrem todos os controles relacionados a cache que afetam a reutilização de prompt e o custo de tokens.

Referências de providers:

- Cache de prompt da Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompt da OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Cabeçalhos da API OpenAI e IDs de requisição: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de requisição e erros da Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principais

### `cacheRetention` (padrão global, por modelo e por agente)

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
3. `agents.list[].params` (id do agente correspondente; substitui por chave)

### `contextPruning.mode: "cache-ttl"`

Remove contexto antigo de resultado de ferramenta após janelas TTL de cache para que requisições após inatividade não recoloquem em cache um histórico grande demais.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Session Pruning](/pt-BR/concepts/session-pruning) para o comportamento completo.

### Heartbeat keep-warm

O Heartbeat pode manter janelas de cache aquecidas e reduzir gravações repetidas em cache após períodos de inatividade.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é compatível em `agents.list[].heartbeat`.

## Comportamento do provider

### Anthropic (API direta)

- `cacheRetention` é compatível.
- Com perfis de auth com chave de API da Anthropic, o OpenClaw inicializa `cacheRetention: "short"` para referências de modelo Anthropic quando não estiver definido.
- Respostas nativas de Messages da Anthropic expõem tanto `cache_read_input_tokens` quanto `cache_creation_input_tokens`, então o OpenClaw pode mostrar `cacheRead` e `cacheWrite`.
- Para requisições nativas da Anthropic, `cacheRetention: "short"` mapeia para o cache efêmero padrão de 5 minutos, e `cacheRetention: "long"` faz upgrade para TTL de 1 hora somente em hosts diretos `api.anthropic.com`.

### OpenAI (API direta)

- O cache de prompt é automático em modelos recentes compatíveis. O OpenClaw não precisa injetar marcadores de cache em nível de bloco.
- O OpenClaw usa `prompt_cache_key` para manter o roteamento de cache estável entre turnos e usa `prompt_cache_retention: "24h"` somente quando `cacheRetention: "long"` é selecionado em hosts diretos da OpenAI.
- Providers Completions compatíveis com OpenAI recebem `prompt_cache_key` somente quando a configuração do modelo define explicitamente `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` ainda o suprime.
- Respostas da OpenAI expõem tokens de prompt em cache por meio de `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` em eventos da Responses API). O OpenClaw mapeia isso para `cacheRead`.
- A OpenAI não expõe um contador separado de tokens gravados em cache, então `cacheWrite` permanece `0` em caminhos OpenAI mesmo quando o provider está aquecendo um cache.
- A OpenAI retorna cabeçalhos úteis de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, mas a contabilização de acertos de cache deve vir do payload de uso, não dos cabeçalhos.
- Na prática, a OpenAI frequentemente se comporta como um cache de prefixo inicial em vez de uma reutilização de histórico completo em movimento no estilo Anthropic. Turnos com texto estável de prefixo longo podem atingir um platô próximo de `4864` tokens em cache em sondagens ao vivo atuais, enquanto transcrições com muitas ferramentas ou no estilo MCP geralmente estabilizam perto de `4608` tokens em cache mesmo em repetições exatas.

### Anthropic Vertex

- Modelos Anthropic no Vertex AI (`anthropic-vertex/*`) oferecem suporte a `cacheRetention` da mesma forma que a Anthropic direta.
- `cacheRetention: "long"` mapeia para o TTL real de 1 hora do cache de prompt em endpoints do Vertex AI.
- A retenção de cache padrão para `anthropic-vertex` corresponde aos padrões diretos da Anthropic.
- Requisições do Vertex são roteadas por meio de modelagem de cache com reconhecimento de fronteira para que a reutilização de cache continue alinhada com o que os providers realmente recebem.

### Amazon Bedrock

- Referências de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) oferecem suporte a passagem explícita de `cacheRetention`.
- Modelos Bedrock que não são Anthropic são forçados para `cacheRetention: "none"` em tempo de execução.

### Modelos OpenRouter

Para referências de modelo `openrouter/anthropic/*`, o OpenClaw injeta
`cache_control` da Anthropic em blocos de prompt de sistema/desenvolvedor para melhorar a
reutilização do cache de prompt somente quando a requisição ainda estiver direcionada para uma rota OpenRouter verificada
(`openrouter` em seu endpoint padrão, ou qualquer provider/base URL que resolva
para `openrouter.ai`).

Para referências de modelo `openrouter/deepseek/*`, `openrouter/moonshot*/*` e `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` é permitido porque o OpenRouter
lida automaticamente com o cache de prompt no lado do provider. O OpenClaw não injeta
marcadores `cache_control` da Anthropic nessas requisições.

A construção de cache do DeepSeek é best-effort e pode levar alguns segundos. Um
acompanhamento imediato ainda pode mostrar `cached_tokens: 0`; verifique com uma requisição repetida com o mesmo prefixo após um pequeno atraso e use `usage.prompt_tokens_details.cached_tokens`
como sinal de acerto de cache.

Se você redirecionar o modelo para uma URL proxy arbitrária compatível com OpenAI, o OpenClaw
para de injetar esses marcadores de cache da Anthropic específicos do OpenRouter.

### Outros providers

Se o provider não oferecer suporte a esse modo de cache, `cacheRetention` não terá efeito.

### API direta do Google Gemini

- O transporte direto do Gemini (`api: "google-generative-ai"`) informa acertos de cache
  por meio de `cachedContentTokenCount` upstream; o OpenClaw mapeia isso para `cacheRead`.
- Quando `cacheRetention` é definido em um modelo Gemini direto, o OpenClaw automaticamente
  cria, reutiliza e atualiza recursos `cachedContents` para prompts de sistema
  em execuções do Google AI Studio. Isso significa que você não precisa mais pré-criar manualmente
  um identificador de cached-content.
- Você ainda pode passar um identificador Gemini cached-content já existente como
  `params.cachedContent` (ou o legado `params.cached_content`) no modelo
  configurado.
- Isso é separado do cache de prefixo de prompt Anthropic/OpenAI. Para Gemini,
  o OpenClaw gerencia um recurso nativo do provider `cachedContents` em vez de
  injetar marcadores de cache na requisição.

### Uso JSON do Gemini CLI

- A saída JSON do Gemini CLI também pode expor acertos de cache por meio de `stats.cached`;
  o OpenClaw mapeia isso para `cacheRead`.
- Se o CLI omitir um valor direto de `stats.input`, o OpenClaw deriva tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Isso é apenas normalização de uso. Não significa que o OpenClaw esteja criando
  marcadores de cache de prompt no estilo Anthropic/OpenAI para o Gemini CLI.

## Limite de cache do prompt de sistema

O OpenClaw divide o prompt de sistema em um **prefixo estável** e um **sufixo
volátil** separados por um limite interno de prefixo de cache. O conteúdo acima do
limite (definições de ferramentas, metadados de Skills, arquivos do workspace e outro
contexto relativamente estático) é ordenado para permanecer byte a byte idêntico entre turnos.
O conteúdo abaixo do limite (por exemplo `HEARTBEAT.md`, timestamps de execução e
outros metadados por turno) pode mudar sem invalidar o prefixo em cache.

Principais decisões de design:

- Arquivos estáveis de contexto de projeto do workspace são ordenados antes de `HEARTBEAT.md`, para que
  alterações frequentes do heartbeat não invalidem o prefixo estável.
- O limite é aplicado em modelagens de cache das famílias Anthropic, OpenAI, Google e de transporte CLI, para que todos os providers compatíveis se beneficiem da mesma estabilidade de prefixo.
- Requisições Codex Responses e Anthropic Vertex são roteadas por meio de
  modelagem de cache com reconhecimento de fronteira para que a reutilização de cache continue alinhada com o que os providers realmente recebem.
- Impressões digitais de prompt de sistema são normalizadas (espaços em branco, finais de linha,
  contexto adicionado por hooks, ordenação de capacidades em tempo de execução) para que
  prompts semanticamente inalterados compartilhem KV/cache entre turnos.

Se você observar picos inesperados de `cacheWrite` após uma alteração de configuração ou workspace,
verifique se a mudança ocorre acima ou abaixo do limite de cache. Mover
conteúdo volátil para baixo do limite (ou estabilizá-lo) geralmente resolve o
problema.

## Proteções de estabilidade de cache do OpenClaw

O OpenClaw também mantém determinísticas várias formas de payload sensíveis a cache
antes que a requisição chegue ao provider:

- Catálogos de ferramentas MCP em pacote são ordenados deterministicamente antes do
  registro de ferramentas, para que mudanças na ordem de `listTools()` não alterem o bloco de ferramentas nem invalidem prefixos do cache de prompt.
- Sessões legadas com blocos de imagem persistidos mantêm os **3 turnos concluídos mais recentes**
  intactos; blocos de imagem já processados mais antigos podem ser
  substituídos por um marcador, para que acompanhamentos com muitas imagens não continuem reenviando grandes
  payloads antigos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma base de longa duração no seu agente principal e desative o cache em agentes notificadores com tráfego em rajadas:

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

### Base focada em custo

- Defina a base com `cacheRetention: "short"`.
- Ative `contextPruning.mode: "cache-ttl"`.
- Mantenha o heartbeat abaixo do seu TTL apenas para agentes que se beneficiam de caches aquecidos.

## Diagnóstico de cache

O OpenClaw expõe diagnósticos dedicados de rastreamento de cache para execuções incorporadas de agentes.

Para diagnósticos normais voltados ao usuário, `/status` e outros resumos de uso podem usar
a entrada de uso da transcrição mais recente como fonte de fallback para `cacheRead` /
`cacheWrite` quando a entrada da sessão ao vivo não possui esses contadores.

## Testes de regressão ao vivo

O OpenClaw mantém um único gate combinado de regressão de cache ao vivo para prefixos repetidos, turnos com ferramentas, turnos com imagens, transcrições de ferramentas no estilo MCP e um controle sem cache da Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute o gate ao vivo específico com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de baseline armazena os números observados ao vivo mais recentes, além dos limites mínimos de regressão específicos por provider usados pelo teste.
O executor também usa IDs de sessão e namespaces de prompt novos a cada execução para que o estado de cache anterior não polua a amostra de regressão atual.

Esses testes intencionalmente não usam critérios de sucesso idênticos entre os providers.

### Expectativas ao vivo da Anthropic

- Espere gravações explícitas de aquecimento via `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, porque o controle de cache da Anthropic avança o ponto de quebra do cache ao longo da conversa.
- Asserções atuais ao vivo ainda usam limites altos de taxa de acerto para caminhos estáveis, com ferramentas e com imagens.

### Expectativas ao vivo da OpenAI

- Espere apenas `cacheRead`. `cacheWrite` permanece em `0`.
- Trate a reutilização de cache em turnos repetidos como um platô específico do provider, não como reutilização de histórico completo em movimento no estilo Anthropic.
- As asserções atuais ao vivo usam verificações de limite mínimo conservadoras derivadas do comportamento observado ao vivo em `gpt-5.4-mini`:
  - prefixo estável: `cacheRead >= 4608`, taxa de acerto `>= 0.90`
  - transcrição com ferramenta: `cacheRead >= 4096`, taxa de acerto `>= 0.85`
  - transcrição com imagem: `cacheRead >= 3840`, taxa de acerto `>= 0.82`
  - transcrição no estilo MCP: `cacheRead >= 4096`, taxa de acerto `>= 0.85`

A verificação combinada ao vivo mais recente em 2026-04-04 chegou a:

- prefixo estável: `cacheRead=4864`, taxa de acerto `0.966`
- transcrição com ferramenta: `cacheRead=4608`, taxa de acerto `0.896`
- transcrição com imagem: `cacheRead=4864`, taxa de acerto `0.954`
- transcrição no estilo MCP: `cacheRead=4608`, taxa de acerto `0.891`

O tempo de relógio local recente para o gate combinado foi de cerca de `88s`.

Por que as asserções são diferentes:

- A Anthropic expõe pontos de quebra de cache explícitos e reutilização móvel do histórico da conversa.
- O cache de prompt da OpenAI ainda é sensível a prefixo exato, mas o prefixo reutilizável efetivo no tráfego Responses ao vivo pode atingir um platô antes do prompt completo.
- Por causa disso, comparar Anthropic e OpenAI por um único limite percentual entre providers cria regressões falsas.

### Configuração de `diagnostics.cacheTrace`

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

- `OPENCLAW_CACHE_TRACE=1` ativa o rastreamento de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` substitui o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` alterna a captura do payload completo de mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` alterna a captura do texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` alterna a captura do prompt de sistema.

### O que inspecionar

- Eventos de rastreamento de cache estão em JSONL e incluem snapshots em estágios como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto por turno nos tokens de cache fica visível nas superfícies normais de uso por meio de `cacheRead` e `cacheWrite` (por exemplo `/usage full` e resumos de uso da sessão).
- Para Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para OpenAI, espere `cacheRead` em acertos de cache e `cacheWrite` permanecendo em `0`; a OpenAI não publica um campo separado de tokens gravados em cache.
- Se você precisar de rastreamento de requisições, registre IDs de requisição e cabeçalhos de limite de taxa separadamente das métricas de cache. A saída atual de rastreamento de cache do OpenClaw é focada no formato do prompt/sessão e no uso normalizado de tokens, não em cabeçalhos brutos de resposta do provider.

## Solução rápida de problemas

- `cacheWrite` alto na maioria dos turnos: verifique entradas voláteis no prompt de sistema e confirme que o modelo/provider oferece suporte às suas configurações de cache.
- `cacheWrite` alto na Anthropic: geralmente significa que o ponto de quebra do cache está caindo em conteúdo que muda a cada requisição.
- `cacheRead` baixo na OpenAI: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se o mesmo `prompt_cache_key` é reutilizado nos turnos que devem compartilhar um cache.
- Nenhum efeito de `cacheRetention`: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: a forçagem em tempo de execução para `none` é esperada.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Session Pruning](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso e custos de API](/pt-BR/reference/api-usage-costs)

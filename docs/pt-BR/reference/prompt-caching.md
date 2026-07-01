---
read_when:
    - Você quer reduzir os custos de tokens de prompt com retenção de cache
    - Você precisa de comportamento de cache por agente em configurações multiagente
    - Você está ajustando Heartbeat e a remoção por cache-ttl em conjunto
summary: Botões de cache de prompt, ordem de mesclagem, comportamento do provedor e padrões de ajuste
title: Cache de prompts
x-i18n:
    generated_at: "2026-07-01T07:56:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Cache de prompt significa que o provedor do modelo pode reutilizar prefixos de prompt inalterados (geralmente instruções de sistema/desenvolvedor e outro contexto estável) entre turnos, em vez de reprocessá-los toda vez. O OpenClaw normaliza o uso do provedor em `cacheRead` e `cacheWrite` quando a API upstream expõe esses contadores diretamente.

As superfícies de status também podem recuperar contadores de cache do log de
uso da transcrição mais recente quando o instantâneo da sessão ativa não os
inclui, para que `/status` possa continuar exibindo uma linha de cache após
perda parcial de metadados da sessão. Valores de cache ativos existentes e
diferentes de zero ainda têm precedência sobre valores de fallback da
transcrição.

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem cache, prompts repetidos pagam o custo completo do prompt em cada turno, mesmo quando a maior parte da entrada não mudou.

As seções abaixo cobrem todos os controles relacionados a cache que afetam a reutilização de prompts e o custo de tokens.

Referências de provedores:

- Cache de prompt da Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompt da OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Cabeçalhos da API da OpenAI e IDs de requisição: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
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

Sobrescreva por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Sobrescrita por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordem de mesclagem da configuração:

1. `agents.defaults.params` (padrão global — aplica-se a todos os modelos)
2. `agents.defaults.models["provider/model"].params` (sobrescrita por modelo)
3. `agents.list[].params` (id do agente correspondente; sobrescreve por chave)

### `contextPruning.mode: "cache-ttl"`

Remove contexto antigo de resultados de ferramentas após janelas de TTL de cache, para que requisições após períodos ociosos não recoloquem em cache um histórico superdimensionado.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sessão](/pt-BR/concepts/session-pruning) para o comportamento completo.

### Heartbeat keep-warm

Heartbeat pode manter janelas de cache aquecidas e reduzir gravações de cache repetidas após intervalos ociosos.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é compatível em `agents.list[].heartbeat`.

## Comportamento do provedor

### Anthropic (API direta)

- `cacheRetention` é compatível.
- Com perfis de autenticação por chave de API da Anthropic, o OpenClaw define `cacheRetention: "short"` para refs de modelos Anthropic quando não configurado.
- Respostas nativas de Messages da Anthropic expõem tanto `cache_read_input_tokens` quanto `cache_creation_input_tokens`, então o OpenClaw pode mostrar `cacheRead` e `cacheWrite`.
- Para requisições nativas da Anthropic, `cacheRetention: "short"` mapeia para o cache efêmero padrão de 5 minutos, e `cacheRetention: "long"` faz upgrade para o TTL de 1 hora apenas em hosts diretos `api.anthropic.com`.

### OpenAI (API direta)

- Cache de prompt é automático em modelos recentes compatíveis. O OpenClaw não precisa injetar marcadores de cache em nível de bloco.
- O OpenClaw usa `prompt_cache_key` para manter o roteamento de cache estável entre turnos. Hosts diretos da OpenAI usam `prompt_cache_retention: "24h"` quando `cacheRetention: "long"` é selecionado.
- Provedores Completions compatíveis com OpenAI recebem `prompt_cache_key` somente quando a configuração do modelo define explicitamente `compat.supportsPromptCacheKey: true`. Encaminhamento de retenção longa é uma capacidade separada: `cacheRetention: "long"` explícito envia `prompt_cache_retention: "24h"` somente quando essa entrada de compatibilidade também oferece suporte a retenção longa de cache. Provedores como Mistral podem optar por chaves de cache enquanto definem `compat.supportsLongCacheRetention: false` para suprimir o campo de retenção longa. `cacheRetention: "none"` suprime ambos os campos.
- Respostas da OpenAI expõem tokens de prompt em cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` em eventos da Responses API). O OpenClaw mapeia isso para `cacheRead`.
- O uso de Responses do GPT-5.6 também pode expor `input_tokens_details.cache_write_tokens`. O OpenClaw mapeia isso para `cacheWrite` e precifica na taxa de gravação de cache do modelo; Responses que omitem o campo mantêm `cacheWrite` em `0`.
- A OpenAI retorna cabeçalhos úteis de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, mas a contabilidade de acertos de cache deve vir da carga de uso, não dos cabeçalhos.
- Na prática, a OpenAI frequentemente se comporta como um cache de prefixo inicial, em vez de reutilização de histórico completo móvel no estilo Anthropic. Turnos de texto com prefixo longo estável podem chegar perto de um platô de `4864` tokens em cache em sondagens ativas atuais, enquanto transcrições com muitas ferramentas ou no estilo MCP frequentemente estabilizam perto de `4608` tokens em cache, mesmo em repetições exatas.

### Anthropic Vertex

- Modelos Anthropic no Vertex AI (`anthropic-vertex/*`) oferecem suporte a `cacheRetention` da mesma forma que a Anthropic direta.
- `cacheRetention: "long"` mapeia para o TTL real de 1 hora do cache de prompt em endpoints do Vertex AI.
- A retenção de cache padrão para `anthropic-vertex` corresponde aos padrões da Anthropic direta.
- Requisições Vertex são roteadas por modelagem de cache ciente de limites, para que a reutilização de cache permaneça alinhada com o que os provedores realmente recebem.

### Amazon Bedrock

- Refs de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) oferecem suporte a passagem explícita de `cacheRetention`.
- Modelos Bedrock que não são Anthropic são forçados a `cacheRetention: "none"` em tempo de execução.

### Modelos OpenRouter

Para refs de modelo `openrouter/anthropic/*`, o OpenClaw injeta
`cache_control` em blocos de prompt de sistema/desenvolvedor para melhorar a
reutilização do cache de prompt somente quando a requisição ainda aponta para
uma rota OpenRouter verificada (`openrouter` em seu endpoint padrão, ou
qualquer provedor/URL base que resolva para `openrouter.ai`).

Para refs de modelo `openrouter/deepseek/*`, `openrouter/moonshot*/*` e
`openrouter/zai/*`, `contextPruning.mode: "cache-ttl"` é permitido porque o
OpenRouter lida automaticamente com cache de prompt no lado do provedor. O
OpenClaw não injeta marcadores Anthropic `cache_control` nessas requisições.

A construção de cache do DeepSeek é de melhor esforço e pode levar alguns
segundos. Um acompanhamento imediato ainda pode mostrar `cached_tokens: 0`;
verifique com uma requisição repetida de mesmo prefixo após um breve atraso e
use `usage.prompt_tokens_details.cached_tokens` como sinal de acerto de cache.

Se você redirecionar o modelo para uma URL de proxy compatível com OpenAI
arbitrária, o OpenClaw para de injetar esses marcadores de cache Anthropic
específicos do OpenRouter.

### Outros provedores

Se o provedor não oferecer suporte a este modo de cache, `cacheRetention` não terá efeito.

### API direta do Google Gemini

- O transporte direto Gemini (`api: "google-generative-ai"`) relata acertos de cache
  por meio do `cachedContentTokenCount` upstream; o OpenClaw mapeia isso para `cacheRead`.
- Quando `cacheRetention` é definido em um modelo Gemini direto, o OpenClaw cria,
  reutiliza e atualiza automaticamente recursos `cachedContents` para prompts de sistema
  em execuções do Google AI Studio. Isso significa que você não precisa mais pré-criar
  manualmente um identificador de conteúdo em cache.
- Você ainda pode passar um identificador de conteúdo em cache Gemini preexistente como
  `params.cachedContent` (ou o legado `params.cached_content`) no modelo configurado.
- Isso é separado do cache de prefixo de prompt da Anthropic/OpenAI. Para Gemini,
  o OpenClaw gerencia um recurso `cachedContents` nativo do provedor, em vez de
  injetar marcadores de cache na requisição.

### Uso da Gemini CLI

- A saída `stream-json` da Gemini CLI pode expor acertos de cache por meio de `stats.cached`;
  o OpenClaw mapeia isso para `cacheRead`. Sobrescritas legadas de `--output-format json` usam
  a mesma normalização de uso.
- Se a CLI omitir um valor direto de `stats.input`, o OpenClaw deriva tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Isso é apenas normalização de uso. Não significa que o OpenClaw esteja criando
  marcadores de cache de prompt no estilo Anthropic/OpenAI para a Gemini CLI.

## Limite de cache do prompt de sistema

O OpenClaw divide o prompt de sistema em um **prefixo estável** e um **sufixo
volátil** separados por um limite interno de prefixo de cache. Conteúdo acima do
limite (definições de ferramentas, metadados de Skills, arquivos do workspace e
outro contexto relativamente estático) é ordenado para permanecer byte a byte
idêntico entre turnos. Conteúdo abaixo do limite (por exemplo `HEARTBEAT.md`,
carimbos de data/hora de runtime e outros metadados por turno) pode mudar sem
invalidar o prefixo em cache.

Principais escolhas de design:

- Arquivos estáveis de contexto de projeto do workspace são ordenados antes de `HEARTBEAT.md` para que
  a variação do Heartbeat não invalide o prefixo estável.
- O limite é aplicado em toda a modelagem de transporte das famílias Anthropic, OpenAI, Google e
  CLI para que todos os provedores compatíveis se beneficiem da mesma estabilidade de prefixo.
- Requisições Codex Responses e Anthropic Vertex são roteadas por
  modelagem de cache ciente de limites, para que a reutilização de cache permaneça alinhada com o que os provedores
  realmente recebem.
- Impressões digitais do prompt de sistema são normalizadas (espaços em branco, finais de linha,
  contexto adicionado por hooks, ordenação de capacidades de runtime) para que prompts semanticamente inalterados
  compartilhem KV/cache entre turnos.

Se você vir picos inesperados de `cacheWrite` após uma alteração de configuração ou workspace,
verifique se a alteração fica acima ou abaixo do limite de cache. Mover
conteúdo volátil para baixo do limite (ou estabilizá-lo) frequentemente resolve o
problema.

## Guardas de estabilidade de cache do OpenClaw

O OpenClaw também mantém várias formas de payload sensíveis a cache determinísticas antes
que a requisição chegue ao provedor:

- Catálogos de ferramentas MCP de Bundle são ordenados deterministicamente antes do registro de ferramentas,
  para que mudanças na ordem de `listTools()` não alterem o bloco de ferramentas nem
  invalidem prefixos de cache de prompt.
- Sessões legadas com blocos de imagem persistidos mantêm intactos os **3 turnos concluídos mais recentes**;
  blocos de imagem mais antigos já processados podem ser substituídos por um marcador para que acompanhamentos
  com muitas imagens não continuem reenviando grandes payloads obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma linha de base de longa duração no seu agente principal, desative cache em agentes notificadores com picos de atividade:

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

### Linha de base priorizando custo

- Defina a linha de base `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha Heartbeat abaixo do seu TTL somente para agentes que se beneficiam de caches aquecidos.

## Diagnósticos de cache

O OpenClaw expõe diagnósticos dedicados de rastreamento de cache para execuções de agentes incorporados.

Para diagnósticos normais voltados ao usuário, `/status` e outros resumos de uso podem usar
a entrada de uso da transcrição mais recente como fonte de fallback para `cacheRead` /
`cacheWrite` quando a entrada da sessão ativa não tem esses contadores.

## Testes de regressão ativos

O OpenClaw mantém uma única barreira combinada de regressão de cache ativa para prefixos repetidos, turnos de ferramentas, turnos de imagem, transcrições de ferramentas no estilo MCP e um controle Anthropic sem cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute a barreira ativa estreita com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de linha de base armazena os números live observados mais recentemente, além dos pisos de regressão específicos por provedor usados pelo teste.
O runner também usa IDs de sessão e namespaces de prompt novos a cada execução, para que o estado de cache anterior não contamine a amostra de regressão atual.

Esses testes intencionalmente não usam critérios de sucesso idênticos entre provedores.

### Expectativas live da Anthropic

- Espere escritas explícitas de aquecimento via `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, porque o controle de cache da Anthropic avança o ponto de interrupção do cache pela conversa.
- Asserções live atuais ainda usam limites altos de taxa de acerto para caminhos estáveis, de ferramentas e de imagens.

### Expectativas live da OpenAI

- Espere apenas `cacheRead`. `cacheWrite` permanece `0`.
- Trate a reutilização de cache em turnos repetidos como um platô específico do provedor, não como reutilização móvel de histórico completo no estilo da Anthropic.
- Asserções live atuais usam verificações de piso conservadoras derivadas do comportamento live observado em `gpt-5.4-mini`:
  - prefixo estável: `cacheRead >= 4608`, taxa de acerto `>= 0.90`
  - transcrição de ferramenta: `cacheRead >= 4096`, taxa de acerto `>= 0.85`
  - transcrição de imagem: `cacheRead >= 3840`, taxa de acerto `>= 0.82`
  - transcrição no estilo MCP: `cacheRead >= 4096`, taxa de acerto `>= 0.85`

A verificação live combinada recente em 2026-04-04 chegou a:

- prefixo estável: `cacheRead=4864`, taxa de acerto `0.966`
- transcrição de ferramenta: `cacheRead=4608`, taxa de acerto `0.896`
- transcrição de imagem: `cacheRead=4864`, taxa de acerto `0.954`
- transcrição no estilo MCP: `cacheRead=4608`, taxa de acerto `0.891`

O tempo local recente de relógio para o gate combinado foi de cerca de `88s`.

Por que as asserções diferem:

- A Anthropic expõe pontos de interrupção de cache explícitos e reutilização móvel do histórico da conversa.
- O cache de prompt da OpenAI ainda é sensível ao prefixo exato, mas o prefixo reutilizável efetivo no tráfego live de Responses pode atingir um platô antes do prompt completo.
- Por isso, comparar Anthropic e OpenAI por um único limite percentual entre provedores cria regressões falsas.

### Configuração de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Padrões:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Alternâncias de ambiente (depuração pontual)

- `OPENCLAW_CACHE_TRACE=1` habilita o rastreamento de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sobrescreve o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` alterna a captura da carga completa de mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` alterna a captura do texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` alterna a captura do prompt do sistema.

### O que inspecionar

- Eventos de rastreamento de cache são JSONL e incluem snapshots em estágios como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto de tokens de cache por turno fica visível nas superfícies normais de uso via `cacheRead` e `cacheWrite` (por exemplo, `/usage full` e resumos de uso da sessão).
- Para a Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para a OpenAI, espere `cacheRead` em acertos de cache. Responses do GPT-5.6 também pode relatar `cacheWrite` enquanto segmentos de prompt são escritos; outras cargas de Responses que omitem o contador de escrita o mantêm em `0`.
- Se precisar de rastreamento de requisições, registre IDs de requisição e cabeçalhos de limite de taxa separadamente das métricas de cache. A saída atual de rastreamento de cache do OpenClaw é focada no formato de prompt/sessão e no uso normalizado de tokens, em vez de cabeçalhos brutos de resposta do provedor.

## Solução rápida de problemas

- `cacheWrite` alto na maioria dos turnos: verifique entradas voláteis do prompt do sistema e confirme se o modelo/provedor aceita suas configurações de cache.
- `cacheWrite` alto na Anthropic: frequentemente significa que o ponto de interrupção do cache está caindo em conteúdo que muda a cada requisição.
- `cacheRead` baixo na OpenAI: confirme que o prefixo estável está no início, que o prefixo repetido tem pelo menos 1024 tokens e que o mesmo `prompt_cache_key` é reutilizado em turnos que devem compartilhar um cache.
- Nenhum efeito de `cacheRetention`: confirme que a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: é esperado que o runtime force para `none`.

Documentos relacionados:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso da API e custos](/pt-BR/reference/api-usage-costs)

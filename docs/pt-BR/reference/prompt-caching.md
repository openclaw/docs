---
read_when:
    - Você quer reduzir os custos de tokens de prompt com retenção de cache
    - Você precisa de comportamento de cache por agente em configurações multiagente
    - Você está ajustando Heartbeat e a remoção por cache-ttl juntos
summary: Controles de cache de prompts, ordem de mesclagem, comportamento do provedor e padrões de ajuste
title: Cache de prompts
x-i18n:
    generated_at: "2026-06-27T18:08:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

Cache de prompts significa que o provedor do modelo pode reutilizar prefixos de prompt inalterados (geralmente instruções system/developer e outro contexto estável) entre turnos, em vez de reprocessá-los todas as vezes. O OpenClaw normaliza o uso do provedor em `cacheRead` e `cacheWrite` quando a API upstream expõe esses contadores diretamente.

As superfícies de status também podem recuperar contadores de cache do log de uso
da transcrição mais recente quando o snapshot da sessão ao vivo não os inclui, para que `/status` possa continuar
mostrando uma linha de cache após perda parcial dos metadados da sessão. Valores de cache ao vivo
existentes e diferentes de zero ainda têm precedência sobre valores de fallback da transcrição.

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível para sessões de longa duração. Sem cache, prompts repetidos pagam o custo total do prompt em cada turno, mesmo quando a maior parte da entrada não mudou.

As seções abaixo cobrem todos os controles relacionados a cache que afetam a reutilização de prompts e o custo de tokens.

Referências de provedores:

- Cache de prompts da Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompts da OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
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
3. `agents.list[].params` (id de agente correspondente; substitui por chave)

### `contextPruning.mode: "cache-ttl"`

Remove contexto antigo de resultados de ferramentas após janelas de TTL do cache para que requisições pós-inatividade não recoloquem em cache um histórico grande demais.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sessão](/pt-BR/concepts/session-pruning) para ver o comportamento completo.

### Heartbeat para manter aquecido

Heartbeat pode manter janelas de cache aquecidas e reduzir gravações repetidas de cache após intervalos de inatividade.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é aceito em `agents.list[].heartbeat`.

## Comportamento dos provedores

### Anthropic (API direta)

- `cacheRetention` é aceito.
- Com perfis de autenticação por chave de API da Anthropic, o OpenClaw semeia `cacheRetention: "short"` para refs de modelos Anthropic quando não definido.
- Respostas nativas de Messages da Anthropic expõem tanto `cache_read_input_tokens` quanto `cache_creation_input_tokens`, então o OpenClaw pode mostrar tanto `cacheRead` quanto `cacheWrite`.
- Para requisições nativas da Anthropic, `cacheRetention: "short"` mapeia para o cache efêmero padrão de 5 minutos, e `cacheRetention: "long"` atualiza para o TTL de 1 hora apenas em hosts diretos `api.anthropic.com`.

### OpenAI (API direta)

- Cache de prompts é automático em modelos recentes compatíveis. O OpenClaw não precisa injetar marcadores de cache em nível de bloco.
- O OpenClaw usa `prompt_cache_key` para manter o roteamento de cache estável entre turnos. Hosts diretos da OpenAI usam `prompt_cache_retention: "24h"` quando `cacheRetention: "long"` é selecionado.
- Provedores Completions compatíveis com OpenAI recebem `prompt_cache_key` apenas quando a configuração do modelo define explicitamente `compat.supportsPromptCacheKey: true`. O encaminhamento de retenção longa é uma capacidade separada: `cacheRetention: "long"` explícito envia `prompt_cache_retention: "24h"` apenas quando essa entrada compat também oferece suporte a retenção longa de cache. Provedores como Mistral podem optar por chaves de cache enquanto definem `compat.supportsLongCacheRetention: false` para suprimir o campo de retenção longa. `cacheRetention: "none"` suprime ambos os campos.
- Respostas da OpenAI expõem tokens de prompt em cache por meio de `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` em eventos da Responses API). O OpenClaw mapeia isso para `cacheRead`.
- A OpenAI não expõe um contador separado de tokens de gravação de cache, então `cacheWrite` permanece `0` em caminhos da OpenAI, mesmo quando o provedor está aquecendo um cache.
- A OpenAI retorna cabeçalhos úteis de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, mas a contabilização de acertos de cache deve vir do payload de uso, não dos cabeçalhos.
- Na prática, a OpenAI muitas vezes se comporta como um cache de prefixo inicial em vez de reutilização de histórico completo móvel no estilo da Anthropic. Turnos com texto de prefixo longo e estável podem chegar perto de um platô de `4864` tokens em cache em sondagens ao vivo atuais, enquanto transcrições com muitas ferramentas ou no estilo MCP muitas vezes atingem um platô perto de `4608` tokens em cache, mesmo em repetições exatas.

### Anthropic Vertex

- Modelos Anthropic no Vertex AI (`anthropic-vertex/*`) oferecem suporte a `cacheRetention` da mesma forma que a Anthropic direta.
- `cacheRetention: "long"` mapeia para o TTL real de cache de prompts de 1 hora em endpoints do Vertex AI.
- A retenção de cache padrão para `anthropic-vertex` corresponde aos padrões da Anthropic direta.
- Requisições Vertex são roteadas por modelagem de cache ciente de limites para que a reutilização de cache permaneça alinhada ao que os provedores realmente recebem.

### Amazon Bedrock

- Refs de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) oferecem suporte a passagem explícita de `cacheRetention`.
- Modelos Bedrock não Anthropic são forçados para `cacheRetention: "none"` em tempo de execução.

### Modelos OpenRouter

Para refs de modelos `openrouter/anthropic/*`, o OpenClaw injeta
`cache_control` em blocos de prompt system/developer para melhorar a reutilização
do cache de prompts apenas quando a requisição ainda está apontando para uma rota OpenRouter verificada
(`openrouter` em seu endpoint padrão, ou qualquer provedor/URL base que resolva
para `openrouter.ai`).

Para refs de modelos `openrouter/deepseek/*`, `openrouter/moonshot*/*` e `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` é permitido porque o OpenRouter
lida automaticamente com cache de prompts no lado do provedor. O OpenClaw não injeta
marcadores Anthropic `cache_control` nessas requisições.

A construção de cache do DeepSeek é de melhor esforço e pode levar alguns segundos. Um
acompanhamento imediato ainda pode mostrar `cached_tokens: 0`; verifique com uma requisição
repetida com o mesmo prefixo após um breve atraso e use `usage.prompt_tokens_details.cached_tokens`
como o sinal de acerto de cache.

Se você redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI, o OpenClaw
para de injetar esses marcadores de cache Anthropic específicos do OpenRouter.

### Outros provedores

Se o provedor não oferecer suporte a este modo de cache, `cacheRetention` não tem efeito.

### API direta do Google Gemini

- O transporte direto do Gemini (`api: "google-generative-ai"`) relata acertos de cache
  por meio de `cachedContentTokenCount` upstream; o OpenClaw mapeia isso para `cacheRead`.
- Quando `cacheRetention` é definido em um modelo Gemini direto, o OpenClaw cria,
  reutiliza e atualiza automaticamente recursos `cachedContents` para prompts do sistema
  em execuções do Google AI Studio. Isso significa que você não precisa mais pré-criar
  manualmente um identificador de conteúdo em cache.
- Você ainda pode passar um identificador de conteúdo em cache preexistente do Gemini como
  `params.cachedContent` (ou o legado `params.cached_content`) no modelo configurado.
- Isso é separado do cache de prefixo de prompts da Anthropic/OpenAI. Para Gemini,
  o OpenClaw gerencia um recurso `cachedContents` nativo do provedor em vez de
  injetar marcadores de cache na requisição.

### Uso do Gemini CLI

- A saída `stream-json` do Gemini CLI pode expor acertos de cache por meio de `stats.cached`;
  o OpenClaw mapeia isso para `cacheRead`. Substituições legadas de `--output-format json` usam
  a mesma normalização de uso.
- Se a CLI omitir um valor direto de `stats.input`, o OpenClaw deriva os tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Isso é apenas normalização de uso. Não significa que o OpenClaw esteja criando
  marcadores de cache de prompts no estilo Anthropic/OpenAI para Gemini CLI.

## Limite de cache do prompt do sistema

O OpenClaw divide o prompt do sistema em um **prefixo estável** e um **sufixo
volátil** separados por um limite interno de prefixo de cache. O conteúdo acima do
limite (definições de ferramentas, metadados de Skills, arquivos do workspace e outro
contexto relativamente estático) é ordenado para permanecer byte a byte idêntico entre turnos.
O conteúdo abaixo do limite (por exemplo, `HEARTBEAT.md`, carimbos de data/hora de tempo de execução e
outros metadados por turno) pode mudar sem invalidar o prefixo em cache.

Principais escolhas de design:

- Arquivos estáveis de contexto de projeto do workspace são ordenados antes de `HEARTBEAT.md` para que
  a variação do heartbeat não invalide o prefixo estável.
- O limite é aplicado em modelagem de transporte das famílias Anthropic, OpenAI, Google e
  CLI, para que todos os provedores compatíveis se beneficiem da mesma estabilidade de prefixo.
- Requisições Codex Responses e Anthropic Vertex são roteadas por
  modelagem de cache ciente de limites, para que a reutilização de cache permaneça alinhada ao que os provedores
  realmente recebem.
- Impressões digitais de prompts do sistema são normalizadas (espaços em branco, finais de linha,
  contexto adicionado por hook, ordenação de capacidades de runtime) para que prompts semanticamente inalterados
  compartilhem KV/cache entre turnos.

Se você vir picos inesperados de `cacheWrite` após uma alteração de configuração ou workspace,
verifique se a alteração fica acima ou abaixo do limite de cache. Mover
conteúdo volátil para baixo do limite (ou estabilizá-lo) frequentemente resolve o
problema.

## Proteções de estabilidade de cache do OpenClaw

O OpenClaw também mantém determinísticos vários formatos de payload sensíveis a cache antes
que a requisição chegue ao provedor:

- Catálogos de ferramentas MCP do bundle são ordenados deterministicamente antes do registro
  de ferramentas, para que mudanças na ordem de `listTools()` não alterem o bloco de ferramentas nem
  invalidem prefixos de cache de prompts.
- Sessões legadas com blocos de imagem persistidos mantêm intactos os **3 turnos concluídos
  mais recentes**; blocos de imagem mais antigos e já processados podem ser
  substituídos por um marcador para que acompanhamentos com muitas imagens não continuem reenviando
  grandes payloads obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma linha de base de longa duração no seu agente principal e desabilite cache em agentes notificadores com tráfego em rajadas:

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

### Linha de base com prioridade em custo

- Defina a linha de base `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha Heartbeat abaixo do seu TTL apenas para agentes que se beneficiam de caches aquecidos.

## Diagnóstico de cache

O OpenClaw expõe diagnósticos dedicados de rastreamento de cache para execuções de agente incorporadas.

Para diagnósticos normais voltados ao usuário, `/status` e outros resumos de uso podem usar
a entrada de uso mais recente da transcrição como fonte de fallback para `cacheRead` /
`cacheWrite` quando a entrada da sessão ao vivo não tiver esses contadores.

## Testes de regressão ao vivo

O OpenClaw mantém um gate combinado de regressão de cache ao vivo para prefixos repetidos, turnos de ferramentas, turnos de imagem, transcrições de ferramentas no estilo MCP e um controle Anthropic sem cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute o gate ao vivo estreito com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de linha de base armazena os números ao vivo observados mais recentes, além dos pisos de regressão específicos do provedor usados pelo teste.
O executor também usa IDs de sessão e namespaces de prompt novos por execução, para que o estado de cache anterior não contamine a amostra de regressão atual.

Estes testes intencionalmente não usam critérios de sucesso idênticos entre provedores.

### Expectativas ao vivo da Anthropic

- Espere escritas explícitas de aquecimento via `cacheWrite`.
- Espere reutilização de histórico quase completo em turnos repetidos, porque o controle de cache da Anthropic avança o ponto de interrupção do cache pela conversa.
- As asserções ao vivo atuais ainda usam limites de alta taxa de acerto para caminhos estáveis, de ferramenta e de imagem.

### Expectativas ao vivo da OpenAI

- Espere apenas `cacheRead`. `cacheWrite` permanece `0`.
- Trate a reutilização de cache em turnos repetidos como um platô específico do provedor, não como reutilização móvel de histórico completo no estilo da Anthropic.
- As asserções ao vivo atuais usam verificações conservadoras de piso derivadas do comportamento ao vivo observado em `gpt-5.4-mini`:
  - prefixo estável: `cacheRead >= 4608`, taxa de acerto `>= 0.90`
  - transcrição de ferramenta: `cacheRead >= 4096`, taxa de acerto `>= 0.85`
  - transcrição de imagem: `cacheRead >= 3840`, taxa de acerto `>= 0.82`
  - transcrição no estilo MCP: `cacheRead >= 4096`, taxa de acerto `>= 0.85`

A verificação ao vivo combinada mais recente em 2026-04-04 chegou a:

- prefixo estável: `cacheRead=4864`, taxa de acerto `0.966`
- transcrição de ferramenta: `cacheRead=4608`, taxa de acerto `0.896`
- transcrição de imagem: `cacheRead=4864`, taxa de acerto `0.954`
- transcrição no estilo MCP: `cacheRead=4608`, taxa de acerto `0.891`

O tempo real local recente para o gate combinado foi de cerca de `88s`.

Por que as asserções diferem:

- A Anthropic expõe pontos de interrupção de cache explícitos e reutilização móvel do histórico da conversa.
- O cache de prompt da OpenAI ainda é sensível a prefixo exato, mas o prefixo efetivamente reutilizável no tráfego ao vivo de Responses pode atingir um platô antes do prompt completo.
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

- `OPENCLAW_CACHE_TRACE=1` habilita rastreamento de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` sobrescreve o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` alterna a captura da carga completa de mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` alterna a captura do texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` alterna a captura do prompt de sistema.

### O que inspecionar

- Eventos de rastreamento de cache são JSONL e incluem snapshots em estágios como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto de tokens de cache por turno fica visível nas superfícies normais de uso via `cacheRead` e `cacheWrite` (por exemplo, `/usage full` e resumos de uso da sessão).
- Para Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para OpenAI, espere `cacheRead` em acertos de cache e que `cacheWrite` permaneça `0`; a OpenAI não publica um campo separado de tokens de escrita de cache.
- Se você precisar de rastreamento de requisições, registre IDs de requisição e cabeçalhos de limite de taxa separadamente das métricas de cache. A saída atual de rastreamento de cache do OpenClaw é focada no formato de prompt/sessão e no uso normalizado de tokens, em vez de cabeçalhos brutos de resposta do provedor.

## Solução rápida de problemas

- `cacheWrite` alto na maioria dos turnos: verifique entradas voláteis do prompt de sistema e confirme se o modelo/provedor oferece suporte às suas configurações de cache.
- `cacheWrite` alto na Anthropic: frequentemente significa que o ponto de interrupção do cache está caindo em conteúdo que muda a cada requisição.
- `cacheRead` baixo na OpenAI: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se o mesmo `prompt_cache_key` é reutilizado para turnos que devem compartilhar um cache.
- Sem efeito de `cacheRetention`: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: força esperada em runtime para `none`.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Poda de sessão](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso e custos da API](/pt-BR/reference/api-usage-costs)

---
read_when:
    - Você quer reduzir os custos de tokens de prompt com a retenção de cache
    - Você precisa de um comportamento de cache por agente em configurações multiagente
    - Você está ajustando em conjunto a remoção por Heartbeat e por TTL do cache
summary: Opções de cache de prompts, ordem de mesclagem, comportamento do provedor e padrões de ajuste
title: Cache de prompts
x-i18n:
    generated_at: "2026-07-12T00:21:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

O cache de prompts permite que um provedor de modelos reutilize um prefixo de prompt inalterado (instruções de sistema/desenvolvedor, definições de ferramentas e outros contextos estáveis) entre turnos, em vez de reprocessá-lo a cada solicitação. Isso reduz o custo de tokens e a latência em sessões de longa duração com contexto repetido.

O OpenClaw normaliza o uso dos provedores em `cacheRead` e `cacheWrite` sempre que a API upstream expõe esses contadores. Os resumos de uso (`/status` e similares) recorrem à última entrada de uso da transcrição quando o snapshot da sessão ativa não contém contadores de cache; um valor ativo diferente de zero sempre prevalece sobre esse fallback.

Referências dos provedores:

- [Cache de prompts da Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Cache de prompts da OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Configurações principais

### `cacheRetention`

Valores: `"none" | "short" | "long"`. Configurável como padrão global, por modelo e por agente.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # substitui o padrão global para este modelo
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # substitui ambos os padrões para este agente
```

Ordem de mesclagem (o último prevalece):

1. `agents.defaults.params` - padrão global para todos os modelos
2. `agents.defaults.models["provider/model"].params` - substituição por modelo
3. `agents.list[].params` - substituição por agente, correspondente ao ID do agente

Fonte: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Remove do contexto resultados antigos de ferramentas após o término da janela de TTL do cache, para que uma solicitação feita depois de um período de inatividade não armazene novamente em cache um histórico excessivamente grande.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Limpeza de sessões](/pt-BR/concepts/session-pruning) para ver o comportamento completo.

### Manutenção do cache aquecido por Heartbeat

O Heartbeat pode manter as janelas de cache aquecidas e reduzir gravações repetidas no cache após períodos de inatividade. É configurável globalmente (`agents.defaults.heartbeat`) ou por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamento dos provedores

### Anthropic (API direta e Vertex AI)

- `cacheRetention` é compatível com os provedores `anthropic` e `anthropic-vertex`, além de modelos Claude no `amazon-bedrock` e endpoints personalizados compatíveis com `anthropic-messages` quando `cacheRetention` é definido explicitamente.
- Quando não definido, o OpenClaw inicializa `cacheRetention: "short"` para a Anthropic direta (somente provedores `anthropic` e `anthropic-vertex`; outras rotas da família Anthropic exigem um valor explícito).
- As respostas nativas da Anthropic Messages expõem `cache_read_input_tokens` e `cache_creation_input_tokens`, mapeados para `cacheRead` e `cacheWrite`.
- `cacheRetention: "short"` corresponde ao cache efêmero padrão de 5 minutos. `cacheRetention: "long"` solicita o TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) quando definido explicitamente. Uma retenção longa implícita ou controlada por variável de ambiente (`OPENCLAW_CACHE_RETENTION=long` sem `cacheRetention` explícito) só passa para o TTL de 1 hora em hosts `api.anthropic.com` ou Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); outros hosts mantêm o cache de 5 minutos.

Fonte: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API direta)

- O cache de prompts é automático em modelos recentes compatíveis; o OpenClaw não insere marcadores de cache no nível de blocos.
- O OpenClaw envia `prompt_cache_key` para manter o roteamento do cache estável entre turnos. Hosts diretos de `api.openai.com` recebem isso automaticamente. Proxies compatíveis com OpenAI (oMLX, llama.cpp e endpoints personalizados) precisam de `compat.supportsPromptCacheKey: true` na configuração do modelo para habilitar esse recurso — isso nunca é detectado automaticamente para um proxy.
- `prompt_cache_retention: "24h"` é adicionado somente quando `cacheRetention: "long"` está selecionado e o endpoint resolvido é compatível tanto com a chave de cache quanto com a retenção longa (`compat.supportsLongCacheRetention`, verdadeiro por padrão; os perfis de compatibilidade do Together AI e do Cloudflare a desabilitam). `cacheRetention: "none"` suprime ambos os campos.
- Os acertos de cache são expostos por `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (Responses API), mapeados para `cacheRead`.
- Os payloads da Responses API também podem expor `input_tokens_details.cache_write_tokens`, mapeado para `cacheWrite` e tarifado conforme a taxa de gravação em cache do modelo; os payloads da Responses que omitem o campo mantêm `cacheWrite` em `0`. A API Chat Completions da OpenAI não documenta nem emite um contador `cache_write_tokens`, mas o OpenClaw ainda lê `prompt_tokens_details.cache_write_tokens` nela para proxies compatíveis com OpenRouter e no estilo do DeepSeek que informam uma contagem de gravação separada.
- Na prática, o OpenAI se comporta mais como um cache de prefixo inicial do que como a reutilização móvel do histórico completo da Anthropic — consulte [Expectativas em uso real da OpenAI](#openai-live-expectations) abaixo.

### Amazon Bedrock

- As referências de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, além dos prefixos de perfis de inferência do sistema da AWS `us.`/`eu.`/`global.anthropic.claude*`) permitem o repasse explícito de `cacheRetention`.
- Modelos Bedrock que não são da Anthropic (por exemplo, `amazon.nova-*`) são resolvidos sem retenção de cache em tempo de execução, independentemente de qualquer valor configurado de `cacheRetention`.
- ARNs opacos de perfis de inferência de aplicações do Bedrock (IDs de perfil que não contêm `claude`) também são resolvidos sem retenção de cache, a menos que `cacheRetention` seja definido explicitamente, pois não é possível inferir a família do modelo somente pelo ARN.

### OpenRouter

Para referências de modelo `openrouter/anthropic/*`, o OpenClaw insere marcadores `cache_control` da Anthropic nos blocos de prompt do sistema/desenvolvedor, mas somente quando a solicitação ainda se destina a uma rota verificada do OpenRouter (`openrouter` em seu endpoint padrão ou qualquer provedor/URL base que seja resolvido como `openrouter.ai`). Redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI interrompe essa inserção.

`contextPruning.mode: "cache-ttl"` é permitido para referências de modelo `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` e `openrouter/zai/*`, pois essas rotas processam o cache de prompts no lado do provedor sem precisar dos marcadores inseridos pelo OpenClaw.

Fonte: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

A criação do cache do DeepSeek no OpenRouter é feita em regime de melhor esforço e pode levar alguns segundos; uma solicitação de acompanhamento imediata ainda pode mostrar `cached_tokens: 0`. Verifique com uma solicitação repetida usando o mesmo prefixo após um breve intervalo, utilizando `usage.prompt_tokens_details.cached_tokens` como sinal de acerto no cache.

### Google Gemini (API direta)

- O transporte direto do Gemini (`api: "google-generative-ai"`) informa acertos no cache por meio de `cachedContentTokenCount` upstream, mapeado para `cacheRead`.
- Famílias de modelos qualificadas: `gemini-2.5*` e `gemini-3*` (exclui variantes Live/de pré-visualização fora dessa correspondência de prefixo, por exemplo, `gemini-live-2.5-flash-preview`).
- Quando `cacheRetention` é definido em um modelo qualificado, o OpenClaw cria, reutiliza e atualiza automaticamente um recurso `cachedContents` para o prompt do sistema — não é necessário fornecer manualmente um identificador de conteúdo armazenado em cache. O TTL é `300s` para `cacheRetention: "short"` e `3600s` para `"long"`.
- Ainda é possível fornecer um identificador de conteúdo em cache preexistente do Gemini por meio de `params.cachedContent` (ou o formato legado `params.cached_content`); um identificador explícito ignora completamente o caminho automático de gerenciamento de cache.
- Isso é diferente do cache de prefixo de prompts da Anthropic/OpenAI: o OpenClaw gerencia um recurso `cachedContents` nativo do provedor para o Gemini, em vez de inserir marcadores de cache em linha.

Fonte: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Provedores via harness da CLI (Claude Code, Gemini CLI)

Os backends de CLI que emitem eventos de uso em JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passam por um analisador compartilhado de uso que reconhece diversas variações de nomes de campos, incluindo um contador simples `cached` mapeado para `cacheRead`. Quando o payload JSON da CLI omite um campo direto de tokens de entrada, o OpenClaw o deriva como `input_tokens - cached`. Isso é apenas normalização de uso — não cria marcadores de cache de prompts no estilo da Anthropic/OpenAI para esses modelos controlados pela CLI.

Fonte: `src/agents/cli-output.ts` (`toCliUsage`).

### Outros provedores

Se um provedor não for compatível com nenhum dos modos de cache acima, `cacheRetention` não terá efeito.

## Limite do cache do prompt do sistema

O OpenClaw divide o prompt do sistema em um **prefixo estável** e um **sufixo volátil** em um limite interno do prefixo de cache. O conteúdo acima do limite (definições de ferramentas, metadados de Skills e arquivos do espaço de trabalho) é ordenado para permanecer idêntico byte a byte entre os turnos. O conteúdo abaixo do limite (por exemplo, `HEARTBEAT.md`, timestamps de tempo de execução e outros metadados por turno) pode mudar sem invalidar o prefixo armazenado em cache.

Principais decisões de projeto:

- Os arquivos estáveis de contexto do projeto no espaço de trabalho são ordenados antes de `HEARTBEAT.md`, para que as mudanças frequentes do Heartbeat não invalidem o prefixo estável.
- O limite se aplica à preparação do transporte das famílias Anthropic e OpenAI, do Google e da CLI, para que todos os provedores compatíveis se beneficiem da mesma estabilidade de prefixo.
- As solicitações do Codex Responses e da Anthropic Vertex são roteadas por uma preparação de cache ciente do limite, para que a reutilização do cache permaneça alinhada ao que os provedores realmente recebem.
- As impressões digitais dos prompts do sistema são normalizadas (espaços em branco, finais de linha, contexto adicionado por hooks e ordenação de recursos de tempo de execução), para que prompts semanticamente inalterados compartilhem o cache entre turnos.

Se você observar picos inesperados de `cacheWrite` após uma alteração de configuração ou do espaço de trabalho, verifique se a alteração fica acima ou abaixo do limite do cache. Mover conteúdo volátil para baixo do limite (ou estabilizá-lo) geralmente resolve o problema.

## Proteções de estabilidade do cache do OpenClaw

- Os catálogos de ferramentas MCP incluídos são ordenados de forma determinística (primeiro pelo nome do servidor e depois pelo nome da ferramenta) antes do registro das ferramentas, para que mudanças na ordem de `listTools()` não alterem o bloco de ferramentas nem invalidem os prefixos do cache de prompts.
- Sessões legadas com blocos de imagem persistidos mantêm intactos os **3 turnos concluídos mais recentes** (contando todos os turnos concluídos, não apenas aqueles com imagens). Blocos de imagem mais antigos e já processados são substituídos por um marcador de texto, para que acompanhamentos com muitas imagens não continuem reenviando payloads grandes e obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma configuração base de longa duração no agente principal e desabilite o cache em agentes de notificação com tráfego em rajadas:

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

### Configuração base voltada à redução de custos

- Defina `cacheRetention: "short"` como configuração base.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha o intervalo do Heartbeat abaixo do TTL somente para agentes que se beneficiam de caches aquecidos.

## Testes de regressão em uso real

O OpenClaw executa uma única verificação combinada de regressão de cache em uso real que abrange prefixos repetidos, turnos de ferramentas, turnos de imagens, transcrições de ferramentas no estilo MCP e um controle sem cache da Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de referência armazena os números observados mais recentemente em uso real, além dos limites mínimos de regressão específicos de cada provedor que o teste verifica. Cada execução usa IDs de sessão e namespaces de prompt novos e exclusivos da execução, para que o estado de cache anterior não contamine a amostra atual. Anthropic e OpenAI usam critérios diferentes: não atingir o limite mínimo da Anthropic é uma regressão crítica (o teste falha), enquanto não atingir o limite mínimo da OpenAI serve apenas para monitoramento (é registrado como aviso e não causa falha na execução). Eles não compartilham um único limite comum entre provedores.

### Expectativas em uso real da Anthropic

- Espere gravações explícitas de aquecimento por meio de `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, pois o controle de cache da Anthropic avança o ponto de interrupção do cache ao longo da conversa.
- Os limites mínimos de referência para fluxos estáveis, de ferramentas, de imagens e no estilo MCP são barreiras rígidas contra regressões.

### Expectativas para uso ao vivo da OpenAI

- Espere apenas `cacheRead`; `cacheWrite` permanece `0` no Chat Completions.
- Trate a reutilização do cache em turnos repetidos como um platô específico do provedor, não como a reutilização móvel de todo o histórico no estilo da Anthropic.
- Os limites mínimos servem apenas para monitoramento (uma ocorrência abaixo do limite é registrada como aviso, não como falha de teste) e são derivados do comportamento observado ao vivo no `gpt-5.4-mini`:

| Cenário                | Limite mínimo de `cacheRead` | Limite mínimo da taxa de acerto |
| ---------------------- | ---------------------------: | ------------------------------: |
| Prefixo estável        |                        4.608 |                            0,90 |
| Transcrição de ferramenta |                     4.096 |                            0,85 |
| Transcrição de imagem  |                        3.840 |                            0,82 |
| Transcrição no estilo MCP |                     4.096 |                            0,85 |

Os números de referência observados mais recentemente (de `live-cache-regression-baseline.ts`) ficaram em: prefixo estável `cacheRead=4864`, taxa de acerto `0.966`; transcrição de ferramenta `cacheRead=4608`, taxa de acerto `0.896`; transcrição de imagem `cacheRead=4864`, taxa de acerto `0.954`; transcrição no estilo MCP `cacheRead=4608`, taxa de acerto `0.891`.

Por que as asserções diferem: a Anthropic expõe pontos de interrupção explícitos do cache e reutilização móvel do histórico da conversa, enquanto o prefixo efetivamente reutilizável da OpenAI no tráfego ao vivo pode atingir um platô antes de abranger o prompt completo. Comparar os dois provedores com um único limite percentual entre provedores gera falsas regressões.

## Configuração de `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opcional
    includeMessages: false # padrão: true
    includePrompt: false # padrão: true
    includeSystem: false # padrão: true
```

Padrões:

| Chave             | Padrão                                       |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Variáveis de ambiente para ativação e desativação (depuração pontual)

| Variável                             | Efeito                                           |
| ------------------------------------ | ------------------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Ativa o rastreamento do cache                    |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Substitui o caminho de saída                     |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Ativa ou desativa a captura da carga útil completa das mensagens |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Ativa ou desativa a captura do texto do prompt   |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Ativa ou desativa a captura do prompt do sistema |

### O que inspecionar

- Os eventos de rastreamento do cache estão em JSONL, com instantâneos por estágio, como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto dos tokens de cache por turno fica visível nas interfaces normais de uso: `cacheRead` e `cacheWrite` aparecem em `/usage tokens`, `/status`, nos resumos de uso da sessão e em layouts personalizados de `messages.usageTemplate`.
- Para a Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para a OpenAI, espere `cacheRead` em acertos de cache; `cacheWrite` é preenchido somente em cargas úteis da Responses API que o incluam (consulte [OpenAI](#openai-direct-api) acima).
- A OpenAI também retorna cabeçalhos de rastreamento e de limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`; use-os para rastrear solicitações, mas a contabilização de acertos de cache ainda deve vir da carga útil de uso, não dos cabeçalhos.

## Solução rápida de problemas

- **`cacheWrite` alto na maioria dos turnos**: verifique se há entradas voláteis no prompt do sistema; confirme se o modelo/provedor é compatível com suas configurações de cache.
- **`cacheWrite` alto na Anthropic**: geralmente significa que o ponto de interrupção do cache está incidindo sobre conteúdo que muda a cada solicitação.
- **`cacheRead` baixo na OpenAI**: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se a mesma `prompt_cache_key` é reutilizada nos turnos que devem compartilhar um cache.
- **Nenhum efeito de `cacheRetention`**: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- **Solicitações do Bedrock Nova com configurações de cache**: comportamento esperado — elas resultam em nenhuma retenção de cache durante a execução.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Redução de sessões](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionados

- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Uso e custos da API](/pt-BR/reference/api-usage-costs)

---
read_when:
    - Você quer reduzir os custos de tokens de prompt com retenção de cache
    - Você precisa de um comportamento de cache por agente em configurações multiagente
    - Você está ajustando em conjunto o Heartbeat e a remoção por TTL do cache
summary: Opções de cache de prompts, ordem de mesclagem, comportamento do provedor e padrões de ajuste
title: Cache de prompts
x-i18n:
    generated_at: "2026-07-16T12:58:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

O cache de prompts permite que um provedor de modelos reutilize um prefixo de prompt inalterado (instruções de sistema/desenvolvedor, definições de ferramentas e outros contextos estáveis) entre turnos, em vez de reprocessá-lo a cada solicitação. Isso reduz o custo de tokens e a latência em sessões de longa duração com contexto repetido.

O OpenClaw normaliza o uso do provedor em `cacheRead` e `cacheWrite` sempre que a API upstream expõe esses contadores. Os resumos de uso (`/status` e similares) recorrem à última entrada de uso da transcrição quando o snapshot da sessão ativa não contém contadores de cache; um valor ativo diferente de zero sempre prevalece sobre o fallback.

Referências dos provedores:

- [Cache de prompts da Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Cache de prompts da OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Controles principais

### `cacheRetention`

Valores: `"none" | "short" | "long"`. Configurável como padrão global, por modelo e por agente.
`"standard"` não é um alias; use `"short"` para a janela de cache padrão do provedor. Valores inválidos são ignorados com um aviso.

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

Ordem de mesclagem (o posterior prevalece):

1. `agents.defaults.params` - padrão global para todos os modelos
2. `agents.defaults.models["provider/model"].params` - substituição por modelo
3. `agents.list[].params` - substituição por agente, correspondida pelo ID do agente

Fonte: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Remove o contexto antigo de resultados de ferramentas após o término da janela de TTL do cache, para que uma solicitação após um período de inatividade não armazene novamente em cache um histórico excessivamente grande.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Poda de sessões](/pt-BR/concepts/session-pruning) para ver o comportamento completo.

### Manutenção do cache aquecido com Heartbeat

O Heartbeat pode manter as janelas de cache aquecidas e reduzir gravações repetidas no cache após intervalos de inatividade. Configurável globalmente (`agents.defaults.heartbeat`) ou por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamento dos provedores

### Anthropic (API direta e Vertex AI)

- `cacheRetention` é compatível com os provedores `anthropic` e `anthropic-vertex`, e com modelos Claude no `amazon-bedrock` e em endpoints personalizados compatíveis com `anthropic-messages` quando `cacheRetention` é definido explicitamente.
- Quando não definido, o OpenClaw inicializa `cacheRetention: "short"` para a Anthropic direta (somente provedores `anthropic` e `anthropic-vertex`; outras rotas da família Anthropic exigem um valor explícito).
- As respostas nativas do Anthropic Messages expõem `cache_read_input_tokens` e `cache_creation_input_tokens`, mapeados para `cacheRead` e `cacheWrite`.
- `cacheRetention: "short"` corresponde ao cache efêmero padrão de 5 minutos. `cacheRetention: "long"` solicita o TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) quando definido explicitamente. Uma retenção longa implícita ou controlada por variável de ambiente (`OPENCLAW_CACHE_RETENTION=long` sem `cacheRetention` explícito) só é atualizada para o TTL de 1 hora no `api.anthropic.com` ou em hosts do Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); outros hosts mantêm o cache de 5 minutos.

Fonte: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API direta)

- O cache de prompts é automático nos modelos recentes compatíveis; o OpenClaw não injeta marcadores de cache no nível de bloco.
- O OpenClaw envia `prompt_cache_key` para manter o roteamento do cache estável entre turnos. Hosts `api.openai.com` diretos recebem isso automaticamente. Proxies compatíveis com OpenAI (oMLX, llama.cpp e endpoints personalizados) precisam de `compat.supportsPromptCacheKey: true` na configuração do modelo para aderir — isso nunca é detectado automaticamente em um proxy.
- `prompt_cache_retention: "24h"` é adicionado somente quando `cacheRetention: "long"` está selecionado e o endpoint resolvido oferece suporte tanto à chave de cache quanto à retenção longa (`compat.supportsLongCacheRetention`, verdadeiro por padrão; os perfis de compatibilidade do Together AI e Cloudflare a desativam). `cacheRetention: "none"` suprime ambos os campos.
- Os acertos de cache são expostos por `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (Responses API), mapeados para `cacheRead`.
- Os payloads da Responses API também podem expor `input_tokens_details.cache_write_tokens`, mapeado para `cacheWrite` e precificado pela taxa de gravação em cache do modelo; payloads da Responses que omitem o campo mantêm `cacheWrite` em `0`. A API Chat Completions da OpenAI não documenta nem emite um contador `cache_write_tokens`, mas o OpenClaw ainda lê `prompt_tokens_details.cache_write_tokens` nela para proxies compatíveis com OpenRouter e no estilo DeepSeek que informam uma contagem de gravações separada.
- Na prática, a OpenAI se comporta mais como um cache de prefixo inicial do que como a reutilização móvel do histórico completo da Anthropic — consulte [Expectativas para uso ativo da OpenAI](#openai-live-expectations) abaixo.

### Amazon Bedrock

- As referências de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, além dos prefixos de perfis de inferência de sistema da AWS `us.`/`eu.`/`global.anthropic.claude*`) oferecem suporte ao repasse explícito de `cacheRetention`.
- Modelos Bedrock que não são da Anthropic (por exemplo, `amazon.nova-*`) são resolvidos sem retenção de cache em tempo de execução, independentemente de qualquer valor `cacheRetention` configurado.
- ARNs opacos de perfis de inferência de aplicações Bedrock (IDs de perfil que não contêm `claude`) também são resolvidos sem retenção de cache, a menos que `cacheRetention` seja definido explicitamente, pois a família do modelo não pode ser inferida apenas pelo ARN.

### OpenRouter

Para referências de modelos `openrouter/anthropic/*`, o OpenClaw injeta marcadores `cache_control` da Anthropic nos blocos de prompts de sistema/desenvolvedor, mas somente quando a solicitação ainda se destina a uma rota verificada do OpenRouter (`openrouter` em seu endpoint padrão ou qualquer provedor/URL base resolvido como `openrouter.ai`). Redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI interrompe essa injeção.

`contextPruning.mode: "cache-ttl"` é permitido para referências de modelos `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` e `openrouter/zai/*`, porque essas rotas gerenciam o cache de prompts no lado do provedor sem precisar dos marcadores injetados pelo OpenClaw.

Fonte: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

A construção do cache do DeepSeek no OpenRouter é feita com melhor esforço e pode levar alguns segundos; uma solicitação de acompanhamento imediata ainda pode mostrar `cached_tokens: 0`. Verifique com uma solicitação repetida de mesmo prefixo após um breve intervalo, usando `usage.prompt_tokens_details.cached_tokens` como sinal de acerto no cache.

### Google Gemini (API direta)

- O transporte direto do Gemini (`api: "google-generative-ai"`) informa acertos no cache por meio de `cachedContentTokenCount` do upstream, mapeado para `cacheRead`.
- Famílias de modelos qualificadas: `gemini-2.5*` e `gemini-3*` (exclui variantes Live/prévia fora dessa correspondência de prefixo, por exemplo, `gemini-live-2.5-flash-preview`).
- Quando `cacheRetention` é definido em um modelo qualificado, o OpenClaw cria, reutiliza e atualiza automaticamente um recurso `cachedContents` para o prompt do sistema — não é necessário um identificador manual de conteúdo em cache. O TTL é `300s` para `cacheRetention: "short"` e `3600s` para `"long"`.
- Ainda é possível repassar um identificador de conteúdo em cache preexistente do Gemini como `params.cachedContent` (ou o legado `params.cached_content`); um identificador explícito ignora completamente o caminho de gerenciamento automático do cache.
- Isso é separado do cache de prefixo de prompts da Anthropic/OpenAI: o OpenClaw gerencia um recurso `cachedContents` nativo do provedor para o Gemini, em vez de injetar marcadores de cache inline.

Fonte: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Provedores de harness da CLI (Claude Code, Gemini CLI)

Backends de CLI que emitem eventos de uso em JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passam por um analisador de uso compartilhado que reconhece diversas variantes de nomes de campos, incluindo um contador simples `cached` mapeado para `cacheRead`. Quando o payload JSON da CLI omite um campo direto de tokens de entrada, o OpenClaw o deriva como `input_tokens - cached`. Isso é apenas normalização de uso — não cria marcadores de cache de prompts no estilo Anthropic/OpenAI para esses modelos controlados por CLI.

Fonte: `src/agents/cli-output.ts` (`toCliUsage`).

### Outros provedores

Se um provedor não oferece suporte a nenhum dos modos de cache acima, `cacheRetention` não tem efeito.

## Limite do cache do prompt do sistema

O OpenClaw divide o prompt do sistema em um **prefixo estável** e um **sufixo volátil** em um limite interno de prefixo de cache. O conteúdo acima do limite (definições de ferramentas, metadados de Skills e arquivos do espaço de trabalho) é ordenado para permanecer idêntico byte a byte entre turnos. O conteúdo abaixo do limite (por exemplo, `HEARTBEAT.md`, carimbos de data e hora de execução e outros metadados por turno) pode mudar sem invalidar o prefixo armazenado em cache.

Principais decisões de projeto:

- Os arquivos estáveis de contexto do projeto no espaço de trabalho são ordenados antes de `HEARTBEAT.md`, para que as alterações frequentes do Heartbeat não invalidem o prefixo estável.
- O limite se aplica à formatação dos transportes das famílias Anthropic e OpenAI, do Google e da CLI, para que todos os provedores compatíveis se beneficiem da mesma estabilidade do prefixo.
- As solicitações Codex Responses e Anthropic Vertex são roteadas por uma formatação de cache que considera o limite, para que a reutilização do cache permaneça alinhada ao que os provedores realmente recebem.
- As impressões digitais dos prompts do sistema são normalizadas (espaços em branco, finais de linha, contexto adicionado por hooks e ordenação dos recursos de execução), para que prompts semanticamente inalterados compartilhem o cache entre turnos.

Se houver picos inesperados de `cacheWrite` após uma alteração de configuração ou do espaço de trabalho, verifique se a alteração fica acima ou abaixo do limite do cache. Mover o conteúdo volátil para baixo do limite (ou estabilizá-lo) geralmente resolve o problema.

## Proteções de estabilidade do cache do OpenClaw

- Os catálogos de ferramentas MCP incluídos são classificados de forma determinística (primeiro pelo nome do servidor e depois pelo nome da ferramenta) antes do registro das ferramentas, para que mudanças na ordem de `listTools()` não alterem repetidamente o bloco de ferramentas nem invalidem os prefixos do cache de prompts.
- Sessões legadas com blocos de imagem persistidos mantêm intactos os **3 turnos concluídos mais recentes** (contando todos os turnos concluídos, não apenas aqueles com imagens). Blocos de imagem mais antigos e já processados são substituídos por um marcador de texto, para que acompanhamentos com muitas imagens não continuem reenviando grandes payloads obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma linha de base de longa duração no agente principal e desative o cache em agentes de notificação com tráfego em rajadas:

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

### Linha de base priorizando custos

- Defina a linha de base `cacheRetention: "short"`.
- Ative `contextPruning.mode: "cache-ttl"`.
- Mantenha o Heartbeat abaixo do TTL somente para agentes que se beneficiam de caches aquecidos.

## Testes ativos de regressão

O OpenClaw executa uma única verificação ativa e combinada de regressão de cache que abrange prefixos repetidos, turnos de ferramentas, turnos com imagens, transcrições de ferramentas no estilo MCP e um controle sem cache da Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute-a com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de baseline armazena os números observados mais recentemente em produção, além dos limites mínimos de regressão específicos de cada provedor com os quais o teste faz a comparação. Cada execução usa IDs de sessão e namespaces de prompt novos e exclusivos, para que o estado anterior do cache não contamine a amostra atual. Anthropic e OpenAI usam formas de aplicação diferentes: não atingir um limite mínimo da Anthropic é uma regressão crítica (o teste falha), enquanto não atingir um limite mínimo da OpenAI serve apenas para monitoramento (é registrado como aviso e não causa falha na execução). Eles não compartilham um único limite entre provedores.

### Expectativas em produção para a Anthropic

- Espere gravações explícitas de aquecimento por meio de `cacheWrite`.
- Espere a reutilização de quase todo o histórico em turnos repetidos, pois o controle de cache da Anthropic avança o ponto de interrupção do cache ao longo da conversa.
- Os limites mínimos do baseline para os fluxos estável, de ferramenta, de imagem e no estilo MCP são bloqueios rígidos contra regressões.

### Expectativas em produção para a OpenAI

- Espere apenas `cacheRead`; `cacheWrite` permanece `0` no Chat Completions.
- Trate a reutilização do cache em turnos repetidos como um platô específico do provedor, e não como a reutilização móvel de todo o histórico ao estilo da Anthropic.
- Os limites mínimos servem apenas para monitoramento (não atingi-los é registrado como aviso, não como falha de teste) e são derivados do comportamento observado em produção em `gpt-5.4-mini`:

| Cenário              | Limite mínimo de `cacheRead` | Limite mínimo da taxa de acerto |
| -------------------- | ----------------: | -------------: |
| Prefixo estável      |             4,608 |           0.90 |
| Transcrição de ferramenta |             4,096 |           0.85 |
| Transcrição de imagem |             3,840 |           0.82 |
| Transcrição no estilo MCP |             4,096 |           0.85 |

Os números do baseline observados mais recentemente (de `live-cache-regression-baseline.ts`) chegaram a: prefixo estável `cacheRead=4864`, taxa de acerto `0.966`; transcrição de ferramenta `cacheRead=4608`, taxa de acerto `0.896`; transcrição de imagem `cacheRead=4864`, taxa de acerto `0.954`; transcrição no estilo MCP `cacheRead=4608`, taxa de acerto `0.891`.

Por que as asserções diferem: a Anthropic expõe pontos de interrupção explícitos do cache e a reutilização móvel do histórico da conversa, enquanto o prefixo efetivamente reutilizável da OpenAI no tráfego em produção pode atingir um platô antes do prompt completo. Comparar os dois provedores com um único limite percentual entre provedores produz regressões falsas.

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

### Alternâncias de ambiente (depuração pontual)

| Variável                             | Efeito                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Ativa o rastreamento do cache                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Substitui o caminho de saída                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Alterna a captura da carga completa das mensagens |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Alterna a captura do texto do prompt          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Alterna a captura do prompt do sistema        |

### O que inspecionar

- Os eventos de rastreamento do cache estão em JSONL, com instantâneos em etapas como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto dos tokens de cache por turno pode ser visto nas superfícies normais de uso: `cacheRead` e `cacheWrite` aparecem em `/usage tokens`, `/status`, resumos de uso da sessão e layouts personalizados de `messages.usageTemplate`.
- Para a Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para a OpenAI, espere `cacheRead` em acertos de cache; `cacheWrite` é preenchido apenas em cargas da Responses API que o incluam (consulte [OpenAI](#openai-direct-api) acima).
- A OpenAI também retorna cabeçalhos de rastreamento e de limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`; use-os para rastrear solicitações, mas a contabilização de acertos do cache ainda deve vir da carga de uso, e não dos cabeçalhos.

## Solução rápida de problemas

- **`cacheWrite` alto na maioria dos turnos**: verifique se há entradas voláteis no prompt do sistema; confirme se o modelo/provedor oferece suporte às suas configurações de cache.
- **`cacheWrite` alto na Anthropic**: geralmente significa que o ponto de interrupção do cache está incidindo sobre conteúdo que muda a cada solicitação.
- **`cacheRead` baixo na OpenAI**: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se o mesmo `prompt_cache_key` é reutilizado nos turnos que devem compartilhar um cache.
- **Nenhum efeito de `cacheRetention`**: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- **Solicitações do Bedrock Nova com configurações de cache**: esperado — elas resultam em nenhuma retenção de cache durante a execução.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Remoção de conteúdo da sessão](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Uso da API e custos](/pt-BR/reference/api-usage-costs)

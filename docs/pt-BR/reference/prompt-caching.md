---
read_when:
    - Você quer reduzir os custos de tokens de prompt com a retenção de cache
    - Você precisa de um comportamento de cache por agente em configurações multiagente
    - Você está ajustando em conjunto o Heartbeat e a remoção por TTL do cache
summary: Opções de cache de prompts, ordem de mesclagem, comportamento do provedor e padrões de ajuste
title: Cache de prompts
x-i18n:
    generated_at: "2026-07-12T15:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

O cache de prompts permite que um provedor de modelos reutilize um prefixo de prompt inalterado (instruções de sistema/desenvolvedor, definições de ferramentas e outros contextos estáveis) entre turnos, em vez de reprocessá-lo a cada solicitação. Isso reduz o custo de tokens e a latência em sessões de longa duração com contexto repetido.

O OpenClaw normaliza o uso dos provedores em `cacheRead` e `cacheWrite` sempre que a API upstream expõe esses contadores. Os resumos de uso (`/status` e similares) recorrem à última entrada de uso da transcrição quando o snapshot da sessão ativa não contém contadores de cache; um valor ativo diferente de zero sempre prevalece sobre o valor alternativo.

Referências dos provedores:

- [Cache de prompts da Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Cache de prompts da OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Controles principais

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
3. `agents.list[].params` - substituição por agente, correspondente pelo ID do agente

Fonte: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Remove do contexto resultados antigos de ferramentas após o término da janela de TTL do cache, para que uma solicitação após um período de inatividade não armazene novamente em cache um histórico grande demais.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Redução de sessões](/pt-BR/concepts/session-pruning) para conhecer o comportamento completo.

### Manutenção do cache ativo com Heartbeat

O Heartbeat pode manter as janelas de cache ativas e reduzir gravações repetidas no cache após intervalos de inatividade. Configurável globalmente (`agents.defaults.heartbeat`) ou por agente (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Comportamento dos provedores

### Anthropic (API direta e Vertex AI)

- `cacheRetention` é compatível com os provedores `anthropic` e `anthropic-vertex`, e com modelos Claude no `amazon-bedrock` e em endpoints personalizados compatíveis com `anthropic-messages` quando `cacheRetention` é definido explicitamente.
- Quando não definido, o OpenClaw inicializa `cacheRetention: "short"` para a Anthropic direta (somente os provedores `anthropic` e `anthropic-vertex`; outras rotas da família Anthropic exigem um valor explícito).
- As respostas nativas da Anthropic Messages expõem `cache_read_input_tokens` e `cache_creation_input_tokens`, mapeados para `cacheRead` e `cacheWrite`.
- `cacheRetention: "short"` corresponde ao cache efêmero padrão de 5 minutos. `cacheRetention: "long"` solicita o TTL de 1 hora (`cache_control: { type: "ephemeral", ttl: "1h" }`) quando definido explicitamente. Uma retenção longa implícita/orientada por variável de ambiente (`OPENCLAW_CACHE_RETENTION=long` sem `cacheRetention` explícito) só é elevada para o TTL de 1 hora nos hosts `api.anthropic.com` ou Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); outros hosts mantêm o cache de 5 minutos.

Fonte: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API direta)

- O cache de prompts é automático em modelos recentes compatíveis; o OpenClaw não injeta marcadores de cache no nível de blocos.
- O OpenClaw envia `prompt_cache_key` para manter o roteamento do cache estável entre turnos. Hosts diretos de `api.openai.com` recebem isso automaticamente. Proxies compatíveis com OpenAI (oMLX, llama.cpp, endpoints personalizados) precisam de `compat.supportsPromptCacheKey: true` na configuração do modelo para habilitar essa opção — isso nunca é detectado automaticamente para um proxy.
- `prompt_cache_retention: "24h"` só é adicionado quando `cacheRetention: "long"` está selecionado e o endpoint resolvido oferece suporte tanto à chave de cache quanto à retenção longa (`compat.supportsLongCacheRetention`, verdadeiro por padrão; os perfis de compatibilidade do Together AI e do Cloudflare a desabilitam). `cacheRetention: "none"` suprime ambos os campos.
- Os acertos de cache são apresentados por meio de `usage.prompt_tokens_details.cached_tokens` (Chat Completions) ou `input_tokens_details.cached_tokens` (Responses API), mapeados para `cacheRead`.
- Os payloads da Responses API também podem expor `input_tokens_details.cache_write_tokens`, mapeado para `cacheWrite` e cobrado conforme a taxa de gravação em cache do modelo; payloads da Responses que omitem o campo mantêm `cacheWrite` em `0`. A API Chat Completions da OpenAI não documenta nem emite um contador `cache_write_tokens`, mas o OpenClaw ainda lê `prompt_tokens_details.cache_write_tokens` nesse caso para proxies compatíveis com OpenRouter e no estilo DeepSeek que relatam uma contagem de gravações separada.
- Na prática, a OpenAI se comporta mais como um cache do prefixo inicial do que como a reutilização móvel de todo o histórico da Anthropic — consulte [Expectativas da OpenAI em ambiente real](#openai-live-expectations) abaixo.

### Amazon Bedrock

- As referências de modelos Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, além dos prefixos de perfis de inferência de sistema da AWS `us.`/`eu.`/`global.anthropic.claude*`) oferecem suporte ao repasse explícito de `cacheRetention`.
- Modelos Bedrock que não são da Anthropic (por exemplo, `amazon.nova-*`) são resolvidos sem retenção de cache em tempo de execução, independentemente de qualquer valor configurado de `cacheRetention`.
- ARNs opacos de perfis de inferência de aplicações do Bedrock (IDs de perfil que não contêm `claude`) também são resolvidos sem retenção de cache, a menos que `cacheRetention` seja definido explicitamente, pois a família do modelo não pode ser inferida apenas pelo ARN.

### OpenRouter

Para referências de modelos `openrouter/anthropic/*`, o OpenClaw injeta marcadores `cache_control` da Anthropic nos blocos de prompt de sistema/desenvolvedor, mas somente quando a solicitação ainda tem como destino uma rota verificada do OpenRouter (`openrouter` em seu endpoint padrão ou qualquer provedor/URL base resolvido como `openrouter.ai`). Redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI interrompe essa injeção.

`contextPruning.mode: "cache-ttl"` é permitido para referências de modelos `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` e `openrouter/zai/*`, pois essas rotas processam o cache de prompts no lado do provedor sem precisar dos marcadores injetados pelo OpenClaw.

Fonte: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

A construção do cache do DeepSeek no OpenRouter é feita em caráter de melhor esforço e pode levar alguns segundos; uma solicitação subsequente imediata ainda pode mostrar `cached_tokens: 0`. Verifique com uma solicitação repetida com o mesmo prefixo após um breve intervalo, usando `usage.prompt_tokens_details.cached_tokens` como sinal de acerto do cache.

### Google Gemini (API direta)

- O transporte direto do Gemini (`api: "google-generative-ai"`) relata acertos de cache por meio do `cachedContentTokenCount` upstream, mapeado para `cacheRead`.
- Famílias de modelos elegíveis: `gemini-2.5*` e `gemini-3*` (exclui variantes Live/de prévia que não correspondam a esses prefixos, por exemplo, `gemini-live-2.5-flash-preview`).
- Quando `cacheRetention` é definido em um modelo elegível, o OpenClaw cria, reutiliza e atualiza automaticamente um recurso `cachedContents` para o prompt do sistema — nenhum identificador manual de conteúdo em cache é necessário. O TTL é `300s` para `cacheRetention: "short"` e `3600s` para `"long"`.
- Você ainda pode passar um identificador de conteúdo em cache preexistente do Gemini por meio de `params.cachedContent` (ou o legado `params.cached_content`); um identificador explícito ignora completamente o caminho de gerenciamento automático do cache.
- Isso é separado do cache de prefixos de prompts da Anthropic/OpenAI: o OpenClaw gerencia um recurso `cachedContents` nativo do provedor para o Gemini em vez de injetar marcadores de cache em linha.

Fonte: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Provedores de harness da CLI (Claude Code, Gemini CLI)

Backends de CLI que emitem eventos de uso JSONL (`jsonlDialect: "claude-stream-json"` ou `"gemini-stream-json"`) passam por um analisador de uso compartilhado que reconhece diversas variantes de nomes de campos, incluindo um contador simples `cached` mapeado para `cacheRead`. Quando o payload JSON da CLI omite um campo direto de tokens de entrada, o OpenClaw o deriva como `input_tokens - cached`. Isso é apenas normalização de uso — não cria marcadores de cache de prompts no estilo Anthropic/OpenAI para esses modelos orientados por CLI.

Fonte: `src/agents/cli-output.ts` (`toCliUsage`).

### Outros provedores

Se um provedor não oferecer suporte a nenhum dos modos de cache acima, `cacheRetention` não terá efeito.

## Limite do cache do prompt do sistema

O OpenClaw divide o prompt do sistema em um **prefixo estável** e um **sufixo volátil** em um limite interno do prefixo do cache. O conteúdo acima do limite (definições de ferramentas, metadados de Skills, arquivos do espaço de trabalho) é ordenado para permanecer idêntico byte a byte entre turnos. O conteúdo abaixo do limite (por exemplo, `HEARTBEAT.md`, carimbos de data e hora do tempo de execução e outros metadados por turno) pode mudar sem invalidar o prefixo armazenado em cache.

Principais decisões de design:

- Os arquivos estáveis de contexto do projeto no espaço de trabalho são ordenados antes de `HEARTBEAT.md`, para que as alterações do Heartbeat não invalidem o prefixo estável.
- O limite se aplica à formatação dos transportes das famílias Anthropic e OpenAI, do Google e da CLI, para que todos os provedores compatíveis se beneficiem da mesma estabilidade do prefixo.
- As solicitações do Codex Responses e da Anthropic Vertex são encaminhadas por uma formatação de cache ciente do limite, para que a reutilização do cache permaneça alinhada ao que os provedores realmente recebem.
- As impressões digitais do prompt do sistema são normalizadas (espaços em branco, terminações de linha, contexto adicionado por hooks e ordenação de recursos do tempo de execução), para que prompts semanticamente inalterados compartilhem o cache entre turnos.

Se você observar picos inesperados de `cacheWrite` após uma alteração na configuração ou no espaço de trabalho, verifique se a alteração fica acima ou abaixo do limite do cache. Mover conteúdo volátil para abaixo do limite (ou estabilizá-lo) geralmente resolve o problema.

## Proteções de estabilidade do cache do OpenClaw

- Os catálogos de ferramentas MCP incluídos são ordenados de forma determinística (por nome de servidor e depois por nome de ferramenta) antes do registro das ferramentas, para que alterações na ordem de `listTools()` não modifiquem continuamente o bloco de ferramentas nem invalidem os prefixos do cache de prompts.
- Sessões legadas com blocos de imagem persistidos mantêm intactos os **3 turnos concluídos mais recentes** (contando todos os turnos concluídos, não apenas aqueles que contêm imagens). Blocos de imagem mais antigos que já foram processados são substituídos por um marcador de texto, para que continuações com muitas imagens não continuem reenviando payloads antigos e grandes.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma linha de base de longa duração no agente principal e desabilite o cache em agentes de notificação com tráfego em rajadas:

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

### Linha de base com prioridade para custos

- Defina a linha de base como `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha o Heartbeat abaixo do TTL apenas para agentes que se beneficiem de caches ativos.

## Testes de regressão em ambiente real

O OpenClaw executa uma única verificação combinada de regressão de cache em ambiente real, abrangendo prefixos repetidos, turnos de ferramentas, turnos de imagens, transcrições de ferramentas no estilo MCP e um controle da Anthropic sem cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de linha de base armazena os números mais recentes observados em ambiente real, além dos limites mínimos de regressão específicos de cada provedor que o teste verifica. Cada execução usa IDs de sessão e namespaces de prompt novos e exclusivos da execução, para que o estado anterior do cache não contamine a amostra atual. Anthropic e OpenAI usam critérios diferentes: um valor da Anthropic abaixo do limite mínimo representa uma regressão grave (o teste falha), enquanto um valor da OpenAI abaixo do limite mínimo serve apenas para monitoramento (é registrado como aviso e não causa falha na execução). Elas não compartilham um único limite entre provedores.

### Expectativas da Anthropic em ambiente real

- Espere gravações explícitas de aquecimento via `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, pois o controle de cache da Anthropic avança o ponto de interrupção do cache ao longo da conversa.
- Os limites mínimos de referência para fluxos estáveis, de ferramentas, de imagens e no estilo MCP são barreiras rígidas contra regressões.

### Expectativas para uso ao vivo da OpenAI

- Espere apenas `cacheRead`; `cacheWrite` permanece `0` no Chat Completions.
- Trate a reutilização de cache em turnos repetidos como um patamar específico do provedor, não como a reutilização móvel de todo o histórico no estilo da Anthropic.
- Os limites mínimos servem apenas para monitoramento (uma ocorrência abaixo do limite é registrada como aviso, não como falha de teste) e são derivados do comportamento observado ao vivo no `gpt-5.4-mini`:

| Cenário                  | Limite mínimo de `cacheRead` | Limite mínimo da taxa de acerto |
| ------------------------ | ---------------------------: | ------------------------------: |
| Prefixo estável          |                        4,608 |                            0.90 |
| Transcrição de ferramenta |                        4,096 |                            0.85 |
| Transcrição de imagem    |                        3,840 |                            0.82 |
| Transcrição no estilo MCP |                        4,096 |                            0.85 |

Os números de referência observados mais recentemente (de `live-cache-regression-baseline.ts`) ficaram em: prefixo estável `cacheRead=4864`, taxa de acerto `0.966`; transcrição de ferramenta `cacheRead=4608`, taxa de acerto `0.896`; transcrição de imagem `cacheRead=4864`, taxa de acerto `0.954`; transcrição no estilo MCP `cacheRead=4608`, taxa de acerto `0.891`.

Por que as asserções são diferentes: a Anthropic expõe pontos de interrupção explícitos do cache e reutilização móvel do histórico da conversa, enquanto o prefixo efetivamente reutilizável da OpenAI no tráfego ao vivo pode atingir um patamar antes de abranger todo o prompt. Comparar os dois provedores com um único limite percentual entre provedores produz regressões falsas.

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

Valores padrão:

| Chave             | Padrão                                       |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Alternadores de ambiente (depuração pontual)

| Variável                             | Efeito                                            |
| ------------------------------------ | ------------------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Ativa o rastreamento de cache                     |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Substitui o caminho de saída                      |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Alterna a captura da carga completa das mensagens |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Alterna a captura do texto do prompt              |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Alterna a captura do prompt de sistema            |

### O que inspecionar

- Os eventos de rastreamento de cache são JSONL com instantâneos em estágios, como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto dos tokens de cache por turno fica visível nas superfícies normais de uso: `cacheRead` e `cacheWrite` aparecem em `/usage tokens`, `/status`, nos resumos de uso da sessão e em layouts personalizados de `messages.usageTemplate`.
- Para a Anthropic, espere tanto `cacheRead` quanto `cacheWrite` quando o cache estiver ativo.
- Para a OpenAI, espere `cacheRead` em acertos de cache; `cacheWrite` só é preenchido em cargas da Responses API que o incluam (consulte [OpenAI](#openai-direct-api) acima).
- A OpenAI também retorna cabeçalhos de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`; use-os para rastrear solicitações, mas a contabilização de acertos de cache ainda deve vir da carga de uso, não dos cabeçalhos.

## Solução rápida de problemas

- **`cacheWrite` alto na maioria dos turnos**: verifique se há entradas voláteis no prompt de sistema; confirme se o modelo/provedor é compatível com suas configurações de cache.
- **`cacheWrite` alto na Anthropic**: geralmente significa que o ponto de interrupção do cache está incidindo sobre conteúdo que muda a cada solicitação.
- **`cacheRead` baixo na OpenAI**: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se a mesma `prompt_cache_key` é reutilizada nos turnos que devem compartilhar um cache.
- **Nenhum efeito de `cacheRetention`**: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- **Solicitações do Bedrock Nova com configurações de cache**: esperado — elas são resolvidas sem retenção de cache em tempo de execução.

Documentação relacionada:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Poda de sessões](/pt-BR/concepts/session-pruning)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference)

## Relacionado

- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Uso e custos da API](/pt-BR/reference/api-usage-costs)

---
read_when:
    - Explicando o uso de tokens, custos ou janelas de contexto
    - Depuração do crescimento do contexto ou do comportamento de Compaction
summary: Como o OpenClaw cria o contexto do prompt e informa o uso de tokens + custos
title: Uso e custos de tokens
x-i18n:
    generated_at: "2026-05-06T09:13:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos do modelo, mas a maioria dos modelos no estilo OpenAI tem média de ~4 caracteres por token para texto em inglês.

## Como o prompt do sistema é construído

OpenClaw monta seu próprio prompt do sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (somente metadados; as instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, além de `MEMORY.md` quando presente). A raiz em minúsculas `memory.md` não é injetada; ela é entrada de reparo legado para `openclaw doctor --fix` quando pareada com `MEMORY.md`. Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt de bootstrap normal; eles permanecem sob demanda via ferramentas de memória em turnos comuns, mas execuções do modelo em reset/inicialização podem prefixar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Comandos de chat simples `/new` e `/reset` são reconhecidos sem invocar o modelo. O prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/SO/modelo/thinking)

Veja a análise completa em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + assistente)
- Chamadas de ferramentas e resultados de ferramentas
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de poda
- Wrappers de provedor ou cabeçalhos de segurança (não visíveis, mas ainda contados)

Algumas superfícies pesadas em runtime têm seus próprios limites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Substituições por agente ficam em `agents.list[].contextLimits`. Esses controles são
para trechos de runtime limitados e blocos injetados pertencentes ao runtime. Eles são
separados dos limites de bootstrap, limites de contexto de inicialização e limites de
prompt de Skills.

Para imagens, o OpenClaw reduz a escala de payloads de imagens de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para capturas de tela com muito OCR/UI.

Para uma análise prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → acrescenta um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta custo** (somente tokens).
- `/usage cost` → mostra um resumo de custo local dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` têm suporte.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas de cota de provedor normalizadas (`X% left`, não custos por resposta).
  Provedores atuais com janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos do provedor antes da exibição.
Para tráfego Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, então nomes de
campos específicos do transporte não alteram `/status`, `/usage` nem resumos de sessão.
O uso JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` mapeia para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego Responses nativo da família OpenAI, aliases de uso WebSocket/SSE são
normalizados da mesma forma, e os totais recorrem à entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é esparso, `/status` e `session_status` também podem
recuperar contadores de token/cache e o rótulo do modelo de runtime ativo do
log de uso de transcrição mais recente. Valores live existentes diferentes de zero ainda têm
precedência sobre valores de fallback da transcrição, e totais de transcrição maiores orientados a prompt
podem vencer quando os totais armazenados estão ausentes ou são menores.
A autenticação de uso para janelas de cota de provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API correspondentes
de perfis de autenticação, env ou configuração.
Entradas de transcrição do assistente persistem o mesmo formato de uso normalizado, incluindo
`usage.cost` quando o modelo ativo tem preços configurados e o provedor
retorna metadados de uso. Isso dá a `/usage cost` e ao status de sessão baseado em transcrição
uma fonte estável mesmo depois que o estado live do runtime desaparece.

OpenClaw mantém a contabilidade de uso do provedor separada do snapshot de contexto atual.
`usage.total` do provedor pode incluir entrada em cache, saída e várias
chamadas de modelo em loop de ferramentas, então ele é útil para custo e telemetria, mas pode superestimar
a janela de contexto live. Exibições de contexto e diagnósticos usam o snapshot de prompt mais recente
(`promptTokens`, ou a última chamada de modelo quando nenhum snapshot de prompt está
disponível) para `context.used`.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços de modelo:

```
models.providers.<provider>.models[].cost
```

Eles são **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se não houver preços, o OpenClaw mostra somente tokens. Tokens OAuth
nunca mostram custo em dólares.

Depois que sidecars e canais alcançam o caminho pronto do Gateway, o OpenClaw inicia um
bootstrap opcional de preços em segundo plano para refs de modelo configuradas que ainda não
têm preços locais. Esse bootstrap busca catálogos remotos de preços do OpenRouter e LiteLLM.
Defina `models.pricing.enabled: false` para ignorar essas buscas de catálogo
em redes offline ou restritas; entradas explícitas
`models.providers.*.models[].cost` continuam a conduzir estimativas de custo
locais.

## TTL de cache e impacto da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenClaw pode
executar opcionalmente **poda por cache-ttl**: ele poda a sessão depois que o TTL do cache
expira e então redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-armazenado em cache em vez de armazenar em cache novamente o histórico completo. Isso mantém os custos de
gravação em cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os
detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

Heartbeat pode manter o cache **quente** durante intervalos ociosos. Se o TTL de cache do seu modelo
for `1h`, definir o intervalo de Heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar
rearmazenar em cache o prompt completo, reduzindo custos de gravação em cache.

Em configurações multiagente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo controle por controle, veja [Cache de prompt](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas que tokens de entrada,
enquanto gravações de cache são cobradas com um multiplicador mais alto. Veja os preços de cache de prompt
da Anthropic para as taxas e multiplicadores de TTL mais recentes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter cache de 1h quente com Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemplo: tráfego misto com estratégia de cache por agente

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` é mesclado sobre os `params` do modelo selecionado, então você pode
substituir somente `cacheRetention` e herdar outros padrões do modelo sem alterações.

### Exemplo: habilitar o cabeçalho beta de contexto 1M da Anthropic

A janela de contexto 1M da Anthropic está atualmente controlada por beta. O OpenClaw pode injetar o
valor `anthropic-beta` obrigatório quando você habilita `context1m` em modelos Opus
ou Sonnet com suporte.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso mapeia para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` está definido nessa entrada de modelo.

Requisito: a credencial deve estar qualificada para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa no lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas em seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de overhead da lista de Skills.

## Relacionados

- [Uso e custos de API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

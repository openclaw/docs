---
read_when:
    - Explicando o uso de tokens, custos ou janelas de contexto
    - Depurando o crescimento do contexto ou o comportamento de Compaction
summary: Como o OpenClaw cria o contexto de solicitação e informa o uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-05-02T21:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 648c1624aa81e896dacdbdc10784ca10fba2e43114823903da6455e7de512ace
    source_path: reference/token-use.md
    workflow: 16
---

# Uso de tokens e custos

OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos de cada modelo, mas a maioria dos modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt do sistema é construído

OpenClaw monta seu próprio prompt do sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (apenas metadados; as instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Arquivos de workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, mais `MEMORY.md` quando presente). O `memory.md` raiz em minúsculas não é injetado; ele é uma entrada legada de reparo para `openclaw doctor --fix` quando pareado com `MEMORY.md`. Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt de bootstrap normal; eles continuam sob demanda via ferramentas de memória em turnos comuns, mas execuções de modelo de reset/inicialização podem prefixar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Comandos puros de chat `/new` e `/reset` são confirmados sem invocar o modelo. O prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/SO/modelo/raciocínio)

Veja o detalhamento completo em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + assistente)
- Chamadas de ferramentas e resultados de ferramentas
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de poda
- Wrappers do provedor ou cabeçalhos de segurança (não visíveis, mas ainda contados)

Algumas superfícies pesadas em runtime têm seus próprios limites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Substituições por agente ficam em `agents.list[].contextLimits`. Esses controles são
para trechos limitados de runtime e blocos injetados pertencentes ao runtime. Eles são
separados dos limites de bootstrap, limites de contexto de inicialização e limites de
prompt de Skills.

Para imagens, OpenClaw reduz a escala de payloads de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores mais baixos geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores mais altos preservam mais detalhes visuais para capturas de tela pesadas em OCR/UI.

Para uma decomposição prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → anexa um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta o custo** (somente tokens).
- `/usage cost` → mostra um resumo de custo local dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` têm suporte.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota do provedor (`X% left`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos de provedores antes da exibição.
Para tráfego Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, então nomes de campos
específicos do transporte não alteram `/status`, `/usage` nem resumos de sessão.
O uso em JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` é mapeado para `cacheRead` com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego Responses nativo da família OpenAI, aliases de uso em WebSocket/SSE são
normalizados da mesma forma, e os totais recorrem a entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é esparso, `/status` e `session_status` também podem
recuperar contadores de token/cache e o rótulo do modelo de runtime ativo a partir do
log de uso de transcrição mais recente. Valores vivos não zero existentes ainda têm
precedência sobre valores de fallback da transcrição, e totais maiores da transcrição
orientados a prompt podem vencer quando os totais armazenados estão ausentes ou são menores.
A autenticação de uso para janelas de cota do provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, OpenClaw recorre a credenciais OAuth/chave de API correspondentes
de perfis de autenticação, env ou config.
Entradas de transcrição do assistente persistem o mesmo formato de uso normalizado, incluindo
`usage.cost` quando o modelo ativo tem preços configurados e o provedor
retorna metadados de uso. Isso dá a `/usage cost` e ao status de sessão baseado em transcrição
uma fonte estável mesmo depois que o estado vivo de runtime desaparece.

OpenClaw mantém a contabilidade de uso do provedor separada do snapshot de contexto atual.
`usage.total` do provedor pode incluir entrada em cache, saída e múltiplas
chamadas de modelo em loop de ferramentas, então é útil para custo e telemetria, mas pode exagerar
a janela de contexto ativa. Exibições e diagnósticos de contexto usam o snapshot de prompt mais recente
(`promptTokens`, ou a última chamada de modelo quando nenhum snapshot de prompt está
disponível) para `context.used`.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Estes são **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se os preços estiverem ausentes, OpenClaw mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólares.

Depois que sidecars e canais alcançam o caminho pronto do Gateway, OpenClaw inicia um
bootstrap opcional de preços em segundo plano para referências de modelo configuradas que ainda não
têm preços locais. Esse bootstrap busca catálogos remotos de preços do OpenRouter e LiteLLM.
Defina `models.pricing.enabled: false` para pular essas buscas de catálogo
em redes offline ou restritas; entradas explícitas
`models.providers.*.models[].cost` continuam guiando estimativas locais de custo.

## Impacto de TTL de cache e poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. OpenClaw pode
executar opcionalmente **poda por TTL de cache**: ele poda a sessão depois que o TTL do cache
expira, depois redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-cacheado em vez de cachear novamente todo o histórico. Isso mantém os custos de
escrita de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os
detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

Heartbeat pode manter o cache **aquecido** entre intervalos de ociosidade. Se o TTL de cache do seu modelo
for `1h`, definir o intervalo de heartbeat logo abaixo disso (por exemplo, `55m`) pode evitar
cachear novamente o prompt completo, reduzindo custos de escrita de cache.

Em configurações multiagente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo controle por controle, veja [Cache de prompt](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas que tokens de entrada,
enquanto escritas de cache são cobradas com um multiplicador mais alto. Veja os preços de
cache de prompt da Anthropic para as taxas e multiplicadores de TTL mais recentes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter cache de 1h aquecido com heartbeat

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
substituir apenas `cacheRetention` e herdar outros padrões do modelo sem alterações.

### Exemplo: habilitar o cabeçalho beta de contexto 1M da Anthropic

A janela de contexto 1M da Anthropic está atualmente protegida por beta. OpenClaw pode injetar o
valor `anthropic-beta` necessário quando você habilita `context1m` em modelos Opus
ou Sonnet compatíveis.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso é mapeado para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` é definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa do lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
OpenClaw pula o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas nos seus workflows.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões pesadas em capturas de tela.
- Mantenha as descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de overhead da lista de Skills.

## Relacionados

- [Uso e custos da API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

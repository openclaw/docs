---
read_when:
    - Explicando o uso de tokens, os custos ou as janelas de contexto
    - Depuração do crescimento do contexto ou do comportamento de Compaction
summary: Como o OpenClaw cria o contexto da solicitação e informa o uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-30T10:08:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos de cada modelo, mas a maioria dos modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt do sistema é criado

O OpenClaw monta seu próprio prompt do sistema a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (apenas metadados; as instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, mais `MEMORY.md` quando presente). O arquivo raiz em minúsculas `memory.md` não é injetado; ele é entrada legada de reparo para `openclaw doctor --fix` quando pareado com `MEMORY.md`. Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt normal de bootstrap; eles permanecem sob demanda via ferramentas de memória em turnos comuns, mas execuções de modelo de reinicialização/inicialização podem prefixar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Comandos simples de chat `/new` e `/reset` são confirmados sem invocar o modelo. O prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/OS/model/thinking)

Veja a análise completa em [Prompt do Sistema](/pt-BR/concepts/system-prompt).

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

Substituições por agente ficam em `agents.list[].contextLimits`. Esses controles são para trechos delimitados de runtime e blocos injetados pertencentes ao runtime. Eles são separados dos limites de bootstrap, limites de contexto de inicialização e limites de prompt de Skills.

Para imagens, o OpenClaw reduz a escala dos payloads de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para capturas de tela com muito OCR/UI.

Para uma análise prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → anexa um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta o custo** (somente tokens).
- `/usage cost` → mostra um resumo de custo local dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são compatíveis.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota de provedor (`X% left`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos de provedor antes da exibição.
Para tráfego de Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, portanto nomes de campos específicos de transporte não alteram `/status`, `/usage` nem resumos de sessão.
O uso JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e `stats.cached` é mapeado para `cacheRead`, com `stats.input_tokens - stats.cached` usado quando a CLI omite um campo `stats.input` explícito.
Para tráfego nativo de Responses da família OpenAI, aliases de uso de WebSocket/SSE são normalizados da mesma forma, e totais recorrem à entrada + saída normalizadas quando `total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é esparso, `/status` e `session_status` também podem recuperar contadores de tokens/cache e o rótulo do modelo de runtime ativo do log de uso de transcrição mais recente. Valores ao vivo não zero existentes ainda têm precedência sobre valores de fallback da transcrição, e totais maiores de transcrição orientados a prompt podem vencer quando os totais armazenados estão ausentes ou são menores.
A autenticação de uso para janelas de cota de provedor vem de hooks específicos de provedor quando disponíveis; caso contrário, o OpenClaw recorre à correspondência de credenciais OAuth/chave de API de perfis de autenticação, env ou config.
Entradas de transcrição do assistente persistem o mesmo formato de uso normalizado, incluindo `usage.cost` quando o modelo ativo tem preços configurados e o provedor retorna metadados de uso. Isso dá a `/usage cost` e ao status de sessão baseado em transcrição uma fonte estável mesmo depois que o estado de runtime ao vivo deixa de existir.

O OpenClaw mantém a contabilidade de uso do provedor separada do snapshot de contexto atual. `usage.total` do provedor pode incluir entrada em cache, saída e várias chamadas de modelo em loop de ferramentas, então é útil para custo e telemetria, mas pode superestimar a janela de contexto ao vivo. Exibições e diagnósticos de contexto usam o snapshot de prompt mais recente (`promptTokens`, ou a última chamada de modelo quando nenhum snapshot de prompt está disponível) para `context.used`.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços de modelo:

```
models.providers.<provider>.models[].cost
```

Estes são **USD por 1M de tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se os preços estiverem ausentes, o OpenClaw mostra apenas tokens. Tokens OAuth nunca mostram custo em dólares.

A inicialização do Gateway também executa um bootstrap opcional de preços em segundo plano para referências de modelo configuradas que ainda não têm preços locais. Esse bootstrap busca catálogos remotos de preços do OpenRouter e LiteLLM. Defina
`models.pricing.enabled: false` para ignorar essas buscas de catálogo na inicialização em redes offline ou restritas; entradas explícitas `models.providers.*.models[].cost` continuam a orientar estimativas de custo locais.

## Impacto do TTL de cache e da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenClaw pode executar opcionalmente **poda por TTL de cache**: ele poda a sessão assim que o TTL do cache expira e depois redefine a janela de cache para que solicitações subsequentes possam reutilizar o contexto recém-armazenado em cache em vez de armazenar novamente todo o histórico. Isso mantém os custos de gravação de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [configuração do Gateway](/pt-BR/gateway/configuration) e veja os detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

Heartbeat pode manter o cache **aquecido** durante intervalos de inatividade. Se o TTL de cache do seu modelo for `1h`, definir o intervalo de Heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar armazenar novamente em cache o prompt completo, reduzindo os custos de gravação de cache.

Em configurações multiagente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache por agente com `agents.list[].params.cacheRetention`.

Para um guia completo controle por controle, veja [Cache de Prompt](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas do que tokens de entrada, enquanto gravações de cache são cobradas com um multiplicador maior. Veja os preços de cache de prompt da Anthropic para as taxas e multiplicadores de TTL mais recentes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter cache de 1h aquecido com Heartbeat

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

`agents.list[].params` é mesclado por cima dos `params` do modelo selecionado, então você pode substituir apenas `cacheRetention` e herdar os outros padrões do modelo sem alterações.

### Exemplo: habilitar o cabeçalho beta de contexto de 1M da Anthropic

A janela de contexto de 1M da Anthropic está atualmente protegida por beta. O OpenClaw pode injetar o valor `anthropic-beta` obrigatório quando você habilita `context1m` em modelos Opus ou Sonnet compatíveis.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso é mapeado para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` está definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário, a Anthropic responde com um erro de limite de taxa do lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas nos seus workflows.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha as descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de overhead da lista de Skills.

## Relacionados

- [Uso da API e custos](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

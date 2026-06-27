---
read_when:
    - Explicando uso de tokens, custos ou janelas de contexto
    - Depuração do crescimento de contexto ou do comportamento de Compaction
summary: Como o OpenClaw cria contexto de prompt e relata uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-06-27T18:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos de cada modelo, mas a maioria dos modelos ao estilo OpenAI tem média de ~4 caracteres por token para texto em inglês.

## Como o prompt do sistema é construído

OpenClaw monta seu próprio prompt do sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (somente metadados; as instruções são carregadas sob demanda com `read`).
  Turnos nativos do Codex recebem o bloco compacto de Skills como instruções de desenvolvedor de colaboração com escopo de turno; outros harnesses o recebem na superfície normal do prompt. Ele é limitado por `skills.limits.maxSkillsPromptChars`, com substituição opcional por agente em `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, além de `MEMORY.md` quando presente). Turnos nativos do Codex não colam o `MEMORY.md` bruto do workspace de agente configurado quando ferramentas de memória estão disponíveis para esse workspace; eles incluem um pequeno ponteiro de memória nas instruções de desenvolvedor de colaboração com escopo de turno e usam ferramentas de memória sob demanda. Se as ferramentas estiverem desativadas, a busca de memória estiver indisponível ou o workspace ativo for diferente do workspace de memória do agente, `MEMORY.md` usa o caminho normal limitado de contexto de turno. A raiz em minúsculas `memory.md` não é injetada; ela é entrada de reparo legada para `openclaw doctor --fix` quando pareada com `MEMORY.md`. Arquivos grandes injetados são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 20000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt normal de bootstrap; eles permanecem sob demanda via ferramentas de memória em turnos comuns, mas execuções de modelo de redefinição/inicialização podem prefixar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Comandos de chat simples `/new` e `/reset` são confirmados sem invocar o modelo. O prelúdio de inicialização é controlado por `agents.defaults.startupContext`. Trechos de AGENTS.md pós-Compaction são separados e exigem adesão explícita em `agents.defaults.compaction.postCompactionSections`.
- Horário (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/SO/modelo/raciocínio)

Veja o detalhamento completo em [Prompt do Sistema](/pt-BR/concepts/system-prompt).

Ao documentar credenciais ou snippets de autenticação, use as
[Convenções de Placeholder de Segredo](/pt-BR/reference/secret-placeholder-conventions) para
evitar falsos positivos de scanners de segredo em mudanças apenas de documentação.

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
para trechos limitados de runtime e blocos injetados de propriedade do runtime. Eles são
separados dos limites de bootstrap, limites de contexto de inicialização e limites do prompt de Skills.

`toolResultMaxChars` é um teto avançado (até `1000000` caracteres). Quando ele não está definido, OpenClaw escolhe
o limite ativo de resultado de ferramenta a partir da janela de contexto efetiva do modelo: `16000` caracteres
abaixo de 100K tokens, `32000` caracteres em 100K+ tokens e `64000` caracteres em 200K+
tokens, ainda limitado pela proteção de parcela de contexto do runtime.

Para imagens, OpenClaw reduz a escala de payloads de imagem de transcrição/ferramenta antes das chamadas de provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para capturas de tela com muito OCR/UI.

Para um detalhamento prático (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** quando preços locais estão
  configurados para o modelo ativo.
- `/usage off|tokens|full` → acrescenta um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - `/usage reset` (aliases: `inherit`, `clear`, `default`) — limpa a substituição da sessão
    para que a sessão volte a herdar o padrão configurado.
  - `/usage full` mostra custo estimado somente quando OpenClaw tem metadados de uso e
    preços locais para o modelo ativo. Caso contrário, mostra apenas tokens.
- `/usage cost` → mostra um resumo de custo local a partir dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são compatíveis.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota de provedor (`X% left`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Superfícies de uso normalizam aliases comuns de campos nativos de provedor antes da exibição.
Para tráfego Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campos
específicos do transporte não alterem `/status`, `/usage` ou resumos de sessão.
O uso do Gemini CLI também é normalizado: o parser padrão `stream-json` lê
eventos `message` do assistente, e `stats.cached` mapeia para `cacheRead` com
`stats.input_tokens - stats.cached` usado quando a CLI omite um campo explícito
`stats.input`. Substituições JSON legadas ainda leem o texto da resposta de
`response`.
Para tráfego Responses nativo da família OpenAI, aliases de uso WebSocket/SSE são
normalizados da mesma forma, e os totais recorrem a entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é esparso, `/status` e `session_status` também podem
recuperar contadores de token/cache e o rótulo do modelo de runtime ativo a partir do
log de uso de transcrição mais recente. Valores ativos não zero existentes ainda têm
precedência sobre valores de fallback da transcrição, e totais de transcrição maiores orientados a prompt
podem prevalecer quando totais armazenados estão ausentes ou são menores.
A autenticação de uso para janelas de cota de provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, OpenClaw recorre a credenciais OAuth/chave de API correspondentes
de perfis de autenticação, env ou config.
Entradas de transcrição do assistente persistem o mesmo formato normalizado de uso, incluindo
`usage.cost` quando o modelo ativo tem preços configurados e o provedor
retorna metadados de uso. Isso dá a `/usage cost` e ao status de sessão apoiado por transcrição
uma fonte estável mesmo depois que o estado ativo do runtime desaparece.

OpenClaw mantém a contabilização de uso do provedor separada do snapshot de contexto atual.
`usage.total` do provedor pode incluir entrada em cache, saída e várias
chamadas de modelo em loop de ferramentas, portanto é útil para custo e telemetria, mas pode superestimar
a janela de contexto ativa. Exibições e diagnósticos de contexto usam o snapshot de prompt mais recente
(`promptTokens`, ou a última chamada de modelo quando nenhum snapshot de prompt está
disponível) para `context.used`.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços de modelo:

```
models.providers.<provider>.models[].cost
```

Estes são **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se os preços estiverem ausentes, OpenClaw mostra apenas tokens. A exibição de custo
não se limita à autenticação por chave de API: provedores sem chave de API, como `aws-sdk`, podem mostrar
custo estimado quando sua entrada de modelo configurada inclui preços locais e o
provedor retorna metadados de uso.

Depois que sidecars e canais alcançam o caminho pronto do Gateway, OpenClaw inicia um
bootstrap opcional de preços em segundo plano para refs de modelo configuradas que ainda não
têm preços locais. Esse bootstrap busca catálogos remotos de preços da OpenRouter e LiteLLM.
Defina `models.pricing.enabled: false` para pular essas buscas de catálogo
em redes offline ou restritas; entradas explícitas
`models.providers.*.models[].cost` continuam determinando estimativas locais de custo.

## TTL de cache e impacto da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. OpenClaw pode
opcionalmente executar **poda de ttl de cache**: ele poda a sessão assim que o TTL do cache
expira, depois redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-cacheado em vez de cachear novamente todo o histórico. Isso mantém os custos
de escrita de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os
detalhes de comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

Heartbeat pode manter o cache **aquecido** em intervalos de ociosidade. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de Heartbeat logo abaixo disso (por exemplo, `55m`) pode evitar
recachear o prompt inteiro, reduzindo custos de escrita de cache.

Em configurações multiagente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo controle por controle, veja [Cache de Prompt](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas do que tokens de entrada,
enquanto escritas de cache são cobradas com um multiplicador maior. Veja os preços de
cache de prompt da Anthropic para as taxas e multiplicadores de TTL mais recentes:
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

`agents.list[].params` é mesclado sobre os `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar outros padrões do modelo sem alterações.

### Contexto Anthropic 1M

OpenClaw dimensiona modelos Claude 4.x compatíveis com GA, como Opus 4.8, Opus 4.7, Opus 4.6 e
Sonnet 4.6, com a janela de contexto de 1M da Anthropic. Você não precisa de
`params.context1m: true` para esses modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Configs mais antigas podem manter `context1m: true`, mas OpenClaw não envia mais
o cabeçalho beta aposentado `context-1m-2025-08-07` da Anthropic para essa configuração e
não expande modelos Claude mais antigos sem suporte para 1M.

Requisito: a credencial deve estar qualificada para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa do lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
OpenClaw preserva os cabeçalhos beta exigidos por OAuth da Anthropic enquanto remove o
beta aposentado `context-1m-*` se ele permanecer em configs mais antigas.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Apare saídas grandes de ferramentas em seus workflows.
- Reduza `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de overhead da lista de Skills.

## Relacionados

- [Uso e custos da API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

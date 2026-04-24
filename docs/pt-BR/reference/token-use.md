---
read_when:
    - Explicar uso de tokens, custos ou janelas de contexto
    - Depurar crescimento de contexto ou comportamento de Compaction
summary: Como o OpenClaw monta o contexto do prompt e informa uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-24T06:12:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos do modelo, mas a maioria
dos modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt do sistema é montado

O OpenClaw monta seu próprio prompt do sistema a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (apenas metadados; as instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Workspace + arquivos bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, além de `MEMORY.md` quando presente). `memory.md` em minúsculas na raiz não é injetado; é entrada legada de reparo para `openclaw doctor --fix` quando emparelhado com `MEMORY.md`. Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt bootstrap normal; eles permanecem sob demanda via ferramentas de memória em turnos comuns, mas `/new` e `/reset` simples podem prependar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Esse prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Horário (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/OS/modelo/raciocínio)

Consulte o detalhamento completo em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo o que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + assistente)
- Chamadas de ferramenta e resultados de ferramenta
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de pruning
- Wrappers de provider ou cabeçalhos de segurança (não visíveis, mas ainda contabilizados)

Algumas superfícies mais pesadas em runtime têm seus próprios limites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Substituições por agente ficam em `agents.list[].contextLimits`. Esses ajustes são
para trechos limitados de runtime e blocos controlados por runtime injetados. Eles são
separados de limites de bootstrap, limites de contexto de inicialização e limites de prompt de Skills.

Para imagens, o OpenClaw reduz a escala de payloads de imagem de transcrição/ferramenta antes das chamadas ao provider.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload.
- Valores maiores preservam mais detalhe visual para OCR/capturas de interface com muita informação.

Para um detalhamento prático (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes comandos no chat:

- `/status` → **cartão de status rico em emoji** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (apenas chave de API).
- `/usage off|tokens|full` → acrescenta um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta custo** (apenas tokens).
- `/usage cost` → mostra um resumo local de custo a partir dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são compatíveis.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota por provider (`X% left`, não custos por resposta).
  Providers atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

Superfícies de uso normalizam aliases comuns de campos nativos de providers antes da exibição.
Para tráfego Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campo específicos do transporte não alterem `/status`, `/usage` ou resumos de sessão.
O uso JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` mapeia para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego nativo Responses da família OpenAI, aliases de uso de WebSocket/SSE são
normalizados da mesma forma, e totais usam fallback para entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot atual da sessão está esparso, `/status` e `session_status` também podem
recuperar contadores de tokens/cache e o rótulo ativo do modelo em runtime a partir do log
de uso mais recente da transcrição. Valores ativos não zero existentes ainda têm precedência sobre valores de fallback da transcrição, e
totais maiores orientados a prompt da transcrição podem prevalecer quando os totais armazenados
estão ausentes ou são menores.
A autenticação de uso para janelas de cota do provider vem de hooks específicos do provider quando
disponíveis; caso contrário, o OpenClaw usa fallback para credenciais OAuth/chave de API correspondentes de perfis de autenticação, env ou configuração.
Entradas de transcrição do assistente persistem o mesmo formato normalizado de uso, incluindo
`usage.cost` quando o modelo ativo tem preço configurado e o provider retorna metadados de uso. Isso dá a `/usage cost` e ao status de sessão baseado em transcrição uma fonte estável mesmo depois que o estado ativo de runtime desaparece.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da configuração de preços do seu modelo:

```
models.providers.<provider>.models[].cost
```

Esses valores são em **USD por 1M de tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se o preço estiver ausente, o OpenClaw mostrará apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL do cache e pruning

O cache de prompt do provider só se aplica dentro da janela de TTL do cache. O OpenClaw pode
opcionalmente executar **pruning por cache-ttl**: ele faz pruning da sessão quando o TTL do cache
expira e então redefine a janela do cache para que requisições seguintes possam reutilizar o contexto recém-cacheado em vez de recachear o histórico completo. Isso mantém os custos de gravação no cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e consulte os
detalhes de comportamento em [Pruning de sessão](/pt-BR/concepts/session-pruning).

O Heartbeat pode manter o cache **aquecido** durante períodos ociosos. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de Heartbeat um pouco abaixo disso (por exemplo `55m`) pode evitar
recachear o prompt completo, reduzindo custos de gravação em cache.

Em configurações com múltiplos agentes, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo, ajuste por ajuste, consulte [Cache de prompt](/pt-BR/reference/prompt-caching).

Para preços de API da Anthropic, leituras de cache são significativamente mais baratas do que tokens de entrada, enquanto gravações em cache são cobradas com multiplicador mais alto. Consulte os preços de cache de prompt da Anthropic para as taxas e multiplicadores de TTL mais recentes:
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
          cacheRetention: "long" # linha de base padrão para a maioria dos agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # manter cache longo aquecido para sessões profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evitar gravações em cache para notificações em rajada
```

`agents.list[].params` é mesclado sobre `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar inalterados os outros padrões do modelo.

### Exemplo: ativar cabeçalho beta de contexto 1M da Anthropic

A janela de contexto de 1M da Anthropic atualmente é controlada por beta. O OpenClaw pode injetar o valor necessário de `anthropic-beta` quando você ativa `context1m` em modelos Opus ou Sonnet compatíveis.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso mapeia para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` estiver definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa do lado do provider para essa requisição.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza grandes saídas de ferramenta nos seus fluxos.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Consulte [Skills](/pt-BR/tools/skills) para a fórmula exata de sobrecarga da lista de Skills.

## Relacionado

- [Uso e custos de API](/pt-BR/reference/api-usage-costs)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

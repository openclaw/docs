---
read_when:
    - Explicando uso de tokens, custos ou janelas de contexto
    - Depurando crescimento de contexto ou comportamento de compactação
summary: Como o OpenClaw monta o contexto do prompt e relata uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-07T05:31:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Os tokens são específicos de cada modelo, mas a maioria
dos modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt do sistema é montado

O OpenClaw monta seu próprio prompt do sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (somente metadados; as instruções são carregadas sob demanda com `read`)
- Instruções de autoatualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novos, além de `MEMORY.md` quando presente ou `memory.md` como fallback em minúsculas). Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 20000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 150000). Arquivos `memory/*.md` são sob demanda via ferramentas de memória e não são injetados automaticamente.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de heartbeat
- Metadados de runtime (host/OS/model/thinking)

Consulte a decomposição completa em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo o que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + do assistente)
- Chamadas de ferramenta e resultados de ferramenta
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de compactação e artefatos de poda
- Wrappers do provedor ou cabeçalhos de segurança (não visíveis, mas ainda contam)

Para imagens, o OpenClaw reduz o tamanho de payloads de imagem de transcript/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores normalmente reduzem o uso de vision-tokens e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para OCR/capturas de tela pesadas em UI.

Para uma decomposição prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes comandos no chat:

- `/status` → **cartão de status rico em emoji** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → acrescenta um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Auth OAuth **oculta custo** (somente tokens).
- `/usage cost` → mostra um resumo local de custos a partir dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são compatíveis.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas de cota normalizadas do provedor (`X% left`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos do provedor antes da exibição.
Para tráfego Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campo
específicos de transporte não alterem `/status`, `/usage` ou resumos de sessão.
O uso JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` é mapeado para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego Responses nativo da família OpenAI, aliases de uso WebSocket/SSE são
normalizados da mesma forma, e os totais usam como fallback entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é escasso, `/status` e `session_status` também podem
recuperar contadores de token/cache e o rótulo do modelo de runtime ativo do
log de uso mais recente do transcript. Valores live existentes e diferentes de zero ainda têm
precedência sobre valores de fallback do transcript, e totais maiores orientados por prompt
do transcript podem prevalecer quando os totais armazenados estiverem ausentes ou menores.
A auth de uso para janelas de cota do provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, o OpenClaw usa como fallback credenciais OAuth/chave de API correspondentes
de perfis auth, env ou config.

## Estimativa de custo (quando mostrada)

Os custos são estimados a partir da sua configuração de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Esses valores são em **USD por 1M tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se não houver preços, o OpenClaw mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL de cache e da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenClaw pode
executar opcionalmente **poda de cache-ttl**: ele poda a sessão quando o TTL do cache
expira e depois redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-colocado em cache, em vez de recachear todo o histórico. Isso mantém os custos
de gravação de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do gateway](/pt-BR/gateway/configuration) e veja os
detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

O heartbeat pode manter o cache **aquecido** durante intervalos de inatividade. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar
recachear o prompt completo, reduzindo custos de gravação de cache.

Em configurações com vários agentes, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento do cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo, opção por opção, consulte [Prompt Caching](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas do que
tokens de entrada, enquanto gravações de cache são cobradas com um multiplicador mais alto. Consulte os
preços de prompt caching da Anthropic para as taxas e multiplicadores de TTL mais recentes:
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
          cacheRetention: "long" # linha de base padrão para a maioria dos agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantém o cache longo aquecido para sessões profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evita gravações de cache para notificações em rajada
```

`agents.list[].params` é mesclado sobre os `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar os outros padrões do modelo sem alterações.

### Exemplo: ativar o cabeçalho beta de contexto 1M da Anthropic

A janela de contexto de 1M da Anthropic atualmente é controlada por beta. O OpenClaw pode injetar o
valor `anthropic-beta` necessário quando você ativa `context1m` em modelos Opus
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

Isso só se aplica quando `context1m: true` está definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa no lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas em seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` em sessões com muitas capturas de tela.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Consulte [Skills](/pt-BR/tools/skills) para a fórmula exata de sobrecarga da lista de Skills.

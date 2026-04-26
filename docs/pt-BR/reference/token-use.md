---
read_when:
    - Explicando o uso de tokens, custos ou janelas de contexto
    - Depurando o crescimento do contexto ou o comportamento da Compaction
summary: Como o OpenClaw cria o contexto do prompt e informa o uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-26T11:37:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 828b282103902f55d65ce820c17753c2602169eff068bcea36e629759002f28d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Os tokens são específicos do modelo, mas a maioria
dos modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt do sistema é criado

O OpenClaw monta seu próprio prompt do sistema a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (apenas metadados; as instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Espaço de trabalho + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novos, além de `MEMORY.md` quando presente). O `memory.md` minúsculo na raiz não é injetado; ele é uma entrada de reparo legada para `openclaw doctor --fix` quando pareado com `MEMORY.md`. Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Os arquivos diários `memory/*.md` não fazem parte do prompt de bootstrap normal; eles permanecem sob demanda via ferramentas de memória em turnos comuns, mas `/new` e `/reset` simples podem antepor um bloco único de contexto de inicialização com memória diária recente para esse primeiro turno. Esse prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/OS/model/thinking)

Veja a análise completa em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo o que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + do assistente)
- Chamadas de ferramentas e resultados de ferramentas
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de poda
- Wrappers do provedor ou cabeçalhos de segurança (não visíveis, mas ainda contabilizados)

Algumas superfícies pesadas em runtime têm seus próprios limites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

As substituições por agente ficam em `agents.list[].contextLimits`. Esses controles
servem para trechos limitados em runtime e blocos injetados pertencentes ao runtime. Eles são
separados dos limites de bootstrap, dos limites de contexto de inicialização e dos limites do prompt de Skills.

Para imagens, o OpenClaw reduz a escala das cargas de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores normalmente reduzem o uso de tokens de visão e o tamanho da carga.
- Valores maiores preservam mais detalhes visuais para capturas de tela com muito OCR/UI.

Para uma análise prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes comandos no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → acrescenta um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - A autenticação OAuth **oculta o custo** (somente tokens).
- `/usage cost` → mostra um resumo local de custos dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` são compatíveis.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota do provedor (`X% restante`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos do provedor antes da exibição.
Para tráfego OpenAI-family Responses, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campo
específicos de transporte não alterem `/status`, `/usage` nem os resumos de sessão.
O uso JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` é mapeado para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando o CLI omite um campo `stats.input` explícito.
Para tráfego nativo OpenAI-family Responses, os aliases de uso de WebSocket/SSE são
normalizados da mesma forma, e os totais recorrem a entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot da sessão atual é esparso, `/status` e `session_status` também podem
recuperar contadores de tokens/cache e o rótulo do modelo de runtime ativo a partir do
log de uso mais recente da transcrição. Valores ativos não nulos existentes ainda têm
precedência sobre os valores de fallback da transcrição, e totais da transcrição maiores,
orientados ao prompt, podem prevalecer quando os totais armazenados estiverem ausentes ou menores.
A autenticação de uso para janelas de cota do provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, o OpenClaw recorre à correspondência de credenciais OAuth/chave de API
a partir de perfis de autenticação, env ou config.
As entradas de transcrição do assistente persistem o mesmo formato de uso normalizado, incluindo
`usage.cost` quando o modelo ativo tem preços configurados e o provedor retorna metadados de uso. Isso dá a
`/usage cost` e ao status de sessão baseado em transcrição uma fonte estável mesmo depois que o estado ativo do runtime desaparece.

O OpenClaw mantém a contabilidade de uso do provedor separada do snapshot do contexto atual.
O `usage.total` do provedor pode incluir entrada em cache, saída e várias chamadas de modelo no loop de ferramenta,
portanto é útil para custo e telemetria, mas pode superestimar a janela de contexto ativa. Exibições e diagnósticos de contexto usam o snapshot mais recente do prompt (`promptTokens`, ou a última chamada de modelo quando nenhum snapshot de prompt está disponível) para `context.used`.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Esses valores são **USD por 1M de tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se o preço estiver ausente, o OpenClaw mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL de cache e da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenClaw pode
opcionalmente executar **poda por cache-ttl**: ele faz a poda da sessão quando o TTL do cache
expira e então redefine a janela de cache para que solicitações posteriores possam reutilizar o
contexto recém-colocado em cache em vez de armazenar novamente o histórico completo. Isso mantém
os custos de gravação em cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os detalhes
do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

O Heartbeat pode manter o cache **aquecido** durante intervalos de inatividade. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de Heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar
armazenar novamente o prompt completo, reduzindo os custos de gravação em cache.

Em configurações com vários agentes, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo, parâmetro por parâmetro, veja [Prompt Caching](/pt-BR/reference/prompt-caching).

Para preços da API Anthropic, leituras de cache são significativamente mais baratas do que
tokens de entrada, enquanto gravações em cache são cobradas com um multiplicador mais alto. Veja os preços de cache de prompt da Anthropic para as tarifas e multiplicadores de TTL mais recentes:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter o cache de 1h aquecido com Heartbeat

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
        cacheRetention: "none" # evita gravações em cache para notificações em rajada
```

`agents.list[].params` é mesclado sobre o `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar os outros padrões do modelo sem alterações.

### Exemplo: ativar o cabeçalho beta Anthropic 1M context

A janela de contexto de 1M da Anthropic atualmente está protegida por beta. O OpenClaw pode injetar o
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

Isso se aplica somente quando `context1m: true` está definido nessa entrada de modelo.

Requisito: a credencial precisa ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa do lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza resultados grandes de ferramentas nos seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de sobrecarga da lista de Skills.

## Relacionado

- [Uso e custos da API](/pt-BR/reference/api-usage-costs)
- [Prompt caching](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)

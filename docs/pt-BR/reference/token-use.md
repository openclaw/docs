---
read_when:
    - Explicação do uso de tokens, dos custos ou das janelas de contexto
    - Depuração do crescimento do contexto ou do comportamento de Compaction
summary: Como o OpenClaw cria o contexto do prompt e informa o uso de tokens e os custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-07-12T00:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

O OpenClaw monitora **tokens**, não caracteres. Os tokens são específicos de cada modelo, mas a maioria dos modelos no estilo da OpenAI tem uma média de aproximadamente 4 caracteres por token em textos em inglês.

## Como o prompt do sistema é criado

O OpenClaw monta seu próprio prompt do sistema a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (somente metadados; as instruções são carregadas sob demanda com `read`). Turnos nativos do Codex recebem o bloco compacto de Skills como instruções de desenvolvedor para colaboração com escopo de turno; outros ambientes de execução o recebem na superfície normal do prompt. Limitado por `skills.limits.maxSkillsPromptChars`, com substituição opcional por agente em `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de atualização automática
- Arquivos do espaço de trabalho + inicialização (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, além de `MEMORY.md` quando presente). Arquivos grandes injetados são truncados por `agents.defaults.bootstrapMaxChars` (padrão: `20000`); a injeção total de inicialização é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: `60000`).
  - Turnos nativos do Codex não inserem o conteúdo bruto de `MEMORY.md` quando as ferramentas de memória estão disponíveis para esse espaço de trabalho; em vez disso, recebem um pequeno indicador de memória nas instruções de desenvolvedor para colaboração com escopo de turno e usam as ferramentas de memória sob demanda. Se as ferramentas estiverem desativadas, a pesquisa de memória estiver indisponível ou o espaço de trabalho ativo for diferente do espaço de trabalho de memória do agente, `MEMORY.md` retorna ao caminho normal e limitado de contexto do turno.
  - O arquivo `memory.md` em letras minúsculas na raiz nunca é injetado. Ele é uma entrada legada de reparo para `openclaw doctor --fix`, que o migra para `MEMORY.md`.
  - Os arquivos diários `memory/*.md` não fazem parte do prompt normal de inicialização; eles permanecem disponíveis sob demanda por meio das ferramentas de memória em turnos comuns. Execuções do modelo após redefinição/inicialização podem antepor um bloco único de contexto de inicialização com memórias diárias recentes para esse primeiro turno, controlado por `agents.defaults.startupContext`. Os comandos de chat simples `/new` e `/reset` são confirmados sem invocar o modelo.
  - Os trechos de `AGENTS.md` após a Compaction são separados e exigem ativação explícita por meio de `agents.defaults.compaction.postCompactionSections`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de execução (host/SO/modelo/raciocínio)

Consulte a descrição completa em [Prompt do sistema](/pt-BR/concepts/system-prompt).

Ao documentar credenciais ou trechos de autenticação, use as [Convenções para espaços reservados de segredos](/pt-BR/reference/secret-placeholder-conventions) para evitar falsos positivos do verificador de segredos em alterações exclusivas de documentação.

## O que conta na janela de contexto

Tudo o que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções acima)
- Histórico da conversa (mensagens do usuário + assistente)
- Chamadas de ferramentas e resultados de ferramentas
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de poda
- Wrappers do provedor ou cabeçalhos de segurança (não visíveis, mas ainda contabilizados)

Superfícies com uso intenso em tempo de execução têm seus próprios limites explícitos em `agents.defaults.contextLimits` (substituições por agente em `agents.list[].contextLimits`):

| Chave                    | Finalidade                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `memoryGetMaxChars`      | Máximo de caracteres que `memory_get` retorna antes do truncamento.                                  |
| `memoryGetDefaultLines`  | Janela padrão de linhas de `memory_get` quando uma solicitação omite `lines`.                         |
| `toolResultMaxChars`     | Limite avançado para o resultado de uma única ferramenta ativa (até `1000000` caracteres).           |
| `postCompactionMaxChars` | Máximo de caracteres preservados de `AGENTS.md` durante a atualização após a Compaction.             |

Esses são trechos limitados de tempo de execução e blocos injetados pertencentes à execução, separados dos limites de inicialização, dos limites de contexto de inicialização e dos limites do prompt de Skills.

`toolResultMaxChars` não é definido por padrão, portanto o OpenClaw deriva o limite de resultados de ferramentas ativas da janela de contexto efetiva do modelo: `16000` caracteres abaixo de 100 mil tokens, `32000` caracteres a partir de 100 mil tokens e `64000` caracteres a partir de 200 mil tokens. A proteção de proporção do contexto em tempo de execução ainda limita o resultado de uma única ferramenta a 30% da janela de contexto, mesmo quando um limite explícito maior está configurado.

Para imagens, o OpenClaw reduz a resolução das cargas de imagens de transcrições/ferramentas antes das chamadas ao provedor. Ajuste com `agents.defaults.imageMaxDimensionPx` (padrão: `1200`):

- Valores menores reduzem o uso de tokens de visão e o tamanho da carga.
- Valores maiores preservam mais detalhes visuais em capturas de tela com muito conteúdo de OCR/interface.

Para uma descrição prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Como consultar o uso atual de tokens

No chat:

- `/status` -> cartão de status rico em emojis com o modelo da sessão, uso do contexto, tokens de entrada/saída da última resposta e custo estimado quando preços locais estão configurados para o modelo ativo.
- `/usage off|tokens|full` -> acrescenta um rodapé de uso por resposta a cada resposta. Persiste por sessão (armazenado como `responseUsage`).
  - `/usage reset` (aliases: `inherit`, `clear`, `default`) limpa a substituição da sessão para que ela volte a herdar o padrão configurado.
  - `/usage tokens` mostra detalhes de tokens/cache do turno.
  - `/usage full` mostra detalhes compactos de modelo/contexto/custo; o custo estimado aparece somente quando o OpenClaw tem metadados de uso e preços locais para o modelo ativo. Layouts personalizados de `messages.usageTemplate` podem incluir campos de tokens/cache.
- `/usage cost` -> resumo de custos locais com base nos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/TUI da Web:** há suporte a `/status` e `/usage`.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram janelas normalizadas de cota do provedor (`X% left`, não custos por resposta). Provedores atuais de janelas de uso: Claude (Anthropic), ClawRouter, Copilot (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi, Xiaomi Token Plan e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos dos provedores antes da exibição. Para tráfego de Responses da família OpenAI, isso inclui tanto `input_tokens`/`output_tokens` quanto `prompt_tokens`/`completion_tokens`, portanto nomes de campos específicos do transporte não alteram `/status`, `/usage` nem os resumos de sessão. O uso do Gemini CLI também é normalizado: o analisador padrão `stream-json` lê eventos `message` do assistente, e `stats.cached` é mapeado para `cacheRead`, usando `stats.input_tokens - stats.cached` quando a CLI omite um campo explícito `stats.input`. Substituições JSON legadas ainda leem o texto da resposta de `response`.

Para tráfego nativo de Responses da família OpenAI, aliases de uso via WebSocket/SSE são normalizados da mesma forma, e os totais recorrem à soma normalizada de entrada + saída quando `total_tokens` está ausente ou é `0`.

Quando o instantâneo da sessão atual contém poucos dados, `/status` e `session_status` podem recuperar contadores de tokens/cache e o rótulo do modelo ativo em tempo de execução a partir do registro de uso mais recente da transcrição. Valores ativos existentes diferentes de zero ainda têm precedência sobre os valores de fallback da transcrição, e totais maiores da transcrição orientados ao prompt podem prevalecer quando os totais armazenados estão ausentes ou são menores.

A autenticação de uso para janelas de cota do provedor vem primeiro de hooks específicos do provedor; se um provedor não tiver um hook (ou se o hook não resolver um token), o OpenClaw recorre a credenciais OAuth/chave de API correspondentes dos perfis de autenticação, do ambiente ou da configuração.

As entradas de transcrição do assistente persistem o mesmo formato normalizado de uso, incluindo `usage.cost` quando o modelo ativo tem preços configurados e o provedor retorna metadados de uso. Isso fornece a `/usage cost` e ao status de sessão baseado em transcrição uma fonte estável mesmo após o desaparecimento do estado ativo em tempo de execução.

O OpenClaw mantém a contabilização de uso do provedor separada do instantâneo atual do contexto. O `usage.total` do provedor pode incluir entrada armazenada em cache, saída e várias chamadas ao modelo no ciclo de ferramentas, portanto ele é útil para custos e telemetria, mas pode superestimar a janela de contexto ativa. Exibições e diagnósticos de contexto usam o instantâneo mais recente do prompt (`promptTokens` ou a última chamada ao modelo quando nenhum instantâneo do prompt está disponível) para `context.used`.

## Estimativa de custos (quando exibida)

Os custos são estimados com base na configuração de preços do seu modelo:

```text
models.providers.<provider>.models[].cost
```

Esses valores são em **USD por 1 milhão de tokens** para `input`, `output`, `cacheRead` e `cacheWrite`. Se os preços estiverem ausentes, `/usage full` omite o custo; use `/usage tokens` ou um `messages.usageTemplate` personalizado quando precisar de detalhes de tokens/cache em cada resposta. A exibição de custos não se limita à autenticação por chave de API: provedores sem chave de API, como `aws-sdk`, podem mostrar o custo estimado quando a entrada configurada do modelo inclui preços locais e o provedor retorna metadados de uso.

Depois que os processos auxiliares e canais alcançam o caminho pronto do Gateway, o OpenClaw inicia uma inicialização opcional de preços em segundo plano para referências de modelos configuradas que ainda não tenham preços locais. Essa inicialização busca catálogos remotos de preços do OpenRouter e do LiteLLM. Defina `models.pricing.enabled: false` para ignorar essas buscas de catálogos em redes offline ou restritas; entradas explícitas de `models.providers.*.models[].cost` ainda determinam as estimativas locais de custo.

## Impacto do TTL do cache e da poda

O cache de prompts do provedor se aplica somente dentro da janela de TTL do cache. O OpenClaw pode executar opcionalmente a **poda por TTL do cache**: ele poda a sessão quando o TTL do cache expira e, em seguida, redefine a janela do cache para que solicitações posteriores reutilizem o contexto recém-armazenado em cache, em vez de armazenar novamente todo o histórico. Isso reduz os custos de gravação no cache quando uma sessão fica inativa além do TTL.

Configure-o em [Configuração do Gateway](/pt-BR/gateway/configuration) e consulte os detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

O Heartbeat pode manter o cache **aquecido** durante períodos de inatividade. Se o TTL do cache do seu modelo for `1h`, definir o intervalo de Heartbeat logo abaixo disso (por exemplo, `55m`) pode evitar armazenar novamente todo o prompt em cache, reduzindo os custos de gravação no cache.

Em configurações com vários agentes, você pode manter uma configuração compartilhada de modelo e ajustar o comportamento do cache por agente com `agents.list[].params.cacheRetention`.

Para obter um guia completo de cada opção, consulte [Cache de prompts](/pt-BR/reference/prompt-caching).

Nos preços da API da Anthropic, as leituras do cache são significativamente mais baratas que os tokens de entrada, enquanto as gravações no cache são cobradas com um multiplicador maior. Consulte os preços de cache de prompts da Anthropic para obter as tarifas e os multiplicadores de TTL mais recentes:
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

`agents.list[].params` é mesclado sobre os `params` do modelo selecionado, portanto você pode substituir somente `cacheRetention` e herdar os demais padrões do modelo sem alterações.

### Contexto de 1 milhão da Anthropic

O OpenClaw dimensiona modelos Claude 4.x compatíveis com disponibilidade geral, como Opus 4.8, Opus 4.7, Opus 4.6 e Sonnet 4.6, com a janela de contexto de 1 milhão da Anthropic. Você não precisa de `params.context1m: true` para esses modelos.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Configurações mais antigas podem manter `context1m: true`, mas o OpenClaw não envia mais o cabeçalho beta descontinuado `context-1m-2025-08-07` da Anthropic para essa configuração e não expande modelos Claude mais antigos sem suporte para 1 milhão.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de limite de taxa do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/de assinatura
(`sk-ant-oat-*`), o OpenClaw preservará os cabeçalhos beta da Anthropic
exigidos pelo OAuth, removendo o beta descontinuado `context-1m-*` caso ele ainda esteja
presente em configurações antigas.

## Dicas para reduzir a pressão sobre os tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas extensas de ferramentas em seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas capturas de tela.
- Mantenha as descrições das Skills curtas (a lista de Skills é inserida no prompt).
- Prefira modelos menores para trabalhos exploratórios e com saídas extensas.

Consulte [Skills](/pt-BR/tools/skills) para ver a fórmula exata da sobrecarga da lista de Skills.

## Relacionado

- [Uso e custos da API](/pt-BR/reference/api-usage-costs)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
- [Acompanhamento de uso](/pt-BR/concepts/usage-tracking)

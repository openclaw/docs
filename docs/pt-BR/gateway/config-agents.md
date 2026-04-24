---
read_when:
    - Ajustando os padrões do agente (modelos, thinking, workspace, Heartbeat, mídia, Skills)
    - Configurando roteamento com vários agentes e bindings
    - Ajustando o comportamento de sessão, entrega de mensagens e modo de fala
summary: Configuração de padrões do agente, roteamento com vários agentes, sessão, mensagens e fala
title: Configuração — agentes
x-i18n:
    generated_at: "2026-04-24T05:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, tools, runtime do gateway e outras
chaves de nível superior, consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões do agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório mostrada na linha Runtime do prompt de sistema. Se não for definida, o OpenClaw detecta automaticamente subindo a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permissões padrão opcional de Skills para agentes que não definem
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla quando os arquivos bootstrap do workspace são injetados no prompt de sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos seguros de continuação (após uma resposta concluída do assistente) pulam a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas pós-Compaction ainda recompõem o contexto.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo bootstrap do workspace antes do truncamento. Padrão: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos bootstrap do workspace. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt de sistema.
- `"once"`: injeta o aviso uma vez por assinatura de truncamento exclusiva (recomendado).
- `"always"`: injeta o aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propriedade de orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
intencionalmente divididos por subsistema em vez de passarem todos por um único
controle genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção normal do bootstrap do workspace.
- `agents.defaults.startupContext.*`:
  prelúdio de inicialização de uso único para `/new` e `/reset`, incluindo arquivos
  recentes diários de `memory/*.md`.
- `skills.limits.*`:
  lista compacta de Skills injetada no prompt de sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados em runtime e blocos injetados de propriedade do runtime.
- `memory.qmd.limits.*`:
  dimensionamento de snippets e de injeção da busca de memória indexada.

Use a substituição correspondente por agente apenas quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado em execuções simples de `/new` e `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Padrões compartilhados para superfícies limitadas de contexto em runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes da adição de
  metadados de truncamento e aviso de continuação.
- `memoryGetDefaultLines`: janela padrão de linhas de `memory_get` quando `lines` for
  omitido.
- `toolResultMaxChars`: limite de resultado de tool em live usado para resultados persistidos e
  recuperação de overflow.
- `postCompactionMaxChars`: limite de trecho de AGENTS.md usado durante a injeção de
  atualização pós-Compaction.

#### `agents.list[].contextLimits`

Substituição por agente para os controles compartilhados de `contextLimits`. Campos omitidos herdam
de `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite global para a lista compacta de Skills injetada no prompt de sistema. Isso
não afeta a leitura sob demanda de arquivos `SKILL.md`.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Substituição por agente para o orçamento do prompt de Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Tamanho máximo em pixels do lado mais longo da imagem em blocos de imagem de transcrição/tool antes de chamadas ao provider.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload da requisição em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone para o contexto do prompt de sistema (não para timestamps de mensagem). Usa o timezone do host como fallback.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt de sistema. Padrão: `auto` (preferência do SO).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parâmetros globais padrão do provider
      embeddedHarness: {
        runtime: "auto", // auto | pi | id de harness registrado, por exemplo codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - A forma string define apenas o modelo primário.
  - A forma objeto define o primário mais modelos ordenados de failover.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da tool `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não consegue aceitar entrada de imagem.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagem e por qualquer superfície futura de tool/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagem do Gemini, `fal/fal-ai/flux/dev` para fal ou `openai/gpt-image-2` para OpenAI Images.
  - Se você selecionar diretamente um provider/model, configure também a autenticação correspondente do provider (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers restantes de geração de imagem registrados, na ordem do ID do provider.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela tool integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.5+`.
  - Se omitido, `music_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers restantes de geração de música registrados, na ordem do ID do provider.
  - Se você selecionar diretamente um provider/model, configure também a autenticação/chave de API correspondente do provider.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela tool integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um provider padrão com autenticação. Ele tenta primeiro o provider padrão atual e depois os providers restantes de geração de vídeo registrados, na ordem do ID do provider.
  - Se você selecionar diretamente um provider/model, configure também a autenticação/chave de API correspondente do provider.
  - O provider integrado de geração de vídeo Qwen suporta até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções de nível de provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela tool `pdf` para roteamento de modelo.
  - Se omitido, a tool PDF usa como fallback `imageModel` e depois o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a tool `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo padrão de páginas consideradas pelo modo de fallback de extração na tool `pdf`.
- `verboseDefault`: nível verbose padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.4` para acesso com chave de API ou `openai-codex/gpt-5.5` para Codex OAuth). Se você omitir o provider, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provider configurado para aquele ID exato de modelo e só então usa como fallback o provider padrão configurado (comportamento legado obsoleto de compatibilidade, então prefira `provider/model` explícito). Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw usa como fallback o primeiro provider/model configurado em vez de expor um padrão obsoleto de provider removido.
- `models`: o catálogo de modelos configurado e a lista de permissões para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provider, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`).
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provider mesclam os modelos selecionados do provider nesse mapa e preservam providers não relacionados já configurados.
  - Para modelos diretos OpenAI Responses, a Compaction no lado do servidor é habilitada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Consulte [Compaction no lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão de provider aplicados a todos os modelos. Definidos em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (config): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo) e depois `agents.list[].params` (agent id correspondente) substitui por chave. Consulte [Cache de prompt](/pt-BR/reference/prompt-caching) para detalhes.
- `embeddedHarness`: política padrão do runtime de agente incorporado de baixo nível. Use `runtime: "auto"` para permitir que harnesses de plugin registrados assumam modelos compatíveis, `runtime: "pi"` para forçar o harness PI integrado ou um ID de harness registrado como `runtime: "codex"`. Defina `fallback: "none"` para desabilitar fallback automático para PI.
- Gravadores de configuração que alteram esses campos (por exemplo `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas existentes de fallback quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` controla qual executor de baixo nível executa turnos de agente incorporados.
A maioria das implantações deve manter o padrão `{ runtime: "auto", fallback: "pi" }`.
Use-o quando um plugin confiável fornecer um harness nativo, como o harness
integrado do app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` ou um ID de harness de plugin registrado. O plugin integrado Codex registra `codex`.
- `fallback`: `"pi"` ou `"none"`. `"pi"` mantém o harness PI integrado como fallback de compatibilidade quando nenhum harness de plugin é selecionado. `"none"` faz com que uma seleção ausente ou incompatível de harness de plugin falhe em vez de usar PI silenciosamente. Falhas do harness de plugin selecionado sempre aparecem diretamente.
- Substituições por ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` substitui `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` desabilita o fallback para PI nesse processo.
- Para implantações somente Codex, defina `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` e `embeddedHarness.fallback: "none"`.
- A escolha do harness é fixada por session id após a primeira execução incorporada. Alterações de config/env afetam sessões novas ou redefinidas, não uma transcrição existente. Sessões legadas com histórico de transcrição, mas sem pin registrado, são tratadas como fixadas em PI. `/status` mostra IDs de harness não PI, como `codex`, ao lado de `Fast`.
- Isso controla apenas o harness de chat incorporado. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provider/model.

**Aliases integrados abreviados** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` ou GPT-5.5 Codex OAuth configurado |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Seus aliases configurados sempre têm prioridade sobre os padrões.

Modelos Z.AI GLM-4.x habilitam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI habilitam `tool_stream` por padrão para streaming de chamada de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desabilitá-lo.
Modelos Anthropic Claude 4.6 usam por padrão thinking `adaptive` quando nenhum nível explícito de thinking é definido.

### `agents.defaults.cliBackends`

Backends de CLI opcionais para execuções de fallback somente de texto (sem chamadas de ferramenta). Úteis como backup quando providers de API falham.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backends de CLI são orientados a texto; tools são sempre desabilitadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Passagem de imagem é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitui todo o prompt de sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou apenas com espaços é ignorado. Útil para experimentos controlados de prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlays de prompt independentes de provider aplicados por família de modelo. IDs de modelo da família GPT-5 recebem o contrato compartilhado de comportamento entre providers; `personality` controla apenas a camada de estilo de interação amigável.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (padrão) e `"on"` habilitam a camada de estilo de interação amigável.
- `"off"` desabilita apenas a camada amigável; o contrato de comportamento GPT-5 com tags continua habilitado.
- O legado `plugins.entries.openai.config.personality` ainda é lido quando essa configuração compartilhada não está definida.

### `agents.defaults.heartbeat`

Execuções periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // padrão: true; false omite a seção Heartbeat do prompt de sistema
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada Heartbeat em uma sessão nova (sem histórico de conversa)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (padrão) | block
        target: "none", // padrão: none | opções: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação com chave de API) ou `1h` (autenticação OAuth). Defina como `0m` para desabilitar.
- `includeSystemPromptSection`: quando `false`, omite a seção Heartbeat do prompt de sistema e pula a injeção de `HEARTBEAT.md` no contexto bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando `true`, suprime payloads de aviso de erro de tool durante execuções de Heartbeat.
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de Heartbeat antes de ser abortado. Deixe sem definir para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega com alvo direto. `block` suprime entrega com alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando `true`, execuções de Heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos bootstrap do workspace.
- `isolatedSession`: quando `true`, cada Heartbeat é executado em uma sessão nova, sem histórico prévio de conversa. Mesmo padrão de isolamento que `sessionTarget: "isolated"` do Cron. Reduz o custo por Heartbeat de ~100 mil para ~2-5 mil tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam Heartbeats.
- Heartbeats executam turnos completos de agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de um plugin de provider de Compaction registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usado quando identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desabilita a reinjeção
        model: "openrouter/anthropic/claude-sonnet-4-6", // substituição opcional de modelo só para Compaction
        notifyUser: true, // envia avisos curtos quando a Compaction começa e termina (padrão: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` ou `safeguard` (sumarização em blocos para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: ID de um plugin de provider de Compaction registrado. Quando definido, o `summarize()` do provider é chamado em vez da sumarização integrada com LLM. Em caso de falha, usa o integrado como fallback. Definir um provider força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de Compaction antes que o OpenClaw a aborte. Padrão: `900`.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` adiciona instruções integradas de retenção de identificadores opacos durante a sumarização de Compaction.
- `identifierInstructions`: texto opcional personalizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjetar após a Compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desabilitar a reinjeção. Quando não definido ou definido explicitamente com esse par padrão, cabeçalhos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` apenas para sumarização de Compaction. Use isto quando a sessão principal deve manter um modelo, mas os resumos de Compaction devem rodar em outro; quando não definido, a Compaction usa o modelo primário da sessão.
- `notifyUser`: quando `true`, envia avisos curtos ao usuário quando a Compaction começa e termina (por exemplo, "Compacting context..." e "Compaction complete"). Desabilitado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno agentic silencioso antes da Compaction automática para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de tools** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duração (ms/s/m/h), unidade padrão: minutos
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento do modo cache-ttl">

- `mode: "cache-ttl"` habilita passagens de pruning.
- `ttl` controla com que frequência o pruning pode rodar novamente (após o último toque de cache).
- O pruning primeiro aplica soft-trim em resultados de tools superdimensionados e depois faz hard-clear de resultados de tools mais antigos, se necessário.

**Soft-trim** mantém início + fim e insere `...` no meio.

**Hard-clear** substitui todo o resultado da tool pelo placeholder.

Observações:

- Blocos de imagem nunca são truncados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se existirem menos de `keepLastAssistants` mensagens do assistente, o pruning é ignorado.

</Accordion>

Consulte [Pruning de sessão](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

### Streaming por bloco

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Canais que não são Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas por bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam por padrão `minChars: 1500`.
- `humanDelay`: pausa aleatória entre respostas por bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento + chunking.

### Indicadores de digitação

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Padrões: `instant` para chats diretos/menções, `message` para chats em grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Consulte [Indicadores de digitação](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para o agente incorporado. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / conteúdos inline também são compatíveis:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detalhes do sandbox">

**Backend:**

- `docker`: runtime Docker local (padrão)
- `ssh`: runtime remoto genérico com backend SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, configurações específicas do runtime vão para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave do host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` tem prioridade sobre `identityFile`
- `certificateData` tem prioridade sobre `certificateFile`
- `knownHostsData` tem prioridade sobre `knownHostsFile`
- Valores `*Data` com SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes do início da sessão sandbox

**Comportamento do backend SSH:**

- semeia o workspace remoto uma vez após criação ou recriação
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, tools de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente mudanças remotas de volta para o host
- não oferece suporte a contêineres de browser em sandbox

**Acesso ao workspace:**

- `none`: workspace sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado para leitura/gravação em `/workspace`

**Escopo:**

- `session`: contêiner + workspace por sessão
- `agent`: um contêiner + workspace por agente (padrão)
- `shared`: contêiner e workspace compartilhados (sem isolamento entre sessões)

**Configuração do plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcional
          gatewayEndpoint: "https://lab.example", // opcional
          policy: "strict", // id opcional de política OpenShell
          providers: ["openai"], // opcional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: semeia o remoto a partir do local antes do exec, sincroniza de volta após o exec; o workspace local continua canônico
- `remote`: semeia o remoto uma vez quando o sandbox é criado e depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de seed.
O transporte é SSH para o sandbox OpenShell, mas o plugin é dono do ciclo de vida do sandbox e da sincronização opcional em espelho.

**`setupCommand`** executa uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, raiz gravável e usuário root.

**Os contêineres usam por padrão `network: "none"`** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergência).

**Anexos de entrada** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Browser em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. A URL do noVNC é injetada no prompt de sistema. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador ao noVNC usa autenticação VNC por padrão, e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de apontarem para o browser do host.
- `network` usa por padrão `openclaw-sandbox-browser` (rede bridge dedicada). Defina como `bridge` apenas quando você quiser explicitamente conectividade global da bridge.
- `cdpSourceRange` restringe opcionalmente a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do browser em sandbox. Quando definido (inclusive `[]`), ele substitui `docker.binds` para o contêiner do browser.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts com contêiner:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derivado de OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (habilitado por padrão)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` são
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se o seu workflow
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processos padrão do Chromium.
  - além de `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` estiver habilitado.
  - Os padrões são a baseline da imagem do contêiner; use uma imagem de browser personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

Sandboxing de browser e `sandbox.docker.binds` são apenas para Docker.

Imagens de build:

```bash
scripts/sandbox-setup.sh           # imagem principal de sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional de browser
```

### `agents.list` (substituições por agente)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // ou { primary, fallbacks }
        thinkingDefault: "high", // substituição por agente do nível de thinking
        reasoningDefault: "on", // substituição por agente da visibilidade de reasoning
        fastModeDefault: false, // substituição por agente do modo fast
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // substitui por chave params correspondentes de defaults.models
        skills: ["docs-search"], // substitui agents.defaults.skills quando definido
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: ID estável do agente (obrigatório).
- `default`: quando vários são definidos, o primeiro vence (aviso registrado em log). Se nenhum for definido, a primeira entrada da lista é o padrão.
- `model`: a forma string substitui apenas `primary`; a forma objeto `{ primary, fallbacks }` substitui ambos (`[]` desabilita fallbacks globais). Jobs Cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para substituições específicas do agente como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `skills`: lista de permissões opcional de Skills por agente. Se omitida, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa nenhuma Skill.
- `thinkingDefault`: nível thinking padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para este agente quando nenhuma substituição por mensagem ou sessão estiver definida.
- `reasoningDefault`: visibilidade padrão opcional de reasoning por agente (`on | off | stream`). Aplica-se quando nenhuma substituição de reasoning por mensagem ou sessão estiver definida.
- `fastModeDefault`: padrão opcional por agente para modo fast (`true | false`). Aplica-se quando nenhuma substituição de modo fast por mensagem ou sessão estiver definida.
- `embeddedHarness`: substituição opcional por agente da política de harness de baixo nível. Use `{ runtime: "codex", fallback: "none" }` para tornar um agente somente Codex enquanto outros agentes mantêm o fallback padrão para PI.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões de harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: lista de permissões de IDs de agente para `sessions_spawn` (`["*"]` = qualquer; padrão: apenas o mesmo agente).
- Guarda de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando `true`, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento com vários agentes

Execute vários agentes isolados dentro de um único Gateway. Consulte [Vários agentes](/pt-BR/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campos de correspondência de binding

- `type` (opcional): `route` para roteamento normal (tipo ausente usa route por padrão), `acp` para bindings persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específicos do canal)
- `acp` (opcional; apenas para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (em todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente em `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem por níveis de binding de rota acima.

### Perfis de acesso por agente

<Accordion title="Acesso total (sem sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tools + workspace somente leitura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Sem acesso ao sistema de arquivos (somente mensagens)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Consulte [Sandbox e Tools com vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes de precedência.

---

## Sessão

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // pula o fork de thread pai acima dessa contagem de tokens (0 desabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duração ou false
      maxDiskBytes: "500mb", // orçamento rígido opcional
      highWaterBytes: "400mb", // alvo opcional de limpeza
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // desfoco automático padrão por inatividade em horas (`0` desabilita)
      maxAgeHours: 0, // idade máxima rígida padrão em horas (`0` desabilita)
    },
    mainKey: "main", // legado (o runtime sempre usa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalhes dos campos de sessão">

- **`scope`**: estratégia base de agrupamento de sessão para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use apenas quando o contexto compartilhado for intencional).
- **`dmScope`**: como DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por ID do remetente em todos os canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada com vários usuários).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para várias contas).
- **`identityLinks`**: mapeia IDs canônicos para peers com prefixo de provider para compartilhamento de sessão entre canais.
- **`reset`**: política principal de reset. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, vence o que expirar primeiro.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` da sessão pai permitido ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico da transcrição pai.
  - Defina `0` para desabilitar essa proteção e sempre permitir fork do pai.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas agent-to-agent (inteiro, intervalo: `0`–`5`). `0` desabilita encadeamento ping-pong.
- **`sendPolicy`**: correspondência por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. O primeiro deny vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessão.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando ele excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. Usa por padrão `pruneAfter`; defina `false` para desabilitar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após limpeza por orçamento. Usa por padrão `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave mestra padrão (providers podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desfoco automático padrão por inatividade em horas (`0` desabilita; providers podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desabilita; providers podem substituir)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // ou "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 desabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefixo de resposta

Substituições por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (o mais específico vence): conta → canal → global. `""` desabilita e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição                 | Exemplo                     |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provider          | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking   | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (mesmo que `"auto"`)     |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- Usa por padrão `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desabilitar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em Slack, Discord e Telegram.
- `messages.statusReactions.enabled`: habilita reações de status do ciclo de vida em Slack, Discord e Telegram.
  Em Slack e Discord, quando não definido, mantém as reações de status habilitadas quando reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídia/anexos fazem flush imediatamente. Comandos de controle ignoram o debounce.

### TTS (texto para fala)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` controla o modo padrão de auto-TTS: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para auto-resumo.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa por padrão `false` (opt-in).
- Chaves de API usam como fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- `openai.baseUrl` substitui o endpoint TTS da OpenAI. A ordem de resolução é config, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e relaxa a validação de modelo/voz.

---

## Fala

Padrões para o modo Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários providers de Talk estiverem configurados.
- Chaves legadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são apenas para compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam como fallback `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica apenas quando nenhuma chave de API de Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas de Talk usem nomes amigáveis.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Quando não definido, mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

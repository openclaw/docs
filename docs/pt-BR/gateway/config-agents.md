---
read_when:
    - Ajustando padrões de agente (models, thinking, workspace, Heartbeat, mídia, Skills)
    - Configurando roteamento e bindings Multi-Agent
    - Ajustando o comportamento de sessão, entrega de mensagens e modo talk
summary: Padrões de agente, roteamento Multi-Agent, sessão, mensagens e configuração de talk
title: Configuração — agentes
x-i18n:
    generated_at: "2026-04-26T11:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do Gateway e outras
chaves de nível superior, veja [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório exibida na linha Runtime do prompt do sistema. Se não estiver definida, o OpenClaw detecta automaticamente percorrendo para cima a partir do workspace.

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
- Defina `agents.list[].skills: []` para não ter Skills.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final desse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desativa a criação automática de arquivos bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controla quando arquivos bootstrap do workspace são injetados no prompt do sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos seguros de continuação (após uma resposta concluída do assistente) pulam a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas após Compaction ainda recompõem o contexto.
- `"never"`: desativa a injeção de bootstrap do workspace e de arquivos de contexto em todos os turnos. Use isso apenas para agentes que controlam totalmente seu ciclo de vida de prompt (mecanismos de contexto personalizados, runtimes nativos que constroem seu próprio contexto ou fluxos especializados sem bootstrap). Turnos de Heartbeat e de recuperação por Compaction também pulam a injeção.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo bootstrap do workspace antes de truncar. Padrão: `12000`.

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

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta o aviso uma vez por assinatura única de truncamento (recomendado).
- `"always"`: injeta o aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de responsabilidade do orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
divididos intencionalmente por subsistema em vez de passarem todos por um
único controle genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção bootstrap normal do workspace.
- `agents.defaults.startupContext.*`:
  prelúdio de inicialização de uso único em `/new` e `/reset`, incluindo arquivos
  recentes diários em `memory/*.md`.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos injetados de propriedade do runtime.
- `memory.qmd.limits.*`:
  dimensionamento de trechos e injeção de pesquisa de memória indexada.

Use a substituição correspondente por agente apenas quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado em execuções
simples de `/new` e `/reset`.

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

Padrões compartilhados para superfícies de contexto limitadas do runtime.

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

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes de adicionar
  metadados de truncamento e aviso de continuação.
- `memoryGetDefaultLines`: janela de linhas padrão de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite ativo de resultado de ferramenta usado para resultados persistidos e
  recuperação por overflow.
- `postCompactionMaxChars`: limite de trecho de AGENTS.md usado durante a injeção
  de atualização pós-Compaction.

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

Limite global para a lista compacta de Skills injetada no prompt do sistema. Isso
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

Tamanho máximo em pixels para o maior lado da imagem em blocos de imagem de transcrição/ferramenta antes de chamadas ao provider.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho da carga da requisição em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para carimbos de data/hora das mensagens). Usa como fallback o fuso horário do host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt do sistema. Padrão: `auto` (preferência do SO).

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
      agentRuntime: {
        id: "pi", // pi | auto | id de harness registrado, por exemplo codex
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
  - A forma de string define apenas o model primário.
  - A forma de objeto define o primário mais models ordenados de failover.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de model de visão.
  - Também usado como roteamento de fallback quando o model selecionado/padrão não pode aceitar entrada de imagem.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e por qualquer futura superfície de ferramenta/Plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagem no Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images ou `openai/gpt-image-1.5` para saída OpenAI PNG/WebP com fundo transparente.
  - Se você selecionar diretamente um provider/model, configure também o auth correspondente do provider (por exemplo `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provider com auth. Ele tenta primeiro o provider padrão atual, depois os providers restantes registrados de geração de imagem em ordem de id de provider.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta interna `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provider com auth. Ele tenta primeiro o provider padrão atual, depois os providers restantes registrados de geração de música em ordem de id de provider.
  - Se você selecionar diretamente um provider/model, configure também o auth/API key correspondente do provider.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta interna `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provider com auth. Ele tenta primeiro o provider padrão atual, depois os providers restantes registrados de geração de vídeo em ordem de id de provider.
  - Se você selecionar diretamente um provider/model, configure também o auth/API key correspondente do provider.
  - O provider incluído de geração de vídeo Qwen oferece suporte a até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções no nível do provider para `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de model.
  - Se omitido, a ferramenta PDF recorre a `imageModel` e depois ao model resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verbose padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo `openai/gpt-5.5` para acesso com API key ou `openai-codex/gpt-5.5` para Codex OAuth). Se você omitir o provider, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provider configurado para aquele id exato de model e só então recorre ao provider padrão configurado (comportamento de compatibilidade descontinuado, então prefira `provider/model` explícito). Se esse provider não expuser mais o model padrão configurado, o OpenClaw recorre ao primeiro provider/model configurado em vez de expor um padrão obsoleto de provider removido.
- `models`: o catálogo de models configurado e a lista de permissões para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específico do provider, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provider mesclam os models selecionados do provider nesse mapa e preservam providers não relacionados já configurados.
  - Para models diretos de OpenAI Responses, a Compaction no lado do servidor é ativada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Veja [Compaction no lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão de provider aplicados a todos os models. Defina em `agents.defaults.params` (por exemplo `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (config): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por model), depois `agents.list[].params` (id de agente correspondente) substitui por chave. Veja [Prompt Caching](/pt-BR/reference/prompt-caching) para detalhes.
- `params.extra_body`/`params.extraBody`: JSON avançado de passagem direta mesclado aos corpos de requisição `api: "openai-completions"` para proxies compatíveis com OpenAI. Se houver colisão com chaves de requisição geradas, o corpo extra vence; rotas de completions não nativas ainda removem `store` exclusivo da OpenAI depois disso.
- `params.chat_template_kwargs`: argumentos de modelo de chat do vLLM/OpenAI compatíveis, mesclados aos corpos de requisição de nível superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` com thinking desativado, o OpenClaw envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícito substitui esses padrões, e `extra_body.chat_template_kwargs` ainda tem precedência final.
- `params.preserveThinking`: ativação opcional apenas da Z.AI para thinking preservado. Quando ativado e o thinking está ligado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz `reasoning_content` anterior; veja [thinking e thinking preservado da Z.AI](/pt-BR/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: política padrão de runtime de agente de baixo nível. Se o id for omitido, o padrão é OpenClaw Pi. Use `id: "pi"` para forçar o harness interno PI, `id: "auto"` para permitir que harnesses de Plugin registrados assumam models compatíveis, um id de harness registrado como `id: "codex"` ou um alias compatível de backend CLI como `id: "claude-cli"`. Defina `fallback: "none"` para desativar o fallback automático para PI. Runtimes explícitos de Plugin, como `codex`, falham de forma fechada por padrão, a menos que você defina `fallback: "pi"` no mesmo escopo de substituição. Mantenha refs de model canônicas como `provider/model`; selecione Codex, Claude CLI, Gemini CLI e outros backends de execução por meio da configuração de runtime em vez de prefixos legados de provider em runtime. Veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para entender como isso difere da seleção de provider/model.
- Gravadores de configuração que alteram esses campos (por exemplo `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controla qual executor de baixo nível executa os turnos do agente. A maioria
das implantações deve manter o runtime padrão OpenClaw Pi. Use-o quando um
Plugin confiável fornecer um harness nativo, como o harness app-server Codex incluído,
ou quando você quiser um backend CLI compatível, como Claude CLI. Para o modelo
mental, veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, um id de harness de Plugin registrado ou um alias compatível de backend CLI. O Plugin Codex incluído registra `codex`; o Plugin Anthropic incluído fornece o backend CLI `claude-cli`.
- `fallback`: `"pi"` ou `"none"`. Em `id: "auto"`, o fallback omitido assume `"pi"` para que configurações antigas possam continuar usando PI quando nenhum harness de Plugin assumir uma execução. No modo explícito de runtime de Plugin, como `id: "codex"`, o fallback omitido assume `"none"` para que um harness ausente falhe em vez de usar PI silenciosamente. Substituições de runtime não herdam fallback de um escopo mais amplo; defina `fallback: "pi"` junto com o runtime explícito quando você quiser intencionalmente esse fallback de compatibilidade. Falhas do harness de Plugin selecionado sempre aparecem diretamente.
- Substituições por ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` substitui `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` substitui o fallback para esse processo.
- Para implantações apenas com Codex, defina `model: "openai/gpt-5.5"` e `agentRuntime.id: "codex"`. Você também pode definir `agentRuntime.fallback: "none"` explicitamente para legibilidade; esse é o padrão para runtimes explícitos de Plugin.
- Para implantações com Claude CLI, prefira `model: "anthropic/claude-opus-4-7"` mais `agentRuntime.id: "claude-cli"`. Refs legadas de model como `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade, mas novas configurações devem manter a seleção de provider/model canônica e colocar o backend de execução em `agentRuntime.id`.
- Chaves antigas de política de runtime são regravadas para `agentRuntime` por `openclaw doctor --fix`.
- A escolha do harness é fixada por id de sessão após a primeira execução incorporada. Mudanças de config/env afetam sessões novas ou redefinidas, não uma transcrição existente. Sessões legadas com histórico de transcrição, mas sem fixação registrada, são tratadas como fixadas em PI. `/status` informa o runtime efetivo, por exemplo `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provider/model.

**Atalhos de alias embutidos** (só se aplicam quando o model está em `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` ou `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Seus aliases configurados sempre têm prioridade sobre os padrões.

Models GLM-4.x da Z.AI ativam automaticamente o modo thinking, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Models da Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
Models Claude 4.6 da Anthropic usam `adaptive` como padrão para thinking quando nenhum nível explícito de thinking está definido.

### `agents.defaults.cliBackends`

Backends CLI opcionais para execuções de fallback apenas de texto (sem chamadas de ferramenta). Útil como backup quando providers de API falham.

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
          // Ou use systemPromptFileArg quando a CLI aceitar uma flag de arquivo de prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backends de CLI são text-first; ferramentas ficam sempre desativadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Passagem direta de imagem é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitui todo o prompt de sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou contendo apenas espaços em branco é ignorado. Útil para experimentos controlados de prompt.

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

Sobreposições de prompt independentes de provider aplicadas por família de model. IDs de model da família GPT-5 recebem o contrato compartilhado de comportamento entre providers; `personality` controla apenas a camada de estilo amigável de interação.

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

- `"friendly"` (padrão) e `"on"` ativam a camada de estilo amigável de interação.
- `"off"` desativa apenas a camada amigável; o contrato marcado de comportamento GPT-5 continua ativado.
- O legado `plugins.entries.openai.config.personality` ainda é lido quando essa configuração compartilhada não está definida.

### `agents.defaults.heartbeat`

Execuções periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m desativa
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // padrão: true; false omite a seção Heartbeat do prompt do sistema
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma nova sessão (sem histórico de conversa)
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

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (auth com API key) ou `1h` (auth com OAuth). Defina `0m` para desativar.
- `includeSystemPromptSection`: quando false, omite a seção Heartbeat do prompt do sistema e ignora a injeção de `HEARTBEAT.md` no contexto bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando true, suprime cargas de aviso de erro de ferramenta durante execuções de heartbeat.
- `timeoutSeconds`: tempo máximo, em segundos, permitido para um turno de agente de heartbeat antes de ser abortado. Deixe sem definir para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega em alvo direto. `block` suprime entrega em alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat é executado em uma nova sessão sem histórico anterior de conversa. Mesmo padrão de isolamento de `sessionTarget: "isolated"` do Cron. Reduz o custo de tokens por heartbeat de ~100K para ~2–5K tokens.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **apenas esses agentes** executam heartbeats.
- Heartbeats executam turnos completos do agente — intervalos menores consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id de um Plugin de provider de Compaction registrado (opcional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usado quando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] desativa a reinjeção
        model: "openrouter/anthropic/claude-sonnet-4-6", // substituição opcional de model apenas para Compaction
        notifyUser: true, // envia avisos breves ao usuário quando a Compaction começa e termina (padrão: false)
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

- `mode`: `default` ou `safeguard` (sumarização em blocos para históricos longos). Veja [Compaction](/pt-BR/concepts/compaction).
- `provider`: id de um Plugin de provider de Compaction registrado. Quando definido, `summarize()` do provider é chamado em vez da sumarização LLM interna. Em caso de falha, recorre ao modo interno. Definir um provider força `mode: "safeguard"`. Veja [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: tempo máximo, em segundos, permitido para uma única operação de Compaction antes de o OpenClaw abortá-la. Padrão: `900`.
- `keepRecentTokens`: orçamento de ponto de corte do Pi para manter literalmente a cauda mais recente da transcrição. `/compact` manual respeita isso quando explicitamente definido; caso contrário, a Compaction manual é um checkpoint rígido.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe orientação interna de retenção de identificadores opacos durante a sumarização da Compaction.
- `identifierInstructions`: texto opcional personalizado de preservação de identificadores usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações com nova tentativa em saídas malformadas para resumos do modo safeguard. Ativado por padrão no modo safeguard; defina `enabled: false` para ignorar a auditoria.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjeção após Compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desativar a reinjeção. Quando não definido ou explicitamente definido com esse par padrão, cabeçalhos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional de `provider/model-id` apenas para sumarização da Compaction. Use isso quando a sessão principal deve manter um model, mas os resumos de Compaction devem executar em outro; quando não definido, a Compaction usa o model primário da sessão.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a Compaction começa e quando termina (por exemplo, "Compacting context..." e "Compaction complete"). Desativado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno silencioso e agêntico antes da auto-Compaction para armazenar memórias duráveis. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

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

- `mode: "cache-ttl"` ativa passes de limpeza.
- `ttl` controla com que frequência a limpeza pode executar novamente (após o último toque no cache).
- A limpeza primeiro faz corte suave de resultados grandes de ferramentas e, se necessário, remove completamente resultados mais antigos.

**Corte suave** mantém o começo + o fim e insere `...` no meio.

**Remoção completa** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são cortados/removidos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se existirem menos de `keepLastAssistants` mensagens de assistente, a limpeza é ignorada.

</Accordion>

Veja [Session Pruning](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

### Streaming em blocos

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

- Canais não Telegram exigem `*.blockStreaming: true` explícito para ativar respostas em bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Veja [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento + fragmentação.

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

- Padrões: `instant` para chats diretos/menções, `message` para chats de grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Veja [Indicadores de digitação](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandbox opcional para o agente incorporado. Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

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

- `docker`: runtime local do Docker (padrão)
- `ssh`: runtime remoto genérico com suporte de SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime vão para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados ao OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave de host do OpenSSH

**Precedência de auth SSH:**

- `identityData` tem precedência sobre `identityFile`
- `certificateData` tem precedência sobre `certificateFile`
- `knownHostsData` tem precedência sobre `knownHostsFile`
- Valores `*Data` com suporte de SecretRef são resolvidos a partir do instantâneo ativo do runtime de segredos antes que a sessão sandbox seja iniciada

**Comportamento do backend SSH:**

- inicializa o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente alterações remotas de volta para o host
- não oferece suporte a contêineres de navegador no sandbox

**Acesso ao workspace:**

- `none`: workspace sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace sandbox em `/workspace`, workspace do agente montado somente leitura em `/agent`
- `rw`: workspace do agente montado com leitura/gravação em `/workspace`

**Escopo:**

- `session`: contêiner + workspace por sessão
- `agent`: um contêiner + workspace por agente (padrão)
- `shared`: contêiner e workspace compartilhados (sem isolamento entre sessões)

**Configuração do Plugin OpenShell:**

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
          policy: "strict", // id opcional de política do OpenShell
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

- `mirror`: inicializa o remoto a partir do local antes de `exec`, sincroniza de volta após `exec`; o workspace local permanece canônico
- `remote`: inicializa o remoto uma vez quando o sandbox é criado, depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa inicial.
O transporte é SSH para dentro do sandbox OpenShell, mas o Plugin controla o ciclo de vida do sandbox e a sincronização espelhada opcional.

**`setupCommand`** executa uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, raiz gravável e usuário root.

**Os contêineres usam `network: "none"` por padrão** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (uso emergencial).

**Anexos de entrada** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. A URL do noVNC é injetada no prompt do sistema. Não exige `browser.enabled` em `openclaw.json`.
O acesso de observador noVNC usa auth VNC por padrão e o OpenClaw emite uma URL com token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de direcionarem para o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina como `bridge` apenas quando você quiser explicitamente conectividade global de bridge.
- `cdpSourceRange` opcionalmente restringe a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do navegador em sandbox. Quando definido (incluindo `[]`), substitui `docker.binds` para o contêiner do navegador.
- Os padrões de inicialização estão definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts com contêiner:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
  - `--disable-extensions` (ativado por padrão)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` são
    ativados por padrão e podem ser desativados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reativa extensões se o seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite padrão de processos do Chromium.
  - mais `--no-sandbox` quando `noSandbox` estiver ativado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de navegador personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

Sandbox de navegador e `sandbox.docker.binds` são compatíveis apenas com Docker.

Criar imagens:

```bash
scripts/sandbox-setup.sh           # imagem principal do sandbox
scripts/sandbox-browser-setup.sh   # imagem opcional do navegador
```

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para dar a um agente seu próprio provider de TTS, voz, model,
estilo ou modo de auto-TTS. O bloco do agente faz deep-merge sobre
`messages.tts` global, então credenciais compartilhadas podem ficar em um só lugar, enquanto agentes individuais
substituem apenas os campos de voz ou provider de que precisam. A substituição do
agente ativo se aplica a respostas faladas automáticas, `/tts audio`, `/tts status` e
à ferramenta de agente `tts`. Veja [Text-to-speech](/pt-BR/tools/tts#per-agent-voice-overrides)
para exemplos de provider e precedência.

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
        fastModeDefault: false, // substituição por agente do modo rápido
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // substitui por chave os params correspondentes de defaults.models
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
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

- `id`: id estável do agente (obrigatório).
- `default`: quando vários são definidos, o primeiro vence (um aviso é registrado). Se nenhum for definido, a primeira entrada da lista é o padrão.
- `model`: a forma de string substitui apenas `primary`; a forma de objeto `{ primary, fallbacks }` substitui ambos (`[]` desativa fallbacks globais). Tarefas Cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: params de stream por agente mesclados sobre a entrada de model selecionada em `agents.defaults.models`. Use isto para substituições específicas de agente como `cacheRetention`, `temperature` ou `maxTokens` sem duplicar todo o catálogo de models.
- `tts`: substituições opcionais por agente para text-to-speech. O bloco faz deep-merge sobre `messages.tts`, então mantenha credenciais compartilhadas do provider e política de fallback em `messages.tts` e defina aqui apenas valores específicos da persona, como provider, voz, model, estilo ou modo automático.
- `skills`: lista de permissões opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem Skills.
- `thinkingDefault`: nível padrão opcional de thinking por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para esse agente quando nenhuma substituição por mensagem ou sessão estiver definida. O perfil selecionado de provider/model controla quais valores são válidos; para Google Gemini, `adaptive` mantém o thinking dinâmico controlado pelo provider (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade padrão opcional de reasoning por agente (`on | off | stream`). Aplica-se quando nenhuma substituição de reasoning por mensagem ou sessão estiver definida.
- `fastModeDefault`: padrão opcional por agente para o modo rápido (`true | false`). Aplica-se quando nenhuma substituição de fast mode por mensagem ou sessão estiver definida.
- `agentRuntime`: substituição opcional por agente da política de runtime de baixo nível. Use `{ id: "codex" }` para tornar um agente exclusivo do Codex enquanto outros agentes mantêm o fallback padrão PI no modo `auto`.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões em `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar por padrão sessões de harness ACP.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` a partir de `emoji`, `mentionPatterns` a partir de `name`/`emoji`.
- `subagents.allowAgents`: lista de permissões de ids de agente para `sessions_spawn` (`["*"]` = qualquer um; padrão: apenas o mesmo agente).
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita alvos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

---

## Roteamento Multi-Agent

Execute vários agentes isolados dentro de um único Gateway. Veja [Multi-Agent](/pt-BR/concepts/multi-agent).

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

- `type` (opcional): `route` para roteamento normal (ausência de tipo assume route), `acp` para bindings persistentes de conversa ACP.
- `match.channel` (obrigatório)
- `match.accountId` (opcional; `*` = qualquer conta; omitido = conta padrão)
- `match.peer` (opcional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcional; específico do canal)
- `acp` (opcional; apenas para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (abrangendo todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente em `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve por identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de binding de rota acima.

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

<Accordion title="Ferramentas + workspace somente leitura">

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

<Accordion title="Sem acesso ao sistema de arquivos (apenas mensagens)">

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

Veja [Sandbox & Tools do Multi-Agent](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes de precedência.

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
    parentForkMaxTokens: 100000, // ignora bifurcação de thread pai acima dessa contagem de tokens (0 desativa)
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
      idleHours: 24, // perda automática de foco por inatividade padrão em horas (`0` desativa)
      maxAgeHours: 0, // idade máxima rígida padrão em horas (`0` desativa)
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
- **`dmScope`**: como as DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia ids canônicos para peers com prefixo de provider, para compartilhamento de sessão entre canais.
- **`reset`**: política principal de redefinição. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, vale o que expirar primeiro. A renovação da redefinição diária usa `sessionStartedAt` da linha da sessão; a renovação da redefinição por inatividade usa `lastInteractionAt`. Gravações de sistema/em segundo plano, como heartbeat, reativações do Cron, notificações exec e controle do Gateway, podem atualizar `updatedAt`, mas não mantêm sessões diárias/por inatividade renovadas.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias de `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` permitido na sessão pai ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico da transcrição pai.
  - Defina `0` para desativar essa proteção e sempre permitir a bifurcação do pai.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas agent-to-agent (inteiro, intervalo: `0`–`5`). `0` desativa o encadeamento ping-pong.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira regra de negação vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessão.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: corte por idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`).
  - `rotateBytes`: rotaciona `sessions.json` quando excede esse tamanho (padrão `10mb`).
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. Usa `pruneAfter` por padrão; defina `false` para desativar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após a limpeza do orçamento. Usa `80%` de `maxDiskBytes` por padrão.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a thread.
  - `enabled`: chave mestre padrão (providers podem substituir; o Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: perda automática de foco padrão por inatividade em horas (`0` desativa; providers podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desativa; providers podem substituir)

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
      debounceMs: 2000, // 0 desativa
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

Resolução (o mais específico vence): conta → canal → global. `""` desativa e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de template:**

| Variável          | Descrição                | Exemplo                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Nome curto do model      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do model | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provider         | `anthropic`                 |
| `{thinkingLevel}` | Nível atual de thinking  | `high`, `low`, `off`        |
| `{identity.name}` | Nome de identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias de `{thinkingLevel}`.

### Reação de confirmação

- Usa por padrão `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em canais com suporte a reações, como Slack, Discord, Telegram, WhatsApp e BlueBubbles.
- `messages.statusReactions.enabled`: ativa reações de status do ciclo de vida no Slack, Discord e Telegram.
  No Slack e Discord, deixar sem definir mantém as reações de status ativadas quando reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para ativar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídia/anexos são descarregados imediatamente. Comandos de controle ignoram o debounce.

### TTS (text-to-speech)

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
      providers: {
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
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controla o modo padrão de auto-TTS: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para resumo automático.
- `modelOverrides` é ativado por padrão; `modelOverrides.allowProvider` usa `false` por padrão (ativação opcional).
- API keys usam como fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- Providers de fala incluídos pertencem a Plugins. Se `plugins.allow` estiver definido, inclua cada Plugin de provider TTS que você quiser usar, por exemplo `microsoft` para Edge TTS. O id legado de provider `edge` é aceito como alias de `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint OpenAI TTS. A ordem de resolução é config, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e flexibiliza a validação de model/voz.

---

## Talk

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
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários providers de Talk estiverem configurados.
- Chaves legadas planas de Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) são apenas de compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam como fallback `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica apenas quando nenhuma API key de Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas de Talk usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório do Hugging Face usado pelo helper local MLX do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução MLX no macOS é executada pelo helper incluído `openclaw-mlx-tts` quando presente, ou por um executável no `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do helper para desenvolvimento.
- `speechLocale` define o id de localidade BCP 47 usado pelo reconhecimento de fala do modo Talk no iOS/macOS. Deixe sem definir para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Se não definido, mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuration](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

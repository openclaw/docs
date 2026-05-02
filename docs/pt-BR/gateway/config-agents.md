---
read_when:
    - Ajustando os padrões do agente (modelos, raciocínio, espaço de trabalho, Heartbeat, mídia, Skills)
    - Configurando o roteamento e as vinculações multiagente
    - Ajustando o comportamento de sessão, entrega de mensagens e modo de conversa
summary: Valores padrão de agente, roteamento multiagente, sessão, mensagens e configuração de conversa
title: Configuração — agentes
x-i18n:
    generated_at: "2026-05-02T05:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b27cfb3776d4e770cde4c91543c4ebcf4ca678cc55d689d7b3fbcef1d48c3d1
    source_path: gateway/config-agents.md
    workflow: 16
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do Gateway e outras
chaves de nível superior, consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz opcional do repositório mostrada na linha Runtime do prompt do sistema. Se não for definida, o OpenClaw detecta automaticamente ao subir a partir do workspace.

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
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Omita `agents.defaults.skills` para Skills sem restrição por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhum Skills.
- Uma lista `agents.list[].skills` não vazia é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desativa a criação automática de arquivos de bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignora a criação de arquivos opcionais selecionados do workspace enquanto ainda grava os arquivos de bootstrap obrigatórios. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Controla quando os arquivos de bootstrap do workspace são injetados no prompt do sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos de continuação seguros (após uma resposta concluída do assistente) ignoram a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas pós-Compaction ainda recriam o contexto.
- `"never"`: desativa a injeção de bootstrap do workspace e arquivos de contexto em todos os turnos. Use isto somente para agentes que controlam totalmente o ciclo de vida do próprio prompt (mecanismos de contexto personalizados, runtimes nativos que criam o próprio contexto ou workflows especializados sem bootstrap). Turnos de Heartbeat e de recuperação de Compaction também ignoram a injeção.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo de bootstrap do workspace antes do truncamento. Padrão: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos de bootstrap do workspace. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o texto de aviso visível ao agente quando o contexto de bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso no prompt do sistema.
- `"once"`: injeta o aviso uma vez por assinatura única de truncamento (recomendado).
- `"always"`: injeta o aviso em toda execução quando houver truncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propriedade do orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
divididos intencionalmente por subsistema em vez de todos passarem por um único
controle genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção normal de bootstrap do workspace.
- `agents.defaults.startupContext.*`:
  preâmbulo único de execução do modelo em reset/inicialização, incluindo arquivos
  `memory/*.md` diários recentes. Comandos de chat simples `/new` e `/reset` são
  confirmados sem invocar o modelo.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos injetados pertencentes ao runtime.
- `memory.qmd.limits.*`:
  dimensionamento de trecho e injeção de busca de memória indexada.

Use a substituição correspondente por agente somente quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o preâmbulo de inicialização do primeiro turno injetado em execuções do modelo de reset/inicialização.
Comandos de chat simples `/new` e `/reset` confirmam o reset sem invocar
o modelo, portanto não carregam este preâmbulo.

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

Padrões compartilhados para superfícies limitadas de contexto de runtime.

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

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes que os
  metadados de truncamento e o aviso de continuação sejam adicionados.
- `memoryGetDefaultLines`: janela padrão de linhas de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite de resultado de ferramenta ao vivo usado para resultados persistidos e
  recuperação de estouro.
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

Limite global para a lista compacta de Skills injetada no prompt do sistema. Isto
não afeta a leitura de arquivos `SKILL.md` sob demanda.

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

Substituição por agente para o orçamento de prompt de Skills.

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

Tamanho máximo em pixels para o maior lado da imagem em blocos de imagem de transcrição/ferramenta antes de chamadas ao provedor.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload de solicitação em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para timestamps de mensagens). Usa o fuso horário do host como fallback.

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
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
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
  - A forma de string define apenas o modelo primário.
  - A forma de objeto define o primário mais modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não consegue aceitar entrada de imagem.
  - Prefira referências explícitas `provider/model`. IDs simples são aceitos por compatibilidade; se um ID simples corresponder de forma única a uma entrada configurada com suporte a imagem em `models.providers.*.models`, o OpenClaw o qualifica para esse provedor. Correspondências configuradas ambíguas exigem um prefixo de provedor explícito.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e por qualquer superfície futura de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagens do Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, ou `openai/gpt-image-1.5` para saída PNG/WebP da OpenAI com fundo transparente.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação do provedor correspondente (por exemplo, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagens na ordem de id de provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música na ordem de id de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API do provedor correspondente.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo na ordem de id de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API do provedor correspondente.
  - O provedor de geração de vídeo Qwen incluído oferece suporte a até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, 10 segundos de duração e opções de nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF faz fallback para `imageModel` e depois para o modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas considerado pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verboso padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `reasoningDefault`: visibilidade padrão de raciocínio para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente substitui esse padrão. Padrões de raciocínio configurados são aplicados apenas para proprietários, remetentes autorizados ou contextos de Gateway de administrador-operador quando nenhuma substituição de raciocínio por mensagem ou sessão está definida.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo, `openai/gpt-5.5` para acesso por chave de API ou `openai-codex/gpt-5.5` para Codex OAuth). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse id de modelo exato e só então faz fallback para o provedor padrão configurado (comportamento de compatibilidade obsoleto, então prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw faz fallback para o primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.
- `models`: o catálogo de modelos configurado e a lista de permissões para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provedor mesclam modelos do provedor selecionado nesse mapa e preservam provedores não relacionados já configurados.
  - Para modelos diretos OpenAI Responses, a Compaction no lado do servidor é ativada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Consulte [Compaction no lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão de provedor aplicados a todos os modelos. Definido em `agents.defaults.params` (por exemplo, `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo), então `agents.list[].params` (id de agente correspondente) substitui por chave. Consulte [Cache de prompts](/pt-BR/reference/prompt-caching) para obter detalhes.
- `params.extra_body`/`params.extraBody`: JSON avançado de passagem direta mesclado em corpos de requisição `api: "openai-completions"` para proxies compatíveis com OpenAI. Se ele colidir com chaves de requisição geradas, o corpo extra vence; rotas de completions não nativas ainda removem `store` exclusivo da OpenAI depois.
- `params.chat_template_kwargs`: argumentos de modelo de chat compatíveis com vLLM/OpenAI mesclados em corpos de requisição `api: "openai-completions"` de nível superior. Para `vllm/nemotron-3-*` com pensamento desligado, o Plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícito substitui padrões gerados, e `extra_body.chat_template_kwargs` ainda tem precedência final. Para controles de pensamento Qwen do vLLM, defina `params.qwenThinkingFormat` como `"chat-template"` ou `"top-level"` nessa entrada de modelo.
- `compat.supportedReasoningEfforts`: lista de esforço de raciocínio compatível com OpenAI por modelo. Inclua `"xhigh"` para endpoints personalizados que realmente o aceitam; o OpenClaw então expõe `/think xhigh` nos menus de comandos, linhas de sessão do Gateway, validação de patch de sessão, validação de CLI de agente e validação de `llm-task` para esse provedor/modelo configurado. Use `compat.reasoningEffortMap` quando o backend quiser um valor específico do provedor para um nível canônico.
- `params.preserveThinking`: opção exclusiva da Z.AI para preservação do pensamento. Quando ativada e o pensamento está ligado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz `reasoning_content` anterior; consulte [Pensamento da Z.AI e pensamento preservado](/pt-BR/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: política padrão de runtime de agente de baixo nível. Id omitido usa OpenClaw Pi como padrão. Use `id: "pi"` para forçar o executor PI integrado, `id: "auto"` para permitir que executores de Plugin registrados reivindiquem modelos compatíveis, um id de executor registrado como `id: "codex"`, ou um alias de backend de CLI compatível como `id: "claude-cli"`. Defina `fallback: "none"` para desativar o fallback automático para PI. Runtimes de Plugin explícitos como `codex` falham de forma fechada por padrão, a menos que você defina `fallback: "pi"` no mesmo escopo de substituição. Mantenha referências de modelo canônicas como `provider/model`; selecione Codex, Claude CLI, Gemini CLI e outros backends de execução por meio da configuração de runtime em vez de prefixos legados de provedor de runtime. Consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para entender como isso difere da seleção de provedor/modelo.
- Gravadores de configuração que alteram esses campos (por exemplo, `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma de objeto canônica e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agentes entre sessões (cada sessão ainda é serializada). Padrão: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controla qual executor de baixo nível executa turnos de agente. A maioria das
implantações deve manter o runtime padrão OpenClaw Pi. Use-o quando um Plugin confiável
fornece um executor nativo, como o executor de app-server Codex incluído,
ou quando você quer um backend de CLI compatível, como Claude CLI. Para o modelo mental,
consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, um id de executor de Plugin registrado ou um alias de backend de CLI compatível. O Plugin Codex incluído registra `codex`; o Plugin Anthropic incluído fornece o backend de CLI `claude-cli`.
- `fallback`: `"pi"` ou `"none"`. Em `id: "auto"`, fallback omitido usa `"pi"` como padrão para que configurações antigas possam continuar usando PI quando nenhum executor de Plugin reivindicar uma execução. No modo de runtime de Plugin explícito, como `id: "codex"`, fallback omitido usa `"none"` como padrão para que a ausência de executor falhe em vez de usar PI silenciosamente. Substituições de runtime não herdam fallback de um escopo mais amplo; defina `fallback: "pi"` junto com o runtime explícito quando você quiser intencionalmente esse fallback de compatibilidade. Falhas do executor de Plugin selecionado sempre são expostas diretamente.
- Substituições de ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` substitui `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` substitui fallback para esse processo.
- Para implantações somente Codex, defina `model: "openai/gpt-5.5"` e `agentRuntime.id: "codex"`. Você também pode definir `agentRuntime.fallback: "none"` explicitamente para legibilidade; esse é o padrão para runtimes de Plugin explícitos.
- Para implantações Claude CLI, prefira `model: "anthropic/claude-opus-4-7"` mais `agentRuntime.id: "claude-cli"`. Referências legadas de modelo `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo canônica e colocar o backend de execução em `agentRuntime.id`.
- Chaves de política de runtime mais antigas são reescritas para `agentRuntime` por `openclaw doctor --fix`.
- A escolha de executor é fixada por id de sessão após a primeira execução embutida. Alterações de configuração/ambiente afetam sessões novas ou redefinidas, não uma transcrição existente. Sessões legadas com histórico de transcrição, mas sem pin registrado, são tratadas como fixadas em PI. `/status` relata o runtime efetivo, por exemplo `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Atalhos integrados de alias** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` ou `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Seus aliases configurados sempre prevalecem sobre os padrões.

Modelos Z.AI GLM-4.x ativam automaticamente o modo de raciocínio, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
Modelos Anthropic Claude 4.6 usam `adaptive` como padrão de raciocínio quando nenhum nível explícito de raciocínio é definido.

### `agents.defaults.cliBackends`

Backends CLI opcionais para execuções de fallback somente texto (sem chamadas de ferramenta). Úteis como backup quando provedores de API falham.

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
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backends CLI priorizam texto; ferramentas estão sempre desativadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Encaminhamento de imagens é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitua todo o prompt de sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou somente com espaços em branco é ignorado. Útil para experimentos controlados de prompt.

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

Sobreposições de prompt independentes de provedor aplicadas por família de modelos. IDs de modelos da família GPT-5 recebem o contrato de comportamento compartilhado entre provedores; `personality` controla apenas a camada de estilo de interação amigável.

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

- `"friendly"` (padrão) e `"on"` ativam a camada de estilo de interação amigável.
- `"off"` desativa apenas a camada amigável; o contrato de comportamento GPT-5 marcado permanece ativado.
- O `plugins.entries.openai.config.personality` legado ainda é lido quando esta configuração compartilhada não está definida.

### `agents.defaults.heartbeat`

Execuções periódicas de Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: string de duração (ms/s/m/h). Padrão: `30m` (autenticação por chave de API) ou `1h` (autenticação OAuth). Defina como `0m` para desativar.
- `includeSystemPromptSection`: quando falso, omite a seção Heartbeat do prompt de sistema e pula a injeção de `HEARTBEAT.md` no contexto de bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando verdadeiro, suprime payloads de aviso de erro de ferramenta durante execuções de Heartbeat.
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de Heartbeat antes que ele seja abortado. Deixe indefinido para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega para destino direto. `block` suprime a entrega para destino direto e emite `reason=dm-blocked`.
- `lightContext`: quando verdadeiro, execuções de Heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando verdadeiro, cada Heartbeat é executado em uma sessão nova, sem histórico de conversa anterior. Mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz o custo de tokens por Heartbeat de ~100K para ~2-5K tokens.
- `skipWhenBusy`: quando verdadeiro, execuções de Heartbeat são adiadas em trilhas ocupadas extras: trabalho de subagente ou comando aninhado. Trilhas Cron sempre adiam Heartbeats, mesmo sem esta flag.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam Heartbeats.
- Heartbeats executam turnos completos de agente — intervalos mais curtos consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
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
- `provider`: ID de um Plugin provedor de Compaction registrado. Quando definido, o `summarize()` do provedor é chamado em vez da sumarização LLM integrada. Em caso de falha, volta para a opção integrada. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitido para uma única operação de Compaction antes que o OpenClaw a aborte. Padrão: `900`.
- `keepRecentTokens`: orçamento de ponto de corte do Pi para manter literalmente a cauda mais recente da transcrição. `/compact` manual respeita isso quando definido explicitamente; caso contrário, a Compaction manual é um checkpoint rígido.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe a orientação integrada de retenção de identificadores opacos durante a sumarização de Compaction.
- `identifierInstructions`: texto personalizado opcional de preservação de identificadores usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações de tentar novamente em saída malformada para resumos de safeguard. Ativado por padrão no modo safeguard; defina `enabled: false` para pular a auditoria.
- `midTurnPrecheck`: verificação opcional de pressão do loop de ferramentas do Pi. Quando `enabled: true`, o OpenClaw verifica a pressão de contexto depois que resultados de ferramentas são anexados e antes da próxima chamada ao modelo. Se o contexto não couber mais, ele aborta a tentativa atual antes de enviar o prompt e reutiliza o caminho de recuperação de pré-verificação existente para truncar resultados de ferramentas ou compactar e tentar novamente. Funciona com os modos de Compaction `default` e `safeguard`. Padrão: desativado.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjetar após a Compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desativar a reinjeção. Quando indefinido ou explicitamente definido para esse par padrão, títulos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` somente para sumarização de Compaction. Use isto quando a sessão principal deve manter um modelo, mas os resumos de Compaction devem ser executados em outro; quando indefinido, a Compaction usa o modelo primário da sessão.
- `maxActiveTranscriptBytes`: limite opcional em bytes (`number` ou strings como `"20mb"`) que aciona Compaction local normal antes de uma execução quando o JSONL ativo ultrapassa o limite. Requer `truncateAfterCompaction` para que uma Compaction bem-sucedida possa rotacionar para uma transcrição sucessora menor. Desativado quando indefinido ou `0`.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a Compaction começa e quando é concluída (por exemplo, "Compactando contexto..." e "Compaction concluída"). Desativado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno agêntico silencioso antes da Compaction automática para armazenar memórias duráveis. Defina `model` como um provedor/modelo exato, como `ollama/qwen3:8b`, quando este turno de manutenção deve permanecer em um modelo local; a substituição não herda a cadeia de fallback da sessão ativa. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico de sessão em disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="comportamento do modo cache-ttl">

- `mode: "cache-ttl"` ativa passagens de poda.
- `ttl` controla com que frequência a poda pode ser executada novamente (após o último toque no cache).
- A poda primeiro faz corte suave em resultados de ferramentas grandes demais e, depois, limpeza rígida de resultados de ferramentas mais antigos se necessário.

**Corte suave** mantém o início + fim e insere `...` no meio.

**Limpeza rígida** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são cortados/limpos.
- Razões são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se houver menos de `keepLastAssistants` mensagens de assistente, a poda é ignorada.

</Accordion>

Consulte [Poda de Sessão](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

### Streaming de blocos

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

- Canais que não são Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500 ms. Substituição por agente: `agents.list[].humanDelay`.

Veja [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento e divisão em partes.

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

- Padrões: `instant` para conversas diretas/menções, `message` para conversas em grupo sem menção.
- Substituições por sessão: `session.typingMode`, `session.typingIntervalSeconds`.

Veja [Indicadores de digitação](/pt-BR/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opcional para o agente incorporado. Veja [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

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
          // SecretRefs / inline contents also supported:
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

**Back-end:**

- `docker`: runtime local do Docker (padrão)
- `ssh`: runtime remoto genérico baseado em SSH
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime passam para
`plugins.entries.openshell.config`.

**Configuração do back-end SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados para o OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos embutidos ou SecretRefs que o OpenClaw materializa em arquivos temporários em tempo de execução
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` vence `identityFile`
- `certificateData` vence `certificateFile`
- `knownHostsData` vence `knownHostsFile`
- Valores `*Data` baseados em SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes que a sessão de sandbox comece

**Comportamento do back-end SSH:**

- popula o workspace remoto uma vez após criação ou recriação
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia por SSH
- não sincroniza automaticamente alterações remotas de volta para o host
- não oferece suporte a contêineres de navegador em sandbox

**Acesso ao workspace:**

- `none`: workspace de sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace de sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
- `rw`: workspace do agente montado como leitura/gravação em `/workspace`

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modo OpenShell:**

- `mirror`: popula o remoto a partir do local antes do exec, sincroniza de volta após o exec; o workspace local permanece canônico
- `remote`: popula o remoto uma vez quando o sandbox é criado e depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de população.
O transporte é SSH para o sandbox OpenShell, mas o Plugin é responsável pelo ciclo de vida do sandbox e pela sincronização espelhada opcional.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Precisa de saída de rede, raiz gravável e usuário root.

**Contêineres usam `network: "none"` por padrão** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (último recurso).

**Anexos de entrada** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL noVNC injetada no prompt do sistema. Não exige `browser.enabled` em `openclaw.json`.
O acesso de observador noVNC usa autenticação VNC por padrão, e o OpenClaw emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) impede que sessões em sandbox direcionem o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina como `bridge` somente quando quiser explicitamente conectividade bridge global.
- `cdpSourceRange` restringe opcionalmente a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner de navegador em sandbox. Quando definido (incluindo `[]`), ele substitui `docker.binds` para o contêiner do navegador.
- Os padrões de inicialização são definidos em `scripts/sandbox-browser-entrypoint.sh` e ajustados para hosts de contêiner:
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
  - `--disable-extensions` (habilitado por padrão)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` são
    habilitados por padrão e podem ser desabilitados com
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se o seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processos padrão do Chromium.
  - mais `--no-sandbox` quando `noSandbox` estiver habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de navegador personalizada com um
    ponto de entrada personalizado para alterar os padrões do contêiner.

</Accordion>

Sandboxing de navegador e `sandbox.docker.binds` funcionam somente com Docker.

Crie imagens (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalações npm sem um checkout do código-fonte, veja [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` embutidos.

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para dar a um agente seu próprio provedor de TTS, voz, modelo,
estilo ou modo de TTS automático. O bloco do agente faz mesclagem profunda sobre
`messages.tts`, para que credenciais compartilhadas possam ficar em um só lugar enquanto agentes
individuais substituem apenas os campos de voz ou provedor de que precisam. A substituição do agente ativo
se aplica a respostas faladas automáticas, `/tts audio`, `/tts status` e
à ferramenta de agente `tts`. Veja [Texto para fala](/pt-BR/tools/tts#per-agent-voice-overrides)
para exemplos de provedores e precedência.

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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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
- `default`: quando vários são definidos, o primeiro vence (aviso registrado). Se nenhum for definido, a primeira entrada da lista será o padrão.
- `model`: o formato de string define um primário estrito por agente sem fallback de modelo; o formato de objeto `{ primary }` também é estrito, a menos que você adicione `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar fallback para esse agente, ou `{ primary, fallbacks: [] }` para tornar explícito o comportamento estrito. Tarefas Cron que sobrescrevem apenas `primary` ainda herdam os fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isto para sobrescritas específicas do agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `tts`: sobrescritas opcionais de texto para fala por agente. O bloco faz uma mesclagem profunda sobre `messages.tts`, então mantenha credenciais compartilhadas de provedor e política de fallback em `messages.tts` e defina aqui apenas valores específicos da persona, como provedor, voz, modelo, estilo ou modo automático.
- `skills`: allowlist opcional de Skills por agente. Se omitido, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem Skills.
- `thinkingDefault`: nível de raciocínio padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sobrescreve `agents.defaults.thinkingDefault` para este agente quando nenhuma sobrescrita por mensagem ou sessão estiver definida. O perfil de provedor/modelo selecionado controla quais valores são válidos; para Google Gemini, `adaptive` mantém o raciocínio dinâmico controlado pelo provedor (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade padrão opcional de raciocínio por agente (`on | off | stream`). Sobrescreve `agents.defaults.reasoningDefault` para este agente quando nenhuma sobrescrita de raciocínio por mensagem ou sessão estiver definida.
- `fastModeDefault`: padrão opcional por agente para modo rápido (`true | false`). Aplica-se quando nenhuma sobrescrita de modo rápido por mensagem ou sessão estiver definida.
- `agentRuntime`: sobrescrita opcional por agente da política de runtime de baixo nível. Use `{ id: "codex" }` para tornar um agente exclusivo do Codex enquanto outros agentes mantêm o fallback padrão para PI no modo `auto`.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar sessões de harness ACP por padrão.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agente para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = qualquer um; padrão: apenas o mesmo agente). Inclua o id do solicitante quando chamadas `agentId` direcionadas ao próprio agente devem ser permitidas.
- Guarda de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando verdadeiro, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: falso).

---

## Roteamento multiagente

Execute vários agentes isolados dentro de um Gateway. Consulte [Multiagente](/pt-BR/concepts/multi-agent).

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
- `match.guildId` / `match.teamId` (opcional; específico do canal)
- `acp` (opcional; somente para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (em todo o canal)
6. Agente padrão

Dentro de cada camada, a primeira entrada correspondente de `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de camadas de binding de rota acima.

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

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para detalhes de precedência.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detalhes dos campos de sessão">

- **`scope`**: estratégia base de agrupamento de sessões para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use somente quando o contexto compartilhado for intencional).
- **`dmScope`**: como as DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por id do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia ids canônicos para pares com prefixo de provedor para compartilhamento de sessão entre canais. Comandos de acoplamento como `/dock_discord` usam o mesmo mapa para alternar a rota de resposta da sessão ativa para outro par de canal vinculado; veja [Acoplamento de canais](/pt-BR/concepts/channel-docking).
- **`reset`**: política principal de redefinição. `daily` redefine no horário local de `atHour`; `idle` redefine após `idleMinutes`. Quando ambos são configurados, vence o que expirar primeiro. A atualização da redefinição diária usa o `sessionStartedAt` da linha da sessão; a atualização da redefinição por inatividade usa `lastInteractionAt`. Gravações em segundo plano/eventos do sistema, como heartbeat, despertares de cron, notificações de execução e registros administrativos do gateway, podem atualizar `updatedAt`, mas não mantêm sessões diárias/por inatividade atualizadas.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias para `direct`.
- **`parentForkMaxTokens`**: máximo de `totalTokens` da sessão pai permitido ao criar uma sessão de thread bifurcada (padrão `100000`).
  - Se o `totalTokens` do pai estiver acima desse valor, o OpenClaw inicia uma nova sessão de thread em vez de herdar o histórico de transcrição do pai.
  - Defina `0` para desativar essa proteção e sempre permitir bifurcação a partir do pai.
- **`mainKey`**: campo legado. Em tempo de execução, sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas de agente para agente (inteiro, intervalo: `0`–`5`). `0` desativa o encadeamento ping-pong.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação vence.
- **`maintenance`**: limpeza do armazenamento de sessões + controles de retenção.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`). Em tempo de execução, a limpeza em lote é gravada com um pequeno buffer de limite alto para tetos de tamanho de produção; `openclaw sessions cleanup --enforce` aplica o teto imediatamente.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` o remove de configurações antigas.
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. O padrão é `pruneAfter`; defina `false` para desativar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após a limpeza do orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculada a thread.
  - `enabled`: chave padrão mestre (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desfoco automático padrão por inatividade em horas (`0` desativa; provedores podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desativa; provedores podem substituir)

</Accordion>

---

## Mensagens

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
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

**Variáveis de modelo:**

| Variável          | Descrição               | Exemplo                     |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo    | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor        | `anthropic`                 |
| `{thinkingLevel}` | Nível de raciocínio atual | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- O padrão é o `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em canais com suporte a reações, como Slack, Discord, Telegram, WhatsApp e BlueBubbles.
- `messages.statusReactions.enabled`: habilita reações de status do ciclo de vida no Slack, Discord e Telegram.
  No Slack e no Discord, deixar indefinido mantém as reações de status habilitadas quando as reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para habilitar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídias/anexos disparam o envio imediatamente. Comandos de controle ignoram o debounce.

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

- `auto` controla o modo padrão de TTS automático: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para resumo automático.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa `false` por padrão (opt-in).
- Chaves de API usam fallback para `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- Provedores de fala incluídos são de propriedade do Plugin. Se `plugins.allow` estiver definido, inclua cada Plugin de provedor TTS que você quer usar, por exemplo `microsoft` para Edge TTS. O id legado do provedor `edge` é aceito como alias para `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint TTS da OpenAI. A ordem de resolução é configuração, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e relaxa a validação de modelo/voz.

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

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores Talk estiverem configurados.
- Chaves Talk planas legadas (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existem apenas por compatibilidade e são migradas automaticamente para `talk.providers.<provider>`.
- IDs de voz usam fallback para `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto claro ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica somente quando nenhuma chave de API Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas Talk usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório do Hugging Face usado pelo auxiliar MLX local do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução MLX no macOS passa pelo auxiliar `openclaw-mlx-tts` incluído quando presente, ou por um executável em `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do auxiliar para desenvolvimento.
- `speechLocale` define o id de localidade BCP 47 usado pelo reconhecimento de fala Talk no iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla por quanto tempo o modo Talk aguarda após o silêncio do usuário antes de enviar a transcrição. Deixar indefinido mantém a janela de pausa padrão da plataforma (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

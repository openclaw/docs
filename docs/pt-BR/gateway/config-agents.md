---
read_when:
    - Ajustando os padrões do agente (modelos, raciocínio, espaço de trabalho, Heartbeat, mídia, Skills)
    - Configurando o roteamento e as vinculações de múltiplos agentes
    - Ajustando o comportamento de sessão, entrega de mensagens e modo de conversa
summary: Padrões do agente, roteamento multiagente, sessão, mensagens e configuração de conversa
title: Configuração — agentes
x-i18n:
    generated_at: "2026-05-12T12:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do gateway e outras
chaves de nível superior, consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Raiz de repositório opcional mostrada na linha Runtime do prompt do sistema. Se não definida, o OpenClaw detecta automaticamente percorrendo para cima a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist padrão opcional de Skills para agentes que não definem
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

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final desse agente; ela
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

- `"continuation-skip"`: turnos de continuação seguros (após uma resposta concluída do assistente) pulam a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas pós-Compaction ainda reconstroem o contexto.
- `"never"`: desativa o bootstrap do workspace e a injeção de arquivos de contexto em todos os turnos. Use isso somente para agentes que controlam totalmente o ciclo de vida do próprio prompt (mecanismos de contexto personalizados, runtimes nativos que criam o próprio contexto ou fluxos de trabalho especializados sem bootstrap). Turnos de Heartbeat e de recuperação de Compaction também pulam a injeção.

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

Máximo total de caracteres injetados entre todos os arquivos de bootstrap do workspace. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o aviso visível para o agente no prompt do sistema quando o contexto de bootstrap é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso de truncamento no prompt do sistema.
- `"once"`: injeta um aviso conciso uma vez por assinatura de truncamento única (recomendado).
- `"always"`: injeta um aviso conciso em cada execução quando há truncamento.

Contagens brutas/injetadas detalhadas e campos de ajuste de configuração permanecem em diagnósticos como
relatórios de contexto/status e logs; o contexto rotineiro de usuário/runtime do WebChat recebe apenas
o aviso conciso de recuperação.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa de propriedade do orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
intencionalmente divididos por subsistema em vez de todos passarem por um único
controle genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção normal de bootstrap do workspace.
- `agents.defaults.startupContext.*`:
  prelúdio de execução de modelo único em redefinição/inicialização, incluindo arquivos
  `memory/*.md` diários recentes. Comandos de chat simples `/new` e `/reset` são
  reconhecidos sem invocar o modelo.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos de propriedade do runtime injetados.
- `memory.qmd.limits.*`:
  dimensionamento de snippet de pesquisa de memória indexada e injeção.

Use a substituição correspondente por agente somente quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado em execuções de modelo de redefinição/inicialização.
Comandos de chat simples `/new` e `/reset` reconhecem a redefinição sem invocar
o modelo, portanto não carregam este prelúdio.

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

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes que metadados de truncamento
  e aviso de continuação sejam adicionados.
- `memoryGetDefaultLines`: janela de linhas padrão de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite de resultado de ferramenta ao vivo usado para resultados persistidos e
  recuperação de overflow.
- `postCompactionMaxChars`: limite de trecho de AGENTS.md usado durante a injeção de atualização
  pós-Compaction.

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

Tamanho máximo em pixels para o maior lado da imagem em blocos de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Padrão: `1200`.

Valores mais baixos normalmente reduzem o uso de tokens de visão e o tamanho do payload da requisição em execuções com muitas capturas de tela.
Valores mais altos preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não carimbos de data/hora de mensagens). Recorre ao fuso horário do host.

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
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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
  - A forma de string define apenas o modelo principal.
  - A forma de objeto define o modelo principal mais modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não aceita entrada de imagem.
  - Prefira refs `provider/model` explícitas. IDs simples são aceitos por compatibilidade; se um ID simples corresponder exclusivamente a uma entrada configurada com suporte a imagens em `models.providers.*.models`, o OpenClaw o qualifica para esse provedor. Correspondências configuradas ambíguas exigem um prefixo de provedor explícito.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e qualquer superfície futura de ferramenta/plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagens do Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images ou `openai/gpt-image-1.5` para saída OpenAI PNG/WebP com fundo transparente.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação de provedor correspondente (por exemplo, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores registrados de geração de imagens em ordem de ID de provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores registrados de geração de música em ordem de ID de provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API do provedor correspondente.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores registrados de geração de vídeo em ordem de ID de provedor.
  - Se você selecionar diretamente um provedor/modelo, configure também a autenticação/chave de API do provedor correspondente.
  - O provedor integrado de geração de vídeo Qwen aceita até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, 10 segundos de duração e opções de nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF recorre a `imageModel` e depois ao modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível verboso padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `toolProgressDetail`: modo de detalhe para resumos de ferramentas de `/verbose` e linhas de ferramenta em rascunho de progresso. Valores: `"explain"` (padrão, rótulos humanos compactos) ou `"raw"` (anexa comando/detalhe bruto quando disponível). `agents.list[].toolProgressDetail` por agente substitui esse padrão.
- `reasoningDefault`: visibilidade padrão de raciocínio para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente substitui esse padrão. Padrões de raciocínio configurados só são aplicados para proprietários, remetentes autorizados ou contextos de Gateway de administrador operador quando nenhuma substituição de raciocínio por mensagem ou sessão está definida.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo, `openai/gpt-5.5` para acesso por chave de API da OpenAI ou Codex OAuth). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência exclusiva de provedor configurado para esse ID de modelo exato, e só então recorre ao provedor padrão configurado (comportamento de compatibilidade obsoleto, portanto prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido.
- `models`: o catálogo de modelos configurado e a lista de permissões para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específico do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Use entradas `provider/*`, como `"openai-codex/*": {}` ou `"vllm/*": {}`, para mostrar todos os modelos descobertos para provedores selecionados sem listar manualmente cada ID de modelo.
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provedor mesclam modelos de provedor selecionados nesse mapa e preservam provedores não relacionados já configurados.
  - Para modelos OpenAI Responses diretos, a Compaction do lado do servidor é habilitada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Consulte [Compaction do lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão de provedor aplicados a todos os modelos. Defina em `agents.defaults.params` (por exemplo, `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo), então `agents.list[].params` (ID de agente correspondente) substitui por chave. Consulte [Cache de prompts](/pt-BR/reference/prompt-caching) para obter detalhes.
- `params.extra_body`/`params.extraBody`: JSON avançado de repasse mesclado em corpos de requisição `api: "openai-completions"` para proxies compatíveis com OpenAI. Se houver conflito com chaves de requisição geradas, o corpo extra vence; rotas de completions não nativas ainda removem `store` exclusivo da OpenAI depois.
- `params.chat_template_kwargs`: argumentos de template de chat compatíveis com vLLM/OpenAI mesclados em corpos de requisição `api: "openai-completions"` de nível superior. Para `vllm/nemotron-3-*` com thinking desativado, o plugin vLLM integrado envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícito substitui os padrões gerados, e `extra_body.chat_template_kwargs` ainda tem precedência final. Para controles de thinking do vLLM Qwen, defina `params.qwenThinkingFormat` como `"chat-template"` ou `"top-level"` nessa entrada de modelo.
- `compat.thinkingFormat`: estilo de payload de thinking compatível com OpenAI. Use `"qwen"` para `enable_thinking` de nível superior no estilo Qwen, ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em backends da família Qwen que aceitam kwargs de template de chat em nível de requisição, como vLLM. O OpenClaw mapeia thinking desativado para `false` e thinking ativado para `true`.
- `compat.supportedReasoningEfforts`: lista de esforços de raciocínio compatíveis com OpenAI por modelo. Inclua `"xhigh"` para endpoints personalizados que realmente o aceitem; então o OpenClaw expõe `/think xhigh` em menus de comando, linhas de sessão do Gateway, validação de patch de sessão, validação da CLI de agente e validação de `llm-task` para esse provedor/modelo configurado. Use `compat.reasoningEffortMap` quando o backend exigir um valor específico do provedor para um nível canônico.
- `params.preserveThinking`: opção exclusiva da Z.AI para preservar thinking. Quando habilitada e thinking está ativado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz `reasoning_content` anterior; consulte [thinking da Z.AI e thinking preservado](/pt-BR/providers/zai#thinking-and-preserved-thinking).
- `localService`: gerenciador opcional de processo em nível de provedor para servidores de modelo locais/auto-hospedados. Quando o modelo selecionado pertence a esse provedor, o OpenClaw verifica `healthUrl` (ou `baseUrl + "/models"`), inicia `command` com `args` se o endpoint estiver fora do ar, aguarda até `readyTimeoutMs` e então envia a requisição de modelo. `command` deve ser um caminho absoluto. `idleStopMs: 0` mantém o processo ativo até o OpenClaw sair; um valor positivo interrompe o processo iniciado pelo OpenClaw depois dessa quantidade de milissegundos ociosos. Consulte [Serviços de modelo locais](/pt-BR/gateway/local-model-services).
- A política de runtime pertence a provedores ou modelos, não a `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para regras em todo o provedor ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para regras específicas de modelo. Modelos de agente OpenAI no provedor oficial da OpenAI selecionam o Codex por padrão.
- Gravadores de configuração que alteram esses campos (por exemplo, `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma de objeto canônica e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agentes entre sessões (cada sessão ainda é serializada). Padrão: 4.

### Política de runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, um ID de harness de plugin registrado ou um alias de backend de CLI compatível. O plugin Codex integrado registra `codex`; o plugin Anthropic integrado fornece o backend de CLI `claude-cli`.
- `id: "auto"` permite que harnesses de plugin registrados reivindiquem turnos compatíveis e usa PI quando nenhum harness corresponde. Um runtime de plugin explícito como `id: "codex"` exige esse harness e falha de modo fechado se ele estiver indisponível ou falhar.
- Chaves de runtime do agente inteiro são legadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, pins de runtime de sessão e `OPENCLAW_AGENT_RUNTIME` são ignorados pela seleção de runtime. Execute `openclaw doctor --fix` para remover valores obsoletos.
- Modelos de agente OpenAI usam o harness Codex por padrão; `agentRuntime.id: "codex"` de provedor/modelo continua válido quando você quiser explicitar isso.
- Para implantações Claude CLI, prefira `model: "anthropic/claude-opus-4-7"` mais `agentRuntime.id: "claude-cli"` com escopo de modelo. Refs de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo canônica e colocar o backend de execução na política de runtime de provedor/modelo.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Atalhos de alias integrados** (aplicam-se somente quando o modelo está em `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Seus aliases configurados sempre têm precedência sobre os padrões.

Modelos Z.AI GLM-4.x ativam automaticamente o modo de pensamento, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramentas. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
Modelos Anthropic Claude 4.6 usam por padrão o pensamento `adaptive` quando nenhum nível de pensamento explícito está definido.

### `agents.defaults.cliBackends`

Backends de CLI opcionais para execuções de fallback somente texto (sem chamadas de ferramentas). Útil como backup quando provedores de API falham.

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

- Backends de CLI priorizam texto; ferramentas ficam sempre desativadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Passagem direta de imagens é compatível quando `imageArg` aceita caminhos de arquivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que um backend recupere sessões invalidadas seguras
  a partir de uma cauda limitada de transcrição bruta do OpenClaw antes que
  exista o primeiro resumo de Compaction. Alterações de perfil de autenticação ou de época de credenciais
  ainda nunca fazem reseed bruto.

### `agents.defaults.systemPromptOverride`

Substitua todo o prompt de sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou contendo apenas espaços em branco é ignorado. Útil para experimentos controlados de prompt.

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

Sobreposições de prompt independentes de provedor aplicadas por família de modelo. IDs de modelo da família GPT-5 recebem o contrato de comportamento compartilhado entre provedores; `personality` controla apenas a camada de estilo de interação amigável.

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
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de Heartbeat antes de ser abortado. Deixe indefinido para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega para destino direto. `block` suprime entrega para destino direto e emite `reason=dm-blocked`.
- `lightContext`: quando verdadeiro, execuções de Heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando verdadeiro, cada Heartbeat é executado em uma nova sessão sem histórico de conversa anterior. Mesmo padrão de isolamento que `sessionTarget: "isolated"` do cron. Reduz o custo de tokens por Heartbeat de cerca de 100 mil para cerca de 2 a 5 mil tokens.
- `skipWhenBusy`: quando verdadeiro, execuções de Heartbeat são adiadas em lanes ocupadas extras: trabalho de subagente ou comando aninhado. Lanes de Cron sempre adiam Heartbeats, mesmo sem esta flag.
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

- `mode`: `default` ou `safeguard` (resumo em blocos para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: id de um Plugin de provedor de Compaction registrado. Quando definido, o `summarize()` do provedor é chamado em vez do resumo LLM integrado. Recorre ao integrado em caso de falha. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitido para uma única operação de Compaction antes que o OpenClaw a aborte. Padrão: `900`.
- `keepRecentTokens`: orçamento de ponto de corte do Pi para manter literalmente a cauda mais recente da transcrição. `/compact` manual respeita isso quando definido explicitamente; caso contrário, a Compaction manual é um checkpoint rígido.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` prefixa orientação integrada de retenção de identificadores opacos durante o resumo de Compaction.
- `identifierInstructions`: texto personalizado opcional de preservação de identificadores usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações de repetir-em-saída-malformada para resumos safeguard. Ativado por padrão no modo safeguard; defina `enabled: false` para pular a auditoria.
- `midTurnPrecheck`: verificação opcional de pressão do loop de ferramentas do Pi. Quando `enabled: true`, o OpenClaw verifica a pressão de contexto depois que resultados de ferramentas são anexados e antes da próxima chamada de modelo. Se o contexto não couber mais, ele aborta a tentativa atual antes de enviar o prompt e reutiliza o caminho de recuperação de pré-verificação existente para truncar resultados de ferramentas ou compactar e tentar novamente. Funciona com os modos de Compaction `default` e `safeguard`. Padrão: desativado.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md a reinjetar após a Compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desativar a reinjeção. Quando indefinido ou definido explicitamente como esse par padrão, os cabeçalhos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` somente para o resumo de Compaction. Use isto quando a sessão principal deve manter um modelo, mas os resumos de Compaction devem ser executados em outro; quando indefinido, a Compaction usa o modelo primário da sessão.
- `maxActiveTranscriptBytes`: limite opcional em bytes (`number` ou strings como `"20mb"`) que dispara a Compaction local normal antes de uma execução quando o JSONL ativo ultrapassa o limite. Exige `truncateAfterCompaction` para que uma Compaction bem-sucedida possa alternar para uma transcrição sucessora menor. Desativado quando indefinido ou `0`.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a Compaction começa e quando ela termina (por exemplo, "Compactando contexto..." e "Compaction concluída"). Desativado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno agêntico silencioso antes da Compaction automática para armazenar memórias duráveis. Defina `model` como um provedor/modelo exato, como `ollama/qwen3:8b`, quando esse turno de manutenção deve permanecer em um modelo local; a substituição não herda a cadeia de fallback da sessão ativa. Ignorado quando o workspace é somente leitura.

### `agents.defaults.runRetries`

Limites de iteração de repetição do loop de execução externo para o runner Pi incorporado para evitar loops de execução infinitos durante a recuperação de falhas. Observe que esta configuração atualmente se aplica apenas ao runtime de agente incorporado, não aos runtimes ACP ou CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: número base de iterações de repetição de execução para o loop de execução externo. Padrão: `24`.
- `perProfile`: iterações adicionais de repetição de execução concedidas por candidato de perfil de fallback. Padrão: `8`.
- `min`: limite absoluto mínimo para iterações de repetição de execução. Padrão: `32`.
- `max`: limite absoluto máximo para iterações de repetição de execução para impedir execução descontrolada. Padrão: `160`.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar para o LLM. **Não** modifica o histórico de sessão em disco.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` habilita passagens de poda.
- `ttl` controla com que frequência a poda pode ser executada novamente (após o último toque no cache).
- A poda primeiro faz soft-trim em resultados de ferramentas grandes demais e, em seguida, faz hard-clear em resultados de ferramentas mais antigos, se necessário.

**Soft-trim** mantém o começo + o fim e insere `...` no meio.

**Hard-clear** substitui o resultado inteiro da ferramenta pelo espaço reservado.

Observações:

- Blocos de imagem nunca são cortados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se houver menos de `keepLastAssistants` mensagens do assistente, a poda será ignorada.

</Accordion>

Consulte [Poda de sessão](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

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

- Canais que não sejam Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em blocos.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em blocos. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento + divisão em partes.

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

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime local do Docker (padrão)
- `ssh`: runtime remoto genérico baseado em SSH
- `openshell`: runtime do OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas de runtime passam para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados para o OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em tempo de execução
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` vence `identityFile`
- `certificateData` vence `certificateFile`
- `knownHostsData` vence `knownHostsFile`
- Valores `*Data` baseados em SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes do início da sessão do sandbox

**Comportamento do backend SSH:**

- inicializa o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia via SSH
- não sincroniza alterações remotas de volta para o host automaticamente
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

- `mirror`: inicializa o remoto a partir do local antes de exec, sincroniza de volta após exec; o workspace local permanece canônico
- `remote`: inicializa o remoto uma vez quando o sandbox é criado e depois mantém o workspace remoto como canônico

No modo `remote`, edições locais no host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de inicialização.
O transporte é SSH para dentro do sandbox OpenShell, mas o Plugin é responsável pelo ciclo de vida do sandbox e pela sincronização espelho opcional.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Requer egresso de rede, raiz gravável e usuário root.

**Contêineres usam `network: "none"` por padrão** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (uso emergencial).

**Anexos recebidos** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; binds globais e por agente são mesclados.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL noVNC injetada no prompt do sistema. Não exige `browser.enabled` em `openclaw.json`.
O acesso de observador noVNC usa autenticação VNC por padrão, e o OpenClaw emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) impede sessões em sandbox de direcionarem o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina como `bridge` somente quando você quiser explicitamente conectividade bridge global.
- `cdpSourceRange` restringe opcionalmente o ingresso CDP na borda do contêiner a um intervalo CIDR (por exemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do navegador em sandbox. Quando definido (incluindo `[]`), ele substitui `docker.binds` para o contêiner do navegador.
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
  - além de `--no-sandbox` quando `noSandbox` está habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de navegador personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

Sandboxing de navegador e `sandbox.docker.binds` são exclusivos do Docker.

Crie imagens (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalações npm sem um checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` inline.

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para dar a um agente seu próprio provedor de TTS, voz, modelo,
estilo ou modo de TTS automático. O bloco do agente faz uma mesclagem profunda sobre o
`messages.tts` global, então credenciais compartilhadas podem ficar em um só lugar enquanto agentes
individuais substituem apenas os campos de voz ou provedor de que precisam. A substituição do agente ativo
se aplica a respostas faladas automáticas, `/tts audio`, `/tts status` e
à ferramenta de agente `tts`. Consulte [Conversão de texto em fala](/pt-BR/tools/tts#per-agent-voice-overrides)
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
- `model`: a forma de string define um primário estrito por agente sem fallback de modelo; a forma de objeto `{ primary }` também é estrita, a menos que você adicione `fallbacks`. Use `{ primary, fallbacks: [...] }` para fazer esse agente optar por fallback, ou `{ primary, fallbacks: [] }` para tornar o comportamento estrito explícito. Trabalhos Cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para substituições específicas de agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `tts`: substituições opcionais de conversão de texto em fala por agente. O bloco faz mesclagem profunda sobre `messages.tts`, então mantenha credenciais compartilhadas de provedor e política de fallback em `messages.tts` e defina aqui apenas valores específicos da persona, como provedor, voz, modelo, estilo ou modo automático.
- `skills`: allowlist opcional de skill por agente. Se omitida, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem skills.
- `thinkingDefault`: nível de thinking padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para este agente quando nenhuma substituição por mensagem ou sessão é definida. O perfil de provedor/modelo selecionado controla quais valores são válidos; para Google Gemini, `adaptive` mantém o thinking dinâmico controlado pelo provedor (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade de reasoning padrão opcional por agente (`on | off | stream`). Substitui `agents.defaults.reasoningDefault` para este agente quando nenhuma substituição de reasoning por mensagem ou sessão é definida.
- `fastModeDefault`: padrão opcional por agente para modo rápido (`true | false`). Aplica-se quando nenhuma substituição de modo rápido por mensagem ou sessão é definida.
- `models`: substituições opcionais de catálogo/runtime de modelos por agente, indexadas por ids completos `provider/model`. Use `models["provider/model"].agentRuntime` para exceções de runtime por agente.
- `runtime`: descritor opcional de runtime por agente. Use `type: "acp"` com padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar sessões do harness ACP por padrão.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agente para destinos explícitos `sessions_spawn.agentId` (`["*"]` = qualquer um; padrão: apenas o mesmo agente). Inclua o id do solicitante quando chamadas `agentId` direcionadas a si mesmo devem ser permitidas.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
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
- `acp` (opcional; apenas para `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordem determinística de correspondência:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exato, sem peer/guild/team)
5. `match.accountId: "*"` (em todo o canal)
6. Agente padrão

Dentro de cada camada, a primeira entrada correspondente em `bindings` vence.

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

<Accordion title="Ferramentas somente leitura + workspace">

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
- **`identityLinks`**: mapeia ids canônicos para pares prefixados por provedor para compartilhamento de sessão entre canais. Comandos de acoplamento, como `/dock_discord`, usam o mesmo mapa para alternar a rota de resposta da sessão ativa para outro par de canal vinculado; consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking).
- **`reset`**: política principal de redefinição. `daily` redefine no horário local de `atHour`; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, vence o que expirar primeiro. A atualização da redefinição diária usa `sessionStartedAt` da linha de sessão; a atualização da redefinição por inatividade usa `lastInteractionAt`. Gravações em segundo plano/eventos do sistema, como heartbeat, despertares de cron, notificações de exec e escrituração do gateway, podem atualizar `updatedAt`, mas não mantêm sessões diárias/por inatividade atualizadas.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O legado `dm` é aceito como alias para `direct`.
- **`mainKey`**: campo legado. Em runtime, sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: número máximo de turnos de resposta entre agentes durante trocas agente-para-agente (inteiro, intervalo: `0`-`20`, padrão: `5`). `0` desativa o encadeamento de ping-pong.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`). Em runtime, grava a limpeza em lote com um pequeno buffer de marca d'água alta para limites de tamanho de produção; `openclaw sessions cleanup --enforce` aplica o limite imediatamente.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` o remove de configurações mais antigas.
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. O padrão é `pruneAfter`; defina como `false` para desativar.
  - `maxDiskBytes`: orçamento opcional de disco do diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após a limpeza de orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculados a threads.
  - `enabled`: chave padrão mestre (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: desfoco automático padrão por inatividade em horas (`0` desativa; provedores podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desativa; provedores podem substituir)
  - `spawnSessions`: controle padrão para criar sessões de trabalho vinculadas a threads a partir de `sessions_spawn` e spawns de thread ACP. O padrão é `true` quando vínculos de thread estão ativados; provedores/contas podem substituir.
  - `defaultSpawnContext`: contexto padrão de subagente nativo para spawns vinculados a threads (`"fork"` ou `"isolated"`). O padrão é `"fork"`.

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

| Variável          | Descrição              | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo   | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor       | `anthropic`                 |
| `{thinkingLevel}` | Nível de raciocínio atual | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- O padrão é `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em canais com suporte a reações, como Slack, Discord, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: ativa reações de status do ciclo de vida no Slack, Discord e Telegram.
  No Slack e Discord, quando não definido, mantém as reações de status ativadas quando as reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para ativar reações de status do ciclo de vida.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídia/anexos disparam o envio imediatamente. Comandos de controle ignoram o debounce.

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

- `auto` controla o modo auto-TTS padrão: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para resumo automático.
- `modelOverrides` é ativado por padrão; `modelOverrides.allowProvider` usa `false` como padrão (adesão explícita).
- As chaves de API usam fallback para `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- Provedores de fala incluídos no pacote pertencem a plugins. Se `plugins.allow` estiver definido, inclua cada plugin de provedor TTS que você deseja usar, por exemplo `microsoft` para Edge TTS. O id de provedor legado `edge` é aceito como alias para `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint TTS da OpenAI. A ordem de resolução é configuração, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e flexibiliza a validação de modelo/voz.

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores Talk estiverem configurados.
- Chaves Talk planas legadas (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existem apenas para compatibilidade. Execute `openclaw doctor --fix` para reescrever a configuração persistida em `talk.providers.<provider>`.
- IDs de voz usam fallback para `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica somente quando nenhuma chave de API Talk está configurada.
- `providers.*.voiceAliases` permite que diretivas Talk usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório Hugging Face usado pelo auxiliar MLX local do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução MLX no macOS passa pelo auxiliar `openclaw-mlx-tts` incluído no pacote quando presente, ou por um executável em `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do auxiliar para desenvolvimento.
- `consultThinkingLevel` controla o nível de raciocínio da execução completa do agente OpenClaw por trás das chamadas `openclaw_agent_consult` em tempo real do Talk da Control UI. Deixe indefinido para preservar o comportamento normal de sessão/modelo.
- `consultFastMode` define uma substituição única de modo rápido para consultas em tempo real do Talk da Control UI sem alterar a configuração normal de modo rápido da sessão.
- `speechLocale` define o id de localidade BCP 47 usado pelo reconhecimento de fala Talk no iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla por quanto tempo o modo Talk espera após o silêncio do usuário antes de enviar a transcrição. Quando indefinido, mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).
- `realtime.instructions` acrescenta instruções de sistema voltadas ao provedor ao prompt em tempo real integrado do OpenClaw, para que o estilo de voz possa ser configurado sem perder a orientação padrão de `openclaw_agent_consult`.

---

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

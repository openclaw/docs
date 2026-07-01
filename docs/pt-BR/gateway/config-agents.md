---
read_when:
    - Ajustando os padrões do agente (modelos, raciocínio, espaço de trabalho, Heartbeat, mídia, Skills)
    - Configurando roteamento e vinculações multiagente
    - Ajuste de sessão, entrega de mensagens e comportamento do modo de conversa
summary: Padrões do agente, roteamento multiagente, sessão, mensagens e configuração de conversa
title: Configuração — agentes
x-i18n:
    generated_at: "2026-07-01T12:52:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do Gateway e outras
chaves de nível superior, consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Padrões de agente

### `agents.defaults.workspace`

Padrão: `OPENCLAW_WORKSPACE_DIR` quando definido; caso contrário, `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Um valor explícito de `agents.defaults.workspace` tem precedência sobre
`OPENCLAW_WORKSPACE_DIR`. Use a variável de ambiente para apontar agentes padrão
para um workspace montado quando você não quiser gravar esse caminho na configuração.

### `agents.defaults.repoRoot`

Raiz opcional do repositório exibida na linha Runtime do prompt do sistema. Se não for definida, o OpenClaw detecta automaticamente subindo a partir do workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Lista de permissão padrão opcional de Skills para agentes que não definem
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

- Omita `agents.defaults.skills` para permitir Skills sem restrições por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para não permitir Skills.
- Uma lista `agents.list[].skills` não vazia é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desativa a criação automática dos arquivos de bootstrap do workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignora a criação de arquivos opcionais selecionados do workspace, mas ainda grava os arquivos de bootstrap obrigatórios. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

- `"continuation-skip"`: turnos de continuação seguros (após uma resposta concluída do assistente) ignoram a reinjeção do bootstrap do workspace, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas pós-Compaction ainda reconstroem o contexto.
- `"never"`: desativa a injeção do bootstrap do workspace e de arquivos de contexto em todos os turnos. Use isso apenas para agentes que controlam totalmente o ciclo de vida do próprio prompt (mecanismos de contexto personalizados, runtimes nativos que constroem o próprio contexto ou workflows especializados sem bootstrap). Turnos de Heartbeat e de recuperação de Compaction também ignoram a injeção.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Substituição por agente: `agents.list[].contextInjection`. Valores omitidos herdam
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo de bootstrap do workspace antes do truncamento. Padrão: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Substituição por agente: `agents.list[].bootstrapMaxChars`. Valores omitidos herdam
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos de bootstrap do workspace. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Substituição por agente: `agents.list[].bootstrapTotalMaxChars`. Valores omitidos
herdam `agents.defaults.bootstrapTotalMaxChars`.

### Substituições de perfil de bootstrap por agente

Use substituições de perfil de bootstrap por agente quando um agente precisar de um comportamento de
injeção de prompt diferente dos padrões compartilhados. Campos omitidos herdam de
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o aviso visível ao agente no prompt do sistema quando o contexto de bootstrap é truncado.
Padrão: `"always"`.

- `"off"`: nunca injeta texto de aviso de truncamento no prompt do sistema.
- `"once"`: injeta um aviso conciso uma vez por assinatura de truncamento única.
- `"always"`: injeta um aviso conciso em cada execução quando há truncamento (recomendado).

Contagens brutas/injetadas detalhadas e campos de ajuste de configuração permanecem em diagnósticos como
relatórios e logs de contexto/status; o contexto rotineiro de usuário/runtime do WebChat recebe apenas
o aviso conciso de recuperação.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa de propriedade de orçamento de contexto

O OpenClaw tem vários orçamentos de prompt/contexto de alto volume, e eles são
intencionalmente divididos por subsistema, em vez de todos passarem por um único
controle genérico.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  injeção normal de bootstrap do workspace.
- `agents.defaults.startupContext.*`:
  prelúdio único de execução do modelo em reset/inicialização, incluindo arquivos recentes diários
  `memory/*.md`. Comandos simples de chat `/new` e `/reset` são
  confirmados sem invocar o modelo.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos injetados pertencentes ao runtime.
- `memory.qmd.limits.*`:
  dimensionamento de snippets de busca de memória indexada e de injeção.

Use a substituição por agente correspondente apenas quando um agente precisar de um
orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado em execuções do modelo de reset/inicialização.
Comandos simples de chat `/new` e `/reset` confirmam o reset sem invocar
o modelo, portanto não carregam esse prelúdio.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite padrão do trecho de `memory_get` antes de metadados
  de truncamento e aviso de continuação serem adicionados.
- `memoryGetDefaultLines`: janela padrão de linhas de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: teto avançado de resultados de ferramenta ao vivo usado para resultados
  persistidos e recuperação de estouro. Deixe indefinido para o limite automático de contexto do modelo:
  `16000` caracteres abaixo de 100K tokens, `32000` caracteres em 100K+ tokens e `64000`
  caracteres em 200K+ tokens. Valores explícitos de até `1000000` são aceitos para
  modelos de contexto longo, mas o limite efetivo ainda é limitado a cerca de 30% da
  janela de contexto do modelo. `openclaw doctor --deep` imprime o limite efetivo,
  e o doctor alerta apenas quando uma substituição explícita está obsoleta ou não tem efeito.
- `postCompactionMaxChars`: limite do trecho de AGENTS.md usado durante a injeção
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
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
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

Tamanho máximo em pixels do maior lado da imagem em blocos de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Padrão: `1200`.

Valores menores geralmente reduzem o uso de tokens de visão e o tamanho do payload da solicitação em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferência de compressão/detalhe da ferramenta de imagem para imagens carregadas de caminhos de arquivo, URLs e referências de mídia.
Padrão: `auto`.

O OpenClaw adapta a escala de redimensionamento ao modelo de imagem selecionado. Por exemplo, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL e modelos de visão Llama 4 hospedados podem usar imagens maiores do que caminhos de visão de alto detalhe mais antigos/padrão, enquanto turnos com várias imagens são comprimidos de forma mais agressiva no modo `auto` para controlar o custo de tokens e latência.

Valores:

- `auto`: adapta aos limites do modelo e à contagem de imagens.
- `efficient`: prefere imagens menores para menor uso de tokens e bytes.
- `balanced`: usa a escala intermediária padrão.
- `high`: preserva mais detalhes para capturas de tela, diagramas e imagens de documentos.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
  - A forma de string define apenas o modelo primário.
  - A forma de objeto define o primário mais modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não aceita entrada de imagem.
  - Prefira refs explícitas `provider/model`. IDs sem prefixo são aceitos por compatibilidade; se um ID sem prefixo corresponder de forma única a uma entrada configurada com suporte a imagens em `models.providers.*.models`, o OpenClaw o qualifica para esse provedor. Correspondências configuradas ambíguas exigem um prefixo de provedor explícito.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e por qualquer superfície futura de ferramenta/Plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração de imagens nativa do Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, ou `openai/gpt-image-1.5` para saída OpenAI PNG/WebP com fundo transparente.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação correspondente do provedor (por exemplo, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um provedor padrão com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagens em ordem de ID de provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um provedor padrão com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música em ordem de ID de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API correspondente do provedor.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um provedor padrão com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo em ordem de ID de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API correspondente do provedor.
  - O Plugin oficial de geração de vídeo Qwen suporta até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções de nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF recorre a `imageModel` e depois ao modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível detalhado padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `toolProgressDetail`: modo de detalhe para resumos de ferramentas de `/verbose` e linhas de ferramenta em rascunhos de progresso. Valores: `"explain"` (padrão, rótulos humanos compactos) ou `"raw"` (anexa comando/detalhe bruto quando disponível). `agents.list[].toolProgressDetail` por agente substitui esse padrão.
- `reasoningDefault`: visibilidade padrão de raciocínio para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente substitui esse padrão. Padrões de raciocínio configurados só são aplicados para proprietários, remetentes autorizados ou contextos de Gateway de administrador-operador quando nenhuma substituição de raciocínio por mensagem ou sessão está definida.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo, `openai/gpt-5.5` para acesso por chave de API da OpenAI ou Codex OAuth). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse ID de modelo exato e só então recorre ao provedor padrão configurado (comportamento de compatibilidade obsoleto, portanto prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.
- `models`: o catálogo de modelos configurado e a lista de permissões para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo, `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, roteamento `provider` do OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Use entradas `provider/*`, como `"openai/*": {}` ou `"vllm/*": {}`, para mostrar todos os modelos descobertos para provedores selecionados sem listar manualmente cada ID de modelo.
  - Adicione `agentRuntime` a uma entrada `provider/*` quando todo modelo descoberto dinamicamente para esse provedor deve usar o mesmo runtime. A política de runtime exata de `provider/model` ainda prevalece sobre o curinga.
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da lista de permissões, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provedor mesclam os modelos de provedor selecionados nesse mapa e preservam provedores não relacionados já configurados.
  - Para modelos OpenAI Responses diretos, a Compaction do lado do servidor é habilitada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Consulte [Compaction do lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão de provedor aplicados a todos os modelos. Definidos em `agents.defaults.params` (por exemplo, `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo), e então `agents.list[].params` (ID de agente correspondente) substitui por chave. Consulte [Cache de prompts](/pt-BR/reference/prompt-caching) para detalhes.
- `models.providers.openrouter.params.provider`: política padrão de roteamento de provedor em todo o OpenRouter. O OpenClaw encaminha isso para o objeto `provider` da solicitação do OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` por modelo e params de agente substituem por chave. Consulte [roteamento de provedor do OpenRouter](/pt-BR/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON avançado de passagem direta mesclado em corpos de solicitação `api: "openai-completions"` para proxies compatíveis com OpenAI. Se ele colidir com chaves de solicitação geradas, o corpo extra prevalece; rotas de completions não nativas ainda removem `store` exclusivo da OpenAI depois.
- `params.chat_template_kwargs`: argumentos de template de chat compatíveis com vLLM/OpenAI mesclados nos corpos de solicitação de nível superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` com raciocínio desativado, o Plugin vLLM incluído envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícito substitui os padrões gerados, e `extra_body.chat_template_kwargs` ainda tem a precedência final. Modelos vLLM Qwen e Nemotron com raciocínio configurados expõem escolhas binárias de `/think` (`off`, `on`) em vez da escada de esforço multinível.
- `compat.thinkingFormat`: estilo de payload de raciocínio compatível com OpenAI. Use `"together"` para `reasoning.enabled` no estilo Together, `"qwen"` para `enable_thinking` de nível superior no estilo Qwen, ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em backends da família Qwen que suportam kwargs de template de chat no nível da solicitação, como vLLM. O OpenClaw mapeia raciocínio desativado para `false` e raciocínio ativado para `true`, e modelos vLLM Qwen configurados expõem escolhas binárias de `/think` para esses formatos.
- `compat.supportedReasoningEfforts`: lista de esforços de raciocínio compatíveis com OpenAI por modelo. Inclua `"xhigh"` para endpoints personalizados que realmente o aceitam; então o OpenClaw expõe `/think xhigh` nos menus de comando, linhas de sessão do Gateway, validação de patch de sessão, validação de CLI de agente e validação de `llm-task` para esse provedor/modelo configurado. Use `compat.reasoningEffortMap` quando o backend quiser um valor específico do provedor para um nível canônico.
- `params.preserveThinking`: opt-in exclusivo da Z.AI para raciocínio preservado. Quando habilitado e o raciocínio está ativado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz `reasoning_content` anterior; consulte [raciocínio da Z.AI e raciocínio preservado](/pt-BR/providers/zai#thinking-and-preserved-thinking).
- `localService`: gerenciador de processos opcional em nível de provedor para servidores de modelos locais/auto-hospedados. Quando o modelo selecionado pertence a esse provedor, o OpenClaw verifica `healthUrl` (ou `baseUrl + "/models"`), inicia `command` com `args` se o endpoint estiver indisponível, aguarda até `readyTimeoutMs` e então envia a solicitação de modelo. `command` deve ser um caminho absoluto. `idleStopMs: 0` mantém o processo ativo até o OpenClaw sair; um valor positivo interrompe o processo iniciado pelo OpenClaw após essa quantidade de milissegundos ociosos. Consulte [Serviços de modelos locais](/pt-BR/gateway/local-model-services).
- A política de runtime pertence aos provedores ou modelos, não a `agents.defaults`. Use `models.providers.<provider>.agentRuntime` para regras em todo o provedor ou `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` para regras específicas de modelo. Modelos de agente OpenAI no provedor oficial OpenAI selecionam Codex por padrão.
- Gravadores de configuração que modificam esses campos (por exemplo, `/models set`, `/models set-image` e comandos para adicionar/remover fallback) salvam a forma de objeto canônica e preservam listas de fallback existentes quando possível.
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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, um id de executor de Plugin registrado ou um alias de backend CLI compatível. O Plugin Codex incluído registra `codex`; o Plugin Anthropic incluído fornece o backend CLI `claude-cli`.
- `id: "auto"` permite que executores de Plugin registrados reivindiquem turnos compatíveis e usa OpenClaw quando nenhum executor corresponde. Um runtime de Plugin explícito, como `id: "codex"`, exige esse executor e falha fechado se ele estiver indisponível ou falhar.
- `id: "pi"` é aceito apenas como um alias obsoleto para `openclaw` a fim de preservar configurações já distribuídas da v2026.5.22 e anteriores. Novas configurações devem usar `openclaw`.
- A precedência de runtime é primeiro a política exata de modelo (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` ou `models.providers.<provider>.models[]`), depois `agents.list[]` / `agents.defaults.models["provider/*"]`, depois a política de todo o provedor em `models.providers.<provider>.agentRuntime`.
- Chaves de runtime de agente inteiro são legadas. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, pins de runtime de sessão e `OPENCLAW_AGENT_RUNTIME` são ignorados pela seleção de runtime. Execute `openclaw doctor --fix` para remover valores obsoletos.
- Modelos de agente da OpenAI usam o executor Codex por padrão; provider/model `agentRuntime.id: "codex"` continua válido quando você quiser tornar isso explícito.
- Para implantações do Claude CLI, prefira `model: "anthropic/claude-opus-4-8"` mais `agentRuntime.id: "claude-cli"` com escopo de modelo. Referências de modelo legadas `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo canônica e colocar o backend de execução na política de runtime de provedor/modelo.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Atalhos de alias integrados** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Seus aliases configurados sempre têm prioridade sobre os padrões.

Modelos Z.AI GLM-4.x ativam automaticamente o modo de raciocínio, a menos que você defina `--thinking off` ou defina `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Modelos Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramentas. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
O Anthropic Claude Opus 4.8 mantém o raciocínio desativado por padrão no OpenClaw; quando o raciocínio adaptativo é explicitamente ativado, o padrão de esforço controlado pelo provedor Anthropic é `high`. Modelos Claude 4.6 usam `adaptive` por padrão quando nenhum nível explícito de raciocínio é definido.

### `agents.defaults.cliBackends`

Backends CLI opcionais para execuções de fallback somente texto (sem chamadas de ferramenta). Útil como backup quando provedores de API falham.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- Backends CLI priorizam texto; ferramentas ficam sempre desativadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Repasse de imagem é compatível quando `imageArg` aceita caminhos de arquivo.
- `reseedFromRawTranscriptWhenUncompacted: true` permite que um backend recupere sessões invalidadas seguras a partir de uma cauda limitada do transcript bruto do OpenClaw antes que exista o primeiro resumo de Compaction. Mudanças de perfil de autenticação ou época de credencial ainda nunca fazem reseed bruto.

### `agents.defaults.promptOverlays`

Sobreposições de prompt independentes de provedor aplicadas por família de modelo em superfícies de prompt montadas pelo OpenClaw. IDs de modelo da família GPT-5 recebem o contrato de comportamento compartilhado entre rotas OpenClaw/provedor; `personality` controla apenas a camada amigável de estilo de interação. Rotas nativas do servidor de aplicativo Codex mantêm instruções base/modelo controladas pelo Codex em vez desta sobreposição GPT-5 do OpenClaw, e o OpenClaw desativa a personalidade integrada do Codex para threads nativas.

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

- `"friendly"` (padrão) e `"on"` ativam a camada amigável de estilo de interação.
- `"off"` desativa apenas a camada amigável; o contrato de comportamento GPT-5 marcado permanece ativado.
- O legado `plugins.entries.openai.config.personality` ainda é lido quando essa configuração compartilhada não está definida.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `includeSystemPromptSection`: quando false, omite a seção Heartbeat do prompt do sistema e pula a injeção de `HEARTBEAT.md` no contexto de bootstrap. Padrão: `true`.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de heartbeat antes de ser abortado. Deixe indefinido para usar `agents.defaults.timeoutSeconds` quando definido; caso contrário, a cadência de heartbeat é limitada a 600 segundos.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega a alvo direto. `block` suprime entrega a alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando true, execuções de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat roda em uma nova sessão sem histórico anterior de conversa. Mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz o custo de tokens por heartbeat de ~100K para ~2-5K tokens.
- `skipWhenBusy`: quando true, execuções de heartbeat são adiadas nas lanes ocupadas extras desse agente: seu próprio subagente com chave de sessão ou trabalho de comando aninhado. Lanes de Cron sempre adiam heartbeats, mesmo sem esta flag.
- Por agente: defina `agents.list[].heartbeat`. Quando qualquer agente define `heartbeat`, **somente esses agentes** executam heartbeats.
- Heartbeats executam turnos completos de agente — intervalos mais curtos consomem mais tokens.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` ou `safeguard` (sumarização em partes para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: id de um Plugin de provedor de Compaction registrado. Quando definido, o `summarize()` do provedor é chamado em vez da sumarização de LLM integrada. Recorre à integrada em caso de falha. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: máximo de segundos permitidos para uma única operação de Compaction antes que o OpenClaw a aborte. Padrão: `180`.
- `keepRecentTokens`: orçamento de ponto de corte do agente para manter literalmente a cauda mais recente da transcrição. O `/compact` manual respeita isso quando definido explicitamente; caso contrário, a Compaction manual é um checkpoint rígido.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` antepõe orientações integradas de retenção de identificadores opacos durante a sumarização de Compaction.
- `identifierInstructions`: texto personalizado opcional de preservação de identificadores usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações de tentar novamente em caso de saída malformada para resumos de safeguard. Habilitado por padrão no modo safeguard; defina `enabled: false` para ignorar a auditoria.
- `midTurnPrecheck`: verificação opcional de pressão no loop de ferramentas. Quando `enabled: true`, o OpenClaw verifica a pressão de contexto depois que os resultados das ferramentas são anexados e antes da próxima chamada ao modelo. Se o contexto não couber mais, ele aborta a tentativa atual antes de enviar o prompt e reutiliza o caminho de recuperação de pré-verificação existente para truncar resultados de ferramentas ou compactar e tentar novamente. Funciona com os modos de Compaction `default` e `safeguard`. Padrão: desabilitado.
- `postCompactionSections`: nomes opcionais de seções H2/H3 do AGENTS.md a reinjetar após a Compaction. A reinjeção fica desabilitada quando não definido ou definido como `[]`. Definir explicitamente `["Session Startup", "Red Lines"]` habilita esse par e preserva a alternativa legada `Every Session`/`Safety`. Habilite isso somente quando o contexto extra valer o risco de duplicar orientações do projeto já capturadas no resumo da Compaction.
- `model`: `provider/model-id` opcional ou alias simples de `agents.defaults.models` somente para sumarização de Compaction. Aliases simples são resolvidos antes do despacho; IDs literais de modelo configurados mantêm precedência em colisões. Use isso quando a sessão principal deve manter um modelo, mas os resumos de Compaction devem rodar em outro; quando não definido, a Compaction usa o modelo primário da sessão.
- `maxActiveTranscriptBytes`: limite opcional de bytes (`number` ou strings como `"20mb"`) que aciona a Compaction local normal antes de uma execução quando o JSONL ativo ultrapassa o limite. Requer `truncateAfterCompaction` para que uma Compaction bem-sucedida possa alternar para uma transcrição sucessora menor. Desabilitado quando não definido ou `0`.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a Compaction começa e quando é concluída (por exemplo, "Compactando contexto..." e "Compaction concluída"). Desabilitado por padrão para manter a Compaction silenciosa.
- `memoryFlush`: turno agêntico silencioso antes da Compaction automática para armazenar memórias duráveis. Defina `model` como um provedor/modelo exato, como `ollama/qwen3:8b`, quando esse turno de manutenção deve permanecer em um modelo local; a substituição não herda a cadeia de alternativas da sessão ativa. Ignorado quando o workspace é somente leitura.

### `agents.defaults.runRetries`

Limites de iteração de novas tentativas do loop externo de execução para o runtime de agente embutido, para impedir loops infinitos de execução durante a recuperação de falhas. Observe que essa configuração atualmente se aplica apenas ao runtime de agente embutido, não aos runtimes ACP ou CLI.

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

- `base`: número base de iterações de nova tentativa de execução para o loop externo de execução. Padrão: `24`.
- `perProfile`: iterações adicionais de nova tentativa de execução concedidas por candidato de perfil alternativo. Padrão: `8`.
- `min`: limite absoluto mínimo para iterações de nova tentativa de execução. Padrão: `32`.
- `max`: limite absoluto máximo para iterações de nova tentativa de execução para impedir execução descontrolada. Padrão: `160`.

### `agents.defaults.contextPruning`

Poda **resultados antigos de ferramentas** do contexto em memória antes de enviar ao LLM. **Não** modifica o histórico da sessão em disco.

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
- `ttl` controla com que frequência a poda pode rodar novamente (após o último toque no cache).
- A poda primeiro reduz de forma branda resultados de ferramentas grandes demais e, depois, limpa rigidamente resultados de ferramentas mais antigos, se necessário.
- `softTrimRatio` e `hardClearRatio` aceitam valores de `0.0` até `1.0`; a validação da configuração rejeita valores fora desse intervalo.

**Redução branda** mantém o início + fim e insere `...` no meio.

**Limpeza rígida** substitui todo o resultado da ferramenta pelo placeholder.

Observações:

- Blocos de imagem nunca são reduzidos/limpos.
- Proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se existirem menos de `keepLastAssistants` mensagens de assistente, a poda será ignorada.

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

- Canais que não são Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em blocos.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` por padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500 ms. Substituição por agente: `agents.list[].humanDelay`.

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

Isolamento em sandbox opcional para o agente embutido. Consulte [isolamento em sandbox](/pt-BR/gateway/sandboxing) para o guia completo.

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
- `openshell`: runtime OpenShell

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime passam para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados para o OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdo embutido ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave de host do OpenSSH

**Precedência de autenticação SSH:**

- `identityData` vence `identityFile`
- `certificateData` vence `certificateFile`
- `knownHostsData` vence `knownHostsFile`
- Valores `*Data` baseados em SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes do início da sessão de sandbox

**Comportamento do backend SSH:**

- semeia o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- encaminha `exec`, ferramentas de arquivo e caminhos de mídia por SSH
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

- `mirror`: propaga do local para o remoto antes da execução, sincroniza de volta após a execução; o workspace local permanece canônico
- `remote`: propaga para o remoto uma vez quando a sandbox é criada e, em seguida, mantém o workspace remoto como canônico

No modo `remote`, edições locais do host feitas fora do OpenClaw não são sincronizadas automaticamente para a sandbox após a etapa de propagação.
O transporte é SSH para a sandbox OpenShell, mas o plugin controla o ciclo de vida da sandbox e a sincronização espelhada opcional.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Requer saída de rede, raiz gravável, usuário root.

**Os contêineres usam `network: "none"` por padrão** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (quebra-vidro).
Turnos do servidor de app do Codex em uma sandbox OpenClaw ativa usam essa mesma configuração de saída para o acesso de rede nativo do modo de código.

**Anexos de entrada** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; montagens globais e por agente são mescladas.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL noVNC injetada no prompt do sistema. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador noVNC usa autenticação VNC por padrão, e o OpenClaw emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) impede que sessões em sandbox controlem o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina como `bridge` somente quando você quiser explicitamente conectividade bridge global.
- `cdpSourceRange` restringe opcionalmente a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do navegador em sandbox. Quando definido (incluindo `[]`), substitui `docker.binds` para o contêiner do navegador.
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
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se o uso de WebGL/3D exigir isso.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` reabilita extensões se o seu fluxo de trabalho
    depender delas.
  - `--renderer-process-limit=2` pode ser alterado com
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o
    limite de processos padrão do Chromium.
  - mais `--no-sandbox` quando `noSandbox` estiver habilitado.
  - Os padrões são a linha de base da imagem do contêiner; use uma imagem de navegador personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

O sandboxing do navegador e `sandbox.docker.binds` são exclusivos do Docker.

Compile imagens (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalações npm sem um checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos `docker build` em linha.

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para dar a um agente seu próprio provedor de TTS, voz, modelo,
estilo ou modo auto-TTS. O bloco do agente é mesclado profundamente sobre
`messages.tts`, para que credenciais compartilhadas possam ficar em um único lugar enquanto agentes individuais
substituem apenas os campos de voz ou provedor de que precisam. A substituição do agente ativo
se aplica a respostas faladas automáticas, `/tts audio`, `/tts status` e
à ferramenta de agente `tts`. Consulte [Texto para fala](/pt-BR/tools/tts#per-agent-voice-overrides)
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `model`: a forma de string define um primário estrito por agente sem fallback de modelo; a forma de objeto `{ primary }` também é estrita, a menos que você adicione `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar fallback para esse agente, ou `{ primary, fallbacks: [] }` para tornar o comportamento estrito explícito. Tarefas Cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isso para substituições específicas do agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `tts`: substituições opcionais de texto para fala por agente. O bloco é mesclado profundamente sobre `messages.tts`, portanto mantenha credenciais compartilhadas de provedor e política de fallback em `messages.tts` e defina aqui apenas valores específicos de persona, como provedor, voz, modelo, estilo ou modo automático.
- `skills`: allowlist opcional de Skills por agente. Se omitida, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem Skills.
- `thinkingDefault`: nível de pensamento padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para este agente quando nenhuma substituição por mensagem ou sessão é definida. O perfil do provedor/modelo selecionado controla quais valores são válidos; para Google Gemini, `adaptive` mantém o pensamento dinâmico controlado pelo provedor (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade de raciocínio padrão opcional por agente (`on | off | stream`). Substitui `agents.defaults.reasoningDefault` para este agente quando nenhuma substituição de raciocínio por mensagem ou sessão é definida.
- `fastModeDefault`: padrão opcional por agente para modo rápido (`"auto" | true | false`). Aplica-se quando nenhuma substituição de modo rápido por mensagem ou sessão é definida.
- `models`: substituições opcionais de catálogo/runtime de modelo por agente, indexadas por ids completos `provider/model`. Use `models["provider/model"].agentRuntime` para exceções de runtime por agente.
- `runtime`: descritor de runtime opcional por agente. Use `type: "acp"` com padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar sessões de harness ACP por padrão.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- Arquivos de imagem locais relativos ao workspace em `identity.avatar` são limitados a 2 MB. URLs `http(s)` e URIs `data:` não são verificadas com o limite local de tamanho de arquivo.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agentes configurados para destinos explícitos `sessions_spawn.agentId` (`["*"]` = qualquer destino configurado; padrão: apenas o mesmo agente). Inclua o id do solicitante quando chamadas `agentId` direcionadas a si mesmo devem ser permitidas. Entradas obsoletas cuja configuração de agente foi excluída são rejeitadas por `sessions_spawn` e omitidas de `agents_list`; execute `openclaw doctor --fix` para limpá-las, ou adicione uma entrada mínima em `agents.list[]` se esse destino deve permanecer apto a spawn enquanto herda padrões.
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
5. `match.accountId: "*"` (todo o canal)
6. Agente padrão

Dentro de cada nível, a primeira entrada correspondente de `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de binding de route acima.

### Perfis de acesso por agente

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

<Accordion title="No filesystem access (messaging only)">

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

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para ver detalhes de precedência.

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
      mode: "enforce", // enforce (default) | warn
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

<Accordion title="Session field details">

- **`scope`**: estratégia base de agrupamento de sessões para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use somente quando o contexto compartilhado for intencional).
- **`dmScope`**: como as DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por ID do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia IDs canônicos para pares com prefixo do provedor para compartilhamento de sessão entre canais. Comandos de dock como `/dock_discord` usam o mesmo mapa para trocar a rota de resposta da sessão ativa para outro par de canal vinculado; consulte [Docking de canais](/pt-BR/concepts/channel-docking).
- **`reset`**: política principal de redefinição. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos são configurados, vence o que expirar primeiro. O frescor da redefinição diária usa o `sessionStartedAt` da linha de sessão; o frescor da redefinição por inatividade usa `lastInteractionAt`. Gravações em segundo plano/eventos de sistema, como Heartbeat, despertares de Cron, notificações de execução e bookkeeping do Gateway, podem atualizar `updatedAt`, mas não mantêm sessões diárias/por inatividade frescas.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O `dm` legado é aceito como alias para `direct`.
- **`mainKey`**: campo legado. O runtime sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de resposta entre agentes durante trocas agente-para-agente (inteiro, intervalo: `0`-`20`, padrão: `5`). `0` desativa o encadeamento ping-pong.
- **`sendPolicy`**: faz correspondência por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `enforce` aplica a limpeza e é o padrão; `warn` emite apenas avisos.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`). O runtime grava a limpeza em lote com um pequeno buffer de limite superior para caps de tamanho de produção; `openclaw sessions cleanup --enforce` aplica o cap imediatamente.
  - Sessões curtas de sondagem de execução de modelo do Gateway usam retenção fixa de `24h`, mas a limpeza é controlada por pressão: ela só remove linhas obsoletas de sondagem estrita de execução de modelo quando a pressão de manutenção/cap de entradas de sessão é atingida. Somente chaves estritas de sondagem explícita que correspondem a `agent:*:explicit:model-run-<uuid>` são elegíveis; sessões normais diretas, de grupo, thread, Cron, hook, Heartbeat, ACP e subagente não herdam essa retenção de 24h. Quando a limpeza de execução de modelo roda, ela roda antes da limpeza mais ampla de entradas obsoletas por `pruneAfter` e do cap `maxEntries`.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` o remove de configurações antigas.
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. O padrão é `pruneAfter`; defina como `false` para desativar.
  - `maxDiskBytes`: orçamento de disco opcional para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após a limpeza de orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculada a thread.
  - `enabled`: chave padrão principal (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-desfoco padrão por inatividade em horas (`0` desativa; provedores podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desativa; provedores podem substituir)
  - `spawnSessions`: gate padrão para criar sessões de trabalho vinculadas a thread a partir de `sessions_spawn` e spawns de thread ACP. O padrão é `true` quando vínculos de thread estão ativados; provedores/contas podem substituir.
  - `defaultSpawnContext`: contexto nativo padrão de subagente para spawns vinculados a thread (`"fork"` ou `"isolated"`). O padrão é `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

**Variáveis de template:**

| Variável          | Descrição                 | Exemplo                     |
| ----------------- | ------------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo      | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor          | `anthropic`                 |
| `{thinkingLevel}` | Nível de raciocínio atual | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente | (igual a `"auto"`)          |

Variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- O padrão é `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em canais com suporte a reações, como Slack, Discord, Telegram, WhatsApp e iMessage.
- `messages.statusReactions.enabled`: ativa reações de status de ciclo de vida no Slack, Discord, Telegram e WhatsApp.
  No Slack e no Discord, quando não definido, mantém as reações de status ativadas quando as reações de confirmação estão ativas.
  No Telegram e no WhatsApp, defina explicitamente como `true` para ativar reações de status de ciclo de vida.
- `messages.statusReactions.emojis`: substitui chaves de emoji de ciclo de vida:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` e `stallHard`.
  O Telegram permite apenas um conjunto fixo de reações, então emojis configurados sem suporte fazem fallback
  para a variante de status compatível mais próxima para esse chat.

### Debounce de entrada

Agrupa mensagens rápidas somente de texto do mesmo remetente em um único turno do agente. Mídia/anexos disparam o envio imediatamente. Comandos de controle ignoram o debounce.

### TTS (texto para fala)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controla o modo padrão de TTS automático: `off`, `always`, `inbound` ou `tagged`. `/tts on|off` pode substituir as preferências locais, e `/tts status` mostra o estado efetivo.
- `summaryModel` substitui `agents.defaults.model.primary` para resumo automático.
- `modelOverrides` é habilitado por padrão; `modelOverrides.allowProvider` usa `false` como padrão (adesão explícita).
- As chaves de API usam `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY` como fallback.
- Os provedores de fala incluídos são de propriedade dos plugins. Se `plugins.allow` estiver definido, inclua cada plugin de provedor TTS que você quiser usar, por exemplo `microsoft` para Edge TTS. O id legado de provedor `edge` é aceito como alias de `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint de TTS da OpenAI. A ordem de resolução é configuração, depois `OPENAI_TTS_BASE_URL`, depois `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e flexibiliza a validação de modelo/voz.

---

## Fala

Padrões para o modo Fala (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores de Fala estiverem configurados.
- As chaves planas legadas de Fala (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existem apenas para compatibilidade. Execute `openclaw doctor --fix` para reescrever a configuração persistida em `talk.providers.<provider>`.
- Os IDs de voz usam `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID` como fallback.
- `providers.*.apiKey` aceita strings em texto simples ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica somente quando nenhuma chave de API de Fala está configurada.
- `providers.*.voiceAliases` permite que diretivas de Fala usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório do Hugging Face usado pelo auxiliar MLX local do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução MLX no macOS é executada pelo auxiliar incluído `openclaw-mlx-tts` quando presente, ou por um executável em `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do auxiliar para desenvolvimento.
- `consultThinkingLevel` controla o nível de pensamento para a execução completa do agente OpenClaw por trás das chamadas `openclaw_agent_consult` em tempo real da Fala da Control UI. Deixe sem definir para preservar o comportamento normal de sessão/modelo.
- `consultFastMode` define uma substituição de modo rápido de uso único para consultas em tempo real da Fala da Control UI sem alterar a configuração normal de modo rápido da sessão.
- `speechLocale` define o id de localidade BCP 47 usado pelo reconhecimento de fala da Fala no iOS/macOS. Deixe sem definir para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla por quanto tempo o modo Fala aguarda após o silêncio do usuário antes de enviar a transcrição. Sem definir, mantém a janela de pausa padrão da plataforma (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` acrescenta instruções de sistema voltadas ao provedor ao prompt em tempo real integrado do OpenClaw, para que o estilo de voz possa ser configurado sem perder a orientação padrão de `openclaw_agent_consult`.
- `realtime.consultRouting` controla o fallback de retransmissão do Gateway quando o provedor em tempo real produz uma transcrição final do usuário sem `openclaw_agent_consult`: `provider-direct` preserva respostas diretas do provedor, enquanto `force-agent-consult` roteia a solicitação finalizada pelo OpenClaw.

---

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)

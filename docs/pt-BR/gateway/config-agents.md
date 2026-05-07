---
read_when:
    - Ajuste dos padrões do agente (modelos, raciocínio, espaço de trabalho, Heartbeat, mídia, Skills)
    - Configurando roteamento e vinculações multiagente
    - Ajustando a sessão, a entrega de mensagens e o comportamento do modo de conversa
summary: Valores padrão do agente, roteamento multiagente, sessão, mensagens e configuração de conversa
title: Configuração — agentes
x-i18n:
    generated_at: "2026-05-07T13:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Chaves de configuração com escopo de agente em `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Para canais, ferramentas, runtime do Gateway e outras
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

Raiz opcional do repositório exibida na linha Runtime do prompt do sistema. Se não definida, o OpenClaw detecta automaticamente percorrendo para cima a partir do espaço de trabalho.

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

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar os padrões.
- Defina `agents.list[].skills: []` para nenhuma Skills.
- Uma lista `agents.list[].skills` não vazia é o conjunto final desse agente; ela
  não é mesclada com os padrões.

### `agents.defaults.skipBootstrap`

Desabilita a criação automática de arquivos de inicialização do espaço de trabalho (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Ignora a criação de arquivos opcionais selecionados do espaço de trabalho enquanto ainda grava os arquivos de inicialização obrigatórios. Valores válidos: `SOUL.md`, `USER.md`, `HEARTBEAT.md` e `IDENTITY.md`.

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

Controla quando os arquivos de inicialização do espaço de trabalho são injetados no prompt do sistema. Padrão: `"always"`.

- `"continuation-skip"`: turnos seguros de continuação (após uma resposta concluída do assistente) ignoram a reinjeção da inicialização do espaço de trabalho, reduzindo o tamanho do prompt. Execuções de Heartbeat e novas tentativas pós-Compaction ainda reconstroem o contexto.
- `"never"`: desabilita a inicialização do espaço de trabalho e a injeção de arquivo de contexto em todos os turnos. Use isto somente para agentes que controlam totalmente o ciclo de vida do próprio prompt (mecanismos de contexto personalizados, runtimes nativos que constroem o próprio contexto ou fluxos de trabalho especializados sem inicialização). Turnos de Heartbeat e de recuperação de Compaction também ignoram a injeção.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Máximo de caracteres por arquivo de inicialização do espaço de trabalho antes do truncamento. Padrão: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Máximo total de caracteres injetados em todos os arquivos de inicialização do espaço de trabalho. Padrão: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controla o aviso visível ao agente no prompt do sistema quando o contexto de inicialização é truncado.
Padrão: `"once"`.

- `"off"`: nunca injeta texto de aviso de truncamento no prompt do sistema.
- `"once"`: injeta um aviso conciso uma vez por assinatura de truncamento exclusiva (recomendado).
- `"always"`: injeta um aviso conciso em cada execução quando houver truncamento.

Contagens brutas/injetadas detalhadas e campos de ajuste de configuração permanecem em diagnósticos, como relatórios de contexto/status e logs; o contexto rotineiro de usuário/runtime do WebChat recebe apenas o aviso conciso de recuperação.

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
  injeção normal de inicialização do espaço de trabalho.
- `agents.defaults.startupContext.*`:
  prelúdio único de execução do modelo em redefinição/inicialização, incluindo arquivos
  `memory/*.md` diários recentes. Comandos de chat simples `/new` e `/reset` são
  reconhecidos sem invocar o modelo.
- `skills.limits.*`:
  a lista compacta de Skills injetada no prompt do sistema.
- `agents.defaults.contextLimits.*`:
  trechos limitados de runtime e blocos injetados pertencentes ao runtime.
- `memory.qmd.limits.*`:
  dimensionamento de trecho e injeção de busca de memória indexada.

Use a substituição por agente correspondente somente quando um agente precisar de um orçamento diferente:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controla o prelúdio de inicialização do primeiro turno injetado nas execuções do modelo em redefinição/inicialização.
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

- `memoryGetMaxChars`: limite padrão de trecho de `memory_get` antes que
  metadados de truncamento e aviso de continuação sejam adicionados.
- `memoryGetDefaultLines`: janela de linhas padrão de `memory_get` quando `lines` é
  omitido.
- `toolResultMaxChars`: limite de resultado de ferramenta em tempo real usado para resultados persistidos e
  recuperação de excedente.
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

Tamanho máximo em pixels para o maior lado da imagem em blocos de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Padrão: `1200`.

Valores menores normalmente reduzem o uso de tokens de visão e o tamanho da carga útil da solicitação em execuções com muitas capturas de tela.
Valores maiores preservam mais detalhes visuais.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso horário para o contexto do prompt do sistema (não para carimbos de data/hora de mensagens). Recorre ao fuso horário do host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato de hora no prompt do sistema. Padrão: `auto` (preferência do sistema operacional).

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
      },
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
  - A forma em string define apenas o modelo primário.
  - A forma em objeto define o primário mais os modelos de failover ordenados.
- `imageModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pelo caminho da ferramenta `image` como sua configuração de modelo de visão.
  - Também usado como roteamento de fallback quando o modelo selecionado/padrão não pode aceitar entrada de imagem.
  - Prefira refs explícitas `provider/model`. IDs simples são aceitos por compatibilidade; se um ID simples corresponder unicamente a uma entrada configurada compatível com imagens em `models.providers.*.models`, o OpenClaw o qualifica para esse provedor. Correspondências configuradas ambíguas exigem um prefixo de provedor explícito.
- `imageGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de imagens e por qualquer superfície futura de ferramenta/Plugin que gere imagens.
  - Valores típicos: `google/gemini-3.1-flash-image-preview` para geração nativa de imagens do Gemini, `fal/fal-ai/flux/dev` para fal, `openai/gpt-image-2` para OpenAI Images, ou `openai/gpt-image-1.5` para saída PNG/WebP da OpenAI com fundo transparente.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação correspondente do provedor (por exemplo, `GEMINI_API_KEY` ou `GOOGLE_API_KEY` para `google/*`, `OPENAI_API_KEY` ou OpenAI Codex OAuth para `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` para `fal/*`).
  - Se omitido, `image_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagens em ordem de ID de provedor.
- `musicGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de música e pela ferramenta integrada `music_generate`.
  - Valores típicos: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` ou `minimax/music-2.6`.
  - Se omitido, `music_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música em ordem de ID de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API correspondente do provedor.
- `videoGenerationModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela capacidade compartilhada de geração de vídeo e pela ferramenta integrada `video_generate`.
  - Valores típicos: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` ou `qwen/wan2.7-r2v`.
  - Se omitido, `video_generate` ainda pode inferir um padrão de provedor respaldado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo em ordem de ID de provedor.
  - Se você selecionar um provedor/modelo diretamente, configure também a autenticação/chave de API correspondente do provedor.
  - O provedor integrado de geração de vídeo Qwen oferece suporte a até 1 vídeo de saída, 1 imagem de entrada, 4 vídeos de entrada, duração de 10 segundos e opções de nível de provedor `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: aceita uma string (`"provider/model"`) ou um objeto (`{ primary, fallbacks }`).
  - Usado pela ferramenta `pdf` para roteamento de modelo.
  - Se omitido, a ferramenta PDF recorre a `imageModel` e depois ao modelo resolvido da sessão/padrão.
- `pdfMaxBytesMb`: limite padrão de tamanho de PDF para a ferramenta `pdf` quando `maxBytesMb` não é passado no momento da chamada.
- `pdfMaxPages`: número máximo padrão de páginas consideradas pelo modo de fallback de extração na ferramenta `pdf`.
- `verboseDefault`: nível detalhado padrão para agentes. Valores: `"off"`, `"on"`, `"full"`. Padrão: `"off"`.
- `toolProgressDetail`: modo de detalhe para resumos de ferramentas de `/verbose` e linhas de ferramentas em rascunhos de progresso. Valores: `"explain"` (padrão, rótulos humanos compactos) ou `"raw"` (acrescenta comando/detalhe bruto quando disponível). `agents.list[].toolProgressDetail` por agente substitui esse padrão.
- `reasoningDefault`: visibilidade padrão de raciocínio para agentes. Valores: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` por agente substitui esse padrão. Padrões de raciocínio configurados só são aplicados para proprietários, remetentes autorizados ou contextos Gateway de administrador operador quando nenhuma substituição de raciocínio por mensagem ou sessão está definida.
- `elevatedDefault`: nível padrão de saída elevada para agentes. Valores: `"off"`, `"on"`, `"ask"`, `"full"`. Padrão: `"on"`.
- `model.primary`: formato `provider/model` (por exemplo, `openai/gpt-5.5` para chave de API da OpenAI ou acesso por Codex OAuth). Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma correspondência única de provedor configurado para esse ID exato de modelo, e só então recorre ao provedor padrão configurado (comportamento de compatibilidade obsoleto, então prefira `provider/model` explícito). Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado em vez de expor um padrão obsoleto de provedor removido.
- `models`: o catálogo de modelos configurado e a allowlist para `/model`. Cada entrada pode incluir `alias` (atalho) e `params` (específicos do provedor, por exemplo `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Edições seguras: use `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para adicionar entradas. `config set` recusa substituições que removeriam entradas existentes da allowlist, a menos que você passe `--replace`.
  - Fluxos de configuração/onboarding com escopo de provedor mesclam modelos selecionados do provedor nesse mapa e preservam provedores não relacionados já configurados.
  - Para modelos diretos da OpenAI Responses, a Compaction do lado do servidor é ativada automaticamente. Use `params.responsesServerCompaction: false` para parar de injetar `context_management`, ou `params.responsesCompactThreshold` para substituir o limite. Veja [Compaction do lado do servidor da OpenAI](/pt-BR/providers/openai#server-side-compaction-responses-api).
- `params`: parâmetros globais padrão do provedor aplicados a todos os modelos. Definido em `agents.defaults.params` (por exemplo, `{ cacheRetention: "long" }`).
- Precedência de mesclagem de `params` (configuração): `agents.defaults.params` (base global) é substituído por `agents.defaults.models["provider/model"].params` (por modelo), depois `agents.list[].params` (ID de agente correspondente) substitui por chave. Veja [Cache de prompts](/pt-BR/reference/prompt-caching) para detalhes.
- `params.extra_body`/`params.extraBody`: JSON avançado de repasse mesclado em corpos de requisição `api: "openai-completions"` para proxies compatíveis com OpenAI. Se houver colisão com chaves de requisição geradas, o corpo extra vence; rotas de completions não nativas ainda removem `store` exclusivo da OpenAI depois disso.
- `params.chat_template_kwargs`: argumentos de modelo de chat compatíveis com vLLM/OpenAI mesclados em corpos de requisição de nível superior `api: "openai-completions"`. Para `vllm/nemotron-3-*` com o pensamento desativado, o Plugin integrado vLLM envia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` explícitos substituem padrões gerados, e `extra_body.chat_template_kwargs` ainda tem precedência final. Para controles de pensamento do vLLM Qwen, defina `params.qwenThinkingFormat` como `"chat-template"` ou `"top-level"` nessa entrada de modelo.
- `compat.supportedReasoningEfforts`: lista de esforço de raciocínio compatível com OpenAI por modelo. Inclua `"xhigh"` para endpoints personalizados que realmente o aceitam; então o OpenClaw expõe `/think xhigh` em menus de comando, linhas de sessão do Gateway, validação de patch de sessão, validação de CLI de agente e validação de `llm-task` para esse provedor/modelo configurado. Use `compat.reasoningEffortMap` quando o backend quiser um valor específico do provedor para um nível canônico.
- `params.preserveThinking`: opção de adesão exclusiva da Z.AI para pensamento preservado. Quando ativada e o pensamento está ligado, o OpenClaw envia `thinking.clear_thinking: false` e reproduz `reasoning_content` anterior; veja [pensamento e pensamento preservado da Z.AI](/pt-BR/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: política padrão de runtime de agente de baixo nível. ID omitido usa OpenClaw Pi por padrão. Use `id: "pi"` para forçar o harness PI integrado, `id: "auto"` para permitir que harnesses de Plugin registrados reivindiquem modelos compatíveis e usar PI quando nenhum corresponder, um ID de harness registrado como `id: "codex"` para exigir esse harness, ou um alias de backend de CLI compatível como `id: "claude-cli"`. Runtimes explícitos de Plugin falham fechados quando o harness está indisponível ou falha. Mantenha refs de modelo canônicas como `provider/model`; selecione Codex, Claude CLI, Gemini CLI e outros backends de execução por meio da configuração de runtime em vez de prefixos legados de provedor de runtime. Veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para saber como isso difere da seleção de provedor/modelo.
- Escritores de configuração que alteram esses campos (por exemplo, `/models set`, `/models set-image` e comandos de adicionar/remover fallback) salvam a forma canônica de objeto e preservam listas de fallback existentes quando possível.
- `maxConcurrent`: máximo de execuções paralelas de agente entre sessões (cada sessão ainda é serializada). Padrão: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controla qual executor de baixo nível executa turnos de agente. A maioria das
implantações deve manter o runtime padrão OpenClaw Pi. Use-o quando um Plugin
confiável fornecer um harness nativo, como o harness de servidor de app Codex
integrado, ou quando você quiser um backend de CLI compatível, como Claude CLI. Para o modelo
mental, veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, um ID de harness de Plugin registrado ou um alias de backend de CLI compatível. O Plugin Codex integrado registra `codex`; o Plugin Anthropic integrado fornece o backend de CLI `claude-cli`.
- `id: "auto"` permite que harnesses de Plugin registrados reivindiquem turnos compatíveis e usa PI quando nenhum harness corresponde. Um runtime explícito de Plugin como `id: "codex"` exige esse harness e falha fechado se ele estiver indisponível ou falhar.
- Substituição de ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` substitui `id` para esse processo.
- Modelos de agente OpenAI usam o harness Codex por padrão; `agentRuntime.id: "codex"` continua válido quando você quiser deixar isso explícito.
- Para implantações com Claude CLI, prefira `model: "anthropic/claude-opus-4-7"` mais `agentRuntime.id: "claude-cli"`. Refs legadas de modelo `claude-cli/claude-opus-4-7` ainda funcionam por compatibilidade, mas novas configurações devem manter a seleção de provedor/modelo canônica e colocar o backend de execução em `agentRuntime.id`.
- Chaves antigas de política de runtime são reescritas para `agentRuntime` por `openclaw doctor --fix`.
- A escolha do harness é fixada por ID de sessão após a primeira execução incorporada. Alterações de configuração/ambiente afetam sessões novas ou redefinidas, não uma transcrição existente. Sessões legadas da OpenAI com histórico de transcrição, mas sem pin registrado, usam Codex; pins PI obsoletos da OpenAI podem ser reparados com `openclaw doctor --fix`. `/status` informa o runtime efetivo, por exemplo `Runtime: OpenClaw Pi Default` ou `Runtime: OpenAI Codex`.
- Isso controla apenas a execução de turnos de agente de texto. Geração de mídia, visão, PDF, música, vídeo e TTS ainda usam suas configurações de provedor/modelo.

**Atalhos de alias integrados** (aplicam-se apenas quando o modelo está em `agents.defaults.models`):

| Alias               | Modelo                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Seus aliases configurados sempre vencem os padrões.

Os modelos Z.AI GLM-4.x ativam automaticamente o modo de raciocínio, a menos que você defina `--thinking off` ou configure `agents.defaults.models["zai/<model>"].params.thinking` por conta própria.
Os modelos Z.AI ativam `tool_stream` por padrão para streaming de chamadas de ferramenta. Defina `agents.defaults.models["zai/<model>"].params.tool_stream` como `false` para desativá-lo.
Os modelos Anthropic Claude 4.6 usam `adaptive` como raciocínio padrão quando nenhum nível explícito de raciocínio é definido.

### `agents.defaults.cliBackends`

Backends de CLI opcionais para execuções de fallback somente texto (sem chamadas de ferramenta). Útil como backup quando provedores de API falham.

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

- Backends de CLI são orientados a texto; ferramentas estão sempre desativadas.
- Sessões são compatíveis quando `sessionArg` está definido.
- Repasse de imagens é compatível quando `imageArg` aceita caminhos de arquivo.

### `agents.defaults.systemPromptOverride`

Substitui todo o prompt de sistema montado pelo OpenClaw por uma string fixa. Defina no nível padrão (`agents.defaults.systemPromptOverride`) ou por agente (`agents.list[].systemPromptOverride`). Valores por agente têm precedência; um valor vazio ou somente com espaços em branco é ignorado. Útil para experimentos controlados de prompt.

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

Sobreposições de prompt independentes de provedor aplicadas por família de modelo. IDs de modelos da família GPT-5 recebem o contrato de comportamento compartilhado entre provedores; `personality` controla apenas a camada amigável de estilo de interação.

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
- O `plugins.entries.openai.config.personality` legado ainda é lido quando essa configuração compartilhada não está definida.

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
- `includeSystemPromptSection`: quando falso, omite a seção Heartbeat do prompt de sistema e ignora a injeção de `HEARTBEAT.md` no contexto de inicialização. Padrão: `true`.
- `suppressToolErrorWarnings`: quando verdadeiro, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `timeoutSeconds`: tempo máximo em segundos permitido para um turno de agente de heartbeat antes de ser abortado. Deixe indefinido para usar `agents.defaults.timeoutSeconds`.
- `directPolicy`: política de entrega direta/DM. `allow` (padrão) permite entrega para alvo direto. `block` suprime entrega para alvo direto e emite `reason=dm-blocked`.
- `lightContext`: quando verdadeiro, execuções de heartbeat usam contexto de inicialização leve e mantêm apenas `HEARTBEAT.md` dos arquivos de inicialização do workspace.
- `isolatedSession`: quando verdadeiro, cada heartbeat executa em uma sessão nova, sem histórico de conversa anterior. Mesmo padrão de isolamento que o `sessionTarget: "isolated"` do cron. Reduz o custo de tokens por heartbeat de ~100K para ~2-5K tokens.
- `skipWhenBusy`: quando verdadeiro, execuções de heartbeat são adiadas em vias ocupadas extras: trabalho de subagente ou comando aninhado. Vias de Cron sempre adiam heartbeats, mesmo sem esta flag.
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

- `mode`: `default` ou `safeguard` (sumarização em partes para históricos longos). Consulte [Compaction](/pt-BR/concepts/compaction).
- `provider`: id de um plugin de provedor de compaction registrado. Quando definido, o `summarize()` do provedor é chamado em vez da sumarização por LLM integrada. Recorre ao integrado em caso de falha. Definir um provedor força `mode: "safeguard"`. Consulte [Compaction](/pt-BR/concepts/compaction).
- `timeoutSeconds`: segundos máximos permitidos para uma única operação de compaction antes que o OpenClaw a aborte. Padrão: `900`.
- `keepRecentTokens`: orçamento de ponto de corte do Pi para manter literalmente a cauda mais recente da transcrição. O `/compact` manual respeita isso quando definido explicitamente; caso contrário, a compaction manual é um checkpoint rígido.
- `identifierPolicy`: `strict` (padrão), `off` ou `custom`. `strict` prefixa orientações integradas de retenção de identificadores opacos durante a sumarização da compaction.
- `identifierInstructions`: texto personalizado opcional de preservação de identificadores usado quando `identifierPolicy=custom`.
- `qualityGuard`: verificações de nova tentativa em saída malformada para resumos de safeguard. Ativado por padrão no modo safeguard; defina `enabled: false` para ignorar a auditoria.
- `midTurnPrecheck`: verificação opcional de pressão do loop de ferramentas do Pi. Quando `enabled: true`, o OpenClaw verifica a pressão de contexto depois que resultados de ferramentas são anexados e antes da próxima chamada de modelo. Se o contexto não couber mais, ele aborta a tentativa atual antes de enviar o prompt e reutiliza o caminho de recuperação de pré-verificação existente para truncar resultados de ferramentas ou compactar e tentar novamente. Funciona com os modos de compaction `default` e `safeguard`. Padrão: desativado.
- `postCompactionSections`: nomes opcionais de seções H2/H3 de AGENTS.md para reinjetar após a compaction. O padrão é `["Session Startup", "Red Lines"]`; defina `[]` para desativar a reinjeção. Quando indefinido ou definido explicitamente para esse par padrão, os títulos antigos `Every Session`/`Safety` também são aceitos como fallback legado.
- `model`: substituição opcional `provider/model-id` somente para sumarização de compaction. Use isso quando a sessão principal deve manter um modelo, mas os resumos de compaction devem executar em outro; quando indefinido, a compaction usa o modelo primário da sessão.
- `maxActiveTranscriptBytes`: limite opcional em bytes (`number` ou strings como `"20mb"`) que aciona a compaction local normal antes de uma execução quando o JSONL ativo ultrapassa o limite. Exige `truncateAfterCompaction` para que a compaction bem-sucedida possa rotacionar para uma transcrição sucessora menor. Desativado quando indefinido ou `0`.
- `notifyUser`: quando `true`, envia avisos breves ao usuário quando a compaction começa e quando é concluída (por exemplo, "Compactando contexto..." e "Compaction concluída"). Desativado por padrão para manter a compaction silenciosa.
- `memoryFlush`: turno agentic silencioso antes da auto-compaction para armazenar memórias duráveis. Defina `model` como um provedor/modelo exato, como `ollama/qwen3:8b`, quando esse turno de manutenção deve permanecer em um modelo local; a substituição não herda a cadeia de fallback da sessão ativa. Ignorado quando o workspace é somente leitura.

### `agents.defaults.contextPruning`

Remove **resultados antigos de ferramentas** do contexto em memória antes de enviar para a LLM. **Não** modifica o histórico da sessão em disco.

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

- `mode: "cache-ttl"` ativa passagens de remoção.
- `ttl` controla com que frequência a remoção pode ser executada novamente (após o último toque no cache).
- A remoção primeiro corta suavemente resultados de ferramentas grandes demais e, se necessário, depois limpa rigidamente resultados de ferramentas mais antigos.

**Corte suave** mantém o início + fim e insere `...` no meio.

**Limpeza rígida** substitui todo o resultado da ferramenta pelo placeholder.

Notas:

- Blocos de imagem nunca são cortados/limpos.
- As proporções são baseadas em caracteres (aproximadas), não em contagens exatas de tokens.
- Se houver menos mensagens de assistente do que `keepLastAssistants`, a remoção é ignorada.

</Accordion>

Consulte [Remoção de Sessão](/pt-BR/concepts/session-pruning) para detalhes de comportamento.

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

- Canais que não sejam Telegram exigem `*.blockStreaming: true` explícito para ativar respostas em bloco.
- Substituições por canal: `channels.<channel>.blockStreamingCoalesce` (e variantes por conta). Signal/Slack/Discord/Google Chat usam `minChars: 1500` como padrão.
- `humanDelay`: pausa aleatória entre respostas em bloco. `natural` = 800–2500ms. Substituição por agente: `agents.list[].humanDelay`.

Consulte [Streaming](/pt-BR/concepts/streaming) para detalhes de comportamento + divisão em blocos.

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

Sandbox opcional para o agente incorporado. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para o guia completo.

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

Quando `backend: "openshell"` é selecionado, as configurações específicas do runtime passam para
`plugins.entries.openshell.config`.

**Configuração do backend SSH:**

- `target`: destino SSH no formato `user@host[:port]`
- `command`: comando do cliente SSH (padrão: `ssh`)
- `workspaceRoot`: raiz remota absoluta usada para workspaces por escopo
- `identityFile` / `certificateFile` / `knownHostsFile`: arquivos locais existentes passados para o OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: conteúdos inline ou SecretRefs que o OpenClaw materializa em arquivos temporários em runtime
- `strictHostKeyChecking` / `updateHostKeys`: controles de política de chave de host do OpenSSH

**Precedência da autenticação SSH:**

- `identityData` prevalece sobre `identityFile`
- `certificateData` prevalece sobre `certificateFile`
- `knownHostsData` prevalece sobre `knownHostsFile`
- Valores `*Data` baseados em SecretRef são resolvidos a partir do snapshot ativo do runtime de segredos antes de a sessão de sandbox iniciar

**Comportamento do backend SSH:**

- inicializa o workspace remoto uma vez após criar ou recriar
- depois mantém o workspace SSH remoto como canônico
- roteia `exec`, ferramentas de arquivo e caminhos de mídia via SSH
- não sincroniza automaticamente alterações remotas de volta para o host
- não oferece suporte a contêineres de navegador em sandbox

**Acesso ao workspace:**

- `none`: workspace de sandbox por escopo em `~/.openclaw/sandboxes`
- `ro`: workspace do sandbox em `/workspace`, workspace do agente montado como somente leitura em `/agent`
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

No modo `remote`, edições locais do host feitas fora do OpenClaw não são sincronizadas automaticamente para o sandbox após a etapa de inicialização.
O transporte é SSH para dentro do sandbox OpenShell, mas o Plugin é dono do ciclo de vida do sandbox e da sincronização espelhada opcional.

**`setupCommand`** é executado uma vez após a criação do contêiner (via `sh -lc`). Requer saída de rede, raiz gravável, usuário root.

**Contêineres usam `network: "none"` por padrão** — defina como `"bridge"` (ou uma rede bridge personalizada) se o agente precisar de acesso de saída.
`"host"` é bloqueado. `"container:<id>"` é bloqueado por padrão, a menos que você defina explicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (medida de emergência).

**Anexos recebidos** são preparados em `media/inbound/*` no workspace ativo.

**`docker.binds`** monta diretórios adicionais do host; montagens globais e por agente são mescladas.

**Navegador em sandbox** (`sandbox.browser.enabled`): Chromium + CDP em um contêiner. URL noVNC injetada no prompt do sistema. Não requer `browser.enabled` em `openclaw.json`.
O acesso de observador noVNC usa autenticação VNC por padrão, e o OpenClaw emite uma URL de token de curta duração (em vez de expor a senha na URL compartilhada).

- `allowHostControl: false` (padrão) bloqueia sessões em sandbox de direcionar o navegador do host.
- `network` usa `openclaw-sandbox-browser` por padrão (rede bridge dedicada). Defina como `bridge` somente quando quiser explicitamente conectividade global via bridge.
- `cdpSourceRange` opcionalmente restringe a entrada CDP na borda do contêiner a um intervalo CIDR (por exemplo, `172.21.0.1/32`).
- `sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do navegador em sandbox. Quando definido (incluindo `[]`), substitui `docker.binds` para o contêiner do navegador.
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
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; defina `0` para usar o limite de processos
    padrão do Chromium.
  - mais `--no-sandbox` quando `noSandbox` está habilitado.
  - Os padrões são a base da imagem do contêiner; use uma imagem de navegador personalizada com um
    entrypoint personalizado para alterar os padrões do contêiner.

</Accordion>

O sandbox do navegador e `sandbox.docker.binds` são somente Docker.

Crie imagens (a partir de um checkout do código-fonte):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Para instalações npm sem checkout do código-fonte, consulte [Sandboxing § Imagens e configuração](/pt-BR/gateway/sandboxing#images-and-setup) para comandos inline de `docker build`.

### `agents.list` (substituições por agente)

Use `agents.list[].tts` para dar a um agente seu próprio provedor TTS, voz, modelo,
estilo ou modo TTS automático. O bloco do agente faz deep merge sobre
`messages.tts`, para que credenciais compartilhadas possam ficar em um só lugar enquanto agentes individuais
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
        agentRuntime: { id: "auto" },
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
- `default`: quando múltiplos são definidos, o primeiro vence (aviso registrado). Se nenhum for definido, a primeira entrada da lista é o padrão.
- `model`: a forma de string define um primário estrito por agente, sem fallback de modelo; a forma de objeto `{ primary }` também é estrita, a menos que você adicione `fallbacks`. Use `{ primary, fallbacks: [...] }` para habilitar fallback para esse agente, ou `{ primary, fallbacks: [] }` para tornar o comportamento estrito explícito. Tarefas Cron que substituem apenas `primary` ainda herdam fallbacks padrão, a menos que você defina `fallbacks: []`.
- `params`: parâmetros de stream por agente mesclados sobre a entrada de modelo selecionada em `agents.defaults.models`. Use isto para substituições específicas do agente, como `cacheRetention`, `temperature` ou `maxTokens`, sem duplicar todo o catálogo de modelos.
- `tts`: substituições opcionais de texto para fala por agente. O bloco faz uma mesclagem profunda sobre `messages.tts`, então mantenha credenciais compartilhadas de provedor e política de fallback em `messages.tts` e defina aqui apenas valores específicos da persona, como provedor, voz, modelo, estilo ou modo automático.
- `skills`: allowlist opcional de Skills por agente. Se omitida, o agente herda `agents.defaults.skills` quando definido; uma lista explícita substitui os padrões em vez de mesclar, e `[]` significa sem Skills.
- `thinkingDefault`: nível de raciocínio padrão opcional por agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Substitui `agents.defaults.thinkingDefault` para este agente quando nenhuma substituição por mensagem ou sessão estiver definida. O perfil do provedor/modelo selecionado controla quais valores são válidos; para Google Gemini, `adaptive` mantém o pensamento dinâmico gerenciado pelo provedor (`thinkingLevel` omitido no Gemini 3/3.1, `thinkingBudget: -1` no Gemini 2.5).
- `reasoningDefault`: visibilidade de raciocínio padrão opcional por agente (`on | off | stream`). Substitui `agents.defaults.reasoningDefault` para este agente quando nenhuma substituição de raciocínio por mensagem ou sessão estiver definida.
- `fastModeDefault`: padrão opcional por agente para modo rápido (`true | false`). Aplica-se quando nenhuma substituição de modo rápido por mensagem ou sessão estiver definida.
- `agentRuntime`: substituição opcional de política de runtime de baixo nível por agente. Use `{ id: "codex" }` para tornar um agente exclusivo do Codex enquanto outros agentes mantêm o fallback de PI padrão no modo `auto`.
- `runtime`: descritor de runtime opcional por agente. Use `type: "acp"` com padrões de `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando o agente deve usar sessões do harness ACP por padrão.
- `identity.avatar`: caminho relativo ao workspace, URL `http(s)` ou URI `data:`.
- `identity` deriva padrões: `ackReaction` de `emoji`, `mentionPatterns` de `name`/`emoji`.
- `subagents.allowAgents`: allowlist de ids de agentes para destinos explícitos de `sessions_spawn.agentId` (`["*"]` = qualquer um; padrão: somente o mesmo agente). Inclua o id do solicitante quando chamadas `agentId` direcionadas ao próprio agente devem ser permitidas.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
- `subagents.requireAgentId`: quando true, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil; padrão: false).

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

### Campos de correspondência de vinculação

- `type` (opcional): `route` para roteamento normal (tipo ausente usa route por padrão), `acp` para vinculações persistentes de conversa ACP.
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

Dentro de cada nível, a primeira entrada correspondente em `bindings` vence.

Para entradas `type: "acp"`, o OpenClaw resolve pela identidade exata da conversa (`match.channel` + conta + `match.peer.id`) e não usa a ordem de níveis de vinculação de rota acima.

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

<Accordion title="Detalhes dos campos da sessão">

- **`scope`**: estratégia base de agrupamento de sessões para contextos de chat em grupo.
  - `per-sender` (padrão): cada remetente recebe uma sessão isolada dentro de um contexto de canal.
  - `global`: todos os participantes em um contexto de canal compartilham uma única sessão (use somente quando o contexto compartilhado for intencional).
- **`dmScope`**: como as DMs são agrupadas.
  - `main`: todas as DMs compartilham a sessão principal.
  - `per-peer`: isola por ID do remetente entre canais.
  - `per-channel-peer`: isola por canal + remetente (recomendado para caixas de entrada multiusuário).
  - `per-account-channel-peer`: isola por conta + canal + remetente (recomendado para múltiplas contas).
- **`identityLinks`**: mapeia IDs canônicos para pares com prefixo de provedor para compartilhamento de sessão entre canais. Comandos de acoplamento como `/dock_discord` usam o mesmo mapa para alternar a rota de resposta da sessão ativa para outro par de canal vinculado; consulte [Acoplamento de canais](/pt-BR/concepts/channel-docking).
- **`reset`**: política principal de redefinição. `daily` redefine em `atHour` no horário local; `idle` redefine após `idleMinutes`. Quando ambos estão configurados, vence o que expirar primeiro. O frescor da redefinição diária usa o `sessionStartedAt` da linha da sessão; o frescor da redefinição por inatividade usa `lastInteractionAt`. Escritas em segundo plano/eventos do sistema, como Heartbeat, despertares de Cron, notificações de exec e registros administrativos do Gateway, podem atualizar `updatedAt`, mas não mantêm sessões diárias/por inatividade frescas.
- **`resetByType`**: substituições por tipo (`direct`, `group`, `thread`). O `dm` legado é aceito como alias de `direct`.
- **`mainKey`**: campo legado. Em runtime, sempre usa `"main"` para o bucket principal de chat direto.
- **`agentToAgent.maxPingPongTurns`**: máximo de turnos de resposta de volta entre agentes durante trocas agente-para-agente (inteiro, intervalo: `0`–`5`). `0` desativa o encadeamento de ping-pong.
- **`sendPolicy`**: corresponde por `channel`, `chatType` (`direct|group|channel`, com alias legado `dm`), `keyPrefix` ou `rawKeyPrefix`. A primeira negação vence.
- **`maintenance`**: controles de limpeza + retenção do armazenamento de sessões.
  - `mode`: `warn` emite apenas avisos; `enforce` aplica a limpeza.
  - `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`).
  - `maxEntries`: número máximo de entradas em `sessions.json` (padrão `500`). O runtime grava limpeza em lote com um pequeno buffer de limite superior para limites de tamanho de produção; `openclaw sessions cleanup --enforce` aplica o limite imediatamente.
  - `rotateBytes`: obsoleto e ignorado; `openclaw doctor --fix` o remove de configurações antigas.
  - `resetArchiveRetention`: retenção para arquivos de transcrição `*.reset.<timestamp>`. O padrão é `pruneAfter`; defina como `false` para desativar.
  - `maxDiskBytes`: orçamento opcional de disco para o diretório de sessões. No modo `warn`, registra avisos; no modo `enforce`, remove primeiro os artefatos/sessões mais antigos.
  - `highWaterBytes`: alvo opcional após a limpeza por orçamento. O padrão é `80%` de `maxDiskBytes`.
- **`threadBindings`**: padrões globais para recursos de sessão vinculada a threads.
  - `enabled`: chave padrão mestra (provedores podem substituir; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-desfoco padrão por inatividade em horas (`0` desativa; provedores podem substituir)
  - `maxAgeHours`: idade máxima rígida padrão em horas (`0` desativa; provedores podem substituir)
  - `spawnSessions`: controle padrão para criar sessões de trabalho vinculadas a threads a partir de `sessions_spawn` e criações de thread ACP. O padrão é `true` quando os vínculos de thread estão ativados; provedores/contas podem substituir.
  - `defaultSpawnContext`: contexto padrão de subagente nativo para criações vinculadas a threads (`"fork"` ou `"isolated"`). O padrão é `"fork"`.

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

### Prefixo da resposta

Substituições por canal/conta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolução (o mais específico vence): conta → canal → global. `""` desativa e interrompe a cascata. `"auto"` deriva `[{identity.name}]`.

**Variáveis de modelo:**

| Variável          | Descrição            | Exemplo                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Nome curto do modelo       | `claude-opus-4-6`           |
| `{modelFull}`     | Identificador completo do modelo  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome do provedor          | `anthropic`                 |
| `{thinkingLevel}` | Nível de raciocínio atual | `high`, `low`, `off`        |
| `{identity.name}` | Nome da identidade do agente    | (igual a `"auto"`)          |

As variáveis não diferenciam maiúsculas de minúsculas. `{think}` é um alias para `{thinkingLevel}`.

### Reação de confirmação

- O padrão é `identity.emoji` do agente ativo; caso contrário, `"👀"`. Defina `""` para desativar.
- Substituições por canal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordem de resolução: conta → canal → `messages.ackReaction` → fallback de identidade.
- Escopo: `group-mentions` (padrão), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: remove a confirmação após a resposta em canais compatíveis com reações, como Slack, Discord, Telegram, WhatsApp e BlueBubbles.
- `messages.statusReactions.enabled`: ativa reações de status de ciclo de vida no Slack, Discord e Telegram.
  No Slack e no Discord, quando não definido, mantém as reações de status ativadas quando as reações de confirmação estão ativas.
  No Telegram, defina explicitamente como `true` para ativar reações de status de ciclo de vida.

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
- `summaryModel` substitui `agents.defaults.model.primary` para o resumo automático.
- `modelOverrides` é ativado por padrão; `modelOverrides.allowProvider` tem `false` como padrão (adesão explícita).
- Chaves de API usam fallback para `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- Provedores de fala incluídos são de propriedade do plugin. Se `plugins.allow` estiver definido, inclua cada plugin provedor de TTS que você deseja usar, por exemplo `microsoft` para Edge TTS. O id de provedor legado `edge` é aceito como alias para `microsoft`.
- `providers.openai.baseUrl` substitui o endpoint de TTS da OpenAI. A ordem de resolução é configuração, depois `OPENAI_TTS_BASE_URL` e depois `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` aponta para um endpoint que não é da OpenAI, o OpenClaw o trata como um servidor TTS compatível com OpenAI e flexibiliza a validação de modelo/voz.

---

## Conversa

Padrões para o modo Conversa (macOS/iOS/Android).

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` deve corresponder a uma chave em `talk.providers` quando vários provedores de Conversa estiverem configurados.
- Chaves planas legadas de Conversa (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) existem apenas para compatibilidade. Execute `openclaw doctor --fix` para reescrever a configuração persistida em `talk.providers.<provider>`.
- IDs de voz usam fallback para `ELEVENLABS_VOICE_ID` ou `SAG_VOICE_ID`.
- `providers.*.apiKey` aceita strings em texto puro ou objetos SecretRef.
- O fallback `ELEVENLABS_API_KEY` se aplica somente quando nenhuma chave de API de Conversa está configurada.
- `providers.*.voiceAliases` permite que diretivas de Conversa usem nomes amigáveis.
- `providers.mlx.modelId` seleciona o repositório do Hugging Face usado pelo auxiliar MLX local do macOS. Se omitido, o macOS usa `mlx-community/Soprano-80M-bf16`.
- A reprodução MLX no macOS é executada pelo auxiliar `openclaw-mlx-tts` incluído quando presente, ou por um executável no `PATH`; `OPENCLAW_MLX_TTS_BIN` substitui o caminho do auxiliar para desenvolvimento.
- `speechLocale` define o id de localidade BCP 47 usado pelo reconhecimento de fala de Conversa no iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `silenceTimeoutMs` controla por quanto tempo o modo Conversa espera após o silêncio do usuário antes de enviar a transcrição. Indefinido mantém a janela de pausa padrão da plataforma (`700 ms no macOS e Android, 900 ms no iOS`).

---

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference) — todas as outras chaves de configuração
- [Configuração](/pt-BR/gateway/configuration) — tarefas comuns e configuração rápida
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
